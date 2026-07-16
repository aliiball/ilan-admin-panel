import { Flag, ImageOff, MapPin, Eye } from 'lucide-react'
import { Badge } from '../../primitives/Badge'
import { Checkbox } from '../../primitives/Checkbox'
import { StatusBadge } from '../StatusBadge'
import {
  LISTING_CATEGORY_LABEL,
  SELLER_TYPE_LABEL,
  TRANSACTION_TYPE_LABEL,
} from '../../../domain/labels'
import { formatCurrency } from '../../../utils/formatCurrency'
import type { ListingCardProps } from '../../../types/component-props'
import * as css from './ListingCard.css'

/** Aktif promosyonların görünür etiketleri. */
const PROMOTION_LABEL = {
  oneCikan: 'Öne çıkan',
  acil: 'Acil',
  vitrin: 'Vitrin',
  anasayfaVitrini: 'Anasayfa vitrini',
  kategoriOneCikan: 'Kategori öne çıkan',
} as const

/**
 * İlan özeti: liste, moderasyon kuyruğu ve dashboard'da kullanılır.
 *
 * Veri çekmez — `listing` prop'undan gelir. Brifingin "composites domain verisini
 * görselleştirebilir ancak veri çekmez" kuralı budur.
 *
 * Üç varyant farklı yoğunluk içindir: `compact` kuyrukta, `detailed` ilan
 * listesinde, `grid` dashboard'da. Uzun başlık iki satırda kesilir, böylece
 * listedeki kart yükseklikleri sabit kalır ve tarama bozulmaz.
 *
 * Fotoğrafsız ilan kırık resim yerine açık bir "görsel yok" durumu gösterir —
 * yayına alınmadan önce fark edilmesi gereken bir eksiktir.
 *
 * `flagged` sol kenardan kırmızı şeritle işaretlenir: yalnız renk değil, kenarlık
 * kalınlığı da değişir.
 *
 * @example
 * <ListingCard listing={listing} variant="detailed" onClick={ilanaGit} />
 */
export function ListingCard({
  listing,
  variant = 'compact',
  selected = false,
  flagged = false,
  showModerationMeta = false,
  actions,
  onClick,
  onSelectedChange,
}: ListingCardProps) {
  const kapak = listing.photos.find((p) => p.isCover) ?? listing.photos[0]
  const fiyatSifir = listing.price.amount <= 0
  const tiklanabilir = onClick !== undefined

  const govde = (
    <div className={css.body}>
      <div className={css.topRow}>
        <div className={css.titleBlock}>
          <span className={css.title}>{listing.title}</span>
          <span className={css.listingNo}>İlan no: {listing.listingNo}</span>
        </div>

        <div className={css.actions}>
          <StatusBadge status={listing.status} size="sm" showDot />
          {actions}
        </div>
      </div>

      <div className={css.meta}>
        <span className={css.metaItem}>
          {LISTING_CATEGORY_LABEL[listing.category]} ·{' '}
          {TRANSACTION_TYPE_LABEL[listing.transactionType]}
        </span>
        <span className={css.metaItem}>
          <MapPin size={13} aria-hidden="true" />
          {listing.location.districtName}, {listing.location.cityName}
        </span>
        <span className={css.metaItem}>{SELLER_TYPE_LABEL[listing.seller.type]}</span>
      </div>

      {fiyatSifir ? (
        <span className={css.priceMissing}>Fiyat girilmemiş</span>
      ) : (
        <span className={css.price}>{formatCurrency(listing.price)}</span>
      )}

      <div className={css.badges}>
        {Object.entries(listing.promotionFlags)
          .filter(([, aktif]) => aktif)
          .map(([anahtar]) => (
            <Badge key={anahtar} tone="primary" variant="soft" size="sm">
              {PROMOTION_LABEL[anahtar as keyof typeof PROMOTION_LABEL]}
            </Badge>
          ))}

        {listing.metrics.reportCount > 0 ? (
          <Badge tone="danger" variant="soft" size="sm" leadingIcon={<Flag size={12} />}>
            {listing.metrics.reportCount} şikayet
          </Badge>
        ) : null}
      </div>

      {showModerationMeta ? (
        <div className={css.moderationMeta}>
          <span className={css.metaItem}>
            <Eye size={13} aria-hidden="true" />
            {listing.metrics.viewCount.toLocaleString('tr-TR')} görüntülenme
          </span>
          <span>Revizyon {listing.revision}</span>
          {listing.moderation.currentReviewerId !== undefined ? (
            <span>İnceleyen atanmış</span>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  const gorsel = (
    <div className={css.media({ variant })}>
      {kapak !== undefined ? (
        <>
          <img className={css.image} src={kapak.thumbnailUrl} alt="" loading="lazy" />
          {listing.photos.length > 1 ? (
            <span className={css.photoCount}>{listing.photos.length}</span>
          ) : null}
        </>
      ) : (
        <span className={css.noPhoto}>
          <ImageOff size={20} aria-hidden="true" />
          Görsel yok
        </span>
      )}
    </div>
  )

  /**
   * Tıklanabilir bölge `<button>`'dır — `<div onClick>` klavyeyle erişilemez ve
   * ekran okuyucuya tıklanabilir olduğunu söylemez.
   *
   * Ama buton kartın TAMAMINI sarmaz: seçim kutusu da etkileşimli, iç içe
   * etkileşimli element geçersiz HTML olur ve checkbox klavyeyle ulaşılamaz
   * hale gelir. Bu yüzden checkbox butonun kardeşidir, çocuğu değil.
   */
  const tiklanabilirBolge = tiklanabilir ? (
    <button type="button" className={css.clickRegion({ variant })} onClick={() => onClick(listing)}>
      {gorsel}
      {govde}
    </button>
  ) : (
    <div className={css.clickRegion({ variant })}>
      {gorsel}
      {govde}
    </div>
  )

  return (
    <article
      className={css.card({ selectable: onSelectedChange !== undefined })}
      data-selected={selected ? '' : undefined}
      data-flagged={flagged ? '' : undefined}
      data-clickable={tiklanabilir ? '' : undefined}
    >
      {onSelectedChange !== undefined ? (
        <div className={css.selectionCell}>
          <Checkbox
            label={`${listing.title} ilanını seç`}
            checked={selected}
            onCheckedChange={onSelectedChange}
          />
        </div>
      ) : null}
      {tiklanabilirBolge}
    </article>
  )
}
