import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = style({
  display: 'grid',
  gap: vars.space[5],
  alignContent: 'start',
})

/**
 * Ekranın en üst başlığı `<h2>`.
 *
 * `<h1>` bilerek yok: ekran kabuğun (`AppShell` + `PageHeader`) içinde yaşıyor
 * ve sayfanın tek `<h1>`'i onun. Ekran kendi `<h1>`'ini basarsa sayfada iki
 * birinci seviye başlık olur.
 *
 * Global reset yalnız `body`'nin margin'ini sıfırlıyor; `<h2>` tarayıcı
 * varsayılan margin'ini taşır ve grid kabında `gap` token'ının üstüne biner.
 */
export const title = style({
  margin: 0,
  fontSize: vars.font.size['2xl'],
  lineHeight: vars.lineHeight.heading,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

/** Alt bölüm başlıkları `<h3>` — `<h2>`'nin altında, sıra atlamadan. */
export const sectionTitle = style({
  margin: 0,
  fontSize: vars.font.size.lg,
  lineHeight: vars.lineHeight.heading,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

/**
 * Üç düzen varyantı — brifing 3.5: single column, split view, wide queue.
 *
 * `split` yalnız bir ilan seçiliyken açılır: seçim yokken sağ kolon boştur ve
 * boş bir kolon için yer ayırmak her ekranda kalıcı bir delik demektir.
 *
 * Kırılımlar viewport'a bakar, kabın genişliğine değil (repoda container query
 * yok). Bu yüzden "mobilde tek kolon" iddiası play ile **ölçülemez** — düzenin
 * kendisi ekran görüntüsünün işi; play yalnız yatay taşmayı ölçer.
 *
 * `position: sticky` bilerek kullanılmadı: en yakın kaydırma kabına yapışır,
 * sayfaya değil — `AppShell`'in `<main>`'i mobilde kaydırma kabına dönünce
 * sessizce bozulurdu (AGENTS.md, ModerationActionBar'ın stickyBottom tuzağı).
 */
export const layout = recipe({
  base: {
    display: 'grid',
    gap: vars.space[5],
    alignItems: 'start',
    /** Single column: 320 piksel taban. */
    gridTemplateColumns: '1fr',
  },

  variants: {
    split: {
      true: {
        '@media': {
          /**
           * Split view: kuyruk solda, seçili ilan sağda.
           *
           * Kırılım 48rem (768 piksel) — `tablet768` viewport'unun tam kendisi.
           * Kırılımlar keyfi seçilmedi: brifing 3.5 bu ekrandan üç düzen istiyor
           * (single column / split view / wide queue) ve `preview.tsx` tam üç
           * dar-olmayan viewport tanımlıyor. Eşikler onlara oturuyor ki her
           * varyantın gözle bakılabilir bir story'si olsun.
           */
          'screen and (min-width: 48rem)': {
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 20rem)',
          },
          /** Wide queue (80rem / 1280 piksel): kuyruk nefes alır, yan panel genişler. */
          'screen and (min-width: 80rem)': {
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 28rem)',
          },
        },
      },
      false: {},
    },
  },

  defaultVariants: { split: false },
})

export const column = style({
  display: 'grid',
  gap: vars.space[4],
  alignContent: 'start',
  /** Metni saran taraf: daralması gereken bu kolon. */
  minWidth: 0,
})

/** `<p>` de tarayıcı margin'i taşır — reset yalnız `body`'yi sıfırlıyor. */
export const summary = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  fontVariantNumeric: 'tabular-nums',
})

/**
 * Kuyruk sıralı bir listedir, `<ol>` doğru element.
 *
 * `<ol>` margin'in **yanı sıra** 40 piksel `padding-inline-start` de taşır;
 * yalnız margin'i sıfırlamak listeyi sağa kaymış bırakır. Üçü birden gerekir.
 */
export const queue = style({
  display: 'grid',
  gap: vars.space[3],
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const item = style({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  gap: vars.space[3],
  alignItems: 'start',
})

/**
 * Kuyruk sırası rozeti.
 *
 * `listStyle: 'none'` işaretçiyi sildiği için sıra numarası görünür bir
 * elemana yazılıyor; ekran okuyucu tarafı `visuallyHidden` etiketle
 * ("Kuyruk sırası 3") kuruluyor — çıplak bir "3" tek başına bir şey söylemez.
 */
export const orderNumber = style({
  display: 'grid',
  placeItems: 'center',
  minWidth: '2rem',
  minHeight: '2rem',
  paddingInline: vars.space[1],
  borderRadius: vars.radius.full,
  background: vars.color.bg.subtle,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  fontVariantNumeric: 'tabular-nums',
})

export const itemBody = style({
  display: 'grid',
  gap: vars.space[2],
  minWidth: 0,
})

export const itemActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[2],
  alignItems: 'center',
})

/**
 * Kilit açıklaması.
 *
 * Kilit bir **yetki** durumu değil, geçici bir durum: sebebi söylenebilir olduğu
 * için burada `aria-disabled` + açıklama meşru. Yetkisi olmayan eylem
 * `disabled` verilmez, hiç render edilmez — ikisi karıştırılmamalı.
 */
export const lockNote = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[1],
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  overflowWrap: 'anywhere',
})

export const facts = style({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  gap: `${vars.space[1]} ${vars.space[3]}`,
  /** `<dl>` kendi margin'ini taşır. */
  margin: 0,
  fontSize: vars.font.size.sm,
})

export const factTerm = style({
  margin: 0,
  color: vars.color.text.muted,
  fontWeight: vars.font.weight.medium,
})

/**
 * `<dd>` 40 piksel **`margin-inline-start`** taşır — `<ol>`/`<ul>` ile aynı
 * sayı, farklı özellik: "padding'i sıfırla" reçetesi onu düzeltmez.
 */
export const factValue = style({
  margin: 0,
  color: vars.color.text.primary,
  overflowWrap: 'anywhere',
})

export const detailPanel = style({
  display: 'grid',
  gap: vars.space[4],
  alignContent: 'start',
  padding: vars.space[4],
  background: vars.color.bg.surface,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
  minWidth: 0,
})

export const detailActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[2],
})

/**
 * Yerini koruyarak gizler.
 *
 * `visibility: hidden` ve `display: none` alt ağacı erişilebilir ad hesabından
 * **siler**; bu teknik metni erişilebilirlik ağacında bırakır. SidebarNav,
 * CategoryTree, ListingFacts, Checkbox ve Spinner'daki `visuallyHidden` ile
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
