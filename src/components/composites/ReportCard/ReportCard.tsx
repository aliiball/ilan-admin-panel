import type { ReactNode } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { ReportSeverity, ReportStatus, type ISODateTime } from '../../../types/domain'
import {
  REPORT_REASON_LABEL,
  REPORT_SEVERITY_LABEL,
  REPORT_STATUS_LABEL,
} from '../../../domain/labels'
import { formatDateTime, machineDateTime } from '../../../utils/formatDateTime'
import { Badge } from '../../primitives/Badge'
import { StatusBadge } from '../StatusBadge'
import type { ReportCardProps } from '../../../types/component-props'
import * as css from './ReportCard.css'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

/**
 * Şiddet tonu. `satisfies Record<ReportSeverity, Tone>` bilerek: domain'e yeni
 * bir seviye eklenip tonu yazılmazsa derleme durur — tonsuz bir şiddet sessizce
 * nötre düşüp kuyrukta sıradan görünmez.
 */
const SIDDET_TONU = {
  [ReportSeverity.Low]: 'neutral',
  [ReportSeverity.Medium]: 'info',
  [ReportSeverity.High]: 'warning',
  [ReportSeverity.Critical]: 'danger',
} as const satisfies Record<ReportSeverity, Tone>

/**
 * Recipe varyant adı. Enum üyesi string literal'e kendiliğinden düşmez
 * (`ReportSeverity.Low` ile `'low'` aynı tip değil), bu yüzden eşleme elle
 * yazılıyor — `AutomatedChecksPanel`'in `DURUM_STILI`'yle aynı gerekçe.
 */
const SIDDET_STILI = {
  [ReportSeverity.Low]: 'low',
  [ReportSeverity.Medium]: 'medium',
  [ReportSeverity.High]: 'high',
  [ReportSeverity.Critical]: 'critical',
} as const satisfies Record<ReportSeverity, 'low' | 'medium' | 'high' | 'critical'>

/**
 * Durum tonu. Şiddetle **aynı ton havuzunu paylaşmaz gibi görünse de** paylaşır;
 * ayrımı renk değil metin taşır: şiddet rozeti "Kritik şiddet", durum rozeti
 * "Açık" yazar. İki rozetin yan yana aynı tonu alması mümkündür (açık + yüksek
 * ikisi de `warning`) ve sorun değildir — okuyan kişi tonu değil yazıyı okur.
 */
const DURUM_TONU = {
  [ReportStatus.Open]: 'warning',
  [ReportStatus.InReview]: 'info',
  [ReportStatus.Resolved]: 'success',
  [ReportStatus.Dismissed]: 'neutral',
} as const satisfies Record<ReportStatus, Tone>

/**
 * Sonuçlanmış şikayet: `fixtures/reports.ts`'in sayaç sözleşmesine göre
 * `metrics.reportCount`'tan düşer, kuyrukta iş çıkarmaz. Kart bunu zemini
 * söndürerek gösterir — şiddet kanalına dokunmadan.
 */
const KAPALI_DURUMLAR: readonly ReportStatus[] = [ReportStatus.Resolved, ReportStatus.Dismissed]

const DAKIKA = 60_000
const SAAT = 60 * DAKIKA
const GUN = 24 * SAAT

/**
 * "3 gündür bekliyor" — `createdAt` ile `now` arasındaki farkın Türkçesi.
 *
 * **Saat prop'tan gelir, `Date.now()`'dan değil.** Fonksiyon saf: aynı iki
 * girdi her zaman aynı dizeyi verir, dolayısıyla story de Chromatic de her gün
 * aynı kartı görür.
 *
 * Süre **geçen zamandır**, takvim günü değil: 23:50'de açılan şikayet 20 dakika
 * sonra "1 gündür bekliyor" demez. (Europe/Istanbul 2016'dan beri kalıcı UTC+3
 * olduğu için ikisi zaten çakışıyor, ama doğru tanım bu — kuyruğun sorduğu şey
 * "kaç gündür duruyor", "hangi takvim gününde açıldı" değil.)
 *
 * Eşikler aşağıya yuvarlanır ve dört kademe de Türkçe ek uyumunu taşır:
 * `gün` → `gündür`, `saat` → `saattir` (ince ünlü alan alıntı: "saati",
 * "saatler"), `dakika` → `dakikadır`.
 *
 * `undefined` döner — yani kart mutlak tarihe düşer — üç halde: `now` hiç
 * verilmemişse (Faz 2'nin davranışı, geriye dönük uyum), tarihlerden biri
 * ayrıştırılamıyorsa, ve `now` `createdAt`'ten **önceyse**. Sonuncusu gerçek
 * bir ihtimal (sayfa "şimdi"yi bir kez okuyup uzun süre elinde tutabilir,
 * saatler kayabilir) ve elenmezse kart "-1 gündür bekliyor" derdi: uydurulmuş
 * bir süre yerine elindeki tek gerçek olan açılış anı gösteriliyor.
 */
