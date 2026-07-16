import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ModerationEventType } from '../../../types/domain'
import { MODERATION_EVENT_LABEL } from '../../../domain/labels'
import {
  allModerationEventFixtures,
  archivedBuildingHistory,
  pendingVillaHistory,
  rejectedFieldHistory,
  restoredDraftHistory,
} from '../../../fixtures'
import { ModerationHistory } from './ModerationHistory'
import * as css from './ModerationHistory.css'

const VARYANTLAR = ['timeline', 'table', 'compact'] as const

const meta = {
  title: 'Composites/ModerationHistory',
  component: ModerationHistory,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Olayları **kendisi sıralar**, eskiden yeniye: sıralamayı her çağırana bırakmak aynı ' +
          "geçmişin iki ekranda ters görünmesi demekti. Saat `Europe/Istanbul`'a sabitli — " +
          '"kararı hangi gün verdik" sorusunun cevabı bakanın makinesine göre değişmemeli. ' +
          'Göreli zaman ("3 gün önce") bilerek yok: hesabı "şimdi"ye dayanır ve deterministik ' +
          'fixture kuralını tek başına bozar.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'data-panel',
      useWhen: ['İlan detayında moderasyon olayları gösterilecekse'],
      doNotUseWhen: [
        'Sistem geneli denetim kaydı için — AuditLog ekranı ayrı',
        'Otomatik kontrol sonuçları için — AutomatedChecksPanel kullanın',
      ],
    },
  },

  args: {
    events: archivedBuildingHistory,
    variant: 'timeline',
    loading: false,
    empty: false,
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    events: { control: false },
    loading: { control: 'boolean' },
    empty: { control: 'boolean' },
  },
} satisfies Meta<typeof ModerationHistory>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Zaman çizgisi: önce ne oldu, sonra ne oldu. */
export const Timeline: Story = {
  args: { variant: 'timeline' },
}

/** Tablo: tarama ve karşılaştırma. `DataTable` üzerine kurulu. */
export const Table: Story = {
  args: { variant: 'table' },
  parameters: { layout: 'fullscreen' },
}

/** Sıkışık: yan panel ve dar kolon. */
export const Compact: Story = {
  args: { variant: 'compact' },
}

export const Loading: Story = {
  args: { loading: true },
}

/** Henüz olay yok. */
export const Empty: Story = {
  args: { events: [] },
}

/** `empty` bayrağı: olay dizisi dolu olsa da boş durum zorlanır. */
export const EmptyForced: Story = {
  args: { events: archivedBuildingHistory, empty: true },
}

export const Success: Story = {
  args: { events: archivedBuildingHistory },
}

/** Kuyruktan yeni alınmış ilan: kısa geçmiş, henüz karar yok. */
export const PendingReview: Story = {
  args: { events: pendingVillaHistory },
}

/** Red kararı: gerekçe rozeti ve not birlikte görünür. */
export const Rejected: Story = {
  args: { events: rejectedFieldHistory },
}

/** İlan sahibinin fikir değiştirdiği yol: geri çekme, arşivleme, geri yükleme. */
export const RestoredDraft: Story = {
  args: { events: restoredDraftHistory },
}

/** İki aylık tam yaşam döngüsü: 13 olay, revizyon 1'den 2'ye. */
export const LongContent: Story = {
  args: { events: allModerationEventFixtures },
}

/** Dar ekranda tablo yatay kaydırılır, zaman çizgisi sarar. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'timeline' },
}

export const MobileTable: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'table' },
  parameters: { layout: 'fullscreen' },
}

/**
 * Component olayları kendisi sıralamalı.
 *
 * Karışık sırada verilen olaylar ekranda eskiden yeniye çıkmalı: DOM'dan
 * ölçülüyor, çünkü "sıralıyorum" niyeti kodda doğru görünüp render'da
 * yanlış çıkabilir.
 */
