import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { UserAccount } from '../../../types/domain'
import {
  activeIndividualOwner,
  activeSuspensionSanction,
  allUserFixtures,
  bannedIndividual,
  moderatorUser,
  pendingVerificationOffice,
  permanentBanSanction,
  suspendedIndividual,
  superAdminUser,
  userByStatus,
  verifiedConstructionCompany,
  verifiedRealEstateOffice,
} from '../../../fixtures'
import { Button } from '../../primitives/Button'
import { UserSummaryCard } from './UserSummaryCard'

const VARYANTLAR = ['compact', 'detailed', 'security'] as const

/**
 * Uzun içerik fixture'dan **türetiliyor**, sıfırdan uydurulmuyor: gerçek hesabın
 * sayaçları ve tarihleri korunuyor, yalnız taşması istenen üç metin uzatılıyor.
 * E-posta `.invalid`, telefon `555` — kaynağından öyle geliyor.
 */
const UZUN_ICERIKLI_HESAP: UserAccount = {
  ...verifiedRealEstateOffice,
  fullName: 'Karadeniz Bölgesi Gayrimenkul Danışmanlığı ve Yatırım Hizmetleri Anonim Şirketi',
  companyName:
    'Karadeniz Bölgesi Gayrimenkul Danışmanlığı ve Yatırım Hizmetleri A.Ş. — Trabzon Merkez Şubesi',
  email: 'kurumsal.musteri.iliskileri.yonetimi@karadenizgayrimenkulyatirim.example.invalid',
}

/** Kartın kendi uydurmadığı, dışarıdan gelen eylemler. */
const EYLEMLER = (
  <>
    <Button variant="secondary" size="sm">
      Askıya al
    </Button>
    <Button variant="danger" size="sm">
      Yasakla
    </Button>
  </>
)

const meta = {
  title: 'Composites/UserSummaryCard',
  component: UserSummaryCard,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Hesap özeti; veri çekmez, `user` prop'undan gelir. **Üç varyant üç ayrı soruyu cevaplar**: " +
          '`compact` "bu kim?", `detailed` "bu hesap nedir?", `security` "bu hesaba yaptırım uygulanmalı mı?". ' +
          'Durum yalnız renkle ifade edilmez — rozet her zaman `USER_STATUS_LABEL` metnini yazar ve ' +
          "dört durumun dört ayrı tonu vardır. Tıklanabilir bölge bir `<button>`'dır ama `actions`'ı " +
          '**sarmaz**: iç içe buton geçersiz HTML olurdu ve "eyleme tıklamak kartı açmaz" garantisi ' +
          '`stopPropagation` ile değil bu yapıyla sağlanır. `onClick` yoksa kart tıklanabilir görünmez. ' +
          "Yetki kartın işi değil — yetkisiz eylem `disabled` verilmez, `actions`'a hiç konmaz. " +
          "**`activeSanction`'ın alanları varyanta göre açılır ve bu bir yetki sınırıdır**: `compact` " +
          'hiç göstermez, `detailed` yalnız tipi ve `endsAt`i (`destek` rolünün gördüğü yüz), `security` ' +
          "ayrıca `reason`, `startsAt` ve `createdByAdminId`i. Gizli alan soluk değil, **DOM'da hiç yok**.",
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'entity-card',
      useWhen: [
        'Kullanıcı listesinde, kullanıcı detayının başında veya ilan detayında hesap sahibi gösterilecekse',
        'Yaptırım kararı öncesi hesabın güvenlik özeti gerekiyorsa — `security` varyantı',
      ],
      doNotUseWhen: [
        'İlan özeti için — ListingCard kullanın',
        'Şikayet özeti için — ReportCard kullanın',
        "Yalnız avatar ve ad gerekiyorsa — Avatar primitive'i yeter",
        'Rol/izin karşılaştırması için — RolePermissionMatrix kullanın',
      ],
    },
  },

  args: {
    user: activeIndividualOwner,
    variant: 'compact',
  },

  /*
    `onClick`, `actions` ve `activeSanction` meta.args'ta YOK. Üçünün de yokluğu
    bir durum (tıklanamayan kart, eylemsiz kart, **yaptırımsız kullanıcı**) ve
    meta.args'a konan her prop `StoryObj<typeof meta>` içinde geri alınamaz olur:
    `StoryObj` meta.args'ın çıkarılan tipini prop tipiyle kesiştiriyor, dolayısıyla
    `activeSanction: undefined` yazmak imkânsızlaşırdı (exactOptionalPropertyTypes,
    TS2375). Kural handler'a özgü değil, her prop için geçerli — ihtiyacı olan
    story kendi veriyor.
  */
  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    user: { control: false },
    activeSanction: { control: false },
    actions: { control: false },
  },
} satisfies Meta<typeof UserSummaryCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Liste satırı: avatar, ad, durum. Doğrulanmış hesapta doğrulama rozeti çıkmaz. */
export const Compact: Story = {
  args: { variant: 'compact' },
}

