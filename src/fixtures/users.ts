import {
  AdminRole,
  UserStatus,
  UserType,
  type UserAccount,
  type UserSanction,
} from '../types/domain'

/**
 * Kullanıcı hesabı fixture'ları.
 *
 * **Kimlikler `listings.ts` ve `moderationEvents.ts`'ten gelir, uydurulmaz.**
 * `listing-residential-konyaalti-villa`'nın `ownerUserId`'si zaten
 * `user-owner-ayse-demir`; `archivedBuildingHistory`'de kararı veren aktörün adı
 * zaten "Elif Kaya". Bu dosya o kimliklerin **hesap tarafını** yazıyor, yenisini
 * icat etmiyor: Faz 3'te kullanıcı detayı ile ilan listesi yan yana gelecek ve
 * eşleşmeyen bir `ownerUserId` orada boş bir satır olarak görünür.
 *
 * Sayaçların anlamı — üçü de `listings.ts` sayılarak doldurulmuştur, tahminle değil:
 *
 * - `listingCount`: kullanıcının `allListingFixtures` içindeki ilanlarının sayısı.
 *   Fixture setinde ilanı olmayan kullanıcıda 0'dır; "gerçekte vardır ama fixture'a
 *   girmedi" diye bir sayı yazılmaz, yoksa iki dosya birbirini yalanlar.
 * - `activeListingCount`: bunların yalnız `ListingStatus.Published` olanları.
 *   `paused`/`expired` yayında değildir; `commercialPausedWarehouse` Yapı Proje'nin
 *   ilanıdır ama aktif sayılmaz.
 * - `reportCount`: kullanıcının ilanlarına açılmış **sonuçlanmamış** (`open` +
 *   `inReview`) şikayet sayısı — yani ilanların `metrics.reportCount` toplamı.
 *   `reports.ts` bu tanımı aynen kullanıyor: `resolved`/`dismissed` şikayet
 *   sayaçtan düşer, yoksa "kapanmış şikayet" rozeti sonsuza kadar yanar.
 *
 * Telefonlar sentetik `555`, e-postalar `.invalid`. Tarihler sabit ISO + `+03:00`;
 * `new Date()` veya rastgelelik yok.
 *
 * `avatarUrl` **hiçbir kayıtta yok**: `public/fixtures/avatars/` boş ve fixture
 * görselleri ağ bağlantısına bağımlı olamaz. Var olmayan bir dosyaya işaret eden
 * `avatarUrl`, Avatar component'inin baş harf yedeğini story'de gizlice test eder
 * ve "kırık görsel" hâlini normalleştirir. Alan opsiyoneldir; yokluğu bir durumdur.
 */

interface UserFixtureArgs {
  id: string
  fullName: string
  email: string
  phone: string
  type: UserType
  status: UserStatus
  verified: boolean
  adminRole?: AdminRole
  companyName?: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  listingCount?: number
  activeListingCount?: number
  reportCount?: number
}

/**
 * Opsiyonel alanlar koşullu spread ile veriliyor — `exactOptionalPropertyTypes`
 * açıkken opsiyonel bir alana açıkça `undefined` atanamaz (TS2375). Alan ya vardır
 * ya yoktur; `listings.ts` ve `moderationEvents.ts` ile aynı gerekçe.
 */
function createUser(args: UserFixtureArgs): UserAccount {
  return {
    id: args.id,
    fullName: args.fullName,
    email: args.email,
    phone: args.phone,
    type: args.type,
    status: args.status,
    ...(args.adminRole !== undefined && { adminRole: args.adminRole }),
    verified: args.verified,
    ...(args.companyName !== undefined && { companyName: args.companyName }),
    createdAt: args.createdAt,
    updatedAt: args.updatedAt,
    ...(args.lastLoginAt !== undefined && { lastLoginAt: args.lastLoginAt }),
    listingCount: args.listingCount ?? 0,
    activeListingCount: args.activeListingCount ?? 0,
    reportCount: args.reportCount ?? 0,
  }
}

