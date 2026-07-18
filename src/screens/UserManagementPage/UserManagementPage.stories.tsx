import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import {
  AdminPermission,
  AdminRole,
  ROLE_PERMISSIONS,
  UserType,
  type Paginated,
  type UserAccount,
} from '../../types/domain'
import type { UserFilterValues } from '../../types/component-props'
import { activeIndividualOwner, allUserFixtures } from '../../fixtures'
import { UserManagementPage } from './UserManagementPage'

/* ── Ortak veriler ───────────────────────────────────────────────────────── */

/**
 * Hiçbir şeyi elemeyen filtre.
 *
 * `query` ve `verified` **yok**, `undefined` değil: `exactOptionalPropertyTypes`
 * açıkken opsiyonel alana açıkça `undefined` atanamaz.
 */
const VARSAYILAN_FILTRELER: UserFilterValues = { types: [], statuses: [], roles: [] }

/**
 * Tek sayfalık liste: on fixture hesabın tamamı.
 *
 * `totalItems` uydurulmuyor — `allUserFixtures.length`. "Gerçekte daha çok
 * kullanıcı var ama fixture'a girmedi" diye bir sayı yazmak `fixtures/users.ts`'in
 * sayaç kuralının (dosyanın kendi JSDoc'u) tersi olurdu ve sayfalama olmayan
 * sayfalara götürürdü.
 */
const KULLANICI_SAYFASI: Paginated<UserAccount> = {
  items: allUserFixtures,
  page: 1,
  pageSize: 10,
  totalItems: allUserFixtures.length,
  totalPages: 1,
}

/**
 * `superAdmin`'in izinleri — tam görünüm.
 *
 * Açık tip bildirimi bilerek: `ROLE_PERMISSIONS[SuperAdmin]` `as const` ile
 * yazıldığı için `readonly` bir tuple; annotation onu `AdminPermission[]`'e
 * genişletir ve story'ler arasında dolaşabilir hâle getirir.
 */
const TAM_YETKI: AdminPermission[] = [...ROLE_PERMISSIONS[AdminRole.SuperAdmin]]

/** `destek`in izinleri — sınırlı görünüm. Bu ekranın asıl ölçtüğü küme. */
const DESTEK_YETKISI: AdminPermission[] = [...ROLE_PERMISSIONS[AdminRole.Support]]

/** `icerikDenetcisi`: kullanıcı görüntüleme izni **hiç yok**. */
const ICERIK_DENETCISI_YETKISI: AdminPermission[] = [...ROLE_PERMISSIONS[AdminRole.ContentReviewer]]

/**
 * Base UI'ın odak koruma span'lerinin (`data-base-ui-focus-guard`) gitmesini
 * bekler.
 *
 * a11y kapısı `'error'` olduğu için play bittiğinde axe çalışıyor; popup'ın
 * kapanışı o an sürüyorsa korumalar DOM'da durur ve `aria-hidden-focus` ihlali
 * doğar — story yazı-tura düşer. İhlal ne gerçek bir kusur ne de canvas
 * artefaktı: testin kendi bıraktığı artık. Kalıp `Select.stories.tsx`'ten;
 * portal açıp **kapatan** her story'yi ilgilendirir (açık bırakılan popup sorun
 * değil).
 */
async function popupKapanmasiniBekle(): Promise<void> {
  await waitFor(() =>
    expect(document.querySelector('[data-base-ui-focus-guard]')).not.toBeInTheDocument(),
  )
}

/**
 * Ekran 320 pikselde yatay kaymıyor mu?
 *
 * Medya sorgusu viewport'a bağlı, kabın genişliğine değil ve repoda container
 * query yok — "mobilde kartlara döner" iddiasını play **ölçemez**, o ekran
 * görüntüsünün işi. Play'in ölçebildiği tek düzen iddiası bu.
 */
async function yatayTasmaYok(canvasElement: HTMLElement): Promise<void> {
  await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
}

/*
  Bu dosyada `throw new Error(...)` **yazılamaz**: aşağıdaki zorunlu story
  `export const Error` adını alıyor ve modül kapsamındaki o bağlama global
  `Error`'ı gölgeliyor — çağrı anında "Error is not a constructor" alınır.
  Sessiz bir tuzak; iddialar bu yüzden `expect` + erken dönüşle yazıldı.
*/

/* ── Meta ────────────────────────────────────────────────────────────────── */

