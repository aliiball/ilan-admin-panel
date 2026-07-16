import {
  AdminRole,
  ListingStatus,
  ModerationActorType,
  ModerationEventType,
  RejectionReason,
  type ModerationActor,
  type ModerationEvent,
} from '../types/domain'

/**
 * Moderasyon olayı fixture'ları.
 *
 * Her zincir **gerçek bir ilan fixture'ına bağlıdır** ve o ilanın kendi
 * tarihleriyle örtüşür: `listing-building-osmangazi-archived`'in `publishedAt`'i
 * 12:00 ise `approved` olayı da 12:00'dedir, `expiresAt`'i 02.06 ise `expired`
 * olayı da 02.06'dadır. Faz 3'te `ListingReviewData` ilanı ve geçmişini yan yana
 * koyacak; bugün uydurulan bir saat orada "ilan 12:00'de yayına girdi ama onay
 * 14:00'te verilmiş" diye görünür.
 *
 * Zincirler brifing 1.2'nin geçiş tablosuna uyar — `fromStatus`/`toStatus`
 * çiftlerinin hepsi izin verilen geçişlerdir. Tarihler sabittir; `Date.now()`
 * veya rastgelelik yoktur.
 */

const moderatorActor: ModerationActor = {
  type: ModerationActorType.Admin,
  id: 'admin-moderator-1',
  displayName: 'Elif Kaya',
  adminRole: AdminRole.Moderator,
}

const contentReviewerActor: ModerationActor = {
  type: ModerationActorType.Admin,
  id: 'admin-content-reviewer-1',
  displayName: 'Burak Şahin',
  adminRole: AdminRole.ContentReviewer,
}

const supportActor: ModerationActor = {
  type: ModerationActorType.Admin,
  id: 'admin-support-1',
  displayName: 'Deniz Arslan',
  adminRole: AdminRole.Support,
}

const ownerActor: ModerationActor = {
  type: ModerationActorType.ListingOwner,
  id: 'user-owner-ayse-demir',
  displayName: 'Ayşe Demir',
}

const officeOwnerActor: ModerationActor = {
  type: ModerationActorType.ListingOwner,
  id: 'user-office-marmara-emlak',
  displayName: 'Marmara Emlak Danışmanlığı',
}

const systemActor: ModerationActor = {
  type: ModerationActorType.System,
  displayName: 'Sistem',
}

interface EventFixtureArgs {
  id: string
  listingId: string
  eventType: ModerationEventType
  fromStatus?: ListingStatus
  toStatus?: ListingStatus
  actor: ModerationActor
  rejectionReasons?: RejectionReason[]
  note?: string
  revision: number
  createdAt: string
}

/**
 * Opsiyonel alanlar koşullu spread ile veriliyor — `exactOptionalPropertyTypes`
 * açıkken opsiyonel bir alana açıkça `undefined` atanamaz (TS2375). Alan ya
 * vardır ya yoktur; `listings.ts`'teki `createBaseListing` ile aynı gerekçe.
 */
function createEvent(args: EventFixtureArgs): ModerationEvent {
  return {
    id: args.id,
    listingId: args.listingId,
    eventType: args.eventType,
    ...(args.fromStatus !== undefined && { fromStatus: args.fromStatus }),
    ...(args.toStatus !== undefined && { toStatus: args.toStatus }),
    actor: args.actor,
    rejectionReasons: args.rejectionReasons ?? [],
    ...(args.note !== undefined && { note: args.note }),
    revision: args.revision,
    createdAt: args.createdAt,
  }
}

/**
 * `listing-residential-konyaalti-villa` — incelemede, kısa geçmiş.
 *
 * Kuyruktan yeni alınmış bir ilanın tipik hâli: gönderilmiş, bir denetçi
 * üzerine almış, henüz karar yok. `assigned` olayının aktörü denetçinin
 * kendisi — brifing 2.4'ün "ilanı sahiplenme" eylemi.
 */
