import { createVar, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '@/tokens/contract.css'

/**
 * Grafik alanının yüksekliği önce bu değişkene yazılır; grafiğin kutusu onu
 * `blockSize` (sabit), durum kutusu ise `minBlockSize` (alt sınır) olarak okur.
 *
 * Tek kaynak olması şart: `md`nin yüksekliği iki yerde ayrı yazılsaydı
 * loading → success geçişinde kart o farkın kadar zıplardı ve fark gözle
 * görülmeyecek kadar küçükse (bir piksel) kimse sebebini bulamazdı.
 */
const grafikYuksekligi = createVar()

export const root = recipe({
  base: {
    display: 'grid',
    gap: vars.space[4],
    padding: vars.space[5],
    background: vars.color.bg.surface,
    border: `1px solid ${vars.color.border.subtle}`,
    borderRadius: vars.radius.lg,
    /*
      Kart dashboard ızgarasının çocuğu olur. Izgara öğesinin varsayılan
      `min-width: auto` değeri "en geniş çocuğun taban genişliği" demektir;
      grafik bir kez genişleyince kart bir daha küçülemez ve 320 pikselde sayfa
      yatay kayar. ResponsiveContainer'ın küçülebilmesi buna bağlı.
    */
    minWidth: 0,
  },

  variants: {
    /*
      Ham `rem`: token sözleşmesinde grafik yüksekliği yok ve `container`
      token'ları genişlik ölçüsü — yüksekliğe bağlamak adı yanlış bir token
      kullanmak olurdu. (Aynı istisna `EmptyState`'in `minHeight`'ında ve
      `ListingCard`'ın görsel genişliklerinde de var.)

      Değerler işe göre: `sm` eksensiz mini eğri, `md` eksenli çoğu grafik,
      `lg` dashboard'ın ana grafiği. `sm`de eksen etiketi için yer yok — zaten
      olmamalı, mini eğri trendi gösterir, sayıyı `StatCard` söyler.
    */
    height: {
      sm: { vars: { [grafikYuksekligi]: '8rem' } },
      md: { vars: { [grafikYuksekligi]: '14rem' } },
      lg: { vars: { [grafikYuksekligi]: '20rem' } },
    },
  },

  defaultVariants: { height: 'md' },
})

/** Başlık solda, araç çubuğu sağda; dar ekranda çubuk alt satıra sarar. */
export const header = style({
  display: 'flex',
  alignItems: 'start',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: vars.space[3],
})

export const headings = style({
  display: 'grid',
  gap: vars.space[1],
  /** Uzun başlık araç çubuğunu ezmesin, kendi içinde sarsın. */
  minWidth: 0,
  flex: 1,
})

export const title = style({
  /*
    `<p>`nin tarayıcı varsayılanı `margin-block: 1em`; global reset yalnız
    body'nin margin'ini sıfırlıyor. Sıfırlanmazsa bu margin grid `gap`'inin
    üstüne biner ve başlık ile açıklama arasındaki ritmi token değil tarayıcı
    belirler.
  */
  margin: 0,
  color: vars.color.text.primary,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.lineHeight.heading,
})

/** Aynı reset gerekçesi. */
export const description = style({
  margin: 0,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  lineHeight: vars.lineHeight.body,
})

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: vars.space[2],
  flexShrink: 0,
})

/**
 * Grafiğin kutusu. Yüksekliği **sabit**, içeriğe bağlı değil.
 *
 * Recharts `ResponsiveContainer` `height="100%"` ile ölçüyü ebeveynden okur;
 * ebeveynin yüksekliği içeriğine bağlı olsaydı ölçü sıfır çıkar, grafik hiç
 * çizilmez ve kart boş görünürdü — hata da vermeden.
 */
export const plot = style({
  blockSize: grafikYuksekligi,
  minWidth: 0,
})

/**
 * Boş ve hata bloğunun kutusu.
 *
 * Aynı yüksekliği **alt sınır** olarak alır: kart durum değiştirirken zıplamaz,
 * ama 320 pikselde satırlara sarmalayan hata metni `sm` kabına sığmadığında
 * kırpılmak yerine kabı büyütür. Grafiğin aksine burada yükseklik ölçen bir
 * çocuk yok, sabit tutmanın bedeli sadece taşma olurdu.
 */
export const stateSlot = style({
  display: 'grid',
  alignContent: 'center',
  minBlockSize: grafikYuksekligi,
})
