import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import type { AvatarProps } from '../../../types/component-props'
import { avatar, image, status, wrapper } from './Avatar.css'

const STATUS_LABEL = {
  online: 'Çevrimiçi',
  offline: 'Çevrimdışı',
  busy: 'Meşgul',
} as const

/**
 * Kullanıcı görseli veya baş harfleri.
 *
 * Görsel yüklenemezse baş harflere düşer — bozuk resim ikonu göstermez. Bu,
 * fixture görselleri ve silinmiş avatar'lar için önemlidir.
 *
 * Avatar dekoratiftir: yanında zaten kullanıcının adı yazdığı için `alt` boş
 * bırakılır, aksi hâlde ekran okuyucu adı iki kez okur. Durum noktası ise
 * renkten bağımsız olarak metinle de duyurulur.
 *
 * Baş harfler Türkçe'ye uygun büyütülür: `i` → `İ`, `ı` → `I`.
 *
 * @example
 * <Avatar name="Ayşe Demir" src={user.avatarUrl} size="lg" status="online" />
 */
export function Avatar({ src, name, size = 'md', status: statusTone }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR'))
    .join('')

  return (
    <span className={wrapper}>
      <BaseAvatar.Root className={avatar({ size })}>
        {src !== undefined ? <BaseAvatar.Image className={image} src={src} alt="" /> : null}
        <BaseAvatar.Fallback>{initials}</BaseAvatar.Fallback>
      </BaseAvatar.Root>

      {statusTone !== undefined ? (
        <span
          className={status({ tone: statusTone, size })}
          role="img"
          aria-label={STATUS_LABEL[statusTone]}
        />
      ) : null}
    </span>
  )
}
