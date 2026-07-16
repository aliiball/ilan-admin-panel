import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Archive, Check, Pause, Trash2, X } from 'lucide-react'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { BulkActionDefinition } from '../../../types/component-props'
import { Checkbox } from '../../primitives/Checkbox'
import { allListingFixtures } from '../../../fixtures'
import { BulkActionBar } from './BulkActionBar'

const EYLEMLER: BulkActionDefinition[] = [
  { id: 'approve', label: 'Onayla', icon: <Check size={16} /> },
  { id: 'reject', label: 'Reddet', tone: 'danger', icon: <X size={16} /> },
  { id: 'pause', label: 'Duraklat', icon: <Pause size={16} /> },
  { id: 'archive', label: 'Arşivle', icon: <Archive size={16} /> },
]

const VARYANTLAR = ['floating', 'sticky', 'inline'] as const

const meta = {
  title: 'Composites/BulkActionBar',
  component: BulkActionBar,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`selectedCount === 0` iken hiç render edilmez — seçim yokken çubuk boş yer kaplar. ' +
          'Bir eylem sürerken **diğerleri kapanır**: aynı seçim üzerinde iki toplu işlemin ' +
          'yarışması tahmin edilemez sonuç üretir. Sayaç `role="status"` içindedir, seçim ' +
          'değiştikçe duyurulur. Yetkisiz eylem `disabled` verilmez — `actions` listesine hiç ' +
          'konmaz; `disabled` yalnız eylemin o seçim için geçersiz olduğu durum içindir.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'action-bar',
      useWhen: ['Tabloda veya listede birden fazla kayıt seçilebiliyorsa'],
      doNotUseWhen: [
        'Tek kaydın eylemleri için — satır içi IconButton veya ModerationActionBar kullanın',
        'Moderasyon kararı için — ModerationActionBar kullanın',
      ],
    },
  },

  args: {
    selectedCount: 12,
    actions: EYLEMLER,
    variant: 'inline',
    onAction: fn(),
    onClearSelection: fn(),
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    selectedCount: { control: { type: 'number', min: 0 } },
    actions: { control: false },
  },
} satisfies Meta<typeof BulkActionBar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Selected: Story = {
  args: { selectedCount: 3 },
}

export const SingleSelected: Story = {
  args: { selectedCount: 1 },
}

/** Onay uçarken diğer eylemler kapanır: yarışan iki toplu işlem veri kaybettirir. */
export const ActionLoading: Story = {
  args: { loadingActionId: 'approve' },
}

/** Arşivlenmiş kayıt duraklatılamaz — eylem geçersiz, ama yetki meselesi değil. */
export const DisabledAction: Story = {
  args: {
    actions: EYLEMLER.map((eylem) => (eylem.id === 'pause' ? { ...eylem, disabled: true } : eylem)),
  },
}

/** Ekranın altında yüzer; uzun listede kaydırırken hep erişilir. */
export const Floating: Story = {
  args: { variant: 'floating' },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '24rem', padding: '1rem' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Çubuk sayfanın altında yüzer; içerik altına kaymaz.
        </p>
        <Story />
      </div>
    ),
  ],
}

/** Kabın alt kenarına yapışır: kaydırılabilir bir liste kabında kullanılır. */
export const Sticky: Story = {
  args: { variant: 'sticky' },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div
        style={{
          height: '20rem',
          overflowY: 'auto',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div style={{ display: 'grid', gap: '0.5rem', padding: '1rem' }}>
          {allListingFixtures.map((listing) => (
            <span key={listing.id} style={{ fontSize: '1rem' }}>
              {listing.title.slice(0, 44)}
            </span>
          ))}
        </div>
        <Story />
      </div>
    ),
  ],
}

export const Inline: Story = {
  args: { variant: 'inline' },
}

/** Tek eylem: çubuk gereksiz genişlemez. */
export const SingleAction: Story = {
  args: {
    actions: [{ id: 'delete', label: 'Sil', tone: 'danger', icon: <Trash2 size={16} /> }],
  },
}

/** Uzun etiketler ve çok eylem: satır sarmalı, taşmamalı. */
export const LongContent: Story = {
  args: {
    selectedCount: 1284,
    actions: [
      { id: 'approve', label: 'Seçili ilanları onayla ve yayına al', icon: <Check size={16} /> },
      {
        id: 'reject',
        label: 'Gerekçe seçerek toplu reddet',
        tone: 'danger',
        icon: <X size={16} />,
      },
      { id: 'archive', label: 'Arşive taşı ve listeden kaldır', icon: <Archive size={16} /> },
    ],
  },
}

/** Dar ekranda eylemler alt alta sarar; çubuk 320 pikselde taşmamalı. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
}

export const MobileFloating: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'floating' },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '20rem' }}>
        <Story />
      </div>
    ),
  ],
}

/** Seçim yokken çubuk hiç render edilmemeli. */
export const NoSelectionRendersNothing: Story = {
  args: { selectedCount: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: 'Seçimi temizle' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
  },
}

/** Eylem kimliğiyle bildirilmeli, temizleme ayrı çıkışa gitmeli. */
export const ActionReportsId: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Reddet' }))
    await expect(args.onAction).toHaveBeenCalledWith('reject')

    await userEvent.click(canvas.getByRole('button', { name: 'Seçimi temizle' }))
    await expect(args.onClearSelection).toHaveBeenCalled()
  },
}

/**
 * Bir eylem sürerken diğerleri gerçekten kapanmalı.
 *
 * DOM'dan ölçülüyor: "diğerleri kapansın" niyeti kodda doğru görünüp render'da
 * yanlış çıkabilir — bu repoda testlerin geçip stilin bozuk kaldığı görüldü.
 */
export const LoadingActionLocksOthers: Story = {
  args: { loadingActionId: 'approve' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Onayla' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'Reddet' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Arşivle' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Seçimi temizle' })).toBeDisabled()
  },
}

/** Seçim sayısı `role="status"` ile duyurulmalı. */
export const CountIsInStatusRegion: Story = {
  args: { selectedCount: 7 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('7 kayıt seçildi')
  },
}

/** Gerçek seçimle: kutular işaretlendikçe çubuk belirir ve sayaç güncellenir. */
export const Interactive: Story = {
  render: function Render(args) {
    const [secili, setSecili] = useState<string[]>([])
    const ilanlar = allListingFixtures.slice(0, 5)

    return (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {ilanlar.map((listing) => (
          <Checkbox
            key={listing.id}
            label={listing.title.slice(0, 44)}
            checked={secili.includes(listing.id)}
            onCheckedChange={(next) =>
              setSecili((onceki) =>
                next ? [...onceki, listing.id] : onceki.filter((id) => id !== listing.id),
              )
            }
          />
        ))}

        <BulkActionBar
          {...args}
          variant="inline"
          selectedCount={secili.length}
          onClearSelection={() => setSecili([])}
        />
      </div>
    )
  },
}

export const VariantsComparison: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem', padding: '1rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          {/*
            `floating` sabit konumludur; karşılaştırmada viewport'un altına kaçmasın
            diye kendi kabına hapsediliyor. Bunu yapan `transform` — `position:
            relative` sabit konumlu çocuğu tutmaz, yalnız transform/filter/perspective
            taşıyan ata yeni bir kapsayıcı blok kurar.
          */}
          <div
            style={{
              minHeight: variant === 'floating' ? '6rem' : 'auto',
              ...(variant === 'floating' && { transform: 'translate(0)' }),
            }}
          >
            <BulkActionBar {...args} variant={variant} />
          </div>
        </div>
      ))}
    </div>
  ),
}
