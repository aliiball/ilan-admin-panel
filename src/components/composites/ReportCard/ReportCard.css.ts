import { createVar, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/**
 * Şiddetin rengi önce yerel değişkene yazılır; sol şerit onu okur.
 *
 * Değişken kartın kendisinde tanımlı olduğu için durum (`data-closed`) zemini
 * söndürdüğünde şeride dokunmaz: iki eksen iki ayrı kanalda kalır.
 */
const siddetRengi = createVar()

export const card = recipe({
  base: {
    display: 'grid',
    /** Şerit rengi hiçbir varyant uygulanmasa da tanımlı kalsın. */
    vars: { [siddetRengi]: vars.color.border.subtle },
    background: vars.color.bg.surface,
    border: `1px solid ${vars.color.border.subtle}`,
    /** Şiddet şeridi: `ListingCard`'ın `data-flagged` şeridiyle aynı kalınlık. */
    borderInlineStartWidth: '3px',
    borderInlineStartColor: siddetRengi,
    borderRadius: vars.radius.lg,
    /*
      `overflow: hidden` BİLEREK yok. Tıklanabilir bölge kartı dolduruyor ve
      global `:focus-visible` halkası `outline-offset` ile kutunun dışına
      taşıyor — kart kırpsaydı klavye kullanıcısı odağın nerede olduğunu
      göremezdi. Yuvarlatılması gereken tek şey küçük görsel; o kendi
      `border-radius`'unu taşıyor.
    */
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: vars.duration.fast,

    selectors: {
      /*
        Hover'da `borderColor` yazılamaz: dört kenarı birden ezip şiddet
        şeridini de nötre çevirirdi. Yalnız şerit olmayan üç kenar değişiyor.
      */
      '&[data-clickable]:hover': {
        borderBlockColor: vars.color.border.default,
        borderInlineEndColor: vars.color.border.default,
        boxShadow: vars.shadow.sm,
      },

      /**
       * Sonuçlanmış şikayet geri çekilir: zemin söner, ama şerit ve rozetler
       * aynen kalır — "kritik ama çözülmüş" hâlâ kritik görünmeli.
       */
      '&[data-closed]': {
        background: vars.color.bg.subtle,
      },
    },
  },

  variants: {
    severity: {
      /** Düşük şiddet şerit rengi almaz: kenarlık kartın kendi kenarlığı gibi durur. */
      low: { vars: { [siddetRengi]: vars.color.border.subtle } },
      medium: { vars: { [siddetRengi]: vars.color.info[600] } },
      high: { vars: { [siddetRengi]: vars.color.warning[600] } },
      critical: { vars: { [siddetRengi]: vars.color.danger[600] } },
    },

    variant: {
      /** Liste satırı: eylemler sağda, içerik solda. */
      compact: {
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'center',

        '@media': {
          /*
            320 pikselde içerik ile eylemlere kalan iki kolon da bir butondan
            dar kalıyor ve kart yatay kaydırıyordu; dar ekranda eylemler alt
            satıra iner (BulkActionBar ile aynı eşik ve aynı gerekçe).
          */
          'screen and (max-width: 30rem)': {
            gridTemplateColumns: 'minmax(0, 1fr)',
          },
        },
      },

      /** Detay: eylemler kendi satırında, ayrı çizgiyle. */
      detailed: {
        gridTemplateColumns: 'minmax(0, 1fr)',
      },

      /** Kuyruk: eylemler sağda ama içerikle üstten hizalı — kart uzayabilir. */
      queue: {
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'start',

        '@media': {
          'screen and (max-width: 30rem)': {
            gridTemplateColumns: 'minmax(0, 1fr)',
          },
        },
      },
    },
  },

  defaultVariants: { variant: 'compact', severity: 'low' },
})

/**
 * Kartın içeriği. Tıklanabilirse `<button>`, değilse `<span>` — ikisi de aynı
 * kutuyu kurar ki kart tıklanabilir olunca düzen kaymasın.
 */
export const clickRegion = recipe({
  base: {
    display: 'grid',
    alignContent: 'start',
    gap: vars.space[2],
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    textAlign: 'start',
    font: 'inherit',
    color: 'inherit',

    selectors: {
      'button&': { cursor: 'pointer' },
    },
  },

  variants: {
    variant: {
      compact: { padding: vars.space[3] },
      detailed: { gap: vars.space[3], padding: vars.space[4] },
      queue: { padding: vars.space[4] },
    },
  },

  defaultVariants: { variant: 'compact' },
})

export const head = recipe({
  base: {
    display: 'flex',
    gap: vars.space[3],
    minWidth: 0,
  },

  variants: {
    variant: {
      /** Başlık solda, rozetler sağda; dar ekranda rozetler alta sarar. */
      compact: { alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' },
      detailed: { alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' },
      /** Kuyrukta rozetler başlığın üstünde: şiddet ilk okunan şey. */
      queue: { flexDirection: 'column', alignItems: 'flex-start', gap: vars.space[2] },
    },
  },

  defaultVariants: { variant: 'compact' },
})

export const titleBlock = style({
  display: 'grid',
  gap: vars.space[1],
  flex: 1,
  minWidth: 0,
})

export const reason = style({
  color: vars.color.text.primary,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.tight,
  /** Uzun etiket yok ama sebep kullanıcı metniyle karışmasın diye taşma kırılıyor. */
  overflowWrap: 'anywhere',
})

export const reportNo = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  fontVariantNumeric: 'tabular-nums',
  overflowWrap: 'anywhere',
})

export const badges = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space[2],
  flexShrink: 0,
})

