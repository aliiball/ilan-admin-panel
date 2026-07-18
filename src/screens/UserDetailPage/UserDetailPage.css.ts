import { globalStyle, style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Ekranın dış kabı.
 *
 * `minWidth: 0` burada güvenli: bu ekranda daralmayı reddetmesi gereken bir
 * kutu yok (AGENTS'ın PageHeader ölçümündeki eylem kutusu gibi) — altındaki her
 * şey ya metin sarıyor (`title`, kart) ya da kendi kaydırma kabına sahip
 * (DataTable). Taşabilecek tek şey kırılmayan bir dizgi ve onu `overflow-wrap:
 * anywhere` çözüyor.
 */
export const root = style({
  display: 'grid',
  /*
    `minmax(0, 1fr)` — tek kolonlu grid'lerde bile şart. Örtük `auto` track'in
    tabanı `min-content`'tir: bir çocuk kırılamıyorsa (uzun e-posta, geniş tablo)
    track kabı aşar ve `minWidth: 0` yalnız kutuyu küçültüp track'i olduğu yerde
    bırakır. Aynı gerekçe aşağıdaki bütün tek kolonlu grid'lerde.
  */
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: vars.space[5],
  minWidth: 0,
})

/**
 * Brifing 3.5'in "Mobile tabs, desktop columns" düzeni.
 *
 * **Kolonlar sekmelerin yerine geçmiyor, sekmeleri saran çerçeve.** Alternatif —
 * mobilde sekme, masaüstünde bölümleri yan yana kolon olarak çizmek — iki yoldan
 * birini gerektirirdi ve ikisi de bu repoda ölçülmüş tuzaklara giriyor:
 *
 * 1. Bölümleri **iki kez** render etmek (bir sekmeli, bir kolonlu): audit
 *    tablosu DOM'da iki kez bulunurdu ve "destek'te audit sekmesi YOK" iddiası
 *    sayı saymaya dönerdi — üstelik `useId` çakışmaları SidebarNav'ın rayı ile
 *    çekmecesinde yaşananın aynısını üretirdi.
 * 2. Birini `display: none` ile gizlemek: alt ağacı erişilebilirlik ağacından
 *    **siler** (AGENTS'ın `display: none` maddesi) ve yetki iddiasını
 *    ölçülemez kılardı — "gizli" ile "yok" aynı şeye benzerdi.
 *
 * Bu yüzden bölümler **tek DOM**'da ve her zaman `Tabs` içinde; kolonlaşan şey
 * sayfanın çerçevesi: özet rayı + içerik. `1fr / 2fr` oranı bilerek ham ölçü
 * değil — `space[24]` (6rem) ile `container.sm` (40rem) arasındaki token
 * boşluğu (bkz. AGENTS) bir ray genişliği yazmayı imkânsız kılıyor, oran ise
 * token gerektirmiyor.
 */
export const columns = style({
  display: 'grid',
  gap: vars.space[5],
  alignItems: 'start',
  gridTemplateColumns: 'minmax(0, 1fr)',
  minWidth: 0,

  '@media': {
    'screen and (min-width: 64rem)': {
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
    },
  },
})

export const summary = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: vars.space[4],
  alignContent: 'start',
  minWidth: 0,
})

export const sections = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: vars.space[4],
  alignContent: 'start',
  minWidth: 0,
})

