import { createVar, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/** Durumun rengi önce yerel değişkenlere yazılır, varyantlar bunları okur. */
const durumBg = createVar()
const durumText = createVar()
const durumBorder = createVar()

export const statusBadge = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: vars.space[2],
    border: '1px solid transparent',
    borderRadius: vars.radius.full,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.medium,
    lineHeight: vars.lineHeight.tight,
    whiteSpace: 'nowrap',
  },

  variants: {
    status: {
      draft: {
        vars: {
          [durumBg]: vars.color.status.draft.bg,
          [durumText]: vars.color.status.draft.text,
          [durumBorder]: vars.color.status.draft.border,
        },
      },
      pendingReview: {
        vars: {
          [durumBg]: vars.color.status.pending.bg,
          [durumText]: vars.color.status.pending.text,
          [durumBorder]: vars.color.status.pending.border,
        },
      },
      changesRequested: {
        vars: {
          [durumBg]: vars.color.status.changes.bg,
          [durumText]: vars.color.status.changes.text,
          [durumBorder]: vars.color.status.changes.border,
        },
      },
      published: {
        vars: {
          [durumBg]: vars.color.status.published.bg,
          [durumText]: vars.color.status.published.text,
          [durumBorder]: vars.color.status.published.border,
        },
      },
      rejected: {
        vars: {
          [durumBg]: vars.color.status.rejected.bg,
          [durumText]: vars.color.status.rejected.text,
          [durumBorder]: vars.color.status.rejected.border,
        },
      },
      paused: {
        vars: {
          [durumBg]: vars.color.status.paused.bg,
          [durumText]: vars.color.status.paused.text,
          [durumBorder]: vars.color.status.paused.border,
        },
      },
      expired: {
        vars: {
          [durumBg]: vars.color.status.expired.bg,
          [durumText]: vars.color.status.expired.text,
          [durumBorder]: vars.color.status.expired.border,
        },
      },
      archived: {
        vars: {
          [durumBg]: vars.color.status.archived.bg,
          [durumText]: vars.color.status.archived.text,
          [durumBorder]: vars.color.status.archived.border,
        },
      },
    },

    variant: {
      solid: { background: durumBorder, color: vars.color.neutral[0] },
      soft: { background: durumBg, color: durumText },
      outline: { background: 'transparent', color: durumText, borderColor: durumBorder },
    },

    size: {
      sm: { paddingInline: vars.space[2], paddingBlock: '0.0625rem' },
      md: { paddingInline: vars.space[3], paddingBlock: vars.space[1] },
    },
  },

  defaultVariants: { variant: 'soft', size: 'md' },
})

/**
 * Durum noktası. Brifingin "status yalnız renkle ifade edilmemelidir" kuralı
 * zaten metinle karşılanıyor; nokta yoğun tablolarda taramayı hızlandıran
 * ek bir işaret.
 */
export const dot = style({
  width: '0.5rem',
  height: '0.5rem',
  flexShrink: 0,
  borderRadius: vars.radius.full,
  background: durumBorder,

  selectors: {
    '[data-variant="solid"] &': { background: vars.color.neutral[0] },
  },
})
