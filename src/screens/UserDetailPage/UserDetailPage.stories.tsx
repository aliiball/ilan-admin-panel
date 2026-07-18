import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import {
  AdminPermission,
  AdminRole,
  ROLE_PERMISSIONS,
  type AuditLogEntry,
  type Listing,
  type ListingReport,
  type Paginated,
  type UserAccount,
} from '../../types/domain'
import { ADMIN_ROLE_LABEL, USER_STATUS_LABEL } from '../../domain/labels'
import { formatDateTime } from '../../utils/formatDateTime'
import {
  activeSuspensionSanction,
  allAuditLogFixtures,
  allListingFixtures,
  allReportFixtures,
  auditUserSuspendedMert,
  bannedIndividual,
  mertYildizSanctions,
  moderatorUser,
  revokedSuspensionMertYildiz,
  suspendedIndividual,
  suspendedUserAuditEntries,
  verifiedRealEstateOffice,
} from '../../fixtures'
import type { AsyncState, UserDetailData } from '../../types/component-props'
import { UserDetailPage } from './UserDetailPage'

/* ────────────────────────────────────────────────────────────────────────────
   İzin kümeleri — elle yazılmıyor, `ROLE_PERMISSIONS`'tan okunuyor
   ──────────────────────────────────────────────────────────────────────────── */

/*
  Kopyalanıyorlar çünkü `ROLE_PERMISSIONS[SuperAdmin]` = `ALL_ADMIN_PERMISSIONS`
  ve o `as const` ile **readonly**; `availablePermissions` ise `AdminPermission[]`.
  Elle liste yazmak matrisi ikinci kez tanımlamak olurdu ve `ROLE_PERMISSIONS`
  değişince story sessizce yalan söylerdi.
*/
const SUPER_ADMIN_IZINLERI: AdminPermission[] = [...ROLE_PERMISSIONS[AdminRole.SuperAdmin]]
const MODERATOR_IZINLERI: AdminPermission[] = [...ROLE_PERMISSIONS[AdminRole.Moderator]]
const DESTEK_IZINLERI: AdminPermission[] = [...ROLE_PERMISSIONS[AdminRole.Support]]

/* ────────────────────────────────────────────────────────────────────────────
   Veri paketleri — hepsi fixture'lardan **türetiliyor**
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * `Paginated` kabuğu.
 *
 * `totalPages` her zaman 1 ve bu bilinçli: `UserDetailPageProps`'ta
 * `onPageChange` **yok** (`UserManagementPageProps`'ta var), yani ekran ikinci
 * sayfayı isteyemez. Birden fazla sayfa iddia eden bir fixture, ekranın
 * ulaşamayacağı bir sayfayı varmış gibi gösterirdi. Boşluk raporlandı.
 */
function sayfa(items: Listing[]): Paginated<Listing> {
  return { items, page: 1, pageSize: 20, totalItems: items.length, totalPages: 1 }
}

/** Hesabın kendi ilanları — `ownerUserId` ile eşleniyor, elle listelenmiyor. */
function hesabinIlanlari(user: UserAccount): Listing[] {
  return allListingFixtures.filter((listing) => listing.ownerUserId === user.id)
}

/**
 * Hesabın ilanlarına açılmış şikayetler.
 *
 * "Bu kullanıcının **açtığı** şikayetler" değil: `UserAccount.reportCount`
 * `fixtures/users.ts`'te "kullanıcının ilanlarına açılmış sonuçlanmamış şikayet
 * sayısı" diye tanımlı ve kart o sayacı bu ekranın **aynı** yerinde gösteriyor.
 * İki okuma yan yana konsaydı sayaç ile sekme birbirini yalanlardı.
 * (`UserDetailData.reports`'un hangisini kastettiği sözleşmede yazmıyor —
 * raporlandı.)
 */
function hesabinSikayetleri(user: UserAccount): ListingReport[] {
  const ilanlar = hesabinIlanlari(user)
  return allReportFixtures.filter((report) => ilanlar.some((l) => l.id === report.listingId))
}

/**
 * Hesabı **hedef alan** audit kayıtları.
 *
 * Kural `fixtures/audit.ts` → `suspendedUserAuditEntries`'in JSDoc'undan geliyor:
 * "bir hesabın işlem geçmişi o hesabı hedef alan kayıtlardır — aynı adminin
 * başka bir ilanda verdiği karar bu sekmeye girmez". `hesabiHedefleyenAudit(
 * suspendedIndividual)` tam olarak o fixture'ı üretir; helper aynı kuralı adı
 * konmamış diğer hesaplara genişletiyor.
 */
function hesabiHedefleyenAudit(user: UserAccount): AuditLogEntry[] {
  return allAuditLogFixtures.filter(
    (entry) => entry.entityType === 'user' && entry.entityId === user.id,
  )
}

function paket(user: UserAccount): UserDetailData {
  return {
    user,
    listings: sayfa(hesabinIlanlari(user)),
    reports: hesabinSikayetleri(user),
    auditEntries: hesabiHedefleyenAudit(user),
  }
}

/** Fixture setinin en yoğun hesabı: altı ilan, altı şikayet (üçü sonuçlanmamış). */
const OFIS_PAKETI: UserDetailData = paket(verifiedRealEstateOffice)

/**
 * Askıdaki hesap; **audit kaydı olan iki hesaptan biri** (`auditUserSuspendedMert`).
 *
 * `activeSanction` **dolu** (Faz 3 sonrası (b) turu): Mert'in yürürlükteki askısı
 * `activeSuspensionSanction` ve `userId` birebir eşleşiyor. Kart bu yüzden
 * `security`'de gerekçe + tarihleri, `detailed`'da yalnız `endsAt`'i çiziyor.
 * `sanctions` **konmuyor** — sicil yüzeyi (`SellerPanel`) ikinci bir avatar
 * basıyor ve `getByText('MY')` gibi tek-eşleşme iddialarını bozardı; sicili
 * ölçen story'ler `SICIL_PAKET`'i kullanıyor.
 */
const ASKIDAKI_PAKET: UserDetailData = {
  ...paket(suspendedIndividual),
  activeSanction: activeSuspensionSanction,
}

