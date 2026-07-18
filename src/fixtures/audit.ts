import { AdminPermission, AdminRole, type AuditLogEntry } from '../types/domain'

/**
 * Audit log fixture'ları.
 *
 * **Faz 3'te eklendi; brifingin dosya ağacında (5.3) yok ama ekranı (2.10) var.**
 * `AuditLogPage` ile `UserDetailPage`'in audit sekmesi bu veriyi arıyor ve başka
 * kaynağı yoktu — dosya ağacındaki eksiklik ile ekran şartının çelişkisi, ekran
 * lehine çözüldü: fixture'sız bir ekran render edilemez.
 *
 * ## Audit log, moderasyon geçmişi değildir
 *
 * İkisi benzer görünüp **farklı soru** cevaplıyor ve karıştırılırsa iki ekran
 * aynı şeyi iki kez gösterir:
 *
 * - `ModerationEvent` (`moderationEvents.ts`) **ilana** bağlıdır: "bu ilana ne
 *   oldu". Aktörü çoğu zaman ilan sahibidir (`created`, `submitted`, `withdrawn`)
 *   ve yalnız tek bir varlık tipini tanır.
 * - `AuditLogEntry` **admine** bağlıdır: "bu admin ne yaptı". Altı varlık tipini
 *   birden kapsar (ilan, kullanıcı, şikayet, kategori, izin, tema) ve operasyonel
 *   güvenlik için tutulur (brifing 2.10: "operasyonel güvenlik ve moderasyon
 *   izlenebilirliği").
 *
 * Bu yüzden **ilan sahibinin eylemleri buraya girmez**: `actorRole` bir
 * `AdminRole` ve `ownerActor`'ın rolü yok. `event-villa-1` (ilan sahibi ilanı
 * oluşturdu) moderasyon geçmişindedir, audit'te karşılığı yoktur — audit "kim
 * yetkisini kullandı" sorusudur.
 *
 * ## `action` kodları `AdminPermission` sözlüğünden
 *
 * Kodlar uydurulmadı: `AdminPermission`'ın değerleri zaten eylem biçiminde
 * (`listing:reject`, `user:suspend`, `theme:setDefault`) ve **audit'e giren her
 * eylem tam olarak bir izin kapısından geçmiştir** — kapının adı eylemin de
 * adıdır. Yan fayda: etiket kanalı hazır geliyor, `ADMIN_PERMISSION_LABEL` 33
 * kodun hepsini Türkçeleştiriyor ve yeni bir sözlük yazmak gerekmiyor.
 *
 * `AuditLogEntry.action` yine de `string`: sunucu bu kümede olmayan bir kod
 * gönderebilir (`auth:login` gibi bir gün eklenirse). Ekran bu yüzden
 * `ADMIN_PERMISSION_LABEL[action] ?? action` diye okumalı — tanımadığı kodu ham
 * göstermek, boş hücre göstermekten iyidir.
 *
 * ## `metadata` sözleşmesi
 *
 * Brifing 2.10 üç veri istiyor — "önceki ve sonraki değerler" ve "istek veya
 * işlem korelasyon kimliği" — ama `AuditLogEntry`'de onları taşıyan alan yok;
 * tek taşıyıcı `metadata: Record<string, unknown>`. Sözleşme burada kuruldu:
 *
 * - `correlationId`: isteği sunucu loglarıyla eşleyen kimlik.
 * - `before` / `after`: değişen alanların önceki ve sonraki hâli. **Yalnız
 *   değişen alanlar** — kaydın tamamını iki kez yazmak farkı gizler, oysa
 *   ekranın sorusu "ne değişti".
 *
 * Bu, `domain.ts`'e alan eklemeden çözüldü: `domain.ts` fiilen FastAPI'nin
 * şartnamesi ve `metadata` zaten "yapılandırılmamış detay" için orada.
 * Drawer'daki JSON detayı (brifing 2.10) tam olarak bu nesnedir.
 *
 * ## Determinizm ve tutarlılık
 *
 * Tarihler sabit ISO + `+03:00`; `new Date()` yok. Dünyanın "bugün"ü
 * **2026-07-16** (dashboard penceresinin son günü, adminlerin `lastLoginAt`'i).
 *
 * Her kayıt **gerçek bir fixture'a** bağlı ve zamanı o fixture'ın kendi
 * zamanıyla birebir aynı — audit ile geçmiş ayrışırsa "karar ne zaman verildi"
 * sorusunun iki cevabı olur:
 *
 * | Audit kaydı                    | Aynası                                          |
 * | ------------------------------ | ----------------------------------------------- |
 * | `auditListingRejectedCorlu`    | `event-corlu-4` (moderationEvents) — 07-12 14:18 |
 * | `auditListingAssignedVilla`    | `event-villa-3` (moderationEvents) — 07-14 09:12 |
 * | `auditUserBannedKemal`         | `permanentBanSanction` (users) — 06-26 11:00     |
 * | `auditUserSuspendedMert`       | `activeSuspensionSanction` (users) — 07-15 10:30 |
 * | `auditReportResolvedPhoto`     | `reportResolvedPhotoOwnership.resolvedAt` — 07-15 11:45 |
 *
 * `actorRole` de rastgele değil, `ROLE_PERMISSIONS`'a uyar: her kaydın aktörü o
 * eylemin iznine gerçekten sahip. Kemal Öz'ü banlayan Selin Aydın
 * (`superAdmin`), Çorlu ilanını reddeden Elif Kaya (`moderator`) — içerik
 * denetçisi `user:ban`'a sahip olmadığı için hiçbir kullanıcı kaydında görünmez.
 */

