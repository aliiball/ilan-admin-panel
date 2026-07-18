import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import {
  AdminPermission,
  AdminRole,
  ModerationActorType,
  ModerationEventType,
  RejectionReason,
  ROLE_PERMISSIONS,
  type ModerationEvent,
  type ResidentialListing,
} from '../../types/domain'
import { LISTING_METRIC_LABEL, REJECTION_REASON_LABEL } from '../../domain/labels'
import {
  activeIndividualOwner,
  emptyModerationHistory,
  emptyReportFixtures,
  kadikoyApartmentReports,
  pendingVillaHistory,
  residentialPendingVilla,
  residentialPublishedApartment,
  verifiedRealEstateOffice,
} from '../../fixtures'
import type {
  AsyncState,
  ListingReviewData,
  ModerationCapabilities,
} from '../../types/component-props'
import { ListingReviewPanel } from './ListingReviewPanel'

/**
 * Yetkileri rolün kendi izin listesinden türetir — elle yazılmaz.
 *
 * `ModerationActionBar.stories.tsx`'teki yardımcının aynısı ve aynı gerekçeyle:
 * "destek rolü karar veremez" gibi kabul kriterleri uydurulmuş bir yetki
 * nesnesine değil `ROLE_PERMISSIONS`'ın kendisine karşı ölçülmeli.
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

/**
 * Kuyruktan yeni alınmış ilan — bu ekranın kanonik hâli.
 *
 * Dördü de gerçek fixture ve birbirini tutuyor: villa `pendingReview`, geçmişi
 * o ilanın kendi zinciri, sahibi `ownerUserId`'nin işaret ettiği hesap.
 * Şikayeti yok — `metrics.reportCount: 0` ile tutarlı.
 */
const INCELEMEDEKI: ListingReviewData = {
  listing: residentialPendingVilla,
  events: pendingVillaHistory,
  reports: emptyReportFixtures,
  seller: activeIndividualOwner,
}

const BASARILI: AsyncState<ListingReviewData> = { status: 'success', data: INCELEMEDEKI }

/**
 * Yayındaki, çok trafikli ve üç kez şikayet edilmiş ilan.
 *
 * Metrik bloğunun gerçek sayılarla göründüğü tek senaryo (villanın sayaçları 0).
 * `kadikoyApartmentReports` zaten "ilan detayının şikayet geçmişi bölümünün
 * kaynağı" diye yazılmış; üçü de kapalı ve bu yüzden `metrics.reportCount: 0`
 * ile çelişmiyor.
 *
 * Geçmiş **boş**: fixture setinde bu ilanın moderasyon zinciri yok ve
 * uydurulmadı. Story bu yüzden aynı zamanda geçmişin boş hâlini de gösteriyor.
 */
const YAYINDAKI: ListingReviewData = {
  listing: residentialPublishedApartment,
  events: emptyModerationHistory,
  reports: kadikoyApartmentReports,
  seller: verifiedRealEstateOffice,
}

/**
 * Villanın ikinci revizyonu.
 *
 * Fixture setinde revizyon çifti yok; bu çift story'ye özgü ve gerçek
 * fixture'dan türetildi (`ListingFacts.stories.tsx`'in `KADIKOY_ÖNCEKİ`
 * kalıbı). Geçmiş de birlikte büyüyor: `moderationEvents.ts`'in kuralı gereği
 * `edited` olayı olmayan ilan revizyon 1'de kalamaz — revizyonu artırıp olayı
 * yazmamak, ekranın yan yana koyduğu iki veriyi çelişkiye düşürürdü.
 */
const VILLA_YENI: ResidentialListing = {
  ...residentialPendingVilla,
  revision: 2,
  updatedAt: '2026-07-15T10:05:00+03:00',
  description:
    "Konyaaltı Hurma Mahallesi'nde, özel havuzlu, bahçeli ve tam eşyalı villa. Havuz ruhsatı mevcuttur. Uzun dönem kiralamaya uygundur.",
  price: { ...residentialPendingVilla.price, amount: 72_500 },
  attributes: { ...residentialPendingVilla.attributes, netSquareMeters: 248 },
}

