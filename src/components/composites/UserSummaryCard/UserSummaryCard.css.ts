import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const card = recipe({
  base: {
    display: 'grid',
    alignItems: 'start',
    gap: vars.space[3],
    background: vars.color.bg.surface,
    border: '1px solid',
    borderColor: vars.color.border.subtle,
    borderRadius: vars.radius.lg,
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: vars.duration.fast,

    selectors: {
      /*
        Kaldırma etkisi yalnız tıklanabilir kartta: tıklanmayan bir kartın
        hover'da kalkması, olmayan bir eylem vaat eder.
      */
      '&[data-clickable]:hover': {
        borderColor: vars.color.border.default,
        boxShadow: vars.shadow.sm,
      },
    },
  },

  variants: {
    variant: {
      /** Liste satırı: dar dolgu, tek satırlık kimlik. */
      compact: { padding: vars.space[3] },
      /** Detay başlığı: iletişim ve sayaçlar da sığar. */
      detailed: { padding: vars.space[4] },
      /** Yaptırım kararı: uyarı bandına nefes alacak yer gerekir. */
      security: { padding: vars.space[4] },
    },

    /**
     * Eylemler kendi kolonunda, tıklanabilir bölgenin **kardeşi** olarak durur.
     * `minmax(0, 1fr)`: `1fr`'in min genişliği `auto`dur ve uzun bir e-posta
     * kolonu içeriği kadar şişirip kartı taşırırdı.
     */
    withActions: {
      true: {
        gridTemplateColumns: 'minmax(0, 1fr) auto',

        '@media': {
          /*
            320 pikselde eylem kolonuna kalan yer bir butondan dar kalıyor ve
            butonlar teker teker kendi satırına düşüp tırtıklı bir sütun
            oluşturuyor. Alt satıra alınınca tam genişliği kullanıyorlar.
          */
          'screen and (max-width: 30rem)': {
            gridTemplateColumns: 'minmax(0, 1fr)',
          },
        },
      },
      false: { gridTemplateColumns: 'minmax(0, 1fr)' },
    },
  },

  defaultVariants: { variant: 'compact', withActions: false },
})

/**
 * Kartın tıklanabilir kısmı: `onClick` varsa `<button>`, yoksa `<div>`.
 *
 * Buton olduğunda tarayıcı varsayılanlarını (kenarlık, zemin, dolgu, ortalanmış
 * metin, kendi yazı tipi) sıfırlamak gerekir — aksi hâlde kart bir form
 * düğmesine benzer ve tipografi token'lardan değil tarayıcıdan gelir.
 */
export const clickRegion = style({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  gap: vars.space[3],
  alignItems: 'start',
  minWidth: 0,
  border: 'none',
  margin: 0,
  padding: 0,
  background: 'transparent',
  font: 'inherit',
  color: 'inherit',
  textAlign: 'start',
  /** Odak halkası (`:focus-visible`, globals.css.ts) kartın köşesini takip etsin. */
  borderRadius: vars.radius.md,

  selectors: {
    'button&': { cursor: 'pointer' },
  },
})

/**
 * Avatar'ın kabı. Var olma sebebi görsel değil erişilebilirlik: `aria-hidden`'ı
 * taşıyan element bu (gerekçe `.tsx`'te). `flex` olmasa satır içi kutu, altında
 * satır kutusunun boşluğunu bırakıp kimlik bloğuyla hizayı kaçırırdı.
 */
export const avatarSlot = style({
  display: 'flex',
  flexShrink: 0,
})

export const body = style({
  display: 'grid',
  gap: vars.space[2],
  alignContent: 'start',
  minWidth: 0,
})

/**
 * Ad ve alt satırı bir arada tutan blok. Boşluk `space[1]` (ölçek tabanı) —
 * ham `0.125rem` yazmak ölçeğin altına inip token'ları atlamak olurdu.
 */
export const identity = style({
  display: 'grid',
  gap: vars.space[1],
  minWidth: 0,
})

export const name = style({
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  lineHeight: vars.lineHeight.tight,
  /** Uzun kurum adı iki satırda kesilir; listede kart yükseklikleri sabit kalır. */
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  overflowWrap: 'anywhere',
})

