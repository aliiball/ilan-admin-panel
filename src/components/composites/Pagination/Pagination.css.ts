import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: vars.space[4],
    flexWrap: 'wrap',
    paddingBlock: vars.space[3],
  },

  variants: {
    variant: {
      /** Özet solda, sayfalar ortada, boyut seçici sağda. */
      numbered: { justifyContent: 'space-between' },
      compact: { justifyContent: 'center' },
      /** Tek buton ve sayaç: dikey ve ortalı. */
      loadMore: { flexDirection: 'column', justifyContent: 'center', gap: vars.space[3] },
    },
  },

  defaultVariants: { variant: 'numbered' },
})

export const summary = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  fontVariantNumeric: 'tabular-nums',
})

export const pages = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[1],
})

/**
 * Sayfa numarası butonu.
 *
 * `Button` primitive'i kullanılmadı: sayfa numarası kare olmalı ve yatay dolgusu
 * içeriğe göre değil sabit kalmalı — "1" ile "12" yan yana farklı genişlikte
 * durursa satır her sayfa değişiminde kayar. Genişlik `control.height.sm`'e
 * sabitlenir; bu aynı zamanda brifingin 44x44px dokunma hedefini karşılar.
 *
 * Odak halkası global `:focus-visible` kuralından gelir.
 */
export const pageButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: vars.control.height.sm,
  height: vars.control.height.sm,
  paddingInline: vars.space[2],
  border: '1px solid transparent',
  borderRadius: vars.radius.md,
  background: 'transparent',
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  fontVariantNumeric: 'tabular-nums',
  cursor: 'pointer',
  transitionProperty: 'background-color, border-color, color',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.ease.standard,

  selectors: {
    '&:hover:not(:disabled)': {
      background: vars.color.action.ghost.hover,
      color: vars.color.text.primary,
    },

    /**
     * Geçerli sayfa yalnız renkle değil, dolu zemin ve kalın yazıyla da belli
     * olur: tek başına renk gösterge değildir.
     */
    '&[aria-current="page"]': {
      background: vars.color.action.primary.bg,
      borderColor: vars.color.action.primary.bg,
      color: vars.color.action.primary.text,
      fontWeight: vars.font.weight.semibold,
    },

    '&:disabled': {
      color: vars.color.text.disabled,
      cursor: 'not-allowed',
    },
  },
})

export const ellipsis = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: vars.space[6],
  color: vars.color.text.disabled,
  userSelect: 'none',
})

export const compactLabel = style({
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  paddingInline: vars.space[2],
})

/**
 * Boyut seçicinin genişliği sabit: `Select` kabına yayılır ve sabitlenmezse
 * sayfalama satırının kalanını yer.
 */
export const pageSize = style({
  width: '8rem',
  flexShrink: 0,
})
