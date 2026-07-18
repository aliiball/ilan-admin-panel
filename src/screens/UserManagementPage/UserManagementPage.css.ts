import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Ekranın kökü.
 *
 * `<section>` bilerek **adsız**: adı olan bir `section` `region` landmark'ı
 * doğurur ve ekran zaten kabuğun (`AppShell`'in `<main>`'i) içinde yaşayacak.
 * AGENTS'ın "olmayan bir landmark eklemek `landmark-unique`'i kendi ürettiğimiz
 * gürültüyle doldurur" kuralı burada da geçerli — başlık `<h2>` olarak zaten
 * ekranın adını söylüyor.
 */
export const page = style({
  display: 'grid',
  gap: vars.space[4],
  alignContent: 'start',
  /** Metni saran taraf bu; daralması gereken de bu. Bkz. `identity`. */
  minWidth: 0,
})

/**
 * Ekranın en üst başlığı `<h2>` — `<h1>` kabuğun (`PageHeader`) işi ve ekran
 * kabuk render etmiyor.
 *
 * Global reset yalnız `body`'nin margin'ini siliyor; `<h2>` tarayıcı
 * varsayılanını taşır ve grid `gap`'inin üstüne binerdi.
 */
export const title = style({
  margin: 0,
  fontSize: vars.font.size['2xl'],
  lineHeight: vars.lineHeight.heading,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

/**
 * Yetkisizlikten çıkış bağlantısı.
 *
 * `globals.css`'in `a` kuralı `color` ve `textUnderlineOffset` veriyor ama
 * `text-decoration`'ı sıfırlamıyor — burada altı çizili **kalmalı**: bu bir menü
 * satırı değil, gövde metni içinde tek başına duran bir bağlantı ve altı çizgi
 * onun tek görsel işareti. `justifySelf` olmadan grid öğesi satırı kaplar ve
 * tıklama hedefi metnin çok ötesine taşar.
 */
export const backLink = style({
  justifySelf: 'start',
})

/**
 * Tablo görünümü — yalnız ≥48rem.
 *
 * `DataTable.mobileMode` bir **medya sorgusu değil**, düz bir prop: component
 * `cards` verildiğinde viewport'a bakmadan kart dalına giriyor (ölçüldü,
 * `DataTable.tsx`). Sayfanın viewport'u okumasının yolu da yok (repoda container
 * query yok, component saati/ortamı kendi okumamalı). Bu yüzden düzen seçimi
 * CSS'e bırakıldı: iki görünüm de DOM'da, ama **her viewport'ta yalnız biri
 * erişilebilirlik ağacında** — `display: none` alt ağacı addan da siler, yani
 * ekran okuyucu kullanıcısı listeyi iki kez duymaz. Aynı kalıbın repodaki
 * öncülü SidebarNav'ın ray + çekmece ikilisi.
 *
 * Maliyeti bilerek kabul edildi ve sınırlandı: **yalnız dolu liste** iki kez
 * çiziliyor. Yükleme iskeleti, boş durum ve hata bloğu tek bir DataTable'dan
 * geliyor (bkz. `.tsx`) — onların kart hâli zaten yok.
 */
export const tableView = style({
  display: 'none',

  '@media': {
    'screen and (min-width: 48rem)': {
      display: 'block',
    },
  },
})

/** Kart görünümü — yalnız <48rem. `tableView`'ın simetriği; gerekçe orada. */
export const cardView = style({
  display: 'block',

  '@media': {
    'screen and (min-width: 48rem)': {
      display: 'none',
    },
  },
})

/**
 * Kullanıcı hücresi: avatar + ad + firma. `onUserOpen` bağlı olduğu için
 * `<button>`.
 *
 * `<tr onClick>` (DataTable'ın `onRowClick`'i) bilerek kullanılmadı: satırın
 * kendisi klavyeyle odaklanamaz ve ekran okuyucuya tıklanabilir olduğunu
 * söylemez. Buton olduğunda tarayıcı varsayılanları (kenarlık, zemin, dolgu,
 * ortalanmış metin, kendi yazı tipi) sıfırlanmalı — aksi hâlde ad bir form
 * düğmesine benzer ve tipografi token'lardan değil tarayıcıdan gelir.
 */
export const userButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[3],
  minWidth: 0,
  width: '100%',
  border: 'none',
  margin: 0,
  padding: 0,
  background: 'transparent',
  font: 'inherit',
  color: 'inherit',
  textAlign: 'start',
  cursor: 'pointer',
  /** Odak halkası (`:focus-visible`, globals.css.ts) kutunun köşesini takip etsin. */
  borderRadius: vars.radius.md,
})