/** Kullanıcı detayının başı: iletişim, ilan sayıları, kayıt tarihi. */
export const Detailed: Story = {
  args: { variant: 'detailed', user: verifiedRealEstateOffice },
}

/** Yaptırım kararı verilirken bakılan yüz: son giriş, doğrulama, açık şikayet. */
export const Security: Story = {
  args: { variant: 'security', user: verifiedRealEstateOffice },
}

/** `onClick` verildi: kart bir `<button>`, klavyeyle erişilir ve hover'da kalkar. */
export const Clickable: Story = {
  args: { onClick: fn() },
}

/** `onClick` yok: kart tıklanabilir görünmemeli — imleç değişmez, klavye sırasına girmez. */
export const NotClickable: Story = {}

/** Eylemler dışarıdan gelir; kart kendi eylemini uydurmaz. */
export const WithActions: Story = {
  args: { variant: 'detailed', user: suspendedIndividual, actions: EYLEMLER },
}

/** Hem tıklanabilir hem eylemli: eylem butonları kartın butonunun içinde değil. */
export const ClickableWithActions: Story = {
  args: { variant: 'security', user: suspendedIndividual, actions: EYLEMLER, onClick: fn() },
}

/**
 * Yetkisiz kullanıcıya eylem **hiç render edilmez** — kapalı buton verilmez.
 *
 * `destek` rolü askıya alamaz (`AdminPermission.UserSuspend` yok); yapabildiği
 * tek şey iletişim alanlarını düzenlemek (`UserEditContact`). Kart bunu bilmez,
 * karar çağıranındır.
 */
export const LimitedPermissionActions: Story = {
  args: {
    variant: 'detailed',
    user: activeIndividualOwner,
    actions: (
      <Button variant="secondary" size="sm">
        İletişimi düzenle
      </Button>
    ),
  },
}

export const Active: Story = {
  args: { variant: 'security', user: activeIndividualOwner },
}

/** Askıya alınmış hesap: `security` varyantı yürürlükteki yaptırımı öne çıkarır. */
export const Suspended: Story = {
  args: { variant: 'security', user: suspendedIndividual },
}

/** Banlı hesap. Son girişi ban tarihinden önce — engellenen hesap giriş yapamaz. */
export const Banned: Story = {
  args: { variant: 'security', user: bannedIndividual },
}

/** Doğrulanmamış hesap: doğrulama rozeti `compact`'te de görünür, çünkü sinyal odur. */
export const Unverified: Story = {
  args: { variant: 'compact', user: pendingVerificationOffice },
}

/** Hiç giriş yapmamış hesap: `lastLoginAt` yok, boş bırakılmaz — cümleyle söylenir. */
export const NeverLoggedIn: Story = {
  args: { variant: 'security', user: pendingVerificationOffice },
}

/** Admin hesabı: rol rozeti yalnız burada çıkar (brifing 2.6). */
export const AdminAccount: Story = {
  args: { variant: 'detailed', user: superAdminUser },
}

/** Firma adı olan kurumsal hesap; bireysel hesapta o satır hiç yazılmaz. */
export const CompanyAccount: Story = {
  args: { variant: 'detailed', user: verifiedConstructionCompany },
}

/** Açık şikayeti olan hesap: sayı rozetle ve metniyle birlikte. */
export const WithOpenReports: Story = {
  args: { variant: 'security', user: verifiedRealEstateOffice },
}

/** Uzun kurum adı ve uzun e-posta: sarmalı, kesilmeli, kartı taşırmamalı. */
export const LongContent: Story = {
  args: { variant: 'detailed', user: UZUN_ICERIKLI_HESAP, actions: EYLEMLER },
}