const VILLA_DUZENLEME_GECMISI: ModerationEvent[] = [
  ...pendingVillaHistory,
  {
    id: 'story-event-villa-edited',
    listingId: residentialPendingVilla.id,
    eventType: ModerationEventType.Edited,
    actor: {
      type: ModerationActorType.ListingOwner,
      id: 'user-owner-ayse-demir',
      displayName: 'Ayşe Demir',
    },
    rejectionReasons: [],
    note: 'Fiyat ve net m² güncellendi; havuz ruhsatı açıklamaya eklendi.',
    revision: 2,
    createdAt: '2026-07-15T10:05:00+03:00',
  },
]

const DUZENLENMIS: ListingReviewData = {
  listing: VILLA_YENI,
  events: VILLA_DUZENLEME_GECMISI,
  reports: emptyReportFixtures,
  seller: activeIndividualOwner,
  previousRevision: residentialPendingVilla,
}

/**
 * Verinin bir kısmı geldi: ilan ve satıcı var, geçmiş ile şikayetler düştü.
 *
 * `errors` `data` ile aynı anahtar uzayını kullanıyor — her alan için ya
 * `data`'da değeri var ya `errors`'ta hatası. `previousRevision` istisna:
 * opsiyonel bir alan, yokluğu hata değil.
 */
const KISMI: AsyncState<ListingReviewData> = {
  status: 'partialSuccess',
  data: { listing: residentialPendingVilla, seller: activeIndividualOwner },
  errors: {
    events: {
      title: 'Moderasyon geçmişi yüklenemedi',
      message: 'Geçmiş servisi cevap vermedi. İlanın kendisi etkilenmedi.',
      retryable: true,
    },
    reports: {
      title: 'Şikayetler yüklenemedi',
      message: 'Şikayet servisi cevap vermedi; bu ilanda şikayet olmadığı anlamına gelmez.',
      retryable: true,
    },
  },
}

/**
 * Base UI popup'ının kapanmasını bekler — `a11y.test: 'error'` ile şart.
 *
 * `Select.stories.tsx`'teki `popupKapanmasiniBekle`'nin aynısı: popup açıkken
 * basılan `data-base-ui-focus-guard` span'leri `aria-hidden="true"` +
 * `tabindex="0"` taşıyor ve kapanma animasyonu sürerken axe çalışırsa story
 * yazı-tura düşüyor. Açık bırakılan popup sorun değil; sorun kapanırken
 * bitirmek.
 */
async function popupKapanmasiniBekle(): Promise<void> {
  await waitFor(() =>
    expect(document.querySelector('[data-base-ui-focus-guard]')).not.toBeInTheDocument(),
  )
}

const meta = {
  title: 'Screens/ListingReviewPanel',
  component: ListingReviewPanel,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "İlanın bütün inceleme alanları ve karar çubuğu. Veri **prop'tan gelir**, ekran çekmez; " +
          'kabuk (AppShell/TopBar/PageHeader) burada yok — bu ekran onun içeriğidir ve bu yüzden ' +
          "kendi `<h1>`'i de yok: bölümler `<h2>`, ListingFacts `<h3>`, zincir h1 → h2 → h3. " +
          '**`decisionError` `state` ile aynı eksende değil**: ilan sorunsuz yüklenmişken karar ' +
          'reddedilebilir, o yüzden karar çubuğuna geçiliyor ve ekranda duran ilan gizlenmiyor. ' +
          '`notFound` bir `AsyncState` üyesi değil — tek kayıtlık bir ekranda `empty` "ilan ' +
          'bulunamadı" demektir (gerekçe component JSDoc\'unda).',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'screen',
      useWhen: [
        'Tek bir ilanın tüm inceleme alanları ve moderasyon kararı bir arada gösterilecekse',
        'Moderatör ilanı onaylayacak, reddedecek veya düzeltme isteyecekse',
        'İki revizyon arasındaki fark, şikayetler ve otomatik kontroller karar anında yan yana istenecekse',
      ],
      doNotUseWhen: [
        'Birden çok ilan listelenecekse — ListingListPage kullanın',
        'Hızlı karar kuyruğu isteniyorsa — ApprovalQueue kullanın',
        'Kabuk, sayfa başlığı veya gezinme gerekiyorsa — AppShell ve PageHeader sayfa katmanının işi',
        'Veri çekilecekse — ekran veri çekmez, `state` prop olarak verilir',
      ],
    },
  },

  /*
    `state` bilerek meta.args'ta DEĞİL: her story kendi durumunu verir ve
    meta'daki bir örnek durum, bu dosyadaki bütün story'leri o durumun tipine
    bağlama riskini taşır (AGENTS.md, TS2375).

    `submittingAction`, `decisionError`, `revealExactLocation`, `onPause` ve
    `onArchive` de yok — beşinin de **yokluğu bir durum**: karar gönderilmemiş,
    karar reddedilmemiş, kesin konum kapalı, pasife alma/arşivleme eylemi yok.
    Meta'ya konsalar bu dosyada geri alınamaz olurlardı.
  */
  args: {
    capabilities: yetkiler(AdminRole.Moderator),
    onApprove: fn(),
    onReject: fn(),
    onRequestChanges: fn(),
    onRetry: fn(),
  },

  argTypes: {
    state: { control: false },
    capabilities: { control: false },
    revealExactLocation: { control: 'boolean' },
    submittingAction: {
      control: 'select',
      options: [undefined, 'approve', 'reject', 'requestChanges', 'pause', 'archive'],
    },
  },
} satisfies Meta<typeof ListingReviewPanel>

