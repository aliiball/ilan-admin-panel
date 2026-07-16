import type { SpinnerProps } from '../../../types/component-props'
import { spinner, visuallyHidden } from './Spinner.css'

/**
 * Kısa süreli, yerel yükleme göstergesi.
 *
 * `label` zorunludur: ekran okuyucu kullanıcısı dönen halkayı göremez, neyin
 * beklendiğini yalnızca bu metinden öğrenir. Metin görsel olarak gizlidir.
 *
 * Sayfa veya bölüm yüklenirken bunun yerine `Skeleton` kullanın — spinner
 * içeriğin ölçüsünü korumaz ve düzen zıplamasına yol açar.
 *
 * @example
 * <Spinner label="İlanlar yükleniyor" />
 */
export function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite">
      <span className={spinner({ size })} aria-hidden="true" />
      <span className={visuallyHidden}>{label}</span>
    </span>
  )
}
