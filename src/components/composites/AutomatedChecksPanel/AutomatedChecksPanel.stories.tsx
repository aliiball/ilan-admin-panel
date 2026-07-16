import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import {
  AutomatedCheckCode,
  AutomatedCheckResultStatus,
  type AutomatedCheckResult,
} from '../../../types/domain'
import { residentialPendingVilla } from '../../../fixtures'
import { AutomatedChecksPanel } from './AutomatedChecksPanel'

const VARYANTLAR = ['list', 'cards', 'summary'] as const

const kontrol = (
  code: AutomatedCheckCode,
  status: AutomatedCheckResultStatus,
  message: string,
  score?: number,
): AutomatedCheckResult => ({
  code,
  status,
  ...(score !== undefined && { score }),
  message,
  checkedAt: '2026-07-14T09:00:00+03:00',
})

/** Sekiz kontrolün tamamı geçmiş: temiz bir ilan. */
const HEPSI_GECTI: AutomatedCheckResult[] = [
  kontrol(
    AutomatedCheckCode.RequiredFields,
    AutomatedCheckResultStatus.Passed,
    'Zorunlu alanlar tamamlandı.',
  ),
  kontrol(
    AutomatedCheckCode.DuplicateContent,
    AutomatedCheckResultStatus.Passed,
    'Benzer içerikli aktif ilan bulunmadı.',
    0.04,
  ),
  kontrol(
    AutomatedCheckCode.PriceAnomaly,
    AutomatedCheckResultStatus.Passed,
    'Fiyat, mahalledeki benzer ilanların aralığında.',
    0.12,
  ),
  kontrol(
    AutomatedCheckCode.ContactInfoDetection,
    AutomatedCheckResultStatus.Passed,
    'Açıklamada harici iletişim bilgisi bulunmadı.',
  ),
  kontrol(
    AutomatedCheckCode.ImageQuality,
    AutomatedCheckResultStatus.Passed,
    'Fotoğrafların çözünürlüğü yeterli.',
    0.92,
  ),
  kontrol(
    AutomatedCheckCode.ImageSafety,
    AutomatedCheckResultStatus.Passed,
    'Görsellerde politika dışı içerik saptanmadı.',
    0.99,
  ),
  kontrol(
    AutomatedCheckCode.LocationConsistency,
    AutomatedCheckResultStatus.Passed,
    'Koordinat, girilen mahalle sınırları içinde.',
  ),
  kontrol(
    AutomatedCheckCode.FraudRisk,
    AutomatedCheckResultStatus.Passed,
    'Hesap ve ilan geçmişinde risk sinyali yok.',
    0.07,
  ),
]

/** Uyarılar var ama hiçbiri yayına engel değil — moderatör baksın, karar onun. */
const UYARILAR: AutomatedCheckResult[] = [
  ...HEPSI_GECTI.slice(0, 4),
  kontrol(
    AutomatedCheckCode.ImageQuality,
    AutomatedCheckResultStatus.Warning,
    'İki fotoğrafın çözünürlüğü sınırın hemen üstünde.',
    0.58,
  ),
  kontrol(
    AutomatedCheckCode.ImageSafety,
    AutomatedCheckResultStatus.Passed,
    'Görsellerde politika dışı içerik saptanmadı.',
    0.99,
  ),
  kontrol(
    AutomatedCheckCode.LocationConsistency,
    AutomatedCheckResultStatus.Warning,
    'Koordinat, girilen mahallenin 1,2 km dışında.',
    0.44,
  ),
  kontrol(
    AutomatedCheckCode.FraudRisk,
    AutomatedCheckResultStatus.Passed,
    'Hesap ve ilan geçmişinde risk sinyali yok.',
    0.07,
  ),
]

