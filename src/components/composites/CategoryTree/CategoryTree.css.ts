import { createVar, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/**
 * Bir kademe girintinin uzunluğu. Varyanta göre değişir, satıra göre değil —
 * bu yüzden kökte bir kez kurulur, satırlar miras alır.
 */
const adim = createVar()

/**
 * Düğümün derinliği (kök = `0`), satırın inline `style`'ıyla verilir.
 *
 * `createVar()` ile üretilmiyor, adı elle yazılıyor: `createVar()` `var(--hash)`
 * **referansını** döndürür, inline `style` ise `--hash` **adını** ister. İkisini
 * çeviren `@vanilla-extract/dynamic` bu projede kurulu değil ve bağımlılık
 * eklemek bu component'in yetkisi dışında. Ad tek yerde yazılı kalsın diye
 * `.tsx` de buradan okuyor.
 *
 * Neden değişken? Girinti satırın **padding**'i, kabın değil: alt liste
 * `padding-inline-start` ile içeri itilseydi seçili satırın zemini de girintiden
 * başlar, dar kolonda "hangi kategorideyim" çubuğu yarım kalırdı. Değişkenle
 * satır kolonun tamamını kaplar, girintiyi metin yapar.
 */
export const DERINLIK_VAR = '--kategori-agaci-derinlik'

/**
 * Odak halkası — `tokens/globals.css.ts`'teki `:focus-visible` kuralının kopyası.
 *
 * Kopyalanmak zorunda: global kural **odaklanan elemanın tamamını** çevreliyor ve
 * burada odaklanan eleman `<li role="treeitem">`. Açık bir düğümün `<li>`'si
 * `role="group"` alt listesini de kapsadığı için halka Konut'un değil Konut ve
 * yedi çocuğunun etrafına çizilirdi — hangi satırın odakta olduğu kaybolurdu.
 * Bu yüzden `<li>`'de halka kapatılıp satırın üstüne alınıyor (bkz. `item`).
 *
 * `outlineOffset` negatif: satır dar kolonun tamamını kaplıyor, dışa taşan halka
 * kolonun kenarında kırpılırdı.
 */
const ODAK_HALKASI = {
  outline: `0.1875rem solid ${vars.color.focus.ring}`,
  outlineOffset: '-0.1875rem',
} as const

export const root = recipe({
  base: {
    color: vars.color.text.primary,
    fontSize: vars.font.size.sm,
  },

  variants: {
    variant: {
      /** Dar kolon: zemin ve kenarlık yok, ağaç sayfanın kendi yüzeyinde durur. */
      sidebar: {
        vars: { [adim]: vars.space[5] },
        paddingBlock: vars.space[2],
      },

      /** Geniş kart: kendi yüzeyi ve kenarlığı var, satırlar daha ferah. */
      panel: {
        vars: { [adim]: vars.space[5] },
        padding: vars.space[3],
        background: vars.color.bg.surface,
        border: `1px solid ${vars.color.border.subtle}`,
        borderRadius: vars.radius.lg,
      },

      /**
       * Sıkışık: dialog ve yan panel. Fark **yalnız** yatay ölçülerde — satır
       * yüksekliği `sm`'de kalır, çünkü brifingin 44 piksel dokunma hedefi
       * "dar yerde" diye küçülmez. Yazı boyutu da düşmez: görünür metin 1rem
       * altına inmez (brifing 4.2).
       */
      compact: {
        vars: { [adim]: vars.space[4] },
      },
    },
  },

  defaultVariants: { variant: 'sidebar' },
})

/**
 * Hem `role="tree"` kökü hem `role="group"` alt listeleri.
 *
 * Global reset yalnız `body`'nin margin'ini sıfırlıyor; `<ul>` ayrıca 40 piksel
 * `padding-inline-start` taşır. Sıfırlanmazsa girintiyi `DERINLIK_VAR` değil
 * tarayıcı belirler ve her kademe ikişer kez içeri kaçar.
 */
export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const item = style({
  /*
    Halka satıra taşındı (bkz. ODAK_HALKASI). Bu, "odak göstergesini silme"
    kuralının ihlali değil: gösterge kaldırılmıyor, doğru kutuya çiziliyor.
    Regresyon testi: `FocusRingIsOnTheRowNotTheSubtree`.
  */
  ':focus-visible': {
    outline: 'none',
  },
})

export const row = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: vars.space[2],
    minInlineSize: 0,
    paddingInlineStart: `calc(${vars.space[2]} + var(${DERINLIK_VAR}, 0) * ${adim})`,
    paddingInlineEnd: vars.space[3],
    borderRadius: vars.radius.md,
    cursor: 'pointer',
    /*
      Global reset çift dokunuş gecikmesini yalnız `button`/`a`/`input` için
      kaldırıyor; satır bir `<div>` ve o listede yok. Onsuz mobilde her kategori
      seçimi 300 ms geç açılırdı.
    */
    touchAction: 'manipulation',

    selectors: {
      [`${item}:focus-visible > &`]: ODAK_HALKASI,
    },
  },

  variants: {
    variant: {
      sidebar: { minBlockSize: vars.control.height.sm },
      panel: { minBlockSize: vars.control.height.md },
      compact: { minBlockSize: vars.control.height.sm, gap: vars.space[1] },
    },

    selected: {
      /**
       * Seçim yalnız renkle değil: zemin **ve** kalınlaşan yazı birlikte. İkisi
       * de görsel; ekran okuyucunun cevabı `aria-selected`'tan gelir.
       */
      true: {
        background: vars.color.selection.bg,
        fontWeight: vars.font.weight.semibold,
      },
      /** Hover yalnız seçili olmayanda: seçili satır imlecin altında kimlik değiştirmez. */
      false: {
        ':hover': { background: vars.color.table.rowHover },
      },
    },

    passive: {
      /**
       * Pasif kategori **solar ama gizlenmez** — özniteliklerini düzenlemek onu
       * yeniden yayına almanın ilk adımı, dolayısıyla yönetim ekranında
       * erişilebilir kalmalı. Solma `opacity` ile değil `text.muted` ile: ölçü
       * uydurmak yerine token, ve sayaç da onunla birlikte sönmüş olmaz.
       */
      true: { color: vars.color.text.muted },
      false: {},
    },
  },
})

