import { useState } from 'react'
import { Check, ImageOff, X } from 'lucide-react'
import { AssetModerationStatus, RejectionReason, type ListingPhoto } from '../../../types/domain'
import {
  ASSET_MODERATION_STATUS_LABEL,
  REJECTION_REASON_DESCRIPTION,
  REJECTION_REASON_LABEL,
} from '../../../domain/labels'
import { PHOTO_REJECTION_REASONS } from '../../../domain/moderationActions'
import { Badge } from '../../primitives/Badge'
import { Button } from '../../primitives/Button'
import { Modal } from '../../primitives/Modal'
import { Select } from '../../primitives/Select'
import { Skeleton } from '../../primitives/Skeleton'
import { Textarea } from '../../primitives/Textarea'
import { EmptyState } from '../EmptyState'
import type { ImageGalleryProps, SelectOption } from '../../../types/component-props'
import * as css from './ImageGallery.css'

const DURUM_TONU = {
  [AssetModerationStatus.Pending]: 'neutral',
  [AssetModerationStatus.Approved]: 'success',
  [AssetModerationStatus.Rejected]: 'danger',
} as const satisfies Record<AssetModerationStatus, 'neutral' | 'success' | 'danger'>

/** Şerit noktasının recipe varyant adı; enum değerleriyle birebir. */
const DURUM_NOKTASI = {
  [AssetModerationStatus.Pending]: 'pending',
  [AssetModerationStatus.Approved]: 'approved',
  [AssetModerationStatus.Rejected]: 'rejected',
} as const satisfies Record<AssetModerationStatus, 'pending' | 'approved' | 'rejected'>

const GEREKCE_SECENEKLERI: SelectOption[] = PHOTO_REJECTION_REASONS.map((reason) => ({
  value: reason,
  label: REJECTION_REASON_LABEL[reason],
  description: REJECTION_REASON_DESCRIPTION[reason],
}))

/**
 * İlan fotoğraflarını inceleme ve tek tek moderasyon.
 *
 * Büyük görsel `object-fit: contain` ile gösterilir, `cover` ile değil:
 * kırpılan kenarda filigran, telefon numarası veya uygunsuz bir detay olabilir
 * ve görmediğin şeyi onaylamak moderasyon değildir.
 *
 * **Bozuk görsel bir durumdur, kaza değil.** Yüklenemeyen fotoğrafın yerine
 * tarayıcının kırık ikonu değil, ne olduğunu söyleyen bir kutu konur —
 * moderatör "fotoğraf uygunsuz" ile "fotoğraf açılmıyor" arasındaki farkı
 * görmeli; ikincisinde karar vermek yerine altyapıya bakılır.
 *
 * `activePhotoId` verilirse galeri kontrollüdür; verilmezse seçimi kendisi
 * tutar — tek başına da çalışır.
 *
 * Fotoğraf reddi gerekçe ister ama **not istemez**: gerekçe ilan sahibine hangi
 * fotoğrafın neden kaldırıldığını zaten söyler, not yalnız somutlaştırır.
 * Gerekçeler `PHOTO_REJECTION_REASONS` ile sınırlı — "Fiyat Hatası" bir
 * fotoğrafın suçu olamaz.
 *
 * @example
 * <ImageGallery photos={listing.photos} allowModeration onPhotoReject={fotografiReddet} />
 */
