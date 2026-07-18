import type { ReactNode } from 'react'
import { AlertTriangle, ArrowUpRight, Check, X } from 'lucide-react'
import { ReportReason, ReportSeverity, ReportStatus, type ListingReport } from '../../types/domain'
import {
  REPORT_REASON_LABEL,
  REPORT_SEVERITY_LABEL,
  REPORT_STATUS_LABEL,
} from '../../domain/labels'
import { formatDateTime, machineDateTime } from '../../utils/formatDateTime'
import { Alert } from '../../components/primitives/Alert'
import { Badge } from '../../components/primitives/Badge'
import { Button } from '../../components/primitives/Button'
import { DataTable } from '../../components/composites/DataTable'
import { EmptyState } from '../../components/composites/EmptyState'
import { ErrorState } from '../../components/composites/ErrorState'
import { FilterBar } from '../../components/composites/FilterBar'
import { Pagination } from '../../components/composites/Pagination'
import { ReportCard } from '../../components/composites/ReportCard'
import type {
  ColumnDef,
  DateRange,
  FilterDefinition,
  FilterValue,
  ReportFilterValues,
  ReportManagementPageProps,
  SelectOption,
  UiError,
} from '../../types/component-props'
import * as css from './ReportManagementPage.css'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

/**
 * Şiddet tonu — `ReportCard`'ın kendi tablosuyla **birebir aynı**.
 *
 * Kopya bilerek ve gönülsüz: aynı şikayet mobilde kartta, masaüstünde tabloda
 * görünüyor ve ikisi farklı ton verirse aynı kayıt iki ekranda iki ayrı aciliyet
 * anlatır. `ReportCard` haritasını dışa aktarmıyor (component içi sabit) ve
 * `domain/labels.ts` yalnız metin taşıyor — tonun doğru evi
 * `src/domain/`'de bir `REPORT_SEVERITY_TONE` olurdu. Ekran domain'e yazamaz,
 * bu yüzden kopya burada duruyor ve raporlandı.
 *
 * `satisfies Record<ReportSeverity, Tone>` bilerek: domain'e yeni bir seviye
 * eklenip tonu yazılmazsa derleme durur — tonsuz bir şiddet sessizce nötre
 * düşüp kuyrukta sıradan görünmez.
 */
const SIDDET_TONU = {
  [ReportSeverity.Low]: 'neutral',
  [ReportSeverity.Medium]: 'info',
  [ReportSeverity.High]: 'warning',
  [ReportSeverity.Critical]: 'danger',
} as const satisfies Record<ReportSeverity, Tone>

/** Durum tonu — `ReportCard` ile aynı; gerekçe `SIDDET_TONU`'nda. */
const DURUM_TONU = {
  [ReportStatus.Open]: 'warning',
  [ReportStatus.InReview]: 'info',
  [ReportStatus.Resolved]: 'success',
  [ReportStatus.Dismissed]: 'neutral',
} as const satisfies Record<ReportStatus, Tone>

/**
 * Karar eylemlerinin (Çöz / Geçersiz say / Eskale et) görüneceği durumlar.
 *
 * **Bu bir yetki kapısı değil, durum kapısıdır** ve ekranın elindeki tek gerçek
 * kapı odur: `ReportManagementPageProps` izin listesi taşımıyor (raporlandı),
 * ama `report.status` sözleşmede var. Sonuçlanmış bir şikayete "Çöz" sunmak
 * brifing 2.8'in `alreadyResolved` durumunun ekranda görünen hâli olurdu —
 * kullanıcı basar, sunucu reddeder, ekranın söyleyecek sözü olmaz.
 *
 * `domain/moderationActions.ts` ilan kararları için tam olarak bu tabloyu
 * (`allowedFrom`) tutuyor; şikayetin karşılığı **yok**. Bu liste onun yerel ve
 * geçici hâli: doğru evi `domain/reportActions.ts`. Raporlandı, uydurulmadı —
 * kural kendiliğinden apaçık (kapanmış şikayet yeniden kapatılamaz) ve ekran
 * bir karar vermeden hiçbir eylem gösteremezdi.
 */
const KARAR_VERILEBILIR_DURUMLAR: readonly ReportStatus[] = [
  ReportStatus.Open,
  ReportStatus.InReview,
]