/** Dar ekranda eylemler alt satıra iner; kart 320 pikselde yatay kaydırmamalı. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'security', user: UZUN_ICERIKLI_HESAP, actions: EYLEMLER },
}

/** Gerçek liste: on fixture, dört durum ve dört admin rolü bir arada. */
export const RealUserList: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {allUserFixtures.map((user) => (
        <UserSummaryCard {...args} key={user.id} user={user} variant="compact" />
      ))}
    </div>
  ),
}

/**
 * Durum yalnız renkle ifade edilmemeli — brifingin kabul kriteri.
 *
 * Dört `UserStatus` değerinin dördü de kendi **metnini** yazmalı; renk körü bir
 * moderatör "Askıya Alındı" ile "Banlandı"yı ayırt edebilmeli.
 */
export const StatusIsNotOnlyColor: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {Object.values(userByStatus).map((user) => (
        <UserSummaryCard {...args} key={user.id} user={user} variant="compact" />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Aktif')).toBeInTheDocument()
    await expect(canvas.getByText('Doğrulama Bekliyor')).toBeInTheDocument()
    await expect(canvas.getByText('Askıya Alındı')).toBeInTheDocument()
    await expect(canvas.getByText('Banlandı')).toBeInTheDocument()
  },
}

/**
 * Tıklanabilir kart gerçekten `<button>` olmalı ve erişilebilir adını
 * içeriğinden almalı.
 *
 * DOM'dan ölçülüyor: `<div onClick>` de "çalışıyor" görünür ama klavyeyle
 * erişilemez. Ad içerikten geliyor — `aria-label` ile kısaltılsaydı kartın metni
 * butonun adından düşerdi (bkz. Button'ın `loading` regresyonu, AGENTS.md).
 */
export const ClickableCardIsAButton: Story = {
  args: { onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const kart = canvas.getByRole('button', { name: /Ayşe Demir/ })
    await expect(kart).toHaveAttribute('type', 'button')

    await userEvent.click(kart)
    await expect(args.onClick).toHaveBeenCalledWith(activeIndividualOwner)
  },
}

/**
 * Kartın erişilebilir adı **adla başlamalı**, avatarın baş harfleriyle değil.
 *
 * Base UI'ın `Avatar.Fallback`'i baş harfleri `aria-hidden`'sız bir `<span>`e
 * yazıyor (kaynağında tek bir aria attribute'u yok). Kart tıklanabilirken buton
 * adını içeriğinden hesaplıyor, dolayısıyla avatar gizlenmeseydi ad
 * "AD Ayşe Demir Bireysel Aktif" olurdu ve ekran okuyucu kullanıcısı her satırda
 * önce anlamsız iki harf duyardı. `^` sabiti tam da bunu ölçüyor.
 */
export const CardAccessibleNameStartsWithTheName: Story = {
  args: { onClick: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: /^Ayşe Demir/ })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /^AD/ })).not.toBeInTheDocument()
  },
}

/** Klavyeyle de açılmalı: kart sekmeyle odaklanıp Enter ile tetiklenmeli. */
export const ClickableCardIsKeyboardReachable: Story = {
  args: { onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const kart = canvas.getByRole('button', { name: /Ayşe Demir/ })

    await userEvent.tab()
    await expect(kart).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await expect(args.onClick).toHaveBeenCalledWith(activeIndividualOwner)
  },
}

/**
 * `onClick` yokken kart tıklanabilir **görünmemeli**: buton hiç olmamalı.
 *
 * Sunulmamalı iddiası ölçülüyor — kartın kendisi de, klavye sırasında yer tutan
 * başka bir şey de çıkmamalı.
 */
export const NotClickableRendersNoButton: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/**
 * Eylem butonları kartın butonunun **içinde** olmamalı ve karta tıklamayı
 * tetiklememeli.
 *
 * `contains()` ile ölçülüyor: iç içe `<button>` geçersiz HTML'dir, tarayıcılar
 * onu sessizce düzeltir ve iç buton klavyeyle ulaşılamaz hâle gelir. Sözleşmenin
 * "actions'a tıklamak onClick'i tetiklemez" garantisi bu yapıya dayanıyor.
 */
