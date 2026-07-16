import { globalStyle, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const trigger = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: vars.space[2],
    width: '100%',
    background: vars.color.bg.surface,
    border: '1px solid',
    borderColor: vars.color.border.default,
    borderRadius: vars.radius.md,
    color: vars.color.text.primary,
    fontSize: vars.font.size.sm,
    textAlign: 'start',
    cursor: 'pointer',
    transitionProperty: 'border-color',
    transitionDuration: vars.duration.fast,

    selectors: {
      '&:focus-visible': { borderColor: vars.color.focus.ring },
      '&[data-invalid]': { borderColor: vars.color.danger[600] },
      '&[data-disabled]': {
        background: vars.color.bg.disabled,
        borderColor: vars.color.border.subtle,
        color: vars.color.text.disabled,
        cursor: 'not-allowed',
      },
    },
  },

  variants: {
    size: {
      sm: { minHeight: vars.control.height.sm, paddingInline: vars.control.inlinePadding.sm },
      md: { minHeight: vars.control.height.md, paddingInline: vars.control.inlinePadding.md },
      lg: { minHeight: vars.control.height.lg, paddingInline: vars.control.inlinePadding.lg },
    },
  },

  defaultVariants: { size: 'md' },
})

export const triggerValue = style({ flex: 1, minWidth: 0 })
export const triggerPlaceholder = style({ color: vars.color.text.muted })
export const icon = style({ display: 'inline-flex', flexShrink: 0, color: vars.color.text.muted })

export const positioner = style({ zIndex: vars.z.dropdown })

export const popup = style({
  display: 'flex',
  background: vars.color.bg.elevated,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.lg,
  outline: 'none',

  '@media': {
    /** Dar ekranda hazır aralıklar takvimin üstüne geçer, yan yana sığmaz. */
    'screen and (max-width: 34rem)': { flexDirection: 'column' },
  },
})

export const presets = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space[1],
  padding: vars.space[2],
  borderInlineEnd: `1px solid ${vars.color.border.subtle}`,
  minWidth: '9rem',

  '@media': {
    'screen and (max-width: 34rem)': {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderInlineEnd: 'none',
      borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
      minWidth: 0,
    },
  },
})

export const preset = style({
  padding: `${vars.space[2]} ${vars.space[3]}`,
  border: 'none',
  borderRadius: vars.radius.sm,
  background: 'transparent',
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  textAlign: 'start',
  whiteSpace: 'nowrap',
  cursor: 'pointer',

  ':hover': { background: vars.color.bg.subtle, color: vars.color.text.primary },
})

export const calendar = style({ padding: vars.space[3] })

/**
 * react-day-picker kendi sınıflarını kullanır; token'lara bağlamak için
 * globalStyle gerekiyor. Bu, kütüphane sınıflarını hedeflemenin tek yolu —
 * component CSS'inde ham renk yok, hepsi token.
 */
globalStyle(`${calendar} .rdp-root`, {
  vars: {
    '--rdp-accent-color': vars.color.primary[700],
    '--rdp-accent-background-color': vars.color.primary[50],
    '--rdp-day-height': '2.25rem',
    '--rdp-day-width': '2.25rem',
    '--rdp-day_button-height': '2.25rem',
    '--rdp-day_button-width': '2.25rem',
    '--rdp-day_button-border-radius': vars.radius.sm,
    '--rdp-selected-border': 'none',
    '--rdp-outside-opacity': '0.4',
    '--rdp-disabled-opacity': '0.35',
  },
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})

globalStyle(`${calendar} .rdp-month_caption`, {
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
})

globalStyle(`${calendar} .rdp-weekday`, {
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
})

globalStyle(`${calendar} .rdp-today:not(.rdp-selected)`, {
  color: vars.color.primary[700],
  fontWeight: vars.font.weight.bold,
})

globalStyle(`${calendar} .rdp-button_next, ${calendar} .rdp-button_previous`, {
  color: vars.color.text.secondary,
  borderRadius: vars.radius.sm,
})

globalStyle(`${calendar} .rdp-button_next:hover, ${calendar} .rdp-button_previous:hover`, {
  background: vars.color.bg.subtle,
})
