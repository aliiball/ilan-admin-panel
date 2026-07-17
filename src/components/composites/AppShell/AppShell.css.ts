import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/**
 * Kırılımlar `min-width` ile yazılır: brifing 4.x mobil görünümü temel alır,
 * geniş ekran davranışı onun üstüne eklenir.
 *
 * - `MENU_KOLONU` (48rem / 768px): menü çekmeceden çıkıp kendi kolonuna oturur.
 *   Eşik 768'de, çünkü daraltılmış bir menü (~4.5rem) tablete 704 piksel içerik
 *   bırakır — kullanılabilir. Menünün daraltılıp daraltılmayacağı AppShell'in
 *   kararı değil (bkz. `AppShell.tsx`); kabuk yalnız kolonu açar.
 * - `GENIS_EKRAN` (64rem / 1024px): kolon zaten var, burada yalnız içerik nefes alır.
 */
const MENU_KOLONU = 'screen and (min-width: 48rem)'
const GENIS_EKRAN = 'screen and (min-width: 64rem)'

export const root = recipe({
  base: {
    /* "İçeriğe atla" bağlantısının ve slot'ların ortak kabı. */
    position: 'relative',
    display: 'grid',
    background: vars.color.bg.canvas,

    /*
      Mobil: tek kolon, üstte çubuk, altında içerik. Menüye kolon AYRILMAZ —
      çekmeceye dönen menü akışta yer kaplamamalı.

      Satırlar `auto minmax(0, 1fr)`: `1fr` tek başına "en az içerik kadar"
      anlamına gelir ve geniş bir tablo satırı şişirip main'in kaydırmasını
      engellerdi; `minmax(0, ...)` bunu keser.
    */
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridTemplateRows: 'auto minmax(0, 1fr)',
    gridTemplateAreas: '"topBar" "main"',
    minBlockSize: '100dvh',

    '@media': {
      [MENU_KOLONU]: {
        /*
          Geniş ekranda kabuk bir çerçeveye döner: yüksekliği viewport'a sabitlenir,
          kaydırma `main`'in olur. Menü ve üst çubuk böylece hiç kaybolmaz ve
          `position: sticky` matematiği (üst çubuğun yüksekliği kadar offset)
          hiç kurulmaz — o yükseklik AppShell'in bilmediği bir şey.

          `dvh`: mobil tarayıcının adres çubuğu açılıp kapandıkça `vh` yalan söyler.

          Kolon genişliği `auto`: menünün ne kadar yer kaplayacağını menü bilir
          (daraltılmış mı değil mi). AppShell burada bir genişlik dayatsaydı
          `collapsible` mod için AppShell'de olmayan bir `collapsed` state'i
          gerekirdi.
        */
        blockSize: '100dvh',
        overflow: 'hidden',
        gridTemplateColumns: 'auto minmax(0, 1fr)',
      },
    },
  },

  variants: {
    sidebarMode: {
      /**
       * Menü tam yüksekliği alır, üst çubuk onun sağında kalır.
       *
       * Genişliği hiç değişmeyeceği için menü sayfanın sol kenarını sabit tutar
       * ve 20 satırlık bir menüye tam boy kolon açılır.
       */
      fixed: {
        '@media': {
          [MENU_KOLONU]: { gridTemplateAreas: '"sidebar topBar" "sidebar main"' },
        },
      },

      /**
       * Üst çubuk tam genişlikte üstte, menü onun altında.
       *
       * Sebep daralma anı: menü daralıp genişledikçe kolon genişliği değişir.
       * Çubuk menünün yanında olsaydı her daraltmada arama kutusu ve profil
       * menüsü yana kayardı — kullanıcının tam tıklamak üzere olduğu kontroller.
       * Tam genişlik çubukta yalnız içeriğin sol kenarı oynar.
       */
      collapsible: {
        '@media': {
          [MENU_KOLONU]: { gridTemplateAreas: '"topBar topBar" "sidebar main"' },
        },
      },
    },
  },

  defaultVariants: { sidebarMode: 'fixed' },
})

/**
 * Menü slot'u — düzen kutusu, landmark değil. `<nav>`'ı içerideki SidebarNav açar.
 */
