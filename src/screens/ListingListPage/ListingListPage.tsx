import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { Alert } from '../../components/primitives/Alert'
import { Badge } from '../../components/primitives/Badge'
import { Button } from '../../components/primitives/Button'
import { SearchInput } from '../../components/primitives/SearchInput'
import { BulkActionBar } from '../../components/composites/BulkActionBar'
import { ConfirmDialog } from '../../components/composites/ConfirmDialog'
import { DataTable } from '../../components/composites/DataTable'
import { EmptyState } from '../../components/composites/EmptyState'
import { ErrorState } from '../../components/composites/ErrorState'
import { FilterBar } from '../../components/composites/FilterBar'
import { ListingCard } from '../../components/composites/ListingCard'
import { Pagination } from '../../components/composites/Pagination'
import { StatusBadge } from '../../components/composites/StatusBadge'
import {
  CURRENCY_LABEL,
  LISTING_CATEGORY_LABEL,
  LISTING_FIELD_LABEL,
  LISTING_METRIC_LABEL,
  LISTING_STATUS_LABEL,
  LISTING_SUB_CATEGORY_LABEL,
  PROMOTION_TYPE_LABEL,
  SELLER_TYPE_LABEL,
  TRANSACTION_TYPE_LABEL,
} from '../../domain/labels'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDateTime'
import {
  AdminPermission,
  Currency,
  ListingCategory,
  ListingStatus,
  PromotionType,
  SellerType,
  type Listing,
  type Paginated,
  type PromotionFlags,
} from '../../types/domain'
import type {
  BulkActionDefinition,
  ColumnDef,
  DateRange,
  FilterDefinition,
  FilterValue,
  ListingFilterOptions,
  ListingFilterValues,
  ListingListPageProps,
  NumberRange,
  SelectOption,
  UiError,
} from '../../types/component-props'
import * as css from './ListingListPage.css'

/**
 * Yetkisiz durumun güvenli geri dönüş hedefi.
 *
 * **Varsayım, sözleşme değil.** Brifing 2.1 `unauthorized` için "güvenli geri
 * dönüş bağlantısı" şart koşuyor ama `ListingListPageProps`'ta hedefi taşıyan
 * bir kanal yok ve ekran router'a bakmıyor. Panel kökü, `SidebarNav`
 * story'lerindeki gezinme fixture'ının dashboard satırıyla aynı (`href: '/'`) —
 * repodaki tek yazılı rota kaynağı orası. Rota tablosu Faz 4'te kurulunca
 * buranın bir prop'a (`safeReturnHref`) dönmesi gerekebilir.
 *
 * Düz `<a>` kullanılıyor, `Link` değil: bağlantı ekranı Router context'ine
 * bağlardı ve ekranın tek işi listeyi göstermek.
 */
const GUVENLI_DONUS = '/'

/* ── Filtre sözleşmesi ────────────────────────────────────────────────────── */

/**
 * Hiç dokunulmamış filtre kümesi.
 *
 * Fonksiyon, sabit değil: `onFiltersChange`'e her seferinde aynı nesne referansı
 * verilirse çağıran onu (yanlışlıkla) mutasyona uğrattığında "temiz" hâl kalıcı
 * olarak kirlenirdi.
 *
 * `query`, `cityCode`, `reviewerId` gibi opsiyonel alanlar **yazılmıyor**:
 * `exactOptionalPropertyTypes` açıkken `query: undefined` yazmak "alan var ama
 * boş" demek olur, oysa doğru ifade "alan yok".
 */
function bosFiltreler(): ListingFilterValues {
  return {
    categories: [],
    statuses: [],
    currencies: [],
    sellerTypes: [],
    dateRange: {},
    promotionTypes: [],
  }
}

/**
 * Kullanıcının bir şeyi süzüp süzmediği.
 *
 * **Bu yardımcı `filteredEmpty` ekran durumunu türetmek için var.** Brifing 2.3
 * `filteredEmpty`'yi ayrı bir ekran durumu sayıyor ama `AsyncState`'in üyesi
 * değil ve olmamalı: `AsyncState` sunucunun cevabını taşır, sunucu ise "sonuç
 * boş" der — "senin filtrelerin yüzünden boş" demez, filtreleri bilen taraf
 * istemcidir. Durum bu yüzden **iki kaynaktan türetilir**: `status === 'empty'`
 * (sunucu) + filtrelerin varsayılandan farklı olması (istemci).
 *
 * Ayrım şart, çünkü iki boşluk kullanıcıya **farklı adım attırır**: "hiç ilan
 * yok" durumunda temizlenecek filtre yoktur ve "Filtreleri temizle" butonu
 * hiçbir şey yapmayan bir butondur; "filtreye uyan yok" durumunda ise tek doğru
 * adım odur.
 *
 * `cityCode`/`districtId`/`neighborhoodId`/`reviewerId` — çubukta ancak
 * `filterOptions` verilince görünen alanlar (bkz. {@link filtreTanimlari}) —
 * **her hâlde sayılıyor**: seçeneği gelmese bile kayıtlı bir görünümden veya
 * URL'den değer gelebilir ve geldiğinde ortada gerçekten temizlenecek bir filtre
 * vardır. Yalnız o an render edilen alanlara bakmak, o kullanıcıya "hiç ilan yok"
 * deyip çıkışsız bırakırdı.
 */
function filtreAktifMi(filters: ListingFilterValues): boolean {
  return aktifFiltreSayisi(filters) > 0
}

/**
 * Bir şeyi süzen filtre alanlarının sayısı.
 *
 * `FilterBarProps.activeFilterCount`'a geçilir. Çubuğun kendi hesabı
 * `definitions` üzerinden yürüyor, yani serbest metni (kutusu çubuğun **dışında**)
 * ve çubukta karşılığı olmayan alanları göremezdi. Sözleşme bu kaçışı öngörmüş:
 * "'Aktif'in tanımı ekrana göre değişiyorsa üst katman kendi sayısını geçer."
 *
 * Sayaç ile "Temizle" aynı kümeye bakmalı: buton `query`'yi de siliyor, o hâlde
 * rozet de onu saymalı — yoksa "2 aktif" yazan çubuk basınca üç şeyi temizler.
 */
function aktifFiltreSayisi(filters: ListingFilterValues): number {
  const kosullar = [
    (filters.query ?? '') !== '',
    filters.categories.length > 0,
    filters.statuses.length > 0,
    filters.cityCode !== undefined,
    filters.districtId !== undefined,
    filters.neighborhoodId !== undefined,
    // `0` geçerli bir sınırdır ("en az 0"); boş sayılmaz.
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
    filters.currencies.length > 0,
    filters.sellerTypes.length > 0,
    filters.dateRange.from !== undefined || filters.dateRange.to !== undefined,
    filters.promotionTypes.length > 0,
    /** Yalnız `true` eler: kapalı anahtar hiçbir şeyi süzmez. */
    filters.reportedOnly === true,
    filters.reviewerId !== undefined,
  ]

  return kosullar.filter(Boolean).length
}

