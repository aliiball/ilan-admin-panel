import { ListingStatus, RejectionReason } from '../types/domain'

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
