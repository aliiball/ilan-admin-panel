import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../../primitives/Button'
import type { ErrorStateProps } from '../../../types/component-props'
import * as css from './ErrorState.css'

/** Varyanta göre ikon boyutu: satır içindeki hata sayfa hatası kadar bağırmamalı. */
const IKON_BOYUTU = { page: 32, section: 24, inline: 18 } as const

/**
 * Hata ve yeniden deneme.
 *
 * `role="alert"` taşır: hata veri yerine geçtiği an ekran okuyucuya duyurulur,
 * kullanıcı sekmeyle oraya varana kadar beklemez.
 *
 * `onRetry` verilmezse buton hiç çıkmaz. Bu bilinçlidir ve `UiError.retryable`
 * ile eşleşir: tekrar denemenin işe yaramayacağı bir hatada (yetkisiz, kayıt
 * yok) buton sunmak kullanıcıyı boşa uğraştırır.
 *
 * `description` kullanıcıya ne yapacağını söyler; ham sunucu mesajı veya yığın
 * izi buraya girmez. Destek ekibinin işine yarayan `code` ayrı alandadır ve
 * kopyalanabilir.
 *
 * Hata yalnız renkle anlatılmaz: kırmızı zeminin yanında üçgen ikon ve metin de
 * vardır.
 *
 * Başlık varsayılan olarak `<p>`'dir — gerekçesi için bkz. `EmptyState`.
 * `headingLevel` verilirse `<h{n}>` olur (`variant="page"` bir tam sayfa ekranda
 * `<h1>` ister); görünüm birebir aynı kalır, yalnız element türü değişir.
 *
 * `secondaryAction` "Tekrar dene"nin yanına bir güvenli geri dönüş bağlantısı
 * koyar (brifing 2.1). `onRetry` yokken de görünebilir: 403'te "tekrar dene" yok
 * ama "geri dön" vardır.
 *
 * @example
 * <ErrorState
 *   variant="section"
 *   title="İlanlar yüklenemedi"
 *   description="Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin."
 *   code="NETWORK_TIMEOUT"
 *   onRetry={tekrarDene}
 * />
 */
export function ErrorState({
  title,
  description,
  code,
  retryLabel = 'Tekrar dene',
  variant = 'page',
  onRetry,
  secondaryAction,
  headingLevel,
}: ErrorStateProps) {
  // Bkz. EmptyState: düzeyini bilen çağıran verir, verilmezse `<p>` kalır. Burada
  // `1`'e de izin var — tam sayfa (`variant="page"`) bir hata ekranı sayfanın
  // `<h1>`'idir. `css.title`'ın `margin: 0`'ı `<h*>`'nin tarayıcı margin'ini de siler.
  const Heading = (headingLevel !== undefined ? `h${headingLevel}` : 'p') as
    'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  // `onRetry` yoksa "tekrar dene" çıkmaz, ama `secondaryAction` (geri dönüş) tek
  // başına da görünebilmeli — kutu ikisinden biri varsa açılır.
  const eylemVar = onRetry !== undefined || secondaryAction !== undefined

  return (
    <div className={css.root({ variant })} data-variant={variant} role="alert">
      <span className={css.icon} aria-hidden="true">
        <AlertTriangle size={IKON_BOYUTU[variant]} />
      </span>

      <div className={css.content}>
        <Heading className={css.title}>{title}</Heading>
        <p className={css.description}>{description}</p>

        {code !== undefined ? (
          <p className={css.code}>
            Hata kodu: <span className={css.codeValue}>{code}</span>
          </p>
        ) : null}
      </div>

      {eylemVar ? (
        <div className={css.actions}>
          {onRetry !== undefined ? (
            <Button
              variant="secondary"
              size={variant === 'inline' ? 'sm' : 'md'}
              leadingIcon={<RefreshCw size={16} />}
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          ) : null}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}