/**
 * ⚠ `Tabs` kusurunun ekran tarafındaki telafisi — RAPORLANDI, kalıcı çözüm burada değil.
 *
 * `Tabs.css.ts` → `root` bir grid (`display: grid` + `gridTemplateRows: 'auto 1fr'`)
 * ama **kolon track'i bildirilmemiş**; örtük `auto` track'in tabanı `min-content`'tir.
 * `Tabs` → `panel` de `min-width: 0` taşımıyor, yani grid öğesi olarak
 * `min-width: auto` ile geliyor ve otomatik minimum boyutu **içeriğinin
 * min-content'i** oluyor. İlan tablosunun min-content'i 629 piksel: track 629'a
 * kilitleniyor, panel `width: 100%` olan Tabs kökünü aşıyor ve **sayfa** 320
 * pikselde yatay kayıyor — oysa kayması gereken şey `DataTable`in kendi
 * `overflow-x: auto` scroller'ı. Bu, `root`'un yukarıdaki yorumunda anlatılan
 * tuzağın birebir aynısı, yalnız bizim değil `Tabs`'ın grid'inde.
 *
 * Ölçüldü (`MobileTabs` play'i, Chromium 320px): panel `min-width: auto` iken
 * track = 629; `min-width: 0` verilince track = 320, scroller 320'ye oturuyor ve
 * tablo kendi kabında kayıyor. Aynı kusur `Tabs`ın **kendi** sözleşmesini de
 * deliyor: `list` `overflow-x: auto` ile "sekmeler taşarsa kaydırılır" diyor ama
 * track max-content'e açıldığı için şerit hiç kaydırılmıyor, kabı geniyor.
 *
 * `AuditLogPage` bu tuzağa **rastlantıyla** düşmüyor: `DataTable`i `Tabs`sız,
 * doğrudan grid çocuğu olarak çiziyor ve `visualStyle` varsayılanı olmayan
 * (`bordered`) wrapper'ı `overflow: hidden` taşıdığı için o wrapper bir kaydırma
 * kabı — grid öğesi olan kaydırma kabının otomatik minimum boyutu **sıfırdır**.
 * Yani orada kuralı `DataTable` kurtarıyor, `Tabs` değil.
 *
 * `TabsProps`'ta `className` yok (sözleşme kontrollü ve dar), dolayısıyla ekranın
 * elindeki tek araç yapısal seçici. Kalıp evde zaten var: `DateRangePicker.css.ts`
 * react-day-picker'ın iç ağacını `globalStyle` + kendi sınıfına köklenmiş bir
 * seçiciyle hedefliyor (`.rdp-root`, `.rdp-weekday`, …). Seçici `sections`'a
 * köklendiği için etki bu ekranla sınırlı; başka `Tabs` tüketicisine sızmıyor.
 *
 * `> * > *` = `Tabs` kökünün iki çocuğu (şerit + panel). İkisine de `min-width: 0`
 * doğru: panel zaten `DataTable` scroller'ına sahip, şerit zaten `overflow-x: auto`.
 *
 * **Kalıcı çözüm `Tabs.css.ts`'te**: `root`'a `gridTemplateColumns: 'minmax(0, 1fr)'`
 * (ya da `panel`'e `minWidth: 0`). O dosya bu turda yazılmadı; `Tabs` panelinde
 * geniş bir tablo ya da kırılmayan uzun bir dizge gösteren **her** tüketici aynı
 * duvara çarpacak.
 */
globalStyle(`${sections} > * > *`, {
  minWidth: 0,
})

/**
 * Ekranın en üst başlığı.
 *
 * `<h2>`, `<h1>` değil: sayfanın `<h1>`'i `PageHeader`'ındır ve bu ekran kabuk
 * render etmez (bkz. component JSDoc'u). `<h*>` tarayıcı margin'i taşıyor ve
 * global reset yalnız `body`'yi sıfırlıyor — sıfırlanmasa grid `gap`'inin
 * üstüne binerdi.
 */
export const title = style({
  margin: 0,
  minWidth: 0,
  fontSize: vars.font.size['2xl'],
  lineHeight: vars.lineHeight.tight,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  /** Uzun kurum adı (`Karadeniz … Anonim Şirketi`) 320 pikselde sarmalı, taşmamalı. */
  overflowWrap: 'anywhere',
})

/**
 * Başlığın iskelet hâlinin kabı.
 *
 * `Skeleton`'ın `height: 1em`'i gerçek metnin **satır kutusundan kısadır**
 * (AGENTS: 2xl + tight'ta fark yarım satır) ve veri gelince başlık zıplardı.
 * Kap aynı `fontSize`'ı alıp `minBlockSize`'ı satır kutusuna sabitliyor: iskelet
 * ile gerçek başlık aynı yüksekliği kaplıyor.
 */
export const titleSkeleton = style({
  display: 'block',
  fontSize: vars.font.size['2xl'],
  minBlockSize: `calc(1em * ${vars.lineHeight.tight})`,
})

