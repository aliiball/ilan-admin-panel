import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Kırılımlar `min-width` ile yazılır — AppShell ile aynı iki eşik, aynı gerekçe:
 * brifing mobil görünümü temel alır, masaüstü düzeni onun üzerine eklenir.
 *
 * - `BOLUNMUS` (≥48rem): brifing 3.5'in "desktop split" düzeni — ana kolon ve
 *   yan kolon yan yana.
 * - `YAN_RAY` (≥64rem): "wide side rail" — yan kolon gerçek bir raya daralır,
 *   ana kolon iki katı yer alır.
 */
const BOLUNMUS = 'screen and (min-width: 48rem)'
const YAN_RAY = 'screen and (min-width: 64rem)'

/**
 * Ekranın kökü **flex kolon, grid değil** — ve bu bir stil tercihi değil,
 * `ModerationActionBar`'ın `stickyBottom` varyantının çalışma şartı.
 *
 * `position: sticky` iki şeye birden bağlıdır: yapışacağı kaydırma kabı ve
 * içinde kalmaya mecbur olduğu **kapsayan blok**. Grid öğesinin kapsayan bloğu
 * kendi **grid alanıdır**; çubuğu bir grid satırına koymak onu tam olarak kendi
 * boyunda bir kutuya hapsederdi ve çubuk hiç yapışmazdı — sessizce, çünkü CSS
 * hata vermez ve test görmez. Flex öğesinin kapsayan bloğu ise flex kabının
 * içerik kutusudur, yani bu kökün tamamı: çubuk sayfa boyunca yüzebilir.
 *
 * Aynı sebeple çubuk **doğrudan** bu kökün çocuğudur, bir sarmalayıcı div'in
 * içinde değil — sarmalayıcı da onu kendi boyuna hapsederdi.
 *
 * **`overflow` bu ağaçta hiçbir yere verilmiyor.** AGENTS.md'nin ölçtüğü tuzak:
 * `overflow` verilen kap yeni bir kaydırma kabı olur ve çubuk ekranın altına
 * değil o kabın içeriğinin sonuna oturur. Yatay taşma riski olan yerler (galeri
 * şeridi, karşılaştırma tablosu) kendi kaplarında kaydırılıyor; ekran kendi
 * kaydırma kabını kurmuyor.
 */
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space[6],
})

/**
 * Ana kolon + yan kolon.
 *
 * Ölçüler `fr` oranıyla, ham genişlikle değil: AGENTS.md'nin not ettiği token
 * boşluğu (`space[24]` = 6rem ile `container.sm` = 40rem arası boş) bir yan ray
 * genişliği için token bırakmıyor. Oran hem token gerektirmiyor hem de iki
 * eşiğin farkını doğrudan anlatıyor: 48rem'de eşit bölünme, 64rem'de ray.
 *
 * `minmax(0, …)`: grid öğesinin `min-width: auto` varsayılanı uzun bir değeri
 * (`1.284.937.512 ₺`, uzun bir ilan başlığı) kolondan taşırıp sayfayı yatay
 * kaydırtır.
 */
export const columns = style({
  display: 'grid',
  gap: vars.space[6],
  gridTemplateColumns: 'minmax(0, 1fr)',
  alignItems: 'start',

  '@media': {
    [BOLUNMUS]: {
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    },
    [YAN_RAY]: {
      gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    },
  },
})

/** Bir kolonun bölümleri; `minWidth: 0` metni saran tarafta. */
export const column = style({
  display: 'grid',
  gap: vars.space[6],
  alignContent: 'start',
  minWidth: 0,
})

export const section = style({
  display: 'grid',
  gap: vars.space[3],
  minWidth: 0,
})

/**
 * Bölüm başlığı (`<h2>`).
 *
 * `margin: 0` şart: global reset yalnız `body`'nin margin'ini sıfırlıyor ve
 * `<h2>` kendi `margin-block`'unu taşır; grid kabında bu, `section`'ın
 * `gap`'inin üstüne biner ve dikey ritmi token'lar değil tarayıcı belirler.
 * (ListingFacts'in `sectionTitle`'ı ile birebir aynı gerekçe.)
 */
export const sectionTitle = style({
  margin: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
  overflowWrap: 'anywhere',
})

