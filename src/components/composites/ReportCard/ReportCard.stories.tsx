import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ArrowUpRight, Check, X } from 'lucide-react'
import { ReportStatus, type Listing, type ListingReport } from '../../../types/domain'
import { Button } from '../../primitives/Button'
import {
  allReportFixtures,
  buildingArchivedMixedUse,
  kadikoyApartmentReports,
  landRejectedField,
  reportBySeverity,
  reportByStatus,
  reportDismissedArchivedBuilding,
  reportDismissedNetArea,
  reportInReviewFalseLicense,
  reportOpenCriticalFraud,
  reportOpenLowDuplicate,
  reportResolvedPhotoOwnership,
  residentialPublishedApartment,
  tourismRejectedPension,
} from '../../../fixtures'
import { ReportCard } from './ReportCard'

const VARYANTLAR = ['compact', 'detailed', 'queue'] as const

/**
 * Şikayetleri bağlı oldukları ilan fixture'ına eşler.
 *
 * Story'ler `listing`'i elle geçmek yerine buradan alıyor: `report.listingId`
 * ile gösterilen ilanın eşleşmemesi kartın en kolay yalanı olurdu.
 *
 * `Record<string, Listing>` bilerek: `noUncheckedIndexedAccess` açıkken
 * indeksleme `Listing | undefined` verir ve eşleşmeyen kimlik derleyiciye
 * görünür kalır — sabit anahtarlı bir nesne olsaydı olmayan ilan `undefined`
 * yerine tip düzeyinde "var" sayılırdı.
 */
const ILAN: Record<string, Listing> = {
  'listing-residential-kadikoy-apartment': residentialPublishedApartment,
  'listing-land-corlu-field': landRejectedField,
  'listing-tourism-marmaris-pension': tourismRejectedPension,
  'listing-building-osmangazi-archived': buildingArchivedMixedUse,
}

/**
 * Kritik **ama sonuçlanmış** şikayet — fixture'larda karşılığı yok, çünkü
 * `reports.ts`'in kritik kaydı kuyruğun en acil satırı olmak için `open`.
 *
 * Buradaki tek işi iki eksenin birbirinden bağımsız olduğunu göstermek:
 * `reportOpenCriticalFraud`'un kapanmış hâli. Tarihler sabit — `Date.now()`
 * ile türetilseydi story her gün başka bir kart üretirdi.
 */
const kritikCozulmus: ListingReport = {
  ...reportOpenCriticalFraud,
  status: ReportStatus.Resolved,
  assignedAdminId: 'admin-super-1',
  resolutionNote:
    'Tesis belgeleri doğrulandı, kopya ilan kaldırıldı; bu ilanda değişiklik gerekmedi.',
  updatedAt: '2026-07-15T16:20:00+03:00',
  resolvedAt: '2026-07-15T16:20:00+03:00',
}

