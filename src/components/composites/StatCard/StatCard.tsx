import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { Skeleton } from '../../primitives/Skeleton'
import type { StatCardProps } from '../../../types/component-props'
import * as css from './StatCard.css'

type Trend = NonNullable<StatCardProps['trend']>
type TrendYonu = Trend['direction']
type TrendDuygusu = Trend['sentiment']

/**
 * Yönün **metin** karşılığı. Ok `aria-hidden` olduğu için ekran okuyucuya yön
 * yalnız buradan ulaşır; ok tek başına bırakılsaydı "%12" duyurulur, artış mı
 * azalış mı olduğu duyurulmazdı.
 */
const YON_METNI = {
  up: 'artış',
  down: 'azalış',
  flat: 'değişim yok',
} as const satisfies Record<TrendYonu, string>

/**
 * Duygunun metin karşılığı. Görselde `sentiment`'i renk taşır; renk ekran
 * okuyucuya geçmez, bu yüzden aynı bilgi metin olarak da veriliyor.
 */
const DUYGU_METNI = {
  positive: 'olumlu',
  negative: 'olumsuz',
  neutral: 'nötr',
} as const satisfies Record<TrendDuygusu, string>

/**
 * Yön oku.
 *
 * `ArrowUp`/`ArrowDown` bilinçli: lucide'ın `TrendingUp`/`TrendingDown` ikonları
 * "iyi gidiyor / kötü gidiyor" diye okunuyor ve tam da ayırmaya çalıştığımız iki
 * şeyi (yön ile iyi/kötü) tekrar birbirine yapıştırıyor. Düz ok yalnız yönü
 * söyler; yorumu renk ve `DUYGU_METNI` yapar.
 */
function YonIkonu({ direction }: { direction: TrendYonu }) {
  if (direction === 'up') return <ArrowUp size={16} aria-hidden="true" />
  if (direction === 'down') return <ArrowDown size={16} aria-hidden="true" />
  return <Minus size={16} aria-hidden="true" />
}

/**
 * Dashboard'ın tek metriği: bir etiket, bir değer, isteğe bağlı değişim.
 *
 * **`direction` ile `sentiment` ayrı iki proptur çünkü yukarı her zaman iyi
 * değildir.** "Red oranı %12 arttı" yukarı oktur ama kırmızıdır; "ortalama
 * inceleme süresi 3 dakika düştü" aşağı oktur ama yeşildir. Hangi metriğin
 * artışının iyi olduğunu kart bilemez — `label` ona sadece bir dizgi. Bilen
 * çağırandır, o yüzden yorum prop'tan gelir: ok `direction`'dan, renk
 * `sentiment`'ten. İkisini tek alana indirseydik ("iyi/kötü" veya "artı/eksi")
 * kart ya yanlış ok ya yanlış renk çizerdi.
 *
 * Duygunun **görsel** kanalı renktir, ama bu renk tek başına taşınan bir durum
 * değil: gören kullanıcı "Red oranı ↑ %12"yi zaten okuyor ve o metriğin
 * artışının kötü olduğunu biliyor — renk taramayı hızlandıran bir vurgu. Ekran
 * okuyucuya renk hiç geçmediği için yön de duygu da ayrıca **metin** olarak
 * veriliyor (`YON_METNI`, `DUYGU_METNI`); erişilebilir ad "… artış, olumsuz"
 * diye biter.
 *
 * **Trendin yeri, trend olmasa da ayrılır.** Kart yüklenirken trendin gelip
 * gelmeyeceğini bilemez; yeri veriye göre açsak veri geldiğinde kart bir satır
 * uzardı. Brifing loading durumunun layout shift üretmesini yasaklıyor, bu
 * yüzden kartın şekli varyanttan gelir, veriden değil.
 *
 * `loading` yalnız **değeri** iskelete çevirir; etiket, ikon ve açıklama
 * yerinde kalır. İkisinin de sebebi var: etiket ile açıklama istekten önce
 * bilinen sabit metinlerdir, ve iskelet `aria-hidden` olduğu için kartın
 * erişilebilir adı yüklenirken de "Bekleyen ilan" olarak kalır — Button'ın
 * `loading` iken adını kaybettiği hata burada tekrarlanmıyor.
 *
 * `onClick` verilirse kart **gerçek bir `<button>`** olur. `<div onClick>`
 * klavyeyle odaklanılamaz, Enter/Space'e cevap vermez ve ekran okuyucuya
 * tıklanabilir olduğunu söylemez. Verilmezse kart düz bir `<div>`'dir ve
 * hover'da kıpırdamaz: tıklanamayan şey tıklanabilir görünmemeli.
 *
 * Kart `<button>` olabildiği için **tüm çocukları phrasing content**: `<p>` veya
 * `<div>` değil, `<span>`. Buton içine akış içeriği koymak geçersiz HTML'dir ve
 * tarayıcılar bunu sessizce farklı yorumlar.
 *
 * Veri çekmez, biçimlemez: `value` sayı ise `tr-TR` ile binlik ayrılır, dizgi
 * ise olduğu gibi basılır. Para `utils/formatCurrency`'den, tarih
 * `utils/formatDateTime`'dan geçmiş olarak gelmeli.
 *
 * @example
 * <StatCard
 *   label="Red oranı"
 *   value="%8,3"
 *   description="Son 30 gün"
 *   variant="trend"
 *   // Yukarı ok, kırmızı: red oranının artması kötü haber.
 *   trend={{ direction: 'up', value: '+%2,1', sentiment: 'negative' }}
 *   onClick={() => git('/ilanlar?durum=rejected')}
 * />
 */
