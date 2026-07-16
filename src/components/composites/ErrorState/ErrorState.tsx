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
 * Başlık `<p>`'dir — gerekçesi için bkz. `EmptyState`.
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
}: ErrorStateProps) {
  return (
    <div className={css.root({ variant })} data-variant={variant} role="alert">
      <span className={css.icon} aria-hidden="true">
        <AlertTriangle size={IKON_BOYUTU[variant]} />
      </span>

      <div className={css.content}>
        <p className={css.title}>{title}</p>
        <p className={css.description}>{description}</p>

        {code !== undefined ? (
          <p className={css.code}>
            Hata kodu: <span className={css.codeValue}>{code}</span>
          </p>
        ) : null}
      </div>

      {onRetry !== undefined ? (
        <div className={css.actions}>
          <Button
            variant="secondary"
            size={variant === 'inline' ? 'sm' : 'md'}
            leadingIcon={<RefreshCw size={16} />}
            onClick={onRetry}
          >
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
