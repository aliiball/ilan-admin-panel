import { createVar, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/** Ton renkleri yerel değişkenlere yazılır; varyantlar bunları okur. */
const toneSubtle = createVar()
const toneStrong = createVar()
const toneText = createVar()
const toneBorder = createVar()

export const alert = recipe({
  base: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: vars.space[3],
    padding: vars.space[4],
    border: '1px solid transparent',
    borderRadius: vars.radius.md,
    fontSize: vars.font.size.sm,
    lineHeight: vars.lineHeight.body,
  },

  variants: {
    tone: {
      success: {
        vars: {
          [toneSubtle]: vars.color.success[50],
          [toneStrong]: vars.color.success[700],
          [toneText]: vars.color.success[800],
          [toneBorder]: vars.color.success[600],
        },
      },
      warning: {
        vars: {
          [toneSubtle]: vars.color.warning[50],
          [toneStrong]: vars.color.warning[700],
          [toneText]: vars.color.warning[800],
          [toneBorder]: vars.color.warning[600],
        },
      },
      danger: {
        vars: {
          [toneSubtle]: vars.color.danger[50],
          [toneStrong]: vars.color.danger[700],
          [toneText]: vars.color.danger[800],
          [toneBorder]: vars.color.danger[600],
        },
      },
      info: {
        vars: {
          [toneSubtle]: vars.color.info[50],
          [toneStrong]: vars.color.info[700],
          [toneText]: vars.color.info[800],
          [toneBorder]: vars.color.info[600],
        },
      },
    },

    variant: {
      solid: {
        background: toneStrong,
        color: vars.color.neutral[0],
      },
      soft: {
        background: toneSubtle,
        color: toneText,
        borderColor: toneBorder,
      },
      outline: {
        background: vars.color.bg.surface,
        color: toneText,
        borderColor: toneBorder,
      },
    },
  },

  defaultVariants: {
    tone: 'info',
    variant: 'soft',
  },
})

export const icon = style({
  display: 'inline-flex',
  flexShrink: 0,
  marginTop: '0.125rem',
})

export const content = style({
  display: 'grid',
  gap: vars.space[1],
  flex: 1,
  minWidth: 0,
})

export const title = style({
  fontWeight: vars.font.weight.semibold,
  fontSize: vars.font.size.sm,
})

export const description = style({
  fontSize: vars.font.size.sm,
})

export const actions = style({
  marginTop: vars.space[2],
})

export const dismiss = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  width: '1.5rem',
  height: '1.5rem',
  padding: 0,
  border: 'none',
  borderRadius: vars.radius.sm,
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  flexShrink: 0,

  ':hover': {
    opacity: 0.7,
  },

  /* 44x44px dokunma hedefi, görünür kutuyu büyütmeden. */
  '::after': {
    content: '""',
    position: 'absolute',
    inset: '-0.625rem',
  },
})