export const pendingVillaHistory: ModerationEvent[] = [
  createEvent({
    id: 'event-villa-1',
    listingId: 'listing-residential-konyaalti-villa',
    eventType: ModerationEventType.Created,
    toStatus: ListingStatus.Draft,
    actor: ownerActor,
    revision: 1,
    createdAt: '2026-07-14T08:42:00+03:00',
  }),
  createEvent({
    id: 'event-villa-2',
    listingId: 'listing-residential-konyaalti-villa',
    eventType: ModerationEventType.Submitted,
    fromStatus: ListingStatus.Draft,
    toStatus: ListingStatus.PendingReview,
    actor: ownerActor,
    revision: 1,
    createdAt: '2026-07-14T09:05:00+03:00',
  }),
  createEvent({
    id: 'event-villa-3',
    listingId: 'listing-residential-konyaalti-villa',
    eventType: ModerationEventType.Assigned,
    actor: contentReviewerActor,
    note: 'İlanı inceleme için kendi üzerine aldı.',
    revision: 1,
    createdAt: '2026-07-14T09:12:00+03:00',
  }),
  createEvent({
    id: 'event-villa-4',
    listingId: 'listing-residential-konyaalti-villa',
    eventType: ModerationEventType.NoteAdded,
    actor: contentReviewerActor,
    note: 'Havuz ruhsatı açıklamada geçiyor, belge ekli değil. Satıcıdan istendi.',
    revision: 1,
    createdAt: '2026-07-14T09:20:00+03:00',
  }),
]

/**
 * `listing-land-corlu-field` — reddedilmiş.
 *
 * Gerekçe ve not, ilanın kendi `moderation.rejectionReasons` ve `reviewNote`
 * alanlarıyla birebir aynı: karar iki yerde saklanıyor (özet + geçmiş) ve
 * ikisinin ayrışması Faz 3'te "hangisi doğru?" sorusunu doğurur.
 */
export const rejectedFieldHistory: ModerationEvent[] = [
  createEvent({
    id: 'event-corlu-1',
    listingId: 'listing-land-corlu-field',
    eventType: ModerationEventType.Created,
    toStatus: ListingStatus.Draft,
    actor: officeOwnerActor,
    revision: 1,
    createdAt: '2026-07-12T13:40:00+03:00',
  }),
  createEvent({
    id: 'event-corlu-2',
    listingId: 'listing-land-corlu-field',
    eventType: ModerationEventType.Submitted,
    fromStatus: ListingStatus.Draft,
    toStatus: ListingStatus.PendingReview,
    actor: officeOwnerActor,
    revision: 1,
    createdAt: '2026-07-12T14:00:00+03:00',
  }),
  createEvent({
    id: 'event-corlu-3',
    listingId: 'listing-land-corlu-field',
    eventType: ModerationEventType.Assigned,
    actor: moderatorActor,
    note: 'İnceleme Elif Kaya üzerine alındı.',
    revision: 1,
    createdAt: '2026-07-12T14:05:00+03:00',
  }),
  createEvent({
    id: 'event-corlu-4',
    listingId: 'listing-land-corlu-field',
    eventType: ModerationEventType.Rejected,
    fromStatus: ListingStatus.PendingReview,
    toStatus: ListingStatus.Rejected,
    actor: moderatorActor,
    rejectionReasons: [RejectionReason.DuplicateListing],
    note: 'Aynı gayrimenkule ait aktif bir ilan bulundu.',
    revision: 1,
    createdAt: '2026-07-12T14:18:00+03:00',
  }),
]

/**
 * `listing-land-urla-residential` — taslak, arşivden geri yüklenmiş.
 *
 * İlan sahibinin fikir değiştirdiği yol: gönder, geri çek, vazgeçip arşivle,
 * sonra arşivden taslağa döndür. `withdrawn` ve `restored`'ın tek örneği burada
 * — ikisi de yalnız bu yolda doğuyor.
 */
