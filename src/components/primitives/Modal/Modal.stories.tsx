import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '../Button'
import { Modal } from './Modal'

const meta = {
  title: 'Primitives/Modal',
  component: Modal,

  tags: ['stable'],

  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Odak kilitli dialog. Odak yönetimi, `Escape` ile kapanma ve kapanınca odağın ' +
          'tetikleyiciye dönmesi Base UI’dan gelir. `title` zorunludur — dialog’un erişilebilir ' +
          'adı odur. Geri alınamayan eylem onayı için `ConfirmDialog` kullanın.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'overlay',
      useWhen: ['Kısa form veya detay odakta gösterilirken'],
      doNotUseWhen: [
        'Yıkıcı eylem onaylatılıyorsa — ConfirmDialog kullanın',
        'Mobilde uzun içerik varsa — Drawer daha uygun olabilir',
      ],
    },
  },

  args: {
    open: true,
    title: 'İlanı reddet',
    size: 'md',
    closeOnBackdrop: true,
    children: 'Modal içeriği burada görünür.',
    onOpenChange: fn(),
  },

  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    closeOnBackdrop: { control: 'boolean' },
    open: { control: 'boolean' },
    children: { control: false },
    footer: { control: false },
  },
} satisfies Meta<typeof Modal>

export default meta

type Story = StoryObj<typeof meta>

export const Open: Story = {}

export const WithDescription: Story = {
  args: {
    description: 'Reddedilen ilan yayınlanmaz. İlan sahibine gerekçe bildirilir.',
  },
}

export const WithFooter: Story = {
  args: {
    description: 'Reddedilen ilan yayınlanmaz. İlan sahibine gerekçe bildirilir.',
    footer: (
      <>
        <Button variant="secondary">Vazgeç</Button>
        <Button variant="danger">İlanı reddet</Button>
      </>
    ),
  },
}

/** İçerik uzarsa gövde kayar; başlık ve footer sabit kalır. */
export const LongContent: Story = {
  args: {
    title: 'İlan açıklaması',
    children: (
      <div style={{ display: 'grid', gap: '1rem' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <p key={i}>
            Kadıköy Caferağa Mahallesi’nde, toplu ulaşıma yakın, çift cepheli ve yenilenmiş 3+1
            daire. Salon ve odalar gün ışığı almaktadır. Paragraf {i + 1}.
          </p>
        ))}
      </div>
    ),
    footer: <Button>Kapat</Button>,
  },
}

/** Veri kaybı riski olan formlarda dışarı tıklamayla kapanmamalı. */
export const NoBackdropClose: Story = {
  args: {
    closeOnBackdrop: false,
    title: 'Doldurulmuş form',
    description: 'Dışarı tıklamak bu modalı kapatmaz.',
    footer: <Button>Kaydet</Button>,
  },
}

export const Small: Story = {
  args: { size: 'sm' },
}

export const ExtraLarge: Story = {
  args: { size: 'xl' },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    description: 'Mobilde footer eylemleri dikey sıralanır.',
    footer: (
      <>
        <Button variant="secondary" fullWidth>
          Vazgeç
        </Button>
        <Button variant="danger" fullWidth>
          Reddet
        </Button>
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
        <Button onClick={() => setOpen(true)}>Modalı aç</Button>
        <Modal
          {...args}
          open={open}
          onOpenChange={setOpen}
          footer={<Button onClick={() => setOpen(false)}>Kapat</Button>}
        >
          Escape tuşuyla veya dışarı tıklayarak kapatabilirsiniz.
        </Modal>
      </div>
    )
  },
}

/** Escape ile kapanmalı — Base UI’ın odak/klavye yönetimi gerçekten kurulu mu? */
export const ClosesOnEscape: Story = {
  play: async ({ args }) => {
    const body = within(document.body)
    await expect(await body.findByRole('dialog')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    await expect(args.onOpenChange).toHaveBeenCalledWith(false)
  },
}
