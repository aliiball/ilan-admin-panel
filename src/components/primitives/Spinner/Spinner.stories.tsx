import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spinner } from './Spinner'

const meta = {
  title: 'Primitives/Spinner',
  component: Spinner,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'Kısa süreli, yerel yükleme göstergesi. Sayfa veya bölüm yüklenirken `Skeleton` ' +
          'kullanın — spinner içeriğin ölçüsünü korumaz ve düzen zıplar. `label` zorunludur.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'loading-indicator',
      useWhen: ['Buton içi kısa işlem beklenirken', 'Küçük bir alan yenilenirken'],
      doNotUseWhen: ['Tablo veya sayfa yüklenirken — Skeleton kullanın'],
    },
  },

  args: {
    label: 'Yükleniyor',
    size: 'md',
  },

  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Spinner>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Small: Story = {
  args: { size: 'sm' },
}

export const Large: Story = {
  args: { size: 'lg', label: 'İlanlar yükleniyor' },
}

/** Spinner `currentColor` kullanır; kabının rengini devralır. */
export const InheritsColor: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      <span style={{ color: 'var(--color-primary-700)' }}>
        <Spinner {...args} />
      </span>
      <span style={{ color: 'var(--color-danger-700)' }}>
        <Spinner {...args} />
      </span>
      <span style={{ color: 'var(--color-text-muted)' }}>
        <Spinner {...args} />
      </span>
    </div>
  ),
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      <Spinner {...args} size="sm" label="Küçük" />
      <Spinner {...args} size="md" label="Orta" />
      <Spinner {...args} size="lg" label="Büyük" />
    </div>
  ),
}