export const sidebarSlot = style({
  /*
    Mobilde kutu düzenden tamamen kalkar ama GİZLENMEZ: `display: none` yazsaydık
    çekmecesini kendi içinde (portal'sız, `position: fixed` ile) çizen bir menü
    görünmez olurdu. `contents` kutuyu siler, çocuğu bırakır: çekmeceyi kimin
    nasıl açtığına dair varsayım yapmadan yalnız kolonu iptal etmiş oluyoruz.
    Slot düz bir `div` olduğu için `display: contents`'in landmark'ları
    erişilebilirlik ağacından düşürme riski de yok.
  */
  display: 'contents',

  '@media': {
    [MENU_KOLONU]: {
      display: 'block',
      gridArea: 'sidebar',
      /* Uzun menü kabuğu değil kendini kaydırır; çerçevede `main` ile bağımsız. */
      overflowY: 'auto',
      minInlineSize: 0,
    },
  },
})

export const topBarSlot = style({
  gridArea: 'topBar',
  minInlineSize: 0,

  /*
    Mobilde belge kaydığı için çubuk yapıştırılır: çekmeceyi açan hamburger
    düğmesi sayfanın 40. satırında da erişilebilir olmalı. Zemin şart — saydam
    yapışkan çubuğun altından içerik geçer. TopBar kendi zeminini verse de bu
    ikisi çakışmaz, çubuk zemini kendi kutusunun tamamını boyar.
  */
  position: 'sticky',
  insetBlockStart: 0,
  zIndex: vars.z.sticky,
  background: vars.color.bg.surface,

  '@media': {
    [MENU_KOLONU]: {
      /* Çerçevede kaydıran kap `main`; çubuk zaten hiç kaymaz, yapışkanlık ölü kod olur. */
      position: 'static',
    },
  },
})

export const mainSlot = style({
  gridArea: 'main',
  /* Grid öğesinin `min-width: auto` varsayılanı geniş tabloyu kabuğa taşıtır. */
  minInlineSize: 0,
  padding: vars.space[4],

  '@media': {
    [MENU_KOLONU]: {
      /*
        Kaydırmayı burası devralır. Yan etkisi kasıtlı: içerideki
        `position: sticky` çubuklar (BulkActionBar, ModerationActionBar) artık
        main'in kaydırma kabına yapışır — istenen davranış tam da bu.

        Mobilde bu YOK: main'i kaydırma kabına çevirmek, aynı yapışkan çubukları
        viewport yerine main'in kutusuna yapıştırır ve ekranın altında değil
        içeriğin sonunda dururlardı.
      */
      overflow: 'auto',
      padding: vars.space[5],
    },
    [GENIS_EKRAN]: { padding: vars.space[6] },
  },
})

/**
 * "İçeriğe atla" bağlantısı.
 *
 * Odaklanana kadar ekranın üstünde saklı; `visibility`/`display` ile değil
 * `transform` ile — ikisi erişilebilirlik ağacından da düşürür ve bağlantı
 * klavyeyle hiç bulunamazdı. `position: fixed`: kullanıcı sayfayı kaydırmışken
 * Shift+Tab ile geri geldiğinde bağlantı görünür yerde belirmeli, sayfanın
 * tepesinde değil.
 */
export const skipLink = style({
  position: 'fixed',
  insetBlockStart: vars.space[3],
  insetInlineStart: vars.space[3],
  /* Yapışkan üst çubuğun ve açık bir çekmecenin üstünde: odaklanıp görünmeyen bağlantı işe yaramaz. */
  zIndex: vars.z.tooltip,

  display: 'inline-flex',
  alignItems: 'center',
  /* Dokunma hedefi 44 piksel altına düşmesin (brifing 4.x). */
  minBlockSize: vars.control.height.sm,
  padding: `${vars.space[2]} ${vars.space[4]}`,

  background: vars.color.bg.elevated,
  color: vars.color.text.link,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  border: `1px solid ${vars.color.border.strong}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.lg,

  transform: 'translateY(-200%)',
  transition: `transform ${vars.duration.fast} ${vars.ease.standard}`,

  selectors: {
    /* `:focus`, `:focus-visible` değil: bağlantı yalnız klavyeyle erişilir, ama odağı programatik veren bir sayfa da onu göstermeli. */
    '&:focus': { transform: 'translateY(0)' },
  },
})
