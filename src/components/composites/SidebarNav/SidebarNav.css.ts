import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/**
 * Genişletilmiş rayın genişliği.
 *
 * Token değil çünkü token sözleşmesinde düzen ölçüsü yok (`container` sayfa
 * kabı içindir ve 40rem'den başlar). Ölçü keyfî de değil: panelin en uzun menü
 * etiketi ("Moderasyon kuyruğu", girintili bir alt satırda) ikonuyla birlikte
 * tek satıra sığsın diye seçildi — sığmayan etiket üç noktaya kırpılır ve
 * birbirine benzeyen satırlar ("İlan..." / "İlan...") ayırt edilemez olur.
 */
const RAY_GENISLIK = '16rem'

/**
 * Daraltılmış rayın genişliği: bir kontrol, artı `scroll`'un iki yanındaki dolgu.
 *
 * Elle yazılmış bir sayı yerine `control.height.md`'den türetiliyor — böylece
 * ikonun dokunma hedefi (brifing: en az 44×44) tema ölçüleri değişse bile
 * rayın içine sığmaya devam eder.
 */
const RAY_DAR_GENISLIK = `calc(${vars.control.height.md} + ${vars.space[2]} + ${vars.space[2]})`

/**
 * Rayın çekmeceye düştüğü eşik.
 *
 * `min-width: 48rem` kırılımının negatifi — FilterBar ve ImageGallery aynı
 * eşiği kullanıyor, panelin "dar ekran" tanımı tek olsun diye.
 */
const DAR_EKRAN = 'screen and (max-width: 47.99rem)'

/**
 * Kenardaki sabit ray.
 *
 * Dar ekranda `display: none`: brifing "dar ekranda menü kenarda durmaz,
 * çekmece olarak açılır" diyor. Gizlenmesi ayrıca erişilebilirlik borcunu da
 * kapatıyor — `display: none` alt ağacı erişilebilirlik ağacından tamamen
 * çıkarır, dolayısıyla çekmece açıkken ekran okuyucu iki tane "Ana menü"
 * landmark'ı duymaz. (Etiketi gizlemek için `display`/`visibility` **kullanılmaz**;
 * orada iş erişilebilir adı korumak, burada landmark'ı tamamen kaldırmak.)
 */
export const rail = recipe({
  base: {
    display: 'flex',
    flexDirection: 'column',
    blockSize: '100%',
    /* Kaydırmayı `scroll` üstlenecek; bu olmadan flex çocuk içeriği kadar uzar. */
    minBlockSize: 0,
    background: vars.color.bg.surface,
    borderInlineEnd: `1px solid ${vars.color.border.subtle}`,
    transitionProperty: 'inline-size',
    transitionDuration: vars.duration.normal,
    transitionTimingFunction: vars.ease.standard,

    '@media': {
      [DAR_EKRAN]: { display: 'none' },
      '(prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    },
  },

  variants: {
    collapsed: {
      true: { inlineSize: RAY_DAR_GENISLIK },
      false: { inlineSize: RAY_GENISLIK },
    },
  },

  defaultVariants: { collapsed: false },
})

/** Menü uzarsa kendi içinde kaydırılır; daralt düğmesi rayın altına çivili kalır. */
export const scroll = style({
  flex: 1,
  minBlockSize: 0,
  overflowY: 'auto',
  padding: vars.space[2],
})

/**
 * Kök liste.
 *
 * Global reset yalnız `body`'nin margin'ini sıfırlıyor; `<ul>` hem kendi
 * margin'ini hem de 40 pikselllik `padding-inline-start`'ını taşır. İkisi de
 * sıfırlanmazsa menü sağa kayar ve `gap` token'ının üstüne tarayıcı margin'i
 * biner. `listStyle: 'none'` üçüncü şart: semantik liste gerekiyor ama madde
 * imleri gerekmiyor.
 */
export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: vars.space[1],
})

/** Alt liste: aynı reset, artı yuvanın hangi dala ait olduğunu gösteren çizgi. */
export const sublist = recipe({
  base: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gap: vars.space[1],
    borderInlineStart: `1px solid ${vars.color.border.subtle}`,

    selectors: {
      /*
        TUZAK: `hidden` attribute'unun gizleme gücü tarayıcının kendi stil
        sayfasından gelir (`[hidden] { display: none }`) ve yazar stili her zaman
        onu ezer. Yukarıdaki `display: grid` tek başına kapalı grubu açık
        bırakırdı: `aria-expanded="false"` derken içerik ekranda durur.
        Erişilebilirlik ağacı da CSS'e bakar — `display: none` olmadan ekran
        okuyucu kapalı grubun bağlantılarını gezmeye devam eder.
      */
      '&[hidden]': { display: 'none' },
    },
  },

  variants: {
    collapsed: {
      /*
        Daraltılmışken girinti yok. 4rem'lik rayın içi 3rem; yarım rem'lik bir
        girinti çocuk satırını 40 piksele düşürür ve brifingin 44×44 dokunma
        hedefi kuralını kırar — yuvalanmayı göstermek uğruna satırı tıklanamaz
        yapmak kötü bir takas. Bilgiyi tek başına yukarıdaki kenar çizgisi taşır.
      */
      true: {},
      /* Girinti ikon kolonu kadar: çocuk etiketleri ebeveynin etiketiyle hizalanır. */
      false: { marginInlineStart: vars.space[4], paddingInlineStart: vars.space[2] },
    },
  },

  defaultVariants: { collapsed: false },
})

/** Satır ile alt listesini birlikte tutar. */
export const item = style({
  display: 'grid',
  gap: vars.space[1],
})

/** Bağlantı ile grup okunu yan yana koyar; ok bağlantının içinde **değil**. */
export const rowMain = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[1],
})