export const ActionsAreNotNestedInCardButton: Story = {
  args: { variant: 'detailed', user: suspendedIndividual, actions: EYLEMLER, onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const kart = canvas.getByRole('button', { name: /Mert Yıldız/ })
    const askiyaAl = canvas.getByRole('button', { name: 'Askıya al' })

    await expect(kart.contains(askiyaAl)).toBe(false)

    await userEvent.click(askiyaAl)
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

/**
 * `compact` doğrulanmış hesapta rozet göstermez, doğrulanmamışta gösterir.
 *
 * Her satırda yanan "Doğrulanmış" yoğun listede gürültüdür; sinyal olan tarafı
 * ("Doğrulanmamış") bastırmamalı.
 */
export const CompactShowsOnlyUnverifiedBadge: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <UserSummaryCard {...args} user={activeIndividualOwner} variant="compact" />
      <UserSummaryCard {...args} user={pendingVerificationOffice} variant="compact" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByText('Doğrulanmış')).not.toBeInTheDocument()
    await expect(canvas.getByText('Doğrulanmamış')).toBeInTheDocument()
  },
}

/** `detailed`/`security` iki hâli de yazar: rozetin yokluğu belirsiz kalmamalı. */
export const DetailedShowsBothVerificationStates: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <UserSummaryCard {...args} user={activeIndividualOwner} variant="detailed" />
      <UserSummaryCard {...args} user={pendingVerificationOffice} variant="detailed" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Doğrulanmış')).toBeInTheDocument()
    await expect(canvas.getByText('Doğrulanmamış')).toBeInTheDocument()
  },
}

/**
 * Admin rolü yalnız admin hesabında görünmeli (brifing 2.6).
 *
 * `adminRole` platform kullanıcılarında hiç dolu değil; rozeti oraya sızdırmak
 * "bu kullanıcı yönetici mi?" sorusunu yanlış cevaplardı.
 *
 * **Varyant Faz 3'te `detailed`'dan `security`'ye çevrildi.** Bu story'nin ölçtüğü
 * eksen "admin hesabı mı, platform kullanıcısı mı" — varyant değil; `detailed`
 * tesadüfen seçilmişti. Rozete ikinci bir kapı (yalnız `security`) eklenince
 * story kendi eksenini ölçemez oldu: `detailed`'da rozet hiçbir hesapta
 * görünmediği için iddia sebebini kaybediyordu. Varyant kapısını ölçen ayrı
 * story aşağıda (`AdminRoleIsHiddenInLimitedView`) — iki eksen, iki story.
 */
export const AdminRoleOnlyOnAdminAccounts: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <UserSummaryCard {...args} user={moderatorUser} variant="security" />
      <UserSummaryCard {...args} user={activeIndividualOwner} variant="security" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Moderatör')).toBeInTheDocument()
    await expect(canvas.getByText('Yönetici')).toBeInTheDocument()
    await expect(canvas.getByText('Bireysel')).toBeInTheDocument()
    await expect(canvas.queryByText('Süper Admin')).not.toBeInTheDocument()
  },
}

/**
 * Sınırlı görünüm (`detailed`) admin rolünü **hiç göstermemeli**; tam görünüm
 * (`security`) göstermeli.
 *
 * Faz 3'te ölçülmeye başlandı çünkü Faz 3'te **gerçek bir kusurdu**: rozet
 * varyanttan bağımsız basılıyordu, yani `destek`in gördüğü yüz olan `detailed`
 * admin rolünü sızdırıyordu — `AdminPermission.UserViewProfile`'ın JSDoc'u onu
 * açıkça gizli sayarken. `lastLoginAt` doğru kapılıydı, bu değildi; kapının
 * unutulduğunu `UserManagementPage` yazılırken fark edildi.
 *
 * **İki iddia birlikte gerekiyor.** Tek başına "yok" iddiası, rozet hiçbir yerde
 * çizilmese de geçerdi — kontrol grubu olmadan yokluk iddiası sebebini kanıtlamaz.
 */
export const AdminRoleIsHiddenInLimitedView: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <UserSummaryCard {...args} user={moderatorUser} variant="detailed" />
      <UserSummaryCard {...args} user={moderatorUser} variant="security" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    /*
      Aynı hesap iki varyantta çiziliyor, yani rozet ya 1 kez görünür (yalnız
      security) ya 2 kez (kapı yok) ya 0 kez (hiç çizilmiyor). Sayı ölçümü üçünü
      de ayırıyor; `queryByText`/`getByText` yalnız ilk ikisini ayırırdı.
    */
    const rozetler = within(canvasElement).getAllByText('Moderatör')
    await expect(rozetler).toHaveLength(1)
  },
}

