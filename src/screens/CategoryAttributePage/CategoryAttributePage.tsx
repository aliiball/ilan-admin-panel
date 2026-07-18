import { useId, useState, type ReactNode } from 'react'
import { ChevronLeft, SquarePen, Upload } from 'lucide-react'
import { Alert } from '../../components/primitives/Alert'
import { Badge } from '../../components/primitives/Badge'
import { Button } from '../../components/primitives/Button'
import { IconButton } from '../../components/primitives/IconButton'
import { Skeleton } from '../../components/primitives/Skeleton'
import { AttributeEditor } from '../../components/composites/AttributeEditor'
import { CategoryTree } from '../../components/composites/CategoryTree'
import { ConfirmDialog } from '../../components/composites/ConfirmDialog'
import { DataTable } from '../../components/composites/DataTable'
import { EmptyState } from '../../components/composites/EmptyState'
import { ErrorState } from '../../components/composites/ErrorState'
import { ATTRIBUTE_DATA_TYPE_LABEL, BOOLEAN_IS_LABEL } from '../../domain/labels'
import { formatDateTime } from '../../utils/formatDateTime'
import type { CategoryAttributeDefinition } from '../../types/domain'
import type {
  CategoryAttributePageProps,
  CategoryTreeNode,
  ColumnDef,
  UiError,
} from '../../types/component-props'
import * as css from './CategoryAttributePage.css'

/**
 * Dar ekranda görünen pano. Geniş ekranda ikisi de görünür, bu değer yok sayılır.
 *
 * Sunucudan gelmez, sözleşmede de yoktur: hangi panonun açık olduğu bir
 * **gösterim** durumu. `onNodeSelect` zaten seçimi kaldıramıyor (`(id: string)`,
 * `undefined` alamaz), dolayısıyla "geri" düğmesi seçimi temizleyerek de
 * çözülemezdi.
 */
type MobilPano = 'agac' | 'detay'

/**
 * Onay bekleyen eylem.
 *
 * Üçü de tek bir `ConfirmDialog` örneğini besliyor: aynı anda yalnız biri
 * sorulabilir ve üç ayrı dialog üç ayrı `open` state'i, üç ayrı portal demekti.
 *
 * `dugum` ve `oznitelik` yalnız `dirty` iken sorulur — `AttributeEditorProps.dirty`
 * sözleşmesinin kendi cümlesi: "kullanıcı ayrılmak isterse **uyarılabilir**".
 * Uyarı olmadan başka bir kategoriye ya da özniteliğe geçmek, kaydedilmemiş
 * taslağı sessizce siler; sayfanın taslağı geri getirecek bir kanalı yok.
 */
type OnayIstegi =
  | { tur: 'yayin' }
  | { tur: 'dugum'; id: string }
  | { tur: 'oznitelik'; tanim: CategoryAttributeDefinition }

/** Ağaçta bir düğümü kimliğiyle bulur. Ağaç küçük (altı kök, ~34 satır); indeks gereksiz. */
function dugumBul(nodes: CategoryTreeNode[], id: string): CategoryTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node

    const bulunan = dugumBul(node.children ?? [], id)
    if (bulunan !== undefined) return bulunan
  }

  return undefined
}

/**
 * Hedef düğümün atalarının kimlikleri (hedefin kendisi hariç).
 *
 * `CategoryTreeProps.expandedIds` kontrollü ve sözleşmesi şunu söylüyor: "derin
 * bir düğüm seçiliyken atalarının açık gelmesi gerekir ve bunu ancak yolu bilen
 * katman kurabilir". Yolu bilen katman bu ekran: ağaç ona prop'la geliyor.
 *
 * Bulunamazsa `undefined` — "bulundu ama kök" (`[]`) ile karıştırılmasın diye.
 */
function atalar(nodes: CategoryTreeNode[], hedefId: string): string[] | undefined {
  for (const node of nodes) {
    if (node.id === hedefId) return []

    const altYol = atalar(node.children ?? [], hedefId)
    if (altYol !== undefined) return [node.id, ...altYol]
  }

  return undefined
}

