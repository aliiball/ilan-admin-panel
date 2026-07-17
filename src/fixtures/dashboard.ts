import {
  ListingCategory,
  type CategoryDistributionItem,
  type DashboardMetrics,
  type ISODate,
  type TimeSeriesPoint,
} from '../types/domain'

/**
 * Dashboard metrik fixture'ı.
 *
 * Beş sayı **brifing 5.2'den birebir alınmıştır, uydurulmamıştır**:
 * `pendingReviewCount: 37`, `newListingCountToday: 128`, `rejectionRate: 0.083`,
 * `averageReviewMinutes: 14.6`, `openReportCount: 19`.
 *
 * `publishedListingCount` ve `rejectedListingCount` brifingde **yok**; ikisi de
 * aşağıdaki gerekçeyle seçildi (bkz. "Sayıların birbirini tutması").
 *
 * Pencere: **son 30 gün, 2026-06-17 → 2026-07-16.** Son gün "bugün"dür ve
 * `newListingCountToday` o günün serideki değeridir — iki yerde iki farklı sayı
 * olsaydı aynı ekranda kart "128", grafiğin son sütunu başka bir şey gösterirdi.
 *
 * Tarihler elle yazılmış sabit dizgiler; seri bir döngüde `new Date()` ile
 * türetilmiyor. Determinizm brifingin şartı: `Date.now()`'a dayanan bir seri her
 * gün kayar, Chromatic her build'de fark üretir ve gerçek regresyon o gürültüde
 * kaybolur.
 */

/**
 * Sayıların birbirini tutması — hangi sayı nereden geliyor:
 *
 * 1. **`sum(dailyModerationCount) === publishedListingCount + rejectedListingCount`**
 *    (3.381 = 3.100 + 281). Pencere içinde verilen her moderasyon kararı ya onay ya
 *    reddir; ikisinin toplamı seriyle aynı olmak zorunda.
 * 2. **`rejectedListingCount / (published + rejected) === rejectionRate`**:
 *    281 / 3.381 = 0,0831… → üç haneye yuvarlandığında brifingin dayattığı `0.083`.
 *    Bu yüzden `publishedListingCount` "yayındaki toplam ilan" (bir stok) değil,
 *    "son 30 günde onaylanan ilan" (bir akış) olarak okunmalı: red oranı ancak iki
 *    sayı aynı pencereden gelirse anlamlı olur, stok/akış karışırsa oran uydurma
 *    olur.
 * 3. **`sum(categoryDistribution.count) === publishedListingCount`** (3.100) ve
 *    `ratio` değerleri tam olarak `count / 3100`. Dağılım da aynı pencerenin
 *    ilanlarıdır.
 * 4. **`sum(ratio) === 1`** — kayan noktada da tam 1, yaklaşık değil. Oranlar iki
 *    ondalıklı seçildi (0,52 + 0,18 + 0,15 + 0,06 + 0,05 + 0,04); "yüzde toplamı
 *    100 mü?" diye ölçen bir test 0,9999999999'a takılmasın diye.
 * 5. `sum(dailyNewListings)` = 3.384, moderasyon toplamının (3.381) üç fazlası:
 *    kuyruk 30 günde üç ilan büyümüş, yani `pendingReviewCount: 37` dengede bir
 *    kuyruk. Giriş ile karar arasında uçurum olsaydı 37 inandırıcı olmazdı.
 *
 * `openReportCount: 19` ile `reports.ts`'in üç sonuçlanmamış şikayeti arasında
 * çelişki yok: dashboard tüm platformu sayar, fixture seti bir örneklemdir.
 */
