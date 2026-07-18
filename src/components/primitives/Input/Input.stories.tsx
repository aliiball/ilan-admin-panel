import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
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

/**
 * Mesajsız geçersiz: kırmızı kenarlık ve `aria-invalid`, ama alanın altında
 * metin **yok**. Giriş ekranı gibi geçersizliğin alan bazında bir cümle
 * üretmediği (hata tek bir üst uyarı olan) yerler için.
 */
export const Invalid: Story = {
  args: { invalid: true, defaultValue: 'abc' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      Kenarlık DOM'dan ölçülüyor: kırmızıyı çizen kural `&[data-invalid]` ve o
      işaret kutudadır (input'un span atası) — `closest()` ile atayı bulup
      "geçti" demek yerine işaretin gerçekten kutuda olduğunu doğruluyoruz.
    */
    const input = canvas.getByRole('textbox')
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    const kutu = input.closest('[data-invalid]')
    await expect(kutu).not.toBeNull()

    /*
      Mesaj YOK: `invalid` mesajsızdır. Base UI, altta bir Description/Error
      render edilmediği için input'a `aria-describedby` de bağlamaz — "alan
      altında metin yok"un DOM'daki karşılığı budur.
    */
    await expect(input).not.toHaveAttribute('aria-describedby')
  },
}

/**
 * `error` ve `invalid` birlikte verilince **`error` kazanır**: kutu yine
 * kırmızı ama bu kez mesaj da görünür. `invalid`'in "mesajsız" olması onu
 * bastırmaz — öncelik `error`'dadır.
 */
export const ErrorWinsOverInvalid: Story = {
  args: {
    error: 'İlan başlığı en az 10 karakter olmalıdır',
    invalid: true,
    defaultValue: 'Daire',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const input = canvas.getByRole('textbox')
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    const kutu = input.closest('[data-invalid]')
    await expect(kutu).not.toBeNull()

    /* error kazanır: mesaj görünür (invalid tek başına bunu yapmazdı). */
    await expect(canvas.getByText('İlan başlığı en az 10 karakter olmalıdır')).toBeInTheDocument()
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
