import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarRange, Download } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { expect, fn, userEvent, within } from 'storybook/test'
import {
  ListingCategory,
  type CategoryDistributionItem,
  type TimeSeriesPoint,
} from '../../../types/domain'
import { LISTING_CATEGORY_LABEL } from '../../../domain/labels'
import { formatDate } from '../../../utils/formatDateTime'
import { Button } from '../../primitives/Button'
import { categoryDistribution, dailyModerationCount, dailyNewListings } from '../../../fixtures'
import { ChartCard } from './ChartCard'

const YUKSEKLIKLER = ['sm', 'md', 'lg'] as const

/**
 * Grafik renkleri token'dan okunuyor: SVG `stroke`/`fill` birer sunum
 * özelliğidir, `var()` orada da çalışır. Bonus olarak tema değişince grafik
 * yeniden render edilmeden rengini günceller — değerler CSS'te çözülüyor.
 */
const SERI_RENGI = 'var(--color-primary-600)'
const IZGARA_RENGI = 'var(--color-border-subtle)'
const EKSEN_RENGI = 'var(--color-text-muted)'

/**
 * Renk **kategoriye** eşleniyor, dizideki sırasına değil.
 *
 * Sıraya bağlansaydı bir kategori filtrelenip dizi kısaldığında "Konut mavidir"
 * varsayımı sessizce bozulur, aynı kategori iki ekranda iki renk olurdu.
 * `satisfies Record<ListingCategory, string>` yeni bir kategori eklendiğinde
 * derlemeyi kırar — renksiz dilim çıkmaz. Dizi indekslemediği için
 * `noUncheckedIndexedAccess` altında `undefined` da üretmez; `Cell.fill`
 * `string | undefined` kabul etmiyor (`exactOptionalPropertyTypes` → TS2375).
 */
const KATEGORI_RENGI = {
  [ListingCategory.Residential]: 'var(--color-primary-600)',
  [ListingCategory.Land]: 'var(--color-success-600)',
  [ListingCategory.Commercial]: 'var(--color-warning-600)',
  [ListingCategory.Building]: 'var(--color-danger-600)',
  [ListingCategory.Timeshare]: 'var(--color-info-600)',
  [ListingCategory.TourismFacility]: 'var(--color-neutral-500)',
} as const satisfies Record<ListingCategory, string>

/** Spinner ve Checkbox'taki `visuallyHidden` ile aynı teknik; story'ye özel olduğu için yerel. */
const GIZLI_METIN: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
}

/**
 * Grafiğin `children` içinde nasıl paketlenmesi gerektiğinin örneği.
 *
 * Grafik dekoratif kabul edilip AT'den gizleniyor, veriyi `ozet` taşıyor:
 * ChartCard grafiğe `role="img"` **vermez**, çünkü o rol alt ağacı erişilebilirlik
 * ağacından siler ve tam da bu özeti gizlerdi. Sorumluluk burada.
 *
 * `accessibilityLayer={false}` şart: Recharts 3'te varsayılan `true` ve grafiğin
 * `<svg>`'sine `tabIndex=0` + `role="application"` koyuyor. `aria-hidden` bir
 * kabın içindeki odaklanılabilir öğe axe'ın `aria-hidden-focus` ihlalidir —
 * klavye oraya gider, ekran okuyucu "burada bir şey yok" der.
 */
function GrafikAlani({ children, ozet }: { children: ReactNode; ozet: string }) {
  return (
    <>
      <div aria-hidden="true" style={{ height: '100%' }}>
        {children}
      </div>
      <p style={GIZLI_METIN}>{ozet}</p>
    </>
  )
}

/** Seriyi tek cümlede özetler. `Math.min(...)` indekslemiyor — `noUncheckedIndexedAccess` derdi yok. */
function seriOzeti(baslik: string, data: TimeSeriesPoint[]): string {
  const degerler = data.map((nokta) => nokta.value)
  const toplam = degerler.reduce((acc, deger) => acc + deger, 0)

  return (
    `${baslik}: ${data.length} günlük seri, toplam ${toplam.toLocaleString('tr-TR')}. ` +
    `En düşük ${Math.min(...degerler).toLocaleString('tr-TR')}, ` +
    `en yüksek ${Math.max(...degerler).toLocaleString('tr-TR')}.`
  )
}