/**
 * Askıdaki hesabın **sicilli** hâli: `sanctions` = `mertYildizSanctions`
 * (yürürlükteki askı + kaldırılmış eski askı). "Kaldırılmış yaptırım da sicildir"
 * gerçek fixture'la burada ölçülüyor; `SellerPanel` (`risk`) yalnız tam görünümde
 * render edildiği için sicil `security` yetkisine kapılı.
 */
const SICIL_PAKET: UserDetailData = {
  ...ASKIDAKI_PAKET,
  sanctions: mertYildizSanctions,
}

/** Banlı hesap; audit tarafı `auditUserBannedKemal`. */
const YASAKLI_PAKET: UserDetailData = paket(bannedIndividual)

/**
 * Bir **admin** hesabı — `adminRole` dolu olan tek fixture ailesi.
 *
 * `adminRole` ve `lastLoginAt` yetki testlerinin öznesi; ikisi de
 * `AdminPermission.UserViewProfile`'ın gizli alan listesinde ve ikisini de
 * ancak `adminRole` taşıyan bir hesapta ölçebiliriz.
 */
const ADMIN_PAKETI: UserDetailData = paket(moderatorUser)

const OFIS_BASARILI: AsyncState<UserDetailData> = { status: 'success', data: OFIS_PAKETI }
const ASKIDAKI_BASARILI: AsyncState<UserDetailData> = { status: 'success', data: ASKIDAKI_PAKET }
const SICIL_BASARILI: AsyncState<UserDetailData> = { status: 'success', data: SICIL_PAKET }
const YASAKLI_BASARILI: AsyncState<UserDetailData> = { status: 'success', data: YASAKLI_PAKET }
const ADMIN_BASARILI: AsyncState<UserDetailData> = { status: 'success', data: ADMIN_PAKETI }

/* ────────────────────────────────────────────────────────────────────────────
   Ölçüm sabitleri
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Audit sekmesinin adı.
 *
 * **Küçük harfli + `i` bayraklı yazılmıyor** ve bu bir üslup tercihi değil,
 * ölçülmüş bir hata: `/işlem geçmişi/i` "İşlem Geçmişi" ile **eşleşmez**.
 * JS'in `i` bayrağı Canonicalize'ı `toUpperCase` üzerinden yapıyor;
 * `'i'.toUpperCase()` `'I'` (U+0049) verirken `'İ'` (U+0130) zaten büyük harf
 * olduğu için kendisi kalıyor ve ikisi eşit olmuyor. `u` bayrağı da kurtarmıyor
 * (üçü de ölçüldü). Yani lowercase yazılsaydı "audit sekmesi yok" iddiası **her
 * koşulda** geçerdi — sekme dururken bile. Kontrol grubu (`FullViewShowsAuditTab`)
 * bu yüzden hayati: hatayı ancak o yakalar. AGENTS: "Türkçe regex'i küçük harfle
 * yazma."
 *
 * Alt dize olarak yazılıyor çünkü sekmenin erişilebilir adına rozet de giriyor:
 * "İşlem Geçmişi 1".
 */
const AUDIT_SEKMESI = /İşlem Geçmişi/

const ILANLAR_SEKMESI = /İlanlar/

/** `lastLoginAt` opsiyonel; bu fixture'da dolu ve story'ler bunu önkoşul olarak ölçüyor. */
const ADMIN_SON_GIRIS_METNI =
  moderatorUser.lastLoginAt === undefined ? undefined : formatDateTime(moderatorUser.lastLoginAt)

/** `moderatorUser.adminRole` → "Moderatör". Sınırlı görünümde DOM'da hiç olmamalı. */
const ADMIN_ROL_METNI = ADMIN_ROLE_LABEL[AdminRole.Moderator]

/** Durum rozetlerinin metni — sözlükten okunuyor, story'ye gömülmüyor. */
const ASKI_DURUM_METNI = USER_STATUS_LABEL[suspendedIndividual.status]
const BAN_DURUM_METNI = USER_STATUS_LABEL[bannedIndividual.status]

/**
 * Base UI popup'ının kapanmasını bekler.
 *
 * `Select.stories.tsx`'teki `popupKapanmasiniBekle`'nin aynısı ve aynı sebeple:
 * a11y kapısı `'error'` iken play, DOM'u **oturmuş** bırakmalı. Base UI popup
 * açıkken odak tuzağı için `aria-hidden="true"` + `tabindex="0"` taşıyan koruma
 * span'leri (`data-base-ui-focus-guard`) basıyor; play bittiğinde axe çalışıyor
 * ve kapanma animasyonu o an sürüyorsa korumalar DOM'da duruyor → `aria-hidden-focus`
 * ihlali, story yazı-tura düşer. Açık bırakmak sorun değil; sorun **kapanırken**
 * bitirmek.
 */