/**
 * Aktif bireysel ilan sahibi — `listings.ts`'teki `ownerSeller`'ın hesabı.
 *
 * Dört ilanı var: `residentialPendingVilla` (`pendingReview`),
 * `landDraftResidentialZoned` (`draft`), `buildingArchivedMixedUse` (`archived`),
 * `timesharePublishedBodrum` (`published`). Yalnız sonuncusu yayında, bu yüzden
 * `activeListingCount` 4 değil 1. Şikayet sayacı 0: arşivlenmiş binasına açılan
 * tek şikayet asılsız bulunup kapandı (bkz. `reports.ts`).
 *
 * E-postası `listings.ts`'teki ilan iletişim e-postasıyla birebir aynı; ofis
 * hesaplarında öyle değil, çünkü ilan `contact.email`'i orada ortak bir kutu.
 */
export const activeIndividualOwner: UserAccount = createUser({
  id: 'user-owner-ayse-demir',
  fullName: 'Ayşe Demir',
  email: 'ayse.demir@example.invalid',
  phone: '+90 555 000 11 22',
  type: UserType.Individual,
  status: UserStatus.Active,
  verified: true,
  createdAt: '2024-03-12T10:20:00+03:00',
  updatedAt: '2026-06-02T09:14:00+03:00',
  lastLoginAt: '2026-07-16T08:05:00+03:00',
  listingCount: 4,
  activeListingCount: 1,
  reportCount: 0,
})

/**
 * Doğrulanmış emlak ofisi — `listings.ts`'teki `officeSeller`'ın hesabı.
 *
 * Fixture setinin en yoğun kullanıcısı: altı ilan (`kadikoy-apartment`,
 * `corlu-field`, `sisli-office`, `cankaya-complete`, `afyon-thermal`,
 * `marmaris-pension`), ama yalnız biri yayında. `reportCount: 3`,
 * `corlu-field`'ın 1 ve `marmaris-pension`'ın 2 sonuçlanmamış şikayetinin
 * toplamıdır — ikisi de o ilanların `metrics.reportCount` değerinden gelir.
 *
 * Hesap e-postası ilanın `contact.email`'inden ayrıdır: `listings.ts` bütün
 * kurumsal ilanlarda ortak `ilan@example.invalid` kutusunu gösteriyor, ama hesap
 * kimliği kullanıcıya özgü olmak zorunda.
 */
export const verifiedRealEstateOffice: UserAccount = createUser({
  id: 'user-office-marmara-emlak',
  fullName: 'Marmara Emlak Danışmanlığı',
  email: 'yonetim@marmaraemlak.example.invalid',
  phone: '+90 555 212 01 40',
  type: UserType.RealEstateOffice,
  status: UserStatus.Active,
  verified: true,
  companyName: 'Marmara Emlak Danışmanlık Ltd. Şti.',
  createdAt: '2023-11-02T09:00:00+03:00',
  updatedAt: '2026-05-19T14:30:00+03:00',
  lastLoginAt: '2026-07-16T09:40:00+03:00',
  listingCount: 6,
  activeListingCount: 1,
  reportCount: 3,
})

/**
 * Doğrulanmış inşaat firması — `listings.ts`'teki `constructionSeller`'ın hesabı.
 *
 * İki ilanı var: `commercialPausedWarehouse` (`paused`) ve
 * `tourismPublishedBoutiqueHotel` (`published`). Pasif ilan yayında sayılmadığı
 * için `activeListingCount: 1`.
 */
export const verifiedConstructionCompany: UserAccount = createUser({
  id: 'user-construction-yapi-proje',
  fullName: 'Yapı Proje Gayrimenkul',
  email: 'yonetim@yapiproje.example.invalid',
  phone: '+90 555 262 55 08',
  type: UserType.ConstructionCompany,
  status: UserStatus.Active,
  verified: true,
  companyName: 'Yapı Proje İnşaat A.Ş.',
  createdAt: '2025-01-20T11:30:00+03:00',
  updatedAt: '2026-04-08T16:12:00+03:00',
  lastLoginAt: '2026-07-15T17:25:00+03:00',
  listingCount: 2,
  activeListingCount: 1,
  reportCount: 0,
})

