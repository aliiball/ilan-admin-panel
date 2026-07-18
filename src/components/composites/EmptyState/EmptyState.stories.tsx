import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { FileQuestion, Inbox, SearchX } from 'lucide-react'
import { Button } from '../../primitives/Button'
import { EmptyState } from './EmptyState'

const VARYANTLAR = ['default', 'compact', 'filtered'] as const

const meta = {
  title: 'Composites/EmptyState',
  component: EmptyState,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Boş veri ve boş filtre sonucu. Boşluğun iki sebebi vardır ve kullanıcının atacağı ' +
          'adım da farklıdır: hiç kayıt yoksa **oluşturmak**, filtre elediyse **filtreyi ' +
          'gevşetmek**. `variant="filtered"` bu ayrımı kesik kenarlıkla kurar. Eylemleri kendi ' +
          'uydurmaz — sayfa katmanı `primaryAction` ile geçer. Başlık `<p>`’dir: component hangi ' +
          'başlık seviyesinde durduğunu bilemez, yanlış seviye belge taslağını bozar.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'state-display',
      useWhen: ['Liste, tablo veya panel gösterecek kaydı olmadığında'],
      doNotUseWhen: [
        'Veri çekilemediyse — ErrorState kullanın, boşluk ile hata aynı şey değildir',
        'Veri hâlâ yükleniyorsa — Skeleton kullanın',
      ],
    },
  },

  args: {
    title: 'Henüz ilan eklenmemiş',
    description: 'Yeni ilanlar geldikçe burada listelenecek.',
    variant: 'default',
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    title: { control: 'text' },
    description: { control: 'text' },
    headingLevel: { control: 'inline-radio', options: [undefined, 2, 3, 4, 5, 6] },
    illustration: { control: false },
    primaryAction: { control: false },
    secondaryAction: { control: false },
  },
} satisfies Meta<typeof EmptyState>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    illustration: <Inbox size={48} />,
  },
}

export const WithActions: Story = {
  args: {
    illustration: <Inbox size={48} />,
    primaryAction: <Button>İlan oluştur</Button>,
    secondaryAction: <Button variant="secondary">Nasıl çalışır?</Button>,
  },
}

/** Kart, panel veya tablo içinde: aynı mesaj, daha az dikey alan. */
export const Compact: Story = {
  args: {
    variant: 'compact',
    illustration: <Inbox size={32} />,
    title: 'Bu kullanıcının ilanı yok',
    description: 'Hesap açıldığından beri ilan girilmemiş.',
  },
}

/**
 * Veri *yok* değil, *bu filtreye uyan* yok. Kesik kenarlık ve "filtreleri
 * temizle" eylemi bu farkı anlatır — kullanıcıyı yeni kayıt oluşturmaya değil,
 * filtreyi gevşetmeye yönlendirir.
 */
export const Filtered: Story = {
  args: {
    variant: 'filtered',
    illustration: <SearchX size={40} />,
    title: 'Filtrelere uyan ilan yok',
    description: 'Seçili durum, kategori ve tarih aralığında kayıt bulunamadı.',
    primaryAction: <Button variant="secondary">Filtreleri temizle</Button>,
  },
}

export const NoIllustration: Story = {
  args: {
    title: 'Moderasyon kuyruğu boş',
    description: 'İncelenmeyi bekleyen ilan kalmadı.',
  },
}

/** Uzun içerik: başlık sarmalı, açıklama `44ch`’te sınırlanıp okunur kalmalı. */
export const LongContent: Story = {
  args: {
    illustration: <FileQuestion size={48} />,
    title:
      'Seçtiğiniz kategori, il, ilçe ve tarih aralığı kombinasyonuna uyan hiçbir ilan bulunamadı',
    description:
      'Arama kriterleriniz oldukça dar görünüyor. Kategori seçimini genişletmeyi, tarih ' +
      'aralığını uzatmayı veya konum filtresini il düzeyine çıkarmayı deneyebilirsiniz. ' +
      'Filtreleri tamamen temizleyip baştan başlamak da bir seçenek.',
    primaryAction: <Button variant="secondary">Filtreleri temizle</Button>,
  },
}

/** Dar ekranda eylemler alt alta sarmalı, taşmamalı. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    illustration: <Inbox size={40} />,
    primaryAction: <Button>İlan oluştur</Button>,
    secondaryAction: <Button variant="secondary">Nasıl çalışır?</Button>,
  },
}

/**
 * Düzeyini bilen bir tam sayfa ekran `headingLevel` geçer; başlık gerçek bir
 * `<h{n}>` olur. Element türü rol/etiketle ölçülüyor (görünürlük veya metin
 * yeterli değil — `<p>` de aynı metni taşır).
 */
export const HeadingLevel: Story = {
  args: {
    headingLevel: 2,
    illustration: <Inbox size={48} />,
    title: 'Henüz ilan eklenmemiş',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const heading = canvas.getByRole('heading', { level: 2 })
    await expect(heading).toHaveTextContent(args.title)
  },
}

/**
 * `headingLevel` verilmezse başlık `<p>` kalır (Faz 3 öncesi davranış, geriye
 * dönük uyum): erişilebilirlik ağacında **hiç** heading olmamalı — kör bir `<h3>`
 * `heading-order` ihlali riskiydi.
 */
export const TitleIsNotAHeadingByDefault: Story = {
  args: {
    illustration: <Inbox size={48} />,
    title: 'Henüz ilan eklenmemiş',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('heading')).not.toBeInTheDocument()
  },
}

export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <EmptyState
            {...args}
            variant={variant}
            illustration={variant === 'filtered' ? <SearchX size={40} /> : <Inbox size={40} />}
            title={variant === 'filtered' ? 'Filtrelere uyan ilan yok' : 'Henüz ilan eklenmemiş'}
            primaryAction={
              variant === 'filtered' ? (
                <Button variant="secondary">Filtreleri temizle</Button>
              ) : (
                <Button>İlan oluştur</Button>
              )
            }
          />
        </div>
      ))}
    </div>
  ),
}