export default meta

type Story = StoryObj<typeof meta>

/* ------------------------------------------------------------------ */
/* Zorunlu durum story'leri (brifing 3.5)                              */
/* ------------------------------------------------------------------ */

/**
 * Ölçü koruyan iskelet — spinner'lı boş ekran değil (brifing 2.1).
 *
 * Kendi `loading` kanalı olan paneller kendi iskeletlerini çiziyor; olmayanların
 * yerini ekran tutuyor. Karar çubuğu yok: `status` ve `revision` gelmeden hangi
 * eylemin var olduğu bilinemez.
 */
export const Loading: Story = {
  args: { state: { status: 'loading' } },
}

/** İlk sorgu henüz başlatılmadı; `loading` ile aynı iskelet — ekran boş kalmaz. */
export const Idle: Story = {
  args: { state: { status: 'idle' } },
}

/** Hata mesajı, hata kodu ve yeniden deneme eylemi (brifing 2.1). */
export const Error: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'İlan yüklenemedi',
        message: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
        code: 'ILAN_DETAY_502',
        retryable: true,
      },
    },
  },
}

/**
 * `notFound` — `AsyncState`'te böyle bir üye **yok** ve uydurulmadı.
 *
 * Türetme: `empty`, liste ekranında "bu filtreye uyan sonuç yok" demek; tek
 * kayıtlık bir ekranda aynı cümlenin tekil karşılığı "böyle bir ilan yok".
 * `error` değil — hiçbir şey ters gitmedi, sunucu soruyu anladı ve cevabı "yok".
 * Brifing 2.1 `empty`'nin karşılığını zaten `EmptyState` diye yazıyor.
 */
export const NotFound: Story = {
  args: { state: { status: 'empty' } },
}

/** Veriler ve kullanılabilir eylemler; incelemedeki ilan, üç karar da açık. */
export const Success: Story = {
  args: { state: BASARILI },
}

/**
 * Karar uçuyor: o butonda spinner, **diğer kararlar** kapalı.
 *
 * Ekranın kalanı kapanmıyor (brifing 2.1: "tüm ekran gereksiz yere devre dışı
 * bırakılmaz") — moderatör karar uçarken fotoğrafa bakmaya devam edebilmeli.
 */
export const DecisionPending: Story = {
  args: { state: BASARILI, submittingAction: 'approve' },
}

