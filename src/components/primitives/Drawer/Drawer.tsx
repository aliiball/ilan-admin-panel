import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { IconButton } from '../IconButton'
import type { DrawerProps } from '../../../types/component-props'
import {
  backdrop,
  body,
  footer as footerClass,
  header,
  popup,
  title as titleClass,
} from './Drawer.css'

/**
 * Kenardan açılan panel: mobil filtreler, audit log detayı, yan bilgi paneli.
 *
 * Modal ile aynı erişilebilirlik davranışını paylaşır (odak kilidi, `Escape`,
 * odağın geri dönmesi) — ikisi de Base UI'ın Dialog'u üzerine kuruludur. Fark
 * yalnızca konum ve hareket yönüdür.
 *
 * `side="bottom"` mobilde tercih edilir: başparmakla erişilebilir ve alttaki
 * güvenli alan (iOS ana çubuğu) hesaba katılır. Uzun içerik için Modal yerine
 * Drawer daha rahattır.
 *
 * @example
 * <Drawer open={acik} title="Filtreler" side="bottom" onOpenChange={setAcik}>
 *   <FilterBar ... />
 * </Drawer>
 */
export function Drawer({
  open,
  title,
  children,
  footer,
  side = 'right',
  size = 'md',
  onOpenChange,
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next: boolean) => onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Backdrop className={backdrop} />
        <Dialog.Popup className={popup({ side, size })}>
          <div className={header}>
            <Dialog.Title className={titleClass}>{title}</Dialog.Title>
            <Dialog.Close
              render={<IconButton icon={<X size={18} />} label="Kapat" size="sm" variant="ghost" />}
            />
          </div>

          <div className={body}>{children}</div>

          {footer !== undefined ? <div className={footerClass}>{footer}</div> : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
