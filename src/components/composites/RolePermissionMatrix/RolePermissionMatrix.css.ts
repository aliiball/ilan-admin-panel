import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const root = style({
  display: 'grid',
  gap: vars.space[3],
  width: '100%',
})

/**
 * Görsel olarak gizli, erişilebilirlik ağacında açık.
 *
 * `visibility: hidden` veya `display: none` **kullanılmıyor**: ikisi de alt ağacı
 * erişilebilir ad hesabından siler. Bu repoda Button'ın `loading` durumu tam
 * olarak bunu yapıp butonu adsız bırakmıştı; buradaki bedeli daha ağır olurdu —
 * hücre işaretleri ve caption dışında ekran okuyucusuna anlatacak bir şey yok.
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

/**
 * Yatay kaydırma kabı: 320 pikselde izin sütunu artı dört rol sütunu sığmaz.
 * Tablo kesilmez, kaydırılır.
 *
 * `isolation: isolate` bilinçli: içerideki yapışkan izin sütunu `z.sticky`
 * kullanıyor ve bu kap olmasa sayfanın kendi yapışkan çubuklarıyla (AppShell'in
 * TopBar'ı, BulkActionBar'ın `floating` varyantı) aynı yığın bağlamında yarışırdı.
 * Yeni bağlam, matrisin z-index'ini matrisin içinde tutar.
 */
export const scroller = style({
  width: '100%',
  /*
    `position: relative` — GÖRSEL DEĞİL, KAPSAMA İÇİN. Kaldırmayın.

    Faz 3'te ölçüldü: 320 pikselde sayfa 604 piksele genişliyordu ve sebebi
    tablo DEĞİLDİ (tablo bu kabın içinde düzgünce kırpılıyor). Suçlu, hücrelerdeki
    `Checkbox`'ların `hideLabel` etiketleri: `Checkbox_visuallyHidden` `position:
    absolute` + `width: 1px` + `clip: rect(0,0,0,0)`.

    **`overflow: hidden`, kapsayan bloğu kendisi OLMAYAN mutlak konumlu bir
    torunu kırpmaz.** Bu kap `position: static` olduğu sürece o span'lerin
    kapsayan bloğu değildi; span'ler 640 pikselik tablonun içindeki statik
    yerlerine göre konumlanıp (en sağdaki `left: 603`) kabın dışına taşıyor ve
    viewport'un kaydırma alanını 604'e çekiyorlardı. `clip` onları GÖRSEL olarak
    siliyor ama **kaydırma alanından silmiyor** — görünmez 1 pikseller sayfayı
    yatay kaydırtıyordu.

    Teşhis şöyle ayrıştı: kaba `contain: paint` vermek (kapsayan blok yapar)
    düzeltiyordu, `overflow: hidden` vermek **düzeltmiyordu** — mutlak konumlu
    torun kırpılmadığı için. `<tbody>`'yi silmek de düzeltiyordu (kutular gider).

    `position: relative` kabı kapsayan blok yapar, span'ler içeride kalır ve
    `overflow` onları gerçekten kırpar. Yapışkan sütunu etkilemez: sticky zaten
    kaydırma kabına göre konumlanır.

    Aynı desen `visuallyHidden` etiketi olan her kontrolü bir kaydırma kabına
    koyan herkesi ilgilendirir.
  */
  position: 'relative',
  /*
    `minWidth: 0` OLMADAN bu kap hiç kaydırmıyordu — Faz 3'te ekran görüntüsüyle
    ölçüldü ve yukarıdaki "tablo kesilmez, kaydırılır" sözü **yalandı**: 320
    pikselde kaydırma çubuğu çıkmıyor, SAYFA 604 piksele genişliyordu (yani
    matrisin kendi story'si tek başına yatay kaydırma üretiyordu; SettingsPage
    onu devralmıştı).

    Sebep: `root` bir grid ve bu kap onun öğesi; grid öğesinin `min-width`
    varsayılanı `auto`, yani **min-content**. Tablonun `minWidth:
    vars.container.sm`'i (40rem) min-content'i 640 piksele çiviliyor, öğe onun
    altına inemiyor ve `overflowX: auto` hiç devreye girmiyor — taşan şeyi kap
    değil sayfa taşıyor. `overflow` ancak kap KÜÇÜLEBİLDİĞİNDE kaydırma üretir.

    Testler bunu görmedi çünkü hiçbiri 320 pikselde sayfa genişliğini ölçmüyordu;
    vitest'in gerçek viewport'u 414 ve orada da taşıyordu, ama kimse sormuyordu.
  */
  minWidth: 0,
  overflowX: 'auto',
  isolation: 'isolate',
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  background: vars.color.bg.surface,
})

