import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = recipe({
  base: {
    display: 'grid',
    alignContent: 'start',
    /** Uzun adres kolonu taşırmasın: grid çocuklarının varsayılan `min-width: auto`'su. */
    minWidth: 0,
  },

  variants: {
    variant: {
      /** Liste satırı / yan panel: iki satırdan fazlası yok, dar aralık. */
      summary: { gap: vars.space[2] },

      /**
       * Harita ve adres yan yana. `minmax(0, 1fr)`: `1fr`'in min genişliği
       * `auto`dur ve uzun bir adres kolonu içeriği kadar şişirip paneli taşırır.
       */
      mapSplit: {
        gap: vars.space[4],
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        alignItems: 'start',

        '@media': {
          /*
            768 pikselin altında iki kolonun her biri ~22rem'e düşüyor; harita
            çerçevesi 4/3 oranıyla iyice cücelesiyor, adres kolonunda ise
            "Koordinat" etiketi değerin üstüne biniyor. Alt alta daha okunur.
          */
          'screen and (max-width: 48rem)': {
            gridTemplateColumns: 'minmax(0, 1fr)',
          },
        },
      },

      /** Belge kontrolü: altı satırlık liste, nefes alacak yer. */
      addressDetail: { gap: vars.space[3] },
    },
  },

  defaultVariants: { variant: 'summary' },
})

/** `mapSplit`'in sağ kolonu. */
export const side = style({
  display: 'grid',
  gap: vars.space[2],
  alignContent: 'start',
  minWidth: 0,
})

export const badgeSlot = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[2],
})

/**
 * Yerleşim satırı: mahalle, ilçe / il.
 *
 * `<p>`'nin kendi margin'i sıfırlanıyor — global reset yalnız body'yi siliyor ve
 * bu margin grid `gap`'inin üstüne binip dikey ritmi token'lardan tarayıcıya
 * devrederdi.
 */
export const locality = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  margin: 0,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.primary,
  lineHeight: vars.lineHeight.tight,
  /** Uzun mahalle adı kırılsın; panel yatay kaydırmasın. */
  overflowWrap: 'anywhere',
})

/**
 * İkonun kabı. Var olma sebebi: flex çocuğu olan bir `<svg>` daralan kapta
 * ezilir (`flex-shrink: 1`) ve iğne yumurtaya döner. Sarmalayıp `flex-shrink: 0`
 * vermek, `svg`'yi seçici ile hedeflemekten (globalStyle) ucuz.
 */
export const localityIcon = style({
  display: 'flex',
  flexShrink: 0,
  color: vars.color.text.muted,
})

/** `summary`'de açık adres + koordinat satırı. */
export const summaryExact = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: vars.space[2],
  margin: 0,
  minWidth: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  lineHeight: vars.lineHeight.body,
})

export const separator = style({
  color: vars.color.text.muted,
})

/**
 * "Sahibin tercihi eziliyor" bandı.
 *
 * `warning` tonu bilinçli: bu bir hata değil, ama dikkat isteyen bir durum —
 * ekranda kişisel veriye yakın bir alan, sahibinin tercihine rağmen duruyor.
 * `info` "bilgine sunulur" derdi ve göz üstünden kayardı; `danger` ise
 * moderatörün meşru işini bir ihlal gibi gösterirdi.
 *
 * Renk tek kanal değil: ikon ve cümlenin kendisi de var.
 */
export const override = style({
  display: 'flex',
  alignItems: 'start',
  gap: vars.space[2],
  margin: 0,
  padding: `${vars.space[2]} ${vars.space[3]}`,
  background: vars.color.warning[50],
  border: `1px solid ${vars.color.warning[100]}`,
  borderRadius: vars.radius.md,
  color: vars.color.warning[800],
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
})

export const overrideIcon = style({
  display: 'flex',
  flexShrink: 0,
  /** İlk satırın orta hizasına: `align-items: start` ikonu yukarı yapıştırıyor. */
  marginBlockStart: '0.125rem',
})