/**
 * Enum değerlerini Select seçeneklerine çevirir.
 *
 * Seçenekler `Object.values(Enum)` ile **türetiliyor**, elle yazılmıyor: elle
 * yazılmış bir liste enum'a yeni üye eklendiğinde sessizce eksik kalırdı ve
 * filtrede görünmeyen bir durum, kullanıcının bulamayacağı ilanlar demek.
 * (`domain/categoryTree.ts` aynı kararı aynı gerekçeyle veriyor.) Sıra da
 * enum'un bildirim sırası, yani brifingin sırası.
 */
function secenekler<T extends string>(degerler: readonly T[], etiket: Record<T, string>) {
  return degerler.map<SelectOption>((deger) => ({ value: deger, label: etiket[deger] }))
}

/**
 * Tekli (`select`) bir filtre alanı — il/ilçe/mahalle/inceleyen için ortak kalıp.
 *
 * Değeri **tek bir string** (`cityCode`, `districtId`, `neighborhoodId`,
 * `reviewerId`), yani `multiSelect` değil `select`: bir ilan tek bir ilde,
 * tek bir inceleyende. `id` doğrudan `ListingFilterValues`'ın alan adı, böylece
 * {@link filtreGuncelle}'de adıyla yazılabiliyor (hesaplanmış anahtar tuzağından
 * kaçınmak için).
 */
function tekliFiltre(id: string, label: string, options: SelectOption[]): FilterDefinition {
  return { id, label, type: 'select', options, placeholder: 'Tümü' }
}

/**
 * Ekranın filtre çubuğu — sözleşmenin verdiği kadarı.
 *
 * Sabit alanların yanına, `filterOptions` verildikçe **seçenek kaynağı gelen**
 * dört filtre daha ekleniyor (Faz 3'te bu kaynak yoktu → filtreler hiç
 * render edilmiyordu, RAPOR EDİLMİŞTİ):
 *
 * - **İl / ilçe / mahalle** (`cityCode`/`districtId`/`neighborhoodId`) ve
 *   **İnceleyen moderatör** (`reviewerId`): alanları hep vardı ama seçenekleri
 *   ekran veriden **türetemez** — süzülmüş liste yalnız o sayfadaki değerleri
 *   içerir ve filtreledikçe seçenekler daralırdı. Artık `filterOptions` tam
 *   listeyi taşıyor. **Seçenek kaynağı gelmemiş bir filtre yine render edilmez**
 *   (`.length > 0` kapısı): boş `options` ile bir Select, basınca boş liste açan
 *   bir kutu demek.
 *
 * Hâlâ karşılığı olmayanlar (rapor edildi, uydurulmadı):
 *
 * - **Alt kategori**: `ListingFilterValues`'ta alan yok.
 * - **Güncellenme tarihi aralığı**: `dateRange` **tek** — hangi tarihe ait
 *   olduğunu söylemiyor; ilan tarihi varsayıldı, ikincisi için ayrı alan gerekir.
 * - **Kayıtlı filtre görünümü**: `FilterBarProps.savedViewName`/`onSaveView`
 *   hazır ama `ListingListPageProps`'ta kanalı yok.
 *
 * Seçeneği {@link secenekler ARAMA_ESIGI}'nden (sekiz) fazla olan `select` alanı
 * FilterBar'da kendiliğinden aranabilir açılır; il/ilçe/mahalle uzadıkça bu
 * kendiliğinden devreye girer.
 */
function filtreTanimlari(secenekKaynaklari?: ListingFilterOptions): FilterDefinition[] {
  const konumFiltreleri: FilterDefinition[] = []
  if (secenekKaynaklari?.cities && secenekKaynaklari.cities.length > 0) {
    konumFiltreleri.push(tekliFiltre('cityCode', 'İl', secenekKaynaklari.cities))
  }
  if (secenekKaynaklari?.districts && secenekKaynaklari.districts.length > 0) {
    konumFiltreleri.push(tekliFiltre('districtId', 'İlçe', secenekKaynaklari.districts))
  }
  if (secenekKaynaklari?.neighborhoods && secenekKaynaklari.neighborhoods.length > 0) {
    konumFiltreleri.push(tekliFiltre('neighborhoodId', 'Mahalle', secenekKaynaklari.neighborhoods))
  }

  const inceleyenFiltresi: FilterDefinition[] =
    secenekKaynaklari?.reviewers && secenekKaynaklari.reviewers.length > 0
      ? [tekliFiltre('reviewerId', 'İnceleyen', secenekKaynaklari.reviewers)]
      : []

  return [
    {
      id: 'categories',
      label: LISTING_FIELD_LABEL.category,
      type: 'multiSelect',
      options: secenekler(Object.values(ListingCategory), LISTING_CATEGORY_LABEL),
      placeholder: 'Tümü',
    },
    {
      id: 'statuses',
      label: LISTING_FIELD_LABEL.status,
      type: 'multiSelect',
      options: secenekler(Object.values(ListingStatus), LISTING_STATUS_LABEL),
      placeholder: 'Tümü',
    },
    ...konumFiltreleri,
    { id: 'price', label: LISTING_FIELD_LABEL.price, type: 'numberRange' },
    {
      id: 'currencies',
      label: 'Para Birimi',
      type: 'multiSelect',
      options: secenekler(Object.values(Currency), CURRENCY_LABEL),
      placeholder: 'Tümü',
    },
    {
      id: 'sellerTypes',
      label: 'Kimden',
      type: 'multiSelect',
      options: secenekler(Object.values(SellerType), SELLER_TYPE_LABEL),
      placeholder: 'Tümü',
    },
    { id: 'dateRange', label: LISTING_FIELD_LABEL.listingDate, type: 'dateRange' },
    {
      id: 'promotionTypes',
      label: LISTING_FIELD_LABEL.promotionFlags,
      type: 'multiSelect',
      options: secenekler(Object.values(PromotionType), PROMOTION_TYPE_LABEL),
      placeholder: 'Tümü',
    },
    ...inceleyenFiltresi,
    { id: 'reportedOnly', label: 'Yalnız şikayetli ilanlar', type: 'boolean' },
  ]
}

/* ── Değer daraltma ──────────────────────────────────────────────────────────
 * `FilterValue` altı şeklin birleşimi ve FilterBar hangisini geri vereceğini
 * `type` üzerinden söylüyor; ama tip düzeyinde söz vermiyor. Kayıtlı bir
 * görünümden veya elle yazılmış bir URL'den bozuk şekil gelebilir — o hâlde alan
 * boş kabul edilir ve ekran çökmez.
 */

