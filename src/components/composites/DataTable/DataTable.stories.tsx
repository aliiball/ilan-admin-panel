import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { ColumnDef } from '../../../types/component-props'
import type { Listing } from '../../../types/domain'
import { LISTING_CATEGORY_LABEL, TRANSACTION_TYPE_LABEL } from '../../../domain/labels'
import { formatCurrency } from '../../../utils/formatCurrency'
import { allListingFixtures } from '../../../fixtures'
import { ListingCard } from '../ListingCard'
import { StatusBadge } from '../StatusBadge'
import { DataTable } from './DataTable'

/**
 * Generic'in gerçek kanıtı: `cell` içinde `row` tipi `Listing`'dir, `unknown` değil.
 * `row.location.cityName` yazarken otomatik tamamlama gelir ve yanlış alan
 * derleme hatası verir.
 */
const SUTUNLAR: ColumnDef<Listing>[] = [
  { id: 'listingNo', header: 'İlan no', accessor: 'listingNo', sortable: true, width: '9rem' },
  {
    id: 'title',
    header: 'Başlık',
    cell: (row) => (
      <span
        style={{
          display: 'block',
          maxWidth: '22rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {row.title}
      </span>
    ),
    sortable: true,
  },
  {
    id: 'category',
    header: 'Kategori',
    cell: (row) =>
      `${LISTING_CATEGORY_LABEL[row.category]} · ${TRANSACTION_TYPE_LABEL[row.transactionType]}`,
  },
  {
    id: 'location',
    header: 'Konum',
    cell: (row) => `${row.location.districtName}, ${row.location.cityName}`,
  },
  {
    id: 'price',
    header: 'Fiyat',
    cell: (row) => formatCurrency(row.price),
    sortable: true,
    align: 'end',
  },
  {
    id: 'status',
    header: 'Durum',
    cell: (row) => <StatusBadge status={row.status} size="sm" showDot />,
  },
  {
    id: 'reports',
    header: 'Şikayet',
    accessor: 'id',
    cell: (row) => row.metrics.reportCount,
    align: 'center',
    sortable: true,
  },
]

const meta = {
  title: 'Composites/DataTable',
  component: DataTable,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Sıralama, seçim ve yoğun veri gösterimi. Generic’tir ve satır tipini korur — `cell` ' +
          'içinde `row` tipi `Listing`’dir, `unknown` değil. `mobileMode="scroll"` sütunlar ' +
          'önemliyse (audit log), `"cards"` okunabilirlik önemliyse (ilan listesi). Sıralanabilir ' +
          'başlıklar `<button>`’dır — `<th onClick>` klavyeyle erişilemez.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'data-display',
      useWhen: ['İlan, kullanıcı, rapor veya audit listesi gösterilirken'],
      doNotUseWhen: ['Tek bir kaydın alanları gösterilecekse — ListingFacts kullanın'],
    },
  },

  args: {
    rows: allListingFixtures,
    columns: SUTUNLAR,
    density: 'comfortable',
    visualStyle: 'plain',
    mobileMode: 'scroll',
    loading: false,
    selectable: false,
    stickyHeader: false,
  },

  argTypes: {
    density: { control: 'inline-radio', options: ['comfortable', 'compact'] },
    visualStyle: { control: 'inline-radio', options: ['plain', 'bordered', 'striped'] },
    mobileMode: { control: 'inline-radio', options: ['scroll', 'cards'] },
    loading: { control: 'boolean' },
    selectable: { control: 'boolean' },
    stickyHeader: { control: 'boolean' },
    rows: { control: false },
    columns: { control: false },
  },
} satisfies Meta<typeof DataTable<Listing>>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Bordered: Story = {
  args: { visualStyle: 'bordered' },
}

export const Striped: Story = {
  args: { visualStyle: 'striped' },
}

export const Compact: Story = {
  args: { density: 'compact', visualStyle: 'bordered' },
}

/** Başlık korunur, satırlar skeleton olur: veri gelince düzen zıplamaz. */
export const Loading: Story = {
  args: { loading: true, visualStyle: 'bordered' },
}

export const Empty: Story = {
  args: { rows: [], visualStyle: 'bordered' },
}

export const FilteredEmpty: Story = {
  args: {
    rows: [],
    visualStyle: 'bordered',
    emptyState: (
      <>
        <strong>Filtrelere uyan ilan yok</strong>
        <span style={{ color: 'var(--color-text-muted)' }}>
          Filtreleri temizleyip tekrar deneyin.
        </span>
      </>
    ),
  },
}

export const Error: Story = {
  args: {
    visualStyle: 'bordered',
    error: {
      title: 'İlanlar yüklenemedi',
      message: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
      code: 'NETWORK_TIMEOUT',
      retryable: true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      `retryable: true` ama `onRetry` yok: buton çıkmamalı. İki kapı birden
      açılmalı — bkz. `ErrorCanBeRetried`.
    */
    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).not.toBeInTheDocument()
    await expect(canvas.getByRole('alert')).toHaveTextContent('İlanlar yüklenemedi')
  },
}

/**
 * `onRetry` bağlıyken hata bloğu tekrar deneme butonu gösterir.
 *
 * Tablo sorguyu kendi atmaz; `ChartCardProps.onRetry` ile aynı sözleşme —
 * ikisi tek kararın iki yüzü olduğu için birlikte eklendi.
 */
