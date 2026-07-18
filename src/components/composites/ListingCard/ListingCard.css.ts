import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

export const card = recipe({
  base: {
    display: 'grid',
    background: vars.color.bg.surface,
    border: '1px solid',
    borderColor: vars.color.border.subtle,
    borderRadius: vars.radius.lg,
    /*
      `overflow: hidden` KALIYOR: media kenardan kenara ve kartın köşe
      yuvarlaması onun kare köşelerini kırpmasıyla oluşuyor. Bunun yan etkisi
      olan "dışa taşan odak halkası yutuluyor" sorunu `clickRegion`'da halkayı
      İÇERİ alarak (negatif offset) çözülüyor — orada gerekçesi yazılı.
    */
    overflow: 'hidden',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: vars.duration.fast,

    selectors: {
      '&[data-clickable]:hover': {
        borderColor: vars.color.border.default,
        boxShadow: vars.shadow.sm,
      },
      /** Seçim yalnız renkle değil, kalın kenarlıkla da belli olur. */
      '&[data-selected]': {
        borderColor: vars.color.primary[700],
        boxShadow: `0 0 0 1px ${vars.color.primary[700]}`,
      },
      /** Riskli ilan sol kenardan işaretlenir; tabloyu tararken göze çarpar. */
      '&[data-flagged]': {
        borderInlineStartWidth: '3px',
        borderInlineStartColor: vars.color.danger[600],
      },
    },
  },

  variants: {
    /**
     * Kart üç sütuna kadar açılır: [seçim kutusu?] | tıklanabilir bölge | [eylemler?].
     *
     * Eylemler kartın kendi gridinde ayrı bir sütun: tıklanabilir bölge bir
     * `<button>` olduğunda `actions` onun İÇİNDE olamaz (iç içe etkileşimli
     * element geçersiz HTML + axe `nested-interactive`), bu yüzden butonun
     * kardeşi olarak sağda duruyor. `ReportCard` ile aynı desen.
     */
    selectable: { true: {}, false: {} },
    hasActions: { true: {}, false: {} },
  },

  compoundVariants: [
    { variants: { selectable: false, hasActions: false }, style: { gridTemplateColumns: '1fr' } },
    {
      variants: { selectable: true, hasActions: false },
      style: { gridTemplateColumns: 'auto 1fr' },
    },
    {
      variants: { selectable: false, hasActions: true },
      style: { gridTemplateColumns: '1fr auto' },
    },
    {
      variants: { selectable: true, hasActions: true },
      style: { gridTemplateColumns: 'auto 1fr auto' },
    },
  ],

  defaultVariants: { selectable: false, hasActions: false },
})

/** Kartın tıklanabilir kısmı. Seçim kutusu bunun dışında, kardeşi olarak durur. */
export const clickRegion = recipe({
  base: {
    display: 'grid',
    border: 'none',
    background: 'transparent',
    padding: 0,
    textAlign: 'start',
    minWidth: 0,
    font: 'inherit',
    color: 'inherit',

    selectors: {
      'button&': { cursor: 'pointer' },
      /*
        Odak halkası kartın İÇİNE çiziliyor (negatif offset), dışına değil.

        Tıklanabilir bölge kartı dolduruyor ve kartın `overflow: hidden`'ı
        (kenardan kenara görselin yuvarlak köşeleri için ŞART) global
        `:focus-visible` kuralının `outlineOffset: 0.125rem`'lik DIŞA taşan
        halkasını yutuyordu — klavye kullanıcısı odağın nerede olduğunu
        göremiyordu (Faz 3'te ekran görüntüsüyle doğrulandı). Görseli kırpan
        `overflow`'u kaldırmak yerine halkayı içeri alıyoruz: negatif offset ile
        halkanın dış kenarı butonun kutusuyla hizalanıyor, tamamı kırpma
        sınırının içinde kalıyor ve butonun çevresini eksiksiz sarıyor. Halka
        `outline` olduğu için içerikle görselin üstüne boyanıyor, gizlenmiyor.
        (`CategoryTree`'nin dar kolonda kullandığı aynı çözüm.)
      */
      'button&:focus-visible': {
        outline: `0.1875rem solid ${vars.color.focus.ring}`,
        outlineOffset: '-0.1875rem',
      },
    },
  },

  variants: {
    variant: {
      /**
       * Kuyrukta ve dar listede: yatay, küçük görsel.
       *
       * Body sütunu `minmax(0, 1fr)`, düz `1fr` DEĞİL: düz `1fr`'in tabanı
       * `min-content`'tir ve body'deki (boşluksuz fiyat gibi) değerler onu 320
       * pikselde media'nın yanına sığmayacak kadar geniş tutup içeriği kartın
       * `overflow: hidden`'ıyla kırptırırdı. Body'ye `minWidth: 0` yazmak bunu
       * çözmez — o yalnız öğenin katkısını tabanlar, tavanlayan izin kendisidir
       * (AGENTS: "NumberInput.input'a minWidth:0 yazmak bunu ÇÖZMEZ").
       */
      compact: { gridTemplateColumns: 'auto minmax(0, 1fr)', alignItems: 'stretch' },
      /** Detaylı liste: yatay, büyük görsel, tüm meta. Body sütunu yine `minmax(0, 1fr)`. */
      detailed: { gridTemplateColumns: 'auto minmax(0, 1fr)', alignItems: 'stretch' },
      /** Izgara: dikey, üstte görsel. */
      grid: { gridTemplateRows: 'auto 1fr' },
    },
  },

  defaultVariants: { variant: 'compact' },
})