/**
 * Dizi değerini enum üyelerine daraltır.
 *
 * `as ListingCategory[]` yazmak derlerdi ama yalan söylerdi: `['uydurma']`
 * dizisi de geçerdi ve hata ancak `LISTING_CATEGORY_LABEL[...]` `undefined`
 * dönünce, üç kat aşağıda görünürdü. Süzgeç, sözleşmenin `string[]` ile
 * `ListingCategory[]` arasındaki gerçek boşluğunu kapatıyor.
 */
function enumDizisi<T extends string>(deger: FilterValue, gecerliler: readonly T[]): T[] {
  if (!Array.isArray(deger)) return []
  const izinliler: readonly string[] = gecerliler
  return deger.filter((uye): uye is T => izinliler.includes(uye))
}

const nesneMi = (deger: FilterValue): deger is DateRange | NumberRange =>
  typeof deger === 'object' && deger !== null && !Array.isArray(deger)

const sayiAraligi = (deger: FilterValue): NumberRange =>
  nesneMi(deger) && ('min' in deger || 'max' in deger) ? deger : {}

const tarihAraligi = (deger: FilterValue): DateRange =>
  nesneMi(deger) && ('from' in deger || 'to' in deger) ? deger : {}

/**
 * `ListingFilterValues` → FilterBar'ın `values` sözlüğü.
 *
 * `minPrice`/`maxPrice` tek bir `numberRange` alanına katlanıyor: iki ayrı sayı
 * kutusu "en az" ile "en çok"un aynı ölçünün iki ucu olduğunu söylemez,
 * `NumberRange` söyler.
 */
function filtreDegerleri(filters: ListingFilterValues): Record<string, FilterValue> {
  const fiyat: NumberRange = {}
  if (filters.minPrice !== undefined) fiyat.min = filters.minPrice
  if (filters.maxPrice !== undefined) fiyat.max = filters.maxPrice

  return {
    categories: filters.categories,
    statuses: filters.statuses,
    price: fiyat,
    currencies: filters.currencies,
    sellerTypes: filters.sellerTypes,
    dateRange: filters.dateRange,
    promotionTypes: filters.promotionTypes,
    reportedOnly: filters.reportedOnly ?? false,
    /*
      Tekli seçim alanları: `undefined` iken FilterBar `''`e daraltıp placeholder
      gösterir. Filtre yalnız `filterOptions` verildiğinde render edilir, ama
      değeri her zaman yazmak zararsız — render edilmeyen alanın değerine
      FilterBar bakmaz.
    */
    cityCode: filters.cityCode,
    districtId: filters.districtId,
    neighborhoodId: filters.neighborhoodId,
    reviewerId: filters.reviewerId,
  }
}

/**
 * FilterBar'ın `onChange(id, value)` bildirimini `ListingFilterValues`'a yazar.
 *
 * Her dal **kendi alanını adıyla yazıyor** ve hesaplanmış anahtar
 * (`{ [id]: deger }`) kullanmıyor. Sebebi ölçüldü ve AGENTS'ta yazılı:
 * hesaplanmış birleşim anahtarı `Partial<T>`'ye giderken değer tipini **hiç
 * denetletmiyor** — `{ [id]: 'bu bir string' }` bir `ListingCategory[]` alanına
 * bile temiz derleniyor. Adıyla yazılan alan yanlış tipte TS2322 verir.
 */
function filtreGuncelle(
  filters: ListingFilterValues,
  id: string,
  deger: FilterValue,
): ListingFilterValues {
  switch (id) {
    case 'categories':
      return { ...filters, categories: enumDizisi(deger, Object.values(ListingCategory)) }

    case 'statuses':
      return { ...filters, statuses: enumDizisi(deger, Object.values(ListingStatus)) }

    case 'currencies':
      return { ...filters, currencies: enumDizisi(deger, Object.values(Currency)) }

    case 'sellerTypes':
      return { ...filters, sellerTypes: enumDizisi(deger, Object.values(SellerType)) }

    case 'promotionTypes':
      return { ...filters, promotionTypes: enumDizisi(deger, Object.values(PromotionType)) }

    case 'dateRange':
      return { ...filters, dateRange: tarihAraligi(deger) }

    case 'price': {
      const aralik = sayiAraligi(deger)
      const sonraki: ListingFilterValues = { ...filters }
      /*
        Silinerek yazılıyor, `undefined` atanarak değil: `exactOptionalPropertyTypes`
        açıkken `minPrice?: number` alanına `number | undefined` atanamaz (TS2375)
        ve "sınır kaldırıldı" ile "sınır boş" aynı şey değil.
      */
      delete sonraki.minPrice
      delete sonraki.maxPrice
      if (aralik.min !== undefined) sonraki.minPrice = aralik.min
      if (aralik.max !== undefined) sonraki.maxPrice = aralik.max
      return sonraki
    }

    case 'reportedOnly':
      return { ...filters, reportedOnly: deger === true }

    /*
      Tekli seçim alanları. Her biri **adıyla** yazılıp siliniyor (hesaplanmış
      anahtar `{ [id]: deger }` değer tipini denetletmezdi — AGENTS). Seçim
      temizlenince (`deger` boş/`undefined`) alan `undefined` atanmaz, **silinir**:
      `exactOptionalPropertyTypes` açıkken `cityCode?: string` alanına
      `string | undefined` atanamaz (TS2375) ve "il kaldırıldı" ile "il boş" aynı
      şey değil.
    */
    case 'cityCode': {
      const sonraki: ListingFilterValues = { ...filters }
      delete sonraki.cityCode
      if (typeof deger === 'string' && deger !== '') sonraki.cityCode = deger
      return sonraki
    }

    case 'districtId': {
      const sonraki: ListingFilterValues = { ...filters }
      delete sonraki.districtId
      if (typeof deger === 'string' && deger !== '') sonraki.districtId = deger
      return sonraki
    }

    case 'neighborhoodId': {
      const sonraki: ListingFilterValues = { ...filters }
      delete sonraki.neighborhoodId
      if (typeof deger === 'string' && deger !== '') sonraki.neighborhoodId = deger
      return sonraki
    }

    case 'reviewerId': {
      const sonraki: ListingFilterValues = { ...filters }
      delete sonraki.reviewerId
      if (typeof deger === 'string' && deger !== '') sonraki.reviewerId = deger
      return sonraki
    }

    /** Tanımı olmayan id: bayat bir kayıtlı görünüm. Sessizce yok sayılır. */
    default:
      return filters
  }
}

/* ── Toplu eylemler ───────────────────────────────────────────────────────── */

interface OnayMetni {
  title: string
  description: string
  confirmLabel: string
  tone: 'neutral' | 'danger'
}