/**
 * Ok kutusu.
 *
 * 1,5rem (24 piksel) genişlik, satır yüksekliğince uzar: 24×44'lük hedef,
 * WCAG 2.5.8'in AA eşiğini karşılar. Brifingin 44×44 kuralına çıkarılmadı çünkü
 * ok yalnız **kapatmak** için gerekli — açmak için satırın kendisi (44 piksel)
 * yetiyor, klavyede ok tuşları var. 44 piksellik bir ok kolonu ise dar kolonda
 * her kademede etiketten yer çalardı.
 */
export const toggle = style({
  display: 'flex',
  alignSelf: 'stretch',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  inlineSize: vars.space[6],
  borderRadius: vars.radius.sm,
  color: vars.color.text.muted,

  ':hover': {
    background: vars.color.action.ghost.hover,
    color: vars.color.text.primary,
  },
})

/** Yaprakta ok yok ama yeri var: etiketler kademe içinde aynı hizada kalsın. */
export const togglePlaceholder = style({
  inlineSize: vars.space[6],
  flexShrink: 0,
})

export const chevron = recipe({
  base: {
    transition: `transform ${vars.duration.fast} ${vars.ease.standard}`,
  },

  variants: {
    open: {
      true: { transform: 'rotate(90deg)' },
      false: {},
    },
  },
})

/**
 * Etiket kalan yeri alır ve uzun kategori adı satırı taşırmak yerine kırpılır.
 * Kırpma yalnız görsel: `text-overflow` metni DOM'dan silmez, düğümün
 * erişilebilir adı tam etiketi taşımaya devam eder.
 */
export const label = style({
  flex: 1,
  minInlineSize: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const count = style({
  flexShrink: 0,
  color: vars.color.text.muted,
  fontVariantNumeric: 'tabular-nums',
  /* Seçili satırın `semibold`'u sayıya bulaşmasın: vurgulanan kategori adı. */
  fontWeight: vars.font.weight.regular,
})

/** Pasiflik ikonu (`sidebar`/`compact`). Anlamı yanındaki gizli metin taşır. */
export const passiveIcon = style({
  display: 'flex',
  flexShrink: 0,
  color: vars.color.text.muted,
})

/** Pasiflik rozeti (`panel`). */
export const badgeSlot = style({
  flexShrink: 0,
})

/**
 * Görsel olarak gizli, erişilebilirlik ağacında açık.
 *
 * `visibility: hidden` veya `display: none` **kullanılmıyor**: ikisi de alt ağacı
 * erişilebilir ad hesabından siler ve "Pasif" ile "ilan" düğümün adından
 * düşerdi. SidebarNav, StatCard, Checkbox ve Spinner'daki `visuallyHidden` ile
 * birebir aynı.
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