/**
 * Haritanın **yerini tutan** çerçeve.
 *
 * Kesik kenarlık kasıtlı: burası henüz bağlanmamış bir alan (EmptyState'in
 * `filtered` varyantı da aynı dili konuşuyor). Dolu kenarlıklı bir kutu
 * "harita yüklenemedi" diye okunurdu.
 *
 * `aspect-ratio` sabit bir piksel yüksekliği yerine oran veriyor: sağlayıcı
 * gelip karo doldurduğunda çerçeve aynı yeri kaplayacak, düzen zıplamayacak.
 *
 * `min-block-size: fit-content` oranı **taban** yapıyor, deli gömleği değil.
 * Onsuz 320 pikselde çerçeve ~216 piksele kilitleniyor ve koordinatsız ilanın
 * `EmptyState`'i (ikon + başlık + üç satırlık açıklama) kesik kenarlığın
 * dışına taşıyor — yer tutucunun içeriği kendi çerçevesinden taşarsa yer
 * tutmuyor demektir. Küçük içerikte oran korunur, büyük içerikte kutu uzar.
 */
export const mapFrame = style({
  display: 'grid',
  alignContent: 'center',
  justifyItems: 'center',
  gap: vars.space[2],
  aspectRatio: '4 / 3',
  minBlockSize: 'fit-content',
  padding: vars.space[4],
  textAlign: 'center',
  background: vars.color.bg.subtle,
  border: `1px dashed ${vars.color.border.default}`,
  borderRadius: vars.radius.lg,
  minWidth: 0,
})

/** İğne `muted`: yer tutucudaki renkli bir işaret gerçek bir marker vaat ederdi. */
export const mapIcon = style({
  display: 'flex',
  color: vars.color.text.muted,
})

/**
 * Çerçevedeki koordinat. `user-select: all` — tek tıkla seçilip kopyalanır;
 * panelin varlık sebebi bu metnin bir harita aracına yapıştırılması.
 */
export const mapCoords = style({
  margin: 0,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.md,
  color: vars.color.text.primary,
  fontVariantNumeric: 'tabular-nums',
  userSelect: 'all',
  overflowWrap: 'anywhere',
})

/** Gizliyken iğnenin yerine geçen mahalle adı. */
export const mapApprox = style({
  margin: 0,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.secondary,
  overflowWrap: 'anywhere',
})

export const mapNote = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
  lineHeight: vars.lineHeight.body,
})

/**
 * Ad–değer çiftleri. `<dl>`'nin kendi margin'i ve `<dd>`'nin **40 piksellik**
 * `margin-inline-start`'ı burada sıfırlanıyor: global reset yalnız body'nin
 * margin'ini siliyor, dolayısıyla sıfırlanmasa değerler sağa kayardı
 * (ul/ol'un 40 piksellik `padding-inline-start`'ıyla aynı tuzağın `<dd>` hâli).
 */
export const facts = style({
  display: 'grid',
  gap: vars.space[1],
  margin: 0,
  padding: 0,
})

export const fact = style({
  display: 'grid',
  gridTemplateColumns: '7rem minmax(0, 1fr)',
  alignItems: 'baseline',
  gap: vars.space[2],

  '@media': {
    /** 320 pikselde 7rem'lik etiket kolonu "Açık adres"e iki kelime bırakıyor. */
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
  overflowWrap: 'anywhere',
})

/** Adres ve posta kodu: seçmesi kolay olsun, kopyalanacak. */
export const copyable = style({
  userSelect: 'all',
})

/** Koordinat ayrıca mono ve hizalı: 0/O ve 1/l karışmasın, kolonlar oynamasın. */
export const coordinate = style({
  fontFamily: vars.font.family.mono,
  fontVariantNumeric: 'tabular-nums',
  userSelect: 'all',
  overflowWrap: 'anywhere',
})

/** "Girilmemiş" — bir değer değil, değerin yokluğu. */
export const missing = style({
  color: vars.color.text.muted,
  fontStyle: 'italic',
})

/** "Gizli" — değer var, gösterilmiyor. Yokluktan farklı görünmeli: italik değil. */
export const concealed = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[1],
  color: vars.color.text.muted,
})
