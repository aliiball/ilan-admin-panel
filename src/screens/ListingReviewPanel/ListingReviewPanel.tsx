import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import type { Listing, ListingMetrics } from '../../types/domain'
import { LISTING_FIELD_LABEL, LISTING_METRIC_LABEL } from '../../domain/labels'
import { Alert } from '../../components/primitives/Alert'
import { Button } from '../../components/primitives/Button'
import { Skeleton } from '../../components/primitives/Skeleton'
import { AutomatedChecksPanel } from '../../components/composites/AutomatedChecksPanel'
import { EmptyState } from '../../components/composites/EmptyState'
import { ErrorState } from '../../components/composites/ErrorState'
import { ImageGallery } from '../../components/composites/ImageGallery'
import { ListingFacts } from '../../components/composites/ListingFacts'
import { LocationPanel } from '../../components/composites/LocationPanel'
import { ModerationActionBar } from '../../components/composites/ModerationActionBar'
import { ModerationHistory } from '../../components/composites/ModerationHistory'
import { PromotionFlagsPanel } from '../../components/composites/PromotionFlagsPanel'
import { ReportCard } from '../../components/composites/ReportCard'
import { SellerPanel } from '../../components/composites/SellerPanel'
import type {
  ListingReviewData,
  ListingReviewPanelProps,
  UiError,
} from '../../types/component-props'
import * as css from './ListingReviewPanel.css'

/**
 * Bölüm başlıkları.
 *
 * Bir alanın **kendisi** olan bölümler adını `LISTING_FIELD_LABEL`'dan alıyor:
 * aynı alan listede, filtrede ve burada aynı kelimeyle anılmalı. Geri kalanlar
 * bu ekrana özgü cümleler — `ModerationActionBar`'ın dialog metinleriyle aynı
 * sınıf, `domain/labels.ts`'in işi değil (orası bir **enum değerini** etiketler,
 * bir bölümü değil).
 */
const BOLUM = {
  photos: LISTING_FIELD_LABEL.photos,
  facts: 'İlan bilgileri',
  metrics: LISTING_FIELD_LABEL.metrics,
  location: LISTING_FIELD_LABEL.location,
  history: 'Moderasyon geçmişi',
  seller: LISTING_FIELD_LABEL.seller,
  promotions: 'Promosyonlar',
  checks: 'Otomatik kontroller',
  reports: 'Şikayetler',
} as const

/**
 * Metriklerin okuma sırası: en genelden en kritiğe.
 *
 * Etiketler `LISTING_METRIC_LABEL`'dan geliyor — sözlüğün JSDoc'u zaten bu
 * bloğu tüketici olarak sayıyor. Sayı biçimi `toLocaleString('tr-TR')`: reponun
 * yerleşik kalıbı (ListingCard, StatCard, SellerPanel, Pagination), yerel ayar
 * makineye bırakılmıyor.
 */
const METRIK_SIRA: readonly (keyof ListingMetrics)[] = [
  'viewCount',
  'favoriteCount',
  'messageCount',
  'reportCount',
]

/**
 * Bir bölüm: `<h2>` + içerik.
 *
 * **`<section>` bilerek adsız.** Adı olan bir `<section>` `region` landmark'ı
 * üretir; dokuz bölüme dokuz landmark vermek `landmark-unique`'i kendi
 * ürettiğimiz gürültüyle doldururdu ve zaten `SellerPanel`'in kendi
 * `<section aria-label="İlan sahibi">`'i var — ona bir ad daha sarmak aynı
 * paneli iki landmark'la çevirirdi. Adsız `section` erişilebilirlik ağacında
 * landmark değil; belge yapısını `<h2>` taşıyor.
 *
 * **Seviye `<h2>` ve bu ölçüldü.** Ekranın kendi `<h1>`'i yok: sayfanın başlığı
 * `PageHeader`'ın (Faz 4) ve bu ekran onun içinde yaşıyor. `ListingFacts` bölüm
 * başlıklarını `<h3>` basıyor. Zincir h1 → h2 → h3, `heading-order` temiz.
 */
