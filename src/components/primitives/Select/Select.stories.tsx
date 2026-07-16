import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { SelectOption } from '../../../types/component-props'
import { Select } from './Select'

const KATEGORILER: SelectOption[] = [
  { value: 'konut', label: 'Konut', description: 'Daire, villa, müstakil ev' },
  { value: 'arsa', label: 'Arsa', description: 'İmarlı arsa, tarla, bağ bahçe' },
  { value: 'isyeri', label: 'İşyeri', description: 'Dükkan, ofis, depo, fabrika' },
  { value: 'bina', label: 'Bina', description: 'Komple bina' },
  { value: 'devremulk', label: 'Devremülk' },
  { value: 'turistikTesis', label: 'Turistik Tesis', description: 'Otel, pansiyon, tatil köyü' },
]

const ILLER: SelectOption[] = [
  { value: '34', label: 'İstanbul' },
  { value: '06', label: 'Ankara' },
  { value: '35', label: 'İzmir' },
  { value: '07', label: 'Antalya' },
  { value: '16', label: 'Bursa' },
  { value: '41', label: 'Kocaeli' },
  { value: '48', label: 'Muğla' },
  { value: '59', label: 'Tekirdağ' },
  { value: '03', label: 'Afyonkarahisar' },
]

const meta = {
  title: 'Primitives/Select',
  component: Select,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          '`searchable=false` klasik açılır liste (az seçenek), `searchable=true` yazarak ' +
          'filtrelenen liste (il/ilçe/mahalle gibi uzun listelerde zorunlu). İkisi Base UI’ın ' +
          'farklı primitive’leri üzerine kuruludur, klavye davranışları da bu yüzden farklıdır.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-control',
      useWhen: ['Çok seçenekten tek seçim yapılırken', 'İl/ilçe seçilirken (searchable ile)'],
      doNotUseWhen: [
        '2-4 seçenek varsa ve hepsi görünmeliyse — RadioGroup kullanın',
        'Çoklu seçim gerekiyorsa — MultiSelect kullanın',
      ],
    },
  },

  args: {
    label: 'Kategori',
    options: KATEGORILER,
    placeholder: 'Kategori seçin',
    size: 'md',
    searchable: false,
    clearable: false,
    loading: false,
    disabled: false,
    required: false,
    onValueChange: fn(),
  },

  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    searchable: { control: 'boolean' },
    clearable: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    options: { control: false },
  },

  decorators: [
    (Story) => (
      <div style={{ width: '22rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>

export const Closed: Story = {}

export const Selected: Story = {
  args: { value: 'konut' },
}

/** Uzun listede arama zorunludur — 81 ili kaydırarak bulmak kullanılabilir değil. */
export const Searchable: Story = {
  args: { label: 'İl', options: ILLER, searchable: true, placeholder: 'İl arayın' },
}

export const SearchableClearable: Story = {
  args: { label: 'İl', options: ILLER, searchable: true, clearable: true },
}

export const Loading: Story = {
  args: { loading: true, placeholder: 'Seçenekler yükleniyor' },
}

export const EmptyOptions: Story = {
  args: { options: [], placeholder: 'Seçenek yok' },
}

export const WithError: Story = {
  args: { error: 'Kategori seçimi zorunludur' },
}

export const Required: Story = {
  args: { required: true, helperText: 'İlan kategorisi sonradan değiştirilemez' },
}

export const Disabled: Story = {
  args: { disabled: true, value: 'konut' },
}

/** Devre dışı seçenek gizlenmek yerine kilitlenir — kullanıcı neden yapamadığını görür. */
export const OptionDisabled: Story = {
  args: {
    options: [
      { value: 'konut', label: 'Konut' },
      { value: 'arsa', label: 'Arsa' },
      { value: 'bina', label: 'Bina', disabled: true, description: 'Bu kategoride yetkiniz yok' },
    ],
  },
}

export const Small: Story = {
  args: { size: 'sm' },
}

export const Large: Story = {
  args: { size: 'lg' },
}

export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<string | undefined>(undefined)
    return (
      <Select
        {...args}
        value={value}
        onValueChange={setValue}
        helperText={`Seçili: ${value ?? '(yok)'}`}
      />
    )
  },
}

/** Liste gerçekten açılıp seçim yapılabiliyor mu? */
export const OpensAndSelects: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox')

    await userEvent.click(trigger)

    // Popup portal'a gittigi icin body icinde aranir.
    const listbox = within(document.body)
    const option = await listbox.findByRole('option', { name: /Arsa/ })
    await userEvent.click(option)

    await expect(args.onValueChange).toHaveBeenCalledWith('arsa')
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <Select {...args} label="Varsayılan" />
      <Select {...args} label="Seçili" value="konut" />
      <Select {...args} label="Aranabilir" options={ILLER} searchable />
      <Select {...args} label="Hatalı" error="Seçim zorunlu" />
      <Select {...args} label="Devre dışı" value="konut" disabled />
    </div>
  ),
}
