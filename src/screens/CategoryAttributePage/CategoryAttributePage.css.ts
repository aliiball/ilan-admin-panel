import { style } from '@vanilla-extract/css'
import { vars } from '@/tokens/contract.css'

/**
 * Ağacın ve editörün yan yana geldiği eşik (brifing 3.5: "mobile drill-down,
 * desktop split").
 *
 * AppShell'in `GENIS_EKRAN`'ı ile aynı sayı, bilerek: bu ekran kabuğun
 * `<main>`'inde yaşıyor ve 48rem'de kabuk zaten menü kolonunu açıyor — ikinci
 * bir kolonu orada değil, bir kırılım sonra istemek gerekiyor.
 *
 * **Sorgu viewport'a bakar, kabın genişliğine değil** (repoda container query
 * yok). Yani bu eşik "sayfanın kabı 64rem" demiyor, "ekran 64rem" diyor;
 * 64rem'lik bir ekranda kabuğun rayı 16rem aldıktan sonra bu ekrana ~46rem
 * kalıyor ve ağaç + editör oraya sığıyor. Dar bir decorator kutusunda story
 * yine iki kolon çizer — bu bir hata değil, medya sorgusunun tanımı.
 */
const GENIS_EKRAN = 'screen and (min-width: 64rem)'

/**
 * Ağaç kolonunun genişliği.
 *
 * Token değil, çünkü token sözleşmesinde düzen ölçüsü yok: `space` 6rem'de
 * bitiyor, `container` 40rem'den başlıyor ve arası boş (AGENTS.md bu boşluğu
 * RolePermissionMatrix'te ölçtü; bu onun ikinci tekrarı). SidebarNav'ın
 * `RAY_GENISLIK`'i aynı sebeple elle yazılı.
 *
 * Sayı keyfî değil: en uzun alt kategori etiketi ("Depo ve Antrepo", bir kademe
 * girintili) okuyla, pasiflik ikonuyla ve sayacıyla birlikte tek satıra sığsın
 * diye seçildi. Sığmayan etiket CategoryTree'de üç noktaya kırpılıyor ve
 * birbirine benzeyen satırlar ("Turizm İmarlı" / "Ticari İmarlı") ayırt
 * edilemez oluyor.
 */
const AGAC_KOLONU = '18rem'

export const root = style({
  display: 'grid',
  gap: vars.space[4],
  color: vars.color.text.primary,
})

/**
 * Genel eylemler.
 *
 * Ağacın değil sayfanın üstünde: `onPublish` **argüman almıyor**, dolayısıyla
 * bir kapsam taşımıyor — onu seçili kategorinin başlığının yanına koymak,
 * sözleşmenin söylemediği bir kapsamı ("yalnız bu kategori yayınlanır") ima
 * ederdi.
 */
export const toolbar = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: vars.space[2],
})

export const split = style({
  display: 'grid',
  gap: vars.space[4],
  alignItems: 'start',

  '@media': {
    [GENIS_EKRAN]: {
      /*
        İkinci kolon `minmax(0, 1fr)`: `1fr`'in taban değeri `auto`, o da grid
        öğesinin otomatik minimum boyutu, o da içindeki tablonun `min-content`'i
        — yani dokuz sütunluk tablo kolonu kendi genişliğine zorlar ve sayfayı
        yatay kaydırtırdı. Sıfır taban, tablonun kendi kaydırma kabına
        (DataTable'ın `scroller`'ı) düşmesini sağlıyor. AppShell'in
        `auto minmax(0, 1fr)`'i ile aynı gerekçe.
      */
      gridTemplateColumns: `${AGAC_KOLONU} minmax(0, 1fr)`,
    },
  },
})

/**
 * Mobil drill-down: dar ekranda **bir** pano görünür, geniş ekranda ikisi de.
 *
 * Kural çifti bilerek aynı seçiciyle (0,3,0) yazıldı. Masaüstü kuralı yalnız
 * `&` üzerine yazılsaydı (0,1,0) mobil kuralın altında kalırdı ve seçili
 * kategoride ağaç **masaüstünde de** kaybolurdu — özgüllük eşit olduğu için
 * kazanan, sonra yayımlanan medya bloğu oluyor.
 *
 * `display: none` burada doğru araç: pano ekrandan tamamen kalkıyor, "yerini
 * koru, adını sakla" durumu değil (bkz. AGENTS.md'deki erişilebilir ad
 * ailesi). SidebarNav'ın rayı da dar ekranda tam olarak bu sebeple
 * `display: none`.
 */