/** Boolean alanın `error`/`code` gibi koşullu prop'a çevrimi (`exactOptionalPropertyTypes`). */
const kodProp = (hata: UiError): { code?: string } =>
  hata.code !== undefined ? { code: hata.code } : {}

/**
 * Öznitelik listesinin sütunları.
 *
 * Brifing 2.7'nin "görünen veriler" listesinin tabloya düşen kesiti: anahtar ve
 * etiket, veri tipi, zorunluluk, filtrelenebilirlik, liste görünürlüğü,
 * aktif/pasif ve sıralama. Seçenekler ile min/max/regex doğrulamaları tabloya
 * **girmiyor**: onlar tek satıra sığmayan, özniteliğe özel yapılar ve zaten
 * editörde tam hâlleriyle görünüyorlar — tabloya sıkıştırılsalar ancak "4
 * seçenek" gibi hiçbir soruyu cevaplamayan bir özet olurlardı.
 *
 * "Son güncelleyen admin" **yok**: `CategoryAttributeDefinition` yalnız
 * `updatedAt` taşıyor, `updatedBy` sözleşmede hiç yok (AGENTS.md'de açık
 * madde). Uydurulmadı; tarih tek başına gösteriliyor.
 *
 * Üç bayrak `BOOLEAN_IS_LABEL`'dan okunuyor, `BOOLEAN_HAS_LABEL`'dan değil:
 * "zorunlu mu?" bir **önermenin doğruluğu** ("Evet"), bir niteliğin varlığı
 * ("Var") değil. Karıştırılsaydı tabloda "Zorunlu: Var" yazardı.
 */
const VERI_SUTUNLARI: ColumnDef<CategoryAttributeDefinition>[] = [
  { id: 'order', header: 'Sıra', accessor: 'order', align: 'end' },
  {
    id: 'label',
    header: 'Öznitelik',
    cell: (satir) => (
      <span className={css.attributeCell}>
        <span className={css.attributeLabel}>{satir.label}</span>
        <code className={css.attributeKey}>{satir.key}</code>
      </span>
    ),
  },
  {
    id: 'dataType',
    header: 'Veri tipi',
    /* Etiket domain'den: `singleSelect` hiçbir ekranda gösterilemez. */
    cell: (satir) => ATTRIBUTE_DATA_TYPE_LABEL[satir.dataType],
  },
  { id: 'required', header: 'Zorunlu', cell: (satir) => BOOLEAN_IS_LABEL[`${satir.required}`] },
  {
    id: 'filterable',
    header: 'Filtrelenebilir',
    cell: (satir) => BOOLEAN_IS_LABEL[`${satir.filterable}`],
  },
  {
    id: 'visibleInList',
    header: 'Listede görünür',
    cell: (satir) => BOOLEAN_IS_LABEL[`${satir.visibleInList}`],
  },
  {
    id: 'active',
    header: 'Durum',
    /*
      Rozet, "Evet/Hayır" değil: `active` bir bayrak olsa da kullanıcının okuduğu
      şey özniteliğin **durumu** ve o durumun adı var ("Aktif"/"Pasif") —
      CategoryTree ve AttributeEditor de aynı iki kelimeyi kullanıyor.
    */
    cell: (satir) =>
      satir.active ? <Badge tone="success">Aktif</Badge> : <Badge tone="neutral">Pasif</Badge>,
  },
  {
    id: 'updatedAt',
    header: 'Son güncelleme',
    /* Tarih `utils/formatDateTime`'dan: kendi Intl'ini kuran her yer saat dilimini
       makineye bırakıp günü kaydırıyor. */
    cell: (satir) => formatDateTime(satir.updatedAt),
  },
]