/**
 * Seçenekler **enum'dan** türetiliyor, elle yazılmıyor.
 *
 * Sıra enum'un bildirim sırası, yani brifingin sırası. Elle yazılmış bir liste
 * domain'e yeni bir üye eklendiğinde sessizce eksik kalırdı; etiketi
 * `satisfies Record<...>` ile bağlı olan sözlükten okumak da eksik etiketi
 * derleme hatasına çevirir (`domain/categoryTree.ts` ile aynı gerekçe).
 */
const SEBEP_SECENEKLERI: SelectOption[] = Object.values(ReportReason).map((deger) => ({
  value: deger,
  label: REPORT_REASON_LABEL[deger],
}))

const DURUM_SECENEKLERI: SelectOption[] = Object.values(ReportStatus).map((deger) => ({
  value: deger,
  label: REPORT_STATUS_LABEL[deger],
}))

const SIDDET_SECENEKLERI: SelectOption[] = Object.values(ReportSeverity).map((deger) => ({
  value: deger,
  label: REPORT_SEVERITY_LABEL[deger],
}))

/**
 * Filtre alanları.
 *
 * **`assignedAdminId` alanı yok, bilerek.** `ReportFilterValues` onu taşıyor ama
 * ekranın elinde admin listesi yok (`ReportManagementPageProps` yalnız
 * `Paginated<ListingReport>` alıyor), dolayısıyla seçeneksiz bir `select` ya da
 * UUID yazdıran bir metin kutusu çıkardı — ikisi de kullanılamaz. Alanın
 * kendisi susturulmadı: aktif filtre sayacı onu **sayıyor** ve "Temizle" onu
 * **temizliyor**, yani URL'den gelen bir `assignedAdminId` kullanıcıya görünmez
 * bir şekilde listeyi daraltmıyor. Raporlandı.
 */
const FILTRE_TANIMLARI: FilterDefinition[] = [
  {
    id: 'query',
    label: 'Ara',
    type: 'text',
    placeholder: 'Şikayet no, ilan kimliği veya açıklama',
  },
  {
    id: 'reasons',
    label: 'Şikayet sebebi',
    type: 'multiSelect',
    options: SEBEP_SECENEKLERI,
    placeholder: 'Tümü',
  },
  {
    id: 'statuses',
    label: 'Durum',
    type: 'multiSelect',
    options: DURUM_SECENEKLERI,
    placeholder: 'Tümü',
  },
  {
    id: 'severities',
    label: 'Şiddet',
    type: 'multiSelect',
    options: SIDDET_SECENEKLERI,
    placeholder: 'Tümü',
  },
  { id: 'dateRange', label: 'Şikayet tarihi', type: 'dateRange' },
]

/** Hiçbir şeyi elemeyen filtre kümesi; "Temizle" bunu geri yazar. */
function bosFiltreler(): ReportFilterValues {
  return { reasons: [], statuses: [], severities: [], dateRange: {} }
}

/**
 * `FilterValue`'yu enum dizisine daraltır.
 *
 * Şekli bozuk bir değer (kaydedilmiş eski görünüm, elle yazılmış URL
 * parametresi) sessizce elenir; `FilterBar`'ın kendi daraltmasıyla aynı ilke —
 * kutuda boş görünen alan `onFiltersChange`'e de boş gider.
 */
function enumSuz<T extends string>(deger: FilterValue, gecerli: readonly T[]): T[] {
  if (!Array.isArray(deger)) return []
  return deger.filter((x): x is T => (gecerli as readonly string[]).includes(x))
}

/**
 * `FilterValue`'yu `DateRange`'e daraltır.
 *
 * `'from' in deger` şart: `FilterValue`'nun nesne üyeleri `DateRange` ve
 * `NumberRange` ve ikisi de tamamı opsiyonel — TypeScript onları alan adına
 * bakmadan ayıramaz.
 */
function tarihAraligiOku(deger: FilterValue): DateRange {
  if (typeof deger !== 'object' || deger === null || Array.isArray(deger)) return {}

  const aralik: DateRange = {}
  if ('from' in deger && deger.from !== undefined) aralik.from = deger.from
  if ('to' in deger && deger.to !== undefined) aralik.to = deger.to
  return aralik
}