interface TopluEylemTanimi {
  id: string
  label: string
  tone: 'neutral' | 'danger'
  /** Eylemin görünmesi için gereken izin. Yoksa buton **hiç render edilmez**. */
  permission: AdminPermission
  /**
   * Verilirse eylem doğrudan ateşlenmez, önce `ConfirmDialog`'dan geçer.
   *
   * Kural: **ateşleyeni onaylat, adım açanı onaylatma.** Onay/red/arşiv
   * `onBulkAction` çağrıldığı an N ilanın durumunu değiştirir — ConfirmDialog
   * tam olarak bunun için var ("tek tıkla dönülemeyecek işlemler"). Moderatör
   * atama ise bir sonraki adımı açar (kimin atanacağını ekran bilmiyor, bkz.
   * component JSDoc'u); onu onaylatmak, kullanıcıya sonucunu söyleyemediğimiz
   * bir şeyi onaylatmak olurdu.
   */
  onay?: (sayi: string) => OnayMetni
}

/**
 * Ekranın sunabileceği toplu eylemler ve her birinin izni.
 *
 * Brifing 2.3: "Yetkiye göre toplu onay, red, arşivleme veya moderatör atama."
 */
const TOPLU_EYLEMLER: TopluEylemTanimi[] = [
  {
    id: 'approve',
    label: 'Onayla',
    tone: 'neutral',
    permission: AdminPermission.ListingApprove,
    onay: (sayi) => ({
      title: `${sayi} ilanı onayla`,
      description: `Seçili ${sayi} ilan yayına alınacak ve herkese görünür olacak.`,
      confirmLabel: 'Onayla',
      tone: 'neutral',
    }),
  },
  {
    id: 'reject',
    label: 'Reddet',
    tone: 'danger',
    permission: AdminPermission.ListingReject,
    onay: (sayi) => ({
      title: `${sayi} ilanı reddet`,
      description: `Seçili ${sayi} ilan yayından çıkarılacak ve ilan sahiplerine bildirilecek.`,
      confirmLabel: 'Reddet',
      tone: 'danger',
    }),
  },
  {
    id: 'archive',
    label: 'Arşivle',
    /** Arşiv geri alınabilir (`ListingRestore`); yıkıcı stil hak etmiyor. */
    tone: 'neutral',
    permission: AdminPermission.ListingArchive,
    onay: (sayi) => ({
      title: `${sayi} ilanı arşivle`,
      description: `Seçili ${sayi} ilan listeden kaldırılıp arşive taşınacak. Arşivden geri yüklenebilir.`,
      confirmLabel: 'Arşivle',
      tone: 'neutral',
    }),
  },
  {
    id: 'assignReviewer',
    label: 'Moderatör ata',
    tone: 'neutral',
    permission: AdminPermission.ListingAssignReviewer,
  },
]

/**
 * Kullanıcının gerçekten yapabileceği toplu eylemler.
 *
 * **İki kapı:** önce `ListingBulkModerate` ("toplu işlem yapabilir mi"), sonra
 * eylemin kendi izni. İkisi ayrı ayrı gerekli ve bu boş bir formalite değil —
 * `icerikDenetcisi` `ListingApprove`/`ListingReject`'e sahip ama
 * `ListingBulkModerate`'e **değil**: tek tek onaylayabilir, on ikisini birden
 * onaylayamaz. Tek kapı kursaydık kademe sessizce kalkardı.
 *
 * `includes` ile düz sınama burada **doğru araç**: AGENTS'ın "önce tamını sına,
 * sonra sınırlıya düş" kuralı kapsayıcı kademelerle ilgili ve dört kademenin
 * dördü de (`UserViewProfile`, `UserEditProfile`, `UserEditContact`,
 * `ReportTriageLimited`) kullanıcı/şikayet ekseninde — ilan izinlerinin sınırlı
 * kardeşi yok. Varsayılmadı, `ROLE_PERMISSIONS` okunarak doğrulandı.
 */
function kullanilabilirEylemler(izinler: AdminPermission[]): TopluEylemTanimi[] {
  if (!izinler.includes(AdminPermission.ListingBulkModerate)) return []
  return TOPLU_EYLEMLER.filter((eylem) => izinler.includes(eylem.permission))
}

/* ── Kolonlar ─────────────────────────────────────────────────────────────── */

const sayi = (deger: number) => deger.toLocaleString('tr-TR')

/**
 * `PromotionType` → `PromotionFlags`'in o promosyona ait alanı.
 *
 * Eşleme **yazılı**, çünkü tesadüf: `PromotionType.Featured`'ın değeri
 * (`'oneCikan'`) ile `PromotionFlags`'in alan adı bugün aynı, ama bu sözleşmenin
 * verdiği bir garanti değil — biri `domain.ts`'te enum değeri, öteki düz bir
 * interface alanı ve ikisi bağımsız değişebilir. `flags[tip as keyof PromotionFlags]`
 * yazmak derlerdi ve tam da bu kaymayı sessiz hâle getirirdi; `satisfies` ile
 * her iki uç da denetleniyor: enum'a yeni üye eklenirse burada eksik kalır ve
 * TS hata verir. (ListingCard aynı yerde `as` ile geçmişti.)
 */
const PROMOSYON_BAYRAGI = {
  [PromotionType.Featured]: 'oneCikan',
  [PromotionType.Urgent]: 'acil',
  [PromotionType.Showcase]: 'vitrin',
  [PromotionType.HomepageShowcase]: 'anasayfaVitrini',
  [PromotionType.CategoryFeatured]: 'kategoriOneCikan',
} satisfies Record<PromotionType, keyof PromotionFlags>

/** Açık promosyon bayrakları, `PromotionType`'ın bildirim sırasıyla. */
function acikPromosyonlar(flags: PromotionFlags): PromotionType[] {
  return Object.values(PromotionType).filter((tip) => flags[PROMOSYON_BAYRAGI[tip]])
}

/**
 * Tablo sütunları.
 *
 * Brifing 2.3'ün "Görünen veriler" listesi on dört madde; her maddeyi kendi
 * sütununa koymak tabloyu okunmaz kılardı, bu yüzden bağlamı olanlar
 * birleştirildi: alt kategori kategorinin, il/ilçe/mahalle konumun, ilan sahibi
 * adı "Kimden"in altında.
 *
 * **Sütun genişliği verilmiyor.** `ColumnDef.width` var ama yazılacak token yok:
 * ölçü rampasında `space[24]` (6rem) ile `container.sm` (40rem) arası boş ve bir
 * başlık sütunu ~20rem ister. AGENTS bu boşluğu RolePermissionMatrix'te ölçüp
 * "aynı ihtiyaç tekrarlarsa token eklemek doğru olabilir" demişti — **tekrarladı.**
 * Ham `'22rem'` yazmak yerine tarayıcı hizalıyor; dar ekranda tablo zaten
 * kaydırılıyor.
 *
 * **`sortable` burada verilmiyor** — {@link sutunlar} onu `onSortChange`
 * bağlıyken ekliyor. Sıralamayı **tablo yapmaz**: niyeti bildirir, sıralı veriyi
 * `rows`'ta geri bekler (sorgunun işi). `onSortChange` verilmezse hiçbir başlık
 * sıralanabilir olmaz — basınca hiçbir şey yapmayan ölü buton üretmemek için.
 */
