import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = recipe({
  base: {
    display: 'grid',
    gap: vars.space[5],
    padding: vars.space[5],
    background: vars.color.bg.surface,
    border: `1px solid ${vars.color.border.subtle}`,
    borderRadius: vars.radius.lg,
    /*
      Kap `<form>` ya da `<section>`; ikisinin de tarayıcı varsayılan margin'i
      yok ama minInlineSize'ı `auto`. Grid kabında 320 pikselde uzun bir
      seçenek etiketi kabı genişletip sayfayı yatay kaydırtabiliyor.
    */
    minInlineSize: 0,
  },

  variants: {
    mode: {
      create: {},
      edit: {},
      /**
       * Salt okunur gösterim düzenlenebilir formdan **zeminiyle** ayrılıyor:
       * kontroller yerine metin göründüğü için tek ipucu tipografi kalırdı ve
       * "buraya yazabilir miyim" sorusu her alanda tekrar sorulurdu.
       */
      readOnly: {
        background: vars.color.bg.subtle,
      },
    },
  },

  defaultVariants: { mode: 'edit' },
})

export const header = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[3],
  paddingBlockEnd: vars.space[3],
  borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
})

export const headerMain = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],
  marginInlineEnd: 'auto',
  minWidth: 0,
})

/**
 * Başlık `<p>`; `<h*>` değil (aynı gerekçe EmptyState ve ChartCard'da):
 * component hangi başlık seviyesinde durduğunu bilemez, yanlış seviye belge
 * taslağını bozar. Görsel ağırlık stille, erişilebilir ad `aria-labelledby`
 * ile veriliyor. `<p>`'nin kendi margin'i grid `gap`'inin üstüne binmesin diye
 * sıfırlanıyor — global reset yalnız body'yi sıfırlıyor.
 */
export const title = style({
  margin: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
  minWidth: 0,
  overflowWrap: 'anywhere',
})

/** Anahtar bir tanımlayıcı: kullanıcı onu okur, konuşmaz. Monospace ayırt ettirir. */
export const keyChip = style({
  padding: `${vars.space[1]} ${vars.space[2]}`,
  background: vars.color.bg.subtle,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.sm,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.sm,
  overflowWrap: 'anywhere',
})

/**
 * Rozet yuvası `dirty` boşken de DOM'da kalır.
 *
 * `role="status"` canlı bölgesi içeriğiyle **birlikte** DOM'a eklendiğinde
 * ekran okuyucular tutarsız davranıp duyuruyu atlıyor (aynı gözlem
 * BulkActionBar'da). Yuva sabit dursun, yalnız içeriği değişsin: o zaman
 * "kaydedilmemiş değişiklik" ilk yazışta duyurulur.
 */
export const statusSlot = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  minHeight: vars.space[6],
})

export const fields = style({
  display: 'grid',
  gap: vars.space[5],
  minInlineSize: 0,
})

/** İki alanı yan yana koyan ızgara (en az/en çok). 320 pikselde alt alta iner. */
export const pair = style({
  display: 'grid',
  gap: vars.space[4],
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))',
})

/**
 * Bölüm bir `<fieldset>` — ve dördü birden sıfırlanıyor:
 *
 * - `margin`/`padding`/`border`: tarayıcı varsayılanı (2px kenarlık, ~0.35em
 *   dolgu, iki yandan margin) grid `gap`'inin üstüne biner; dikey ritmi
 *   token'lar değil tarayıcı belirlerdi.
 * - `minInlineSize: 0`: fieldset'in `min-width: min-content` varsayılanı
 *   spec'ten gelir ve grid/flex kabında küçülmeyi **reddeder** — 320 pikselde
 *   en uzun seçenek satırı kadar genişleyip sayfayı yatay kaydırtırdı.
 */
export const section = style({
  display: 'grid',
  gap: vars.space[3],
  margin: 0,
  padding: 0,
  border: 0,
  minInlineSize: 0,
})

/** `<legend>`'in de kendi dolgusu var; alan etiketleriyle aynı hizada dursun. */
export const legend = style({
  display: 'block',
  padding: 0,
  marginBlockEnd: vars.space[1],
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  lineHeight: vars.lineHeight.tight,
})

