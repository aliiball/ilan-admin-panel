import {
  ListingCategory,
  type BuildingAttributes,
  type CommercialAttributes,
  type LandAttributes,
  type Listing,
  type Money,
  type ResidentialAttributes,
  type TimeshareAttributes,
  type TourismFacilityAttributes,
} from '../../../types/domain'
import {
  BUILDING_AGE_LABEL,
  BUILDING_ATTRIBUTE_LABEL,
  BUILDING_CONDITION_LABEL,
  BUILDING_USAGE_TYPE_LABEL,
  COMMERCIAL_ATTRIBUTE_LABEL,
  COMMERCIAL_OPEN_PLAN_LABEL,
  FLOOR_LOCATION_LABEL,
  HEATING_TYPE_LABEL,
  INFRASTRUCTURE_TYPE_LABEL,
  LAND_ATTRIBUTE_LABEL,
  LISTING_CATEGORY_LABEL,
  LISTING_FIELD_LABEL,
  LISTING_SOURCE_LABEL,
  LISTING_STATUS_LABEL,
  LISTING_SUB_CATEGORY_LABEL,
  LOAN_ELIGIBILITY_LABEL,
  OCCUPANCY_STATUS_LABEL,
  PARKING_TYPE_LABEL,
  RESIDENTIAL_ATTRIBUTE_LABEL,
  ROOM_COUNT_LABEL,
  TIMESHARE_ATTRIBUTE_LABEL,
  TIMESHARE_SEASON_LABEL,
  TITLE_DEED_STATUS_LABEL,
  TOURISM_FACILITY_ATTRIBUTE_LABEL,
  TRANSACTION_TYPE_LABEL,
  ZONING_STATUS_LABEL,
} from '../../../domain/labels'
import { formatCurrency, negotiableSuffix } from '../../../utils/formatCurrency'
import { formatDateTime } from '../../../utils/formatDateTime'
import { Badge } from '../../primitives/Badge'
import type { ListingFactsProps } from '../../../types/component-props'
import * as css from './ListingFacts.css'

/**
 * Biçimlenmiş bir alan değeri. `null` = **ilanda o değer yok.**
 *
 * Boş metinden ayrı tutuluyor: `''` bir değerdir (kullanıcı boş bıraktı),
 * `null` alanın hiç doldurulmadığıdır. Moderatör için ikisi aynı şey değil.
 */
type Deger = string | null

interface Fact {
  /**
   * `highlightedFields`'ın eşleştiği yol: `price`, `attributes.roomCount`.
   * Sözleşmedeki "noktalı yol" tanımıyla birebir.
   */
  key: string
  label: string
  value: Deger
}

interface Bolum {
  /** Karşılaştırmada iki revizyonun bölümleri bu kimlikle eşleşir. */
  id: string
  title: string
  facts: Fact[]
}

/** Karşılaştırmada tek bir alanın iki revizyondaki hâli. */
interface KarsilastirmaSatiri {
  key: string
  label: string
  onceki: Deger
  yeni: Deger
}

interface KarsilastirmaBolumu {
  id: string
  title: string
  satirlar: KarsilastirmaSatiri[]
}

/**
 * Izgarada tam satır kaplayan alanlar.
 *
 * Başlık ve açıklama cümledir; 14 rem'lik bir ızgara gözünde on satıra bölünüp
 * yanındaki "Oda Sayısı: 3+1"i ekranın dışına iter. `Fact`'e opsiyonel bir
 * `wide` alanı koymak yerine burada duruyorlar: hangi alanların uzun metin
 * olduğu ilana değil şemaya bağlı, ilan başına değişmiyor.
 */
const GENIS_ALANLAR: ReadonlySet<string> = new Set(['title', 'description'])

/** `1.250`. Yerel ayar sabit — makinenin diline bırakılırsa `1,250` okunur. */
function sayi(deger: number): string {
  return deger.toLocaleString('tr-TR')
}

function metrekare(deger: number): string {
  return `${sayi(deger)} m²`
}

function metre(deger: number): string {
  return `${sayi(deger)} m`
}

/** Fiyat + pazarlık payı. `Intl` kurulmuyor; biçim `utils/formatCurrency`'nin işi. */
function para(deger: Money): string {
  return `${formatCurrency(deger)}${negotiableSuffix(deger)}`
}