const SUTUNLAR: ColumnDef<Listing>[] = [
  {
    id: 'cover',
    header: LISTING_FIELD_LABEL.photos,
    cell: (row) => {
      const kapak = row.photos.find((foto) => foto.isCover) ?? row.photos[0]
      /*
        `alt=""`: kapak dekoratif. Bilgisi ("hangi ilan") yanındaki başlık
        sütununda zaten yazılı; alt metni tekrar etmek ekran okuyucu
        kullanıcısına her satırda aynı cümleyi iki kez okuturdu.
      */
      return kapak !== undefined ? (
        <img className={css.cover} src={kapak.thumbnailUrl} alt="" loading="lazy" />
      ) : (
        <span className={css.coverMissing}>
          <ImageOff size={16} aria-hidden="true" />
          {/* Fotoğrafsızlık bilgi taşır — yayına alınmadan fark edilmeli. */}
          <span className={css.visuallyHidden}>Görsel yok</span>
        </span>
      )
    },
  },
  {
    id: 'listingNo',
    header: LISTING_FIELD_LABEL.listingNo,
    cell: (row) => <span className={css.identifier}>{row.listingNo}</span>,
  },
  {
    id: 'title',
    header: LISTING_FIELD_LABEL.title,
    cell: (row) => <span className={css.cellPrimary}>{row.title}</span>,
  },
  {
    id: 'category',
    header: LISTING_FIELD_LABEL.category,
    cell: (row) => (
      <span className={css.cellStack}>
        <span className={css.cellPrimary}>{LISTING_CATEGORY_LABEL[row.category]}</span>
        <span className={css.cellSecondary}>{LISTING_SUB_CATEGORY_LABEL[row.subCategory]}</span>
      </span>
    ),
  },
  {
    id: 'transactionType',
    header: LISTING_FIELD_LABEL.transactionType,
    cell: (row) => TRANSACTION_TYPE_LABEL[row.transactionType],
  },
  {
    id: 'location',
    header: LISTING_FIELD_LABEL.location,
    cell: (row) => (
      <span className={css.cellStack}>
        <span className={css.cellPrimary}>
          {row.location.districtName}, {row.location.cityName}
        </span>
        <span className={css.cellSecondary}>{row.location.neighborhoodName}</span>
      </span>
    ),
  },
  {
    id: 'price',
    header: LISTING_FIELD_LABEL.price,
    align: 'end',
    /*
      `negotiableSuffix` bilerek eklenmedi: pazarlık payı ilan başına değişen bir
      nüans değil, fixture'ların hepsinde açık — her satıra "(pazarlıklı)"
      yapıştırmak sütunu okunmaz yapardı. Detay ekranının bilgisi.
    */
    cell: (row) => <span className={css.metric}>{formatCurrency(row.price)}</span>,
  },
  {
    id: 'seller',
    header: 'Kimden',
    cell: (row) => (
      <span className={css.cellStack}>
        <span className={css.cellPrimary}>{SELLER_TYPE_LABEL[row.seller.type]}</span>
        {/*
          Avatar **yok**: DataTable'ın kullanıcı kolonuna Avatar koymak
          `Avatar.Fallback`'in baş harflerini satırın metnine sızdırırdı
          ("MED Marmara Emlak…"). Burada gösterilecek şey zaten ad, resim değil.
        */}
        <span className={css.cellSecondary}>{row.seller.displayName}</span>
      </span>
    ),
  },
  {
    id: 'status',
    header: LISTING_FIELD_LABEL.status,
    cell: (row) => <StatusBadge status={row.status} size="sm" showDot />,
  },
  {
    id: 'listingDate',
    header: LISTING_FIELD_LABEL.listingDate,
    cell: (row) => <span className={css.cellSecondary}>{formatDate(row.listingDate)}</span>,
  },
  {
    id: 'updatedAt',
    header: LISTING_FIELD_LABEL.updatedAt,
    cell: (row) => <span className={css.cellSecondary}>{formatDate(row.updatedAt)}</span>,
  },
  {
    id: 'reviewer',
    /*
      Etiket component içinde: `LISTING_FIELD_LABEL`'ın anahtar uzayı
      `keyof Listing` ve "inceleyen" oranın alanı değil — `moderation`'ın
      içinde (`currentReviewerId`). `LOCATION_FIELD_LABEL`'ın yokluğuyla aynı
      desen; sözlük gerekirse taşınmalı.
    */
    header: 'İnceleyen',
    /*
      Ad değil, **atanmışlık** gösteriliyor. Sözleşme yalnız `currentReviewerId`
      (UUID) veriyor, ekran veri çekemez ve admin listesi taşıyan prop yok —
      ham UUID basmak brifingin istediği "İnceleyen moderatör"ü vermez, yalnız
      vermiş gibi yapardı. `ListingCard`'ın `showModerationMeta`'sı ("İnceleyen
      atanmış") aynı boşlukta aynı kararı vermişti. Ad istenirse
      `reviewers?: AdminSummary[]` gibi bir kanal gerekir.
    */
    cell: (row) =>
      row.moderation.currentReviewerId !== undefined ? (
        <span className={css.cellPrimary}>Atanmış</span>
      ) : (
        <span className={css.empty}>—</span>
      ),
  },
  {
    id: 'promotions',
    header: LISTING_FIELD_LABEL.promotionFlags,
    /*
      `PromotionFlagsPanel` kullanılmadı — brifing 2.3 onu türetilen component
      sayıyor ama panelin kendi JSDoc'u "ilan listesinde düzenleme yok" diyor ve
      salt okunur hâli bile bir özet **tablosu** çiziyor: satır başına bir tablo,
      12 satırda 12 iç içe tablo. Hücreye sığan gösterim rozettir.
    */
    cell: (row) => {
      const acik = acikPromosyonlar(row.promotionFlags)
      if (acik.length === 0) return <span className={css.empty}>—</span>
      return (
        <span className={css.badgeList}>
          {acik.map((tip) => (
            <Badge key={tip} tone="primary" variant="soft" size="sm">
              {PROMOTION_TYPE_LABEL[tip]}
            </Badge>
          ))}
        </span>
      )
    },
  },
  {
    id: 'viewCount',
    header: LISTING_METRIC_LABEL.viewCount,
    align: 'end',
    cell: (row) => <span className={css.metric}>{sayi(row.metrics.viewCount)}</span>,
  },
  {
    id: 'reportCount',
    header: LISTING_METRIC_LABEL.reportCount,
    align: 'end',
    cell: (row) =>
      row.metrics.reportCount > 0 ? (
        <Badge tone="danger" variant="soft" size="sm">
          {sayi(row.metrics.reportCount)}
        </Badge>
      ) : (
        <span className={css.metric}>0</span>
      ),
  },
]

