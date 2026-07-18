import { useId, type ReactNode } from 'react'
import { CheckCircle2, ExternalLink, Lock, ShieldAlert, SkipForward, UserCheck } from 'lucide-react'
import { Alert } from '../../components/primitives/Alert'
import { Badge } from '../../components/primitives/Badge'
import { Button } from '../../components/primitives/Button'
import { Skeleton } from '../../components/primitives/Skeleton'
import { AutomatedChecksPanel } from '../../components/composites/AutomatedChecksPanel'
import { EmptyState } from '../../components/composites/EmptyState'
import { ErrorState } from '../../components/composites/ErrorState'
import { ListingCard } from '../../components/composites/ListingCard'
import {
  AUTOMATED_CHECK_BLOCKING,
  LISTING_FIELD_LABEL,
  REJECTION_REASON_LABEL,
} from '../../domain/labels'
import { isModerationActionAllowedFrom } from '../../domain/moderationActions'
import { formatDateTime } from '../../utils/formatDateTime'
import type { ApprovalQueueProps } from '../../types/component-props'
import type { Listing, Paginated } from '../../types/domain'
import * as css from './ApprovalQueue.css'

/**
 * `ModerationSummary`'nin alan adları.
 *
 * `domain/labels.ts`'te karşılığı **yok**: `LISTING_FIELD_LABEL` yalnız kabın
 * adını ("Moderasyon Özeti") biliyor, içindeki alanlar etiketsiz. Sözlük
 * yazılmadı çünkü `ModerationSummary`'nin alanları düz string/UUID — ortada enum
 * yok ve bugün tek tüketici bu ekran; `LOCATION_FIELD_LABEL`'ın bilerek
 * yazılmamasıyla aynı gerekçe (AGENTS.md). `ListingReviewPanel` aynı adlara
 * ihtiyaç duyarsa `MODERATION_SUMMARY_FIELD_LABEL` olarak domain'e taşınmalı —
 * o an iki yerde yazılı olmaları kural ihlaline döner.
 */
const MODERATION_FIELD_LABEL = {
  currentReviewer: 'Atanan moderatör',
  reviewNote: 'Son düzeltme notu',
  rejectionReasons: 'Red gerekçeleri',
} as const

/**
 * İlan **yüksek riskli** mi — bloklayıcı bir otomatik kontrolden kaldı mı?
 *
 * Eşik uydurulmuyor, `AUTOMATED_CHECK_BLOCKING`'ten okunuyor: brifing 1.2'ye
 * göre `pendingReview → published` geçişinin koşulu "bloklayıcı otomatik kontrol
 * yok" ve `failed` bloklar, `warning` blokla*maz*. İkisini aynı sepete koymak
 * uyarı üreten her ilanı yüksek riskli gösterirdi.
 */
function yuksekRiskli(listing: Listing): boolean {
  return listing.moderation.automatedChecks.some((check) => AUTOMATED_CHECK_BLOCKING[check.status])
}

