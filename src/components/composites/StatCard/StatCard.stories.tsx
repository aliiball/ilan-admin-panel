import type { Meta, StoryObj } from '@storybook/react-vite'
import { Clock, FilePlus2, Flag, Percent, Timer } from 'lucide-react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { dashboardMetrics, emptyDashboardMetrics } from '../../../fixtures'
import type { StatCardProps } from '../../../types/component-props'
import { StatCard } from './StatCard'

const VARYANTLAR = ['plain', 'accent', 'trend'] as const

/**
 * Zıplama ölçümüne giren varyantlar. `accent` dışarıda: `plain`'den yalnız sol
 * şeritle ayrılıyor, dikey düzeni birebir aynı — ölçüm tekrar olurdu.
 */
const OLCULEN_VARYANTLAR = ['plain', 'trend'] as const

/**
 * Oranı yüzde metnine çevirir. Locale **sabit**: makineye bırakılsa aynı değer
 * Türkçe makinede "%8,3", İngilizce makinede "%8.3" görünürdü.
 *
 * `0.083 * 100` kayan noktada 8.299999999999999'dur; `maximumFractionDigits`
 * onu "8,3"e yuvarlıyor — biçimleme kartın değil çağıranın işi olduğu için
 * dashboard sayfası da tam olarak bunu yapacak.
 */
const yuzde = (oran: number): string =>
  `%${(oran * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`

const dakika = (deger: number): string =>
  `${deger.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} dk`

/** `Trend` adı aşağıda bir story'ye ait; tip başka isim taşımalı. */
type TrendBilgisi = NonNullable<StatCardProps['trend']>

/** Kuyruk büyüdü: yukarı ok, ama moderasyon ekibi için kötü haber. */
const KUYRUK_ARTTI: TrendBilgisi = { direction: 'up', value: '+9', sentiment: 'negative' }

/** Yeni ilan girişi arttı: yukarı ok, iyi haber. Aynı ok, başka renk. */
const GIRIS_ARTTI: TrendBilgisi = { direction: 'up', value: '+%14', sentiment: 'positive' }

/** Red oranı arttı: brifingin "yukarı her zaman iyi değildir" örneği. */
const RED_ORANI_ARTTI: TrendBilgisi = { direction: 'up', value: '+%2,1', sentiment: 'negative' }

/** İnceleme süresi düştü: aşağı ok, iyi haber. Yukarıdakinin simetriği. */
const SURE_DUSTU: TrendBilgisi = { direction: 'down', value: '-3,2 dk', sentiment: 'positive' }

/** Değişim yok: düz çizgi, yorum yok. */
const SABIT: TrendBilgisi = { direction: 'flat', value: '%0', sentiment: 'neutral' }

const meta = {
  title: 'Composites/StatCard',
  component: StatCard,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`direction` ile `sentiment` **ayrı** proplardır: yukarı her zaman iyi değildir — ' +
          '"Red oranı %2,1 arttı" yukarı ok + kırmızıdır, "inceleme süresi 3 dk düştü" aşağı ' +
          'ok + yeşildir; hangi metriğin artışının iyi olduğunu kart bilemez, çağıran bilir. ' +
          'Trendin yeri **trend olmasa da** ayrılır: kart yüklenirken trendin gelip ' +
          'gelmeyeceğini bilemez ve yeri veriye göre açmak, veri gelince kartı büyütürdü. ' +
          '`onClick` verilirse kart gerçek bir `<button>` olur, verilmezse tıklanabilir ' +
          'görünmez. Değeri biçimlemek çağıranın işidir — kart kendi `Intl`ini kurmaz.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'metric-display',
      useWhen: [
        'Dashboard veya özet başlığında tek bir KPI gösterilecekse',
        'Sayının yanında bir önceki döneme göre değişim gösterilecekse',
        'KPI karta tıklayıp filtrelenmiş listeye gitmek gerekiyorsa',
      ],
      doNotUseWhen: [
        'Zaman serisi veya dağılım gösterilecekse — ChartCard kullanın',
        'Bir kaydın durumu gösterilecekse — StatusBadge kullanın',
        'Sorgu boş veya hatalı döndüyse — kartı 0 ile doldurmayın, EmptyState/ErrorState kullanın',
      ],
    },
  },

  /*
    `onClick` bilerek meta.args'ta YOK: handler'ın yokluğu bir durum (kart
    tıklanamaz). exactOptionalPropertyTypes açıkken meta'ya `fn()` koymak
    prop'u bu dosyada zorunlu kılar ve "tıklanamaz kart" story'si yazılamaz.
  */
  args: {
    label: 'Bekleyen ilan',
    value: dashboardMetrics.pendingReviewCount,
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    loading: { control: 'boolean' },
    label: { control: 'text' },
    description: { control: 'text' },
    icon: { control: false },
    trend: { control: false },
    onClick: { control: false },
  },
} satisfies Meta<typeof StatCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { description: 'Moderasyon kuyruğunda inceleme bekliyor' },
}

