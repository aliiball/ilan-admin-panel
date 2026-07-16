import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: vars.space[3],
    flexWrap: 'wrap',
    background: vars.color.bg.elevated,
    fontSize: vars.font.size.sm,

    '@media': {
      /*
        Dar ekranda sayaç ile eylemler yan yana durduğunda eylemlere kalan kolon
        bir butondan dar kalıyor ve her buton kendi satırına düşüp tırtıklı bir
        sütun oluşturuyordu. Dikeye alınınca eylemler tam genişliği kullanıp
        ikişerli sarıyor.
      */
      'screen and (max-width: 30rem)': {
        flexDirection: 'column',
        alignItems: 'stretch',
      },
    },
  },

  variants: {
    variant: {
      /**
       * Yüzen ada: akıştan çıkar, uzun listede kaydırırken hep erişilir.
       * `insetInline` ile iki yandan boşluk bırakılır — 320 piksel ekranda
       * kenara yapışmaz; `maxWidth` ile geniş ekranda satır boyunca yayılmaz.
       */
      floating: {
        position: 'fixed',
        insetBlockEnd: vars.space[4],
        insetInline: vars.space[4],
        marginInline: 'auto',
        maxWidth: vars.container.md,
        zIndex: vars.z.sticky,
        padding: `${vars.space[3]} ${vars.space[4]}`,
        border: `1px solid ${vars.color.border.default}`,
        borderRadius: vars.radius.xl,
        boxShadow: vars.shadow.lg,
      },

      /** Kabın alt kenarına yapışır; tam genişlik, üstten çizgi. */
      sticky: {
        position: 'sticky',
        insetBlockEnd: 0,
        zIndex: vars.z.sticky,
        padding: `${vars.space[3]} ${vars.space[4]}`,
        borderBlockStart: `1px solid ${vars.color.border.default}`,
        boxShadow: vars.shadow.md,
      },

      /** Normal akışta: tablonun üstündeki toolbar. */
      inline: {
        padding: `${vars.space[2]} ${vars.space[3]}`,
        background: vars.color.selection.bg,
        border: `1px solid ${vars.color.border.subtle}`,
        borderRadius: vars.radius.md,
      },
    },
  },

  defaultVariants: { variant: 'floating' },
})

export const count = style({
  color: vars.color.text.primary,
  fontWeight: vars.font.weight.semibold,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})

/**
 * Eylemler sayaç ile temizle arasında kalır ve daralınca alt satıra sarar;
 * mobilde altı eylem tek satıra sığmaz.
 */
export const actions = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: vars.space[2],
  flex: 1,
})

/** Temizle en sağda: seçimden çıkış yolu her zaman aynı yerde. */
export const clear = style({
  marginInlineStart: 'auto',
  flexShrink: 0,

  '@media': {
    /** Dikey düzende "en sağa it" anlamsız; sola hizalanıp eylemleri takip eder. */
    'screen and (max-width: 30rem)': {
      marginInlineStart: 0,
    },
  },
})
