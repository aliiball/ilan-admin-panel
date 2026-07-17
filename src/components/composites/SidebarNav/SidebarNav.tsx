import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Badge } from '../../primitives/Badge'
import { Drawer } from '../../primitives/Drawer'
import { IconButton } from '../../primitives/IconButton'
import { Tooltip } from '../../primitives/Tooltip'
import type { NavigationItem, SidebarNavProps } from '../../../types/component-props'
import * as css from './SidebarNav.css'

/**
 * Aktif satır bu dalın **altında** mı?
 *
 * Ebeveynin kendiliğinden açılması buna bağlı: kullanıcı hangi bölümde
 * olduğunu göremezse gezinme işe yaramaz. Özyineli, çünkü `NavigationItem`
 * kendi tipinde çocuk taşıyor — sözleşme tek kademeyle sınırlamıyor.
 */
function aktifIcerir(item: NavigationItem, activeItemId: string): boolean {
  const cocuklar = item.children ?? []

  return cocuklar.some((cocuk) => cocuk.id === activeItemId || aktifIcerir(cocuk, activeItemId))
}

/** Rozette gösterilen en büyük kesin sayı; üstü "99+" olur. */
const ROZET_TAVANI = 99

/**
 * Sayacın görünür metni.
 *
 * Menü rozeti "iş var mı, kabaca ne kadar?" sorusunu cevaplar; "tam olarak kaç
 * tane?" sorusunu bağlantının götürdüğü ekran cevaplar. Kesin sayıyı yazmanın
 * bedeli var ve karşılığında hiçbir kararı değiştirmiyor: `128.450`
 * genişletilmiş rayda etiketin yerini yiyip onu üç noktaya kırptırıyor,
 * daraltılmış rayda ise ikonun 3rem'lik karesinden taşıp komşu satırların
 * üstüne biniyor. `99+` ikisini de çözüyor ve aynı bilgiyi veriyor.
 *
 * `toLocaleString` tavanın altında ayırıcı üretmez ama duruyor: tavan bir gün
 * yükseltilirse binlik ayırıcı kendiliğinden doğru gelsin (BulkActionBar'ın
 * sayacı da aynısını yapıyor).
 */
function rozetMetni(badge: number): string {
  return badge > ROZET_TAVANI ? `${ROZET_TAVANI}+` : badge.toLocaleString('tr-TR')
}

interface SatirProps {
  item: NavigationItem
  activeItemId: string
  collapsed: boolean
  /** Kullanıcının elle açtığı/kapattığı gruplar; yoksa aktiflikten türetilir. */
  acikGruplar: Record<string, boolean>
  /**
   * Alt liste `id`'lerinin öneki. Ray ve çekmece aynı ağacı iki kez render
   * ediyor; `aria-controls` hedefi çakışmasın diye her kopya kendi önekini alır.
   */
  idOneki: string
  onToggle: (id: string, next: boolean) => void
  /**
   * Bir bağlantıya basıldığında çalışır (çekmeceyi kapatmak için).
   *
   * Opsiyonel değil, açıkça `undefined` alabilen zorunlu alan:
   * `exactOptionalPropertyTypes` açıkken `onNavigate?: () => void` bildirip
   * `onNavigate={undefined}` geçmek TS2375 verir.
   */
  onNavigate: (() => void) | undefined
}