/**
 * Veri sütunları + özniteliği editöre yükleyen düğme.
 *
 * **`DataTableProps.onRowClick` bilerek kullanılmadı.** Tablo satır tıklamasını
 * `<tr>`'nin `onClick`'ine bağlıyor ve satıra ne rol ne `tabIndex` veriyor: satır
 * yalnız **fareyle** çalışır. Brifing 2.7'nin "öznitelik düzenleme" eylemine giden
 * tek yol o olsaydı, klavye ve ekran okuyucu kullanıcısı bu ekranda hiçbir
 * özniteliği açamazdı. Aynı işi yapan gerçek bir `<button>` iki girişi de
 * karşılıyor. (Tablonun bu boşluğu raporlandı.)
 *
 * Düğmenin adı satırın etiketini taşıyor: yedi satırda yedi kez "Aç" duyan ekran
 * okuyucu kullanıcısı hangisini açtığını bilemezdi (AttributeEditor'ün numaralı
 * seçenek düğmeleriyle aynı gerekçe).
 */
function tabloSutunlari(
  ac: (tanim: CategoryAttributeDefinition) => void,
): ColumnDef<CategoryAttributeDefinition>[] {
  return [
    ...VERI_SUTUNLARI,
    {
      id: 'islem',
      header: 'İşlem',
      align: 'end',
      cell: (satir) => (
        <IconButton
          icon={<SquarePen size={16} />}
          label={`${satir.label} tanımını düzenleyicide aç`}
          size="sm"
          onClick={() => ac(satir)}
        />
      ),
    },
  ]
}