export const ErrorCanBeRetried: Story = {
  args: {
    visualStyle: 'bordered',
    error: {
      title: 'İlanlar yüklenemedi',
      message: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
      code: 'NETWORK_TIMEOUT',
      retryable: true,
    },
    onRetry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Tekrar dene' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * Seçim kutularının etiketi gizlidir ama ekran okuyucuya gider.
 *
 * `rowLabel` satırı tanımlar, "Satırı seç" demez: 12 kez aynı metni duyan
 * kullanıcı hangisini seçtiğini anlamaz. `render` kullanılıyor çünkü Storybook'un
 * `Meta` tipi generic'i `T`'nin sınırlamasına düşürüyor (bkz. MobileCards).
 */
export const Selectable: Story = {
  args: { selectable: true, selectedIds: ['listing-land-corlu-field'], onSelectionChange: fn() },
  render: (args) => (
    <DataTable<Listing>
      {...args}
      rows={allListingFixtures}
      columns={SUTUNLAR}
      rowLabel={(row) => `${row.title} ilanını seç`}
    />
  ),
}

export const Sorted: Story = {
  args: { sort: { columnId: 'price', direction: 'desc' }, onSortChange: fn() },
}

export const StickyHeader: Story = {
  args: { stickyHeader: true, visualStyle: 'bordered' },
  decorators: [
    (Story) => (
      <div style={{ height: '20rem', overflowY: 'auto' }}>
        <Story />
      </div>
    ),
  ],
}

export const ClickableRows: Story = {
  args: { onRowClick: fn() },
}

/** Dar ekranda tablo yatay kaydırılır, kesilmez. */
export const MobileScroll: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { visualStyle: 'bordered' },
}

/**
 * Dar ekranda her satır karta dönüşür; okunabilirlik önemliyse bu tercih edilir.
 *
 * `renderMobileCard` args yerine `render` içinde veriliyor: Storybook'un `Meta`
 * tipi generic'i `T`'nin sınırlamasına (`{ id: string }`) düşürüyor, `Listing`'e
 * daraltmıyor. Component'te sorun yok — orada `DataTable<Listing>` tipi korur.
 */
export const MobileCards: Story = {
  globals: { viewport: { value: 'mobile320' } },
  render: (args) => (
    <DataTable<Listing>
      {...args}
      rows={allListingFixtures}
      columns={SUTUNLAR}
      mobileMode="cards"
      renderMobileCard={(row) => <ListingCard listing={row} variant="grid" />}
    />
  ),
}

export const Interactive: Story = {
  render: function Render(args) {
    const [secili, setSecili] = useState<string[]>([])
    const [sort, setSort] = useState<{ columnId: string; direction: 'asc' | 'desc' } | undefined>()

    const sirali = [...allListingFixtures].sort((a, b) => {
      if (sort === undefined) return 0
      const yon = sort.direction === 'asc' ? 1 : -1
      if (sort.columnId === 'price') return (a.price.amount - b.price.amount) * yon
      if (sort.columnId === 'reports') return (a.metrics.reportCount - b.metrics.reportCount) * yon
      if (sort.columnId === 'title') return a.title.localeCompare(b.title, 'tr') * yon
      return a.listingNo.localeCompare(b.listingNo) * yon
    })

    return (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
          {secili.length} ilan seçili
          {sort !== undefined ? ` · ${sort.columnId} ${sort.direction}` : ''}
        </span>
        <DataTable<Listing>
          {...args}
          rows={sirali}
          selectable
          selectedIds={secili}
          onSelectionChange={setSecili}
          {...(sort !== undefined && { sort })}
          onSortChange={setSort}
          visualStyle="bordered"
        />
      </div>
    )
  },
}

/** "Tümünü seç" kısmi seçimde `mixed` duyurmalı, tıklayınca hepsini seçmeli. */
export const SelectAllAnnouncesMixed: Story = {
  args: { selectable: true, selectedIds: ['listing-land-corlu-field'], onSelectionChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const tumunuSec = canvas.getByRole('checkbox', { name: /Tümünü seç/ })

    await expect(tumunuSec).toHaveAttribute('aria-checked', 'mixed')

    await userEvent.click(tumunuSec)
    await expect(args.onSelectionChange).toHaveBeenCalledWith(allListingFixtures.map((l) => l.id))
  },
}

/** Sıralama başlığı buton olmalı ve tıklayınca yönü değiştirmeli. */
export const SortToggles: Story = {
  args: { sort: { columnId: 'price', direction: 'asc' }, onSortChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const fiyat = canvas.getByRole('button', { name: /Fiyat/ })

    await userEvent.click(fiyat)
    await expect(args.onSortChange).toHaveBeenCalledWith({ columnId: 'price', direction: 'desc' })
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <DataTable<Listing> {...args} rows={allListingFixtures.slice(0, 3)} visualStyle="plain" />
      <DataTable<Listing> {...args} rows={allListingFixtures.slice(0, 3)} visualStyle="bordered" />
      <DataTable<Listing> {...args} rows={allListingFixtures.slice(0, 3)} visualStyle="striped" />
      <DataTable<Listing>
        {...args}
        rows={allListingFixtures.slice(0, 3)}
        visualStyle="bordered"
        density="compact"
      />
    </div>
  ),
}
