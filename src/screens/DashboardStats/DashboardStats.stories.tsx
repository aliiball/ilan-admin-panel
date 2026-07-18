import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { dailyModerationCount, dailyNewListings, dashboardMetrics } from '../../fixtures'
import type { DashboardMetrics } from '../../types/domain'
import type { DateRange, UiError } from '../../types/component-props'
import { DashboardStats } from './DashboardStats'

/**
 * Dolu metriklerden bir veya birkaç alanı **çıkarır** — `partialSuccess.data`
 * kurmanın tek doğru yolu.
 *
 * `{ ...dashboardMetrics, categoryDistribution: undefined }` yazılamıyor:
 * `exactOptionalPropertyTypes` altında **derlenmez** (TS2375). `Partial<T>`'nin
 * `alan?: X`'i "yok olabilir" der, "`undefined` olabilir" demez — ikisi bu
 * bayrak açıkken farklı şeyler ve `partialSuccess`in bütün anlamı o farkta:
 * "gelmeyen alan **yok**, boş değil".
 *
 * `delete` ile ayıklanıyor, rest destructuring ile değil: `noUnusedLocals`
 * açıkken `const { alan: _atilan, ...kalan } = …` kalıbı atılan bağı okumadığı
 * için TS6133 riski taşır. `delete` `Partial`da güvenli — alanların hepsi zaten
 * opsiyonel.
 */
const metrikleriAyikla = (...alanlar: (keyof DashboardMetrics)[]): Partial<DashboardMetrics> => {
  const kopya: Partial<DashboardMetrics> = { ...dashboardMetrics }
  for (const alan of alanlar) delete kopya[alan]
  return kopya
}

/** Üç grafiğin başlıkları; `ChartCard` her birini `aria-labelledby` ile adlandırıyor. */
const GRAFIK_BASLIKLARI = ['Günlük yeni ilan', 'Günlük moderasyon kararı', 'Kategori dağılımı']

/**
 * `aria-hidden` bir kabın içinde **tab sırasına giren** öğelerin seçicisi.
 *
 * Ölçülen şey "odaklanılabilir" değil, **tabbable**: `tabindex="-1"` ihlal
 * _değildir_ — axe'ın `aria-hidden-focus` kuralı işi `focusable-not-tabbable`
 * kontrolüne veriyor, o da yalnız `tabindex >= 0` olanları sayıyor. Ayrım
 * teorik değil: Recharts kendi katmanlarına `accessibilityLayer`'dan bağımsız
 * olarak `tabindex="-1"` basıyor ve çıplak bir `[tabindex]` sorgusu kütüphanenin
 * bu zararsız iç markup'ına takılırdı.
 *
 * Native tabbable'lar da listede: `tabindex`'i olmayan bir `<button>` de tab
 * sırasındadır ve `[tabindex]` sorgusunun **hiç göremeyeceği** gerçek bir ihlal
 * olurdu.
 */
const GIZLI_KAPTA_TAB_SIRASI = [
  '[tabindex]:not([tabindex="-1"])',
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
]
  .map((secici) => `[aria-hidden="true"] ${secici}`)
  .join(', ')

/**
 * Fixture dünyasının penceresi: **2026-06-17 → 2026-07-16**, `fixtures/dashboard.ts`
 * ile birebir. Son gün "bugün"dür ve `newListingCountToday` (128) o günün serideki
 * değeri — iki yerde iki sayı olsaydı kart "128", grafiğin son sütunu başka bir şey
 * gösterirdi.
 *
 * Tip **açıkça `DateRange`**, `as const` değil: `meta.args`'a konan bir prop'un
 * *çıkarılan* tipi `StoryObj<typeof meta>` tarafından prop tipiyle kesiştiriliyor
 * (AGENTS'ın TS2375 ailesi). `{ from: '…'; to: '…' }` diye çıkarılsaydı `from`/`to`
 * o dosyada **zorunlu** olurdu ve `EmptyWithoutDateBounds` sınırsız aralığı
 * (`{}`) geçemezdi. Anotasyon tipi `DateRange`'de tutuyor, kesişim zararsız
 * kalıyor.
 */
const PENCERE: DateRange = { from: '2026-06-17', to: '2026-07-16' }

/** Yarım aralık: kullanıcı takvimde ilk günü seçmiş, ikincisini henüz seçmemiş. */
const YARIM_PENCERE: DateRange = { from: '2026-07-01' }

const SUNUCU_HATASI: UiError = {
  title: 'Dashboard yüklenemedi',
  message: 'İstatistik servisine ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
  code: 'DASHBOARD_TIMEOUT',
  retryable: true,
}