/** `hasBalcony`, `hasElevator`, `hasOperatingLicense` gibi "sahip mi" alanları. */
function varYok(deger: boolean): string {
  return deger ? 'Var' : 'Yok'
}

/** `furnished`, `swapAccepted`, `inComplex` gibi "öyle mi" alanları. */
function evetHayir(deger: boolean): string {
  return deger ? 'Evet' : 'Hayır'
}

/** Opsiyonel alan: değer yoksa satır kalır, değeri `—` olur (bkz. component JSDoc'u). */
function opsiyonel<T>(deger: T | undefined, bicimle: (girdi: T) => string): Deger {
  return deger === undefined ? null : bicimle(deger)
}

/**
 * Bir öznitelik sözlüğünü (`*_ATTRIBUTE_LABEL`) değerleriyle eşleyip `Fact[]` üretir.
 *
 * Çağıran taraf değer nesnesini `satisfies Record<keyof XAttributes, Deger>` ile
 * yazıyor: domain'e yeni bir öznitelik eklenirse **hem** `labels.ts` (etiket yok)
 * **hem** burası (değer yok) derleme hatası verir. Panel yeni alanı sessizce
 * atlayamaz — brifing 1.1'in alan tabloları ile ekran arasındaki bağ budur.
 *
 * Sıra nesnenin yazım sırasıdır ve sözlükler brifing 1.1'in tablo sırasında;
 * "Brüt m², Net m², Oda Sayısı..." ekranda da o sırada okunur.
 */
function ozellikFactleri(labels: Record<string, string>, degerler: Record<string, Deger>): Fact[] {
  const facts: Fact[] = []

  for (const [alan, deger] of Object.entries(degerler)) {
    const label = labels[alan]

    /*
      Ulaşılamaz: iki sözlük de aynı arayüzün `keyof`'undan üretiliyor, biri
      etiketi biri değeri veriyor ve ikisi de `satisfies` ile eksiksiz. Yine de
      `noUncheckedIndexedAccess` dinamik anahtarda `undefined` ihtimalini soruyor.
      Alan adını ("grossSquareMeters") etiket diye basmaktansa satırı atlıyoruz:
      moderatöre makine adı göstermek, alanı hiç göstermemekten daha kötü.
    */
    if (label === undefined) continue

    facts.push({ key: `attributes.${alan}`, label, value: deger })
  }

  return facts
}

function konutOzellikleri(attributes: ResidentialAttributes): Fact[] {
  return ozellikFactleri(RESIDENTIAL_ATTRIBUTE_LABEL, {
    grossSquareMeters: metrekare(attributes.grossSquareMeters),
    netSquareMeters: metrekare(attributes.netSquareMeters),
    roomCount: ROOM_COUNT_LABEL[attributes.roomCount],
    buildingAge: BUILDING_AGE_LABEL[attributes.buildingAge],
    floorLocation: FLOOR_LOCATION_LABEL[attributes.floorLocation],
    floorCount: sayi(attributes.floorCount),
    heatingType: HEATING_TYPE_LABEL[attributes.heatingType],
    bathroomCount: sayi(attributes.bathroomCount),
    hasBalcony: varYok(attributes.hasBalcony),
    hasElevator: varYok(attributes.hasElevator),
    parkingType: PARKING_TYPE_LABEL[attributes.parkingType],
    furnished: evetHayir(attributes.furnished),
    occupancyStatus: OCCUPANCY_STATUS_LABEL[attributes.occupancyStatus],
    inComplex: evetHayir(attributes.inComplex),
    complexName: attributes.complexName ?? null,
    monthlyFee: opsiyonel(attributes.monthlyFee, para),
    loanEligibility: LOAN_ELIGIBILITY_LABEL[attributes.loanEligibility],
    titleDeedStatus: TITLE_DEED_STATUS_LABEL[attributes.titleDeedStatus],
    swapAccepted: evetHayir(attributes.swapAccepted),
  } satisfies Record<keyof ResidentialAttributes, Deger>)
}