interface AuditFixtureArgs {
  id: string
  actorId: string
  actorName: string
  actorRole: AdminRole
  action: AdminPermission
  entityType: AuditLogEntry['entityType']
  entityId: string
  summary: string
  metadata: Record<string, unknown>
  createdAt: string
}

/**
 * `action` parametresi `AdminPermission` alıyor ama alan `string` olarak
 * saklanıyor: fixture'ın kodu uydurmasını **tip düzeyinde** engelliyor, tüketici
 * sözleşmesini (`action: string`) daraltmadan.
 */
function createAuditEntry(args: AuditFixtureArgs): AuditLogEntry {
  return {
    id: args.id,
    actorId: args.actorId,
    actorName: args.actorName,
    actorRole: args.actorRole,
    action: args.action,
    entityType: args.entityType,
    entityId: args.entityId,
    summary: args.summary,
    metadata: args.metadata,
    createdAt: args.createdAt,
  }
}

/**
 * Kemal Öz süresiz banlandı — `permanentBanSanction`'ın audit tarafı.
 *
 * En eski kayıt. `before.status` `active`: ban öncesi hesap açıktı ve
 * `permanentBanSanction.reason` ile buradaki özet aynı olayı anlatıyor.
 */
export const auditUserBannedKemal: AuditLogEntry = createAuditEntry({
  id: 'audit-user-ban-kemal',
  actorId: 'admin-super-1',
  actorName: 'Selin Aydın',
  actorRole: AdminRole.SuperAdmin,
  action: AdminPermission.UserBan,
  entityType: 'user',
  entityId: 'user-banned-kemal-oz',
  summary: 'Kemal Öz süresiz olarak yasaklandı.',
  metadata: {
    correlationId: 'req-2026-06-26-a41c7d',
    sanctionId: 'sanction-ban-kemal-oz',
    before: { status: 'active' },
    after: { status: 'banned', sanctionType: 'ban' },
  },
  createdAt: '2026-06-26T11:00:00+03:00',
})

/**
 * `moderator` rolüne "İlan arşivleme" izni verildi.
 *
 * `ROLE_PERMISSIONS` ile **çelişmiyor, onu açıklıyor**: bugün moderatörde
 * `listing:archive` var (brifing 1.4: "İlan arşivleme" × `moderator` = "Tam") ve
 * bu kayıt o iznin oraya ne zaman geldiğini söylüyor. `before`/`after` yalnız
 * değişen izni taşıyor, rolün 20 küsur izninin tamamını değil.
 *
 * `entityId` rolün kendisi: izin matrisinde değişen satır rol × izin, ama
 * varlık roldür — izin bir varlık değil, rolün bir alanı.
 */
export const auditPermissionGrantedModerator: AuditLogEntry = createAuditEntry({
  id: 'audit-permission-moderator-archive',
  actorId: 'admin-super-1',
  actorName: 'Selin Aydın',
  actorRole: AdminRole.SuperAdmin,
  action: AdminPermission.PermissionManage,
  entityType: 'permission',
  entityId: AdminRole.Moderator,
  summary: 'Moderatör rolüne "İlan arşivleme" izni verildi.',
  metadata: {
    correlationId: 'req-2026-07-02-9be31f',
    role: AdminRole.Moderator,
    before: { granted: false },
    after: { granted: true },
    permission: AdminPermission.ListingArchive,
  },
  createdAt: '2026-07-02T16:20:00+03:00',
})

/**
 * Sistem varsayılan teması değiştirildi.
 *
 * `theme:setDefault` yalnız `superAdmin`'de (brifing 1.4'ün "Sistem teması
 * varsayılanı değiştirme" satırı) — bu yüzden aktör Selin Aydın. `after.theme`
 * `corporate-blue`: Storybook'un `initialGlobals`'ı ile aynı, yani fixture
 * dünyası ekranda gördüğümüz varsayılanı doğruluyor.
 */
