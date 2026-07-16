import { ArrowRight } from 'lucide-react'
import { ModerationEventType, type ModerationEvent } from '../../../types/domain'
import {
  ADMIN_ROLE_LABEL,
  MODERATION_ACTOR_TYPE_LABEL,
  MODERATION_EVENT_LABEL,
  REJECTION_REASON_LABEL,
} from '../../../domain/labels'
import { formatDateTime, machineDateTime } from '../../../utils/formatDateTime'
import { Badge } from '../../primitives/Badge'
import { Skeleton } from '../../primitives/Skeleton'
import { DataTable } from '../DataTable'
import { EmptyState } from '../EmptyState'
import { StatusBadge } from '../StatusBadge'
import type { ColumnDef, ModerationHistoryProps } from '../../../types/component-props'
import * as css from './ModerationHistory.css'

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

/**
 * Olayın tonu. `satisfies Record<...>` sayesinde domain'e yeni bir olay türü
 * eklenip buraya tonu yazılmazsa derleme hatası alınır — tonsuz bir olay
 * sessizce nötr görünmez.
 */
const OLAY_TONU = {
  [ModerationEventType.Created]: 'neutral',
  [ModerationEventType.Submitted]: 'info',
  [ModerationEventType.Assigned]: 'info',
  [ModerationEventType.Approved]: 'success',
  [ModerationEventType.Rejected]: 'danger',
  [ModerationEventType.ChangesRequested]: 'warning',
  [ModerationEventType.Withdrawn]: 'neutral',
  [ModerationEventType.Edited]: 'neutral',
  [ModerationEventType.Paused]: 'warning',
  [ModerationEventType.Resumed]: 'success',
  [ModerationEventType.Expired]: 'warning',
  [ModerationEventType.Archived]: 'neutral',
  [ModerationEventType.Restored]: 'info',
  [ModerationEventType.NoteAdded]: 'neutral',
  [ModerationEventType.ReportLinked]: 'danger',
} as const satisfies Record<ModerationEventType, Tone>

/** `Elif Kaya · Moderatör` — sistem ve ilan sahibinde rol yok, tür yazılır. */
function aktorMetni(event: ModerationEvent): string {
  const { actor } = event

  const rol =
    actor.adminRole !== undefined
      ? ADMIN_ROLE_LABEL[actor.adminRole]
      : MODERATION_ACTOR_TYPE_LABEL[actor.type]

  return `${actor.displayName} · ${rol}`
}

/**
 * İlanın moderasyon geçmişi.
 *
 * Olayları **kendisi sıralar**, eskiden yeniye: geçmiş sırasız okunamaz ve
 * sıralamayı her çağırana bırakmak aynı geçmişin iki ekranda ters görünmesi
 * demekti. Zaman çizgisi bir hikâye gibi okunur — önce ne oldu, sonra ne oldu.
 *
 * Durum geçişleri `StatusBadge` ile gösterilir; etiketler `domain/labels.ts`'ten
 * gelir. Saat `Europe/Istanbul`'a sabitli (`utils/formatDateTime`): "kararı hangi
 * gün verdik" sorusunun cevabı, bakan kişinin makinesine göre değişmemeli.
 *
 * Göreli zaman ("3 gün önce") bilerek yok: hesabı "şimdi"ye dayanır, story'de
 * her gün başka bir metin üretir ve deterministik fixture kuralını tek başına
 * bozar.
 *
 * @example
 * <ModerationHistory events={events} variant="timeline" />
 */