/** Bloklayıcı bulgular: `failed` olan kontrol yayına engeldir. */
const BASARISIZ: AutomatedCheckResult[] = [
  kontrol(
    AutomatedCheckCode.RequiredFields,
    AutomatedCheckResultStatus.Passed,
    'Zorunlu alanlar tamamlandı.',
  ),
  kontrol(
    AutomatedCheckCode.DuplicateContent,
    AutomatedCheckResultStatus.Failed,
    'Aynı gayrimenkule ait aktif bir ilan bulundu (1245789630).',
    0.94,
  ),
  kontrol(
    AutomatedCheckCode.PriceAnomaly,
    AutomatedCheckResultStatus.Warning,
    'Fiyat, benzer ilanların ortalamasının 3,4 katı.',
    0.71,
  ),
  kontrol(
    AutomatedCheckCode.ContactInfoDetection,
    AutomatedCheckResultStatus.Failed,
    'Açıklamada telefon numarası ve yönlendirme bağlantısı tespit edildi.',
    0.88,
  ),
  kontrol(
    AutomatedCheckCode.ImageQuality,
    AutomatedCheckResultStatus.Passed,
    'Fotoğrafların çözünürlüğü yeterli.',
    0.9,
  ),
  kontrol(
    AutomatedCheckCode.ImageSafety,
    AutomatedCheckResultStatus.Passed,
    'Görsellerde politika dışı içerik saptanmadı.',
    0.97,
  ),
  kontrol(
    AutomatedCheckCode.LocationConsistency,
    AutomatedCheckResultStatus.Passed,
    'Koordinat, girilen mahalle sınırları içinde.',
  ),
  kontrol(
    AutomatedCheckCode.FraudRisk,
    AutomatedCheckResultStatus.Warning,
    'Hesap son 24 saatte 14 ilan yayınladı.',
    0.63,
  ),
]

const meta = {
  title: 'Composites/AutomatedChecksPanel',
  component: AutomatedChecksPanel,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Domain tipini (`AutomatedCheckResult`) doğrudan alır — `listing.moderation.automatedChecks` ' +
          "olduğu gibi geçilir; etiket `domain/labels.ts`'ten gelir, sonucun içinde taşınmaz. " +
          "**`warning` bloklamaz, `failed` bloklar**: brifing 1.2'ye göre yayına geçişin koşulu " +
          '"bloklayıcı otomatik kontrol yok"; uyarı moderatörün bakmasını ister, kararını vermez. ' +
          'Panel bu ayrımı gösterir ama kararı vermez — onay butonunu ModerationActionBar yönetir.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'data-panel',
      useWhen: [
        'Moderasyon kuyruğunda veya ilan detayında otomatik kontrol sonuçları gösterilecekse',
      ],
      doNotUseWhen: [
        "Form doğrulama hataları için — alanın kendi `error` prop'unu kullanın",
        'Moderasyon geçmişi için — ModerationHistory kullanın',
      ],
    },
  },

  args: {
    items: HEPSI_GECTI,
    variant: 'list',
    loading: false,
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    items: { control: false },
    loading: { control: 'boolean' },
  },
} satisfies Meta<typeof AutomatedChecksPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const List: Story = {
  args: { variant: 'list' },
}

/** Kartlar: skor ve kontrolün çalıştığı an da görünür. */
export const Cards: Story = {
  args: { variant: 'cards', items: BASARISIZ },
}

/** Özet: sayılar + yalnız sorunlular. Kuyrukta karar hızı için. */
export const Summary: Story = {
  args: { variant: 'summary', items: BASARISIZ },
}

export const Loading: Story = {
  args: { loading: true },
}

/** Kontrol hiç çalışmamış: boşluk bir bulgudur, inceleme el ile yapılmalı. */
export const Empty: Story = {
  args: { items: [] },
}

/** Hepsi geçti: incelenecek bulgu yok. */
export const AllPassed: Story = {
  args: { items: HEPSI_GECTI },
}

/** Uyarılar var, yayına engel yok. */
export const Warnings: Story = {
  args: { items: UYARILAR },
}

/** Bloklayıcı bulgular: ilan bu hâliyle yayına alınamaz. */
export const Failed: Story = {
  args: { items: BASARISIZ },
}

