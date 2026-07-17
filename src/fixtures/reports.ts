import { ReportReason, ReportSeverity, ReportStatus, type ListingReport } from '../types/domain'

/**
 * Şikayet fixture'ları.
 *
 * Her şikayet **gerçek bir ilan fixture'ına** (`listings.ts`) ve gerçek bir
 * kullanıcıya (`users.ts`) bağlıdır; uydurulmuş `listingId` yoktur. Faz 3'te
 * şikayet kuyruğu ilan başlığını ve şikayetçiyi yan yana gösterecek — eşleşmeyen
 * bir kimlik orada "—" olarak görünür.
 *
 * **Sayaç sözleşmesi:** bir ilanın `metrics.reportCount` değeri o ilanın
 * **sonuçlanmamış** (`open` + `inReview`) şikayet sayısıdır; `resolved`/`dismissed`
 * sayaçtan düşer. `listings.ts`'teki sayılar bu dosyayı bağlar:
 *
 * | İlan                                  | `metrics.reportCount` | Buradaki şikayetler          |
 * | ------------------------------------- | --------------------- | ---------------------------- |
 * | `listing-land-corlu-field`            | 1                     | 1 `open`                     |
 * | `listing-tourism-marmaris-pension`    | 2                     | 1 `open` + 1 `inReview`      |
 * | `listing-residential-kadikoy-apartment` | 0                   | 3 kapalı (2 `dismissed`, 1 `resolved`) |
 * | `listing-building-osmangazi-archived` | 0                     | 1 `dismissed`                |
 *
 * Sayaç "toplam şikayet" olsaydı Kadıköy dairesinin üç şikayeti onun
 * `reportCount: 0` değeriyle çelişirdi ve iki fixture dosyası birbirini yalanlardı.
 * "Aynı ilana bağlı üç şikayet" örneği bu yüzden kasten **yayındaki** bir ilana
 * bağlandı: bir kullanıcının görmediği ilanı şikayet edemeyeceği tek yer burası.
 *
 * `assignedAdminId` de rastgele değil, `ROLE_PERMISSIONS`'a uyar: sonuçlandıran
 * her şikayet `AdminPermission.ReportResolve`'u olan bir role (moderatör veya süper
 * admin) atanmıştır. İçerik denetçisinde `ReportResolve` yok — o yüzden Burak Şahin
 * yalnız `inReview` şikayette görünür.
 *
 * Tarihler sabit ISO + `+03:00`; her şikayetin `createdAt`'i bağlı olduğu ilanın
 * `createdAt`'inden sonradır ve `resolvedAt` her zaman `createdAt`'ten sonradır.
 */