/**
 * Revizyon çakışması: moderatör kararı verirken ilan değişti.
 *
 * Ekranda duran ilan **gizlenmiyor**: `decisionError` `state` ile aynı eksende
 * değil, ilan sorunsuz yüklendi. Çubuk kararı reddedilmiş sayıp sebebi
 * gösteriyor ve tekrar deneme butonu **sunmuyor** — aynı damga aynı çakışmayı
 * üretir. Doğru eylem yeniden yükleyip yeniden bakmak; o eylem bu ekranın ve
 * "İlanı yeniden yükle" butonu `onRetry`'a bağlı.
 *
 * `expectedRevision` ilanın kendi revizyonuyla aynı (1): ekran hâlâ moderatörün
 * gördüğü revizyonu gösteriyor, çünkü henüz yeniden yüklenmedi. Sunucudaki
 * güncel hâl 2.
 */
export const Conflict: Story = {
  args: {
    state: BASARILI,
    decisionError: {
      kind: 'revisionConflict',
      expectedRevision: residentialPendingVilla.revision,
      currentRevision: residentialPendingVilla.revision + 1,
    },
  },
}

/* ------------------------------------------------------------------ */
/* Zorunlu düzen varyantları (brifing 3.5)                             */
/* ------------------------------------------------------------------ */

/** Mobile sections: tek kolon, bölümler alt alta. Çubuk ekranın altına yapışır. */
export const MobileSections: Story = {
  args: { state: BASARILI },
  globals: { viewport: { value: 'mobile320' } },
}

/** Desktop split: ana kolon ve yan kolon eşit bölünür (≥48rem). */
export const DesktopSplit: Story = {
  args: { state: BASARILI },
  globals: { viewport: { value: 'tablet768' } },
}

/** Wide side rail: yan kolon gerçek bir raya daralır, ana kolon iki katı yer alır (≥64rem). */
export const WideSideRail: Story = {
  args: { state: BASARILI },
  globals: { viewport: { value: 'desktop1440' } },
}

/* ------------------------------------------------------------------ */
/* Diğer durumlar                                                       */
/* ------------------------------------------------------------------ */

/**
 * 403: tekrar denemek aynı 403'ü verir, buton yok.
 *
 * `retryable` tip düzeyinde `false`. `error`'dan ayrı bir ekran çünkü
 * söylediği şey farklı: "bir şey ters gitti" değil, "bu senin görebileceğin bir
 * şey değil".
 */
export const Unauthorized: Story = {
  args: {
    state: {
      status: 'unauthorized',
      error: {
        title: 'Bu ilanı görüntüleme yetkiniz yok',
        message:
          'İlan detayı yalnızca moderasyon yetkisi olan rollere açık. Erişim gerekiyorsa yöneticinizden isteyin.',
        code: 'ILAN_DETAY_403',
        retryable: false,
      },
    },
  },
}

/** Tekrar denenemeyen hata: buton çıkmamalı, `onRetry` bağlı olsa bile. */
export const NonRetryableError: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'İlan okunamadı',
        message: 'Kayıt bozuk görünüyor. Destek ekibine hata kodunu iletin.',
        code: 'ILAN_DETAY_422',
        retryable: false,
      },
    },
  },
}

/** Son başarılı veri duruyor, üstte güncelleme uyarısı var (brifing 2.1 `stale`). */
export const Stale: Story = {
  args: { state: { status: 'success', data: INCELEMEDEKI, stale: true } },
}

/**
 * Verinin bir kısmı geldi: ilan ve satıcı var, geçmiş ile şikayetler düştü.
 *
 * Brifing 3.5 bu ekran için `PartialSuccess` story'si istemiyor ama `AsyncState`
 * üyesi ve ekran onu sessizce yutmuyor: gelmeyen alan **yok** sayılıyor (boş
 * dizi değil — boş dizi "şikayet yok" der), o bölüme `ErrorState variant="section"`
 * konuyor ve komşuları ayakta kalıyor.
 */
export const PartialSuccess: Story = {
  args: { state: KISMI },
}

/**
 * İlanın kendisi gelmedi: `partialSuccess`'in `error`'a düştüğü tek nokta.
 *
 * Satıcı kartı ve şikayet listesi tek başına bir ilan detayı değil — moderatör
 * görmediği içeriğe karar veremez.
 */
export const PartialSuccessWithoutListing: Story = {
  args: {
    state: {
      status: 'partialSuccess',
      data: { seller: activeIndividualOwner },
      errors: {
        listing: {
          title: 'İlan yüklenemedi',
          message:
            'İlan servisi cevap vermedi. Yan bilgiler geldi ama inceleme için yeterli değil.',
          code: 'ILAN_DETAY_503',
          retryable: true,
        },
      },
    },
  },
}

