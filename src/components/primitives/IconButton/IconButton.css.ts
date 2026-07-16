import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

const spin = keyframes({
  to: { transform: 'rotate(360deg)' },
})

export const iconButton = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
    padding: 0,
    border: '1px solid transparent',
    borderRadius: vars.radius.md,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, color, box-shadow',
    transitionDuration: vars.duration.fast,
    transitionTimingFunction: vars.ease.standard,

    selectors: {
      '&[data-disabled]': {
        color: vars.color.text.disabled,
        background: vars.color.bg.disabled,
        borderColor: vars.color.border.subtle,
        cursor: 'not-allowed',
      },
    },
  },

  variants: {
    variant: {
      primary: {
        color: vars.color.action.primary.text,
        background: vars.color.action.primary.bg,
        selectors: {
          '&:hover:not([data-disabled])': { background: vars.color.action.primary.hover },
          '&:active:not([data-disabled])': { background: vars.color.action.primary.active },
        },
      },

      secondary: {
        color: vars.color.action.secondary.text,
        background: vars.color.action.secondary.bg,
        borderColor: vars.color.action.secondary.border,
        selectors: {
          '&:hover:not([data-disabled])': { background: vars.color.action.secondary.hover },
          '&:active:not([data-disabled])': { background: vars.color.action.secondary.active },
        },
      },

      ghost: {
        color: vars.color.action.ghost.text,
        background: 'transparent',
        selectors: {
          '&:hover:not([data-disabled])': { background: vars.color.action.ghost.hover },
          '&:active:not([data-disabled])': { background: vars.color.action.ghost.active },
        },
      },

      danger: {
        color: vars.color.action.danger.text,
        background: vars.color.action.danger.bg,
        selectors: {
          '&:hover:not([data-disabled])': { background: vars.color.action.danger.hover },
          '&:active:not([data-disabled])': { background: vars.color.action.danger.active },
        },
      },
    },

    /**
     * Kare kutu: genişlik yüksekliğe eşit. En küçük boyut bile brifingin
     * 44x44px dokunma hedefi kuralını karşılar.
     */
    size: {
      sm: { width: vars.control.height.sm, height: vars.control.height.sm },
      md: { width: vars.control.height.md, height: vars.control.height.md },
      lg: { width: vars.control.height.lg, height: vars.control.height.lg },
    },

    loading: {
      true: {},
    },
  },

  defaultVariants: {
    variant: 'ghost',
    size: 'md',
  },
})

export const icon = style({
  display: 'inline-flex',
})

export const iconHidden = style({
  visibility: 'hidden',
})

export const spinner = style({
  position: 'absolute',
  width: '1.125rem',
  height: '1.125rem',
  borderRadius: vars.radius.full,
  border: '2px solid currentColor',
  borderTopColor: 'transparent',
  animation: `${spin} 600ms linear infinite`,

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
      borderTopColor: 'currentColor',
      opacity: 0.5,
    },
  },
})
