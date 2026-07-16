import { LISTING_STATUS_LABEL } from '../../../domain/labels'
import type { StatusBadgeProps } from '../../../types/component-props'
import { dot, statusBadge } from './StatusBadge.css'

/**
 * İlan durumunu tutarlı biçimde gösterir.
 *
 * Sekiz `ListingStatus` değerinin her birinin kendi rengi ve etiketi vardır —
 * brifingin "tüm ListingStatus değerleri UI'da ayrı görsel durumla temsil
 * edilmelidir" kabul kriteri budur.
 *
 * Etiket `domain/labels.ts`'ten gelir, component içine gömülmez: aynı durum
 * listede, kuyrukta ve detayda görünür; üç yerde ayrı yazılsa biri değişince
 * diğerleri sessizce eski kalırdı.
 *
 * Renk tek başına gösterge değildir — rozet her zaman metin taşır, böylece renk
 * körü kullanıcı "Onaylı" ile "Reddedildi"yi ayırt eder.
 *
 * Genel amaçlı etiket için `Badge`, filtre çipi için `Tag` kullanın.
 *
 * @example
 * <StatusBadge status={listing.status} />
 */
export function StatusBadge({
  status,
  variant = 'soft',
  size = 'md',
  showDot = false,
}: StatusBadgeProps) {
  return (
    <span className={statusBadge({ status, variant, size })} data-variant={variant}>
      {showDot ? <span className={dot} aria-hidden="true" /> : null}
      {LISTING_STATUS_LABEL[status]}
    </span>
  )
}
