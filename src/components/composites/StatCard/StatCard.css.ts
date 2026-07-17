import { createVar, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/**
 * Trendin rengi önce yerel değişkenlere yazılır; ok da metin de aynı değişkeni
 * okur. Böylece `sentiment` tek yerde renge çevrilir — okun yeşil, metnin
 * kırmızı kalması gibi bir tutarsızlık kaynağı kalmıyor.
 */
const trendText = createVar()
const trendBg = createVar()

export const root = recipe({
  base: {
    display: 'grid',
    alignContent: 'start',
    gap: vars.space[2],
    minWidth: 0,
    padding: vars.space[4],
    background: vars.color.bg.surface,
    border: '1px solid',
    borderColor: vars.color.border.subtle,
    borderRadius: vars.radius.lg,
    /*
      `onClick` verilince kart bir <button>'dır ve buton kendi yazı tipini,
      rengini ve ortalı hizasını dayatır. Bu dört satır olmasa aynı component
      tıklanabilirken bambaşka görünürdü — varyant farkı değil, element farkı.
    */
    font: 'inherit',
    color: 'inherit',
    textAlign: 'start',
    margin: 0,
  },

  variants: {
    variant: {
      /** Sade kart: dashboard'ın çoğunluğu. */
      plain: {},

      /**
       * Vurgu şeridi. Kalınlık `space[1]`; ham piksel yazmamak için ölçü
       * token'ından okunuyor — şerit 1 piksellik kenarlıktan ayırt edilmeli.
       */
      accent: {
        borderInlineStartWidth: vars.space[1],
        borderInlineStartColor: vars.color.primary[700],
      },

      /** Trend öne çıkar; düzen farkı `meta`/`trend` recipe'lerinde. */
      trend: {},
    },

    clickable: {
      true: {
        width: '100%',
        cursor: 'pointer',
        transitionProperty: 'border-color, box-shadow',
        transitionDuration: vars.duration.fast,

        selectors: {
          '&:hover': {
            borderColor: vars.color.border.strong,
            boxShadow: vars.shadow.sm,
          },
        },
      },
      /** Tıklanamayan kart hover'da kıpırdamaz: tıklanabilir görünmemeli. */
      false: {},
    },
  },

  defaultVariants: { variant: 'plain', clickable: false },
})

export const header = style({
  display: 'flex',
  alignItems: 'start',
  justifyContent: 'space-between',
  gap: vars.space[2],
})

export const label = style({
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  lineHeight: vars.lineHeight.tight,
})

export const icon = style({
  display: 'flex',
  flexShrink: 0,
  color: vars.color.text.muted,
})

export const value = style({
  display: 'flex',
  alignItems: 'center',
  color: vars.color.text.primary,
  fontSize: vars.font.size['3xl'],
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.tight,
  /** Rakamlar sabit genişlikte: 37 → 128 olurken kart soldan sağa oynamıyor. */
  fontVariantNumeric: 'tabular-nums',
  /** "1.284.937.512 ₺" boşluksuz uzun bir dizgidir; kabı taşırmasın. */
  overflowWrap: 'anywhere',
  /*
    Yükleme iskeleti (`height: 1em`) gerçek metnin satır kutusundan (1em ×
    line-height) kısadır. Yükseklik burada sabitlenmeseydi veri gelince kart
    tam da brifingin yasakladığı kadar — yarım satır — zıplardı.
  */
  minBlockSize: `calc(1em * ${vars.lineHeight.tight})`,
})

export const meta = recipe({
  base: {
    display: 'flex',
    gap: vars.space[2],
    fontSize: vars.font.size.sm,
  },

  variants: {
    layout: {
      /** Trend ve açıklama yan yana; dar ekranda açıklama alt satıra sarar. */
      inline: { alignItems: 'center', flexWrap: 'wrap' },
      /** `trend` varyantı: pil kendi satırında, büyük; açıklama altına iner. */
      emphasized: { flexDirection: 'column', alignItems: 'flex-start', gap: vars.space[1] },
    },
  },

  defaultVariants: { layout: 'inline' },
})

/**
 * Trend pilinin yeri — **pil olmasa da ayrılır.**
 *
 * Kart yüklenirken trendin gelip gelmeyeceğini bilemez (`trend` sunucudan
 * gelen bir sayıdır). Yeri veriye göre açsaydık, veri gelince kart bir satır
 * boyu uzardı: brifingin "loading durumları layout shift üretmemelidir"
 * kuralının ihlali. Kartın şekli bu yüzden varyanttan gelir, veriden değil.
 *
 * Ölçü pilin hesaplanan boyundan (satır kutusu + dikey dolgu) bilerek birkaç
 * piksel yüksek: pil kutuya sığdığı sürece yuva iki durumda da aynı yüksekliği
 * tutar, yazı tipi metrikleri bir iki piksel oynasa bile.
 */
export const trendSlot = recipe({
  base: { display: 'flex', alignItems: 'center' },

  variants: {
    layout: {
      inline: { minBlockSize: '2rem' },
      emphasized: { minBlockSize: '2.75rem' },
    },
  },

  defaultVariants: { layout: 'inline' },
})

export const trend = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: vars.space[1],
    borderRadius: vars.radius.full,
    background: trendBg,
    color: trendText,
    fontWeight: vars.font.weight.semibold,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: vars.lineHeight.tight,
    whiteSpace: 'nowrap',
  },

  variants: {
    /**
     * Yalnız **renk** buradan gelir; ok `direction`'dan. Brifing 4.1'in soft
     * varyant kuralı: açık zemin + en az 700 koyulukta metin.
     */
    sentiment: {
      positive: {
        vars: { [trendText]: vars.color.success[700], [trendBg]: vars.color.success[50] },
      },
      negative: {
        vars: { [trendText]: vars.color.danger[700], [trendBg]: vars.color.danger[50] },
      },
      /** Nötr, "iyi haber yok" değil "yorum yok" demek: metin rengi, vurgu yok. */
      neutral: {
        vars: { [trendText]: vars.color.text.secondary, [trendBg]: vars.color.bg.subtle },
      },
    },

    size: {
      inline: {
        paddingInline: vars.space[2],
        paddingBlock: vars.space[1],
        fontSize: vars.font.size.sm,
      },
      emphasized: {
        paddingInline: vars.space[3],
        paddingBlock: vars.space[2],
        fontSize: vars.font.size.lg,
      },
    },
  },

  defaultVariants: { size: 'inline' },
})

export const description = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
})

/**
 * Görsel olarak gizli ama ekran okuyucuya açık.
 *
 * `visibility: hidden` veya `display: none` **kullanılamaz**: ikisi de alt ağacı
 * erişilebilirlik hesabından siler ve metin duyurulmaz (bkz. Button'ın
 * `loading` regresyonu).
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
