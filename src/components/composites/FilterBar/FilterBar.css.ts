import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = recipe({
  base: {
    display: 'grid',
    gap: vars.space[4],
  },

  variants: {
    variant: {
      inline: {
        padding: vars.space[4],
        background: vars.color.bg.surface,
        border: `1px solid ${vars.color.border.subtle}`,
        borderRadius: vars.radius.lg,
      },
      stacked: {
        padding: vars.space[4],
        background: vars.color.bg.surface,
        border: `1px solid ${vars.color.border.subtle}`,
        borderRadius: vars.radius.lg,
      },
      /** Drawer içinde kendi kabı ve kenarlığı yok; kap zaten Drawer'ın gövdesi. */
      drawer: {},
    },
  },

  defaultVariants: { variant: 'inline' },
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  flexWrap: 'wrap',
})

export const heading = style({
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
})

export const fields = recipe({
  base: {
    display: 'grid',
    gap: vars.space[3],
    alignItems: 'end',
  },

  variants: {
    variant: {
      /**
       * `auto-fit` + `minmax`: alanlar en az 12rem, sığdığı kadar yan yana.
       * 320 pikselde kendiliğinden tek kolona düşer — ayrı bir medya sorgusu
       * gerekmez.
       */
      inline: { gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' },
      stacked: { gridTemplateColumns: '1fr' },
      drawer: { gridTemplateColumns: '1fr' },
    },
  },

  defaultVariants: { variant: 'inline' },
})

/** Grid çocuğunun içeriğine göre şişip kolonu taşırmasını engeller. */
export const field = style({
  minWidth: 0,
})

/**
 * Sayısal aralık iki kutu taşır; tek kolona sıkışınca `+/-` basamakları
 * okunmaz hale gelir. Geniş ekranda iki kolon yer kaplar, darda tek kolona döner.
 */
export const fieldWide = style({
  minWidth: 0,

  '@media': {
    'screen and (min-width: 48rem)': {
      gridColumn: 'span 2',
    },
  },
})

/** Tarayıcının fieldset varsayılanları (kenarlık, dolgu, margin) sıfırlanır. */
export const rangeGroup = style({
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 'none',
})

export const rangeLegend = style({
  padding: 0,
  marginBlockEnd: vars.space[1],
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
})

export const rangeInputs = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: vars.space[2],
})

/** Switch kendi etiketini yanında taşır; etiketi üstte olan alanlarla hizalanması için. */
export const switchField = style({
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  minHeight: vars.control.height.md,
})

/**
 * `end` hizası: görünüm kaydetme satırı açıldığında kutunun üstünde bir etiket
 * belirir ve satır uzar; ortalanmış olsaydı "Temizle" komşusu "Kaydet"in üstünde
 * kalırdı. Butonlar eşit yükseklikte olduğu için kapalı durumda fark etmez.
 */
export const actions = style({
  display: 'flex',
  alignItems: 'end',
  gap: vars.space[2],
  flexWrap: 'wrap',
})

/** Görünüm kaydetme satırı: ad kutusu esner, butonlar sabit kalır. */
export const saveView = style({
  display: 'flex',
  alignItems: 'end',
  gap: vars.space[2],
  flexWrap: 'wrap',
})

export const saveViewInput = style({
  minWidth: '10rem',
  flex: 1,
})

export const drawerFooter = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space[3],
  width: '100%',
})