function beklemeSuresi(createdAt: ISODateTime, now: ISODateTime | undefined): string | undefined {
  if (now === undefined) return undefined

  const fark = new Date(now).getTime() - new Date(createdAt).getTime()

  if (!Number.isFinite(fark) || fark < 0) return undefined

  if (fark < DAKIKA) return '1 dakikadan kısa süredir bekliyor'
  if (fark < SAAT) return `${Math.floor(fark / DAKIKA)} dakikadır bekliyor`
  if (fark < GUN) return `${Math.floor(fark / SAAT)} saattir bekliyor`

  return `${Math.floor(fark / GUN)} gündür bekliyor`
}

/**
 * Etiketli meta satırı.
 *
 * `<dl>` semantik olarak daha doğru olurdu ama kullanılamıyor: kart
 * tıklanabilirken gövde bir `<button>`ın içindedir ve `<button>` yalnız
 * phrasing content alır — `<dl>`/`<div>`/`<p>` orada geçersiz HTML olur.
 */
function MetaSatiri({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className={css.metaItem}>
      <span className={css.metaLabel}>{label}</span>
      <span className={css.metaValue}>{children}</span>
    </span>
  )
}

/**
 * `tone` varsayılanı destructuring'de veriliyor, recipe'in `defaultVariants`'ına
 * bırakılmıyor: `exactOptionalPropertyTypes` açıkken `css.time({ tone })`
 * çağrısına `tone: undefined` geçmek TS2375 verir (recipe'in `tone`'u opsiyonel,
 * yani "yok" ile "undefined" aynı şey değil). Varsayılan burada, tip de
 * `'secondary' | 'muted'`e iniyor.
 */
function Zaman({
  value,
  tone = 'secondary',
}: {
  value: ISODateTime
  tone?: 'secondary' | 'muted'
}) {
  return (
    <time className={css.time({ tone })} dateTime={machineDateTime(value)}>
      {formatDateTime(value)}
    </time>
  )
}

