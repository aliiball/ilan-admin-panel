import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/** Base UI açılır yüksekliği CSS değişkeni olarak verir; animasyon ona dayanır. */
const slideDown = keyframes({
  from: { height: 0 },
  to: { height: 'var(--accordion-panel-height)' },
})

const slideUp = keyframes({
  from: { height: 'var(--accordion-panel-height)' },
  to: { height: 0 },
})

export const root = recipe({
  base: { display: 'grid', width: '100%' },
  variants: {
    variant: {
      separated: { gap: vars.space[2] },
      bordered: {
        gap: 0,
        border: `1px solid ${vars.color.border.subtle}`,
        borderRadius: vars.radius.md,
        overflow: 'hidden',
      },
      plain: { gap: 0 },
    },
  },
  defaultVariants: { variant: 'separated' },
})

export const item = recipe({
  base: {},
  variants: {
    variant: {
      separated: {
        border: `1px solid ${vars.color.border.subtle}`,
        borderRadius: vars.radius.md,
        background: vars.color.bg.surface,
        overflow: 'hidden',
      },
      bordered: {
        selectors: {
          '&:not(:last-child)': { borderBlockEnd: `1px solid ${vars.color.border.subtle}` },
        },
      },
      plain: {
        selectors: {
          '&:not(:last-child)': { borderBlockEnd: `1px solid ${vars.color.border.subtle}` },
        },
      },
    },
  },
  defaultVariants: { variant: 'separated' },
})

export const trigger = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[3],
  width: '100%',
  minHeight: vars.control.height.md,
  padding: vars.space[4],
  border: 'none',
  background: 'transparent',
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  textAlign: 'start',
  cursor: 'pointer',

  ':hover': { background: vars.color.bg.subtle },

  selectors: {
    '&[data-disabled]': { color: vars.color.text.disabled, cursor: 'not-allowed' },
  },
})

export const triggerText = style({
  display: 'grid',
  gap: '0.125rem',
  flex: 1,
  minWidth: 0,
})

export const triggerDescription = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.regular,
  color: vars.color.text.muted,
})

/** Ok, açık durumda döner — durum yalnız renkle anlatılmaz. */
export const icon = style({
  display: 'inline-flex',
  flexShrink: 0,
  color: vars.color.text.muted,
  transitionProperty: 'transform',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.ease.standard,

  selectors: {
    '[data-panel-open] &': { transform: 'rotate(180deg)' },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
  },
})

export const panel = style({
  overflow: 'hidden',

  selectors: {
    '&[data-open]': { animation: `${slideDown} ${vars.duration.normal} ${vars.ease.standard}` },
    '&[data-closed]': { animation: `${slideUp} ${vars.duration.normal} ${vars.ease.standard}` },
  },

  '@media': {
    '(prefers-reduced-motion: reduce)': {
      selectors: {
        '&[data-open], &[data-closed]': { animation: 'none' },
      },
    },
  },
})

export const panelContent = style({
  padding: vars.space[4],
  paddingBlockStart: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})
