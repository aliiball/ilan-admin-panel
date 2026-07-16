import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { TabItem } from '../../../types/component-props'
import { Tabs } from './Tabs'

const ILAN_SEKMELERI: TabItem[] = [
  { id: 'bilgi', label: 'İlan bilgileri', content: 'Kategoriye özel tüm öznitelikler burada.' },
  {
    id: 'moderasyon',
    label: 'Moderasyon',
    badge: 2,
    content: 'Otomatik kontroller ve red gerekçeleri.',
  },
  { id: 'gecmis', label: 'Geçmiş', content: 'Moderasyon olayları ve revizyonlar.' },
  { id: 'sikayet', label: 'Şikayetler', badge: 3, content: 'Bu ilana açılan şikayetler.' },
]

const meta = {
  title: 'Primitives/Tabs',
  component: Tabs,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Ok tuşlarıyla gezinme ve panel bağlantısı Base UI’dan gelir. Seçili sekme yalnız ' +
          'renkle değil, alt çizgi veya dolgu ile de belli olur. Sekmeler taşarsa yatay ' +
          'kaydırılır, kesilmez.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'navigation',
      useWhen: [
        'İlan detayında bilgi/moderasyon/geçmiş ayrılırken',
        'Ayarlarda bölümler ayrılırken',
      ],
      doNotUseWhen: ['Bölümler aynı anda görünmeliyse — Accordion kullanın'],
    },
  },

  args: {
    value: 'bilgi',
    items: ILAN_SEKMELERI,
    variant: 'underline',
    orientation: 'horizontal',
    onValueChange: fn(),
  },

  argTypes: {
    variant: { control: 'inline-radio', options: ['underline', 'pill', 'contained'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    items: { control: false },
  },

  decorators: [
    (Story) => (
      <div style={{ width: 'min(100%, 42rem)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof meta>

export const Underline: Story = {}

export const Pill: Story = {
  args: { variant: 'pill' },
}

export const Contained: Story = {
  args: { variant: 'contained' },
}

export const Vertical: Story = {
  args: { orientation: 'vertical' },
}

export const WithBadges: Story = {
  args: { value: 'moderasyon' },
}

export const WithDisabled: Story = {
  args: {
    items: [
      ...ILAN_SEKMELERI.slice(0, 2),
      { id: 'audit', label: 'Audit log', disabled: true, content: 'Bu yetkiye sahip değilsiniz.' },
    ],
  },
}

/** Çok sekme yatay kaydırılır, kesilmez. */
export const Overflow: Story = {
  args: {
    items: Array.from({ length: 10 }, (_, i) => ({
      id: `sekme-${i}`,
      label: `Uzun sekme başlığı ${i + 1}`,
      content: `${i + 1}. sekmenin içeriği`,
    })),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '28rem' }}>
        <Story />
      </div>
    ),
  ],
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
}

export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('bilgi')
    return <Tabs {...args} value={value} onValueChange={setValue} />
  },
}

/**
 * Klavye: ok tuşu odağı taşır, Enter/Space seçer (manuel aktivasyon).
 *
 * Otomatik aktivasyon olsaydı 5 sekme arasında gezinmek 5 ayrı veri isteği
 * tetiklerdi; panelleri veri çeken sekmelerde manuel aktivasyon doğru olanıdır.
 */
export const KeyboardNavigation: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const ilk = canvas.getByRole('tab', { name: /İlan bilgileri/ })
    const ikinci = canvas.getByRole('tab', { name: /Moderasyon/ })

    ilk.focus()

    // Ok tusu yalnizca odagi tasir, secim degismez.
    await userEvent.keyboard('{ArrowRight}')
    await expect(ikinci).toHaveFocus()
    await expect(args.onValueChange).not.toHaveBeenCalled()

    // Secim Enter ile yapilir.
    await userEvent.keyboard('{Enter}')
    await expect(args.onValueChange).toHaveBeenCalledWith('moderasyon')
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <Tabs {...args} variant="underline" />
      <Tabs {...args} variant="pill" />
      <Tabs {...args} variant="contained" />
    </div>
  ),
}
