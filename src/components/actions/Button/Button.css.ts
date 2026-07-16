import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/styles/theme.css'

const spin = keyframes({
  to: { transform: 'rotate(360deg)' },
})

export const button = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vars.space.sm,
    position: 'relative',
    border: '1px solid transparent',
    borderRadius: vars.radius.md,
    fontWeight: vars.font.weight.medium,
    lineHeight: vars.font.lineHeight.tight,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, color, box-shadow',
    transitionDuration: vars.duration.fast,

    selectors: {
      '&[data-disabled]': {
        cursor: 'not-allowed',
        opacity: 0.55,
      },
    },
  },

  variants: {
    variant: {
      primary: {
        backgroundColor: vars.color.brand.default,
        color: vars.color.text.onBrand,
        selectors: {
          '&:hover:not([data-disabled])': { backgroundColor: vars.color.brand.hover },
          '&:active:not([data-disabled])': { backgroundColor: vars.color.brand.active },
        },
      },

      secondary: {
        backgroundColor: vars.color.surface.base,
        borderColor: vars.color.border.default,
        color: vars.color.text.primary,
        selectors: {
          '&:hover:not([data-disabled])': { backgroundColor: vars.color.surface.muted },
          '&:active:not([data-disabled])': { backgroundColor: vars.color.surface.inset },
        },
      },

      ghost: {
        backgroundColor: 'transparent',
        color: vars.color.text.secondary,
        selectors: {
          '&:hover:not([data-disabled])': {
            backgroundColor: vars.color.surface.muted,
            color: vars.color.text.primary,
          },
        },
      },

      /* Geri alınamayan işlemler: ilan silme, hesap kapatma, toplu reddetme. */
      danger: {
        backgroundColor: vars.color.danger.default,
        color: vars.color.text.onDanger,
        selectors: {
          '&:hover:not([data-disabled])': { backgroundColor: vars.color.danger.hover },
          '&:active:not([data-disabled])': { backgroundColor: vars.color.danger.active },
        },
      },
    },

    size: {
      sm: {
        height: vars.size.control.sm,
        paddingInline: vars.space.md,
        fontSize: vars.font.size.sm,
      },
      md: {
        height: vars.size.control.md,
        paddingInline: vars.space.lg,
        fontSize: vars.font.size.md,
      },
      lg: {
        height: vars.size.control.lg,
        paddingInline: vars.space.xl,
        fontSize: vars.font.size.lg,
      },
    },

    fullWidth: {
      true: { width: '100%' },
    },

    /* Yükleniyor durumunda etiket gizlenir ama genişliği korunur;
       böylece buton boyutu değişmez ve layout zıplamaz. */
    loading: {
      true: {},
    },
  },

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

export const label = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const labelHidden = style({
  visibility: 'hidden',
})

export const spinner = style({
  position: 'absolute',
  width: '1em',
  height: '1em',
  borderRadius: vars.radius.full,
  border: '2px solid currentColor',
  borderTopColor: 'transparent',
  animation: `${spin} 600ms linear infinite`,

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animationDuration: '2s',
    },
  },
})
