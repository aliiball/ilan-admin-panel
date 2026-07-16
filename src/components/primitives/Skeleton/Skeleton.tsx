import type { SkeletonProps } from '../../../types/component-props'
import { lastLine, lines as linesClass, skeleton } from './Skeleton.css'

/**
 * İçeriğin ölçüsünü koruyan yükleme göstergesi.
 *
 * Brifingin "loading durumları layout shift üretmemelidir" kuralının taşıyıcısı:
 * gerçek içerikle aynı yeri kapladığı için veri geldiğinde sayfa zıplamaz.
 * Boş ekran + spinner yerine bu tercih edilir.
 *
 * Tamamı `aria-hidden`'dır: ekran okuyucu boş kutuları okumamalıdır. Yükleniyor
 * bilgisini kapsayan bölüm `aria-busy` ile duyurmalıdır.
 *
 * @example
 * <Skeleton variant="text" lines={3} />
 */
export function Skeleton({ variant = 'text', width, height, lines }: SkeletonProps) {
  const style = {
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
  }

  if (variant === 'text' && lines !== undefined && lines > 1) {
    return (
      <span className={linesClass} aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <span
            key={index}
            className={`${skeleton({ variant: 'text' })} ${index === lines - 1 ? lastLine : ''}`}
            style={style}
          />
        ))}
      </span>
    )
  }

  return <span className={skeleton({ variant })} style={style} aria-hidden="true" />
}
