import type { ReactNode } from 'react'
import { CheckCircle2, Clock, FilePlus2, Flag, Percent, Timer, XCircle } from 'lucide-react'
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
import { Alert } from '../../components/primitives/Alert'
import { Button } from '../../components/primitives/Button'
import { DateRangePicker } from '../../components/primitives/DateRangePicker'
import { ChartCard } from '../../components/composites/ChartCard'
import { EmptyState } from '../../components/composites/EmptyState'
import { ErrorState } from '../../components/composites/ErrorState'
import { ListingCard } from '../../components/composites/ListingCard'
import { ModerationHistory } from '../../components/composites/ModerationHistory'
import { StatCard } from '../../components/composites/StatCard'
import { LISTING_CATEGORY_LABEL } from '../../domain/labels'
import { formatDate } from '../../utils/formatDateTime'
import {
  ListingCategory,
  type CategoryDistributionItem,
  type DashboardMetrics,
  type TimeSeriesPoint,
} from '../../types/domain'
import type { DashboardStatsProps, DateRange, UiError } from '../../types/component-props'
import * as css from './DashboardStats.css'

/**
 * `onMetricClick`in taşıdığı kimlik uzayı.
 *
 * **Karar: `metricId` = `DashboardMetrics`in skaler alan adı.** Sözleşme
 * `onMetricClick?: (metricId: string) => void` diyor ve id'lerin ne olduğunu
 * söylemiyor; uydurma bir sözlük (`'pending'`, `'kpi-1'`) yerine verinin kendi
 * anahtar uzayı seçildi, çünkü ekranın **öteki** kanalı zaten o uzayı
 * kullanıyor: `AsyncState`in `partialSuccess`i hataları
 * `Partial<Record<keyof DashboardMetrics & string, UiError>>` ile adresliyor.
 * İki ayrı sözlük olsaydı "hangi kart düştü" ile "hangi karta tıklandı" aynı
 * ekranda iki farklı dille konuşurdu.
 *
 * Ekranın ürettiği **tek** id kümesi bu yedisi:
 * `pendingReviewCount`, `newListingCountToday`, `publishedListingCount`,
 * `rejectedListingCount`, `rejectionRate`, `averageReviewMinutes`,
 * `openReportCount`. Seriler ve dağılım dışarıda: onlar kart değil grafik.
 */
type MetrikId = Exclude<
  keyof DashboardMetrics,
  'dailyNewListings' | 'dailyModerationCount' | 'categoryDistribution'
>

/** `data` ve `errors`in paylaştığı anahtar uzayı (`AsyncState.partialSuccess`). */
type MetrikAlani = keyof DashboardMetrics & string

type MetrikHatalari = Partial<Record<MetrikAlani, UiError>>

/**
 * Oranı yüzde metnine çevirir. Locale **sabit**: makineye bırakılsa aynı değer
 * Türkçe makinede "%8,3", İngilizce makinede "%8.3" çıkar ve Chromatic her
 * runner'da fark üretir.
 *
 * `0.083 * 100` kayan noktada `8.299999999999999`; `maximumFractionDigits` onu
 * "8,3"e yuvarlıyor. Biçimleme kartın değil çağıranın işi
 * (`StatCardProps.value` JSDoc'u) ve bu ekran o çağıran — kalıp
 * `StatCard.stories.tsx`'in `yuzde` yardımcısından birebir alındı.
 */
const yuzde = (oran: number): string =>
  `%${(oran * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`

/** `dakika`nın emsali de aynı yerde; aynı locale gerekçesi. */
const dakika = (deger: number): string =>
  `${deger.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} dk`

/**
 * Seçili aralığı okunur metne çevirir.
 *
 * `utils/formatDateTime`'dan geçiyor — `tr-TR` + `Europe/Istanbul` sabit. Kendi
 * `Intl`ini kuran bir ekran aynı günü UTC runner'da bir gün geriye kaydırırdı.
 *
 * Yarım aralık (`from` var, `to` yok) `DateRangePickerProps.value`'nun açıkça
 * geçerli saydığı bir hâl: kullanıcı takvimde ilk tıklamayı yaptığı anda oluşur
 * ve ekran o an da render edilir.
 *
 * Dördü de **ad öbeği** olarak yazılıyor ("… sonrası", "… öncesi"), yan cümle
 * olarak değil ("… tarihinden itibaren"): metin üç ayrı yerde farklı cümlelere
 * gömülüyor (grafik açıklaması, boş durum, bayat uyarısı) ve yan cümle hâli
 * hepsinde bozuk Türkçe üretiyordu — "1 Tem 2026 tarihinden itibaren **arası**,
 * güne göre ilan girişi". Ad öbeği her üç kalıba da sorunsuz giriyor.
 *
 * "Bugüne kadar" gibi bir ifade bilerek yok: hesabı "şimdi"ye dayanırdı ve
 * ekran saati okuyamaz (göreli zaman tuzağı).
 */
function araligiYaz(range: DateRange): string {
  const { from, to } = range

  if (from !== undefined && to !== undefined) return `${formatDate(from)} – ${formatDate(to)}`
  if (from !== undefined) return `${formatDate(from)} sonrası`
  if (to !== undefined) return `${formatDate(to)} öncesi`

  return 'Tüm zamanlar'
}

/**
 * Grafik renkleri token'dan okunuyor: SVG `stroke`/`fill` birer sunum
 * özelliğidir, `var()` orada da çalışır — ve tema değişince grafik yeniden
 * render edilmeden rengini günceller.
 */
const SERI_RENGI = 'var(--color-primary-600)'
const IZGARA_RENGI = 'var(--color-border-subtle)'
const EKSEN_RENGI = 'var(--color-text-muted)'

/**
 * Onay/red ayrımının iki serisi anlamına göre renklendiriliyor: onay `success`,
 * red `danger`. Renk **anlamdan** okunuyor, `ModerationHistory`'nin `approved →
 * success`, `rejected → danger` ton eşlemesiyle aynı — aynı iki kavram bütün
 * ekranlarda aynı renkte görünsün. `KATEGORI_RENGI` ile aynı `var()` gerekçesi:
 * tema değişince grafik yeniden çizilmeden rengini günceller.
 */
const ONAY_RENGI = 'var(--color-success-600)'
const RED_RENGI = 'var(--color-danger-600)'

