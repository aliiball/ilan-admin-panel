import { globalStyle, style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Kart görünümünün tablo görünümüne bıraktığı genişlik.
 *
 * AppShell'in menü kolonu kırılımıyla (`48rem`) ve FilterBar'ın geniş alan
 * kırılımıyla birebir aynı: ekranın kart/tablo kararı ile kabuğun menü kararı
 * aynı anda düşmezse, menü açılırken içerik hâlâ kart görünümünde kalır ve
 * kullanıcı iki farklı düzen değişimini arka arkaya görür.
 *
 * **Neden CSS, neden JS değil:** repoda container query yok ve `matchMedia`
 * ile karar veren tek bir component de yok. JS ile seçmek DOM'u viewport'a
 * bağımlı kılardı — test tarayıcısının gerçek viewport'u (414px) Storybook'un
 * viewport global'iyle aynı olmayabildiği için (AGENTS) `Desktop` story'sinin
 * play'i tabloyu hiç bulamazdı. CSS ile iki dal da DOM'da durur, `{ hidden:
 * true }` sorguları viewport'tan bağımsız ölçer; boyanan dalı medya sorgusu
 * seçer.
 */
const TABLO_KIRILIMI = 'screen and (min-width: 48rem)'

/**
 * `isolation` veya `transform` **yok** ve olmamalı: BulkActionBar'ın `floating`
 * varyantı `position: fixed` ile viewport'a çıpalanıyor; burada bir dönüşüm
 * (veya `filter`/`will-change`) yaratmak `fixed`'i bu kutuya bağlar ve çubuk
 * ekranın altı yerine listenin altında kalır.
 */
export const root = style({
  display: 'grid',
  gap: vars.space[5],
  /** Metni saran taraf budur; sabit genişlikli kontrol taşımıyor. */
  minWidth: 0,
})

export const header = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: vars.space[2],
})

/**
 * Ekranın en üst başlığı `<h2>`.
 *
 * `<h1>` yok: ekran kabuğu (AppShell/PageHeader) render etmiyor, sayfanın
 * `<h1>`'i kabuğundur. Global reset yalnız `body`'nin margin'ini sıfırlıyor —
 * `<h*>` tarayıcı margin'ini taşır ve grid `gap`'inin üstüne binerdi.
 */
