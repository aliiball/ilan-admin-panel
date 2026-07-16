import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Tag } from './Tag'

const meta = {
  title: 'Primitives/Tag',
  component: Tag,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'Seçilebilir veya kaldırılabilir kısa etiket. Aktif filtreler ve ilanın operasyon ' +
          'etiketleri için kullanılır. Salt okunur gösterge için `Badge`, ilan durumu için ' +
          '`StatusBadge` kullanın — Tag etkileşimli olduğunu ima eder.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'filter-chip',
      useWhen: ['Aktif filtre gösterilirken', 'Kaldırılabilir etiket listelenirken'],
      doNotUseWhen: ['İlan durumu gösterilirken — StatusBadge kullanın'],
    },
  },

  args: {
    children: 'Kadıköy',
    selected: false,
    removable: false,
    disabled: false,
    onRemove: fn(),
  },

  argTypes: {
    selected: { control: 'boolean' },
    removable: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Tag>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Selected: Story = {
  args: { selected: true },
}

export const Removable: Story = {
  args: { removable: true },
}

export const Disabled: Story = {
  args: { disabled: true, removable: true },
}

export const LongLabel: Story = {
  args: { removable: true, children: 'Konut / Daire / Satılık / 3+1' },
}

/** Gerçek kullanım: ilan listesindeki aktif filtreler. */
export const ActiveFilters: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxWidth: '30rem' }}>
      <Tag {...args} removable>
        Kadıköy
      </Tag>
      <Tag {...args} removable>
        Konut
      </Tag>
      <Tag {...args} removable>
        Satılık
      </Tag>
      <Tag {...args} removable>
        10.000.000 ₺ ve üzeri
      </Tag>
      <Tag {...args} removable selected>
        Yalnız raporlu
      </Tag>
    </div>
  ),
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Tag {...args}>Varsayılan</Tag>
      <Tag {...args} selected>
        Seçili
      </Tag>
      <Tag {...args} removable>
        Kaldırılabilir
      </Tag>
      <Tag {...args} selected removable>
        Seçili + kaldırılabilir
      </Tag>
      <Tag {...args} disabled>
        Devre dışı
      </Tag>
    </div>
  ),
}