/** Kartın iskeleti: avatar dairesi + kimlik bloğu, gerçek kartla aynı ızgarada. */
export const cardSkeleton = style({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  gap: vars.space[3],
  alignItems: 'start',
  padding: vars.space[4],
  background: vars.color.bg.surface,
  border: '1px solid',
  borderColor: vars.color.border.subtle,
  borderRadius: vars.radius.lg,
})

export const cardSkeletonBody = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: vars.space[2],
  minWidth: 0,
})

/** Sekme şeridinin iskeleti — üç sekme kadar yer tutar, veri gelince şerit zıplamaz. */
export const tabsSkeleton = style({
  display: 'flex',
  gap: vars.space[4],
  paddingBlockEnd: vars.space[3],
  borderBlockEnd: '1px solid',
  borderColor: vars.color.border.subtle,
})

export const tableSkeleton = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: vars.space[3],
  padding: vars.space[4],
  background: vars.color.bg.surface,
  border: '1px solid',
  borderColor: vars.color.border.subtle,
  borderRadius: vars.radius.lg,
})

/**
 * Admin rolü kutusu.
 *
 * Select `width: 100%` ile geliyor (`internal/listbox.css.ts`), yani kolonu
 * takip ediyor; `minmax(0, 1fr)` onun 320 pikselde kutuyu aşmasını engelliyor.
 * Kutunun kendisi kartın kardeşi — kartla aynı yüzeyi ve köşeyi taşıyor ki
 * özet rayı tek bir blok gibi okunsun.
 */
export const roleBox = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: vars.space[2],
  padding: vars.space[4],
  background: vars.color.bg.surface,
  border: '1px solid',
  borderColor: vars.color.border.subtle,
  borderRadius: vars.radius.lg,
})

/**
 * Şikayet kartlarının listesi.
 *
 * `<ul>` semantik olarak doğru element (şikayetler bir liste), ama tarayıcı
 * varsayılanı **iki** özellik taşıyor: kendi margin'i ve 40 piksellik
 * `padding-inline-start`'ı. AGENTS'ın reçetesi: `listStyle: 'none'` +
 * `margin: 0` + `padding: 0` üçü birden — yalnız margin'i sıfırlamak listeyi
 * sağa kaymış bırakır.
 */
export const reportList = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: vars.space[3],
  listStyle: 'none',
  margin: 0,
  padding: 0,
  minWidth: 0,
})

export const reportItem = style({
  minWidth: 0,
})

/**
 * İlanlar sekmesinin gövdesi: tablo + (kanal bağlıysa) sayfalama.
 *
 * `Pagination` `DataTable`'ın hemen altında dikey akıyor; `gap` token ile,
 * `minWidth: 0` tablonun kendi kaydırma kabının grid içinde küçülebilmesi için.
 */
export const listingsTab = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: vars.space[4],
  minWidth: 0,
})

/** Yaptırım dialog'unun gövdesi: gerekçe + (askıda) süre alanı alt alta. */
export const dialogBody = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: vars.space[4],
  minWidth: 0,
})

/**
 * Dialog footer'ının eylem şeridi: Vazgeç + onay, sağa yaslı.
 *
 * `flex-wrap` dar ekranda butonların taşmak yerine alt satıra inmesi için —
 * `Modal` `sm` genişlikte iki buton 320 pikselde sığmayabilir.
 */
export const dialogActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: vars.space[3],
})

/** Tablo hücresindeki uzun başlığın kartı taşırmaması için. */
export const cellText = style({
  display: 'block',
  minWidth: 0,
  overflowWrap: 'anywhere',
})

/**
 * Tarih hücresi.
 *
 * `ColumnDef.width` **kullanılmıyor**: kabul edilebilir tek değer (~11rem) için
 * token yok — `space[24]` (6rem) ile `container.sm` (40rem) arası boş (AGENTS)
 * — ve "component ham ölçü içermez" kuralı sütun genişliğini de kapsıyor.
 * `white-space` bir ölçü değil: "16 Tem 2026 08:15" iki satıra bölünmesin diye
 * yeter, gerisini tablonun kendi kaydırma kabı halleder.
 */
export const dateCell = style({
  whiteSpace: 'nowrap',
})
