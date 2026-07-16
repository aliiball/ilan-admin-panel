import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Check, MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import { IconButton } from './IconButton'

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,

  tags: ['stable', 'admin-action'],

  parameters: {
    docs: {
      description: {
        component:
          'Yer kısıtlı alanlarda (tablo satırı, toolbar, galeri) kullanılan yalnız ikonlu eylem. ' +
          '`label` zorunludur: görünür metni olmadığı için ekran okuyucunun okuyacağı tek kaynak odur.',
      },
    },

    ai: {
      project: 'admin-panel',
      role: 'administrative-action',
      useWhen: ['Tablo satırında eylem gösterilirken', 'Toolbar’da yer kısıtlıyken'],
      doNotUseWhen: [
        'Ekranın ana eylemi gösterilirken — metinli Button kullanın',
        'Eylem ikonla açıkça anlatılamıyorsa',
      ],
    },
  },

  args: {
    icon: <Pencil size={18} />,
    label: 'İlanı düzenle',
    variant: 'ghost',
    size: 'md',
    loading: false,
    disabled: false,
    onClick: fn(),
  },

  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    icon: { control: false },
  },
} satisfies Meta<typeof IconButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Primary: Story = {
  args: { variant: 'primary', icon: <Check size={18} />, label: 'İlanı onayla' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', icon: <MoreVertical size={18} />, label: 'Diğer işlemler' },
}

export const Danger: Story = {
  args: { variant: 'danger', icon: <Trash2 size={18} />, label: 'İlanı sil' },
}

export const Small: Story = {
  args: { size: 'sm' },
}

export const Large: Story = {
  args: { size: 'lg' },
}

/** İkon gizlenir ama kutu boyutu korunur — toolbar düzeni zıplamaz. */
export const Loading: Story = {
  args: { loading: true },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <IconButton {...args} variant="primary" icon={<Check size={18} />} label="Onayla" />
        <IconButton {...args} variant="secondary" icon={<Pencil size={18} />} label="Düzenle" />
        <IconButton {...args} variant="ghost" icon={<MoreVertical size={18} />} label="Diğer" />
        <IconButton {...args} variant="danger" icon={<Trash2 size={18} />} label="Sil" />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <IconButton {...args} size="sm" icon={<X size={16} />} label="Küçük kapat" />
        <IconButton {...args} size="md" icon={<X size={18} />} label="Orta kapat" />
        <IconButton {...args} size="lg" icon={<X size={20} />} label="Büyük kapat" />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <IconButton {...args} loading icon={<Check size={18} />} label="Yükleniyor" />
        <IconButton {...args} disabled icon={<Trash2 size={18} />} label="Devre dışı" />
      </div>
    </div>
  ),
}
