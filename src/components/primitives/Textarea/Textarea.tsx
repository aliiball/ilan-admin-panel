import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Field } from '@base-ui/react/field'
import { FieldShell } from '../../internal/FieldShell'
import type { TextareaProps } from '../../../types/component-props'
import { counter, counterNearLimit, counterOverLimit, textarea } from './Textarea.css'

/**
 * Çok satırlı metin girişi. İlan açıklaması, moderasyon notu ve red gerekçesi
 * açıklaması için kullanılır.
 *
 * `showCharacterCount` ile karakter sayacı gösterilir; sayaç `aria-live="polite"`
 * ile duyurulur, böylece ekran okuyucu kullanıcısı sınıra yaklaştığını her tuş
 * vuruşunda değil, yazmayı bıraktığında öğrenir.
 *
 * Varsayılan olarak yalnızca dikey yeniden boyutlandırılabilir: yatay büyüme
 * dar ekranlarda düzeni taşırır.
 *
 * @example
 * <Textarea label="Red gerekçesi" showCharacterCount maxLength={500} required />
 */
export function Textarea({
  resize = 'vertical',
  showCharacterCount = false,
  maxLength,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  className,
  value,
  defaultValue,
  onChange,
  ...rest
}: TextareaProps) {
  const [internalLength, setInternalLength] = useState(String(defaultValue ?? '').length)
  const isControlled = value !== undefined
  const length = isControlled ? String(value).length : internalLength

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) {
      setInternalLength(event.target.value.length)
    }
    onChange?.(event)
  }

  const overLimit = maxLength !== undefined && length > maxLength
  const nearLimit = maxLength !== undefined && !overLimit && length >= maxLength * 0.9

  const counterClass = [counter, nearLimit && counterNearLimit, overLimit && counterOverLimit]
    .filter(Boolean)
    .join(' ')

  return (
    <FieldShell
      {...(label !== undefined && { label })}
      {...(helperText !== undefined && { helperText })}
      {...(error !== undefined && { error })}
      required={required}
      disabled={disabled}
    >
      {/*
        Field.Control ile sarmalanıyor: etiketin `for`'u yalnızca Field'a kayıtlı
        control'e bağlanır. Çıplak <textarea> kayıtlı olmadığı için etiket hiçbir
        şeyi işaret etmiyordu — etikete tıklamak alanı odaklamıyor, ekran okuyucu
        alanın adını duyuramıyordu.
      */}
      <Field.Control
        render={
          <textarea
            className={[textarea({ resize }), className].filter(Boolean).join(' ')}
            required={required}
            disabled={disabled}
            data-invalid={error !== undefined && error !== '' ? '' : undefined}
            {...(isControlled ? { value } : { defaultValue })}
            {...(maxLength !== undefined && { maxLength })}
            onChange={handleChange}
            {...rest}
          />
        }
      />

      {showCharacterCount ? (
        <span className={counterClass} aria-live="polite">
          {maxLength !== undefined ? `${length} / ${maxLength}` : length}
        </span>
      ) : null}
    </FieldShell>
  )
}
