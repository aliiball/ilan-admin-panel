import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Button } from '../Button'
import { Drawer } from './Drawer'

const meta = {
  title: 'Primitives/Drawer',
  component: Drawer,

  tags: ['stable'],

  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Kenardan açılan panel. Modal ile aynı erişilebilirlik davranışını paylaşır (ikisi de ' +
          'Base UI Dialog üzerine kurulu); fark yalnızca konum ve hareket yönü. `side="bottom"` ' +
          'mobilde tercih edilir — başparmakla erişilir ve alttaki güvenli alan hesaba katılır.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'overlay',
      useWhen: ['Mobilde filtre gösterilirken', 'Audit log JSON detayı açılırken'],
      doNotUseWhen: ['Kısa onay gerekiyorsa — ConfirmDialog kullanın'],
    },
  },

  args: {
    open: true,
    title: 'Filtreler',
    side: 'right',
    size: 'md',
    children: 'Panel içeriği burada görünür.',
    onOpenChange: fn(),
  },

  argTypes: {
    side: { control: 'inline-radio', options: ['left', 'right', 'bottom'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    open: { control: 'boolean' },
    children: { control: false },
    footer: { control: false },
  },
} satisfies Meta<typeof Drawer>

export default meta

type Story = StoryObj<typeof meta>

export const Right: Story = {}

export const Left: Story = {
  args: { side: 'left' },
}

/** Mobil filtrelerin varsayılanı. */
export const Bottom: Story = {
  args: { side: 'bottom' },
}

export const WithFooter: Story = {
  args: {
    footer: (
      <>
        <Button variant="secondary">Temizle</Button>
        <Button>Uygula</Button>
      </>
    ),
  },
}

export const Scrollable: Story = {
  args: {
    title: 'Audit log detayı',
    children: (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} style={{ fontFamily: 'var(--font-family-mono)', fontSize: '1rem' }}>
            {`"alan_${i + 1}": "önceki değer → yeni değer"`}
          </div>
        ))}
      </div>
    ),
    footer: <Button>Kapat</Button>,
  },
}

export const Small: Story = {
  args: { size: 'sm' },
}

export const Large: Story = {
  args: { size: 'lg' },
}

/** Mobilde alttan açılır ve güvenli alanı hesaba katar. */
export const MobileBottom: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    side: 'bottom',
    footer: (
      <>
        <Button variant="secondary" fullWidth>
          Temizle
        </Button>
        <Button fullWidth>Uygula</Button>
      </>
    ),
  },
}

export const Interactive: Story = {
  args: { open: false },
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    return (
      <div style={{ padding: '2rem' }}>
        <Button onClick={() => setOpen(true)}>Filtreleri aç</Button>
        <Drawer {...args} open={open} onOpenChange={setOpen}>
          Escape tuşuyla veya dışarı tıklayarak kapatabilirsiniz.
        </Drawer>
      </div>
    )
  },
}

export const VariantsComparison: Story = {
  args: { open: false },
  render: function Render(args) {
    const [side, setSide] = useState<'left' | 'right' | 'bottom' | null>(null)
    return (
      <div style={{ padding: '2rem', display: 'flex', gap: '0.75rem' }}>
        <Button variant="secondary" onClick={() => setSide('left')}>
          Sol
        </Button>
        <Button variant="secondary" onClick={() => setSide('right')}>
          Sağ
        </Button>
        <Button variant="secondary" onClick={() => setSide('bottom')}>
          Alt
        </Button>
        {side !== null ? (
          <Drawer
            {...args}
            open
            side={side}
            title={`${side} panel`}
            onOpenChange={() => setSide(null)}
          >
            Bu panel {side} tarafından açıldı.
          </Drawer>
        ) : null}
      </div>
    )
  },
}
