import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
const scaleIn = keyframes({
  from: { opacity: 0, transform: 'translate(-50%, -48%) scale(0.96)' },
  to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
})

export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: vars.z.modal,
  background: vars.color.bg.overlay,
  animation: `${fadeIn} ${vars.duration.fast} ${vars.ease.standard}`,

  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
})

export const popup = recipe({
  base: {
    position: 'fixed',
    insetBlockStart: '50%',
    insetInlineStart: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: vars.z.modal,
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
    width: 'calc(100vw - 2rem)',
    maxHeight: 'calc(100dvh - 2rem)',
    background: vars.color.bg.elevated,
    borderRadius: vars.radius.lg,
    boxShadow: vars.shadow.xl,
    outline: 'none',
    animation: `${scaleIn} ${vars.duration.normal} ${vars.ease.standard}`,

    '@media': {
      '(prefers-reduced-motion: reduce)': { animation: 'none' },
    },
  },

  variants: {
    size: {
      sm: { maxWidth: vars.container.sm },
      md: { maxWidth: vars.container.md },
      lg: { maxWidth: vars.container.lg },
      xl: { maxWidth: vars.container.xl },
    },
  },

  defaultVariants: { size: 'md' },
})

export const header = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space[3],
  padding: vars.space[5],
  borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
})

export const headerText = style({
  display: 'grid',
  gap: vars.space[1],
  flex: 1,
  minWidth: 0,
})

export const title = style({
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
  color: vars.color.text.primary,
})

export const description = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

/** İçerik uzarsa gövde kayar; başlık ve footer sabit kalır. */
export const body = style({
  padding: vars.space[5],
  overflowY: 'auto',
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,

  /*
    Gövdesiz modal (açıklaması başlıkta olan bir ConfirmDialog gibi) dolgusunu
    da bırakır: aksi hâlde başlıkla footer arasında, iki çizgiyle sınırlanmış
    boş bir bant kalıyor ve eksik bir bölüm gibi okunuyordu. Element grid
    satırını koruduğu için `display: none` yerine dolgu sıfırlanıyor.
  */
  ':empty': {
    padding: 0,
  },
})

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space[3],
  padding: vars.space[5],
  borderBlockStart: `1px solid ${vars.color.border.subtle}`,

  '@media': {
    /** Mobilde eylemler dikey sıralanır ve tam genişlik olur. */
    'screen and (max-width: 30rem)': {
      flexDirection: 'column-reverse',
    },
  },
})
