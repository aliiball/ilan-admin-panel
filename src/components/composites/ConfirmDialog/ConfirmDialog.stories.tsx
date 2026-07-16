import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '../../primitives/Button'
import { ConfirmDialog } from './ConfirmDialog'

const meta = {
  title: 'Composites/ConfirmDialog',
  component: ConfirmDialog,

  tags: ['stable'],

  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`Modal` üzerine kurulu, tek soruya indirgenmiş onay dialog’u. **Yıkıcı eylem ilk ' +
          'odağı almaz**: DOM sırasında ilk odaklanabilir element kapatma butonudur, onay en ' +
          'sondadır — açılır açılmaz Enter’a basan kullanıcı silmeyi başlatmaz. `requireText` ' +
          'verilirse metin birebir yazılana kadar onay kapalıdır ve her açılışta sıfırlanır. ' +
          '`loading` sürerken dialog `Escape` ve dışarı tıklama ile kapanmaz — istek uçarken ' +
          'dialog kaybolursa kullanıcı sonucu hiç görmez.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'overlay',
      useWhen: ['Geri alınamayan bir eylem onaylatılırken (silme, banlama, toplu reddetme)'],
      doNotUseWhen: [
        'Form veya detay gösterilecekse — Modal kullanın',
        'Eylem geri alınabiliyorsa — doğrudan uygulayıp Toast ile "Geri al" sunun',
      ],
    },
  },

  args: {
    open: true,
    title: 'İlanı arşivle',
    description: 'Arşivlenen ilan listelerden kalkar. İstenirse daha sonra geri alınabilir.',
    confirmLabel: 'Arşivle',
    tone: 'neutral',
    loading: false,
    onConfirm: fn(),
    onCancel: fn(),
  },

  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'danger'] },
    open: { control: 'boolean' },
    loading: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    confirmLabel: { control: 'text' },
    cancelLabel: { control: 'text' },
    requireText: { control: 'text' },
  },
} satisfies Meta<typeof ConfirmDialog>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Neutral: Story = {
  args: { tone: 'neutral' },
}

/** Geri alınamayan eylem: onay butonu yıkıcı stilde. */
export const Danger: Story = {
  args: {
    tone: 'danger',
    title: 'İlanı kalıcı olarak sil',
    description: 'Bu işlem geri alınamaz. İlan ve tüm fotoğrafları kalıcı olarak silinir.',
    confirmLabel: 'Kalıcı olarak sil',
  },
}

/** İstek uçarken: onayda spinner, vazgeçme kapalı, dialog kapanmaz. */
export const Loading: Story = {
  args: { tone: 'danger', confirmLabel: 'Kalıcı olarak sil', loading: true },
}

/**
 * Yazarak onay: 12 ilanı tek tıkla silmek, yanlışlıkla yapılabilecek en pahalı
 * hatadır. Metni yazmak kullanıcıyı ne yaptığını okumaya zorlar.
 */
export const TypedConfirmation: Story = {
  args: {
    tone: 'danger',
    title: '12 ilanı kalıcı olarak sil',
    description: 'Bu işlem geri alınamaz. Seçili 12 ilan ve fotoğrafları kalıcı olarak silinir.',
    confirmLabel: 'Kalıcı olarak sil',
    requireText: 'SİL',
  },
}

export const CustomCancelLabel: Story = {
  args: { cancelLabel: 'Vazgeçtim' },
}

export const Closed: Story = {
  args: { open: false },
}

/** Uzun içerik: başlık ve açıklama sarmalı, dialog taşmamalı. */
export const LongContent: Story = {
  args: {
    tone: 'danger',
    title: 'Seçili 1.284 ilanı gerekçe bildirmeden kalıcı olarak sil',
    description:
      'Bu işlem geri alınamaz. Seçili ilanların tamamı, yüklenmiş fotoğrafları, moderasyon ' +
      'geçmişleri ve bunlara bağlı şikayet kayıtları kalıcı olarak silinir. İlan sahiplerine ' +
      'bildirim gitmez ve silinen kayıtlar denetim kaydında yalnız kimlikleriyle görünür.',
    confirmLabel: 'Anladım, kalıcı olarak sil',
    requireText: 'KALICI OLARAK SİL',
  },
}

