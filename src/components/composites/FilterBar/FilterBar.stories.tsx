import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { FilterDefinition, FilterValue, SelectOption } from '../../../types/component-props'
import { ListingCategory, ListingStatus } from '../../../types/domain'
import { LISTING_CATEGORY_LABEL, LISTING_STATUS_LABEL } from '../../../domain/labels'
import { allListingFixtures } from '../../../fixtures'
import { FilterBar } from './FilterBar'
import { cokluKopyaLandmarkMuafiyeti } from '../../../storybook/a11y'

const secenekler = <T extends string>(degerler: T[], etiket: Record<T, string>): SelectOption[] =>
  degerler.map((deger) => ({ value: deger, label: etiket[deger] }))

/** İl listesi fixture'lardan türetiliyor: uydurma şehir yerine gerçek veri. */
const ILLER: SelectOption[] = [
  ...new Map(
    allListingFixtures.map((listing) => [listing.location.cityCode, listing.location.cityName]),
  ),
]
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'tr'))

const FILTRELER: FilterDefinition[] = [
  { id: 'query', label: 'Arama', type: 'text', placeholder: 'İlan no veya başlık' },
  {
    id: 'categories',
    label: 'Kategori',
    type: 'multiSelect',
    options: secenekler(Object.values(ListingCategory), LISTING_CATEGORY_LABEL),
    placeholder: 'Tümü',
  },
  {
    id: 'statuses',
    label: 'Durum',
    type: 'multiSelect',
    options: secenekler(Object.values(ListingStatus), LISTING_STATUS_LABEL),
    placeholder: 'Tümü',
  },
  { id: 'cityCode', label: 'İl', type: 'select', options: ILLER, placeholder: 'İl seçin' },
  { id: 'price', label: 'Fiyat (₺)', type: 'numberRange' },
  { id: 'dateRange', label: 'İlan tarihi', type: 'dateRange' },
  { id: 'reportedOnly', label: 'Yalnız şikayet edilenler', type: 'boolean' },
]

const AKTIF_DEGERLER: Record<string, FilterValue> = {
  query: 'Kadıköy',
  categories: [ListingCategory.Residential, ListingCategory.Commercial],
  statuses: [ListingStatus.PendingReview],
  cityCode: '34',
  price: { min: 2_000_000 },
  dateRange: { from: '2026-01-01', to: '2026-06-30' },
  reportedOnly: true,
}

const VARYANTLAR = ['inline', 'stacked', 'drawer'] as const

const meta = {
  title: 'Composites/FilterBar',
  component: FilterBar,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Liste ekranlarının filtre çubuğu. Kontrollüdür ve kendi değer kopyasını tutmaz. ' +
          'Veri çekmez **ve geciktirmez**: metin alanı her tuşta `onChange` çağırır, isteğin ne ' +
          'zaman atılacağına sayfa katmanı karar verir — fetch onun işidir. `values[id]` beklenen ' +
          'şekli taşımıyorsa (bayat kaydedilmiş görünüm, elle yazılmış URL parametresi) alan boş ' +
          'kabul edilir ve çubuk çökmez. Seçeneği 8’den fazla olan `select` kendiliğinden ' +
          'aranabilir açılır: 900 ilçe kaydırılarak taranamaz.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'filter',
      useWhen: ['İlan, kullanıcı, rapor veya audit listesi filtrelenirken'],
      doNotUseWhen: [
        'Tek bir arama kutusu yetiyorsa — SearchInput kullanın',
        'Seçili kayıtlara eylem uygulanacaksa — BulkActionBar kullanın',
      ],
    },
  },

  args: {
    definitions: FILTRELER,
    values: {},
    variant: 'inline',
    loading: false,
    disabled: false,
    onChange: fn(),
    onClear: fn(),
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    savedViewName: { control: 'text' },
    activeFilterCount: { control: { type: 'number', min: 0 } },
    definitions: { control: false },
    values: { control: false },
  },
} satisfies Meta<typeof FilterBar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Hiçbir filtre uygulanmamış: rozet ve "Temizle" yok — temizlenecek bir şey yok. */
export const Empty: Story = {
  args: { values: {} },
}

/** Filtre uygulanmış: sayaç `definitions` üzerinden kendiliğinden hesaplanıyor. */
export const Active: Story = {
  args: { values: AKTIF_DEGERLER },
}

/** Seçenekler yüklenirken açılır listelerde spinner çıkar; metin alanı yazılabilir kalır. */
export const Loading: Story = {
  args: { values: AKTIF_DEGERLER, loading: true },
}

export const Disabled: Story = {
  args: { values: AKTIF_DEGERLER, disabled: true },
}

export const Inline: Story = {
  args: { variant: 'inline', values: AKTIF_DEGERLER },
}

/** Dar kolon veya yan panel: alanlar alt alta, tam genişlik. */
export const Stacked: Story = {
  args: { variant: 'stacked', values: AKTIF_DEGERLER },
}

/** Mobil: dışarıda yalnız sayaçlı tetikleyici durur, alanlar Drawer'da açılır. */
export const DrawerVariant: Story = {
  name: 'Drawer',
  args: { variant: 'drawer', values: AKTIF_DEGERLER },
}

/** Filtreler taslak sayılır: `onApply` verildiği için "Uygula" görünür. */
export const WithApply: Story = {
  args: { values: AKTIF_DEGERLER, onApply: fn() },
}

