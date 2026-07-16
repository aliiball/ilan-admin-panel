import { globalStyle } from '@vanilla-extract/css'
import { vars } from './theme.css'

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
})

globalStyle('html, body, #root', {
  height: '100%',
})

globalStyle('body', {
  margin: 0,
  fontFamily: vars.font.family.sans,
  fontSize: vars.font.size.md,
  lineHeight: vars.font.lineHeight.normal,
  color: vars.color.text.primary,
  backgroundColor: vars.color.surface.subtle,
  WebkitFontSmoothing: 'antialiased',
})

globalStyle('h1, h2, h3, h4, h5, h6, p, figure', {
  margin: 0,
})

globalStyle('button, input, select, textarea', {
  font: 'inherit',
  color: 'inherit',
})

globalStyle('img, svg', {
  display: 'block',
  maxWidth: '100%',
})

/* Klavye kullanıcısı için görünür focus; fare tıklamasında gösterilmez. */
globalStyle(':focus-visible', {
  outline: `2px solid ${vars.color.border.focus}`,
  outlineOffset: '2px',
})

globalStyle(':focus:not(:focus-visible)', {
  outline: 'none',
})