async function popupKapanmasiniBekle(): Promise<void> {
  await waitFor(() =>
    expect(document.querySelector('[data-base-ui-focus-guard]')).not.toBeInTheDocument(),
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Meta
   ──────────────────────────────────────────────────────────────────────────── */

const meta = {
  title: 'Screens/UserDetailPage',
  component: UserDetailPage,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Kullanıcı özetini, ilanlarını, şikayetlerini ve işlem geçmişini birleştirir. Veri **çekmez** — ' +
          '`state: AsyncState<UserDetailData>` prop’undan gelir; kabuk değildir, en üst başlığı `<h2>`. ' +
          '**`availablePermissions` ekranın kapısıdır ve üç yerde birden işler:** görünüm kademesi ' +
          '(`UserView` → `security`, yoksa `UserViewProfile` → `detailed`), alan sınırı (`lastLoginAt` ve ' +
          '`adminRole` sınırlı görünümde karta hiç verilmez) ve bölüm sınırı (`AuditView` yoksa işlem ' +
          'geçmişi sekmesi **hiç render edilmez** — `auditEntries` pakette olsa bile). Kademeler ' +
          '**kapsayıcıdır**: `superAdmin` hem `UserView`’a hem `UserViewProfile`’a sahip, bu yüzden önce ' +
          '**tamı** sınanır. Eylemler kapılı: `user:suspend`, `user:ban`, `user:assignRole`. Yasaklama ' +
          'süresizdir ve `danger` bir dialog ister; askıya alma süreli ve geri alınabilir. Her ikisi de ' +
          'artık gerekçe (+ askıda süre) toplayan bir `SanctionInput` dialog’u açıyor. **`activeSanction` ' +
          '`UserSummaryCard`’a, `sanctions` sicili `SellerPanel` (`risk`) ile yalnız tam görünüme** geçer — ' +
          '`UserSanction.reason` `destek`e gösterilmez. Rol değişikliği çakışması `roleChangeError` ile ' +
          '`danger` bir `Alert`’e dönüşür (`expectedRoleVersion` için damga yok — raporlandı).',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'screen',
      useWhen: [
        'Tek bir kullanıcı hesabının detayı, ilanları, şikayetleri ve işlem geçmişi gösterilecekse',
        'Bir hesaba yaptırım (askı, ban) veya admin rolü uygulanacaksa',
      ],
      doNotUseWhen: [
        'Kullanıcı listesi ve filtresi gerekiyorsa — UserManagementPage kullanın',
        'Tüm sistemin audit kütüğü gerekiyorsa — AuditLogPage kullanın; bu ekranın sekmesi yalnız bu hesabı hedef alan kayıtları gösterir',
        'Yalnız hesap özeti gerekiyorsa — UserSummaryCard yeter',
      ],
    },
  },

  /*
    `UserDetailPageProps`'un **yedi prop'unun yedisi de zorunlu**; hiçbirinin
    yokluğu bir durum değil, dolayısıyla hepsi meta.args'a konabiliyor (AGENTS'ın
    TS2375 kuralı burada tetiklenmiyor). Tek dikkat: `state` ve
    `availablePermissions` story'den story'ye değişiyor, bu yüzden sabitleri
    **açıkça** `AsyncState<UserDetailData>` / `AdminPermission[]` diye tiplenmiş —
    nesne literali olarak yazılsalardı meta.args'ın çıkarılan tipi `status:
    'success'`e daralır ve `Loading` story'si derlenmezdi.
  */
  args: {
    state: OFIS_BASARILI,
    availablePermissions: SUPER_ADMIN_IZINLERI,
    onListingOpen: fn(),
    onSuspend: fn(),
    onBan: fn(),
    onRoleChange: fn(),
    onRetry: fn(),
  },

  argTypes: {
    state: { control: false },
    availablePermissions: { control: false },
  },
} satisfies Meta<typeof UserDetailPage>

export default meta
type Story = StoryObj<typeof meta>

/* ────────────────────────────────────────────────────────────────────────────
   Zorunlu durum story'leri (brifing 3.5)
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Ölçü koruyan iskelet — spinner'lı boş ekran değil.
 *
 * Başlığın iskeleti gerçek `<h2>`'nin satır kutusu kadar yer kaplıyor
 * (`Skeleton`'ın `height: 1em`'i 2xl + tight'ta yarım satır kısa kalır ve veri
 * gelince başlık zıplardı).
 */
