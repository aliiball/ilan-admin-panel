import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { button, label, labelHidden, spinner } from './Button.css'

/**
 * Butonun görsel önem seviyesi.
 *
 * - `primary`: Ekrandaki ana eylem. Bir ekranda tek tane olmalı.
 * - `secondary`: İkincil eylem (İptal, Geri, Taslak kaydet).
 * - `ghost`: Tablo satırı içi ve toolbar gibi yoğun alanlardaki düşük vurgulu eylem.
 * - `danger`: Geri alınamayan yıkıcı eylem (silme, kalıcı reddetme).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/**
 * Buton yüksekliği. Tablo satırlarında `sm`, form ve sayfa eylemlerinde `md` kullanılır.
 */
export type ButtonSize = 'sm' | 'md' | 'lg'

type NativeButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'style'>

export interface ButtonProps extends NativeButtonProps {
  /**
   * Butonun görsel önem seviyesini belirler.
   * @default 'primary'
   */
  variant?: ButtonVariant

  /**
   * Butonun yüksekliğini ve yazı boyutunu belirler.
   * @default 'md'
   */
  size?: ButtonSize

  /**
   * İşlem sürerken butonu devre dışı bırakır ve spinner gösterir.
   * Etiket gizlenir ama genişliği korunur, böylece buton boyutu değişmez.
   * @default false
   */
  loading?: boolean

  /**
   * Butonu bulunduğu kabın tam genişliğine yayar.
   * @default false
   */
  fullWidth?: boolean

  /**
   * Butonun etiketi. Eylemi fiille ifade edin ("İlanı onayla"), "Tamam" gibi
   * belirsiz etiketlerden kaçının.
   */
  children: ReactNode
}

/**
 * Admin Panel üzerindeki moderasyon ve operasyon eylemleri için kullanılır.
 *
 * Yetki kontrolü bu component'in sorumluluğunda değildir: kullanıcının yetkisi
 * yoksa butonu `disabled` vermek yerine hiç render etmeyin.
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
  children,
  ...rest
}: ButtonProps) {
  return (
    <BaseButton
      type={type}
      className={button({ variant, size, fullWidth, loading })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className={loading ? `${label} ${labelHidden}` : label}>{children}</span>
      {loading ? <span className={spinner} aria-hidden="true" /> : null}
    </BaseButton>
  )
}