const meta = {
  title: 'Screens/UserManagementPage',
  component: UserManagementPage,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Kullanıcı liste, filtre ve yaptırım ekranı (brifing 2.6). Veri çekmez — `state` prop’tan ' +
          'gelir. Kabuk değildir: `AppShell`/`TopBar`/`SidebarNav`/`PageHeader` render etmez, en üst ' +
          'başlığı `<h2>`. Asıl işi brifing 1.4’ün "Kullanıcı görüntüleme × destek = Sınırlı" ' +
          'hücresini **sütun sütun** uygulamak: `destek` rolünde `Admin rolü` ve `Son giriş` ' +
          'sütunları — ve `Admin rolü` filtresi — diziye hiç konmaz, `disabled` gösterilmez. ' +
          'Kademeler kapsayıcı olduğu için sıra kritik: önce `UserView`, sonra `UserViewProfile`.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'screen',
      useWhen: [
        'Kullanıcı listesi, filtreleri ve yaptırım eylemleri tek ekranda birleştirilecekse',
      ],
      doNotUseWhen: [
        'Tek bir hesabın detayı gösterilecekse — UserDetailPage kullanın',
        'Kabuk (üst çubuk, menü, sayfa başlığı) gerekiyorsa — o AppShell’in işi',
      ],
    },
  },

  /*
    `state` ve `filters` **bilerek meta.args'ta değil.** `StoryObj<typeof meta>`
    meta.args'ın *çıkarılan* tipini prop tipiyle kesiştiriyor: `state`
    contextual typing ile `AsyncState`'in tek bir üyesine ( `{status:'success';
    data: …}` ) daralır ve o dosyada `{ status: 'loading' }` yazan story
    derlenmez — geri alınamaz bir daralma. AGENTS'ın kuralı genel: **yokluğu ya
    da başka bir hâli bir durum olan hiçbir prop meta.args'a konmaz, tipi ne
    olursa olsun.**

    Handler'lar ve `availablePermissions` konuyor: üçü de sözleşmede **zorunlu**,
    yokluğu bir durum değil.
  */
  args: {
    availablePermissions: TAM_YETKI,
    onFiltersChange: fn(),
    onPageChange: fn(),
    onUserOpen: fn(),
    onSuspend: fn(),
    onBan: fn(),
    onRoleChange: fn(),
    onRetry: fn(),
  },

  argTypes: {
    state: { control: false },
    filters: { control: false },
    availablePermissions: { control: false },
  },
} satisfies Meta<typeof UserManagementPage>

export default meta

type Story = StoryObj<typeof meta>

/* ── Zorunlu durum story'leri (brifing 3.5) ──────────────────────────────── */

/**
 * Tablo başlığı korunur, satırlar skeleton olur — veri gelince düzen zıplamaz.
 *
 * Tek bir `DataTable`: iskeletin kart hâli yok, dolayısıyla düzen ikizlemesi de
 * yok (bkz. `.css.ts` → `tableView`).
 */
export const Loading: Story = {
  args: { state: { status: 'loading' }, filters: VARSAYILAN_FILTRELER },
}

/**
 * Düz boşluk: **hiç kullanıcı yok**.
 *
 * `FilteredEmpty` ile arasındaki fark eylemde: burada temizlenecek filtre
 * **yoktur**, dolayısıyla "Filtreleri temizle" de yoktur. Boşluğun sebebi
 * kullanıcının atacağı adımı değiştiriyor; ikisini tek "veri yok" hâline
 * indirmek yanlış eylemi önerirdi.
 */
export const Empty: Story = {
  args: { state: { status: 'empty' }, filters: VARSAYILAN_FILTRELER },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Henüz kullanıcı yok')).toBeInTheDocument()
    /* Olmayan filtreyi temizleten buton, basınca hiçbir şey yapmayan butondur. */
    await expect(
      canvas.queryByRole('button', { name: 'Filtreleri temizle' }),
    ).not.toBeInTheDocument()
  },
}

/**
 * `filteredEmpty` **`AsyncState`'in üyesi değil** — türetiliyor.
 *
 * Kural: `status === 'empty'` **ve** filtreler varsayılandan farklı. Sunucu
 * "sonuç yok" der; "senin filtren yüzünden yok" bilgisi yalnız istemcide var.
 */