/**
 * Avatar'ın kabı. Var olma sebebi görsel değil erişilebilirlik: `aria-hidden`'ı
 * taşıyan element bu (gerekçe `.tsx`'te).
 */
export const avatarSlot = style({
  display: 'flex',
  flexShrink: 0,
})

/**
 * Ad + firma bloğu.
 *
 * `minWidth: 0` **metni saran tarafta**: flex öğesinin `min-width: auto`
 * varsayılanı uzun bir kurum adını `min-content`e kilitler ve hücreyi şişirir.
 * Sabit genişlikli avatar'a asla yazılmaz — o küçülmemeli.
 */
export const identity = style({
  display: 'grid',
  gap: vars.space[1],
  minWidth: 0,
})

export const userName = style({
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.primary,
  /** `break-word` min-content'i değiştirmez, `anywhere` değiştirir. */
  overflowWrap: 'anywhere',
})

export const userCompany = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  overflowWrap: 'anywhere',
})

/** E-posta ve telefon alt alta; ikisi de uzun ve ikisi de kırılabilmeli. */
export const contact = style({
  display: 'grid',
  gap: vars.space[1],
  minWidth: 0,
  overflowWrap: 'anywhere',
})

export const contactSecondary = style({
  color: vars.color.text.secondary,
  fontVariantNumeric: 'tabular-nums',
})

/**
 * Sayaçlar hizalı okunsun: rakamlar eşit genişlikte.
 *
 * `whiteSpace: 'nowrap'` **bilerek yok**: tabloda satırı tek çizgide tutardı ama
 * aynı hücre 320 piksellik kartta da çiziliyor (tek sütun listesi, iki düzen) ve
 * orada kırılamayan bir dize kartı taşırırdı. Boşluktan kırılmak kabul edilebilir;
 * yatay kaydırma değil.
 */
export const numeric = style({
  fontVariantNumeric: 'tabular-nums',
})

/**
 * "Hiç giriş yapmadı", "Admin değil", "Açık şikayet yok" — bir değer değil,
 * değerin **yokluğu**; bu yüzden cümleyle söyleniyor, boş bırakılmıyor ("veri
 * gelmedi" ile "yok" aynı şey değil).
 *
 * `text.muted`, `text.disabled` değil: bu bilgi taşıyan metin, devre dışı bir
 * kontrol değil (AGENTS: `text.disabled` bilgi taşıyan metinde AA'dan düşüyor).
 */
export const missing = style({
  color: vars.color.text.muted,
  fontStyle: 'italic',
})

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[2],
})

/* ── Mobil kart ──────────────────────────────────────────────────────────── */

export const card = style({
  display: 'grid',
  gap: vars.space[3],
  padding: vars.space[4],
  background: vars.color.bg.surface,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
  minWidth: 0,
})

/**
 * Kartın ad–değer çiftleri.
 *
 * `<dl>`'nin kendi margin'i ve `<dd>`'nin **40 piksellik**
 * `margin-inline-start`'ı burada sıfırlanıyor: sıfırlanmasa değerler
 * terimlerinden 40 piksel sağda başlar ve dikey ritmi grid `gap`'i değil
 * tarayıcı belirlerdi.
 */
export const cardFacts = style({
  display: 'grid',
  gap: vars.space[2],
  margin: 0,
  padding: 0,
})

export const cardFact = style({
  display: 'grid',
  gap: 0,
  minWidth: 0,
})

export const cardFactLabel = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

export const cardFactValue = style({
  margin: 0,
  minWidth: 0,
  color: vars.color.text.primary,
  overflowWrap: 'anywhere',
})

/** Rol atama dialog'unun gövdesi: tek bir Select, nefes alacak yerle. */
export const roleDialogBody = style({
  display: 'grid',
  gap: vars.space[3],
  minInlineSize: 0,
})
