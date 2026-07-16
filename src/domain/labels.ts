import {
  AdminRole,
  AssetModerationStatus,
  AutomatedCheckCode,
  AutomatedCheckResultStatus,
  Currency,
  ListingCategory,
  ListingStatus,
  ModerationActorType,
  ModerationEventType,
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

/**
 * Gerekçelerin bir cümlelik açıklaması (brifing 1.3 tablosunun son sütunu).
 *
 * Etiketten ayrı tutuluyor çünkü ikisi farklı yerlerde görünüyor: dar alanlarda
 * (rozet, tablo hücresi, çip) yalnız etiket sığar; gerekçeyi *seçtiren* ekranda
 * ise açıklama şart — "Belge Uyumsuzluğu" ile "Yetki Belgesi Eksik" arasındaki
 * farkı moderatöre anlatan tek metin budur ve yanlış seçilen gerekçe ilan
 * sahibine yanlış düzeltme talimatı olarak gider.
 */
export const REJECTION_REASON_DESCRIPTION = {
  [RejectionReason.WrongCategory]:
    'İlanın kategori, alt kategori veya işlem türü gerçek içerikle eşleşmiyor.',
  [RejectionReason.DuplicateListing]:
    'Aynı gayrimenkul aynı veya ilişkili hesapta tekrar yayınlanmış.',
  [RejectionReason.MisleadingOrIncompleteInfo]:
    'Başlık, açıklama veya öznitelikler eksik, çelişkili ya da yanıltıcı.',
  [RejectionReason.InappropriateImage]:
    'Fotoğraf ilanla ilgisiz, filigranlı, manipüle edilmiş veya politika dışı.',
  [RejectionReason.ContactInformationViolation]:
    'Başlık, açıklama veya görsel içine telefon, URL ya da yönlendirme eklenmiş.',
  [RejectionReason.PricingError]:
    'Fiyat sıfır, gerçek dışı, eksik sıfırlı veya yanlış para biriminde.',
  [RejectionReason.ProhibitedContent]:
    'Hukuka, platform politikasına veya güvenlik kurallarına aykırı içerik.',
  [RejectionReason.IncorrectLocation]:
    'İl, ilçe veya mahalle bilgisi gayrimenkulün gerçek konumuyla uyuşmuyor.',
  [RejectionReason.MissingAuthorizationDocument]:
    'Emlak ofisi veya firma adına yayın için gerekli doğrulama bulunmuyor.',
  [RejectionReason.DocumentMismatch]:
    'Tapu, yetki veya ruhsat bilgileri ilan alanlarıyla çelişiyor.',
  [RejectionReason.SpamTitle]:
    'Tekrarlı büyük harf, anahtar kelime doldurma veya yanıltıcı vurgu kullanılmış.',
  [RejectionReason.InsufficientPhotoQuality]:
    'Fotoğraflar aşırı düşük çözünürlüklü, karanlık veya gayrimenkulü göstermiyor.',
  [RejectionReason.PersonalDataViolation]:
    'Görsellerde veya açıklamada korunması gereken kişisel veri bulunuyor.',
  [RejectionReason.SuspectedFraud]:
    'Gayrimenkulün varlığı, sahipliği veya fiyatı konusunda yüksek risk sinyali var.',
  [RejectionReason.OtherPolicyViolation]:
    'Tanımlı seçeneklere girmeyen; moderasyon notuyla açıklanması zorunlu ihlal.',
} satisfies Record<RejectionReason, string>

export const AUTOMATED_CHECK_LABEL = {
  [AutomatedCheckCode.RequiredFields]: 'Zorunlu Alanlar',
  [AutomatedCheckCode.DuplicateContent]: 'Mükerrer İçerik',
  [AutomatedCheckCode.PriceAnomaly]: 'Fiyat Anomalisi',
  [AutomatedCheckCode.ContactInfoDetection]: 'İletişim Bilgisi Tespiti',
  [AutomatedCheckCode.ImageQuality]: 'Fotoğraf Kalitesi',
  [AutomatedCheckCode.ImageSafety]: 'Görsel Güvenliği',
  [AutomatedCheckCode.LocationConsistency]: 'Konum Tutarlılığı',
  [AutomatedCheckCode.FraudRisk]: 'Sahtecilik Riski',
} satisfies Record<AutomatedCheckCode, string>

export const AUTOMATED_CHECK_STATUS_LABEL = {
  [AutomatedCheckResultStatus.Passed]: 'Geçti',
  [AutomatedCheckResultStatus.Warning]: 'Uyarı',
  [AutomatedCheckResultStatus.Failed]: 'Başarısız',
} satisfies Record<AutomatedCheckResultStatus, string>

/**
 * Otomatik kontrolün moderasyon kararını **bloklayıp bloklamadığı**.
 *
 * Brifing 1.2: `pendingReview → published` geçişinin koşulu "bloklayıcı otomatik
 * kontrol yok". `failed` bloklar, `warning` blokla*maz* — uyarı moderatörün
 * bakmasını ister, kararını vermez. İkisini aynı sepete koymak `warning` üreten
 * her ilanı onaylanamaz yapardı.
 */
export const AUTOMATED_CHECK_BLOCKING = {
  [AutomatedCheckResultStatus.Passed]: false,
  [AutomatedCheckResultStatus.Warning]: false,
  [AutomatedCheckResultStatus.Failed]: true,
} satisfies Record<AutomatedCheckResultStatus, boolean>

/**
 * Moderasyon olaylarının geçmiş zamanlı etiketleri.
 *
 * Olmuş bitmiş bir olayı anlatıyorlar ("Onaylandı"), eylem adı değiller
 * ("Onayla") — ModerationHistory geçmişi gösterir, eylem sunmaz.
 */
export const MODERATION_EVENT_LABEL = {
  [ModerationEventType.Created]: 'Oluşturuldu',
  [ModerationEventType.Submitted]: 'İncelemeye gönderildi',
  [ModerationEventType.Assigned]: 'İnceleyen atandı',
  [ModerationEventType.Approved]: 'Onaylandı',
  [ModerationEventType.Rejected]: 'Reddedildi',
  [ModerationEventType.ChangesRequested]: 'Düzeltme istendi',
  [ModerationEventType.Withdrawn]: 'Geri çekildi',
  [ModerationEventType.Edited]: 'Düzenlendi',
  [ModerationEventType.Paused]: 'Pasife alındı',
  [ModerationEventType.Resumed]: 'Yayına döndü',
  [ModerationEventType.Expired]: 'Süresi doldu',
  [ModerationEventType.Archived]: 'Arşivlendi',
  [ModerationEventType.Restored]: 'Arşivden geri yüklendi',
  [ModerationEventType.NoteAdded]: 'Not eklendi',
  [ModerationEventType.ReportLinked]: 'Şikayet bağlandı',
} satisfies Record<ModerationEventType, string>

export const MODERATION_ACTOR_TYPE_LABEL = {
  [ModerationActorType.Admin]: 'Yönetici',
  [ModerationActorType.ListingOwner]: 'İlan sahibi',
  [ModerationActorType.System]: 'Sistem',
} satisfies Record<ModerationActorType, string>

/** Fotoğraf bazlı moderasyon durumu (`ListingPhoto.moderationStatus`). */
export const ASSET_MODERATION_STATUS_LABEL = {
  [AssetModerationStatus.Pending]: 'İncelenmedi',
  [AssetModerationStatus.Approved]: 'Uygun',
  [AssetModerationStatus.Rejected]: 'Uygunsuz',
} satisfies Record<AssetModerationStatus, string>

export const ADMIN_ROLE_LABEL = {
  [AdminRole.SuperAdmin]: 'Süper Admin',
  [AdminRole.Moderator]: 'Moderatör',
  [AdminRole.ContentReviewer]: 'İçerik Denetçisi',
  [AdminRole.Support]: 'Destek',
} satisfies Record<AdminRole, string>