export const FilteredEmpty: Story = {
  args: {
    state: { status: 'empty' },
    filters: { query: 'zzzz', types: [UserType.Individual], statuses: [], roles: [] },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Filtrelere uyan kullanıcı yok')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Filtreleri temizle' }))
    await expect(args.onFiltersChange).toHaveBeenCalledWith(VARSAYILAN_FILTRELER)
  },
}

/**
 * Tekrar denenebilir hata: iki kapı da açık (`retryable: true` **ve** `onRetry`
 * bağlı) olduğu için buton görünür.
 *
 * Hata bloğu `ErrorState variant="section"` — tablo düştü, filtre çubuğu ayakta;
 * sayfanın tamamı hata değil.
 */
export const Error: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'Kullanıcılar yüklenemedi',
        message: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
        code: 'NETWORK_TIMEOUT',
        retryable: true,
      },
    },
    filters: VARSAYILAN_FILTRELER,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Kullanıcılar yüklenemedi')

    await userEvent.click(canvas.getByRole('button', { name: 'Tekrar dene' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * Tekrar **denenemeyen** hata: `onRetry` bağlı olsa bile buton çıkmaz.
 *
 * `UserManagementPageProps.onRetry` sözleşmede zorunlu, yani "iki kapı"nın
 * ikincisi bu ekranda her zaman açık; kapatan tek şey `UiError.retryable`.
 * Story bu asimetriyi ölçüyor — handler'ın varlığı tek başına butonu
 * çıkarmamalı.
 */
export const ErrorHasNoRetryButton: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'Kullanıcılar yüklenemedi',
        message: 'Bu kayıtlar arşivlendi ve artık sorgulanamıyor.',
        code: 'USERS_GONE',
        retryable: false,
      },
    },
    filters: VARSAYILAN_FILTRELER,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Kullanıcılar yüklenemedi')
    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).not.toBeInTheDocument()
  },
}

/**
 * Sunucunun reddi (HTTP 403). **`RoleRestricted` ile karıştırılmamalı:** orada
 * veri gelir ve gösterilir, yalnız sütunlar eksilir; burada veri hiç yoktur.
 *
 * Tekrar dene **yok**: `AsyncState` 403'ün `retryable`'ını tip düzeyinde
 * `false`'a sabitliyor — aynı istek aynı cevabı verir. Yerine güvenli bir geri
 * dönüş bağlantısı var.
 */
export const Unauthorized: Story = {
  args: {
    state: {
      status: 'unauthorized',
      error: {
        title: 'Bu sayfayı görme yetkiniz yok',
        message: 'Kullanıcı listesi yalnızca kullanıcı görüntüleme izni olan rollere açıktır.',
        code: 'FORBIDDEN',
        retryable: false,
      },
    },
    filters: VARSAYILAN_FILTRELER,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: 'Tekrar dene' })).not.toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'Panel ana sayfasına dön' })).toBeInTheDocument()
    /* Veri gelmedi: tablo da yok. */
    await expect(canvas.queryByRole('table', { hidden: true })).not.toBeInTheDocument()
  },
}

/**
 * Tam yetkili görünüm (`superAdmin`).
 *
 * **`RoleRestricted`'ın kontrol grubu.** Play burada `Son giriş` ve `Admin rolü`
 * sütunlarının **var** olduğunu ölçüyor; `RoleRestricted` aynı sorguların boş
 * döndüğünü. İddia ancak ikisi birlikte anlam taşır: yalnız yokluk ölçülseydi
 * hiç render etmeyen bir ekran da testi geçerdi.
 */
export const Success: Story = {
  args: { state: { status: 'success', data: KULLANICI_SAYFASI }, filters: VARSAYILAN_FILTRELER },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      `getAllByText` kullanılıyor, `getByText` değil: dolu liste iki düzende
      (tablo + kart) çiziliyor ve her viewport'ta biri `display: none`.
      `queryBy`/`getBy` birden çok eşleşmede **düşer**; sayıya dayalı iddia ise
      AGENTS'ın güvenilir saydığı ölçüm (`getByText` yalnız doğrudan metin
      çocuklarına bakar).
    */
    await expect(canvas.getAllByText('Son giriş').length).toBeGreaterThan(0)
    await expect(canvas.getAllByText('Admin rolü').length).toBeGreaterThan(0)
    /* Rol rozetinin değeri de görünür — sütun boş bir başlık değil. */
    await expect(canvas.getAllByText('Süper Admin').length).toBeGreaterThan(0)
    await expect(canvas.getAllByText('Moderatör').length).toBeGreaterThan(0)

    /* Eylemler: üç izin de var (`superAdmin`). Görünen kopya tektir. */
    await expect(canvas.getByRole('button', { name: 'Askıya al: Ayşe Demir' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Banla: Ayşe Demir' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Rol ata: Ayşe Demir' })).toBeInTheDocument()
  },
}

