import { Button as BaseButton } from '@base-ui/react/button'
import type { IconButtonProps } from '../../../types/component-props'
import { icon, iconButton, iconHidden, spinner } from './IconButton.css'

/**
 * Yalnız ikon gösteren, erişilebilir eylem butonu. Tablo satırları, toolbar ve
 * galeri gibi yer kısıtlı alanlarda kullanılır.
 *
 * `label` zorunludur ve atlanamaz: görünür metni olmayan bir butonun ekran
 * okuyucuda okunabilmesinin tek yolu budur. Aynı metin `title` olarak da verilir,
 * böylece fare kullanıcısı da eylemin ne olduğunu görebilir.
 *
 * Tooltip component'i yazıldığında bu `title` onunla değiştirilecek.
 *
 * @example
 * <IconButton icon={<Trash2 />} label="İlanı sil" variant="danger" onClick={sil} />
 */
export function IconButton({
  icon: iconNode,
  label,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  const classNames = [iconButton({ variant, size, loading }), className].filter(Boolean).join(' ')

  return (
    <BaseButton
      type={type}
      className={classNames}
      disabled={disabled || loading}
      aria-label={label}
      aria-busy={loading || undefined}
      title={label}
      {...rest}
    >
      <span className={loading ? `${icon} ${iconHidden}` : icon} aria-hidden="true">
        {iconNode}
      </span>
      {loading ? <span className={spinner} aria-hidden="true" /> : null}
    </BaseButton>
  )
}