export const restoredDraftHistory: ModerationEvent[] = [
  createEvent({
    id: 'event-urla-1',
    listingId: 'listing-land-urla-residential',
    eventType: ModerationEventType.Created,
    toStatus: ListingStatus.Draft,
    actor: ownerActor,
    revision: 1,
    createdAt: '2026-07-15T15:10:00+03:00',
  }),
  createEvent({
    id: 'event-urla-2',
    listingId: 'listing-land-urla-residential',
    eventType: ModerationEventType.Submitted,
    fromStatus: ListingStatus.Draft,
    toStatus: ListingStatus.PendingReview,
    actor: ownerActor,
    revision: 1,
    createdAt: '2026-07-15T15:24:00+03:00',
  }),
  createEvent({
    id: 'event-urla-3',
    listingId: 'listing-land-urla-residential',
    eventType: ModerationEventType.Withdrawn,
    fromStatus: ListingStatus.PendingReview,
    toStatus: ListingStatus.Draft,
    actor: ownerActor,
    note: 'Karar verilmeden başvuru geri çekildi; parsel bilgisi tekrar kontrol edilecek.',
    revision: 1,
    createdAt: '2026-07-15T16:02:00+03:00',
  }),
  createEvent({
    id: 'event-urla-4',
    listingId: 'listing-land-urla-residential',
    eventType: ModerationEventType.Archived,
    fromStatus: ListingStatus.Draft,
    toStatus: ListingStatus.Archived,
    actor: ownerActor,
    note: 'İlan sahibi satıştan vazgeçti.',
    revision: 1,
    createdAt: '2026-07-16T09:30:00+03:00',
  }),
  createEvent({
    id: 'event-urla-5',
    listingId: 'listing-land-urla-residential',
    eventType: ModerationEventType.Restored,
    fromStatus: ListingStatus.Archived,
    toStatus: ListingStatus.Draft,
    actor: moderatorActor,
    note: 'İlan sahibinin talebiyle arşivden taslağa geri yüklendi.',
    revision: 1,
    createdAt: '2026-07-16T11:15:00+03:00',
  }),
]

/**
 * `listing-building-osmangazi-archived` — iki aylık tam yaşam döngüsü.
 *
 * Uzun geçmişin (13 olay) test edildiği zincir: düzeltme istendi, düzeltildi,
 * revizyon 2'ye çıktı, onaylandı, şikayet geldi, pasife alındı, geri döndü,
 * süresi doldu, arşivlendi.
 *
 * Revizyon 1 → 2 sıçraması `edited`'te: brifing 1.2'ye göre `revision`,
 * istenen düzeltmeler yapılınca artar. İlan fixture'ının `revision: 2` olması
 * bu zincirden gelir.
 */
