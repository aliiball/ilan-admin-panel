import { AdminPermission, ReportStatus } from '../types/domain'

/**
 * Bir şikayet üzerinde verilebilecek eylemler (brifing 2.8).
 *
 * `moderationActions.ts`'in şikayet karşılığı; Faz 3'te bu modül **yoktu** ve
 * `ReportManagementPage` eylemleri yalnız `report.status`'e göre elle kapılıyordu
 * (RAPOR EDİLMİŞTİ). Tek kaynak burası: hem hangi eylemin görüneceğini hem hangi
 * iznin gerektiğini belirler.
 *
 * `merge` (toplu birleştirme) bu beşliye **dahil değil**: birden çok şikayeti
 * tek eyleme sokar, bir şikayetin durum geçişi değildir — `BulkActionBar`'ın işi.
 */
export type ReportAction = 'assign' | 'review' | 'resolve' | 'dismiss' | 'escalate'

export interface ReportActionRule {
  /** Eylemin **sunulabileceği** kaynak durumlar (`allowedFrom` deseniyle aynı). */
  allowedFrom: readonly ReportStatus[]
  /**
   * Eylemin gerektirdiği izin. **Kademeler kapsayıcı**: `report:triageLimited`
   * olan bir kullanıcı `report:triage` gerektiren eylemi yapamaz, ama tersi
   * mümkün (`superAdmin` ikisine de sahip). Yetki sınayan kod önce tam izni
   * (`ReportTriage`) sorar, sonra sınırlıya düşer.
   */
  requiresPermission: AdminPermission
  /** Serbest metin (çözüm notu / gerekçe) zorunlu mu? */
  requiresNote: boolean
}

/**
 * Brifing 2.8'in eylemlerinin durum + izin tablosu.
 *
 * Yetki boyutu `ROLE_PERMISSIONS` ile örtüşür: `report:triage` moderatör ve
 * destek'te tam, içerik denetçisinde `report:triageLimited`; `report:resolve`
 * yalnız superAdmin ve moderatörde. `escalate` sınırlı kademenin de yapabildiği
 * tek yükseltmedir (içerik denetçisi `severity` değiştiremez ama işi yukarı
 * taşıyabilir) — bu yüzden `ReportTriageLimited` ister, tam triage değil.
 */
export const REPORT_ACTION_RULE = {
  /** Raporu sahiplenme / inceleme kuyruğuna alma. */
  assign: {
    allowedFrom: [ReportStatus.Open],
    requiresPermission: AdminPermission.ReportTriageLimited,
    requiresNote: false,
  },
  /** İncelemeye alma (`open → inReview`). */
  review: {
    allowedFrom: [ReportStatus.Open],
    requiresPermission: AdminPermission.ReportTriageLimited,
    requiresNote: false,
  },
  /** Çözümleme (`open`/`inReview → resolved`); çözüm notu zorunlu. */
  resolve: {
    allowedFrom: [ReportStatus.Open, ReportStatus.InReview],
    requiresPermission: AdminPermission.ReportResolve,
    requiresNote: true,
  },
  /** Geçersiz sayma (`open`/`inReview → dismissed`); gerekçe zorunlu. */
  dismiss: {
    allowedFrom: [ReportStatus.Open, ReportStatus.InReview],
    requiresPermission: AdminPermission.ReportResolve,
    requiresNote: true,
  },
  /**
   * Moderatöre eskale etme. Durumu değiştirmez (rapor açık/incelemede kalır),
   * yalnız işi yukarı taşır — bu yüzden `resolved`/`dismissed`'ta anlamsız.
   */
  escalate: {
    allowedFrom: [ReportStatus.Open, ReportStatus.InReview],
    requiresPermission: AdminPermission.ReportTriageLimited,
    requiresNote: false,
  },
} as const satisfies Record<ReportAction, ReportActionRule>

/** Bir eylem bu durumda sunulabilir mi? (`allowedFrom` kontrolü.) */
export function reportActionAllowed(action: ReportAction, status: ReportStatus): boolean {
  const allowed: readonly ReportStatus[] = REPORT_ACTION_RULE[action].allowedFrom
  return allowed.includes(status)
}
