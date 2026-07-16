import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const wrapper = style({
  display: 'inline-flex',
  alignItems: 'flex-start',
  gap: vars.space[3],
  minHeight: vars.control.height.sm,
  paddingBlock: vars.space[2],
  cursor: 'pointer',

  selectors: {
    '&[data-disabled]': { cursor: 'not-allowed' },
  },
})

export const track = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    padding: '2px',
    background: vars.color.neutral[400],
    border: 'none',
    borderRadius: vars.radius.full,
    cursor: 'inherit',
    transitionProperty: 'background-color',
    transitionDuration: vars.duration.fast,
    transitionTimingFunction: vars.ease.standard,

    selectors: {
      '&[data-checked]': { background: vars.color.primary[700] },
      '&[data-disabled]': { background: vars.color.bg.disabled },
      '&[data-disabled][data-checked]': { background: vars.color.neutral[400] },
    },
  },

  variants: {
    size: {
      sm: { width: '2.25rem', height: '1.25rem' },
      md: { width: '2.75rem', height: '1.5rem' },
    },
  },

  defaultVariants: { size: 'md' },
})

export const thumb = recipe({
  base: {
    display: 'block',
    background: vars.color.neutral[0],
    borderRadius: vars.radius.full,
    boxShadow: vars.shadow.sm,
    transitionProperty: 'transform',
    transitionDuration: vars.duration.fast,
    transitionTimingFunction: vars.ease.standard,

    '@media': {
      '(prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    },
  },

  variants: {
    size: {
      sm: {
        width: '1rem',
        height: '1rem',
        selectors: { '&[data-checked]': { transform: 'translateX(1rem)' } },
      },
      md: {
        width: '1.25rem',
        height: '1.25rem',
        selectors: { '&[data-checked]': { transform: 'translateX(1.25rem)' } },
      },
    },
  },

  defaultVariants: { size: 'md' },
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
