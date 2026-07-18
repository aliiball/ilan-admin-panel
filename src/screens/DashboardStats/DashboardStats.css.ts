import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/**
 * Kırılımlar `min-width` ile yazılır — brifingin "mobil temel görünümdür, 320
 * piksel taban alınır" kuralı. Repodaki iki kırılımın aynısı (`AppShell`,
 * `PageHeader`, `FilterBar`): 48rem tablet, 64rem geniş ekran.
 */
const MASAUSTU = 'screen and (min-width: 48rem)'
const GENIS_EKRAN = 'screen and (min-width: 64rem)'

/**
 * Ekranın kökü.
 *
 * `minWidth: 0`: ekran Faz 4'te `AppShell`in `<main>`'ine grid çocuğu olarak
 * girecek ve grid öğesinin `min-width: auto` varsayılanı "en geniş çocuğun
 * taban genişliği" demektir — 30 günlük bir grafik bir kez genişleyince kabuk
 * bir daha küçülemez ve 320 pikselde sayfa yatay kayardı. `minWidth` metni
 * saran tarafa yazılıyor, sabit genişlikli kontrol taşıyan tarafa değil.
 */
export const root = style({
  display: 'grid',
  gap: vars.space[6],
  minWidth: 0,
})

/**
 * Tarih aralığı seçicinin şeridi.
 *
 * Mobilde tam genişlik (dokunma hedefi), 48rem'den itibaren `18rem`e kapanır:
 * bir tarih aralığı seçici sayfanın tamamı kadar geniş olmamalı, ama 40rem
 * (`container.sm`) de fazla geniş. Ham `rem` — AGENTS'ta belgeli ölçü token'ı
 * boşluğu: `space[24]` (6rem) ile `container.sm` (40rem) arasında token yok ve
 * `container.*` zaten sayfa kabı ölçüsü, tek bir kontrolün genişliği değil.
 * (Aynı istisna `FilterBar`ın `minmax(12rem, 1fr)`'ında ve `ChartCard`ın grafik
 * yüksekliklerinde de var.)
 */
export const toolbar = style({
  display: 'grid',
  gap: vars.space[3],
  minWidth: 0,

  '@media': {
    [MASAUSTU]: {
      gridTemplateColumns: 'minmax(0, 18rem)',
      justifyContent: 'start',
    },
  },
})

export const section = style({
  display: 'grid',
  gap: vars.space[4],
  minWidth: 0,
})

/**
 * Bölüm başlığı (`<h2>`).
 *
 * `margin: 0` şart: global reset yalnız `body`'nin margin'ini sıfırlıyor,
 * `<h*>` tarayıcı varsayılanını (`margin-block: 0.83em`) taşır ve grid kabında
 * o margin `gap` token'ının üstüne biner — dikey ritmi token değil tarayıcı
 * belirlerdi.
 */
export const sectionTitle = style({
  margin: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
})

/**
 * Faz 3 sonrası (b) turunun ek bölüm başlığı (`<h3>`).
 *
 * `sectionTitle`in (`<h2>`) bir kademe altı: `lg` boy, semibold. `margin: 0`
 * yine şart — global reset yalnız `body`ye dokunuyor, `<h*>` tarayıcı
 * varsayılan margin'ini grid `gap`inin üstüne bindirirdi.
 */
export const subsectionTitle = style({
  margin: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
})

/** Bölüm başlığının altındaki açıklama. `<p>` margin'i sıfırlanıyor (reset tuzağı). */
export const subsectionDescription = style({
  margin: 0,
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
})