export const Loading: Story = {
  args: { state: { status: 'loading' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* `Skeleton`'ın kendisi `aria-hidden`; yükleniyor bilgisini kap duyuruyor. */
    await expect(canvasElement.querySelector('[aria-busy="true"]')).toBeInTheDocument()

    /* Veri yokken başlık da yok: iskelet ad uydurmaz. */
    await expect(canvas.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('tab', { name: ILANLAR_SEKMESI })).not.toBeInTheDocument()
  },
}

/**
 * Tekrar denenebilir hata.
 *
 * **İki kapı**: `retryable === true` **ve** `onRetry` bağlı. İkincisi bu ekranda
 * sözleşme gereği hep açık — `UserDetailPageProps.onRetry` zorunlu (raporlandı:
 * `DataTableProps.onRetry`/`ChartCardProps.onRetry` opsiyonel ve kuralın ikinci
 * yarısı ancak orada ölçülebiliyor).
 */
export const Error: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'Kullanıcı yüklenemedi',
        message: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
        code: 'NETWORK_TIMEOUT',
        retryable: true,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Kullanıcı yüklenemedi')

    await userEvent.click(canvas.getByRole('button', { name: /Tekrar dene/ }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * Tekrar **denenemeyen** hata: `retryable: false` iken buton hiç çıkmaz.
 *
 * Yokluk iddiası tek başına yalan söyleyebilir (hata bloğu hiç çizilmemiş
 * olabilir), bu yüzden `role="alert"` kontrol grubu olarak birlikte ölçülüyor.
 */
export const ErrorHasNoRetryButton: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'Kullanıcı yüklenemedi',
        message: 'Bu kayıt bozuk görünüyor. Destek ekibine hata kodunu iletin.',
        code: 'USER_RECORD_CORRUPT',
        retryable: false,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Kullanıcı yüklenemedi')
    await expect(canvas.queryByRole('button', { name: /Tekrar dene/ })).not.toBeInTheDocument()
  },
}

/**
 * Sunucu 403 verdi.
 *
 * `error`'dan **ayrı bir ekran**: "bir şey ters gitti, tekrar dene" değil, "bu
 * senin görebileceğin bir şey değil". Tekrar deneme yok — `retryable` tip
 * düzeyinde `false` ve 403'ü tekrar denemek aynı 403'ü verir.
 *
 * Yetkisizliği **önden** bilen kullanıcı buraya hiç gelmez (menü süzgeci ve
 * route sayfa katmanının işi); bu durum istemcinin izin listesi bayatladığında
 * doğar.
 */
export const Unauthorized: Story = {
  args: {
    state: {
      status: 'unauthorized',
      error: {
        title: 'Bu hesabı görme yetkiniz yok',
        message: 'Kullanıcı kayıtlarına erişim için yöneticinizden yetki isteyin.',
        code: 'HTTP_403',
        retryable: false,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Bu hesabı görme yetkiniz yok')
    await expect(canvas.queryByRole('button', { name: /Tekrar dene/ })).not.toBeInTheDocument()
  },
}

/** Tek kaydı gösteren ekranda `empty`nin tek anlamlı okuması: kayıt yok. */
export const Empty: Story = {
  args: { state: { status: 'empty' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Kullanıcı bulunamadı')).toBeInTheDocument()
    await expect(canvas.queryByRole('tab', { name: ILANLAR_SEKMESI })).not.toBeInTheDocument()
  },
}

/**
 * Hesap ve ilanlar geldi, işlem geçmişi düşmüş.
 *
 * `partialSuccess`'in bu ekrandaki karşılığı: dört alan bağımsız sorgular ve
 * biri düşünce ötekiler ayakta kalmalı. Düşen bölüm **boş gösterilmiyor** —
 * "kayıt yok" ile "kayıt çekilemedi" aynı şey değil ve kullanıcıya farklı adım
 * attırır.
 */
export const PartialSuccess: Story = {
  args: {
    state: {
      status: 'partialSuccess',
      data: {
        user: OFIS_PAKETI.user,
        listings: OFIS_PAKETI.listings,
        reports: OFIS_PAKETI.reports,
      },
      errors: {
        auditEntries: {
          title: 'İşlem geçmişi yüklenemedi',
          message: 'Audit servisi yanıt vermedi. Diğer bölümler güncel.',
          retryable: true,
        },
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    /* Hesap ayakta: düşen bir bölüm bütün ekranı hata bloğuna çevirmiyor. */
    await expect(
      canvas.getByRole('heading', { level: 2, name: /^Marmara Emlak/ }),
    ).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('tab', { name: AUDIT_SEKMESI }))

    await expect(await canvas.findByText('İşlem geçmişi yüklenemedi')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /Tekrar dene/ }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * Süper admin'in gördüğü tam ekran: altı ilan, altı şikayet, üç sekme, üç eylem.
 *
 * Kontrol grubu olarak da çalışıyor — aşağıdaki "destek görmez" iddialarının
 * hepsinin burada **görünür** olduğunu ölçüyor.
 */
export const Success: Story = {
  args: { state: OFIS_BASARILI, availablePermissions: SUPER_ADMIN_IZINLERI },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole('heading', { level: 2, name: /^Marmara Emlak/ }),
    ).toBeInTheDocument()

    /* Üç sekme de var; audit `AuditView` ile açılıyor. */
    await expect(canvas.getByRole('tab', { name: ILANLAR_SEKMESI })).toBeInTheDocument()
    await expect(canvas.getByRole('tab', { name: /Şikayetler/ })).toBeInTheDocument()
    await expect(canvas.getByRole('tab', { name: AUDIT_SEKMESI })).toBeInTheDocument()

    /* Üç eylem de var: user:suspend + user:ban + user:assignRole. */
    await expect(canvas.getByRole('button', { name: /Askıya al/ })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /Yasakla/ })).toBeInTheDocument()
    await expect(canvas.getByRole('combobox', { name: /Admin rolü/ })).toBeInTheDocument()

    /* İlan satırına tıklamak ekranın işi değil, sayfanın: niyet dışarı bildiriliyor. */
    const ilan = OFIS_PAKETI.listings.items[0]
    await expect(ilan).toBeDefined()
    await userEvent.click(canvas.getByText(String(ilan?.listingNo)))
    await expect(args.onListingOpen).toHaveBeenCalledTimes(1)
  },
}

/**
 * Bayat veri: kayıt görünür, üstünde uyarı durur.
 *
 * Uyarı **kapatılabilir değil**: kalıcı bir sorunu kapatılabilir yapmak,
 * kullanıcının kapatıp sorunu unutması demektir (`AlertProps.dismissible`).
 */
export const Stale: Story = {
  args: { state: { status: 'success', data: OFIS_PAKETI, stale: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('alert')).toHaveTextContent('Bu bilgiler güncel olmayabilir')
    /* Veri gizlenmiyor — bayat olan görünmeyen değil, eski. */
    await expect(canvas.getByRole('heading', { level: 2 })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /Kapat/ })).not.toBeInTheDocument()
  },
}

/**
 * Askıya alınmış hesap.
 *
 * **`AsyncState` durumu değil** — `user.status`; veri sorunsuz geldi, hesap
 * askıda. `userByStatus[Suspended]` ile aynı kayıt.
 *
 * Avatar tuzağı burada ölçülüyor: Base UI'ın `Avatar.Fallback`'i "MY"yi
 * `aria-hidden`'sız bir `<span>`e yazıyor ve kart onu `aria-hidden` bir
 * sarmalayıcıya koyuyor. İddia `queryByText('MY')` **ile kurulamaz** — metin
 * DOM'da duruyor, gizli olan erişilebilirlik ağacındaki hâli; doğru ölçüm gizli
 * atayı bulmak (AGENTS).
 */
export const Suspended: Story = {
  args: { state: ASKIDAKI_BASARILI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Başlığın adı baş harflerle **başlamıyor**: `/^Mert Yıldız/`. */
    await expect(
      canvas.getByRole('heading', { level: 2, name: /^Mert Yıldız/ }),
    ).toBeInTheDocument()

    const basHarfler = canvas.getByText('MY')
    await expect(basHarfler.closest('[aria-hidden="true"]')).not.toBeNull()

    /* Durum yalnız renkle değil metinle de: "Askıya Alındı". */
    await expect(canvas.getByText(ASKI_DURUM_METNI)).toBeInTheDocument()
  },
}

/**
 * Kalıcı olarak yasaklanmış hesap — yine `user.status`, `AsyncState` değil.
 *
 * Bu hesabın ilanı yok (`listingCount: 0`), bu yüzden ilan sekmesi boş durumla
 * açılıyor: fixture'ın gerçeği bu, tablo doldurmak için ilan uydurulmadı.
 */
export const Banned: Story = {
  args: { state: YASAKLI_BASARILI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('heading', { level: 2, name: /^Kemal Öz/ })).toBeInTheDocument()
    await expect(canvas.getByText(BAN_DURUM_METNI)).toBeInTheDocument()
    await expect(canvas.getByText('Bu hesabın hiç ilanı yok')).toBeInTheDocument()
  },
}

