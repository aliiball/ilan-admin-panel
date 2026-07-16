import { createVar, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/**
 * Ton renkleri önce yerel değişkenlere yazılır, varyantlar bu değişkenleri okur.
 * Böylece 6 ton × 3 varyant = 18 kombinasyon tek tek tanımlanmak zorunda kalmaz.
 */
const toneSubtle = createVar()
const toneStrong = createVar()
const toneText = createVar()
const toneBorder = createVar()

export const badge = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: vars.space[1],
    border: '1px solid transparent',
    borderRadius: vars.radius.full,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.medium,
    lineHeight: vars.lineHeight.tight,
    whiteSpace: 'nowrap',
  },

  variants: {
    tone: {
      neutral: {
        vars: {
          [toneSubtle]: vars.color.neutral[100],
          [toneStrong]: vars.color.neutral[700],
          [toneText]: vars.color.neutral[800],
          [toneBorder]: vars.color.neutral[400],
        },
      },
      primary: {
        vars: {
          [toneSubtle]: vars.color.primary[50],
          [toneStrong]: vars.color.primary[700],
          [toneText]: vars.color.primary[800],
          [toneBorder]: vars.color.primary[600],
        },
      },
      success: {
        vars: {
          [toneSubtle]: vars.color.success[50],
          [toneStrong]: vars.color.success[700],
          [toneText]: vars.color.success[800],
          [toneBorder]: vars.color.success[600],
        },
      },
      warning: {
        vars: {
          [toneSubtle]: vars.color.warning[50],
          [toneStrong]: vars.color.warning[700],
          [toneText]: vars.color.warning[800],
          [toneBorder]: vars.color.warning[600],
        },
      },
      danger: {
        vars: {
          [toneSubtle]: vars.color.danger[50],
          [toneStrong]: vars.color.danger[700],
          [toneText]: vars.color.danger[800],
          [toneBorder]: vars.color.danger[600],
        },
      },
      info: {
        vars: {
          [toneSubtle]: vars.color.info[50],
          [toneStrong]: vars.color.info[700],
          [toneText]: vars.color.info[800],
          [toneBorder]: vars.color.info[600],
        },
      },
    },

    variant: {
      solid: {
        background: toneStrong,
        color: vars.color.neutral[0],
      },
      /** Brifing kuralı: açık arka plan üstünde en az 800 koyuluğunda metin. */
      soft: {
        background: toneSubtle,
        color: toneText,
      },
      outline: {
        background: 'transparent',
        color: toneText,
        borderColor: toneBorder,
      },
    },

    /**
     * Yazı boyutu her iki boyutta da 1rem'dir (brifingin minimum metin kuralı);
     * boyutlar yalnızca iç boşlukla ayrışır.
     */
    size: {
      sm: {
        paddingInline: vars.space[2],
        paddingBlock: '0.0625rem',
      },
      md: {
        paddingInline: vars.space[3],
        paddingBlock: vars.space[1],
      },
    },
  },

  defaultVariants: {
    tone: 'neutral',
    variant: 'soft',
    size: 'md',
  },
})

export const icon = style({
  display: 'inline-flex',
  flexShrink: 0,
})