/**
 * Yürürlükteki yaptırım `security` varyantında açıkça yazılmalı, aktif hesapta
 * hiç çıkmamalı.
 */
export const SanctionIsSurfacedOnSecurity: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <UserSummaryCard {...args} user={suspendedIndividual} variant="security" />
      <UserSummaryCard {...args} user={bannedIndividual} variant="security" />
      <UserSummaryCard {...args} user={activeIndividualOwner} variant="security" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText(/Yürürlükte olan yaptırım: Askıya Alma/)).toBeInTheDocument()
    await expect(canvas.getByText(/Yürürlükte olan yaptırım: Ban/)).toBeInTheDocument()
    await expect(canvas.getAllByText(/Yürürlükte olan yaptırım/)).toHaveLength(2)
  },
}

/**
 * Yaptırım kaydı verilmiş askıdaki hesap, `detailed` — **`destek` rolünün gördüğü
 * yüz.** Kayıt gelince kart "Askıya Alındı" demekle kalmıyor, askının 29 Tem 2026
 * 10:30'da bittiğini de söyleyebiliyor — müşteriye anlatılan cümle tam olarak bu.
 *
 * **İddia: `detailed` yaptırımın iç gerekçesini SIZDIRMAZ.**
 *
 * Bu kartın en sıkı iddiası ve bir yetki sınırı: `destek` rolü bu varyantı görür
 * ve `UserSanction.reason` iç gerekçe metnidir — müşteriye okunacak cümle değil
 * (`AdminPermission.UserViewProfile`'ın JSDoc'u onu, `startsAt`'i ve
 * `createdByAdminId`'yi gizli sayıyor).
 *
 * Ölçüm **`not.toBeInTheDocument()`** ile, `toBeVisible()` ile değil: reponun en
 * eski kuralı "yetkisi yoksa hiç render etme" ve gizli alanın soluk, `disabled`
 * ya da `aria-hidden` bırakılması hiçbir şey çözmezdi — metin DOM'da durur,
 * incelemede okunur. `queryByText` `aria-hidden` alt ağacını zaten dışlamaz;
 * bu iddia ancak alan **hiç yokken** geçer.
 *
 * Görebildikleri de ölçülüyor: bandın kendisi ve `endsAt`. Yokluk iddiasını tek
 * başına yazmak dişsizdir — kart hiç render edilmese de geçerdi.
 */
export const SupportViewHidesSanctionReason: Story = {
  args: {
    variant: 'detailed',
    user: suspendedIndividual,
    activeSanction: activeSuspensionSanction,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Görmesi gerekenler: yaptırımın tipi ve ne zaman bittiği.
    await expect(canvas.getByText(/Yürürlükte olan yaptırım: Askıya Alma/)).toBeInTheDocument()
    await expect(canvas.getByText('Bitiş')).toBeInTheDocument()
    await expect(canvas.getByText('29 Tem 2026 10:30')).toBeInTheDocument()

    // Görmemesi gerekenler: gerekçe, başlangıç, kararı veren admin.
    await expect(canvas.queryByText(/ısrarlı spam/i)).not.toBeInTheDocument()
    await expect(canvas.queryByText('Gerekçe')).not.toBeInTheDocument()
    await expect(canvas.queryByText('Başlangıç')).not.toBeInTheDocument()
    await expect(canvas.queryByText('15 Tem 2026 10:30')).not.toBeInTheDocument()
    await expect(canvas.queryByText('Karar veren')).not.toBeInTheDocument()
    await expect(canvas.queryByText('admin-moderator-1')).not.toBeInTheDocument()
  },
}

/**
 * Aynı kayıt, `security` — **tam görünüm**: sınırlı varyantın sakladığı üç alan
 * (gerekçe, başlangıç, kararı veren admin) burada açık. `destek` bu varyantı
 * görmez; varyantı seçen sayfa katmanı **önce `UserView`'u** sınamalı (kademeler
 * kapsayıcı — ters sıra `superAdmin`'e daraltılmış görünüm gösterir).
 *
 * `SupportViewHidesSanctionReason`'ın ikizi. İkisi birlikte ölçmezse yokluk
 * iddiası yalan söyleyebilirdi: alan **hiçbir** varyantta render edilmiyor olsa
 * da o test geçerdi.
 */