function arsaOzellikleri(attributes: LandAttributes): Fact[] {
  return ozellikFactleri(LAND_ATTRIBUTE_LABEL, {
    squareMeters: metrekare(attributes.squareMeters),
    zoningStatus: ZONING_STATUS_LABEL[attributes.zoningStatus],
    block: attributes.block ?? null,
    parcel: attributes.parcel ?? null,
    mapSheet: attributes.mapSheet ?? null,
    /* KAKS ondalıklı (`0,4`); `metrekare`/`metre` gibi birim almaz, oransızdır. */
    floorAreaRatio: opsiyonel(attributes.floorAreaRatio, sayi),
    maxBuildingHeightMeters: opsiyonel(attributes.maxBuildingHeightMeters, metre),
    /*
      m² fiyatı tek yerde kuruş gösteriyor: `1.847,39 ₺`. Toplam fiyatta kuruş
      gizli (gayrimenkul fiyatı tam sayıdır) ama m² fiyatı bölmeyle çıkıyor ve
      yuvarlanırsa `fiyat / m²` tutmaz — brifing 1.1 tutarlılığı şart koşuyor.
      Pazarlık payı burada tekrarlanmıyor: aynı ilanın tek bir pazarlık durumu
      var ve o, "Fiyat" satırında zaten yazıyor.
    */
    pricePerSquareMeter: formatCurrency(attributes.pricePerSquareMeter, {
      maximumFractionDigits: 2,
    }),
    roadFrontageMeters: opsiyonel(attributes.roadFrontageMeters, metre),
    /*
      Boş dizi `—` değil "Yok": altyapı zorunlu bir alan, boşluğu "girilmedi"
      değil "hiçbiri yok" demek. Arsada bu bir bulgudur, eksik veri değil.
    */
    infrastructure:
      attributes.infrastructure.length === 0
        ? 'Yok'
        : attributes.infrastructure.map((tip) => INFRASTRUCTURE_TYPE_LABEL[tip]).join(', '),
  } satisfies Record<keyof LandAttributes, Deger>)
}

function isyeriOzellikleri(attributes: CommercialAttributes): Fact[] {
  return ozellikFactleri(COMMERCIAL_ATTRIBUTE_LABEL, {
    squareMeters: metrekare(attributes.squareMeters),
    /*
      İşyerinin oda sayısı `number | 'acikPlan'`; `typeof` ile daraltılıyor.
      Ham `'acikPlan'` basılsaydı ekranda kod görünürdü — etiketi domain'de.
    */
    roomCount:
      typeof attributes.roomCount === 'number'
        ? sayi(attributes.roomCount)
        : COMMERCIAL_OPEN_PLAN_LABEL,
    floorCount: sayi(attributes.floorCount),
    floorLocation: opsiyonel(attributes.floorLocation, (kat) => FLOOR_LOCATION_LABEL[kat]),
    heatingType: HEATING_TYPE_LABEL[attributes.heatingType],
    deposit: opsiyonel(attributes.deposit, para),
    buildingCondition: BUILDING_CONDITION_LABEL[attributes.buildingCondition],
    hasElevator: varYok(attributes.hasElevator),
    parkingType: PARKING_TYPE_LABEL[attributes.parkingType],
    furnished: evetHayir(attributes.furnished),
    monthlyFee: opsiyonel(attributes.monthlyFee, para),
    transferFee: opsiyonel(attributes.transferFee, para),
    occupancyStatus: OCCUPANCY_STATUS_LABEL[attributes.occupancyStatus],
  } satisfies Record<keyof CommercialAttributes, Deger>)
}

function binaOzellikleri(attributes: BuildingAttributes): Fact[] {
  return ozellikFactleri(BUILDING_ATTRIBUTE_LABEL, {
    totalSquareMeters: metrekare(attributes.totalSquareMeters),
    netSquareMeters: opsiyonel(attributes.netSquareMeters, metrekare),
    buildingAge: BUILDING_AGE_LABEL[attributes.buildingAge],
    floorCount: sayi(attributes.floorCount),
    independentUnitCount: sayi(attributes.independentUnitCount),
    hasOccupancyPermit: varYok(attributes.hasOccupancyPermit),
    hasElevator: varYok(attributes.hasElevator),
    parkingType: PARKING_TYPE_LABEL[attributes.parkingType],
    heatingType: HEATING_TYPE_LABEL[attributes.heatingType],
    usageType: BUILDING_USAGE_TYPE_LABEL[attributes.usageType],
    monthlyRentalIncome: opsiyonel(attributes.monthlyRentalIncome, para),
    titleDeedStatus: TITLE_DEED_STATUS_LABEL[attributes.titleDeedStatus],
    swapAccepted: evetHayir(attributes.swapAccepted),
  } satisfies Record<keyof BuildingAttributes, Deger>)
}