export const SortsEventsItself: Story = {
  args: { variant: 'compact', events: [...pendingVillaHistory].reverse() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const etiketler = canvas
      .getAllByText(
        new RegExp(
          `^(${[
            MODERATION_EVENT_LABEL[ModerationEventType.Created],
            MODERATION_EVENT_LABEL[ModerationEventType.Submitted],
            MODERATION_EVENT_LABEL[ModerationEventType.Assigned],
            MODERATION_EVENT_LABEL[ModerationEventType.NoteAdded],
          ].join('|')})$`,
        ),
      )
      .map((element) => element.textContent)

    await expect(etiketler).toEqual([
      MODERATION_EVENT_LABEL[ModerationEventType.Created],
      MODERATION_EVENT_LABEL[ModerationEventType.Submitted],
      MODERATION_EVENT_LABEL[ModerationEventType.Assigned],
      MODERATION_EVENT_LABEL[ModerationEventType.NoteAdded],
    ])
  },
}

/**
 * On beş olay türünün hepsinin bir etiketi olmalı ve render edilmeli.
 *
 * Fixture'lar `ModerationEventType`'ın tamamını kapsıyor; yeni bir olay türü
 * eklenip fixture'a örneği konmazsa bu test düşer ve etiketsiz bir olayın
 * sessizce boş render edilmesi engellenir.
 */
export const EveryEventTypeRenders: Story = {
  args: { variant: 'compact', events: allModerationEventFixtures },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const eventType of Object.values(ModerationEventType)) {
      const etiket = MODERATION_EVENT_LABEL[eventType]
      await expect(canvas.getAllByText(etiket).length).toBeGreaterThan(0)
    }
  },
}

/**
 * Saat İstanbul'a sabitli olmalı.
 *
 * Fixture `2026-05-03T12:00:00+03:00` diyor; ekranda `12:00` yazmalı. Runner'ın
 * saat dilimine bırakılsaydı UTC'de `09:00`, Los Angeles'ta **2 Mayıs 23:00**
 * görünürdü — yalnız saat değil gün de kayar ve "karar hangi gün verildi"
 * sorusu makineye göre farklı cevaplanırdı.
 */
export const TimeIsPinnedToIstanbul: Story = {
  args: { variant: 'compact', events: archivedBuildingHistory },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('3 May 2026 12:00')).toBeInTheDocument()
  },
}

/** Tarih makine okunur biçimde de verilmeli — `<time datetime>` ham ISO taşır. */
export const TimeIsMachineReadable: Story = {
  args: { variant: 'compact', events: rejectedFieldHistory },
  play: async ({ canvasElement }) => {
    const zamanlar = canvasElement.querySelectorAll('time')

    await expect(zamanlar.length).toBeGreaterThan(0)
    await expect(zamanlar[0]).toHaveAttribute('datetime', '2026-07-12T13:40:00+03:00')
  },
}

/**
 * Durum geçişi iki rozetle gösterilmeli: nereden nereye.
 *
 * Sorgu geçiş kutusuna daraltılıyor, metne değil: "Reddedildi" hem olayın
 * etiketi hem de varış durumunun rozeti olarak geçiyor ve sayfa genelinde
 * aranırsa iki eşleşme döner. Aranan şey metnin varlığı değil, *geçişin*
 * doğru iki ucu.
 */
export const ShowsStatusTransition: Story = {
  args: { events: rejectedFieldHistory },
  play: async ({ canvasElement }) => {
    const gecisler = canvasElement.querySelectorAll(`.${css.transition}`)
    const sonGecis = gecisler[gecisler.length - 1]

    await expect(sonGecis).toBeDefined()

    const icinde = within(sonGecis as HTMLElement)
    await expect(icinde.getByText('İncelemede')).toBeInTheDocument()
    await expect(icinde.getByText('Reddedildi')).toBeInTheDocument()
  },
}

/** Red gerekçesi rozeti geçmişte de görünmeli — karar gerekçesiyle birlikte saklanır. */
export const ShowsRejectionReasons: Story = {
  args: { events: rejectedFieldHistory },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Mükerrer İlan')).toBeInTheDocument()
    await expect(
      canvas.getByText(/Aynı gayrimenkule ait aktif bir ilan bulundu/),
    ).toBeInTheDocument()
  },
}

export const VariantsComparison: Story = {
  args: { events: rejectedFieldHistory },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem', padding: '1rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <ModerationHistory {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
