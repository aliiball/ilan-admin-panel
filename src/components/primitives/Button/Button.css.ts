import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

const spin = keyframes({
  to: { transform: 'rotate(360deg)' },
})

export const button = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vars.space[2],
    position: 'relative',
    border: '1px solid transparent',
    borderRadius: vars.radius.md,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.semibold,
    lineHeight: vars.lineHeight.tight,
    whiteSpace: 'nowrap',
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

      /** Geri alınamayan işlemler: ilan silme, kalıcı reddetme, hesap banlama. */
      danger: {
        color: vars.color.action.danger.text,
        background: vars.color.action.danger.bg,
        selectors: {
          '&:hover:not([data-disabled])': { background: vars.color.action.danger.hover },
          '&:active:not([data-disabled])': { background: vars.color.action.danger.active },
        },
      },
    },

    /** Yükseklikler brifingin 44x44px dokunma hedefi kuralından gelir. */
    size: {
      sm: {
        minHeight: vars.control.height.sm,
        paddingInline: vars.control.inlinePadding.sm,
      },
      md: {
        minHeight: vars.control.height.md,
        paddingInline: vars.control.inlinePadding.md,
      },
      lg: {
        minHeight: vars.control.height.lg,
        paddingInline: vars.control.inlinePadding.lg,
        fontSize: vars.font.size.md,
      },
    },

    fullWidth: {
      true: { width: '100%' },
    },

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
  gap: vars.space[2],
})

/**
 * Yükleniyor durumunda etiket gizlenir ama yerini korur; böylece buton genişliği
 * değişmez ve çevresindeki düzen zıplamaz.
 *
 * Gizleme `opacity` ile yapılır, `visibility: hidden` ile değil: erişilebilir ad
 * hesabı `visibility: hidden` alt ağacını yok sayar ve yüklenen butonun **adı
 * tamamen kaybolurdu** — ekran okuyucu kullanıcısı "düğme, meşgul" duyar, hangi
 * düğme olduğunu duymazdı. `opacity: 0` görsel olarak aynı sonucu verir, yeri
 * yine korur, ama metin erişilebilirlik ağacında kalır.
 *
 * (IconButton'da bu sorun yok: adı `aria-label`'dan gelir, metninden değil.)
 */
export const labelHidden = style({
  opacity: 0,
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
      animation: 'none',
      borderTopColor: 'currentColor',
      opacity: 0.5,
    },
  },
})

export const icon = style({
  display: 'inline-flex',
  flexShrink: 0,
})