function Bolum({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={css.section}>
      <h2 className={css.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

/** Bir bölümün verisi gelmedi (`partialSuccess`); komşuları ayakta kalır. */
function BolumHatasi({ error }: { error: UiError }) {
  return (
    <ErrorState
      variant="section"
      title={error.title}
      description={error.message}
      {...(error.code !== undefined && { code: error.code })}
    />
  )
}

/**
 * Verisi ayrı bir sorgudan gelen bölüm: ya değer vardır, ya hatası.
 *
 * `partialSuccess`'in sözleşmesi ikisinden birini garanti ediyor (`errors`
 * `data` ile aynı anahtar uzayını kullanır), ama ikisi de yoksa bölüm **hiç
 * çizilmiyor**: içeriği olmayan bir `<h2>` bırakmak, ekran okuyucu
 * kullanıcısına var olmayan bir bölüm vaat etmek olurdu.
 */
function AyriBolum<T>({
  title,
  data,
  error,
  render,
}: {
  title: string
  data: T | undefined
  error: UiError | undefined
  render: (value: T) => ReactNode
}) {
  if (data !== undefined) {
    return <Bolum title={title}>{render(data)}</Bolum>
  }

  if (error !== undefined) {
    return (
      <Bolum title={title}>
        <BolumHatasi error={error} />
      </Bolum>
    )
  }

  return null
}

/** İlanın performans sayaçları — sahibi bir composite yok, bloğu ekran çiziyor. */
function Metrikler({ metrics }: { metrics: ListingMetrics }) {
  return (
    <dl className={css.metrics}>
      {METRIK_SIRA.map((key) => (
        <div key={key} className={css.metric}>
          <dt className={css.metricLabel}>{LISTING_METRIC_LABEL[key]}</dt>
          <dd className={css.metricValue}>{metrics[key].toLocaleString('tr-TR')}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * `listing` gelmiş, geri kalanı gelmiş olabilir de olmayabilir de.
 *
 * `success` bunun özel hâli: bütün alanlar dolu, `errors` boş. `partialSuccess`
 * ise gelmeyen alanı **yok** sayar (boş dizi değil — boş dizi "şikayet yok" der,
 * oysa doğrusu "şikayetler çekilemedi") ve o bölüme `ErrorState` koyar.
 */
type IcerikVerisi = Partial<ListingReviewData> & { listing: Listing }

type BolumHatalari = Partial<Record<keyof ListingReviewData, UiError>>

interface IcerikProps extends Pick<
  ListingReviewPanelProps,
  | 'capabilities'
  | 'submittingAction'
  | 'decisionError'
  | 'onApprove'
  | 'onReject'
  | 'onRequestChanges'
  | 'onPause'
  | 'onArchive'
  | 'onRetry'
> {
  data: IcerikVerisi
  errors: BolumHatalari
  revealExactLocation: boolean
  stale: boolean
}

function Icerik({
  data,
  errors,
  capabilities,
  submittingAction,
  decisionError,
  revealExactLocation,
  stale,
  onApprove,
  onReject,
  onRequestChanges,
  onPause,
  onArchive,
  onRetry,
}: IcerikProps) {
  const { listing, events, reports, seller, previousRevision } = data
  const cakisma = decisionError?.kind === 'revisionConflict'

  return (
    <div className={css.root}>
      {stale ? (
        <Alert
          tone="warning"
          variant="soft"
          title="Gösterilen ilan güncel olmayabilir"
          description="Son başarılı veri gösteriliyor; arka plandaki yenileme tamamlanmadı. Karar vermeden önce yeniden yükleyin."
          action={
            <Button variant="secondary" size="sm" onClick={() => onRetry()}>
              Yeniden yükle
            </Button>
          }
        />
      ) : null}

      <div className={css.columns}>
        <div className={css.column}>
          <Bolum title={BOLUM.photos}>
            {/*
              `filmstrip`: moderatörün işi "genel bakış" değil tek tek inceleme —
              tek büyük görsel + altta şerit. Kırpılan kenarda filigran veya
              telefon numarası olabilir; galeri zaten `object-fit: contain`.

              **Fotoğraf bazlı moderasyon kapalı ve bu bir eksiklik değil,
              kanalsızlık:** `ListingReviewPanelProps`'ta `onPhotoApprove`/
              `onPhotoReject` yok. `allowModeration` verip handler bağlamamak
              galeriye kontrolleri zaten çizdirmez (kendi JSDoc'u: "sonuçsuz
              buton sunmanın anlamı yok"); uydurma prop eklenmedi, boşluk
              raporlandı.
            */}
            <ImageGallery photos={listing.photos} variant="filmstrip" />
          </Bolum>

          <Bolum title={BOLUM.facts}>
            {/*
              `previousRevision` varsa soru "ilan ne" değil "ne değişti"
              (brifing 2.5: "önceki ve yeni değer farkları"). Panel farkı
              hesaplamaz, iki değeri yan yana koyar.

              `highlightedFields` **geçilmiyor**: hangi değişikliğin "maddi"
              olduğu bir iş kuralı, `domain/`'in işi — ve orada böyle bir
              fonksiyon yok, `ListingReviewPanelProps`'ta da kanal yok. Fark
              yine de görünür (iki sütun metinle söylüyor), yalnız vurgu yok.
              Uydurulmadı, raporlandı.
            */}
            <ListingFacts
              listing={listing}
              variant={previousRevision !== undefined ? 'comparison' : 'sections'}
              {...(previousRevision !== undefined && { previousListing: previousRevision })}
            />
          </Bolum>

          <Bolum title={BOLUM.metrics}>
            <Metrikler metrics={listing.metrics} />
          </Bolum>

          <Bolum title={BOLUM.location}>
            {/*
              `addressDetail`: belge kontrolü yapan moderatör adresi, posta kodunu
              ve koordinatı **metin olarak** ister — kopyalanıp haritaya
              yapıştırılacak. `mapSplit` geniş ekranda daha iyi olurdu ama varyant
              bir JS kararı ve ekranın viewport kanalı yok (bkz. component JSDoc'u).

              `revealExactLocation` doğrudan geçiliyor: gösterim kapısı, yetki
              kapısı değil.
            */}
            <LocationPanel
              listing={listing}
              variant="addressDetail"
              revealExactLocation={revealExactLocation}
            />
          </Bolum>

          {/* Geçmiş `timeline`: "ne oldu, sonra ne oldu" — panelin kendi JSDoc'u bu ekranı sayıyor. */}
          <AyriBolum
            title={BOLUM.history}
            data={events}
            error={errors.events}
            render={(veri) => <ModerationHistory events={veri} variant="timeline" />}
          />
        </div>

        <div className={css.column}>
          {/*
            `detailed`, `risk` değil: `risk` varyantı brifing 3.4'ün istediği
            yaptırım geçmişini `sanctions` prop'uyla gösteriyor, ama
            `ListingReviewData` `UserSanction[]` taşımıyor — kanalsız bir `risk`
            paneli, sicili olmadığı hâlde "sicil temiz" izlenimi verirdi.
            `detailed` iletişim bilgilerini de gösteriyor (brifing 2.5'in görünen
            verisi). Boşluk raporlandı.

            Sayaçlar hesabın kendi toplamlarından: bu ekranın bağlamı süzülmüş
            bir alt küme değil, hesabın tamamı. `openReportCount` için
            `user.reportCount` doğru kaynak — `fixtures/users.ts` onu zaten
            "sonuçlanmamış (open + inReview) şikayet sayısı" diye tanımlıyor.
          */}
          <AyriBolum
            title={BOLUM.seller}
            data={seller}
            error={errors.seller}
            render={(veri) => (
              <SellerPanel
                user={veri}
                variant="detailed"
                listingCount={veri.listingCount}
                activeListingCount={veri.activeListingCount}
                openReportCount={veri.reportCount}
              />
            )}
          />

          <Bolum title={BOLUM.promotions}>
            {/*
              `editable` verilmiyor: brifing 2.5 promosyonu **görünen veri**
              sayıyor, eylemleri arasında saymıyor — ve `ModerationCapabilities`
              `promotion:manage`'i taşımıyor. Salt okunur doğru hâl.

              `cards`: bayrağın neden açık olduğu (tarih, kaynak) ancak burada
              görünüyor; süresi dolmuş kaydı olan açık bir bayrak fark edilmeli.
            */}
            <PromotionFlagsPanel
              flags={listing.promotionFlags}
              promotions={listing.promotions}
              variant="cards"
            />
          </Bolum>

          <Bolum title={BOLUM.checks}>
            {/* `cards`: skor ve kontrolün çalıştığı an karar verirken bakılıyor. */}
            <AutomatedChecksPanel items={listing.moderation.automatedChecks} variant="cards" />
          </Bolum>

          {/*
            Liste **süzülmüyor**: hangi şikayetlerin getirileceği sayfanın
            kararı; kapalı olanı burada elemek, sayfanın gönderdiği veriyi
            gizlemek olurdu. Her kartın durumu kendi rozetinde yazıyor.

            `reporter`/`assignedAdmin`/`onClick` geçilmiyor — üçünün de kanalı
            yok (`ListingReviewData` yalnız `ListingReport[]` taşıyor). Kart ham
            kimliği gösterir; uydurulmadı, raporlandı.
          */}
          <AyriBolum
            title={BOLUM.reports}
            data={reports}
            error={errors.reports}
            render={(veri) =>
              veri.length === 0 ? (
                <EmptyState
                  variant="compact"
                  title="Bu ilana açılmış şikayet yok"
                  description="Şikayet geçmişi boş. Karar verirken yalnız ilanın kendisine ve otomatik kontrollere bakılır."
                />
              ) : (
                <ul className={css.reportList}>
                  {veri.map((report) => (
                    <li key={report.id} className={css.reportItem}>
                      <ReportCard report={report} listing={listing} variant="detailed" />
                    </li>
                  ))}
                </ul>
              )
            }
          />
        </div>
      </div>

      {/*
        Çakışmanın cevabı: yeniden yükle.

        Çubuk çakışmayı bildiriyor ama **tekrar deneme butonu sunmuyor ve
        sunmamalı** — aynı damga aynı çakışmayı üretir, damgayı yenilemek ise
        görülmemiş bir içeriği onaylamak olur. Uyarının kendisi "ilanı yeniden
        yükleyip değişikliklere bakın" diyor; o eylemin sahibi bu ekran ve
        `onRetry` tam olarak o kanal. Bilerek "Tekrar dene" demiyor: tekrar
        denenen şey karar değil, ilanın **okunması**.
      */}
      {cakisma ? (
        <div className={css.conflictReload}>
          <Button
            variant="secondary"
            leadingIcon={<RotateCcw size={16} />}
            onClick={() => onRetry()}
          >
            İlanı yeniden yükle
          </Button>
        </div>
      ) : null}

      {/*
        Çubuk `css.root`'un DOĞRUDAN çocuğu — bkz. `.css.ts`. Bir div'e sarmak
        `stickyBottom`'ı sessizce iptal ederdi.

        `decisionError` burada, `state`'in yanında değil: ilan sorunsuz
        yüklenmişken karar reddedilebilir. Çubuğa geçiliyor, çubuk onu `danger`
        bir `Alert` ile kendi render ediyor; ekran onu bir hata bloğuna
        çevirmiyor ve ekranda duran ilanı gizlemiyor.
      */}
      <ModerationActionBar
        listingId={listing.id}
        status={listing.status}
        revision={listing.revision}
        capabilities={capabilities}
        variant="stickyBottom"
        onApprove={onApprove}
        onReject={onReject}
        onRequestChanges={onRequestChanges}
        {...(submittingAction !== undefined && { submittingAction })}
        {...(decisionError !== undefined && { decisionError })}
        {...(onPause !== undefined && { onPause })}
        {...(onArchive !== undefined && { onArchive })}
      />
    </div>
  )
}

/**
 * Yükleniyor: ölçü koruyan iskelet, spinner'lı boş ekran değil (brifing 2.1).
 *
 * Kendi `loading` kanalı olan paneller (`ImageGallery`, `ModerationHistory`,
 * `AutomatedChecksPanel`) kendi iskeletlerini çiziyor — ekran onların ölçüsünü
 * ikinci kez tahmin etmiyor. Kanalı olmayanların (`ListingFacts`,
 * `LocationPanel`, `SellerPanel`, `PromotionFlagsPanel`) yerini ekran tutuyor;
 * AGENTS.md bunu zaten sayfanın işi diye yazıyor: panelin kendi iskeletini
 * uydurması, veri gelmediğinde "promosyon yok" demekle aynı yalan olurdu.
 *
 * Başlıklar iskelette de duruyor: metin ekranın kendi malı, veri gelince
 * zıplamıyor ve belge yapısı ilk kareden itibaren okunuyor.
 *
 * Karar çubuğu yok — `status` ve `revision` gelmeden hangi eylemin var olduğu
 * bilinemez; boş bir çubuk çizmek olmayan seçenekler sunmak olurdu.
 */
function Iskelet() {
  return (
    <div className={css.root}>
      <div className={css.columns}>
        <div className={css.column}>
          <Bolum title={BOLUM.photos}>
            <ImageGallery photos={[]} loading />
          </Bolum>
          <Bolum title={BOLUM.facts}>
            <Skeleton variant="rectangle" height="14rem" />
          </Bolum>
          <Bolum title={BOLUM.metrics}>
            <Skeleton variant="rectangle" height="5rem" />
          </Bolum>
          <Bolum title={BOLUM.location}>
            <Skeleton variant="rectangle" height="12rem" />
          </Bolum>
          <Bolum title={BOLUM.history}>
            <ModerationHistory events={[]} loading />
          </Bolum>
        </div>

        <div className={css.column}>
          <Bolum title={BOLUM.seller}>
            <Skeleton variant="rectangle" height="12rem" />
          </Bolum>
          <Bolum title={BOLUM.promotions}>
            <Skeleton variant="rectangle" height="8rem" />
          </Bolum>
          <Bolum title={BOLUM.checks}>
            <AutomatedChecksPanel items={[]} loading />
          </Bolum>
          <Bolum title={BOLUM.reports}>
            <Skeleton variant="rectangle" height="8rem" />
          </Bolum>
        </div>
      </div>
    </div>
  )
}

/**
 * Bir ilanın bütün inceleme alanları ve karar çubuğu.
 *
 * Veri **prop'tan gelir**, ekran çekmez. Kabuk (`AppShell`/`TopBar`/
 * `SidebarNav`/`PageHeader`) burada yok: bu ekran onun **içeriğidir**, kendisi
 * değil — ve bu yüzden kendi `<h1>`'i de yok (bkz. `Bolum`).
 *
 * ## `state` ve `decisionError` aynı eksende değil
 *
 * `state` "veri geldi mi", `decisionError` "gönderdiğim karar uygulandı mı"
 * sorusunu cevaplıyor. İlan sorunsuz yüklenmişken (`status: 'success'`) karar
 * reddedilebilir; ikisi aynı eksende olsaydı reddedilen bir karar ekranda duran
 * ilanı hata bloğuna çevirirdi. `decisionError` bu yüzden `ModerationActionBar`'a
 * geçiliyor ve orada `danger` bir `Alert` olarak çıkıyor; ekran onu **hata
 * durumu saymıyor**.
 *
 * ## `notFound` bir `AsyncState` üyesi değil — `empty`'den türetiliyor
 *
 * Brifing 2.5 ve 3.5 `notFound`'u zorunlu tutuyor ama `AsyncState`'te öyle bir
 * üye yok ve uydurma prop eklenmedi. Türetme şu okumaya dayanıyor: `empty`,
 * liste ekranında "bu filtreye uyan sonuç yok" demek; **tek kayıtlık** bir
 * ekranda aynı cümlenin tekil karşılığı "böyle bir ilan yok"tur. `error` değil,
 * çünkü hiçbir şey ters gitmedi — sunucu soruyu anladı ve cevabı "yok".
 * `unauthorized` da değil: yetki sorunu olsaydı sunucu 403 derdi. Geriye `empty`
 * kalıyor ve brifing 2.1 onun karşılığını zaten `EmptyState` diye yazıyor.
 * (Sözleşmeye `notFound` eklenirse burası tek satırlık bir değişiklik olur.)
 *
 * ## İki kapı, tek kural
 *
 * Hangi kararın görüneceğine ekran karışmıyor: `capabilities` (yetki) ve ilanın
 * durumu (`domain/moderationActions.ts`) çubuğun içinde birleşiyor. Yetkisi
 * olmayan eylem `disabled` değil, **yok**.
 *
 * ## `ModerationActionBar` neden `sideRail` değil
 *
 * `variant` bir JS kararı; ekranın viewport kanalı yok ve repoda container query
 * yok. Çubuğu iki kez (biri mobil sticky, biri geniş ekran rayı) render edip
 * CSS ile birini gizlemek üç şeyi birden bozardı: iki taslak state'i (moderatör
 * notu hangisinde?), iki dialog ve her karar butonunun erişilebilir adının iki
 * kopyası. Tek kopya `stickyBottom` ile render ediliyor — her genişlikte
 * erişilebilir olan tek varyant. "Wide side rail" düzeni yan **panellerin**
 * rayında karşılanıyor. Çubuğun `sideRail` varyantı bu ekranda kullanılamıyor;
 * boşluk raporlandı.
 *
 * @example
 * <ListingReviewPanel
 *   state={{ status: 'success', data: { listing, events, reports, seller } }}
 *   capabilities={yetkiler}
 *   onApprove={onayla}
 *   onReject={reddet}
 *   onRequestChanges={duzeltmeIste}
 *   onRetry={yenidenYukle}
 * />
 */
export function ListingReviewPanel({
  state,
  capabilities,
  submittingAction,
  decisionError,
  revealExactLocation = false,
  onApprove,
  onReject,
  onRequestChanges,
  onPause,
  onArchive,
  onRetry,
}: ListingReviewPanelProps) {
  if (state.status === 'idle' || state.status === 'loading') {
    return <Iskelet />
  }

  if (state.status === 'empty') {
    return (
      <EmptyState
        title="İlan bulunamadı"
        description="Bu ilan silinmiş ya da hiç var olmamış olabilir. Kuyruktan yeniden açmayı deneyin; bağlantıyı biri paylaştıysa ilan numarasını doğrulatın."
      />
    )
  }

  /*
    Tekrar deneme butonu yok ve `retryable` tip düzeyinde `false`: 403'ü tekrar
    denemek aynı 403'ü verir. `error`'dan ayrı bir ekran, çünkü söylediği şey
    farklı — "bir şey ters gitti" değil, "bu senin görebileceğin bir şey değil".
  */
  if (state.status === 'unauthorized') {
    return (
      <ErrorState
        variant="page"
        title={state.error.title}
        description={state.error.message}
        {...(state.error.code !== undefined && { code: state.error.code })}
      />
    )
  }

  /*
    Buton **iki kapıdan** geçince çıkar: hata tekrar denenebilir olacak
    (`retryable`) ve tekrar denemeyi yapacak bir handler bağlı olacak. Bu ekranda
    ikinci kapı tip düzeyinde zaten açık — `onRetry` zorunlu bir prop — ama kural
    yazıldığı gibi duruyor: `retryable: false` iken buton sunmak kullanıcıyı
    boşa uğraştırır.
  */
  if (state.status === 'error') {
    return (
      <ErrorState
        variant="page"
        title={state.error.title}
        description={state.error.message}
        {...(state.error.code !== undefined && { code: state.error.code })}
        {...(state.error.retryable && { onRetry })}
      />
    )
  }

  const ortak = {
    capabilities,
    revealExactLocation,
    onApprove,
    onReject,
    onRequestChanges,
    onRetry,
    ...(submittingAction !== undefined && { submittingAction }),
    ...(decisionError !== undefined && { decisionError }),
    ...(onPause !== undefined && { onPause }),
    ...(onArchive !== undefined && { onArchive }),
  }

  if (state.status === 'partialSuccess') {
    const { listing } = state.data

    /*
      İlanın kendisi gelmediyse ortada inceleme yok: satıcı kartı ve şikayet
      listesi tek başına bir ilan detayı değil. Bu, `partialSuccess`'in
      `error`'a düştüğü tek nokta — geri kalan her alan tek tek düşebilir ve
      komşuları ayakta kalır.
    */
    if (listing === undefined) {
      const hata = state.errors.listing

      return (
        <ErrorState
          variant="page"
          title={hata?.title ?? 'İlan yüklenemedi'}
          description={
            hata?.message ??
            'İlanın kendisi çekilemedi; yan bilgiler tek başına inceleme için yeterli değil.'
          }
          {...(hata !== undefined && hata.code !== undefined && { code: hata.code })}
          {...((hata === undefined || hata.retryable) && { onRetry })}
        />
      )
    }

    return (
      <Icerik {...ortak} data={{ ...state.data, listing }} errors={state.errors} stale={false} />
    )
  }

  return <Icerik {...ortak} data={state.data} errors={{}} stale={state.stale === true} />
}