/**
 * Metin filtresini yazar.
 *
 * `{ ...filters, query: metin }` yazılamıyor: `exactOptionalPropertyTypes`
 * açıkken `query?: string` alanına `undefined` atanamaz (TS2375). Alan
 * temizlendiğinde `undefined` yapılmaz, **silinir** — yokluk ile boş string
 * aynı şey değil ve `bosFiltreler()` de anahtarı hiç yazmıyor.
 *
 * Metin kırpılmıyor: kullanıcı iki kelime arasına boşluk koyarken her tuşta
 * `onChange` çağrılıyor ve `trim` boşluğu yutup imleci kilitlerdi. Kırpma,
 * isteği ne zaman atacağına karar veren sayfa katmanının işi.
 */
function sorguYaz(filters: ReportFilterValues, deger: FilterValue): ReportFilterValues {
  const sonraki: ReportFilterValues = { ...filters }
  const metin = typeof deger === 'string' ? deger : ''

  if (metin === '') delete sonraki.query
  else sonraki.query = metin

  return sonraki
}

/**
 * Her alan kendi yazıcı fonksiyonunu taşır.
 *
 * `guncelle({ [id]: deger })` kalıbı **kullanılmıyor**: AGENTS.md'de ölçüldü —
 * hesaplanmış birleşim anahtarı `Partial<T>`'ye giderken değer tipini hiç
 * denetlemiyor ve `{ [id]: 'bu bir string' }` bile temiz derleniyor. Yazıcılar
 * ayrı olunca yanlış alan/tip TS2322 verir.
 */
const FILTRE_YAZICILARI: Record<
  string,
  (filters: ReportFilterValues, deger: FilterValue) => ReportFilterValues
> = {
  query: sorguYaz,
  reasons: (filters, deger) => ({
    ...filters,
    reasons: enumSuz(deger, Object.values(ReportReason)),
  }),
  statuses: (filters, deger) => ({
    ...filters,
    statuses: enumSuz(deger, Object.values(ReportStatus)),
  }),
  severities: (filters, deger) => ({
    ...filters,
    severities: enumSuz(deger, Object.values(ReportSeverity)),
  }),
  dateRange: (filters, deger) => ({ ...filters, dateRange: tarihAraligiOku(deger) }),
}

/**
 * Kaç filtre gerçekten bir şey eliyor.
 *
 * **`filteredEmpty` bir `AsyncState` üyesi değil** — sözleşme onu taşımıyor ve
 * taşımamalı: sunucu "sonuç yok" der, "filtre yüzünden sonuç yok" diyemez,
 * çünkü filtreyi bilen istemcidir. Ayrımı ekran türetir: `status === 'empty'`
 * **ve** bu sayı sıfırdan büyükse boşluğun sebebi filtredir ve kullanıcının
 * atacağı adım "filtreleri gevşet"tir; sıfırsa gerçekten hiç şikayet yoktur ve
 * yapacak bir şey yoktur — biri eylem önerir, öteki iyi haber verir.
 *
 * `FilterBar`'ın kendi sayacı **kullanılamaz**: o `definitions` üzerinden sayar
 * ve `assignedAdminId`'nin tanımı yok (yukarıya bak), yani URL'den gelen bir
 * admin filtresi hem rozette hem burada görünmezdi. Sayı bu yüzden
 * `ReportFilterValues`'ın kendisinden okunuyor ve `FilterBar`'a
 * `activeFilterCount` ile geçiliyor — "aktif" tanımının ekrana ait olabileceğini
 * prop'un JSDoc'u zaten söylüyor.
 */
function aktifFiltreSayisi(filters: ReportFilterValues): number {
  let sayi = 0

  if ((filters.query ?? '') !== '') sayi += 1
  if (filters.reasons.length > 0) sayi += 1
  if (filters.statuses.length > 0) sayi += 1
  if (filters.severities.length > 0) sayi += 1
  if (filters.assignedAdminId !== undefined) sayi += 1
  if (filters.dateRange.from !== undefined || filters.dateRange.to !== undefined) sayi += 1

  return sayi
}

/** `FilterBar` kontrollü: değerler `ReportFilterValues`'tan, tanım id'leriyle eşlenir. */
function filtreDegerleri(filters: ReportFilterValues): Record<string, FilterValue> {
  return {
    query: filters.query ?? '',
    reasons: [...filters.reasons],
    statuses: [...filters.statuses],
    severities: [...filters.severities],
    dateRange: filters.dateRange,
  }
}