interface ReportFixtureArgs {
  id: string
  listingId: string
  reporterUserId?: string
  reason: ReportReason
  detail?: string
  status: ReportStatus
  severity: ReportSeverity
  assignedAdminId?: string
  resolutionNote?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

/**
 * Opsiyonel alanlar koşullu spread ile veriliyor — `exactOptionalPropertyTypes`
 * açıkken opsiyonel bir alana açıkça `undefined` atanamaz (TS2375). Alan ya vardır
 * ya yoktur; `listings.ts` ve `moderationEvents.ts` ile aynı gerekçe.
 */
function createReport(args: ReportFixtureArgs): ListingReport {
  return {
    id: args.id,
    listingId: args.listingId,
    ...(args.reporterUserId !== undefined && { reporterUserId: args.reporterUserId }),
    reason: args.reason,
    ...(args.detail !== undefined && { detail: args.detail }),
    status: args.status,
    severity: args.severity,
    ...(args.assignedAdminId !== undefined && { assignedAdminId: args.assignedAdminId }),
    ...(args.resolutionNote !== undefined && { resolutionNote: args.resolutionNote }),
    createdAt: args.createdAt,
    updatedAt: args.updatedAt,
    ...(args.resolvedAt !== undefined && { resolvedAt: args.resolvedAt }),
  }
}

/**
 * Arşivlenmiş ilana bağlı şikayet — `dismissed`.
 *
 * `moderationEvents.ts`'teki `archivedBuildingHistory` ile **aynı olay**, şikayet
 * tarafından görünümü:
 *
 * - `createdAt`, `event-osmangazi-8` (`reportLinked`) ile aynı an: 2026-05-20 14:22.
 * - Gerekçe, o olayın notundaki "yanıltıcı bilgi" ifadesinin enum karşılığı.
 * - `resolutionNote` ve `resolvedAt`, `event-osmangazi-11` (`resumed`) ile birebir
 *   aynı: ilan yayına şikayet asılsız bulunduğu için geri döndü. İki dosya ayrı
 *   şey söylerse Faz 3'te "şikayet neden kapandı?" sorusunun iki cevabı olur.
 *
 * Şikayetçi `user-banned-kemal-oz`: şikayet 2026-05-20'de açıldı, ban 2026-06-26'da
 * verildi — yani şikayet ban'dan önce. Asılsız çıkan bu şikayet, o ban'ın
 * gerekçesinin (`permanentBanSanction`) kanıtı.
 */
export const reportDismissedArchivedBuilding: ListingReport = createReport({
  id: 'report-osmangazi-misleading',
  listingId: 'listing-building-osmangazi-archived',
  reporterUserId: 'user-banned-kemal-oz',
  reason: ReportReason.MisleadingInformation,
  detail: 'İlanda belirtilen aylık kira geliri gerçek değil, rakam şişirilmiş.',
  status: ReportStatus.Dismissed,
  severity: ReportSeverity.Medium,
  assignedAdminId: 'admin-moderator-1',
  resolutionNote: 'Şikayet asılsız bulundu; kira geliri belgeyle doğrulandı.',
  createdAt: '2026-05-20T14:22:00+03:00',
  updatedAt: '2026-05-28T10:00:00+03:00',
  resolvedAt: '2026-05-28T10:00:00+03:00',
})

/**
 * Kadıköy dairesine açılan üç şikayetin ilki — `dismissed`, **anonim**.
 *
 * `reporterUserId` kasten yok: şikayet formu oturum açmadan da doldurulabiliyor.
 * Şikayetçiyi gösteren her ekranın bu hâli karşılaması gerekiyor; alanın yokluğu
 * bir durum, boş string değil.
 */
export const reportDismissedNetArea: ListingReport = createReport({
  id: 'report-kadikoy-net-area',
  listingId: 'listing-residential-kadikoy-apartment',
  reason: ReportReason.MisleadingInformation,
  detail: 'İlandaki net metrekare değeri olduğundan büyük gösterilmiş.',
  status: ReportStatus.Dismissed,
  severity: ReportSeverity.Medium,
  assignedAdminId: 'admin-moderator-1',
  resolutionNote: 'Net alan tapu ve proje bilgisiyle karşılaştırıldı; ilandaki değer doğru.',
  createdAt: '2026-07-10T18:40:00+03:00',
  updatedAt: '2026-07-11T09:15:00+03:00',
  resolvedAt: '2026-07-11T09:15:00+03:00',
})

/**
 * `open`, düşük şiddet — brifing 5.2'nin ilk kaydı.
 *
 * `landRejectedField` zaten mükerrer ilan gerekçesiyle reddedilmişti (bkz.
 * `rejectedFieldHistory`); şikayet karardan sonra kuyruğa düştü. Şiddetin düşük
 * olmasının sebebi bu: ilan zaten yayında değil, şikayet yalnız kapatılmayı
 * bekliyor. Ayrıntı, ilanın kendi `reviewNote`'undaki 1245700021 numarasına
 * bilerek atıf yapıyor.
 *
 * `assignedAdminId` **yok**: henüz kimse üzerine almadı. Kuyruk ekranının
 * "atanmamış" hâli bu kayıtla ölçülür.
 */
export const reportOpenLowDuplicate: ListingReport = createReport({
  id: 'report-corlu-duplicate',
  listingId: 'listing-land-corlu-field',
  reporterUserId: 'user-suspended-mert-yildiz',
  reason: ReportReason.DuplicateListing,
  detail: 'Aynı ada ve parsel için 1245700021 numaralı ilan hâlâ yayında; fotoğraflar da aynı.',
  status: ReportStatus.Open,
  severity: ReportSeverity.Low,
  createdAt: '2026-07-12T15:30:00+03:00',
  updatedAt: '2026-07-12T15:30:00+03:00',
})

/** Kadıköy dairesine açılan üç şikayetin ikincisi — `dismissed`, satıldı iddiası asılsız. */
export const reportDismissedSoldClaim: ListingReport = createReport({
  id: 'report-kadikoy-sold-claim',
  listingId: 'listing-residential-kadikoy-apartment',
  reporterUserId: 'user-suspended-mert-yildiz',
  reason: ReportReason.SoldOrRented,
  detail: 'Bu daire satıldı, ilan hâlâ yayında duruyor.',
  status: ReportStatus.Dismissed,
  severity: ReportSeverity.Low,
  assignedAdminId: 'admin-moderator-1',
  resolutionNote: 'İlan sahibiyle görüşüldü; taşınmaz satılmamış, ilan yayında kalıyor.',
  createdAt: '2026-07-12T20:05:00+03:00',
  updatedAt: '2026-07-13T10:20:00+03:00',
  resolvedAt: '2026-07-13T10:20:00+03:00',
})

/**
 * `open`, kritik sahte ilan şüphesi — brifing 5.2'nin ikinci kaydı ve kuyruğun en
 * öncelikli satırı.
 *
 * `tourismRejectedPension` zaten "yetki belgesi eksik" ve "belge uyuşmazlığı"
 * gerekçeleriyle reddedilmişti; kritik şiddet o tabloyu tamamlıyor.
 * `assignedAdminId` **yok** — kritik ama hâlâ atanmamış bir şikayet, kuyruğun en
 * kötü hâli ve dashboard'un "açık şikayet" sayacının asıl derdi.
 */
export const reportOpenCriticalFraud: ListingReport = createReport({
  id: 'report-pension-fraud',
  listingId: 'listing-tourism-marmaris-pension',
  reporterUserId: 'user-construction-yapi-proje',
  reason: ReportReason.SuspectedFraud,
  detail:
    'Aynı tesis fotoğrafları başka bir ilanda farklı işletme adıyla kullanılıyor ve rezervasyon için ön ödeme isteniyor.',
  status: ReportStatus.Open,
  severity: ReportSeverity.Critical,
  createdAt: '2026-07-13T09:12:00+03:00',
  updatedAt: '2026-07-13T09:12:00+03:00',
})

/**
 * `inReview` — brifing 5.2'nin üçüncü kaydı.
 *
 * Atanan admin **içerik denetçisi** (`admin-content-reviewer-1`): `ROLE_PERMISSIONS`
 * ona `ReportView` + `ReportTriageLimited` veriyor, `ReportTriage` veya
 * `ReportResolve` **vermiyor**. Yani bu şikayet okunabilir, sınıflandırılabilir,
 * eskale edilebilir — ama o rol tarafından kapatılamaz. Bu turda karara bağlanan
 * "Sınırlı" triage kademesinin fixture karşılığı: "sonuçlandır" butonunun hiç
 * render edilmediği hâl.
 *
 * `severity: High` ve `assignedAdminId` bilerek dolu ve bilerek **denetçinin
 * kendi eseri değil**: `ReportTriageLimited` bu iki alanı değiştiremiyor, ikisini
 * de tam yetkili bir rol atadı. Denetçinin ekranında bu alanlar salt okunur.
 */
export const reportInReviewFalseLicense: ListingReport = createReport({
  id: 'report-pension-license',
  listingId: 'listing-tourism-marmaris-pension',
  reporterUserId: 'user-owner-ayse-demir',
  reason: ReportReason.MisleadingInformation,
  detail: 'İlanda işletme belgesi olduğu yazıyor; tesisin böyle bir belgesi bulunmuyor.',
  status: ReportStatus.InReview,
  severity: ReportSeverity.High,
  assignedAdminId: 'admin-content-reviewer-1',
  createdAt: '2026-07-13T11:40:00+03:00',
  updatedAt: '2026-07-14T09:30:00+03:00',
})

/**
 * Kadıköy dairesine açılan üç şikayetin üçüncüsü — `resolved`.
 *
 * `dismissed` ile farkı kasten kurulmuş: şikayet **haklı** çıktı, bir işlem
 * yapıldı — ama işlem *başka* bir ilanda yapıldı. Bu ilan fotoğrafın asıl sahibi
 * olduğu için burada hiçbir şey değişmedi. Bu ayrım önemli, çünkü ilanın kendisi
 * değişseydi `revision` 2'ye çıkardı ve `residentialPublishedApartment.revision: 1`
 * ile çelişirdi: fixture kendi geçmişiyle çelişemez.
 */
export const reportResolvedPhotoOwnership: ListingReport = createReport({
  id: 'report-kadikoy-photo-ownership',
  listingId: 'listing-residential-kadikoy-apartment',
  reporterUserId: 'user-construction-yapi-proje',
  reason: ReportReason.Other,
  detail: 'İlanın kapak fotoğrafı başka bir ilanda da kullanılıyor.',
  status: ReportStatus.Resolved,
  severity: ReportSeverity.Medium,
  assignedAdminId: 'admin-super-1',
  resolutionNote:
    'Fotoğrafın asıl kullanıcısı bu ilan; kopyayı kullanan diğer ilan hakkında işlem yapıldı, bu ilanda değişiklik gerekmedi.',
  createdAt: '2026-07-13T14:30:00+03:00',
  updatedAt: '2026-07-15T11:45:00+03:00',
  resolvedAt: '2026-07-15T11:45:00+03:00',
})

/**
 * Yedi şikayetin tamamı, `createdAt`'e göre **eskiden yeniye** sıralı.
 *
 * Sıra sabittir (brifing 5.2: "liste fixture sırası sabit olmalıdır"); kuyruğu
 * yeniden sıralamak listenin değil ekranın işi — burada sabit bir taban var ki
 * sıralama testleri neyi ölçtüğünü bilsin.
 */
export const allReportFixtures: ListingReport[] = [
  reportDismissedArchivedBuilding,
  reportDismissedNetArea,
  reportOpenLowDuplicate,
  reportDismissedSoldClaim,
  reportOpenCriticalFraud,
  reportInReviewFalseLicense,
  reportResolvedPhotoOwnership,
]

/**
 * Aynı ilana (`listing-residential-kadikoy-apartment`) bağlı üç şikayet — brifing
 * 5.2'nin altıncı kaydı.
 *
 * İlan detayının "bu ilanın şikayet geçmişi" bölümünün kaynağı: üçü de kapalı,
 * ikisi reddedilmiş biri sonuçlandırılmış, biri anonim. Üçü birlikte ilanın
 * `metrics.reportCount: 0` değerini bozmaz — kapanmış şikayet sayaca girmez.
 */
export const kadikoyApartmentReports: ListingReport[] = [
  reportDismissedNetArea,
  reportDismissedSoldClaim,
  reportResolvedPhotoOwnership,
]

/** `listing-tourism-marmaris-pension`'ın sonuçlanmamış iki şikayeti — `metrics.reportCount: 2`. */
export const marmarisPensionReports: ListingReport[] = [
  reportOpenCriticalFraud,
  reportInReviewFalseLicense,
]

/**
 * Her `ReportStatus` için bir örnek.
 *
 * `satisfies Record<ReportStatus, ListingReport>` bilerek: yeni bir durum
 * eklenirse bu tablo derlenmez ve örneksiz durum sessizce story'lerin dışında
 * kalmaz (`listingByStatus` ile aynı kalıp). `Open` için kritik olan seçildi —
 * kuyruğun temsilcisi düşük şiddetli değil, en acil satırdır.
 */
export const reportByStatus = {
  [ReportStatus.Open]: reportOpenCriticalFraud,
  [ReportStatus.InReview]: reportInReviewFalseLicense,
  [ReportStatus.Resolved]: reportResolvedPhotoOwnership,
  [ReportStatus.Dismissed]: reportDismissedArchivedBuilding,
} satisfies Record<ReportStatus, ListingReport>

/** Her `ReportSeverity` için bir örnek — şiddet rozetinin dört hâli. */
export const reportBySeverity = {
  [ReportSeverity.Low]: reportOpenLowDuplicate,
  [ReportSeverity.Medium]: reportResolvedPhotoOwnership,
  [ReportSeverity.High]: reportInReviewFalseLicense,
  [ReportSeverity.Critical]: reportOpenCriticalFraud,
} satisfies Record<ReportSeverity, ListingReport>

/** Hiç şikayeti olmayan ilan — `empty` story'si için. */
export const emptyReportFixtures: ListingReport[] = []
