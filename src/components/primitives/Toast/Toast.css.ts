import { createVar, keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

const slideIn = keyframes({
  from: { opacity: 0, transform: 'translateY(0.75rem)' },
  to: { opacity: 1, transform: 'translateY(0)' },
})

const toneStrong = createVar()
const toneSubtle = createVar()
const toneText = createVar()

export const viewport = style({
  position: 'fixed',
  insetBlockEnd: 0,
  insetInlineEnd: 0,
  zIndex: vars.z.toast,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space[2],
  padding: vars.space[4],
  /** Mobilde tam genişlik ve güvenli alan; masaüstünde sağ altta sabit. */
  paddingBlockEnd: `max(${vars.space[4]}, env(safe-area-inset-bottom))`,
  width: 'min(24rem, 100vw)',
  pointerEvents: 'none',
})

export const toast = recipe({
  base: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: vars.space[3],
    padding: vars.space[4],
    background: vars.color.bg.elevated,
    border: '1px solid',
    borderColor: toneStrong,
    borderInlineStartWidth: '3px',
    borderRadius: vars.radius.md,
    boxShadow: vars.shadow.lg,
    pointerEvents: 'auto',
    animation: `${slideIn} ${vars.duration.normal} ${vars.ease.standard}`,

    '@media': {
      '(prefers-reduced-motion: reduce)': { animation: 'none' },
    },
  },

  variants: {
    tone: {
      success: {
        vars: {
          [toneStrong]: vars.color.success[600],
          [toneSubtle]: vars.color.success[50],
          [toneText]: vars.color.success[800],
        },
      },
      warning: {
        vars: {
          [toneStrong]: vars.color.warning[600],
          [toneSubtle]: vars.color.warning[50],
          [toneText]: vars.color.warning[800],
        },
      },
      danger: {
        vars: {
          [toneStrong]: vars.color.danger[600],
          [toneSubtle]: vars.color.danger[50],
          [toneText]: vars.color.danger[800],
        },
      },
      info: {
        vars: {
          [toneStrong]: vars.color.info[600],
          [toneSubtle]: vars.color.info[50],
          [toneText]: vars.color.info[800],
        },
      },
    },
  },

  defaultVariants: { tone: 'info' },
})

export const icon = style({
  display: 'inline-flex',
  flexShrink: 0,
  marginTop: '0.125rem',
  color: toneStrong,
})

export const content = style({
  display: 'grid',
  gap: vars.space[1],
  flex: 1,
  minWidth: 0,
})

export const title = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const description = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const action = style({
  justifySelf: 'start',
  marginTop: vars.space[1],
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: toneText,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  cursor: 'pointer',
})

export const close = style({
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
  color: vars.color.text.muted,
  cursor: 'pointer',
  flexShrink: 0,

  ':hover': { color: vars.color.text.primary },

  /* 44x44px dokunma hedefi, görünür kutuyu büyütmeden. */
  '::after': { content: '""', position: 'absolute', inset: '-0.625rem' },
})
