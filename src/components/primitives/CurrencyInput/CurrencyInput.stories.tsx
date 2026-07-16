import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Currency } from '../../../types/domain'
import { CurrencyInput } from './CurrencyInput'

const TUM_PARA_BIRIMLERI = [Currency.Try, Currency.Usd, Currency.Eur, Currency.Gbp]

const meta = {
  title: 'Primitives/CurrencyInput',
  component: CurrencyInput,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'Tutar ve para birimi tek kontrolde toplanır — ayrı alanlarda dursalar kullanıcı ' +
          'birini değiştirip diğerini unutabilir ve `Money` tutarsız kalır. `currencies` ' +
          'verilmezse para birimi sabit etikettir.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-control',
      useWhen: ['Fiyat, aidat, depozito veya devir bedeli girilirken'],
      doNotUseWhen: ['Para birimi olmayan sayı için — NumberInput kullanın'],
    },
  },

  args: {
    label: 'Fiyat',
    currency: Currency.Try,
    size: 'md',
    disabled: false,
    required: false,
    onValueChange: fn(),
    onCurrencyChange: fn(),
  },

  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    currency: { control: 'select', options: TUM_PARA_BIRIMLERI },
    currencies: { control: false },
  },

  decorators: [
    (Story) => (
      <div style={{ width: '20rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CurrencyInput>

export default meta

type Story = StoryObj<typeof meta>

/** Tek para birimi: seçici yerine sabit etiket. */
export const Empty: Story = {}

export const Filled: Story = {
  args: { value: 18_750_000 },
}

/** Birden çok para birimi verilince seçilebilir hâle gelir. */
export const WithCurrencySelector: Story = {
  args: { value: 18_750_000, currencies: TUM_PARA_BIRIMLERI },
}

export const ForeignCurrency: Story = {
  args: { value: 450_000, currency: Currency.Usd, currencies: TUM_PARA_BIRIMLERI },
}

export const MonthlyRent: Story = {
  args: { value: 65_000, label: 'Aylık kira', helperText: 'KDV hariç tutarı girin' },
}

export const WithError: Story = {
  args: { value: 0, error: 'Fiyat sıfırdan büyük olmalıdır' },
}

export const Required: Story = {
  args: { required: true, helperText: 'Fiyat zorunludur' },
}

export const Disabled: Story = {
  args: { value: 18_750_000, disabled: true },
}

export const Small: Story = {
  args: { size: 'sm', value: 1_850 },
}

export const Large: Story = {
  args: { size: 'lg', value: 18_750_000 },
}

export const Interactive: Story = {
  render: function Render(args) {
    const [tutar, setTutar] = useState<number | undefined>(18_750_000)
    const [birim, setBirim] = useState<Currency>(Currency.Try)
    return (
      <CurrencyInput
        {...args}
        value={tutar}
        currency={birim}
        currencies={TUM_PARA_BIRIMLERI}
        onValueChange={setTutar}
        onCurrencyChange={setBirim}
        helperText={`Money: { amount: ${tutar ?? 'undefined'}, currency: "${birim}" }`}
      />
    )
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <CurrencyInput {...args} label="Sabit para birimi" value={18_750_000} />
      <CurrencyInput
        {...args}
        label="Seçilebilir para birimi"
        value={450_000}
        currency={Currency.Usd}
        currencies={TUM_PARA_BIRIMLERI}
      />
      <CurrencyInput {...args} label="Aidat (küçük)" size="sm" value={1_850} />
      <CurrencyInput {...args} label="Hatalı" value={0} error="Sıfırdan büyük olmalı" />
      <CurrencyInput {...args} label="Devre dışı" value={18_750_000} disabled />
    </div>
  ),
}
