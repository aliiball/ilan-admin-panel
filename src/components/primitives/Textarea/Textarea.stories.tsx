import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Textarea } from './Textarea'

const meta = {
  title: 'Primitives/Textarea',
  component: Textarea,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'Çok satırlı metin girişi. İlan açıklaması, moderasyon notu ve red gerekçesi için. ' +
          'Karakter sayacı `aria-live="polite"` ile duyurulur. Varsayılan olarak yalnızca dikey ' +
          'boyutlandırılır — yatay büyüme dar ekranda düzeni taşırır.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-control',
      useWhen: ['Moderasyon notu alınırken', 'Red gerekçesi açıklaması yazılırken'],
      doNotUseWhen: ['Tek satırlık değer alınıyorsa — Input kullanın'],
    },
  },

  args: {
    label: 'Moderasyon notu',
    placeholder: 'Kararın gerekçesini yazın',
    resize: 'vertical',
    showCharacterCount: false,
    required: false,
    disabled: false,
  },

  argTypes: {
    resize: { control: 'inline-radio', options: ['none', 'vertical', 'both'] },
    showCharacterCount: { control: 'boolean' },
    maxLength: { control: 'number' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },

  decorators: [
    (Story) => (
      <div style={{ width: '26rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Filled: Story = {
  args: {
    defaultValue:
      'Net m² bilgisi ile açıklamadaki değer uyuşmuyor. İlan sahibinden açıklamayı güncellemesi istendi.',
  },
}

export const WithCharacterCount: Story = {
  args: { showCharacterCount: true, maxLength: 500 },
}

/** Sınıra yaklaşınca sayaç uyarı rengine döner. */
export const NearCharacterLimit: Story = {
  args: {
    showCharacterCount: true,
    maxLength: 100,
    defaultValue:
      'Aynı gayrimenkule ait aktif bir ilan bulundu. Mükerrer kayıt nedeniyle reddedildi ve ilan sahibi',
  },
}

export const Required: Story = {
  args: { required: true, helperText: 'Red kararında gerekçe zorunludur' },
}

export const WithError: Story = {
  args: {
    error: 'Moderasyon notu en az 20 karakter olmalıdır',
    defaultValue: 'Uygun değil',
  },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Bu not düzenlenemez' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox')).toBeDisabled()
  },
}

export const NoResize: Story = {
  args: { resize: 'none' },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Textarea {...args} label="Varsayılan" />
      <Textarea {...args} label="Sayaçlı" showCharacterCount maxLength={200} />
      <Textarea {...args} label="Zorunlu" required helperText="Zorunlu alan" />
      <Textarea {...args} label="Hatalı" error="Çok kısa" defaultValue="Yok" />
      <Textarea {...args} label="Devre dışı" disabled defaultValue="Düzenlenemez" />
    </div>
  ),
}
