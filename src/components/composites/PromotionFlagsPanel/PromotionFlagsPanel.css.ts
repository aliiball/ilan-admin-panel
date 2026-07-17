import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/**
 * Rozet listesi bir `<ul>`: dopingler bir küme, tek tek okunur.
 *
 * Global reset yalnız body'nin margin'ini sıfırlıyor; `<ul>`'nin kendi margin'i
 * ve 40 piksellik `padding-inline-start`'ı kalırsa liste sağa kayar ve rozetler
 * arasındaki boşluğu `gap` token'ı değil tarayıcı belirler.
 */
export const badgeList = recipe({
  base: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: vars.space[2],
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },

  variants: {
    /** Düzenleme kipinde satırlar anahtar: yan yana değil, alt alta okunur. */
    editable: {
      true: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: vars.space[3],
      },
      false: {},
    },
  },

  defaultVariants: { editable: false },
})

/**
 * Düzenleme kipindeki rozet satırı: anahtar üstte, kaydın özeti altında.
 *
 * Özet Switch'in `description`'ı **değil**: Base UI Switch adını sarmalayan
 * `<label>`'ın tüm metninden alıyor, açıklama oraya konsaydı anahtarın
 * erişilebilir adına karışırdı (bkz. component JSDoc'u). Kendi elementinde
 * durunca ad "Öne Çıkan" olarak kalıyor.
 */
export const switchRow = style({
  display: 'grid',
  gap: vars.space[1],
})

/** `<p>`: tarayıcı varsayılan margin'i grid `gap`'inin üstüne binmesin. */
export const switchMeta = style({
  margin: 0,
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
})

/** Kart listesi de `<ul>`; aynı reset gerekçesi. */
export const cardList = style({
  display: 'grid',
  gap: vars.space[3],
  /*
    `min(100%, 18rem)`: 320 piksel ekranda kolon 18rem'e zorlanıp kabı taşırmasın
    diye. Geniş ekranda kartlar yan yana, darda tek kolon.
  */
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 18rem), 1fr))',
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const card = recipe({
  base: {
    display: 'grid',
    alignContent: 'start',
    gap: vars.space[2],
    padding: vars.space[3],
    background: vars.color.bg.surface,
    border: `1px solid ${vars.color.border.subtle}`,
    borderRadius: vars.radius.md,
  },

  variants: {
    /**
     * Çelişkili kart zemininden ve kenarlığından da ayrılır — ama tek işareti bu
     * değil: içindeki uyarı satırı ikonuyla ve cümlesiyle aynı şeyi söylüyor.
     * Renk yalnız kartı gözle bulmayı hızlandırır.
     */
    celiskili: {
      true: {
        background: vars.color.warning[50],
        borderColor: vars.color.warning[600],
      },
      false: {},
    },
  },

  defaultVariants: { celiskili: false },
})

export const cardHeader = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space[2],
})

export const label = style({
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  lineHeight: vars.lineHeight.tight,
})

export const cardMeta = style({
  display: 'grid',
  gap: vars.space[1],
  justifyItems: 'start',
})

/** Anahtar–değer satırı: sığmazsa değer alt satıra sarar, kart genişlemez. */
export const meta = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[2],
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
  /* Uzun yönetici kimliği (UUID) kartı taşırmasın. */
  minWidth: 0,
  overflowWrap: 'anywhere',
})

export const metaKey = style({
  color: vars.color.text.muted,
})

export const metaValue = style({
  color: vars.color.text.secondary,
  fontVariantNumeric: 'tabular-nums',
})

/** Hücre içi dikey yığın: rozet, uyarı ve eski kayıt sayısı alt alta. */
export const stack = style({
  display: 'grid',
  gap: vars.space[1],
  justifyItems: 'start',
})

export const muted = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  overflowWrap: 'anywhere',
})

export const sourceText = style({
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
})

export const time = style({
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontVariantNumeric: 'tabular-nums',
  /* Tarih ortasından kırılmasın; tablo gerekirse yatay kayar. */
  whiteSpace: 'nowrap',
})

/**
 * Çelişki uyarısı.
 *
 * `<span>`, çünkü hem kartın `<li>`'sinde hem tablo hücresinin `<span>`'ı içinde
 * görünüyor; `<p>` ikincisinde geçersiz iç içe geçme olurdu. Cümle görünümünü
 * element değil bu `display: flex` veriyor — sıfırlanacak tarayıcı margin'i de
 * böylece yok.
 */
export const warning = style({
  display: 'flex',
  alignItems: 'start',
  gap: vars.space[2],
  color: vars.color.warning[800],
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
})

export const warningIcon = style({
  flexShrink: 0,
  color: vars.color.warning[700],
})
