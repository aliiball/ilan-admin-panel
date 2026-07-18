import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import {
  ReportSeverity,
  ReportStatus,
  type ListingReport,
  type Paginated,
} from '../../types/domain'
import type { ReportFilterValues } from '../../types/component-props'
import {
  allReportFixtures,
  emptyReportFixtures,
  kadikoyApartmentReports,
  marmarisPensionReports,
  reportBySeverity,
  reportOpenCriticalFraud,
} from '../../fixtures'
import { ReportManagementPage } from './ReportManagementPage'

/**
 * Sayfa paketi. `totalPages` `pageSize` ve `totalItems`'tan **türetiliyor**:
 * elle yazılsaydı fixture kendi içinde çelişebilirdi (`reports.ts`'in sayaç
 * sözleşmesiyle aynı ilke — iki sayı birbirini yalanlamamalı).
 */
function sayfa(
  items: ListingReport[],
  { page = 1, pageSize = 20, totalItems = items.length } = {},
): Paginated<ListingReport> {
  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  }
}

/** Hiçbir şeyi elemeyen filtreler — `empty` ile `filteredEmpty`'yi ayıran taban. */
const BOS_FILTRELER: ReportFilterValues = {
  reasons: [],
  statuses: [],
  severities: [],
  dateRange: {},
}

/** Şiddeti Kritik'e çekilmiş kuyruk. Varsayılandan farkı `filteredEmpty`'yi doğurur. */
const KRITIK_FILTRESI: ReportFilterValues = {
  ...BOS_FILTRELER,
  severities: [ReportSeverity.Critical],
}

/**
 * Masaüstü tablosu ile mobil kuyruk kartları **aynı anda DOM'da**: geçişi medya
 * sorgusu yapıyor, JavaScript değil. Bu yüzden her metin iki kez bulunur ve
 * iddialar kendi kabına daraltılmak zorunda.
 *
 * Rol sorguları `{ hidden: true }` ile yazılıyor: kırılımın altında tablo
 * `display: none`, üstünde kartlar `display: none` ve `display: none` alt ağacı
 * erişilebilirlik ağacından siler — `getByRole` onu görmez. Testin gerçek
 * viewport'u ise doğrulanmadı (AGENTS.md: vitest browser'ın varsayılanı 414×896
 * ve `globals.viewport`'un uygulandığı ölçülmedi), yani "hangisi görünür"
 * bilinemez. `{ hidden: true }` iddiayı **"DOM'da var/yok"** düzeyine indirir ve
 * iki senaryoda da aynı sonucu verir.
 *
 * `getByText` görünürlüğe zaten bakmaz — metin iddiaları bu yüzden kaba
 * daraltılıyor, bayrağa değil.
 */
function tablo(canvasElement: HTMLElement) {
  return within(within(canvasElement).getByRole('table', { hidden: true }))
}

function kartlar(canvasElement: HTMLElement) {
  return within(canvasElement).getAllByRole('article', { hidden: true })
}

/**
 * Base UI popup'ının kapanma animasyonu bitene kadar bekler.
 *
 * a11y kapısı `'error'` ve play bittiğinde axe koşuyor; popup kapanırken
 * `data-base-ui-focus-guard` span'leri (`aria-hidden` + `tabindex`) hâlâ DOM'da
 * olursa story **yazı-tura** düşer. Kalıp `Select.stories.tsx`'ten.
 */
async function popupKapanmasiniBekle(): Promise<void> {
  await waitFor(() =>
    expect(document.querySelector('[data-base-ui-focus-guard]')).not.toBeInTheDocument(),
  )
}