export function ModerationHistory({
  events,
  variant = 'timeline',
  loading = false,
  empty = false,
}: ModerationHistoryProps) {
  if (loading) {
    return <Skeleton lines={4} />
  }

  /*
    `getTime()` ile sıralanıyor, metin karşılaştırmasıyla değil: fixture'ların
    hepsi `+03:00` taşıyor ama sunucu bir gün `Z` döndürürse metin sıralaması
    sessizce yanlış bir geçmiş üretirdi.
  */
  const sirali = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  if (empty || sirali.length === 0) {
    return (
      <EmptyState
        variant="compact"
        title="Moderasyon geçmişi yok"
        description="Bu ilan için henüz bir moderasyon olayı kaydedilmemiş."
      />
    )
  }

  if (variant === 'table') {
    const columns: ColumnDef<ModerationEvent>[] = [
      {
        id: 'createdAt',
        header: 'Tarih',
        width: '12rem',
        cell: (row) => (
          <time className={css.time} dateTime={machineDateTime(row.createdAt)}>
            {formatDateTime(row.createdAt)}
          </time>
        ),
      },
      {
        id: 'eventType',
        header: 'Olay',
        cell: (row) => (
          <span className={css.cellStack}>
            <span className={css.label}>{MODERATION_EVENT_LABEL[row.eventType]}</span>
            {row.fromStatus !== undefined && row.toStatus !== undefined ? (
              <span className={css.transition}>
                <StatusBadge status={row.fromStatus} size="sm" />
                <ArrowRight size={14} className={css.arrow} aria-hidden="true" />
                <StatusBadge status={row.toStatus} size="sm" />
              </span>
            ) : null}
          </span>
        ),
      },
      {
        id: 'actor',
        header: 'Aktör',
        width: '14rem',
        cell: (row) => <span className={css.actor}>{aktorMetni(row)}</span>,
      },
      {
        id: 'detail',
        header: 'Ayrıntı',
        cell: (row) => (
          <span className={css.cellStack}>
            {row.rejectionReasons.length > 0 ? (
              <span className={css.reasons}>
                {row.rejectionReasons.map((reason) => (
                  <Badge key={reason} tone="danger" size="sm">
                    {REJECTION_REASON_LABEL[reason]}
                  </Badge>
                ))}
              </span>
            ) : null}
            {row.note !== undefined ? <span>{row.note}</span> : null}
            <span className={css.cellMuted}>Revizyon {row.revision}</span>
          </span>
        ),
      },
    ]

    return (
      <DataTable
        rows={sirali}
        columns={columns}
        density="compact"
        visualStyle="bordered"
        mobileMode="scroll"
      />
    )
  }

  if (variant === 'compact') {
    return (
      <ol className={css.compactList}>
        {sirali.map((event) => (
          <li key={event.id} className={css.compactItem}>
            <span className={css.content({ variant: 'compact' })}>
              <span className={css.dot({ tone: OLAY_TONU[event.eventType] })} aria-hidden="true" />
              <span className={css.label}>{MODERATION_EVENT_LABEL[event.eventType]}</span>
              <span className={css.actor}>{aktorMetni(event)}</span>
              <time className={css.time} dateTime={machineDateTime(event.createdAt)}>
                {formatDateTime(event.createdAt)}
              </time>
            </span>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <ol className={css.timeline}>
      {sirali.map((event, index) => (
        <li key={event.id} className={css.event}>
          <span className={css.marker}>
            <span className={css.dot({ tone: OLAY_TONU[event.eventType] })} aria-hidden="true" />
            {/* Son olayda çizgi yok: bağlanacak bir sonraki olay yok. */}
            {index < sirali.length - 1 ? <span className={css.line} aria-hidden="true" /> : null}
          </span>

          <span className={css.content({ variant: 'timeline' })}>
            <span className={css.head}>
              <span className={css.label}>{MODERATION_EVENT_LABEL[event.eventType]}</span>
              <time className={css.time} dateTime={machineDateTime(event.createdAt)}>
                {formatDateTime(event.createdAt)}
              </time>
            </span>

            <span className={css.actor}>{aktorMetni(event)}</span>

            {event.fromStatus !== undefined && event.toStatus !== undefined ? (
              <span className={css.transition}>
                <StatusBadge status={event.fromStatus} size="sm" />
                <ArrowRight size={14} className={css.arrow} aria-hidden="true" />
                <StatusBadge status={event.toStatus} size="sm" />
              </span>
            ) : null}

            {event.rejectionReasons.length > 0 ? (
              <span className={css.reasons}>
                {event.rejectionReasons.map((reason) => (
                  <Badge key={reason} tone="danger" size="sm">
                    {REJECTION_REASON_LABEL[reason]}
                  </Badge>
                ))}
              </span>
            ) : null}

            {event.note !== undefined ? <p className={css.note}>{event.note}</p> : null}
          </span>
        </li>
      ))}
    </ol>
  )
}
