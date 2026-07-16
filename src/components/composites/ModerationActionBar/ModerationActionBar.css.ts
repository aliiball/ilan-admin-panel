import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = recipe({
  base: {
    display: 'flex',
    gap: vars.space[2],
    background: vars.color.bg.elevated,
  },

  variants: {
    variant: {
      /**
       * Ekranın altına yapışır: uzun ilan detayında moderatör aşağı kaydırdıkça
       * karar butonları kaybolmaz.
       *
       * Alt dolgu `env(safe-area-inset-bottom)` ile büyütülüyor — brifingin
       * kabul kriteri. iPhone'un ana ekran çubuğu ve Android'in jest çubuğu
       * viewport'un altını kaplar; hesaba katılmazsa "Reddet" butonunun alt
       * yarısı çubuğun altında kalır ve dokunuş sistem jestine gider. `0px`
       * varsayılanı masaüstünde ve safe-area bilmeyen tarayıcıda fazladan
       * boşluk açılmasını önler.
       */
      stickyBottom: {
        position: 'sticky',
        insetBlockEnd: 0,
        zIndex: vars.z.sticky,
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: vars.space[3],
        paddingBlockEnd: `calc(${vars.space[3]} + env(safe-area-inset-bottom, 0px))`,
        borderBlockStart: `1px solid ${vars.color.border.default}`,
        boxShadow: vars.shadow.md,
      },

      /** Normal akış: kuyrukta kartın altında, detayda bölüm sonunda. */
      inline: {
        flexWrap: 'wrap',
        alignItems: 'center',
      },

      /**
       * Dikey kolon: geniş ekranda yan panelde durur. Butonlar tam genişlik,
       * çünkü dar bir kolonda ortalanmış farklı genişlikte butonlar tırtıklı
       * bir kenar oluşturur.
       */
      sideRail: {
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: vars.space[3],
        border: `1px solid ${vars.color.border.subtle}`,
        borderRadius: vars.radius.lg,
      },
    },
  },

  defaultVariants: { variant: 'inline' },
})

/** Dialog gövdesi: alan varsa (gerekçe/not) nefes payı bırakır. */
export const dialogBody = style({
  display: 'grid',
  gap: vars.space[4],
})

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space[2],
})
