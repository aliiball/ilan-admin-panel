import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

const pulse = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.55 },
})

export const skeleton = recipe({
  base: {
    display: 'block',
    background: vars.color.bg.subtle,
    animation: `${pulse} 1.6s ${vars.ease.standard} infinite`,

    '@media': {
      '(prefers-reduced-motion: reduce)': {
        animation: 'none',
      },
    },
  },

  variants: {
    variant: {
      /**
       * Yükseklik satır yüksekliğiyle hizalanır; gerçek metin geldiğinde
       * kutunun boyu değişmez ve düzen zıplamaz.
       */
      text: {
        height: '1em',
        borderRadius: vars.radius.sm,
      },
      circle: {
        borderRadius: vars.radius.full,
        aspectRatio: '1',
      },
      rectangle: {
        borderRadius: vars.radius.md,
      },
    },
  },

  defaultVariants: {
    variant: 'text',
  },
})

export const lines = style({
  display: 'grid',
  gap: vars.space[2],
})

/** Son satır kısa bırakılır; gerçek paragraflar da öyle biter. */
export const lastLine = style({
  width: '60%',
})
