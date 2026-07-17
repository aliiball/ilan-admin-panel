import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = style({
  display: 'grid',
  gap: vars.space[6],
})

export const section = style({
  display: 'grid',
  gap: vars.space[3],
})

/**
 * Bölüm başlığı.
 *
 * `margin: 0` şart: global reset yalnız body'nin margin'ini sıfırlıyor, `<h3>`
 * kendi `margin-block`'unu taşır ve grid kabında bu, `section`'ın `gap`'inin
 * üstüne biner — dikey ritmi token'lar değil tarayıcı belirlerdi.
 */
export const sectionTitle = style({
  margin: 0,
  paddingBlockEnd: vars.space[2],
  borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
  color: vars.color.text.primary,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
})

/**
 * Alan listesi (`<dl>`).
 *
 * `margin: 0` aynı reset gerekçesiyle: `<dl>`'in tarayıcı varsayılanı `1em 0`.
 * (`<dd>`'nin 40 pikselik `margin-inline-start`'ı ayrı bir tuzak; `dd`'de.)
 */
export const list = recipe({
  base: {
    display: 'grid',
    margin: 0,
  },

  variants: {
    variant: {
      /**
       * Konu başlığına gruplanmış ızgara: alanlar sığdığı kadar yan yana.
       * `min(100%, 14rem)` ile 320 pikselde tek kolona iner ve taşmaz.
       */
      sections: {
        gap: vars.space[4],
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 14rem), 1fr))',
      },

      /** Sıkışık `<dl>`: etiket solda, değer sağda; çiftler alt alta. */
      definitionList: {
        gap: vars.space[2],
        gridTemplateColumns: '1fr',
      },
    },
  },

  defaultVariants: { variant: 'sections' },
})

export const row = recipe({
  base: {
    minWidth: 0,
  },

  variants: {
    variant: {
      /** Etiket üstte, değer altta. Yoğun ızgarada okuma yönü dikey. */
      sections: {
        display: 'grid',
        gap: vars.space[1],
        alignContent: 'start',
      },

      /**
       * Dar kolonda etiket ve değer yan yana; ikisi de kendi payına düşen yeri
       * `minmax(0, …)` ile alıyor — uzun değer etiketi ezmesin diye.
       */
      definitionList: {
        display: 'grid',
        gap: vars.space[3],
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        alignItems: 'baseline',
        paddingBlock: vars.space[2],
        borderBlockEnd: `1px solid ${vars.color.border.subtle}`,

        selectors: {
          '&:last-child': { borderBlockEnd: 'none' },
        },
      },
    },

    /** Başlık ve açıklama cümledir; ızgarada tam satır kaplar. */
    wide: {
      true: { gridColumn: '1 / -1' },
      false: {},
    },

    /**
     * Vurgulanan alan.
     *
     * Renk tek başına gösterge değil: satır ayrıca "Değişti" rozeti taşıyor ve
     * kenar çizgisi renkten bağımsız bir biçim ipucu veriyor. Zemin `warning-50`
     * çünkü vurgu bir hata değil, "buraya bak" demek.
     */
    highlighted: {
      true: {
        paddingInlineStart: vars.space[3],
        borderInlineStart: `3px solid ${vars.color.warning[600]}`,
        background: vars.color.warning[50],
        borderRadius: vars.radius.sm,
      },
      false: {},
    },
  },

  defaultVariants: { variant: 'sections', wide: false, highlighted: false },
})

export const dt = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.tight,
})

/**
 * Değer (`<dd>`).
 *
 * `marginInlineStart: 0` **şart**: `<dd>`'nin tarayıcı varsayılanı 40 piksel
 * girinti. `<ul>`/`<ol>`'nin 40 piksellik `padding-inline-start`'ının kardeşi
 * ama bu sefer `margin` tarafında — `padding`'i sıfırlamak bunu düzeltmez.
 * Sıfırlanmazsa her değer etiketinden 40 piksel sağda başlar ve 320 pikselde
 * ızgara yatay kaydırır.
 */
export const dd = style({
  margin: 0,
  marginInlineStart: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
  overflowWrap: 'anywhere',
})

/** Etiket metni; rozet yanına geldiğinde küçülüp kırpılmasın diye ayrı. */
export const labelText = style({
  fontWeight: vars.font.weight.medium,
})

/** Değeri olmayan alanın tiresi. Yanındaki değerlerden görsel olarak geri planda. */
export const missing = style({
  color: vars.color.text.muted,
})

/**
 * Görsel olarak gizli ama ekran okuyucuya açık.
 *
 * `visibility: hidden`/`display: none` **kullanılamaz**: ikisi de alt ağacı
 * erişilebilirlik hesabından siler ve "Belirtilmemiş" duyurulmaz (bkz. Button'ın
 * `loading` regresyonu). SidebarNav, StatCard ve Checkbox'takiyle birebir aynı.
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

/** Üç sütunlu karşılaştırma 320 pikselde sığmaz; sayfa değil tablo kaysın. */
export const tableScroll = style({
  overflowX: 'auto',
})

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: vars.font.size.sm,
})

/** `<caption>` varsayılanı ortalı; bölüm başlığı sola hizalı ve başlık gibi görünmeli. */
export const caption = style({
  paddingBlockEnd: vars.space[2],
  color: vars.color.text.primary,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
  textAlign: 'start',
})

export const th = style({
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderBlockEnd: `1px solid ${vars.color.border.default}`,
  background: vars.color.bg.subtle,
  color: vars.color.text.secondary,
  fontWeight: vars.font.weight.semibold,
  textAlign: 'start',
  whiteSpace: 'nowrap',
})

export const tr = recipe({
  base: {
    borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
  },

  variants: {
    /** Satırın tamamı vurgulanır; `<tr>`'de `borderInlineStart` hücreye geçmez. */
    highlighted: {
      true: { background: vars.color.warning[50] },
      false: {},
    },
  },

  defaultVariants: { highlighted: false },
})

/** Satır başlığı (`<th scope="row">`): alan adı. */
export const rowHeader = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],
  padding: `${vars.space[2]} ${vars.space[3]}`,
  color: vars.color.text.secondary,
  fontWeight: vars.font.weight.regular,
  textAlign: 'start',
  verticalAlign: 'baseline',
})

export const td = recipe({
  base: {
    padding: `${vars.space[2]} ${vars.space[3]}`,
    verticalAlign: 'baseline',
    lineHeight: vars.lineHeight.body,
    overflowWrap: 'anywhere',
  },

  variants: {
    side: {
      /** Eski değer geri planda: gözün gideceği yer yeni değer. */
      onceki: { color: vars.color.text.muted },
      yeni: { color: vars.color.text.primary },
    },
  },
})
