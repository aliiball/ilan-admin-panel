import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { AUDIT_ENTITY_TYPE_LABEL } from '../../domain/labels'
import {
  allAuditLogFixtures,
  auditByEntityType,
  auditReportResolvedPhoto,
  auditThemeDefaultChanged,
  emptyAuditLogFixtures,
} from '../../fixtures'
import { AdminRole, type AuditLogEntry, type Paginated } from '../../types/domain'
import type { AuditLogFilters } from '../../types/component-props'
import { AuditLogPage } from './AuditLogPage'

/**
 * Sekiz kaydın tamamı, tek sayfada. Fixture sırası **yeniden eskiye** — audit bir
 * kütük, okunma yönü "az önce ne oldu".
 */
const TEK_SAYFA: Paginated<AuditLogEntry> = {
  items: allAuditLogFixtures,
  page: 1,
  pageSize: 20,
  totalItems: allAuditLogFixtures.length,
  totalPages: 1,
}

/**
 * Sekiz kayıt, 64'ün 3. sayfası olarak.
 *
 * Sayılar tutarlı (64 / 8 = 8 sayfa, 3. sayfada 8 kayıt) ve `Pagination` ancak
 * birden çok sayfa varken numaraları gösteriyor — tek sayfalık bir veriyle sayfa
 * değiştirme ölçülemez.
 *
 * `totalItems` **story'nin kendi kurgusu**, fixture'ın iddiası değil ve olamaz da:
 * `fixtures/audit.ts` bir toplam bildirmiyor (audit büyüyen bir kütük;
 * `fixtures/users.ts`'in aksine sayaç kuralı yok). Sekiz kaydın "64'ün 8'i"
 * olması bu yüzden hiçbir fixture değişmezini bozmuyor. Sunucu cevabını taklit
 * ediyor: sayfa 4'e basmak `onPageChange(4)`'ü bildirir, veriyi getirmek sayfa
 * katmanının işi — ekran zaten çekmiyor.
 */
const COK_SAYFALI: Paginated<AuditLogEntry> = {
  items: allAuditLogFixtures,
  page: 3,
  pageSize: 8,
  totalItems: 64,
  totalPages: 8,
}

/** Sunucunun boş sayfası: kayıt yok ama cevap var. `Pagination` kendini gizler. */
const BOS_SAYFA: Paginated<AuditLogEntry> = {
  items: emptyAuditLogFixtures,
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 0,
}

const BOS_FILTRELER: AuditLogFilters = { roles: [], entityTypes: [], dateRange: {} }

/** Dört alanın dördü de dolu: `EmptyState`in `filtered` varyantını seçen hâl. */
const DOLU_FILTRELER: AuditLogFilters = {
  query: 'Elif',
  roles: [AdminRole.Moderator],
  entityTypes: ['user'],
  dateRange: { from: '2026-07-01', to: '2026-07-16' },
}

/**
 * Base UI popup'ının kapanışını bekler.
 *
 * `a11y.test: 'error'` iken **play, DOM'u oturmuş bırakmalı**: Base UI popup
 * açıkken odak tuzağı için `aria-hidden="true"` + `tabindex="0"` taşıyan koruma
 * span'leri (`data-base-ui-focus-guard`) basıyor. Play bittiğinde axe çalışıyor;
 * kapanma animasyonu o an sürüyorsa korumalar DOM'da duruyor ve story
 * `aria-hidden-focus` ile **yazı-tura** düşüyor (`Select`in iki story'si beş
 * koşuda üç kez düştü, aynı kod). `Select.stories.tsx` → `popupKapanmasiniBekle`
 * ile aynı kalıp; çekmecenin kendisi de bekleniyor, çünkü kapanış animasyonu
 * dialog'u korumalardan sonra da DOM'da tutabilir.
 *
 * Dikkat: **açık bırakılan** popup sorun değil — sorun tam olarak *kapanırken*
 * bitirmek. Bu yüzden yalnız kapatan story'ler bunu çağırıyor.
 */