export function ImageGallery({
  photos,
  activePhotoId,
  variant = 'mosaic',
  loading = false,
  allowModeration = false,
  onActivePhotoChange,
  onPhotoApprove,
  onPhotoReject,
}: ImageGalleryProps) {
  const [iceriSecili, setIceriSecili] = useState<string | undefined>(undefined)
  const [bozukUrller, setBozukUrller] = useState<readonly string[]>([])
  const [redAcik, setRedAcik] = useState(false)
  const [redGerekce, setRedGerekce] = useState<string | undefined>(undefined)
  const [redNot, setRedNot] = useState('')

  if (loading) {
    return (
      <div className={css.root({ variant })}>
        <div className={css.stage}>
          {/* Ölçüler gerçek düzenle aynı: veri gelince yükseklik değişmez, sayfa zıplamaz. */}
          <Skeleton variant="rectangle" height="18rem" />
        </div>
      </div>
    )
  }

  const sirali = [...photos].sort((a, b) => a.order - b.order)
  const [ilk] = sirali

  if (ilk === undefined) {
    return (
      <EmptyState
        variant="compact"
        title="Bu ilanda fotoğraf yok"
        description="İlan sahibi henüz fotoğraf yüklemedi. Fotoğrafsız ilan yayına alınamaz."
      />
    )
  }

  const varsayilan = sirali.find((photo) => photo.isCover) ?? ilk
  const aktif = sirali.find((photo) => photo.id === (activePhotoId ?? iceriSecili)) ?? varsayilan
  const aktifSira = sirali.findIndex((photo) => photo.id === aktif.id) + 1

  const bozuk = (url: string) => bozukUrller.includes(url)
  const bozuldu = (url: string) =>
    setBozukUrller((onceki) => (onceki.includes(url) ? onceki : [...onceki, url]))

  const sec = (photo: ListingPhoto) => {
    setIceriSecili(photo.id)
    onActivePhotoChange?.(photo.id)
  }

  const moderasyonVar =
    allowModeration && (onPhotoApprove !== undefined || onPhotoReject !== undefined)

  const reddet = () => {
    if (redGerekce === undefined) return

    const temizNot = redNot.trim()
    onPhotoReject?.(aktif.id, redGerekce as RejectionReason, temizNot === '' ? undefined : temizNot)

    setRedAcik(false)
    setRedGerekce(undefined)
    setRedNot('')
  }

  return (
    <div className={css.root({ variant })}>
      <div className={css.stage}>
        <figure className={css.frame} style={{ margin: 0 }}>
          {bozuk(aktif.url) ? (
            <div className={css.broken}>
              <ImageOff size={32} aria-hidden="true" />
              <span>Görsel yüklenemedi. Dosya sunucuda bulunamadı veya bozuk.</span>
            </div>
          ) : (
            <img
              className={css.image}
              src={aktif.url}
              alt={aktif.altText}
              onError={() => bozuldu(aktif.url)}
            />
          )}

          <span className={css.badgeSlot}>
            <Badge tone={DURUM_TONU[aktif.moderationStatus]} variant="solid">
              {ASSET_MODERATION_STATUS_LABEL[aktif.moderationStatus]}
            </Badge>
          </span>

          {aktif.isCover ? (
            <span className={css.coverSlot}>
              <Badge tone="info" variant="solid">
                Kapak
              </Badge>
            </span>
          ) : null}
        </figure>

        <div className={css.toolbar}>
          <span className={css.toolbarNote}>
            {aktifSira} / {sirali.length}
            {aktif.moderationStatus === AssetModerationStatus.Rejected &&
            aktif.rejectionReason !== undefined
              ? ` — ${REJECTION_REASON_LABEL[aktif.rejectionReason]}`
              : ''}
          </span>

          {moderasyonVar && onPhotoApprove !== undefined ? (
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Check size={16} />}
              disabled={aktif.moderationStatus === AssetModerationStatus.Approved}
              onClick={() => onPhotoApprove(aktif.id)}
            >
              Uygun
            </Button>
          ) : null}

          {moderasyonVar && onPhotoReject !== undefined ? (
            <Button
              variant="danger"
              size="sm"
              leadingIcon={<X size={16} />}
              onClick={() => setRedAcik(true)}
            >
              Uygunsuz
            </Button>
          ) : null}
        </div>
      </div>

      <ul className={css.thumbs({ variant })}>
        {sirali.map((photo, index) => (
          <li key={photo.id} className={css.thumbItem}>
            <button
              type="button"
              className={css.thumb}
              aria-current={photo.id === aktif.id}
              aria-label={`${index + 1}. fotoğraf, ${ASSET_MODERATION_STATUS_LABEL[photo.moderationStatus]}${
                photo.isCover ? ', kapak' : ''
              }`}
              onClick={() => sec(photo)}
            >
              {bozuk(photo.thumbnailUrl) ? (
                <span className={css.brokenThumb}>
                  <ImageOff size={16} aria-hidden="true" />
                </span>
              ) : (
                <img
                  className={css.thumbImage}
                  src={photo.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  onError={() => bozuldu(photo.thumbnailUrl)}
                />
              )}

              <span
                className={css.thumbStatus({ status: DURUM_NOKTASI[photo.moderationStatus] })}
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={redAcik}
        size="sm"
        title={`${aktifSira}. fotoğrafı uygunsuz işaretle`}
        description="Gerekçe ilan sahibine iletilir. Yalnız bu fotoğraf kaldırılır, ilanın kendisi etkilenmez."
        onOpenChange={(next) => {
          if (!next) setRedAcik(false)
        }}
        footer={
          <div className={css.footer}>
            <Button variant="secondary" onClick={() => setRedAcik(false)}>
              Vazgeç
            </Button>
            <Button variant="danger" disabled={redGerekce === undefined} onClick={reddet}>
              Uygunsuz işaretle
            </Button>
          </div>
        }
      >
        <div className={css.dialogBody}>
          <Select
            label="Gerekçe"
            placeholder="Gerekçe seçin"
            required
            options={GEREKCE_SECENEKLERI}
            value={redGerekce}
            onValueChange={setRedGerekce}
          />

          <Textarea
            label="Not"
            helperText="İsteğe bağlı. Gerekçeyi somutlaştırır: neyin, fotoğrafın neresinde olduğu."
            value={redNot}
            rows={2}
            maxLength={300}
            showCharacterCount
            onChange={(event) => setRedNot(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