/**
 * KPI ızgarası. **Medya sorgusu yok, `auto-fit` var.**
 *
 * Kırılım noktası uydurmak yerine kartın kendi taban genişliği (14rem) sütun
 * sayısını belirliyor: 320 pikselde tek sütun (mobile stack), 768'de iki-üç,
 * 1440'ta beş-yedi. Kalıp `StatCard.stories.tsx` → `DashboardRow`'dan geliyor.
 *
 * `min(100%, 14rem)` şart: çıplak `minmax(14rem, 1fr)` 320 pikselde tek sütunu
 * 14rem'de tutar ama kabın kendisi 320 - dolgu kadar dar olduğunda taban
 * genişliği kabı taşırır. `min(100%, …)` tabanı kabın genişliğine kilitler.
 *
 * Ham `rem`: ızgara track ölçüsü token sözleşmesinde yok — `FilterBar` ile aynı
 * istisna ve aynı gerekçe.
 */
export const kpiGrid = style({
  display: 'grid',
  gap: vars.space[4],
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))',
  minWidth: 0,
})

/**
 * Grafik ızgarası.
 *
 * Burada `auto-fit` **kullanılamaz**: grafiklerin sırası anlamlı (ana grafik
 * önce) ve ana grafiğin geniş ekranda iki sütunu birden kaplaması gerekiyor —
 * `auto-fit`in kaç sütun ürettiğini CSS'ten okuyamayız, `grid-column: 1 / -1`
 * ancak sütun sayısı bilinen bir ızgarada tahmin edilebilir davranır.
 *
 * 64rem'in altında tek sütun: 30 günlük bir zaman serisi yarım tablet
 * genişliğinde okunmaz — eksen etiketleri üst üste biner ve `ChartCard`ın
 * `interval` çözümü tabanı daha da seyreltirdi.
 */
export const chartGrid = style({
  display: 'grid',
  gap: vars.space[4],
  minWidth: 0,

  '@media': {
    [GENIS_EKRAN]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  },
})

/**
 * Bir grafiğin ızgara hücresi.
 *
 * Recipe, çünkü `minWidth: 0` **her** hücrenin borcu ama iki sütunu kaplamak
 * yalnız ana grafiğin: koşullu tek bir class (`genis ? wide : undefined`)
 * yazılsaydı dar hücreler hiç class almaz ve `min-width: auto` varsayılanıyla
 * kalırlardı — ızgara çocuğunun taban genişliği en geniş çocuğu kadar olurdu.
 */
export const chartCell = recipe({
  base: { minWidth: 0 },

  variants: {
    /** Ana grafik geniş ekranda iki sütunu birden kaplar; dar ekranda zaten tek sütun var. */
    genis: {
      true: {
        '@media': {
          [GENIS_EKRAN]: {
            gridColumn: '1 / -1',
          },
        },
      },
      false: {},
    },
  },

  defaultVariants: { genis: false },
})

/**
 * Düşen bir KPI sorgusunun yeri.
 *
 * `StatCard`ın hata kanalı yok (kendi `doNotUseWhen`'i "sorgu hatalı döndüyse
 * kartı 0 ile doldurmayın, `ErrorState` kullanın" diyor), bu yüzden düşen alanın
 * hücresine doğrudan `ErrorState` giriyor.
 *
 * **Yuva bilerek çıplak: zemin, kenarlık, köşe yok.** `ErrorState`in `section`
 * varyantı üçünü de kendi taşıyor (`danger.50` zemin + `danger.600` kenarlık +
 * `radius.lg`); yuvaya kart görünümü vermek, kırmızı kutunun etrafına ikinci ve
 * nötr bir kenarlık çizerdi. Yuvanın tek işi ızgara hücresini tutmak.
 *
 * `minWidth: 0`: ızgara çocuğunun `min-width: auto` varsayılanı, uzun bir hata
 * mesajını 320 pikselde kabın dışına taşırırdı.
 */
export const metricErrorSlot = style({
  display: 'grid',
  minWidth: 0,
})

/**
 * Grafiğin görsel yüzeyi — `aria-hidden` kap.
 *
 * `blockSize: 100%` şart: Recharts `ResponsiveContainer` ölçüsünü ebeveynden
 * okuyor ve `ChartCard`ın sabit yükseklikli kutusu ile grafiğin arasında duran
 * bu kap yüksekliği geçirmezse ölçü sıfır çıkar — grafik **hata vermeden hiç
 * çizilmez**.
 */
