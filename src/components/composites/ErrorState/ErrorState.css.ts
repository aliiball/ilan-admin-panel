import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = recipe({
  base: {
    display: 'flex',
    gap: vars.space[3],
    borderRadius: vars.radius.lg,
  },

  variants: {
    variant: {
      /** Ekranın tamamı yüklenemedi: ortalanmış, geniş, tek odak noktası. */
      page: {
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: `${vars.space[12]} ${vars.space[6]}`,
        background: vars.color.bg.surface,
      },
      /** Panel içeriği yüklenemedi: çevresi ayakta, hata kendi kutusunda. */
      section: {
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: `${vars.space[8]} ${vars.space[5]}`,
        background: vars.color.danger[50],
        border: `1px solid ${vars.color.danger[600]}`,
      },
      /** Dar alan: tek satır, ikon ve eylem yanda. */
      inline: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: `${vars.space[3]} ${vars.space[4]}`,
        background: vars.color.danger[50],
        border: `1px solid ${vars.color.danger[600]}`,
        borderRadius: vars.radius.md,
      },
    },
  },

  defaultVariants: { variant: 'page' },
})

/**
 * İkon renkle birlikte *şekil* de taşır: renk körü kullanıcı için tek başına
 * kırmızı zemin gösterge değildir.
 */
export const icon = style({
  display: 'inline-flex',
  flexShrink: 0,
  color: vars.color.danger[700],
})

export const content = style({
  display: 'grid',
  gap: vars.space[1],
  flex: 1,
  minWidth: 0,

  selectors: {
    '[data-variant="page"] &, [data-variant="section"] &': {
      justifyItems: 'center',
    },
  },
})

export const title = style({
  // Bkz. EmptyState.title: `<p>`'nin varsayılan margin'i `gap`'in üstüne biner.
  // `headingLevel` verilince aynı sınıf `<h{n}>`'ye uygulanıyor; `<h1>`/`<h2>`'nin
  // daha büyük tarayıcı margin'ini de `margin: 0` siler, başlık `<p>` ile birebir
  // aynı kalır.
  margin: 0,
  // Uzun kırılmaz bir başlık `content`'in `minWidth: 0` kutusunu taşırmasın.
  overflowWrap: 'anywhere',
  color: vars.color.text.primary,
  fontWeight: vars.font.weight.semibold,
  fontSize: vars.font.size.md,
  lineHeight: vars.lineHeight.heading,

  selectors: {
    '[data-variant="page"] &': { fontSize: vars.font.size.xl },
    '[data-variant="inline"] &': { fontSize: vars.font.size.sm },
  },
})

export const description = style({
  margin: 0,
  maxWidth: '52ch',
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
})

/**
 * Destek ekibinin isteyeceği kod. Mono yazı basamak karışıklığını önler
 * (0/O, 1/l) ve `user-select` açık kalır — kullanıcı kopyalayıp yapıştırabilmeli.
 */
export const code = style({
  margin: 0,
  marginBlockStart: vars.space[1],
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
})

export const codeValue = style({
  fontFamily: vars.font.family.mono,
  userSelect: 'all',
})

export const actions = style({
  display: 'flex',
  flexShrink: 0,
  gap: vars.space[2],

  selectors: {
    '[data-variant="page"] &, [data-variant="section"] &': {
      marginBlockStart: vars.space[4],
    },
  },
})
