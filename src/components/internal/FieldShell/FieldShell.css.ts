import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

export const root = style({
  display: 'grid',
  gap: vars.space[1],
  width: '100%',
})

export const label = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[1],
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.primary,

  selectors: {
    '&[data-disabled]': {
      color: vars.color.text.disabled,
    },
  },
})

/**
 * Zorunluluk yıldızı `aria-hidden`'dır: ekran okuyucu zorunluluğu control'ün
 * `required` attribute'undan zaten duyurur, yıldız tekrar okunursa gürültü olur.
 */
export const requiredMark = style({
  color: vars.color.danger[700],
})

export const description = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

export const error = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space[1],
  fontSize: vars.font.size.sm,
  color: vars.color.danger[800],
})

export const errorIcon = style({
  flexShrink: 0,
  marginTop: '0.1875rem',
})