export const SecurityViewShowsSanctionReason: Story = {
  args: {
    variant: 'security',
    user: suspendedIndividual,
    activeSanction: activeSuspensionSanction,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText(/Yürürlükte olan yaptırım: Askıya Alma/)).toBeInTheDocument()
    await expect(canvas.getByText(/ısrarlı spam/i)).toBeInTheDocument()
    await expect(canvas.getByText('15 Tem 2026 10:30')).toBeInTheDocument()
    await expect(canvas.getByText('admin-moderator-1')).toBeInTheDocument()

    // `endsAt` sınırlı görünümde de vardı; burada da olmalı.
    await expect(canvas.getByText('29 Tem 2026 10:30')).toBeInTheDocument()
  },
}

/**
 * Süresiz ban: `endsAt` **yok** ve bu bir durum, eksik veri değil — fixture'ın
 * kendi JSDoc'u da "süresiz" bilgisini alanın yokluğuna yüklüyor.
 *
 * İddia: "Bitiş" satırı boş kalmamalı, "Süresiz" demeli. Boş bir satır "veri
 * gelmedi" ile "bitmiyor"u karıştırırdı ve ikisi yaptırım kararında aynı şey
 * değil. Başlangıç yine mutlak tarih — süresizlik "başlangıç da yok" demek değil.
 */
export const PermanentBanHasNoEndDate: Story = {
  args: {
    variant: 'security',
    user: bannedIndividual,
    activeSanction: permanentBanSanction,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText(/Yürürlükte olan yaptırım: Ban/)).toBeInTheDocument()
    await expect(canvas.getByText('Bitiş')).toBeInTheDocument()
    await expect(canvas.getByText('Süresiz')).toBeInTheDocument()
    await expect(canvas.getByText('26 Haz 2026 11:00')).toBeInTheDocument()
  },
}

/**
 * `compact` yaptırımı **hiç** göstermez — kayıt verilse bile.
 *
 * Liste satırında durum rozeti tek bilgi; bant satırı iki katına çıkarır ve
 * gerekçe metni yoğun bir listede sızma yüzeyi olurdu. Rozetin kendisi pozitif
 * kontrol: kart render edildiği hâlde yaptırım alanları yok.
 */
export const CompactWithholdsSanction: Story = {
  args: {
    variant: 'compact',
    user: suspendedIndividual,
    activeSanction: activeSuspensionSanction,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Askıya Alındı')).toBeInTheDocument()

    await expect(canvas.queryByText(/Yürürlükte olan yaptırım/)).not.toBeInTheDocument()
    await expect(canvas.queryByText(/ısrarlı spam/i)).not.toBeInTheDocument()
    await expect(canvas.queryByText('Bitiş')).not.toBeInTheDocument()
    await expect(canvas.queryByText('29 Tem 2026 10:30')).not.toBeInTheDocument()
  },
}

/**
 * Tarih mutlak ve İstanbul saatinde yazılmalı — göreli zaman ("3 gün önce") yok.
 *
 * Beklenen metin sabit: `formatDateTime` hem `tr-TR` hem `Europe/Istanbul`
 * sabitliyor. Bu kopsaydı aynı story UTC runner'da `05:05` yazar ve Chromatic
 * her makinede fark üretirdi.
 */
export const LastLoginIsAbsoluteIstanbulTime: Story = {
  args: { variant: 'security', user: activeIndividualOwner },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('16 Tem 2026 08:05')).toBeInTheDocument()
    await expect(canvas.queryByText(/önce$/)).not.toBeInTheDocument()
  },
}

/** `lastLoginAt` yoksa alan boş bırakılmamalı: "veri gelmedi" ile karışırdı. */
export const NeverLoggedInIsStated: Story = {
  args: { variant: 'security', user: pendingVerificationOffice },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Hiç giriş yapmadı')).toBeInTheDocument()
    await expect(canvas.getByText('Açık şikayet yok')).toBeInTheDocument()
  },
}

/** `compact` iletişim ve sayaç göstermez; `detailed` gösterir. */
export const CompactWithholdsContactDetails: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <UserSummaryCard {...args} user={activeIndividualOwner} variant="compact" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Ayşe Demir')).toBeInTheDocument()
    await expect(canvas.queryByText('ayse.demir@example.invalid')).not.toBeInTheDocument()
    await expect(canvas.queryByText('E-posta')).not.toBeInTheDocument()
  },
}

export const VariantsComparison: Story = {
  args: { user: verifiedRealEstateOffice },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <UserSummaryCard {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
