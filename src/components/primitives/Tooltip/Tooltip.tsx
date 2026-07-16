import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import type { TooltipProps } from '../../../types/component-props'
import { arrow, popup, positioner } from './Tooltip.css'

/**
 * İkonun anlamını fare ve klavye kullanıcısına görsel olarak gösterir.
 *
 * KRİTİK KURAL: `content`, tetikleyicinin erişilebilir adıyla (`aria-label` /
 * `IconButton`'ın `label`'ı) **yakından eşleşmelidir.** Tooltip ekran okuyucuya
 * hiçbir şey söylemez — Base UI bunu bilerek yapmaz ve dokümantasyonu açıkça
 * "tooltip'ler yalnızca görsel öğelerdir, tetikleyiciyi etiketlemenin yerine
 * geçmez" der. Tooltip'e etiketten farklı bir bilgi koyarsanız o bilgi ekran
 * okuyucu ve dokunmatik kullanıcılara hiç ulaşmaz.
 *
 * Yani tooltip "Arşivle" butonuna "Arşivle" yazar; "bu işlem 30 gün sonra geri
 * alınamaz" gibi ek bilgi buraya değil, görünür metne veya `Alert`'e yazılır.
 *
 * Klavye ile odaklanınca da açılır, `Escape` ile kapanır.
 *
 * @example
 * <Tooltip content="Arşivle">
 *   <IconButton icon={<Archive />} label="Arşivle" />
 * </Tooltip>
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  delayMs = 400,
  disabled = false,
}: TooltipProps) {
  if (disabled) {
    return children
  }

  return (
    // Gecikme Root'ta değil Provider'da yönetilir. Provider ayrıca "ilk tooltip
    // açıldıktan sonra komşuları gecikmesiz göster" davranışını sağlar — toolbar'da
    // ikondan ikona gezerken her seferinde beklemek sinir bozucu olurdu.
    <BaseTooltip.Provider delay={delayMs}>
      <BaseTooltip.Root>
        <BaseTooltip.Trigger render={children} />

        <BaseTooltip.Portal>
          <BaseTooltip.Positioner className={positioner} side={placement} sideOffset={8}>
            <BaseTooltip.Popup className={popup}>
              <BaseTooltip.Arrow className={arrow}>
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M6 8 0 0h12z" />
                </svg>
              </BaseTooltip.Arrow>
              {content}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  )
}
