import { Radio } from '@base-ui/react/radio'
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group'
import { FieldShell } from '../../internal/FieldShell'
import type { RadioGroupProps } from '../../../types/component-props'
import {
  description as descriptionClass,
  group,
  indicator,
  label as labelClass,
  option,
  radio,
  text,
} from './RadioGroup.css'

/**
 * Birbirini dışlayan seçeneklerden tek seçim.
 *
 * İki veya üç seçenek ve hepsinin aynı anda görünmesi gerekiyorsa bunu kullanın;
 * seçenek sayısı arttıkça `Select` daha uygun olur — uzun radyo listesi ekranı
 * boğar.
 *
 * Ok tuşlarıyla gezinme ve grup içinde tek `Tab` durağı davranışı Base UI'dan
 * gelir; radyo grubunda beklenen klavye davranışı budur.
 *
 * @example
 * <RadioGroup label="Karar" options={kararlar} value={karar} onValueChange={setKarar} />
 */
export function RadioGroup({
  value,
  options,
  orientation = 'vertical',
  disabled = false,
  onValueChange,
  label,
  helperText,
  error,
  required = false,
}: RadioGroupProps) {
  return (
    <FieldShell
      {...(label !== undefined && { label })}
      {...(helperText !== undefined && { helperText })}
      {...(error !== undefined && { error })}
      required={required}
      disabled={disabled}
    >
      <BaseRadioGroup
        className={group({ orientation })}
        disabled={disabled}
        {...(value !== undefined && { value })}
        {...(onValueChange !== undefined && {
          onValueChange: (next: unknown) => onValueChange(String(next)),
        })}
      >
        {options.map((item) => (
          <label key={item.value} className={option} data-disabled={item.disabled || undefined}>
            <Radio.Root className={radio} value={item.value} disabled={item.disabled ?? false}>
              <Radio.Indicator className={indicator} />
            </Radio.Root>

            <span className={text}>
              <span className={labelClass}>{item.label}</span>
              {item.description !== undefined ? (
                <span className={descriptionClass}>{item.description}</span>
              ) : null}
            </span>
          </label>
        ))}
      </BaseRadioGroup>
    </FieldShell>
  )
}