function devremulkOzellikleri(attributes: TimeshareAttributes): Fact[] {
  return ozellikFactleri(TIMESHARE_ATTRIBUTE_LABEL, {
    facilityName: attributes.facilityName,
    squareMeters: metrekare(attributes.squareMeters),
    roomCount: ROOM_COUNT_LABEL[attributes.roomCount],
    usagePeriod: attributes.usagePeriod,
    usageDays: `${sayi(attributes.usageDays)} gün`,
    season: TIMESHARE_SEASON_LABEL[attributes.season],
    annualMaintenanceFee: para(attributes.annualMaintenanceFee),
    titleDeedStatus: TITLE_DEED_STATUS_LABEL[attributes.titleDeedStatus],
    exchangeProgram: attributes.exchangeProgram ?? null,
    furnished: evetHayir(attributes.furnished),
  } satisfies Record<keyof TimeshareAttributes, Deger>)
}

function turistikTesisOzellikleri(attributes: TourismFacilityAttributes): Fact[] {
  return ozellikFactleri(TOURISM_FACILITY_ATTRIBUTE_LABEL, {
    roomCount: sayi(attributes.roomCount),
    bedCount: sayi(attributes.bedCount),
    starRating: opsiyonel(attributes.starRating, sayi),
    floorCount: sayi(attributes.floorCount),
    indoorSquareMeters: metrekare(attributes.indoorSquareMeters),
    outdoorSquareMeters: metrekare(attributes.outdoorSquareMeters),
    buildingAge: BUILDING_AGE_LABEL[attributes.buildingAge],
    hasOperatingLicense: varYok(attributes.hasOperatingLicense),
    hasAlcoholLicense: varYok(attributes.hasAlcoholLicense),
    distanceToBeachMeters: opsiyonel(attributes.distanceToBeachMeters, metre),
    buildingCondition: BUILDING_CONDITION_LABEL[attributes.buildingCondition],
    furnished: evetHayir(attributes.furnished),
    parkingType: PARKING_TYPE_LABEL[attributes.parkingType],
    transferIncluded: evetHayir(attributes.transferIncluded),
    annualRevenue: opsiyonel(attributes.annualRevenue, para),
  } satisfies Record<keyof TourismFacilityAttributes, Deger>)
}

/**
 * Kategoriye özel öznitelikler — birleşimin daraltıldığı tek yer.
 *
 * `switch (listing.category)` `attributes`'ı da beraberinde daraltıyor: `case
 * Land` içinde `listing.attributes` `LandAttributes`'tır, `as` gerekmez. Altı
 * dalın hepsi yazıldığı için `default` yok; domain'e yedinci bir kategori
 * eklenirse fonksiyon "hiçbir şey döndürmeyen yol var" diye derlenmez.
 */
function kategoriOzellikleri(listing: Listing): Fact[] {
  switch (listing.category) {
    case ListingCategory.Residential:
      return konutOzellikleri(listing.attributes)
    case ListingCategory.Land:
      return arsaOzellikleri(listing.attributes)
    case ListingCategory.Commercial:
      return isyeriOzellikleri(listing.attributes)
    case ListingCategory.Building:
      return binaOzellikleri(listing.attributes)
    case ListingCategory.Timeshare:
      return devremulkOzellikleri(listing.attributes)
    case ListingCategory.TourismFacility:
      return turistikTesisOzellikleri(listing.attributes)
  }
}

/**
 * İlanı bölümlere ayırır.
 *
 * Bölüm başlıklarının ikisi (`İlan Bilgileri`, `Tarihler`) bu panelin kendi
 * gruplaması — bir alanın adı değil, o yüzden `labels.ts`'te karşılıkları yok.
 * `Kategori Özellikleri` ise gerçek bir alanın (`attributes`) adı ve domain'den
 * geliyor.
 */