export const Plain: Story = {
  args: {
    variant: 'plain',
    description: 'Moderasyon kuyruğunda inceleme bekliyor',
    trend: KUYRUK_ARTTI,
  },
}

/** Vurgu şeridi: dashboard'da dikkat çekmesi gereken tek KPI (bekleyen ilan). */
export const Accent: Story = {
  args: {
    variant: 'accent',
    description: 'Moderasyon kuyruğunda inceleme bekliyor',
    trend: KUYRUK_ARTTI,
  },
}

/** Trend öne çıkar: pil büyür ve kendi satırına geçer, açıklama altına iner. */
export const Trend: Story = {
  args: {
    variant: 'trend',
    label: 'Red oranı',
    value: yuzde(dashboardMetrics.rejectionRate),
    description: 'Son 30 günde verilen kararların içindeki pay',
    trend: RED_ORANI_ARTTI,
  },
}

export const WithIcon: Story = {
  args: {
    icon: <Clock size={20} />,
    description: 'Moderasyon kuyruğunda inceleme bekliyor',
    trend: KUYRUK_ARTTI,
  },
}

/** Yalnız **değer** iskelete döner: etiket ve açıklama istekten önce bilinir. */
export const Loading: Story = {
  args: {
    loading: true,
    icon: <Clock size={20} />,
    description: 'Moderasyon kuyruğunda inceleme bekliyor',
  },
}

/**
 * Yüklenirken kartın erişilebilir adı kaybolmamalı.
 *
 * Button'da bu tam olarak bozulmuştu: yükleniyor durumu etiketi
 * `visibility: hidden` ile gizleyince buton adsız kalmıştı ve hiçbir test onu
 * *adıyla* sorgulamadığı için fark edilmemişti. Burada ad `label`'dan geliyor,
 * iskelet `aria-hidden`; bu story onu adıyla sorgulayarak kilitliyor.
 */
export const LoadingKeepsAccessibleName: Story = {
  args: { loading: true, onClick: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const kart = canvas.getByRole('button', { name: 'Bekleyen ilan' })
    await expect(kart).toHaveAttribute('aria-busy', 'true')

    // İskelet bir değer duyurmamalı: "37" henüz yüklenmedi.
    await expect(canvas.queryByText('37')).not.toBeInTheDocument()
  },
}

/**
 * Yükleniyor ile yüklendi **aynı yüksekliği** kaplamalı.
 *
 * Kartın en kırılgan iddiası bu ve niyet kodda doğru görünüp render'da yanlış
 * çıkabiliyor, o yüzden DOM'dan ölçülüyor: aynı prop'larla iki kart, biri
 * iskeletli-trendsiz (yükleniyor), biri değerli-trendli (yüklendi). Ayrılan
 * yuva (`trendSlot`) pilin gerçek boyunu tutamıyorsa fark burada çıkar.
 *
 * `trend` varyantı da ölçülüyor: pili büyük ve dolgusu farklı, yani yuvanın
 * ölçüsü orada ayrı bir hesap — `plain` geçerken `trend` zıplayabilir.
 *
 * Tolerans 1 piksel: alt piksel yuvarlaması regresyon değil.
 */
