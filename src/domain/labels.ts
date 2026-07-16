import {
  Currency,
  ListingCategory,
  ListingStatus,
  RejectionReason,
  SellerType,
  type ListingTransactionType,
} from '../types/domain'

/**
 * Arayüzde görünen Türkçe etiketler.
 *
 * Component'lerin içine gömülmez: aynı durum ilan listesinde, moderasyon
 * kuyruğunda ve detay ekranında görünür — üç yerde ayrı yazılırsa biri
 * değiştiğinde diğerleri sessizce eski kalır.
 *
 * `satisfies Record<...>` sayesinde domain'e yeni bir durum eklenip buraya
 * karşılığı yazılmazsa derleme hatası alınır.
 */

export const LISTING_STATUS_LABEL = {
  [ListingStatus.Draft]: 'Taslak',
  [ListingStatus.PendingReview]: 'İncelemede',
  [ListingStatus.ChangesRequested]: 'Düzeltme Bekliyor',
  [ListingStatus.Published]: 'Onaylı / Yayında',
  [ListingStatus.Rejected]: 'Reddedildi',
  [ListingStatus.Paused]: 'Pasif',
  [ListingStatus.Expired]: 'Süresi Dolmuş',
  [ListingStatus.Archived]: 'Arşiv',
} satisfies Record<ListingStatus, string>

/** Brifing 1.2: yalnız `published` kamuya görünür. */
export const LISTING_STATUS_PUBLIC = {
  [ListingStatus.Draft]: false,
  [ListingStatus.PendingReview]: false,
  [ListingStatus.ChangesRequested]: false,
  [ListingStatus.Published]: true,
  [ListingStatus.Rejected]: false,
  [ListingStatus.Paused]: false,
  [ListingStatus.Expired]: false,
  [ListingStatus.Archived]: false,
} satisfies Record<ListingStatus, boolean>

export const LISTING_CATEGORY_LABEL = {
  [ListingCategory.Residential]: 'Konut',
  [ListingCategory.Land]: 'Arsa',
  [ListingCategory.Commercial]: 'İşyeri',
  [ListingCategory.Building]: 'Bina',
  [ListingCategory.Timeshare]: 'Devremülk',
  [ListingCategory.TourismFacility]: 'Turistik Tesis',
} satisfies Record<ListingCategory, string>

/**
 * İşlem türü etiketleri.
 *
 * `ListingTransactionType` altı ayrı enum'un birleşimi ama değerler örtüşüyor
 * (`satilik` hem konutta hem arsada var), bu yüzden tek bir sözlük yeterli.
 */
export const TRANSACTION_TYPE_LABEL: Record<ListingTransactionType, string> = {
  satilik: 'Satılık',
  kiralik: 'Kiralık',
  gunlukKiralik: 'Günlük Kiralık',
  devren: 'Devren',
}

export const SELLER_TYPE_LABEL = {
  [SellerType.Owner]: 'Sahibinden',
  [SellerType.RealEstateOffice]: 'Emlak Ofisi',
  [SellerType.ConstructionCompany]: 'İnşaat Firması',
} satisfies Record<SellerType, string>

export const CURRENCY_SYMBOL = {
  [Currency.Try]: '₺',
  [Currency.Usd]: '$',
  [Currency.Eur]: '€',
  [Currency.Gbp]: '£',
} satisfies Record<Currency, string>

export const REJECTION_REASON_LABEL = {
  [RejectionReason.WrongCategory]: 'Yanlış Kategori',
  [RejectionReason.DuplicateListing]: 'Mükerrer İlan',
  [RejectionReason.MisleadingOrIncompleteInfo]: 'Yanıltıcı veya Eksik Bilgi',
  [RejectionReason.InappropriateImage]: 'Uygunsuz Görsel',
  [RejectionReason.ContactInformationViolation]: 'İletişim Bilgisi İhlali',
  [RejectionReason.PricingError]: 'Fiyat Hatası',
  [RejectionReason.ProhibitedContent]: 'Yasaklı İçerik',
  [RejectionReason.IncorrectLocation]: 'Yanlış Konum',
  [RejectionReason.MissingAuthorizationDocument]: 'Yetki Belgesi Eksik',
  [RejectionReason.DocumentMismatch]: 'Belge Uyumsuzluğu',
  [RejectionReason.SpamTitle]: 'Spam Başlık',
  [RejectionReason.InsufficientPhotoQuality]: 'Fotoğraf Kalitesi Yetersiz',
  [RejectionReason.PersonalDataViolation]: 'Kişisel Veri İhlali',
  [RejectionReason.SuspectedFraud]: 'Sahte İlan Şüphesi',
  [RejectionReason.OtherPolicyViolation]: 'Diğer Politika İhlali',
} satisfies Record<RejectionReason, string>