function bolumler(listing: Listing): Bolum[] {
  return [
    {
      id: 'kimlik',
      title: 'İlan Bilgileri',
      facts: [
        { key: 'listingNo', label: LISTING_FIELD_LABEL.listingNo, value: listing.listingNo },
        {
          key: 'status',
          label: LISTING_FIELD_LABEL.status,
          value: LISTING_STATUS_LABEL[listing.status],
        },
        {
          key: 'category',
          label: LISTING_FIELD_LABEL.category,
          value: LISTING_CATEGORY_LABEL[listing.category],
        },
        {
          key: 'subCategory',
          label: LISTING_FIELD_LABEL.subCategory,
          value: LISTING_SUB_CATEGORY_LABEL[listing.subCategory],
        },
        {
          key: 'transactionType',
          label: LISTING_FIELD_LABEL.transactionType,
          value: TRANSACTION_TYPE_LABEL[listing.transactionType],
        },
        { key: 'price', label: LISTING_FIELD_LABEL.price, value: para(listing.price) },
        {
          key: 'source',
          label: LISTING_FIELD_LABEL.source,
          value: LISTING_SOURCE_LABEL[listing.source],
        },
        { key: 'revision', label: LISTING_FIELD_LABEL.revision, value: sayi(listing.revision) },
        {
          key: 'tags',
          label: LISTING_FIELD_LABEL.tags,
          value: listing.tags.length === 0 ? null : listing.tags.join(', '),
        },
        /* Uzun metinler en sonda: ızgarada tam satır kaplayıp akışı bölüyorlar. */
        { key: 'title', label: LISTING_FIELD_LABEL.title, value: listing.title },
        { key: 'description', label: LISTING_FIELD_LABEL.description, value: listing.description },
      ],
    },
    {
      id: 'tarih',
      title: 'Tarihler',
      facts: [
        {
          key: 'listingDate',
          label: LISTING_FIELD_LABEL.listingDate,
          value: formatDateTime(listing.listingDate),
        },
        {
          key: 'createdAt',
          label: LISTING_FIELD_LABEL.createdAt,
          value: formatDateTime(listing.createdAt),
        },
        {
          key: 'updatedAt',
          label: LISTING_FIELD_LABEL.updatedAt,
          value: formatDateTime(listing.updatedAt),
        },
        {
          key: 'submittedAt',
          label: LISTING_FIELD_LABEL.submittedAt,
          value: opsiyonel(listing.submittedAt, formatDateTime),
        },
        {
          key: 'publishedAt',
          label: LISTING_FIELD_LABEL.publishedAt,
          value: opsiyonel(listing.publishedAt, formatDateTime),
        },
        {
          key: 'expiresAt',
          label: LISTING_FIELD_LABEL.expiresAt,
          value: opsiyonel(listing.expiresAt, formatDateTime),
        },
      ],
    },
    {
      id: 'attributes',
      title: LISTING_FIELD_LABEL.attributes,
      facts: kategoriOzellikleri(listing),
    },
  ]
}

/**
 * İki revizyonun bölümlerini alan anahtarına göre eşler.
 *
 * Anahtara göre eşleşiyor, sıraya göre değil: **kategori de değişebilir**
 * (brifing 1.1, maddi değişiklik listesi) ve o zaman iki tarafın öznitelik
 * anahtarları tamamen ayrışır. Anahtar eşlemesi bunu kendiliğinden doğru
 * gösterir — konutun "Oda Sayısı"nda `3+1 → —`, arsanın "İmar Durumu"nda
 * `— → Konut İmarlı` çıkar; özel bir dal gerekmez.
 */
function karsilastirmaBolumleri(listing: Listing, previousListing: Listing): KarsilastirmaBolumu[] {
  /*
    `Map`'in tip argümanları açıkça yazılıyor: yazılmazsa `[bolum.id, bolum]`
    tuple değil `(string | Bolum)[]` diye çıkarılır ve constructor'a uymaz.
  */
  const oncekiBolumler = new Map<string, Bolum>(
    bolumler(previousListing).map((bolum) => [bolum.id, bolum]),
  )

  return bolumler(listing).map((bolum) => {
    const onceki = oncekiBolumler.get(bolum.id)
    const oncekiFactler = new Map<string, Fact>(
      (onceki?.facts ?? []).map((fact) => [fact.key, fact]),
    )
    const yeniAnahtarlar = new Set(bolum.facts.map((fact) => fact.key))

    const satirlar: KarsilastirmaSatiri[] = bolum.facts.map((fact) => ({
      key: fact.key,
      label: fact.label,
      onceki: oncekiFactler.get(fact.key)?.value ?? null,
      yeni: fact.value,
    }))

    /* Yalnız eski revizyonda olan alanlar (kategori değişince öyle olur) düşmesin. */
    for (const fact of onceki?.facts ?? []) {
      if (yeniAnahtarlar.has(fact.key)) continue
      satirlar.push({ key: fact.key, label: fact.label, onceki: fact.value, yeni: null })
    }

    return { id: bolum.id, title: bolum.title, satirlar }
  })
}

