import type { Meta, StoryObj } from '@storybook/react-vite'
import { Hash, Search } from 'lucide-react'
import { Input } from './Input'

const meta = {
  title: 'Primitives/Input',
  component: Input,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'Tek satırlık metin girişi. Etiketsiz kullanmayın — placeholder etiket yerine geçmez, ' +
          'kullanıcı yazmaya başlayınca kaybolur. Erişilebilir bağlantıları Base UI Field kurar.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-control',
      useWhen: ['Serbest metin alınırken', 'İlan no veya başlık aranırken'],
      doNotUseWhen: [
        'Arama kutusu gerekiyorsa — SearchInput kullanın',
        'Sayı alınıyorsa — NumberInput kullanın',
        'Tutar alınıyorsa — CurrencyInput kullanın',
      ],
    },
  },

  args: {
    label: 'İlan başlığı',
    placeholder: 'Örn. Caferağa’da 3+1 daire',
    size: 'md',
    required: false,
    disabled: false,
  },

  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    leadingIcon: { control: false },
    trailingAction: { control: false },
  },

  decorators: [
    (Story) => (
      <div style={{ width: '22rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Filled: Story = {
  args: { defaultValue: 'Caferağa’da Asansörlü Binada Ferah 3+1 Daire' },
}

export const WithHelperText: Story = {
  args: {
    label: 'İlan no',
    helperText: '10 haneli ilan numarasını girin',
    placeholder: '1245789630',
  },
}

export const Required: Story = {
  args: { required: true, helperText: 'Bu alan zorunludur' },
}

/** Hata varken yardımcı metin gizlenir; ikisi birden okunmaz. */
export const WithError: Story = {
  args: {
    error: 'İlan başlığı en az 10 karakter olmalıdır',
    helperText: 'Bu metin hata varken gizlenir',
    defaultValue: 'Daire',
  },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Düzenlenemez' },
}

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: '1245789630', label: 'İlan no (değiştirilemez)' },
}

export const WithLeadingIcon: Story = {
  args: { leadingIcon: <Hash size={16} />, label: 'İlan no', placeholder: '1245789630' },
}

export const Small: Story = {
  args: { size: 'sm' },
}

export const Large: Story = {
  args: { size: 'lg' },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <Input {...args} size="sm" label="Küçük" />
      <Input {...args} size="md" label="Orta" />
      <Input {...args} size="lg" label="Büyük" />
      <Input {...args} label="İkonlu" leadingIcon={<Search size={16} />} />
      <Input {...args} label="Zorunlu" required helperText="Zorunlu alan" />
      <Input {...args} label="Hatalı" error="Geçersiz değer" defaultValue="abc" />
      <Input {...args} label="Devre dışı" disabled defaultValue="Düzenlenemez" />
    </div>
  ),
}
