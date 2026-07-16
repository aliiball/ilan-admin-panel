import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { MoreVertical } from 'lucide-react'
import { IconButton } from '../../primitives/IconButton'
import {
  allListingFixtures,
  landRejectedField,
  residentialPendingVilla,
  residentialPublishedApartment,
  tourismRejectedPension,
} from '../../../fixtures'
import { ListingCard } from './ListingCard'

const meta = {
  title: 'Composites/ListingCard',
  component: ListingCard,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'İlan özeti; veri çekmez, `listing` prop’undan gelir. Üç varyant farklı yoğunluk ' +
          'içindir: `compact` kuyrukta, `detailed` listede, `grid` dashboard’da. Uzun başlık iki ' +
          'satırda kesilir, böylece listedeki kart yükseklikleri sabit kalır. Tıklanabilir bölge ' +
          '`<button>`’dır ama kartın tamamını sarmaz — seçim kutusu onun kardeşidir, aksi hâlde ' +
          'iç içe etkileşimli element olurdu.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'listing-summary',
      useWhen: ['İlan listesinde', 'Moderasyon kuyruğunda', 'Dashboard’da son ilanlar'],
      doNotUseWhen: ['İlanın tüm alanları gösterilecekse — ListingFacts kullanın'],
    },
  },

  args: {
    listing: residentialPublishedApartment,
    variant: 'compact',
    selected: false,
    flagged: false,
    showModerationMeta: false,
  },

  argTypes: {
    variant: { control: 'inline-radio', options: ['compact', 'detailed', 'grid'] },
    selected: { control: 'boolean' },
    flagged: { control: 'boolean' },
    showModerationMeta: { control: 'boolean' },
    listing: { control: false },
    actions: { control: false },
  },

  decorators: [
    (Story) => (
      <div style={{ maxWidth: '44rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ListingCard>

export default meta

type Story = StoryObj<typeof meta>

export const Compact: Story = {}

export const Detailed: Story = {
  args: { variant: 'detailed', showModerationMeta: true },
}

export const Grid: Story = {
  args: { variant: 'grid' },
  decorators: [
    (Story) => (
      <div style={{ width: '20rem' }}>
        <Story />
      </div>
    ),
  ],
}

export const Selected: Story = {
  args: { selected: true, onSelectedChange: fn() },
}

/** Riskli ilan sol kenardan kırmızı şeritle işaretlenir. */
export const Flagged: Story = {
  args: { listing: tourismRejectedPension, flagged: true, showModerationMeta: true },
}

/** Şikayeti olan ilan rozetle uyarır. */
export const WithReports: Story = {
  args: { listing: tourismRejectedPension, variant: 'detailed' },
}

/** Fotoğrafsız ilan: kırık resim yerine açık bir "görsel yok" durumu. */
export const NoPhoto: Story = {
  args: {
    listing: { ...residentialPublishedApartment, photos: [] },
    variant: 'detailed',
  },
}

export const LongTitle: Story = {
  args: {
    listing: {
      ...residentialPublishedApartment,
      title:
        'Kadıköy Caferağa Mahallesi’nde metroya ve sahile yürüme mesafesinde, asansörlü ve kapalı otoparklı binada tamamen yenilenmiş çift cepheli ferah 3+1 daire',
    },
    variant: 'detailed',
  },
}

/** Fiyat girilmemiş ilan: moderatör bunu yayına almadan görmeli. */
export const MissingPrice: Story = {
  args: {
    listing: {
      ...residentialPendingVilla,
      price: { ...residentialPendingVilla.price, amount: 0 },
    },
    variant: 'detailed',
  },
}

export const WithPromotions: Story = {
  args: { listing: residentialPublishedApartment, variant: 'detailed' },
}

export const WithActions: Story = {
  args: {
    variant: 'detailed',
    actions: <IconButton icon={<MoreVertical size={16} />} label="Diğer işlemler" size="sm" />,
  },
}

export const Rejected: Story = {
  args: { listing: landRejectedField, variant: 'detailed', showModerationMeta: true },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'grid' },
}

/** Gerçek liste: 12 fixture, farklı kategori ve durumlar. */
export const RealListing: Story = {
  render: function Render(args) {
    const [secili, setSecili] = useState<string[]>([])
    return (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {allListingFixtures.map((listing) => (
          <ListingCard
            {...args}
            key={listing.id}
            listing={listing}
            variant="detailed"
            showModerationMeta
            flagged={listing.metrics.reportCount > 0}
            selected={secili.includes(listing.id)}
            onSelectedChange={(next) =>
              setSecili((s) => (next ? [...s, listing.id] : s.filter((x) => x !== listing.id)))
            }
          />
        ))}
      </div>
    )
  },
}

/** Seçim kutusu butonun içinde değil kardeşi — klavyeyle ikisine de erişilmeli. */
export const CheckboxIsNotNestedInButton: Story = {
  args: { onSelectedChange: fn(), onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const checkbox = canvas.getByRole('checkbox')
    await expect(checkbox.closest('button[type="button"]')).toBeNull()

    await userEvent.click(checkbox)
    await expect(args.onSelectedChange).toHaveBeenCalledWith(true)
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <ListingCard {...args} variant="compact" />
      <ListingCard {...args} variant="detailed" showModerationMeta />
      <div style={{ width: '20rem' }}>
        <ListingCard {...args} variant="grid" />
      </div>
    </div>
  ),
}
