import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import {
  AdminPermission,
  AdminRole,
  AutomatedCheckCode,
  AutomatedCheckResultStatus,
  RejectionReason,
  ROLE_PERMISSIONS,
  type AutomatedCheckResult,
  type Listing,
  type ModerationSummary,
  type Paginated,
  type ResidentialListing,
  type TimeshareListing,
} from '../../types/domain'
import { residentialPendingVilla, timesharePendingThermal } from '../../fixtures/listings'
import { moderatorUser } from '../../fixtures/users'
import type { ModerationCapabilities } from '../../types/component-props'
import { ApprovalQueue } from './ApprovalQueue'

/**
 * Yetkileri rolün kendi izin listesinden türetir — elle yazılmaz.
 *
 * `ModerationActionBar.stories.tsx`'teki `yetkiler` ile birebir aynı: kabul
 * kriterleri uydurulmuş bir yetki nesnesine değil `ROLE_PERMISSIONS`'ın kendisine
 * karşı ölçülsün. Matris değişir de ekrana yansımazsa test düşer.
 */
function yetkiler(role: AdminRole): ModerationCapabilities {
  const izinler: readonly AdminPermission[] = ROLE_PERMISSIONS[role]

  return {
    canApprove: izinler.includes(AdminPermission.ListingApprove),
    canReject: izinler.includes(AdminPermission.ListingReject),
    canRequestChanges: izinler.includes(AdminPermission.ListingRequestChanges),
    canPause: izinler.includes(AdminPermission.ListingPause),
    canArchive: izinler.includes(AdminPermission.ListingArchive),
  }
}

/** Story'lerdeki "ben": kuyruğa bakan moderatör. */
const BEN = moderatorUser.id

/**
 * Atama alanını **hiç** taşımayan özet.
 *
 * `currentReviewerId: undefined` yazmak `exactOptionalPropertyTypes` ile yasak
 * (TS2375) ve zaten yanlış olurdu: alan ya vardır ya yoktur. Fixture'ların
 * `createBaseListing`'i opsiyonel tarihleri aynı koşullu spread ile veriyor.
 */
function atamasizOzet(temel: ModerationSummary): ModerationSummary {
  return {
    rejectionReasons: temel.rejectionReasons,
    automatedChecks: temel.automatedChecks,
    ...(temel.submittedAt !== undefined && { submittedAt: temel.submittedAt }),
    ...(temel.lastReviewedAt !== undefined && { lastReviewedAt: temel.lastReviewedAt }),
    ...(temel.reviewNote !== undefined && { reviewNote: temel.reviewNote }),
  }
}

/**
 * Bloklayıcı bir kontrolden kalmış ilanın kontrol sonuçları.
 *
 * `failed` bloklar, `warning` blokla*maz* (`AUTOMATED_CHECK_BLOCKING`) — ikisi
 * bilerek yan yana: ekranın "yüksek risk" işaretini yalnız `failed`'e bağladığı,
 * uyarının onu tetiklemediği bu veriyle ölçülebilsin.
 */
const riskliKontroller: AutomatedCheckResult[] = [
  {
    code: AutomatedCheckCode.RequiredFields,
    status: AutomatedCheckResultStatus.Passed,
    message: 'Zorunlu alanlar tamamlandı.',
    checkedAt: '2026-07-14T09:00:00+03:00',
  },
  {
    code: AutomatedCheckCode.PriceAnomaly,
    status: AutomatedCheckResultStatus.Warning,
    score: 0.41,
    message: 'Fiyat, bölge ortalamasının belirgin biçimde altında.',
    checkedAt: '2026-07-14T09:00:04+03:00',
  },
  {
    code: AutomatedCheckCode.FraudRisk,
    status: AutomatedCheckResultStatus.Failed,
    score: 0.86,
    message: 'Görseller başka bir ilanda da bulundu; sahiplik doğrulanmalı.',
    checkedAt: '2026-07-14T09:00:06+03:00',
  },
]

/** Kuyruğun bir numarası: başka bir moderatöre atanmış, fixture'ın kendi hâli. */
const baskasinaAtanmis = residentialPendingVilla