/**
 * Bir şikayetin özeti: listede, triage kuyruğunda ve şikayet detayında.
 *
 * **Şiddet ve durum iki ayrı eksendir; kart ikisini de gösterir, birini
 * diğerinin yerine geçirmez.** "Kritik ama çözülmüş" ile "açık ama düşük
 * şiddetli" bambaşka iki iştir: ilki kapanmış bir tehlike, ikincisi bekleyen
 * bir formalite. Bu yüzden iki eksen ayrı kanallardan okunur — şiddet sol
 * şeritten ve kendi rozetinden, durum kendi rozetinden; sonuçlanmış şikayet
 * ayrıca zemini sönerek geri çekilir ama **şeridi ve şiddet rozeti aynen
 * kalır.** Tek bir "renk" ikisini birden anlatmaya kalksaydı kritik bir
 * şikayetin kapandığı ya da kapanan bir şikayetin kritik olduğu bilgisinden
 * biri kaybolurdu. Renk zaten tek başına gösterge değil: her iki rozet de
 * yazısını taşır ("Kritik şiddet", "Çözümlendi").
 *
 * **`listing` yoksa kart çökmez.** Şikayet listesi ilanları ayrı bir sorguyla
 * getirir ve ilan silinmiş de olabilir; ilan gelmeden kart `report.listingId`'yi
 * gösterir — kırık bir başvuru değil, eksik bir bağlam (brifing 2.8'in
 * `linkedListingUnavailable` durumu). İlan verildiğinde onun **kendi**
 * durumu `StatusBadge` ile görünür: şikayetin durumu ile ilanın durumu üçüncü
 * bir eksendir, arşivlenmiş ilana açılmış şikayet gerçek bir kayıttır.
 *
 * **Bekleme süresi `now`'dan hesaplanır; kart saati kendi okumaz.** Kuyruğun
 * derdi yaştır ama yaşın hesabı "şimdi"ye dayanır ve component `new Date()`
 * çağıramaz: çağırsaydı aynı story dün "3 gün önce", bugün "4 gün önce" yazar,
 * Chromatic her gün fark üretir ve gerçek bir görsel regresyon o gürültünün
 * içinde kaybolurdu. Saat bu yüzden dışarıdan gelir — `now` verilirse `queue`
 * "3 gündür bekliyor" der, verilmezse Faz 2'nin davranışı aynen sürer: tarih
 * kendi satırında, ikonlu ve "Açıldı" etiketiyle durur.
 *
 * Süre verildiğinde **tarih kaybolmaz, ikinci plana düşer**: "ne kadardır
 * bekliyor" ile "hangi gün açıldı" ayrı sorulardır (ikincisi bir kararın
 * kaydına girer) ve `<time datetime>`'ın makine değeri her hâlde durmalı.
 * Tarihlerin tamamı `utils/formatDateTime`'dan geçer (`tr-TR` +
 * `Europe/Istanbul` sabit); "şikayet hangi gün açıldı" sorusu bakanın
 * makinesine göre farklı cevaplanamaz.
 *
 * **Ad çözümleme çağıranın işi.** Sözleşme yalnız `reporterUserId` ve
 * `assignedAdminId` (UUID) taşıyor, kart da veri çekmez: `reporter` /
 * `assignedAdmin` verilirse kart **adı** gösterir, verilmezse kimliği — eksik
 * bağlam, kırık başvuru değil (`listing` ile aynı desen, kimliğin ilgili kayda
 * gerçekten ait olduğunu doğrulamak da aynı şekilde çağıranın işi).
 * `AdminUser` diye bir tip **yok**: admin de `UserAccount`, `adminRole`'ü dolu.
 * Anonimliğe **şikayetin kendisi** karar verir, ad çözümlemesi değil —
 * `reporterUserId` yoksa çözülecek bir ad da yoktur ve kart "Anonim" der.
 *
 * **`relatedReportCount` şikayetin değil ilanın özelliği**, o yüzden ilan
 * kutusunda duruyor ve ilan gelmemiş olsa da görünür (sayı `listingId`'ye
 * bağlıdır, başlığa değil). Üç şikayetli bir ilanın her kartı `2` taşır: kartı
 * yan yana üç kart olarak görmek "bu ilan üç kez şikayet edilmiş" demenin
 * yerini tutmaz, çünkü kuyrukta kartlar yan yana gelmeyebilir.
 *
 * **Tıklanabilir bölge `<button>`'dır ama `actions`'ı sarmaz.** İç içe
 * etkileşimli element geçersiz HTML'dir ve içteki butonu klavyeyle
 * erişilemez kılar; bu yüzden eylemler butonun **kardeşidir**. Aynı sebeple
 * gövdedeki her kutu `<span>`: `<button>` yalnız phrasing content alır.
 * Kartta `overflow: hidden` de yok — tıklanabilir bölge kartı doldurduğu için
 * global `:focus-visible` halkası (dışarı taşan bir `outline`) kırpılırdı;
 * yuvarlatılması gereken tek şey küçük görsel, o da kendi `border-radius`'unu
 * taşıyor.
 *
 * Yetki kontrolü kartın işi değil: yapılamayacak eylem `disabled` verilmez,
 * `actions`'a hiç konmaz. Triage kademeli — `report:triage` şiddeti ve atamayı
 * da değiştirir, `report:triageLimited` yalnız okur, sınıflandırır, eskale
 * eder; kademeler kapsayıcı olduğu için önce tamı sınanmalı.
 *
 * @example
 * // `now` sayfada BİR KEZ okunur ve bütün kartlara aynı değer geçer: kart
 * // başına `new Date()` çağırmak listeyi kendi içinde tutarsız yapardı
 * // (üstteki kart 3, alttaki 4 gün derdi) ve determinizmi de kırardı.
 * <ReportCard
 *   report={report}
 *   listing={ilan}
 *   reporter={kullanicilar[report.reporterUserId]}
 *   assignedAdmin={adminler[report.assignedAdminId]}
 *   relatedReportCount={ayniIlanaBagliSikayetSayisi - 1}
 *   now={simdi}
 *   variant="queue"
 *   actions={yetkiler.canResolve ? <Button size="sm" onClick={() => coz(report)}>Çöz</Button> : undefined}
 *   onClick={sikayetiAc}
 * />
 */
