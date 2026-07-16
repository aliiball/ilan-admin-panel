import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { NumberInput } from './NumberInput'

const meta = {
  title: 'Primitives/NumberInput',
  component: NumberInput,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'Sayısal değer girişi: m², oda sayısı, kat sayısı gibi alanlar için. `min`/`max` ' +
          'sınırına gelindiğinde ilgili buton kendiliğinden devre dışı kalır. Tutar için ' +
          '`CurrencyInput` kullanın.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-control',
      useWhen: ['m², kat, oda veya adet girilirken'],
      doNotUseWhen: ['Tutar girilirken — CurrencyInput kullanın'],
    },
  },

  args: {
    label: 'Brüt m²',
    size: 'md',
    disabled: false,
    readOnly: false,
    onValueChange: fn(),
  },

  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
  },

  decorators: [
    (Story) => (
      <div style={{ width: '18rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NumberInput>

export default meta

type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Filled: Story = {
  args: { value: 145 },
}

export const WithRange: Story = {
  args: { value: 3, min: 0, max: 10, label: 'Banyo sayısı', helperText: '0 ile 10 arasında' },
}

/** Sınıra gelindiğinde artır butonu devre dışı kalır. */
export const AtMaximum: Story = {
  args: { value: 10, min: 0, max: 10, label: 'Banyo sayısı' },
}

export const AtMinimum: Story = {
  args: { value: 0, min: 0, max: 10, label: 'Banyo sayısı' },
}

export const WithError: Story = {
  args: { value: 0, error: 'Brüt m² pozitif bir sayı olmalıdır' },
}

export const Disabled: Story = {
  args: { value: 145, disabled: true },
}

export const ReadOnly: Story = {
  args: { value: 145, readOnly: true, label: 'Brüt m² (değiştirilemez)' },
}

export const Small: Story = {
  args: { size: 'sm', value: 3 },
}

export const Large: Story = {
  args: { size: 'lg', value: 145 },
}

export const Interactive: Story = {
  render: function Render(args) {
    const [deger, setDeger] = useState<number | undefined>(2)
    return (
      <NumberInput
        {...args}
        label="Oda sayısı"
        min={0}
        max={12}
        value={deger}
        onValueChange={setDeger}
        helperText={`Seçili: ${deger ?? '(boş)'}`}
      />
    )
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <NumberInput {...args} size="sm" label="Küçük" value={3} />
      <NumberInput {...args} size="md" label="Orta" value={145} />
      <NumberInput {...args} size="lg" label="Büyük" value={1250} />
      <NumberInput {...args} label="Sınırda (max 10)" value={10} min={0} max={10} />
      <NumberInput {...args} label="Hatalı" value={0} error="Pozitif olmalı" />
      <NumberInput {...args} label="Devre dışı" value={145} disabled />
    </div>
  ),
}