/** Bana atanmış ilan: "Bana ata" çıkmamalı — zaten bende. */
const bendekiIlan: TimeshareListing = {
  ...timesharePendingThermal,
  moderation: { ...timesharePendingThermal.moderation, currentReviewerId: BEN },
}

/**
 * Sahipsiz ilan: sahiplenilebilir olan tek satır.
 *
 * Düzeltme turundan dönmüş bir başvuru — brifing 2.4'ün "ilanın revizyon sayısı"
 * ve "son düzeltme notu" verilerini taşıyan tek satır bu. Fixture'ların hiçbir
 * `pendingReview` ilanı `reviewNote` taşımıyor (`createModeration` notu yalnız
 * `published`/`changesRequested`/`rejected` için yazıyor), oysa kuyruğa **geri
 * dönmüş** ilan tam olarak notu olan ilandır: revizyon 2, çünkü brifing 1.2'ye
 * göre istenen düzeltmeler yapılınca revizyon artar.
 */
const atanmamisIlan: ResidentialListing = {
  ...residentialPendingVilla,
  id: 'listing-queue-atanmamis',
  listingNo: '1245790311',
  title: "Muratpaşa'da Deniz Manzaralı Sıfır Daire",
  revision: 2,
  moderation: {
    ...atamasizOzet(residentialPendingVilla.moderation),
    lastReviewedAt: '2026-07-13T16:20:00+03:00',
    rejectionReasons: [RejectionReason.MisleadingOrIncompleteInfo],
    reviewNote: 'Net m² ile açıklamadaki değer çelişiyordu; düzeltilip yeniden gönderildi.',
  },
}

/** Bloklayıcı kontrolden kalmış, şikayet almış ilan. */
const riskliIlan: ResidentialListing = {
  ...residentialPendingVilla,
  id: 'listing-queue-riskli',
  listingNo: '1245790742',
  title: "Kepez'de Bahçeli Müstakil Ev",
  metrics: { ...residentialPendingVilla.metrics, reportCount: 3 },
  moderation: {
    ...atamasizOzet(residentialPendingVilla.moderation),
    automatedChecks: riskliKontroller,
  },
}

const kuyruk: Listing[] = [baskasinaAtanmis, atanmamisIlan, riskliIlan, bendekiIlan]

function sayfa(items: Listing[], page = 1, pageSize = 20): Paginated<Listing> {
  return {
    items,
    page,
    pageSize,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  }
}

const meta = {
  title: 'Screens/ApprovalQueue',
  component: ApprovalQueue,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Moderasyon kuyruğu: karar bekleyen ilanları sıraya dizer ve incelemeye **yönlendirir**. ' +
          'Karar VERMEZ — `ApprovalQueueProps` içinde `onApprove`/`onReject`/`onRequestChanges` yok, ' +
          'bu yüzden `ModerationActionBar` bilerek render edilmiyor: bastığında hiçbir şey olmayan ' +
          'üç buton sunmak, sunmamaktan kötü. Karar `ListingReviewPanel` tarafında verilir. ' +
          '"Bana ata" iki kapıdan geçer: yetki (`capabilities`) ve durum (`allowedFrom`). ' +
          'Kilit ise yetki değil geçici bir durumdur — sebebi söylenebildiği için `aria-disabled` ' +
          've açıklama ile kapatılır, gizlenmez.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'screen',
      useWhen: [
        'Moderatör sıradaki ilanları tarayıp inceleme sırasını sahiplenecekse',
        'Karar bekleyen ilanların otomatik kontrol sonuçları ve riski gözden geçirilecekse',
      ],
      doNotUseWhen: [
        'Tek bir ilanın kararı verilecekse — ListingReviewPanel kullanın',
        'Filtreli, çok kolonlu ilan taraması gerekiyorsa — ListingListPage kullanın',
      ],
    },
  },

  /*
    `state`, `selectedListingId` ve `lockedListingIds` meta.args'ta **yok**.

    İkincisi ve üçüncüsü için sebep AGENTS.md'nin kuralı: yokluğu bir durum olan
    hiçbir prop meta.args'a konmaz (seçim yoksa split view açılmaz, kilit yoksa
    satır serbesttir) — konursa bu dosyada geri alınamaz olur (TS2375).

    `state` ise ekranın konusunun kendisi: her durum story'si kendi state'ini
    verir, ortak bir varsayılan yanıltıcı olurdu.

    Geri kalanların hepsi sözleşmede **zorunlu**, yani yoklukları zaten bir durum
    değil — `onRetry` dahil. (`ErrorState`'in "tekrar denenemez hata"sında handler'ın
    yokluğu bir durumdu; burada sözleşme onu zorunlu kıldığı için o kapı hep açık.)
  */
  args: {
    currentAdminId: BEN,
    capabilities: yetkiler(AdminRole.Moderator),
    onSelectListing: fn(),
    onAssignToSelf: fn(),
    onSkip: fn(),
    onOpenDetail: fn(),
    onRetry: fn(),
  },

  argTypes: {
    state: { control: false },
    capabilities: { control: false },
  },
} satisfies Meta<typeof ApprovalQueue>

