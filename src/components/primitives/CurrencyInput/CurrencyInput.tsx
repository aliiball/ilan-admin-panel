import { NumberField } from '@base-ui/react/number-field'
import { Select as BaseSelect } from '@base-ui/react/select'
import { ChevronDown } from 'lucide-react'
import { FieldShell } from '../../internal/FieldShell'
import { Currency } from '../../../types/domain'
import type { CurrencyInputProps } from '../../../types/component-props'
import * as listbox from '../../internal/listbox.css'
import { currencyStatic, currencyTrigger, group, input } from './CurrencyInput.css'

/** Para birimi kodları yerine kullanıcının tanıdığı semboller gösterilir. */
const CURRENCY_LABEL: Record<Currency, string> = {
  [Currency.Try]: '₺ TRY',
  [Currency.Usd]: '$ USD',
  [Currency.Eur]: '€ EUR',
  [Currency.Gbp]: '£ GBP',
}

/**
 * Tutar girişi: fiyat, aidat, depozito, devir bedeli için.
 *
 * Tutar ve para birimi tek bir kontrolde toplanır — ikisi ayrı alanlarda
 * durursa kullanıcı birini değiştirip diğerini unutabilir ve `Money` tutarsız
 * kalır.
 *
 * `currencies` verilmezse para birimi sabit etiket olarak gösterilir; verilirse
 * seçilebilir hâle gelir. Rakamlar sağa yaslı ve `tabular-nums` ile hizalıdır.
 *
 * @example
 * <CurrencyInput label="Fiyat" currency={Currency.Try} value={fiyat} onValueChange={setFiyat} />
 */
export function CurrencyInput({
  value,
  currency,
  currencies,
  min,
  max,
  size = 'md',
  disabled = false,
  onValueChange,
  onCurrencyChange,
  label,
  helperText,
  error,
  required = false,
}: CurrencyInputProps) {
  const hasError = error !== undefined && error !== ''
  const canChangeCurrency = currencies !== undefined && currencies.length > 1

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
        required={required}
        {...(value !== undefined && { value })}
        {...(min !== undefined && { min })}
        {...(max !== undefined && { max })}
        format={{ style: 'decimal', maximumFractionDigits: 2 }}
        {...(onValueChange !== undefined && {
          onValueChange: (next: number | null) => onValueChange(next ?? undefined),
        })}
      >
        <NumberField.Group
          className={group({ size })}
          data-invalid={hasError ? '' : undefined}
          data-disabled={disabled ? '' : undefined}
        >
          <NumberField.Input className={input} />

          {canChangeCurrency ? (
            <BaseSelect.Root
              value={currency}
              disabled={disabled}
              {...(onCurrencyChange !== undefined && {
                onValueChange: (next: string | null) => {
                  if (next !== null) onCurrencyChange(next as Currency)
                },
              })}
            >
              <BaseSelect.Trigger
                className={currencyTrigger}
                data-disabled={disabled ? '' : undefined}
                aria-label="Para birimi"
              >
                <BaseSelect.Value>{CURRENCY_LABEL[currency]}</BaseSelect.Value>
                <ChevronDown size={14} aria-hidden="true" />
              </BaseSelect.Trigger>

              <BaseSelect.Portal>
                <BaseSelect.Positioner className={listbox.positioner} sideOffset={4}>
                  <BaseSelect.Popup className={listbox.popup}>
                    {currencies.map((item) => (
                      <BaseSelect.Item key={item} value={item} className={listbox.item}>
                        {CURRENCY_LABEL[item]}
                      </BaseSelect.Item>
                    ))}
                  </BaseSelect.Popup>
                </BaseSelect.Positioner>
              </BaseSelect.Portal>
            </BaseSelect.Root>
          ) : (
            <span className={currencyStatic}>{CURRENCY_LABEL[currency]}</span>
          )}
        </NumberField.Group>
      </NumberField.Root>
    </FieldShell>
  )
}
