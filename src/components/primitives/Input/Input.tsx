import { Input as BaseInput } from '@base-ui/react/input'
import { FieldShell } from '../../internal/FieldShell'
import type { InputProps } from '../../../types/component-props'
import { adornment, control, input } from './Input.css'

/**
 * Tek satırlık metin girişi.
 *
 * Etiket, yardımcı metin ve hata mesajı `label`, `helperText`, `error` prop'larıyla
 * verilir; erişilebilir bağlantıları (id eşlemesi, `aria-describedby`) Base UI'ın
 * Field'ı kurar. Etiketsiz kullanmayın — placeholder etiket yerine geçmez, çünkü
 * kullanıcı yazmaya başlayınca kaybolur.
 *
 * Kenarlık ve odak halkası dış kutuda; böylece leading/trailing ikonlar da
 * odak çerçevesinin içinde kalır.
 *
 * @example
 * <Input label="İlan no" placeholder="1245789630" helperText="10 haneli numara" />
 */
export function Input({
  size = 'md',
  leadingIcon,
  trailingAction,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  className,
  ...rest
}: InputProps) {
  return (
    <FieldShell
      {...(label !== undefined && { label })}
      {...(helperText !== undefined && { helperText })}
      {...(error !== undefined && { error })}
      required={required}
      disabled={disabled}
    >
      {/*
        data-invalid / data-disabled elle veriliyor: Base UI bu işaretleri
        Field.Root üzerine koyuyor, bu kutu ise onun içindeki sıradan bir span —
        yani otomatik devralmıyor. Verilmezse hatalı kutu kırmızı kenarlık,
        devre dışı kutu gri zemin almıyor.
      */}
      <span
        className={[control({ size }), className].filter(Boolean).join(' ')}
        data-invalid={error !== undefined && error !== '' ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
      >
        {leadingIcon !== undefined ? (
          <span className={adornment} aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}

        <BaseInput className={input} required={required} disabled={disabled} {...rest} />

        {trailingAction !== undefined ? <span className={adornment}>{trailingAction}</span> : null}
      </span>
    </FieldShell>
  )
}
