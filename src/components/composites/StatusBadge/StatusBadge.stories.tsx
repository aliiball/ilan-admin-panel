import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ListingStatus } from '../../../types/domain'
import { allListingFixtures } from '../../../fixtures'
import { StatusBadge } from './StatusBadge'

const TUM_DURUMLAR = Object.values(ListingStatus)
const VARYANTLAR = ['solid', 'soft', 'outline'] as const

const meta = {
  title: 'Composites/StatusBadge',
  component: StatusBadge,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'İlan durumunu tutarlı gösterir. Sekiz `ListingStatus` değerinin her birinin kendi ' +
          'rengi ve etiketi vardır. Etiket `domain/labels.ts`’ten gelir — aynı durum listede, ' +
          'kuyrukta ve detayda görünür; üç yerde ayrı yazılsa biri değişince diğerleri eski kalır. ' +
          'Renk tek başına gösterge değildir, rozet her zaman metin taşır.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'status-indicator',
      useWhen: ['İlanın yayın durumu gösterilirken'],
      doNotUseWhen: [
        'Genel amaçlı etiket için — Badge kullanın',
        'Filtre çipi için — Tag kullanın',
      ],
    },
  },

  args: {
    status: ListingStatus.Published,
    variant: 'soft',
    size: 'md',
    showDot: false,
  },

  argTypes: {
    status: { control: 'select', options: TUM_DURUMLAR },
    variant: { control: 'inline-radio', options: VARYANTLAR },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    showDot: { control: 'boolean' },
  },
} satisfies Meta<typeof StatusBadge>

export default meta

type Story = StoryObj<typeof meta>

export const Published: Story = {}

export const PendingReview: Story = {
  args: { status: ListingStatus.PendingReview },
}

export const Rejected: Story = {
  args: { status: ListingStatus.Rejected },
}

export const Draft: Story = {
  args: { status: ListingStatus.Draft },
}

export const WithDot: Story = {
  args: { showDot: true },
}

export const Small: Story = {
  args: { size: 'sm' },
}

/**
 * Sekiz durumun hepsi — brifingin "tüm ListingStatus değerleri ayrı görsel
 * durumla temsil edilmelidir" kriterinin görsel kanıtı.
 */
export const AllStatuses: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxWidth: '40rem' }}>
      {TUM_DURUMLAR.map((status) => (
        <StatusBadge key={status} {...args} status={status} />
      ))}
    </div>
  ),
}

/** Gerçek fixture'lardan: her ilanın kendi durumu. */
export const FromFixtures: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.5rem', maxWidth: '34rem' }}>
      {allListingFixtures.map((listing) => (
        <div
          key={listing.id}
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
            {listing.title.slice(0, 38)}
          </span>
          <StatusBadge {...args} status={listing.status} showDot />
        </div>
      ))}
    </div>
  ),
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxWidth: '42rem' }}>
            {TUM_DURUMLAR.map((status) => (
              <StatusBadge key={status} {...args} status={status} variant={variant} showDot />
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
}

/**
 * Brifingin "tüm ListingStatus değerleri ayrı görsel durumla temsil
 * edilmelidir" kriteri, rozetin en yoğun kullanılan varyantında **ölçülerek**.
 *
 * `AllStatuses` bu kriterin görsel kanıtıydı ama hiçbir şey saymıyordu ve
 * kriter solid'de sessizce çiğneniyordu: `paused` ile `archived` zeminlerini
 * `status.*.border`'dan okuyordu, ikisi de neutral-600'e düşüyordu ve sekiz
 * durum yedi zemin üretiyordu. Sözleşmeye ayrı bir `solid` slotu eklenince
 * kademe (draft 500 → paused 600 → arşiv 700) geri geldi.
 *
 * Token'ı değil **hesaplanmış zemini** ölçüyor: token'ı okumak sözleşmenin
 * kendisiyle aynı şeyi iki kez söylemek olurdu, oysa kırılan şey token'ın
 * component'te nasıl bağlandığıydı.
 */
export const SolidGivesEightDistinctBackgrounds: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxWidth: '42rem' }}>
      {TUM_DURUMLAR.map((status) => (
        <StatusBadge key={status} {...args} status={status} variant="solid" />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rozetler = within(canvasElement).getAllByText(/.+/, {
      selector: '[data-variant="solid"]',
    })
    expect(rozetler).toHaveLength(TUM_DURUMLAR.length)

    const zeminler = rozetler.map((r) => getComputedStyle(r).backgroundColor)
    expect(new Set(zeminler).size).toBe(TUM_DURUMLAR.length)
  },
}