/* ────────────────────────────────────────────────────────────────────────────
   Yetki sızıntısı — iddia ancak çift olarak anlam taşır
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * ⚠ Ekranın en kritik ölçümü: **destek'te işlem geçmişi sekmesi DOM'da hiç yok.**
 *
 * `ASKIDAKI_PAKET.auditEntries` **dolu** (`suspendedUserAuditEntries`) — yani
 * veri geldi, sekme yine de çizilmedi. Kapı veri değil izin:
 * `ROLE_PERMISSIONS[destek]`'te `AuditView` yok.
 *
 * Yokluk üç ayrı sorgu ile ölçülüyor, çünkü tek bir sorgu yanıltır:
 * `queryByRole` `aria-hidden` alt ağacını **dışlar** (gizlenmiş bir sekmeyi de
 * "yok" sayardı), `queryByText` dışlamaz — ikisi birlikte "gizli değil, hiç
 * yok" der. Kontrol grubu `FullViewShowsAuditTab`.
 */
export const SupportViewHidesAuditTab: Story = {
  args: { state: ASKIDAKI_BASARILI, availablePermissions: DESTEK_IZINLERI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      Önkoşul: veri gerçekten pakette. Yoksa iddia hiçbir şey ölçmezdi — sekmenin
      yokluğunu "audit kaydı da yok" diye açıklamak mümkün olurdu. Türetilen
      küme, fixture'ın bu ekran için yazdığı `suspendedUserAuditEntries` ile
      birebir aynı çıkıyor; helper aynı kuralı diğer hesaplara genişletiyor.
    */
    await expect(ASKIDAKI_PAKET.auditEntries).toEqual(suspendedUserAuditEntries)
    await expect(ASKIDAKI_PAKET.auditEntries.length).toBeGreaterThan(0)

    /* Kontrol: şerit çizildi. Yokluk iddiası ancak varlığın kanıtıyla anlam taşır. */
    await expect(canvas.getByRole('tab', { name: ILANLAR_SEKMESI })).toBeInTheDocument()

    await expect(canvas.queryByRole('tab', { name: AUDIT_SEKMESI })).not.toBeInTheDocument()
    await expect(canvas.queryByText('İşlem Geçmişi')).not.toBeInTheDocument()
    await expect(canvas.queryByText(auditUserSuspendedMert.summary)).not.toBeInTheDocument()
  },
}

/**
 * Kontrol grubu: aynı veri, `superAdmin` izinleriyle → sekme **var** ve açılıyor.
 *
 * Sekmenin varlığı tek başına yetmez: Base UI panelleri `keepMounted: false` ile
 * çiziyor, yani seçili olmayan panelin içeriği zaten DOM'da olmaz. Sekmeye
 * basılıp kaydın **göründüğü** ölçülüyor; ancak böyle "sekme var" ile "sekme
 * çalışıyor" birbirinden ayrılıyor.
 */
export const FullViewShowsAuditTab: Story = {
  args: { state: ASKIDAKI_BASARILI, availablePermissions: SUPER_ADMIN_IZINLERI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('tab', { name: AUDIT_SEKMESI }))

    await expect(await canvas.findByText(auditUserSuspendedMert.summary)).toBeInTheDocument()
    /* `action` kodu ham değil, `ADMIN_PERMISSION_LABEL`'dan okunuyor. */
    await expect(canvas.getByText('Kullanıcı askıya alma')).toBeInTheDocument()
    await expect(canvas.queryByText(AdminPermission.UserSuspend)).not.toBeInTheDocument()
  },
}

/**
 * Destek `adminRole`'ü de `lastLoginAt`'i de görmez — ikisi de
 * `UserViewProfile`'ın gizli alan listesinde.
 *
 * Kart artık ikisini de yalnız `security`'de çiziyor (`adminRole` rozeti bu turda
 * `variant === 'security'` kapısının arkasına alındı — bu story onu bulmuştu),
 * yani varyantı daraltmak alanları gizliyor. **Sayfanın kapısı yine de duruyor**
 * ve gereksiz değil: `sinirliGorunumHesabi` veriyi karta hiç vermiyor. İki kapı
 * bilinçli — yetki sınırı fail-closed olmalı ve kartın varyantı bir *görünüm*
 * kararı, yetki kararı değil; kart yarın `detailed`'a bir alan eklerse sızıntı
 * sayfanın kapısında durur. Bu story ikisinin birden regresyon testi.
 */
export const SupportViewHidesAdminRoleAndLastLogin: Story = {
  args: { state: ADMIN_BASARILI, availablePermissions: DESTEK_IZINLERI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(ADMIN_SON_GIRIS_METNI).toBeDefined()

    /* Kontrol: hesap gerçekten çizildi ve destek'in görebildikleri yerinde. */
    await expect(canvas.getByRole('heading', { level: 2, name: /^Elif Kaya/ })).toBeInTheDocument()
    await expect(canvas.getByText(moderatorUser.email)).toBeInTheDocument()

    await expect(canvas.queryByText(ADMIN_ROL_METNI)).not.toBeInTheDocument()
    await expect(canvas.queryByText(String(ADMIN_SON_GIRIS_METNI))).not.toBeInTheDocument()
  },
}

/**
 * Kontrol grubu: `moderator` izinleriyle ikisi de **görünür**.
 *
 * `moderator` seçildi, `superAdmin` değil: moderatörde `UserView` var ama
 * `UserAssignRole` **yok**, yani rol seçicisi render edilmiyor ve "Moderatör"
 * metni sayfada tek bir yerde — kartın rol rozetinde — kalıyor. Süper admin'de
 * aynı metin seçicinin tetikleyicisinde de görünür ve `getByText` iki eşleşmeden
 * patlardı: ölçüm değişkeni yalıtılıyor. Kademe sırasının süper admin'deki hâli
 * `SuperAdminIsNotTreatedAsLimited`'da ölçülüyor.
 */
export const FullViewShowsAdminRoleAndLastLogin: Story = {
  args: { state: ADMIN_BASARILI, availablePermissions: MODERATOR_IZINLERI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(ADMIN_SON_GIRIS_METNI).toBeDefined()

    await expect(canvas.getByText(ADMIN_ROL_METNI)).toBeInTheDocument()
    await expect(canvas.getByText(String(ADMIN_SON_GIRIS_METNI))).toBeInTheDocument()
  },
}