async function cekmeceKapanmasiniBekle(): Promise<void> {
  await waitFor(() => {
    expect(document.querySelector('[data-base-ui-focus-guard]')).not.toBeInTheDocument()
    expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })
}

const meta = {
  title: 'Screens/AuditLogPage',
  component: AuditLogPage,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Audit log: filtreleme, tablo, sayfalama ve JSON detay incelemesi (brifing 2.10). ' +
          'Veri çekmez — `state` prop’tan gelir. Kabuk değildir: `<h1>` sayfanın ' +
          '`PageHeader`’ının, buradaki en üst başlık `<h2>`. `onEntryOpen` JSON ' +
          'detayını açar (sözleşmenin kurduğu okuma); çekmecenin açıklığı ekranın ' +
          'kendi görüntü state’i. Brifing 2.10’un "ilgili varlığa gitme" ve "yetkiye ' +
          'göre dışa aktarma" eylemlerinin kanalı yok — raporlandı, uydurulmadı. JSON ' +
          'bloğu `CodeBlock` ile değil `<pre>` ile kuruluyor: brifingin yetkili ' +
          'component katalogunda `CodeBlock` yok.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'screen',
      useWhen: ['Admin işlemlerinin denetim kütüğü listelenip incelenirken'],
      doNotUseWhen: [
        'Tek bir ilanın moderasyon geçmişi gösterilecekse — ModerationHistory kullanın; ' +
          'audit "bu admin ne yaptı", geçmiş "bu ilana ne oldu" sorusudur',
      ],
    },
  },

  /*
    `state` bilerek meta.args'ta DEĞİL: her story'nin konusu o. Buradaki beş prop
    ise sözleşmede **zorunlu** — yokluğu bir durum değil, dolayısıyla meta'ya
    konabilirler (`exactOptionalPropertyTypes` + `StoryObj<typeof meta>` tuzağı
    yalnız yokluğu anlamlı olan prop'ları vuruyor).
  */
  args: {
    filters: BOS_FILTRELER,
    onFiltersChange: fn(),
    onPageChange: fn(),
    onEntryOpen: fn(),
    onRetry: fn(),
  },

  argTypes: {
    state: { control: false },
    filters: { control: false },
  },
} satisfies Meta<typeof AuditLogPage>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Tablo başlığı korunur, satırlar iskelete döner (brifing 2.1: spinner'la boş
 * ekran yok). `idle` de bu hâli gösterir — ilk sorgu başlamamışken de gösterilecek
 * veri yoktur.
 */
export const Loading: Story = {
  args: { state: { status: 'loading' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Başlık ayakta: veri gelince düzen zıplamayacak.
    await expect(canvas.getByRole('columnheader', { name: 'Zaman' })).toBeInTheDocument()
    await expect(canvas.getByRole('columnheader', { name: 'Varlık kimliği' })).toBeInTheDocument()

    // İskeletler `aria-hidden`; yükleniyor bilgisini kabın `aria-busy`'si taşıyor.
    await expect(canvasElement.querySelector('[aria-busy="true"]')).not.toBeNull()
  },
}

/**
 * Hiç kayıt yok ve filtre de yok: yalın `EmptyState`, **eylemsiz**.
 *
 * Bu ekrana özgü: audit kaydı oluşturulamaz, yalnız adminler işlem yaptıkça doğar
 * — "İlk kaydı oluştur" gibi bir birincil eylem burada yalan olurdu.
 */
export const Empty: Story = {
  args: { state: { status: 'empty', data: BOS_SAYFA } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Henüz audit kaydı yok')).toBeInTheDocument()

    // Filtre yokken filtre temizleme önerilmez: yanlış eylemi önerir.
    await expect(canvas.queryByRole('button', { name: 'Filtreleri temizle' })).toBeNull()

    // `totalItems === 0` iken Pagination kendini hiç render etmez.
    await expect(canvas.queryByRole('navigation')).toBeNull()
  },
}

/**
 * Aynı boşluk, filtre yüzünden: `variant="filtered"` ve "Filtreleri temizle".
 *
 * Boşluğun sebebi kullanıcının atacağı adımı değiştirir — brifing 2.10 bu durumu
 * ayrıca saymıyor ama ekranın filtresi var, dolayısıyla türetme kuralı diğer liste
 * ekranlarıyla aynı.
 */
export const FilteredEmpty: Story = {
  args: { state: { status: 'empty', data: BOS_SAYFA }, filters: DOLU_FILTRELER },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Filtrelere uyan audit kaydı yok')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Filtreleri temizle' }))

    // Temizleme dört alanın DÖRDÜNÜ birden sıfırlar; `query` silinir, boşaltılmaz.
    await expect(args.onFiltersChange).toHaveBeenCalledWith({
      roles: [],
      entityTypes: [],
      dateRange: {},
    })
  },
}

