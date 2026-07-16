import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/**
 * Zaman çizgisi bir `<ol>` — olayların sırası anlamın kendisidir, `<ul>` bunu
 * söylemez. Reset gerekçesi ul ile aynı: global reset yalnız body'ye dokunuyor,
 * ol'un margin'i ve 40 piksellik `padding-inline-start`'ı kalırsa liste sağa
 * kayar ve dikey ritmi grid `gap`'i değil tarayıcı belirler.
 */
export const timeline = style({
  display: 'grid',
  gap: vars.space[4],
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const event = style({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  gap: vars.space[3],
})

export const marker = style({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  width: '0.75rem',
})

export const dot = recipe({
  base: {
    width: '0.75rem',
    height: '0.75rem',
    /* Metnin ilk satırının ortasına denk gelsin diye. */
    marginBlockStart: '0.3rem',
    flexShrink: 0,
    borderRadius: vars.radius.full,
    zIndex: 1,
  },

  variants: {
    tone: {
      neutral: { background: vars.color.neutral[400] },
      info: { background: vars.color.info[600] },
      success: { background: vars.color.success[600] },
      warning: { background: vars.color.warning[600] },
      danger: { background: vars.color.danger[600] },
    },
  },

  defaultVariants: { tone: 'neutral' },
})

/** Noktaları birleştiren dikey çizgi. Son olayda çizilmez: bağlanacak bir şey yok. */
export const line = style({
  position: 'absolute',
  insetBlockStart: '1.25rem',
  insetBlockEnd: `calc(-1 * ${vars.space[4]})`,
  insetInlineStart: '50%',
  width: '1px',
  transform: 'translateX(-50%)',
  background: vars.color.border.default,
})

export const content = recipe({
  base: {
    display: 'grid',
    gap: vars.space[1],
    minWidth: 0,
  },

  variants: {
    variant: {
      timeline: {},
      /** Tek satır: etiket, aktör ve saat yan yana; sarar ama yığılmaz. */
      compact: {
        gridAutoFlow: 'column',
        gridAutoColumns: 'max-content',
        justifyContent: 'start',
        alignItems: 'baseline',
        gap: vars.space[2],
      },
    },
  },

  defaultVariants: { variant: 'timeline' },
})

export const head = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: vars.space[2],
})

export const label = style({
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.tight,
})

export const time = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})

export const actor = style({
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
})

export const transition = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],
  marginBlockStart: vars.space[1],
})

export const arrow = style({
  color: vars.color.text.muted,
  flexShrink: 0,
})

export const reasons = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[2],
  marginBlockStart: vars.space[1],
})

/**
 * Not: alıntı gibi, sola çizgili.
 *
 * `<p>` margin'i sıfırlanıyor — global reset yalnız body'yi sıfırlıyor ve
 * paragrafın kendi margin'i grid `gap`'inin üstüne binerdi.
 */
export const note = style({
  margin: 0,
  marginBlockStart: vars.space[1],
  paddingInlineStart: vars.space[3],
  borderInlineStart: `2px solid ${vars.color.border.subtle}`,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
})

export const compactList = style({
  display: 'grid',
  gap: vars.space[2],
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const compactItem = style({
  paddingBlock: vars.space[1],
  borderBlockEnd: `1px solid ${vars.color.border.subtle}`,

  selectors: {
    '&:last-child': { borderBlockEnd: 'none' },
  },
})

export const cellStack = style({
  display: 'grid',
  gap: vars.space[1],
})

export const cellMuted = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
})
