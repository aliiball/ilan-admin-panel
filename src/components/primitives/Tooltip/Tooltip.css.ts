import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

export const positioner = style({
  zIndex: vars.z.tooltip,
})

export const popup = style({
  maxWidth: '18rem',
  paddingInline: vars.space[3],
  paddingBlock: vars.space[2],
  background: vars.color.neutral[900],
  borderRadius: vars.radius.sm,
  color: vars.color.neutral[0],
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.tight,
  boxShadow: vars.shadow.md,
})

export const arrow = style({
  color: vars.color.neutral[900],

  selectors: {
    '&[data-side="top"]': { bottom: '-8px', rotate: '180deg' },
    '&[data-side="bottom"]': { top: '-8px' },
    '&[data-side="left"]': { right: '-13px', rotate: '90deg' },
    '&[data-side="right"]': { left: '-13px', rotate: '-90deg' },
  },
})