export function ReportCard({
  report,
  listing,
  reporter,
  assignedAdmin,
  relatedReportCount,
  now,
  variant = 'compact',
  actions,
  onClick,
}: ReportCardProps) {
  const tiklanabilir = onClick !== undefined
  const kuyruk = variant === 'queue'
  const detayli = variant === 'detailed'
  const kapali = KAPALI_DURUMLAR.includes(report.status)
  const bekleme = beklemeSuresi(report.createdAt, now)
  /** `0` gösterilmez: "0 benzer şikayet daha" bir bilgi değil, gürültüdür. */
  const benzerVar = relatedReportCount !== undefined && relatedReportCount > 0

  /** Kapak yoksa ilk fotoğraf; o da yoksa görsel hiç render edilmez. */
  const kapak = listing?.photos.find((foto) => foto.isCover) ?? listing?.photos[0]

  const rozetler = (
    <span className={css.badges}>
      <Badge
        tone={SIDDET_TONU[report.severity]}
        /*
          Kritik her varyantta dolu: kuyruğu tarayan gözün ilk durduğu yer
          orası olmalı. Kuyrukta ise seviye ne olursa olsun dolu ve büyük —
          varyantın tek işi şiddeti öne çıkarmak.
        */
        variant={report.severity === ReportSeverity.Critical || kuyruk ? 'solid' : 'soft'}
        size={kuyruk ? 'md' : 'sm'}
        leadingIcon={<AlertTriangle size={kuyruk ? 14 : 12} />}
      >
        {REPORT_SEVERITY_LABEL[report.severity]} şiddet
      </Badge>

      <Badge tone={DURUM_TONU[report.status]} size={kuyruk ? 'md' : 'sm'}>
        {REPORT_STATUS_LABEL[report.status]}
      </Badge>
    </span>
  )

  const baslikBlogu = (
    <span className={css.titleBlock}>
      <span className={css.reason}>{REPORT_REASON_LABEL[report.reason]}</span>
      {variant !== 'compact' ? <span className={css.reportNo}>Şikayet no: {report.id}</span> : null}
    </span>
  )

  const ilanOzeti = (
    <span className={css.listingBox}>
      {kapak !== undefined ? (
        <img className={css.thumb({ variant })} src={kapak.thumbnailUrl} alt="" loading="lazy" />
      ) : null}

      <span className={css.listingText}>
        {listing !== undefined ? (
          <>
            <span className={css.listingTitle}>{listing.title}</span>
            <span className={css.listingNo}>İlan no: {listing.listingNo}</span>
          </>
        ) : (
          <>
            <span className={css.listingMissing}>İlan bilgisi yüklenmedi</span>
            <span className={css.listingNo}>İlan kimliği: {report.listingId}</span>
          </>
        )}
      </span>

      {/*
        Ton `warning`: aynı ilanın tekrar tekrar şikayet edilmesi triage'ın
        "buna daha dikkatli bak" sinyali. Tonun şiddet rozetiyle çakışması
        sorun değil — okuyan kişi tonu değil yazıyı okur, ve rozet ilan
        kutusunun içinde, şiddet kanalının dışında duruyor. `sm` her varyantta:
        bu ilanın notu, kuyruğun manşeti değil.
      */}
      {benzerVar ? (
        <Badge className={css.relatedBadge} tone="warning" size="sm">
          {relatedReportCount} benzer şikayet daha
        </Badge>
      ) : null}

      {listing !== undefined ? <StatusBadge status={listing.status} size="sm" /> : null}
    </span>
  )

  const icerik = (
    <>
      {/*
        Kuyrukta rozetler başlıktan ÖNCE geliyor: "şiddet öne çıkar" bir CSS
        `order` numarası ile de yapılabilirdi ama o, görsel sırayı okuma
        sırasından ayırır — klavye ve ekran okuyucu kullanıcısı başlığı önce
        duyup rozeti sonra bulur. Sıra DOM'da değişiyor ki ikisi aynı kalsın.
      */}
      <span className={css.head({ variant })}>
        {kuyruk ? rozetler : null}
        {baslikBlogu}
        {kuyruk ? null : rozetler}
      </span>

      {ilanOzeti}

      {kuyruk ? (
        <span className={css.queueMeta}>
          {/*
            `now` verilmişse etiketin yerini süre alır ve tarih söner: kuyruğun
            ilk okuduğu şey "ne kadardır bekliyor". Verilmemişse cümle Faz 2'deki
            hâlinde kalır. İkisinde de `<time>` aynı yerde — makine değeri hiç
            kaybolmuyor.
          */}
          <span className={css.age}>
            <Clock size={14} aria-hidden="true" />
            {bekleme ?? 'Açıldı'}
            <Zaman value={report.createdAt} tone={bekleme !== undefined ? 'muted' : 'secondary'} />
          </span>

          {/*
            Atanmamış kritik şikayet kuyruğun en kötü hâli: kimse üstüne
            almamış. "Atanmış" bilgisi ise triage kararını değiştirmez, o
            yüzden yalnız kimin aldığı yazılıyor, rozet çıkmıyor. Rozet bir
            **sıfat** ("atanmamış şikayet"), aşağıdaki meta satırı ise bir ad
            alanının değeri ("Atanan admin: Atanmadı") — iki ayrı cümle,
            bilerek iki ayrı kelime.
          */}
          {report.assignedAdminId === undefined ? (
            <Badge tone="warning" variant="outline" size="sm">
              Atanmamış
            </Badge>
          ) : (
            <span className={css.assignee}>
              Atanan: {assignedAdmin?.fullName ?? report.assignedAdminId}
            </span>
          )}
        </span>
      ) : (
        <span className={css.compactMeta}>
          Açıldı <Zaman value={report.createdAt} />
        </span>
      )}

      {detayli ? (
        <>
          {report.detail !== undefined ? (
            <span className={css.detail}>{report.detail}</span>
          ) : (
            <span className={css.detailMissing}>Şikayetçi açıklama yazmamış.</span>
          )}

          <span className={css.metaGrid}>
            {/*
              Anonim şikayet gerçek bir hâl: form oturum açmadan da
              doldurulabiliyor. Karar `reporterUserId`'nin: alan yoksa
              çözülecek bir ad da yoktur ve `reporter` yanlışlıkla verilmiş
              olsa bile kart "Anonim" der — kartın en kolay yalanı, olmayan bir
              şikayetçiye ad takmak olurdu.
            */}
            <MetaSatiri label="Şikayet eden">
              {report.reporterUserId === undefined
                ? 'Anonim'
                : (reporter?.fullName ?? report.reporterUserId)}
            </MetaSatiri>
            <MetaSatiri label="Atanan admin">
              {report.assignedAdminId === undefined
                ? 'Atanmadı'
                : (assignedAdmin?.fullName ?? report.assignedAdminId)}
            </MetaSatiri>
            <MetaSatiri label="Güncellendi">
              <Zaman value={report.updatedAt} />
            </MetaSatiri>
            {report.resolvedAt !== undefined ? (
              <MetaSatiri label="Sonuçlandı">
                <Zaman value={report.resolvedAt} />
              </MetaSatiri>
            ) : null}
          </span>

          {/*
            Çözüm notu "neden kapandı"nın tek cevabı; `resolved` ile `dismissed`
            farkını da o taşır (biri haklı bulundu, öbürü asılsız). Notu olmayan
            kapalı şikayet için uydurulmuş bir metin basılmıyor — yokluğu da bilgi.
          */}
          {report.resolutionNote !== undefined ? (
            <span className={css.resolution}>
              <span className={css.metaLabel}>Çözüm notu</span>
              <span>{report.resolutionNote}</span>
            </span>
          ) : null}
        </>
      ) : null}
    </>
  )

  return (
    <article
      className={css.card({ variant, severity: SIDDET_STILI[report.severity] })}
      data-closed={kapali ? '' : undefined}
      data-clickable={tiklanabilir ? '' : undefined}
    >
      {tiklanabilir ? (
        <button
          type="button"
          className={css.clickRegion({ variant })}
          onClick={() => onClick(report)}
        >
          {icerik}
        </button>
      ) : (
        <span className={css.clickRegion({ variant })}>{icerik}</span>
      )}

      {actions !== undefined ? (
        <span className={css.actionsSlot({ variant })}>{actions}</span>
      ) : null}
    </article>
  )
}