/**
 * ⚠ Kademe sırası: **`superAdmin` sınırlı görünüme düşmemeli.**
 *
 * `ALL_ADMIN_PERMISSIONS` hem `UserView`'u hem `UserViewProfile`'ı içeriyor.
 * Kapı `includes(UserViewProfile)` ile kurulsaydı bu story düşerdi: süper admin
 * de "sınırlı" sayılır ve `lastLoginAt` DOM'dan silinirdi. Yani bu iddia,
 * `SupportViewHidesAdminRoleAndLastLogin` ile **birlikte** okununca kapının
 * yönünü sabitliyor — biri "sınırlı olan sınırlı", öteki "sınırsız olan
 * sınırsız" diyor.
 *
 * Ölçüm `lastLoginAt` üzerinden: rol metni süper admin'de rol seçicisinde de
 * geçtiği için tek bir eşleşme vermez, son giriş tarihi ise sayfada benzersiz.
 */
export const SuperAdminIsNotTreatedAsLimited: Story = {
  args: { state: ADMIN_BASARILI, availablePermissions: SUPER_ADMIN_IZINLERI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(ADMIN_SON_GIRIS_METNI).toBeDefined()
    await expect(canvas.getByText(String(ADMIN_SON_GIRIS_METNI))).toBeInTheDocument()
  },
}

/**
 * Destek durumu **açıklar**, karar vermez: yaptırım eylemlerinin hiçbiri
 * render edilmez.
 *
 * `disabled` buton verilmiyor — "kullanıcının yetkisi yoksa butonu `disabled`
 * verme, hiç render etme" reponun en eski kuralı. `toBeDisabled()` zaten Base
 * UI kontrollerinde yalan söylerdi; burada ölçülecek bir kontrol yok.
 */
export const SupportViewHasNoSanctionActions: Story = {
  args: { state: ASKIDAKI_BASARILI, availablePermissions: DESTEK_IZINLERI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Kontrol: kart çizildi ve destek'in görebildiği durum yerinde. */
    await expect(canvas.getByText(ASKI_DURUM_METNI)).toBeInTheDocument()

    await expect(canvas.queryByRole('button', { name: /Askıya al/ })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /Yasakla/ })).not.toBeInTheDocument()
    /*
      Yokluk sorgusu **adsız**: sayfadaki tek `combobox` rol seçicisidir ve
      "hiç combobox yok" iddiası "adı şu olan combobox yok"tan güçlü — etiket
      bağı kopsa bile ölçüm ayakta kalır.
    */
    await expect(canvas.queryByRole('combobox')).not.toBeInTheDocument()

    /* Onay dialog'u kapalı bile olsa DOM'a girmiyor. */
    await expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  },
}

/**
 * `moderator`'de rol seçicisi yok — "Admin rolü atama" matriste yalnız
 * `superAdmin`'de "Tam".
 *
 * Askı ve ban ise moderatörde var: bu story üç eylemin **ayrı ayrı** kapılı
 * olduğunu gösteriyor, hepsi tek bir "kullanıcı yönetimi" bayrağına bağlı değil.
 */
export const ModeratorCannotAssignRole: Story = {
  args: { state: ASKIDAKI_BASARILI, availablePermissions: MODERATOR_IZINLERI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: /Askıya al/ })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /Yasakla/ })).toBeInTheDocument()
    await expect(canvas.queryByRole('combobox')).not.toBeInTheDocument()
  },
}

/* ────────────────────────────────────────────────────────────────────────────
   Eylemler
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Askıya alma artık bir **`SanctionInput` dialog'u** açıyor: gerekçe (zorunlu) ve
 * süre (varsayılan 7 gün). Faz 3'te eylem alansızdı ve `onSuspend()` doğrudan
 * çağrılıyordu (RAPOR EDİLMİŞTİ); (b) turunda süre + gerekçe toplanabiliyor.
 *
 * Onay butonu gerekçe boşken **kapalı**: iddia önce kapalılığı, sonra gerekçe
 * yazılınca açıldığını ve `onSuspend`'in yükle çağrıldığını ölçüyor. Süre
 * dialog açılırken 7'ye kuruluyor, bu yüzden `NumberInput` ile ayrıca uğraşmadan
 * `durationDays: 7` bekleniyor.
 *
 * Play DOM'u **oturmuş bırakıyor** (`popupKapanmasiniBekle`): onaydan sonra
 * dialog unmount oluyor ama a11y kapısı kapanış yarışına duyarlı.
 */
export const SuspendCollectsSanction: Story = {
  args: { state: OFIS_BASARILI },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: /Askıya al/ }))

    const dialog = within(await within(document.body).findByRole('dialog'))

    /* Gerekçe boşken onay kapalı — `SanctionInput.reason` zorunlu. */
    const onayla = dialog.getByRole('button', { name: /^Askıya al$/ })
    await expect(onayla).toBeDisabled()

    await userEvent.type(dialog.getByRole('textbox', { name: /Gerekçe/ }), 'Spam davranışı')
    await expect(onayla).toBeEnabled()

    await userEvent.click(onayla)
    await expect(args.onSuspend).toHaveBeenCalledWith({
      reason: 'Spam davranışı',
      durationDays: 7,
    })

    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument())
    await popupKapanmasiniBekle()
  },
}

/**
 * Yasaklama tek tıkla olmaz: önce gerekçe toplayan bir `danger` `Modal`.
 *
 * `ConfirmDialog` yerine `Modal`: `SanctionInput` toplanıyor ve `ConfirmDialog`'un
 * gövde slotu yok. Kararın ağırlığı `description` + `danger` onay butonu + zorunlu
 * gerekçe ile taşınıyor. Story dialog'u **açık bırakıyor** ve bu güvenli — yarış
 * tam olarak _kapanırken_ bitirmekte (bkz. `popupKapanmasiniBekle`).
 *
 * Arka plan `document.querySelector`/`canvasElement` ile ölçülüyor, rol sorgusuyla
 * değil: açık Base UI dialog'u sayfanın kalanını `aria-hidden` yapıyor ve
 * `within(canvasElement).getByRole(...)` arka plandaki başlığı **bulamaz**
 * (AGENTS'ın ölçülmüş maddesi).
 */
