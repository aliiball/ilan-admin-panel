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

/**
 * Odak halkası kırpılmamalı.
 *
 * Kartın `overflow: hidden`'ı kenardan kenara görselin yuvarlak köşeleri için
 * ŞART, ama global `:focus-visible` kuralının DIŞA taşan halkasını (offset
 * `+0.125rem`) yutuyordu — klavye kullanıcısı odağı göremezdi. Çözüm halkayı
 * İÇERİ almak: buton kendi `:focus-visible`'ında negatif offset veriyor, halka
 * butonun kutusunun tamamında ve kırpma sınırının içinde kalıyor. Testler
 * geçerken stilin bozuk kaldığı bu repoda görüldü — hesaplanan stil ölçülüyor.
 */
export const FocusRingIsNotClipped: Story = {
  args: { onClick: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const kart = canvas.getByRole('article')
    /* Görselin köşe kırpması için kart hâlâ kırpıyor. */
    await expect(getComputedStyle(kart).overflow).toBe('hidden')

    const kartButonu = canvas.getByRole('button')
    await userEvent.tab()
    await expect(kartButonu).toHaveFocus()

    const stil = getComputedStyle(kartButonu)
    /* Halka çiziliyor... */
    await expect(stil.outlineStyle).toBe('solid')
    /* ...ve İÇERİ doğru (negatif offset), yani kırpan ata onu yutamaz. */
    await expect(Number.parseFloat(stil.outlineOffset)).toBeLessThan(0)
  },
}

/**
 * Etkileşimli `actions` tıklanabilir bölgenin İÇİNDE değil, kardeşi olmalı.
 *
 * Aksi hâlde buton içinde buton olur: geçersiz HTML + axe `nested-interactive`,
 * ve içteki buton klavyeyle ulaşılamaz kalır. Eyleme tıklamak kartın
 * `onClick`'ini de tetiklememeli.
 */
export const ActionsAreNotNestedInButton: Story = {
  args: {
    variant: 'detailed',
    onClick: fn(),
    actions: <IconButton icon={<MoreVertical size={16} />} label="Diğer işlemler" size="sm" />,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    /* Başlıkta "3+1" var; `+` regex niceleyicisi olduğu için ham başlık RegExp'e verilemez. */
    const kartButonu = canvas.getByRole('button', { name: /Caferağa'da Asansörlü Binada Ferah/ })
    const eylem = canvas.getByRole('button', { name: 'Diğer işlemler' })

    await expect(kartButonu).not.toContainElement(eylem)

    await userEvent.click(eylem)
    await expect(args.onClick).not.toHaveBeenCalled()

    await userEvent.click(kartButonu)
    await expect(args.onClick).toHaveBeenCalledWith(residentialPublishedApartment)
  },
}

/**
 * `detailed` 320 pikselde içeriği kırpmamalı, sarmalı.
 *
 * Media 11rem sabit; body'ye kalan pikseller azken boşluksuz değerler (fiyat,
 * uzun başlık) `min-content`'e çivilenip kartın `overflow: hidden`'ıyla
 * kırpılıyordu — köke taşma olarak yansımadığı için hiçbir test görmüyordu.
 * `overflow-wrap: anywhere` içeriği sardırıyor: `scrollWidth <= clientWidth`.
 */
export const DetailedDoesNotClipAt320: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'detailed', showModerationMeta: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const kart = canvas.getByRole('article')
    /*
      Kırpılan içerik `overflow: hidden` altında bile scrollWidth'e yansır. 320px
      viewport'ta media 7rem'e iniyor (media sorgusu KAB'a değil viewport'a bakar;
      bu yüzden story 20rem'lik bir kapla değil `mobile320` ile ölçülüyor) ve
      durum rozeti body'ye sığıyor.
    */
    await expect(kart.scrollWidth).toBeLessThanOrEqual(kart.clientWidth + 1)
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
