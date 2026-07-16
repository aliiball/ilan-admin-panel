import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Archive, Info } from 'lucide-react'
import { Button } from '../Button'
import { IconButton } from '../IconButton'
import { Tooltip } from './Tooltip'

const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,

  tags: ['stable'],

  parameters: {
    docs: {
      description: {
        component:
          'İkonun anlamını fare ve klavye kullanıcısına görsel olarak gösterir. ' +
          '**`content` tetikleyicinin erişilebilir adıyla yakından eşleşmelidir:** tooltip ekran ' +
          'okuyucuya hiçbir şey söylemez (Base UI bunu bilerek yapmaz), dokunmatik cihazda da hiç ' +
          'açılmaz. Etiketten farklı bir bilgi koyarsanız o bilgi bu kullanıcılara ulaşmaz — ' +
          'ek bilgi görünür metne veya `Alert`’e yazılır.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'help',
      useWhen: ['Yalnız ikonlu butonun anlamı fare kullanıcısına gösterilirken'],
      doNotUseWhen: [
        'Etiketten farklı bir bilgi verilecekse — ekran okuyucu ve dokunmatik kullanıcı göremez',
        'Bilgi kritikse — görünür metin veya Alert kullanın',
      ],
    },
  },

  args: {
    content: 'Arşivle',
    placement: 'top',
    delayMs: 200,
    disabled: false,
  },

  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    delayMs: { control: 'number' },
    disabled: { control: 'boolean' },
    children: { control: false },
  },

  decorators: [
    (Story) => (
      <div style={{ padding: '3rem', display: 'grid', placeItems: 'center' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>

export default meta

type Story = StoryObj<typeof meta>

/** Doğru kullanım: tooltip metni butonun etiketiyle aynı. */
export const Default: Story = {
  args: { children: <IconButton icon={<Archive size={18} />} label="Arşivle" /> },
}

export const OnButton: Story = {
  args: {
    content: 'Toplu onayla',
    children: <Button variant="secondary">Toplu onayla</Button>,
  },
}

export const Top: Story = {
  args: {
    placement: 'top',
    content: 'Bilgi',
    children: <IconButton icon={<Info size={18} />} label="Bilgi" />,
  },
}

export const Right: Story = {
  args: {
    placement: 'right',
    content: 'Bilgi',
    children: <IconButton icon={<Info size={18} />} label="Bilgi" />,
  },
}

export const Bottom: Story = {
  args: {
    placement: 'bottom',
    content: 'Bilgi',
    children: <IconButton icon={<Info size={18} />} label="Bilgi" />,
  },
}

export const Left: Story = {
  args: {
    placement: 'left',
    content: 'Bilgi',
    children: <IconButton icon={<Info size={18} />} label="Bilgi" />,
  },
}

/**
 * Uzun metin sarar ve 18rem'i aşmaz — ama bu YANLIŞ kullanımdır.
 * Bu kadar bilgi tooltip'e sığdırılıyorsa görünür metne taşınmalıdır;
 * story yalnızca taşma davranışını göstermek için var.
 */
export const LongContentAntiPattern: Story = {
  args: {
    content:
      'Bu ilan otomatik kontrollerde uyarı üretti: açıklamada harici iletişim bilgisi olabilir ve fotoğraf çözünürlüğü sınırda.',
    children: <IconButton icon={<Info size={18} />} label="Uyarı detayı" />,
  },
}

/** Devre dışıyken tooltip hiç kurulmaz, tetikleyici olduğu gibi render olur. */
export const Disabled: Story = {
  args: { disabled: true, children: <Button variant="secondary">Tooltip yok</Button> },
}

/**
 * Klavye ile odaklanınca açılmalı — sadece fareyle değil.
 *
 * Not: `role="tooltip"` aranmaz, çünkü Base UI bilerek rol atamaz; popup görsel
 * bir katmandır. Doğrulama metnin görünür olmasıyla yapılır.
 */
export const OpensOnKeyboardFocus: Story = {
  args: {
    content: 'Arşivle',
    children: <IconButton icon={<Archive size={18} />} label="Arşivle" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Arşivle' })

    await userEvent.tab()
    await expect(trigger).toHaveFocus()

    // Popup portal'a gider, body icinde aranir.
    const body = within(document.body)
    await expect(await body.findByText('Arşivle', {}, { timeout: 2000 })).toBeVisible()

    await userEvent.keyboard('{Escape}')
  },
}

export const VariantsComparison: Story = {
  args: { children: <IconButton icon={<Info size={18} />} label="Bilgi" /> },
  render: (args) => (
    <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
      <Tooltip {...args} placement="top" content="Üst">
        <IconButton icon={<Info size={18} />} label="Üst" />
      </Tooltip>
      <Tooltip {...args} placement="right" content="Sağ">
        <IconButton icon={<Info size={18} />} label="Sağ" />
      </Tooltip>
      <Tooltip {...args} placement="bottom" content="Alt">
        <IconButton icon={<Info size={18} />} label="Alt" />
      </Tooltip>
      <Tooltip {...args} placement="left" content="Sol">
        <IconButton icon={<Info size={18} />} label="Sol" />
      </Tooltip>
    </div>
  ),
}
