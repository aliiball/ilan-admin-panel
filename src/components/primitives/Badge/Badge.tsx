import type { BadgeProps } from '../../../types/component-props'
import { badge, icon } from './Badge.css'

/**
 * Kısa durum veya sayı etiketi. Genel amaçlıdır; ilan durumu için `StatusBadge`
 * kullanılır, o `ListingStatus` değerini doğru renge kendisi eşler.
 *
 * Rozet her zaman metin taşır. Brifing kuralı gereği renk tek başına gösterge
 * olamaz — renk körü bir kullanıcı "Onaylı" ile "Reddedildi"yi metinden ayırır.
 *
 * @example
 * <Badge tone="danger" variant="soft">3 şikayet</Badge>
 */
export function Badge({
  variant = 'soft',
  tone = 'neutral',
  size = 'md',
  leadingIcon,
  className,
  children,
  ...rest
}: BadgeProps) {
  const classNames = [badge({ variant, tone, size }), className].filter(Boolean).join(' ')

  return (
    <span className={classNames} {...rest}>
      {leadingIcon ? (
        <span className={icon} aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      {children}
    </span>
  )
}