export const media = recipe({
  base: {
    position: 'relative',
    flexShrink: 0,
    background: vars.color.bg.subtle,
    overflow: 'hidden',
  },
  variants: {
    variant: {
      compact: { width: '7rem' },
      /**
       * 11rem sabit; ama 320 pikselde bu genişlik body'ye durum rozetini
       * ("Onaylı / Yayında" ~9.5rem, `nowrap`) sığdıramayacak kadar yer bırakıyor
       * ve rozet kartın `overflow: hidden`'ıyla kırpılıyordu. Dar ekranda görsel
       * `compact` ölçüsüne iniyor (ReportCard'ın 30rem eşiğiyle aynı desen) —
       * viewport sorgusu, çünkü repoda container query yok.
       */
      detailed: {
        width: '11rem',
        '@media': {
          'screen and (max-width: 30rem)': { width: '7rem' },
        },
      },
      grid: { width: '100%', aspectRatio: '3 / 2' },
    },
  },
  defaultVariants: { variant: 'compact' },
})

export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
})

/** Fotoğrafsız ilan: kırık resim yerine açık bir "görsel yok" durumu. */
/**
 * "Görsel yok" bir yer tutucu **metni**, devre dışı bir kontrol değil: ilanın
 * fotoğrafsız olduğunu söyleyen tek işaret bu. `text.disabled` ile n-100 zemin
 * üstünde 4.34 kalıyordu (AA 4.5); `text.muted` ile 6.92 (sıcak amber 6.99).
 */
export const noPhoto = style({
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  height: '100%',
  minHeight: '5rem',
  color: vars.color.text.muted,
  gap: vars.space[1],
  fontSize: vars.font.size.sm,
  textAlign: 'center',
  padding: vars.space[2],
})

export const photoCount = style({
  position: 'absolute',
  insetBlockEnd: vars.space[1],
  insetInlineEnd: vars.space[1],
  paddingInline: vars.space[2],
  paddingBlock: '0.0625rem',
  background: 'rgb(15 23 42 / 0.72)',
  borderRadius: vars.radius.sm,
  color: vars.color.neutral[0],
  fontSize: vars.font.size.sm,
  fontVariantNumeric: 'tabular-nums',
})

export const body = style({
  display: 'grid',
  gap: vars.space[2],
  alignContent: 'start',
  padding: vars.space[4],
  minWidth: 0,
})

export const topRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space[3],
  /**
   * Dar kartta durum rozeti (`nowrap`, ~9.5rem) başlıkla aynı satıra sığmazsa
   * kendi satırına insin — başlığı sıfır piksele ezip yanında kalmak yerine.
   * Geniş kartta ikisi zaten yan yana; sarma yalnız gerçekten sığmayınca devreye
   * girer.
   */
  flexWrap: 'wrap',
})

export const titleBlock = style({
  display: 'grid',
  gap: '0.125rem',
  flex: 1,
  minWidth: 0,
})

export const title = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  lineHeight: vars.lineHeight.tight,
  /** Uzun başlık iki satırda kesilir; kart yüksekliği listede sabit kalır. */
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  /**
   * Boşluksuz uzun bir başlık dar kartta (media 11rem sabit, body'ye ~pikseller
   * kalıyor) `min-content`'e çivilenip kartın `overflow: hidden`'ıyla kırpılırdı.
   * `anywhere` `min-content`'i düşürür (flex/grid öğesinin otomatik minimumu),
   * `break-word` düşürmez — böylece içerik kırpılmak yerine sarar.
   */
  overflowWrap: 'anywhere',
})

export const listingNo = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
  fontVariantNumeric: 'tabular-nums',
  overflowWrap: 'anywhere',
})

export const meta = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${vars.space[1]} ${vars.space[3]}`,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const metaItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[1],
  minWidth: 0,
  /** Uzun ilçe/şehir adı dar kartta kırpılmasın, sarsın. */
  overflowWrap: 'anywhere',
})

export const price = style({
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  fontVariantNumeric: 'tabular-nums',
  /** "12.500.000 ₺" boşluk taşımaz; dar kartta ancak `anywhere` ile sarar. */
  overflowWrap: 'anywhere',
})

export const priceMissing = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.danger[800],
  overflowWrap: 'anywhere',
})

export const badges = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[1],
  alignItems: 'center',
})

export const moderationMeta = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${vars.space[1]} ${vars.space[3]}`,
  paddingBlockStart: vars.space[2],
  borderBlockStart: `1px solid ${vars.color.border.subtle}`,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

/** Durum rozetinin (StatusBadge) sağ üstteki yeri. Etkileşimsiz — butonun içinde kalır. */
export const statusSlot = style({
  display: 'flex',
  gap: vars.space[2],
  alignItems: 'center',
  flexShrink: 0,
})

/**
 * Eylemler tıklanabilir bölgenin (butonun) KARDEŞİ, çocuğu değil: iç içe
 * etkileşimli element olmasın (bkz. card recipe `hasActions`). Kartın grid'inde
 * en sağdaki sütun; üstten hizalı, sağ üstte durur.
 */
export const actionsSlot = style({
  display: 'flex',
  gap: vars.space[2],
  alignItems: 'center',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  alignSelf: 'start',
  flexShrink: 0,
  padding: vars.space[4],
  paddingInlineStart: 0,
})

export const selectionCell = style({
  display: 'flex',
  alignItems: 'flex-start',
  paddingInlineStart: vars.space[3],
  paddingBlockStart: vars.space[3],
})