export default meta

type Story = StoryObj<typeof meta>

/* ------------------------------------------------------------------------- *
 * Zorunlu durum story'leri — brifing 3.5
 * ------------------------------------------------------------------------- */

/** Ölçü koruyan iskelet: spinner'lı boş ekran yok (brifing 2.1). */
export const Loading: Story = {
  args: { state: { status: 'loading' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* İskelet `aria-hidden`; yükleniyor bilgisini kapsayan bölüm duyurur. */
    await expect(canvasElement.querySelector('[aria-busy="true"]')).toBeInTheDocument()

    /* Yüklenirken hiçbir ilan ve hiçbir eylem sunulmamalı. */
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/**
 * Boş kuyruk **iyi haberdir** — hata gibi görünmemeli.
 *
 * Brifing 2.4'ün kendi cümlesi: "`empty`: Tüm kuyruk tamamlandı". Bu yüzden
 * `ErrorState` değil `EmptyState`, `filtered` varyantı da değil: kuyrukta filtre
 * yok, gevşetilecek bir şey de yok.
 */
export const Empty: Story = {
  args: { state: { status: 'empty' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Tüm kuyruk tamamlandı')).toBeInTheDocument()

    /*
      `ErrorState` `role="alert"` taşıyor; iyi haber onu üretmemeli. Rol
      sorgusu doğru araç — metin sorgusu buradaki farkı göremezdi.
    */
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  },
}

/**
 * Hata: mesaj, kod ve tekrar deneme.
 *
 * Tekrar deneme **iki kapıdan** geçer — `retryable === true` VE `onRetry` bağlı.
 * Bu sözleşmede `onRetry` zorunlu olduğu için ikinci kapı hep açık; ölçülen şey
 * birincisi.
 */
export const Error: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'Kuyruk yüklenemedi',
        message: 'Moderasyon kuyruğuna ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
        code: 'QUEUE_FETCH_FAILED',
        retryable: true,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('QUEUE_FETCH_FAILED')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: /Tekrar dene/ }))
    await expect(args.onRetry).toHaveBeenCalled()
  },
}

/** Tekrar denenemeyen hata: `retryable` kapalıysa buton sunulmaz, handler bağlı olsa bile. */
export const NonRetryableErrorHasNoRetryButton: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'Kuyruk yüklenemedi',
        message: 'Bu kuyruk kalıcı olarak kaldırıldı. Yöneticinizle görüşün.',
        retryable: false,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: /Tekrar dene/ })).not.toBeInTheDocument()
    await expect(args.onRetry).not.toHaveBeenCalled()
  },
}

/**
 * 403: tekrar denemek aynı 403'ü verir.
 *
 * `error`'dan ayrı bir durum çünkü farklı bir şey yaptırır: "bir şey ters gitti"
 * değil, "bu senin görebileceğin bir şey değil". `UiError.retryable` tip
 * düzeyinde `false`'a sabitli.
 */
export const Unauthorized: Story = {
  args: {
    state: {
      status: 'unauthorized',
      error: {
        title: 'Bu kuyruğu görme yetkiniz yok',
        message: 'Moderasyon kuyruğu yalnızca karar verebilen rollere açıktır.',
        code: 'HTTP_403',
        retryable: false,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: /Tekrar dene/ })).not.toBeInTheDocument()
  },
}