/** Tekrar denemenin işe yaramayacağı hata: veri kaybolmuş, aynı sorgu aynı cevabı verir. */
const KALICI_HATA: UiError = {
  title: 'Dashboard yüklenemedi',
  message: 'İstatistik toplama işi bu aralık için hiç çalışmamış. Sistem yöneticinize başvurun.',
  code: 'DASHBOARD_AGGREGATION_MISSING',
  retryable: false,
}

const GRAFIK_HATASI: UiError = {
  title: 'Grafik yüklenemedi',
  message:
    'Kategori dağılımı hesaplanamadı. Aralığı yeniden seçebilir veya tekrar deneyebilirsiniz.',
  code: 'DASHBOARD_CATEGORY_TIMEOUT',
  retryable: true,
}

const KPI_HATASI: UiError = {
  title: 'Açık şikayet sayısı alınamadı',
  message: 'Şikayet servisi yanıt vermedi.',
  code: 'REPORTS_UNAVAILABLE',
  retryable: true,
}

const meta = {
  title: 'Screens/DashboardStats',
  component: DashboardStats,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dashboard verisini kart ve grafiklere çeviren ekran. **Veri çekmez** — ' +
          '`state: AsyncState<DashboardMetrics>` prop olarak gelir; sorgunun sahibi sayfa ' +
          'katmanıdır. **Kabuk değildir**: `AppShell`/`TopBar`/`PageHeader` render etmez ' +
          "(Faz 4 kompoze edecek), bu yüzden kendi `<h1>`'i yoktur — en üst başlık `<h2>`. " +
          'Ana vakası `partialSuccess`: düşen bir grafik yalnız kendi hata bloğuna dönüşür, ' +
          'ayakta kalan KPI kartları ve öteki grafikler görünmeye devam eder. `success` ile ' +
          '`partialSuccess` tek gövdeden çizilir — `success`, hatası olmayan bir ' +
          "`partialSuccess`tir. Sayılar `fixtures/dashboard.ts`'ten ve birbirini tutar: " +
          'red oranı 281/3.381 = %8,3, kategori dağılımının toplamı yayın sayısına eşit.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'screen',
      useWhen: [
        'Yönetim panelinin dashboard/istatistik sayfası kurulurken',
        'KPI kartları ve grafikler tek bir AsyncState üzerinden yönetilecekse',
        'Bazı metrikler yüklenirken bazıları düşebiliyorsa (partialSuccess)',
      ],
      doNotUseWhen: [
        'Tek bir KPI gösterilecekse — StatCard kullanın',
        'Tek bir grafik çerçevelenecekse — ChartCard kullanın',
        'Sayfa kabuğu (menü, üst çubuk, başlık) gerekiyorsa — AppShell/PageHeader ile sarın; ekran kabuk render etmez',
      ],
    },
  },

  /*
    `state`, `onMetricClick` ve `onRetry` bilerek meta.args'ta YOK.

    - `onMetricClick` / `onRetry`: yokluğu bir durum (kart tıklanamaz, hata
      tekrar denenemez). `exactOptionalPropertyTypes` açıkken meta'ya konan prop
      o dosyada geri alınamaz (TS2375) ve "handler yok" story'si yazılamazdı.
    - `state`: yokluğu bir durum değil ama meta'ya konarsa **tipi bir birleşim
      üyesine çakılır**. `StoryObj<typeof meta>` meta.args'ın çıkarılan tipini
      prop tipiyle kesiştiriyor: `{ status: 'success', data }` konsaydı
      `AsyncState<DashboardMetrics>` ile kesişimi yalnız o üye olur, `Error` ve
      `Empty` story'leri derlenmezdi. Her story kendi durumunu verir.
  */
  args: {
    dateRange: PENCERE,
    onDateRangeChange: fn(),
  },

  argTypes: {
    state: { control: false },
    onMetricClick: { control: false },
    onRetry: { control: false },
  },
} satisfies Meta<typeof DashboardStats>

export default meta

type Story = StoryObj<typeof meta>

/* ------------------------------------------------------------------ *
 * Brifing 3.5'in zorunlu state story'leri: Loading, Empty, Error,
 * PartialSuccess, Success, Stale.
 * ------------------------------------------------------------------ */

/**
 * State: `loading`. **Ölçü koruyan iskelet** — brifing 2.1: "yalnızca spinner ile
 * boş ekran gösterilmez".
 *
 * Yedi kartın ve üç grafiğin hepsi yerinde; yalnız değerler iskelet. Etiketler
 * istekten önce bilindiği için kalıyor, dolayısıyla kartlar yüklenirken de
 * adlarını taşıyor.
 */
