import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { RadioOption } from '../../../types/component-props'
import { RadioGroup } from './RadioGroup'

const KARAR_SECENEKLERI: RadioOption[] = [
  { value: 'approve', label: 'Onayla', description: 'İlan hemen yayına alınır.' },
  {
    value: 'requestChanges',
    label: 'Düzeltme iste',
    description: 'İlan sahibine geri gönderilir, düzeltip tekrar gönderebilir.',
  },
  {
    value: 'reject',
    label: 'Reddet',
    description: 'İlan yayınlanmaz. Gerekçe ve not zorunludur.',
  },
]

const BASIT_SECENEKLER: RadioOption[] = [
  { value: 'sale', label: 'Satılık' },
  { value: 'rent', label: 'Kiralık' },
  { value: 'daily', label: 'Günlük kiralık' },
]

const meta = {
  title: 'Primitives/RadioGroup',
  component: RadioGroup,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'Birbirini dışlayan seçeneklerden tek seçim. Seçenek sayısı arttıkça `Select` daha ' +
          'uygun olur — uzun radyo listesi ekranı boğar. Ok tuşlarıyla gezinme Base UI’dan gelir.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-control',
      useWhen: ['2-4 seçenek arasından tek seçim yapılırken', 'Seçeneklerin hepsi görünmeliyken'],
      doNotUseWhen: ['Seçenek sayısı fazlaysa — Select kullanın'],
    },
  },

  args: {
    label: 'Moderasyon kararı',
    options: KARAR_SECENEKLERI,
    orientation: 'vertical',
    disabled: false,
    required: false,
    onValueChange: fn(),
  },

  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    options: { control: false },
  },

  decorators: [
    (Story) => (
      <div style={{ width: '26rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RadioGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Selected: Story = {
  args: { value: 'approve' },
}

export const Horizontal: Story = {
  args: { options: BASIT_SECENEKLER, label: 'İşlem türü', orientation: 'horizontal' },
}

export const Required: Story = {
  args: { required: true, helperText: 'Karar seçilmeden ilerlenemez' },
}

export const WithError: Story = {
  args: { error: 'Bir karar seçmelisiniz' },
}

export const Disabled: Story = {
  args: { disabled: true, value: 'approve' },
}

/** Tek bir seçenek devre dışı: yetkisi olmayan karar gizlenmek yerine kilitlenmiş. */
export const OptionDisabled: Story = {
  args: {
    options: [
      { value: 'approve', label: 'Onayla' },
      { value: 'requestChanges', label: 'Düzeltme iste' },
      {
        value: 'reject',
        label: 'Reddet',
        disabled: true,
        description: 'Bu yetkiye sahip değilsiniz',
      },
    ],
  },
}

export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('approve')
    return <RadioGroup {...args} value={value} onValueChange={setValue} />
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <RadioGroup {...args} label="Dikey (açıklamalı)" value="approve" />
      <RadioGroup
        {...args}
        label="Yatay (sade)"
        options={BASIT_SECENEKLER}
        orientation="horizontal"
        value="rent"
      />
      <RadioGroup {...args} label="Hatalı" options={BASIT_SECENEKLER} error="Seçim zorunlu" />
      <RadioGroup {...args} label="Devre dışı" options={BASIT_SECENEKLER} value="sale" disabled />
    </div>
  ),
}