export const LoadingDoesNotShiftLayout: Story = {
  args: { description: 'Moderasyon kuyruğunda inceleme bekliyor' },
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem', alignItems: 'start', maxWidth: '20rem' }}>
      {OLCULEN_VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <div data-testid={`${variant}-yukleniyor`}>
            <StatCard {...args} variant={variant} loading />
          </div>
          <div data-testid={`${variant}-yuklendi`}>
            <StatCard {...args} variant={variant} loading={false} trend={KUYRUK_ARTTI} />
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const yukseklik = (testId: string) => canvas.getByTestId(testId).getBoundingClientRect().height

    /*
      Fark listesi olarak toplanıyor: `toEqual([])` düşerse hangi varyantın kaç
      piksel zıpladığını hata mesajının kendisi söyler — döngü içinde tek tek
      assert etmek "bir yerde patladı" demekle yetinirdi.
    */
    const ziplayanlar = OLCULEN_VARYANTLAR.map((variant) => ({
      variant,
      fark: Math.abs(yukseklik(`${variant}-yukleniyor`) - yukseklik(`${variant}-yuklendi`)),
    })).filter((olcum) => olcum.fark > 1)

    await expect(ziplayanlar).toEqual([])
  },
}

/**
 * Yeni kurulmuş bir panelin ilk günü (`emptyDashboardMetrics`).
 *
 * **Sıfır boş değildir.** "Bekleyen ilan: 0" gerçek ve iyi bir haberdir; kartın
 * EmptyState'e dönmesi bilgiyi silerdi. Kartın gösterecek verisi olmaması (sorgu
 * boş veya hatalı) sayfanın sorunudur — sözleşmede hata kanalı yok, ekran
 * EmptyState/ErrorState gösterir.
 */
export const ZeroValues: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: '20rem' }}>
      <StatCard
        label="Bekleyen ilan"
        value={emptyDashboardMetrics.pendingReviewCount}
        description="Kuyruk boş; incelenecek ilan yok"
        icon={<Clock size={20} />}
      />
      <StatCard
        label="Red oranı"
        value={yuzde(emptyDashboardMetrics.rejectionRate)}
        description="Henüz karar verilmedi"
        trend={SABIT}
      />
    </div>
  ),
}

export const PositiveTrend: Story = {
  args: {
    label: 'Bugünkü yeni ilan',
    value: dashboardMetrics.newListingCountToday,
    description: 'Geçen haftanın aynı gününe göre',
    icon: <FilePlus2 size={20} />,
    trend: GIRIS_ARTTI,
  },
}

export const NegativeTrend: Story = {
  args: {
    description: 'Geçen haftanın aynı gününe göre',
    icon: <Clock size={20} />,
    trend: KUYRUK_ARTTI,
  },
}

/** Trend yoksa pil çizilmez — ama yeri durur; veri gelince kart büyümemeli. */
export const NoTrend: Story = {
  args: {
    label: 'Açık şikayet',
    value: dashboardMetrics.openReportCount,
    description: 'Karşılaştırma dönemi seçilmedi',
    icon: <Flag size={20} />,
  },
}

/** Düz çizgi: değişim yok. Nötr, "kötü" değil — vurgusuz. */
export const FlatTrend: Story = {
  args: {
    label: 'Açık şikayet',
    value: dashboardMetrics.openReportCount,
    description: 'Geçen haftaya göre değişmedi',
    icon: <Flag size={20} />,
    trend: SABIT,
  },
}

/**
 * **Yukarı ok, kırmızı.** Component'in var oluş sebebi olan ayrım:
 * red oranının artması yükselen bir sayıdır ama kötü bir haberdir. Tek bir
 * "trend" alanı olsaydı kart ya yeşil ok çizerdi ya da aşağı ok.
 */
export const UpButNegative: Story = {
  args: {
    label: 'Red oranı',
    value: yuzde(dashboardMetrics.rejectionRate),
    description: 'Son 30 gün',
    icon: <Percent size={20} />,
    trend: RED_ORANI_ARTTI,
  },
}

