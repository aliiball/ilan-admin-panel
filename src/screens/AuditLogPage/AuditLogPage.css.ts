import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Ekranın kökü.
 *
 * `minWidth: 0`: ekran Faz 4'te `AppShell`in `<main>`'ine grid çocuğu olarak
 * girecek ve grid öğesinin `min-width: auto` varsayılanı "en geniş çocuğun taban
 * genişliği" demektir. Audit tablosunun sekiz sütunu bir kez genişleyince kabuk
 * bir daha küçülemez ve 320 pikselde **sayfa** yatay kayardı — oysa kayması
 * gereken şey tablonun kendi kabı (`DataTable`in `overflow-x: auto` scroller'ı).
 * `minWidth` metni saran tarafa yazılıyor, sabit genişlikli kontrol taşıyan
 * tarafa değil.
 */
export const root = style({
  display: 'grid',
  gap: vars.space[5],
  minWidth: 0,
})

/**
 * Bölüm başlığı.
 *
 * `<h2>`, `<h1>` değil: sayfanın `<h1>`'i kabuğun `PageHeader`'ının olacak
 * (brifing 3.4) ve ekran kabuk render etmiyor. Tarayıcı `<h*>`'lere margin
 * veriyor, global reset yalnız `body`'yi sıfırlıyor — sıfırlanmazsa dikey ritmi
 * `root`'un `gap` token'ı değil tarayıcı belirler.
 */
export const baslik = style({
  margin: 0,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
  color: vars.color.text.primary,
})

/**
 * Başlık ile "Dışa aktar" butonunu aynı satıra alan kutu.
 *
 * `flexWrap: 'wrap'` + `gap`: dar ekranda buton başlığın altına iner, yan yana
 * sıkışıp taşmaz. `justifyContent: 'space-between'` başlığı sola, butonu sağa
 * yaslar; `alignItems: 'center'` ikisini dikeyde ortalar. `minWidth: 0` başlığın
 * (metni saran taraf) daralmasına izin verir — sabit genişlikli butona değil.
 */
export const baslikSatiri = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[3],
  justifyContent: 'space-between',
  alignItems: 'center',
  minWidth: 0,
})

/**
 * `unauthorized` durumundaki güvenli geri dönüş bağlantısının satırı
 * (brifing 2.1).
 *
 * `<p>`nin tarayıcı margin'i sıfırlanıyor; altı çizgi **bilerek duruyor** —
 * `globals.css`in `a` kuralı rengi ve `text-underline-offset`i veriyor, altı
 * çizgiyi bırakıyor ve bağlantı afordansı tam olarak odur.
 */
export const geriDonus = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  textAlign: 'center',
})

/** Tarih hücresi: satır satır aynı genişlikte okunsun diye tabular rakam. */
export const zamanHucresi = style({
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
})

/**
 * Varlık ve korelasyon kimliği hücresi.
 *
 * Monospace: `listing-residential-konyaalti-villa` ile
 * `req-2026-07-15-e1937a` teknik tanımlayıcı, prose değil — karakter karakter
 * karşılaştırılıyorlar.
 *
 * `overflow-wrap: anywhere`, `break-word` **değil**: flex/grid öğesinin otomatik
 * minimum boyutu `min-content`'tir ve `break-word` onu değiştirmez, `anywhere`
 * değiştirir. Korelasyon kimliği gibi boşluksuz uzun bir dizgi ancak `anywhere`
 * ile sarar; `break-word` ile çekmeceyi genişletirdi.
 */
export const kimlikHucresi = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.sm,
  overflowWrap: 'anywhere',
})

/** Çekmece gövdesinin dikey ritmi. */
export const detayGovdesi = style({
  display: 'grid',
  gap: vars.space[5],
  minWidth: 0,
})

/**
 * Ad-değer listesi.
 *
 * `<dl>` kendi margin'ini taşır ve `<dd>` **40 piksel `margin-inline-start`**
 * taşır (`<ul>`/`<ol>`'un padding'iyle aynı sayı, farklı özellik). İkisi de
 * sıfırlanmazsa değerler terimlerinden 40 piksel sağda başlar ve dikey ritmi
 * `gap` değil tarayıcı belirler.
 */
export const detayListesi = style({
  display: 'grid',
  gap: vars.space[3],
  margin: 0,
  minWidth: 0,
})

/** `<dt>`/`<dd>` çiftini saran kutu — `<dl>` içinde `<div>` geçerli HTML5'tir. */
export const detaySatiri = style({
  display: 'grid',
  gap: vars.space[1],
  minWidth: 0,
})

export const detayTerimi = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.muted,
})

export const detayDegeri = style({
  marginInlineStart: 0,
  color: vars.color.text.primary,
  overflowWrap: 'anywhere',
})

export const jsonBolumu = style({
  display: 'grid',
  gap: vars.space[2],
  minWidth: 0,
})

/** Çekmecenin `Dialog.Title`'ı `<h2>`; JSON bloğunun başlığı onun altında `<h3>`. */
export const jsonBasligi = style({
  margin: 0,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
  color: vars.color.text.primary,
})

/**
 * `metadata`nın JSON dökümü.
 *
 * `margin: 0`: `<pre>` tarayıcı varsayılanı olarak hem margin hem monospace font
 * taşır; global reset yalnız `body`'yi sıfırlıyor. Font token'dan geliyor
 * (`vars.font.family.mono`) — tarayıcının `monospace` varsayılanı temaya bağlı
 * değil ve boyutu `font-size: medium`e sabitleyip `vars.font.size.sm`'i yutar.
 *
 * `overflow: 'auto'`: uzun bir `after` nesnesi (`reviewNote` bir cümle taşıyor)
 * satırı taşırır. `whiteSpace` bilerek `pre` (varsayılan) bırakıldı: JSON'un
 * girintisi bilginin kendisi, sarılırsa `before`/`after` ağacı okunamaz hale
 * gelir — taşan şey yatay kaydırılmalı.
 *
 * `tabIndex={0}` component'te veriliyor: kaydırma kabının içinde odaklanılacak
 * hiçbir şey yok (salt okunur metin), yani klavye kullanıcısı fare olmadan
 * kaydıramaz — axe `scrollable-region-focusable` tam olarak bunu ölçüyor.
 * `role="region"` **verilmedi**: rol landmark üretir, adı benzersiz olmak
 * zorundadır ve kural yalnız odaklanılabilirlik istiyor.
 */
export const json = style({
  margin: 0,
  padding: vars.space[3],
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
  color: vars.color.text.primary,
  background: vars.color.bg.subtle,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  overflow: 'auto',
})