function Satir({
  item,
  activeItemId,
  collapsed,
  acikGruplar,
  idOneki,
  onToggle,
  onNavigate,
}: SatirProps) {
  const aktif = item.id === activeItemId
  const cocuklar = item.children ?? []
  const altListeId = `${idOneki}-${item.id}`

  /*
    Daraltılmış rayda grup kapalı olamaz. İki gerekçe: 4rem'lik rayda ok için
    yer yok, ve "gizlenmiş menüde gizlenmiş grup" hedefleri iki kapının arkasına
    koyar — daraltma bir görünüm tercihi, hedef silme aracı değil. Açık grupta
    çocuklar kendi ikonlarıyla görünür (ikon `NavigationItem`'da zorunlu), yani
    daraltılmış rayda da her hedef tek tıkla erişilebilir kalır.
  */
  const acik = collapsed ? true : (acikGruplar[item.id] ?? aktifIcerir(item, activeItemId))

  /* `0` rozet üretmez: "sıfır iş" bir bildirim değil. */
  const rozet = item.badge !== undefined && item.badge > 0 ? rozetMetni(item.badge) : null

  const baglanti = (
    /*
      `<a href>` değil `<Link to>`: panel bir React Router uygulaması, çıplak
      bağlantı her menü tıklamasında tüm paneli baştan yükletirdi.

      `NavLink` de değil: aktifliği URL'den kendisi hesaplardı, oysa sözleşmede
      tek doğru kaynak `activeItemId`. İkisi ayrılabilir — `/ilanlar/42`
      detayındayken çağıran "İlanlar" satırını aktif işaretlemek isteyebilir;
      `NavLink` o rotada eşleşme bulamayıp satırı sönük bırakırdı.
    */
    <Link
      to={item.href}
      className={css.link({ collapsed, active: aktif })}
      {...(aktif && { 'aria-current': 'page' as const })}
      {...(onNavigate !== undefined && { onClick: onNavigate })}
    >
      {/* İkon dekoratif: adı `label` taşıyor, ekran okuyucuya iki kez okutulmaz. */}
      <span className={css.icon} aria-hidden="true">
        {item.icon}
      </span>

      {/*
        Daraltılmışken etiket görsel olarak gider ama ağaçta kalır: bağlantının
        adı yalnız buradan geliyor, `visibility: hidden` ile gizlenseydi ekran
        okuyucu "bağlantı" deyip hangi bağlantı olduğunu söyleyemezdi.
      */}
      <span className={collapsed ? css.visuallyHidden : css.label}>{item.label}</span>

      {rozet !== null ? (
        <span className={css.badgeSlot({ collapsed })}>
          <Badge tone="primary" size="sm">
            {rozet}
            {/*
              Çıplak "12" bir ad değil: bağlantı "İlanlar 12" diye okunur ve 12'nin
              neyi saydığı kaybolur. Gizli ek adı "İlanlar 12 bekleyen öğe" yapar.
            */}
            <span className={css.visuallyHidden}> bekleyen öğe</span>
          </Badge>
        </span>
      ) : null}
    </Link>
  )

  /*
    Daraltılmışken tooltip: etiket ağaçta duruyor ama **gören** kullanıcı için
    ekranda hiçbir şey yok. Tooltip metni bağlantının erişilebilir adıyla birebir
    aynı — Tooltip'in kendi kuralı bunu şart koşuyor, çünkü tooltip ekran
    okuyucuya hiçbir şey söylemez. Genişken etiket zaten görünür: tooltip
    tekrardan ibaret olurdu.
  */
  const baglantiKabi = collapsed ? <Tooltip content={item.label}>{baglanti}</Tooltip> : baglanti

  if (cocuklar.length === 0) {
    return <li className={css.item}>{baglantiKabi}</li>
  }

  return (
    <li className={css.item}>
      <div className={css.rowMain}>
        {baglantiKabi}

        {/*
          Ok bağlantının içinde değil kardeşi: `<a>` içindeki `<button>` geçersiz
          HTML ve tıklamanın hangisine gittiği tarayıcıya kalır. Ayrılınca ebeveyn
          satırı hem gidilebilir (kendi `href`'i var) hem açılabilir olur.

          Daraltılmışken ok hiç yok — grup zaten açık, kapatılamaz.
        */}
        {collapsed ? null : (
          <button
            type="button"
            className={css.toggle}
            aria-expanded={acik}
            aria-controls={altListeId}
            aria-label={`${item.label} alt menüsü`}
            onClick={() => onToggle(item.id, !acik)}
          >
            <ChevronDown size={16} aria-hidden="true" className={css.chevron({ open: acik })} />
          </button>
        )}
      </div>

      {/*
        Koşullu render değil `hidden`: `aria-controls` var olmayan bir `id`'yi
        gösteremez. `hidden` hem ilişkiyi ayakta tutar hem de kapalı grubu
        erişilebilirlik ağacından çıkarır.
      */}
      <ul id={altListeId} className={css.sublist({ collapsed })} hidden={!acik}>
        {cocuklar.map((cocuk) => (
          <Satir
            key={cocuk.id}
            item={cocuk}
            activeItemId={activeItemId}
            collapsed={collapsed}
            acikGruplar={acikGruplar}
            idOneki={altListeId}
            onToggle={onToggle}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </li>
  )
}

/**
 * Panelin ana gezinme menüsü: kenarda sabit ray, dar ekranda çekmece.
 *
 * **Yetkiye göre süzmez ve süzemez.** `NavigationItem.requiredPermission` var
 * ama `SidebarNavProps`'ta kullanıcının izin listesi yok — sözleşme bilerek
 * böyle: yetki kontrolü component'in işi değil, süzme izinleri bilen sayfa/
 * uygulama katmanının işi ve `items` süzülmüş hâlde gelir. Alan o katmana
 * bırakılmış bir bildirimdir; menü tanımı tek yerde kalsın diye satırın kendi
 * üstünde durur. Yetkisiz satır burada soluk gösterilmez — hiç gelmez.
 *
 * **Daraltma erişilebilirliği düşürmez.** `collapsed` iken etiketler kırpma
 * tekniğiyle gizlenir, `visibility: hidden` ile değil: o, alt ağacı erişilebilir
 * ad hesabından siler ve bağlantı adsız kalır (bu repoda Button'ın `loading`
 * hâlinde yaşandı, testler geçerken). Gören kullanıcı adı Tooltip'ten okur;
 * rozet sayısı ikonun köşesine biner (99 üstü `99+` — bkz. `rozetMetni`).
 * Daraltılmışken gruplar zorla açıktır: dar rayda ok için yer yok ve gizli
 * menüde gizli grup hedefleri iki kapının arkasına koyardı.
 *
 * **Aktifliğin tek kaynağı `activeItemId`, URL değil.** Bu yüzden satırlar
 * `NavLink` değil `Link` — `/ilanlar/42` detayındayken çağıran "İlanlar"
 * satırını aktif işaretleyebilsin. Aktif bir çocuk ebeveynini kendiliğinden
 * açar; kullanıcının elle açıp kapattığı gruplar rota değişene kadar sözünü
 * korur, sonra menü nerede olduğunu yeniden türetir.
 *
 * **Çekmece yalnız `onMobileOpenChange` ile render edilir.** Kapatma yolu
 * olmayan, odak kilitli bir çekmece klavye tuzağıdır; `mobileOpen` tek başına
 * bir çıkış kapısı vermez. Çekmece içinde bağlantıya basmak da kapatır — tek
 * sayfalık uygulamada rota değişince çekmece kendiliğinden kapanmaz.
 *
 * @example
 * const menu = TUM_MENU.filter(
 *   (item) => item.requiredPermission === undefined || izinler.includes(item.requiredPermission),
 * )
 *
 * <SidebarNav
 *   items={menu}
 *   activeItemId={aktifBolum}
 *   collapsed={daraltildi}
 *   mobileOpen={cekmeceAcik}
 *   onCollapsedChange={setDaraltildi}
 *   onMobileOpenChange={setCekmeceAcik}
 * />
 */
export function SidebarNav({
  items,
  activeItemId,
  collapsed = false,
  mobileOpen = false,
  onCollapsedChange,
  onMobileOpenChange,
}: SidebarNavProps) {
  const [acikGruplar, setAcikGruplar] = useState<Record<string, boolean>>({})
  const idOneki = useId()

  /*
    Rota değişti: menü nerede olunduğunu yeniden türetsin. Elle kapatılmış bir
    grup sözünü sonsuza kadar tutsaydı, o gruba giren kullanıcı aktif satırını
    hiç göremezdi — "hangi bölümdeyim" sorusu cevapsız kalırdı. Üstelik geride
    kalan kayıt da yanlış olurdu: kullanıcı "Ayarlar"ı açıp başka bölüme
    geçtiğinde artık orayla ilgilenmiyor.
  */
  useEffect(() => {
    setAcikGruplar({})
  }, [activeItemId])

  const grupDegistir = (id: string, next: boolean) => {
    setAcikGruplar((onceki) => ({ ...onceki, [id]: next }))
  }

  const liste = (kapsam: string, dar: boolean, onNavigate: (() => void) | undefined) => (
    <ul className={css.list}>
      {items.map((item) => (
        <Satir
          key={item.id}
          item={item}
          activeItemId={activeItemId}
          collapsed={dar}
          acikGruplar={acikGruplar}
          idOneki={`${idOneki}${kapsam}`}
          onToggle={grupDegistir}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  )

  const daraltEtiketi = collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'

  return (
    <>
      <nav className={css.rail({ collapsed })} aria-label="Ana menü">
        <div className={css.scroll}>{liste('rail', collapsed, undefined)}</div>

        {/*
          Düğme yalnız `onCollapsedChange` varsa: basıldığında hiçbir şey
          yapmayan bir düğme, olmayan düğmeden kötüdür. Yokluğu AppShell'in
          `sidebarMode="fixed"` hâli.
        */}
        {onCollapsedChange !== undefined ? (
          <div className={css.railFooter({ collapsed })}>
            <Tooltip content={daraltEtiketi}>
              <IconButton
                icon={collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                label={daraltEtiketi}
                variant="ghost"
                size="sm"
                onClick={() => onCollapsedChange(!collapsed)}
              />
            </Tooltip>
          </div>
        ) : null}
      </nav>

      {/*
        Çekmece kapalıyken de monte kalır (koşul `mobileOpen` değil handler'ın
        varlığı): Base UI kapanış animasyonunu ve odağı tetikleyiciye geri
        vermeyi ancak açıklık `true → false` geçişini görürse yapabilir.
        Kapalıyken portal içeriği zaten render edilmiyor.

        İçerideki menü hiçbir zaman daraltılmaz — daraltma masaüstü rayının
        tercihi; çekmecede yer sorunu yok, ikonlara indirmek yalnız zorlaştırırdı.
      */}
      {onMobileOpenChange !== undefined ? (
        <Drawer
          open={mobileOpen}
          title="Menü"
          side="left"
          onOpenChange={(next) => onMobileOpenChange(next)}
        >
          <nav aria-label="Ana menü">{liste('drawer', false, () => onMobileOpenChange(false))}</nav>
        </Drawer>
      ) : null}
    </>
  )
}
