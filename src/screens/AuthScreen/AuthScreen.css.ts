import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Tek kırılım: 64rem (`container.lg`).
 *
 * Brifing 3.5 iki düzen istiyor — "centered card" ve "split brand panel" — ama
 * `AuthScreenProps`'ta düzen prop'u yok. İkisi bir tercih değil, **aynı ekranın
 * iki genişlikteki hâli**: 320 pikselde marka paneline yer yoktur, 1440'ta boş
 * yarım ekran vardır. Prop olsaydı çağıran telefonda `split` seçebilirdi ve
 * ekran onu çizemezdi. Bu yüzden kırılım medya sorgusudur, uydurma bir
 * `variant` değil.
 *
 * Eşik 64rem: AppShell'in `GENIS_EKRAN`'ı ile aynı sayı. 48rem'de (tablet)
 * kart hâlâ nefes alıyor ve panel iki kolonu da dar bırakırdı.
 */
const AYRIK_DUZEN = 'screen and (min-width: 64rem)'

/**
 * Ekranın kökü.
 *
 * `100dvh`, `100vh` değil: mobil tarayıcının adres çubuğu açılıp kapandıkça
 * `vh` yalan söyler ve giriş kartı zıplar. (AppShell aynı ölçüyü kullanıyor;
 * viewport yüksekliğinin token'ı yok, birim doğrudan yazılıyor.)
 */
export const root = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  minBlockSize: '100dvh',
  background: vars.color.bg.canvas,

  '@media': {
    /*
      Oran (`2fr 3fr`), sabit bir kolon genişliği değil: marka paneline `rem`
      vermek 1440 ile 2560 arasında ya panelin yanında boşluk ya da kartın
      altında sıkışma üretirdi. `minmax(0, ...)` grid öğesinin `min-width: auto`
      varsayılanını keser — uzun bir marka cümlesi kolonu şişirip sayfayı yatay
      kaydırtmasın.
    */
    [AYRIK_DUZEN]: { gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 3fr)' },
  },
})

/**
 * Marka paneli — yalnız geniş ekranda, tamamen dekoratif.
 *
 * `display: none` burada **doğru araç**: panel 64rem altında hiç görünmez ve
 * içinde odaklanılacak hiçbir şey yok. (AGENTS'ın "slot'u `none` ile gizleme"
 * uyarısı portal'sız çekmece çizen bir menü içindi — burada öyle bir çocuk yok.)
 *
 * İçeriği `aria-hidden`: 320 pikselde kaybolan bir metin bilgi taşıyamaz, aksi
 * hâlde mobil kullanıcı onu hiç görmezdi. Panel bu yüzden bilerek yalnız
 * dekorasyondur ve erişilebilirlik ağacında mobil ile masaüstü aynı şeyi duyar.
 *
 * Zemin `primary[700]` + `text.inverse`: bu ikili sistemde zaten var —
 * `action.primary` (birincil buton) aynı çifti kullanıyor, yani kontrast üç
 * temada da ölçülü (kurumsal mavi 8.6, nötr slate 10.8, sıcak amber 5.03 — üçü
 * de AA metin eşiği 4.5'in üstünde). `action.*` token'ı **kullanılmadı**: o slot
 * eylemlerin rengidir, panel bir eylem değil.
 */
export const brand = style({
  display: 'none',

  '@media': {
    [AYRIK_DUZEN]: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: vars.space[4],
      padding: vars.space[12],
      /* Metni saran taraf burası: uzun marka cümlesi kolonu şişirmek yerine sarmalı. */
      minInlineSize: 0,
      background: vars.color.primary[700],
      color: vars.color.text.inverse,
    },
  },
})

export const brandIcon = style({
  display: 'inline-flex',
  /* Renk `brand`'den miras alınır; ikon zeminin üstünde metinle aynı tonda durur. */
  color: 'inherit',
})

/**
 * Marka adı bir `<p>`, `<h*>` değil.
 *
 * Panel `aria-hidden` olduğu için başlık zaten taslağa girmezdi; `<h2>` yazmak
 * yalnız DOM'da `<h1>`'den önce duran ve hiçbir işe yaramayan bir başlık
 * bırakırdı. `margin: 0` şart — global reset yalnız `body`'yi sıfırlıyor,
 * `<p>`'nin `margin-block: 1em`'i flex kabında `gap` token'ının üstüne biner.
 */
export const brandTitle = style({
  margin: 0,
  fontSize: vars.font.size['3xl'],
  fontWeight: vars.font.weight.bold,
  lineHeight: vars.lineHeight.tight,
  /* `anywhere`, `break-word` değil: flex öğesinin min-content'ini yalnız o değiştirir. */
  overflowWrap: 'anywhere',
})

