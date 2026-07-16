import { globalStyle } from '@vanilla-extract/css'
import { vars } from './contract.css'
import './themes.css'

/** Global reset ve temel tipografi — brifing 4.3. */

globalStyle(':root', {
  colorScheme: 'light',
})

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
})

globalStyle('html', {
  minWidth: '20rem',
  fontFamily: vars.font.family.sans,
  fontSize: '100%',
  color: vars.color.text.primary,
  background: vars.color.bg.canvas,
})

globalStyle('body', {
  minWidth: '20rem',
  minHeight: '100vh',
  margin: 0,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
  color: vars.color.text.primary,
  background: vars.color.bg.canvas,
  textRendering: 'optimizeLegibility',
})

globalStyle('button, input, select, textarea', {
  font: 'inherit',
})

globalStyle('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])', {
  WebkitTapHighlightColor: 'transparent',
})

/* Mobilde çift dokunuşta yakınlaştırma gecikmesini kaldırır. */
globalStyle(
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)',
  {
    touchAction: 'manipulation',
  },
)

globalStyle('img, svg', {
  display: 'block',
  maxWidth: '100%',
})

globalStyle('a', {
  color: vars.color.text.link,
  textUnderlineOffset: vars.space[1],
})

globalStyle('a:hover', {
  color: vars.color.text.linkHover,
})

/* Klavye kullanıcısı için görünür ring; renk tek başına gösterge değildir. */
globalStyle(':focus-visible', {
  outline: `0.1875rem solid ${vars.color.focus.ring}`,
  outlineOffset: '0.125rem',
})

globalStyle('::selection', {
  background: vars.color.selection.bg,
})

globalStyle('*, *::before, *::after', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      // `!important` gerekli: bu `*` kuralının özgüllüğü 0, dolayısıyla ileride
      // `html { scroll-behavior: smooth }` yazılırsa onu yenemez. vanilla-extract'in
      // tipi scrollBehavior için `!important` kabul etmediğinden cast ediliyor;
      // üretilen CSS doğrudur.
      scrollBehavior: 'auto !important' as 'auto',
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
    },
  },
})
