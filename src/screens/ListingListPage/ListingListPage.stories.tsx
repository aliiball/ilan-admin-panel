import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import {
  AdminPermission,
  AdminRole,
  ListingCategory,
  ROLE_PERMISSIONS,
  type Listing,
  type Paginated,
} from '../../types/domain'
import { allListingFixtures, residentialPublishedApartment } from '../../fixtures/listings'
import type { ListingFilterValues } from '../../types/component-props'
import { ListingListPage } from './ListingListPage'

/**
 * İzinler rolün kendi listesinden türetilir — elle yazılmaz.
 *
 * `ApprovalQueue.stories.tsx`'teki `yetkiler` ile aynı gerekçe: kabul kriteri
 * uydurulmuş bir dizi değil `ROLE_PERMISSIONS`'ın kendisi olsun. Brifing 1.4'ün
 * matrisi değişir de ekran ona uymazsa test düşsün.
 */
function izinler(role: AdminRole): AdminPermission[] {
  const liste: readonly AdminPermission[] = ROLE_PERMISSIONS[role]
  return [...liste]
}

/**
 * Sayfalı sonuç.
 *
 * Sayılar birbirini tutuyor ve **elle** yazılı: 36 kayıt / 12'lik sayfa = 3
 * sayfa. `new Date()` yok, türetilmiş sayı yok — fixture'ların deterministik
 * olması brifingin şartı ve tutarsız bir `totalPages` Pagination'ı sessizce
 * yanlış çizdirirdi.
 *
 * Üç sayfa bilerek: `Pagination`'ın kısaltmasız sınırı yedi sayfa, yani numara
 * dizisi `…` üretmeden 320 pikselde de sığar. On iki sayfalık bir story yatay
 * taşma ölçümünü Pagination'ın kendi sorunuyla kirletirdi.
 */
const BASARILI_VERI: Paginated<Listing> = {
  items: allListingFixtures,
  page: 2,
  pageSize: 12,
  totalItems: 36,
  totalPages: 3,
}

/** Hiçbir şeyi süzmeyen filtreler: `empty` ile `filteredEmpty`'yi ayıran taban. */
const BOS_FILTRELER: ListingFilterValues = {
  categories: [],
  statuses: [],
  currencies: [],
  sellerTypes: [],
  dateRange: {},
  promotionTypes: [],
}

/** Üç alanı dolu filtreler: serbest metin + kategori + şikayet anahtarı. */
const DOLU_FILTRELER: ListingFilterValues = {
  ...BOS_FILTRELER,
  query: 'Caferağa',
  categories: [ListingCategory.Residential],
  reportedOnly: true,
}

const SECILI: string[] = allListingFixtures.slice(0, 3).map((ilan) => ilan.id)

