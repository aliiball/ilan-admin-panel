import type { ReactNode } from 'react'
import { Field } from '@base-ui/react/field'
import { AlertCircle } from 'lucide-react'
import type { FieldMetaProps } from '../../../types/component-props'
import {
  description as descriptionClass,
  error as errorClass,
  errorIcon,
  label as labelClass,
  requiredMark,
  root,
} from './FieldShell.css'

export interface FieldShellProps extends FieldMetaProps {
  /** Alanın kendisi: Input, Textarea, Select vb. */
  children: ReactNode
  disabled?: boolean
  /**
   * Etikete verilecek id.
   *
   * Base UI'ın `Field.Label`'ı `for`'u yalnızca Field'a kayıtlı bir control'e
   * bağlar. Kontrol bir Field.Control değilse (örneğin DateRangePicker'daki
   * Popover.Trigger) `for` boşa düşer; o durumda bağ ters yönden, kontrolün
   * `aria-labelledby`'si ile kurulur ve etiketin id'si buradan verilir.
   */
  labelId?: string
}

/**
 * Etiket, yardımcı metin ve hata mesajını saran ortak form iskeleti.
 *
 * BU BİR KATALOG COMPONENT'İ DEĞİLDİR — brifingin 26 primitive listesinde yer
 * almaz. `FieldMetaProps` dokuz component tarafından paylaşıldığı için bu
 * işaretlemeyi dokuz kez kopyalamamak adına ortak bir iskelet olarak ayrıldı.
 * Doğrudan kullanılmaz; Input, Select gibi primitive'lerin içinden çağrılır.
 *
 * Etiket–control eşlemesini ve `aria-describedby` bağlantısını Base UI'ın Field'ı
 * kurar; hangi id'nin nereye gideceğiyle uğraşmaya gerek kalmaz.
 *
 * Hata varken yardımcı metin gizlenir: ikisi birden okunursa ekran okuyucu
 * kullanıcısı önce çözümü, sonra sorunu duyar — kafa karıştırıcı bir sıra.
 */
export function FieldShell({
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  labelId,
  children,
}: FieldShellProps) {
  const hasError = error !== undefined && error !== ''

  return (
    <Field.Root className={root} invalid={hasError} disabled={disabled}>
      {label !== undefined ? (
        <Field.Label className={labelClass} {...(labelId !== undefined && { id: labelId })}>
          {label}
          {required ? (
            <span className={requiredMark} aria-hidden="true">
              *
            </span>
          ) : null}
        </Field.Label>
      ) : null}

      {children}

      {helperText !== undefined && !hasError ? (
        <Field.Description className={descriptionClass}>{helperText}</Field.Description>
      ) : null}

      {hasError ? (
        <Field.Error match className={errorClass}>
          <AlertCircle size={14} className={errorIcon} aria-hidden="true" />
          {error}
        </Field.Error>
      ) : null}
    </Field.Root>
  )
}
