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
  invalid = false,
  required = false,
  disabled = false,
  className,
  ...rest
}: InputProps) {
  /*
    Öncelik `error`'da: dolu bir `error` hem kutuyu kırmızıya boyar hem mesajı
    alanın altına basar (FieldShell `Field.Error`'ı ondan doğuruyor). `invalid`
    yalnız `error` boşken devreye girer ve mesajsızdır — yalnız kırmızı kenarlık.
    İkisi de kutuyu geçersiz gösterir; birleşik bayrak ikisini tek yere indirir.
  */
  const hasError = error !== undefined && error !== ''
  const gecersiz = hasError || invalid

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
        devre dışı kutu gri zemin almıyor. `invalid` de aynı kapıdan geçer:
        kenarlık `error`'la aynı `&[data-invalid]` kuralından gelir.
      */}
      <span
        className={[control({ size }), className].filter(Boolean).join(' ')}
        data-invalid={gecersiz ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
      >
        {leadingIcon !== undefined ? (
          <span className={adornment} aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}

        {/*
          `aria-invalid` elle veriliyor: `error` doluyken FieldShell'in
          `Field.Root invalid` bayrağı onu Base UI üzerinden input'a zaten
          koyuyor, ama `invalid && !error`'da FieldShell geçersizliği bilmez
          (yalnız `error` geçiyor), dolayısıyla işareti burada veriyoruz.
        */}
        <BaseInput
          className={input}
          required={required}
          disabled={disabled}
          {...(gecersiz && { 'aria-invalid': true })}
          {...rest}
        />

        {trailingAction !== undefined ? <span className={adornment}>{trailingAction}</span> : null}
      </span>
    </FieldShell>
  )
}