const meta = {
  title: 'Screens/ListingListPage',
  component: ListingListPage,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'İlan listesi: filtre, tablo, seçim ve toplu işlemler. Veri **çekmez** — `state` ' +
          "prop'tan gelir. Kabuk render etmez, bu yüzden `<h1>`'i yoktur. Kart/tablo kararını " +
          'ekran veriyor ve iki dalı da render edip birini medya sorgusuyla kapatıyor: ' +
          "`DataTableProps.mobileMode`'un JSDoc'u \"dar ekranda\" dese de component viewport'a " +
          'bakmıyor, `mobileMode="cards"` 1440 pikselde de kart çiziyor. Toplu eylemler iki ' +
          'kapıdan geçer (`ListingBulkModerate` + eylemin kendi izni); yetkisi olmayan kullanıcı ' +
          'butonu devre dışı değil, **hiç** görmez ve toplu eylem kalmayınca seçim kutuları da ' +
          'çıkmaz. `filteredEmpty` `AsyncState` üyesi değil — `status: empty` + filtrelerin ' +
          'varsayılandan farklı olmasından türetilir.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'screen',
      useWhen: [
        'İlanlar çok kolonlu, filtreli ve sayfalı olarak taranacaksa',
        'Seçili ilanlara toplu onay, red veya arşivleme uygulanacaksa',
      ],
      doNotUseWhen: [
        'Karar bekleyen ilanlar sırayla incelenecekse — ApprovalQueue kullanın',
        'Tek bir ilanın kararı verilecekse — ListingReviewPanel kullanın',
      ],
    },
  },

  /*
    meta.args'ta **yalnız handler'lar** var. Sözleşmedeki on prop'un hepsi zorunlu,
    yani hiçbirinin yokluğu bir durum değil — kural bu yüzden burada TS2375'i
    değil, tipin kendisini kolluyor:

    `StoryObj<typeof meta>` meta.args'ın ÇIKARILDIĞI tipi prop tipiyle kesiştiriyor.
    `state: { status: 'success', ... }` yazsaydık çıkarılan tip birleşimin **tek bir
    üyesi** olurdu ve `Loading` story'si `{ status: 'loading' }` yazamazdı; daha
    sessizi, `selectedIds: []` `never[]` diye çıkarılır ve `BulkSelected`'ın
    `['a']`'sı derlenmezdi. Değişen her prop'u story'ler kendi veriyor.

    Handler'lar değişmiyor ve tipleri de değişmiyor: `fn()` hepsinde doğru.
  */
  args: {
    onFiltersChange: fn(),
    onSelectionChange: fn(),
    onPageChange: fn(),
    onListingOpen: fn(),
    onBulkAction: fn(),
    onRetry: fn(),
  },

  argTypes: {
    state: { control: false },
    filters: { control: false },
    selectedIds: { control: false },
    availablePermissions: { control: false },
  },
} satisfies Meta<typeof ListingListPage>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Base UI popup'ının kapanma animasyonu bitene kadar bekler.
 *
 * `a11y.test: 'error'` iken play, DOM'u **oturmuş** bırakmalı: açık popup odak
 * tuzağı için `aria-hidden="true"` + `tabindex="0"` taşıyan koruma span'leri
 * basıyor ve axe onları `aria-hidden-focus` ihlali sayıyor. Kapanış sürerken
 * play biterse story yazı-tura düşer. Kalıp `Select.stories.tsx`'ten.
 */
async function popupKapanmasiniBekle(): Promise<void> {
  await waitFor(() =>
    expect(document.querySelector('[data-base-ui-focus-guard]')).not.toBeInTheDocument(),
  )
}

/* ── Zorunlu durum story'leri (brifing 3.5) ──────────────────────────────── */

/**
 * Brifing 2.3: "Tablo başlığı korunur, satır skeleton'ları gösterilir."
 *
 * Tek tablo çiziliyor, çift değil: DataTable'ın `loading` dalı `cards` dalından
 * önce geldiği için iki dal da aynı iskeleti üretirdi.
 */
export const Loading: Story = {
  args: {
    state: { status: 'loading' },
    filters: BOS_FILTRELER,
    selectedIds: [],
    availablePermissions: izinler(AdminRole.Moderator),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Başlık korunuyor: sütunlar duruyor.
    await expect(
      canvas.getByRole('columnheader', { name: 'İlan No', hidden: true }),
    ).toBeInTheDocument()

    // Ama satırlar veri değil, iskelet: hiçbir ilan başlığı basılmamış.
    await expect(canvas.queryByText(residentialPublishedApartment.title)).not.toBeInTheDocument()
  },
}

/**
 * Hiç ilan yok — temizlenecek filtre de yok.
 *
 * Ayrımın kanıtı "Filtreleri temizle"nin **yokluğu**: bu durumda o buton basınca
 * hiçbir şeyi değiştirmez ve kullanıcıya yanlış adımı önerirdi.
 */
export const Empty: Story = {
  args: {
    state: { status: 'empty' },
    filters: BOS_FILTRELER,
    selectedIds: [],
    availablePermissions: izinler(AdminRole.Moderator),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Henüz ilan yok')).toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: 'Filtreleri temizle', hidden: true }),
    ).not.toBeInTheDocument()
    // Çubuğun kendi "Temizle"si de yok: aktif filtre sayısı sıfır.
    await expect(
      canvas.queryByRole('button', { name: 'Temizle', hidden: true }),
    ).not.toBeInTheDocument()
  },
}

