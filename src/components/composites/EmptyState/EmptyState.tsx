import type { EmptyStateProps } from '../../../types/component-props'
import * as css from './EmptyState.css'

/**
 * Boş veri ve boş filtre sonucu.
 *
 * Boşluğun iki farklı sebebi vardır ve kullanıcının atacağı adım da farklıdır:
 * hiç kayıt yoksa yapılacak şey **oluşturmak**, filtre elediyse **filtreyi
 * gevşetmek**. `variant="filtered"` bu ayrımı görsel olarak kurar; ikisini aynı
 * kutuda göstermek kullanıcıyı yanlış eyleme iter.
 *
 * Eylemleri kendi uydurmaz: hangi butonun görüneceğine sayfa katmanı karar verir
 * ve `primaryAction` ile geçer. Yetkisi olmayan kullanıcıya eylem geçilmez —
 * `disabled` buton değil, hiç buton.
 *
 * Başlık `<p>`'dir, `<h2>` değil: component hangi başlık seviyesinde durduğunu
 * bilemez ve yanlış seviye, belge taslağını ekran okuyucu için bozar. Görsel
 * ağırlık stille verilir.
 *
 * `illustration` dekoratiftir ve ekran okuyucudan gizlenir; anlamı `title`
 * taşımalıdır.
 *
 * @example
 * <EmptyState
 *   variant="filtered"
 *   title="Filtrelere uyan ilan yok"
 *   description="Seçili durum ve tarih aralığında kayıt bulunamadı."
 *   primaryAction={<Button variant="secondary" onClick={temizle}>Filtreleri temizle</Button>}
 * />
 */
export function EmptyState({
  title,
  description,
  illustration,
  primaryAction,
  secondaryAction,
  variant = 'default',
}: EmptyStateProps) {
  const eylemVar = primaryAction !== undefined || secondaryAction !== undefined

  return (
    <div className={css.root({ variant })}>
      {illustration !== undefined ? (
        <span className={css.illustration({ variant })} aria-hidden="true">
          {illustration}
        </span>
      ) : null}

      <p className={css.title({ variant })}>{title}</p>

      {description !== undefined ? <p className={css.description}>{description}</p> : null}

      {eylemVar ? (
        <div className={css.actions}>
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}
