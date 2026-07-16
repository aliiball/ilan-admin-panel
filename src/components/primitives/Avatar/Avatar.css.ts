import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const wrapper = style({
  display: 'inline-flex',
  position: 'relative',
  flexShrink: 0,
})

export const avatar = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: vars.color.neutral[200],
    borderRadius: vars.radius.full,
    color: vars.color.text.secondary,
    fontWeight: vars.font.weight.semibold,
    userSelect: 'none',
    verticalAlign: 'middle',
  },

  variants: {
    size: {
      sm: { width: '1.75rem', height: '1.75rem', fontSize: vars.font.size.sm },
      md: { width: '2.25rem', height: '2.25rem', fontSize: vars.font.size.sm },
      lg: { width: '3rem', height: '3rem', fontSize: vars.font.size.lg },
      xl: { width: '4rem', height: '4rem', fontSize: vars.font.size.xl },
    },
  },

  defaultVariants: { size: 'md' },
})

export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
})

/**
 * Durum noktası. Renk tek başına gösterge olmadığı için `title` ile de
 * açıklanır ve ekran okuyucuya metin olarak verilir.
 */
export const status = recipe({
  base: {
    position: 'absolute',
    insetBlockEnd: 0,
    insetInlineEnd: 0,
    borderRadius: vars.radius.full,
    border: `2px solid ${vars.color.bg.surface}`,
  },

  variants: {
    tone: {
      online: { background: vars.color.success[600] },
      offline: { background: vars.color.neutral[400] },
      busy: { background: vars.color.danger[600] },
    },
    size: {
      sm: { width: '0.5rem', height: '0.5rem' },
      md: { width: '0.625rem', height: '0.625rem' },
      lg: { width: '0.75rem', height: '0.75rem' },
      xl: { width: '0.875rem', height: '0.875rem' },
    },
  },

  defaultVariants: { tone: 'offline', size: 'md' },
})
