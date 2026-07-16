import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
const slideFromRight = keyframes({
  from: { transform: 'translateX(100%)' },
  to: { transform: 'translateX(0)' },
})
const slideFromLeft = keyframes({
  from: { transform: 'translateX(-100%)' },
  to: { transform: 'translateX(0)' },
})
const slideFromBottom = keyframes({
  from: { transform: 'translateY(100%)' },
  to: { transform: 'translateY(0)' },
})

export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: vars.z.drawer,
  background: vars.color.bg.overlay,
  animation: `${fadeIn} ${vars.duration.fast} ${vars.ease.standard}`,

  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
})

export const popup = recipe({
  base: {
    position: 'fixed',
    zIndex: vars.z.drawer,
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
    background: vars.color.bg.elevated,
    boxShadow: vars.shadow.xl,
    outline: 'none',

    '@media': {
      '(prefers-reduced-motion: reduce)': { animation: 'none' },
    },
  },

  variants: {
    side: {
      right: {
        insetBlock: 0,
        insetInlineEnd: 0,
        height: '100dvh',
        animation: `${slideFromRight} ${vars.duration.normal} ${vars.ease.standard}`,
      },
      left: {
        insetBlock: 0,
        insetInlineStart: 0,
        height: '100dvh',
        animation: `${slideFromLeft} ${vars.duration.normal} ${vars.ease.standard}`,
      },
      /** Alttan açılan panel mobil filtrelerin varsayılanıdır. */
      bottom: {
        insetInline: 0,
        insetBlockEnd: 0,
        width: '100vw',
        borderStartStartRadius: vars.radius.lg,
        borderStartEndRadius: vars.radius.lg,
        animation: `${slideFromBottom} ${vars.duration.normal} ${vars.ease.standard}`,
      },
    },

    size: {
      sm: {},
      md: {},
      lg: {},
    },
  },

  compoundVariants: [
    { variants: { side: 'right', size: 'sm' }, style: { width: 'min(20rem, 100vw)' } },
    { variants: { side: 'right', size: 'md' }, style: { width: 'min(28rem, 100vw)' } },
    { variants: { side: 'right', size: 'lg' }, style: { width: 'min(40rem, 100vw)' } },
    { variants: { side: 'left', size: 'sm' }, style: { width: 'min(20rem, 100vw)' } },
    { variants: { side: 'left', size: 'md' }, style: { width: 'min(28rem, 100vw)' } },
    { variants: { side: 'left', size: 'lg' }, style: { width: 'min(40rem, 100vw)' } },
    { variants: { side: 'bottom', size: 'sm' }, style: { maxHeight: '40dvh' } },
    { variants: { side: 'bottom', size: 'md' }, style: { maxHeight: '60dvh' } },
    { variants: { side: 'bottom', size: 'lg' }, style: { maxHeight: '85dvh' } },
  ],

  defaultVariants: { side: 'right', size: 'md' },
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[3],
  padding: vars.space[5],
  borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
})

export const title = style({
  flex: 1,
  minWidth: 0,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const body = style({
  padding: vars.space[5],
  overflowY: 'auto',
  fontSize: vars.font.size.sm,
})

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space[3],
  padding: vars.space[5],
  borderBlockStart: `1px solid ${vars.color.border.subtle}`,
  /** Alttan açılan panelde iOS ana çubuğunun altında kalmasın. */
  paddingBlockEnd: `max(${vars.space[5]}, env(safe-area-inset-bottom))`,
})