export function StatCard({
  label,
  value,
  description,
  trend,
  icon,
  variant = 'plain',
  loading = false,
  onClick,
}: StatCardProps) {
  const yerlesim = variant === 'trend' ? 'emphasized' : 'inline'
  const gosterilenDeger = typeof value === 'number' ? value.toLocaleString('tr-TR') : value

  const govde = (
    <>
      <span className={css.header}>
        <span className={css.label}>{label}</span>

        {/* İkon dekoratif: anlamı `label` taşıyor, ikon onu tekrar etmemeli. */}
        {icon !== undefined ? (
          <span className={css.icon} aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </span>

      <span className={css.value}>
        {loading ? (
          /*
            Ham ölçü kuralının istisnası — `SkeletonProps.width` de bunu söylüyor:
            genişlik taklit edilen içeriğe göre değişir, token'a bağlanamaz.
            Yükseklik verilmiyor; iskelet `1em`, kabın `minBlockSize`'ı satır
            kutusunu zaten sabitliyor.
          */
          <Skeleton width="60%" />
        ) : (
          gosterilenDeger
        )}
      </span>

      <span className={css.meta({ layout: yerlesim })}>
        <span className={css.trendSlot({ layout: yerlesim })}>
          {trend !== undefined ? (
            <span
              className={css.trend({ sentiment: trend.sentiment, size: yerlesim })}
              /*
                İki eksen ayrı ayrı okunabilsin diye ayrı iki data attribute:
                "yukarı ok + kırmızı" iddiası story'de DOM'dan ölçülüyor.
              */
              data-direction={trend.direction}
              data-sentiment={trend.sentiment}
            >
              <YonIkonu direction={trend.direction} />
              <span className={css.visuallyHidden}>{YON_METNI[trend.direction]} </span>
              {trend.value}
              <span className={css.visuallyHidden}>, {DUYGU_METNI[trend.sentiment]}</span>
            </span>
          ) : null}
        </span>

        {description !== undefined ? <span className={css.description}>{description}</span> : null}
      </span>
    </>
  )

  if (onClick !== undefined) {
    return (
      <button
        type="button"
        className={css.root({ variant, clickable: true })}
        /*
          Yükleniyor diye kilitlenmiyor: kart tıklanınca filtrelenmiş listeye
          gider ve o hedef sayının yüklenmesini beklemez. `aria-busy` içeriğin
          tazelendiğini söylemeye yeter; kapalı buton kullanıcıyı bekletirdi.
        */
        aria-busy={loading ? true : undefined}
        /*
          Sözleşme argümansız (`() => void`); native onClick ise MouseEvent
          geçiriyor. Sarmalamak çağıranın imzasıyla çağrının birebir aynı
          kalmasını garanti ediyor — Base UI handler'larındaki tuzağın aynısı.
        */
        onClick={() => onClick()}
      >
        {govde}
      </button>
    )
  }

  return (
    <div className={css.root({ variant, clickable: false })} aria-busy={loading ? true : undefined}>
      {govde}
    </div>
  )
}
