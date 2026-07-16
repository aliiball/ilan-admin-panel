import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { Check, ChevronDown, Trash2 } from 'lucide-react'
import { Button } from './Button'

const meta = {
  title: 'Primitives/Button',
  component: Button,

  tags: ['stable', 'admin-action'],

  parameters: {
    docs: {
      description: {
        component:
          'Admin Panel üzerindeki moderasyon ve operasyon eylemleri için kullanılır. ' +
          'Yetki kontrolü bu component’in sorumluluğu değildir: kullanıcının yetkisi yoksa ' +
          'butonu `disabled` vermek yerine hiç render etmeyin.',
      },
    },

    ai: {
      project: 'admin-panel',
      role: 'administrative-action',
      useWhen: ['İlan onaylanırken', 'İlan reddedilirken', 'Toplu moderasyon işlemi yapılırken'],
      doNotUseWhen: [
        'Ziyaretçi ilan araması yaparken',
        'Public ilan detayında eylem gösterilirken',
      ],
    },
  },

  args: {
    children: 'İlanı onayla',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    fullWidth: false,
    onClick: fn(),
  },

  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    leadingIcon: { control: false },
    trailingIcon: { control: false },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Vazgeç' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Detayı aç' },
}

/** Geri alınamayan eylemler. Kullanıcıya her zaman bir onay adımı sunulmalı. */
export const Danger: Story = {
  args: { variant: 'danger', children: 'İlanı reddet' },
}

export const Small: Story = {
  args: { size: 'sm', children: 'Onayla' },
}

export const Medium: Story = {
  args: { size: 'md' },
}

export const Large: Story = {
  args: { size: 'lg' },
}

/** Etiket gizlenir ama yerini korur — buton boyutu değişmez, düzen zıplamaz. */
export const Loading: Story = {
  args: { loading: true, children: 'Kaydediliyor' },
}

/**
 * Yüklenen buton adını kaybetmemeli.
 *
 * Etiket bir kez `visibility: hidden` ile gizleniyordu; erişilebilir ad hesabı o
 * alt ağacı yok saydığı için buton `loading` iken **adsız** kalıyordu — ekran
 * okuyucu "düğme, meşgul" diyor, hangi düğme olduğunu söylemiyordu. Gizleme
 * `opacity`'ye alındı. Bu test o gerilemeyi yakalar: adı sorguladığı için
 * gizleme yöntemi geri alınırsa kırılır.
 */
export const LoadingKeepsAccessibleName: Story = {
  args: { loading: true, children: 'Kaydediliyor' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const buton = canvas.getByRole('button', { name: 'Kaydediliyor' })
    await expect(buton).toHaveAttribute('aria-busy', 'true')
    await expect(buton).toBeDisabled()
  },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const WithIcons: Story = {
  args: {
    leadingIcon: <Check size={18} />,
    trailingIcon: <ChevronDown size={18} />,
    children: 'Onayla ve devam et',
  },
}

/** Uzun etiketlerde buton taşmamalı ve metin sarmamalı. */
export const LongLabel: Story = {
  args: { children: 'Seçili bütün ilanları incele ve toplu olarak onayla' },
}

/** Mobilde ana eylem tam genişlikte verilir. */
export const FullWidthMobile: Story = {
  args: { fullWidth: true, children: 'Kaydet' },
  globals: { viewport: { value: 'mobile320' } },
}

/** Bütün varyantların yan yana karşılaştırması — görsel regresyonun ana yakalama noktası. */
export const VariantsComparison: Story = {
  args: { children: 'Eylem' },
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem', minWidth: 'min(100%, 42rem)' }}>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Button {...args} variant="primary">
          Onayla
        </Button>
        <Button {...args} variant="secondary">
          Vazgeç
        </Button>
        <Button {...args} variant="ghost">
          Detay
        </Button>
        <Button {...args} variant="danger" leadingIcon={<Trash2 size={18} />}>
          Sil
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Button {...args} size="sm">
          Küçük
        </Button>
        <Button {...args} size="md">
          Orta
        </Button>
        <Button {...args} size="lg">
          Büyük
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Button {...args} loading>
          Yükleniyor
        </Button>
        <Button {...args} disabled>
          Devre dışı
        </Button>
        <Button {...args} variant="danger" disabled>
          Devre dışı tehlike
        </Button>
      </div>
    </div>
  ),
}
