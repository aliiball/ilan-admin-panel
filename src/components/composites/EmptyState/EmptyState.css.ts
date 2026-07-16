import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = recipe({
  base: {
    display: 'grid',
    justifyItems: 'center',
    gap: vars.space[2],
    borderRadius: vars.radius.lg,
    textAlign: 'center',
  },

  variants: {
    variant: {
      default: {
        padding: `${vars.space[12]} ${vars.space[6]}`,
        background: vars.color.bg.surface,
      },
      compact: {
        padding: `${vars.space[6]} ${vars.space[4]}`,
      },
      /**
       * Kesik kenarlık bilinçli: veri *yok* değil, *bu filtreye uyan* yok.
       * Geçici bir eleme olduğunu, kalıcı bir boşluk olmadığını görsel olarak söyler.
       */
      filtered: {
        padding: `${vars.space[10]} ${vars.space[6]}`,
        background: vars.color.bg.subtle,
        border: `1px dashed ${vars.color.border.default}`,
      },
    },
  },

  defaultVariants: { variant: 'default' },
})

export const illustration = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: vars.color.text.muted,
    marginBlockEnd: vars.space[2],
  },

  variants: {
    variant: {
      default: { minHeight: '3rem' },
      compact: { minHeight: '2rem', marginBlockEnd: vars.space[1] },
      filtered: { minHeight: '2.5rem' },
    },
  },

  defaultVariants: { variant: 'default' },
})

export const title = recipe({
  base: {
    // `<p>`'nin tarayıcı varsayılanı `margin-block: 1em`; global reset yalnız
    // `body`'yi sıfırlıyor. Sıfırlanmazsa bu margin `gap` token'larının üstüne
    // biner ve dikey ritmi token'lar değil tarayıcı belirler — `compact` ile
    // `default` arasındaki fark da kaybolur.
    margin: 0,
    color: vars.color.text.primary,
    fontWeight: vars.font.weight.semibold,
    lineHeight: vars.lineHeight.heading,
  },

  variants: {
    variant: {
      default: { fontSize: vars.font.size.lg },
      compact: { fontSize: vars.font.size.md },
      filtered: { fontSize: vars.font.size.lg },
    },
  },

  defaultVariants: { variant: 'default' },
})

/** Satır uzunluğu sınırlı: ortalanmış uzun satırların takibi zordur. */
export const description = style({
  margin: 0,
  maxWidth: '44ch',
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
})

export const actions = style({
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: vars.space[3],
  marginBlockStart: vars.space[3],
})