/**
 * Sunucudan sıralı veri istenebilen sütunların kimlikleri.
 *
 * Tek bir alana bağlı ve doğal sırası olanlar: kimlik, başlık, fiyat, durum,
 * tarihler ve sayaçlar. **Dışarıda kalanlar** dekoratif (`cover`) ya da bileşik
 * (`category`, `location`, `seller` iki alanı birleştiriyor; `promotions` bir
 * bayrak kümesi) — hangi alana göre sıralanacağı belirsiz olduğundan başlığı
 * sıralanabilir göstermek yanıltıcı olurdu.
 */
const SIRALANABILIR_SUTUN_IDLERI: ReadonlySet<string> = new Set([
  'listingNo',
  'title',
  'price',
  'status',
  'listingDate',
  'updatedAt',
  'viewCount',
  'reportCount',
])

/**
 * Kolonları döndürür; `siralanabilir` iken uygun başlıkları sıralama düğmesine
 * çevirir.
 *
 * `false` iken {@link SUTUNLAR}'ın **kendisini** verir (yeni dizi üretmez) — Faz 3
 * davranışı: `onSortChange` bağlı değilken hiçbir başlık buton olmaz. Sıralama
 * kanalı bağlıyken yalnız {@link SIRALANABILIR_SUTUN_IDLERI}'ndeki sütunlar
 * `sortable` alır.
 */
function sutunlar(siralanabilir: boolean): ColumnDef<Listing>[] {
  if (!siralanabilir) return SUTUNLAR
  return SUTUNLAR.map((sutun) =>
    SIRALANABILIR_SUTUN_IDLERI.has(sutun.id) ? { ...sutun, sortable: true } : sutun,
  )
}

/**
 * Satır seçim kutusunun erişilebilir etiketi.
 *
 * `DataTableProps.rowLabel` brifingden sapma olarak eklenmişti; sebebi tam olarak
 * bu ekran: etiket verilmezse ekran okuyucu kullanıcısı 12 satırda da "1. satırı
 * seç", "2. satırı seç" duyar ve hangi ilanı seçtiğini bilmez.
 */
const satirEtiketi = (row: Listing) => `${row.title} ilanını seç`

/* ── Ekran ────────────────────────────────────────────────────────────────── */

/**
 * İlan listesi: filtre, tablo, seçim ve toplu işlemler (brifing 2.3).
 *
 * **Veri çekmez.** `state: AsyncState<Paginated<Listing>>` prop'tan gelir;
 * sıralama, sayfalama ve süzme sorgunun işidir, ekran yalnız niyeti bildirir.
 *
 * **Kabuk değildir.** `AppShell`/`TopBar`/`SidebarNav`/`PageHeader` render
 * etmez, dolayısıyla `<h1>`'i yoktur: en üst başlığı `<h2>`. Sayfanın `<h1>`'i
 * kabuğundur.
 *
 * **Kart / tablo kararı DataTable'ındır.** `mobileMode="cards"` artık viewport'a
 * kendisi bakıyor: 48rem'in altında kart, üstünde tablo çiziyor ve iki dalı da
 * DOM'da tutup birini medya sorgusuyla boyuyor. Ekran bu yüzden tek `DataTable`
 * veriyor — eski `cardsView`/`tableView` çift-render telafisi kalktı. DOM
 * viewport'tan bağımsız kaldığı için `{ hidden: true }` sorguları hâlâ iki dalı
 * da görür; brifing 3.5'in üç düzeni (mobil kart, tablet/masaüstü tablo) çalışır.
 *
 * **Yetki kapıları eylemi gizler, kilitlemez.** Toplu onay/red/arşiv/atama
 * `availablePermissions`'a bakar; yetkisi olmayan kullanıcı butonu `disabled`
 * görmez, **hiç görmez**. Hiçbir toplu eylem kalmıyorsa seçim kutuları da
 * çıkmaz: seçim yalnız toplu işlem içindir ve seçilip hiçbir şey yapılamayan
 * satır boş bir vaat olurdu.
 *
 * `filteredEmpty` `AsyncState`'in üyesi değil, {@link filtreAktifMi} ile
 * türetiliyor — gerekçesi orada.
 *
 * **Sıralama ve konum/inceleyen filtreleri opsiyonel kanallar** (Faz 3'te
 * yoktu). `onSortChange` bağlıyken uygun başlıklar sıralama düğmesine döner
 * ({@link sutunlar}); verilmezse hiçbir başlık buton olmaz. `filterOptions`
 * verildikçe il/ilçe/mahalle ve inceleyen filtreleri seçenek üretir
 * ({@link filtreTanimlari}); verilmezse o filtreler render edilmez.
 *
 * @example
 * <ListingListPage
 *   state={{ status: 'success', data: sayfa }}
 *   filters={filtreler}
 *   selectedIds={secili}
 *   availablePermissions={ROLE_PERMISSIONS[AdminRole.Moderator]}
 *   onFiltersChange={setFiltreler}
 *   onSelectionChange={setSecili}
 *   onPageChange={setSayfa}
 *   onListingOpen={(ilan) => navigate(`/ilanlar/${ilan.id}`)}
 *   onBulkAction={topluIslem}
 *   onRetry={refetch}
 * />
 */
