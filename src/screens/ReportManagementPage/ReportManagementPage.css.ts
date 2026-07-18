import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

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
 * Çözülmüş kişi adı (şikayetçi / atanan admin).
 *
 * `identifier`'dan ayrı: ad bir insan adıdır, kimlik değil — monospace değil,
 * `text.primary`. `anywhere` şart çünkü firma adları uzun olabiliyor
 * ("Yapı Proje Gayrimenkul") ve dar sütunda hücreyi taşırmamalı.
 */
export const person = style({
  color: vars.color.text.primary,
  overflowWrap: 'anywhere',
})

/**
 * İlan özeti hücresi: başlık, ilan no ve durum rozeti dikey diziliyor.
 *
 * `minWidth: 0` grid/flex öğesinin `min-content` tabanını sıfırlıyor ki uzun
 * başlık hücreyi değil sütunu genişletmesin (sayfa `page`'in `minWidth: 0`'ıyla
 * aynı aile) — kaydırmayı DataTable'ın kendi scroller'ı taşıyor.
 */
export const listingCell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space[1],
  alignItems: 'start',
  minWidth: 0,
  maxWidth: '22rem',
})

/** İlan başlığı; sarabilir, kırpılmaz — "İlan özeti" yarım okunmamalı. */
export const listingTitle = style({
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.primary,
  overflowWrap: 'anywhere',
})

/** İlan numarası: teknik tanımlayıcı, monospace ve sönük. */
export const listingNo = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
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