export const auditThemeDefaultChanged: AuditLogEntry = createAuditEntry({
  id: 'audit-theme-default',
  actorId: 'admin-super-1',
  actorName: 'Selin Aydın',
  actorRole: AdminRole.SuperAdmin,
  action: AdminPermission.ThemeSetDefault,
  entityType: 'theme',
  entityId: 'system-default',
  summary: 'Sistem varsayılan teması "Kurumsal Mavi" olarak değiştirildi.',
  metadata: {
    correlationId: 'req-2026-07-08-1d70ac',
    before: { theme: 'neutral-slate' },
    after: { theme: 'corporate-blue' },
  },
  createdAt: '2026-07-08T10:05:00+03:00',
})

/**
 * Konut kategorisine yeni öznitelik eklendi.
 *
 * `entityType: 'category'`, `entityId` kategorinin kendisi: değişen şey
 * kategorinin öznitelik kümesi. Özniteliğin anahtarı `metadata`'da —
 * `CategoryAttributeDefinition`'ın kimliğine bağlanmıyor, çünkü audit kaydı
 * silinmiş bir özniteliğe de işaret edebilmeli.
 *
 * `category:manage` yalnız `superAdmin`'de (brifing 1.4).
 */
export const auditCategoryAttributeAdded: AuditLogEntry = createAuditEntry({
  id: 'audit-category-residential-attribute',
  actorId: 'admin-super-1',
  actorName: 'Selin Aydın',
  actorRole: AdminRole.SuperAdmin,
  action: AdminPermission.CategoryManage,
  entityType: 'category',
  entityId: 'residential',
  summary: 'Konut kategorisine "Site İçerisinde" özniteliği eklendi.',
  metadata: {
    correlationId: 'req-2026-07-10-55e0b2',
    attributeKey: 'inComplex',
    before: null,
    after: { dataType: 'boolean', required: false, filterable: true, visibleInList: false },
  },
  createdAt: '2026-07-10T11:35:00+03:00',
})

/**
 * Çorlu tarlası reddedildi — `event-corlu-4`'ün audit tarafı.
 *
 * Zaman, gerekçe ve not o olayla **birebir aynı**: karar üç yerde saklanıyor
 * (ilanın `moderation` özeti, moderasyon geçmişi, audit) ve üçünün ayrışması
 * "hangisi doğru?" sorusunu doğurur.
 */
export const auditListingRejectedCorlu: AuditLogEntry = createAuditEntry({
  id: 'audit-listing-reject-corlu',
  actorId: 'admin-moderator-1',
  actorName: 'Elif Kaya',
  actorRole: AdminRole.Moderator,
  action: AdminPermission.ListingReject,
  entityType: 'listing',
  entityId: 'listing-land-corlu-field',
  summary: '1245791558 numaralı ilan "Mükerrer ilan" gerekçesiyle reddedildi.',
  metadata: {
    correlationId: 'req-2026-07-12-3fa9c1',
    listingNo: '1245791558',
    expectedRevision: 1,
    before: { status: 'pendingReview' },
    after: {
      status: 'rejected',
      rejectionReasons: ['duplicateListing'],
      reviewNote: 'Aynı gayrimenkule ait aktif bir ilan bulundu.',
    },
  },
  createdAt: '2026-07-12T14:18:00+03:00',
})

/**
 * Burak Şahin Konyaaltı villasını kendi üzerine aldı — `event-villa-3`'ün audit
 * tarafı.
 *
 * `before.currentReviewerId` `null`: ilan kuyrukta sahipsiz bekliyordu.
 * `listings.ts` bu ilanın `moderation.currentReviewerId` alanını
 * `admin-content-reviewer-1` yazıyor, yani `after` bugünkü hâliyle örtüşüyor.
 */
export const auditListingAssignedVilla: AuditLogEntry = createAuditEntry({
  id: 'audit-listing-assign-villa',
  actorId: 'admin-content-reviewer-1',
  actorName: 'Burak Şahin',
  actorRole: AdminRole.ContentReviewer,
  action: AdminPermission.ListingAssignReviewer,
  entityType: 'listing',
  entityId: 'listing-residential-konyaalti-villa',
  summary: '1245790148 numaralı ilan Burak Şahin üzerine alındı.',
  metadata: {
    correlationId: 'req-2026-07-14-7c04e8',
    listingNo: '1245790148',
    before: { currentReviewerId: null },
    after: { currentReviewerId: 'admin-content-reviewer-1' },
  },
  createdAt: '2026-07-14T09:12:00+03:00',
})

