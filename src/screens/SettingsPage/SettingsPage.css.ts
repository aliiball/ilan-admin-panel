import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Ekranın kökü.
 *
 * Sayfa dolgusu **bilerek yok**: bu ekran bir kabuk değil, `AppShell`'in
 * `<main>`'inin içine konan gövdedir; dolguyu kabuk verir. Story'ler
 * `layout: 'padded'` ile o dolguyu taklit eder.
 */
export const root = style({
  display: 'grid',
  gap: vars.space[5],
  width: '100%',
  /*
    Metni saran taraf burası: daralması gereken sütun bu. Matrisin kendi
    scroller'ı `overflow-x: auto` taşıdığı için otomatik minimum boyutu zaten
    sıfıra düşüyor, ama sekme paneli ile açıklama metinleri bu zincire dahil
    değil — onları 320 pikselde daraltan şey bu satır.
  */
  minWidth: 0,
})

/** Sekme panelinin içi. Aynı `minWidth: 0` gerekçesi. */
export const section = style({
  display: 'grid',
  gap: vars.space[4],
  minWidth: 0,
})

/**
 * Global reset yalnız `body`'nin margin'ini sıfırlıyor: yazdığımız `<h2>`
 * tarayıcı varsayılan margin'iyle gelir ve grid kabında o margin `gap`
 * token'ının üstüne biner — dikey ritmi token'lar değil tarayıcı belirler.
 */
export const heading = style({
  margin: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
})

/** Aynı reset gerekçesi `<p>` için de geçerli. */
export const sectionDescription = style({
  margin: 0,
  /* Okuma ölçüsü: 40rem'den uzun satır göz için takip edilemez hale gelir. */
  maxWidth: vars.container.sm,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
  /*
    `break-word` değil: flex/grid öğesinin otomatik minimum boyutu `min-content`
    ve `break-word` min-content'i değiştirmez, `anywhere` değiştirir.
  */
  overflowWrap: 'anywhere',
})

/**
 * "Değişiklikleri gözden geçir" anahtarının kutusu.
 *
 * İpucu metni anahtarın **kardeşi**, `SwitchProps.description`'ı değil: Base UI
 * Switch'in gizli input'u sarmalayan `<label>`'ı buluyor ve `aria-labelledby`'yi
 * ona bağlıyor — `description` verilseydi anahtarın erişilebilir adı "Değişiklikleri
 * gözden geçir Açıkken taslağınız kayıtlı izinlerle karşılaştırılır…" olurdu.
 * PromotionFlagsPanel kayıt özetini tam bu yüzden kendi elementine koydu.
 */
export const reviewToggle = style({
  display: 'grid',
  gap: vars.space[1],
  minWidth: 0,
  padding: vars.space[3],
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  background: vars.color.bg.subtle,
})

export const reviewHint = style({
  margin: 0,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
  overflowWrap: 'anywhere',
})

/** Tema grupları: kendi teması ve sistem varsayılanı alt alta. */
export const themeGroups = style({
  display: 'grid',
  gap: vars.space[5],
  minWidth: 0,
})

/**
 * Ad–değer çifti: yetkisi olmayan kullanıcıya sistem varsayılanı **okunur**
 * gösterilir (kilitli kontrol olarak değil).
 *
 * Üç reset birden gerekiyor ve ikisi farklı özellikten geliyor: `<dl>` kendi
 * margin'ini taşır, `<dd>` ise 40 piksellik **`margin-inline-start`** — `<ul>`
 * ile aynı sayı ama farklı özellik, dolayısıyla "padding'i sıfırla" reçetesi
 * onu düzeltmez. Sıfırlanmazsa değer teriminden 40 piksel sağda başlar ve dikey
 * ritmi `gap` değil tarayıcı belirler.
 */
export const fact = style({
  display: 'grid',
  gap: vars.space[1],
  margin: 0,
  minWidth: 0,
})

export const factTerm = style({
  margin: 0,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
})

/** `margin: 0` `<dd>`'nin `margin-inline-start`'ını da kapsar. */
export const factValue = style({
  margin: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size.md,
  overflowWrap: 'anywhere',
})

/** Kaydet / Varsayılana dön çubuğu. Sekmelerin dışında: taslak sekme değiştirince kaybolmaz. */
export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space[3],
  paddingBlockStart: vars.space[4],
  borderBlockStart: `1px solid ${vars.color.border.subtle}`,
})

/**
 * `minWidth: 0` **metni saran** tarafta; buton kutusuna asla.
 *
 * Flex öğesinin `min-width: auto` varsayılanı eylem kutusunu "en geniş butonun
 * altına inmekten koruyan şey"dir: sıfırlanırsa shrink orantılı dağılır, kutu
 * butondan dar kalır ve buton dışarı taşar — yani önlemeye çalıştığı yatay
 * kaydırmayı üretir. Daralması gereken taraf metindir, çünkü sarabilen odur.
 */
export const dirtyNote = style({
  margin: 0,
  minWidth: 0,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  overflowWrap: 'anywhere',
})

export const actionButtons = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[2],
})

/* ────────────────────────────────────────────────────────────────────────────
   Yükleme iskeleti — ölçü koruyan (brifing 2.1: layout shift yok)
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Sekme şeridinin iskeleti — iki sekme kadar yer tutar.
 *
 * Gerçek `Tabs` şeridinin altındaki kenarlığı da taklit ediyor: veri gelince
 * şerit ne yatay ne dikey zıplasın.
 */
export const tabsSkeleton = style({
  display: 'flex',
  gap: vars.space[4],
  paddingBlockEnd: vars.space[3],
  borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
})

/**
 * Başlığın iskelet hâlinin kabı.
 *
 * `Skeleton`'ın `height: 1em`'i gerçek `<h2>`'nin satır kutusundan **kısadır**
 * (xl + heading satır yüksekliği) ve veri gelince başlık zıplardı. Kap `heading`
 * ile aynı `fontSize`'ı alıp `minBlockSize`'ı satır kutusuna sabitliyor: iskelet
 * ile gerçek başlık aynı yüksekliği kaplıyor. (`UserDetailPage.titleSkeleton`'ın
 * aynı gerekçesi.)
 */
export const headingSkeleton = style({
  display: 'block',
  fontSize: vars.font.size.xl,
  minBlockSize: `calc(1em * ${vars.lineHeight.heading})`,
})

/**
 * Matrisin yerini tutan blok: çok satırlı tabloyu taklit eden bordürlü kutu.
 *
 * İskeletin tek işi taklit ettiği bloğun ölçüsünü tutturmak; kenarlıklı yüzey
 * "burada bir tablo yükleniyor" der. `minWidth: 0` grid öğesinin min-content'e
 * çivilenmesini önler (matrisin scroller'ıyla aynı gerekçe).
 */
export const matrixSkeleton = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: vars.space[3],
  minWidth: 0,
  padding: vars.space[4],
  background: vars.color.bg.surface,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
})
