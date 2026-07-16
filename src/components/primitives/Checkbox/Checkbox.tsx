import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { Check, Minus } from 'lucide-react'
import type { CheckboxProps } from '../../../types/component-props'
import {
  box,
  description as descriptionClass,
  indicator,
  label as labelClass,
  text,
  visuallyHidden,
  wrapper,
} from './Checkbox.css'

/**
 * İkili veya belirsiz seçim.
 *
 * `indeterminate`, tablo başlığındaki "tümünü seç" kutusu içindir: bazı satırlar
 * seçiliyken ne işaretli ne de boş görünmelidir. Base UI bunu `aria-checked="mixed"`
 * olarak duyurur, böylece ekran okuyucu kullanıcısı da kısmi seçimi anlar.
 *
 * `label` zorunludur ve kutunun yanında görünür; tıklanabilir alan etiketi de
 * kapsar, böylece dokunma hedefi 44px'i aşar.
 *
 * @example
 * <Checkbox label="Tümünü seç" indeterminate={bazisiSecili} onCheckedChange={hepsiniSec} />
 */
export function Checkbox({
  label,
  description,
  indeterminate = false,
  hideLabel = false,
  checked,
  defaultChecked,
  disabled = false,
  onCheckedChange,
  className,
  name,
  value,
  ...rest
}: CheckboxProps) {
  return (
    <label
      className={[wrapper, className].filter(Boolean).join(' ')}
      data-disabled={disabled || undefined}
    >
      <BaseCheckbox.Root
        className={box}
        indeterminate={indeterminate}
        disabled={disabled}
        {...(checked !== undefined && { checked: Boolean(checked) })}
        {...(defaultChecked !== undefined && { defaultChecked: Boolean(defaultChecked) })}
        // Sarmalanıyor: Base UI onCheckedChange'e ikinci bir eventDetails argümanı
        // geçiyor, brifingin sözleşmesi ise tek argümanlı. Doğrudan geçirilirse
        // tüketici tarafında `setState` gibi ikinci argümanı anlamlı olan
        // fonksiyonlar bozulur.
        {...(onCheckedChange !== undefined && {
          onCheckedChange: (next: boolean) => onCheckedChange(next),
        })}
        {...(name !== undefined && { name })}
        {...(value !== undefined && { value: String(value) })}
      >
        <BaseCheckbox.Indicator className={indicator}>
          {indeterminate ? (
            <Minus size={14} strokeWidth={3} aria-hidden="true" />
          ) : (
            <Check size={14} strokeWidth={3} aria-hidden="true" />
          )}
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>

      <span className={hideLabel ? visuallyHidden : text} {...rest}>
        <span className={hideLabel ? undefined : labelClass}>{label}</span>
        {description !== undefined && !hideLabel ? (
          <span className={descriptionClass}>{description}</span>
        ) : null}
      </span>
    </label>
  )
}
