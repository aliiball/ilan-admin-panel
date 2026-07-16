import { createVar, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/** Sonucun rengi önce yerel değişkenlere yazılır; ikon, kenarlık ve zemin onu okur. */
const durumText = createVar()
const durumBg = createVar()

export const root = recipe({
  base: {
    display: 'grid',
    gap: vars.space[2],
    /*
      `list`/`cards` varyantlarında bu bir `<ul>`. Global reset yalnız body'nin
      margin'ini sıfırlıyor; ul'nin kendi margin'i ve 40 piksellik
      `padding-inline-start`'ı kalırsa liste sağa kayar ve dikey ritmi grid
      `gap`'i değil tarayıcı belirler. `summary` varyantında `<div>`; orada
      zararsız.
    */
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },

  variants: {
    variant: {
      list: {},
      /** Kartlar: skor ve zaman damgası da sığsın diye ızgara. */
      cards: {
        gap: vars.space[3],
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 16rem), 1fr))',
      },
      summary: {
        gap: vars.space[3],
      },
    },
  },

  defaultVariants: { variant: 'list' },
})

export const item = recipe({
  base: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'start',
    gap: vars.space[3],
  },

  variants: {
    status: {
      passed: {
        vars: { [durumText]: vars.color.success[700], [durumBg]: vars.color.success[50] },
      },
      warning: {
        vars: { [durumText]: vars.color.warning[700], [durumBg]: vars.color.warning[50] },
      },
      failed: {
        vars: { [durumText]: vars.color.danger[700], [durumBg]: vars.color.danger[50] },
      },
    },

    variant: {
      list: {
        paddingBlock: vars.space[2],
        borderBlockEnd: `1px solid ${vars.color.border.subtle}`,

        selectors: {
          '&:last-child': { borderBlockEnd: 'none' },
        },
      },

      cards: {
        gridTemplateColumns: 'auto 1fr',
        alignContent: 'start',
        padding: vars.space[3],
        background: durumBg,
        border: `1px solid ${vars.color.border.subtle}`,
        borderRadius: vars.radius.md,
      },
    },
  },
})

export const icon = style({
  color: durumText,
  marginBlockStart: '0.125rem',
})

export const body = style({
  display: 'grid',
  gap: vars.space[1],
  minWidth: 0,
})

export const label = style({
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  lineHeight: vars.lineHeight.tight,
})

export const message = style({
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
  /*
    `<p>` değil `<span>` kullanılsaydı da olurdu; ama paragraf semantiği doğru
    ve global reset yalnız body'nin margin'ini sıfırladığı için p'nin kendi
    margin'i grid gap'inin üstüne binerdi. Bu yüzden burada sıfırlanıyor.
  */
  margin: 0,
})

export const meta = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[3],
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  fontVariantNumeric: 'tabular-nums',
})

export const badgeSlot = style({
  justifySelf: 'end',
})

/** Özet satırı: sayılar ve bloklayıcı uyarısı. */
export const summaryRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],
  padding: vars.space[3],
  background: vars.color.bg.subtle,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
})

export const summaryCounts = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[2],
  marginInlineEnd: 'auto',
})

/** Bu da bir `<ul>`; aynı reset gerekçesi. */
export const summaryProblems = style({
  display: 'grid',
  gap: vars.space[2],
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const allClear = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  margin: 0,
})
