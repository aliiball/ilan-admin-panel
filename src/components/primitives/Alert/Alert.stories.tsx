import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Button } from '../Button'
import { Alert } from './Alert'

const TONES = ['success', 'warning', 'danger', 'info'] as const
const VARIANTS = ['solid', 'soft', 'outline'] as const

const meta = {
  title: 'Primitives/Alert',
  component: Alert,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Kalıcı veya kapatılabilir bildirim. `danger` ve `warning` `role="alert"` ile anında ' +
          'duyurulur; `success` ve `info` `role="status"` ile kibarca bildirilir. Geçici işlem ' +
          'geri bildirimi için `Toast` kullanın.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'notification',
      useWhen: ['Hata gösterilirken', 'Bayat veri uyarısı verilirken', 'Kalıcı uyarı gerekirken'],
      doNotUseWhen: ['Mutation sonucu bildirilirken — Toast kullanın'],
    },
  },

  args: {
    tone: 'info',
    variant: 'soft',
    title: 'Veriler 5 dakika önce güncellendi',
    dismissible: false,
    onDismiss: fn(),
  },

  argTypes: {
    tone: { control: 'inline-radio', options: TONES },
    variant: { control: 'inline-radio', options: VARIANTS },
    dismissible: { control: 'boolean' },
    action: { control: false },
  },
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>

export const Info: Story = {}

export const Success: Story = {
  args: { tone: 'success', title: 'İlan onaylandı ve yayına alındı' },
}

export const Warning: Story = {
  args: {
    tone: 'warning',
    title: 'İlanın süresi 2 gün içinde doluyor',
    description: 'Süre dolduğunda ilan otomatik olarak yayından kalkar.',
  },
}

export const Danger: Story = {
  args: {
    tone: 'danger',
    title: 'İlan yüklenemedi',
    description: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
  },
}

export const WithDescription: Story = {
  args: {
    tone: 'info',
    title: 'Bu ilan başka bir moderatör tarafından inceleniyor',
    description: 'Ahmet Yılmaz 3 dakika önce ilanı sahiplendi. Karar verene kadar bekleyin.',
  },
}

export const WithAction: Story = {
  args: {
    tone: 'danger',
    title: 'Veriler yenilenemedi',
    description: 'Son başarılı veri gösteriliyor.',
    action: (
      <Button size="sm" variant="secondary">
        Tekrar dene
      </Button>
    ),
  },
}

export const Dismissible: Story = {
  args: { dismissible: true, tone: 'success', title: 'Değişiklikler kaydedildi' },
}

/** Uzun metinde ikon üstte kalır, metin sarar ve taşma olmaz. */
export const LongContent: Story = {
  args: {
    tone: 'warning',
    title: 'Bu ilanda otomatik kontroller uyarı üretti',
    description:
      'Açıklama metninde harici iletişim bilgisi olabileceği tespit edildi, fotoğrafların çözünürlüğü sınırda ve fiyat kategori ortalamasının belirgin şekilde altında. Yayına almadan önce ilanı elle inceleyin.',
    dismissible: true,
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem', width: 'min(100%, 40rem)' }}>
      {VARIANTS.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          {TONES.map((tone) => (
            <Alert key={tone} {...args} tone={tone} variant={variant} title={`${tone} bildirimi`} />
          ))}
        </div>
      ))}
    </div>
  ),
}
