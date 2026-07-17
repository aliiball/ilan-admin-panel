import {
  AdminPermission,
  AdminRole,
  AssetModerationStatus,
  AttributeDataType,
  AutomatedCheckCode,
  AutomatedCheckResultStatus,
  BuildingAge,
  BuildingCondition,
  BuildingSubCategory,
  BuildingUsageType,
  CommercialSubCategory,
  Currency,
  HeatingType,
  InfrastructureType,
  LandSubCategory,
  ListingCategory,
  ListingSource,
  ListingStatus,
  ListingTransitionTrigger,
  LoanEligibility,
  ModerationActorType,
  ModerationEventType,
  OccupancyStatus,
  ParkingType,
  PricePeriod,
  PromotionStatus,
  PromotionType,
  RejectionReason,
  ReportReason,
  ReportSeverity,
  ReportStatus,
  ResidentialSubCategory,
  SellerType,
  SellerVerificationStatus,
  TimeshareSeason,
  TimeshareSubCategory,
  TitleDeedStatus,
  TourismFacilitySubCategory,
  UserStatus,
  UserType,
  ZoningStatus,
  type AuditLogEntry,
  type BuildingAttributes,
  type CommercialAttributes,
  type FloorLocation,
  type LandAttributes,
  type Listing,
  type ListingContact,
  type ListingPromotion,
  type ListingSubCategory,
  type ListingTransactionType,
  type ResidentialAttributes,
  type RoomCount,
  type TimeshareAttributes,
  type TourismFacilityAttributes,
  type UserSanction,
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
 * Alt kategori etiketleri (brifing 1.1 "Kategori ağacı" tablosunun son sütunu).
 *
 * Altı ayrı sözlük **ve** birleşimleri: ikisi de gerekiyor, çünkü iki farklı soru
 * soruluyor. Component'in elindeki `listing.subCategory` birleşim tipindedir
 * (`ListingSubCategory`) — ona tek bir arama tablosu lazım, yoksa yalnız etiket
 * basmak için `category`'ye göre switch yazması gerekir. Ama tek sözlükte
 * tutmak, kategorisi başına eksiksizliği kaybettirirdi: `satisfies` yalnız
 * birleşimin tamamını sorar, "Konut'un yedi alt kategorisi de burada mı" diye
 * sormaz.
 *
 * Bu yüzden altı sözlük ayrı ayrı `satisfies Record<XSubCategory, string>` ile
 * yazılıp `LISTING_SUB_CATEGORY_LABEL` onlardan türetiliyor. Türetilmiş sözlüğe
 * elle giriş **eklenmemeli**: değerler bugün altı enum arasında çakışmıyor
 * (denetlendi) ama ileride çakışırsa yayılım sessizce birini ezer — kaynak
 * sözlükler doğru kalır, hata orada değil burada aranmalıdır.
 */
export const RESIDENTIAL_SUB_CATEGORY_LABEL = {
  [ResidentialSubCategory.Apartment]: 'Daire',
  [ResidentialSubCategory.Residence]: 'Rezidans',
  [ResidentialSubCategory.DetachedHouse]: 'Müstakil Ev',
  [ResidentialSubCategory.Villa]: 'Villa',
  [ResidentialSubCategory.SummerHouse]: 'Yazlık',
  [ResidentialSubCategory.FarmHouse]: 'Çiftlik Evi',
  [ResidentialSubCategory.Prefabricated]: 'Prefabrik',
} satisfies Record<ResidentialSubCategory, string>

export const LAND_SUB_CATEGORY_LABEL = {
  [LandSubCategory.ResidentialZoned]: 'Konut İmarlı',
  [LandSubCategory.CommercialZoned]: 'Ticari İmarlı',
  [LandSubCategory.IndustrialZoned]: 'Sanayi İmarlı',
  [LandSubCategory.TourismZoned]: 'Turizm İmarlı',
  [LandSubCategory.Field]: 'Tarla',
  [LandSubCategory.VineyardGarden]: 'Bağ ve Bahçe',
} satisfies Record<LandSubCategory, string>

export const COMMERCIAL_SUB_CATEGORY_LABEL = {
  [CommercialSubCategory.ShopStore]: 'Dükkan ve Mağaza',
  [CommercialSubCategory.Office]: 'Ofis',
  [CommercialSubCategory.Plaza]: 'Plaza',
  [CommercialSubCategory.Warehouse]: 'Depo ve Antrepo',
  [CommercialSubCategory.Factory]: 'Fabrika',
  [CommercialSubCategory.Workshop]: 'Atölye',
} satisfies Record<CommercialSubCategory, string>

export const BUILDING_SUB_CATEGORY_LABEL = {
  [BuildingSubCategory.CompleteBuilding]: 'Komple Bina',
} satisfies Record<BuildingSubCategory, string>

export const TIMESHARE_SUB_CATEGORY_LABEL = {
  [TimeshareSubCategory.Timeshare]: 'Devremülk',
} satisfies Record<TimeshareSubCategory, string>

export const TOURISM_FACILITY_SUB_CATEGORY_LABEL = {
  [TourismFacilitySubCategory.Hotel]: 'Otel',
  [TourismFacilitySubCategory.BoutiqueHotel]: 'Butik Otel',
  [TourismFacilitySubCategory.ApartHotel]: 'Apart Otel',
  [TourismFacilitySubCategory.Pension]: 'Pansiyon',
  [TourismFacilitySubCategory.Motel]: 'Motel',
  [TourismFacilitySubCategory.HolidayVillage]: 'Tatil Köyü',
  [TourismFacilitySubCategory.Campground]: 'Kamp Yeri',
} satisfies Record<TourismFacilitySubCategory, string>

/** Altı alt kategori sözlüğünün birleşimi; `listing.subCategory` doğrudan aranır. */
export const LISTING_SUB_CATEGORY_LABEL = {
  ...RESIDENTIAL_SUB_CATEGORY_LABEL,
  ...LAND_SUB_CATEGORY_LABEL,
  ...COMMERCIAL_SUB_CATEGORY_LABEL,
  ...BUILDING_SUB_CATEGORY_LABEL,
  ...TIMESHARE_SUB_CATEGORY_LABEL,
  ...TOURISM_FACILITY_SUB_CATEGORY_LABEL,
} satisfies Record<ListingSubCategory, string>

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

/**
 * Kurum doğrulama durumu (`SellerSummary.verificationStatus`).
 *
 * Brifing 1.1: `seller.type` emlak ofisi veya inşaat firmasıysa doğrulama durumu
 * admin ekranında gösterilir. Etiketler edilgen ve **doğrulamanın** öznesi:
 * "Reddedildi" tek başına ilan reddi sanılabilirdi, o yüzden "Doğrulama
 * Reddedildi" — aynı ekranda `ListingStatus.Rejected` de "Reddedildi" yazıyor.
 */
export const SELLER_VERIFICATION_STATUS_LABEL = {
  [SellerVerificationStatus.Unverified]: 'Doğrulanmamış',
  [SellerVerificationStatus.Pending]: 'Doğrulama Bekliyor',
  [SellerVerificationStatus.Verified]: 'Doğrulanmış',
  [SellerVerificationStatus.Rejected]: 'Doğrulama Reddedildi',
} satisfies Record<SellerVerificationStatus, string>

export const CURRENCY_SYMBOL = {
  [Currency.Try]: '₺',
  [Currency.Usd]: '$',
  [Currency.Eur]: '€',
  [Currency.Gbp]: '£',
} satisfies Record<Currency, string>

/**
 * Para biriminin açık adı.
 *
 * `CURRENCY_SYMBOL`'den ayrı: sembol fiyatın yanında yer kazanır (`18.750.000 ₺`),
 * ama para birimini **seçtiren** yerde sembol yetmez — `$` seçeneği tek başına
 * hangi doların sorulduğunu söylemez ve dört sembol yan yana okunmaz.
 */
export const CURRENCY_LABEL = {
  [Currency.Try]: 'Türk Lirası',
  [Currency.Usd]: 'Amerikan Doları',
  [Currency.Eur]: 'Euro',
  [Currency.Gbp]: 'İngiliz Sterlini',
} satisfies Record<Currency, string>

/**
 * Fiyat periyodunun **bağımsız** etiketi.
 *
 * `formatCurrency` fiyata kendi son ekini yapıştırır (`65.000 ₺ / ay`); bu sözlük
 * periyodun tek başına göründüğü yerler içindir — filtre seçeneği, tablo sütunu,
 * form etiketi. İkisi bilerek ayrı: son ek fiyata yapışır ve küçük harfle akar
 * ("/ ay"), etiket başlık gibi durur ("Aylık"). Aynı metni iki yerde
 * kullanmaya çalışmak ikisinden birini bozardı.
 */
export const PRICE_PERIOD_LABEL = {
  [PricePeriod.OneTime]: 'Tek Seferlik',
  [PricePeriod.Monthly]: 'Aylık',
  [PricePeriod.Daily]: 'Günlük',
  [PricePeriod.Yearly]: 'Yıllık',
} satisfies Record<PricePeriod, string>

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

/**
 * İzin etiketleri — brifing 1.4 yetki matrisinin **satır başlıkları**.
 *
 * Metinler matristen birebir alındı, yeniden yazılmadı: `RolePermissionMatrix`
 * bu satırları rol sütunlarıyla birlikte gösterecek ve ekranın brifingle
 * karşılaştırılabilir olması, aynı şeye iki isim verilmemesine bağlı.
 *
 * "Sınırlı" kademelerin etiketi parantezle işaretli. Tam ve sınırlı izin yan
 * yana listelendiğinde ("Kullanıcı bilgisi düzenleme" / "…düzenleme (sınırlı:
 * ad, e-posta, telefon…)") aralarındaki farkı yalnız bu ek anlatır; kapsamı
 * etikete yazmak, matrisin cevapsız bıraktığı "sınırlı da ne?" sorusunu ekranda
 * cevaplar.
 *
 * `SettingsView`'ın matriste satırı yok — brifing 2.9'daki ayarlar ekranından
 * türetildi.
 */
export const ADMIN_PERMISSION_LABEL = {
  [AdminPermission.DashboardView]: 'Dashboard görüntüleme',
  [AdminPermission.ListingView]: 'İlan görüntüleme',
  [AdminPermission.ListingEdit]: 'İlan içeriği düzenleme',
  [AdminPermission.ListingSubmit]: 'İlanı incelemeye gönderme',
  [AdminPermission.ListingApprove]: 'İlan onaylama',
  [AdminPermission.ListingReject]: 'İlan reddetme',
  [AdminPermission.ListingRequestChanges]: 'Düzeltme isteme',
  [AdminPermission.ListingPause]: 'İlan pasife alma',
  [AdminPermission.ListingArchive]: 'İlan arşivleme',
  [AdminPermission.ListingRestore]: 'Arşivden geri yükleme',
  [AdminPermission.ListingBulkModerate]: 'Toplu moderasyon',
  [AdminPermission.ListingAssignReviewer]: 'İnceleyen atama',
  [AdminPermission.ListingAddNote]: 'Moderasyon notu ekleme',
  [AdminPermission.PromotionManage]: 'Promosyon yönetme',
  [AdminPermission.UserView]: 'Kullanıcı görüntüleme',
  [AdminPermission.UserEdit]: 'Kullanıcı bilgisi düzenleme',
  [AdminPermission.UserEditProfile]:
    'Kullanıcı bilgisi düzenleme (sınırlı: ad, e-posta, telefon, avatar, firma adı)',
  [AdminPermission.UserEditContact]: 'Kullanıcı bilgisi düzenleme (sınırlı: e-posta, telefon)',
  [AdminPermission.UserSuspend]: 'Kullanıcı askıya alma',
  [AdminPermission.UserBan]: 'Kullanıcı banlama',
  [AdminPermission.UserAssignRole]: 'Admin rolü atama',
  [AdminPermission.CategoryView]: 'Kategori ve öznitelik görüntüleme',
  [AdminPermission.CategoryManage]: 'Kategori ve öznitelik değiştirme',
  [AdminPermission.ReportView]: 'Şikayet görüntüleme',
  [AdminPermission.ReportTriage]: 'Şikayet triage etme',
  [AdminPermission.ReportTriageLimited]:
    'Şikayet triage etme (sınırlı: şiddet seviyesi ve atama hariç)',
  [AdminPermission.ReportResolve]: 'Şikayet çözümleme',
  [AdminPermission.SettingsView]: 'Ayarları görüntüleme',
  [AdminPermission.PermissionManage]: 'Rol ve izin yönetme',
  [AdminPermission.ThemeManage]: 'Tema seçimi',
  [AdminPermission.ThemeSetDefault]: 'Sistem teması varsayılanı değiştirme',
  [AdminPermission.AuditView]: 'Audit log görüntüleme',
} satisfies Record<AdminPermission, string>

/** İlanın sisteme hangi kanaldan girdiği (`Listing.source`). */
export const LISTING_SOURCE_LABEL = {
  [ListingSource.Web]: 'Web',
  [ListingSource.Mobile]: 'Mobil',
  [ListingSource.Api]: 'API',
  [ListingSource.AdminImport]: 'Admin İçe Aktarma',
} satisfies Record<ListingSource, string>

/**
 * Durum geçişini **ne tetikledi** (brifing 1.2 geçiş tablosu).
 *
 * `MODERATION_EVENT_LABEL`'ın cevapladığı sorudan farklı: olay etiketi ne
 * olduğunu söyler ("Pasife alındı"), tetikleyici neden olduğunu ("Pasife alma
 * talebi" mi, yoksa sistemin "Yayın süresi doldu"su mu). Aynı hedef duruma iki
 * ayrı yoldan gelinebiliyor ve fark yalnız burada görünüyor.
 */
export const LISTING_TRANSITION_TRIGGER_LABEL = {
  [ListingTransitionTrigger.OwnerSubmit]: 'İlan sahibi gönderdi',
  [ListingTransitionTrigger.OwnerWithdraw]: 'İlan sahibi geri çekti',
  [ListingTransitionTrigger.AdminDecision]: 'Yönetici kararı',
  [ListingTransitionTrigger.MaterialEdit]: 'Maddi içerik değişikliği',
  [ListingTransitionTrigger.PauseRequested]: 'Pasife alma talebi',
  [ListingTransitionTrigger.PauseEnded]: 'Pasiflik sona erdi',
  [ListingTransitionTrigger.ExpiryReached]: 'Yayın süresi doldu',
  [ListingTransitionTrigger.AppealAccepted]: 'İtiraz kabul edildi',
  [ListingTransitionTrigger.RenewalRequested]: 'Yayın süresi yenilendi',
  [ListingTransitionTrigger.ArchiveRequested]: 'Arşivleme talebi',
  [ListingTransitionTrigger.RestoreRequested]: 'Arşivden geri yükleme talebi',
  [ListingTransitionTrigger.RetentionExpired]: 'Saklama süresi doldu',
} satisfies Record<ListingTransitionTrigger, string>

export const PROMOTION_TYPE_LABEL = {
  [PromotionType.Featured]: 'Öne Çıkan',
  [PromotionType.Urgent]: 'Acil',
  [PromotionType.Showcase]: 'Vitrin',
  [PromotionType.HomepageShowcase]: 'Anasayfa Vitrini',
  [PromotionType.CategoryFeatured]: 'Kategoride Öne Çıkan',
} satisfies Record<PromotionType, string>

export const PROMOTION_STATUS_LABEL = {
  [PromotionStatus.Scheduled]: 'Planlandı',
  [PromotionStatus.Active]: 'Aktif',
  [PromotionStatus.Expired]: 'Süresi Doldu',
  [PromotionStatus.Cancelled]: 'İptal Edildi',
} satisfies Record<PromotionStatus, string>

/**
 * Promosyonun nasıl kazanıldığı (`ListingPromotion.source`).
 *
 * Ayrımı görünür kılmak audit'in işi: elle tanımlanan promosyonun bir yöneticisi
 * vardır (`activatedByAdminId`), satın alınanın yoktur.
 */
export const PROMOTION_SOURCE_LABEL = {
  paid: 'Satın alındı',
  manualAdmin: 'Yönetici tanımladı',
} satisfies Record<ListingPromotion['source'], string>

/** İlan sahibinin tercih ettiği iletişim yolu (`ListingContact.preferredContactMethod`). */
export const CONTACT_METHOD_LABEL = {
  phone: 'Telefon',
  message: 'Mesaj',
  both: 'Telefon ve Mesaj',
} satisfies Record<ListingContact['preferredContactMethod'], string>

/**
 * Hesap tipi (`UserAccount.type`).
 *
 * `SELLER_TYPE_LABEL` ile karıştırılmamalı: o ilanın *kimden* olduğunu söyler
 * (`sahibinden`), bu hesabın ne olduğunu. Değer kümeleri de aynı değil —
 * `UserType`'ta `admin` var, `SellerType`'ta yok; admin ilan vermez.
 */
export const USER_TYPE_LABEL = {
  [UserType.Individual]: 'Bireysel',
  [UserType.RealEstateOffice]: 'Emlak Ofisi',
  [UserType.ConstructionCompany]: 'İnşaat Firması',
  [UserType.Admin]: 'Yönetici',
} satisfies Record<UserType, string>

export const USER_STATUS_LABEL = {
  [UserStatus.PendingVerification]: 'Doğrulama Bekliyor',
  [UserStatus.Active]: 'Aktif',
  [UserStatus.Suspended]: 'Askıya Alındı',
  [UserStatus.Banned]: 'Banlandı',
} satisfies Record<UserStatus, string>

/**
 * Yaptırım tipi (`UserSanction.type`).
 *
 * `USER_STATUS_LABEL`'dan ayrı: durum hesabın **şu anki** hâli, yaptırım onu
 * doğuran kayıttır ve kaldırılmış (`revokedAt`) bir yaptırım geçmişte
 * görünmeye devam eder — hesap aktifken bile.
 */
export const USER_SANCTION_TYPE_LABEL = {
  suspension: 'Askıya Alma',
  ban: 'Ban',
} satisfies Record<UserSanction['type'], string>

/**
 * Şikayet sebepleri (`ListingReport.reason`).
 *
 * `REJECTION_REASON_LABEL` ile örtüşen metinler var ("Mükerrer İlan", "Yanlış
 * Kategori") ama iki ayrı sözlük: şikayeti **kullanıcı** açar, reddi
 * **moderatör** verir. Kümeler de farklı — şikayette "Satılmış veya Kiralanmış"
 * var (bir ihlal değil, bilgi), redde ise "Yetki Belgesi Eksik" gibi yalnız
 * moderatörün görebileceği gerekçeler.
 */
export const REPORT_REASON_LABEL = {
  [ReportReason.MisleadingInformation]: 'Yanıltıcı Bilgi',
  [ReportReason.DuplicateListing]: 'Mükerrer İlan',
  [ReportReason.SoldOrRented]: 'Satılmış veya Kiralanmış',
  [ReportReason.WrongCategory]: 'Yanlış Kategori',
  [ReportReason.SuspectedFraud]: 'Sahte İlan Şüphesi',
  [ReportReason.InappropriateContent]: 'Uygunsuz İçerik',
  [ReportReason.ContactViolation]: 'İletişim Bilgisi İhlali',
  [ReportReason.PriceManipulation]: 'Fiyat Manipülasyonu',
  [ReportReason.Other]: 'Diğer',
} satisfies Record<ReportReason, string>

export const REPORT_STATUS_LABEL = {
  [ReportStatus.Open]: 'Açık',
  [ReportStatus.InReview]: 'İncelemede',
  [ReportStatus.Resolved]: 'Çözümlendi',
  [ReportStatus.Dismissed]: 'Geçersiz Sayıldı',
} satisfies Record<ReportStatus, string>

export const REPORT_SEVERITY_LABEL = {
  [ReportSeverity.Low]: 'Düşük',
  [ReportSeverity.Medium]: 'Orta',
  [ReportSeverity.High]: 'Yüksek',
  [ReportSeverity.Critical]: 'Kritik',
} satisfies Record<ReportSeverity, string>

/**
 * Öznitelik veri tipi (`CategoryAttributeDefinition.dataType`).
 *
 * Yöneticiye görünür: `AttributeEditor` yeni öznitelik tanımlarken bu listeden
 * seçtiriyor. `boolean` yerine "Evet/Hayır" — seçen kişi geliştirici değil.
 */
export const ATTRIBUTE_DATA_TYPE_LABEL = {
  [AttributeDataType.Text]: 'Metin',
  [AttributeDataType.Number]: 'Sayı',
  [AttributeDataType.Boolean]: 'Evet/Hayır',
  [AttributeDataType.SingleSelect]: 'Tekli Seçim',
  [AttributeDataType.MultiSelect]: 'Çoklu Seçim',
  [AttributeDataType.Money]: 'Para',
} satisfies Record<AttributeDataType, string>

/** Audit kaydının hangi varlığa ait olduğu (`AuditLogEntry.entityType`). */
export const AUDIT_ENTITY_TYPE_LABEL = {
  listing: 'İlan',
  user: 'Kullanıcı',
  report: 'Şikayet',
  category: 'Kategori',
  permission: 'İzin',
  theme: 'Tema',
} satisfies Record<AuditLogEntry['entityType'], string>

/*
 * Kategori özniteliklerinin **değer** etiketleri (brifing 1.1'in kategori
 * alanları bölümleri).
 *
 * Ham enum değeri hiçbir ekranda gösterilemez: `dogalgazKombi`, `katIrtifaki`,
 * `bagBahce` ilan sahibine de moderatöre de bir şey söylemez. Aynı öznitelik
 * ilan kartında, detay ekranında, filtre çipinde ve karşılaştırma tablosunda
 * görüneceği için sözlükler burada — dördü ayrı yazsaydı biri "Kat İrtifakı",
 * öbürü "Kat İrtifaklı" derdi.
 */

/**
 * Oda sayısı (`RoomCount`).
 *
 * Çoğu değer kendi etiketi (`3+1` zaten okunabilir) ama sözlük yine de gerekli:
 * `diger` ve `8+` doğrudan basılırsa ekranda "diger" yazar. Kimliğe yakın
 * eşleme, sözlüğün gereksiz olduğu anlamına gelmiyor.
 */
export const ROOM_COUNT_LABEL = {
  '1+0': '1+0',
  '1+1': '1+1',
  '2+1': '2+1',
  '2+2': '2+2',
  '3+1': '3+1',
  '3+2': '3+2',
  '4+1': '4+1',
  '4+2': '4+2',
  '5+1': '5+1',
  '5+2': '5+2',
  '6+1': '6+1',
  '7+1': '7+1',
  '8+': '8+ Oda',
  diger: 'Diğer',
} satisfies Record<RoomCount, string>

/** İşyerinin oda sayısı sayısal değil de açık planlıysa (`CommercialAttributes.roomCount`). */
export const COMMERCIAL_OPEN_PLAN_LABEL = 'Açık Plan'

export const BUILDING_AGE_LABEL = {
  [BuildingAge.New]: 'Sıfır',
  [BuildingAge.OneToFive]: '1-5 yaş',
  [BuildingAge.SixToTen]: '6-10 yaş',
  [BuildingAge.ElevenToFifteen]: '11-15 yaş',
  [BuildingAge.SixteenToTwenty]: '16-20 yaş',
  [BuildingAge.TwentyOnePlus]: '21 yaş ve üzeri',
} satisfies Record<BuildingAge, string>

/**
 * Bulunduğu kat (`FloorLocation`).
 *
 * Sayısal değerlere "." ekleniyor: `3` tek başına kat sayısıyla karışır, "3. Kat"
 * karışmaz — ikisi konut ilanında yan yana görünüyor (`floorLocation` ve
 * `floorCount`).
 */
export const FLOOR_LOCATION_LABEL = {
  bodrumKat: 'Bodrum Kat',
  bahceKati: 'Bahçe Katı',
  zeminKat: 'Zemin Kat',
  yuksekGiris: 'Yüksek Giriş',
  girisKati: 'Giriş Katı',
  '1': '1. Kat',
  '2': '2. Kat',
  '3': '3. Kat',
  '4': '4. Kat',
  '5': '5. Kat',
  '6': '6. Kat',
  '7': '7. Kat',
  '8': '8. Kat',
  '9': '9. Kat',
  '10': '10. Kat',
  '11-20': '11-20. Kat',
  '21-30': '21-30. Kat',
  '30+': '30. Kat ve üzeri',
  catiKati: 'Çatı Katı',
  mustakil: 'Müstakil',
} satisfies Record<FloorLocation, string>

export const HEATING_TYPE_LABEL = {
  [HeatingType.NaturalGasCombi]: 'Doğalgaz (Kombi)',
  [HeatingType.Central]: 'Merkezi',
  [HeatingType.FloorFurnace]: 'Kat Kaloriferi',
  [HeatingType.Underfloor]: 'Yerden Isıtma',
  [HeatingType.AirConditioner]: 'Klima',
  [HeatingType.Stove]: 'Soba',
  [HeatingType.FanCoil]: 'Fan Coil',
  [HeatingType.HeatPump]: 'Isı Pompası',
  [HeatingType.None]: 'Yok',
} satisfies Record<HeatingType, string>

export const PARKING_TYPE_LABEL = {
  [ParkingType.None]: 'Yok',
  [ParkingType.Open]: 'Açık Otopark',
  [ParkingType.Closed]: 'Kapalı Otopark',
  [ParkingType.OpenAndClosed]: 'Açık ve Kapalı Otopark',
} satisfies Record<ParkingType, string>

export const OCCUPANCY_STATUS_LABEL = {
  [OccupancyStatus.Vacant]: 'Boş',
  [OccupancyStatus.Tenant]: 'Kiracılı',
  [OccupancyStatus.Owner]: 'Mülk Sahibi',
} satisfies Record<OccupancyStatus, string>

export const LOAN_ELIGIBILITY_LABEL = {
  [LoanEligibility.Eligible]: 'Krediye Uygun',
  [LoanEligibility.Ineligible]: 'Krediye Uygun Değil',
  [LoanEligibility.Unknown]: 'Bilinmiyor',
} satisfies Record<LoanEligibility, string>

export const TITLE_DEED_STATUS_LABEL = {
  [TitleDeedStatus.Condominium]: 'Kat Mülkiyeti',
  [TitleDeedStatus.ConstructionServitude]: 'Kat İrtifakı',
  [TitleDeedStatus.Shared]: 'Hisseli Tapu',
  [TitleDeedStatus.LandTitle]: 'Arsa Tapulu',
} satisfies Record<TitleDeedStatus, string>

/**
 * Arsanın imar durumu (`LandAttributes.zoningStatus`).
 *
 * `LAND_SUB_CATEGORY_LABEL` ile neredeyse aynı metinleri üretiyor ama ayrı
 * kalmalı: alt kategori ilanın **nerede listelendiğini**, imar durumu arsanın
 * **hukuki durumunu** söyler. Kümeler de ayrışıyor — imarda `plansiz` ve `diger`
 * var, alt kategoride yok; bir arsa "Konut İmarlı" alt kategorisinde listelenip
 * imar durumu "Plansız" olamaz, ama bunu ekran değil doğrulama yakalar.
 */
export const ZONING_STATUS_LABEL = {
  [ZoningStatus.Residential]: 'Konut İmarlı',
  [ZoningStatus.Commercial]: 'Ticari İmarlı',
  [ZoningStatus.Industrial]: 'Sanayi İmarlı',
  [ZoningStatus.Tourism]: 'Turizm İmarlı',
  [ZoningStatus.Field]: 'Tarla',
  [ZoningStatus.VineyardGarden]: 'Bağ ve Bahçe',
  [ZoningStatus.Unplanned]: 'Plansız',
  [ZoningStatus.Other]: 'Diğer',
} satisfies Record<ZoningStatus, string>

export const INFRASTRUCTURE_TYPE_LABEL = {
  [InfrastructureType.Electricity]: 'Elektrik',
  [InfrastructureType.Water]: 'Su',
  [InfrastructureType.NaturalGas]: 'Doğalgaz',
  [InfrastructureType.Sewer]: 'Kanalizasyon',
  [InfrastructureType.Road]: 'Yol',
} satisfies Record<InfrastructureType, string>

export const BUILDING_CONDITION_LABEL = {
  [BuildingCondition.New]: 'Sıfır',
  [BuildingCondition.Used]: 'İkinci El',
  [BuildingCondition.UnderConstruction]: 'Yapım Aşamasında',
  [BuildingCondition.RenovationRequired]: 'Renovasyon Gerekli',
} satisfies Record<BuildingCondition, string>

export const BUILDING_USAGE_TYPE_LABEL = {
  [BuildingUsageType.Residential]: 'Konut',
  [BuildingUsageType.Commercial]: 'Ticari',
  [BuildingUsageType.Mixed]: 'Karma',
} satisfies Record<BuildingUsageType, string>

export const TIMESHARE_SEASON_LABEL = {
  [TimeshareSeason.Spring]: 'İlkbahar',
  [TimeshareSeason.Summer]: 'Yaz',
  [TimeshareSeason.Autumn]: 'Sonbahar',
  [TimeshareSeason.Winter]: 'Kış',
  [TimeshareSeason.AllYear]: 'Tüm Yıl',
} satisfies Record<TimeshareSeason, string>

/*
 * Alan **adı** etiketleri (brifing 1.1'in alan tablolarının ilk sütunu).
 *
 * Yukarıdaki sözlükler bir alanın değerini çeviriyor; bunlar alanın kendi adını.
 * `ListingFacts` ilanın bütün özniteliklerini gösterecek ve her satırın solunda
 * bir ad var — o adlar component'in içine gömülürse "Brüt m²" yalnız orada
 * bilinir, aynı alanı gösteren filtre ve karşılaştırma tablosu kendi adını
 * uydurur.
 *
 * `keyof` üzerinden yazıldılar: domain'e yeni bir öznitelik eklenip etiketi
 * yazılmazsa derleme hatası verir — `ListingFacts` alanı sessizce atlamaz.
 */

/**
 * İlanın ortak alanlarının adı (brifing 1.1 "Ortak Listing alanları").
 *
 * `Record<keyof Listing, string>`: birleşim tipinin `keyof`'u altı varyantın
 * **ortak** anahtarlarını verir, yani `ListingBase`'in tamamı artı her varyantta
 * bulunan `category`, `subCategory`, `transactionType`, `attributes`. Kategoriye
 * özel alanlar aşağıdaki sözlüklerde.
 */
export const LISTING_FIELD_LABEL = {
  id: 'Dahili Kimlik',
  listingNo: 'İlan No',
  title: 'Başlık',
  description: 'Açıklama',
  category: 'Kategori',
  subCategory: 'Alt Kategori',
  transactionType: 'İşlem Türü',
  attributes: 'Kategori Özellikleri',
  status: 'Durum',
  price: 'Fiyat',
  location: 'Konum',
  photos: 'Fotoğraflar',
  listingDate: 'İlan Tarihi',
  createdAt: 'Oluşturulma Tarihi',
  updatedAt: 'Güncellenme Tarihi',
  submittedAt: 'Gönderim Tarihi',
  publishedAt: 'Yayın Tarihi',
  expiresAt: 'Bitiş Tarihi',
  ownerUserId: 'Kullanıcı Kimliği',
  seller: 'İlan Sahibi',
  contact: 'İletişim',
  promotionFlags: 'Promosyon İşaretleri',
  promotions: 'Promosyon Kayıtları',
  moderation: 'Moderasyon Özeti',
  metrics: 'Metrikler',
  source: 'Kaynak',
  revision: 'Revizyon',
  tags: 'Etiketler',
} satisfies Record<keyof Listing, string>

export const RESIDENTIAL_ATTRIBUTE_LABEL = {
  grossSquareMeters: 'Brüt m²',
  netSquareMeters: 'Net m²',
  roomCount: 'Oda Sayısı',
  buildingAge: 'Bina Yaşı',
  floorLocation: 'Bulunduğu Kat',
  floorCount: 'Kat Sayısı',
  heatingType: 'Isıtma Tipi',
  bathroomCount: 'Banyo Sayısı',
  hasBalcony: 'Balkon',
  hasElevator: 'Asansör',
  parkingType: 'Otopark',
  furnished: 'Eşyalı',
  occupancyStatus: 'Kullanım Durumu',
  inComplex: 'Site İçerisinde',
  complexName: 'Site Adı',
  monthlyFee: 'Aidat',
  loanEligibility: 'Krediye Uygunluk',
  titleDeedStatus: 'Tapu Durumu',
  swapAccepted: 'Takas',
} satisfies Record<keyof ResidentialAttributes, string>

export const LAND_ATTRIBUTE_LABEL = {
  squareMeters: 'm²',
  zoningStatus: 'İmar Durumu',
  block: 'Ada',
  parcel: 'Parsel',
  mapSheet: 'Pafta',
  floorAreaRatio: 'KAKS',
  maxBuildingHeightMeters: 'Gabari',
  pricePerSquareMeter: 'm² Fiyatı',
  roadFrontageMeters: 'Yol Cephesi',
  infrastructure: 'Altyapı',
} satisfies Record<keyof LandAttributes, string>

export const COMMERCIAL_ATTRIBUTE_LABEL = {
  squareMeters: 'm²',
  roomCount: 'Oda Sayısı',
  floorCount: 'Kat Sayısı',
  floorLocation: 'Bulunduğu Kat',
  heatingType: 'Isıtma Tipi',
  deposit: 'Depozito',
  buildingCondition: 'Yapının Durumu',
  hasElevator: 'Asansör',
  parkingType: 'Otopark',
  furnished: 'Eşyalı',
  monthlyFee: 'Aidat',
  transferFee: 'Devir Bedeli',
  occupancyStatus: 'Kullanım Durumu',
} satisfies Record<keyof CommercialAttributes, string>

export const BUILDING_ATTRIBUTE_LABEL = {
  totalSquareMeters: 'Toplam m²',
  netSquareMeters: 'Net m²',
  buildingAge: 'Bina Yaşı',
  floorCount: 'Kat Sayısı',
  independentUnitCount: 'Bağımsız Bölüm Sayısı',
  hasOccupancyPermit: 'Yapı Kullanım İzni',
  hasElevator: 'Asansör',
  parkingType: 'Otopark',
  heatingType: 'Isıtma Tipi',
  usageType: 'Kullanım Tipi',
  monthlyRentalIncome: 'Aylık Kira Getirisi',
  titleDeedStatus: 'Tapu Durumu',
  swapAccepted: 'Takas',
} satisfies Record<keyof BuildingAttributes, string>

export const TIMESHARE_ATTRIBUTE_LABEL = {
  facilityName: 'Tesis Adı',
  squareMeters: 'm²',
  roomCount: 'Oda Sayısı',
  usagePeriod: 'Kullanım Dönemi',
  usageDays: 'Kullanım Günü',
  season: 'Sezon',
  annualMaintenanceFee: 'Yıllık Aidat',
  titleDeedStatus: 'Tapu Durumu',
  exchangeProgram: 'Değişim Programı',
  furnished: 'Eşyalı',
} satisfies Record<keyof TimeshareAttributes, string>

export const TOURISM_FACILITY_ATTRIBUTE_LABEL = {
  roomCount: 'Oda Sayısı',
  bedCount: 'Yatak Sayısı',
  starRating: 'Yıldız Sayısı',
  floorCount: 'Kat Sayısı',
  indoorSquareMeters: 'Kapalı Alan',
  outdoorSquareMeters: 'Açık Alan',
  buildingAge: 'Bina Yaşı',
  hasOperatingLicense: 'İşletme Ruhsatı',
  hasAlcoholLicense: 'Alkol Ruhsatı',
  distanceToBeachMeters: 'Sahile Uzaklık',
  buildingCondition: 'Yapının Durumu',
  furnished: 'Eşyalı',
  parkingType: 'Otopark',
  transferIncluded: 'Devir Dahil',
  annualRevenue: 'Yıllık Ciro',
} satisfies Record<keyof TourismFacilityAttributes, string>
