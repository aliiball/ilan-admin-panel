import { Separator } from '@base-ui/react/separator'
import type { DividerProps } from '../../../types/component-props'
import { divider, labelText, labelled, line } from './Divider.css'

/**
 * Form ve detay bölümlerini görsel olarak ayırır.
 *
 * Erişilebilir `role="separator"` ve `aria-orientation` Base UI tarafından
 * verilir. Etiketli hâlde metin ayırıcının bir parçasıdır, ayrı bir başlık
 * değildir — bölüm başlığı gerekiyorsa `PageHeader` ya da bir `<h*>` kullanın.
 *
 * @example
 * <Divider label="Moderasyon bilgileri" />
 */
export function Divider({ orientation = 'horizontal', label }: DividerProps) {
  if (label !== undefined && orientation === 'horizontal') {
    return (
      <div className={labelled} role="separator" aria-orientation="horizontal" aria-label={label}>
        <span className={line} aria-hidden="true" />
        <span className={labelText}>{label}</span>
        <span className={line} aria-hidden="true" />
      </div>
    )
  }

  return <Separator orientation={orientation} className={divider({ orientation })} />
}
