import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const wrapper = recipe({
  base: {
    width: '100%',
    background: vars.color.bg.surface,
    borderRadius: vars.radius.md,
  },
  variants: {
    visualStyle: {
      plain: {},
      bordered: { border: `1px solid ${vars.color.border.subtle}`, overflow: 'hidden' },
      striped: { border: `1px solid ${vars.color.border.subtle}`, overflow: 'hidden' },
    },
  },
  defaultVariants: { visualStyle: 'plain' },
})

/** Yatay kaydırma sarmalayıcısı: dar ekranda tablo kesilmez, kaydırılır. */
export const scroller = style({
  width: '100%',
  overflowX: 'auto',
})

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: vars.font.size.sm,
})

export const thead = recipe({
  base: {
    background: vars.color.bg.subtle,
  },
  variants: {
    sticky: {
      true: { position: 'sticky', insetBlockStart: 0, zIndex: vars.z.sticky },
      false: {},
    },
  },
  defaultVariants: { sticky: false },
})

export const th = recipe({
  base: {
    borderBlockEnd: `1px solid ${vars.color.border.default}`,
    color: vars.color.text.secondary,
    fontWeight: vars.font.weight.semibold,
    whiteSpace: 'nowrap',
    textAlign: 'start',
  },
  variants: {
    density: {
      comfortable: { padding: `${vars.space[3]} ${vars.space[4]}` },
      compact: { padding: `${vars.space[2]} ${vars.space[3]}` },
    },
    align: {
      start: { textAlign: 'start' },
      center: { textAlign: 'center' },
      end: { textAlign: 'end' },
    },
  },
  defaultVariants: { density: 'comfortable', align: 'start' },
})

/** Sıralanabilir başlık butonu — `<th onClick>` klavyeyle erişilemez. */
export const sortButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[1],
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  fontWeight: 'inherit',
  cursor: 'pointer',

  ':hover': { color: vars.color.text.primary },
})

/** Aktif olmayan sıralama oku soluk: hangi sütunun sıralandığı belli olsun. */
export const sortIcon = style({
  opacity: 0.35,
  flexShrink: 0,

  selectors: {
    '[data-sorted] &': { opacity: 1, color: vars.color.primary[700] },
  },
})

export const tr = recipe({
  base: {
    borderBlockEnd: `1px solid ${vars.color.border.subtle}`,

    selectors: {
      '&:last-child': { borderBlockEnd: 'none' },
      '&[data-clickable]:hover': { background: vars.color.table.rowHover, cursor: 'pointer' },
      /** Seçili satır yalnız renkle değil, sol kenardaki şeritle de belli olur. */
      '&[data-selected]': {
        background: vars.color.selection.bg,
        boxShadow: `inset 3px 0 0 ${vars.color.primary[700]}`,
      },
    },
  },
  variants: {
    striped: {
      true: {
        selectors: {
          '&:nth-child(even):not([data-selected])': { background: vars.color.bg.subtle },
        },
      },
      false: {},
    },
  },
  defaultVariants: { striped: false },
})

export const td = recipe({
  base: {
    color: vars.color.text.primary,
    verticalAlign: 'middle',
  },
  variants: {
    density: {
      comfortable: { padding: `${vars.space[3]} ${vars.space[4]}` },
      compact: { padding: `${vars.space[2]} ${vars.space[3]}` },
    },
    align: {
      start: { textAlign: 'start' },
      center: { textAlign: 'center' },
      end: { textAlign: 'end' },
    },
  },
  defaultVariants: { density: 'comfortable', align: 'start' },
})

export const selectionCell = style({
  width: '1px',
  paddingInlineEnd: 0,
})

/**
 * Görsel olarak gizli, erişilebilirlik ağacında açık.
 *
 * `visibility: hidden`/`display: none` **kullanılmıyor**: ikisi de alt ağacı
 * erişilebilir ad hesabından siler (Button'ın `loading` hatası tam buydu).
 * `clip` + 1 piksel kalıbı repoda RolePermissionMatrix ve StatCard'da da aynı.
 */
export const visuallyHidden = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
})

/** Durum bloğu: loading/empty/error hepsi tablo genişliğinde ortalanır. */
export const stateBlock = style({
  display: 'grid',
  placeItems: 'center',
  gap: vars.space[3],
  padding: vars.space[10],
  textAlign: 'center',
})

export const cards = style({
  display: 'grid',
  gap: vars.space[3],
})

export const cardRow = style({
  position: 'relative',

  selectors: {
    '&[data-selected]': {
      outline: `2px solid ${vars.color.primary[700]}`,
      outlineOffset: '2px',
      borderRadius: vars.radius.lg,
    },
  },
})
