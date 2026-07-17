import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { ChevronRight, EyeOff } from 'lucide-react'
import { Badge } from '../../primitives/Badge'
import { Skeleton } from '../../primitives/Skeleton'
import { EmptyState } from '../EmptyState'
import type { CategoryTreeNode, CategoryTreeProps } from '../../../types/component-props'
import * as css from './CategoryTree.css'

/** Ağacın görünür hâlinin tek bir satırı. */
interface DuzDugum {
  node: CategoryTreeNode
  /** 1 tabanlı; `aria-level` doğrudan bunu alır. */
  seviye: number
  /** Kökte `null`. Yaprakta sol ok bununla ataya çıkar. */
  ebeveynId: string | null
}

/**
 * Ağacı **o an ekranda görünen** sırayla düzleştirir.
 *
 * Klavye gezinmesinin tamamı bu listeye dayanır: "aşağı ok" DOM'daki bir sonraki
 * kardeş değil, kullanıcının gözünün gittiği bir sonraki satırdır — kapalı bir
 * dalın çocukları aradan atlanmalı, açık bir dalınkiler araya girmelidir.
 * Kapalı düğümlerin çocukları hiç render edilmediği için liste DOM ile birebir.
 */
function gorunurDugumler(
  nodes: CategoryTreeNode[],
  expandedIds: string[],
  seviye = 1,
  ebeveynId: string | null = null,
): DuzDugum[] {
  return nodes.flatMap((node) => {
    const cocuklar = node.children ?? []
    const acik = cocuklar.length > 0 && expandedIds.includes(node.id)

    return [
      { node, seviye, ebeveynId },
      ...(acik ? gorunurDugumler(cocuklar, expandedIds, seviye + 1, node.id) : []),
    ]
  })
}

/**
 * `--kategori-agaci-derinlik` özel değişkenini taşıyan inline `style`.
 *
 * `CSSProperties`'in index imzası bilerek kaldırılmış (bkz. `@types/react`);
 * özel değişken için tipi kesişimle genişletmek, `as CSSProperties` cast'ından
 * daha dar bir kapı — yalnız bu tek değişkenin adı açılıyor.
 */
type DerinlikStili = CSSProperties & Record<typeof css.DERINLIK_VAR, string>

const derinlikStili = (seviye: number): DerinlikStili => ({
  [css.DERINLIK_VAR]: String(seviye - 1),
})

/**
 * Kategori hiyerarşisi: kategori ve öznitelik yönetiminin gezinme ağacı.
 *
 * **Açıklık kontrollü, odak değil.** `expandedIds` dışarıdan gelir ve ağaç kendi
 * kopyasını tutmaz — derin bir düğüm seçiliyken atalarının açık gelmesi gerekir
 * ve o yolu ancak veriyi bilen katman kurabilir. Odak ise bir sözleşme değil,
 * tarayıcı durumu: roving tabindex'i (ağacın tamamı tek Tab durağı) ağacın
 * kendisi yönetir. Odaklanan düğüm türetilir, saklanmaz: odaklanan satır kaybolursa
 * (çağıran atasını kapattı) sıra seçili düğüme, o da yoksa ilk köke düşer —
 * ağaç hiçbir zaman Tab ile girilemez hâle gelmez.
 *
 * **Satıra tıklamak seçer ve açar, asla kapatmaz.** Üç kural bir noktada
 * kesişiyordu: brifingin 44 piksellik dokunma hedefi, "kategori düğümü seçme"
 * eyleminin birincil olması (brifing 2.7) ve okun dar kolonda 24 pikselden
 * geniş olamaması. Seçim kapatsaydı, "Konut"a bakmak isteyen kullanıcı yedi alt
 * kategorisini kaybederdi; seçim açmasaydı, dokunmatik kullanıcının elinde 44
 * piksellik bir açma hedefi kalmazdı. Kapatmak bilinçli bir eylem olarak okta ve
 * sol ok tuşunda durur.
 *
 * **Düğümün adı satırdan gelir, alt ağacından değil.** `aria-labelledby` satır
 * kutusunu gösteriyor; gösterilmeseydi `treeitem`'ın adı "içerikten" hesaplanır
 * ve içine gömülü `role="group"` da hesaba katılırdı — açık Konut düğümü
 * ekran okuyucuda "Konut Daire Rezidans Müstakil Ev..." diye okunurdu.
 *
 * **Pasiflik renkle bırakılmaz.** `active: false` düğüm solar ama gizlenmez;
 * solma tek gösterge olmasın diye `panel`'de "Pasif" rozeti, dar varyantlarda
 * ikon + gizli metin eşlik eder.
 *
 * Hata kanalı **yok**: `CategoryTreeProps`'ta bir `error` alanı bulunmuyor ve
 * uydurulmadı — ağaç veri çekmez, çekemediğini de bilemez. Yükleme başarısızsa
 * sayfa ağacın yerine `ErrorState` gösterir.
 *
 * @example
 * <CategoryTree
 *   nodes={kategoriAgaci}
 *   selectedId={secili}
 *   expandedIds={acikDugumler}
 *   variant="sidebar"
 *   onSelect={setSecili}
 *   onExpandedIdsChange={setAcikDugumler}
 * />
 */