/**
 * Filtre sonucu boş — `AsyncState`'in üyesi olmayan, türetilen durum.
 *
 * Aynı `status: 'empty'` cevabı, farklı filtrelerle farklı ekran veriyor: sunucu
 * "sonuç boş" der, "senin filtren yüzünden" demez — filtreleri bilen istemcidir.
 */
export const FilteredEmpty: Story = {
  args: {
    state: { status: 'empty' },
    filters: DOLU_FILTRELER,
    selectedIds: [],
    availablePermissions: izinler(AdminRole.Moderator),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Filtrelere uyan ilan yok')).toBeInTheDocument()
    // Olumsuzu da yaz: bu Empty değil.
    await expect(canvas.queryByText('Henüz ilan yok')).not.toBeInTheDocument()

    /*
      Çubuğun "Temizle"si var: `activeFilterCount` çubuğa ulaşmış. Kutusu çubuğun
      dışında olan serbest metin de sayıldığı için sayı 3 (metin + kategori +
      şikayet anahtarı) — çubuk kendi hesabıyla 2 derdi.
    */
    await expect(canvas.getByRole('button', { name: 'Temizle', hidden: true })).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Filtreleri temizle' }))
    await expect(args.onFiltersChange).toHaveBeenCalledWith(BOS_FILTRELER)
  },
}

/** Tekrar denenebilir hata: iki kapı da açık (`retryable` + bağlı `onRetry`). */
export const Error: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'İlanlar yüklenemedi',
        message: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
        code: 'NETWORK_TIMEOUT',
        retryable: true,
      },
    },
    filters: BOS_FILTRELER,
    selectedIds: [],
    availablePermissions: izinler(AdminRole.Moderator),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('İlanlar yüklenemedi')

    await userEvent.click(canvas.getByRole('button', { name: 'Tekrar dene' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)

    // Göremediğin listeyi süzmenin anlamı yok: araç çubuğu da tablo da yok.
    await expect(canvas.queryByRole('table', { hidden: true })).not.toBeInTheDocument()
  },
}

/**
 * Tekrar denenemeyen hata: `onRetry` bağlı olsa da buton çıkmaz.
 *
 * Kapının ikinci yarısını ölçüyor. `onRetry` bu sözleşmede **zorunlu** prop,
 * yani "handler yok" hâli hiç kurulamıyor — geriye tek gerçek kapı olarak
 * `retryable` kalıyor ve o kapının çalıştığı ancak burada görülür.
 */
export const NonRetryableErrorHasNoRetryButton: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'İlan listesi bu hesapta kullanılamıyor',
        message: 'Hesabınızın ilan modülü kapalı. Panel yöneticinizle görüşün.',
        code: 'MODULE_DISABLED',
        retryable: false,
      },
    },
    filters: BOS_FILTRELER,
    selectedIds: [],
    availablePermissions: izinler(AdminRole.Moderator),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'İlan listesi bu hesapta kullanılamıyor',
    )
    await expect(
      canvas.queryByRole('button', { name: 'Tekrar dene', hidden: true }),
    ).not.toBeInTheDocument()
  },
}

/**
 * Veriler ve kullanılabilir eylemler.
 *
 * Play, **çift render sözleşmesini** ölçüyor: kart dalı da tablo dalı da her
 * viewport'ta DOM'da; hangisinin boyanacağına medya sorgusu karar veriyor.
 * Sorgular `{ hidden: true }` — iddia "DOM'da var/yok" düzeyinde ve testin
 * gerçek viewport'undan bağımsız (AGENTS: addon-vitest'in `globals.viewport`'u
 * uyguladığı doğrulanamadı).
 */
