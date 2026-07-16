import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { SelectOption } from '../../../types/component-props'
import { MultiSelect } from './MultiSelect'

const DURUMLAR: SelectOption[] = [
  { value: 'draft', label: 'Taslak' },
  { value: 'pendingReview', label: 'İncelemede' },
  { value: 'changesRequested', label: 'Düzeltme Bekliyor' },
  { value: 'published', label: 'Onaylı / Yayında' },
  { value: 'rejected', label: 'Reddedildi' },
  { value: 'paused', label: 'Pasif' },
  { value: 'expired', label: 'Süresi Dolmuş' },
  { value: 'archived', label: 'Arşiv' },
]

const meta = {
  title: 'Primitives/MultiSelect',
  component: MultiSelect,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'Çoklu seçim. Seçilenler çip olarak görünür ve tek tek kaldırılabilir. ' +
          '`maxVisibleTags` ile çip sayısı sınırlanır, fazlası "+3" diye özetlenir — aksi hâlde ' +
          'çok seçimde kutu sayfayı aşağı iter. Tek seçim için `Select` kullanın.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-control',
      useWhen: ['İlan listesinde durum veya kategori filtrelenirken'],
      doNotUseWhen: ['Tek seçim gerekiyorsa — Select kullanın'],
    },
  },

  args: {
    label: 'Durum',
    options: DURUMLAR,
    values: [],
    placeholder: 'Durum seçin',
    size: 'md',
    searchable: true,
    loading: false,
    disabled: false,
    required: false,
    onValuesChange: fn(),
  },

  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    searchable: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    maxVisibleTags: { control: 'number' },
    options: { control: false },
    values: { control: false },
  },

  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MultiSelect>

export default meta

type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Selected: Story = {
  args: { values: ['pendingReview', 'changesRequested'] },
}

/** Çok seçimde kutu büyümesin diye fazlası özetlenir. */
export const Overflow: Story = {
  args: {
    values: ['draft', 'pendingReview', 'changesRequested', 'published', 'rejected'],
    maxVisibleTags: 2,
  },
}

export const AllSelected: Story = {
  args: { values: DURUMLAR.map((d) => d.value) },
}

export const Loading: Story = {
  args: { loading: true },
}

export const WithError: Story = {
  args: { error: 'En az bir durum seçmelisiniz' },
}

export const Disabled: Story = {
  args: { disabled: true, values: ['published'] },
}

export const NotSearchable: Story = {
  args: { searchable: false, values: ['published'] },
}

export const Interactive: Story = {
  render: function Render(args) {
    const [values, setValues] = useState<string[]>(['pendingReview'])
    return (
      <MultiSelect
        {...args}
        values={values}
        onValuesChange={setValues}
        helperText={`${values.length} durum seçili`}
      />
    )
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <MultiSelect {...args} label="Boş" values={[]} />
      <MultiSelect {...args} label="Seçili" values={['pendingReview', 'published']} />
      <MultiSelect
        {...args}
        label="Taşma (+3)"
        values={['draft', 'pendingReview', 'changesRequested', 'published', 'rejected']}
        maxVisibleTags={2}
      />
      <MultiSelect {...args} label="Hatalı" values={[]} error="Seçim zorunlu" />
      <MultiSelect {...args} label="Devre dışı" values={['published']} disabled />
    </div>
  ),
}
