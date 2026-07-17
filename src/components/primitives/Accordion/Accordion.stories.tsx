import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { AccordionItem } from '../../../types/component-props'
import { Accordion } from './Accordion'
import { cokluKopyaLandmarkMuafiyeti } from '../../../storybook/a11y'

const OZNITELIK_GRUPLARI: AccordionItem[] = [
  {
    id: 'temel',
    title: 'Temel bilgiler',
    description: 'Başlık, açıklama, kategori',
    content: 'İlanın kamuya gösterilen içeriği burada düzenlenir.',
  },
  {
    id: 'gayrimenkul',
    title: 'Gayrimenkul özellikleri',
    description: 'm², oda sayısı, ısıtma, tapu durumu',
    content: 'Kategoriye özel öznitelikler burada görünür.',
  },
  {
    id: 'konum',
    title: 'Konum',
    description: 'İl, ilçe, mahalle, koordinat',
    content: 'Kesin adresin son kullanıcıya gösterilip gösterilmeyeceği burada ayarlanır.',
  },
  {
    id: 'moderasyon',
    title: 'Moderasyon',
    description: 'Otomatik kontroller ve karar geçmişi',
    content: 'Bu bölüm yalnızca yetkili rollere görünür.',
  },
]

const meta = {
  title: 'Primitives/Accordion',
  component: Accordion,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Açılır içerik bölümleri. Mobilde `Tabs`’a tercih edilir — dar ekranda sekme başlıkları ' +
          'sığmaz, açılır bölümler dikey akışa doğal uyar. Açık/kapalı yalnız renkle değil, dönen ' +
          'okla da anlatılır.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'layout',
      useWhen: ['Mobilde ilan detayı bölümlere ayrılırken', 'Öznitelik grupları gösterilirken'],
      doNotUseWhen: ['Masaüstünde az bölüm varsa — Tabs daha uygun'],
    },
  },

  args: {
    items: OZNITELIK_GRUPLARI,
    expandedIds: ['temel'],
    allowMultiple: true,
    variant: 'separated',
    onExpandedIdsChange: fn(),
  },

  argTypes: {
    variant: { control: 'inline-radio', options: ['separated', 'bordered', 'plain'] },
    allowMultiple: { control: 'boolean' },
    items: { control: false },
    expandedIds: { control: false },
  },

  decorators: [
    (Story) => (
      <div style={{ width: 'min(100%, 38rem)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Accordion>

export default meta

type Story = StoryObj<typeof meta>

export const Separated: Story = {}

export const Bordered: Story = {
  args: { variant: 'bordered' },
}

export const Plain: Story = {
  args: { variant: 'plain' },
}

export const AllCollapsed: Story = {
  args: { expandedIds: [] },
}

export const MultipleExpanded: Story = {
  args: { expandedIds: ['temel', 'konum'] },
}

export const WithDisabled: Story = {
  args: {
    items: [
      ...OZNITELIK_GRUPLARI.slice(0, 2),
      {
        id: 'audit',
        title: 'Audit log',
        description: 'Bu yetkiye sahip değilsiniz',
        disabled: true,
        content: 'Görünmez.',
      },
    ],
  },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
}

export const Interactive: Story = {
  render: function Render(args) {
    const [expanded, setExpanded] = useState<string[]>(['temel'])
    return <Accordion {...args} expandedIds={expanded} onExpandedIdsChange={setExpanded} />
  },
}

/** Başlığa tıklayınca bölüm gerçekten açılıyor mu? */
export const TogglesOnClick: Story = {
  args: { expandedIds: [] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: /Konum/ })

    await userEvent.click(trigger)
    await expect(args.onExpandedIdsChange).toHaveBeenCalledWith(['konum'])
  },
}

export const VariantsComparison: Story = {
  /*
    Base UI'ın Accordion paneli `role="region"` + tetikleyicisinden ad alıyor;
    aynı başlıkları taşıyan iki akordeon yan yana konunca iki özdeş adlı bölge
    oluyor. Tek akordeonda (uygulamadaki hâli) böyle bir şey yok.
  */
  parameters: cokluKopyaLandmarkMuafiyeti,
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <Accordion {...args} variant="separated" items={OZNITELIK_GRUPLARI.slice(0, 2)} />
      <Accordion {...args} variant="bordered" items={OZNITELIK_GRUPLARI.slice(0, 2)} />
      <Accordion {...args} variant="plain" items={OZNITELIK_GRUPLARI.slice(0, 2)} />
    </div>
  ),
}
