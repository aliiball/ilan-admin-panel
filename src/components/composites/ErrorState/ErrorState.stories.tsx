import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ErrorState } from './ErrorState'

const VARYANTLAR = ['page', 'section', 'inline'] as const

const meta = {
  title: 'Composites/ErrorState',
  component: ErrorState,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Hata ve yeniden deneme. `role="alert"` taşır — hata veri yerine geçtiği an ekran ' +
          'okuyucuya duyurulur. `onRetry` verilmezse buton hiç çıkmaz; bu `UiError.retryable` ' +
          'ile eşleşir: tekrar denemenin işe yaramayacağı bir hatada buton sunmak kullanıcıyı ' +
          'boşa uğraştırır. Hata yalnız renkle anlatılmaz — üçgen ikon ve metin de vardır. ' +
          '`description` kullanıcıya ne yapacağını söyler; ham sunucu mesajı `code` alanına girer.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'state-display',
      useWhen: ['Veri çekilemediğinde veya işlem başarısız olduğunda'],
      doNotUseWhen: [
        'Kayıt yoksa — EmptyState kullanın, boşluk hata değildir',
        'Form alanı hatası için — Input/FieldShell’in `error` prop’unu kullanın',
        'Geçici işlem bildirimi için — Toast kullanın',
      ],
    },
  },

  /**
   * `onRetry` bilerek burada yok. `exactOptionalPropertyTypes` açıkken meta'ya
   * `fn()` konursa prop'un tipi `Mock`'a sabitlenir ve "tekrar denenemez"
   * story'leri onu `undefined` ile geri alamaz. İhtiyacı olan story kendi verir.
   */
  args: {
    title: 'İlanlar yüklenemedi',
    description: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
    variant: 'page',
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    title: { control: 'text' },
    description: { control: 'text' },
    code: { control: 'text' },
    retryLabel: { control: 'text' },
  },
} satisfies Meta<typeof ErrorState>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onRetry: fn() },
}

/** Tekrar denenebilir hata: ağ zaman aşımı. Destek için kod da gösteriliyor. */
export const Retryable: Story = {
  args: {
    code: 'NETWORK_TIMEOUT',
    onRetry: fn(),
  },
}

/**
 * Tekrar denemek işe yaramaz: yetki eksikse aynı istek yine reddedilir.
 * `onRetry` verilmediği için buton hiç render edilmez.
 */
export const NonRetryable: Story = {
  args: {
    title: 'Bu sayfayı görme yetkiniz yok',
    description: 'İlan moderasyonu yetkisi hesabınıza tanımlı değil. Yöneticinizle görüşün.',
    code: 'FORBIDDEN',
  },
}

export const Page: Story = {
  args: { variant: 'page', code: 'NETWORK_TIMEOUT', onRetry: fn() },
}

/** Panel içeriği yüklenemedi; sayfanın kalanı ayakta kalır. */
export const Section: Story = {
  args: {
    variant: 'section',
    title: 'Moderasyon geçmişi yüklenemedi',
    description: 'Bu ilanın olay kaydına şu an ulaşılamıyor.',
    onRetry: fn(),
  },
}

/** Dar alan: tek satır, eylem sağda. Toolbar ve form içi için. */
export const Inline: Story = {
  args: {
    variant: 'inline',
    title: 'Kategori listesi yüklenemedi',
    description: 'Filtre seçenekleri eksik olabilir.',
    onRetry: fn(),
  },
}

export const CustomRetryLabel: Story = {
  args: { retryLabel: 'Yeniden yükle', onRetry: fn() },
}

/** Uzun içerik: açıklama `52ch`’te sınırlanıp okunur kalmalı, kutuyu taşırmamalı. */
export const LongContent: Story = {
  args: {
    title: 'İlan listesi sunucudan alınırken beklenmeyen bir hata oluştu ve istek tamamlanamadı',
    description:
      'Sunucu isteği kabul etti ancak yanıt süresi içinde tamamlanamadı. Bu genellikle geçici ' +
      'bir yoğunluktan kaynaklanır ve birkaç saniye içinde düzelir. Sorun devam ederse hata ' +
      'kodunu destek ekibiyle paylaşın; kayıtlarda bu kodla arama yapabiliyorlar.',
    code: 'GATEWAY_TIMEOUT_504',
    onRetry: fn(),
  },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'section', code: 'NETWORK_TIMEOUT', onRetry: fn() },
}

/**
 * Hata duyurulmalı ve tekrar deneme çalışmalı.
 *
 * `role="alert"` DOM'dan ölçülüyor: testler stil ve erişilebilirlik iddialarında
 * "geçti" deyip yanılabiliyor, bu yüzden rol doğrudan sorgulanıyor.
 */
export const AnnouncesAndRetries: Story = {
  args: { code: 'NETWORK_TIMEOUT', onRetry: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('İlanlar yüklenemedi')

    await userEvent.click(canvas.getByRole('button', { name: /Tekrar dene/ }))
    await expect(args.onRetry).toHaveBeenCalled()
  },
}

/** Tekrar denenemeyen hatada buton hiç olmamalı — kapalı buton bile değil. */
export const NonRetryableHasNoButton: Story = {
  args: {
    title: 'Bu sayfayı görme yetkiniz yok',
    description: 'İlan moderasyonu yetkisi hesabınıza tanımlı değil.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

export const VariantsComparison: Story = {
  args: { onRetry: fn() },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <ErrorState {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