/**
 * Veri bayat: gösterilir, ama üstte bir `Alert` bunu söyler.
 *
 * `info` tonu bilerek — `role="status"` ile kibarca bildirilir, moderatörün
 * işini bölmez. Kapatılabilir değil: kapatılan uyarı sorunu çözmez, gizler.
 */
export const Stale: Story = {
  args: {
    state: { status: 'success', data: KULLANICI_SAYFASI, stale: true },
    filters: VARSAYILAN_FILTRELER,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Liste güncel olmayabilir')).toBeInTheDocument()
    /* Veri hâlâ orada: bayatlık listeyi gizlemez. */
    await expect(canvas.getAllByText('Ayşe Demir').length).toBeGreaterThan(0)
  },
}

/**
 * **Bu ekranın asıl ölçümü:** `destek` rolünün sınırlı görünümü.
 *
 * `unauthorized` **değil** — veri geliyor ve gösteriliyor; eksilen şey
 * `availablePermissions`. Brifing 1.4'ün "Kullanıcı görüntüleme × destek =
 * Sınırlı" hücresi `AdminPermission.UserViewProfile` ile ifade edildi ve o iznin
 * JSDoc'u gizli alanları alan alan sayıyor: `lastLoginAt` ve `adminRole` o
 * listede.
 *
 * Ölçüm **yokluk** arıyor, `disabled` değil: gizli alan soluk gösterilmez, DOM'a
 * hiç girmez. `queryByText` `aria-hidden` alt ağacını dışlamaz ve `display: none`
 * elemanları da bulur — yani iddia "gizli değil, **hiç yok**" düzeyinde ve
 * her iki düzeni (tablo + kart) birden kapsıyor.
 *
 * Kontrol grubu `Success`'te: aynı sorgular orada dolu dönüyor.
 */
export const RoleRestricted: Story = {
  args: {
    state: { status: 'success', data: KULLANICI_SAYFASI },
    filters: VARSAYILAN_FILTRELER,
    availablePermissions: DESTEK_YETKISI,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      Önce olumlu taraf: liste gerçekten render edildi. Bu satır olmadan bütün
      yokluk iddiaları boşlukta kalırdı — hiç çizmeyen bir ekran da geçerdi.
      Destek bunları GÖRÜR (`UserViewProfile`: ad, tip, e-posta, telefon, durum,
      sayaçlar, kayıt tarihi).
    */
    await expect(canvas.getAllByText('Ayşe Demir').length).toBeGreaterThan(0)
    await expect(canvas.getAllByText('ayse.demir@example.invalid').length).toBeGreaterThan(0)
    await expect(canvas.getAllByText('Kayıt tarihi').length).toBeGreaterThan(0)

    /* ── Gizli alan 1: oturum bilgisi ── */
    await expect(canvas.queryByText(/Son giriş/i)).not.toBeInTheDocument()
    await expect(canvas.queryByText('Hiç giriş yapmadı')).not.toBeInTheDocument()

    /* ── Gizli alan 2: admin rolü — sütun, filtre ve rozetler ── */
    await expect(canvas.queryByText(/Admin rolü/i)).not.toBeInTheDocument()
    await expect(canvas.queryByText('Süper Admin')).not.toBeInTheDocument()
    await expect(canvas.queryByText('Moderatör')).not.toBeInTheDocument()
    await expect(canvas.queryByText('İçerik Denetçisi')).not.toBeInTheDocument()

    /*
      ── Eylemler ──
      `destek`te `UserSuspend`/`UserBan`/`UserAssignRole` yok. `hidden: true`
      bilerek: iddia "gizlenmiş değil, hiç yok" düzeyine iner ve gizli düzendeki
      kopyayı da kapsar.
    */
    await expect(
      canvas.queryByRole('button', { name: 'Askıya al: Ayşe Demir', hidden: true }),
    ).not.toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: 'Banla: Ayşe Demir', hidden: true }),
    ).not.toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: 'Rol ata: Ayşe Demir', hidden: true }),
    ).not.toBeInTheDocument()

    /* Detaya gitmek yetki istemiyor: sınırlı görünümde de açılabilir. */
    await expect(canvas.getByRole('button', { name: /^Ayşe Demir/ })).toBeInTheDocument()
  },
}

