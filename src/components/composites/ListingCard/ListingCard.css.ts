import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const card = recipe({
  base: {
    display: 'grid',
    background: vars.color.bg.surface,
    border: '1px solid',
    borderColor: vars.color.border.subtle,
    borderRadius: vars.radius.lg,
    overflow: 'hidden',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: vars.duration.fast,

    selectors: {
      '&[data-clickable]:hover': {
        borderColor: vars.color.border.default,
        boxShadow: vars.shadow.sm,
      },
      /** Seçim yalnız renkle değil, kalın kenarlıkla da belli olur. */
      '&[data-selected]': {
        borderColor: vars.color.primary[700],
        boxShadow: `0 0 0 1px ${vars.color.primary[700]}`,
      },
      /** Riskli ilan sol kenardan işaretlenir; tabloyu tararken göze çarpar. */
      '&[data-flagged]': {
        borderInlineStartWidth: '3px',
        borderInlineStartColor: vars.color.danger[600],
      },
    },
  },

  variants: {
    /** Seçim kutusu varsa kart iki sütuna bölünür: kutu | tıklanabilir bölge. */
    selectable: {
      true: { gridTemplateColumns: 'auto 1fr' },
      false: { gridTemplateColumns: '1fr' },
    },
  },

  defaultVariants: { selectable: false },
})

/** Kartın tıklanabilir kısmı. Seçim kutusu bunun dışında, kardeşi olarak durur. */
export const clickRegion = recipe({
  base: {
    display: 'grid',
    border: 'none',
    background: 'transparent',
    padding: 0,
    textAlign: 'start',
    minWidth: 0,
    font: 'inherit',
    color: 'inherit',

    selectors: {
      'button&': { cursor: 'pointer' },
    },
  },

  variants: {
    variant: {
      /** Kuyrukta ve dar listede: yatay, küçük görsel. */
      compact: { gridTemplateColumns: 'auto 1fr', alignItems: 'stretch' },
      /** Detaylı liste: yatay, büyük görsel, tüm meta. */
      detailed: { gridTemplateColumns: 'auto 1fr', alignItems: 'stretch' },
      /** Izgara: dikey, üstte görsel. */
      grid: { gridTemplateRows: 'auto 1fr' },
    },
  },

  defaultVariants: { variant: 'compact' },
})

export const media = recipe({
  base: {
    position: 'relative',
    flexShrink: 0,
    background: vars.color.bg.subtle,
    overflow: 'hidden',
  },
  variants: {
    variant: {
      compact: { width: '7rem' },
      detailed: { width: '11rem' },
      grid: { width: '100%', aspectRatio: '3 / 2' },
    },
  },
  defaultVariants: { variant: 'compact' },
})

export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
})

/** Fotoğrafsız ilan: kırık resim yerine açık bir "görsel yok" durumu. */
export const noPhoto = style({
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  height: '100%',
  minHeight: '5rem',
  color: vars.color.text.disabled,
  gap: vars.space[1],
  fontSize: vars.font.size.sm,
  textAlign: 'center',
  padding: vars.space[2],
})

export const photoCount = style({
  position: 'absolute',
  insetBlockEnd: vars.space[1],
  insetInlineEnd: vars.space[1],
  paddingInline: vars.space[2],
  paddingBlock: '0.0625rem',
  background: 'rgb(15 23 42 / 0.72)',
  borderRadius: vars.radius.sm,
  color: vars.color.neutral[0],
  fontSize: vars.font.size.sm,
  fontVariantNumeric: 'tabular-nums',
})

export const body = style({
  display: 'grid',
  gap: vars.space[2],
  alignContent: 'start',
  padding: vars.space[4],
  minWidth: 0,
})

export const topRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space[3],
})

export const titleBlock = style({
  display: 'grid',
  gap: '0.125rem',
  flex: 1,
  minWidth: 0,
})

export const title = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  lineHeight: vars.lineHeight.tight,
  /** Uzun başlık iki satırda kesilir; kart yüksekliği listede sabit kalır. */
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
})

export const listingNo = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
  fontVariantNumeric: 'tabular-nums',
})

export const meta = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${vars.space[1]} ${vars.space[3]}`,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const metaItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[1],
  minWidth: 0,
})

export const price = style({
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  fontVariantNumeric: 'tabular-nums',
})

export const priceMissing = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.danger[800],
})

export const badges = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[1],
  alignItems: 'center',
})

export const moderationMeta = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${vars.space[1]} ${vars.space[3]}`,
  paddingBlockStart: vars.space[2],
  borderBlockStart: `1px solid ${vars.color.border.subtle}`,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

export const actions = style({
  display: 'flex',
  gap: vars.space[2],
  alignItems: 'center',
  flexShrink: 0,
})

export const selectionCell = style({
  display: 'flex',
  alignItems: 'flex-start',
  paddingInlineStart: vars.space[3],
  paddingBlockStart: vars.space[3],
})