/** Simetriği: **aşağı ok, yeşil.** İnceleme süresinin düşmesi iyi haberdir. */
export const DownButPositive: Story = {
  args: {
    label: 'Ortalama inceleme süresi',
    value: dakika(dashboardMetrics.averageReviewMinutes),
    description: 'İlan kuyruğa girdikten karar verilene kadar',
    icon: <Timer size={20} />,
    trend: SURE_DUSTU,
  },
}

/**
 * İki eksenin gerçekten bağımsız olduğu DOM'dan ölçülüyor.
 *
 * Aynı `direction`, farklı `sentiment` iki kart: okları aynı, renkleri farklı
 * olmalı. Renk iddiası `getComputedStyle` ile ölçülüyor — bu repoda testler
 * geçerken stilin bozuk kaldığı görüldü, "recipe'de yazıyor" yeterli değil.
 */
export const SentimentIsIndependentOfDirection: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: '20rem' }}>
      <StatCard
        label="Bugünkü yeni ilan"
        value={dashboardMetrics.newListingCountToday}
        description="Artması iyi: platform büyüyor"
        trend={GIRIS_ARTTI}
      />
      <StatCard
        label="Red oranı"
        value={yuzde(dashboardMetrics.rejectionRate)}
        description="Artması kötü: ilan kalitesi düşüyor"
        trend={RED_ORANI_ARTTI}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const olumlu = canvasElement.querySelector('[data-sentiment="positive"]')
    const olumsuz = canvasElement.querySelector('[data-sentiment="negative"]')

    if (olumlu === null || olumsuz === null) {
      throw new Error('İki trend pili de render edilmeliydi')
    }

    // Yön aynı: ikisi de artış.
    await expect(olumlu).toHaveAttribute('data-direction', 'up')
    await expect(olumsuz).toHaveAttribute('data-direction', 'up')

    // Renk farklı: yorumu `sentiment` veriyor, `direction` değil.
    await expect(getComputedStyle(olumlu).color).not.toBe(getComputedStyle(olumsuz).color)
  },
}

/**
 * Ok `aria-hidden`; yön ve duygu erişilebilir ada **metin** olarak girmeli.
 *
 * Erişilebilir adın kendisi ölçülüyor, `getByText` değil: metin DOM'da durup
 * ada girmiyor olabilir (`display: none` ile gizlenseydi tam olarak bu olurdu).
 */
export const TrendIsAnnouncedAsText: Story = {
  args: {
    label: 'Red oranı',
    value: yuzde(dashboardMetrics.rejectionRate),
    trend: RED_ORANI_ARTTI,
    onClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const kart = canvas.getByRole('button')

    await expect(kart).toHaveAccessibleName(/Red oranı/)
    await expect(kart).toHaveAccessibleName(/artış/)
    await expect(kart).toHaveAccessibleName(/olumsuz/)
  },
}

/** Tıklanabilir kart: genelde filtrelenmiş ilan listesine götürür. */
export const Clickable: Story = {
  args: {
    variant: 'accent',
    description: 'Moderasyon kuyruğuna gitmek için tıklayın',
    icon: <Clock size={20} />,
    trend: KUYRUK_ARTTI,
    onClick: fn(),
  },
}

/**
 * Tıklanabilir kart gerçekten `<button>` olmalı: klavyeyle odaklanmalı ve hem
 * Enter hem Space'e cevap vermeli. `<div onClick>` üçünü de yapmaz ve bu, ancak
 * fareyle test edildiğinde gözden kaçar.
 */
export const ClickableIsRealButton: Story = {
  args: { onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const kart = canvas.getByRole('button', { name: /Bekleyen ilan/ })

    kart.focus()
    await expect(kart).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await expect(args.onClick).toHaveBeenCalledTimes(1)

    await userEvent.keyboard(' ')
    await expect(args.onClick).toHaveBeenCalledTimes(2)
  },
}

/** `onClick` yoksa buton hiç olmamalı — tıklanamayan şey tıklanabilir görünmez. */
export const NotClickableHasNoButton: Story = {
  args: { description: 'Moderasyon kuyruğunda inceleme bekliyor', trend: KUYRUK_ARTTI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
    // Veri yine de okunuyor: kart tıklanamaz, görünmez değil.
    await expect(canvas.getByText('Bekleyen ilan')).toBeInTheDocument()
    await expect(canvas.getByText('37')).toBeInTheDocument()
  },
}