/* ------------------------------------------------------------------ */
/* Ekrana özel senaryolar                                              */
/* ------------------------------------------------------------------ */

/**
 * Kesin konum kapalı — **varsayılan hâl**.
 *
 * `revealExactLocation` bir gösterim kapısı, yetki kapısı değil: brifing 1.4'te
 * "İlan görüntüleme" dört rolde de "Tam". Kapalı başlıyor çünkü kesin konum
 * kişisel veriye yakın; gerekçesi olduğunda açılır ve açma kararı sayfa
 * katmanının.
 */
export const ExactLocationHidden: Story = {
  args: { state: BASARILI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByText('Kesin konum gizli').length).toBeGreaterThan(0)
    /* Koordinat DOM'da hiç yok — gizli değil, yazılmamış. */
    await expect(canvas.queryByText(/36\.858900/)).not.toBeInTheDocument()
  },
}

/**
 * Kesin konum açık: adres ve koordinat görünür.
 *
 * İlan sahibi `showExactLocation: false` demiş; panel bunu bir bantla söylüyor —
 * moderatör gördüğü adresin kamuya açık sayfada görünmediğini bilmeli.
 * Koordinat `toFixed` ile yazılıyor, `Intl`'e sokulmuyor: `36,858900, 30,608900`
 * üç virgül olurdu ve hangisinin ondalık olduğu okunamazdı.
 */
export const ExactLocationRevealed: Story = {
  args: { state: BASARILI, revealExactLocation: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('36.858900, 30.608900')).toBeInTheDocument()
    await expect(canvas.queryByText('Kesin konum gizli')).not.toBeInTheDocument()
  },
}

/**
 * Düzenlenmiş ilan: moderatörün sorusu "ilan ne" değil, **"ne değişti"**.
 *
 * `previousRevision` gelince `ListingFacts` `comparison`'a geçiyor ve iki
 * revizyon yan yana duruyor (brifing 2.5: "önceki ve yeni değer farkları").
 *
 * `highlightedFields` **geçilmiyor**: hangi değişikliğin "maddi" olduğu bir iş
 * kuralı, `domain/`'in işi — ve orada böyle bir fonksiyon yok, sözleşmede de
 * kanal yok. Fark yine görünür (iki sütun metinle söylüyor), yalnız vurgu yok.
 * Uydurulmadı, raporlandı.
 */
export const WithPreviousRevision: Story = {
  args: { state: { status: 'success', data: DUZENLENMIS } },
}

/**
 * Yayındaki, çok trafikli ve üç kez şikayet edilmiş ilan.
 *
 * Metrik bloğu gerçek sayılarla; şikayet listesi üç kartla. Yayındaki ilan
 * onaylanamaz — geriye pasife alma ve arşivleme kalıyor, ikisi de bu story'de
 * handler'ıyla birlikte veriliyor (meta'da yoklar: yokluk bir durum).
 */
export const PublishedWithReports: Story = {
  args: {
    state: { status: 'success', data: YAYINDAKI },
    onPause: fn(),
    onArchive: fn(),
  },
}

/**
 * `destek` rolü hiçbir karar veremez — çubuk hiç render edilmez.
 *
 * İnceleme alanları duruyor: brifing 1.4 "İlan görüntüleme"yi dört rolde de
 * "Tam" veriyor. Görünmeyen tek şey kararlar.
 */
export const NoPermission: Story = {
  args: { state: BASARILI, capabilities: yetkiler(AdminRole.Support) },
}

/* ------------------------------------------------------------------ */
/* Ölçen story'ler                                                     */
/* ------------------------------------------------------------------ */

/**
 * Ekranın `<h1>`'i yok; başlık zinciri `<h2>` ile başlıyor.
 *
 * Sayfanın `<h1>`'i `PageHeader`'ın (Faz 4) ve bu ekran onun içeriği. Zincir
 * h1 → h2 (bu ekran) → h3 (`ListingFacts`); `heading-order` buna bağlı ve
 * ListingFacts'in `<h3>` varsayımı tam olarak burada doğrulanıyor.
 */
