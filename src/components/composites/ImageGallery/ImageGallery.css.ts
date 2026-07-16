import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = recipe({
  base: {
    display: 'grid',
    gap: vars.space[3],
  },

  variants: {
    variant: {
      mosaic: {},
      filmstrip: {},

      /**
       * Görsel solda, fotoğraf listesi sağda. Yalnız geniş ekranda: 320
       * pikselde iki kolon, ikisini de kullanılamaz hâle getirirdi — mobilde
       * diğer varyantlar gibi alt alta iner.
       */
      split: {
        '@media': {
          'screen and (min-width: 48rem)': {
            gridTemplateColumns: 'minmax(0, 1fr) minmax(12rem, 18rem)',
            alignItems: 'start',
          },
        },
      },
    },
  },

  defaultVariants: { variant: 'mosaic' },
})

/** Büyük görselin kabı. `minWidth: 0` olmadan grid kolonu içeriğe göre taşar. */
export const stage = style({
  display: 'grid',
  gap: vars.space[3],
  minWidth: 0,
})

export const frame = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  /*
    Sabit en-boy oranı: fotoğraflar arasında geçerken kabın yüksekliği
    değişmez, sayfa zıplamaz ve altındaki karar butonları yerinde durur.
  */
  aspectRatio: '3 / 2',
  overflow: 'hidden',
  background: vars.color.bg.subtle,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
})

export const image = style({
  width: '100%',
  height: '100%',
  /*
    `contain`, `cover` değil: moderatör fotoğrafın tamamını görmeli. `cover`
    kenarları kırpar ve tam da kırptığı yerde filigran, telefon numarası veya
    uygunsuz bir detay olabilir — kırpılmış görsele bakarak "uygun" demek,
    görmediğin şeyi onaylamaktır.
  */
  objectFit: 'contain',
})

/** Bozuk görselin yerini tutar: kırık ikon yerine ne olduğunu söyleyen bir kutu. */
export const broken = style({
  display: 'grid',
  placeItems: 'center',
  gap: vars.space[2],
  padding: vars.space[4],
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  textAlign: 'center',
})

export const badgeSlot = style({
  position: 'absolute',
  insetBlockStart: vars.space[2],
  insetInlineStart: vars.space[2],
})

export const coverSlot = style({
  position: 'absolute',
  insetBlockStart: vars.space[2],
  insetInlineEnd: vars.space[2],
})

export const toolbar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],
})

export const toolbarNote = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  marginInlineEnd: 'auto',
})

export const thumbs = recipe({
  base: {
    display: 'grid',
    gap: vars.space[2],
    minWidth: 0,
    listStyle: 'none',
    /*
      `<ul>` tarayıcı varsayılanı olarak margin ve padding taşır; global reset
      yalnız body'yi sıfırlıyor. Sıfırlanmazsa grid `gap`'inin üstüne biner ve
      şerit kabın içinde kaymış görünür.
    */
    margin: 0,
    padding: 0,
  },

  variants: {
    variant: {
      /** Izgara: hepsi bir bakışta, satır satır sarar. */
      mosaic: {
        gridTemplateColumns: 'repeat(auto-fill, minmax(5rem, 1fr))',
      },

      /**
       * Tek satır, yatay kaydırma. `auto-cols` ile küçülmezler; kaydırma
       * çubuğu klavye ile de erişilebilir olsun diye kabın kendisi odaklanabilir
       * değil — şeritteki her düğme zaten odaklanabilir ve tarayıcı odaklanan
       * düğmeyi görünüre kaydırır.
       */
      filmstrip: {
        gridAutoFlow: 'column',
        gridAutoColumns: '5rem',
        overflowX: 'auto',
        paddingBlockEnd: vars.space[2],
      },

      /** Dikey liste: split'in sağ kolonu. Mobilde ızgaraya döner. */
      split: {
        gridTemplateColumns: 'repeat(auto-fill, minmax(5rem, 1fr))',

        '@media': {
          'screen and (min-width: 48rem)': {
            gridTemplateColumns: '1fr',
            gridAutoRows: 'min-content',
            maxHeight: '28rem',
            overflowY: 'auto',
          },
        },
      },
    },
  },

  defaultVariants: { variant: 'mosaic' },
})

export const thumbItem = style({
  minWidth: 0,
})

export const thumb = style({
  position: 'relative',
  display: 'block',
  width: '100%',
  aspectRatio: '3 / 2',
  overflow: 'hidden',
  padding: 0,
  background: vars.color.bg.subtle,
  border: `2px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  cursor: 'pointer',

  selectors: {
    '&:hover': { borderColor: vars.color.border.strong },

    '&:focus-visible': {
      outline: `2px solid ${vars.color.focus.ring}`,
      outlineOffset: '2px',
    },

    /** Aktif fotoğraf: renk tek başına değil, kalın çerçeve de var. */
    '&[aria-current="true"]': {
      borderColor: vars.color.primary[600],
    },
  },
})

export const thumbImage = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
})

/**
 * Şeritteki durum noktası. Rozet sığmıyor; nokta yalnız *tarama* içindir —
 * durumun metni büyük görselin rozetinde ve düğmenin erişilebilir adında var,
 * yani bilgi renge bırakılmıyor.
 */
export const thumbStatus = recipe({
  base: {
    position: 'absolute',
    insetBlockStart: '0.25rem',
    insetInlineEnd: '0.25rem',
    width: '0.625rem',
    height: '0.625rem',
    borderRadius: vars.radius.full,
    border: `1px solid ${vars.color.neutral[0]}`,
  },

  variants: {
    status: {
      pending: { background: vars.color.neutral[400] },
      approved: { background: vars.color.success[600] },
      rejected: { background: vars.color.danger[600] },
    },
  },
})

export const brokenThumb = style({
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  height: '100%',
  color: vars.color.text.muted,
})

export const dialogBody = style({
  display: 'grid',
  gap: vars.space[4],
})

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space[2],
})