/**
 * Tekrar denenebilir hata: iki kapı da açık (`retryable: true` **ve** `onRetry`
 * bağlı), buton görünür.
 *
 * Hata bloğu `DataTable`'ın kendi `error` kanalından geçiyor: düşen şey tablo,
 * sayfanın kalanı ayakta — filtreler kullanılabilir kalır.
 */
export const Error: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'Audit kayıtları yüklenemedi',
        message: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
        code: 'AUDIT_FETCH_FAILED',
        retryable: true,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Hata kodu:')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Tekrar dene' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * `retryable: false` → buton yok, `onRetry` bağlı olsa bile.
 *
 * İki kapının ölçülebilen yarısı: `onRetry` bu sözleşmede **zorunlu**, yani her
 * zaman bağlı — butonu çıkaran ya da gizleyen tek şey `retryable`. Tekrar
 * denemenin işe yaramayacağı bir hatada buton sunmak kullanıcıyı boşa uğraştırır.
 */
export const NonRetryableError: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'Audit kayıtları yüklenemedi',
        message: 'Sorgu aralığı sunucunun saklama penceresinin dışında. Tarih aralığını daraltın.',
        code: 'AUDIT_RANGE_TOO_OLD',
        retryable: false,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Audit kayıtları yüklenemedi')).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).toBeNull()
    await expect(args.onRetry).not.toHaveBeenCalled()
  },
}

/**
 * Sekiz kaydın tamamı; altı `entityType`, dört `AdminRole`'den üçü.
 *
 * Ölçülen üç şey: `action` kodunun `ADMIN_PERMISSION_LABEL`'den Türkçeleşmesi,
 * tarihin **İstanbul saatiyle** yazılması ve satır sayısı.
 */
export const Success: Story = {
  args: { state: { status: 'success', data: TEK_SAYFA } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Başlık satırı + sekiz kayıt.
    await expect(canvas.getAllByRole('row')).toHaveLength(allAuditLogFixtures.length + 1)

    /*
      `action` bir `string`, ama kodlar `AdminPermission` sözlüğünden geliyor
      (`fixtures/audit.ts`: "audit'e giren her eylem tam olarak bir izin kapısından
      geçmiştir"). Yeni sözlük yazılmadı; ham kod görünmüyor.
    */
    await expect(canvas.getByText('İlan reddetme')).toBeInTheDocument()
    await expect(canvas.getByText('Sistem teması varsayılanı değiştirme')).toBeInTheDocument()
    await expect(canvas.queryByText('listing:reject')).toBeNull()

    /*
      Saat dilimi sabit (`Europe/Istanbul`). Verilmeseydi bu kayıt Los Angeles'ta
      "12 Tem 2026 04:18" görünürdü — audit'te bu, "karar hangi gün verildi"
      sorusunu makineye göre farklı cevaplar.
    */
    await expect(canvas.getByText('12 Tem 2026 14:18')).toBeInTheDocument()

    // Sıralama kanalı yok → hiçbir başlık buton değil.
    await expect(within(canvas.getAllByRole('columnheader')[0]!).queryByRole('button')).toBeNull()
  },
}