export const BanAsksForConfirmation: Story = {
  args: { state: ASKIDAKI_BASARILI },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: /Yasakla/ }))

    const dialog = await within(document.body).findByRole('dialog')
    await expect(dialog).toHaveTextContent('Hesap süresiz olarak kapatılır')

    /* Gerekçe boşken onay kapalı ve handler çağrılmamış — dialog bir kapı. */
    await expect(within(dialog).getByRole('button', { name: /^Yasakla$/ })).toBeDisabled()
    await expect(args.onBan).not.toHaveBeenCalled()

    /* Arka plan hâlâ DOM'da, yalnız erişilebilirlik ağacından çıkmış durumda. */
    await expect(canvasElement.querySelector('h2')?.textContent).toBe(suspendedIndividual.fullName)
  },
}

/**
 * Gerekçe yazılıp onaylanınca `onBan` yükle çalışır ve dialog kapanır.
 *
 * Ban süresiz olduğu için `durationDays` **verilmiyor** — yalnız `reason`. Play
 * DOM'u **oturmuş bırakıyor**: `popupKapanmasiniBekle` olmadan story yazı-tura
 * düşerdi — kapanma animasyonu sürerken axe çalışırsa Base UI'ın odak korumaları
 * (`aria-hidden="true"` + `tabindex="0"`) `aria-hidden-focus` ihlali üretir.
 */
export const BanConfirmationRunsTheHandler: Story = {
  args: { state: ASKIDAKI_BASARILI },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: /Yasakla/ }))

    const dialog = within(await within(document.body).findByRole('dialog'))

    /* Onay gerekçesiz kapalı; önce gerekçe yazılıyor. */
    await userEvent.type(dialog.getByRole('textbox', { name: /Gerekçe/ }), 'Tekrarlayan ihlal')
    await userEvent.click(dialog.getByRole('button', { name: /^Yasakla$/ }))

    await expect(args.onBan).toHaveBeenCalledWith({ reason: 'Tekrarlayan ihlal' })

    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument())
    await popupKapanmasiniBekle()
  },
}

/* ────────────────────────────────────────────────────────────────────────────
   Düzen varyantları (brifing 3.5: "Mobile tabs, desktop columns")
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * 320 pikselde tek kolon; bölümler sekmede.
 *
 * Ölçüm yalnız **yatay taşma**: dikey sıralamanın kendisi ekran görüntüsünün
 * işi, çünkü medya sorgusu viewport'a bağlı ve play onu güvenilir okuyamıyor
 * (AGENTS). Tablolar kendi kaplarında kaydırılıyor — DataTable'ın scroller'ı
 * `tabIndex={0}` taşıdığı için klavyeyle de gezilebilir.
 */
export const MobileTabs: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { state: OFIS_BASARILI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('tab', { name: ILANLAR_SEKMESI })).toBeInTheDocument()
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/**
 * Masaüstünde iki kolon: özet rayı + sekmeli içerik.
 *
 * **Sekmeler burada da duruyor** ve bu bilinçli: bölümleri masaüstünde ikinci
 * kez kolon olarak çizmek ya DOM'u ikizler (audit tablosu iki kez → yetki
 * iddiası sayı saymaya döner) ya da `display: none` ister (alt ağacı
 * erişilebilirlik ağacından siler). Gerekçenin uzunu `.css.ts`'te.
 */
