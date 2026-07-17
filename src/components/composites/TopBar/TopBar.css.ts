import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Masaüstü eşiği.
 *
 * Kurallar önce 320 piksele göre yazılıyor, masaüstü düzeni bunun üstüne
 * `min-width` ile ekleniyor — brifingin "mobil temel görünümdür" kuralı.
 * 48rem eşiği repo'nun geri kalanıyla aynı (FilterBar, ImageGallery).
 */
const MASAUSTU = 'screen and (min-width: 48rem)'

/**
 * Görsel olarak gizli ama erişilebilirlik ağacında duran metnin kalıbı.
 *
 * `display: none` ya da `visibility: hidden` **kullanılmıyor**: ikisi de alt
 * ağacı erişilebilir ad hesabından siler. Button'ın `loading` hâlinde tam olarak
 * bu yaşandı — buton adsız kaldı, testler geçti (bkz. AGENTS.md).
 */
const gizliMetin = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
} as const

/**
 * Çubuk **yapışkan değil**: `position: sticky` hangi kabın kaydığını bilmeyi
 * gerektirir, onu bilen AppShell'dir. Burada sabitlenirse TopBar'ı normal akışta
 * kullanmak imkânsız hâle gelirdi.
 */
export const root = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: vars.space[3],
  paddingInline: vars.space[4],
  paddingBlock: vars.space[2],
  background: vars.color.bg.elevated,
  borderBlockEnd: `1px solid ${vars.color.border.default}`,
})

/** Bağlam kolonu: hamburger + bölüm başlığı. Uzun başlıkta küçülebilmeli. */
export const context = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  minWidth: 0,
  flexShrink: 1,
})

/**
 * Hamburger yalnız dar ekranda.
 *
 * Gizleme kararı çubuğun içinde, medya sorgusuyla veriliyor — çünkü hangi
 * ekranda olduğumuzu tarayıcı bilir. Sayfaya bıraksaydık `matchMedia` ile
 * JavaScript'ten viewport ölçmek ve `onMenuClick`'i ona göre vermek gerekirdi.
 *
 * Sarmalayıcı span üzerinden gizleniyor, IconButton'a `className` geçirilerek
 * değil: recipe'in kendi `display`'i ile yarışmak sınıf sırasına bağlı olurdu.
 */
export const menuSlot = style({
  display: 'inline-flex',

  '@media': {
    [MASAUSTU]: { display: 'none' },
  },
})

/**
 * Bölüm başlığı — sayfanın `<h1>`'i değil (o `PageHeader`'ın işi), bu yüzden
 * `<span>` ve başlık hiyerarşisine girmiyor. Sığmazsa üç noktaya kırpılır:
 * çubuğun yüksekliği sabit kalmalı.
 */
export const title = style({
  minWidth: 0,
  overflow: 'hidden',
  color: vars.color.text.primary,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.tight,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
})

/**
 * Arama kutusu.
 *
 * Mobilde kendi satırına iner: 320 pikselde hamburger + başlık + zil + avatar
 * yan yanayken kutuya kalan yer tek bir kelimeye yetmiyor. `order` yalnız görsel
 * yeri değiştirir, DOM sırası (bağlam → arama → kimlik) korunur; odak sırası da
 * onu izler. Sapma dar ekranda tek bir sıçrama kadar: arama görsel olarak
 * profilin altındayken odakta ondan önce gelir. Masaüstünde — panelin asıl
 * kullanıldığı yer — görsel sıra ile odak sırası birebir örtüşür.
 */
export const search = style({
  order: 1,
  flex: '1 1 100%',
  minWidth: 0,

  '@media': {
    [MASAUSTU]: {
      order: 0,
      flex: '1 1 auto',
      maxWidth: vars.container.sm,
      marginInline: 'auto',
    },
  },
})

/** Bildirim + kimlik. Daralmaz: arama kutusu küçülür, kimlik yerinde kalır. */
export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[3],
  marginInlineStart: 'auto',
  flexShrink: 0,
})

/**
 * Zil ve rozet **yan yana**, üst üste değil.
 *
 * Rozeti zilin köşesine bindirmek mutlak konum ve token dışı piksel ayarı
 * isterdi; üstelik `99+` gibi geniş bir rozet zilin kendisini örterdi. Yan yana
 * duran ikili aynı bilgiyi taşıyor ve 320 pikselde de sığıyor.
 */
export const notifications = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[1],
  flexShrink: 0,
  color: vars.color.text.secondary,
})

const kimlikTemel = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[2],
  minWidth: 0,
  /** Dokunma hedefi: mobilde kimlik yalnız avatardan ibaret kalıyor. */
  minBlockSize: vars.control.height.sm,
  paddingInline: vars.space[2],
  textAlign: 'start',
} as const

/** `onProfileClick` yokken: tıklanamayan, sadece gösteren kimlik. */
export const identity = style(kimlikTemel)

/** `onProfileClick` varken: gerçek `<button>`. Odak halkasını globals veriyor. */
export const identityButton = style({
  ...kimlikTemel,
  border: '1px solid transparent',
  borderRadius: vars.radius.full,
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  transitionProperty: 'background-color',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.ease.standard,

  selectors: {
    '&:hover': { background: vars.color.action.ghost.hover },
    '&:active': { background: vars.color.action.ghost.active },
  },
})

export const avatarSlot = style({
  display: 'inline-flex',
  flexShrink: 0,
})

/**
 * Ad ve rol: mobilde görsel olarak yok, erişilebilirlik ağacında var.
 *
 * 320 pikselde bu metne yer yok — ama `display: none` ile gizlemek profil
 * düğmesini **adsız** bırakırdı, çünkü düğmenin erişilebilir adı tam olarak bu
 * metinden hesaplanıyor. Yeri boşaltmanın erişilebilir adı korumakla çelişmediği
 * tek yol bu.
 */
export const identityText = style({
  ...gizliMetin,

  '@media': {
    [MASAUSTU]: {
      position: 'static',
      display: 'grid',
      width: 'auto',
      height: 'auto',
      margin: 0,
      clip: 'auto',
      whiteSpace: 'normal',
      minWidth: 0,
    },
  },
})

export const identityName = style({
  overflow: 'hidden',
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  lineHeight: vars.lineHeight.tight,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
})

export const identityRole = style({
  overflow: 'hidden',
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.tight,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
})

/** Her ekranda gizli kalan metin: rozetin sayısının okunur karşılığı. */
export const visuallyHidden = style(gizliMetin)
