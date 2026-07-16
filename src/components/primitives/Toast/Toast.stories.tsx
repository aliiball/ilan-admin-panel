import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { Button } from '../Button'
import { Toast } from './Toast'

const meta = {
  title: 'Primitives/Toast',
  component: Toast,

  tags: ['stable'],

  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Geçici işlem geri bildirimi. Kalıcı uyarı için `Alert` kullanın — toast kaybolur, ' +
          'kullanıcı kaçırabilir. `danger` tonu `role="alert"` ile duyurulur ve **otomatik ' +
          'kapanmaz**: hata mesajı okunmadan kaybolmamalı. Fareyle üzerine gelince sayaç durur.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'notification',
      useWhen: ['Onaylama, reddetme veya kaydetme sonucu bildirilirken'],
      doNotUseWhen: [
        'Kalıcı uyarı gerekiyorsa — Alert kullanın',
        'Kritik bilgi veya tek çıkış yolu ise — toast kaybolur',
      ],
    },
  },

  args: {
    open: true,
    tone: 'success',
    title: 'İlan onaylandı ve yayına alındı',
    durationMs: 5000,
    onOpenChange: fn(),
  },

  argTypes: {
    tone: { control: 'inline-radio', options: ['success', 'warning', 'danger', 'info'] },
    durationMs: { control: 'number' },
    open: { control: 'boolean' },
    action: { control: false },
  },

  decorators: [
    (Story) => (
      <div style={{ minHeight: '14rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toast>

export default meta

type Story = StoryObj<typeof meta>

export const Success: Story = {
  // Otomatik kapanma story'yi bozmasin diye kapali.
  args: { durationMs: 0 },
}

export const Info: Story = {
  args: { tone: 'info', title: 'Değişiklikler kaydedildi', durationMs: 0 },
}

export const Warning: Story = {
  args: {
    tone: 'warning',
    title: '3 ilan onaylandı, 1 ilan atlandı',
    description: 'Atlanan ilan başka bir moderatör tarafından değiştirilmiş.',
    durationMs: 0,
  },
}

/** Hata toast'ı otomatik kapanmaz — kullanıcı okumadan kaybolmamalı. */
export const Danger: Story = {
  args: {
    tone: 'danger',
    title: 'İlan reddedilemedi',
    description: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
  },
}

export const WithAction: Story = {
  args: {
    tone: 'success',
    title: 'İlan arşive taşındı',
    action: { label: 'Geri al', onClick: fn() },
    durationMs: 0,
  },
}

export const WithDescription: Story = {
  args: {
    title: 'Toplu işlem tamamlandı',
    description: '12 ilan onaylandı ve yayına alındı.',
    durationMs: 0,
  },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    title: 'İlan onaylandı',
    description: 'Mobilde tam genişlik ve güvenli alan payı.',
    durationMs: 0,
  },
}

export const Interactive: Story = {
  args: { open: false },
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    return (
      <div style={{ padding: '2rem' }}>
        <Button onClick={() => setOpen(true)}>Toast göster (5sn)</Button>
        <Toast {...args} open={open} onOpenChange={setOpen} durationMs={5000} />
      </div>
    )
  },
}

/** Hata `role="alert"`, başarı `role="status"` ile duyurulmalı. */
export const AnnouncesCorrectly: Story = {
  args: { tone: 'danger', title: 'İlan reddedilemedi' },
  play: async () => {
    const body = within(document.body)
    await expect(await body.findByRole('alert')).toHaveTextContent('İlan reddedilemedi')
  },
}

export const VariantsComparison: Story = {
  args: { open: false },
  render: function Render(args) {
    const [tone, setTone] = useState<'success' | 'warning' | 'danger' | 'info' | null>(null)
    return (
      <div style={{ padding: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {(['success', 'warning', 'danger', 'info'] as const).map((t) => (
          <Button key={t} variant="secondary" onClick={() => setTone(t)}>
            {t}
          </Button>
        ))}
        {tone !== null ? (
          <Toast
            {...args}
            open
            tone={tone}
            title={`${tone} bildirimi`}
            description="Örnek açıklama metni."
            durationMs={0}
            onOpenChange={() => setTone(null)}
          />
        ) : null}
      </div>
    )
  },
}
