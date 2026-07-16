import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Onay butonu sonda: kullanıcı soldan sağa okurken önce geri dönüş yolunu,
 * sonra yıkıcı eylemi görür.
 */
export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space[3],
  width: '100%',

  '@media': {
    /** Mobilde butonlar alt alta; `column-reverse` ile onay en altta, başparmağa yakın. */
    'screen and (max-width: 30rem)': {
      flexDirection: 'column-reverse',
    },
  },
})
