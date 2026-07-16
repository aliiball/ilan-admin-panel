import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const textarea = recipe({
  base: {
    width: '100%',
    minHeight: '6rem',
    padding: vars.space[3],
    background: vars.color.bg.surface,
    border: '1px solid',
    borderColor: vars.color.border.default,
    borderRadius: vars.radius.md,
    color: vars.color.text.primary,
    fontFamily: 'inherit',
    fontSize: vars.font.size.sm,
    lineHeight: vars.lineHeight.body,
    transitionProperty: 'border-color',
    transitionDuration: vars.duration.fast,
    transitionTimingFunction: vars.ease.standard,

    ':focus': {
      borderColor: vars.color.focus.ring,
    },

    '::placeholder': {
      color: vars.color.text.muted,
    },

    selectors: {
      '&[data-invalid]': {
        borderColor: vars.color.danger[600],
      },
      '&:disabled': {
        background: vars.color.bg.disabled,
        borderColor: vars.color.border.subtle,
        color: vars.color.text.disabled,
        cursor: 'not-allowed',
      },
    },
  },

  variants: {
    resize: {
      none: { resize: 'none' },
      vertical: { resize: 'vertical' },
      both: { resize: 'both' },
    },
  },

  defaultVariants: {
    resize: 'vertical',
  },
})

export const counter = style({
  justifySelf: 'end',
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
  fontVariantNumeric: 'tabular-nums',
})

/** Sınıra yaklaşıldığında sayaç uyarı rengine döner. */
export const counterNearLimit = style({
  color: vars.color.warning[800],
})

export const counterOverLimit = style({
  color: vars.color.danger[800],
  fontWeight: vars.font.weight.medium,
})
