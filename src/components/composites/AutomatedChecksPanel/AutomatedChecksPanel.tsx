import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { AutomatedCheckResultStatus, type AutomatedCheckResult } from '../../../types/domain'
import {
  AUTOMATED_CHECK_BLOCKING,
  AUTOMATED_CHECK_LABEL,
  AUTOMATED_CHECK_STATUS_LABEL,
} from '../../../domain/labels'
import { formatDateTime } from '../../../utils/formatDateTime'
import { Badge } from '../../primitives/Badge'
import { Skeleton } from '../../primitives/Skeleton'
import { EmptyState } from '../EmptyState'
import type { AutomatedChecksPanelProps } from '../../../types/component-props'
import * as css from './AutomatedChecksPanel.css'

const DURUM_TONU = {
  [AutomatedCheckResultStatus.Passed]: 'success',
  [AutomatedCheckResultStatus.Warning]: 'warning',
  [AutomatedCheckResultStatus.Failed]: 'danger',
} as const satisfies Record<AutomatedCheckResultStatus, 'success' | 'warning' | 'danger'>

/** Recipe varyant adı; enum değerleriyle birebir. */
const DURUM_STILI = {
  [AutomatedCheckResultStatus.Passed]: 'passed',
  [AutomatedCheckResultStatus.Warning]: 'warning',
  [AutomatedCheckResultStatus.Failed]: 'failed',
} as const satisfies Record<AutomatedCheckResultStatus, 'passed' | 'warning' | 'failed'>

function DurumIkonu({ status }: { status: AutomatedCheckResultStatus }) {
  if (status === AutomatedCheckResultStatus.Passed) {
    return <CheckCircle2 size={18} aria-hidden="true" />
  }

  if (status === AutomatedCheckResultStatus.Warning) {
    return <AlertTriangle size={18} aria-hidden="true" />
  }

  return <XCircle size={18} aria-hidden="true" />
}

/** Skor 0–1 aralığında geliyor; yüzde olarak okunması daha kolay. */
function formatSkor(score: number): string {
  return `Skor %${Math.round(score * 100)}`
}

/**
 * İlanın otomatik kalite kontrollerinin sonuçları.
 *
 * Domain tipini (`AutomatedCheckResult`) doğrudan alır:
 * `listing.moderation.automatedChecks` olduğu gibi geçilir. Etiket
 * `domain/labels.ts`'ten gelir — sonucun içinde taşınmaz; aynı kontrolün adı
 * kuyrukta başka, detayda başka yazılamasın diye.
 *
 * **`warning` bloklamaz, `failed` bloklar.** Brifing 1.2'ye göre
 * `pendingReview → published` geçişinin koşulu "bloklayıcı otomatik kontrol
 * yok"; uyarı moderatörün *bakmasını* ister, kararını vermez. İkisini aynı
 * sepete koymak uyarı üreten her ilanı onaylanamaz yapardı. Panel bu ayrımı
 * gösterir ama **kararı vermez** — onay butonunu yöneten ModerationActionBar'dır.
 *
 * Durum yalnız renkle ifade edilmez: her satırda ikon, renkli metin ve rozetin
 * kendi yazısı birlikte bulunur.
 *
 * @example
 * <AutomatedChecksPanel items={listing.moderation.automatedChecks} variant="summary" />
 */
export function AutomatedChecksPanel({
  items,
  variant = 'list',
  loading = false,
}: AutomatedChecksPanelProps) {
  if (loading) {
    return (
      <div className={css.root({ variant })}>
        {/* Üç satır: gerçek panelin tipik yüksekliği. Veri gelince düzen zıplamaz. */}
        <Skeleton lines={3} />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        variant="compact"
        title="Otomatik kontrol sonucu yok"
        description="Bu ilan için henüz otomatik kontrol çalışmadı. İnceleme el ile yapılmalı."
      />
    )
  }

  const sayilar = {
    [AutomatedCheckResultStatus.Passed]: 0,
    [AutomatedCheckResultStatus.Warning]: 0,
    [AutomatedCheckResultStatus.Failed]: 0,
  }

  for (const sonuc of items) sayilar[sonuc.status] += 1

  const bloklayanlar = items.filter((sonuc) => AUTOMATED_CHECK_BLOCKING[sonuc.status])

  const satir = (sonuc: AutomatedCheckResult, satirVariant: 'list' | 'cards') => (
    <li
      key={sonuc.code}
      className={css.item({ status: DURUM_STILI[sonuc.status], variant: satirVariant })}
    >
      <span className={css.icon}>
        <DurumIkonu status={sonuc.status} />
      </span>

      <span className={css.body}>
        <span className={css.label}>{AUTOMATED_CHECK_LABEL[sonuc.code]}</span>
        <p className={css.message}>{sonuc.message}</p>

        {satirVariant === 'cards' ? (
          <span className={css.meta}>
            {sonuc.score !== undefined ? <span>{formatSkor(sonuc.score)}</span> : null}
            <span>{formatDateTime(sonuc.checkedAt)}</span>
          </span>
        ) : null}
      </span>

      {satirVariant === 'list' ? (
        <span className={css.badgeSlot}>
          <Badge tone={DURUM_TONU[sonuc.status]}>
            {AUTOMATED_CHECK_STATUS_LABEL[sonuc.status]}
          </Badge>
        </span>
      ) : null}
    </li>
  )

  if (variant === 'summary') {
    return (
      <div className={css.root({ variant })}>
        <div className={css.summaryRow}>
          <span className={css.summaryCounts}>
            <Badge tone="success" leadingIcon={<CheckCircle2 size={14} />}>
              {sayilar[AutomatedCheckResultStatus.Passed]} geçti
            </Badge>
            <Badge tone="warning" leadingIcon={<AlertTriangle size={14} />}>
              {sayilar[AutomatedCheckResultStatus.Warning]} uyarı
            </Badge>
            <Badge tone="danger" leadingIcon={<XCircle size={14} />}>
              {sayilar[AutomatedCheckResultStatus.Failed]} başarısız
            </Badge>
          </span>

          {bloklayanlar.length > 0 ? (
            <Badge tone="danger" variant="solid">
              Yayına engel
            </Badge>
          ) : null}
        </div>

        {/*
          Özet yalnız sorunluları listeler: geçen kontrolü okumak karar
          hızlandırmaz, sayısı yeter. Sorun yoksa bunu açıkça söyler —
          boş bir alan "kontrol çalışmadı" ile karışırdı.
        */}
        {items.some((sonuc) => sonuc.status !== AutomatedCheckResultStatus.Passed) ? (
          <ul className={css.summaryProblems}>
            {items
              .filter((sonuc) => sonuc.status !== AutomatedCheckResultStatus.Passed)
              .map((sonuc) => satir(sonuc, 'list'))}
          </ul>
        ) : (
          <p className={css.allClear}>Bütün kontroller geçti; incelenecek bulgu yok.</p>
        )}
      </div>
    )
  }

  return (
    <ul className={css.root({ variant })}>
      {items.map((sonuc) => satir(sonuc, variant === 'cards' ? 'cards' : 'list'))}
    </ul>
  )
}