export const DesktopColumns: Story = {
  globals: { viewport: { value: 'desktop1440' } },
  args: { state: OFIS_BASARILI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('tab', { name: AUDIT_SEKMESI })).toBeInTheDocument()
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/**
 * Uzun içerik 320 pikselde sarmalı, sayfayı yatay kaydırmamalı.
 *
 * Ad ve firma adı fixture'dan **türetiliyor**, sıfırdan uydurulmuyor: hesabın
 * sayaçları ve tarihleri korunuyor, yalnız taşması istenen üç metin uzatılıyor
 * (`UserSummaryCard.stories.tsx` ile aynı kalıp).
 *
 * İzinler **destek'in**: taşma testinin asıl öznesi 78 karakterlik, boşluksuz
 * e-posta dizgisi (`overflow-wrap: anywhere` olmadan `min-content` kırılmaz ve
 * 320 pikselde sayfayı yatay kaydırır).
 *
 * Bu story yazıldığında seçim bir **zorunluluktu**: `security` e-postayı hiç
 * çizmiyordu, yalnız `detailed` çiziyordu — yani dizgi ancak sınırlı görünümde
 * ölçülebiliyordu ve bu, raporlanan boşluğun görünür hâliydi. Boşluk bu turda
 * kapandı: `security` artık `detailed`'ın **üst kümesi** (e-posta/telefon/ilan
 * sayaçları/kayıt tarihi orada da çiziliyor) — kusuru bulan bu story'ydi.
 *
 * Destek izinleri yine de **bilerek duruyor**: dizgi artık iki varyantta da
 * ölçülebilir, ama dar görünüm kartın en sıkışık hâli (rozet ve yaptırım bandı
 * yok, yani sarma için en az yardım) ve taşmayı en erken orada görürüz.
 * `MobileTabs` aynı genişlikte `security`'yi ölçüyor: ikisi birlikte iki
 * varyantı da 320 pikselde kapsıyor.
 */
export const LongContent: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    availablePermissions: DESTEK_IZINLERI,
    state: {
      status: 'success',
      data: {
        ...OFIS_PAKETI,
        user: {
          ...verifiedRealEstateOffice,
          fullName:
            'Karadeniz Bölgesi Gayrimenkul Danışmanlığı ve Yatırım Hizmetleri Anonim Şirketi',
          companyName:
            'Karadeniz Bölgesi Gayrimenkul Danışmanlığı ve Yatırım Hizmetleri A.Ş. — Trabzon Merkez Şubesi',
          email: 'kurumsal.musteri.iliskileri.yonetimi@karadenizgayrimenkulyatirim.example.invalid',
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/**
 * Şikayet sekmesi: kartlar `<ul>` içinde, ilan bağlamı aynı paketten çözülüyor.
 *
 * `<ul>` üç özelliği birden sıfırlıyor (`listStyle` + `margin` + `padding`);
 * yalnız margin'i sıfırlamak listeyi 40 piksel sağa kaydırırdı.
 */
export const ReportsTab: Story = {
  args: { state: OFIS_BASARILI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(OFIS_PAKETI.reports.length).toBeGreaterThan(0)

    await userEvent.click(canvas.getByRole('tab', { name: /Şikayetler/ }))

    const liste = await canvas.findByRole('list')
    await expect(within(liste).getAllByRole('listitem')).toHaveLength(OFIS_PAKETI.reports.length)
  },
}

/* ────────────────────────────────────────────────────────────────────────────
   Yaptırım sicili — yetki sınırıyla
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Tam görünümde (`security`) yaptırım sicili görünür: yürürlükteki askı **ve**
 * kaldırılmış eski askı.
 *
 * `SICIL_PAKET.sanctions` = `mertYildizSanctions` (Mert artık iki kayıt taşıyor).
 * "Kaldırılmış yaptırım da sicildir" burada gerçek fixture'la ölçülüyor:
 * `revokedAt` dolu kayıt "Kaldırıldı" rozetiyle işaretleniyor ama listeden
 * düşürülmüyor. Sicil `SellerPanel`'in `risk` varyantında; onu bu ekrana koymanın
 * wart'ı (yanıltıcı "İlan sahibi" landmark'ı, kartla çakışan kimlik) raporlandı.
 *
 * Ölçüm kaldırılmış kaydın gerekçesi üzerinden: `activeSuspensionSanction.reason`
 * hem kartta hem sicilde geçtiği için çift eşleşir, `revokedSuspensionMertYildiz.reason`
 * ise yalnız sicilde — benzersiz.
 */
export const SanctionHistoryOnFullView: Story = {
  args: { state: SICIL_BASARILI, availablePermissions: SUPER_ADMIN_IZINLERI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Kontrol: hesap gerçekten çizildi. */
    await expect(
      canvas.getByRole('heading', { level: 2, name: /^Mert Yıldız/ }),
    ).toBeInTheDocument()

    await expect(canvas.getByText('Yaptırım geçmişi')).toBeInTheDocument()

    /* Kaldırılmış kayıt işaretli ama düşürülmemiş: hem rozet hem gerekçesi görünür. */
    await expect(canvas.getByText('Kaldırıldı')).toBeInTheDocument()
    await expect(canvas.getByText(revokedSuspensionMertYildiz.reason)).toBeInTheDocument()
  },
}

/**
 * ⚠ Destek sicili **görmez** — `UserSanction.reason` iç gerekçe metnidir.
 *
 * `SICIL_PAKET` sicili taşısa da `destek` (`UserViewProfile`) tam görünüme sahip
 * değil: `SellerPanel` hiç render edilmiyor ve kart `detailed` olduğu için aktif
 * yaptırımın **gerekçesini** de çizmiyor (yalnız tip + `endsAt`). İki gerekçe de
 * DOM'da yok. Kontrol grubu `SanctionHistoryOnFullView`: aynı veri, tam görünümde
 * ikisi de görünür.
 */
export const SupportViewHidesSanctionHistory: Story = {
  args: { state: SICIL_BASARILI, availablePermissions: DESTEK_IZINLERI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Kontrol: hesap çizildi ve destek'in görebildiği durum yerinde. */
    await expect(
      canvas.getByRole('heading', { level: 2, name: /^Mert Yıldız/ }),
    ).toBeInTheDocument()
    await expect(canvas.getByText(ASKI_DURUM_METNI)).toBeInTheDocument()

    await expect(canvas.queryByText('Yaptırım geçmişi')).not.toBeInTheDocument()
    await expect(canvas.queryByText(revokedSuspensionMertYildiz.reason)).not.toBeInTheDocument()
    /* Aktif yaptırımın gerekçesi de gizli: `detailed` yalnız tip + `endsAt` çizer. */
    await expect(canvas.queryByText(activeSuspensionSanction.reason)).not.toBeInTheDocument()
  },
}

/* ────────────────────────────────────────────────────────────────────────────
   Rol değişikliği çakışması ve sayfalama
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Rol değişikliği reddedildi (`roleChangeConflict`, brifing 2.6): rol kutusunun
 * altında `danger` bir `Alert`.
 *
 * `expectedRoleVersion` gönderilmiyor (damga yok — raporlandı), ama çakışma
 * sunucudan `roleChangeError` olarak dönebiliyor ve ekran onu gösteriyor. Sayfada
 * bayat uyarısı olmadığı için tek `alert` bu — `getByRole('alert')` benzersiz.
 */
export const RoleChangeConflict: Story = {
  args: {
    state: ADMIN_BASARILI,
    availablePermissions: SUPER_ADMIN_IZINLERI,
    roleChangeError: {
      title: 'Rol değişikliği uygulanamadı',
      message:
        'Bu hesabın rolü başka bir yönetici tarafından değiştirildi. Sayfayı yenileyip tekrar deneyin.',
      code: 'ROLE_VERSION_CONFLICT',
      retryable: false,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Kontrol: rol kutusu gerçekten çizildi (yalnız superAdmin). */
    await expect(canvas.getByRole('combobox', { name: /Admin rolü/ })).toBeInTheDocument()

    await expect(canvas.getByRole('alert')).toHaveTextContent('Rol değişikliği uygulanamadı')
    /* Çakışmada tekrar deneme yok: aynı damga aynı çakışmayı üretir. */
    await expect(canvas.queryByRole('button', { name: /Tekrar dene/ })).not.toBeInTheDocument()
  },
}

/**
 * İlanlar sekmesi sayfalanabiliyor (Faz 3'te `onListingsPageChange` yoktu →
 * ikinci sayfa istenemiyordu; RAPOR EDİLMİŞTİ).
 *
 * `Pagination` yalnız kanal bağlıysa render ediliyor. Bir sonraki sayfa 1-tabanlı
 * bildiriliyor; yeni sayfayı çekmek çağıranın işi (ekran veri çekmez).
 */
export const ListingsPagination: Story = {
  args: {
    state: {
      status: 'success',
      data: {
        ...OFIS_PAKETI,
        listings: {
          items: hesabinIlanlari(verifiedRealEstateOffice),
          page: 1,
          pageSize: 6,
          totalItems: 18,
          totalPages: 3,
        },
      },
    },
    onListingsPageChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Sayfa 2' }))
    await expect(args.onListingsPageChange).toHaveBeenCalledWith(2)
  },
}
