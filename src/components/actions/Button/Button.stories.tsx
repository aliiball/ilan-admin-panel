import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

const meta = {
  title: 'Components/Actions/Button',
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
  },

  argTypes: {
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'İptal' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Detay' },
}

/** Geri alınamayan eylemler. Kullanıcıya her zaman bir onay adımı sunulmalı. */
export const Danger: Story = {
  args: { variant: 'danger', children: 'İlanı kalıcı olarak sil' },
}

/** Etiket gizlenir ama genişliği korunur — buton boyutu değişmez, layout zıplamaz. */
export const Loading: Story = {
  args: { loading: true },
}

export const Disabled: Story = {
  args: { disabled: true },
}

/** Uzun etiketlerde buton taşmamalı ve metin sarmamalı. */
export const LongLabel: Story = {
  args: { children: 'Seçili bütün ilanları incele ve toplu olarak onayla' },
}

export const FullWidth: Story = {
  args: { fullWidth: true, children: 'Kaydet' },
  parameters: { layout: 'padded' },
}

/** Tüm variant’ların yan yana karşılaştırması — görsel regresyonun ana yakalama noktası. */
export const AllVariants: Story = {
  args: { children: 'Eylem' },
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button {...args} variant="primary">
        Onayla
      </Button>
      <Button {...args} variant="secondary">
        İptal
      </Button>
      <Button {...args} variant="ghost">
        Detay
      </Button>
      <Button {...args} variant="danger">
        Sil
      </Button>
    </div>
  ),
}

/** Tablo satırlarında `sm`, form ve sayfa eylemlerinde `md` kullanılır. */
export const AllSizes: Story = {
  args: { children: 'Eylem' },
  render: (args) => (
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
  ),
}