export const treePane = style({
  display: 'grid',
  gap: vars.space[3],
  alignContent: 'start',
  minInlineSize: 0,

  selectors: {
    [`${root}[data-mobil-pano='detay'] &`]: { display: 'none' },
  },

  '@media': {
    [GENIS_EKRAN]: {
      selectors: {
        [`${root}[data-mobil-pano='detay'] &`]: { display: 'grid' },
      },
    },
  },
})

/**
 * Detay panosu: öznitelik listesi + editör.
 *
 * `minInlineSize: 0` **şart** ve doğru tarafta: bu pano metni saran, kaydıran
 * taraf; ağaç kolonu ise ölçüsü verilmiş taraf. Sıfırlanmazsa dar ekranda tek
 * kolonlu grid'in öğesi `min-width: auto` ile tablonun `min-content`'i kadar
 * genişler ve 320 pikselde **sayfa** yatay kayar (tablonun kendi kaydırma kabı
 * varken).
 */
export const detailPane = style({
  display: 'grid',
  gap: vars.space[5],
  alignContent: 'start',
  minInlineSize: 0,

  selectors: {
    [`${root}[data-mobil-pano='agac'] &`]: { display: 'none' },
  },

  '@media': {
    [GENIS_EKRAN]: {
      selectors: {
        [`${root}[data-mobil-pano='agac'] &`]: { display: 'grid' },
      },
    },
  },
})

/** Geri düğmesi yalnız drill-down'da anlamlı: geniş ekranda iki pano da duruyor. */
export const backButton = style({
  justifySelf: 'start',

  '@media': {
    [GENIS_EKRAN]: { display: 'none' },
  },
})

/** Başlık ve yanındaki pasiflik rozeti. Rozet sığmazsa alta sarar, başlığı ezmez. */
export const paneHeading = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],
})

/**
 * Panonun `<h2>`'si.
 *
 * Ekranın `<h1>`'i **yok** — o PageHeader'ın, yani kabuğun işi; ekran kendi
 * kabuğunu render etmiyor. Bu yüzden en üst başlık `<h2>`, bölümler `<h3>`.
 *
 * Global reset yalnız `body`'nin margin'ini sıfırlıyor; `<h*>` hem margin hem
 * `font-size` varsayılanı taşır. Margin grid kabında `gap` token'ının üstüne
 * biner — dikey ritmi token'lar değil tarayıcı belirlerdi (PageHeader'ın
 * başlığında ölçüldü).
 *
 * `minInlineSize: 0` **başlıkta, rozette değil**: flex öğesinin `min-width: auto`
 * varsayılanı sabit genişlikli kutuyu (rozeti) korur; daralması gereken taraf
 * metni sarabilen taraftır. Ters yazılsaydı uzun kategori adı rozeti dışarı
 * iterdi (PageHeader'da piksel piksel ölçüldü).
 */
export const paneTitle = style({
  margin: 0,
  minInlineSize: 0,
  overflowWrap: 'anywhere',
  fontSize: vars.font.size.xl,
  lineHeight: vars.lineHeight.heading,
  fontWeight: vars.font.weight.semibold,
})

/** Bölümün `<h3>`'ü. Reset gerekçesi `paneTitle` ile aynı; ölçü ListingFacts'in bölüm başlığıyla eş. */
export const blockTitle = style({
  margin: 0,
  fontSize: vars.font.size.md,
  lineHeight: vars.lineHeight.heading,
  fontWeight: vars.font.weight.semibold,
})

export const block = style({
  display: 'grid',
  gap: vars.space[3],
  minInlineSize: 0,
})

/** Başlığın altındaki açıklama. `<p>`'nin margin'i için bkz. `paneTitle`. */
export const note = style({
  margin: 0,
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
  overflowWrap: 'anywhere',
})

/** Tablodaki öznitelik hücresi: etiket üstte, anahtar altında. */
export const attributeCell = style({
  display: 'grid',
  gap: vars.space[1],
  minInlineSize: 0,
})

export const attributeLabel = style({
  fontWeight: vars.font.weight.medium,
  overflowWrap: 'anywhere',
})

/** Anahtar bir tanımlayıcı: mono yazı, seçilebilir, kırılabilir. */
export const attributeKey = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
  overflowWrap: 'anywhere',
})