/**
 * Eksen etiketlerinde `formatDate` kullanılıyor, yerel bir `Intl` kurulmuyor:
 * biçimlendirici verilmezse tarih makinenin diline ve saat dilimine göre değişir
 * (Chromatic her runner'da fark üretir). `interval` ile 30 etiketten beşi
 * gösteriliyor — hepsi çizilseydi üst üste binerdi; küçültmek çözüm değil, panelin
 * kuralı görünür metnin `1rem` altına düşmemesi.
 */
function GunlukIlanGrafigi({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <GrafikAlani ozet={seriOzeti('Günlük yeni ilan', data)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} accessibilityLayer={false}>
          <CartesianGrid strokeDasharray="3 3" stroke={IZGARA_RENGI} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDate(value)}
            interval={6}
            stroke={EKSEN_RENGI}
          />
          <YAxis stroke={EKSEN_RENGI} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={SERI_RENGI}
            fill={SERI_RENGI}
            fillOpacity={0.15}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </GrafikAlani>
  )
}

/** `isAnimationActive={false}`: animasyonlu ilk çizim Chromatic'te her build'de farklı kare yakalatır. */
function ModerasyonGrafigi({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <GrafikAlani ozet={seriOzeti('Günlük moderasyon kararı', data)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} accessibilityLayer={false}>
          <CartesianGrid strokeDasharray="3 3" stroke={IZGARA_RENGI} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDate(value)}
            interval={6}
            stroke={EKSEN_RENGI}
          />
          <YAxis stroke={EKSEN_RENGI} />
          <Bar dataKey="value" fill={SERI_RENGI} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </GrafikAlani>
  )
}