export const HeadingChainStartsAtH2: Story = {
  args: { state: BASARILI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvasElement.querySelector('h1')).toBeNull()

    const basliklar = [...canvasElement.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    await expect(basliklar.length).toBeGreaterThan(0)
    await expect(basliklar[0]?.tagName).toBe('H2')

    /* ListingFacts kendi bölümlerini h3 basıyor; ekranınki h2 kalmalı. */
    await expect(canvas.getByRole('heading', { name: 'Fotoğraflar', level: 2 })).toBeInTheDocument()
    await expect(canvas.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0)
  },
}

/**
 * Bölümler landmark üretmiyor.
 *
 * Adı olan bir `<section>` `region` olur; dokuz bölüme dokuz landmark vermek
 * `landmark-unique`'i kendi ürettiğimiz gürültüyle doldururdu. Sayfadaki tek
 * `region` `SellerPanel`'in kendi `<section aria-label="İlan sahibi">`'i ve
 * benzersiz kalmalı.
 */
export const SectionsAreNotLandmarks: Story = {
  args: { state: BASARILI },
  play: async ({ canvasElement }) => {
    const bolgeler = canvasElement.querySelectorAll('section[aria-label], section[aria-labelledby]')

    await expect(bolgeler.length).toBe(1)
    await expect(bolgeler[0]?.getAttribute('aria-label')).toBe('İlan sahibi')
  },
}

/**
 * Metrik etiketleri `LISTING_METRIC_LABEL`'dan geliyor, ekran uydurmuyor.
 *
 * Sözlüğün kendi JSDoc'u bu bloğu tüketici sayıyor. Değerler `tr-TR` ile
 * biçimleniyor: 1842 → "1.842". Etiketler sözlükten okunuyor, elle yazılmıyor —
 * sözlük değişirse test doğru sebeple düşer.
 */
export const MetricLabelsComeFromDomain: Story = {
  args: { state: { status: 'success', data: YAYINDAKI } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      Sorgu metrik bölümüne daraltılıyor: "Mesaj" ve "Şikayet" gibi kelimeler
      ekranın başka yerlerinde de geçebilir ve `getByText` birden çok eşleşmede
      düşer. Bölüm başlığından ataya çıkmak burada doğru araç — iddia stile
      değil, DOM yapısına dayanıyor.
    */
    const baslik = canvas.getByRole('heading', { name: 'Metrikler', level: 2 })
    const metrikler = within(baslik.closest('section') ?? canvasElement)

    for (const label of Object.values(LISTING_METRIC_LABEL)) {
      await expect(metrikler.getByText(label).tagName).toBe('DT')
    }

    /* Sayı `tr-TR` ile biçimleniyor: 1842 → "1.842", yerel ayar makineye bırakılmıyor. */
    await expect(metrikler.getByText('1.842')).toBeInTheDocument()
    await expect(metrikler.getByText('126')).toBeInTheDocument()
  },
}

/**
 * Karar uçarken **yalnız çubuk** kilitleniyor; ekranın kalanı çalışıyor.
 *
 * Brifing 2.1: "etkilenen eylem kilitlenir, tüm ekran gereksiz yere devre dışı
 * bırakılmaz". Ölçüm galeriden: moderatör karar uçarken fotoğrafa bakmaya devam
 * edebilmeli.
 *
 * `Button` gerçek bir `<button>` olduğu için native matcher doğru araç
 * (`toBeDisabled()` yalnız Base UI'ın `role="checkbox"` gibi kutularında yalan
 * söylüyor).
 */
export const DecisionPendingLocksOnlyTheBar: Story = {
  args: { state: BASARILI, submittingAction: 'approve' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Onayla' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'Reddet' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Düzeltme iste' })).toBeDisabled()

    const kucukResim = canvas.getByRole('button', { name: /^2\. fotoğraf/ })
    await expect(kucukResim).toBeEnabled()
    await expect(kucukResim).not.toHaveAttribute('aria-disabled', 'true')
  },
}