export const note = style({
  margin: 0,
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
})

/**
 * Bölümün kendi hatası (seçenek listesinin tamamına ait). Alan hatalarıyla aynı
 * dili konuşsun diye danger; ikonu yok, çünkü `role="alert"` ile zaten duyuruluyor.
 */
export const sectionError = style({
  margin: 0,
  color: vars.color.danger[600],
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.tight,
})

export const sectionTitle = style({
  margin: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  lineHeight: vars.lineHeight.tight,
})

export const scope = style({
  display: 'grid',
  gap: vars.space[2],
  padding: vars.space[3],
  background: vars.color.bg.subtle,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
})

export const badgeRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[2],
})

export const flags = style({
  display: 'grid',
  gap: vars.space[3],
})

/** Seçenekler bir `<ul>`: ayrıca 40 piksel `padding-inline-start` taşır. */
export const optionList = style({
  display: 'grid',
  gap: vars.space[3],
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

/**
 * Kartın kendisi `<li>`; kenarlık `<fieldset>`'e **verilmiyor**.
 *
 * Tarayıcılar `<legend>`'i kabının kenarlığına oyuk açarak yerleştirir ve
 * fieldset'in kenarlığı varken bu yerleşim `display: grid` ile öngörülemez hâle
 * gelir. Kenarlık dıştaki `<li>`'de, fieldset ise kenarlıksız bir ızgara:
 * legend sıradan bir başlık gibi en üstte durur.
 */
export const optionItem = style({
  padding: vars.space[3],
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  background: vars.color.bg.surface,
  minInlineSize: 0,
})

/** Satırın kendi `<fieldset>`'i var; aynı dört sıfırlama, aynı gerekçeler. */
export const optionRow = style({
  display: 'grid',
  gap: vars.space[2],
  margin: 0,
  padding: 0,
  border: 0,
  minInlineSize: 0,
})

export const optionBody = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'start',
  gap: vars.space[3],
  minInlineSize: 0,

  '@media': {
    /** Dar ekranda eylem kolonu, alanlara bir kutudan dar yer bırakıyor. */
    'screen and (max-width: 30rem)': {
      gridTemplateColumns: '1fr',
    },
  },
})

/** Satır numarası hem `<legend>` hem görsel sıra göstergesi. */
export const optionLegend = style({
  padding: 0,
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  fontVariantNumeric: 'tabular-nums',
})

export const optionFields = style({
  display: 'grid',
  gap: vars.space[3],
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 10rem), 1fr))',
  minInlineSize: 0,
})

export const optionActions = style({
  display: 'flex',
  gap: vars.space[1],
  justifySelf: 'end',
})

export const addOption = style({
  justifySelf: 'start',
})

/**
 * Salt okunur liste bir `<dl>`.
 *
 * Global reset burada da yetmiyor ve `<dd>` sürprizi `<ul>`'ninkinden beter:
 * tarayıcı varsayılanı **40 piksel `margin-inline-start`** — değerler
 * terimlerine göre sağa kaçar. `<dl>`'nin kendi margin'i de blok yönünde
 * `gap`'in üstüne biner.
 */
export const readOnlyList = style({
  display: 'grid',
  gap: vars.space[4],
  margin: 0,
  padding: 0,
})

export const readOnlyRow = style({
  display: 'grid',
  gap: vars.space[1],
  minInlineSize: 0,
})

export const readOnlyTerm = style({
  margin: 0,
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.tight,
})

export const readOnlyValue = style({
  /** Asıl mesele: `<dd>`'nin 40 piksellik varsayılan girintisi. */
  margin: 0,
  marginInlineStart: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size.md,
  lineHeight: vars.lineHeight.body,
  overflowWrap: 'anywhere',
})

/** "Boş" da bir bilgidir; sessiz bir boşluk yerine açıkça yazılır. */
export const emptyValue = style({
  color: vars.color.text.muted,
  fontStyle: 'italic',
})

export const readOnlyOptions = style({
  display: 'grid',
  gap: vars.space[2],
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const readOnlyOption = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],
})

export const optionValueText = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

export const footer = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: vars.space[2],
  paddingBlockStart: vars.space[3],
  borderBlockStart: `1px solid ${vars.color.border.subtle}`,
})
