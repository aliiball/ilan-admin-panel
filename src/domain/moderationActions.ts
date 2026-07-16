import { ListingStatus, RejectionReason } from '../types/domain'

/**
 * Moderatörün bir ilan üzerinde verebileceği kararlar.
 *
 * `ModerationActionBarProps.submittingAction` aynı beşliyi sayıyor. Birleşim iki
 * yerde yazılı ama sessizce ayrışamaz: çubuk `MODERATION_ACTION_RULE`'u
 * `submittingAction` ile indeksliyor, biri diğerine üye eklerse indeksleme
 * derlenmez.
 */
export type ModerationAction = 'approve' | 'reject' | 'requestChanges' | 'pause' | 'archive'

export interface ModerationActionRule {
  /** Karar verilirse ilanın taşınacağı durum. */
  targetStatus: ListingStatus
  /**
   * Eylemin **sunulabileceği** kaynak durumlar.
   *
   * Listede olmayan bir durumda eylem `disabled` verilmez, hiç render edilmez —
   * brifingin "UI yalnız izin verilen transition eylemlerini göstermelidir"
   * kabul kriteri. Kapalı bir buton "yetkim var ama şartlar uygun değil" der;
   * burada kastedilen ise eylemin o durumda **var olmadığı**.
   */
  allowedFrom: readonly ListingStatus[]
  /** En az bir `RejectionReason` zorunlu mu? */
  requiresReason: boolean
  /** Boş olmayan bir not zorunlu mu? */
  requiresNote: boolean
}

/**
 * Brifing 1.2'nin geçiş tablosunun, moderasyon çubuğunun sunduğu beş eyleme
 * düşen kesiti. Tek kaynak burasıdır: aynı kural hem hangi butonun görüneceğini
 * hem de onay dialog'unda "Reddet"in ne zaman açılacağını belirler.
 *
 * Tablodaki rol sütunu burada **yok**, çünkü onu `ModerationCapabilities`
 * taşıyor ve `ROLE_PERMISSIONS` ile birebir örtüşüyor: `listing:approve` üç
 * rolde (superAdmin, moderator, icerikDenetcisi), `listing:pause` ve
 * `listing:archive` ikisinde (superAdmin, moderator) — tablonun dediğinin aynısı.
 * Yani iki boyut ayrı: **yetki** kimin yapabileceğini, buradaki `allowedFrom`
 * ilanın o an neye izin verdiğini söyler. Bir eylem ikisini birden geçmeden
 * görünmez.
 */
export const MODERATION_ACTION_RULE = {
  approve: {
    targetStatus: ListingStatus.Published,
    /**
     * Yalnız incelemedeki ilan onaylanır. `paused → published` de bir geçiştir
     * ama o "yayına döndürme", moderasyon kararı değil: farklı yetki
     * (`listing:pause`/`restore`) ve farklı rol kümesi ister, bu çubuğun
     * sözleşmesinde de karşılığı yok.
     */
    allowedFrom: [ListingStatus.PendingReview],
    requiresReason: false,
    requiresNote: false,
  },

  reject: {
    targetStatus: ListingStatus.Rejected,
    allowedFrom: [ListingStatus.PendingReview],
    /** Brifing 1.2 ve kabul kriteri: "en az bir red gerekçesi ve not zorunlu". */
    requiresReason: true,
    requiresNote: true,
  },

  requestChanges: {
    targetStatus: ListingStatus.ChangesRequested,
    allowedFrom: [ListingStatus.PendingReview],
    /** Brifing 1.2: "giderilebilir sorun, en az bir gerekçe ve açıklama zorunlu". */
    requiresReason: true,
    requiresNote: true,
  },

  pause: {
    targetStatus: ListingStatus.Paused,
    /** Yalnız yayındaki ilan pasife alınır: yayınlanmamış ilan zaten görünmüyor. */
    allowedFrom: [ListingStatus.Published],
    requiresReason: false,
    /** Brifing 1.2'nin koşulu: "geçici durdurma sebebi kaydedilmiş". */
    requiresNote: true,
  },

  archive: {
    targetStatus: ListingStatus.Archived,
    /**
     * Tablodaki `* → archived` satırlarının tamamı. İki eksik bilerek:
     * `pendingReview` (önce karar verilmeli — arşiv kararı atlatmaz) ve
     * `archived` (aynı durumdan aynı duruma geçiş no-op sayılır).
     */
    allowedFrom: [
      ListingStatus.Draft,
      ListingStatus.ChangesRequested,
      ListingStatus.Published,
      ListingStatus.Rejected,
      ListingStatus.Paused,
      ListingStatus.Expired,
    ],
    requiresReason: false,
    requiresNote: false,
  },
} as const satisfies Record<ModerationAction, ModerationActionRule>

/**
 * Tek bir **fotoğrafın** reddedilebileceği gerekçeler.
 *
 * `RejectionReason` ilan için tanımlı ve on beş üyesi var; fotoğraf reddi aynı
 * enum'u kullanıyor (`ListingPhoto.rejectionReason`) ama üyelerin çoğu bir
 * fotoğrafın suçu olamaz: "Fiyat Hatası", "Yanlış Kategori" veya "Mükerrer
 * İlan" ilanın tamamına dair kararlardır. Moderatöre on beş seçenek sunmak,
 * on tanesi o bağlamda anlamsızken, yanlış gerekçe seçilmesini kolaylaştırır —
 * ve yanlış gerekçe ilan sahibine yanlış düzeltme talimatı olarak gider.
 *
 * Brifing bu alt kümeyi tanımlamamıştı; fotoğrafa uygulanabilir olanlar
 * seçildi. Sıra, sıklık değil brifing 1.3'ün kendi sırası.
 */
export const PHOTO_REJECTION_REASONS: readonly RejectionReason[] = [
  RejectionReason.InappropriateImage,
  RejectionReason.ContactInformationViolation,
  RejectionReason.InsufficientPhotoQuality,
  RejectionReason.PersonalDataViolation,
  RejectionReason.MisleadingOrIncompleteInfo,
  RejectionReason.ProhibitedContent,
  RejectionReason.OtherPolicyViolation,
]

/** İlanın durumu bu eyleme izin veriyor mu? Yetkiyi ayrıca kontrol edin. */
export function isModerationActionAllowedFrom(
  action: ModerationAction,
  status: ListingStatus,
): boolean {
  return MODERATION_ACTION_RULE[action].allowedFrom.some((allowed) => allowed === status)
}

/**
 * Karar gönderilebilir mi — gerekçe ve not şartları karşılandı mı?
 *
 * Notun boşluklardan ibaret olması "not girilmedi" sayılır: sunucuya boşluk
 * göndermek kuralı sözde geçer, ilan sahibine hiçbir şey anlatmaz.
 */
export function isModerationDecisionComplete(
  action: ModerationAction,
  reasons: readonly unknown[],
  note: string,
): boolean {
  const rule = MODERATION_ACTION_RULE[action]

  if (rule.requiresReason && reasons.length === 0) return false
  if (rule.requiresNote && note.trim() === '') return false

  return true
}