export const heading = style({
  margin: 0,
  minWidth: 0,
  overflowWrap: 'anywhere',
  fontSize: vars.font.size['2xl'],
  lineHeight: vars.lineHeight.heading,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

/** `<p>` de tarayıcı margin'i taşır. */
export const summary = style({
  margin: 0,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
})

export const toolbar = style({
  display: 'grid',
  gap: vars.space[3],
  minWidth: 0,
})

/**
 * FilterBar'ın `numberRange` alanı (fiyat) 320 pikselde sayfayı yatay
 * kaydırtıyordu. Kusur kabın değil, **iki ayrı ızgaranın**.
 *
 * Ölçüldü (`MobileCards` play'i, Chromium 320px; kök 320 iken `scrollWidth` 587).
 * Daralmayı reddeden `fieldset` **değil** — o 286'ya oturuyor, `rangeGroup`'un
 * `minWidth: 0`'ı tutuyor. Zincir şöyle:
 *
 * 1. `FilterBar.rangeInputs` (`1fr 1fr`): track'lerin ikisi de **281'de
 *    tabanlanıyor** (281 + 8 + 281 = 570). `1fr` = `minmax(auto, 1fr)` ve `auto`
 *    minimumu, öğenin `min-width: auto` otomatik minimum boyutu, yani 281.
 * 2. `FieldShell.root` (örtük `auto` kolon): track'i (1) çözülünce 139'a düşen
 *    kabın içinde yine kontrolün `min-content`ine, 281'e açılıyor — bu yüzden
 *    yalnız (1)'i düzeltmek yetmiyor, taşma 587'den 445'e iniyordu. `FieldShell`
 *    kullanan her kontrol, `min-content`inden dar bir kapta aynı şeyi yapar.
 *
 * 281'in kaynağı `NumberInput`: `<input>`a `size` verilmediği için tarayıcı
 * varsayılanı (20 karakter ≈ 199px) içsel genişliğini yazıyor, iki `2.5rem`
 * basamak 80, kenarlık 2 ekliyor.
 *
 * **`NumberInput.input`'un `minWidth: 0`'ı bunu çözmez** ve tuzağın özü burada:
 * `min-width` bir `min-content` katkısını yalnız **tabanlar**, asla
 * **tavanlamaz** — kutunun daralmasına izin verir ama katkısı 199 kalır.
 * Track'i çiviye çakan şey öğenin `min-width: auto`'su; onu 0'a çekmek gerekiyor.
 * `UserDetailPage`in `Tabs` paneliyle birebir aynı mekanizma (orada track 629 →
 * 320), farklı component.
 *
 * `FilterBarProps`'ta `className` yok (`TabsProps`'ta da yoktu), dolayısıyla
 * ekranın elindeki tek araç yapısal seçici. Ev kuralı bu erişimi tanıyor:
 * `UserDetailPage.css.ts` ve `DateRangePicker.css.ts` (react-day-picker'ın iç
 * ağacı) aynı kalıbı kullanıyor. Seçici dar: reponun primitive'lerinde başka
 * `<fieldset>` yok, `<fieldset>`i yalnız FilterBar'ın `numberRange` dalı basıyor,
 * tek `<div>` çocuğu `rangeInputs` ızgarası. `> *` = iki `NumberInput`'un
 * `FieldShell` kökü (1. ızgara), `> * > *` = o kökün çocukları — etiket ve
 * kontrol kutusu (2. ızgara).
 *
 * **Kalıcı çözüm iki dosyada ve ikisi de bu turda yazılmadı — RAPOR EDİLDİ:**
 * `FilterBar.css.ts`'te `rangeInputs`'ın track'leri `minmax(0, 1fr)` olmalı,
 * `FieldShell.css.ts`'te `root`'a `gridTemplateColumns: 'minmax(0, 1fr)'`.
 * `numberRange` filtresi veren **her** FilterBar tüketicisi ~590 pikselin altında
 * aynı duvara çarpacak; FilterBar'ın kendi story'leri yatay taşmayı ölçmediği
 * için kusur bugüne kadar görünmedi.
 */
globalStyle(`${toolbar} fieldset > div > *, ${toolbar} fieldset > div > * > *`, {
  minWidth: 0,
})

/**
 * Arama kutusu satırın tamamına yayılmaz: 1440 pikselde tek bir metin kutusunun
 * bir metreye uzaması onu bulmayı kolaylaştırmıyor.
 */
export const searchField = style({
  maxWidth: vars.container.sm,
  minWidth: 0,
})

/* ── İki görünüm ─────────────────────────────────────────────────────────────
 * DataTable'ın `mobileMode` prop'u viewport'a **bakmıyor**: `"cards"` verilirse
 * 1440 pikselde de kart çiziyor (bkz. ListingListPage.tsx'teki not). Kart/tablo
 * kararını bu yüzden ekran veriyor ve iki dalı da render edip birini medya
 * sorgusuyla kapatıyor. `display: none` burada doğru araç — dal boyanmadığı gibi
 * erişilebilirlik ağacından da tamamen çıkmalı, yoksa ekran okuyucu kullanıcısı
 * aynı 12 ilanı iki kez gezer.
 */

export const cardsView = style({
  minWidth: 0,

  '@media': {
    [TABLO_KIRILIMI]: { display: 'none' },
  },
})

/**
 * `isolation: 'isolate'` — tablonun yapışkan başlığı ile ekranın yüzen çubuğu
 * aynı yığın bağlamında yarışmasın diye.
 *
 * DataTable'ın `stickyHeader`'ı `z.sticky` kullanıyor; BulkActionBar'ın
 * `floating` varyantı da `z.sticky` kullanıyor ve ikisi kök yığın bağlamında
 * eşitken kazananı DOM sırası belirliyor — yani çubuğun tablonun başlığının
 * üstünde kalması bir tesadüfe (JSX'te sonra yazılmış olmasına) bağlı kalırdı.
 * Yalıtım, başlığın z-index'ini bu kutunun içinde tutar. (RolePermissionMatrix'in
 * kaydırma kabına konan `isolation` ile aynı çözüm.)
 *
 * Çubuk bu kutunun **dışında** olduğu için `position: fixed`'i etkilenmiyor —
 * yalıtım yığın bağlamı yaratır, `fixed`'in çıpasını değiştirmez (onu yalnız
 * `transform`/`filter`/`will-change` yapar ve burada hiçbiri yok).
 */
export const tableView = style({
  display: 'none',
  minWidth: 0,
  isolation: 'isolate',

  '@media': {
    [TABLO_KIRILIMI]: { display: 'block' },
  },
})

/* ── Hücreler ─────────────────────────────────────────────────────────────── */

/**
 * İki satırlı hücre: üstte asıl değer, altta bağlamı.
 *
 * Sütun sayısı 13 (brifing 2.3'ün görünen veri listesi); her veriyi kendi
 * sütununa koymak tabloyu 320 pikselde okunmaz bir şeride çevirirdi.
 */
export const cellStack = style({
  display: 'grid',
  gap: vars.space[1],
  minWidth: 0,
})

export const cellPrimary = style({
  color: vars.color.text.primary,
  overflowWrap: 'anywhere',
})

export const cellSecondary = style({
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  overflowWrap: 'anywhere',
})

/** İlan no ve benzeri tanımlayıcılar: hizalansın diye sabit genişlikli yazı. */
export const identifier = style({
  fontFamily: vars.font.family.mono,
  color: vars.color.text.primary,
})

export const cover = style({
  display: 'block',
  inlineSize: vars.space[16],
  blockSize: vars.space[12],
  objectFit: 'cover',
  borderRadius: vars.radius.sm,
  background: vars.color.bg.subtle,
})

/**
 * Fotoğrafsız ilanın yer tutucusu.
 *
 * `text.muted`, `text.disabled` **değil**: bu bilgi taşıyan metin ve 4.5:1
 * borçlu. WCAG'in düşük kontrastı bağışladığı yer "etkin olmayan kontrol";
 * burası düpedüz bilgi. (ListingCard'ın "Görsel yok"unda ölçülen aynı hata.)
 */
export const coverMissing = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: vars.space[16],
  blockSize: vars.space[12],
  borderRadius: vars.radius.sm,
  background: vars.color.bg.subtle,
  color: vars.color.text.muted,
})