const GUNLUK_SERI_TABLOSU = [
  // Hafta sonları (Cmt/Paz) bilerek çukur: ilan girişi düşüyor, moderasyon ise
  // neredeyse duruyor — admin ekibi hafta içi çalışıyor. Dalgalanma elle yazıldı,
  // `Math.random()` ile üretilmedi.
  { date: '2026-06-17', yeniIlan: 118, moderasyon: 141 }, // Çarşamba
  { date: '2026-06-18', yeniIlan: 124, moderasyon: 136 },
  { date: '2026-06-19', yeniIlan: 111, moderasyon: 128 },
  { date: '2026-06-20', yeniIlan: 76, moderasyon: 38 }, // Cumartesi
  { date: '2026-06-21', yeniIlan: 68, moderasyon: 31 }, // Pazar
  { date: '2026-06-22', yeniIlan: 132, moderasyon: 152 },
  { date: '2026-06-23', yeniIlan: 127, moderasyon: 147 },
  { date: '2026-06-24', yeniIlan: 119, moderasyon: 139 },
  { date: '2026-06-25', yeniIlan: 135, moderasyon: 144 },
  { date: '2026-06-26', yeniIlan: 108, moderasyon: 126 },
  { date: '2026-06-27', yeniIlan: 71, moderasyon: 35 }, // Cumartesi
  { date: '2026-06-28', yeniIlan: 64, moderasyon: 29 }, // Pazar
  { date: '2026-06-29', yeniIlan: 129, moderasyon: 158 },
  { date: '2026-06-30', yeniIlan: 141, moderasyon: 149 },
  { date: '2026-07-01', yeniIlan: 137, moderasyon: 143 },
  { date: '2026-07-02', yeniIlan: 122, moderasyon: 138 },
  { date: '2026-07-03', yeniIlan: 114, moderasyon: 131 },
  { date: '2026-07-04', yeniIlan: 79, moderasyon: 34 }, // Cumartesi
  { date: '2026-07-05', yeniIlan: 72, moderasyon: 27 }, // Pazar
  { date: '2026-07-06', yeniIlan: 138, moderasyon: 161 },
  { date: '2026-07-07', yeniIlan: 133, moderasyon: 154 },
  { date: '2026-07-08', yeniIlan: 126, moderasyon: 146 },
  { date: '2026-07-09', yeniIlan: 131, moderasyon: 140 },
  { date: '2026-07-10', yeniIlan: 117, moderasyon: 133 },
  { date: '2026-07-11', yeniIlan: 83, moderasyon: 36 }, // Cumartesi
  { date: '2026-07-12', yeniIlan: 74, moderasyon: 30 }, // Pazar
  { date: '2026-07-13', yeniIlan: 142, moderasyon: 157 },
  { date: '2026-07-14', yeniIlan: 136, moderasyon: 151 },
  { date: '2026-07-15', yeniIlan: 129, moderasyon: 145 },
  // Bugün. `yeniIlan` brifingin dayattığı 128; `moderasyon` diğer Perşembelerin
  // altında, çünkü gün bitmedi — serinin son noktası günün o ana kadarki toplamı.
  { date: '2026-07-16', yeniIlan: 128, moderasyon: 102 },
] as const satisfies readonly { date: ISODate; yeniIlan: number; moderasyon: number }[]

/**
 * İki seri tek tablodan türetiliyor: tarihler bir kez yazılıyor ve iki grafik
 * aynı 30 günü göstermek zorunda kalıyor. Ayrı diziler olsaydı biri 29 güne
 * düştüğünde hiçbir şey uyarmazdı — `noUncheckedIndexedAccess` altında indeksle
 * eşleşen iki dizi ayrıca her erişimde `undefined` kontrolü isterdi.
 */
export const dailyNewListings: TimeSeriesPoint[] = GUNLUK_SERI_TABLOSU.map((gun) => ({
  date: gun.date,
  value: gun.yeniIlan,
}))

/** Günlük moderasyon kararı sayısı (onay + red). Toplamı 3.381. */
export const dailyModerationCount: TimeSeriesPoint[] = GUNLUK_SERI_TABLOSU.map((gun) => ({
  date: gun.date,
  value: gun.moderasyon,
}))

/**
 * Altı ana kategorinin dağılımı — `count` toplamı 3.100 (`publishedListingCount`),
 * `ratio` toplamı tam olarak 1.
 *
 * Ağırlıklar Türkiye ilan hacmine göre: konut baskın, arsa ve işyeri onu izliyor,
 * devremülk ve turistik tesis niş kalıyor. Sıra sabit ve `ListingCategory`
 * bildirim sırasıyla aynı — pasta diliminin rengi her build'de aynı kategoriye
 * düşsün diye.
 */
export const categoryDistribution: CategoryDistributionItem[] = [
  { category: ListingCategory.Residential, count: 1_612, ratio: 0.52 },
  { category: ListingCategory.Land, count: 558, ratio: 0.18 },
  { category: ListingCategory.Commercial, count: 465, ratio: 0.15 },
  { category: ListingCategory.Building, count: 186, ratio: 0.06 },
  { category: ListingCategory.Timeshare, count: 155, ratio: 0.05 },
  { category: ListingCategory.TourismFacility, count: 124, ratio: 0.04 },
]

/** Dashboard'un dolu hâli — brifing 5.2'nin sayıları. */
export const dashboardMetrics: DashboardMetrics = {
  pendingReviewCount: 37,
  newListingCountToday: 128,
  publishedListingCount: 3_100,
  rejectedListingCount: 281,
  rejectionRate: 0.083,
  averageReviewMinutes: 14.6,
  openReportCount: 19,
  dailyNewListings,
  dailyModerationCount,
  categoryDistribution,
}

/**
 * Verisi olmayan dashboard — `Empty` story'leri için.
 *
 * Yeni kurulmuş bir kurulumun ilk günü: sayaçlar 0, seriler boş. Boş seri, sıfır
 * dolu seriden farklı bir hâl — grafik "hiç veri yok" demek zorunda, düz bir sıfır
 * çizgisi çizmek değil. `rejectionRate` de 0: bölen sıfırken oran hesaplanamaz,
 * `NaN` yazmak yerine 0 veriliyor (`NaN` biçimlendiricide "%NaN" olarak ekrana
 * çıkar).
 */
export const emptyDashboardMetrics: DashboardMetrics = {
  pendingReviewCount: 0,
  newListingCountToday: 0,
  publishedListingCount: 0,
  rejectedListingCount: 0,
  rejectionRate: 0,
  averageReviewMinutes: 0,
  openReportCount: 0,
  dailyNewListings: [],
  dailyModerationCount: [],
  categoryDistribution: [],
}