/** Yalnız uyarı varken "Yayına engel" rozeti çıkmamalı. */
export const WarningsSummary: Story = {
  args: { variant: 'summary', items: UYARILAR },
}

/** Hepsi geçtiğinde özet boş bir alan değil, açık bir cümle göstermeli. */
export const AllPassedSummary: Story = {
  args: { variant: 'summary', items: HEPSI_GECTI },
}

/** Gerçek ilan fixture'ıyla: üç kontrol. */
export const FromListingFixture: Story = {
  args: { items: residentialPendingVilla.moderation.automatedChecks },
}

/** Uzun mesajlar sarmalı, kartlar taşmamalı. */
export const LongContent: Story = {
  args: {
    variant: 'cards',
    items: [
      kontrol(
        AutomatedCheckCode.DuplicateContent,
        AutomatedCheckResultStatus.Failed,
        'Aynı gayrimenkule ait olduğu değerlendirilen üç aktif ilan bulundu: 1245789630, 1245790148 ve 1245791041. Üçünde de aynı tapu bilgisi, aynı koordinat ve büyük ölçüde örtüşen açıklama metni kullanılmış; ilanların ikisi ilişkili hesaplardan yayınlanmış.',
        0.97,
      ),
      kontrol(
        AutomatedCheckCode.ContactInfoDetection,
        AutomatedCheckResultStatus.Warning,
        'Açıklamanın son paragrafında telefon numarası olabilecek bir sayı dizisi var; biçim numaraya benzemiyor, insan kontrolü gerekiyor.',
        0.51,
      ),
    ],
  },
}

/** Dar ekranda kartlar tek kolona iner. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'cards', items: BASARISIZ },
}

/**
 * Durum yalnız renkle ifade edilmemeli.
 *
 * Brifingin kabul kriteri. Rozetin kendi metni her satırda okunabilir olmalı —
 * renk körü kullanıcı "Geçti" ile "Başarısız"ı ayırt edebilmeli.
 */
export const StatusIsNotOnlyColor: Story = {
  args: { items: BASARISIZ },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByText('Başarısız')).toHaveLength(2)
    await expect(canvas.getAllByText('Uyarı')).toHaveLength(2)
    await expect(canvas.getAllByText('Geçti')).toHaveLength(4)
  },
}

/** Etiket domain'den gelmeli — sonucun içinde `label` alanı yok. */
export const LabelsComeFromDomain: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('İletişim Bilgisi Tespiti')).toBeInTheDocument()
    await expect(canvas.getByText('Sahtecilik Riski')).toBeInTheDocument()
  },
}

/** `failed` varsa "Yayına engel" görünmeli. */
export const BlockingIsAnnounced: Story = {
  args: { variant: 'summary', items: BASARISIZ },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Yayına engel')).toBeInTheDocument()
    await expect(canvas.getByText('2 başarısız')).toBeInTheDocument()
  },
}

/**
 * Uyarı bloklamaz.
 *
 * `warning` üreten her ilanı onaylanamaz saymak, panelin en kolay yapacağı
 * hata olurdu; brifing 1.2 yalnız "bloklayıcı" kontrolü engel sayıyor.
 */
export const WarningDoesNotBlock: Story = {
  args: { variant: 'summary', items: UYARILAR },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('2 uyarı')).toBeInTheDocument()
    await expect(canvas.queryByText('Yayına engel')).not.toBeInTheDocument()
  },
}

/** Özet yalnız sorunluları listelemeli; geçenler sayıda kalmalı. */
export const SummaryListsOnlyProblems: Story = {
  args: { variant: 'summary', items: BASARISIZ },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByText(/Aynı gayrimenkule ait aktif bir ilan bulundu/),
    ).toBeInTheDocument()
    await expect(canvas.queryByText('Zorunlu alanlar tamamlandı.')).not.toBeInTheDocument()
  },
}

export const VariantsComparison: Story = {
  args: { items: BASARISIZ },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <AutomatedChecksPanel {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