/**
 * Renk **kategoriye** eşleniyor, dizideki sırasına değil — `ChartCard`ın
 * kategori story'siyle birebir aynı eşleme.
 *
 * Sıraya bağlansaydı bir kategori dağılımdan düştüğünde "Konut mavidir"
 * varsayımı sessizce bozulur, aynı kategori iki ekranda iki renk olurdu.
 * `satisfies Record<ListingCategory, string>` yeni bir kategori eklendiğinde
 * derlemeyi kırar; dizi indekslemediği için `noUncheckedIndexedAccess` altında
 * `undefined` de üretmez (`Cell.fill` `string | undefined` kabul etmiyor).
 */
const KATEGORI_RENGI = {
  [ListingCategory.Residential]: 'var(--color-primary-600)',
  [ListingCategory.Land]: 'var(--color-success-600)',
  [ListingCategory.Commercial]: 'var(--color-warning-600)',
  [ListingCategory.Building]: 'var(--color-danger-600)',
  [ListingCategory.Timeshare]: 'var(--color-info-600)',
  [ListingCategory.TourismFacility]: 'var(--color-neutral-500)',
} as const satisfies Record<ListingCategory, string>

/**
 * Grafiğin `ChartCard.children` içindeki paketi: görsel SVG + erişilebilir özet.
 *
 * Grafik dekoratif kabul edilip erişilebilirlik ağacından gizleniyor, veriyi
 * `ozet` taşıyor. `ChartCard` grafiğe `role="img"` **vermiyor** çünkü o rol alt
 * ağacı ağaçtan siler ve tam da bu özeti gizlerdi; adlandırma `<section>` +
 * `aria-labelledby` ile kartın kendi işi. Yani özetin sorumlusu burası.
 *
 * `accessibilityLayer={false}` her grafikte şart: Recharts 3'te varsayılan
 * `true` ve grafiğin `<svg>`'sine `tabIndex=0` + `role="application"` koyuyor —
 * `aria-hidden` bir kabın içindeki odaklanılabilir öğe axe'ın
 * `aria-hidden-focus` ihlalidir: klavye oraya gider, ekran okuyucu "burada bir
 * şey yok" der.
 */
function GrafikAlani({ children, ozet }: { children: ReactNode; ozet: string }) {
  return (
    <>
      <div aria-hidden="true" className={css.chartSurface}>
        {children}
      </div>
      <p className={css.visuallyHidden}>{ozet}</p>
    </>
  )
}

/**
 * Seriyi tek cümlede özetler — grafiğin ekran okuyucudaki tam karşılığı.
 *
 * `Math.min(...)` indekslemiyor, `noUncheckedIndexedAccess` derdi yok. Boş seri
 * buraya hiç gelmiyor: `ChartCard.empty` grafiğin önüne geçiyor ve `children`
 * render edilmiyor (argümansız `Math.min()` `Infinity` döndürürdü).
 */
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
 * Eksen etiketleri `formatDate`'ten geçiyor, yerel bir `Intl` kurulmuyor.
 * `interval={6}` ile 30 etiketten beşi çiziliyor: hepsi çizilseydi üst üste
 * binerdi ve küçültmek çözüm değil — panelin kuralı görünür metnin `1rem`
 * altına düşmemesi.
 *
 * `isAnimationActive={false}`: animasyonlu ilk çizim Chromatic'te her build'de
 * başka bir kare yakalatır.
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

/** Günlük moderasyon kararı (onay + red). Hafta sonu çukurları fixture'ın kendi verisi. */
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