/**
 * Aynı ilana bağlı şikayetleri sayar — **yalnız bu sayfadakileri**.
 *
 * `ReportCardProps.relatedReportCount`'un JSDoc'u "sayan çağırandır" diyor ve
 * çağıran bu ekran; ama ekranın elindeki tek küme `state.data.items`, yani bir
 * sayfa. Gerçek toplam sözleşmede **hiç yok** (raporlandı) ve
 * `Paginated<ListingReport>` onu taşıyamaz.
 *
 * **Sayfa-yerel sayı yine de geçiliyor, çünkü hiç geçmemeye baskın:**
 * - Sayı bir **alt sınırdır** — asla olduğundan fazla göstermez, yani hiçbir
 *   şikayeti hak etmediği aciliyete yükseltmez.
 *   (Kart her hâlükârda diğerlerini sayar, kendini saymaz: 3 şikayetli ilanın
 *   her kartı `2` taşır.)
 * - Kardeşleri başka sayfada kalan bir şikayette sayı `0`'a düşer ve kart
 *   rozeti hiç göstermez — bu, prop'u **hiç geçmemekle birebir aynı render**.
 *   Yani sayfa-yerel sayı hiç geçmemekten kötü olamaz, kardeşler aynı sayfaya
 *   düştüğünde ise kesinlikle iyidir.
 *
 * Kalan kusur gerçek ve raporlandı: sayı sayfa değiştikçe **değişir** ve rozet
 * "2 benzer şikayet daha" derken gerçek 4 olabilir. Doğru çözüm sayıyı veri
 * paketine koymak (`Record<UUID, number>` ya da `ListingReport` üzerinde bir
 * alan); o gelene kadar alt sınır, sessizlikten iyidir.
 */
function benzerSikayetSayaci(items: readonly ListingReport[]): Map<string, number> {
  const sayac = new Map<string, number>()

  for (const report of items) {
    sayac.set(report.listingId, (sayac.get(report.listingId) ?? 0) + 1)
  }

  return sayac
}

/** `2026-07-13T09:12:00+03:00` → görünür `13 Tem 2026 09:12` + makine değeri. */
function Zaman({ value }: { value: string }) {
  return <time dateTime={machineDateTime(value)}>{formatDateTime(value)}</time>
}

