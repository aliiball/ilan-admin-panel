import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/**
 * Panelin gövdesi **üç varyantta da nötr**.
 *
 * `risk` varyantının kırmızı kenarlık alması cazip ama yanlış olurdu: risk bir
 * hüküm değil sinyaldir (bkz. `.tsx`'teki JSDoc) ve varyant "bu satıcı şüpheli"
 * demek için değil, "şüphelenen kişi buraya bakar" demek için var. Açık şikayeti
 * olmayan, doğrulanmış, iki yıllık bir hesap da `risk` varyantıyla açılabilir —
 * gövde kırmızıysa moderatör daha okumadan hüküm giymiş bir hesap görür. Renk
 * yalnız gerçekten olumsuz olan tekil kayıtlarda: yaptırım bandı ve açık şikayet
 * rozeti.
 */
export const root = recipe({
  base: {
    display: 'grid',
    gap: vars.space[3],
    background: vars.color.bg.surface,
    border: '1px solid',
    borderColor: vars.color.border.subtle,
    borderRadius: vars.radius.lg,
  },

  variants: {
    variant: {
      /** İlan detayının yan kolonu: dar dolgu, tek satırlık kimlik. */
      summary: { padding: vars.space[3] },
      /** Kullanıcı detayı: iletişim ve hesap geçmişi de sığar. */
      detailed: { padding: vars.space[4] },
      /** Risk incelemesi: yaptırım bandına nefes alacak yer gerekir. */
      risk: { padding: vars.space[4] },
    },
  },

  defaultVariants: { variant: 'summary' },
})

/**
 * Avatar · kimlik · eylemler.
 *
 * `minmax(0, 1fr)`: `1fr`'in min genişliği `auto`dur ve uzun bir kurum adı
 * kolonu içeriği kadar şişirip paneli taşırırdı.
 */
export const head = recipe({
  base: {
    display: 'grid',
    alignItems: 'start',
    gap: vars.space[3],
  },

  variants: {
    withActions: {
      true: {
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',

        '@media': {
          /*
            320 pikselde eylem kolonuna kalan yer bir butondan dar kalıyor ve
            butonlar teker teker kendi satırına düşüp tırtıklı bir sütun
            oluşturuyor. Alt satıra alınınca tam genişliği kullanıyorlar.
          */
          'screen and (max-width: 30rem)': {
            gridTemplateColumns: 'auto minmax(0, 1fr)',
          },
        },
      },
      false: { gridTemplateColumns: 'auto minmax(0, 1fr)' },
    },
  },

  defaultVariants: { withActions: false },
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

/**
 * Kimlik ve rozetler. İkisi ayrı satır, aradaki boşluk **yalnız** grid `gap`'inden
 * geliyor: rozet satırına margin verilseydi boşluk `gap` ile toplanır ve dikey
 * ritmi token değil iki kuralın tesadüfi toplamı belirlerdi (`<p>`/`<ul>`
 * varsayılan margin'lerinin `gap`'in üstüne binmesiyle aynı hata, elle yapılmış
 * hâli).
 */
export const body = style({
  display: 'grid',
  gap: vars.space[2],
  alignContent: 'start',
  minWidth: 0,
})

/**
 * Ad ve alt satırı bir arada tutan blok. Boşluk `space[1]` (ölçek tabanı) — ham
 * `0.125rem` yazmak ölçeğin altına inip token'ları atlamak olurdu.
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
  /** Uzun kurum adı iki satırda kesilir; yan kolonda panel yüksekliği patlamasın. */
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
 * Eylemler üstte hizalı: panel uzadıkça (detailed/risk) butonlar ortaya
 * kaymasın, göz hep aynı yerde arasın.
 */
export const actionsSlot = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],
  justifySelf: 'end',

  '@media': {
    /*
      Dar ekranda eylemler kendi satırına iner (bkz. `head`). `gridColumn: '1 / -1'`
      olmazsa avatar kolonunun sağında sıkışıp kalırlar; tam satırı alınca
      butonlar okunur genişliğe kavuşur.
    */
    'screen and (max-width: 30rem)': {
      gridColumn: '1 / -1',
      justifySelf: 'stretch',
    },
  },
})

/**
 * Ad–değer çiftleri. `<dl>`'nin kendi margin'i ve `<dd>`'nin **40 piksellik**
 * `margin-inline-start`'ı burada sıfırlanıyor: global reset yalnız body'nin
 * margin'ini siliyor, dolayısıyla sıfırlanmasa değerler sağa kayar ve dikey
 * ritmi grid `gap`'i değil tarayıcı belirlerdi (`<ul>`'un 40 piksellik
 * `padding-inline-start`'ıyla aynı tuzağın `<dd>` hâli).
 */
export const facts = style({
  display: 'grid',
  gap: vars.space[1],
  margin: 0,
  padding: 0,

  '@media': {
    /*
      Dar ekranda çiftler alt alta iniyor (bkz. `fact`) ve etiket ile değer
      arasındaki boşluk kapanıyor; çiftleri birbirinden ayıran tek şey bu gap
      kalıyor. Büyütülmezse "Açık şikayet / 3 açık şikayet / İlan / 6 ilan" tek
      bir blok gibi okunur.
    */
    'screen and (max-width: 30rem)': {
      gap: vars.space[2],
    },
  },
})

export const fact = style({
  display: 'grid',
  gridTemplateColumns: '7rem minmax(0, 1fr)',
  alignItems: 'baseline',
  gap: vars.space[2],

  '@media': {
    /** 320 pikselde 7rem'lik etiket kolonu değere iki kelime bırakıyor. */
    'screen and (max-width: 30rem)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: 0,
    },
  },
})

export const factLabel = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

export const factValue = style({
  margin: 0,
  minWidth: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  /** Sayılar aynı genişlikte: alt alta gelen ilan/şikayet sayıları hizada dursun. */
  fontVariantNumeric: 'tabular-nums',
  /** Uzun e-posta kırılsın; panel yatay kaydırmasın. */
  overflowWrap: 'anywhere',
})

/**
 * Yürürlükteki yaptırım bandı.
 *
 * `<p>`'nin kendi margin'i sıfırlanıyor — grid `gap`'inin üstüne binerdi. Renk
 * tek kanal değil: ikon ve cümlenin kendisi de var.
 */
export const sanction = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  margin: 0,
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

/** "Açık şikayet yok" — sinyalin yokluğu; rozet kadar bağırmamalı. */
export const clean = style({
  color: vars.color.text.muted,
})