export const chartSurface = style({
  blockSize: '100%',
  minWidth: 0,
})

/**
 * Görsel olarak gizli, ekran okuyucuya açık.
 *
 * `display: none` / `visibility: hidden` **kullanılamaz**: ikisi de alt ağacı
 * erişilebilirlik hesabından siler ve grafiğin tek erişilebilir karşılığı olan
 * özet metni tam da gizlerdi (bkz. Button'ın `loading` regresyonu).
 * `margin: -1px` kırpma tekniğinin parçası ve `<p>`nin tarayıcı margin'ini de
 * bu arada eziyor.
 */
/**
 * "En uzun bekleyen ilanlar" listesi — semantik `<ul>`.
 *
 * Reset üçlüsü şart: global reset yalnız `body`ye dokunuyor, `<ul>` ayrıca 40
 * piksel `padding-inline-start` taşır ve liste sağa kayardı (`listStyle` +
 * `margin: 0` + `padding: 0` üçü birden). `minWidth: 0` grid çocuğunun
 * `min-width: auto` varsayılanını kırıyor.
 */
export const listingList = style({
  display: 'grid',
  gap: vars.space[3],
  listStyle: 'none',
  margin: 0,
  padding: 0,
  minWidth: 0,
})

export const listingItem = style({
  minWidth: 0,
})

/**
 * Moderatör hacmi tablosunun kaydırma kabı.
 *
 * `overflowX: 'auto'` + `minWidth: 0`: dar ekranda dört sütunlu tablo kabı
 * taşırmak yerine **içeride** kaydırılır — kaydırma kabı olan bir grid öğesinin
 * otomatik minimum boyutu zaten sıfır, `minWidth: 0` bunu açıkça sabitliyor.
 * `tabIndex={0}` component'te veriliyor (axe `scrollable-region-focusable`).
 */
export const tableScroller = style({
  minWidth: 0,
  overflowX: 'auto',
})

/**
 * Moderatör hacmi tablosu.
 *
 * Yapışkan sütun **yok**, bu yüzden `borderCollapse: 'collapse'` güvenli
 * (AGENTS'ın uyardığı "collapse + sticky" çakışması burada oluşmuyor).
 * `width: '100%'` geniş ekranda kabı doldurur; dar ekranda içerik daha genişse
 * kap kaydırır.
 */
export const volumeTable = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: vars.font.size.sm,
})

/** Başlık satırının hücreleri (`<th scope="col">`). */
const volumeHeadBase = style({
  paddingBlock: vars.space[2],
  paddingInline: vars.space[3],
  borderBlockEnd: `1px solid ${vars.color.border.default}`,
  color: vars.color.text.secondary,
  fontWeight: vars.font.weight.semibold,
  whiteSpace: 'nowrap',
})

export const volumeColHead = style([volumeHeadBase, { textAlign: 'start' }])

/** Sayısal sütun başlığı: sağa yaslı, hücrelerle hizalı. */
export const volumeNumHead = style([volumeHeadBase, { textAlign: 'end' }])

/** Satır başlığı: moderatörün adı (`<th scope="row">`). */
export const volumeRowHead = style({
  paddingBlock: vars.space[2],
  paddingInline: vars.space[3],
  borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
  color: vars.color.text.primary,
  fontWeight: vars.font.weight.medium,
  textAlign: 'start',
  whiteSpace: 'nowrap',
})

/** Sayısal hücre: sağa yaslı, tablo rakamı (hizalı sütun). */
export const volumeNumCell = style({
  paddingBlock: vars.space[2],
  paddingInline: vars.space[3],
  borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
  color: vars.color.text.primary,
  textAlign: 'end',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})

export const visuallyHidden = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
})
