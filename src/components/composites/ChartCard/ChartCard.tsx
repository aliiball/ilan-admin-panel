import { useId } from 'react'
import { Skeleton } from '../../primitives/Skeleton'
import { EmptyState } from '../EmptyState'
import { ErrorState } from '../ErrorState'
import type { ChartCardProps } from '../../../types/component-props'
import * as css from './ChartCard.css'

/**
 * Dashboard grafiklerinin kabı: başlık, araç çubuğu, sabit yükseklik ve dört durum.
 *
 * **Grafiği kendi çizmez, veriyi kendi çekmez.** `children` ne verilirse onu
 * gösterir; kabın bildiği tek şey ölçüsü ve hangi durumda olduğudur. Bu yüzden
 * `empty` ayrı bir bayrak: kart `children`'ın içine bakıp "bu seride nokta var
 * mı" diye soramaz, seçilen aralıkta veri olmadığını yalnız veriyi çeken katman
 * bilir.
 *
 * **Yükseklik dört durumda da aynı.** Grafiğin kutusu sabit yükseklikli, çünkü
 * Recharts `ResponsiveContainer` `height="100%"` ile ölçüyü ebeveynden okur:
 * yükseklik içeriğe bağlı olsaydı ölçü sıfır çıkar, grafik **hata vermeden hiç
 * çizilmezdi**. Sabitlik ayrıca brifing 2.1'in "loading layout shift üretmez"
 * kuralını taşır — skeleton, hata bloğu ve grafik aynı yeri kaplar.
 *
 * **Durum sırası: loading → error → empty → children.** `loading` en üstte
 * çünkü yeniden denenen bir sorguda hem eski hata hem yeni istek elde olur;
 * "yükleniyor" o an daha yeni bilgidir ve kullanıcı tıkladığı butonun bir şey
 * yaptığını görmelidir. Hata boşluğu yener: veri gelmediyse "veri yok" demek
 * yalan olur — kullanıcı aralığı boşuna daraltıp genişletir.
 *
 * **Grafiğe `role="img"` verilmez.** Verilseydi kabın adı doğru okunur ama
 * `role="img"` alt ağacı erişilebilirlik ağacından **siler**: `children`'a
 * konan tablo alternatifi veya özet metin, tam da ekran okuyucudan gizlenmiş
 * olurdu. Kabın kendisi `<section>` + `aria-labelledby` ile adlandırılıyor
 * (ekran okuyucuda "bölge" olarak listelenir, kullanıcı grafikler arasında
 * gezebilir); grafiğin veriyi AT'ye nasıl taşıdığı `children`'ın işi ve orada
 * kalmalı. Yalnız görsel bir SVG hiçbir şey söylemez — kap onu düzeltemez,
 * çünkü içindeki serinin ne olduğunu bilmiyor.
 *
 * **Başlık `<p>`, `<h2>` değil** (aynı gerekçe `EmptyState`'te): component
 * hangi başlık seviyesinde durduğunu bilemez ve yanlış seviye belge taslağını
 * bozar. Adlandırma bundan etkilenmiyor — erişilebilir ad `aria-labelledby` ile
 * kuruluyor, elemanın etiketiyle değil.
 *
 * **Araç çubuğu her durumda kalır.** İçindeki aralık seçici hem boş hem hatalı
 * durumdan tek çıkış yolu olabilir; yüklenirken kaybolsaydı kullanıcının
 * imlecinin altındaki kontrol yok olur, kart bir de o yüzden zıplardı.
 *
 * Hata bloğunun "tekrar dene" butonu **yok**: sözleşmede bir retry kanalı
 * yok, basılınca hiçbir şey yapmayan buton kapalı butondan kötüdür. Yenileme
 * sunulacaksa `toolbar`'a konur (aynı boşluk `DataTableProps`'ta da var).
 *
 * @example
 * <ChartCard
 *   title="Günlük yeni ilan"
 *   description="Son 30 gün"
 *   height="lg"
 *   loading={sorgu.isPending}
 *   error={sorgu.error}
 *   empty={sorgu.data?.length === 0}
 *   toolbar={<Button variant="ghost" size="sm" onClick={disaAktar}>CSV indir</Button>}
 * >
 *   <YeniIlanGrafigi data={sorgu.data ?? []} />
 * </ChartCard>
 */
export function ChartCard({
  title,
  description,
  children,
  toolbar,
  loading = false,
  error,
  empty = false,
  height = 'md',
}: ChartCardProps) {
  const id = useId()
  const basligId = `${id}-baslik`
  const aciklamaId = `${id}-aciklama`

  const govde = () => {
    if (loading) {
      return (
        <div className={css.plot}>
          {/* Skeleton `aria-hidden`; yükleniyor bilgisini kabın `aria-busy`'si taşır. */}
          <Skeleton variant="rectangle" width="100%" height="100%" />
        </div>
      )
    }

    if (error !== undefined) {
      return (
        <div className={css.stateSlot}>
          {/*
            `section`: kartın içeriği düştü, çevresi ayakta. Dashboard'da
            grafikler bağımsız yükleniyor (brifing 2.2 `partialSuccess`); bir
            grafiğin hatası `page` gibi bağırırsa ayakta kalan KPI kartları
            yanlışlıkla şüpheli görünür.
          */}
          <ErrorState
            variant="section"
            title={error.title}
            description={error.message}
            {...(error.code !== undefined && { code: error.code })}
          />
        </div>
      )
    }

    if (empty) {
      return (
        <div className={css.stateSlot}>
          {/*
            `compact`: kutu kartın içinde ve grafiğin yüksekliğiyle sınırlı;
            `default`ın geniş nefes alanı `sm` kabı taşırırdı. Metin brifing
            2.2'nin boş durum tanımı — kart hangi seriyi çizdiğini bilmediği
            için daha özeli yazılamaz, `title` prop'u zaten söylüyor.
          */}
          <EmptyState
            variant="compact"
            title="Seçilen tarih aralığında veri yok"
            description="Bu aralıkta grafiği çizecek kayıt bulunmuyor. Aralığı genişletmeyi deneyin."
          />
        </div>
      )
    }

    return <div className={css.plot}>{children}</div>
  }

  return (
    <section
      className={css.root({ height })}
      aria-labelledby={basligId}
      {...(description !== undefined && { 'aria-describedby': aciklamaId })}
      aria-busy={loading}
    >
      <div className={css.header}>
        <div className={css.headings}>
          <p className={css.title} id={basligId}>
            {title}
          </p>

          {description !== undefined ? (
            <p className={css.description} id={aciklamaId}>
              {description}
            </p>
          ) : null}
        </div>

        {toolbar !== undefined ? <div className={css.toolbar}>{toolbar}</div> : null}
      </div>

      {govde()}
    </section>
  )
}