/**
 * Doğrulama bekleyen kurumsal hesap — `UserStatus.PendingVerification`.
 *
 * Brifing 5.2 bu kaydı istemiyor, ama `userByStatus` dört durumu da kapsayan bir
 * `Record` (bkz. `listingByStatus`) ve dördüncü durumun örneği olmadan o tablo
 * yazılamaz. Eksik durum, ilan listesinde `pendingVerification` rozetinin hiç
 * görülmemesi demektir.
 *
 * **`lastLoginAt` kasten yok:** hesap açıldı, doğrulama belgesi beklenirken
 * kullanıcı bir daha girmedi. Alanın yokluğu bir durum ve "hiç giriş yapmadı"
 * hâlini tarih biçimlendiren her ekranın karşılaması gerekiyor.
 */
export const pendingVerificationOffice: UserAccount = createUser({
  id: 'user-pending-office-ege-emlak',
  fullName: 'Ege Emlak ve Danışmanlık',
  email: 'kayit@egeemlak.example.invalid',
  phone: '+90 555 232 74 19',
  type: UserType.RealEstateOffice,
  status: UserStatus.PendingVerification,
  verified: false,
  companyName: 'Ege Emlak Danışmanlık A.Ş.',
  createdAt: '2026-07-15T12:00:00+03:00',
  updatedAt: '2026-07-15T12:00:00+03:00',
})

/**
 * Askıya alınmış bireysel kullanıcı.
 *
 * `listings.ts`'te ona ait ilan **yok**, bu yüzden üç sayaç da 0 — ve yaptırım
 * gerekçesi de bu yüzden ilanla ilgili değil, mesajlaşmayla ilgili. "Mükerrer ilan"
 * gerekçesi yazsaydık `listingCount: 0` ile çelişirdi.
 *
 * `reports.ts`'te iki şikayeti var: askıdan önceki tarihlerde açılmışlar
 * (`2026-07-12` ve `2026-07-13`), askı ise `2026-07-15`. Yaptırım tarihinden sonra
 * o kullanıcı adına yeni bir kayıt üretilmiyor.
 */
export const suspendedIndividual: UserAccount = createUser({
  id: 'user-suspended-mert-yildiz',
  fullName: 'Mert Yıldız',
  email: 'mert.yildiz@example.invalid',
  phone: '+90 555 341 88 06',
  type: UserType.Individual,
  status: UserStatus.Suspended,
  verified: true,
  createdAt: '2025-08-14T13:05:00+03:00',
  updatedAt: '2026-07-15T10:30:00+03:00',
  lastLoginAt: '2026-07-14T22:10:00+03:00',
})

/**
 * Kalıcı olarak engellenmiş bireysel kullanıcı.
 *
 * Hesabın hikâyesi `moderationEvents.ts` ile örtüşür: `archivedBuildingHistory`'nin
 * sekizinci olayı (`reportLinked`, 2026-05-20) onun açtığı şikayettir ve o şikayet
 * `resumed` olayında "asılsız bulundu" diye kapanmıştır. Ban gerekçesi tam olarak
 * budur ve `reports.ts`'teki `reportDismissedArchivedBuilding` onun kanıtıdır.
 *
 * `lastLoginAt` ban tarihinden **önce**: engellenen hesap giriş yapamaz.
 */
export const bannedIndividual: UserAccount = createUser({
  id: 'user-banned-kemal-oz',
  fullName: 'Kemal Öz',
  email: 'kemal.oz@example.invalid',
  phone: '+90 555 507 62 41',
  type: UserType.Individual,
  status: UserStatus.Banned,
  verified: false,
  createdAt: '2025-02-03T16:45:00+03:00',
  updatedAt: '2026-06-26T11:00:00+03:00',
  lastLoginAt: '2026-06-25T20:35:00+03:00',
})

/**
 * Süper admin — `AdminRole.SuperAdmin`.
 *
 * `moderationEvents.ts`'te aktörü olmayan tek admin rolü; kimliği bu yüzden burada
 * uyduruldu (`admin-super-1`). Diğer üçü moderasyon geçmişinden geliyor ve
 * `displayName`'leri oradaki `ModerationActor`'larla birebir aynı olmak zorunda.
 */