export const Loading: Story = {
  args: {
    state: { status: 'loading' },
    onMetricClick: fn(),
    onRetry: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      Kartlar **adlarıyla** yerinde: Button'ın `loading` regresyonu tam olarak
      buydu — yüklenen buton adını kaybetmişti ve hiçbir test onu adıyla
      sorgulamadığı için fark edilmemişti.
    */
    await expect(canvas.getByText('Bekleyen ilan')).toBeInTheDocument()
    await expect(canvas.getByText('Açık şikayet')).toBeInTheDocument()

    /* Üç grafik kabı da yerinde ve `aria-busy`. */
    const anaGrafik = canvas.getByRole('region', { name: 'Günlük yeni ilan' })
    await expect(anaGrafik).toHaveAttribute('aria-busy', 'true')
    await expect(canvas.getByRole('region', { name: 'Kategori dağılımı' })).toBeInTheDocument()

    /* İskelet hiçbir değer duyurmamalı: sayılar henüz yüklenmedi. */
    await expect(canvas.queryByText('37')).not.toBeInTheDocument()
    await expect(canvas.queryByText('%8,3')).not.toBeInTheDocument()
    await expect(canvas.queryByText(/30 günlük seri/)).not.toBeInTheDocument()
  },
}

/** State: `idle`. İlk sorgu henüz başlatılmadı — kullanıcı için `loading`'den farkı yok. */
export const Idle: Story = {
  args: { state: { status: 'idle' } },
}

/**
 * State: `empty`. Seçilen aralıkta veri yok.
 *
 * `filtered` varyantı: veri **yok** değil, **bu aralığa uyan** yok — kullanıcının
 * atacağı adım farklı. Eylem `onDateRangeChange({})`: sözleşmenin ifade
 * edebildiği tek genişletme, sınırları kaldırmak (brifing 2.1 boş durum eylemi
 * olarak "filtre temizleme"yi zaten sayıyor).
 */