/**
 * Değer hücresi. Değer yoksa görsel olarak `—`, ekran okuyucuya "Belirtilmemiş".
 *
 * Tire `aria-hidden`: ekran okuyucular `—`'yi ya "em dash" der ya hiç okumaz;
 * ikisi de "bu alan boş" bilgisini vermez. Gizlenen metin `opacity` ile değil
 * konumla gizleniyor (`visuallyHidden`); `visibility: hidden` olsaydı
 * erişilebilirlik ağacından silinir ve bu satır adsız kalırdı.
 */
function DegerHucresi({ value }: { value: Deger }) {
  if (value === null) {
    return (
      <>
        <span className={css.missing} aria-hidden="true">
          —
        </span>
        <span className={css.visuallyHidden}>Belirtilmemiş</span>
      </>
    )
  }

  return <>{value}</>
}

/** Vurgu işareti. Renk tek başına gösterge değil; rozetin kendi metni var. */
function VurguRozeti() {
  return (
    <Badge tone="warning" size="sm">
      Değişti
    </Badge>
  )
}

/**
 * İlanın alanlarını kategorisine göre gösteren olgu tablosu.
 *
 * `Listing` ayrık bir birleşim ve panelin bütün işi bunu doğru daraltmak:
 * `switch (listing.category)` `attributes`'ı da daraltıyor, `as` cast'i yok.
 * Arsanın "İmar Durumu"nu konut ilanında göstermek derleme aşamasında imkânsız.
 * Öznitelik değerleri `satisfies Record<keyof XAttributes, Deger>` ile yazıldı:
 * domain'e yeni bir alan eklenirse **panel derlenmez** — sessizce atlamaz. Aynı
 * kapı `labels.ts`'te de var, ikisi birlikte brifing 1.1'in alan tablolarını
 * ekrana bağlıyor.
 *
 * **Panel her alanı göstermez, yalnız sahibi olduklarını.** Konum, fotoğraf,
 * satıcı, iletişim, promosyon, moderasyon ve metrikler brifing 2.5'te kendi
 * panellerine verilmiş (`LocationPanel`, `ImageGallery`, `SellerPanel`,
 * `PromotionFlagsPanel`, `AutomatedChecksPanel`, `ModerationHistory`); burada
 * tekrarlanmaları aynı bilgiyi ekranda iki kere gösterirdi. `id` ve
 * `ownerUserId` iç anahtar — moderatör `listingNo` ile konuşur.
 *
 * **Opsiyonel alan boşken satır silinmiyor, `—` gösteriyor.** İki sebep: (1)
 * Boşluk bir bulgudur — "KAKS: —" arsa ilanında eksik veriyi görünür kılar,
 * satırı gizlemek onu görünmez yapardı. (2) Satır kümesi ilana göre değişseydi
 * `comparison` bir alanın **eklendiğini** gösteremezdi; sabit iskelet iki
 * revizyonu yan yana koymanın ön şartı. Panel "boş" ile "bu kategoride
 * anlamsız"ı ayırt edemediği için ikisine de aynı davranıyor.
 *
 * **Farkı panel hesaplamaz.** `comparison` iki değeri yan yana koyar ama hangi
 * değişikliğin maddi olduğu bir iş kuralıdır (fiyat maddi, etiket değil) ve
 * domain'e aittir; vurgu yalnız `highlightedFields` ile gelir. `previousListing`
 * verilmezse `comparison` tek sütuna, yani `sections`'a düşer — çökmez.
 *
 * Yükleniyor/boş/hata durumları burada yok: panelin `listing`'i her zaman var,
 * "boş ilan" diye bir şey yok. Veriyi bekleyen de hatayı gösteren de sayfa
 * katmanı (`Skeleton`, `ErrorState`).
 *
 * @example
 * <ListingFacts listing={ilan} />
 *
 * @example
 * // Moderatörün sorusu "ilan ne" değil "ne değişti":
 * <ListingFacts
 *   listing={ilan}
 *   previousListing={oncekiRevizyon}
 *   variant="comparison"
 *   highlightedFields={maddiDegisiklikler(oncekiRevizyon, ilan)}
 * />
 */