export const archivedBuildingHistory: ModerationEvent[] = [
  createEvent({
    id: 'event-osmangazi-1',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.Created,
    toStatus: ListingStatus.Draft,
    actor: ownerActor,
    revision: 1,
    createdAt: '2026-05-03T10:30:00+03:00',
  }),
  createEvent({
    id: 'event-osmangazi-2',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.Submitted,
    fromStatus: ListingStatus.Draft,
    toStatus: ListingStatus.PendingReview,
    actor: ownerActor,
    revision: 1,
    createdAt: '2026-05-03T10:52:00+03:00',
  }),
  createEvent({
    id: 'event-osmangazi-3',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.Assigned,
    actor: moderatorActor,
    note: 'İnceleme Elif Kaya üzerine alındı.',
    revision: 1,
    createdAt: '2026-05-03T11:05:00+03:00',
  }),
  createEvent({
    id: 'event-osmangazi-4',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.ChangesRequested,
    fromStatus: ListingStatus.PendingReview,
    toStatus: ListingStatus.ChangesRequested,
    actor: moderatorActor,
    rejectionReasons: [RejectionReason.MisleadingOrIncompleteInfo],
    note: 'Bağımsız bölüm sayısı 12 yazılmış, tapu belgesinde 14 görünüyor. Doğru değer girilmeli.',
    revision: 1,
    createdAt: '2026-05-03T11:20:00+03:00',
  }),
  createEvent({
    id: 'event-osmangazi-5',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.Edited,
    fromStatus: ListingStatus.ChangesRequested,
    toStatus: ListingStatus.Draft,
    actor: ownerActor,
    note: 'Bağımsız bölüm sayısı 14 olarak düzeltildi.',
    revision: 2,
    createdAt: '2026-05-03T11:40:00+03:00',
  }),
  createEvent({
    id: 'event-osmangazi-6',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.Submitted,
    fromStatus: ListingStatus.Draft,
    toStatus: ListingStatus.PendingReview,
    actor: ownerActor,
    revision: 2,
    createdAt: '2026-05-03T11:48:00+03:00',
  }),
  createEvent({
    id: 'event-osmangazi-7',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.Approved,
    fromStatus: ListingStatus.PendingReview,
    toStatus: ListingStatus.Published,
    actor: contentReviewerActor,
    note: 'Düzeltme yapıldı, belge ile alanlar uyuşuyor.',
    revision: 2,
    createdAt: '2026-05-03T12:00:00+03:00',
  }),
  createEvent({
    id: 'event-osmangazi-8',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.ReportLinked,
    actor: systemActor,
    note: 'İlan hakkında "yanıltıcı bilgi" gerekçeli şikayet açıldı.',
    revision: 2,
    createdAt: '2026-05-20T14:22:00+03:00',
  }),
  createEvent({
    id: 'event-osmangazi-9',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.NoteAdded,
    actor: supportActor,
    note: 'Şikayetçi ile görüşüldü; iddia kira gelirinin güncelliğine dair. Moderasyona eskale edildi.',
    revision: 2,
    createdAt: '2026-05-20T15:05:00+03:00',
  }),
  createEvent({
    id: 'event-osmangazi-10',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.Paused,
    fromStatus: ListingStatus.Published,
    toStatus: ListingStatus.Paused,
    actor: moderatorActor,
    note: 'Şikayet incelemesi süresince yayın geçici olarak durduruldu.',
    revision: 2,
    createdAt: '2026-05-21T09:15:00+03:00',
  }),
  createEvent({
    id: 'event-osmangazi-11',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.Resumed,
    fromStatus: ListingStatus.Paused,
    toStatus: ListingStatus.Published,
    actor: moderatorActor,
    note: 'Şikayet asılsız bulundu; kira geliri belgeyle doğrulandı.',
    revision: 2,
    createdAt: '2026-05-28T10:00:00+03:00',
  }),
  createEvent({
    id: 'event-osmangazi-12',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.Expired,
    fromStatus: ListingStatus.Published,
    toStatus: ListingStatus.Expired,
    actor: systemActor,
    revision: 2,
    createdAt: '2026-06-02T12:00:00+03:00',
  }),
  createEvent({
    id: 'event-osmangazi-13',
    listingId: 'listing-building-osmangazi-archived',
    eventType: ModerationEventType.Archived,
    fromStatus: ListingStatus.Expired,
    toStatus: ListingStatus.Archived,
    actor: systemActor,
    note: 'Yenilenmeden 30 gün geçti; ilan otomatik arşivlendi.',
    revision: 2,
    createdAt: '2026-07-01T13:12:00+03:00',
  }),
]

/**
 * Dört zincirin tamamı, tarihe göre sıralı.
 *
 * On beş `ModerationEventType` değerinin **hepsi** bu dizide en az bir kez
 * geçer — `ModerationHistory.stories.tsx`'teki `EveryEventTypeRenders` bunu
 * ölçüyor. Yeni bir olay türü eklenip buraya örneği konmazsa o test düşer ve
 * etiketi olmayan bir olayın sessizce boş render edilmesi engellenir.
 */
export const allModerationEventFixtures: ModerationEvent[] = [
  ...archivedBuildingHistory,
  ...rejectedFieldHistory,
  ...pendingVillaHistory,
  ...restoredDraftHistory,
]

/** Henüz hiçbir olayın olmadığı ilan — `empty` story'si için. */
export const emptyModerationHistory: ModerationEvent[] = []