const meta = {
  title: 'Screens/ReportManagementPage',
  component: ReportManagementPage,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Şikayet filtresi, kuyruğu ve karar eylemleri. Veri **prop’tan gelir, çekilmez**. ' +
          '48rem’in altında `ReportCard`’ın `queue` varyantından kuyruk kartları, üstünde ' +
          '`DataTable` — geçişi ekran yapıyor, çünkü `DataTable`’ın `mobileMode="cards"` kanalı ' +
          'viewport’a hiç bakmıyor. `filteredEmpty` bir `AsyncState` üyesi **değil**: ekran onu ' +
          '`status === "empty"` ile filtrelerin varsayılandan farklı olmasından türetir — biri ' +
          '“filtreyi gevşet” dedirtir, öteki “kuyruk temiz” diye iyi haber verir. ' +
          '**Sözleşme boşlukları:** izin listesi, ilan/ad çözümlemesi, `now` ve seçim kanalı ' +
          'yok; gerekçeleri component JSDoc’unda.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'screen',
      useWhen: ['Şikayet yönetimi ekranı kurulurken'],
      doNotUseWhen: [
        'Tek bir şikayet gösterilecekse — ReportCard kullanın',
        'İlan moderasyon kuyruğu kurulacaksa — ApprovalQueue kullanın',
      ],
    },
  },

  /*
    Dokuz prop'un dokuzu da `ReportManagementPageProps`'ta ZORUNLU, yani
    hiçbirinin **yokluğu bir durum** değil — meta.args'a konmaları AGENTS.md'nin
    TS2375 duvarını doğurmuyor. O kural "meta'ya konan prop story'de `undefined`
    ile geri alınamaz" diyor; burada hiçbir story bir prop'u geri almak
    istemiyor, yalnız değerini değiştiriyor. `state` ve `filters` her state
    story'sinde override ediliyor.
  */
  args: {
    state: { status: 'success', data: sayfa(allReportFixtures) },
    filters: BOS_FILTRELER,
    onFiltersChange: fn(),
    onPageChange: fn(),
    onReportOpen: fn(),
    onResolve: fn(),
    onDismiss: fn(),
    onEscalate: fn(),
    onRetry: fn(),
  },

  argTypes: {
    state: { control: false },
    filters: { control: false },
  },
} satisfies Meta<typeof ReportManagementPage>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * Yedi şikayet, `reports.ts`'in sabit sırasında (eskiden yeniye).
 *
 * Özet iki ayrı sayıyı bilerek ayrı yazıyor: "Filtrelere uyan 7" süzülmüş
 * TOPLAM (`totalItems`), açık/kritik sayısı ise yalnız bu sayfadan
 * çıkarılabilir. İkisini tek cümlede birleştirmek, ikinci sayfaya geçince
 * değişen bir "toplam" göstermek olurdu.
 */
export const Success: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Filtrelere uyan 7 şikayet')).toBeInTheDocument()
    await expect(canvas.getByText('Bu sayfada 2 açık şikayet')).toBeInTheDocument()
    await expect(canvas.getByText('Bu sayfada 1 kritik şikayet')).toBeInTheDocument()

    /* Aynı yedi şikayet iki düzende birden: kartlar ve tablo (+1 başlık satırı). */
    await expect(kartlar(canvasElement)).toHaveLength(allReportFixtures.length)
    await expect(tablo(canvasElement).getAllByRole('row', { hidden: true })).toHaveLength(
      allReportFixtures.length + 1,
    )
  },
}

/**
 * Başlık korunur, satırlar skeleton olur — spinner'la boş ekran yok.
 *
 * Veri gelince düzen zıplamaz: sütunlar zaten yerinde duruyor ve kullanıcı neyin
 * yükleneceğini yükleme sırasında da okuyabiliyor.
 */
export const Loading: Story = {
  args: { state: { status: 'loading' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Sütun başlıkları iskelette de duruyor. */
    await expect(tablo(canvasElement).getByText('Şikayet no')).toBeInTheDocument()
    await expect(tablo(canvasElement).getByText('Şiddet')).toBeInTheDocument()

    /* Ama hiçbir şikayet yok: iskelet veri uydurmuyor. */
    await expect(canvas.queryByText(reportOpenCriticalFraud.id)).not.toBeInTheDocument()
    await expect(canvas.queryAllByRole('article', { hidden: true })).toHaveLength(0)
  },
}

/**
 * Filtre yokken boşluk bir hata **değil, iyi haber**: kuyruk temiz.
 *
 * Bu yüzden ne kesik kenarlık (`variant="filtered"`) ne de bir eylem var —
 * temizlenecek filtre yok, atılacak adım da yok. `FilteredEmpty` ile farkı tam
 * olarak bu.
 */
export const Empty: Story = {
  args: {
    state: { status: 'empty', data: sayfa(emptyReportFixtures) },
    filters: BOS_FILTRELER,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Hiç şikayet yok')).toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: 'Filtreleri temizle' }),
    ).not.toBeInTheDocument()
  },
}

