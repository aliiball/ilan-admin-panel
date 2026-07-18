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
 * Başlık varsayılan olarak `<p>`'dir, `<h2>` değil: bir composite hangi başlık
 * seviyesinde durduğunu bilemez ve kör bir `<h3>` `heading-order` ihlali riski
 * taşır. Görsel ağırlık stille verilir. Ama **düzeyini bilen** bir tam sayfa
 * ekran (`AuthScreen`) `headingLevel` geçebilir; o zaman başlık `<h{n}>` olur ve
 * görünüm birebir aynı kalır — yalnız DOM'daki element türü değişir.
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
  headingLevel,
  variant = 'default',
}: EmptyStateProps) {
  const eylemVar = primaryAction !== undefined || secondaryAction !== undefined

  // Düzeyini yalnız *bilen* çağıran verir; verilmezse `<p>` kalır (Faz 3 öncesi
  // davranış, geriye dönük uyum). Element türü değişir, görünüm değişmez:
  // `css.title`'ın `margin: 0`'ı `<h*>`'nin taşıdığı tarayıcı margin'ini de
  // sıfırlar (aynı reset tuzağı — sıfırlanmazsa `compact`/`default` farkı kaybolur),
  // font/ağırlık/boşluk recipe'ten geldiği için başlık `<p>` ile birebir aynı görünür.
  const Heading = (headingLevel !== undefined ? `h${headingLevel}` : 'p') as
    'p' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  return (
    <div className={css.root({ variant })}>
      {illustration !== undefined ? (
        <span className={css.illustration({ variant })} aria-hidden="true">
          {illustration}
        </span>
      ) : null}

      <Heading className={css.title({ variant })}>{title}</Heading>

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