/** Dolu kuyruk: sıra, özet, otomatik kontroller ve eylemler. */
export const Success: Story = {
  args: { state: { status: 'success', data: sayfa(kuyruk) } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    /*
      Satır sayımı `getAllByRole('listitem')` ile YAPILAMAZ: AutomatedChecksPanel
      kendi sorunlu kontrollerini de `<ul>`/`<li>` ile çiziyor ve rol sorgusu
      ikisini birden toplar — sayı sessizce şişerdi. Sıra etiketi kuyruğa özgü.

      `getByText` yalnız DOĞRUDAN metin çocuklarına bakar, bu yüzden sağlam.
    */
    await expect(canvas.getAllByText('Kuyruk sırası')).toHaveLength(kuyruk.length)

    await userEvent.click(canvas.getAllByRole('button', { name: /Atla/ })[0] as HTMLElement)
    await expect(args.onSkip).toHaveBeenCalledWith(baskasinaAtanmis.id)
  },
}

/**
 * Kilitli ilan: başka moderatör **şu anda** inceliyor.
 *
 * Kilit bir yetki durumu değil, geçici bir durum — sebebi söylenebilir. Bu yüzden
 * `disabled` + açıklama meşru (`RolePermissionMatrixProps.saving` ile aynı
 * gerekçe: kullanıcı beklediğini bilmeli, yetkisini sorgulamamalı).
 *
 * `aria-disabled` kullanılıyor, native `disabled` değil: native `disabled` butonu
 * tab sırasından çıkarır ve `aria-describedby` ile bağlanan açıklamayı
 * duyurulamaz kılar — tam da söylenebilir olan sebebi susturur.
 *
 * "Atla" ve "Detaylı incele" **açık kalır**: kilitli bir ilanı atlamak zaten
 * yapılması gereken şey, okumak ise zararsız. Kilit yalnız sahiplenmeyi kapatır.
 */
export const Locked: Story = {
  args: {
    /*
      Kuyruk bilerek iki satır: yalnız `atanmamisIlan` sahiplenilebilir
      (`bendekiIlan` zaten bende), böylece "Bana ata" tek ve sorgu hangisini
      kastettiğini söylemek zorunda kalmıyor.
    */
    state: { status: 'success', data: sayfa([atanmamisIlan, bendekiIlan]) },
    lockedListingIds: [atanmamisIlan.id],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const sahiplen = canvas.getByRole('button', { name: /Bana ata/ })

    /* `toBeDisabled()` yalnız native `disabled`'ı tanır ve burada yalan söylerdi. */
    await expect(sahiplen).toHaveAttribute('aria-disabled', 'true')

    /* Sebep görünür VE butona bağlı: kullanıcı neden bekleyeceğini bilmeli. */
    const aciklamaId = sahiplen.getAttribute('aria-describedby')
    await expect(aciklamaId).not.toBeNull()
    await expect(canvasElement.querySelector(`#${aciklamaId ?? ''}`)).toHaveTextContent(
      /Başka bir moderatör bu ilanı şu anda inceliyor/,
    )

    /* Kapalı buton gerçekten kapalı: tıklamak kararı göndermemeli. */
    await userEvent.click(sahiplen)
    await expect(args.onAssignToSelf).not.toHaveBeenCalled()

    /* Kilit sahiplenmeyi kapatır, kuyruk gezinmesini değil. */
    await expect(canvas.getAllByRole('button', { name: /Atla/ }).length).toBeGreaterThan(0)
  },
}