/**
 * Aynı `status: 'empty'`, farklı ekran — ayrımı **ekran türetiyor**.
 *
 * `filteredEmpty` bir `AsyncState` üyesi değil ve olmamalı: sunucu "sonuç yok"
 * diyebilir, "filtre yüzünden sonuç yok" diyemez — filtreyi bilen istemcidir.
 * Boşluğun sebebi kullanıcının atacağı adımı değiştiriyor, o yüzden iki ayrı
 * ekran: burada kesik kenarlık ve "Filtreleri temizle".
 */
export const FilteredEmpty: Story = {
  args: {
    state: { status: 'empty', data: sayfa(emptyReportFixtures) },
    filters: KRITIK_FILTRESI,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Filtrelere uyan şikayet yok')).toBeInTheDocument()
    await expect(canvas.queryByText('Hiç şikayet yok')).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Filtreleri temizle' }))

    /*
      Temizleme bütün alanları sıfırlar — `assignedAdminId` dahil, ki onun
      görünür bir kontrolü yok (admin listesi kanalı sözleşmede eksik). Kutuda
      görünmeyen bir filtrenin listeyi daraltmaya devam etmesi, kullanıcının
      "temizledim ama hâlâ boş" demesi olurdu. Anahtar hiç yazılmıyor,
      `undefined` yapılmıyor: `exactOptionalPropertyTypes`.
    */
    await expect(args.onFiltersChange).toHaveBeenCalledWith({
      reasons: [],
      statuses: [],
      severities: [],
      dateRange: {},
    })
  },
}

/**
 * Tekrar deneme butonu **iki kapıdan** geçer: `error.retryable === true` VE
 * `onRetry` bağlı.
 *
 * Bu ekranda `onRetry` sözleşme gereği zorunlu, yani ikinci kapı hep açık;
 * ölçülebilen yarısı burada, öteki yarısı `NonRetryableErrorHasNoRetryButton`'da.
 */
export const Error: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'Şikayetler yüklenemedi',
        message: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
        code: 'NETWORK_TIMEOUT',
        retryable: true,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Şikayetler yüklenemedi')

    await userEvent.click(canvas.getByRole('button', { name: 'Tekrar dene' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * `retryable: false` → buton yok, `onRetry` bağlı olsa bile.
 *
 * Tekrar denemenin işe yaramayacağı yerde buton sunmak kullanıcıyı boşa
 * uğraştırır; hatanın kendisi ve destek kodu duruyor.
 */
export const NonRetryableErrorHasNoRetryButton: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'Şikayetler yüklenemedi',
        message: 'Şikayet servisi bakımda. Bakım penceresi bittiğinde liste kendiliğinden gelir.',
        code: 'REPORT_SERVICE_MAINTENANCE',
        retryable: false,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).not.toBeInTheDocument()
    await expect(args.onRetry).not.toHaveBeenCalled()
    await expect(canvas.getByRole('alert')).toHaveTextContent('REPORT_SERVICE_MAINTENANCE')
  },
}

/**
 * 403: "bu senin görebileceğin bir şey değil".
 *
 * `error`'dan ayrı bir durum çünkü ayrı bir ekran ister — tekrar denemek aynı
 * 403'ü verir (`retryable` tip düzeyinde `false`). Filtre çubuğu da yok:
 * görülemeyen bir listeyi süzmek anlamsız, kullanıcının atacağı adım yetki
 * istemek.
 */
