import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertTriangle, Flag, Star } from 'lucide-react'
import { Badge } from './Badge'

const TONES = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const
const VARIANTS = ['solid', 'soft', 'outline'] as const

const meta = {
  title: 'Primitives/Badge',
  component: Badge,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'Kısa durum veya sayı etiketi. İlan durumu için `StatusBadge` kullanın — o, ' +
          '`ListingStatus` değerini doğru renge kendisi eşler. Rozet her zaman metin taşır; ' +
          'renk tek başına gösterge değildir.',
      },
    },

    ai: {
      project: 'admin-panel',
      role: 'status-indicator',
      useWhen: ['Sayı veya kısa etiket gösterilirken', 'Genel amaçlı durum işaretlenirken'],
      doNotUseWhen: ['İlan durumu gösterilirken — StatusBadge kullanın'],
    },
  },

  args: {
    children: 'Yeni',
    tone: 'neutral',
    variant: 'soft',
    size: 'md',
  },

  argTypes: {
    tone: { control: 'select', options: TONES },
    variant: { control: 'inline-radio', options: VARIANTS },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    leadingIcon: { control: false },
  },
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Solid: Story = {
  args: { variant: 'solid', tone: 'primary', children: 'Öne çıkan' },
}

export const Soft: Story = {
  args: { variant: 'soft', tone: 'success', children: 'Doğrulanmış' },
}

export const Outline: Story = {
  args: { variant: 'outline', tone: 'warning', children: 'İnceleniyor' },
}

export const Small: Story = {
  args: { size: 'sm', children: '3' },
}

export const WithIcon: Story = {
  args: { tone: 'danger', leadingIcon: <Flag size={14} />, children: '3 şikayet' },
}

/** Uzun etiketlerde rozet sarmaz, tek satır kalır. */
export const LongLabel: Story = {
  args: { tone: 'info', children: 'Yetki belgesi doğrulaması bekleniyor' },
}

/** Bütün ton × varyant kombinasyonları — kontrast ve okunabilirlik burada denetlenir. */
export const VariantsComparison: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {VARIANTS.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone} variant={variant}>
                {tone}
              </Badge>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Badge tone="success" leadingIcon={<Star size={14} />}>
          Vitrin
        </Badge>
        <Badge tone="warning" leadingIcon={<AlertTriangle size={14} />}>
          Düşük kalite
        </Badge>
        <Badge tone="danger" variant="solid" leadingIcon={<Flag size={14} />}>
          Kritik
        </Badge>
        <Badge tone="neutral" size="sm">
          12
        </Badge>
      </div>
    </div>
  ),
}
