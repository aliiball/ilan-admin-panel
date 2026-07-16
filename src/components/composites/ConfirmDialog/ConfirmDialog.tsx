import { useEffect, useState } from 'react'
import { Button } from '../../primitives/Button'
import { Input } from '../../primitives/Input'
import { Modal } from '../../primitives/Modal'
import type { ConfirmDialogProps } from '../../../types/component-props'
import * as css from './ConfirmDialog.css'

/**
 * Geri döndürülemez işlem onayı.
 *
 * `Modal` üzerine kuruludur; odak kilidi, `Escape` ve odağın tetikleyiciye
 * dönmesi oradan gelir. Fark, dialog'un tek bir soruya indirgenmesi ve
 * yanlışlıkla onaylanmaya karşı korunmasıdır.
 *
 * **Yıkıcı eylem ilk odağı almaz.** Modal'ın DOM sırasında ilk odaklanabilir
 * element başlıktaki kapatma butonudur, onay butonu ise en sonda; dialog açılır
 * açılmaz Enter'a basan kullanıcı silme işlemini başlatmaz.
 *
 * `requireText` verilirse kullanıcı metni birebir yazana kadar onay kapalı
 * kalır. Yazmak, kullanıcıyı ne yaptığını okumaya zorlar — toplu silmede tek
 * tıkla dönülemeyecek bir hata yapmaktan korur. Yazılan metin dialog her
 * açılışta sıfırlanır: aksi hâlde ikinci açılışta onay butonu önceki yazının
 * mirasıyla açık gelirdi.
 *
 * `loading` sürerken dialog dışarı tıklama ve `Escape` ile kapanmaz: istek
 * uçarken dialog kaybolursa kullanıcı işlemin sonucunu hiç görmez.
 *
 * @example
 * <ConfirmDialog
 *   open={acik}
 *   tone="danger"
 *   title="12 ilanı kalıcı olarak sil"
 *   description="Bu işlem geri alınamaz. İlanlar ve fotoğrafları kalıcı olarak silinir."
 *   requireText="SİL"
 *   confirmLabel="Kalıcı olarak sil"
 *   onConfirm={sil}
 *   onCancel={() => setAcik(false)}
 * />
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Vazgeç',
  tone = 'neutral',
  requireText,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [yazilan, setYazilan] = useState('')

  /**
   * Kapanışta değil açılışta sıfırlanıyor: kapanış animasyonu sürerken alanın
   * boşaldığını görmek tuhaf olurdu, ama yeni açılış her zaman temiz başlamalı.
   */
  useEffect(() => {
    if (open) setYazilan('')
  }, [open])

  const dogrulandi = requireText === undefined || yazilan.trim() === requireText

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      size="sm"
      closeOnBackdrop={!loading}
      /*
        Modal `onOpenChange` ile hem kapatma butonunu hem Escape'i hem de dışarı
        tıklamayı buraya çıkarıyor; hepsi vazgeçme sayılır. `loading` sürerken
        yok sayılıyor: `closeOnBackdrop` yalnız işaretçiyi durdurur, Escape'i
        durduran bu koşuldur.
      */
      onOpenChange={(next) => {
        if (!next && !loading) onCancel()
      }}
      footer={
        <div className={css.footer}>
          <Button variant="secondary" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            disabled={!dogrulandi}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {requireText !== undefined ? (
        <Input
          label={`Onaylamak için "${requireText}" yazın`}
          value={yazilan}
          disabled={loading}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(event) => setYazilan(event.target.value)}
        />
      ) : null}
    </Modal>
  )
}