/** Şikayet edilen ilanın özeti; ilan gelmediyse aynı kutuda kimlik görünür. */
export const listingBox = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[3],
  minWidth: 0,
  padding: vars.space[2],
  background: vars.color.bg.subtle,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,

  selectors: {
    /*
      Sonuçlanmış kartın zemini zaten `bg.subtle`; kutu da öyle kalsaydı içinde
      kaybolurdu. Kart geri çekildiğinde kutu ilerler — ikisinin arasındaki fark
      korunuyor, kaybolan yalnız kartın sayfadaki vurgusu. (Testler bunu görmez,
      ekran görüntüsü görür.)
    */
    '[data-closed] &': {
      background: vars.color.bg.surface,
    },
  },
})

/** Görsel kendi köşesini yuvarlar: kart `overflow: hidden` yapamıyor (odak halkası). */
export const thumb = recipe({
  base: {
    flexShrink: 0,
    aspectRatio: '3 / 2',
    objectFit: 'cover',
    borderRadius: vars.radius.sm,
    background: vars.color.bg.disabled,
  },

  variants: {
    variant: {
      compact: { width: '3rem' },
      detailed: { width: '4.5rem' },
      queue: { width: '4.5rem' },
    },
  },

  defaultVariants: { variant: 'compact' },
})

export const listingText = style({
  display: 'grid',
  gap: vars.space[1],
  flex: 1,
  minWidth: 0,
})

export const listingTitle = style({
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  lineHeight: vars.lineHeight.tight,
  /** Başlık tek satırda kesilir: kart yüksekliği listede sabit kalsın. */
  display: '-webkit-box',
  WebkitLineClamp: 1,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  overflowWrap: 'anywhere',
})

export const listingNo = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  fontVariantNumeric: 'tabular-nums',
  overflowWrap: 'anywhere',
})

/** Eksik ilan bir hata değil, eksik bağlam — kırmızı değil, sönük. */
export const listingMissing = style({
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontStyle: 'italic',
})

export const compactMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[1],
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
})

/** Kuyruğun ikinci vurgusu: şikayetin ne zaman açıldığı ve kimde olduğu. */
export const queueMeta = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${vars.space[2]} ${vars.space[4]}`,
})

export const age = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space[1],
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
})

export const assignee = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  overflowWrap: 'anywhere',
})

export const time = style({
  color: vars.color.text.secondary,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})

/** Şikayetçinin kendi metni; uzun ve satır sonu barındırmayabilir. */
export const detail = style({
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
  overflowWrap: 'anywhere',
})

export const detailMissing = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  fontStyle: 'italic',
})

/**
 * Meta alanları. `auto-fit` ile dar ekranda tek kolona düşer; `<dl>` olamadığı
 * için (bkz. `MetaSatiri`) ızgarayı kutular kuruyor.
 */
export const metaGrid = style({
  display: 'grid',
  gap: vars.space[3],
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 11rem), 1fr))',
})

export const metaItem = style({
  display: 'grid',
  gap: vars.space[1],
  minWidth: 0,
})

export const metaLabel = style({
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
})

export const metaValue = style({
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  overflowWrap: 'anywhere',
})

/**
 * Çözüm notu. Neredeyse her zaman sonuçlanmış bir şikayette görünür — yani
 * neredeyse her zaman sönük zeminli bir kartın içinde; `listingBox` ile aynı
 * gerekçeyle o zaman öne çıkıyor.
 */
export const resolution = style({
  display: 'grid',
  gap: vars.space[1],
  padding: vars.space[3],
  background: vars.color.bg.subtle,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  color: vars.color.text.primary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
  overflowWrap: 'anywhere',

  selectors: {
    '[data-closed] &': {
      background: vars.color.bg.surface,
    },
  },
})

/** Eylemler tıklanabilir bölgenin kardeşi: iç içe etkileşimli element olmasın. */
export const actionsSlot = recipe({
  base: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: vars.space[2],
    flexShrink: 0,
  },

  variants: {
    variant: {
      compact: {
        padding: vars.space[3],
        paddingInlineStart: 0,

        '@media': {
          /** Alt satıra inince soldaki sıfır dolgu kenara yapıştırırdı. */
          'screen and (max-width: 30rem)': {
            paddingInlineStart: vars.space[3],
            paddingBlockStart: 0,
          },
        },
      },

      /** Detayda eylemler kendi satırında: karar, okunan metnin altında verilir. */
      detailed: {
        justifyContent: 'flex-end',
        padding: vars.space[3],
        borderBlockStart: `1px solid ${vars.color.border.subtle}`,
      },

      queue: {
        padding: vars.space[4],
        paddingInlineStart: 0,

        '@media': {
          'screen and (max-width: 30rem)': {
            paddingInlineStart: vars.space[4],
            paddingBlockStart: 0,
          },
        },
      },
    },
  },

  defaultVariants: { variant: 'compact' },
})