/**
 * Kategori ve öznitelik yönetimi ekranı (brifing 2.7).
 *
 * Kategori ağacını, seçili düğümün öznitelik listesini ve öznitelik editörünü
 * birleştirir. **Veri çekmez**: her şey `state` ile prop'tan gelir.
 *
 * ## Düzen
 *
 * Geniş ekranda ağaç ve detay yan yana (split); dar ekranda drill-down — önce
 * ağaç, bir kategori seçilince detay, geri düğmesiyle ağaç. Hangi panonun
 * görüneceği **yalnız dar ekranda** anlamlı olduğu için bir gösterim state'i
 * (`data-mobil-pano`) taşıyor; geniş ekranda CSS onu yok sayıyor. Ekranın
 * `<h1>`'i yok — kabuk (PageHeader) bu ekranın işi değil — bu yüzden panolar
 * `<h2>`, bölümler `<h3>`.
 *
 * ## Sözleşmenin sustuğu yerler ve verilen kararlar
 *
 * - **`editorMode` verilmezse `readOnly`.** Yetki listesi `CategoryAttributePageProps`'ta
 *   yok; `category:manage` yalnız `superAdmin`'de (brifing 1.4) ve bu ekranda
 *   yetkiyi taşıyan tek şey `editorMode`. Varsayılanı `edit` yapmak, mod'u
 *   göndermeyi unutan çağırana sessizce düzenleme yetkisi verirdi. Yetkisiz
 *   kullanıcıya **`disabled` editör değil `readOnly` editör** gösteriliyor:
 *   kilitli kutu okunmak için tasarlanmamıştır (bkz. `AttributeEditor`).
 * - **`saving` yalnız taslak kaydetmeyi kapsar.** `AttributeEditorProps.saving`'in
 *   sözleşmesi birebir bunu diyor ("Kaydetme sürerken alanları kilitler").
 *   Brifing 2.7'nin `publishPending` durumunun kanalı **yok** ve `saving` onu
 *   kapsamıyor: kapsasaydı yayın sırasında editör "kaydediliyor" der, kutular
 *   sebepsiz kilitlenirdi. Yayın düğmesi `saving` iken kapalı (uçan bir kayıt
 *   varken taslak oturmamıştır) ama spinner **göstermiyor** — spinner "yayın
 *   uçuyor" demek olurdu ve bunu bilmiyoruz.
 * - **Listeden bir öznitelik açmak `onEditorChange`'e düşer.** `onAttributeSelect`
 *   diye bir kanal yok; editörün değerini değiştirebilen tek kanal `onEditorChange`
 *   ve "editörün değeri değişti" tam olarak bu. Sayfa `editorMode`'u **kendisi
 *   çeviremez**: satır açıldığında modu `edit`'e almak çağıranın işi — mod
 *   gelmezse editör `readOnly` açılır ve kullanıcı tanımı okur, düzenleyemez.
 * - **`attributes` süzülmüş gelir.** Düğüm kimliğinden kategoriye inen bir kanal
 *   yok: `CategoryTreeNode` yalnız köklerde `category` taşıyor, alt kategori
 *   düğümünde `subCategory` diye bir alan hiç yok. Yani ekran listeyi seçili
 *   düğüme göre **süzemez**; süzülmüş hâlde gelmesi gerekir. Kimliği ayrıştırmak
 *   (`konut-daire`) bir story kalıbını sözleşme sanmak olurdu.
 *
 * ## Kanalı olmayan brifing gereksinimleri (uydurulmadı)
 *
 * `conflict`, `publishPending` ve `validationError` durumları; "öznitelik
 * ekleme", "önizleme", "yayın öncesi etkilenen ilan sayısı" eylemleri; taslağı
 * geri alma ("Vazgeç") ve "son güncelleyen admin" — hiçbirinin prop'u yok.
 *
 * `validationError` özellikle can sıkıcı: `AttributeEditor` onu gösterecek
 * prop'u taşıyor (`validationErrors`) ama bu ekranın onu **besleyecek** bir
 * alanı yok ve kendi de üretemez — "bu anahtar zaten kullanılıyor" sunucuyu
 * gerektirir, ekran veri çekmez. Eksik olan tek şey bir
 * `editorValidationErrors?: Record<string, string>` prop'u.
 *
 * `onPublish`'in **kapsamı da belirsiz**: argüman almıyor, dolayısıyla bir
 * kapsam taşımıyor. Bu yüzden yayın düğmesi seçili kategorinin başlığının
 * yanında değil, sayfanın araç çubuğunda duruyor ve onay metni hiçbir kategori
 * adı vermiyor — sözleşmenin söylemediği bir kapsamı ima etmek, "yalnız Konut
 * yayınlanacak" sanan kullanıcıya bütün taslakları yayınlatırdı.
 *
 * Ayrıntı story dosyasında ve raporda.
 *
 * @example
 * <CategoryAttributePage
 *   state={{ status: 'success', data: { tree, attributes, selectedNodeId } }}
 *   editorValue={taslak}
 *   editorMode="edit"
 *   dirty={taslak !== sunucudakiHali}
 *   saving={kaydetme.isPending}
 *   onNodeSelect={setSeciliDugum}
 *   onEditorChange={setTaslak}
 *   onSave={() => kaydetme.mutate(taslak)}
 *   onPublish={() => yayin.mutate()}
 *   onRetry={() => sorgu.refetch()}
 * />
 */
