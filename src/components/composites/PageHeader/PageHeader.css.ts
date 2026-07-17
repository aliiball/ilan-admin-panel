import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Düzen **mobil önce** kurulur, masaüstü `min-width` ile üstüne biner (brifingin
 * responsive kuralı). Taban dikey: "sayfa başlığı ve eylemler mobilde dikey
 * sıralanmalıdır" kabul kriteri, ancak yatay satır bir *eklenti* olduğunda
 * kendiliğinden sağlanır — `max-width` ile yazılsaydı 320 pikselde doğru düzeni
 * almak bir istisnaya bağlı kalırdı.
 */
export const root = style({
  display: 'grid',
  gap: vars.space[3],
  /* Izgara/flex çocuğunun `min-width: auto` varsayılanı uzun başlıkta kabı
     genişletip sayfayı yatay kaydırtır. */
  minWidth: 0,
})

/**
 * Kırıntı listesi.
 *
 * Reset: global reset yalnız `body`'nin margin'ini sıfırlıyor; `<ol>` kendi
 * margin'ini **ve 40 piksellik `padding-inline-start`'ını** taşır. Üçü birden
 * (`listStyle` + `margin` + `padding`) sıfırlanmazsa yol sağa kayar ve dikey
 * ritmi `gap` token'ı değil tarayıcı belirler.
 *
 * Negatif başlangıç margin'i `crumb`'ın dokunma dolgusunu geri alır: kırıntı
 * metni h1 ile aynı hizada başlar, basılabilir alan dolgu kadar dışarı taşar.
 * Satır *başındaki* taşma kaydırma üretmez (tarayıcı LTR'de orijinin soluna
 * kaydırmaz), yani 320 piksel güvende.
 */
export const crumbList = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[1],
  listStyle: 'none',
  margin: 0,
  padding: 0,
  marginInlineStart: `calc(-1 * ${vars.space[2]})`,
})

export const crumb = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[1],
  minWidth: 0,
})

/**
 * Dokunma hedefi brifingde en az 44×44 piksel; 1rem'lik bir kırıntı metni kendi
 * başına ~22 piksel yüksekliğinde kalır. Kutu `control.height.sm`e (2.75rem =
 * 44 piksel) sabitlenip metin ortalanıyor: **görünen boyut değişmiyor, basılan
 * alan büyüyor.** Ölçen story: `BreadcrumbTouchTargets`.
 *
 * Kırıntı kısaltılmaz, sarar (`overflowWrap`). Kısaltılmış bir yol
 * ("Konyaaltı'nda Havuz…") kullanıcıya nerede olduğunu söylemez; sarmak
 * yer harcar ama bilgiyi korur.
 */
const crumbBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minBlockSize: vars.control.height.sm,
  minInlineSize: vars.control.height.sm,
  paddingInline: vars.space[2],
  borderRadius: vars.radius.sm,
  fontSize: vars.font.size.sm,
  overflowWrap: 'anywhere',
})

export const crumbLink = style([
  crumbBase,
  {
    color: vars.color.text.link,
    textDecoration: 'none',

    selectors: {
      '&:hover': {
        color: vars.color.text.linkHover,
        textDecoration: 'underline',
      },
    },
  },
])

/**
 * `href`i olmayan ara kırıntı: bağlantı gibi görünmemeli, yoksa kullanıcı
 * tıklayıp hiçbir şey olmadığını görür.
 */
export const crumbText = style([
  crumbBase,
  {
    color: vars.color.text.muted,
  },
])

/** Bulunulan sayfa. Ara kırıntılardan ağırlıkla ayrılır: yolun ucu nerede belli. */
export const crumbCurrent = style([
  crumbBase,
  {
    color: vars.color.text.secondary,
    fontWeight: vars.font.weight.medium,
  },
])

export const separator = style({
  flexShrink: 0,
  color: vars.color.text.muted,
})

/**
 * Başlık bloğu ile eylemler.
 *
 * Mobilde alt alta; 48rem'den itibaren yan yana ve eylemler sağda.
 * `alignItems: flex-start` bilinçli: açıklama iki satıra çıktığında eylemler
 * ortalanıp aşağı kaymasın, h1 ile aynı hatta kalsın.
 */
export const main = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: vars.space[4],

  '@media': {
    'screen and (min-width: 48rem)': {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: vars.space[6],
    },
  },
})

export const titleBlock = style({
  display: 'grid',
  gap: vars.space[2],
  /* Uzun başlık eylemleri kabın dışına itmesin: blok küçülebilmeli. */
  flex: 1,
  minWidth: 0,
})

/** Meta başlığın yanında durur; sığmazsa altına sarar — kesilmez. */
export const titleRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[3],
  minWidth: 0,
})

/**
 * `<h1>` tarayıcı varsayılanı olarak `margin-block: 0.67em` ve 2em'lik bir
 * `font-size` taşır; global reset yalnız `body`'ye dokunuyor. Sıfırlanmazsa
 * dikey ritmi `gap` token'ları değil tarayıcı belirler.
 *
 * `overflowWrap: anywhere`: boşluksuz uzun bir dize (ilan no, yapıştırılmış
 * URL) 320 pikselde kabı taşırır.
 */
export const title = style({
  margin: 0,
  minWidth: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size['2xl'],
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
  overflowWrap: 'anywhere',

  '@media': {
    /* Dar ekranda 3xl bir başlık üç satıra çıkıp ekranın yarısını yiyor. */
    'screen and (min-width: 48rem)': {
      fontSize: vars.font.size['3xl'],
    },
  },
})

export const meta = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],
  minWidth: 0,
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
})

/**
 * `<p>`'nin `margin-block: 1em` varsayılanı aynı sebeple sıfırlanıyor.
 * Satır uzunluğu sınırlı: geniş ekranda tam genişlikte akan bir açıklamada göz
 * satır başını kaybeder.
 */
export const description = style({
  margin: 0,
  maxWidth: '68ch',
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
})

/**
 * Eylemler taşarsa **sarar**, kaydırma çubuğuna veya "…" menüsüne düşmez:
 * sözleşme `secondaryActions`'ı opak bir `ReactNode` olarak veriyor, başlık
 * içindekileri sayamaz.
 *
 * İki ölçü bilinçli olarak **yazılmadı**:
 * - `flexShrink: 0` — altı eylemli bir başlık masaüstünde kabı taşırırdı.
 * - `minWidth: 0` — flex öğesinin `min-width: auto` varsayılanı, kutuyu en geniş
 *   butonun altına inmekten korur. Sıfırlansaydı uzun başlıklı bir sayfada
 *   (`LongContent`) eylem kutusu butondan dar kalır ve buton dışarı taşardı;
 *   daralan taraf `titleBlock` olmalı, çünkü metni sarabilen o.
 */
export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],

  '@media': {
    'screen and (min-width: 48rem)': {
      justifyContent: 'flex-end',
    },
  },
})