/**
 * `icerikDenetcisi`: `UserView` de `UserViewProfile` de **yok**.
 *
 * Sınırlı görünüme düşmek burada yanlış olurdu — kademeler kapsayıcı, ama
 * kapsanacak bir izin yok. Asıl kapı yönlendirme katmanında; bu, oraya
 * yanlışlıkla gelen kullanıcı için ikinci savunma hattı.
 */
export const NoUserViewPermission: Story = {
  args: {
    state: { status: 'success', data: KULLANICI_SAYFASI },
    filters: VARSAYILAN_FILTRELER,
    availablePermissions: ICERIK_DENETCISI_YETKISI,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Kullanıcı listesini görme yetkiniz yok')).toBeInTheDocument()
    /* Tek bir hesap adı bile sızmamalı. */
    await expect(canvas.queryByText('Ayşe Demir')).not.toBeInTheDocument()
  },
}

/* ── Zorunlu düzen varyantları (brifing 3.5) ─────────────────────────────── */

/**
 * Masaüstü: sütunların tamamı tabloda.
 *
 * Düzen seçimini CSS yapıyor (`DataTable.mobileMode` bir medya sorgusu değil,
 * düz bir prop). Bu story ile `MobileCards` **aynı DOM'u** üretir; ayıran şey
 * viewport ve ekran görüntüsü — play bunu ölçemez (bkz. `yatayTasmaYok`).
 */
export const DesktopTable: Story = {
  args: { state: { status: 'success', data: KULLANICI_SAYFASI }, filters: VARSAYILAN_FILTRELER },
}

/** Dar ekran: her satır karta döner, sayfa yatay kaymaz. */
export const MobileCards: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { state: { status: 'success', data: KULLANICI_SAYFASI }, filters: VARSAYILAN_FILTRELER },
  play: async ({ canvasElement }) => {
    await yatayTasmaYok(canvasElement)
  },
}

/* ── Davranış ölçümleri ──────────────────────────────────────────────────── */

/**
 * Satırın adı **adla başlar**, avatar'ın baş harfleriyle değil.
 *
 * Base UI'ın `Avatar.Fallback`'i "AD"yi `aria-hidden`'sız düz bir `<span>`e
 * yazıyor; buton adını içeriğinden hesapladığı için sarmalanmasa ad "AD Ayşe
 * Demir" diye başlar. AGENTS bu tuzağın DataTable'ın kullanıcı kolonuna da
 * geleceğini önceden yazmıştı.
 *
 * Baş harflerin **DOM'da olmadığı** iddia edilmiyor — o iddia her zaman düşerdi:
 * metin duruyor, gizlenen şey erişilebilirlik ağacındaki hâli. Doğru ölçüm
 * `closest('[aria-hidden="true"]')`.
 */
export const RowNameIsTheAccessibleName: Story = {
  args: { state: { status: 'success', data: KULLANICI_SAYFASI }, filters: VARSAYILAN_FILTRELER },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const buton = canvas.getByRole('button', { name: /^Ayşe Demir/ })
    await userEvent.click(buton)
    await expect(args.onUserOpen).toHaveBeenCalledWith(activeIndividualOwner)

    const ilk = canvas.getAllByText('AD')[0]
    await expect(ilk).toBeDefined()
    if (ilk === undefined) return
    await expect(ilk.closest('[aria-hidden="true"]')).not.toBeNull()
  },
}

/**
 * Ban geri döndürülemez: buton doğrudan `onBan`'i çağırmaz, önce onay ister.
 *
 * Play dialog'u **kapatarak** bitiyor, bu yüzden `popupKapanmasiniBekle` şart:
 * kapanış sürerken axe çalışırsa Base UI'ın odak koruma span'lerini
 * `aria-hidden-focus` ihlali sayar ve story yazı-tura düşer.
 *
 * Arka plan açık dialog'la `aria-hidden` olduğu için rol sorgusuyla aranmıyor;
 * onay butonu portalın içinde, `within(document.body)` ile bulunuyor.
 */
