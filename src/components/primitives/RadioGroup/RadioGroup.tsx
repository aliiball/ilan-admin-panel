import { Field } from '@base-ui/react/field'
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
          // Field.Item her seçeneği kendi labelable kapsamına alır: FieldShell'in
          // Field.Root'u grubun etiket id'sini paylaşılan LabelableContext'e yazıyor
          // ve o id RadioRoot'un aria-labelledby'sine sızıp üç seçeneğin de adını
          // grubun adına eziyordu. Field.Item taze bir LabelableProvider açar (grup
          // id'si geride kalır); içteki Field.Label seçeneğin kendi adını verir,
          // Field.Description ise ada karışmadan aria-describedby'ye bağlanır.
          <Field.Item key={item.value} className={option} disabled={item.disabled ?? false}>
            <Radio.Root className={radio} value={item.value} disabled={item.disabled ?? false}>
              <Radio.Indicator className={indicator} />
            </Radio.Root>

            <span className={text}>
              <Field.Label className={labelClass}>{item.label}</Field.Label>
              {item.description !== undefined ? (
                <Field.Description className={descriptionClass} render={<span />}>
                  {item.description}
                </Field.Description>
              ) : null}
            </span>
          </Field.Item>
        ))}
      </BaseRadioGroup>
    </FieldShell>
  )
}
