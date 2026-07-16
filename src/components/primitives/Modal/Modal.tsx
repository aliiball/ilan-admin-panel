import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { IconButton } from '../IconButton'
import type { ModalProps } from '../../../types/component-props'
import {
  backdrop,
  body,
  description as descriptionClass,
  footer as footerClass,
  header,
  headerText,
  popup,
  title as titleClass,
} from './Modal.css'

/**
 * Odak kilitli dialog.
 *
 * Odak yönetimi, `Escape` ile kapanma, arka planın ekran okuyucudan gizlenmesi
 * ve kapanınca odağın tetikleyiciye dönmesi Base UI tarafından sağlanır.
 *
 * `title` zorunludur ve dialog'un erişilebilir adı olur — başlıksız bir modal
 * ekran okuyucuda "dialog" diye okunur ve kullanıcı nerede olduğunu anlamaz.
 *
 * `closeOnBackdrop=false`, veri kaybı riski olan formlarda kullanılır: yanlışlıkla
 * dışarı tıklayıp doldurulmuş formu kaybetmek kötü bir sürprizdir.
 *
 * Geri alınamayan bir eylemi onaylatmak için `ConfirmDialog` kullanın.
 *
 * @example
 * <Modal open={acik} title="İlanı reddet" onOpenChange={setAcik} footer={<Button>Reddet</Button>}>
 *   <RejectionReasonPicker ... />
 * </Modal>
 */
export function Modal({
  open,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  onOpenChange,
}: ModalProps) {
  return (
    <Dialog.Root
      open={open}
      // Base UI onOpenChange'e ikinci bir eventDetails argumani gecer; brifingin
      // sozlesmesi tek argumanli oldugu icin sarmalanip sadece `open` iletiliyor.
      onOpenChange={(next: boolean) => onOpenChange(next)}
      disablePointerDismissal={!closeOnBackdrop}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={backdrop} />
        <Dialog.Popup className={popup({ size })}>
          <div className={header}>
            <div className={headerText}>
              <Dialog.Title className={titleClass}>{title}</Dialog.Title>
              {description !== undefined ? (
                <Dialog.Description className={descriptionClass}>{description}</Dialog.Description>
              ) : null}
            </div>

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