/** Kategori adı `domain/labels.ts`'ten; grafik kendi sözlüğünü kurmaz. */
function KategoriGrafigi({ data }: { data: CategoryDistributionItem[] }) {
  const dilimler = data.map((item) => ({
    ad: LISTING_CATEGORY_LABEL[item.category],
    count: item.count,
    ratio: item.ratio,
    renk: KATEGORI_RENGI[item.category],
  }))

  const ozet = dilimler.map((dilim) => `${dilim.ad} %${Math.round(dilim.ratio * 100)}`).join(', ')

  return (
    <GrafikAlani ozet={`Kategori dağılımı: ${ozet}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart accessibilityLayer={false}>
          {/* Dilim adları `Legend`'de: pasta üstüne yazılan etiketler dar kapta üst üste biner. */}
          <Legend />
          {/*
            `rootTabIndex={-1}` şart ve `accessibilityLayer={false}` bunu
            KAPSAMIYOR — ikisi Recharts'ta bağımsız iki kapı. `Pie`'ın kendi
            `rootTabIndex` prop'u var ve varsayılanı **0** (`polar/Pie.js:554`):
            kök `<Layer>`'ına `tabIndex={0}` basıyor, yani `aria-hidden` kabın
            içinde tab sırasına giren bir `<g>` kalıyor. Alan/çubuk/çizgi
            grafiklerinde bu prop yok, bu yüzden yalnız pasta düşüyordu.
            Ölçüm: `ChartIsHiddenButSummaryIsNot` (GIZLI_KAPTA_TAB_SIRASI).
          */}
          <Pie
            data={dilimler}
            dataKey="count"
            nameKey="ad"
            rootTabIndex={-1}
            isAnimationActive={false}
          >
            {dilimler.map((dilim) => (
              <Cell key={dilim.ad} fill={dilim.renk} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </GrafikAlani>
  )
}

/** `sm` kabın işi: eksensiz trend. Sayıyı StatCard söyler, eğri yalnız yönü gösterir. */
function MiniEgri({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <GrafikAlani ozet={seriOzeti('Son yedi gün', data)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} accessibilityLayer={false}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={SERI_RENGI}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </GrafikAlani>
  )
}

const ARAC_CUBUGU = (
  <>
    <Button variant="secondary" size="sm" leadingIcon={<CalendarRange size={16} />}>
      Son 30 gün
    </Button>
    <Button variant="ghost" size="sm" leadingIcon={<Download size={16} />}>
      CSV indir
    </Button>
  </>
)

const meta = {
  title: 'Composites/ChartCard',
  component: ChartCard,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dashboard grafiklerinin **salt kabı**: grafiği kendi çizmez, veriyi kendi çekmez — ' +
          'başlık, araç çubuğu, sabit yükseklik ve dört durum (loading/error/empty/success) onun işi. ' +
          'Grafik alanının yüksekliği dört durumda da aynıdır: Recharts `ResponsiveContainer` ölçüyü ' +
          'ebeveynden okur, yükseklik içeriğe bağlı olsaydı sıfır ölçülür ve grafik **hata vermeden** ' +
          'hiç çizilmezdi. Kap `<section aria-labelledby>` ile adlandırılır ama grafiğe `role="img"` ' +
          '**vermez**: o rol alt ağacı erişilebilirlik ağacından siler ve grafiğin yanına konan tablo ' +
          'alternatifini de gizlerdi. Durum sırası: loading → error → empty → children.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'chart-container',
      useWhen: [
        'Dashboard veya istatistik ekranında bir grafiği başlık, araç çubuğu ve yükleme/boş/hata durumlarıyla çerçevelerken',
        'Birbirinden bağımsız yüklenen grafiklerde her birinin kendi hata bloğu gerekiyorsa (partialSuccess)',
      ],
      doNotUseWhen: [
        'Tek bir KPI sayısı gösterilecekse — StatCard kullanın',
        'Grafik çizmek için: kart grafik değildir, Recharts bileşenini children olarak verin',
        'Tablo verisi için — DataTable kullanın',
      ],
    },
  },

  args: {
    title: 'Günlük yeni ilan',
    description: '17 Haziran – 16 Temmuz 2026 arası, güne göre ilan girişi',
    height: 'md',
    children: <GunlukIlanGrafigi data={dailyNewListings} />,
  },

  argTypes: {
    height: { control: 'inline-radio', options: YUKSEKLIKLER },
    children: { control: false },
    toolbar: { control: false },
    error: { control: false },
  },
} satisfies Meta<typeof ChartCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Aralık seçici ve dışa aktarma sağ üstte; brifing 2.2'nin iki eylemi. */
export const WithToolbar: Story = {
  args: { toolbar: ARAC_CUBUGU },
}

/** Araç çubuğu verilmezse şerit hiç render edilmez — boş bir kolon kalmaz. */
export const WithoutToolbar: Story = {}

/**
 * Açıklamasız kart: başlık kendi başına yeterliyse ikinci satır zorlanmaz.
 *
 * `args`'a `description: undefined` **yazılamıyor** — `exactOptionalPropertyTypes`
 * açıkken prop'un tipi `string`, `string | undefined` değil (TS2375). Prop'un
 * yokluğunu anlatmanın yolu onu `render`'da args'tan ayıklamak.
 */
export const WithoutDescription: Story = {
  render: ({ description: _description, ...args }) => <ChartCard {...args} />,
}

/** Eksensiz mini eğri: StatCard'ın yanında trendi gösterir. */
export const SmallHeight: Story = {
  args: {
    title: 'Son 7 gün',
    description: 'Yeni ilan trendi',
    height: 'sm',
    children: <MiniEgri data={dailyNewListings.slice(-7)} />,
  },
}

export const MediumHeight: Story = {
  args: { height: 'md' },
}

/** Dashboard'un ana grafiği: 30 günün tamamı okunabilir kalır. */
export const LargeHeight: Story = {
  args: {
    height: 'lg',
    toolbar: ARAC_CUBUGU,
  },
}

/** Skeleton grafiğin yerini birebir kaplar; veri gelince kart zıplamaz (brifing 2.1). */
export const Loading: Story = {
  args: { loading: true, toolbar: ARAC_CUBUGU },
}

/** Seçilen aralıkta hiç veri yok — eksen çizip veri çizmemekten farklı bir hâl. */
export const Empty: Story = {
  args: { empty: true, toolbar: ARAC_CUBUGU },
}

/** `section` varyantı: kart düşer, dashboard'ın kalanı ayakta kalır (2.2 `partialSuccess`). */
export const Error: Story = {
  args: {
    toolbar: ARAC_CUBUGU,
    error: {
      title: 'Grafik yüklenemedi',
      message: 'İstatistik servisine ulaşılamadı. Araç çubuğundan aralığı yeniden seçebilirsiniz.',
      code: 'DASHBOARD_TIMEOUT',
      retryable: true,
    },
  },
}

/** Tekrar denemenin işe yaramayacağı hata; kart yine de aynı yeri kaplar. */
export const ErrorNonRetryable: Story = {
  args: {
    error: {
      title: 'Bu grafiği görme yetkiniz yok',
      message: 'Moderatör bazında işlem hacmi yalnızca yönetici rollerine açıktır.',
      code: 'FORBIDDEN',
      retryable: false,
    },
  },
}

export const Success: Story = {
  args: { toolbar: ARAC_CUBUGU },
}

/** Kategori dağılımı: dilim adları `domain/labels.ts`'ten gelir. */
export const CategoryDistribution: Story = {
  args: {
    title: 'Kategori dağılımı',
    description: 'Son 30 günde yayına alınan 3.100 ilanın kategorilere dağılımı',
    height: 'lg',
    children: <KategoriGrafigi data={categoryDistribution} />,
  },
  /**
   * Odak tuzağı ölçümü **pasta grafiğinde de** yapılıyor.
   *
   * `ChartIsHiddenButSummaryIsNot` aynı iddiayı ölçüyor ama meta'nın
   * varsayılan args'ıyla, yani **alan grafiğiyle**. Doğru şeyi yanlış grafikte
   * ölçüyordu: `tabIndex` kapısı grafik tipine göre değişiyor ve `Pie`
   * `rootTabIndex` ile kendi kapısını açıyor (varsayılan 0). Alan grafiği o
   * prop'a sahip olmadığı için iddia orada her koşulda geçiyordu.
   */
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[aria-hidden="true"] svg')).not.toBeNull()
    await expect(canvasElement.querySelector(GIZLI_KAPTA_TAB_SIRASI)).toBeNull()
  },
}

/** Günlük moderasyon kararı (onay + red). Hafta sonu çukurları fixture'ın kendi verisi. */
export const ModerationVolume: Story = {
  args: {
    title: 'Günlük moderasyon kararı',
    description: 'Onay ve reddin toplamı; hafta sonları ekip çalışmıyor',
    height: 'lg',
    toolbar: ARAC_CUBUGU,
    children: <ModerasyonGrafigi data={dailyModerationCount} />,
  },
}

/** Uzun başlık + uzun açıklama + kalabalık araç çubuğu: sarmalı, taşmamalı. */
export const LongContent: Story = {
  args: {
    title:
      'Moderatör bazında günlük işlem hacmi ve ortalama inceleme süresi (yalnızca yetkili roller)',
    description:
      'Son 30 günün her günü için verilen onay, red ve düzeltme isteği kararlarının moderatöre göre kırılımı; ortalama inceleme süresi ikinci eksende gösterilir ve hafta sonları ekip çalışmadığı için seri doğal olarak çukurlaşır.',
    height: 'lg',
    toolbar: (
      <>
        <Button variant="secondary" size="sm" leadingIcon={<CalendarRange size={16} />}>
          Son 30 gün
        </Button>
        <Button variant="ghost" size="sm">
          Moderatör filtresi
        </Button>
        <Button variant="ghost" size="sm" leadingIcon={<Download size={16} />}>
          CSV indir
        </Button>
      </>
    ),
  },
}

/** 320 pikselde: araç çubuğu alt satıra sarar, kart yatay kaydırma üretmez. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { toolbar: ARAC_CUBUGU },
}

export const MobileEmpty: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { empty: true },
}

/**
 * Kabın erişilebilir adı başlıktan gelmeli.
 *
 * DOM'dan ölçülüyor: `aria-labelledby` bağı yanlış id'ye giderse kart adsız bir
 * bölge olur, ekran okuyucu "bölge" deyip hangi grafik olduğunu söylemez —
 * gözle bakınca hiçbir şey bozuk görünmez.
 */
export const CardIsLabelledByTitle: Story = {
  args: { title: 'Günlük yeni ilan', description: 'Son 30 gün' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bolge = canvas.getByRole('region', { name: 'Günlük yeni ilan' })

    await expect(bolge).toHaveAccessibleDescription('Son 30 gün')
  },
}

/**
 * `aria-hidden` bir kabın içinde **tab sırasına giren** öğelerin seçicisi.
 *
 * Ölçülen şey "odaklanılabilir" değil, **tabbable**: `tabindex="-1"` bir ihlal
 * _değildir_. Axe'ın `aria-hidden-focus` kuralı işi `focusable-not-tabbable`
 * kontrolüne veriyor, o da yalnız `tabindex >= 0` olanları sayıyor
 * (`getTabbableElements`); `-1` tanımı gereği tab sırasında değil, üstelik axe'ın
 * ihlal için önerdiği düzeltmenin ta kendisi.
 *
 * Bu ayrım teorik değil: Recharts kendi katmanlarına (`recharts-zIndex-layer_*`)
 * `accessibilityLayer`'dan **bağımsız** olarak `tabindex="-1"` basıyor —
 * kaynağındaki yorum birebir "these g elements should not be tabbable"
 * (`zIndex/ZIndexPortal.js`). Çıplak bir `[tabindex]` sorgusu kütüphanenin bu
 * zararsız iç markup'ına takılır; aranan şey `accessibilityLayer`'ın `<svg>`'ye
 * koyduğu `tabIndex=0`'dır (`container/RootSurface.js`) ve o hâlâ yakalanıyor.
 *
 * Native tabbable'lar da listede: `tabindex`'i olmayan bir `<button>` de tab
 * sırasındadır ve `[tabindex]` sorgusunun **hiç göremeyeceği** gerçek bir ihlal
 * olurdu — `children` bir gün grafiğin yanına kontrol koyarsa burada düşer.
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
 * Grafik AT'den gizli, özeti gizli değil.
 *
 * "Grafik ekran okuyucuya bir şey söylemez" iddiası ancak DOM'dan ölçülür:
 * `<svg>` erişilebilirlik ağacında olmamalı ama onun yerine geçen özet metin
 * `getByText` ile bulunabilir olmalı. Grafiğe `role="img"` verilseydi bu test
 * düşerdi — rol alt ağacı siler.
 */
export const ChartIsHiddenButSummaryIsNot: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText(/30 günlük seri/)).toBeInTheDocument()
    await expect(canvas.queryByRole('img')).not.toBeInTheDocument()

    /*
      Grafiğin gizli kabın **içinde** olduğu önce ölçülüyor, çünkü hem üstteki
      `queryByRole('img')` hem alttaki `toBeNull()` grafik hiç çizilmemişken de
      geçer: ikisi de bir yokluğu ölçüyor. `GrafikAlani` bir gün `aria-hidden`'ı
      düşürse ya da grafik ölçüsüz kapta hiç çizilmese, story adının iddiası
      ("chart is hidden") sessizce ölçülmez olurdu.
    */
    await expect(canvasElement.querySelector('[aria-hidden="true"] svg')).not.toBeNull()

    /*
      Odak tuzağı ölçümü: `aria-hidden` bir kabın içinde tab sırasına giren
      hiçbir şey kalmamalı (axe `aria-hidden-focus`). Rol sorgusuyla ölçülemez —
      testing-library aria-hidden alt ağacını zaten dışlar, yani `queryByRole`
      grafiğe `accessibilityLayer` geri gelse de `null` döner ve test sessizce
      dişsizleşirdi. Bu yüzden doğrudan DOM'a bakılıyor.
    */
    await expect(canvasElement.querySelector(GIZLI_KAPTA_TAB_SIRASI)).toBeNull()
  },
}

/** Hata varken `children` DOM'a **hiç** girmemeli: düşmüş sorgunun eski grafiği yalan söyler. */
export const ErrorReplacesChart: Story = {
  args: {
    error: {
      title: 'Grafik yüklenemedi',
      message: 'İstatistik servisine ulaşılamadı.',
      code: 'DASHBOARD_TIMEOUT',
      retryable: true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Grafik yüklenemedi')
    await expect(canvas.getByText('DASHBOARD_TIMEOUT')).toBeInTheDocument()
    await expect(canvas.queryByText(/30 günlük seri/)).not.toBeInTheDocument()
    /* Başlık ve araç çubuğu ayakta: hata grafiğin, kartın değil. */
    await expect(canvas.getByRole('region', { name: 'Günlük yeni ilan' })).toBeInTheDocument()
  },
}

/**
 * `retryable: true` **tek başına** butonu çıkarmaz: `onRetry` de bağlanmalı.
 *
 * Kanal artık sözleşmede var (bkz. `ErrorCanBeRetried`), ama kural değişmedi —
 * hatanın "tekrar denenebilir" olduğunu bilmek, tekrar denemeyi **yapabilmek**
 * demek değil. Handler'sız buton basınca hiçbir şey yapmazdı; sunmamak doğrusu.
 */
export const ErrorHasNoRetryButton: Story = {
  args: {
    toolbar: ARAC_CUBUGU,
    error: {
      title: 'Grafik yüklenemedi',
      message: 'İstatistik servisine ulaşılamadı.',
      retryable: true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).not.toBeInTheDocument()
    /* Çıkış yolu araç çubuğunda: aralığı yeniden seçmek sorguyu tetikler. */
    await expect(canvas.getByRole('button', { name: 'Son 30 gün' })).toBeInTheDocument()
  },
}

/**
 * `onRetry` bağlıyken buton çıkar ve **yalnız o grafiği** tazeler.
 *
 * Dashboard'ın `partialSuccess` hâlinin karşılığı: düşen grafik kendi tekrar
 * denemesini taşır, ayakta kalan KPI kartları ve öteki grafikler tazelenmez.
 * Kart sorguyu kendi atmaz — yalnız haber verir.
 */
export const ErrorCanBeRetried: Story = {
  args: {
    error: {
      title: 'Grafik yüklenemedi',
      message: 'İstatistik servisine ulaşılamadı.',
      retryable: true,
    },
    onRetry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Tekrar dene' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * `retryable: false` iken `onRetry` verilse **bile** buton çıkmaz.
 *
 * İki kapı birden açılmalı. Tekrar denemenin işe yaramayacağını söyleyen bir
 * hatada (yetkisiz, kayıt yok) handler'ın varlığı o gerçeği değiştirmez;
 * sayfanın handler'ı her hata için tek yerde bağlaması hatanın cinsini
 * unutturmamalı.
 */
export const NonRetryableErrorIgnoresHandler: Story = {
  args: {
    error: {
      title: 'Bu grafiği görme yetkiniz yok',
      message: 'Dashboard metriklerine erişim için yöneticinize başvurun.',
      retryable: false,
    },
    onRetry: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).not.toBeInTheDocument()
  },
}

export const EmptyReplacesChart: Story = {
  args: { empty: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Seçilen tarih aralığında veri yok')).toBeInTheDocument()
    await expect(canvas.queryByText(/30 günlük seri/)).not.toBeInTheDocument()
  },
}

/** `loading` hatayı da boşluğu da yener: yeniden denenen sorguda "yükleniyor" daha yeni bilgidir. */
export const LoadingBeatsErrorAndEmpty: Story = {
  args: {
    loading: true,
    empty: true,
    error: {
      title: 'Grafik yüklenemedi',
      message: 'İstatistik servisine ulaşılamadı.',
      retryable: true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
    await expect(canvas.queryByText('Seçilen tarih aralığında veri yok')).not.toBeInTheDocument()
    await expect(canvas.getByRole('region', { name: 'Günlük yeni ilan' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
  },
}

/**
 * Aynı `height` ile loading ve success kartları **aynı yüksekliği** kaplamalı.
 *
 * Ölçüm gerçek: iki kart yan yana render edilip `offsetHeight`'ları
 * karşılaştırılıyor. Bu, "loading layout shift üretmez" (brifing 2.1) iddiasının
 * tek dürüst kanıtı — skeleton'ın kodda `height="100%"` yazıyor olması, kabın
 * yüksekliğinin sabit çözüldüğünü göstermez.
 */
export const LoadingKeepsCardHeight: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div style={{ display: 'grid', gap: '1rem', padding: '1rem' }}>
      <ChartCard {...args} loading title="Yükleniyor" />
      <ChartCard {...args} title="Dolu" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* `getByRole` `HTMLElement` döndürüyor; `offsetHeight` için ayrıca daraltma gerekmiyor. */
    const yuklenen = canvas.getByRole('region', { name: 'Yükleniyor' })
    const dolu = canvas.getByRole('region', { name: 'Dolu' })

    await expect(yuklenen.offsetHeight).toBe(dolu.offsetHeight)
  },
}

/** Üç yükseklik yan yana: fark gözle görülmeli, kartların iskeleti değişmemeli. */
export const VariantsComparison: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem', padding: '1rem' }}>
      {YUKSEKLIKLER.map((height) => (
        <ChartCard
          {...args}
          key={height}
          height={height}
          title={`height="${height}"`}
          toolbar={ARAC_CUBUGU}
        />
      ))}
    </div>
  ),
}

/** Dört durum yan yana: kabın ölçüsü değişmiyor, yalnız içi değişiyor. */
export const StatesComparison: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem', padding: '1rem' }}>
      <ChartCard {...args} title="loading" loading />
      <ChartCard
        {...args}
        title="error"
        error={{
          title: 'Grafik yüklenemedi',
          message: 'İstatistik servisine ulaşılamadı.',
          code: 'DASHBOARD_TIMEOUT',
          retryable: true,
        }}
      />
      <ChartCard {...args} title="empty" empty />
      <ChartCard {...args} title="success" />
    </div>
  ),
}