export const table = style({
  width: '100%',
  /*
    `collapse` değil: birleştirilmiş kenarlıkta kenarlık hücrenin değil tablonun
    mülkiyetindedir ve yapışkan izin sütunu kaydırılırken kenarlığını beraberinde
    taşımaz — sütun, altındaki hücrelerin üstünde kenarlıksız yüzer.
  */
  borderCollapse: 'separate',
  borderSpacing: 0,
  /*
    Tablonun taban genişliği. Altına düşülemez, dolayısıyla dar ekranda izin
    etiketleri kelime kelime kırılmak yerine kaydırma çubuğu belirir; geniş
    ekranda `width: 100%` devralır ve artan yeri izin sütunu alır.
  */
  minWidth: vars.container.sm,
  fontSize: vars.font.size.sm,
})

const headerCell = style({
  padding: `${vars.space[3]} ${vars.space[4]}`,
  borderBlockEnd: `1px solid ${vars.color.border.default}`,
  background: vars.color.bg.subtle,
  color: vars.color.text.secondary,
  fontWeight: vars.font.weight.semibold,
})

/** Rol sütunu başlığı. Dört rol adı kısa; sarmasına izin vermek sütunu gereksiz uzatır. */
export const roleHeader = style([
  headerCell,
  {
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
])

/** Sol üst köşe: izin sütununun başlığı. İzin sütunu yapışkan olduğu için o da yapışkan. */
export const cornerHeader = style([
  headerCell,
  {
    position: 'sticky',
    insetInlineStart: 0,
    zIndex: vars.z.sticky,
    textAlign: 'start',
  },
])

/**
 * İzin satırı başlığı. Yapışkan: dört rol sütunu arasında kaydırırken hangi
 * iznin hizasında olduğun görünmeye devam etmeli — 32 satırda bu bilgi
 * kaybolursa matris okunmaz olur.
 *
 * Zemin saydam değil (`bg.surface`): yapışkan hücre kaydırılan hücrelerin
 * üstünden geçer, arkası görünürse iki metin üst üste biner.
 */
export const permissionHeader = style({
  position: 'sticky',
  insetInlineStart: 0,
  zIndex: vars.z.sticky,
  padding: `${vars.space[2]} ${vars.space[4]}`,
  borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
  borderInlineEnd: `1px solid ${vars.color.border.subtle}`,
  background: vars.color.bg.surface,
  color: vars.color.text.primary,
  fontWeight: vars.font.weight.regular,
  lineHeight: vars.lineHeight.body,
  textAlign: 'start',
})

/**
 * Rol × izin hücresi.
 *
 * Zebra şerit ve satır vurgusu **bilerek yok**: ikisi de hücrenin zeminini
 * boyar ve `diff` varyantında zemin tek bilgi taşıyıcısıdır — değişen hücre.
 * Şeridin altında kalan bir "izin kaldırıldı" işareti, varyantın tek işini
 * yapamaz hale getirir. Satırı izlemeye dört sütunda hücre kenarlıkları yeter.
 */
export const cell = recipe({
  base: {
    padding: `${vars.space[2]} ${vars.space[3]}`,
    borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
    textAlign: 'center',
    verticalAlign: 'middle',
  },

  variants: {
    change: {
      unchanged: {},
      /** Varsayılanda yokken verilmiş izin. */
      added: { background: vars.color.success[50] },
      /** Varsayılanda varken alınmış izin. */
      removed: { background: vars.color.danger[50] },
    },
  },

  defaultVariants: { change: 'unchanged' },
})

/**
 * Hücre işareti — `readOnly` ve `diff` varyantlarında kutunun yerini alır.
 *
 * Durum yalnız renkle anlatılmıyor: her işarette ayrı bir ikon şekli ve yanında
 * görsel olarak gizli bir metin ("Var", "Yok (kaldırıldı)") bulunur.
 */
export const mark = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  variants: {
    state: {
      granted: { color: vars.color.primary[700] },
      denied: { color: vars.color.text.muted },
      added: { color: vars.color.success[700] },
      removed: { color: vars.color.danger[700] },
    },
  },

  defaultVariants: { state: 'denied' },
})

/** Değişiklik sayacı ile açıklama; dar ekranda sayaç üstte, açıklama altta kalır. */
export const diffBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: vars.space[3],
  fontSize: vars.font.size.sm,
})

export const diffCount = style({
  color: vars.color.text.primary,
  fontWeight: vars.font.weight.semibold,
  fontVariantNumeric: 'tabular-nums',
})

/**
 * Global reset yalnız `body`'nin margin'ini sıfırlıyor: `<ul>` hem kendi
 * margin'ini hem de 40 pikselik `padding-inline-start`'ını taşır. Üçünü birden
 * yazmak şart, yoksa açıklama sağa kaymış ve madde imli görünür.
 */
export const legend = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[4],
  listStyle: 'none',
  margin: 0,
  padding: 0,
  color: vars.color.text.secondary,
})

export const legendItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[1],
})

/** Aynı reset gerekçesi: `<p>` tarayıcı margin'iyle gelir ve grid `gap`'ine biner. */
export const savingBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  margin: 0,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
})