export const superAdminUser: UserAccount = createUser({
  id: 'admin-super-1',
  fullName: 'Selin Aydın',
  email: 'selin.aydin@ilanadmin.example.invalid',
  phone: '+90 555 900 10 01',
  type: UserType.Admin,
  status: UserStatus.Active,
  verified: true,
  adminRole: AdminRole.SuperAdmin,
  createdAt: '2023-09-01T09:00:00+03:00',
  updatedAt: '2026-02-11T10:45:00+03:00',
  lastLoginAt: '2026-07-16T07:50:00+03:00',
})

/** Moderatör — `moderationEvents.ts`'teki `moderatorActor` ("Elif Kaya") ile aynı kişi. */
export const moderatorUser: UserAccount = createUser({
  id: 'admin-moderator-1',
  fullName: 'Elif Kaya',
  email: 'elif.kaya@ilanadmin.example.invalid',
  phone: '+90 555 900 10 02',
  type: UserType.Admin,
  status: UserStatus.Active,
  verified: true,
  adminRole: AdminRole.Moderator,
  createdAt: '2024-01-15T09:30:00+03:00',
  updatedAt: '2026-03-04T11:20:00+03:00',
  lastLoginAt: '2026-07-16T08:15:00+03:00',
})

/**
 * İçerik denetçisi — `moderationEvents.ts`'teki `contentReviewerActor`
 * ("Burak Şahin") ile aynı kişi.
 *
 * `listings.ts` de onu tanıyor: `pendingReview` durumundaki ilanların
 * `moderation.currentReviewerId` alanı `admin-content-reviewer-1`.
 */
export const contentReviewerUser: UserAccount = createUser({
  id: 'admin-content-reviewer-1',
  fullName: 'Burak Şahin',
  email: 'burak.sahin@ilanadmin.example.invalid',
  phone: '+90 555 900 10 03',
  type: UserType.Admin,
  status: UserStatus.Active,
  verified: true,
  adminRole: AdminRole.ContentReviewer,
  createdAt: '2024-06-03T10:00:00+03:00',
  updatedAt: '2026-05-27T15:05:00+03:00',
  lastLoginAt: '2026-07-16T09:02:00+03:00',
})

/** Destek — `moderationEvents.ts`'teki `supportActor` ("Deniz Arslan") ile aynı kişi. */
export const supportUser: UserAccount = createUser({
  id: 'admin-support-1',
  fullName: 'Deniz Arslan',
  email: 'deniz.arslan@ilanadmin.example.invalid',
  phone: '+90 555 900 10 04',
  type: UserType.Admin,
  status: UserStatus.Active,
  verified: true,
  adminRole: AdminRole.Support,
  createdAt: '2025-04-21T09:15:00+03:00',
  updatedAt: '2026-06-30T13:40:00+03:00',
  lastLoginAt: '2026-07-16T08:40:00+03:00',
})

/**
 * On kullanıcının tamamı, sabit sırada: önce platform kullanıcıları (durum
 * sırasıyla), sonra dört admin (rol sırasıyla). Sıra sabittir — brifing 5.2'nin
 * "liste fixture sırası sabit olmalıdır" kuralı.
 */
export const allUserFixtures: UserAccount[] = [
  activeIndividualOwner,
  verifiedRealEstateOffice,
  verifiedConstructionCompany,
  pendingVerificationOffice,
  suspendedIndividual,
  bannedIndividual,
  superAdminUser,
  moderatorUser,
  contentReviewerUser,
  supportUser,
]

/** Yalnız admin hesapları — rol/yetki ekranlarının ihtiyacı olan alt küme. */
export const adminUserFixtures: UserAccount[] = [
  superAdminUser,
  moderatorUser,
  contentReviewerUser,
  supportUser,
]

/**
 * Her `UserStatus` için bir örnek.
 *
 * `satisfies Record<UserStatus, UserAccount>` bilerek: yeni bir durum eklenirse
 * bu tablo derlenmez ve örneksiz durum sessizce story'lerin dışında kalmaz
 * (`listingByStatus` ile aynı kalıp).
 */