/**
 * Metrik ızgarası (`<dl>`).
 *
 * `margin: 0`: `<dl>`'in tarayıcı varsayılanı `1em 0`. Değerin (`<dd>`) 40
 * piksellik `margin-inline-start`'ı ayrı bir tuzak ve `metricValue`'da ayrıca
 * sıfırlanıyor — `padding`'i sıfırlamak onu düzeltmez.
 *
 * `min(100%, 7rem)`: 320 pikselde iki kolona iner, kırpılmaz. ListingFacts'in
 * ızgarasıyla aynı kalıp.
 */
export const metrics = style({
  display: 'grid',
  gap: vars.space[3],
  margin: 0,
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 7rem), 1fr))',
})

export const metric = style({
  display: 'grid',
  gap: vars.space[1],
  minWidth: 0,
  padding: vars.space[3],
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
  background: vars.color.bg.subtle,
})

export const metricLabel = style({
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.tight,
  overflowWrap: 'anywhere',
})

/** `<dd>`: 40 piksellik `margin-inline-start` varsayılanı burada sıfırlanıyor. */
export const metricValue = style({
  margin: 0,
  marginInlineStart: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.tight,
  fontVariantNumeric: 'tabular-nums',
  overflowWrap: 'anywhere',
})

/**
 * Şikayet listesi (`<ul>`).
 *
 * Üçü birden şart: `<ul>` hem kendi margin'ini hem de 40 piksellik
 * `padding-inline-start`'ını taşır, madde işareti de kart listesinde gürültü.
 * Semantik liste bilerek seçildi — ekran okuyucu "3 öğe" diyebilmeli.
 */
export const reportList = style({
  display: 'grid',
  gap: vars.space[3],
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const reportItem = style({
  minWidth: 0,
})

/**
 * Kuyruk gezinme çubuğu (önceki / sonraki ilan).
 *
 * `<nav>` gerçek bir landmark ve bu doğru: prev/next kuyruk öğeleri arasında
 * geziniyor. Sayfada başka `<nav>` yok (kabuk Faz 4), tek landmark benzersiz —
 * `landmark-unique` gürültüsü yok. `justify-content: space-between` iki ucu
 * ayırıyor; yalnız biri verilirse boş bir `<span>` diğer ucu tutuyor ki tek
 * buton kendi tarafında kalsın (sadece `next` sağda, sadece `previous` solda).
 */
export const queueNav = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: vars.space[2],
})

/**
 * Admin notları listesi (`<ol>`).
 *
 * En yeni başta (sözleşme sırası). `<ol>`: notlar zamansal bir sicil, semantik
 * liste doğru element — ekran okuyucu "3 not" diyebilmeli. Reset üçlüsü
 * (`listStyle`/`margin`/`padding`) `reportList` ile aynı gerekçe.
 */
export const noteList = style({
  display: 'grid',
  gap: vars.space[3],
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const noteItem = style({
  display: 'grid',
  gap: vars.space[1],
  minWidth: 0,
  padding: vars.space[3],
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
  background: vars.color.bg.subtle,
})

/** Yazar + zaman: dar ekranda alt alta sarar. */
export const noteHead = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: `${vars.space[1]} ${vars.space[2]}`,
  minWidth: 0,
})

export const noteAuthor = style({
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  overflowWrap: 'anywhere',
})

export const noteTime = style({
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.tight,
})

/** `<p>`: global reset yalnız `body`'yi sıfırlıyor, kendi margin'i grid gap'in üstüne binerdi. */
export const noteText = style({
  margin: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
  overflowWrap: 'anywhere',
})

/**
 * Benzer / mükerrer ilan önerileri listesi (`<ul>`).
 *
 * `reportList` ile aynı reset üçlüsü; her öğe bir `ListingCard`. "Yeni sekmede
 * aç" eylemi kartın `actions` slotunda — `onOpenSimilar` verilmezse öneriler
 * salt okunur görünür.
 */
export const similarList = style({
  display: 'grid',
  gap: vars.space[3],
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const similarItem = style({
  minWidth: 0,
})

/**
 * Çakışmadan sonra ilanı yeniden yükleme eylemi.
 *
 * Karar çubuğunun **üstünde**: çubuk kendi `danger` uyarısını kendi render
 * ediyor ve araya girmenin yolu yok. Üstte olması aynı zamanda doğru sekme
 * sırasını veriyor — çakışmada yapılacak ilk şey kararı tekrar denemek değil,
 * ilanı yeniden yükleyip **yeniden bakmak**; o eylem karar butonlarından önce
 * gelmeli.
 */
export const conflictReload = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: vars.space[2],
})