/**
 * Şikayet filtresi, kuyruğu ve karar eylemleri.
 *
 * Veri **prop'tan gelir, çekilmez** (`state: AsyncState<Paginated<ListingReport>>`).
 * Ekran kabuk değildir: `AppShell`/`TopBar`/`SidebarNav`/`PageHeader` render
 * etmez ve kendi `<h1>`'i yoktur — sayfa başlığı kabuğun işi, buradaki en üst
 * başlık `<h2>`.
 *
 * **Düzen:** 48rem'in altında `ReportCard`'ın `queue` varyantından kuyruk
 * kartları, üstünde `DataTable`. İkisi de aynı şikayetleri, aynı etiketlerle ve
 * aynı tonlarla gösterir; geçişi ekran yapar çünkü `DataTable`'ın
 * `mobileMode="cards"` kanalı viewport'a bakmıyor (gerekçe `.css.ts`'te).
 *
 * **`AsyncState` altı hâliyle karşılanıyor:**
 * - `idle`/`loading`: tablo **başlığı korunur**, satırlar skeleton olur — veri
 *   gelince düzen zıplamaz ve boş bir ekranda dönen spinner kalmaz.
 * - `error`: `ErrorState` (DataTable'ın hata dalı). Tekrar deneme butonu **iki
 *   kapıdan** geçer: `error.retryable === true` **ve** `onRetry` bağlı. Bu
 *   ekranda `onRetry` sözleşme gereği zorunlu, yani ikinci kapı hep açık —
 *   ama kural kodda duruyor: tekrar denenebilir *olduğunu bilmek* tekrar
 *   denemeyi *yapabilmek* değil.
 * - `unauthorized`: `ErrorState variant="page"`, tekrar dene **yok**
 *   (`retryable` tip düzeyinde `false`; 403'ü tekrar denemek aynı 403'ü verir).
 *   Filtre çubuğu da yok: görülemeyen bir listeyi süzmek anlamsız.
 * - `empty`: filtre aktifse `EmptyState variant="filtered"` + "Filtreleri
 *   temizle"; değilse düz `empty` — "hiç şikayet yok" bir hata değil, **iyi
 *   haber**.
 * - `partialSuccess`: gelen şikayetler gösterilir, gelmeyen alan `Alert` ile
 *   söylenir.
 * - `success` + `stale`: veri + üstte bayatlık uyarısı.
 *
 * **Yetki kapısı YOK ve bu bir eksiklik.** `ReportManagementPageProps`
 * `availablePermissions` taşımıyor — `ListingListPageProps`,
 * `UserManagementPageProps` ve `UserDetailPageProps` taşıyor, `ApprovalQueueProps`
 * `capabilities` taşıyor. Üç karar handler'ı da (`onResolve`/`onDismiss`/
 * `onEscalate`) **zorunlu**, yani "bu kullanıcı çözemez" tip düzeyinde bile
 * söylenemiyor. Sonuç: `report:triageLimited` kademesindeki içerik denetçisi bu
 * ekranda "Çöz" butonunu görüyor. Kapı geldiğinde sıra **kapsayıcı** olmalı:
 * önce `AdminPermission.ReportTriage`, sonra `ReportTriageLimited`'a düşülmeli —
 * ters sıra `superAdmin`'e daraltılmış görünüm verir. Raporlandı; uydurulmadı.
 *
 * **Ad ve ilan çözümlemesi yapılamıyor.** Veri paketi yalnız
 * `Paginated<ListingReport>`; ilan, şikayetçi ve atanan admin ayrı kayıtlar ve
 * ekran veri çekmiyor. Bu yüzden `ReportCardProps`'un `listing`, `reporter` ve
 * `assignedAdmin` prop'ları **geçilemiyor** ve kart/tablo elindeki tek gerçeği —
 * kimliği — gösteriyor: eksik bağlam, kırık başvuru değil. Fixture'dan okumak
 * çözüm değil, uydurmadır. Raporlandı.
 *
 * **Bekleme süresi gösterilemiyor.** `ReportCardProps.now` Faz 3'te tam bu ekran
 * için eklendi ama `ReportManagementPageProps`'ta `now` kanalı yok ve ekran
 * `new Date()` çağıramaz (göreli zaman tuzağı: aynı story dün "3 gündür", bugün
 * "4 gündür" derdi). Sabit bir "bugün" gömmek daha kötüsü olurdu — üretimde her
 * kart yanlış bir süre yazardı. Kart `now` verilmeyince açılış anını **mutlak
 * tarih** olarak gösteriyor, ki brifing 2.8'in istediği görünen veri de tam
 * olarak odur ("Şikayet tarihi"). Raporlandı.
 *
 * @example
 * <ReportManagementPage
 *   state={{ status: 'success', data: sayfa }}
 *   filters={filtreler}
 *   onFiltersChange={setFiltreler}
 *   onPageChange={setSayfa}
 *   onReportOpen={(report) => navigate(`/sikayetler/${report.id}`)}
 *   onResolve={coz}
 *   onDismiss={gecersizSay}
 *   onEscalate={eskaleEt}
 *   onRetry={refetch}
 * />
 */