const meta = {
  title: 'Composites/ReportCard',
  component: ReportCard,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Bir şikayetin özeti. **Şiddet ve durum iki ayrı eksendir**: "kritik ama çözülmüş" ile ' +
          '"açık ama düşük şiddetli" farklı işlerdir, kart ikisini de ayrı kanallardan gösterir — ' +
          'şiddet sol şeritten ve kendi rozetinden, durum kendi rozetinden; sonuçlanmış şikayetin ' +
          'zemini söner ama şeridi kalır. `listing` opsiyonel: gelmediyse veya ilan silindiyse kart ' +
          'çökmez, `report.listingId`’yi gösterir. Göreli zaman yok — `queue` varyantı yaşı ' +
          'değil açılış anını öne çıkarır, çünkü component saati kendi okuyamaz.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'report-summary',
      useWhen: [
        'Şikayet listesinde veya triage kuyruğunda',
        'Şikayet detayının başında',
        'İlan detayının "bu ilanın şikayetleri" bölümünde',
      ],
      doNotUseWhen: [
        'İlanın kendi özeti gösterilecekse — ListingCard kullanın',
        'Şikayetler sütunlu taranacaksa — DataTable kullanın',
        'Moderasyon kararı verilecekse — ModerationActionBar kullanın',
      ],
    },
  },

  /*
    `listing`, `actions` ve `onClick` meta.args'ta BİLEREK yok: üçünün de
    yokluğu ayrı bir durum (ilan gelmemiş kart, eylemsiz kart, tıklanamaz kart)
    ve `exactOptionalPropertyTypes` açıkken meta'ya konan bir değer story'de
    `undefined` ile geri alınamaz (TS2375). İhtiyacı olan story kendi versin.
  */
  args: {
    report: reportOpenCriticalFraud,
    variant: 'compact',
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    report: { control: false },
    listing: { control: false },
    actions: { control: false },
  },

  decorators: [
    (Story) => (
      <div style={{ maxWidth: '44rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReportCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { listing: tourismRejectedPension },
}

/** Liste satırı: sebep, ilan, şiddet, durum ve açılış anı. */
export const Compact: Story = {
  args: { variant: 'compact', listing: tourismRejectedPension },
}

/** Şikayet detayı: açıklama, şikayetçi, atanan admin ve çözüm notu görünür. */
export const Detailed: Story = {
  args: {
    variant: 'detailed',
    report: reportResolvedPhotoOwnership,
    listing: residentialPublishedApartment,
  },
}

/** Triage kuyruğu: şiddet ilk okunan şey, açılış anı ikinci. */
export const Queue: Story = {
  args: { variant: 'queue', listing: tourismRejectedPension },
}

/** Tıklanabilir kart: bölge `<button>`, adı sebepten okunur. */
export const Clickable: Story = {
  args: { listing: tourismRejectedPension, onClick: fn() },
}

/**
 * Eylemler dışarıdan gelir ve **kartın işi değildir**: yetkisi olmayan
 * kullanıcıya "Çöz" kapalı verilmez, hiç verilmez.
 */
export const WithActions: Story = {
  args: {
    listing: tourismRejectedPension,
    actions: (
      <>
        <Button size="sm" variant="secondary" leadingIcon={<Check size={16} />}>
          Çöz
        </Button>
        <Button size="sm" variant="ghost" leadingIcon={<X size={16} />}>
          Geçersiz say
        </Button>
      </>
    ),
  },
}

/** `open` — henüz kimse üstüne almadı; kuyruğun beklediği iş. */
export const Open: Story = {
  args: { report: reportOpenLowDuplicate, listing: landRejectedField, variant: 'queue' },
}

/** `inReview` — içerik denetçisine atanmış; o rol bunu kapatamaz (`ReportTriageLimited`). */
export const InReview: Story = {
  args: { report: reportInReviewFalseLicense, listing: tourismRejectedPension, variant: 'queue' },
}

/** `resolved` — şikayet haklı çıktı, işlem yapıldı. Zemin söner. */
export const Resolved: Story = {
  args: {
    report: reportResolvedPhotoOwnership,
    listing: residentialPublishedApartment,
    variant: 'detailed',
  },
}

/** `dismissed` — şikayet asılsız bulundu. `resolved`'dan farkı çözüm notunda. */
export const Dismissed: Story = {
  args: {
    report: reportDismissedArchivedBuilding,
    listing: buildingArchivedMixedUse,
    variant: 'detailed',
  },
}

/** `critical` — kuyruğun en öncelikli satırı: kritik, açık ve atanmamış. */
export const Critical: Story = {
  args: { report: reportOpenCriticalFraud, listing: tourismRejectedPension, variant: 'queue' },
}

/**
 * `report:triageLimited` kademesi: içerik denetçisi okur, sınıflandırır,
 * eskale eder — "Çöz" butonu **render bile edilmez**.
 */
export const LimitedTriageActions: Story = {
  args: {
    report: reportInReviewFalseLicense,
    listing: tourismRejectedPension,
    variant: 'queue',
    actions: (
      <Button size="sm" variant="secondary" leadingIcon={<ArrowUpRight size={16} />}>
        Moderatöre eskale et
      </Button>
    ),
  },
}

/** Şikayetçi anonim: form oturum açmadan da doldurulabiliyor, alan yok. */
export const AnonymousReporter: Story = {
  args: {
    report: reportDismissedNetArea,
    listing: residentialPublishedApartment,
    variant: 'detailed',
  },
}

/**
 * İlan gelmemiş veya silinmiş: kart çökmez, `listingId`'yi gösterir.
 * Brifing 2.8'in `linkedListingUnavailable` durumu.
 */
export const LinkedListingUnavailable: Story = {
  args: { report: reportOpenCriticalFraud, variant: 'detailed' },
}

/** Arşivlenmiş ilana açılmış şikayet: ilanın durumu üçüncü bir eksen, o da görünür. */
export const LinkedListingArchived: Story = {
  args: {
    report: reportDismissedArchivedBuilding,
    listing: buildingArchivedMixedUse,
    variant: 'compact',
  },
}

/** Aynı ilana bağlı üç şikayet — ilan detayının "şikayet geçmişi" bölümü. */
export const SameListingReports: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {kadikoyApartmentReports.map((report) => (
        <ReportCard
          {...args}
          key={report.id}
          report={report}
          listing={residentialPublishedApartment}
        />
      ))}
    </div>
  ),
}

/**
 * Uzun açıklama, uzun çözüm notu ve uzun ilan başlığı: kart taşmamalı.
 *
 * Temeli `kritikCozulmus`, `reportOpenCriticalFraud` değil: çözüm notu
 * sonuçlanmamış bir şikayette bulunamaz ve story yalnız uzun metni ölçmek için
 * olmayan bir kaydı var sayamaz.
 */
export const LongContent: Story = {
  args: {
    variant: 'detailed',
    report: {
      ...kritikCozulmus,
      detail:
        'Aynı tesis fotoğrafları en az dört farklı ilanda, farklı işletme adlarıyla kullanılıyor; rezervasyon için IBAN paylaşıp ön ödeme isteniyor ve ödeme sonrası iletişim kesiliyor. Şikayetime konu ilanın telefon numarası da daha önce kaldırılan bir ilanda görünüyordu, ekran görüntüleri destek ekibine iletildi.',
      resolutionNote:
        'İşletme belgesi ve tapu kaydı istendi, gelen belgeler tesis adresiyle uyuşmadı; kopya ilan yayından kaldırıldı, kullanıcı hesabı kalıcı olarak yasaklandı ve konu hukuk birimine iletildi.',
    },
    listing: {
      ...tourismRejectedPension,
      title:
        'Marmaris İçmeler’de denize sıfır konumda, tam donanımlı, otuz odalı, restoranı ve açık havuzu bulunan, işletmesi devren satılık butik pansiyon tesisi',
    },
  },
}

/** 320 pikselde eylemler alt satıra iner; kart yatay kaydırmaz. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    listing: tourismRejectedPension,
    actions: (
      <Button size="sm" variant="secondary">
        Çöz
      </Button>
    ),
  },
}

export const MobileDetailed: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    variant: 'detailed',
    report: reportResolvedPhotoOwnership,
    listing: residentialPublishedApartment,
  },
}

/** Dört `ReportStatus` değerinin dördü de ayrı bir metinle görünmeli. */
export const EveryStatusRenders: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {Object.values(reportByStatus).map((report) => (
        <ReportCard {...args} key={report.id} report={report} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const etiket of ['Açık', 'İncelemede', 'Çözümlendi', 'Geçersiz Sayıldı']) {
      await expect(canvas.getByText(etiket)).toBeInTheDocument()
    }
  },
}

/** Dört `ReportSeverity` değeri; hiçbiri yalnız renkle ifade edilmiyor. */
export const EverySeverityRenders: Story = {
  args: { variant: 'queue' },
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {Object.values(reportBySeverity).map((report) => (
        <ReportCard {...args} key={report.id} report={report} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const etiket of ['Düşük şiddet', 'Orta şiddet', 'Yüksek şiddet', 'Kritik şiddet']) {
      await expect(canvas.getByText(etiket)).toBeInTheDocument()
    }
  },
}

/**
 * İki eksen birbirinin yerine geçmemeli.
 *
 * Kritik ve sonuçlanmış bir şikayette ikisi de yazıyla okunabilmeli: durum
 * rozeti şiddeti bastırıp kartı "bitmiş iş" diye sunamaz, şiddet rozeti de
 * kapanmış şikayeti açık gösteremez. DOM'dan ölçülüyor çünkü "ikisi de
 * görünsün" niyeti kodda doğru görünüp render'da tek rozete düşebilir.
 */
export const SeverityIsNotStatus: Story = {
  args: { report: kritikCozulmus, listing: tourismRejectedPension, variant: 'detailed' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Kritik şiddet')).toBeInTheDocument()
    await expect(canvas.getByText('Çözümlendi')).toBeInTheDocument()

    /* İki rozet ayrı elementler: biri diğerinin metnini taşımıyor. */
    await expect(canvas.getByText('Kritik şiddet')).not.toHaveTextContent('Çözümlendi')
  },
}

/**
 * İlan verilmediğinde kart çökmemeli ve uydurulmuş bir başlık göstermemeli:
 * elindeki tek gerçek `listingId`.
 */
export const MissingListingShowsIdOnly: Story = {
  args: { report: reportOpenCriticalFraud, variant: 'detailed' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('İlan bilgisi yüklenmedi')).toBeInTheDocument()
    await expect(
      canvas.getByText(`İlan kimliği: ${reportOpenCriticalFraud.listingId}`),
    ).toBeInTheDocument()

    /*
      `queryByRole('img')` işe yaramaz: kapak görseli dekoratif olduğu için
      `alt=""` taşır ve erişilebilirlik ağacında zaten görünmez. Ölçülecek şey
      DOM'un kendisi — ilan yokken kırık bir `<img>` de olmamalı.
    */
    await expect(canvasElement.querySelector('img')).toBeNull()
  },
}

/**
 * Eylemler tıklanabilir bölgenin İÇİNDE olmamalı.
 *
 * İç içe `<button>` geçersiz HTML'dir ve içteki butonu klavyeyle erişilemez
 * kılar; `toContainElement` bunu doğrudan DOM'dan ölçüyor. Ayrıca eyleme
 * tıklamak kartın `onClick`'ini tetiklememeli.
 */
export const ActionsAreNotNestedInClickRegion: Story = {
  args: {
    listing: tourismRejectedPension,
    onClick: fn(),
    actions: (
      <Button size="sm" variant="secondary">
        Çöz
      </Button>
    ),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const kartButonu = canvas.getByRole('button', { name: /Sahte İlan Şüphesi/ })
    const eylem = canvas.getByRole('button', { name: 'Çöz' })

    await expect(kartButonu).not.toContainElement(eylem)

    await userEvent.click(eylem)
    await expect(args.onClick).not.toHaveBeenCalled()

    await userEvent.click(kartButonu)
    await expect(args.onClick).toHaveBeenCalledWith(reportOpenCriticalFraud)
  },
}

/** `onClick` yoksa tıklanacak bir şey de yok: buton hiç çıkmamalı. */
export const WithoutOnClickThereIsNoButton: Story = {
  args: { listing: tourismRejectedPension },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/**
 * Odak halkası kırpılmamalı.
 *
 * Tıklanabilir bölge kartı dolduruyor; kart `overflow: hidden` olsaydı global
 * `:focus-visible` outline'ı (offset ile dışarıda) görünmez olurdu ve klavye
 * kullanıcısı odağın nerede olduğunu bilemezdi. Testler geçerken stilin bozuk
 * kaldığı bu repoda görüldü — bu yüzden hesaplanan stil ölçülüyor.
 */
export const FocusRingIsNotClipped: Story = {
  args: { listing: tourismRejectedPension, onClick: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const kart = canvas.getByRole('article')
    await expect(getComputedStyle(kart).overflow).toBe('visible')

    const kartButonu = canvas.getByRole('button', { name: /Sahte İlan Şüphesi/ })
    await userEvent.tab()
    await expect(kartButonu).toHaveFocus()
  },
}

/** Kuyrukta şiddet başlıktan önce okunmalı: görsel sıra ile DOM sırası aynı. */
export const QueueReadsSeverityFirst: Story = {
  args: { variant: 'queue', listing: tourismRejectedPension },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const siddet = canvas.getByText('Kritik şiddet')
    const sebep = canvas.getByText('Sahte İlan Şüphesi')

    /* DOCUMENT_POSITION_FOLLOWING: sebep, şiddetten sonra geliyor. */
    await expect(siddet.compareDocumentPosition(sebep) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  },
}

/** Ayrıntı ve çözüm notu yalnız `detailed`'da: liste satırı özet olmalı. */
export const CompactHidesDetail: Story = {
  args: { report: reportResolvedPhotoOwnership, listing: residentialPublishedApartment },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Diğer')).toBeInTheDocument()
    await expect(canvas.queryByText('Çözüm notu')).not.toBeInTheDocument()
    await expect(
      canvas.queryByText(reportResolvedPhotoOwnership.detail ?? ''),
    ).not.toBeInTheDocument()
  },
}

/**
 * Yedi fixture, her biri kendi ilanıyla eşleşmiş ve `createdAt` sırasında.
 *
 * Kuyruğu yeniden sıralamak kartın işi değil; buradaki sıra `reports.ts`'in
 * sabit sırasıdır (brifing 5.2).
 */
export const RealReports: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {allReportFixtures.map((report) => {
        const listing = ILAN[report.listingId]
        return (
          <ReportCard
            {...args}
            key={report.id}
            report={report}
            {...(listing !== undefined && { listing })}
            variant="detailed"
          />
        )
      })}
    </div>
  ),
}

export const VariantsComparison: Story = {
  args: { listing: tourismRejectedPension },
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <ReportCard {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