/**
 * Mert Yıldız 14 gün askıya alındı — `activeSuspensionSanction`'ın audit tarafı.
 *
 * `after.endsAt` yaptırımın `endsAt`'i ile aynı: "askı 29 Tem'de bitiyor" bilgisi
 * iki dosyada da aynı anı gösteriyor.
 */
export const auditUserSuspendedMert: AuditLogEntry = createAuditEntry({
  id: 'audit-user-suspend-mert',
  actorId: 'admin-moderator-1',
  actorName: 'Elif Kaya',
  actorRole: AdminRole.Moderator,
  action: AdminPermission.UserSuspend,
  entityType: 'user',
  entityId: 'user-suspended-mert-yildiz',
  summary: 'Mert Yıldız 14 gün süreyle askıya alındı.',
  metadata: {
    correlationId: 'req-2026-07-15-b82d40',
    sanctionId: 'sanction-suspension-mert-yildiz',
    before: { status: 'active' },
    after: { status: 'suspended', endsAt: '2026-07-29T10:30:00+03:00' },
  },
  createdAt: '2026-07-15T10:30:00+03:00',
})

/**
 * Fotoğraf sahipliği şikayeti çözüldü — `reportResolvedPhotoOwnership`'in audit
 * tarafı.
 *
 * Zaman o şikayetin `resolvedAt`'i ile aynı. Aktör Selin Aydın, çünkü şikayetin
 * `assignedAdminId` alanı `admin-super-1` — ve `report:resolve` içerik
 * denetçisinde yok.
 */
export const auditReportResolvedPhoto: AuditLogEntry = createAuditEntry({
  id: 'audit-report-resolve-photo',
  actorId: 'admin-super-1',
  actorName: 'Selin Aydın',
  actorRole: AdminRole.SuperAdmin,
  action: AdminPermission.ReportResolve,
  entityType: 'report',
  entityId: 'report-kadikoy-photo-ownership',
  summary: 'Fotoğraf sahipliği şikayeti çözüldü; ilanda değişiklik gerekmedi.',
  metadata: {
    correlationId: 'req-2026-07-15-e1937a',
    listingId: 'listing-residential-kadikoy-apartment',
    before: { status: 'inReview' },
    after: { status: 'resolved' },
  },
  createdAt: '2026-07-15T11:45:00+03:00',
})

/**
 * Sekiz kaydın tamamı, **yeniden eskiye** sıralı.
 *
 * Sıra `reports.ts`'in (eskiden yeniye) tersi ve bu **bilerek**: şikayet
 * fixture'ı bir kuyruğun tabanı, audit ise bir **kütük** — okunma yönü "az önce
 * ne oldu"dur, "başlangıçta ne oldu" değil. Sıra yine de sabittir (brifing 5.2:
 * "liste fixture sırası sabit olmalıdır"); sıralamayı değiştirmek ekranın işi.
 *
 * Altı `entityType`'ın **hepsi** kapsanıyor: ilan (2), kullanıcı (2), şikayet,
 * kategori, izin, tema. `AuditLogPage`'in varlık tipi filtresi ancak böyle
 * ölçülebilir — her seçenek en az bir satır döndürmeli.
 */
export const allAuditLogFixtures: AuditLogEntry[] = [
  auditReportResolvedPhoto,
  auditUserSuspendedMert,
  auditListingAssignedVilla,
  auditListingRejectedCorlu,
  auditCategoryAttributeAdded,
  auditThemeDefaultChanged,
  auditPermissionGrantedModerator,
  auditUserBannedKemal,
]

/**
 * Askıya alınmış kullanıcının (`user-suspended-mert-yildiz`) audit kayıtları.
 *
 * `UserDetailPage`'in audit sekmesinin kaynağı: bir hesabın "işlem geçmişi"
 * (brifing 2.6) o hesabı **hedef alan** kayıtlardır — aynı adminin başka bir
 * ilanda verdiği karar bu sekmeye girmez.
 */
export const suspendedUserAuditEntries: AuditLogEntry[] = [auditUserSuspendedMert]

/** Boş durum story'leri için. */
export const emptyAuditLogFixtures: AuditLogEntry[] = []

/**
 * Varlık tipine göre indeks — filtre story'leri "bu tipte kayıt var mı" diye
 * aramak zorunda kalmasın.
 */
export const auditByEntityType: Record<AuditLogEntry['entityType'], AuditLogEntry[]> = {
  listing: [auditListingAssignedVilla, auditListingRejectedCorlu],
  user: [auditUserSuspendedMert, auditUserBannedKemal],
  report: [auditReportResolvedPhoto],
  category: [auditCategoryAttributeAdded],
  permission: [auditPermissionGrantedModerator],
  theme: [auditThemeDefaultChanged],
}
