import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const group = recipe({
  base: {
    display: 'flex',
    alignItems: 'stretch',
    width: '100%',
    background: vars.color.bg.surface,
    border: '1px solid',
    borderColor: vars.color.border.default,
    borderRadius: vars.radius.md,
    overflow: 'hidden',
    transitionProperty: 'border-color',
    transitionDuration: vars.duration.fast,

    selectors: {
      '&:focus-within': { borderColor: vars.color.focus.ring },
      '&[data-invalid]': { borderColor: vars.color.danger[600] },
      '&[data-disabled]': {
        background: vars.color.bg.disabled,
        borderColor: vars.color.border.subtle,
      },
    },
  },

  variants: {
    size: {
      sm: { minHeight: vars.control.height.sm },
      md: { minHeight: vars.control.height.md },
      lg: { minHeight: vars.control.height.lg },
    },
  },

  defaultVariants: { size: 'md' },
})

export const input = style({
  flex: 1,
  minWidth: 0,
  paddingInline: vars.space[3],
  border: 'none',
  background: 'transparent',
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  /** Tutarlar alt alta hizalansın diye tablo rakamları ve sağa yaslama. */
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',

  ':focus': { outline: 'none' },

  selectors: {
    '&:disabled': { color: vars.color.text.disabled, cursor: 'not-allowed' },
  },
})

/** Para birimi seçici: kutunun sağ ucunda, ayırıcı çizgiyle. */
export const currencyTrigger = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[1],
  paddingInline: vars.space[3],
  border: 'none',
  borderInlineStart: `1px solid ${vars.color.border.subtle}`,
  background: 'transparent',
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  cursor: 'pointer',
  whiteSpace: 'nowrap',

  ':hover': { background: vars.color.bg.subtle },

  selectors: {
    '&[data-disabled]': { color: vars.color.text.disabled, cursor: 'not-allowed' },
  },
})

/** Tek para birimi varsa seçici yerine sabit etiket. */
export const currencyStatic = style({
  display: 'flex',
  alignItems: 'center',
  paddingInline: vars.space[3],
  borderInlineStart: `1px solid ${vars.color.border.subtle}`,
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  whiteSpace: 'nowrap',
})