export const brandTagline = style({
  margin: 0,
  maxInlineSize: '44ch',
  fontSize: vars.font.size.md,
  lineHeight: vars.lineHeight.body,
  overflowWrap: 'anywhere',
})

/** Kartın kolonu. Kart dikeyde ve yatayda ortalanır — dar ekranda tek kolon budur. */
export const panel = style({
  display: 'grid',
  alignContent: 'center',
  justifyItems: 'center',
  minInlineSize: 0,
  padding: vars.space[4],

  '@media': {
    [AYRIK_DUZEN]: { padding: vars.space[8] },
  },
})

/**
 * Giriş / mesaj kartı.
 *
 * `overflow: hidden` **bilerek yok**: global `:focus-visible` outline'ı
 * `outlineOffset: 0.125rem` ile kutunun dışına taşıyor ve kırpan bir ata onu
 * yutuyor — kartın kenarına yaslanmış bir alanın odak halkası kesilirdi.
 * (AGENTS bu kombinasyonu ListingCard'da "muhtemel Faz 1/2 hatası" diye
 * işaretliyor; burada tekrarlanmadı.)
 *
 * `maxInlineSize: container.sm` (40rem): AGENTS'ın "`space[24]` (6rem) ile
 * `container.sm` (40rem) arası boş" dediği ölçü boşluğu burada **ikinci kez**
 * karşımıza çıktı. Bir giriş kartı ~24rem ister, o token yok; uydurma bir `rem`
 * yerine RolePermissionMatrix'in emsali izlendi (tabloya `container.sm`).
 */
export const card = style({
  display: 'grid',
  inlineSize: '100%',
  maxInlineSize: vars.container.sm,
  padding: vars.space[6],
  background: vars.color.bg.surface,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.xl,
  boxShadow: vars.shadow.md,

  '@media': {
    [AYRIK_DUZEN]: { padding: vars.space[8] },
  },
})

/** `<form>` tarayıcı varsayılanı margin taşır; sıfırlanmazsa kartın dolgusuna biner. */
export const form = style({
  display: 'grid',
  gap: vars.space[5],
  margin: 0,
  minInlineSize: 0,
})

export const headingBlock = style({
  display: 'grid',
  gap: vars.space[2],
  minInlineSize: 0,
})

/**
 * Ekranın `<h1>`'i.
 *
 * Diğer on ekran `<h2>` ile başlar çünkü onların `<h1>`'i PageHeader'ındır;
 * AuthScreen kabuğun dışında yaşayan tam sayfadır ve kendi `<h1>`'ini kendi
 * basar. Gerekçenin tamamı `AuthScreen.tsx`'in JSDoc'unda.
 */
export const heading = style({
  margin: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size['2xl'],
  fontWeight: vars.font.weight.bold,
  lineHeight: vars.lineHeight.heading,
  overflowWrap: 'anywhere',
})

export const description = style({
  margin: 0,
  maxInlineSize: '44ch',
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
  overflowWrap: 'anywhere',
})

/** İki alanın arası başlık–alan boşluğundan dar: alanlar tek bir küme okunmalı. */
export const fields = style({
  display: 'grid',
  gap: vars.space[4],
  minInlineSize: 0,
})

/**
 * Dört mesaj modunun ortak bloğu (oturum doldu / 403 / 404 / beklenmeyen hata).
 *
 * `<fieldset>` yok, dolayısıyla onun `min-inline-size: min-content` tuzağı da
 * yok: burada form kontrolü bulunmuyor, gruplanacak alan da.
 */
export const message = style({
  display: 'grid',
  justifyItems: 'center',
  gap: vars.space[3],
  textAlign: 'center',
  minInlineSize: 0,
})

/**
 * Mod ikonu — dekoratif, `aria-hidden`.
 *
 * Dördü de `text.muted`: ikonu moda göre renklendirmek, modlar arasındaki farkı
 * gören kullanıcı için renge bağlardı. Farkı başlık söylüyor; ikon yalnız
 * bloğa görsel bir çapa veriyor. (Grafik olduğu için borcu 3:1; `text.muted`
 * beyaz zeminde 6.15 ile fazlasıyla geçiyor.)
 */
export const messageIcon = style({
  display: 'inline-flex',
  color: vars.color.text.muted,
  marginBlockEnd: vars.space[1],
})

export const messageAction = style({
  marginBlockStart: vars.space[2],
})