export const Empty: Story = {
  args: { state: { status: 'empty' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Seçilen tarih aralığında veri yok')).toBeInTheDocument()
    /* Aralık metni `formatDateTime`'dan geçiyor: `tr-TR` + `Europe/Istanbul` sabit. */
    await expect(canvas.getByText(/17 Haz 2026 – 16 Tem 2026/)).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Tarih aralığını genişlet' }))

    /* Genişletme = sınırları kaldırmak. Ekran "bir adım geniş"i uyduramaz. */
    await expect(args.onDateRangeChange).toHaveBeenCalledTimes(1)
    await expect(args.onDateRangeChange).toHaveBeenCalledWith({})
  },
}

/**
 * State: `empty`, ama aralık **zaten sınırsız**.
 *
 * Genişletecek bir şey kalmadığı için buton **hiç render edilmiyor**: basınca bir
 * şey yapmayan buton, hiç butondan kötü. Boşluğun sebebi de filtre değil, verinin
 * kendisi — bu yüzden `filtered` değil `default` varyantı ve başka bir metin.
 */
export const EmptyWithoutDateBounds: Story = {
  args: {
    state: { status: 'empty' },
    dateRange: {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Henüz gösterilecek metrik yok')).toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: 'Tarih aralığını genişlet' }),
    ).not.toBeInTheDocument()
  },
}

/**
 * State: `error`. Ekranın tamamı yüklenemedi.
 *
 * `retryable: true` **ve** `onRetry` bağlı — iki kapı da açık, buton çıkıyor.
 * Aralık seçici hatada da duruyor: yeni bir aralık yeni bir sorgudur, yani
 * tekrar denemenin yanındaki ikinci çıkış yolu.
 */
export const Error: Story = {
  args: {
    state: { status: 'error', error: SUNUCU_HATASI },
    onRetry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Dashboard yüklenemedi')
    await expect(canvas.getByText('DASHBOARD_TIMEOUT')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Tekrar dene' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * `retryable: true` **tek başına** butonu çıkarmaz: `onRetry` de bağlanmalı.
 *
 * Hatanın tekrar denenebilir *olduğunu bilmek*, tekrar denemeyi *yapabilmek*
 * değil. Handler'sız buton basınca hiçbir şey yapmazdı.
 */
export const ErrorHasNoRetryButton: Story = {
  args: { state: { status: 'error', error: SUNUCU_HATASI } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).not.toBeInTheDocument()
    /* Hata yine de tam okunuyor; çıkış yolu aralık seçicide. */
    await expect(canvas.getByRole('alert')).toHaveTextContent('DASHBOARD_TIMEOUT')
  },
}

/**
 * Öteki kapı: `onRetry` bağlı ama `retryable: false`.
 *
 * İkisi birden açılmalı. Sayfanın handler'ı her hata için tek yerde bağlaması,
 * hatanın cinsini unutturmamalı.
 */
export const NonRetryableErrorIgnoresHandler: Story = {
  args: {
    state: { status: 'error', error: KALICI_HATA },
    onRetry: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).not.toBeInTheDocument()
    await expect(canvas.getByText('DASHBOARD_AGGREGATION_MISSING')).toBeInTheDocument()
  },
}

/**
 * State: `unauthorized` (HTTP 403).
 *
 * `error`'dan **ayrı bir durum**: "bir şey ters gitti, tekrar dene" değil, "bu
 * senin görebileceğin bir şey değil". `retryable` tip düzeyinde `false`, tekrar
 * dene butonu yok — 403'ü tekrar denemek aynı 403'ü verir.
 *
 * Tarih seçici de gizli: görme yetkisi olmayan bir verinin aralığını değiştirmek
 * hiçbir şeyi değiştirmez.
 */
export const Unauthorized: Story = {
  args: {
    state: {
      status: 'unauthorized',
      error: {
        title: 'Bu sayfayı görme yetkiniz yok',
        message: 'Dashboard metrikleri yalnızca yönetici ve moderatör rollerine açıktır.',
        code: 'FORBIDDEN',
        retryable: false,
      },
    },
    onRetry: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Bu sayfayı görme yetkiniz yok')
    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).not.toBeInTheDocument()
    /* Aralık seçici de yok: yetkisiz veriyi filtrelemenin anlamı yok. */
    await expect(canvas.queryByText('Tarih aralığı')).not.toBeInTheDocument()
  },
}

/**
 * State: `partialSuccess` — **bu ekranın ana vakası** (brifing 2.2: "bazı
 * grafikler yüklenemese de başarılı kartlar görünür").
 *
 * Kategori dağılımı grafiği ve açık şikayet KPI'ı düştü; kalan altı kart ve iki
 * grafik ayakta. `data` `Partial`: düşen alanlar **yok**, boş değil — boş dizi
 * koyup "veri yok" demek `empty` ile `error`ı karıştırmak olurdu.
 */
export const PartialSuccess: Story = {
  args: {
    state: {
      status: 'partialSuccess',
      data: {
        pendingReviewCount: dashboardMetrics.pendingReviewCount,
        newListingCountToday: dashboardMetrics.newListingCountToday,
        publishedListingCount: dashboardMetrics.publishedListingCount,
        rejectedListingCount: dashboardMetrics.rejectedListingCount,
        rejectionRate: dashboardMetrics.rejectionRate,
        averageReviewMinutes: dashboardMetrics.averageReviewMinutes,
        dailyNewListings,
        dailyModerationCount,
      },
      errors: {
        categoryDistribution: GRAFIK_HATASI,
        openReportCount: KPI_HATASI,
      },
    },
    onMetricClick: fn(),
    onRetry: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* İDDİA 1: düşen grafiğin yerinde hata bloğu VAR ve grafiği çizilmemiş. */
    const dagilim = canvas.getByRole('region', { name: 'Kategori dağılımı' })
    await expect(within(dagilim).getByRole('alert')).toHaveTextContent('Grafik yüklenemedi')
    await expect(canvas.queryByText(/Kategori dağılımı: Konut/)).not.toBeInTheDocument()

    /* İDDİA 2: düşen KPI'ın yerinde de kendi hata bloğu var — kart 0 ile dolmadı. */
    await expect(canvas.getByText('REPORTS_UNAVAILABLE')).toBeInTheDocument()
    await expect(canvas.queryByText('19')).not.toBeInTheDocument()

    /* İDDİA 3: başarılı kartlar HÂLÂ ekranda — düşen alanlar onları etkilemedi. */
    await expect(canvas.getByText('37')).toBeInTheDocument()
    await expect(canvas.getByText('128')).toBeInTheDocument()
    await expect(canvas.getByText('3.100')).toBeInTheDocument()
    await expect(canvas.getByText('%8,3')).toBeInTheDocument()

    /* İDDİA 4: ayakta kalan iki grafik de gerçekten çizildi (özetleri okunuyor). */
    await expect(canvas.getByText(/Günlük yeni ilan: 30 günlük seri/)).toBeInTheDocument()
    await expect(canvas.getByText(/Günlük moderasyon kararı: 30 günlük seri/)).toBeInTheDocument()
  },
}

/**
 * Düşen bir alanın tekrar denemesi.
 *
 * **Sözleşme boşluğu (raporlandı):** `DashboardStatsProps.onRetry` argümansız,
 * yani "yalnız bu grafiği tazele" diyemiyor — `ChartCardProps.onRetry`in JSDoc'u
 * ise tam olarak onu vaat ediyor. Var olan tek kanal bağlı: buton bütün
 * dashboard'ı tazeliyor. Ölçülen şey butonun **çalıştığı**; kapsamı sözleşme
 * düzeltilince daralacak.
 */
export const PartialSuccessChartCanBeRetried: Story = {
  args: {
    state: {
      status: 'partialSuccess',
      data: metrikleriAyikla('categoryDistribution'),
      errors: { categoryDistribution: GRAFIK_HATASI },
    },
    onRetry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const dagilim = canvas.getByRole('region', { name: 'Kategori dağılımı' })

    await userEvent.click(within(dagilim).getByRole('button', { name: 'Tekrar dene' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * `partialSuccess`te bir alan **hiç yoksa ve hatası da yoksa** kart çizilmez.
 *
 * `Partial<T>`nin tanımı bu: gelmeyen alan **yok**. Yokluğa 0 yazmak yalan,
 * uydurma bir hata bloğu çizmek ise olmayan bir sorunu bildirmek olurdu.
 * Sözleşme "her alan için ya değeri vardır ya hatası" diyor; çağıran onu
 * çiğnerse ekran susar, uydurmaz.
 */
export const PartialSuccessOmitsFieldsWithoutData: Story = {
  args: {
    state: {
      status: 'partialSuccess',
      data: { pendingReviewCount: dashboardMetrics.pendingReviewCount },
      errors: {},
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Bekleyen ilan')).toBeInTheDocument()
    await expect(canvas.getByText('37')).toBeInTheDocument()

    /* Ötekiler yok — 0 ile de doldurulmadı, hata bloğuyla da. */
    await expect(canvas.queryByText('Açık şikayet')).not.toBeInTheDocument()
    await expect(canvas.queryByText('Red oranı')).not.toBeInTheDocument()
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
    await expect(
      canvas.queryByRole('region', { name: 'Kategori dağılımı' }),
    ).not.toBeInTheDocument()
  },
}

/**
 * State: `success`. Brifing 5.2'nin bütün sayıları.
 *
 * Sayılar `fixtures/dashboard.ts`'ten ve birbirini tutuyor: red oranı
 * 281 / (3.100 + 281) = %8,3, kategori dağılımının toplamı yayın sayısına (3.100)
 * eşit, oranların toplamı tam 1.
 */
export const Success: Story = {
  args: {
    state: { status: 'success', data: dashboardMetrics },
    onMetricClick: fn(),
    onRetry: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Yedi KPI: brifing 5.2'nin beş sayısı + iki türetilmiş. */
    await expect(canvas.getByText('37')).toBeInTheDocument()
    await expect(canvas.getByText('128')).toBeInTheDocument()
    await expect(canvas.getByText('3.100')).toBeInTheDocument()
    await expect(canvas.getByText('281')).toBeInTheDocument()
    await expect(canvas.getByText('%8,3')).toBeInTheDocument()
    await expect(canvas.getByText('14,6 dk')).toBeInTheDocument()
    await expect(canvas.getByText('19')).toBeInTheDocument()

    /* Üç grafik: hiçbiri hata veya boş değil. */
    await expect(canvas.getByRole('region', { name: 'Günlük yeni ilan' })).toBeInTheDocument()
    await expect(
      canvas.getByRole('region', { name: 'Günlük moderasyon kararı' }),
    ).toBeInTheDocument()
    await expect(canvas.getByRole('region', { name: 'Kategori dağılımı' })).toBeInTheDocument()
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()

    /* Bayat değil: uyarı yok. */
    await expect(canvas.queryByText('Veriler güncellenemedi')).not.toBeInTheDocument()
  },
}

/**
 * State: `success` + `stale`. Son başarılı veri **görünür kalır**, üstte
 * "güncellenemedi" uyarısı (brifing 2.1).
 *
 * Veriyi gizlemek yanlış olurdu: bayat bir sayı, hiç sayı olmamasından iyidir —
 * yeter ki kullanıcı bayat olduğunu bilsin. Uyarı `dismissible` **değil**:
 * `AlertProps` kalıcı sorunları örneklerken "veri bayat"ı adıyla sayıyor.
 */
export const Stale: Story = {
  args: {
    state: { status: 'success', data: dashboardMetrics, stale: true },
    onMetricClick: fn(),
    onRetry: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Uyarı var... */
    const uyari = canvas.getByRole('alert')
    await expect(uyari).toHaveTextContent('Veriler güncellenemedi')

    /* ...ve veri GİZLENMEDİ: bütün sayılar hâlâ okunuyor. */
    await expect(canvas.getByText('37')).toBeInTheDocument()
    await expect(canvas.getByText('%8,3')).toBeInTheDocument()
    await expect(canvas.getByText(/Günlük yeni ilan: 30 günlük seri/)).toBeInTheDocument()

    /* Kalıcı uyarı kapatılamaz: kullanıcı kapatsa bayatlık durur. */
    await expect(canvas.queryByRole('button', { name: 'Bildirimi kapat' })).not.toBeInTheDocument()
  },
}

/**
 * **`onRetry` bağlı olsa bile bayat uyarısında tazeleme butonu çıkmaz.**
 *
 * Sözleşmenin sözü: `DashboardStatsProps.onRetry` "`error` ve `partialSuccess`
 * durumlarındaki tekrar dene butonunu çalıştırır… bu buton **yalnız hata
 * bloğunda** görünür" ve brifing 2.2'nin "dashboard verisini yenileme" eylemi
 * "**bu değil**: yenileme hata olmadan da yapılabilmeli". Bayat veri bir hata
 * bloğu değil — kanalı ayrı bir `onRefresh` olurdu ve sözleşmede yok
 * (RAPOR EDİLDİ).
 *
 * Bu story o sınırı kilitliyor: handler ortada dururken bile ekran onu bayat
 * uyarısına bağlamıyor. Kullanıcının tazeleme yolu aralık seçici.
 */
export const StaleDoesNotBorrowTheRetryChannel: Story = {
  args: {
    state: { status: 'success', data: dashboardMetrics, stale: true },
    onRetry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Veriler güncellenemedi')

    /* Uyarının içinde hiçbir buton yok — ne "Tekrar dene" ne de bir tazeleme. */
    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).not.toBeInTheDocument()
    await expect(within(canvas.getByRole('alert')).queryByRole('button')).not.toBeInTheDocument()
    await expect(args.onRetry).not.toHaveBeenCalled()
  },
}

/* ------------------------------------------------------------------ *
 * Brifing 3.5'in zorunlu düzen varyantları: Mobile stack, tablet grid,
 * desktop grid.
 * ------------------------------------------------------------------ */

/**
 * Düzen: **mobile stack** (320 piksel). Kartlar tek sütuna, grafikler alt alta
 * düşer.
 *
 * Dikey sıralamanın kendisi **play ile ölçülemez**: repoda container query yok ve
 * KPI ızgarası `auto-fit`, yani sütun sayısını kabın genişliği belirliyor —
 * iddianın görsel kanıtı ekran görüntüsünün işi. Play'in ölçebildiği şey yatay
 * taşma: hiçbir kart, grafik veya uzun etiket sayfayı yatay kaydırtmamalı.
 */
export const MobileStack: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    state: { status: 'success', data: dashboardMetrics },
    onMetricClick: fn(),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/** Düzen: mobil, geniş telefon (430 piksel). Aynı yığın, daha rahat kartlar. */
export const MobileWide: Story = {
  globals: { viewport: { value: 'mobile430' } },
  args: { state: { status: 'success', data: dashboardMetrics } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/**
 * Düzen: **tablet grid** (768 piksel = 48rem).
 *
 * KPI ızgarası çok sütuna geçer, grafikler hâlâ tek sütun: 30 günlük bir zaman
 * serisi yarım tablet genişliğinde okunmaz — eksen etiketleri üst üste binerdi.
 * Grafik ızgarasının kırılımı bu yüzden 64rem'de.
 */
export const TabletGrid: Story = {
  globals: { viewport: { value: 'tablet768' } },
  args: {
    state: { status: 'success', data: dashboardMetrics },
    onMetricClick: fn(),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/**
 * Düzen: **desktop grid** (1440 piksel). Yedi KPI tek satıra yaklaşır; ana grafik
 * iki sütunu birden kaplar, moderasyon ve kategori grafikleri altında yan yana.
 */
export const DesktopGrid: Story = {
  globals: { viewport: { value: 'desktop1440' } },
  args: {
    state: { status: 'success', data: dashboardMetrics },
    onMetricClick: fn(),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/** Düzen: masaüstünde `partialSuccess` — düşen kart ızgaranın şeklini bozmuyor. */
export const DesktopPartialSuccess: Story = {
  globals: { viewport: { value: 'desktop1440' } },
  args: {
    state: {
      status: 'partialSuccess',
      data: metrikleriAyikla('dailyModerationCount'),
      errors: { dailyModerationCount: GRAFIK_HATASI },
    },
    onMetricClick: fn(),
    onRetry: fn(),
  },
}

/* ------------------------------------------------------------------ *
 * Sözleşme iddiaları
 * ------------------------------------------------------------------ */

/**
 * `onMetricClick` `DashboardMetrics`in **alan adını** taşır.
 *
 * Karar bu story'de kilitleniyor: id uzayı uydurma bir sözlük değil, verinin
 * kendi anahtar uzayı — `partialSuccess.errors` de aynı uzayı kullanıyor, yani
 * "hangi kart düştü" ile "hangi karta tıklandı" tek dille konuşuyor.
 */
export const MetricClickCarriesTheFieldName: Story = {
  args: {
    state: { status: 'success', data: dashboardMetrics },
    onMetricClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: /^Bekleyen ilan/ }))
    await expect(args.onMetricClick).toHaveBeenCalledWith('pendingReviewCount')

    await userEvent.click(canvas.getByRole('button', { name: /^Açık şikayet/ }))
    await expect(args.onMetricClick).toHaveBeenCalledWith('openReportCount')

    await expect(args.onMetricClick).toHaveBeenCalledTimes(2)
  },
}

/**
 * **Oran ve süre kartları tıklanamaz — `onMetricClick` bağlı olsa bile.**
 *
 * İkisinin de arkasında gidilecek bir satır kümesi yok: red oranına tıklayınca
 * varılacak yer zaten "Reddedilen ilan" kartının hedefi olurdu, ortalama sürenin
 * ise hiçbir listede karşılığı yok. `StatCardProps.onClick`: "tıklanamayan şeyi
 * tıklanabilir göstermeyin".
 *
 * Ölçüm `<button>`ın **yokluğu** üzerinden: `onClick` verilmeyen StatCard düz bir
 * `<div>` kalır, yani rol sorgusu onu hiç bulmaz.
 */
export const RateAndDurationCardsAreNotClickable: Story = {
  args: {
    state: { status: 'success', data: dashboardMetrics },
    onMetricClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Tıklanamayanlar: buton değiller... */
    await expect(canvas.queryByRole('button', { name: /^Red oranı/ })).not.toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: /^Ortalama inceleme süresi/ }),
    ).not.toBeInTheDocument()

    /* ...ama görünmez de değiller: veri okunuyor, yalnız tıklanmıyor. */
    await expect(canvas.getByText('Red oranı')).toBeInTheDocument()
    await expect(canvas.getByText('%8,3')).toBeInTheDocument()

    /* Tıklanabilenler gerçekten buton. */
    await expect(canvas.getByRole('button', { name: /^Yayına alınan ilan/ })).toBeInTheDocument()
  },
}

/** `onMetricClick` bağlı değilse **hiçbir kart** tıklanabilir değil. */
export const NoMetricClickMeansNoButtons: Story = {
  args: { state: { status: 'success', data: dashboardMetrics } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: /^Bekleyen ilan/ })).not.toBeInTheDocument()
    /* Veri yine tam: kartlar tıklanamaz, görünmez değil. */
    await expect(canvas.getByText('37')).toBeInTheDocument()
  },
}

/**
 * Grafikler erişilebilirlik ağacından gizli, **özetleri değil**.
 *
 * `aria-hidden` bir kabın içinde tab sırasına giren hiçbir şey kalmamalı (axe
 * `aria-hidden-focus`). Rol sorgusuyla ölçülemez — testing-library `aria-hidden`
 * alt ağacını zaten dışlıyor, yani `queryByRole` grafiğe `accessibilityLayer`
 * geri gelse de `null` döner ve test sessizce dişsizleşirdi. Bu yüzden doğrudan
 * DOM'a bakılıyor.
 *
 * Ekranda pasta **var**, dolayısıyla `Pie`ın `rootTabIndex` kapısı da burada
 * gerçekten sınanıyor: Faz 2'de aynı iddia alan grafiğiyle ölçülüyordu ve o
 * prop'a sahip olmadığı için her koşulda geçiyordu.
 */
export const ChartsAreHiddenButSummariesAreNot: Story = {
  args: { state: { status: 'success', data: dashboardMetrics } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      Önce her grafiğin gizli kabın İÇİNDE çizildiği ölçülüyor, çünkü aşağıdaki
      iddiaların ikisi de bir **yokluğu** ölçüyor: grafik hiç çizilmemiş olsaydı
      da geçerlerdi.

      Sorgu kart kart yapılıyor, canvas'ta `svg` sayarak değil: StatCard'ların
      yedi dekoratif ikonu da `aria-hidden` bir span'in içinde birer `<svg>` ve
      canvas düzeyinde bir sayım onları da toplardı — iddia grafiklerle ilgili.
    */
    for (const baslik of GRAFIK_BASLIKLARI) {
      const bolge = canvas.getByRole('region', { name: baslik })
      await expect(bolge.querySelector('[aria-hidden="true"] svg')).not.toBeNull()
    }

    /* Özetler okunuyor: veri ekran okuyucuya metin olarak ulaşıyor. */
    await expect(canvas.getByText(/Kategori dağılımı: Konut %52/)).toBeInTheDocument()
    await expect(canvas.queryByRole('img')).not.toBeInTheDocument()

    /* Odak tuzağı: `aria-hidden` içinde tabbable hiçbir şey yok. */
    await expect(canvasElement.querySelector(GIZLI_KAPTA_TAB_SIRASI)).toBeNull()
  },
}

/**
 * Alan geldi ama **içi boş**: "bu aralıkta kayıt yok" ile "alan gelmedi" ayrı
 * şeyler.
 *
 * `emptyDashboardMetrics`in serileri boş dizi ve sayaçları 0 — fixture'ın kendi
 * gerekçesi: "Boş seri, sıfır dolu seriden farklı bir hâl; grafik 'hiç veri yok'
 * demek zorunda, düz bir sıfır çizgisi çizmek değil." Kartlar ise **0 gösteriyor**:
 * sıfır boş değildir, "Bekleyen ilan: 0" gerçek ve iyi bir haberdir.
 *
 * Ekranın tamamı boşsa `status: 'empty'` doğru durumdur (bkz. `Empty`); bu story
 * `success` içindeki kısmi boşluğun nasıl göründüğünü kilitliyor.
 */
export const SuccessWithEmptySeries: Story = {
  args: {
    state: {
      status: 'success',
      data: {
        ...dashboardMetrics,
        dailyNewListings: [],
        dailyModerationCount: [],
        categoryDistribution: [],
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Grafikler "veri yok" diyor — hata değil, boş. */
    await expect(canvas.getAllByText('Seçilen tarih aralığında veri yok').length).toBe(3)
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
    await expect(canvas.queryByText(/30 günlük seri/)).not.toBeInTheDocument()

    /* Kartlar hâlâ değerlerini gösteriyor: sıfır boş değil, ama burada dolular. */
    await expect(canvas.getByText('37')).toBeInTheDocument()
  },
}

/** Yarım aralık: kullanıcı takvimde ilk günü seçmiş, ikincisini henüz seçmemiş. */
export const HalfOpenDateRange: Story = {
  args: {
    state: { status: 'success', data: dashboardMetrics },
    dateRange: YARIM_PENCERE,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      Aralık **ad öbeği** olarak yazılıyor ("1 Tem 2026 sonrası"), yan cümle
      olarak değil: metin üç ayrı cümleye gömülüyor ve "tarihinden itibaren"
      hâli grafik açıklamasında "…itibaren arası, güne göre ilan girişi" gibi
      bozuk Türkçe üretiyordu.

      "Bugüne kadar" da yazılmıyor: hesabı "şimdi"ye dayanırdı, ekran saati
      okuyamaz.
    */
    await expect(canvas.getByText(/Güne göre ilan girişi · 1 Tem 2026 sonrası/)).toBeInTheDocument()
  },
}

/**
 * Aralık değişince `onDateRangeChange` çağrılır ve **ekran kendi durumunu
 * tutmaz**: değerin sahibi çağırandır.
 *
 * Takvim popup'ı bilerek **açılmıyor**: Base UI popup'ı kapanırken biten bir
 * story, odak tuzağının `aria-hidden` + `tabindex="0"` koruma span'lerini DOM'da
 * bırakıp axe'ı yazı-tura düşürüyor (AGENTS: `popupKapanmasiniBekle`). Burada
 * ölçülen şey seçicinin bağlı ve etiketli olduğu; seçimin kendisi
 * `DateRangePicker`ın kendi story'lerinin işi.
 */
export const DateRangePickerIsWired: Story = {
  args: { state: { status: 'success', data: dashboardMetrics } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const secici = canvas.getByRole('button', { name: 'Tarih aralığı' })
    await expect(secici).toHaveTextContent('17.06.2026 – 16.07.2026')
  },
}
