import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/**
 * Select, MultiSelect ve aranabilir Select'in paylaştığı açılır liste stilleri.
 * Katalog component'i değil — üçünde de aynı görünmesi için ayrıldı.
 */

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
    lineHeight: vars.lineHeight.tight,
    textAlign: 'start',
    cursor: 'pointer',
    transitionProperty: 'border-color',
    transitionDuration: vars.duration.fast,

    selectors: {
      '&:focus-visible, &:focus-within': { borderColor: vars.color.focus.ring },
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

export const value = style({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

/** Seçim yokken placeholder soluk gösterilir; etiket yerine geçmez. */
export const placeholder = style({
  color: vars.color.text.muted,
})

export const icon = style({
  display: 'inline-flex',
  flexShrink: 0,
  color: vars.color.text.muted,
})

export const positioner = style({
  zIndex: vars.z.dropdown,
  outline: 'none',
})

export const popup = style({
  maxHeight: 'min(20rem, var(--available-height))',
  minWidth: 'var(--anchor-width)',
  overflowY: 'auto',
  padding: vars.space[1],
  background: vars.color.bg.elevated,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.lg,
  outline: 'none',
})

export const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  minHeight: vars.control.height.sm,
  paddingInline: vars.space[3],
  paddingBlock: vars.space[2],
  borderRadius: vars.radius.sm,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  cursor: 'pointer',
  userSelect: 'none',
  outline: 'none',

  selectors: {
    '&[data-highlighted]': { background: vars.color.bg.subtle },
    '&[data-selected]': { fontWeight: vars.font.weight.medium },
    '&[data-disabled]': { color: vars.color.text.disabled, cursor: 'not-allowed' },
  },
})

export const itemText = style({
  display: 'grid',
  gap: '0.125rem',
  flex: 1,
  minWidth: 0,
})

export const itemDescription = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

export const itemIndicator = style({
  display: 'inline-flex',
  flexShrink: 0,
  color: vars.color.primary[700],
})

export const empty = style({
  padding: vars.space[3],
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
  textAlign: 'center',
})

export const searchBox = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  width: '100%',
  paddingInline: vars.space[3],
  color: vars.color.text.muted,
})

export const searchInput = style({
  flex: 1,
  minWidth: 0,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  ':focus': { outline: 'none' },
  '::placeholder': { color: vars.color.text.muted },
})

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[1],
  flex: 1,
  minWidth: 0,
})

export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[1],
  paddingInline: vars.space[2],
  paddingBlock: '0.125rem',
  background: vars.color.primary[50],
  border: `1px solid ${vars.color.primary[200]}`,
  borderRadius: vars.radius.sm,
  color: vars.color.primary[800],
  fontSize: vars.font.size.sm,
})

export const chipRemove = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  ':hover': { opacity: 0.7 },
})

export const overflowCount = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  whiteSpace: 'nowrap',
})