/*
  ZORUNLU AMA YAZILAMAYAN STORY: `Conflict`.

  Brifing 3.5 `ApprovalQueue` için `Conflict` story'sini zorunlu tutuyor
  (brifing 2.4: "`conflict`: Başka moderatör ilanın revizyonunu değiştirmiş").
  **Kanalı yok:** revizyon çakışması `ModerationDecisionError` ile bildiriliyor ve
  onu taşıyan iki prop var — `ModerationActionBarProps.decisionError` ve
  `ListingReviewPanelProps.decisionError`. `ApprovalQueueProps`'ta yok.

  Uydurulmadı ve prop eklenmedi (`types/component-props.ts` bu ekranın dosyası
  değil). Emsal: `PromotionFlagsPanel`, `ReportCard` ve `SellerPanel`'in
  Loading/Error story'leri de kanalları olmadığı için yazılmamış, gerekçeleri
  story dosyalarında yorumlu duruyor.

  Sebep tesadüf değil, tutarlı: çakışma **gönderilen bir karara** verilen cevaptır
  (`AsyncState`'in üyesi bilerek değil — bkz. `ModerationDecisionError` JSDoc'u) ve
  bu ekran karar göndermiyor. Kuyruğun `onApprove`/`onReject`/`onRequestChanges`'i
  yok; olmayan kararın reddedilmesi de olamaz. Yani `Conflict`'in eksikliği
  hızlı karar akışının eksikliğinin **aynı boşluğu**.

  İki tutarlı kapanış var, ikisi de ana ajanın kararı:
    1. Kuyruk karar vermez  → `Conflict` bu ekranın zorunlu story'si olmaktan
       çıkar; çakışmayı `ListingReviewPanel` gösterir (orada zaten zorunlu ve
       kanalı var). Brifing 3.5'in satırı düzeltilir.
    2. Kuyruk hızlı karar verir → `ApprovalQueueProps`'a karar handler'ları
       **ve** `decisionError` eklenir; `ModerationActionBar` satıra girer,
       `capabilities` canlanır ve bu story yazılır.

  İkisinin ortası yok: `decisionError`'ı tek başına eklemek, gönderilmemiş bir
  kararın reddini göstermek olurdu.
*/

/* ------------------------------------------------------------------------- *
 * Zorunlu düzen varyantları — brifing 3.5
 * ------------------------------------------------------------------------- */

/**
 * Single column: 320 piksel taban.
 *
 * Seçim yokken sağ kolon hiç açılmaz — boş bir kolona yer ayırmak her ekranda
 * kalıcı bir delik demektir.
 */
export const SingleColumn: Story = {
  args: { state: { status: 'success', data: sayfa(kuyruk) } },
  globals: { viewport: { value: 'mobile320' } },
  play: async ({ canvasElement }) => {
    /*
      Medya sorgusu viewport'a bakar, kabın genişliğine değil ve repoda container
      query yok: "dar ekranda tek kolona iner" iddiası play ile **ölçülemez** —
      o ekran görüntüsünün işi. Play'in ölçebildiği şey viewport'tan bağımsız:
      hiçbir şey yatay taşmamalı.
    */
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/**
 * Split view (≥48rem): kuyruk solda, seçili ilan sağda.
 *
 * Seçili ilan bilerek düzeltme turundan dönmüş olan: yan panelin revizyon,
 * red gerekçesi ve "son düzeltme notu" satırları ancak onda görünür.
 */
export const SplitView: Story = {
  args: {
    state: { status: 'success', data: sayfa(kuyruk) },
    selectedListingId: atanmamisIlan.id,
  },
  globals: { viewport: { value: 'tablet768' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Seçim yan paneli açar; başlık `<h3>` — ekranın `<h2>`'sinin altında. */
    await expect(canvas.getByRole('heading', { level: 3, name: 'Seçili ilan' })).toBeInTheDocument()

    /* Brifing 2.4'ün iki verisi: revizyon sayısı ve son düzeltme notu. */
    await expect(canvas.getByText('Son düzeltme notu')).toBeInTheDocument()
    await expect(canvas.getByText(/Net m² ile açıklamadaki değer çelişiyordu/)).toBeInTheDocument()
  },
}

/**
 * Wide queue (≥80rem): kuyruk nefes alır, yan panel genişler.
 *
 * Seçili ilan bloklayıcı kontrolden kalan: yan panel otomatik kontrolleri
 * `cards` varyantıyla açıyor, satır ise aynı sonuçları `summary` ile tek satırda
 * özetliyor — kuyrukta tarama, panelde inceleme.
 */
export const WideQueue: Story = {
  args: {
    state: { status: 'success', data: sayfa(kuyruk) },
    selectedListingId: riskliIlan.id,
  },
  globals: { viewport: { value: 'desktop1440' } },
}

/* ------------------------------------------------------------------------- *
 * Sözleşme ölçümleri
 * ------------------------------------------------------------------------- */

/**
 * Kuyruk hızlı karar **sunmuyor** — ve bu bir eksiklik değil, sözleşmenin sonucu.
 *
 * Brifing 2.4 hızlı onay/red/düzeltme istiyor ama `ApprovalQueueProps`'ta o üç
 * handler yok. Sonuçsuz buton sunmak yerine kuyruk detaya gönderiyor. Bu story
 * regresyon bekçisi: biri `ModerationActionBar`'ı handler'sız buraya koyarsa
 * düşer.
 */
export const QueueOffersNoQuickDecision: Story = {
  args: { state: { status: 'success', data: sayfa(kuyruk) } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: 'Onayla' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Reddet' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Düzeltme iste' })).not.toBeInTheDocument()

    /* Karara giden yol duruyor: kuyruk kararı vermez, karara gönderir. */
    await expect(canvas.getAllByRole('button', { name: /Detaylı incele/ }).length).toBeGreaterThan(
      0,
    )
  },
}