export function ListingListPage({
  state,
  filters,
  selectedIds,
  availablePermissions,
  filterOptions,
  sort,
  onSortChange,
  onFiltersChange,
  onSelectionChange,
  onPageChange,
  onListingOpen,
  onBulkAction,
  onRetry,
}: ListingListPageProps) {
  /** Onay bekleyen toplu eylem. Dialog kapanınca taslak diye saklanacak bir şey yok. */
  const [onaylanacak, setOnaylanacak] = useState<TopluEylemTanimi | undefined>(undefined)

  const eylemler = kullanilabilirEylemler(availablePermissions)
  const secilebilir = eylemler.length > 0

  /*
    `onSortChange` bağlı değilse hiçbir başlık sıralanabilir olmaz (ölü buton
    yok). Bu yüzden `sort`/`onSortChange` ile `sortable` **tek karardan** çıkar:
    kolonlar `onSortChange`'in varlığına göre türetiliyor.
  */
  const sutunListesi = sutunlar(onSortChange !== undefined)

  /**
   * Ekranda gösterilecek seçim.
   *
   * Yetkisi olmayan kullanıcıda **boş**, `selectedIds` ne derse desin: kutu
   * gösterilmediği hâlde satırı seçili boyamak, kullanıcıya kaldıramayacağı bir
   * işaret verirdi — seçimi bozan kontrol ortada yok. Çağıranın state'i
   * değiştirilmiyor, yalnız bu ekranda karşılığı olmayan bir şey çizilmiyor.
   */
  const gorunenSecim = secilebilir ? selectedIds : []

  const baslik = <h2 className={css.heading}>İlanlar</h2>

  /* ── Filtre olayları ── */

  const aramaDegisti = (deger: string) => {
    const sonraki: ListingFilterValues = { ...filters }
    if (deger === '') delete sonraki.query
    else sonraki.query = deger
    onFiltersChange(sonraki)
  }

  /**
   * Seçim **bilerek** temizlenmiyor.
   *
   * Filtre değişince görünen satırlar değişir ama seçimin sahibi çağırandır ve
   * sayfalar arası seçimi sürdürmek isteyebilir; ekran onun adına karar veremez.
   */
  const filtreleriTemizle = () => onFiltersChange(bosFiltreler())

  const aracCubugu = (
    <div className={css.toolbar}>
      <div className={css.searchField}>
        {/*
          Kontrollü kullanım: `onSearch` (SearchInput'un kendi geciktirmesi)
          bilerek bağlanmadı. Değerin sahibi `filters.query`; `onSearch` her
          tuşta değil aralıklarla haber verdiği için kutu ile prop arasında
          gecikme kalır ve kutu kontrolsüzleşir. Geciktirme zaten sayfa
          katmanının işi (FilterBar'ın sözleşmesi de böyle diyor).

          `onClear` yalnız haber verir — SearchInput kontrollü kullanımda kendini
          temizlemez, değeri sıfırlamak çağıranın işi (TopBar'daki kalıbın aynısı).
        */}
        <SearchInput
          label="İlan ara"
          placeholder="İlan no, başlık veya kullanıcı"
          value={filters.query ?? ''}
          onChange={(event) => aramaDegisti(event.target.value)}
          onClear={() => aramaDegisti('')}
        />
      </div>

      <FilterBar
        definitions={filtreTanimlari(filterOptions)}
        values={filtreDegerleri(filters)}
        activeFilterCount={aktifFiltreSayisi(filters)}
        onChange={(id, deger) => onFiltersChange(filtreGuncelle(filters, id, deger))}
        onClear={filtreleriTemizle}
      />
    </div>
  )

  /* ── Veri yerine ne gösterileceği ── */

  if (state.status === 'unauthorized') {
    return (
      <div className={css.root}>
        {baslik}
        <div className={css.stateBlock}>
          {/*
            Tekrar deneme **yok** ve olamaz: `unauthorized`'ın `retryable`'ı tip
            düzeyinde `false`. 403'ü tekrar denemek aynı 403'ü verir; buton
            kullanıcıyı döngüye sokardı.

            Araç çubuğu da yok: göremediğin listeyi süzmenin anlamı yok.
          */}
          <ErrorState
            variant="page"
            title={state.error.title}
            description={state.error.message}
            {...(state.error.code !== undefined && { code: state.error.code })}
          />
          <a className={css.backLink} href={GUVENLI_DONUS}>
            Panele dön
          </a>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={css.root}>
        {baslik}
        {/*
          İki kapı: hata tekrar denenebilir **olmalı** ve tekrar denemeyi
          yapabilen bir kanal bağlı olmalı. İkincisi burada tip düzeyinde
          garantili (`onRetry` zorunlu prop), ama gate yine de açıkça yazılıyor —
          `retryable: false` bir hatada buton çıkarsa kullanıcı aynı duvara
          tekrar tekrar çarpar.
        */}
        <ErrorState
          variant="page"
          title={state.error.title}
          description={state.error.message}
          {...(state.error.code !== undefined && { code: state.error.code })}
          {...(state.error.retryable && { onRetry })}
        />
      </div>
    )
  }

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <div className={css.root}>
        {baslik}
        {aracCubugu}
        {/*
          Tek tablo, çift değil: DataTable'ın `loading` dalı `cards` dalından
          **önce** geliyor, yani `mobileMode="cards"` verilse bile iskelet yine
          tablo iskeleti olur. İki dal da aynı DOM'u üretecekken ikisini birden
          çizmek yalnız kopya üretirdi.

          Brifing 2.3: "Tablo başlığı korunur, satır skeleton'ları gösterilir."
          Başlığı koruyan DataTable'ın kendisi.

          **`selectable` bilerek verilmiyor** ve bu yalnız bir sadeleştirme değil,
          ölçülmüş bir a11y ihlalinin kapatılması: DataTable'ın `loading` dalı
          `selectable` iken seçim sütununa **boş bir `<th>`** basıyor
          (`DataTable.tsx:117`) — "tümünü seç" kutusunu ancak satırları olan tablo
          dalı çiziyor. axe bunu `empty-table-header` sayıyor ve kapı `'error'`;
          ihlal story artefaktı değil, **uygulamada da doğar**: seçilebilir her
          tablo yüklenirken ekran okuyucu kullanıcısı adsız bir sütun duyar.

          Yüklenirken seçilecek bir şey zaten yok (`rows={[]}`, `selectedIds` ve
          `onSelectionChange` de verilmiyor), yani `selectable` burada işlevi olan
          bir sütun değil yalnız boş bir hücre üretiyordu. Bedeli veri gelince
          seçim sütununun eklenmesi — DataTable'ın "düzen zıplamaz" sözünün bir
          sütunluk kısmı; karşılığı adsız sütun başlığının hiç doğmaması.

          **Kalıcı çözüm DataTable'da**: `loading` dalı ya devre dışı bir "Tümünü
          seç" kutusu ya da görsel olarak gizli bir başlık metni basmalı. O dosya
          bu turda yazılmadı — RAPOR EDİLDİ.
        */}
        <DataTable<Listing>
          rows={[]}
          columns={SUTUNLAR}
          visualStyle="bordered"
          stickyHeader
          loading
        />
      </div>
    )
  }

  if (state.status === 'empty') {
    return (
      <div className={css.root}>
        {baslik}
        {aracCubugu}
        {/*
          `DataTableProps.emptyState` yerine ekran seviyesinde: boş durumun
          kart/tablo ayrımı yok ve iki DataTable'a birden vermek "Filtreleri
          temizle" butonunu DOM'da ikiye katlardı.
        */}
        {filtreAktifMi(filters) ? (
          <EmptyState
            variant="filtered"
            title="Filtrelere uyan ilan yok"
            description="Seçtiğiniz filtrelerle eşleşen bir ilan bulunamadı. Filtreleri gevşetin veya tümünü temizleyin."
            primaryAction={
              <Button variant="secondary" onClick={filtreleriTemizle}>
                Filtreleri temizle
              </Button>
            }
          />
        ) : (
          /*
            Ana eylem **yok**: brifing 2.1 "filtre temizleme veya ana eylem"
            diyor, ama temizlenecek filtre yok ve ilan oluşturmayı bildiren bir
            kanal da (`onListingCreate` gibi) sözleşmede yok. Ekranın yapamadığı
            bir şeyi öneren buton koymaktansa durumu açıklamak doğrusu.
          */
          <EmptyState
            variant="default"
            title="Henüz ilan yok"
            description="Bu panelde gösterilecek bir ilan bulunmuyor. Kullanıcılar ilan oluşturdukça burada listelenir."
          />
        )}
      </div>
    )
  }

  /* ── success | partialSuccess ── */

  const veri: Partial<Paginated<Listing>> = state.data
  const satirlar = veri.items ?? []
  const bayat = state.status === 'success' && state.stale === true

  /**
   * `partialSuccess` brifing 2.3'ün saydığı bir durum değil (dashboard için
   * tasarlandı: her grafik ayrı sorgu). Tek bir sayfalı listede kısmilik ancak
   * "satırlar geldi, sayaç gelmedi" gibi olabilir — sözleşme onu mümkün kıldığı
   * için ele alınıyor: gelen kısım gösteriliyor, gelmeyeni uyarı söylüyor.
   */
  const kismiHatalar: UiError[] =
    state.status === 'partialSuccess'
      ? Object.values(state.errors).filter((hata): hata is UiError => hata !== undefined)
      : []

  const topluEylem = (id: string) => {
    const eylem = eylemler.find((aday) => aday.id === id)
    if (eylem === undefined) return
    if (eylem.onay === undefined) {
      onBulkAction(eylem.id, selectedIds)
      return
    }
    setOnaylanacak(eylem)
  }

  const onayMetni = onaylanacak?.onay?.(sayi(selectedIds.length))

  const tanimlar: BulkActionDefinition[] = eylemler.map((eylem) => ({
    id: eylem.id,
    label: eylem.label,
    tone: eylem.tone,
  }))

  return (
    <div className={css.root}>
      <div className={css.header}>
        {baslik}
        {veri.totalItems !== undefined ? (
          <p className={css.summary}>{sayi(veri.totalItems)} ilan</p>
        ) : null}
      </div>

      {aracCubugu}

      {bayat ? (
        /*
          Kapatılabilir **değil**: kalıcı bir sorunu kapatılabilir yapmak
          kullanıcıya sorunu değil uyarıyı kapattırır. Veri hâlâ bayat.
        */
        <Alert
          tone="warning"
          title="Liste güncellenemedi"
          description="Aşağıdaki ilanlar son başarılı yüklemeden geliyor; yeni değişiklikleri göstermiyor olabilir."
          action={
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Tekrar dene
            </Button>
          }
        />
      ) : null}

      {kismiHatalar.length > 0 ? (
        <Alert
          tone="warning"
          title="Listenin bir bölümü yüklenemedi"
          description={kismiHatalar.map((hata) => hata.message).join(' ')}
        />
      ) : null}

      {/*
        Tek DataTable, çift değil: `mobileMode="cards"` artık viewport'a kendisi
        bakıyor (48rem'in altında kart, üstünde tablo — eşik AppShell/FilterBar
        ile aynı) ve iki dalı da DOM'da tutup birini medya sorgusuyla boyuyor.
        Ekranın eskiden yaptığı `cardsView`/`tableView` çift-render telafisi bu
        yüzden kalktı; `renderMobileCard` kart dalını, `visualStyle`/`stickyHeader`/
        `onRowClick` tablo dalını besliyor.
      */}
      <div className={css.listView}>
        <DataTable<Listing>
          rows={satirlar}
          columns={sutunListesi}
          visualStyle="striped"
          stickyHeader
          mobileMode="cards"
          {...(sort !== undefined && { sort })}
          {...(onSortChange !== undefined && { onSortChange })}
          selectable={secilebilir}
          selectedIds={gorunenSecim}
          onSelectionChange={onSelectionChange}
          rowLabel={satirEtiketi}
          onRowClick={onListingOpen}
          renderMobileCard={(row) => (
            <ListingCard
              listing={row}
              variant="detailed"
              selected={gorunenSecim.includes(row.id)}
              flagged={row.metrics.reportCount > 0}
              showModerationMeta
              onClick={onListingOpen}
              {...(secilebilir && {
                onSelectedChange: (secili: boolean) =>
                  onSelectionChange(
                    secili ? [...selectedIds, row.id] : selectedIds.filter((id) => id !== row.id),
                  ),
              })}
            />
          )}
        />
      </div>

      {/*
        `pageSize`/`page` gelmediyse (partialSuccess) satır sayısına düşülüyor:
        `pageSize: 0` `Math.ceil(n / 0)` ile sonsuz sayfa üretirdi.
        `pageSizeOptions` verilmiyor — `onPageSizeChange`'in kanalı sözleşmede yok
        ve seçiciyi çıkarıp boyutu değiştirememek sessiz bir bozukluk olurdu.
      */}
      <Pagination
        page={veri.page ?? 1}
        pageSize={Math.max(1, veri.pageSize ?? satirlar.length)}
        totalItems={veri.totalItems ?? satirlar.length}
        onPageChange={onPageChange}
      />

      {/*
        `floating`, `sticky` değil: `position: sticky` en yakın kaydırma kabına
        yapışır ve bu ekranın kabı AppShell'in `main`'i — ≥48rem'de kaydırma kabı,
        altında değil. `floating` (`position: fixed`) viewport'a çıpalanır ve
        kabın kim olduğunu bilmek zorunda kalmaz.

        `selectedCount === 0` iken component kendini render etmiyor; kapı burada
        yalnız yetkiyle ilgili.
      */}
      {secilebilir ? (
        <BulkActionBar
          selectedCount={selectedIds.length}
          actions={tanimlar}
          onAction={topluEylem}
          onClearSelection={() => onSelectionChange([])}
        />
      ) : null}

      {onaylanacak !== undefined && onayMetni !== undefined ? (
        <ConfirmDialog
          open
          title={onayMetni.title}
          description={onayMetni.description}
          confirmLabel={onayMetni.confirmLabel}
          tone={onayMetni.tone}
          onConfirm={() => {
            onBulkAction(onaylanacak.id, selectedIds)
            setOnaylanacak(undefined)
          }}
          onCancel={() => setOnaylanacak(undefined)}
        />
      ) : null}
    </div>
  )
}