export const WithSavedView: Story = {
  args: { values: AKTIF_DEGERLER, savedViewName: 'Şikayetli ilanlar', onSaveView: fn() },
}

/** "Aktif"in tanımı ekrana göre değişebilir; üst katman kendi sayısını geçebilir. */
export const ExplicitActiveCount: Story = {
  args: { values: AKTIF_DEGERLER, activeFilterCount: 2 },
}

/** Az alan: kısa listeli `select` klasik açılır kalır, arama kutusu açılmaz. */
export const FewFilters: Story = {
  args: {
    definitions: [
      { id: 'query', label: 'Arama', type: 'text', placeholder: 'İlan no veya başlık' },
      {
        id: 'statuses',
        label: 'Durum',
        type: 'multiSelect',
        options: secenekler(Object.values(ListingStatus), LISTING_STATUS_LABEL),
      },
    ],
    values: { query: 'Kadıköy' },
  },
}

/** Uzun etiketler ve uzun kayıtlı görünüm adı: satır sarmalı, taşmamalı. */
export const LongContent: Story = {
  args: {
    definitions: FILTRELER.map((tanim) =>
      tanim.id === 'reportedOnly'
        ? { ...tanim, label: 'Yalnız son 30 günde şikayet almış ve henüz incelenmemiş ilanlar' }
        : tanim,
    ),
    values: AKTIF_DEGERLER,
    savedViewName: 'İstanbul • şikayetli • incelemede • son 30 gün • fiyat 2M üzeri',
    onSaveView: fn(),
  },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'stacked', values: AKTIF_DEGERLER },
}

/** Mobilde tercih edilen kullanım: tetikleyici yer kaplamaz. */
export const MobileDrawer: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'drawer', values: AKTIF_DEGERLER },
}

/**
 * Bayat değerler çökertmemeli.
 *
 * Kaydedilmiş eski bir görünüm veya elle yazılmış URL parametresi, tanımın
 * beklediğinden başka bir şekil taşıyabilir: sayı beklenen yerde metin, dizi
 * beklenen yerde tek değer. Alan boş kabul edilir, component ayakta kalır.
 */
export const MalformedValuesDoNotCrash: Story = {
  args: {
    values: {
      query: 42,
      categories: 'konut',
      statuses: null,
      cityCode: ['34'],
      price: { from: '2026-01-01' },
      dateRange: { min: 5 },
      reportedOnly: 'evet',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Çubuk ayakta ve hiçbir değer aktif sayılmadı: rozet yok, "Temizle" yok.
    await expect(canvas.getByRole('region', { name: 'Filtreler' })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /Temizle/ })).not.toBeInTheDocument()
  },
}

/** Metin alanı değişimi alan kimliğiyle bildirilmeli. */
export const TextChangeReportsId: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.type(canvas.getByLabelText('Arama'), 'K')
    await expect(args.onChange).toHaveBeenCalledWith('query', 'K')
  },
}

/** Aktif filtre varken "Temizle" görünür ve tek çağrıya çıkar. */
export const ClearAppearsOnlyWhenActive: Story = {
  args: { values: AKTIF_DEGERLER },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: /Temizle/ }))
    await expect(args.onClear).toHaveBeenCalled()
  },
}

/**
 * Sayısal aralığın bir ucunu değiştirmek diğerini silmemeli.
 *
 * `exactOptionalPropertyTypes` yüzünden aralık `{ ...aralik, max: next }` ile
 * güncellenemiyor; elle kopyalanan bu yolun uçları koruduğu ölçülüyor.
 */
export const NumberRangeKeepsOtherEnd: Story = {
  args: { values: { price: { min: 2_000_000 } } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.type(canvas.getByLabelText('En çok'), '5')
    await expect(args.onChange).toHaveBeenCalledWith('price', { min: 2_000_000, max: 5 })
  },
}

/** Sayaç `definitions` üzerinden hesaplanmalı; `false` anahtar aktif sayılmamalı. */
export const InactiveValuesAreNotCounted: Story = {
  args: {
    values: {
      query: '',
      categories: [],
      reportedOnly: false,
      dateRange: {},
      bayatAnahtar: 'artık tanımı yok',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByText(/aktif/)).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /Temizle/ })).not.toBeInTheDocument()
  },
}

/** Gerçek akış: değerler dışarıda tutulur, çubuk yalnız bildirir. */
export const Interactive: Story = {
  render: function Render(args) {
    const [degerler, setDegerler] = useState<Record<string, FilterValue>>({})

    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <FilterBar
          {...args}
          values={degerler}
          onChange={(id, value) => setDegerler((onceki) => ({ ...onceki, [id]: value }))}
          onClear={() => setDegerler({})}
          onSaveView={fn()}
        />
        <pre
          style={{
            fontSize: '0.875rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: 'var(--color-bg-subtle)',
            color: 'var(--color-text-muted)',
            overflowX: 'auto',
          }}
        >
          {JSON.stringify(degerler, null, 2)}
        </pre>
      </div>
    )
  },
}

export const VariantsComparison: Story = {
  /* Her varyant kendi `<section>`'ını açıyor; uygulamada sayfada bir tane olur. */
  parameters: cokluKopyaLandmarkMuafiyeti,
  args: { values: AKTIF_DEGERLER },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <FilterBar {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
