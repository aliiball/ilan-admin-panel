import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const group = recipe({
  base: {
    display: 'flex',
    gap: vars.space[3],
  },

  variants: {
    orientation: {
      vertical: { flexDirection: 'column' },
      /** Yatay dizilim dar ekranda sarar; taşma yerine alt satıra iner. */
      horizontal: { flexDirection: 'row', flexWrap: 'wrap' },
    },
  },

  defaultVariants: { orientation: 'vertical' },
})

export const option = style({
  display: 'inline-flex',
  alignItems: 'flex-start',
  gap: vars.space[3],
  minHeight: vars.control.height.sm,
  paddingBlock: vars.space[1],
  cursor: 'pointer',

  selectors: {
    '&[data-disabled]': { cursor: 'not-allowed' },
  },
})

export const radio = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '1.25rem',
  height: '1.25rem',
  marginTop: '0.125rem',
  padding: 0,
  background: vars.color.bg.surface,
  border: '1px solid',
  borderColor: vars.color.border.strong,
  borderRadius: vars.radius.full,
  transitionProperty: 'border-color',
  transitionDuration: vars.duration.fast,

  selectors: {
    '&[data-checked]': { borderColor: vars.color.primary[700] },
    '&[data-disabled]': {
      background: vars.color.bg.disabled,
      borderColor: vars.color.border.subtle,
    },
  },
})

/** İç nokta: seçili durumu renkten bağımsız olarak da görünür kılar. */
export const indicator = style({
  width: '0.625rem',
  height: '0.625rem',
  background: vars.color.primary[700],
  borderRadius: vars.radius.full,

  selectors: {
    '[data-disabled] &': { background: vars.color.text.disabled },
  },
})

export const text = style({
  display: 'grid',
  gap: vars.space[1],
  minWidth: 0,
})

export const label = style({
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.tight,
  color: vars.color.text.primary,
  selectors: { '[data-disabled] &': { color: vars.color.text.disabled } },
})

export const description = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
  selectors: { '[data-disabled] &': { color: vars.color.text.disabled } },
})
