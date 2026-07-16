import { X } from 'lucide-react'
import type { TagProps } from '../../../types/component-props'
import { removeButton, tag } from './Tag.css'

/**
 * Kısa, seçilebilir veya kaldırılabilir etiket. Aktif filtreleri ve ilanın
 * operasyon etiketlerini göstermek için kullanılır.
 *
 * Salt okunur durum göstergesi için `Badge`, ilan durumu için `StatusBadge`
 * kullanın — Tag etkileşimli olduğunu ima eder.
 *
 * @example
 * <Tag removable onRemove={() => filtreyiKaldir('kadikoy')}>Kadıköy</Tag>
 */
export function Tag({
  selected = false,
  removable = false,
  disabled = false,
  onRemove,
  className,
  children,
  ...rest
}: TagProps) {
  const classNames = [tag({ selected, disabled }), className].filter(Boolean).join(' ')

  return (
    <span className={classNames} {...rest}>
      {children}
      {removable ? (
        <button
          type="button"
          className={removeButton}
          disabled={disabled}
          onClick={onRemove}
          aria-label={
            typeof children === 'string' ? `${children} etiketini kaldır` : 'Etiketi kaldır'
          }
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  )
}
