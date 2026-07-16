import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

const spin = keyframes({
  to: { transform: 'rotate(360deg)' },
})

export const spinner = recipe({
  base: {
    display: 'inline-block',
    flexShrink: 0,
    borderStyle: 'solid',
    borderColor: 'currentColor',
    borderTopColor: 'transparent',
    borderRadius: vars.radius.full,
    animation: `${spin} 600ms linear infinite`,

    '@media': {
      /**
       * Hareket azaltma açıkken dönme durur ama gösterge kaybolmaz: tam halka
       * soluk bırakılır, böylece "bir şey yükleniyor" bilgisi korunur.
       */
      '(prefers-reduced-motion: reduce)': {
        animation: 'none',
        borderTopColor: 'currentColor',
        opacity: 0.4,
      },
    },
  },

  variants: {
    size: {
      sm: { width: '1rem', height: '1rem', borderWidth: '2px' },
      md: { width: '1.5rem', height: '1.5rem', borderWidth: '2px' },
      lg: { width: '2rem', height: '2rem', borderWidth: '3px' },
    },
  },

  defaultVariants: {
    size: 'md',
  },
})

/** Görsel olarak gizli ama ekran okuyucuya açık. */
export const visuallyHidden = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
})