export const BanRequiresConfirmation: Story = {
  args: { state: { status: 'success', data: KULLANICI_SAYFASI }, filters: VARSAYILAN_FILTRELER },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Banla: Ayşe Demir' }))

    /* Onaysız çağrılmadı: dialog açıldı, karar hâlâ verilmedi. */
    await expect(args.onBan).not.toHaveBeenCalled()

    const portal = within(document.body)
    await portal.findByText('Ayşe Demir hesabını banla')

    /*
      Satırdaki buton "Banla: Ayşe Demir", dialog'unki "Banla" — adlar birebir
      eşleşmediği için sorgu tek bir butona düşüyor.
    */
    await userEvent.click(portal.getByRole('button', { name: 'Banla' }))
    await expect(args.onBan).toHaveBeenCalledWith(activeIndividualOwner)

    await popupKapanmasiniBekle()
  },
}

/**
 * Askıdaki hesabın satırında "Askıya al" yok.
 *
 * İki kapı: yetki (`user:suspend`) **ve** durum. Yetkisi olan bir moderatöre bile
 * askıdaki hesabı tekrar askıya alan bir buton gösterilmez. Yaptırımı
 * **kaldırma** kanalı sözleşmede olmadığı için o satır bugün eylemsiz kalıyor —
 * raporlandı.
 */
export const SuspendedUserHasNoSuspendAction: Story = {
  args: { state: { status: 'success', data: KULLANICI_SAYFASI }, filters: VARSAYILAN_FILTRELER },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Mert Yıldız askıda (`suspendedIndividual`), Ayşe Demir aktif. */
    await expect(
      canvas.queryByRole('button', { name: 'Askıya al: Mert Yıldız', hidden: true }),
    ).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Askıya al: Ayşe Demir' })).toBeInTheDocument()

    /* Kemal Öz banlı: ne askı ne ban. */
    await expect(
      canvas.queryByRole('button', { name: 'Banla: Kemal Öz', hidden: true }),
    ).not.toBeInTheDocument()
  },
}

/**
 * Filtre çubuğu değeri `UserFilterValues`'a **daraltarak** yazar.
 *
 * `FilterBar` `string[]` veriyor, sözleşme `UserStatus[]` istiyor; daraltma tip
 * koruyucularla yapılıyor (`as` ile değil). Story bunun gidiş-dönüşünü ölçüyor.
 */
export const FilterChangeIsNarrowed: Story = {
  args: { state: { status: 'success', data: KULLANICI_SAYFASI }, filters: VARSAYILAN_FILTRELER },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    /*
      Tek karakter yazılıyor: alan kontrollü ve `filters` story boyunca sabit,
      yani her tuş kutuyu sıfırdan doldurur. Her tuşta bildirilmesi FilterBar'ın
      sözleşmesi — geciktirme sayfa katmanının işi.
    */
    await userEvent.type(canvas.getByLabelText('Ara'), 'A')
    await expect(args.onFiltersChange).toHaveBeenCalledWith({
      query: 'A',
      types: [],
      statuses: [],
      roles: [],
    })
  },
}

/**
 * Yetki kapısı filtre çubuğunda da geçerli.
 *
 * "Admin rolü" filtresi `destek`e render edilmiyor: göremediği bir alana göre
 * süzmek onu **dolaylı** okuturdu ("moderatör seç" → listede kalanlar
 * moderatördür). Sütunu gizleyip filtresini bırakmak, kapıyı kapatıp pencereyi
 * açık unutmak olurdu.
 */
export const SupportCannotFilterByAdminRole: Story = {
  args: {
    state: { status: 'success', data: KULLANICI_SAYFASI },
    filters: VARSAYILAN_FILTRELER,
    availablePermissions: DESTEK_YETKISI,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      Sorgu filtre çubuğuna kapsanıyor: "Admin rolü" metni tam yetkide hem burada
      hem sütun başlığında var, ölçülen şey ise özellikle **filtrenin** yokluğu.
      Landmark adı FilterBar'ın sözleşmesinden (`aria-label="Filtreler"`).
    */
    const filtreler = within(canvas.getByRole('region', { name: 'Filtreler' }))

    /* Destek yine de tipe ve duruma göre süzebilir. */
    await expect(filtreler.getByText('Kullanıcı tipi')).toBeInTheDocument()
    await expect(filtreler.getByText('Hesap durumu')).toBeInTheDocument()
    await expect(filtreler.queryByText('Admin rolü')).not.toBeInTheDocument()
  },
}