export const subtitle = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  lineHeight: vars.lineHeight.body,
  overflowWrap: 'anywhere',
})

export const badges = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[1],
})

/**
 * Ad–değer çiftlerinin kabı. Bir `<span>` + `display: grid`, `<dl>` değil: kart
 * `onClick` ile `<button>`'a dönebiliyor ve buton yalnız phrasing content alır
 * (gerekçe `.tsx`'te, `Bilgi`). Element `<span>` olduğu için `<dl>`/`<dd>`
 * margin'lerinin reset'ine gerek yok — dikey ritmi tek başına `gap` token'ı
 * belirliyor, tarayıcı margin'i değil.
 */
export const facts = style({
  display: 'grid',
  gap: vars.space[1],

  '@media': {
    /*
      Dar ekranda çiftler alt alta iniyor (bkz. `fact`) ve etiket ile değer
      arasındaki boşluk kapanıyor; çiftleri birbirinden ayıran tek şey bu gap
      kalıyor. Büyütülmezse "Son giriş / 16 Tem 2026 08:05 / Şikayet / …" tek
      bir blok gibi okunur.
    */
    'screen and (max-width: 30rem)': {
      gap: vars.space[2],
    },
  },
})

export const fact = style({
  display: 'grid',
  gridTemplateColumns: '6rem minmax(0, 1fr)',
  alignItems: 'baseline',
  gap: vars.space[2],

  '@media': {
    /** 320 pikselde 6rem'lik etiket kolonu değere iki kelime bırakıyor. */
    'screen and (max-width: 30rem)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: 0,
    },
  },
})

export const factLabel = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

export const factValue = style({
  minWidth: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  fontVariantNumeric: 'tabular-nums',
  /** Uzun e-posta kırılsın; kart yatay kaydırmasın. */
  overflowWrap: 'anywhere',
})

/**
 * Yaptırım kaydının alanları — `facts` ile **aynı** ızgara, yalnız içeri alınmış.
 *
 * Kopyalanmıyor, besteleniyor: iki blok da ad–değer çifti ve ikisinin dikey ritmi
 * ayrışırsa `security`'de yan yana iki farklı ızgara görünürdü.
 *
 * İçeri alma gerekli, çünkü `security`'de bu blok hesap alanlarının (Son giriş,
 * Şikayet) **hemen üstünde** duruyor ve ikisi birebir aynı görünüyor: girinti
 * olmadan "Gerekçe" hesabın bir alanı sanılır, oysa yaptırımın alanı — üstündeki
 * banda ait. Ayıran şey token'lı bir boşluk, ham piksel değil.
 */
export const sanctionFacts = style([facts, { paddingInlineStart: vars.space[3] }])

/**
 * Yürürlükteki yaptırım bandı. Bir `<span>` + `display: flex`, `<p>` değil:
 * kart `<button>`'a dönebiliyor ve buton yalnız phrasing content alır (gerekçe
 * `.tsx`'te). Element `<span>` olunca `<p>`'nin grid `gap`'inin üstüne binen
 * margin'i de düşüyor — sıfırlamaya gerek kalmıyor. Renk tek kanal değil: ikon
 * ve cümlenin kendisi de var.
 */
export const sanction = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  padding: `${vars.space[2]} ${vars.space[3]}`,
  background: vars.color.danger[50],
  border: `1px solid ${vars.color.danger[100]}`,
  borderRadius: vars.radius.md,
  color: vars.color.danger[800],
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
})

/** "Hiç giriş yapmadı" — bir değer değil, değerin yokluğu. */
export const missing = style({
  color: vars.color.text.muted,
  fontStyle: 'italic',
})

export const clean = style({
  color: vars.color.text.muted,
})

/**
 * Eylemler üstte hizalı: kart uzadıkça (detailed/security) butonlar ortaya
 * kaymasın, göz hep aynı yerde arasın.
 */
export const actionsSlot = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],
  justifySelf: 'end',

  '@media': {
    /** Tek kolona inince "sağa it" anlamsız; eylemler kimliği takip eder. */
    'screen and (max-width: 30rem)': {
      justifySelf: 'stretch',
    },
  },
})
