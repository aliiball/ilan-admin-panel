import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Kuyruk kartlarından tabloya geçiş noktası.
 *
 * `48rem` reponun yerleşik kırılımı (AppShell'in menü kolonu, TopBar, FilterBar
 * ve ImageGallery aynı sayıyı kullanıyor) — ekran kendi kırılımını uydurmuyor.
 *
 * **Container query değil, medya sorgusu:** repoda container query yok ve bu
 * yüzden "mobilde kart, masaüstünde tablo" iddiası play ile ölçülemez (bkz.
 * AGENTS.md, "Medya sorgusu viewport'a bağlıdır, kabın genişliğine değil").
 * Ölçen şey ekran görüntüsü; play yalnız 320 pikselde yatay taşma olmadığını
 * ölçebilir.
 */
const MASAUSTU = 'screen and (min-width: 48rem)'

export const page = style({
  display: 'grid',
  gap: vars.space[5],
  /*
    Grid öğesinin `min-width: auto` varsayılanı "en geniş çocuğun taban
    genişliği" demektir; on bir sütunlu tablo bu yüzden kabuğu kendi genişliğine
    zorlar ve sayfayı yatay kaydırtır. Daralması gereken taraf içerik kolonudur —
    tablo kendi kaydırma kabını (DataTable'ın `scroller`'ı) zaten taşıyor.
  */
  minWidth: 0,
})

export const header = style({
  display: 'grid',
  gap: vars.space[2],
  /** Metni saran taraf: uzun özet satırı sarabilsin diye. */
  minWidth: 0,
})

/**
 * Ekranın en üst başlığı `<h2>`.
 *
 * `<h1>` **bilerek yok**: ekran kabuk değil, kabuğun `<main>`'i içinde yaşıyor
 * ve sayfa başlığı `PageHeader`'ın işi. Kendi `<h1>`'ini basan bir ekran
 * uygulamada iki `<h1>` üretirdi.
 *
 * `margin: 0` şart: global reset yalnız `body`'nin margin'ini sıfırlıyor,
 * `<h*>` tarayıcı varsayılanını taşır ve grid kabında o margin `gap`
 * token'ının üstüne biner — dikey ritmi token'lar değil tarayıcı belirlerdi.
 */
export const title = style({
  margin: 0,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
  color: vars.color.text.primary,
})

/** `<p>` de kendi margin'ini taşır — başlıkla aynı gerekçe. */
export const summary = style({
  margin: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${vars.space[1]} ${vars.space[3]}`,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  overflowWrap: 'anywhere',
})

/**
 * Ayraç `::before` ile basılıyor, DOM'a yazılmıyor.
 *
 * Pseudo içeriği `textContent`'e girmez, dolayısıyla `getByText('Bu sayfada 2
 * açık şikayet')` ayraçtan etkilenmez ve ekran okuyucu araya nokta okumaz.
 */
export const summaryItem = style({
  selectors: {
    '&:not(:first-child)::before': {
      content: '"· "',
      color: vars.color.text.muted,
    },
  },
})

/**
 * Mobil kuyruk kartları — 48rem'in altında.
 *
 * `DataTable`'ın `mobileMode="cards"` kanalı **kullanılmıyor**: prop'un JSDoc'u
 * "dar ekranda ne olacağı" diyor ama uygulaması viewport'a hiç bakmıyor
 * (`DataTable.tsx`: `if (mobileMode === 'cards' && renderMobileCard !== undefined)`
 * koşulsuz kartlara dönüyor). Yani o kanal "dar ekranda kart" değil "her zaman
 * kart" demek; düzen geçişini yapan taraf ekran olmak zorunda.
 */
export const mobileQueue = style({
  display: 'grid',
  gap: vars.space[3],
  minWidth: 0,

  '@media': {
    [MASAUSTU]: { display: 'none' },
  },
})

/**
 * Masaüstü tablosu — 48rem ve üstü.
 *
 * Gizlemek için `display: none` **doğru araç**: kart listesiyle tablo aynı
 * şikayetleri gösteriyor ve ikisinin aynı anda erişilebilirlik ağacında olması
 * ekran okuyucu kullanıcısına her satırı iki kez okuturdu. `display: contents`
 * (AGENTS.md'nin kabuk slot'u reçetesi) burada yanlış olurdu: o kutuyu siler,
 * çocuğu bırakır — yani tabloyu mobilde ekranda tutardı.
 */
export const desktopTable = style({
  display: 'none',
  minWidth: 0,

  '@media': {
    [MASAUSTU]: { display: 'block' },
  },
})

/**
 * Şikayeti açan buton: tablo satırının klavye kapısı.
 *
 * `DataTableProps.onRowClick` **bilerek kullanılmıyor** — `<tr onClick>` yalnız
 * fareyle çalışır (satırın `tabIndex`'i, rolü ve klavye olayı yok), yani satır
 * tıklaması tek yol olsaydı masaüstü tablosu klavyeyle şikayet açamazdı.
 * Gerçek bir `<button>` hem klavyeye hem ekran okuyucuya açık; yan faydası,
 * eylem hücresinin kabarmayı durdurmak zorunda kalmaması.
 */
export const openButton = style({
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.link,
  font: 'inherit',
  fontWeight: vars.font.weight.medium,
  textAlign: 'start',
  cursor: 'pointer',
  overflowWrap: 'anywhere',

  ':hover': { color: vars.color.text.linkHover, textDecoration: 'underline' },
})

/** Kimlik dizeleri: `Intl`'e sokulmaz, olduğu gibi ve monospace yazılır. */
export const identifier = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  overflowWrap: 'anywhere',
})

/**
 * Çözüm notu tam cümledir, hücreye sığmaz.
 *
 * Kırpılmıyor (`text-overflow: ellipsis` yok): "neden kapandı" sorusunun cevabı
 * yarım okunamaz. Kutu sınırlanıp metin sarıyor; `anywhere` şart, `break-word`
 * flex/tablo hücresinin `min-content` tabanını değiştirmez.
 */
export const note = style({
  display: 'block',
  maxWidth: '28rem',
  color: vars.color.text.secondary,
  overflowWrap: 'anywhere',
})

/**
 * Değeri olmayan hücre: "Anonim", "Atanmadı", "Yok".
 *
 * `—` veya boş hücre **bilerek yok**: yokluk da bilgidir ve adı vardır. Renk
 * `text.muted`, `text.disabled` değil — hücre bilgi taşıyor, devre dışı bir
 * kontrol değil (WCAG'in düşük kontrastı bağışladığı yer "etkin olmayan
 * kontrol"; Tag'in ve ListingCard'ın Faz 2'de düzeltilen ihlali tam olarak
 * buydu).
 */
export const empty = style({
  color: vars.color.text.muted,
})

export const rowActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[2],
})

export const cardActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[2],
})

/**
 * Görsel olarak gizli ama ekran okuyucuya açık.
 *
 * `visibility: hidden` veya `display: none` **kullanılamaz**: ikisi de alt ağacı
 * erişilebilir ad hesabından siler (Button'ın `loading` regresyonu). Kalıp
 * `StatCard.css.ts` ve `Checkbox.css.ts` ile birebir aynı — repoda paylaşılan
 * bir yardımcı yok, kopya bilerek.
 */
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