export const Success: Story = {
  args: {
    state: { status: 'success', data: BASARILI_VERI },
    filters: BOS_FILTRELER,
    selectedIds: [],
    availablePermissions: izinler(AdminRole.Moderator),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Tablo dalı: bir tane, on iki satır + başlık satırı.
    await expect(canvas.getAllByRole('table', { hidden: true })).toHaveLength(1)
    await expect(canvas.getAllByRole('row', { hidden: true })).toHaveLength(
      allListingFixtures.length + 1,
    )

    // Kart dalı: her ilan bir `<article>`.
    await expect(canvas.getAllByRole('article', { hidden: true })).toHaveLength(
      allListingFixtures.length,
    )

    // Sayfalama bağlı ve iki dalın dışında.
    await expect(
      canvas.getByRole('navigation', { name: 'Sayfalama', hidden: true }),
    ).toBeInTheDocument()

    // Seçim yokken toplu işlem çubuğu hiç yok.
    await expect(
      canvas.queryByRole('button', { name: 'Seçimi temizle', hidden: true }),
    ).not.toBeInTheDocument()
  },
}

/**
 * En az bir satır seçildiğinde `BulkActionBar` görünür (brifing 2.3 `selection`).
 *
 * Yıkıcı toplu eylem doğrudan ateşlenmiyor: önce ConfirmDialog. Play onayı
 * **tıklamadan önce** `onBulkAction`'ın çağrılmadığını da ölçüyor — dialog'un
 * dekoratif olmadığının tek kanıtı bu.
 */
export const BulkSelected: Story = {
  args: {
    state: { status: 'success', data: BASARILI_VERI },
    filters: BOS_FILTRELER,
    selectedIds: SECILI,
    availablePermissions: izinler(AdminRole.Moderator),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('3 kayıt seçildi')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Reddet' }))

    // Dialog portal'a gidiyor; arka plan `aria-hidden` olduğu için body'de aranır.
    const dialog = within(document.body)
    await expect(await dialog.findByRole('dialog')).toHaveTextContent('3 ilanı reddet')

    // Henüz hiçbir şey uygulanmadı.
    await expect(args.onBulkAction).not.toHaveBeenCalled()

    await userEvent.click(dialog.getByRole('button', { name: 'Reddet' }))
    await expect(args.onBulkAction).toHaveBeenCalledWith('reject', SECILI)

    await popupKapanmasiniBekle()
  },
}

/**
 * Yetki eylemi gizler, kilitlemez.
 *
 * `icerikDenetcisi` `ListingApprove`/`ListingReject`'e sahip ama
 * `ListingBulkModerate`'e **değil**: tek tek onaylar, on ikisini birden
 * onaylayamaz. Kademe sessizce kalkarsa bu story düşer.
 *
 * Seçim kutuları da yok: seçim yalnız toplu işlem içindir ve seçilip hiçbir şey
 * yapılamayan satır boş bir vaattir.
 */
export const BulkActionsHiddenWithoutPermission: Story = {
  args: {
    state: { status: 'success', data: BASARILI_VERI },
    filters: BOS_FILTRELER,
    selectedIds: SECILI,
    availablePermissions: izinler(AdminRole.ContentReviewer),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // `disabled` değil — hiç yok. Rol sorgusu `aria-hidden`ı dışlar, bu yüzden
    // yokluk iddiası `{ hidden: true }` ile "DOM'da hiç yok"a iner.
    await expect(
      canvas.queryByRole('button', { name: 'Onayla', hidden: true }),
    ).not.toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: 'Reddet', hidden: true }),
    ).not.toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: 'Seçimi temizle', hidden: true }),
    ).not.toBeInTheDocument()

    // Liste yine de görünür: `ListingView` var.
    const tablolar = canvas.getAllByRole('table', { hidden: true })
    await expect(tablolar).toHaveLength(1)

    /*
      Seçim kutusu yok — **iki dalda da**. Sorgu kapsayıcıya daraltılıyor, çünkü
      `canvas.queryByRole('checkbox', { hidden: true })` canvas genelinde yazılınca
      araç çubuğunun "Yalnız şikayetli ilanlar" anahtarını yakalıyor: `FilterBar`
      `boolean` filtreyi `Switch` ile çiziyor, Base UI `Switch` de `<span
      role="switch">`in yanına gizli bir **`<input type="checkbox">`** basıyor
      (`aria-hidden="true"`, `tabindex="-1"`) ve `type="checkbox"`in örtük rolü
      `checkbox`. `{ hidden: true }` `aria-hidden` alt ağacını dışlamadığı için
      (AGENTS: rol sorgusu onu ancak `hidden` verilmezken dışlar) iddia bir filtre
      kontrolüne takılıyordu — component değil, **sorgunun kapsamı** yanlıştı.
      `{ hidden: true }` yine de şart: tablo dalı bu viewport'ta `display: none` ve
      onsuz iddia oraya hiç bakmazdı, yani sessizce dişsizleşirdi.
    */
    const kartlar = canvas.getAllByRole('article', { hidden: true })
    await expect(kartlar).toHaveLength(allListingFixtures.length)

    for (const kap of [...tablolar, ...kartlar]) {
      await expect(within(kap).queryByRole('checkbox', { hidden: true })).not.toBeInTheDocument()
    }
  },
}