export function CategoryTree({
  nodes,
  selectedId,
  expandedIds,
  variant = 'sidebar',
  loading = false,
  onSelect,
  onExpandedIdsChange,
}: CategoryTreeProps) {
  const idOneki = useId()
  /** Klavye odağı DOM'a ancak elemanın kendisinden verilebilir. */
  const dugumRefleri = useRef(new Map<string, HTMLLIElement>())
  const [odaklanan, setOdaklanan] = useState<string | null>(null)

  if (loading) {
    return (
      /*
        `aria-busy`: Skeleton'ın tamamı `aria-hidden`, dolayısıyla yükleme sırasında
        bu kutu ekran okuyucu için bomboş. Meşguliyeti duyurmak Skeleton'ın kendi
        sözleşmesinde kapsayan bölüme bırakılmış. `role="tree"` bilerek yok: boş
        bir ağaç duyurmak, hiç ağaç duyurmamaktan kötü.
      */
      <div className={css.root({ variant })} aria-busy="true">
        {/* Altı satır: brifing 1.1'in kök kategori sayısı. Veri gelince düzen zıplamaz. */}
        <Skeleton lines={6} />
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <EmptyState
        variant="compact"
        title="Kategori yok"
        description="Gösterilecek kategori tanımı bulunamadı. Ağaç sunucudan gelir; boşluk bir yapılandırma eksikliğine işaret eder."
      />
    )
  }

  const duzListe = gorunurDugumler(nodes, expandedIds)
  const gorunurMu = (id: string) => duzListe.some((duz) => duz.node.id === id)

  /*
    Tek Tab durağı: ağacın **tam olarak bir** düğümü `tabIndex={0}` taşır.
    Sırayla: kullanıcının en son odakladığı düğüm, yoksa seçili düğüm, yoksa ilk
    kök. Her üçü de "görünür mü" diye sınanıyor — kapalı bir dalın içinde kalan
    kimlik `tabIndex={0}`'ı hiç render edilmeyen bir satıra verir ve ağaç klavyeye
    kapanırdı.
  */
  const odakId =
    odaklanan !== null && gorunurMu(odaklanan)
      ? odaklanan
      : selectedId !== undefined && gorunurMu(selectedId)
        ? selectedId
        : (duzListe[0]?.node.id ?? null)

  const odakla = (id: string) => {
    setOdaklanan(id)
    dugumRefleri.current.get(id)?.focus()
  }

  const ac = (id: string) => {
    /* Zaten açık düğümü tekrar eklemek listeyi çoğaltır; sözleşme id **listesi** istiyor. */
    if (!expandedIds.includes(id)) onExpandedIdsChange([...expandedIds, id])
  }

  const kapat = (id: string) => {
    onExpandedIdsChange(expandedIds.filter((acikId) => acikId !== id))
  }

  /** Satırın birincil eylemi: seç, dallıysa aç. Bkz. component JSDoc'u. */
  const satirSecildi = (node: CategoryTreeNode) => {
    onSelect(node.id)
    if ((node.children ?? []).length > 0) ac(node.id)
  }

  /*
    Tuşlar ağacın kökünde dinleniyor, satır satır değil: odaklanabilen tek şey
    `tabIndex={0}` taşıyan düğüm, dolayısıyla olay her zaman ondan kabarıyor ve
    "hangi satırdayım" sorusunun cevabı zaten `odakId`.
  */
  const tusaBasildi = (event: KeyboardEvent<HTMLUListElement>) => {
    if (odakId === null) return

    const indeks = duzListe.findIndex((duz) => duz.node.id === odakId)
    const gecerli = duzListe[indeks]
    if (gecerli === undefined) return

    const cocuklar = gecerli.node.children ?? []
    const acilabilir = cocuklar.length > 0
    const acik = acilabilir && expandedIds.includes(gecerli.node.id)

    switch (event.key) {
      case 'ArrowDown': {
        const sonraki = duzListe[indeks + 1]
        if (sonraki !== undefined) odakla(sonraki.node.id)
        break
      }

      case 'ArrowUp': {
        const onceki = duzListe[indeks - 1]
        if (onceki !== undefined) odakla(onceki.node.id)
        break
      }

      /* Kapalıysa aç, açıksa ilk çocuğa in — WAI-ARIA ağaç kalıbı. */
      case 'ArrowRight': {
        if (!acilabilir) return
        if (acik) {
          const ilkCocuk = duzListe[indeks + 1]
          if (ilkCocuk !== undefined) odakla(ilkCocuk.node.id)
        } else {
          ac(gecerli.node.id)
        }
        break
      }

      /* Açıksa kapat, değilse ataya çık. Kökteki yaprakta yapacak bir şey yok. */
      case 'ArrowLeft': {
        if (acik) {
          kapat(gecerli.node.id)
        } else if (gecerli.ebeveynId !== null) {
          odakla(gecerli.ebeveynId)
        } else {
          return
        }
        break
      }

      case 'Home': {
        const ilk = duzListe[0]
        if (ilk !== undefined) odakla(ilk.node.id)
        break
      }

      case 'End': {
        const son = duzListe[duzListe.length - 1]
        if (son !== undefined) odakla(son.node.id)
        break
      }

      /* Tıklamayla aynı eylem: iki giriş yolu aynı sonucu vermeli. */
      case 'Enter':
      case ' ': {
        satirSecildi(gecerli.node)
        break
      }

      default:
        return
    }

    /*
      Yalnız gerçekten karşıladığımız tuşlarda: oklar sayfayı kaydırmamalı,
      boşluk sayfayı atlatmamalı. Karşılamadığımız her tuş yukarıdaki
      `return`'lerle tarayıcıya bırakılıyor.
    */
    event.preventDefault()
  }

  const dallariCiz = (liste: CategoryTreeNode[], seviye: number): ReactNode =>
    liste.map((node) => {
      const cocuklar = node.children ?? []
      const acilabilir = cocuklar.length > 0
      const acik = acilabilir && expandedIds.includes(node.id)
      const secili = node.id === selectedId
      const satirId = `${idOneki}-${node.id}`

      return (
        <li
          key={node.id}
          role="treeitem"
          aria-level={seviye}
          /* Ad satırdan gelir; alt ağaç ada karışmaz (bkz. component JSDoc'u). */
          aria-labelledby={satirId}
          {...(acilabilir && { 'aria-expanded': acik })}
          /*
            Yalnız seçili düğümde. Tek seçimli ağaçta her satıra
            `aria-selected="false"` yazmak ekran okuyucuya gezilen her satırda
            "seçili değil" dedirtir; ARIA bunu tam da bu yüzden istemiyor.
          */
          {...(secili && { 'aria-selected': true })}
          tabIndex={node.id === odakId ? 0 : -1}
          className={css.item}
          ref={(el) => {
            if (el !== null) dugumRefleri.current.set(node.id, el)
            return () => {
              dugumRefleri.current.delete(node.id)
            }
          }}
          /*
            Fare odağı da `odakId`'yi güncellemeli: tıklanan satırdan sonra aşağı
            ok bir sonrakine gitmeli, en son klavyeyle gezilen yerden devam
            etmemeli. `focusin` kabardığı için hedef sınanıyor — sınanmasaydı
            çocuğa gelen odağı her atası kendine yazardı.
          */
          onFocus={(event) => {
            if (event.target === event.currentTarget) setOdaklanan(node.id)
          }}
        >
          {/*
            Tıklama `<li>`'de değil satırda: `<li>`'de olsaydı çocuğun tıklaması
            atalarına da kabarır ve en dıştaki ata en son seçilen olurdu —
            "Daire"ye basan kullanıcı "Konut" seçili bulurdu. Satır kutusu alt
            listeyi içermediği için kabarma orada bitiyor.

            Statik eleman ama klavyesiz değil: bu satırın erişilebilir eşdeğeri
            `<li role="treeitem">` ve Enter/Boşluk aynı eylemi çalıştırıyor.
          */}
          <div
            id={satirId}
            className={css.row({ variant, selected: secili, passive: !node.active })}
            style={derinlikStili(seviye)}
            onClick={() => satirSecildi(node)}
          >
            {acilabilir ? (
              <span
                className={css.toggle}
                aria-hidden="true"
                /*
                  Ok yalnız kapatmanın kısayolu; ekran okuyucunun karşılığı
                  `aria-expanded` ve sol/sağ ok tuşları. Ayrı bir `<button>`
                  olsaydı ağacın içine ikinci bir Tab durağı girer, "tek durak"
                  kuralı ve ağaç kalıbı bozulurdu.
                */
                onClick={(event) => {
                  event.stopPropagation()
                  if (acik) kapat(node.id)
                  else ac(node.id)
                }}
              >
                <ChevronRight size={16} className={css.chevron({ open: acik })} />
              </span>
            ) : (
              <span className={css.togglePlaceholder} aria-hidden="true" />
            )}

            <span className={css.label}>{node.label}</span>

            {node.active ? null : variant === 'panel' ? (
              <span className={css.badgeSlot}>
                <Badge tone="neutral" size="sm">
                  Pasif
                </Badge>
              </span>
            ) : (
              /*
                Dar varyantlarda rozet etikete yer bırakmıyor; solma ise tek
                başına renk demek. İkon rengi olmayan ikinci bir gösterge, gizli
                metin de düğümün adına "Pasif"i ekler.
              */
              <>
                <span className={css.passiveIcon} aria-hidden="true">
                  <EyeOff size={14} />
                </span>
                <span className={css.visuallyHidden}>Pasif</span>
              </>
            )}

            {node.count !== undefined ? (
              <span className={css.count}>
                {node.count.toLocaleString('tr-TR')}
                {/* Çıplak "4.820" bir ad değil: neyin sayıldığı adda kalmalı. */}
                <span className={css.visuallyHidden}> ilan</span>
              </span>
            ) : null}
          </div>

          {acik ? (
            <ul role="group" className={css.list}>
              {dallariCiz(cocuklar, seviye + 1)}
            </ul>
          ) : null}
        </li>
      )
    })

  return (
    <div className={css.root({ variant })}>
      <ul role="tree" aria-label="Kategori ağacı" className={css.list} onKeyDown={tusaBasildi}>
        {dallariCiz(nodes, 1)}
      </ul>
    </div>
  )
}