/**
 * Moderasyon kuyruğu: karar bekleyen ilanları sıraya dizer ve incelemeye yönlendirir.
 *
 * Veri **çekmez** — `state` prop'undan gelir (brifing 2.1'in ortak ekran durumu
 * sözleşmesi). `idle`/`loading` ölçü koruyan iskelet gösterir, `empty` "tüm
 * kuyruk tamamlandı" der (bu **iyi haber**, hata gibi görünmez), `error` tekrar
 * denemeyi, `unauthorized` yetki istemeyi önerir.
 *
 * ## Kuyruk karar VERMEZ, karara GÖNDERİR
 *
 * Brifing 2.4 kuyruktan "hızlı onay", "hızlı red" ve "düzeltme isteme"
 * bekliyor, `ModerationActionBar`'ı da türetilen componentler arasında sayıyor —
 * ama `ApprovalQueueProps`'ta `onApprove`/`onReject`/`onRequestChanges`
 * **yok**. Çubuk render edilseydi bastığında hiçbir şey olmayan üç buton
 * çıkardı; repo kuralı bunun tersini söylüyor ("sonuçsuz kutu sunmanın anlamı
 * yok" — `RolePermissionMatrix`, `TopBar`'ın bildirim zili). Bu yüzden kuyruk
 * `onOpenDetail` ile detaya gönderir ve kararı `ListingReviewPanel` verir; o
 * panelin sözleşmesinde çubuk **ve** `decisionError` zaten var. Karar kanalları
 * eklenirse çubuk buraya girer ve `capabilities` o an canlanır.
 *
 * ## İki kapı
 *
 * Bir eylem yetki (`capabilities`) ve durum (`domain/moderationActions.ts`'in
 * `allowedFrom`'u) kapılarından geçmeden görünmez — `disabled` değil, **hiç
 * render edilmez**. Kuyrukta bu ikili yalnız "Bana ata"ya uygulanıyor; "Atla"
 * bir durum geçişi değil kuyruk gezinmesidir, "Detaylı incele" ise okumadır.
 *
 * ## Kilit yetki değil, geçici durum
 *
 * `lockedListingIds`'teki ilanı başka bir moderatör **şu anda** inceliyor.
 * Sebebi söylenebilir olduğu için burada `disabled` + açıklama meşru
 * (`RolePermissionMatrixProps.saving` ile aynı gerekçe: kullanıcı beklediğini
 * bilmeli, yetkisini sorgulamamalı). Buton `aria-disabled` ile kapatılıyor,
 * native `disabled` ile değil: native `disabled` butonu tab sırasından çıkarır
 * ve açıklamasını duyurulamaz kılar — tam da söylenebilir olan sebebi susturur.
 *
 * ## Göreli zaman yok
 *
 * Brifing 2.4 "kuyruk sırası ve **bekleme süresi**" istiyor. Sıra veriliyor;
 * bekleme süresi **verilemiyor**: hesabı "şimdi"ye dayanır, component saati
 * kendi okuyamaz (aynı story dün "3 gün önce", bugün "4 gün önce" yazar ve
 * Chromatic her gün fark üretir) ve `ApprovalQueueProps`'ta `now` yok. Uydurmak
 * yerine gönderim anı **mutlak tarih** olarak yazılıyor. `ReportCardProps.now`
 * Faz 3'te tam bu sebeple eklendi; aynısı buraya da gerekir.
 *
 * @example
 * <ApprovalQueue state={state} currentAdminId={admin.id} capabilities={yetkiler} ... />
 */