export const userByStatus = {
  [UserStatus.PendingVerification]: pendingVerificationOffice,
  [UserStatus.Active]: activeIndividualOwner,
  [UserStatus.Suspended]: suspendedIndividual,
  [UserStatus.Banned]: bannedIndividual,
} satisfies Record<UserStatus, UserAccount>

/** Her `AdminRole` için bir hesap — yetki matrisi ve rol rozeti story'lerinin kaynağı. */
export const userByRole = {
  [AdminRole.SuperAdmin]: superAdminUser,
  [AdminRole.Moderator]: moderatorUser,
  [AdminRole.ContentReviewer]: contentReviewerUser,
  [AdminRole.Support]: supportUser,
} satisfies Record<AdminRole, UserAccount>

/** Her `UserType` için bir hesap. */
export const userByType = {
  [UserType.Individual]: activeIndividualOwner,
  [UserType.RealEstateOffice]: verifiedRealEstateOffice,
  [UserType.ConstructionCompany]: verifiedConstructionCompany,
  [UserType.Admin]: superAdminUser,
} satisfies Record<UserType, UserAccount>

/**
 * Yaptırım fixture'ları.
 *
 * `UserSanction` `domain.ts`'te tanımlı ama örneği yoktu: `suspended`/`banned`
 * kullanıcı kartı "neden askıda?" sorusunu cevaplamak zorunda ve gerekçe hesabın
 * kendisinde durmuyor.
 *
 * `createdByAdminId` rastgele seçilmedi — `ROLE_PERMISSIONS`'a uyar: askıyı
 * `AdminPermission.UserSuspend`'i olan moderatör, banı `AdminPermission.UserBan`'i
 * olan süper admin verdi. Yetkisi olmayan bir rolün imzaladığı yaptırım, yetki
 * matrisini fixture üzerinden yalanlardı.
 */
function createSanction(args: {
  id: string
  userId: string
  type: 'suspension' | 'ban'
  reason: string
  startsAt: string
  endsAt?: string
  createdByAdminId: string
  createdAt: string
  revokedAt?: string
}): UserSanction {
  return {
    id: args.id,
    userId: args.userId,
    type: args.type,
    reason: args.reason,
    startsAt: args.startsAt,
    ...(args.endsAt !== undefined && { endsAt: args.endsAt }),
    createdByAdminId: args.createdByAdminId,
    createdAt: args.createdAt,
    ...(args.revokedAt !== undefined && { revokedAt: args.revokedAt }),
  }
}

/**
 * Mert Yıldız'ın süreli askısı — 14 gün, `endsAt` dolu.
 *
 * Tarih `suspendedIndividual.updatedAt` ile aynı an: hesabın durumu tam da bu
 * yaptırımla değişti.
 */
export const activeSuspensionSanction: UserSanction = createSanction({
  id: 'sanction-suspension-mert-yildiz',
  userId: 'user-suspended-mert-yildiz',
  type: 'suspension',
  reason: 'Mesajlaşmada ısrarlı spam ve harici siteye yönlendirme.',
  startsAt: '2026-07-15T10:30:00+03:00',
  endsAt: '2026-07-29T10:30:00+03:00',
  createdByAdminId: 'admin-moderator-1',
  createdAt: '2026-07-15T10:30:00+03:00',
})

/**
 * Kemal Öz'ün süresiz banı — `endsAt` **yok**, çünkü ban süresiz.
 *
 * Askının aksine bitiş tarihi olmaması bir durum: "süresiz" bilgisini
 * `endsAt: undefined` ile değil, alanın yokluğuyla taşıyor.
 */
export const permanentBanSanction: UserSanction = createSanction({
  id: 'sanction-ban-kemal-oz',
  userId: 'user-banned-kemal-oz',
  type: 'ban',
  reason: 'Tekrarlayan asılsız şikayet ve doğrulanamayan kimlik bilgisi.',
  startsAt: '2026-06-26T11:00:00+03:00',
  createdByAdminId: 'admin-super-1',
  createdAt: '2026-06-26T11:00:00+03:00',
})

/** İki yaptırımın tamamı, tarihe göre sıralı. */
export const allUserSanctionFixtures: UserSanction[] = [
  permanentBanSanction,
  activeSuspensionSanction,
]
