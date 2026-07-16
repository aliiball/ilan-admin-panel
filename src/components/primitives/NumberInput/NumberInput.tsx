import { NumberField } from '@base-ui/react/number-field'
import { Minus, Plus } from 'lucide-react'
import { FieldShell } from '../../internal/FieldShell'
import type { NumberInputProps } from '../../../types/component-props'
import { group, input, stepper } from './NumberInput.css'

/**
 * Sayısal değer girişi: m², oda sayısı, kat sayısı, bina yaşı gibi alanlar için.
 *
 * Artır/azalt butonlarının yanı sıra ok tuşlarıyla da değiştirilebilir; `min` ve
 * `max` sınırlarına gelindiğinde ilgili buton kendiliğinden devre dışı kalır.
 *
 * Rakamlar `tabular-nums` ile hizalanır ve sağa yaslanır — alt alta gelen
 * sayıların basamakları çakışsın diye.
 *
 * Tutar girişi için `CurrencyInput` kullanın; o para birimini de yönetir.
 *
 * @example
 * <NumberInput label="Brüt m²" min={1} max={100000} value={brut} onValueChange={setBrut} />
 */
export function NumberInput({
  value,
  min,
  max,
  step,
  size = 'md',
  disabled = false,
  readOnly = false,
  onValueChange,
  label,
  helperText,
  error,
  required = false,
}: NumberInputProps) {
  const hasError = error !== undefined && error !== ''

  return (
    <FieldShell
      {...(label !== undefined && { label })}
      {...(helperText !== undefined && { helperText })}
      {...(error !== undefined && { error })}
      required={required}
      disabled={disabled}
    >
      <NumberField.Root
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        {...(value !== undefined && { value })}
        {...(min !== undefined && { min })}
        {...(max !== undefined && { max })}
        {...(step !== undefined && { step })}
        {...(onValueChange !== undefined && {
          // Base UI boş kutuyu `null` ile bildirir; brifingin sözleşmesi
          // `undefined` istiyor, o yüzden burada eşleniyor.
          onValueChange: (next: number | null) => onValueChange(next ?? undefined),
        })}
      >
        <NumberField.Group
          className={group({ size })}
          data-invalid={hasError ? '' : undefined}
          data-disabled={disabled ? '' : undefined}
        >
          <NumberField.Decrement className={stepper} aria-label="Azalt">
            <Minus size={16} aria-hidden="true" />
          </NumberField.Decrement>

          <NumberField.Input className={input} />

          <NumberField.Increment className={stepper} aria-label="Artır">
            <Plus size={16} aria-hidden="true" />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </FieldShell>
  )
}