/** İkon dekoratif: anlamı `label` taşır, ekran okuyucu ikonu görmemeli. */
export const IconIsDecorative: Story = {
  args: { icon: <Clock size={20} /> },
  play: async ({ canvasElement }) => {
    const ikon = canvasElement.querySelector('svg')

    if (ikon === null) throw new Error('İkon render edilmeliydi')

    /*
      Doğrudan kabı ölçülüyor, `closest()` ile atası aranmıyor: bu repoda
      `closest()` bir üst elementi bulup testi boşuna yeşile boyamıştı.
    */
    await expect(ikon.parentElement).toHaveAttribute('aria-hidden', 'true')
  },
}

/** Uzun etiket, uzun değer ve uzun açıklama: hiçbiri kartı taşırmamalı. */
export const LongContent: Story = {
  args: {
    label: 'Son 30 günde moderatör kararıyla yayına alınan toplam ilan sayısı',
    value: '1.284.937.512 ₺',
    description:
      'Onaylanan ilanların toplam portföy değeri; devremülk ve turistik tesis ilanları dahil, ' +
      'kur farkından arındırılmamıştır ve yalnızca aktif yayındaki kayıtları kapsar.',
    icon: <Percent size={20} />,
    trend: { direction: 'up', value: '+%14,7 (geçen aya göre)', sentiment: 'positive' },
  },
  render: (args) => (
    <div style={{ maxWidth: '20rem' }}>
      <StatCard {...args} />
    </div>
  ),
}

/**
 * Gerçek dashboard satırı: brifing 5.2'nin beş metriği, `fixtures/dashboard.ts`'ten.
 *
 * İki yön ve üç duygu bir arada görünüyor — asıl sınav bu: aynı satırda "yeni
 * ilan ↑ yeşil" ile "red oranı ↑ kırmızı" yan yana durunca ayrımın işe yarayıp
 * yaramadığı anlaşılıyor.
 */
export const DashboardRow: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))',
        padding: '1rem',
      }}
    >
      <StatCard
        variant="accent"
        label="Bekleyen ilan"
        value={dashboardMetrics.pendingReviewCount}
        description="Moderasyon kuyruğu"
        icon={<Clock size={20} />}
        trend={KUYRUK_ARTTI}
        onClick={fn()}
      />
      <StatCard
        label="Bugünkü yeni ilan"
        value={dashboardMetrics.newListingCountToday}
        description="Bugün girilen ilanlar"
        icon={<FilePlus2 size={20} />}
        trend={GIRIS_ARTTI}
      />
      <StatCard
        label="Red oranı"
        value={yuzde(dashboardMetrics.rejectionRate)}
        description="Son 30 gün"
        icon={<Percent size={20} />}
        trend={RED_ORANI_ARTTI}
      />
      <StatCard
        label="Ortalama inceleme süresi"
        value={dakika(dashboardMetrics.averageReviewMinutes)}
        description="Kuyruğa girişten karara"
        icon={<Timer size={20} />}
        trend={SURE_DUSTU}
      />
      <StatCard
        label="Açık şikayet"
        value={dashboardMetrics.openReportCount}
        description="Sonuçlandırılmayı bekliyor"
        icon={<Flag size={20} />}
        trend={SABIT}
      />
    </div>
  ),
}

/** 320 pikselde: kart tek sütuna düşer, uzun açıklama sarar, taşma olmaz. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    variant: 'accent',
    description: 'Moderasyon kuyruğunda inceleme bekliyor',
    icon: <Clock size={20} />,
    trend: KUYRUK_ARTTI,
  },
}

export const VariantsComparison: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem', padding: '1rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem', maxWidth: '22rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <StatCard
            {...args}
            variant={variant}
            description="Moderasyon kuyruğunda inceleme bekliyor"
            icon={<Clock size={20} />}
            trend={KUYRUK_ARTTI}
          />
        </div>
      ))}
    </div>
  ),
}