export function ReportManagementPage({
  state,
  filters,
  onFiltersChange,
  onPageChange,
  onReportOpen,
  onResolve,
  onDismiss,
  onEscalate,
  onRetry,
}: ReportManagementPageProps) {
  const aktifSayi = aktifFiltreSayisi(filters)

  const filtreDegistir = (id: string, deger: FilterValue) => {
    const yaz = FILTRE_YAZICILARI[id]
    /* Tanımsız bir id gelmez; gelirse filtreyi bozmaktansa yok saymak doğru. */
    if (yaz === undefined) return
    onFiltersChange(yaz(filters, deger))
  }

  const filtreCubugu = (
    <FilterBar
      definitions={FILTRE_TANIMLARI}
      values={filtreDegerleri(filters)}
      variant="inline"
      activeFilterCount={aktifSayi}
      onChange={(id, deger) => filtreDegistir(id, deger)}
      onClear={() => onFiltersChange(bosFiltreler())}
    />
  )

  /**
   * Karar eylemleri. Kapalı şikayette `undefined` — kart ve tablo o zaman eylem
   * kutusunu hiç çizmez ("yapılamayacak eylem `disabled` verilmez, hiç render
   * edilmez").
   */
  const satirEylemleri = (report: ListingReport): ReactNode => {
    if (!KARAR_VERILEBILIR_DURUMLAR.includes(report.status)) return undefined

    return (
      <>
        <Button
          size="sm"
          variant="secondary"
          leadingIcon={<Check size={16} />}
          onClick={() => onResolve(report)}
        >
          Çöz
        </Button>
        <Button
          size="sm"
          variant="ghost"
          leadingIcon={<X size={16} />}
          onClick={() => onDismiss(report)}
        >
          Geçersiz say
        </Button>
        <Button
          size="sm"
          variant="ghost"
          leadingIcon={<ArrowUpRight size={16} />}
          onClick={() => onEscalate(report)}
        >
          Eskale et
        </Button>
      </>
    )
  }

  /**
   * Masaüstü tablosunun sütunları.
   *
   * Hiçbiri `sortable` **değil**: `ReportManagementPageProps`'ta `onSortChange`
   * kanalı yok, yani sıralanabilir bir başlık basınca hiçbir şey olmayan bir
   * buton olurdu (`SearchInput`'un bağlanmamış `onClear`'ıyla aynı sessiz
   * bozukluk). Raporlandı.
   */
  const sutunlar = (benzer: (report: ListingReport) => number): ColumnDef<ListingReport>[] => [
    {
      id: 'id',
      header: 'Şikayet no',
      width: '15rem',
      cell: (row) => (
        <button type="button" className={css.openButton} onClick={() => onReportOpen(row)}>
          {row.id}
          {/*
            Erişilebilir ad görünür metni İÇERMEK ZORUNDA (axe `label-in-name`),
            bu yüzden `aria-label` ile değiştirilmiyor — görünmeyen bir sonek
            ekleniyor: ad "report-pension-fraud şikayetini aç" olur. Ekran
            okuyucu kullanıcısı 12 satırda 12 farklı ad duyar; `aria-label`
            olsaydı görünen kimlik ile duyulan ad ayrışırdı.
          */}
          <span className={css.visuallyHidden}> şikayetini aç</span>
        </button>
      ),
    },
    {
      id: 'listing',
      header: 'İlan',
      /*
        Brifing 2.8 "İlan özeti" ve "İlanın mevcut durumu" istiyor; ikisi de
        `Listing` gerektiriyor ve veri paketinde ilan yok. Gösterilen şey
        elimizdeki tek gerçek: ilanın kimliği. Raporlandı.
      */
      cell: (row) => <span className={css.identifier}>{row.listingId}</span>,
    },
    { id: 'reason', header: 'Sebep', cell: (row) => REPORT_REASON_LABEL[row.reason] },
    {
      id: 'severity',
      header: 'Şiddet',
      /*
        Şiddet renkle VE metinle: `critical` ile `high` farkı yalnız tondan
        okunamaz. İkon da dekoratif — rozetin yazısı bilgiyi tek başına taşıyor.
      */
      cell: (row) => (
        <Badge
          tone={SIDDET_TONU[row.severity]}
          variant={row.severity === ReportSeverity.Critical ? 'solid' : 'soft'}
          size="sm"
          leadingIcon={<AlertTriangle size={12} />}
        >
          {REPORT_SEVERITY_LABEL[row.severity]} şiddet
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Durum',
      /*
        Şiddet ve durum İKİ AYRI EKSEN; tablo ikisini de gösterir, birini
        diğerinin yerine geçirmez. İki rozetin aynı tonu alması mümkün ve sorun
        değil — okuyan kişi tonu değil yazıyı okur.
      */
      cell: (row) => (
        <Badge tone={DURUM_TONU[row.status]} size="sm">
          {REPORT_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      id: 'reporter',
      header: 'Şikayet eden',
      /*
        Anonim şikayet gerçek bir hâl: form oturum açmadan da doldurulabiliyor.
        Alanın yokluğu bir durum, boş string değil — `ReportCard` ile aynı cümle.
      */
      cell: (row) =>
        row.reporterUserId === undefined ? (
          <span className={css.empty}>Anonim</span>
        ) : (
          <span className={css.identifier}>{row.reporterUserId}</span>
        ),
    },
    {
      id: 'assignedAdmin',
      header: 'Atanan admin',
      cell: (row) =>
        row.assignedAdminId === undefined ? (
          <span className={css.empty}>Atanmadı</span>
        ) : (
          <span className={css.identifier}>{row.assignedAdminId}</span>
        ),
    },
    { id: 'createdAt', header: 'Şikayet tarihi', cell: (row) => <Zaman value={row.createdAt} /> },
    {
      id: 'related',
      header: 'Benzer şikayet',
      align: 'center',
      cell: (row) => {
        const sayi = benzer(row)
        return sayi > 0 ? (
          <Badge tone="warning" size="sm">
            {sayi} benzer şikayet daha
          </Badge>
        ) : (
          <span className={css.empty}>Yok</span>
        )
      },
    },
    {
      id: 'resolutionNote',
      header: 'Çözüm notu',
      cell: (row) =>
        row.resolutionNote === undefined ? (
          <span className={css.empty}>Yok</span>
        ) : (
          <span className={css.note}>{row.resolutionNote}</span>
        ),
    },
    {
      id: 'actions',
      header: 'Eylemler',
      cell: (row) => {
        const eylem = satirEylemleri(row)
        return eylem === undefined ? (
          <span className={css.empty}>Sonuçlandı</span>
        ) : (
          <span className={css.rowActions}>{eylem}</span>
        )
      },
    },
  ]

  const ozetSatiri = (items: ListingReport[], toplam: number): ReactNode => {
    const acik = items.filter((report) => report.status === ReportStatus.Open).length
    const kritik = items.filter((report) => report.severity === ReportSeverity.Critical).length

    return (
      /*
        "Filtrelere uyan" ile "bu sayfada" bilerek ayrı yazılıyor: `totalItems`
        süzülmüş TOPLAM, açık/kritik sayısı ise yalnız elimizdeki sayfadan
        çıkarılabiliyor. İkisini tek cümlede birleştirmek, ikinci sayfaya
        geçince değişen bir "toplam" göstermek olurdu.
      */
      <p className={css.summary}>
        <span className={css.summaryItem}>Filtrelere uyan {toplam} şikayet</span>
        <span className={css.summaryItem}>Bu sayfada {acik} açık şikayet</span>
        <span className={css.summaryItem}>Bu sayfada {kritik} kritik şikayet</span>
      </p>
    )
  }

  const liste = (
    veri: { items: ListingReport[]; page: number; pageSize: number; totalItems: number },
    uyari: ReactNode,
  ): ReactNode => {
    const sayac = benzerSikayetSayaci(veri.items)
    const benzer = (report: ListingReport) => (sayac.get(report.listingId) ?? 1) - 1

    return (
      <>
        {uyari}

        <div className={css.mobileQueue}>
          {veri.items.map((report) => {
            const eylem = satirEylemleri(report)
            return (
              <ReportCard
                key={report.id}
                report={report}
                variant="queue"
                relatedReportCount={benzer(report)}
                onClick={(secilen) => onReportOpen(secilen)}
                {...(eylem !== undefined && {
                  actions: <span className={css.cardActions}>{eylem}</span>,
                })}
              />
            )
          })}
        </div>

        <div className={css.desktopTable}>
          <DataTable<ListingReport>
            rows={veri.items}
            columns={sutunlar(benzer)}
            density="comfortable"
            visualStyle="bordered"
            mobileMode="scroll"
          />
        </div>

        {/* `totalItems: 0` iken Pagination kendini hiç render etmiyor. */}
        <Pagination
          page={veri.page}
          pageSize={veri.pageSize}
          totalItems={veri.totalItems}
          onPageChange={(sayfa) => onPageChange(sayfa)}
        />
      </>
    )
  }

  const kabuk = (ozet: ReactNode, icerik: ReactNode, filtreGoster = true): ReactNode => (
    <div className={css.page}>
      <div className={css.header}>
        <h2 className={css.title}>Şikayet kuyruğu</h2>
        {ozet}
      </div>

      {filtreGoster ? filtreCubugu : null}
      {icerik}
    </div>
  )

  if (state.status === 'unauthorized') {
    /*
      Tekrar deneme butonu YOK: `retryable` bu durumda tip düzeyinde `false` ve
      403'ü tekrar denemek aynı 403'ü verir — buton kullanıcıyı döngüye sokardı.
      `onRetry` prop'u bağlı olsa da bağlanmıyor; iki kapının biri kapalı.
    */
    return kabuk(
      null,
      <ErrorState
        variant="page"
        title={state.error.title}
        description={state.error.message}
        {...(state.error.code !== undefined && { code: state.error.code })}
      />,
      false,
    )
  }

  if (state.status === 'idle' || state.status === 'loading') {
    /*
      Spinner'la boş ekran yok: tablo BAŞLIĞI korunur, satırlar skeleton olur.
      `rows={[]}` + `loading` — DataTable yükleme dalında satırları zaten kendi
      üretiyor. Kartlar da 48rem altında gizli kalıyor; iskeletin sütun başlıkları
      dar ekranda yatay kaydırılır (`mobileMode="scroll"`), çünkü "hangi alan
      yükleniyor" bilgisi iskelette de duruyor.
    */
    return kabuk(
      null,
      <DataTable<ListingReport>
        rows={[]}
        columns={sutunlar(() => 0)}
        visualStyle="bordered"
        loading
      />,
    )
  }

  if (state.status === 'error') {
    /*
      İKİ KAPI: `retryable: true` tek başına tekrar deneme butonunu çıkarmaz,
      `onRetry` de bağlanmalı. Bu ekranda `onRetry` zorunlu bir prop, yani ikinci
      kapı hep açık — koşul yine de yazılı: DataTable'ın kendi kuralı da bu
      (`retryable` ne derse desin `onRetry` yoksa butonu göstermez) ve sözleşme
      bir gün `onRetry`'yi opsiyonel yaparsa davranışın değişmemesi gerekir.
    */
    return kabuk(
      null,
      <DataTable<ListingReport>
        rows={[]}
        columns={sutunlar(() => 0)}
        visualStyle="bordered"
        error={state.error}
        {...(state.error.retryable && { onRetry })}
      />,
    )
  }

  if (state.status === 'empty') {
    return kabuk(
      null,
      aktifSayi > 0 ? (
        <EmptyState
          variant="filtered"
          title="Filtrelere uyan şikayet yok"
          description="Seçili sebep, durum, şiddet ve tarih aralığıyla eşleşen şikayet bulunamadı. Filtreleri gevşetip tekrar deneyin."
          primaryAction={
            <Button variant="secondary" onClick={() => onFiltersChange(bosFiltreler())}>
              Filtreleri temizle
            </Button>
          }
        />
      ) : (
        /*
          Filtre yokken boşluk bir HATA DEĞİL, iyi haber: şikayet edilecek bir
          şey olmamış. Bu yüzden ne `variant="filtered"`in kesik kenarlığı ne de
          bir eylem var — temizlenecek filtre yok, yapılacak bir şey de yok.
        */
        <EmptyState
          title="Hiç şikayet yok"
          description="Kuyruk temiz. Kullanıcılar bir ilanı şikayet ettiğinde şikayetler burada listelenir."
        />
      ),
    )
  }

  if (state.status === 'partialSuccess') {
    /*
      Bu ekranda `partialSuccess` beklenmiyor: liste tek bir sorgudan geliyor,
      dashboard'un bağımsız grafik sorguları gibi bir yapı yok. Yine de
      sözleşmenin üyesi ve sessizce düşürülemez — gelen şikayetler gösteriliyor,
      gelmeyen alan söyleniyor. `data` `Partial<Paginated<...>>`: gelmeyen alan
      YOK, boş değil; `items` gelmediyse boş dizi koymak `empty` ile `error`'ı
      karıştırırdı, o yüzden uyarı her hâlükârda basılıyor.
    */
    const hatalar = Object.values(state.errors).filter(
      (hata): hata is UiError => hata !== undefined,
    )
    const items = state.data.items ?? []

    return kabuk(
      ozetSatiri(items, state.data.totalItems ?? items.length),
      liste(
        {
          items,
          page: state.data.page ?? 1,
          pageSize: state.data.pageSize ?? items.length,
          totalItems: state.data.totalItems ?? items.length,
        },
        <Alert
          tone="warning"
          title="Şikayet listesinin bir kısmı yüklenemedi"
          description={
            hatalar[0]?.message ??
            'Bazı alanlar gelmedi; görünen şikayetler eksik olabilir. Sayfayı yeniden yükleyin.'
          }
        />,
      ),
    )
  }

  return kabuk(
    ozetSatiri(state.data.items, state.data.totalItems),
    liste(
      state.data,
      state.stale === true ? (
        /*
          Bayat veri gösteriliyor ama gizlenmiyor: `dismissible` verilmedi —
          kalıcı bir durumu kapatılabilir yapmak kullanıcıya "kapat, sorun
          dursun" dedirtirdi.
        */
        <Alert
          tone="info"
          title="Bu liste güncel olmayabilir"
          description="Şikayetler yeniden yüklenemedi; ekranda son başarılı sonuç duruyor."
          action={
            <Button size="sm" variant="secondary" onClick={() => onRetry()}>
              Yenile
            </Button>
          }
        />
      ) : null,
    ),
  )
}