export const link = recipe({
  base: {
    /* Daraltılmışken rozetin köşeye oturabilmesi için konumlandırma kabı. */
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: vars.space[3],
    flex: 1,
    /* Flex çocuğu varsayılan olarak küçülmeyi reddeder; etiket kırpılamaz olurdu. */
    minInlineSize: 0,
    /* Dokunma hedefi: brifing en az 44×44 istiyor, `md` 3rem. */
    minBlockSize: vars.control.height.md,
    paddingBlock: vars.space[2],
    borderRadius: vars.radius.md,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.medium,
    /* Global `a` stili altı çizili bırakır; menüde her satır çizgili olurdu. */
    textDecoration: 'none',
    transitionProperty: 'background-color, color',
    transitionDuration: vars.duration.fast,
    transitionTimingFunction: vars.ease.standard,

    '@media': {
      '(prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    },
  },

  variants: {
    active: {
      /*
        Aktiflik dört kanaldan birden bildiriliyor: `aria-current="page"`
        (program), zemin, kalınlık ve kenardaki şerit. Renk tek başına
        gösterge değildir — brifingin kuralı.
      */
      true: {
        background: vars.color.selection.bg,
        color: vars.color.primary[700],
        fontWeight: vars.font.weight.semibold,

        '::before': {
          content: '""',
          position: 'absolute',
          insetBlock: vars.space[2],
          insetInlineStart: 0,
          inlineSize: vars.space[1],
          borderRadius: vars.radius.full,
          background: vars.color.primary[600],
        },

        /* Aktif satırın üstüne gelince zemin kaybolmamalı. */
        ':hover': { background: vars.color.selection.bg, color: vars.color.primary[700] },
      },

      false: {
        color: vars.color.text.secondary,
        ':hover': { background: vars.color.action.ghost.hover, color: vars.color.text.primary },
      },
    },

    collapsed: {
      true: { justifyContent: 'center', paddingInline: vars.space[2] },
      false: { paddingInline: vars.space[3] },
    },
  },

  defaultVariants: { active: false, collapsed: false },
})

/** İkon kolonu sabit: daraltılıp genişletilirken ikonlar aynı hizada kalır. */
export const icon = style({
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  inlineSize: vars.space[5],
  blockSize: vars.space[5],
  color: 'inherit',
})

/**
 * Uzun etiket rayı taşırmaz, üç noktaya kırpılır.
 *
 * Kırpma yalnız **görsel**: `text-overflow` metni DOM'dan silmez, bağlantının
 * erişilebilir adı tam etiketi taşımaya devam eder.
 */
export const label = style({
  flex: 1,
  minInlineSize: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

/**
 * Görsel olarak gizli, erişilebilirlik ağacında açık.
 *
 * `visibility: hidden` veya `display: none` **kullanılmıyor**: ikisi de alt ağacı
 * erişilebilir ad hesabından siler ve daraltılmış menüde bağlantı adsız kalırdı
 * (bu repoda Button'ın `loading` hâlinde yaşandı). Kırpma tekniği metni ağaçta
 * tutar. Checkbox ve Spinner'daki `visuallyHidden` ile birebir aynı.
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

export const badgeSlot = recipe({
  base: { flexShrink: 0 },

  variants: {
    collapsed: {
      /*
        Daraltılmışken sayı ikonun köşesine biner: "12 bekleyen ilan" bilgisi
        daraltmanın bedeli olmamalı — daraltma bir görünüm tercihi, iş
        kaybetme aracı değil. `pointerEvents: 'none'` rozetin bağlantının
        tıklama alanından çalmasını önler.
      */
      true: {
        position: 'absolute',
        insetBlockStart: 0,
        insetInlineEnd: 0,
        pointerEvents: 'none',
      },
      false: {},
    },
  },

  defaultVariants: { collapsed: false },
})

/**
 * Grup açma/kapama oku.
 *
 * `IconButton` değil çünkü bu ok bağlantının **kardeşi**: `<a>` içinde `<button>`
 * geçersiz HTML'dir ve tarayıcılar iç içe etkileşimli elementlerde tıklamayı
 * öngörülemez dağıtır. Boyutu `control.height.sm` (2.75rem) — dokunma hedefi.
 */
export const toggle = style({
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  inlineSize: vars.control.height.sm,
  blockSize: vars.control.height.sm,
  padding: 0,
  border: 'none',
  borderRadius: vars.radius.md,
  background: 'transparent',
  color: vars.color.text.muted,
  cursor: 'pointer',

  ':hover': { background: vars.color.action.ghost.hover, color: vars.color.text.primary },
})

export const chevron = recipe({
  base: {
    transitionProperty: 'transform',
    transitionDuration: vars.duration.fast,
    transitionTimingFunction: vars.ease.standard,

    '@media': {
      '(prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
    },
  },

  variants: {
    open: {
      true: { transform: 'rotate(180deg)' },
      false: { transform: 'rotate(0deg)' },
    },
  },

  defaultVariants: { open: false },
})

/**
 * Daralt/genişlet düğmesinin şeridi.
 *
 * Rayın **altında**: menüye giren klavye kullanıcısının ilk `Tab`'ı bir hedefe
 * düşmeli, bir görünüm tercihine değil.
 */
export const railFooter = recipe({
  base: {
    display: 'flex',
    flexShrink: 0,
    padding: vars.space[2],
    borderBlockStart: `1px solid ${vars.color.border.subtle}`,
  },

  variants: {
    collapsed: {
      true: { justifyContent: 'center' },
      false: { justifyContent: 'flex-end' },
    },
  },

  defaultVariants: { collapsed: false },
})
