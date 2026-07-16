import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Switch } from './Switch'

const meta = {
  title: 'Primitives/Switch',
  component: Switch,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'Anında etkili açık/kapalı ayarı. Değişiklik ayrıca "Kaydet" gerektiriyorsa `Checkbox` ' +
          'kullanın — kullanıcı switch’i çevirince işin bittiğini varsayar. Durum renkle değil, ' +
          'topuzun konumuyla da anlatılır.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-control',
      useWhen: ['Anında uygulanan ayar açılıp kapanırken'],
      doNotUseWhen: ['Kaydet gerektiren form alanında — Checkbox kullanın'],
    },
  },

  args: {
    checked: false,
    label: 'İlanı otomatik yenile',
    disabled: false,
    size: 'md',
    onCheckedChange: fn(),
  },

  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Switch>

export default meta

type Story = StoryObj<typeof meta>

export const Off: Story = {}

export const On: Story = {
  args: { checked: true },
}

export const WithDescription: Story = {
  args: {
    checked: true,
    label: 'Yüksek riskli ilanları önceliklendir',
    description: 'Fraud skoru yüksek ilanlar moderasyon kuyruğunun başına alınır.',
  },
}

export const Small: Story = {
  args: { size: 'sm' },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const DisabledOn: Story = {
  args: { disabled: true, checked: true },
}

/** Gerçek etkileşim: tıklayınca topuz kayar. */
export const Interactive: Story = {
  render: function Render(args) {
    const [on, setOn] = useState(false)
    return <Switch {...args} checked={on} onCheckedChange={setOn} label={on ? 'Açık' : 'Kapalı'} />
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.25rem' }}>
      <Switch {...args} label="Kapalı" checked={false} />
      <Switch {...args} label="Açık" checked />
      <Switch {...args} label="Küçük kapalı" size="sm" checked={false} />
      <Switch {...args} label="Küçük açık" size="sm" checked />
      <Switch {...args} label="Açıklamalı" checked description="Ek bilgi burada görünür" />
      <Switch {...args} label="Devre dışı" disabled />
      <Switch {...args} label="Devre dışı + açık" disabled checked />
    </div>
  ),
}
