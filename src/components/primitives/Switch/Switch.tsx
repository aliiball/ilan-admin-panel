import { Switch as BaseSwitch } from '@base-ui/react/switch'
import type { SwitchProps } from '../../../types/component-props'
import {
  description as descriptionClass,
  label as labelClass,
  text,
  thumb,
  track,
  wrapper,
} from './Switch.css'

/**
 * Anında etkili açık/kapalı ayarı.
 *
 * Switch, değişikliğin **hemen** uygulandığı ayarlar içindir (bildirim aç/kapa,
 * ilan otomatik yenileme). Değişikliğin ayrıca "Kaydet" gerektirdiği durumlarda
 * `Checkbox` kullanın — kullanıcı switch'i çevirince işin bittiğini varsayar.
 *
 * Durum yalnız renkle değil, topuzun konumuyla da anlatılır: renk körü kullanıcı
 * açık/kapalıyı konumdan ayırt eder.
 *
 * @example
 * <Switch checked={otoYenile} label="İlanı otomatik yenile" onCheckedChange={setOtoYenile} />
 */
export function Switch({
  checked,
  label,
  description,
  disabled = false,
  size = 'md',
  onCheckedChange,
}: SwitchProps) {
  return (
    <label className={wrapper} data-disabled={disabled || undefined}>
      <BaseSwitch.Root
        className={track({ size })}
        checked={checked}
        disabled={disabled}
        // Checkbox ile aynı gerekçe: Base UI ikinci bir eventDetails argümanı geçiyor.
        {...(onCheckedChange !== undefined && {
          onCheckedChange: (next: boolean) => onCheckedChange(next),
        })}
      >
        <BaseSwitch.Thumb className={thumb({ size })} />
      </BaseSwitch.Root>

      <span className={text}>
        <span className={labelClass}>{label}</span>
        {description !== undefined ? <span className={descriptionClass}>{description}</span> : null}
      </span>
    </label>
  )
}