/**
 * `destek` rolü inceleme sırasını sahiplenemez — buton `disabled` değil, **yok**.
 *
 * Yetki kapısı: hiçbir karar veremeyen kullanıcının kuyruk sırasını sahiplenmesi,
 * ilanı karar verebilecek birinden kilitlemek olurdu.
 *
 * DİKKAT — bu kapı bir **yaklaşıklık**: eylemin gerçek izni
 * `AdminPermission.ListingAssignReviewer` ama `ModerationCapabilities` onu
 * taşımıyor. `icerikDenetcisi` için yanlış sonuç veriyor (aşağıdaki story onu
 * ölçüyor ve kasıtlı olarak **bugünkü** davranışı kaydediyor).
 */
export const SupportRoleCannotClaim: Story = {
  args: {
    state: { status: 'success', data: sayfa(kuyruk) },
    capabilities: yetkiler(AdminRole.Support),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: /Bana ata/ })).not.toBeInTheDocument()

    /* Okuma ve gezinme durur: destek rolü görüntüleyebilir. */
    await expect(canvas.getAllByRole('button', { name: /Detaylı incele/ }).length).toBeGreaterThan(
      0,
    )
  },
}

/**
 * SÖZLEŞME BOŞLUĞUNUN KAYDI — `icerikDenetcisi`'ne "Bana ata" görünüyor.
 *
 * Rol karar verebiliyor (`canApprove`) ama `ROLE_PERMISSIONS`'ta
 * `ListingAssignReviewer` **yok**: kapı butonu gösteriyor, sunucu reddedecek.
 * AGENTS.md'nin dört kez belgelediği "matris sınırlarken kod tam yetki veriyor"
 * hatasının aynısı — ama bu kez kod uydurmamak için orada: `capabilities`
 * atamayı taşımıyor ve ekran `types/component-props.ts`'e dokunamaz.
 *
 * Story **bugünkü davranışı kaydediyor**, doğruluyor değil. `ModerationCapabilities`
 * `canAssignReviewer` alırsa bu story düşer ve düşmesi gerekir.
 */
export const ContentReviewerSeesClaimButLacksPermission: Story = {
  args: {
    state: { status: 'success', data: sayfa(kuyruk) },
    capabilities: yetkiler(AdminRole.ContentReviewer),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByRole('button', { name: /Bana ata/ }).length).toBeGreaterThan(0)

    /* Boşluğun kendisi: rol atama iznine sahip değil. */
    await expect(ROLE_PERMISSIONS[AdminRole.ContentReviewer]).not.toContain(
      AdminPermission.ListingAssignReviewer,
    )
  },
}

/** Zaten bendeki ilana "Bana ata" çıkmaz; atama görünür kalır. */
export const AssignedToMeOffersNoClaim: Story = {
  args: {
    state: { status: 'success', data: sayfa([bendekiIlan]) },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: /Bana ata/ })).not.toBeInTheDocument()
    await expect(canvas.getByText(/Size atanmış/)).toBeInTheDocument()
  },
}

/**
 * Yüksek risk **metne** çevriliyor, yalnız renge değil.
 *
 * `ListingCard`'ın `flagged` şeridi renk ve kenarlık kalınlığı — ekran okuyucuya
 * hiçbir şey söylemez. Rozet sebebi yazıyor.
 *
 * Ölçüm `getByText` ile: yalnız DOĞRUDAN metin çocuklarına bakar, atayı bulmaz.
 */
