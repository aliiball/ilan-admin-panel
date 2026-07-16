import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const divider = recipe({
  base: {
    background: vars.color.border.subtle,
    border: 'none',
    flexShrink: 0,
  },

  variants: {
    orientation: {
      horizontal: { width: '100%', height: '1px' },
      /** Dikey ayırıcı kabından yükseklik alır; `align-self: stretch` gerektirir. */
      vertical: { width: '1px', alignSelf: 'stretch', minHeight: '1em' },
    },
  },

  defaultVariants: {
    orientation: 'horizontal',
  },
})

/** Etiketli ayırıcı: çizgi — metin — çizgi. */
export const labelled = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[3],
  width: '100%',
})

export const line = style({
  flex: 1,
  height: '1px',
  background: vars.color.border.subtle,
})

export const labelText = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  whiteSpace: 'nowrap',
})