export function ApprovalQueue({
  state,
  selectedListingId,
  lockedListingIds = [],
  currentAdminId,
  capabilities,
  onSelectListing,
  onAssignToSelf,
  onSkip,
  onOpenDetail,
  onRetry,
}: ApprovalQueueProps) {
  const kapsam = useId()
  const kilitliler = new Set(lockedListingIds)

  /**
   * Kullanıcı bu ilan üzerinde bir karar verebilir mi?
   *
   * "Bana ata"nın **yetki kapısı** — ve sözleşmenin bir boşluğunu görünür bir
   * kararla dolduruyor: eylemin gerçek izni `AdminPermission.ListingAssignReviewer`
   * ama `ModerationCapabilities` onu taşımıyor (beş karar bayrağı var, atama yok)
   * ve `ApprovalQueueProps`'ta `ListingListPageProps`'taki gibi bir
   * `availablePermissions` de yok. Elde olan tek yetki sinyali karar
   * bayrakları; "karar veremeyen kullanıcı inceleme sırasını sahiplenmemeli"
   * okuması onlara dayanıyor.
   *
   * **Bu yaklaşıklık `icerikDenetcisi` için yanlıştır**: rol karar verebiliyor
   * (`canApprove` doğru) ama `ROLE_PERMISSIONS`'ta `ListingAssignReviewer` yok —
   * yani kapı ona butonu gösterir, sunucu reddeder. AGENTS.md'nin dört kez
   * belgelediği "matris sınırlarken kod tam yetki veriyor" hatasının aynısı.
   * Kapatan şey `ModerationCapabilities`'e `canAssignReviewer` eklemek olur;
   * `capabilities` bu ekranın değil, uydurulmadı ve raporlandı.
   */
  const atamaYetkisi =
    capabilities.canApprove || capabilities.canReject || capabilities.canRequestChanges

  /**
   * İlanın durumu incelemenin sahiplenilmesine izin veriyor mu?
   *
   * "Bana ata"nın **durum kapısı**. Elle `status === PendingReview` yazmak
   * yerine domain'den okunuyor: üç kararın da `allowedFrom`'u bugün yalnız
   * `pendingReview` ve kural değişirse bu satır kendiliğinden ona uyar.
   */
  const atamaDurumu = (listing: Listing): boolean =>
    isModerationActionAllowedFrom('approve', listing.status) ||
    isModerationActionAllowedFrom('reject', listing.status) ||
    isModerationActionAllowedFrom('requestChanges', listing.status)

  /**
   * Atamayı **kime** yapıldığı diliyle anlatır.
   *
   * `currentReviewerId` bir UUID ve ekran veri çekemez: başka bir moderatörün
   * **adı** sözleşmede yok. Ham kimliği basmak yerine ("admin-content-reviewer-1"
   * kimseye bir şey söylemez) ilişki yazılıyor. `ReportCardProps`'un ad çözümleme
   * boşluğunun aynısı; `assignedAdmin?: AdminUser` gibi bir prop gerekir.
   */
  const atamaMetni = (listing: Listing): string => {
    const inceleyen = listing.moderation.currentReviewerId

    if (inceleyen === undefined) return 'Atanmamış'
    if (inceleyen === currentAdminId) return 'Size atanmış'

    return 'Başka bir moderatöre atanmış'
  }

  const satirEylemleri = (listing: Listing, kilitli: boolean): ReactNode => {
    const kilitNotuId = `${kapsam}-kilit-${listing.id}`
    const bende = listing.moderation.currentReviewerId === currentAdminId
    const sahiplenilebilir = atamaYetkisi && atamaDurumu(listing) && !bende

    return (
      <>
        {kilitli ? (
          <p className={css.lockNote} id={kilitNotuId}>
            <Lock size={14} aria-hidden="true" />
            Başka bir moderatör bu ilanı şu anda inceliyor.
          </p>
        ) : null}

        <div className={css.itemActions}>
          {sahiplenilebilir ? (
            <Button
              size="sm"
              variant="secondary"
              leadingIcon={<UserCheck size={16} />}
              /*
                Kilitliyken `aria-disabled`, native `disabled` değil: buton tab
                sırasında kalsın ve `aria-describedby` ile sebebi duyurulsun.
                Native `disabled` ikisini de götürürdü.
              */
              aria-disabled={kilitli ? true : undefined}
              {...(kilitli && { 'aria-describedby': kilitNotuId })}
              onClick={() => {
                /* `aria-disabled` tıklamayı kendiliğinden engellemez; kapıyı burada tutuyoruz. */
                if (kilitli) return
                onAssignToSelf(listing.id)
              }}
            >
              Bana ata
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="ghost"
            leadingIcon={<SkipForward size={16} />}
            onClick={() => onSkip(listing.id)}
          >
            Atla
          </Button>

          <Button
            size="sm"
            variant="ghost"
            leadingIcon={<ExternalLink size={16} />}
            onClick={() => onOpenDetail(listing.id)}
          >
            Detaylı incele
          </Button>
        </div>
      </>
    )
  }

  const satir = (listing: Listing, sira: number): ReactNode => {
    const kilitli = kilitliler.has(listing.id)
    const secili = listing.id === selectedListingId
    const riskli = yuksekRiskli(listing)
    const gonderim = listing.moderation.submittedAt

    return (
      <li key={listing.id} className={css.item}>
        <span className={css.orderNumber}>
          <span className={css.visuallyHidden}>Kuyruk sırası </span>
          {sira}
        </span>

        <div className={css.itemBody}>
          <ListingCard
            listing={listing}
            variant="compact"
            showModerationMeta
            selected={secili}
            /*
              `flagged` kartın kendi sözleşmesine göre veriliyor: "şikayet almış
              VEYA otomatik kontrolden kalmış". Şerit tek başına bilgi taşımaz —
              renk ve kalınlık ekran okuyucuya bir şey söylemez; "Yüksek risk"
              rozeti sebebi metne çeviriyor, şikayet sayısını kartın kendi rozeti
              yazıyor.
            */
            flagged={riskli || listing.metrics.reportCount > 0}
            onClick={() => onSelectListing(listing.id)}
            /*
              `actions` slot'una yalnız rozet konuyor, buton değil: slot kartın
              tıklanabilir `<button>`'ının İÇİNDE render ediliyor ve oraya buton
              koymak iç içe etkileşimli element üretirdi (geçersiz HTML + axe
              `nested-interactive`). Rozet bir `<span>`, phrasing content — güvenli.
              Satırın butonları bu yüzden kartın kardeşi.
            */
            {...(riskli && {
              actions: (
                <Badge
                  tone="danger"
                  variant="soft"
                  size="sm"
                  leadingIcon={<ShieldAlert size={12} />}
                >
                  Yüksek risk
                </Badge>
              ),
            })}
          />

          <p className={css.summary}>
            {gonderim !== undefined
              ? `${LISTING_FIELD_LABEL.submittedAt}: ${formatDateTime(gonderim)}`
              : `${LISTING_FIELD_LABEL.submittedAt}: Belirtilmemiş`}
            {' · '}
            {atamaMetni(listing)}
          </p>

          <AutomatedChecksPanel items={listing.moderation.automatedChecks} variant="summary" />

          {satirEylemleri(listing, kilitli)}
        </div>
      </li>
    )
  }

  const detayPaneli = (listing: Listing): ReactNode => {
    const gonderim = listing.moderation.submittedAt
    const not = listing.moderation.reviewNote
    const gerekceler = listing.moderation.rejectionReasons

    return (
      <div className={css.column}>
        <h3 className={css.sectionTitle}>Seçili ilan</h3>

        <div className={css.detailPanel}>
          <ListingCard listing={listing} variant="detailed" showModerationMeta />

          <dl className={css.facts}>
            <dt className={css.factTerm}>{LISTING_FIELD_LABEL.submittedAt}</dt>
            <dd className={css.factValue}>
              {gonderim !== undefined ? formatDateTime(gonderim) : 'Belirtilmemiş'}
            </dd>

            <dt className={css.factTerm}>{LISTING_FIELD_LABEL.revision}</dt>
            <dd className={css.factValue}>{listing.revision}</dd>

            <dt className={css.factTerm}>{MODERATION_FIELD_LABEL.currentReviewer}</dt>
            <dd className={css.factValue}>{atamaMetni(listing)}</dd>

            {gerekceler.length > 0 ? (
              <>
                <dt className={css.factTerm}>{MODERATION_FIELD_LABEL.rejectionReasons}</dt>
                <dd className={css.factValue}>
                  {gerekceler.map((gerekce) => REJECTION_REASON_LABEL[gerekce]).join(', ')}
                </dd>
              </>
            ) : null}

            {not !== undefined ? (
              <>
                <dt className={css.factTerm}>{MODERATION_FIELD_LABEL.reviewNote}</dt>
                <dd className={css.factValue}>{not}</dd>
              </>
            ) : null}
          </dl>

          <AutomatedChecksPanel items={listing.moderation.automatedChecks} variant="cards" />

          <div className={css.detailActions}>
            <Button
              variant="primary"
              leadingIcon={<ExternalLink size={16} />}
              onClick={() => onOpenDetail(listing.id)}
            >
              Detaylı incele
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /**
   * `success` ve `partialSuccess`'in ortak gövdesi.
   *
   * `Pagination` **bilerek render edilmiyor**: brifing 2.4 onu türetilen
   * componentler arasında sayıyor ama `PaginationProps.onPageChange` zorunlu ve
   * `ApprovalQueueProps`'ta karşılığı yok (`ListingListPageProps`'ta var —
   * asimetri). Sayfayı değiştiremeyen bir sayfalayıcı, basınca hiçbir şey
   * yapmayan bir kutudur. Onun yerine kuyruğun boyu **metin olarak** yazılıyor:
   * bilgi doğru, eylem uydurulmuyor.
   */
  const kuyrukGovdesi = (sayfa: Partial<Paginated<Listing>>, uyari: ReactNode): ReactNode => {
    const ilanlar = sayfa.items ?? []
    const toplam = sayfa.totalItems
    const secili = ilanlar.find((listing) => listing.id === selectedListingId)
    /* Sıra sayfa içi indeks değil, kuyruğun tamamındaki yer. */
    const ilkSira = ((sayfa.page ?? 1) - 1) * (sayfa.pageSize ?? ilanlar.length) + 1

    return (
      <>
        {uyari}

        <div className={css.layout({ split: secili !== undefined })}>
          <div className={css.column}>
            <h3 className={css.sectionTitle}>Sıradaki ilanlar</h3>

            {toplam !== undefined && ilanlar.length > 0 ? (
              <p className={css.summary}>
                {toplam} ilan kuyrukta · {ilkSira}-{ilkSira + ilanlar.length - 1} arası gösteriliyor
              </p>
            ) : null}

            <ol className={css.queue}>
              {ilanlar.map((listing, index) => satir(listing, ilkSira + index))}
            </ol>
          </div>

          {secili !== undefined ? detayPaneli(secili) : null}
        </div>
      </>
    )
  }

  const govde = (): ReactNode => {
    switch (state.status) {
      case 'idle':
      case 'loading':
        /*
          Ölçü koruyan iskelet — brifing 2.1: "yalnızca spinner ile boş ekran
          gösterilmez". Skeleton'ın kendisi `aria-hidden`; yükleniyor bilgisini
          kapsayan bölüm `aria-busy` ile duyurur (Skeleton JSDoc'unun istediği).
        */
        return (
          <div className={css.column} aria-busy="true">
            <ol className={css.queue}>
              {[0, 1, 2].map((sira) => (
                <li key={sira} className={css.item}>
                  <Skeleton variant="circle" width="2rem" height="2rem" />
                  <div className={css.itemBody}>
                    <Skeleton variant="rectangle" height="7rem" />
                    <Skeleton variant="text" lines={2} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )

      case 'empty':
        /*
          Boş kuyruk **iyi haberdir** — hata gibi görünmemeli. `EmptyState`'in
          `filtered` varyantı da yanlış olurdu: kuyrukta filtre yok, gevşetilecek
          bir şey de yok.
        */
        return (
          <EmptyState
            title="Tüm kuyruk tamamlandı"
            description="İnceleme bekleyen ilan kalmadı. Yeni başvurular geldikçe burada sıraya girer."
            illustration={<CheckCircle2 size={48} />}
          />
        )

      case 'unauthorized':
        /*
          Tekrar deneme butonu **yok**: 403'ü tekrar denemek aynı 403'ü verir.
          `UiError.retryable` tip düzeyinde `false`'a sabitli, yani ikinci kapı
          zaten kapalı — buton sunmak kullanıcıyı döngüye sokardı.
        */
        return (
          <ErrorState
            variant="page"
            title={state.error.title}
            description={state.error.message}
            {...(state.error.code !== undefined && { code: state.error.code })}
          />
        )

      case 'error':
        /*
          Tekrar deneme **iki kapıdan** geçer: hata tekrar denenebilir olacak
          (`retryable`) VE handler bağlı olacak. Hatanın tekrar denenebilir
          _olduğunu bilmek_, tekrar denemeyi _yapabilmek_ değil. Bu sözleşmede
          `onRetry` zorunlu, yani ikinci kapı hep açık — ifade yine de iki kapıyı
          görünür tutuyor: prop opsiyonele dönerse kural kendiliğinden işler.
        */
        return (
          <ErrorState
            variant="page"
            title={state.error.title}
            description={state.error.message}
            {...(state.error.code !== undefined && { code: state.error.code })}
            {...(state.error.retryable && { onRetry })}
          />
        )

      case 'partialSuccess':
        /*
          Kuyruk tek bir sorgudur; `partialSuccess` dashboard biçimli bir durum
          (alan başına bağımsız sorgu). Yine de sözleşmede olduğu için ele
          alınıyor: gelen ilanlar gösteriliyor, gelmeyen alanlar duyuruluyor.
          Sessizce `success` saymak eksik kuyruğu tam gibi gösterirdi.
        */
        return kuyrukGovdesi(
          state.data,
          <Alert
            tone="warning"
            title="Kuyruğun bir kısmı yüklenemedi"
            description={Object.values(state.errors)
              .map((hata) => hata?.message)
              .filter((mesaj): mesaj is string => mesaj !== undefined)
              .join(' ')}
          />,
        )

      case 'success':
        return kuyrukGovdesi(
          state.data,
          state.stale === true ? (
            <Alert
              tone="info"
              title="Kuyruk güncelleniyor"
              description="Aşağıdaki liste son başarılı veriden geliyor; yeni başvurular birazdan görünecek."
            />
          ) : null,
        )
    }
  }

  return (
    <div className={css.root}>
      <h2 className={css.title}>Onay kuyruğu</h2>
      {govde()}
    </div>
  )
}