/**
 * Reddedilen karar ekranda duran ilanı **gizlemiyor**.
 *
 * `decisionError` `state` ile aynı eksende olsaydı burası bir hata bloğu
 * olurdu; oysa ilan sorunsuz yüklendi ve moderatörün bakması gereken şey hâlâ
 * ekranda.
 */
export const DecisionErrorDoesNotHideTheListing: Story = {
  args: {
    state: BASARILI,
    decisionError: { kind: 'revisionConflict', expectedRevision: 1, currentRevision: 2 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toBeInTheDocument()

    /* İnceleme alanları yerinde: hata bloğu değil, uyarı. */
    await expect(canvas.getByRole('heading', { name: 'Fotoğraflar', level: 2 })).toBeInTheDocument()
    await expect(
      canvas.getByRole('heading', { name: 'İlan bilgileri', level: 2 }),
    ).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Onayla' })).toBeInTheDocument()
  },
}

/**
 * Çakışmada: tekrar deneme yok, yeniden yükleme var, taslak duruyor.
 *
 * Üç iddia birlikte ölçülüyor çünkü üçü birlikte anlamlı:
 *
 * 1. Çubuk "Tekrar dene" **sunmuyor** — aynı damga aynı çakışmayı üretir,
 *    damgayı yenilemek görülmemiş içeriği onaylamak olur.
 * 2. Doğru eylem ilanı yeniden yükleyip yeniden bakmak ve o **sayfanın işi**:
 *    ekran "İlanı yeniden yükle" butonunu `onRetry`'a bağlıyor.
 * 3. Taslak (gerekçe + not) korunuyor — `DraftSurvivesRevisionConflict` emsali.
 *    Çakışmanın bedelini moderatöre uzun bir red gerekçesini ikinci kez
 *    yazdırarak ödetmek olmaz.
 */
export const ConflictKeepsDraftAndOffersReload: Story = {
  args: {
    state: BASARILI,
    decisionError: { kind: 'revisionConflict', expectedRevision: 1, currentRevision: 2 },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement)
    const gerekceAdi = REJECTION_REASON_LABEL[RejectionReason.MisleadingOrIncompleteInfo]
    const NOT = 'Havuz ruhsatı açıklamada geçiyor, belge hâlâ ekli değil.'

    await step('Uyarı çakışmayı anlatıyor, tekrar deneme butonu yok', async () => {
      const uyari = canvas.getByRole('alert')
      await expect(uyari).toHaveTextContent(/İlan siz incelerken değişti/)
      await expect(uyari).toHaveTextContent(/1\. revizyona verdiniz/)
      await expect(uyari).toHaveTextContent(/2\. revizyonda/)

      await expect(canvas.queryByRole('button', { name: /Tekrar dene/ })).not.toBeInTheDocument()
    })

    await step('Yeniden yükleme sayfanın işi ve bağlı', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'İlanı yeniden yükle' }))
      await expect(args.onRetry).toHaveBeenCalled()
    })

    await step('Red gerekçesi ve notu yazılır, karar gönderilir', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Reddet' }))

      /* Dialog portalda: canvas'ta değil, gövdede aranmalı. */
      const dialog = within(document.body)
      await userEvent.click(await dialog.findByRole('checkbox', { name: gerekceAdi }))
      await userEvent.type(dialog.getByRole('textbox', { name: /Moderasyon notu/ }), NOT)
      await userEvent.click(dialog.getByRole('button', { name: 'Reddet' }))

      await popupKapanmasiniBekle()
    })

    await step('Dialog tekrar açılır: gerekçe ve not yerinde', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Reddet' }))

      const dialog = within(document.body)
      await expect(await dialog.findByRole('checkbox', { name: gerekceAdi })).toBeChecked()
      await expect(dialog.getByRole('textbox', { name: /Moderasyon notu/ })).toHaveValue(NOT)
    })
  },
}

/** Tekrar denenebilir hata: buton çıkar ve `onRetry`'a bağlıdır. */
export const ErrorCanBeRetried: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'İlan yüklenemedi',
        message: 'Sunucuya ulaşılamadı.',
        code: 'ILAN_DETAY_502',
        retryable: true,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: /Tekrar dene/ }))
    await expect(args.onRetry).toHaveBeenCalled()
  },
}