export const HighRiskIsNamedNotJustColored: Story = {
  args: { state: { status: 'success', data: sayfa(kuyruk) } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Yalnız bloklayıcı (`failed`) kontrolü olan tek ilan işaretlenmeli. */
    await expect(canvas.getAllByText('Yüksek risk')).toHaveLength(1)
  },
}

/**
 * Uyarı bloklamaz: `warning` üreten ilan "yüksek risk" sayılmamalı.
 *
 * `AUTOMATED_CHECK_BLOCKING` bu ayrımı kuruyor — brifing 1.2'ye göre onayı
 * engelleyen şey "bloklayıcı otomatik kontrol" ve uyarı moderatörün bakmasını
 * ister, kararını vermez. İkisini aynı sepete koymak uyarı üreten her ilanı
 * onaylanamaz gösterirdi.
 */
export const WarningIsNotHighRisk: Story = {
  args: {
    state: {
      status: 'success',
      data: sayfa([
        {
          ...atanmamisIlan,
          moderation: {
            ...atanmamisIlan.moderation,
            automatedChecks: riskliKontroller.filter(
              (check) => check.status !== AutomatedCheckResultStatus.Failed,
            ),
          },
        },
      ]),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByText('Yüksek risk')).not.toBeInTheDocument()
  },
}

/**
 * Kuyruk sırası sayfa içi indeks değil, kuyruğun tamamındaki yer.
 *
 * İkinci sayfanın ilk ilanı "21" olmalı, "1" değil: moderatör "kuyrukta kaçıncı"
 * sorusunu soruyor, "bu sayfada kaçıncı" değil.
 */
export const QueuePositionSurvivesPaging: Story = {
  args: {
    state: { status: 'success', data: { ...sayfa(kuyruk, 2), totalItems: 47, totalPages: 3 } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      İlk `<li>` kuyruğun ilk satırı: AutomatedChecksPanel'in `<li>`'leri onun
      İÇİNDE, yani DOM sırasında sonra geliyor.
    */
    const ilkSatir = canvas.getAllByRole('listitem')[0]
    await expect(ilkSatir).toHaveTextContent('Kuyruk sırası 21')

    await expect(
      canvas.getByText(/47 ilan kuyrukta · 21-24 arası gösteriliyor/),
    ).toBeInTheDocument()
  },
}

/** Karta tıklamak ilanı seçer; seçim sağ paneli açar. */
export const SelectingAListingOpensDetail: Story = {
  args: { state: { status: 'success', data: sayfa(kuyruk) } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: new RegExp(riskliIlan.title) }))
    await expect(args.onSelectListing).toHaveBeenCalledWith(riskliIlan.id)
  },
}

/** Bayat veri: son başarılı liste durur, üstte uyarı çıkar. */
export const Stale: Story = {
  args: { state: { status: 'success', data: sayfa(kuyruk), stale: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('status')).toHaveTextContent('Kuyruk güncelleniyor')

    /* Bayat veri hâlâ veridir: liste kaybolmamalı. */
    await expect(canvas.getAllByText('Kuyruk sırası')).toHaveLength(kuyruk.length)
  },
}

/**
 * Sözleşmedeki `partialSuccess`.
 *
 * Kuyruk tek bir sorgudur; bu durum dashboard biçimli (alan başına bağımsız
 * sorgu). Yine de sözleşmede olduğu için ele alınıyor: gelen ilanlar görünür,
 * gelmeyen alan duyurulur. Sessizce `success` saymak eksik kuyruğu tam gibi
 * gösterirdi.
 */
export const PartialSuccess: Story = {
  args: {
    state: {
      status: 'partialSuccess',
      data: { items: kuyruk },
      errors: {
        totalItems: {
          title: 'Kuyruk sayacı okunamadı',
          message: 'Kuyruğun toplam uzunluğu şu an hesaplanamıyor.',
          retryable: true,
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Kuyruğun bir kısmı yüklenemedi')

    /* Gelen veri duruyor. */
    await expect(canvas.getAllByText('Kuyruk sırası')).toHaveLength(kuyruk.length)

    /* Gelmeyen alan uydurulmuyor: sayaç yoksa özet satırı hiç yazılmaz. */
    await expect(canvas.queryByText(/ilan kuyrukta/)).not.toBeInTheDocument()
  },
}