/**
 * Son başarılı veri duruyor, üstte güncelleme uyarısı var (brifing 2.1).
 *
 * Uyarının eylemi `onRetry`: bayat veriyi tazelemek ile başarısız isteği tekrar
 * denemek aynı çağrı — ikinci bir kanal gerekmiyor. `tone="info"` (`role="status"`):
 * bayat veri bir hata değil, kullanıcının işini bölmez.
 */
export const Stale: Story = {
  args: { state: { status: 'success', data: TEK_SAYFA, stale: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Gösterilen kayıtlar güncel olmayabilir')).toBeInTheDocument()
    // Bayat veri gizlenmiyor, gösterilmeye devam ediyor.
    await expect(canvas.getAllByRole('row')).toHaveLength(allAuditLogFixtures.length + 1)

    await userEvent.click(canvas.getByRole('button', { name: 'Yenile' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * 403 — bu ekranın en anlamlı durumu: audit log `icerikDenetcisi` ve `destek`
 * rollerine **kapalı** (brifing 1.4, "Audit log görüntüleme" satırı ikisinde de
 * "Yok").
 *
 * Yetkisizliği önden bilen kabuk buraya hiç yönlendirmez; bu durum istemcinin izin
 * listesi bayatladığında sunucunun verdiği cevabın karşılığı. **Tekrar dene yok**
 * (`retryable` tip düzeyinde `false`: aynı 403 aynı 403'ü verir) ve güvenli geri
 * dönüş bağlantısı var (brifing 2.1). Filtre ve tablo hiç render edilmiyor:
 * filtrelenecek bir şey yok.
 */
export const Unauthorized: Story = {
  args: {
    state: {
      status: 'unauthorized',
      error: {
        title: 'Audit log görüntüleme yetkiniz yok',
        message:
          'Bu kayıtları yalnızca süper admin ve moderatör rolleri görüntüleyebilir. Erişim gerekiyorsa süper adminden talep edin.',
        code: 'HTTP_403',
        retryable: false,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Audit log görüntüleme yetkiniz yok')).toBeInTheDocument()

    // 403'ü tekrar denemek aynı 403'ü verir.
    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).toBeNull()

    // Güvenli geri dönüş: Dashboard dört rolde de "Tam" (brifing 1.4).
    const baglanti = canvas.getByRole('link', { name: "Dashboard'a dön" })
    await expect(baglanti).toHaveAttribute('href', '/')

    // Yetkisiz kullanıcıya filtre de tablo da sunulmuyor: filtrelenecek bir şey yok.
    await expect(canvas.queryByRole('table')).toBeNull()
    await expect(canvas.queryByLabelText('Ara')).toBeNull()
  },
}

/**
 * Sunucu tanımadığımız bir kod gönderirse ham gösterilir, boş hücre değil.
 *
 * `AuditLogEntry.action` bilerek `string`: `fixtures/audit.ts` "sunucu bu kümede
 * olmayan bir kod gönderebilir (`auth:login` gibi bir gün eklenirse)" diyor ve
 * ekran `ADMIN_PERMISSION_LABEL[action] ?? action` diye okuyor. Audit'te "ne
 * olduğu bilinmiyor" ile "hiçbir şey olmadı" aynı şey değil.
 *
 * Kayıt story'ye özgü: fixture'a dokunulmadan, mevcut bir kaydın kodu değiştirilerek
 * kuruluyor.
 */
export const UnknownActionCodeIsShownRaw: Story = {
  args: {
    state: {
      status: 'success',
      data: {
        items: [{ ...auditThemeDefaultChanged, id: 'audit-unknown-code', action: 'auth:login' }],
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('auth:login')).toBeInTheDocument()
    // Buton adı da aynı okumadan geçiyor.
    await expect(canvas.getByRole('button', { name: /^Detay: auth:login/ })).toBeInTheDocument()
  },
}

/**
 * Varlık tipi filtresi: altı seçeneğin **hepsi** en az bir satır döndürür.
 *
 * Ekran filtrelemez — süzülmüş veriyi `state` ile alır ve seçili değerleri filtre
 * çubuğunda gösterir; süzmeyi sayfa katmanı yapar. Bu yüzden story önden süzülmüş
 * hâli veriyor ve `auditByEntityType`'ın altı anahtarının da dolu olduğunu ayrıca
 * ölçüyor: seçilebilen ama hiçbir zaman sonuç vermeyen bir filtre seçeneği
 * kullanıcıyı yanıltır.
 */
export const FilteredByEntityType: Story = {
  args: {
    filters: { roles: [], entityTypes: ['user'], dateRange: {} },
    state: {
      status: 'success',
      data: {
        items: auditByEntityType.user,
        page: 1,
        pageSize: 20,
        totalItems: auditByEntityType.user.length,
        totalPages: 1,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const tipler = Object.keys(AUDIT_ENTITY_TYPE_LABEL) as (keyof typeof auditByEntityType)[]
    await expect(tipler).toHaveLength(6)
    for (const tip of tipler) {
      await expect(auditByEntityType[tip].length).toBeGreaterThan(0)
    }

    // Başlık + iki kullanıcı kaydı.
    await expect(canvas.getAllByRole('row')).toHaveLength(3)
    await expect(canvas.getByText('Kullanıcı askıya alma')).toBeInTheDocument()
    await expect(canvas.getByText('Kullanıcı banlama')).toBeInTheDocument()

    // FilterBar aktif filtreyi rozetle bildiriyor ve temizleme butonu çıkıyor.
    await expect(canvas.getByText('1 aktif')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Temizle' })).toBeInTheDocument()
  },
}

/**
 * Metin filtresi tipli alana geri yazılıyor.
 *
 * Ekranın gerçek işi bu: `FilterBar` düz bir `onChange(id, value)` bildiriyor,
 * ekran onu `AuditLogFilters`e çeviriyor. Tek karakter yazılıyor çünkü alan
 * kontrollü ve story `filters`'ı sabit — her tuş aynı (boş) değerden hesaplanır.
 *
 * **Sözleşme boşluğu:** brifing 2.10 "kullanıcı ve eyleme göre filtreleme"
 * istiyor ama `AuditLogFilters`'ta aktör/eylem kanalı yok; serbest metin ikisinin
 * de yerini yaklaşık tutuyor.
 */
export const TextFilterEmitsTypedFilters: Story = {
  args: { state: { status: 'success', data: TEK_SAYFA } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.type(canvas.getByLabelText('Ara'), 'E')

    await expect(args.onFiltersChange).toHaveBeenCalledWith({
      query: 'E',
      roles: [],
      entityTypes: [],
      dateRange: {},
    })
  },
}

/** Sayfa değişimi bildiriliyor; veriyi getirmek sayfa katmanının işi. */
export const MultiplePages: Story = {
  args: { state: { status: 'success', data: COK_SAYFALI } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Sayfa 3' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await userEvent.click(canvas.getByRole('button', { name: 'Sayfa 4' }))
    await expect(args.onPageChange).toHaveBeenCalledWith(4)
  },
}

/**
 * **Kritik story.** JSON çekmecesi.
 *
 * Üç şey ölçülüyor:
 *
 * 1. `onEntryOpen` **JSON detayını açar** — sözleşmenin kurduğu okuma
 *    (`AuditLogPageProps.onEntryOpen`in JSDoc'u). Kanal bildiriyor, açıklığı
 *    ekranın kendi state'i tutuyor: ikisi aynı tıklamada olur.
 * 2. JSON tam olarak `metadata`: korelasyon kimliği ve önceki/sonraki değerler
 *    orada (`fixtures/audit.ts`'in kurduğu sözleşme).
 * 3. Açık Base UI dialog'u sayfanın kalanını `aria-hidden` yapıyor: rol sorgusu
 *    arka plandaki tabloyu **bulamıyor**, `document.querySelectorAll` buluyor.
 *    Arka planı ve portalı aynı anda ölçen her testin bilmesi gereken fark bu.
 *
 * Brifing 2.10'un "İlgili varlığa gitme" eylemi burada **yok** ve ölçülmüyor:
 * kanalı yok (RAPOR EDİLDİ), uydurulmadı.
 *
 * Çekmece **açık bırakılıyor**: ölçüldü, açık dialog'la biten story geçiyor —
 * `aria-hidden-focus` yarışını üreten şey *kapanırken* bitirmek
 * (bkz. `DrawerClosesCleanly`).
 */
export const EntryDetailDrawer: Story = {
  args: { state: { status: 'success', data: TEK_SAYFA } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    /*
      Buton adı kaydı tanımlıyor, "Detay" demiyor: sekiz satırda da aynı metni
      duyan kullanıcı hangisini açtığını bilemez. (`DataTableProps.rowLabel` bu işi
      yapamazdı — `DataTable` onu yalnız `selectable` iken okuyor, audit'te seçim
      yok.)
    */
    const detayButonlari = canvas.getAllByRole('button', { name: /^Detay: / })
    await expect(detayButonlari).toHaveLength(allAuditLogFixtures.length)

    await userEvent.click(detayButonlari[0]!)

    // Kanal bildirdi: kaydın tamamı geçiyor, ilk satır `auditReportResolvedPhoto`.
    await expect(args.onEntryOpen).toHaveBeenCalledTimes(1)
    await expect(args.onEntryOpen).toHaveBeenCalledWith(auditReportResolvedPhoto)

    // Çekmece portalda: gövde içinden aranır.
    const cekmece = await within(document.body).findByRole('dialog')
    const cekmeceIci = within(cekmece)
    await expect(cekmeceIci.getByRole('heading', { name: 'Audit kaydı detayı' })).toBeVisible()

    /*
      Korelasyon kimliği ad-değer listesinde kendi hücresinde: destek ekibinin
      sunucu loglarıyla eşlemek için kopyaladığı tek dize JSON'un içinde
      aranmamalı. (`getByText` yalnız DOĞRUDAN metin çocuklarına bakıyor;
      `<pre>`'nin metni JSON'un tamamı, bu dize değil — iki eşleşme olmuyor.)
    */
    await expect(cekmeceIci.getByText('req-2026-07-15-e1937a')).toBeInTheDocument()

    /*
      JSON tam olarak `metadata`: sözleşmeyi `fixtures/audit.ts` kuruyor
      (`{ correlationId, before, after, ... }`), `domain.ts`'e alan eklenmedi.
    */
    const json = cekmece.querySelector('pre')
    await expect(json).not.toBeNull()
    await expect(json).toHaveTextContent('correlationId')
    await expect(json).toHaveTextContent('req-2026-07-15-e1937a')
    // Brifing 2.10'un "önceki ve sonraki değerler"i.
    await expect(json).toHaveTextContent('inReview')
    await expect(json).toHaveTextContent('resolved')
    // Kaydırma kabı klavyeye açık; içinde odaklanılacak bir şey yok.
    await expect(json).toHaveAttribute('tabindex', '0')
    await expect(json).not.toHaveAttribute('role')

    /*
      Açık dialog arka planı `aria-hidden` yapıyor. `queryByRole` `aria-hidden`
      alt ağacını DIŞLIYOR, `querySelectorAll` dışlamıyor — tablo hâlâ DOM'da,
      yalnız erişilebilirlik ağacında değil.

      Sorgu **`canvasElement`e kökleniyor, `document`e değil** ve bu bir üslup
      tercihi değil, ölçülmüş bir hata: `document` Storybook'un KENDİ mobilyasını
      da kapsıyor. Docs hazırlanırken gövdeye `<div class="sb-preparing-docs">`
      giriyor ve içinde bir `<table class="sb-argstableBlock">` (args tablosunun
      iskeleti) duruyor — story'nin DOM'uyla hiç ilgisi yok, `<body>`nin doğrudan
      çocuğu. `document.querySelectorAll('table')` bu yüzden 2 sayıyordu: biri
      ekranın tablosu, biri Storybook'un. İddia ekranın arka planı hakkında,
      dolayısıyla kökü de ekranın kökü olmalı.

      `canvasElement` doğru kapsam: çekmece portalda (gövdede) olduğu için buraya
      girmiyor — yani sayı yalnız arka planı ölçüyor. Portal tarafı zaten
      yukarıda `within(document.body).findByRole('dialog')` ile ayrıca ölçüldü.
      AGENTS'ın kuralı ("rol sorgusu yerine DOM sorgusu") aynen geçerli; değişen
      tek şey sorgunun kökü.
    */
    await expect(canvas.queryByRole('table')).toBeNull()
    await expect(canvasElement.querySelectorAll('table')).toHaveLength(1)

    /*
      Çekmecenin alt şeridi yok: brifing 2.10'un "İlgili varlığa gitme" eylemi
      oraya girerdi ama sözleşmede kanalı yok (RAPOR EDİLDİ). Basınca hiçbir şey
      yapmayan bir buton uydurulmadığının regresyon ölçümü.
    */
    await expect(cekmeceIci.queryByRole('button', { name: /varlığa git/ })).toBeNull()
  },
}

/**
 * Çekmece kapanınca DOM oturuyor.
 *
 * Kapatan tek story, dolayısıyla `cekmeceKapanmasiniBekle`'ye ihtiyacı olan tek
 * story: kapanış animasyonu sürerken axe çalışırsa Base UI'ın odak koruma
 * span'leri `aria-hidden-focus` ihlali üretir ve story yazı-tura düşer.
 */
export const DrawerClosesCleanly: Story = {
  args: { state: { status: 'success', data: TEK_SAYFA } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getAllByRole('button', { name: /^Detay: / })[0]!)

    const cekmece = await within(document.body).findByRole('dialog')
    await userEvent.click(within(cekmece).getByRole('button', { name: 'Kapat' }))

    await cekmeceKapanmasiniBekle()

    // Arka plan geri geldi: `aria-hidden` kalkınca rol sorgusu tabloyu yine buluyor.
    await expect(canvas.getByRole('table')).toBeInTheDocument()
  },
}

/**
 * Dar ekran: tablo **yatay kaydırılır**, karta dönüşmez.
 *
 * `DataTableProps.mobileMode`'un kendi sözleşmesi bu ekranı adıyla anıyor:
 * "`scroll`: tablo yatay kaydırılır. Sütunların kendisi önemliyse (**audit log**)".
 * Haklı da: bir audit satırının kimliği (admin, rol, eylem, varlık, zaman)
 * beşlisidir ve kart hâlinde yan yana karşılaştırılamaz. Brifing 3.5 bu ekran için
 * "Mobile cards" istiyor — çelişki raporlandı, uydurulmadı.
 *
 * Ölçülen: taşan şey tablonun **kendi kabı**, sayfa değil.
 */
export const MobileScrollTable: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { state: { status: 'success', data: TEK_SAYFA } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/** Geniş ekran: sekiz sütun yan yana, kaydırma yok. */
export const DesktopTable: Story = {
  globals: { viewport: { value: 'desktop1440' } },
  args: { state: { status: 'success', data: TEK_SAYFA } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByRole('columnheader')).toHaveLength(8)
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}
