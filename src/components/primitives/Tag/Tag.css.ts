import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const tag = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: vars.space[2],
    paddingInline: vars.space[3],
    paddingBlock: vars.space[1],
    border: '1px solid',
    borderRadius: vars.radius.full,
    fontSize: vars.font.size.sm,
    lineHeight: vars.lineHeight.tight,
    whiteSpace: 'nowrap',
    transitionProperty: 'background-color, border-color, color',
    transitionDuration: vars.duration.fast,
    transitionTimingFunction: vars.ease.standard,
  },

  variants: {
    selected: {
      true: {
        background: vars.color.primary[50],
        borderColor: vars.color.primary[600],
        color: vars.color.primary[800],
        fontWeight: vars.font.weight.medium,
      },
      false: {
        background: vars.color.bg.surface,
        borderColor: vars.color.border.default,
        color: vars.color.text.secondary,
      },
    },

    /**
     * Devre dışı görünüm zemin + `cursor` ile kurulur, metni soldurarak değil.
     *
     * `text.disabled` burada **yanlış token'dı**: WCAG'in düşük kontrastı
     * bağışladığı yer "etkin olmayan kontrol"dür, oysa Tag bir `<span>` —
     * etiketi ("Kadıköy") devre dışı bir kontrolün parçası değil, düpedüz
     * okunması gereken metin. Yalnız içindeki kaldırma butonu gerçekten
     * `disabled` ve o zaten muaf. Ölçüm: n-500/n-200 3.86 (AA'dan düşük),
     * `text.muted` ile 6.15 (sıcak amber 6.08).
     */
    disabled: {
      true: {
        background: vars.color.bg.disabled,
        borderColor: vars.color.border.subtle,
        color: vars.color.text.muted,
        cursor: 'not-allowed',
      },
      false: {},
    },
  },

  defaultVariants: {
    selected: false,
    disabled: false,
  },
})

/**
 * Kaldırma butonu 44x44px dokunma hedefini `::after` ile büyütür; görsel olarak
 * küçük kalır ama tıklanabilir alan brifingin kuralını karşılar.
 */
export const removeButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  width: '1.25rem',
  height: '1.25rem',
  padding: 0,
  border: 'none',
  borderRadius: vars.radius.full,
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  flexShrink: 0,

  ':hover': {
    background: vars.color.bg.subtle,
  },

  ':disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
  },

  '::after': {
    content: '""',
    position: 'absolute',
    inset: '-0.6875rem',
  },
})
