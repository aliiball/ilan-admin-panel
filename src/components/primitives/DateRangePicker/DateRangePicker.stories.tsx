import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { DateRange } from '../../../types/component-props'
import { DateRangePicker } from './DateRangePicker'

/** Fixture tarihleri sabit: `new Date()` kullanılırsa story sonucu her gün değişir. */
const HAZIR_ARALIKLAR: Array<{ label: string; value: DateRange }> = [
  { label: 'Son 7 gün', value: { from: '2026-07-10', to: '2026-07-16' } },
  { label: 'Son 30 gün', value: { from: '2026-06-17', to: '2026-07-16' } },
  { label: 'Bu ay', value: { from: '2026-07-01', to: '2026-07-31' } },
  { label: 'Geçen ay', value: { from: '2026-06-01', to: '2026-06-30' } },
]

const meta = {
  title: 'Primitives/DateRangePicker',
  component: DateRangePicker,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Takvim davranışı (klavye gezinme, aralık seçimi, Türkçe yerelleştirme) ' +
          '`react-day-picker`’dan gelir — Base UI’da tarih primitive’i yok ve bunları sıfırdan ' +
          'doğru yazmak günler sürerdi. Görünüm tamamen bizim token’larımıza bağlı. `presets` ' +
          'ile hazır aralıklar sunulur: en sık kullanılanı tıklamak takvimde gezinmekten hızlıdır.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-control',
      useWhen: ['Dashboard tarih filtresi', 'İlan veya güncellenme tarihi aralığı seçilirken'],
      doNotUseWhen: ['Tek tarih seçiliyorsa — aralık yerine tek tarihli bir kontrol gerekir'],
    },
  },

  args: {
    label: 'İlan tarihi',
    value: {},
    onValueChange: fn(),
  },

  argTypes: {
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    value: { control: false },
    presets: { control: false },
  },

  decorators: [
    (Story) => (
      <div style={{ width: '22rem', minHeight: '26rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DateRangePicker>

export default meta

type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Selected: Story = {
  args: { value: { from: '2026-07-01', to: '2026-07-16' } },
}

/** Yalnızca başlangıç seçili: kullanıcı bitiş tarihini seçmeyi bekliyor. */
export const PartialRange: Story = {
  args: { value: { from: '2026-07-10' } },
}

export const WithPresets: Story = {
  args: { presets: HAZIR_ARALIKLAR },
}

export const WithMinMax: Story = {
  args: {
    min: '2026-07-01',
    max: '2026-07-31',
    helperText: 'Yalnızca temmuz ayı seçilebilir',
  },
}

export const Required: Story = {
  args: { required: true, helperText: 'Tarih aralığı zorunludur' },
}

export const WithError: Story = {
  args: { error: 'Bitiş tarihi başlangıçtan önce olamaz', value: { from: '2026-07-16' } },
}

export const Disabled: Story = {
  args: { disabled: true, value: { from: '2026-07-01', to: '2026-07-16' } },
}

/** Dar ekranda hazır aralıklar takvimin üstüne geçer, yan yana sığmaz. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { presets: HAZIR_ARALIKLAR },
}

export const Interactive: Story = {
  render: function Render(args) {
    const [range, setRange] = useState<DateRange>({})
    return (
      <DateRangePicker
        {...args}
        value={range}
        onValueChange={setRange}
        presets={HAZIR_ARALIKLAR}
        helperText={`Seçili: ${range.from ?? '…'} – ${range.to ?? '…'}`}
      />
    )
  },
}

/** Hazır aralık tıklanınca doğru değeri veriyor mu? */
export const PresetSelectsRange: Story = {
  args: { presets: HAZIR_ARALIKLAR },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))

    const body = within(document.body)
    await userEvent.click(await body.findByRole('button', { name: 'Son 7 gün' }))

    await expect(args.onValueChange).toHaveBeenCalledWith({
      from: '2026-07-10',
      to: '2026-07-16',
    })
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <DateRangePicker {...args} label="Boş" value={{}} />
      <DateRangePicker {...args} label="Seçili" value={{ from: '2026-07-01', to: '2026-07-16' }} />
      <DateRangePicker {...args} label="Kısmi" value={{ from: '2026-07-10' }} />
      <DateRangePicker {...args} label="Hatalı" value={{}} error="Aralık zorunlu" />
      <DateRangePicker {...args} label="Devre dışı" value={{ from: '2026-07-01' }} disabled />
    </div>
  ),
}
