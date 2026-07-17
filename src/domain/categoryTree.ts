import {
  BuildingSubCategory,
  BuildingTransactionType,
  CommercialSubCategory,
  CommercialTransactionType,
  LandSubCategory,
  LandTransactionType,
  ListingCategory,
  ResidentialSubCategory,
  ResidentialTransactionType,
  TimeshareSubCategory,
  TimeshareTransactionType,
  TourismFacilitySubCategory,
  TourismFacilityTransactionType,
  type ListingSubCategory,
  type ListingTransactionType,
} from '../types/domain'

/**
 * Kategori → alt kategori ve işlem türü eşlemesi.
 *
 * `domain.ts` her kategorinin alt kategorilerini ve işlem türlerini **ayrı
 * enum'larda** tutuyor (`ResidentialSubCategory`, `LandTransactionType`…) ve
 * `ListingSubCategory`/`ListingTransactionType` bunların düz birleşimi. Yani
 * "Daire konutun altındadır" bilgisi enum **adında** gizliydi: insan okur, kod
 * okuyamazdı. Süzülmemiş bir liste "Arsa" özniteliğine "Daire" seçtirir.
 *
 * **Bu bir iş kuralıdır, görünüm değil** — bu yüzden `domain/`'de. AttributeEditor
 * eşlemeyi `.tsx`'e gömmeyi reddetti: kuralı görünüm katmanına saklamak, onu tek
 * bir component'in içine hapsederdi; aynı süzgeç filtre çubuğunda, ilan
 * formunda ve karşılaştırma tablosunda da gerekecek.
 *
 * Değerler enum'lardan **türetiliyor**, elle yazılmıyor: elle yazılmış bir liste
 * enum'a yeni bir üye eklendiğinde sessizce eksik kalırdı — `Object.values` ile
 * eksik kalamaz. Sıra da enum'un bildirim sırası, yani brifingin sırası.
 */
export const CATEGORY_SUB_CATEGORIES = {
  [ListingCategory.Residential]: Object.values(ResidentialSubCategory),
  [ListingCategory.Land]: Object.values(LandSubCategory),
  [ListingCategory.Commercial]: Object.values(CommercialSubCategory),
  [ListingCategory.Building]: Object.values(BuildingSubCategory),
  [ListingCategory.Timeshare]: Object.values(TimeshareSubCategory),
  [ListingCategory.TourismFacility]: Object.values(TourismFacilitySubCategory),
} satisfies Record<ListingCategory, readonly ListingSubCategory[]>

/**
 * Kategori → o kategoride sunulabilecek işlem türleri.
 *
 * Kategoriler aynı işlem türünü paylaşmıyor: "Devren" yalnız işyeri ve turistik
 * tesiste var (arsa devredilmez, işletmesi devredilir), "Günlük kiralık" yalnız
 * konutta. Tek bir düz liste bu farkı silip arsaya "günlük kiralık" seçtirirdi.
 *
 * Dikkat: alt enum'ların **değerleri çakışıyor** (`ResidentialTransactionType.Sale`
 * ve `LandTransactionType.Sale` ikisi de `'satilik'`). Bu `domain.ts`'in —
 * yani FastAPI sözleşmesinin — kararı; buradaki eşleme onu değiştirmiyor,
 * yalnız hangi kategoride hangisinin sunulacağını söylüyor. Bir `'satilik'`
 * değerine bakıp hangi kategoriden geldiğini **anlamaya çalışma**: cevabı
 * değerin kendisi değil, yanındaki `category` alanı verir.
 */
export const CATEGORY_TRANSACTION_TYPES = {
  [ListingCategory.Residential]: Object.values(ResidentialTransactionType),
  [ListingCategory.Land]: Object.values(LandTransactionType),
  [ListingCategory.Commercial]: Object.values(CommercialTransactionType),
  [ListingCategory.Building]: Object.values(BuildingTransactionType),
  [ListingCategory.Timeshare]: Object.values(TimeshareTransactionType),
  [ListingCategory.TourismFacility]: Object.values(TourismFacilityTransactionType),
} satisfies Record<ListingCategory, readonly ListingTransactionType[]>