/**
 * Sunucu 403 verdi: tekrar deneme yok, güvenli geri dönüş var.
 *
 * `unauthorized`'ın `retryable`'ı tip düzeyinde `false` — 403'ü tekrar denemek
 * aynı 403'ü verir.
 */
export const Unauthorized: Story = {
  args: {
    state: {
      status: 'unauthorized',
      error: {
        title: 'Bu listeyi görme yetkiniz yok',
        message: 'İlan listesi yalnızca ilan görüntüleme izni olan rollere açıktır.',
        code: 'HTTP_403',
        retryable: false,
      },
    },
    filters: BOS_FILTRELER,
    selectedIds: [],
    availablePermissions: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.queryByRole('button', { name: 'Tekrar dene', hidden: true }),
    ).not.toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'Panele dön', hidden: true })).toHaveAttribute(
      'href',
      '/',
    )
    await expect(canvas.queryByRole('table', { hidden: true })).not.toBeInTheDocument()
  },
}

/* ── Sözleşmenin izin verdiği, brifing 2.3'ün saymadığı durumlar ─────────── */

/** Son başarılı veri duruyor, üstte güncelleme uyarısı var (brifing 2.1). */
export const Stale: Story = {
  args: {
    state: { status: 'success', data: BASARILI_VERI, stale: true },
    filters: BOS_FILTRELER,
    selectedIds: [],
    availablePermissions: izinler(AdminRole.Moderator),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Veri kaybolmadı.
    await expect(canvas.getAllByRole('article', { hidden: true })).toHaveLength(
      allListingFixtures.length,
    )

    await userEvent.click(canvas.getByRole('button', { name: 'Tekrar dene' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * Satırlar geldi, sayaç gelmedi.
 *
 * `partialSuccess` dashboard için tasarlandı (her grafik ayrı sorgu) ve brifing
 * 2.3 onu saymıyor, ama `AsyncState` bu ekranda da mümkün kılıyor: sözleşmenin
 * açtığı dal ele alınmazsa gelen satırlar hiç görünmezdi.
 */
export const PartialSuccess: Story = {
  args: {
    state: {
      status: 'partialSuccess',
      data: { items: allListingFixtures, page: 1, pageSize: 12 },
      errors: {
        totalItems: {
          title: 'Toplam sayı alınamadı',
          message: 'Kayıt sayacı yanıt vermedi; sayfa sayısı eksik olabilir.',
          retryable: true,
        },
      },
    },
    filters: BOS_FILTRELER,
    selectedIds: [],
    availablePermissions: izinler(AdminRole.Moderator),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      `alert`, `status` değil: `AlertProps.tone`'un sözleşmesi `warning`'i
      `role="alert"`e bağlıyor (danger/warning anında duyurulur, success/info
      sıra gelince). Rolü tondan bağımsız sanmak sessizce yanlış element arardı.
    */
    await expect(canvas.getByRole('alert')).toHaveTextContent('Listenin bir bölümü yüklenemedi')
    await expect(canvas.getAllByRole('table', { hidden: true })).toHaveLength(1)
  },
}

/* ── Zorunlu düzen varyantları (brifing 3.5) ─────────────────────────────── */

/**
 * Mobil: kart görünümü.
 *
 * Etkileşim bilerek burada ölçülüyor: kart dalı hem uygulanmış 320 piksellik
 * viewport'ta hem de uygulanmadığında (vitest'in varsayılan 414'ü de 48rem'in
 * altında) boyanan daldır. Tablo dalının satırına tıklayan bir play ise iki
 * varsayımın yalnız birinde çalışırdı — bu yüzden yazılmadı.
 */
export const MobileCards: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    state: { status: 'success', data: BASARILI_VERI },
    filters: BOS_FILTRELER,
    selectedIds: [],
    availablePermissions: izinler(AdminRole.Moderator),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    /*
      Yatay taşma yok. Ölçülebilir olmasının sebebi `display: none`: kapalı dal
      hiç kutu üretmiyor.

      İddia zayıflatılmadı — bir kez gerçekten düştü ve gerçek bir kusur buldu:
      FilterBar'ın fiyat alanı 320'de kökü 587'ye kadar taşırıyordu. Sebep ve
      düzeltme `ListingListPage.css.ts`'te (`toolbar` altındaki yapısal seçici);
      kalıcı çözüm FilterBar'ın kendi dosyasında ve RAPOR EDİLDİ.
    */
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)

    const kartlar = canvas.getAllByRole('article', { hidden: true })
    const [ilkKart] = kartlar
    /*
      `globalThis.Error`: bu dosya `Error` adında bir story **export ediyor** ve o
      bağlantı modül boyunca global `Error`'ı gölgeliyor — düz `new Error(...)`
      story nesnesini `new`'lemeye kalkardı. (`noUncheckedIndexedAccess` açık,
      yani indeksin daraltılması şart.)
    */
    if (ilkKart === undefined) throw new globalThis.Error('Kart bulunamadı')

    /*
      Kutu karta göre sorgulanıyor: aynı erişilebilir ad tablo dalında da var
      (`rowLabel`), yani canvas genelinde iki kutu bulunur. Biri her zaman
      `display: none` — erişilebilirlik ağacında tek kutu var, DOM'da iki.
    */
    await userEvent.click(
      within(ilkKart).getByRole('checkbox', {
        name: `${residentialPublishedApartment.title} ilanını seç`,
      }),
    )
    await expect(args.onSelectionChange).toHaveBeenCalledWith([residentialPublishedApartment.id])
  },
}

/**
 * Tablet: yatay kaydırılan tablo.
 *
 * Play, brifing 2.3'ün "Görünen veriler" listesinin gerçekten kolona döndüğünü
 * ölçüyor — viewport'tan bağımsız, DOM düzeyinde. Etiketlerin hepsi
 * `domain/labels.ts`'ten geliyor; sözlük değişirse burası düşer.
 */
export const TabletScrollTable: Story = {
  globals: { viewport: { value: 'tablet768' } },
  args: {
    state: { status: 'success', data: BASARILI_VERI },
    filters: BOS_FILTRELER,
    selectedIds: [],
    availablePermissions: izinler(AdminRole.Moderator),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const basliklar = [
      'Fotoğraflar',
      'İlan No',
      'Başlık',
      'Kategori',
      'İşlem Türü',
      'Konum',
      'Fiyat',
      'Kimden',
      'Durum',
      'İlan Tarihi',
      'Güncellenme Tarihi',
      'İnceleyen',
      'Promosyon İşaretleri',
      'Görüntülenme',
      'Şikayet',
    ]

    for (const baslik of basliklar) {
      await expect(
        canvas.getByRole('columnheader', { name: baslik, hidden: true }),
      ).toBeInTheDocument()
    }
  },
}

/**
 * Masaüstü: tablo.
 *
 * Sayfalama iki dalın da dışında olduğu için etkileşimi burada ölçmek güvenli:
 * hangi dal boyanırsa boyansın `nav` görünür kalır.
 */
export const DesktopTable: Story = {
  globals: { viewport: { value: 'desktop1440' } },
  args: {
    state: { status: 'success', data: BASARILI_VERI },
    filters: BOS_FILTRELER,
    selectedIds: [],
    availablePermissions: izinler(AdminRole.SuperAdmin),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Sayfa 2', hidden: true })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await userEvent.click(canvas.getByRole('button', { name: 'Sonraki sayfa' }))
    await expect(args.onPageChange).toHaveBeenCalledWith(3)
  },
}