export const Unauthorized: Story = {
  args: {
    state: {
      status: 'unauthorized',
      error: {
        title: 'Şikayetleri görme yetkiniz yok',
        message: 'Şikayet kuyruğuna erişmek için yöneticinizden şikayet görüntüleme izni isteyin.',
        code: 'FORBIDDEN',
        retryable: false,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Şikayetleri görme yetkiniz yok')).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).not.toBeInTheDocument()

    /* Filtre çubuğu gizli değil, HİÇ render edilmemiş — `{ hidden: true }` bunu ayırıyor. */
    await expect(canvas.queryByRole('textbox', { hidden: true })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('table', { hidden: true })).not.toBeInTheDocument()
  },
}

/**
 * Veri duruyor, üstünde bayatlık uyarısı.
 *
 * `stale` bir hata değil: son başarılı sonuç ekranda kalıyor ve kullanıcı ona
 * bakarak çalışmaya devam edebiliyor. Uyarı `dismissible` **değil** — kalıcı bir
 * durumu kapatılabilir yapmak "kapat, sorun dursun" demek olurdu.
 */
export const Stale: Story = {
  args: { state: { status: 'success', data: sayfa(allReportFixtures), stale: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Bu liste güncel olmayabilir')).toBeInTheDocument()
    /* Veri kaybolmadı: yedi şikayet hâlâ orada. */
    await expect(kartlar(canvasElement)).toHaveLength(allReportFixtures.length)

    await userEvent.click(canvas.getByRole('button', { name: 'Yenile' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * `partialSuccess` bu ekranda **beklenmiyor** — liste tek bir sorgudan geliyor,
 * dashboard'un bağımsız grafik sorguları gibi bir yapı yok.
 *
 * Ama sözleşmenin üyesi ve sessizce düşürülemez: gelen şikayetler gösteriliyor,
 * gelmeyen alan söyleniyor. `data` `Partial<Paginated<...>>` — gelmeyen alan
 * YOK, boş değil.
 */
export const PartialSuccess: Story = {
  args: {
    state: {
      status: 'partialSuccess',
      data: { items: marmarisPensionReports, page: 1, pageSize: 20 },
      errors: {
        totalItems: {
          title: 'Şikayet sayısı hesaplanamadı',
          message: 'Toplam sayı gelmedi; sayfalama bu sayfayla sınırlı.',
          retryable: true,
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Şikayet listesinin bir kısmı yüklenemedi')).toBeInTheDocument()
    await expect(kartlar(canvasElement)).toHaveLength(marmarisPensionReports.length)
  },
}

/**
 * Brifing 3.5'in zorunlu story'si: şiddeti Kritik'e çekilmiş kuyruk.
 *
 * Kayıt `reportBySeverity` indeksinden okunuyor, elle seçilmiyor: indeks
 * `satisfies Record<ReportSeverity, ListingReport>` ile bağlı, yani domain'e yeni
 * bir seviye eklenirse bu story'nin kaynağı da derlenmez.
 *
 * `reportOpenCriticalFraud` kuyruğun en kötü hâli: kritik, açık **ve atanmamış**
 * — kimse üstüne almamış.
 */
export const CriticalReports: Story = {
  args: {
    state: { status: 'success', data: sayfa([reportBySeverity[ReportSeverity.Critical]]) },
    filters: KRITIK_FILTRESI,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Bu sayfada 1 kritik şikayet')).toBeInTheDocument()

    /* Şiddet YAZIYLA da okunuyor: `critical` ile `high` farkı tondan okunamaz. */
    await expect(tablo(canvasElement).getByText('Kritik şiddet')).toBeInTheDocument()

    /* Atanmamış kritik şikayet: ad alanı boş bırakılmıyor, bilinen bir durum yazılıyor. */
    await expect(tablo(canvasElement).getByText('Atanmadı')).toBeInTheDocument()

    /* Açık şikayetin üç kararı da sunuluyor. */
    await expect(
      tablo(canvasElement).getByRole('button', { name: 'Çöz', hidden: true }),
    ).toBeInTheDocument()
  },
}

/**
 * Dört şiddet seviyesinin dördü de **metinle** okunabilmeli.
 *
 * Renk tek başına gösterge olamaz; `critical` ile `high` arasındaki fark bir
 * kuyrukta tam olarak sıralamayı belirleyen şey ve tondan okunması istenemez.
 * `reportBySeverity`'nin dört kaydı bu iddianın doğal örneği.
 */
export const EverySeverityIsReadableAsText: Story = {
  args: { state: { status: 'success', data: sayfa(Object.values(reportBySeverity)) } },
  play: async ({ canvasElement }) => {
    for (const etiket of ['Düşük şiddet', 'Orta şiddet', 'Yüksek şiddet', 'Kritik şiddet']) {
      await expect(tablo(canvasElement).getByText(etiket)).toBeInTheDocument()
    }
  },
}

/**
 * Brifing 5.5'in ek story'si: sonuçlanmış şikayetler.
 *
 * İki şey birden ölçülüyor:
 *
 * 1. **Kapanmış şikayete karar eylemi sunulmuyor.** Bu bir yetki kapısı değil,
 *    durum kapısı — ekranın elindeki tek gerçek kapı o (izin listesi sözleşmede
 *    yok). Çözülmüş bir şikayeti yeniden çözmek brifing 2.8'in `alreadyResolved`
 *    hâli olurdu: kullanıcı basar, sunucu reddeder, ekranın söyleyecek sözü olmaz.
 * 2. **Çözüm notu görünüyor** — "neden kapandı" sorusunun tek cevabı ve
 *    `resolved` ile `dismissed` farkını da o taşır.
 *
 * `kadikoyApartmentReports` üçü de aynı ilana bağlı, yani her kart `2` benzer
 * şikayet taşıyor: kart kendini saymaz.
 */
export const ResolvedReports: Story = {
  args: {
    state: { status: 'success', data: sayfa(kadikoyApartmentReports) },
    filters: {
      ...BOS_FILTRELER,
      statuses: [ReportStatus.Resolved, ReportStatus.Dismissed],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      Olumsuz iddia `queryAllByText` ile: metin iki düzende birden aranır
      (kartlar + tablo) ve `queryByText` birden çok eşleşmede zaten patlardı.
      Sıfır uzunluk "hiçbir düzende yok" demek — `queryByRole` kullanılsaydı
      iddia gizlenen düzende sessizce dişsizleşirdi.
    */
    await expect(canvas.queryAllByText('Çöz')).toHaveLength(0)
    await expect(canvas.queryAllByText('Geçersiz say')).toHaveLength(0)
    await expect(canvas.queryAllByText('Eskale et')).toHaveLength(0)

    await expect(canvas.getByText('Bu sayfada 0 açık şikayet')).toBeInTheDocument()

    /* Üç satırın üçü de 2 diyor: kayıt kendini saymıyor. */
    await expect(tablo(canvasElement).getAllByText('2 benzer şikayet daha')).toHaveLength(
      kadikoyApartmentReports.length,
    )

    /* Çözüm notu tablodaki yerinde, kırpılmadan. */
    await expect(
      tablo(canvasElement).getByText(
        'Net alan tapu ve proje bilgisiyle karşılaştırıldı; ilandaki değer doğru.',
      ),
    ).toBeInTheDocument()
  },
}

/**
 * Karar eylemleri handler'ları **şikayetin kendisiyle** çağırır.
 *
 * Üçü ayrı ayrı ölçülüyor: aynı satırda üç butonu birbirine bağlamak (hepsinin
 * `onResolve` çağırması gibi) testlerin geçtiği ama ekranın yanlış kararı
 * gönderdiği bir hata olurdu.
 *
 * Ölçüm **kartlar** üzerinden: 48rem'in altında görünür olan düzen o ve testin
 * gerçek viewport'u ne olursa olsun (320 global uygulanırsa 320, uygulanmazsa
 * vitest'in 414 varsayılanı) ikisi de kırılımın altında — yani bu story'nin
 * tıklaması iki senaryoda da gerçek bir kullanıcı tıklaması. Tablonun kendi
 * butonları aynı `satirEylemleri` kapanışından geliyor.
 */
export const DecisionsReportTheReport: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { state: { status: 'success', data: sayfa([reportOpenCriticalFraud]) } },
  play: async ({ canvasElement, args }) => {
    const kart = within(kartlar(canvasElement)[0] as HTMLElement)

    await userEvent.click(kart.getByRole('button', { name: 'Çöz', hidden: true }))
    await expect(args.onResolve).toHaveBeenCalledWith(reportOpenCriticalFraud)

    await userEvent.click(kart.getByRole('button', { name: 'Geçersiz say', hidden: true }))
    await expect(args.onDismiss).toHaveBeenCalledWith(reportOpenCriticalFraud)

    await userEvent.click(kart.getByRole('button', { name: 'Eskale et', hidden: true }))
    await expect(args.onEscalate).toHaveBeenCalledWith(reportOpenCriticalFraud)

    /* Eyleme basmak şikayeti AÇMAZ: eylemler tıklanabilir bölgenin kardeşi, içinde değil. */
    await expect(args.onReportOpen).not.toHaveBeenCalled()
  },
}

/** Kuyruk kartına tıklamak şikayeti açar — mobilde tek yol bu. */
export const QueueCardOpensTheReport: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { state: { status: 'success', data: sayfa([reportOpenCriticalFraud]) } },
  play: async ({ canvasElement, args }) => {
    const kart = within(kartlar(canvasElement)[0] as HTMLElement)

    await userEvent.click(kart.getByRole('button', { name: /Sahte İlan Şüphesi/, hidden: true }))
    await expect(args.onReportOpen).toHaveBeenCalledWith(reportOpenCriticalFraud)
  },
}

/**
 * Tabloda şikayeti açan şey `<tr onClick>` değil, gerçek bir `<button>`.
 *
 * `DataTableProps.onRowClick` bilerek kullanılmıyor: satır tıklaması yalnız
 * fareyle çalışır (satırın rolü, `tabIndex`'i ve klavye olayı yok) ve tek yol
 * olsaydı masaüstü tablosu klavyeyle şikayet açamazdı.
 *
 * Butonun adı **görünür metni içeriyor** (`report-pension-fraud şikayetini aç`):
 * `aria-label` ile değiştirilseydi görünen kimlik ile duyulan ad ayrışır ve axe
 * `label-in-name`'e takılırdı. Ad ayrıca her satırda **benzersiz** — ekran
 * okuyucu kullanıcısı yedi satırda yedi farklı ad duyar.
 *
 * Odak iddiası bilerek **yok**: tablo kırılımın altında `display: none` olabilir
 * ve `focus()` gizli elemanda çalışmaz — testin gerçek viewport'u doğrulanmadığı
 * için o iddia yazı-tura düşerdi. DOM'da butonun varlığı ve handler'ının bağlı
 * olduğu ise viewport'tan bağımsız.
 */
export const TableOpensReportsWithARealButton: Story = {
  args: { state: { status: 'success', data: sayfa([reportOpenCriticalFraud]) } },
  play: async ({ canvasElement, args }) => {
    const buton = tablo(canvasElement).getByRole('button', {
      name: `${reportOpenCriticalFraud.id} şikayetini aç`,
      hidden: true,
    })

    await expect(buton.tagName).toBe('BUTTON')
    await expect(buton).toHaveAttribute('type', 'button')

    await userEvent.click(buton)
    await expect(args.onReportOpen).toHaveBeenCalledWith(reportOpenCriticalFraud)
  },
}

/**
 * Filtre değişikliği **tam** `ReportFilterValues` olarak yukarı bildiriliyor.
 *
 * `FilterBar` `(id, value)` ikilisi veriyor; ekran onu sözleşmenin şekline
 * çeviriyor ve enum dizisine daraltıyor — şekli bozuk bir değer (eski
 * kaydedilmiş görünüm, elle yazılmış URL parametresi) sessizce eleniyor.
 *
 * Play, MultiSelect'in **portal'ını açıp kapatıyor**: kapanış animasyonu
 * sürerken bitirilirse Base UI'ın `data-base-ui-focus-guard` span'leri
 * (`aria-hidden` + `tabindex`) DOM'da kalır ve axe `aria-hidden-focus` görür —
 * story yazı-tura düşerdi. `popupKapanmasiniBekle` bu yüzden var.
 */
export const FilterChangeIsReportedUpward: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const durumKutusu = canvas.getByRole('combobox', { name: 'Durum' })
    durumKutusu.focus()
    /* ArrowDown listeyi açar; tıklama Base UI Combobox'ta her zaman açmıyor. */
    await userEvent.keyboard('{ArrowDown}')

    const popup = within(document.body)
    await userEvent.click(await popup.findByRole('option', { name: 'Açık' }))

    await expect(args.onFiltersChange).toHaveBeenCalledWith({
      reasons: [],
      statuses: [ReportStatus.Open],
      severities: [],
      dateRange: {},
    })

    await userEvent.keyboard('{Escape}')
    await popupKapanmasiniBekle()
  },
}

/**
 * Metin filtresi silinince alan **kaldırılır**, `undefined` yapılmaz.
 *
 * `exactOptionalPropertyTypes` açıkken `query?: string` alanına `undefined`
 * atanamaz (TS2375); ayrıca yokluk ile boş string aynı şey değil —
 * `bosFiltreler()` de anahtarı hiç yazmıyor. `toHaveBeenCalledWith` nesnenin
 * tamamını karşılaştırıyor, yani `query: undefined` taşıyan bir çağrı bu iddiayı
 * düşürür.
 */
export const ClearingTheQueryDropsTheKey: Story = {
  args: { filters: { ...BOS_FILTRELER, query: 'sahte' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.clear(canvas.getByRole('textbox', { name: 'Ara' }))

    await expect(args.onFiltersChange).toHaveBeenCalledWith({
      reasons: [],
      statuses: [],
      severities: [],
      dateRange: {},
    })
  },
}

/**
 * Sayfa değişimi 1-tabanlı sayıyla yukarı bildiriliyor.
 *
 * `Pagination` sayfayı kendi tutmaz; `totalItems: 0` iken de hiç render edilmez,
 * o yüzden boş durumlarda ekranda sayfalama görünmüyor. Sayfa butonlarının
 * erişilebilir adı "Sayfa 2" — çıplak bir "2" ekran okuyucuda hiçbir şey
 * anlatmaz.
 */
/*
  Adı `Paginated` DEĞİL: story adı modül kapsamında bir `export const` ve
  `type Paginated` bu dosyaya import edilmiş — ikisi çakışınca TS2395
  ("Individual declarations in merged declaration must be all exported or all
  local") veriyor. Aynı aile `export const Error`'ın global `Error`'ı
  gölgelemesiyle: **story adları tip ve global adlarıyla yarışır.**
*/
export const MultiplePages: Story = {
  args: {
    state: {
      status: 'success',
      data: sayfa(allReportFixtures.slice(0, 5), { page: 1, pageSize: 5, totalItems: 12 }),
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Filtrelere uyan 12 şikayet')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Sayfa 2' }))
    await expect(args.onPageChange).toHaveBeenCalledWith(2)
  },
}

/**
 * Düzen varyantı: 320 pikselde kuyruk kartları.
 *
 * Kartların **görünmesi** medya sorgusunun işi ve ekran görüntüsüyle
 * doğrulanır — repoda container query yok, viewport global'inin test
 * tarayıcısına uygulandığı da ölçülmedi (AGENTS.md). Play'in ölçebildiği tek şey
 * viewport'tan bağımsız: DOM'da kart var ve sayfa yatay kaydırmıyor.
 */
export const MobileQueueCards: Story = {
  globals: { viewport: { value: 'mobile320' } },
  play: async ({ canvasElement }) => {
    await expect(kartlar(canvasElement)).toHaveLength(allReportFixtures.length)

    /*
      Uzun ilan kimlikleri, çözüm notları ve üç eylem butonu 320 pikselde
      sarmalı. Tablo `display: none` olduğu için ölçüme girmiyor; taşma varsa
      kaynağı kartlardır.
    */
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/**
 * Düzen varyantı: 1440 pikselde on bir sütunlu triage tablosu.
 *
 * Brifing 2.8'in görünen verilerinden **üçü eksik ve sözleşme yüzünden eksik**:
 * "İlan özeti" ve "İlanın mevcut durumu" `Listing` gerektiriyor, "şikayet eden"
 * ile "atanan admin"in **adı** `UserAccount` gerektiriyor — veri paketi yalnız
 * `Paginated<ListingReport>` taşıyor ve ekran veri çekmiyor. Tablo elindeki tek
 * gerçeği, kimliği gösteriyor.
 */
export const DesktopTable: Story = {
  globals: { viewport: { value: 'desktop1440' } },
  play: async ({ canvasElement }) => {
    const tabloIcinde = tablo(canvasElement)

    for (const baslik of [
      'Şikayet no',
      'İlan',
      'Sebep',
      'Şiddet',
      'Durum',
      'Şikayet eden',
      'Atanan admin',
      'Şikayet tarihi',
      'Benzer şikayet',
      'Çözüm notu',
      'Eylemler',
    ]) {
      await expect(tabloIcinde.getByText(baslik)).toBeInTheDocument()
    }
  },
}

/**
 * Anonim şikayet gerçek bir hâl: form oturum açmadan da doldurulabiliyor.
 *
 * `reportDismissedNetArea`'nın `reporterUserId`'si **yok** ve bu bir durum, boş
 * string değil. Ekran ne uydurulmuş bir ad basıyor ne de hücreyi boş bırakıyor.
 */
export const AnonymousReporter: Story = {
  args: {
    state: { status: 'success', data: sayfa([kadikoyApartmentReports[0] as ListingReport]) },
  },
  play: async ({ canvasElement }) => {
    await expect(tablo(canvasElement).getByText('Anonim')).toBeInTheDocument()
  },
}

/**
 * Tarih `tr-TR` + `Europe/Istanbul` sabitinden geçiyor; ekran `new Date()`
 * çağırmıyor.
 *
 * Aynı story her koşuda **aynı metni** yazmalı: fixture tarihleri sabit ve
 * biçimlendirici hem saat dilimini hem yerel ayarı sabitliyor. Bağlanmasaydı
 * "şikayet hangi gün açıldı" sorusu UTC runner'da bir, İstanbul'da başka
 * cevaplanır ve Chromatic her build'i "değişmiş" gösterirdi.
 *
 * **Bekleme süresi ("3 gündür bekliyor") gösterilemiyor:** `ReportCardProps.now`
 * tam bu ekran için eklendi ama `ReportManagementPageProps`'ta `now` kanalı yok
 * ve ekran saati kendi okuyamaz. Sabit bir "bugün" gömmek daha kötüsü olurdu —
 * üretimde her kart yanlış bir süre yazardı. Kart `now` verilmeyince açılış anını
 * mutlak tarih olarak gösteriyor, ki brifing 2.8'in istediği görünen veri de tam
 * olarak o ("Şikayet tarihi"). Ölçüm bu yüzden süreyi değil **tarihin
 * sabitliğini** ölçüyor; sürenin determinizmi `ReportCard.stories.tsx` →
 * `WaitingTimeComesFromNowNotTheClock`'ta ölçülü.
 */
export const DatesAreDeterministic: Story = {
  args: { state: { status: 'success', data: sayfa([reportOpenCriticalFraud]) } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Aynı an, iki düzende, aynı biçim: kartta ve tabloda. */
    await expect(canvas.queryAllByText('13 Tem 2026 09:12')).toHaveLength(2)

    /* `now` kanalı olmadığı için süre yazılmıyor — uydurulmuş bir "şimdi" de yok. */
    await expect(canvas.queryAllByText(/bekliyor$/)).toHaveLength(0)
    await expect(canvas.getByText('Açıldı')).toBeInTheDocument()
  },
}
