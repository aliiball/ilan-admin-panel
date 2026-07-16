import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = recipe({
  base: { display: 'grid', width: '100%' },
  variants: {
    orientation: {
      horizontal: { gridTemplateRows: 'auto 1fr' },
      vertical: { gridTemplateColumns: 'auto 1fr', gap: vars.space[5] },
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

export const list = recipe({
  base: {
    display: 'flex',
    gap: vars.space[1],
    position: 'relative',
  },
  variants: {
    orientation: {
      horizontal: {
        /** Sekme sayısı taşarsa erişilebilir yatay kaydırma; kesilmez. */
        overflowX: 'auto',
        scrollbarWidth: 'thin',
        borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
      },
      vertical: {
        flexDirection: 'column',
        borderInlineEnd: `1px solid ${vars.color.border.subtle}`,
        minWidth: '12rem',
      },
    },
    variant: {
      underline: {},
      pill: { borderBlockEnd: 'none', borderInlineEnd: 'none' },
      contained: {
        borderBlockEnd: 'none',
        borderInlineEnd: 'none',
        padding: vars.space[1],
        background: vars.color.bg.subtle,
        borderRadius: vars.radius.md,
      },
    },
  },
  defaultVariants: { orientation: 'horizontal', variant: 'underline' },
})

export const tab = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: vars.space[2],
    minHeight: vars.control.height.sm,
    paddingInline: vars.space[4],
    border: 'none',
    background: 'transparent',
    color: vars.color.text.secondary,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.medium,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: vars.duration.fast,

    ':hover': { color: vars.color.text.primary },

    selectors: {
      '&[data-disabled]': { color: vars.color.text.disabled, cursor: 'not-allowed' },
    },
  },

  variants: {
    variant: {
      /** Seçili sekme yalnız renkle değil, alt çizgiyle de belli olur. */
      underline: {
        borderBlockEnd: '2px solid transparent',
        marginBlockEnd: '-1px',
        selectors: {
          '&[data-selected]': {
            color: vars.color.primary[700],
            borderBlockEndColor: vars.color.primary[700],
          },
        },
      },
      pill: {
        borderRadius: vars.radius.full,
        selectors: {
          '&[data-selected]': {
            background: vars.color.primary[50],
            color: vars.color.primary[800],
          },
        },
      },
      contained: {
        borderRadius: vars.radius.sm,
        selectors: {
          '&[data-selected]': {
            background: vars.color.bg.surface,
            color: vars.color.text.primary,
            boxShadow: vars.shadow.xs,
          },
        },
      },
    },
  },

  defaultVariants: { variant: 'underline' },
})

export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '1.25rem',
  paddingInline: vars.space[1],
  background: vars.color.neutral[200],
  borderRadius: vars.radius.full,
  fontSize: vars.font.size.sm,
  fontVariantNumeric: 'tabular-nums',

  selectors: {
    '[data-selected] &': {
      background: vars.color.primary[100],
      color: vars.color.primary[800],
    },
  },
})

export const panel = style({
  paddingBlock: vars.space[4],
  outline: 'none',
})
