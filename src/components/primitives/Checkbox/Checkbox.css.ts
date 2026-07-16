import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Dış sarmalayıcı etiketle birlikte 44px dokunma hedefini sağlar; kutunun
 * kendisi görsel olarak küçük kalır.
 */
export const wrapper = style({
  display: 'inline-flex',
  alignItems: 'flex-start',
  gap: vars.space[3],
  minHeight: vars.control.height.sm,
  paddingBlock: vars.space[2],
  cursor: 'pointer',

  selectors: {
    '&[data-disabled]': {
      cursor: 'not-allowed',
    },
  },
})

export const box = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '1.25rem',
  height: '1.25rem',
  marginTop: '0.125rem',
  padding: 0,
  background: vars.color.bg.surface,
  border: '1px solid',
  borderColor: vars.color.border.strong,
  borderRadius: vars.radius.sm,
  color: vars.color.neutral[0],
  transitionProperty: 'background-color, border-color',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.ease.standard,

  selectors: {
    '&[data-checked], &[data-indeterminate]': {
      background: vars.color.primary[700],
      borderColor: vars.color.primary[700],
    },
    '&[data-disabled]': {
      background: vars.color.bg.disabled,
      borderColor: vars.color.border.subtle,
      color: vars.color.text.disabled,
    },
    '&[data-disabled][data-checked], &[data-disabled][data-indeterminate]': {
      background: vars.color.neutral[400],
      borderColor: vars.color.neutral[400],
      color: vars.color.neutral[0],
    },
  },
})

export const indicator = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

export const text = style({
  display: 'grid',
  gap: vars.space[1],
  minWidth: 0,
})

export const label = style({
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.tight,
  color: vars.color.text.primary,

  selectors: {
    '[data-disabled] &': {
      color: vars.color.text.disabled,
    },
  },
})

export const description = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,

  selectors: {
    '[data-disabled] &': {
      color: vars.color.text.disabled,
    },
  },
})
