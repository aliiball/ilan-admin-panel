import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = style({
  display: 'grid',
  gap: vars.space[5],
})

/**
 * Gerekçe grubu bir `<fieldset>`.
 *
 * Dördü birden sıfırlanıyor ve hepsinin ayrı bir sebebi var:
 *
 * - `margin`/`padding`/`border`: global reset yalnız `body`'nin margin'ini
 *   sıfırlıyor; fieldset'in tarayıcı varsayılanı (2px kenarlık, ~0.35em dolgu,
 *   iki yandan margin) grid `gap`'inin üstüne biner ve dikey ritmi token'lar
 *   değil tarayıcı belirlerdi.
 * - `minInlineSize: 0`: fieldset'in `min-width: min-content` varsayılanı
 *   spec'ten gelir ve grid/flex kabında **küçülmeyi tamamen reddeder** — 320
 *   piksel ekranda en uzun gerekçe kartı kadar genişleyip sayfayı yatay
 *   kaydırtırdı.
 */
export const group = style({
  display: 'grid',
  gap: vars.space[3],
  margin: 0,
  padding: 0,
  border: 0,
  minInlineSize: 0,
})

/** `<legend>`'in de kendi dolgusu var; grubun başlığı diğer etiketlerle aynı hizada dursun. */
export const legend = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[1],
  padding: 0,
  marginBlockEnd: vars.space[1],
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  lineHeight: vars.lineHeight.tight,
})

export const requiredMark = style({
  color: vars.color.danger[600],
})

export const options = recipe({
  base: {
    display: 'grid',
  },

  variants: {
    variant: {
      /**
       * Kartlar: açıklama okunacağı için satır yüksekliği serbest, kolon
       * `auto-fill` ile ekrana göre 1–3 arasında.
       */
      cards: {
        gap: vars.space[3],
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 18rem), 1fr))',
      },

      /** Liste: tek kolon, sıkışık. Dialog içinde dikey alan pahalı. */
      list: {
        gap: vars.space[2],
      },
    },
  },
})

/**
 * Kartın kendisi Checkbox'ın `<label>` sarmalayıcısıdır — ayrı bir kutu
 * çizilmiyor, çünkü kartın tamamının tıklanabilir olması gerek ve etiketin
 * dışına çıkan her piksel tıklanamaz ölü alan olurdu.
 */
export const card = style({
  alignItems: 'start',
  padding: vars.space[3],
  border: `1px solid ${vars.color.border.default}`,
  borderRadius: vars.radius.md,
  background: vars.color.bg.surface,
  transition: `border-color ${vars.duration.fast} ${vars.ease.standard}, background ${vars.duration.fast} ${vars.ease.standard}`,

  selectors: {
    '&:hover:not([data-disabled])': {
      borderColor: vars.color.border.strong,
      background: vars.color.bg.subtle,
    },

    /**
     * Seçili kart vurgulanır. `:has()` ile: işaretli olan Base UI'ın
     * `Checkbox.Root`'u (`data-checked`), kartın kendisi değil — kutunun
     * durumunu ataya taşımanın CSS'teki tek yolu bu.
     */
    '&:has([data-checked])': {
      borderColor: vars.color.primary[600],
      background: vars.color.primary[50],
    },

    '&[data-disabled]': {
      background: vars.color.bg.disabled,
      cursor: 'not-allowed',
    },
  },
})

/** Listede kart yok; yalnız satır aralığı ve dokunma hedefi için dolgu. */
export const row = style({
  paddingBlock: vars.space[1],
})

export const error = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  color: vars.color.danger[600],
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.tight,
})

export const errorIcon = style({
  flexShrink: 0,
})