/**
 * `retryable: false` iken buton çıkmamalı — `onRetry` zorunlu bir prop olduğu
 * hâlde.
 *
 * İki kapının ikincisi bu ekranda tip düzeyinde zaten açık; kuralı taşıyan tek
 * kapı `retryable`. Tekrar denemenin işe yaramayacağı yerde buton sunmak
 * kullanıcıyı döngüye sokar.
 */
export const NonRetryableErrorHasNoButton: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'İlan okunamadı',
        message: 'Kayıt bozuk görünüyor.',
        code: 'ILAN_DETAY_422',
        retryable: false,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: /Tekrar dene/ })).not.toBeInTheDocument()
  },
}

/** 403 tekrar denenemez: aynı istek aynı cevabı verir. */
export const UnauthorizedHasNoRetry: Story = {
  args: {
    state: {
      status: 'unauthorized',
      error: {
        title: 'Bu ilanı görüntüleme yetkiniz yok',
        message: 'Erişim gerekiyorsa yöneticinizden isteyin.',
        retryable: false,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Bu ilanı görüntüleme yetkiniz yok')).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /Tekrar dene/ })).not.toBeInTheDocument()
  },
}

/** `empty` bu ekranda "ilan bulunamadı" demek; filtre yok, temizlenecek bir şey de yok. */
export const NotFoundExplainsMissingListing: Story = {
  args: { state: { status: 'empty' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('İlan bulunamadı')).toBeInTheDocument()
    /* Karar verilecek bir ilan yok: çubuk da yok. */
    await expect(canvas.queryByRole('button', { name: 'Onayla' })).not.toBeInTheDocument()
  },
}

/**
 * `destek` rolüne hiçbir karar butonu çıkmamalı; inceleme alanları durmalı.
 *
 * Brifingin kabul kriteri: "`destek` rolü onay, red, pasif veya arşiv eylemi
 * görememelidir." Kapalı buton da göstermez — yetkisi olmayan eylem yoktur.
 */
export const SupportRoleSeesNoDecisions: Story = {
  args: { state: BASARILI, capabilities: yetkiler(AdminRole.Support) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const ad of ['Onayla', 'Reddet', 'Düzeltme iste', 'Pasife al', 'Arşivle']) {
      await expect(canvas.queryByRole('button', { name: ad })).not.toBeInTheDocument()
    }

    await expect(canvas.getByRole('heading', { name: 'Fotoğraflar', level: 2 })).toBeInTheDocument()
  },
}

/**
 * Bir bölümün verisi düşünce komşuları ayakta kalıyor.
 *
 * Gelmeyen alan **yok** sayılıyor, boş değil: "şikayet yok" ile "şikayetler
 * çekilemedi" moderatör için aynı şey değil ve ilki yanlış bir güven verirdi.
 */
export const PartialSuccessKeepsNeighboursAlive: Story = {
  args: { state: KISMI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Şikayetler yüklenemedi')).toBeInTheDocument()
    /* Boş durum metni ÇIKMAMALI: veri yok değil, gelmedi. */
    await expect(canvas.queryByText('Bu ilana açılmış şikayet yok')).not.toBeInTheDocument()

    /* Komşular ayakta: karar hâlâ verilebilir. */
    await expect(canvas.getByRole('button', { name: 'Onayla' })).toBeInTheDocument()
  },
}

/**
 * 320 pikselde yatay taşma yok.
 *
 * Uzun ilan başlığı, `1.842` gibi sayılar ve karşılaştırma tablosu ancak
 * `minWidth: 0` + `overflow-wrap: anywhere` ile sarar. Kendi kabında kayması
 * gereken içerik (galeri şeridi, karşılaştırma tablosu) sayfayı kaydırmamalı.
 *
 * Not: viewport global'inin test tarayıcısında gerçekten uygulandığı
 * doğrulanmadı (AGENTS.md); iddia viewport'tan bağımsız — hangi genişlikte
 * olursa olsun ekran kendi kabını taşırmamalı.
 */
export const NoHorizontalOverflow: Story = {
  args: { state: { status: 'success', data: DUZENLENMIS } },
  globals: { viewport: { value: 'mobile320' } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}
