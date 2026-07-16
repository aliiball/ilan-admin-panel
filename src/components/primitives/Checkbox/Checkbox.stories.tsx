import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Checkbox } from './Checkbox'

const meta = {
  title: 'Primitives/Checkbox',
  component: Checkbox,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          '`indeterminate` tablo başlığındaki "tümünü seç" kutusu içindir: bazı satırlar ' +
          'seçiliyken ne işaretli ne boş görünmeli. `aria-checked="mixed"` olarak duyurulur.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-control',
      useWhen: ['Tablo satırı seçilirken', 'İzin matrisinde yetki işaretlenirken'],
      doNotUseWhen: ['Anlık açık/kapalı ayar için — Switch kullanın'],
    },
  },

  args: {
    label: 'İlanı seç',
    indeterminate: false,
    disabled: false,
    onCheckedChange: fn(),
  },

  argTypes: {
    indeterminate: { control: 'boolean' },
    disabled: { control: 'boolean' },
    checked: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>

export default meta

type Story = StoryObj<typeof meta>

export const Unchecked: Story = {}

export const Checked: Story = {
  args: { checked: true },
}

/** Tablo başlığındaki "tümünü seç": bazı satırlar seçili. */
export const Indeterminate: Story = {
  args: { indeterminate: true, label: 'Tümünü seç' },
}

export const WithDescription: Story = {
  args: {
    label: 'Toplu onaya dahil et',
    description: 'Seçili ilanlar tek işlemde onaylanır ve geri alınamaz.',
  },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const DisabledChecked: Story = {
  args: { disabled: true, checked: true },
}

export const LongLabel: Story = {
  args: {
    label: 'Bu ilanın fotoğraflarını ve açıklamasını mükerrer kayıt kontrolüne dahil et',
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.25rem' }}>
      <Checkbox {...args} label="Boş" />
      <Checkbox {...args} label="İşaretli" checked />
      <Checkbox {...args} label="Kısmi (indeterminate)" indeterminate />
      <Checkbox {...args} label="Açıklamalı" description="Ek bilgi burada görünür" />
      <Checkbox {...args} label="Devre dışı" disabled />
      <Checkbox {...args} label="Devre dışı + işaretli" disabled checked />
    </div>
  ),
}