export function ListingFacts({
  listing,
  variant = 'sections',
  previousListing,
  highlightedFields,
}: ListingFactsProps) {
  const vurgulanan = new Set(highlightedFields ?? [])

  if (variant === 'comparison' && previousListing !== undefined) {
    return (
      <div className={css.root}>
        {karsilastirmaBolumleri(listing, previousListing).map((bolum) => (
          <section key={bolum.id} className={css.section}>
            {/*
              Karşılaştırma tablo: üç sütun (alan / önceki / yeni) ve her hücre
              başlığıyla birlikte duyulmalı. `<dl>`'de bunu ifade etmenin yolu
              yok — bir terime iki tanım verilir ama hangisinin eski olduğu
              söylenemez. `<caption>` bölüm başlığını tabloya bağlar.
            */}
            <div className={css.tableScroll}>
              <table className={css.table}>
                <caption className={css.caption}>{bolum.title}</caption>
                <thead>
                  <tr>
                    <th scope="col" className={css.th}>
                      Alan
                    </th>
                    <th scope="col" className={css.th}>
                      Önceki
                    </th>
                    <th scope="col" className={css.th}>
                      Yeni
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bolum.satirlar.map((satir) => (
                    <tr
                      key={satir.key}
                      className={css.tr({ highlighted: vurgulanan.has(satir.key) })}
                    >
                      <th scope="row" className={css.rowHeader}>
                        <span className={css.labelText}>{satir.label}</span>
                        {vurgulanan.has(satir.key) ? <VurguRozeti /> : null}
                      </th>
                      <td className={css.td({ side: 'onceki' })}>
                        <DegerHucresi value={satir.onceki} />
                      </td>
                      <td className={css.td({ side: 'yeni' })}>
                        <DegerHucresi value={satir.yeni} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    )
  }

  const factSatiri = (fact: Fact, listeVariant: 'sections' | 'definitionList') => (
    <div
      key={fact.key}
      className={css.row({
        variant: listeVariant,
        wide: listeVariant === 'sections' && GENIS_ALANLAR.has(fact.key),
        highlighted: vurgulanan.has(fact.key),
      })}
    >
      <dt className={css.dt}>
        <span className={css.labelText}>{fact.label}</span>
        {vurgulanan.has(fact.key) ? <VurguRozeti /> : null}
      </dt>
      <dd className={css.dd}>
        <DegerHucresi value={fact.value} />
      </dd>
    </div>
  )

  if (variant === 'definitionList') {
    /*
      Tek `<dl>`, bölüm başlıksız: yan panelde ve dar kolonda başlıklar dikey
      yerin yarısını yerdi. Alanların sırası `sections` ile aynı kalıyor —
      moderatör iki varyant arasında geçince aradığı satır yer değiştirmesin.
    */
    return (
      <dl className={css.list({ variant: 'definitionList' })}>
        {bolumler(listing).flatMap((bolum) =>
          bolum.facts.map((fact) => factSatiri(fact, 'definitionList')),
        )}
      </dl>
    )
  }

  return (
    <div className={css.root}>
      {bolumler(listing).map((bolum) => (
        <section key={bolum.id} className={css.section}>
          {/*
            `<h3>`: panel bir detay sayfasının içinde yaşıyor, h1 sayfanın ve h2
            bölümün. Sözleşmede başlık düzeyi prop'u yok; gerekirse eklenmeli.
          */}
          <h3 className={css.sectionTitle}>{bolum.title}</h3>
          <dl className={css.list({ variant: 'sections' })}>
            {bolum.facts.map((fact) => factSatiri(fact, 'sections'))}
          </dl>
        </section>
      ))}
    </div>
  )
}
