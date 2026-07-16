import { Button as BaseButton } from '@base-ui/react/button'
// Bilerek göreli yol: Storybook'un react-docgen'i `@/` alias'ını çözemiyor ve
// çözemeyince component'in tamamını atlıyor — prop tablosu ve AI manifest'i boş
// kalıyor. Göreli yolda import'u sorunsuz takip ediyor. Bu istisna yalnızca prop
// tipi import'ları içindir; kodun geri kalanında `@/` kullanılabilir.
import type { ButtonProps } from '../../../types/component-props'
import { button, icon, label, labelHidden, spinner } from './Button.css'

/**
 * Admin Panel üzerindeki moderasyon ve operasyon eylemleri için kullanılır.
 *
 * Yetki kontrolü bu component'in sorumluluğunda değildir: kullanıcının yetkisi
 * yoksa butonu `disabled` vermek yerine hiç render etmeyin. Brifingin
 * "geçersiz eylem sunulmamalıdır" kabul kriteri bunu gerektirir.
 *
 * Erişilebilir buton davranışını Base UI sağlar; bu katman yalnızca görünümü
 * ve yükleniyor durumunu ekler.
 *
 * Public Front Pages ekranlarında kullanılmaz — o repository'nin kendi Button'ı vardır.
 *
 * @example
 * <Button variant="danger" onClick={reddet}>İlanı reddet</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled = false,
  type = 'button',
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classNames = [button({ variant, size, fullWidth, loading }), className]
    .filter(Boolean)
    .join(' ')

  return (
    <BaseButton
      type={type}
      className={classNames}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className={loading ? `${label} ${labelHidden}` : label}>
        {leadingIcon ? (
          <span className={icon} aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        {children}
        {trailingIcon ? (
          <span className={icon} aria-hidden="true">
            {trailingIcon}
          </span>
        ) : null}
      </span>
      {loading ? <span className={spinner} aria-hidden="true" /> : null}
    </BaseButton>
  )
}