/** Kategori adı `domain/labels.ts`'ten; ekran kendi sözlüğünü kurmaz. */
function KategoriGrafigi({ data }: { data: CategoryDistributionItem[] }) {
  const dilimler = data.map((item) => ({
    ad: LISTING_CATEGORY_LABEL[item.category],
    count: item.count,
    ratio: item.ratio,
    renk: KATEGORI_RENGI[item.category],
  }))

  const ozet = dilimler
    .map((dilim) => `${dilim.ad} ${yuzde(dilim.ratio)} (${dilim.count.toLocaleString('tr-TR')})`)
    .join(', ')

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
            içinde tab sırasına giren bir `<g>` kalıyor. Alan/çubuk
            grafiklerinde bu prop yok — bu yüzden yalnız pasta düşüyor.
          */}
          <Pie
            data={dilimler}
            dataKey="count"
            nameKey="ad"
            rootTabIndex={-1}
            isAnimationActive={false}
          >
            {/*
              **Borç:** `Cell` Recharts 3.9'da deprecated (4.0'da kalkacak,
              yerine `shape`/`content`). Dilim başına renk vermenin 3.x'teki tek
              pratik yolu bu; `Pie.fill` bütün dilimlere tek renk verir ve
              kategori→renk eşlemesini imkânsız kılardı. Faz 2'de aynı borç
              `ChartCard.stories.tsx`'te notlanmıştı — orada yalnız **story**
              kodundaydı, burada **ürün** kodunda: Recharts 4'e geçiş bu satırı
              da kıracak.
            */}
            {dilimler.map((dilim) => (
              <Cell key={dilim.ad} fill={dilim.renk} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </GrafikAlani>
  )
}

/** Onay ve red serisinin ekran okuyucudaki karşılığı — iki toplam tek cümlede. */
function onayRedOzeti(approvals: TimeSeriesPoint[], rejections: TimeSeriesPoint[]): string {
  const onayToplam = approvals.reduce((acc, nokta) => acc + nokta.value, 0)
  const redToplam = rejections.reduce((acc, nokta) => acc + nokta.value, 0)

  return (
    `Onay ve red: ${approvals.length} günlük seri. ` +
    `Toplam onay ${onayToplam.toLocaleString('tr-TR')}, toplam red ${redToplam.toLocaleString('tr-TR')}.`
  )
}

/**
 * Günlük onay/red ayrımı — iki ayrı çizgi.
 *
 * Faz 3'te `dailyModerationCount` tek ayrışmamış seriydi; brifing 2.2'nin
 * "onay/red sayısı"ndaki ayrım çizilemiyordu. İki seri **tek** veri dizisine
 * örülüyor (`{ date, onay, red }`), çünkü Recharts `LineChart` tek `data` okur;
 * tarihler paralel olduğu için indeksle eşleştiriliyor. `rejections[i]?.value ??
 * 0` `noUncheckedIndexedAccess` altında güvenli — diziler eşit uzunlukta gelir
 * ama tip bunu bilmiyor.
 *
 * Seriler `Legend` ile adlandırılıyor; `Line.name` ("Onay"/"Red") hem gösterge
 * metnini hem de `dataKey`'i insan okunur kılıyor. `dot={false}`: 30 nokta üst
 * üste binerdi. `accessibilityLayer={false}` ve `isAnimationActive={false}`
 * öteki grafiklerdeki gerekçelerle aynı.
 */
function OnayRedGrafigi({
  approvals,
  rejections,
}: {
  approvals: TimeSeriesPoint[]
  rejections: TimeSeriesPoint[]
}) {
  const veri = approvals.map((nokta, index) => ({
    date: nokta.date,
    onay: nokta.value,
    red: rejections[index]?.value ?? 0,
  }))

  return (
    <GrafikAlani ozet={onayRedOzeti(approvals, rejections)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={veri} accessibilityLayer={false}>
          <CartesianGrid strokeDasharray="3 3" stroke={IZGARA_RENGI} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDate(value)}
            interval={6}
            stroke={EKSEN_RENGI}
          />
          <YAxis stroke={EKSEN_RENGI} />
          <Legend />
          <Line
            type="monotone"
            dataKey="onay"
            name="Onay"
            stroke={ONAY_RENGI}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="red"
            name="Red"
            stroke={RED_RENGI}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </GrafikAlani>
  )
}

/**
 * Bir KPI kartının tarifi.
 *
 * `oku` alan başına **kendi okuyucu fonksiyonunu** taşıyor, hesaplanmış anahtar
 * (`metrics[tanim.id]`) değil: AGENTS'ta ölçülen tuzak — hesaplanmış birleşim
 * anahtarı TS denetimini sessizce atlıyor ve yanlış tipte bir değer temiz
 * derleniyor. Fonksiyon `rejectionRate`in biçimlenmiş `string`,
 * `openReportCount`ün ham `number` döndürdüğünü tip düzeyinde ayırıyor.
 */
type KpiTanimi = {
  readonly id: MetrikId
  readonly label: string
  readonly description: string
  readonly icon: ReactNode
  readonly variant: 'plain' | 'accent'
  /**
   * Alanın `Partial` veriden okunmuş, biçimlenmiş hâli; alan **gelmediyse**
   * `undefined`. Sıfır bir değerdir, yokluk değil — `0` döndüren alan kartını
   * çizer ("Bekleyen ilan: 0" gerçek ve iyi bir haber).
   */
  readonly oku: (metrics: Partial<DashboardMetrics>) => string | number | undefined
  /**
   * Kart tıklanınca filtrelenmiş bir listeye gidilebiliyor mu.
   *
   * **Yediden ikisi `false`:** `rejectionRate` bir oran, `averageReviewMinutes`
   * bir süre — ikisinin de arkasında gidilecek bir satır kümesi **yok**. Red
   * oranına tıklayınca varılacak yer zaten "Reddedilen ilan" kartının hedefi
   * olurdu (aynı listeye iki kapı); ortalama sürenin ise hiçbir listede
   * karşılığı yok. `StatCardProps.onClick` "tıklanamayan şeyi tıklanabilir
   * göstermeyin" diyor: bu iki kart `onMetricClick` bağlıyken bile düz gösterge
   * kalıyor ve `<button>` olmuyor.
   *
   * **Sözleşmeyle sürtüşme — entegrasyonda karara bağlanmalı.**
   * `DashboardStatsProps.onMetricClick`'in JSDoc'u "hangi metriğin bir listeye
   * karşılığı olduğunu ekran bilmez" diyor, yani okunduğu gibi uygulanırsa yedi
   * kart da tıklanabilir olurdu. Buradaki okuma o cümlenin **rota** hakkında
   * olduğu ("bekleyen onay kuyruğa, açık şikayet şikayet listesine gider —
   * eşlemeyi sayfa bilir"), *liste var mı* sorusu hakkında değil; verdiği iki
   * örnek de sayılabilir metrikler.
   *
   * Belirleyici olan şu: `onMetricClick` **tek** bir handler ve sayfa katmanı
   * metrik başına "beni bağlama" diyemiyor. Karar biri tarafından verilmek
   * zorunda ve alternatif, ortalama süre kartını basınca hiçbir yere gitmeyen
   * bir `<button>` yapmak olurdu — reponun tekrar tekrar reddettiği şey
   * (`TopBarProps`'un bildirim zili: "basınca hiçbir şey yapmayan zil, kapalı
   * zilden kötü"; `ChartCardProps.onRetry`: "basınca bir şey yapmayan buton
   * koymaktansa doğrusu bu"). Sözleşme `onMetricClick?: (metricId: string,
   * hedef: ...) => void` gibi bir şeye dönerse burası da değişmeli.
   */
  readonly listeyeGoturur: boolean
}

/**
 * Brifing 2.2'nin yedi KPI'ı — `DashboardMetrics`in bütün skaler alanları.
 *
 * Sıra bilerek: önce eylem gerektiren (bekleyen ilan, vurgulu), sonra hacim
 * (bugünkü giriş, yayına alınan, reddedilen), sonra kalite (red oranı, süre),
 * en sonda şikayet. `accent` yalnız birinde — `StatCardProps.variant`ın kendi
 * tarifi: "dikkat çekmesi gereken tek KPI (bekleyen ilan)".
 *
 * **`trend` hiçbirinde yok ve olamaz:** `StatCardProps.trend` bir önceki döneme
 * göre değişim istiyor (`direction` + `value` + `sentiment`), `DashboardMetrics`
 * ise karşılaştırma dönemi taşımıyor — ekran değişimi ancak uydurarak
 * hesaplayabilirdi. Bu yüzden `variant: 'trend'` de bu ekranda kullanılmıyor.
 * Sözleşme boşluğu olarak raporlandı.
 */
const KPI_TANIMLARI: readonly KpiTanimi[] = [
  {
    id: 'pendingReviewCount',
    label: 'Bekleyen ilan',
    description: 'Moderasyon kuyruğunda inceleme bekliyor',
    icon: <Clock size={20} />,
    variant: 'accent',
    oku: (metrics) => metrics.pendingReviewCount,
    listeyeGoturur: true,
  },
  {
    id: 'newListingCountToday',
    label: 'Bugünkü yeni ilan',
    description: 'Bugün girilen ilanlar; seçili aralıktan bağımsız',
    icon: <FilePlus2 size={20} />,
    variant: 'plain',
    oku: (metrics) => metrics.newListingCountToday,
    listeyeGoturur: true,
  },
  {
    /*
      Etiket brifing 2.2'nin "Toplam yayındaki ilan sayısı"ndan **bilerek
      ayrılıyor.** `fixtures/dashboard.ts`'in başındaki gerekçe bunun bir stok
      değil **akış** olduğunu kanıtlıyor: red oranı `281 / (3.100 + 281)` ile
      hesaplanıyor ve bu ancak iki sayı da aynı pencereden gelirse anlamlı — bir
      stoku bir akışa bölmek uydurma bir oran verir. "Toplam yayındaki" deseydik
      kartın kendisi doğru, yanındaki oran yalan olurdu.
    */
    id: 'publishedListingCount',
    label: 'Yayına alınan ilan',
    description: 'Seçili aralıkta onaylanan ilanlar',
    icon: <CheckCircle2 size={20} />,
    variant: 'plain',
    oku: (metrics) => metrics.publishedListingCount,
    listeyeGoturur: true,
  },
  {
    id: 'rejectedListingCount',
    label: 'Reddedilen ilan',
    description: 'Seçili aralıkta reddedilen ilanlar',
    icon: <XCircle size={20} />,
    variant: 'plain',
    oku: (metrics) => metrics.rejectedListingCount,
    listeyeGoturur: true,
  },
  {
    id: 'rejectionRate',
    label: 'Red oranı',
    description: 'Aralıkta verilen kararların içindeki red payı',
    icon: <Percent size={20} />,
    variant: 'plain',
    oku: (metrics) =>
      metrics.rejectionRate === undefined ? undefined : yuzde(metrics.rejectionRate),
    listeyeGoturur: false,
  },
  {
    id: 'averageReviewMinutes',
    label: 'Ortalama inceleme süresi',
    description: 'İlan kuyruğa girdikten karar verilene kadar',
    icon: <Timer size={20} />,
    variant: 'plain',
    oku: (metrics) =>
      metrics.averageReviewMinutes === undefined ? undefined : dakika(metrics.averageReviewMinutes),
    listeyeGoturur: false,
  },
  {
    id: 'openReportCount',
    label: 'Açık şikayet',
    description: 'Sonuçlandırılmayı bekleyen şikayetler',
    icon: <Flag size={20} />,
    variant: 'plain',
    oku: (metrics) => metrics.openReportCount,
    listeyeGoturur: true,
  },
]

/** Bir grafiğin ızgaradaki tarifi — pozisyonel `boolean` yığını okunmaz olurdu. */
type GrafikTanimi = {
  /** `errors` ile aynı anahtar: düşen grafiği doğru karta yönlendiren şey bu. */
  readonly alan: MetrikAlani
  readonly baslik: string
  readonly aciklama: string
  /** Alan `data`da var mı — **boş dizi de "var"dır** (bkz. `bos`). */
  readonly geldi: boolean
  /** Alan geldi ama içi boş: "bu aralıkta kayıt yok" ≠ "alan gelmedi". */
  readonly bos: boolean
  /** Geniş ekranda iki sütunu birden kaplar mı. */
  readonly genis: boolean
  readonly cizim: ReactNode
}

/**
 * Dashboard verisini kart ve grafiklere dönüştüren ekran.
 *
 * **Veriyi çekmez, prop olarak alır** (`state: AsyncState<DashboardMetrics>`).
 * Sorgunun sahibi Faz 4'ün sayfa katmanı; ekranın işi durumu doğru resme
 * çevirmek.
 *
 * **Kabuk değildir.** `AppShell`/`TopBar`/`SidebarNav`/`PageHeader` render
 * etmez — onları Faz 4 kompoze edecek ve brifing 2.2'nin türetilen component
 * listesinde de yoklar. Sonucu: ekranın kendi `<h1>`'i **yok**; sayfa başlığı
 * `PageHeader`ın olacak. Buradaki en üst başlık `<h2>` ve iki tane: "Özet
 * metrikler" ile "Grafikler". `<h3>` yok, çünkü altlarında ayrı bir bölüm de
 * yok — `ChartCard` başlıkları bilerek `<p>` (kart hangi seviyede durduğunu
 * bilemez) ve kartlar adlarını `aria-labelledby` ile kendi `<section>`larından
 * alıyor. Ekranın kendi bölümleri **adsız** `<section>`: adlandırılsalardı
 * landmark olurlardı ve sayfaya, karşılığı olmayan iki `region` eklerlerdi.
 *
 * **Durum sırası** `AsyncState`in kendi ayrımını izliyor; durumlar tek bir
 * "veri yok"a indirilmiyor, çünkü her biri farklı bir şey yaptırır:
 *
 * - `idle` / `loading` → **ölçü koruyan iskelet**: aynı ızgara, aynı yedi kart,
 *   aynı üç grafik; yalnız değerler iskelet. Brifing 2.1: "yalnızca spinner ile
 *   boş ekran gösterilmez". Etiketler istekten önce bilindiği için yerinde
 *   kalır ve kartların erişilebilir adı yüklenirken de doğru okunur.
 * - `empty` → `EmptyState`. Aralık **sınırlıysa** `filtered` varyantı ve
 *   aralığı kaldıran bir eylem; sınırsızsa `default` ve **eylem yok** (basınca
 *   hiçbir şey yapmayan buton, hiç butondan kötü).
 * - `error` → `ErrorState variant="page"`. Buton için **iki kapı**:
 *   `error.retryable === true` VE `onRetry` bağlı. Biri yetmez.
 * - `unauthorized` → `ErrorState variant="page"`, tekrar dene **yok**
 *   (`retryable` tip düzeyinde `false`; 403'ü tekrar denemek aynı 403'ü verir).
 *   Tarih seçici de gizlenir: görme yetkisi olmayan veriyi filtrelemek anlamsız.
 * - `partialSuccess` → **bu ekranın ana vakası** (brifing 2.2: "bazı grafikler
 *   yüklenemese de başarılı kartlar görünür"). Gelen alan kartını/grafiğini
 *   çizer; gelmeyenin yerinde **kendi** hata bloğu durur, komşuları etkilenmez.
 * - `success` + `stale` → veri **görünür kalır**, üstte "güncellenemedi" uyarısı.
 *   Uyarının tazeleme butonu **yok**: `onRetry` sözleşme gereği hata bloğunun
 *   kanalı ve brifing 2.2'nin "yenileme" eyleminin kanalı sözleşmede hiç yok.
 *
 * `success` ile `partialSuccess` **tek gövdeden** çiziliyor (`govdeCiz`):
 * `success`, hatası olmayan bir `partialSuccess`tir. İki ayrı ağaç yazmak,
 * "düşen bir grafik ötekileri etkilemez" iddiasını iki kez kanıtlamayı
 * gerektirirdi.
 *
 * @example
 * <DashboardStats
 *   state={sorgu.state}
 *   dateRange={aralik}
 *   onDateRangeChange={setAralik}
 *   // metricId `DashboardMetrics`in alan adıdır: 'pendingReviewCount' vb.
 *   onMetricClick={(metricId) => git(`/ilanlar?metrik=${metricId}`)}
 *   onRetry={() => sorgu.refetch()}
 * />
 */
export function DashboardStats({
  state,
  dateRange,
  onDateRangeChange,
  onMetricClick,
  onRetry,
}: DashboardStatsProps) {
  const aralikMetni = araligiYaz(dateRange)
  const araligiSinirli = dateRange.from !== undefined || dateRange.to !== undefined

  const tarihSecici = (
    <div className={css.toolbar}>
      {/*
        `presets` ve `max` **bilerek verilmiyor.** İkisi de "bugün"ü bilmeyi
        gerektiriyor ("Son 7 gün" bir hesap, `max` geleceği kapatmak) ve
        `DashboardStatsProps`'ta bir `now` kanalı yok; ekran saati kendi okuyamaz
        (göreli zaman tuzağı, `new Date()` yasak). `DateRangePickerProps.max`'in
        JSDoc'u dashboard'ı **adıyla** örnek veriyor — sözleşme boşluğu,
        raporlandı, uydurulmadı.
      */}
      <DateRangePicker
        label="Tarih aralığı"
        helperText="Kartlar ve grafikler bu aralığa göre hesaplanır"
        value={dateRange}
        onValueChange={(next) => onDateRangeChange(next)}
      />
    </div>
  )

  /*
    Düşen bir alanın tekrar denemesi hakkında — **sözleşme boşluğu, raporlandı:**
    `DashboardStatsProps.onRetry` argümansız (`() => void`), yani "yalnız bu
    alanı tazele" diyemiyor; `ChartCardProps.onRetry`in JSDoc'u ise tam olarak
    onu vaat ediyor ("yalnız o alanın sorgusunu tazeler, bütün dashboard'ı
    değil"). Var olan tek kanal bağlanıyor: buton basılınca bütün dashboard
    tazeleniyor. Kullanıcıya yalan değil (düşen grafik gerçekten yeniden
    çekiliyor), yalnız gereğinden kaba. Doğrusu
    `onRetry?: (metricId?: string) => void` olurdu — `onMetricClick`in simetriği.

    İki kapı her yerde aynı: `hata.retryable === true` VE `onRetry` bağlı.
  */
  const kpiKarti = (tanim: KpiTanimi, data: Partial<DashboardMetrics>, errors: MetrikHatalari) => {
    const deger = tanim.oku(data)
    const hata = errors[tanim.id]

    if (deger === undefined) {
      /*
        Alan gelmedi. Hatası varsa hata bloğu; yoksa kart **hiç çizilmiyor** —
        `partialSuccess.data`nın `Partial` olmasının tanımı "gelmeyen alan yok"
        ve sözleşme "her alan için ya değeri vardır ya hatası" diyor. Yokluğa 0
        yazmak `empty` ile `error`ı karıştırmak, uydurma bir hata bloğu çizmek
        ise olmayan bir sorunu bildirmek olurdu.
      */
      if (hata === undefined) return null

      return (
        <div key={tanim.id} className={css.metricErrorSlot}>
          {/*
            Brifing 2.2'nin `error` durumu: "KPI ve grafik sorguları için
            **bağımsız** hata blokları". `section` varyantı: düşen şey kartın
            içeriği, ekranın tamamı değil — `page` gibi bağırsaydı ayakta kalan
            altı kart da şüpheli görünürdü. (`StatCard`ın hata kanalı yok; kendi
            `doNotUseWhen`'i "sorgu hatalı döndüyse kartı 0 ile doldurmayın,
            ErrorState kullanın" diyor.)

            Kutunun zemini/kenarlığı `section` varyantının kendisinden geliyor;
            yuva bu yüzden çıplak (bkz. `metricErrorSlot`).
          */}
          <ErrorState
            variant="section"
            title={hata.title}
            description={hata.message}
            {...(hata.code !== undefined && { code: hata.code })}
            {...(hata.retryable && onRetry !== undefined && { onRetry: () => onRetry() })}
          />
        </div>
      )
    }

    return (
      <StatCard
        key={tanim.id}
        label={tanim.label}
        value={deger}
        description={tanim.description}
        icon={tanim.icon}
        variant={tanim.variant}
        /*
          İki kapı: kartın arkasında bir liste **olmalı** (`listeyeGoturur`) VE
          `onMetricClick` bağlı olmalı. Biri eksikse `onClick` hiç geçilmiyor ve
          `StatCard` düz bir `<div>` kalıyor — tıklanamayan şey tıklanabilir
          görünmemeli.

          `onMetricClick !== undefined` doğrudan bu zincirde sınanıyor, bir ara
          `const` boolean'a alınmıyor: daraltmanın alttaki ok fonksiyonunun
          içinde de geçerli olması gerekiyor ve bu, aliased condition'a
          güvenmeden çalışan kalıp (`StatCard.tsx`'in kendi `onClick`i de aynı
          şekilde yazılmış).
        */
        {...(tanim.listeyeGoturur &&
          onMetricClick !== undefined && { onClick: () => onMetricClick(tanim.id) })}
      />
    )
  }

  const grafikKarti = (tanim: GrafikTanimi, errors: MetrikHatalari) => {
    const hata = errors[tanim.alan]

    /* Alan gelmedi ve hatası da yok: kart hiç çizilmez — KPI'daki gerekçenin aynısı. */
    if (!tanim.geldi && hata === undefined) return null

    return (
      <div key={tanim.alan} className={css.chartCell({ genis: tanim.genis })}>
        {/*
          `empty` ile `error` **ayrı**: alan geldi ama içi boşsa "bu aralıkta
          çizecek kayıt yok" (`ChartCard.empty`), alan düştüyse hata bloğu.
          `ChartCard`ın durum sırası zaten error → empty → children, yani ikisi
          birden doğru olsa bile hata kazanır.
        */}
        <ChartCard
          title={tanim.baslik}
          description={tanim.aciklama}
          height="lg"
          empty={tanim.bos}
          {...(hata !== undefined && { error: hata })}
          {...(hata !== undefined &&
            hata.retryable &&
            onRetry !== undefined && { onRetry: () => onRetry() })}
        >
          {tanim.cizim}
        </ChartCard>
      </div>
    )
  }

  const grafikTanimlari = (data: Partial<DashboardMetrics>): readonly GrafikTanimi[] => {
    const yeniIlan = data.dailyNewListings
    const moderasyon = data.dailyModerationCount
    const dagilim = data.categoryDistribution
    const onaylar = data.dailyApprovals
    const redler = data.dailyRejections

    const tanimlar: GrafikTanimi[] = [
      {
        alan: 'dailyNewListings',
        baslik: 'Günlük yeni ilan',
        /* Aralık ad öbeği olarak sonda: yarım aralıkta da bozulmayan tek kalıp. */
        aciklama: `Güne göre ilan girişi · ${aralikMetni}`,
        geldi: yeniIlan !== undefined,
        bos: yeniIlan !== undefined && yeniIlan.length === 0,
        genis: true,
        cizim: <GunlukIlanGrafigi data={yeniIlan ?? []} />,
      },
      {
        alan: 'dailyModerationCount',
        baslik: 'Günlük moderasyon kararı',
        aciklama: 'Onay ve reddin toplamı; hafta sonları ekip çalışmıyor',
        geldi: moderasyon !== undefined,
        bos: moderasyon !== undefined && moderasyon.length === 0,
        genis: false,
        cizim: <ModerasyonGrafigi data={moderasyon ?? []} />,
      },
      {
        alan: 'categoryDistribution',
        baslik: 'Kategori dağılımı',
        aciklama: 'Aralıkta yayına alınan ilanların kategorilere dağılımı',
        geldi: dagilim !== undefined,
        bos: dagilim !== undefined && dagilim.length === 0,
        genis: false,
        cizim: <KategoriGrafigi data={dagilim ?? []} />,
      },
    ]

    /*
      Onay/red ayrımı — **yalnız iki seri de gelince** çiziliyor. Öteki üç grafik
      alan gelmese bile listede kalır (`geldi: false`), çünkü yerinde bir hata
      bloğu belirebilir; bu ayrım ise ek/opsiyonel bir görünüm (Faz 3 sonrası (b)
      turu), bu yüzden kanal hiç yoksa hücresini de açmıyor — `iskeletCiz`in
      `grafikTanimlari({})` çağrısı da bu sayede eski üç iskeleti üretiyor,
      dördüncüyü değil.

      İkisinden yalnız biri gelen bir hâl sözleşme dışı (`dailyApprovals` ile
      `dailyRejections` toplamları `dailyModerationCount`'a eşit olmak zorunda,
      biri olmadan grafiğin anlamı yok); o durumda da çizilmiyor.
    */
    if (onaylar !== undefined && redler !== undefined) {
      tanimlar.push({
        alan: 'dailyApprovals',
        baslik: 'Onay ve red',
        aciklama: `Onay ve reddin günlük ayrımı · ${aralikMetni}`,
        geldi: true,
        bos: onaylar.length === 0,
        genis: true,
        cizim: <OnayRedGrafigi approvals={onaylar} rejections={redler} />,
      })
    }

    return tanimlar
  }

  /*
    Faz 3 sonrası (b) turunda eklenen üç bölüm — brifing 2.2'nin Faz 3'te
    KANALSIZ kalan verileri, artık `DashboardMetrics`'in opsiyonel alanlarından
    okunuyor. Üçü de **verilirse** render ediliyor, verilmezse hiç çizilmiyor
    (Faz 3 davranışı korunur). Alan geldi ama boşsa da çizilmiyor: dashboard'ın
    özet bölümünde boş bir "en uzun bekleyen" listesi göstermek gürültü olurdu —
    bu bölümlerin `ChartCard`/`StatCard` gibi kendi boş/hata durumları yok,
    çünkü grafik değil ek özetler.

    **Başlıklar `<h3>`:** ekranın en üst başlığı `<h2>` ("Özet metrikler",
    "Grafikler") ve bu bölümler onların altında bir kademe — belge taslağı
    h2 → h3 sırasını koruyor, `heading-order` temiz. Bölümler yine **adsız**
    `<section>` (KPI/grafik bölümleriyle aynı gerekçe): ad verilseydi her biri
    bir `region` landmark'ı olur ve sayfaya karşılığı olmayan gürültü eklerdi;
    yapı `<h3>`lerden okunuyor.
  */

  const enUzunBekleyenBolumu = (data: Partial<DashboardMetrics>) => {
    const ilanlar = data.longestWaitingListings

    if (ilanlar === undefined || ilanlar.length === 0) return null

    return (
      <section className={css.section}>
        <h3 className={css.subsectionTitle}>En uzun bekleyen ilanlar</h3>
        <p className={css.subsectionDescription}>
          Moderasyon kuyruğunda en uzun süredir inceleme bekleyen ilanlar; en eski gönderim başta.
        </p>

        {/*
          `compact` + `showModerationMeta`: kuyrukta hızlı tarama için tek
          satırlık kart, gönderim zamanı/atanan moderatör/revizyonla birlikte —
          "ne kadar bekledi" sorusunun cevabı orada. Kart **tıklanabilir değil**:
          `DashboardStatsProps`'ta ilana özel bir tıklama kanalı yok
          (`onMetricClick` yalnız KPI metriği taşır) ve tıklanamayan şeyi
          tıklanabilir göstermemek reponun kuralı — RAPOR EDİLDİ.

          Semantik liste (`<ul>`): kartlar bir dizi, ekran okuyucu "liste, N öğe"
          demeli. Reset üçlüsü (`listStyle`/`margin`/`padding`) `listingList`'te
          sıfırlı, yoksa liste 40 piksel sağa kayardı.
        */}
        <ul className={css.listingList}>
          {ilanlar.map((ilan) => (
            <li key={ilan.id} className={css.listingItem}>
              <ListingCard listing={ilan} variant="compact" showModerationMeta />
            </li>
          ))}
        </ul>
      </section>
    )
  }

  const sonModerasyonBolumu = (data: Partial<DashboardMetrics>) => {
    const olaylar = data.recentModerationEvents

    if (olaylar === undefined || olaylar.length === 0) return null

    return (
      <section className={css.section}>
        <h3 className={css.subsectionTitle}>Son moderasyon işlemleri</h3>

        {/*
          `table` varyantı: tarama ve karşılaştırma için sütunlu okuma (tarih,
          olay + durum geçişi, aktör, ayrıntı). `compact` yerine `table`, çünkü
          `DataTable` kendi yatay kaydırma kabını taşıyor (`mobileMode="scroll"`)
          ve o kap 320 pikselde sayfayı taşırmadan içeride kaydırılıyor; `compact`
          varyantın sarmayan tek-satır ızgarası dar ekranda kabı genişletebilirdi.

          `ModerationHistory` olayları **kendisi** eskiden yeniye sıralıyor;
          fixture "en yeni başta" veriyor ama sıralama component'in işi, ekran
          onu bozmuyor.
        */}
        <ModerationHistory events={olaylar} variant="table" />
      </section>
    )
  }

  const moderatorHacmiBolumu = (data: Partial<DashboardMetrics>) => {
    const hacim = data.moderatorVolume

    if (hacim === undefined || hacim.length === 0) return null

    return (
      <section className={css.section}>
        <h3 className={css.subsectionTitle}>Moderatör bazında işlem hacmi</h3>

        {/*
          **Yetki okuması sayfa katmanının.** Brifing 2.2 bu bloğu "yalnızca
          yetkili rollere" diyor ama `DashboardStatsProps`'ta ne bir izin listesi
          (`availablePermissions`) ne de böyle bir `AdminPermission` var — ekran
          kimin görebileceğini **bilemiyor**. Kural gereği ("yetki kontrolü
          component'in işi değil"), karar veriye taşınıyor: veri **verildiğinde**
          gösterilir, verip vermemeye çağıran (Faz 4 sayfa katmanı) karar verir.
          Uydurma bir izin kapısı kurmak yerine boşluk görünür bırakıldı — RAPOR
          EDİLDİ.

          Bir `<table>`: dört sayaç yan yana en net tablo olarak okunuyor.
          Kaydırma kabı `tabIndex={0}` (axe `scrollable-region-focusable`:
          salt okunur bir tablo da klavyeyle gezilebilmeli); `role="region"`
          **verilmiyor** — sayfa başına birden çok tablo olabilir ve gereksiz bir
          landmark `landmark-unique`'i gürültüyle doldururdu (AGENTS).
        */}
        <div className={css.tableScroller} tabIndex={0}>
          <table className={css.volumeTable}>
            <thead>
              <tr>
                <th scope="col" className={css.volumeColHead}>
                  Moderatör
                </th>
                <th scope="col" className={css.volumeNumHead}>
                  Onay
                </th>
                <th scope="col" className={css.volumeNumHead}>
                  Red
                </th>
                <th scope="col" className={css.volumeNumHead}>
                  Düzeltme
                </th>
              </tr>
            </thead>
            <tbody>
              {hacim.map((moderator) => (
                <tr key={moderator.adminId}>
                  <th scope="row" className={css.volumeRowHead}>
                    {moderator.adminName}
                  </th>
                  <td className={css.volumeNumCell}>
                    {moderator.approvedCount.toLocaleString('tr-TR')}
                  </td>
                  <td className={css.volumeNumCell}>
                    {moderator.rejectedCount.toLocaleString('tr-TR')}
                  </td>
                  <td className={css.volumeNumCell}>
                    {moderator.changesRequestedCount.toLocaleString('tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  /*
    Bölümler `<section>` ama **adsız**, yani `aria-labelledby` yok.

    Adı olan bir `<section>` `region` landmark'ı üretir; adsız olan `generic`
    kalır — belge yapısı `<h2>`lerden okunur, ekran okuyucu kullanıcısı zaten
    başlıkla geziyor. İki fazladan landmark eklemek AGENTS'ın uyardığı gürültü
    olurdu ("kural gereği olmayan bir landmark eklemek `landmark-unique`'i kendi
    ürettiğimiz gürültüyle doldurur"), üstelik "Grafikler"in içinde `ChartCard`
    başına bir tane olmak üzere zaten üç landmark var.
  */
  const govdeCiz = (data: Partial<DashboardMetrics>, errors: MetrikHatalari) => (
    <>
      <section className={css.section}>
        <h2 className={css.sectionTitle}>Özet metrikler</h2>

        <div className={css.kpiGrid}>{KPI_TANIMLARI.map((t) => kpiKarti(t, data, errors))}</div>
      </section>

      <section className={css.section}>
        <h2 className={css.sectionTitle}>Grafikler</h2>

        <div className={css.chartGrid}>
          {grafikTanimlari(data).map((t) => grafikKarti(t, errors))}
        </div>
      </section>

      {/*
        Faz 3 sonrası (b) turunun üç ek bölümü. Her biri kendi alanı gelmezse
        `null` döndürür; `success` (dolu fixture) hepsini, `partialSuccess`
        yalnız gelenleri, boş seri hiçbirini çizmez.
      */}
      {enUzunBekleyenBolumu(data)}
      {sonModerasyonBolumu(data)}
      {moderatorHacmiBolumu(data)}
    </>
  )

  /* `govdeCiz` gibi fonksiyon: ağaç yalnız çizileceği dalda kurulsun, her render'da değil. */
  const iskeletCiz = () => (
    <>
      <section className={css.section}>
        <h2 className={css.sectionTitle}>Özet metrikler</h2>

        <div className={css.kpiGrid}>
          {KPI_TANIMLARI.map((tanim) => (
            <StatCard
              key={tanim.id}
              label={tanim.label}
              /*
                Değer yüklenirken render **edilmiyor** (`loading` onu iskelete
                çeviriyor), ama prop zorunlu. `0` yerine tire: bir gün `loading`
                yanlışlıkla düşerse "Bekleyen ilan: 0" bir **yalan** olurdu,
                "—" ise yalnız bilinmezlik.
              */
              value="—"
              description={tanim.description}
              icon={tanim.icon}
              variant={tanim.variant}
              loading
            />
          ))}
        </div>
      </section>

      <section className={css.section}>
        <h2 className={css.sectionTitle}>Grafikler</h2>

        <div className={css.chartGrid}>
          {grafikTanimlari({}).map((tanim) => (
            <div key={tanim.alan} className={css.chartCell({ genis: tanim.genis })}>
              <ChartCard title={tanim.baslik} description={tanim.aciklama} height="lg" loading>
                {/*
                  Grafik henüz yok ve `loading` zaten `children`ı çizmiyor. Boş
                  seriyle Recharts kurmak, hiç render edilmeyecek bir ağacı
                  kurmak olurdu.
                */}
                {null}
              </ChartCard>
            </div>
          ))}
        </div>
      </section>
    </>
  )

  if (state.status === 'unauthorized') {
    const { error } = state

    return (
      <div className={css.root}>
        {/*
          Tarih seçici burada **yok**: görme yetkisi olmayan bir verinin
          aralığını değiştirmek hiçbir şeyi değiştirmez. Tekrar dene de yok —
          `retryable` tip düzeyinde `false`.
        */}
        <ErrorState
          variant="page"
          title={error.title}
          description={error.message}
          {...(error.code !== undefined && { code: error.code })}
        />
      </div>
    )
  }

  if (state.status === 'error') {
    const { error } = state

    return (
      <div className={css.root}>
        {/*
          Aralık seçici hatada da kalıyor: yeni bir aralık yeni bir sorgudur,
          yani `onRetry`nin yanındaki ikinci çıkış yolu — `ChartCard`ın "araç
          çubuğu her durumda kalır" kuralının aynısı.
        */}
        {tarihSecici}

        <ErrorState
          variant="page"
          title={error.title}
          description={error.message}
          {...(error.code !== undefined && { code: error.code })}
          {...(error.retryable && onRetry !== undefined && { onRetry: () => onRetry() })}
        />
      </div>
    )
  }

  if (state.status === 'empty') {
    return (
      <div className={css.root}>
        {tarihSecici}

        {araligiSinirli ? (
          /*
            `filtered`: veri **yok** değil, **bu aralığa uyan** yok — kesik
            kenarlık farkı tam bunun için. Eylem `onDateRangeChange({})`:
            sözleşmenin ifade edebildiği tek genişletme, sınırları kaldırmak.
            "Bir adım geniş" demek bir politika (kaç gün?) uydurmak olurdu ve
            brifing 2.1 boş durumun eylemi olarak zaten "filtre temizleme"yi
            sayıyor.
          */
          <EmptyState
            variant="filtered"
            title="Seçilen tarih aralığında veri yok"
            description={`${aralikMetni} için hesaplanacak ilan, moderasyon kararı veya şikayet kaydı bulunmuyor.`}
            primaryAction={
              <Button variant="secondary" onClick={() => onDateRangeChange({})}>
                Tarih aralığını genişlet
              </Button>
            }
          />
        ) : (
          /*
            Aralık zaten sınırsız: genişletecek bir şey yok, buton basılınca
            hiçbir şey yapmazdı. Boşluğun sebebi filtre değil, verinin kendisi —
            bu yüzden `filtered` değil `default`.
          */
          <EmptyState
            title="Henüz gösterilecek metrik yok"
            description="Panelde kayıtlı ilan, moderasyon kararı veya şikayet bulunmuyor. İlk ilan girildiğinde metrikler burada görünecek."
          />
        )}
      </div>
    )
  }

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <div className={css.root}>
        {tarihSecici}
        {iskeletCiz()}
      </div>
    )
  }

  if (state.status === 'partialSuccess') {
    return (
      <div className={css.root}>
        {tarihSecici}
        {govdeCiz(state.data, state.errors)}
      </div>
    )
  }

  const bayat = state.stale === true

  return (
    <div className={css.root}>
      {bayat ? (
        /*
          Veri **gizlenmiyor**, yalnız nitelendiriliyor (brifing 2.1: "son
          başarılı veri gösterilmeye devam eder; üstte güncelleme uyarısı").

          `warning` → `role="alert"`: bayat bir sayının üstünde ekip kapasitesi
          kararı verilebilir ve uyarı ancak gerçek bir tazeleme **başarısız
          olduğunda** çıkıyor, her render'da değil.

          `dismissible` **değil**: `AlertProps` kalıcı sorunları örneklerken
          "veri bayat"ı adıyla sayıyor — kullanıcı kapatır, bayatlık durur.

          **Tazeleme butonu YOK ve `onRetry` buraya bağlanmıyor** — sözleşme
          bunu açıkça söylüyor: `DashboardStatsProps.onRetry`'nin JSDoc'u
          "`error` ve `partialSuccess` durumlarındaki tekrar dene butonunu
          çalıştırır… bu buton yalnız hata bloğunda görünür" diyor ve brifing
          2.2'nin "dashboard verisini yenileme" eyleminin **bu kanal olmadığını**
          ayrıca yazıyor (yenileme hata olmadan da yapılabilmeli). Ayrı bir
          `onRefresh` kanalı sözleşmede yok — RAPOR EDİLDİ, uydurulmadı.

          Kullanıcının elindeki tazeleme yolu bu yüzden aralık seçici: yeni bir
          aralık yeni bir sorgudur.
        */
        <Alert
          tone="warning"
          title="Veriler güncellenemedi"
          description={`Aşağıdaki metrikler son başarılı sorgudan geliyor; ${aralikMetni} için güncel olmayabilir.`}
        />
      ) : null}

      {tarihSecici}
      {govdeCiz(state.data, {})}
    </div>
  )
}