export function CategoryAttributePage({
  state,
  editorValue,
  editorMode,
  dirty = false,
  saving = false,
  onNodeSelect,
  onEditorChange,
  onSave,
  onPublish,
  onRetry,
}: CategoryAttributePageProps) {
  const idOneki = useId()
  const agacBaslikId = `${idOneki}-agac`
  const detayBaslikId = `${idOneki}-detay`
  const listeBaslikId = `${idOneki}-liste`
  const editorBaslikId = `${idOneki}-editor`

  const [mobilPano, setMobilPano] = useState<MobilPano>('agac')
  const [acikIdler, setAcikIdler] = useState<string[]>([])

  /*
    Dialog'un içeriği ve açıklığı **ayrı** state'ler: kapanırken içeriği
    silmek, Base UI'ın kapanma animasyonu sürerken dialog'un son karesinde
    başka bir soru göstermek olurdu. İçerik bir sonraki açılışa kadar duruyor.
  */
  const [onayIstegi, setOnayIstegi] = useState<OnayIstegi | null>(null)
  const [onayAcik, setOnayAcik] = useState(false)

  const veri =
    state.status === 'success' || state.status === 'partialSuccess' ? state.data : undefined
  const agac = veri?.tree ?? []
  const seciliId = veri?.selectedNodeId

  /*
    Seçim değiştiğinde atalarını aç.

    Render sırasında state ayarlamak React'in "prop değişince state'i düzelt"
    kalıbı: efekt kullanmak aynı işi bir boyama gecikmesiyle yapardı — kullanıcı
    seçili düğümü bir kare boyunca kapalı bir dalın içinde görürdü. Yalnız
    `seciliId` **değiştiğinde** çalışır, dolayısıyla kullanıcının kendi açıp
    kapattıkları korunur: seçili düğümün atası her render'da zorla açılsaydı ok
    tuşuyla kapatmak imkânsız olurdu.
  */
  const [izlenenSecim, setIzlenenSecim] = useState<string | undefined>(undefined)
  if (seciliId !== izlenenSecim) {
    setIzlenenSecim(seciliId)

    const yol = seciliId !== undefined ? atalar(agac, seciliId) : undefined
    if (yol !== undefined && yol.length > 0) {
      setAcikIdler((oncekiler) => [...oncekiler, ...yol.filter((id) => !oncekiler.includes(id))])
    }
  }

  const seciliDugum = seciliId !== undefined ? dugumBul(agac, seciliId) : undefined
  const oznitelikler = veri?.attributes ?? []

  const dugumSecildi = (id: string) => {
    /* Seçili düğüme tekrar basmak bir şeyi atmıyor; dar ekranda detaya geçiriyor. */
    if (id === seciliId) {
      setMobilPano('detay')
      return
    }

    if (dirty) {
      setOnayIstegi({ tur: 'dugum', id })
      setOnayAcik(true)
      return
    }

    onNodeSelect(id)
    setMobilPano('detay')
  }

  const oznitelikSecildi = (tanim: CategoryAttributeDefinition) => {
    /* Zaten düzenlenen satır: yeniden yüklemek taslağı sunucudaki hâline döndürürdü. */
    if (editorValue?.id === tanim.id) return

    if (dirty) {
      setOnayIstegi({ tur: 'oznitelik', tanim })
      setOnayAcik(true)
      return
    }

    onEditorChange(tanim)
  }

  const yayiniSor = () => {
    setOnayIstegi({ tur: 'yayin' })
    setOnayAcik(true)
  }

  const onayla = () => {
    if (onayIstegi === null) return

    switch (onayIstegi.tur) {
      case 'yayin':
        onPublish()
        break

      case 'dugum':
        onNodeSelect(onayIstegi.id)
        setMobilPano('detay')
        break

      case 'oznitelik':
        onEditorChange(onayIstegi.tanim)
        break
    }

    /*
      Dialog onayla kapanıyor. ConfirmDialog'un sözleşmesi "kapatmak çağıranın
      işi: işlem başarısız olursa dialog açık kalıp hatayı gösterebilmeli" diyor
      ama bu ekranda gösterilecek hata **yok**: ne `publishPending` ne de bir
      yayın hatası kanalı var (bkz. component JSDoc'u). Kanal gelince dialog
      `loading` ile açık kalmalı.
    */
    setOnayAcik(false)
  }

  /**
   * Dialog metni.
   *
   * `onayIstegi` kapanıştan sonra da duruyor, dolayısıyla bu metin animasyon
   * boyunca sabit kalır.
   */
  const onayMetni =
    onayIstegi?.tur === 'yayin'
      ? {
          title: 'Değişiklikleri yayınla',
          description: dirty
            ? 'Kaydedilmiş öznitelik tanımları yayına alınır ve yeni ilanlarda hemen geçerli olur. Editördeki kaydedilmemiş değişiklikleriniz bu yayına dahil edilmez.'
            : 'Kaydedilmiş öznitelik tanımları yayına alınır ve yeni ilanlarda hemen geçerli olur.',
          confirmLabel: 'Yayınla',
          tone: 'neutral' as const,
        }
      : {
          title: 'Kaydedilmemiş değişiklikleri at',
          description:
            'Editördeki değişiklikler kaydedilmedi. Devam ederseniz taslak kaybolur ve geri getirilemez.',
          confirmLabel: 'Değişiklikleri at',
          tone: 'danger' as const,
        }

  const iskeletPanolari = (
    /* Yükleme ölçüyü koruyor: iki pano, başlıklar ve tablo başlığı yerinde
       kalıyor (brifing 2.1: "spinner ile boş ekran gösterilmez"). */
    <div className={css.split} aria-busy="true">
      <section className={css.treePane} aria-labelledby={agacBaslikId}>
        <h2 id={agacBaslikId} className={css.paneTitle}>
          Kategoriler
        </h2>
        <CategoryTree
          nodes={[]}
          expandedIds={[]}
          loading
          onSelect={dugumSecildi}
          onExpandedIdsChange={(ids) => setAcikIdler(ids)}
        />
      </section>

      <section className={css.detailPane} aria-labelledby={detayBaslikId}>
        <div className={css.paneHeading}>
          <h2 id={detayBaslikId} className={css.paneTitle}>
            Öznitelikler
          </h2>
        </div>

        <div className={css.block}>
          <h3 id={listeBaslikId} className={css.blockTitle}>
            Tanımlı öznitelikler
          </h3>
          {/* Sütun başlıkları duruyor, satırlar iskelet: veri gelince düzen zıplamaz.
              Sütunlar içerikle **aynı** fonksiyondan geliyor; ayrı bir liste yazmak
              yüklemede sekiz, veride dokuz kolon çizip tam da önlemeye çalıştığı
              zıplamayı üretirdi. */}
          <DataTable
            rows={[]}
            columns={tabloSutunlari(oznitelikSecildi)}
            loading
            visualStyle="bordered"
          />
        </div>

        <div className={css.block}>
          <h3 id={editorBaslikId} className={css.blockTitle}>
            Öznitelik düzenleyici
          </h3>
          {/* AttributeEditor'ün `loading` kanalı yok ve olmamalı da: editör veri
              çekmiyor. Boş bir `value` ile çizmek "hiçbir alanı olmayan
              öznitelik" yalanını söylerdi. */}
          <Skeleton lines={6} />
        </div>
      </section>
    </div>
  )

  const detayGovdesi = (): ReactNode => {
    /*
      Kapı `seciliId`, `seciliDugum` **değil**: ağaç düşüp öznitelikler geldiğinde
      (`partialSuccess`) düğüm nesnesi bulunamaz ama seçim yine de biliniyor —
      düğüm nesnesine bakılsaydı gelmiş olan liste "Kategori seçilmedi" yazısının
      arkasında gizlenirdi, yani `partialSuccess`'in tam da önlemek için var
      olduğu şey olurdu. Düğüm bulunamazsa kaybolan tek şey başlıktaki kategori
      adı.
    */
    if (seciliId === undefined) {
      return (
        <EmptyState
          variant="compact"
          title="Kategori seçilmedi"
          description="Öznitelikleri görmek için ağaçtan bir kategori ya da alt kategori seçin."
        />
      )
    }

    const oznitelikHatasi = state.status === 'partialSuccess' ? state.errors.attributes : undefined

    return (
      <>
        <div className={css.block}>
          <h3 id={listeBaslikId} className={css.blockTitle}>
            Tanımlı öznitelikler
          </h3>
          <p className={css.note}>
            Satırdaki düğme özniteliğin tanımını aşağıdaki düzenleyiciye yükler.
          </p>

          <DataTable
            rows={oznitelikler}
            columns={tabloSutunlari(oznitelikSecildi)}
            visualStyle="bordered"
            /*
              `mobileMode` varsayılanda (`scroll`): bu tabloda sütunların kendisi
              bilgi. "Zorunlu mu, filtrelenebilir mi" soruları satırlar arasında
              **karşılaştırılarak** okunuyor; kartlara dağılan sekiz alan bu
              karşılaştırmayı imkânsız kılardı. Kaydırma kabı ve klavye erişimi
              DataTable'ın kendi işi.
            */
            {...(oznitelikHatasi !== undefined && { error: oznitelikHatasi })}
            {...(oznitelikHatasi?.retryable === true && { onRetry })}
            emptyState={
              <EmptyState
                variant="compact"
                title="Bu kategoride öznitelik yok"
                /* Ana eylem "Öznitelik ekle" olurdu; kanalı yok (bkz. component JSDoc'u),
                   basınca hiçbir şey yapmayan düğme koymaktansa boş bırakıldı. */
                description="Bu kategori için henüz bir öznitelik tanımlanmamış. Tanımlanana kadar ilan formunda kategoriye özel alan sorulmaz."
              />
            }
          />
        </div>

        <div className={css.block}>
          <h3 id={editorBaslikId} className={css.blockTitle}>
            Öznitelik düzenleyici
          </h3>

          {editorValue === undefined ? (
            <EmptyState
              variant="compact"
              title="Öznitelik seçilmedi"
              description="Yukarıdaki listeden bir öznitelik seçin; tanımı burada açılır."
            />
          ) : (
            <AttributeEditor
              value={editorValue}
              /* Mod verilmezse `readOnly`: bkz. component JSDoc'u. */
              mode={editorMode ?? 'readOnly'}
              dirty={dirty}
              saving={saving}
              onChange={(next) => onEditorChange(next)}
              onSave={() => onSave()}
              /* `onCancel` **bilerek yok**: sayfanın taslağı geri alacak bir
                 kanalı yok (`onEditorChange` ile sunucudaki kopyayı geri yazmak
                 `dirty`'yi çağıranın nasıl hesapladığına bağlı bir varsayım
                 olurdu). Vazgeçme düğmesi olmayan bir editör, basınca hiçbir şey
                 yapmayan düğmeden iyidir. */
            />
          )}
        </div>
      </>
    )
  }

  let govde: ReactNode

  if (state.status === 'idle' || state.status === 'loading') {
    govde = iskeletPanolari
  } else if (state.status === 'error' || state.status === 'unauthorized') {
    /*
      İki durum tek blok, ama iki ayrı ekran: metni `UiError` taşıyor (403 "bu
      senin görebileceğin bir şey değil" der, hata "bir şey ters gitti" der) ve
      tekrar deneme butonu **iki kapıdan** geçiyor — `retryable === true` ve
      `onRetry` bağlı. `unauthorized`'ın `retryable`'ı tip düzeyinde `false`'a
      sabitlendiği için 403'te buton hiçbir zaman çıkmıyor: kural kodda değil
      sözleşmede duruyor. `onRetry` bu ekranda zorunlu prop, yani ikinci kapı
      sözleşme gereği zaten açık.
    */
    govde = (
      <ErrorState
        variant="page"
        title={state.error.title}
        description={state.error.message}
        {...kodProp(state.error)}
        {...(state.error.retryable && { onRetry })}
      />
    )
  } else if (state.status === 'empty') {
    /*
      Boşluk burada "filtreye uyan yok" değil: bu ekranın filtresi yok ve
      kategori ağacı sunucudan geliyor. Kategorisiz bir panel bir yapılandırma
      eksikliği — kullanıcının atabileceği tek adım yeniden yüklemek.
      "Öznitelik ekleme" ana eylem olurdu ama kanalı yok.
    */
    govde = (
      <EmptyState
        title="Kategori tanımı yok"
        description="Kategori ağacı sunucudan gelir ve boş görünüyor. Bu bir yapılandırma eksikliğine işaret eder; veri yeniden yüklenmezse sistem yöneticisine bildirin."
        primaryAction={<Button onClick={() => onRetry()}>Yeniden yükle</Button>}
      />
    )
  } else {
    const agacHatasi = state.status === 'partialSuccess' ? state.errors.tree : undefined

    govde = (
      <div className={css.split}>
        <section className={css.treePane} aria-labelledby={agacBaslikId}>
          <h2 id={agacBaslikId} className={css.paneTitle}>
            Kategoriler
          </h2>

          {agacHatasi !== undefined ? (
            /* Ağaç düştü, öznitelikler geldi: `partialSuccess`'in tam da ayırmak
               için var olduğu hâl. Hata panonun içinde kalıyor, sayfa ayakta. */
            <ErrorState
              variant="section"
              title={agacHatasi.title}
              description={agacHatasi.message}
              {...kodProp(agacHatasi)}
              {...(agacHatasi.retryable && { onRetry })}
            />
          ) : (
            <CategoryTree
              nodes={agac}
              variant="sidebar"
              expandedIds={acikIdler}
              {...(seciliId !== undefined && { selectedId: seciliId })}
              onSelect={(id) => dugumSecildi(id)}
              onExpandedIdsChange={(ids) => setAcikIdler(ids)}
            />
          )}
        </section>

        <section className={css.detailPane} aria-labelledby={detayBaslikId}>
          <Button
            className={css.backButton}
            variant="ghost"
            size="sm"
            leadingIcon={<ChevronLeft size={16} />}
            onClick={() => setMobilPano('agac')}
          >
            Kategori ağacına dön
          </Button>

          <div className={css.paneHeading}>
            <h2 id={detayBaslikId} className={css.paneTitle}>
              {seciliDugum !== undefined ? `${seciliDugum.label} öznitelikleri` : 'Öznitelikler'}
            </h2>

            {/* Pasiflik ağaçta da rozetli; detayda tekrar edilmesi gerekiyor çünkü
                dar ekranda ağaç görünmüyor ve kullanıcı pasif bir kategorinin
                özniteliklerini düzenlediğini bilmeli. */}
            {seciliDugum !== undefined && !seciliDugum.active ? (
              <Badge tone="neutral">Pasif kategori</Badge>
            ) : null}
          </div>

          {detayGovdesi()}
        </section>
      </div>
    )
  }

  const icerikVar = state.status === 'success' || state.status === 'partialSuccess'
  const bayat = state.status === 'success' && state.stale === true

  return (
    <div className={css.root} data-mobil-pano={mobilPano}>
      {bayat ? (
        /*
          `info`, `warning` değil: bayat veri acil değil, gösterilen şey hâlâ
          doğru — yalnız eski. `warning` `role="alert"` taşır ve ekran okuyucu
          kullanıcısının işini böler (`AlertProps.tone`: "Gerçekten acil olmayan
          şeye vermeyin"). Eylem `onRetry`'ye bağlı: bu ekranın tek yeniden
          yükleme kanalı o.
        */
        <Alert
          tone="info"
          title="Gösterilen veri güncel olmayabilir"
          description="Kategoriler ve öznitelikler son başarılı yüklemeden geliyor."
          action={
            <Button variant="secondary" size="sm" onClick={() => onRetry()}>
              Yeniden yükle
            </Button>
          }
        />
      ) : null}

      {icerikVar ? (
        <div className={css.toolbar}>
          <Button
            variant="primary"
            leadingIcon={<Upload size={16} />}
            /* Uçan bir kayıt varken yayınlamak, oturmamış bir taslağı yayınlamak
               olur. `loading` **verilmiyor**: spinner "yayın uçuyor" der ve o
               bilgi bu ekrana gelmiyor (bkz. component JSDoc'u). */
            disabled={saving}
            onClick={yayiniSor}
          >
            Değişiklikleri yayınla
          </Button>
        </div>
      ) : null}

      {govde}

      {onayIstegi !== null ? (
        <ConfirmDialog
          open={onayAcik}
          title={onayMetni.title}
          description={onayMetni.description}
          confirmLabel={onayMetni.confirmLabel}
          tone={onayMetni.tone}
          onConfirm={onayla}
          onCancel={() => setOnayAcik(false)}
        />
      ) : null}
    </div>
  )
}