export const badgeList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[1],
})

/**
 * Görsel olarak gizli, erişilebilirlik ağacında açık.
 *
 * `visibility: hidden` veya `display: none` **kullanılmıyor**: ikisi de alt ağacı
 * erişilebilir ad hesabından siler ve fotoğrafsız hücrenin tek bilgisi ("Görsel
 * yok") ekran okuyucudan tamamen düşerdi — geriye adsız bir ikon kalırdı.
 * CategoryTree, SidebarNav, StatCard, Checkbox ve Spinner'daki `visuallyHidden`
 * ile birebir aynı.
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

/** Sayaç sütunları sağa hizalı; hizasız rakam sütunu karşılaştırılamaz. */
export const metric = style({
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.text.primary,
})

/** Değeri olmayan hücre: boş bırakmak "veri yok" ile "sıfır"ı karıştırır. */
export const empty = style({
  color: vars.color.text.muted,
})

/* ── Durum blokları ───────────────────────────────────────────────────────── */

export const stateBlock = style({
  display: 'grid',
  gap: vars.space[4],
  minWidth: 0,
})

/**
 * Yetkisiz durumun güvenli geri dönüş bağlantısı.
 *
 * `globals.css`'in `a` kuralı `text-decoration`'ı sıfırlamıyor; link class'ı
 * kendi kararını yazmalı. Burada altı çizili **bırakılıyor**: bu bağlantı bir
 * menü satırı değil, metin içinde tek başına duran bir çıkış yolu.
 */
export const backLink = style({
  justifySelf: 'center',
  color: vars.color.text.link,
  fontSize: vars.font.size.sm,

  ':hover': { color: vars.color.text.linkHover },
})