/** Mobilde butonlar alt alta; onay en altta, başparmağa yakın. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { tone: 'danger', confirmLabel: 'Kalıcı olarak sil', requireText: 'SİL' },
}

/**
 * Yıkıcı eylem ilk odağı almamalı: dialog açılır açılmaz Enter'a basmak silmeyi
 * başlatmamalı.
 */
export const ConfirmDoesNotTakeInitialFocus: Story = {
  args: { tone: 'danger', confirmLabel: 'Kalıcı olarak sil' },
  play: async ({ args }) => {
    // Dialog portal'da: `canvasElement` içinde değil, `document.body` altında.
    const body = within(document.body)

    await expect(await body.findByRole('dialog')).toBeInTheDocument()
    await expect(body.getByRole('button', { name: 'Kalıcı olarak sil' })).not.toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await expect(args.onConfirm).not.toHaveBeenCalled()
  },
}

/** Metin yazılana kadar onay kapalı, birebir yazılınca açılmalı. */
export const TypedConfirmationGatesConfirm: Story = {
  args: {
    tone: 'danger',
    title: '12 ilanı kalıcı olarak sil',
    description: 'Bu işlem geri alınamaz.',
    confirmLabel: 'Kalıcı olarak sil',
    requireText: 'SİL',
  },
  play: async ({ args }) => {
    const body = within(document.body)
    const onayla = body.getByRole('button', { name: 'Kalıcı olarak sil' })

    await expect(onayla).toBeDisabled()

    // Yanlış metin açmamalı.
    const kutu = body.getByRole('textbox')
    await userEvent.type(kutu, 'sil')
    await expect(onayla).toBeDisabled()

    await userEvent.clear(kutu)
    await userEvent.type(kutu, 'SİL')
    await expect(onayla).toBeEnabled()

    await userEvent.click(onayla)
    await expect(args.onConfirm).toHaveBeenCalled()
  },
}

/** `loading` sürerken Escape dialog'u kapatmamalı: istek uçarken sonuç kaybolur. */
export const LoadingIgnoresEscape: Story = {
  args: { tone: 'danger', confirmLabel: 'Kalıcı olarak sil', loading: true },
  play: async ({ args }) => {
    const body = within(document.body)
    await expect(await body.findByRole('dialog')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    await expect(args.onCancel).not.toHaveBeenCalled()
  },
}

/** `loading` yokken Escape vazgeçme sayılmalı. */
export const EscapeCancels: Story = {
  play: async ({ args }) => {
    const body = within(document.body)
    await expect(await body.findByRole('dialog')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    await expect(args.onCancel).toHaveBeenCalled()
  },
}

/**
 * Gerçek akış: tetikleyiciden açılır, yazılan metin **her açılışta sıfırlanır**.
 * Sıfırlanmasaydı ikinci açılışta onay butonu önceki yazının mirasıyla açık gelirdi.
 */
export const Interactive: Story = {
  render: function Render(args) {
    const [acik, setAcik] = useState(false)
    const [sonuc, setSonuc] = useState('Henüz işlem yapılmadı.')

    return (
      <div style={{ display: 'grid', gap: '1rem', padding: '1rem', justifyItems: 'start' }}>
        <Button variant="danger" onClick={() => setAcik(true)}>
          12 ilanı sil
        </Button>
        <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>{sonuc}</span>

        <ConfirmDialog
          {...args}
          open={acik}
          tone="danger"
          title="12 ilanı kalıcı olarak sil"
          description="Bu işlem geri alınamaz. Seçili 12 ilan ve fotoğrafları silinir."
          confirmLabel="Kalıcı olarak sil"
          requireText="SİL"
          onConfirm={() => {
            setSonuc('12 ilan silindi.')
            setAcik(false)
          }}
          onCancel={() => {
            setSonuc('Vazgeçildi.')
            setAcik(false)
          }}
        />
      </div>
    )
  },
}
