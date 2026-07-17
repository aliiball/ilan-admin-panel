import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Building2,
  Flag,
  FolderTree,
  Inbox,
  LayoutDashboard,
  List,
  Menu,
  Palette,
  Rocket,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { AdminPermission, AdminRole, ROLE_PERMISSIONS } from '../../../types/domain'
import { ADMIN_ROLE_LABEL } from '../../../domain/labels'
import type { NavigationItem } from '../../../types/component-props'
import { SidebarNav } from './SidebarNav'
import { cokluKopyaLandmarkMuafiyeti } from '../../../storybook/a11y'

/** Panelin on bir ekranından türetilmiş menü; iki kademeli iki grup içeriyor. */
const MENU: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Panel',
    href: '/',
    icon: <LayoutDashboard size={20} />,
    requiredPermission: AdminPermission.DashboardView,
  },
  {
    id: 'listings',
    label: 'İlanlar',
    href: '/ilanlar',
    icon: <Building2 size={20} />,
    badge: 24,
    requiredPermission: AdminPermission.ListingView,
    children: [
      {
        id: 'listings-queue',
        label: 'Moderasyon kuyruğu',
        href: '/ilanlar/kuyruk',
        icon: <Inbox size={20} />,
        badge: 24,
        requiredPermission: AdminPermission.ListingApprove,
      },
      {
        id: 'listings-all',
        label: 'Tüm ilanlar',
        href: '/ilanlar/tumu',
        icon: <List size={20} />,
        requiredPermission: AdminPermission.ListingView,
      },
      {
        id: 'listings-promotions',
        label: 'Doping',
        href: '/ilanlar/doping',
        icon: <Rocket size={20} />,
        requiredPermission: AdminPermission.PromotionManage,
      },
    ],
  },
  {
    id: 'users',
    label: 'Kullanıcılar',
    href: '/kullanicilar',
    icon: <Users size={20} />,
    requiredPermission: AdminPermission.UserView,
  },
  {
    id: 'reports',
    label: 'Şikayetler',
    href: '/sikayetler',
    icon: <Flag size={20} />,
    badge: 7,
    requiredPermission: AdminPermission.ReportView,
  },
  {
    id: 'categories',
    label: 'Kategoriler',
    href: '/kategoriler',
    icon: <FolderTree size={20} />,
    requiredPermission: AdminPermission.CategoryView,
  },
  {
    id: 'settings',
    label: 'Ayarlar',
    href: '/ayarlar',
    icon: <Settings size={20} />,
    requiredPermission: AdminPermission.SettingsView,
    children: [
      {
        id: 'settings-theme',
        label: 'Tema',
        href: '/ayarlar/tema',
        icon: <Palette size={20} />,
        requiredPermission: AdminPermission.ThemeManage,
      },
      {
        id: 'settings-permissions',
        label: 'Rol ve izinler',
        href: '/ayarlar/izinler',
        icon: <ShieldCheck size={20} />,
        requiredPermission: AdminPermission.PermissionManage,
      },
    ],
  },
  {
    id: 'audit',
    label: 'Denetim kaydı',
    href: '/denetim',
    icon: <ScrollText size={20} />,
    requiredPermission: AdminPermission.AuditView,
  },
]

const TUM_ID: string[] = MENU.flatMap((item) => [
  item.id,
  ...(item.children ?? []).map((cocuk) => cocuk.id),
])

/**
 * **Bu süzgeç SidebarNav'ın içinde değil, bilerek.**
 *
 * `requiredPermission` bir kapı değil, çağıran katmana bırakılmış bir bildirim:
 * `SidebarNavProps`'ta kullanıcının izin listesi yok ve olmayacak — yetki
 * kontrolü component'in işi değil. Süzgecin gerçek yeri sayfa/uygulama
 * katmanıdır; burada story'ler o katmanı taklit ediyor.
 *
 * İzinler `ROLE_PERMISSIONS`'tan okunuyor, elle yazılmıyor: matris değişir de
 * menü ona uymazsa story çıktısı değişsin.
 */
function yetkiyeGoreSuz(
  items: NavigationItem[],
  izinler: readonly AdminPermission[],
): NavigationItem[] {
  return items
    .filter(
      (item) => item.requiredPermission === undefined || izinler.includes(item.requiredPermission),
    )
    .map((item) => {
      const cocuklar =
        item.children === undefined ? undefined : yetkiyeGoreSuz(item.children, izinler)

      // Koşullu spread: exactOptionalPropertyTypes açıkken `children: undefined`
      // yazılamaz (TS2375).
      return { ...item, ...(cocuklar !== undefined && { children: cocuklar }) }
    })
}

const meta = {
  title: 'Composites/SidebarNav',
  component: SidebarNav,

  tags: ['stable'],

  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Yetkiye göre süzmez ve süzemez.** `NavigationItem.requiredPermission` var ama ' +
          "`SidebarNavProps`'ta kullanıcının izin listesi yok: yetki kontrolü component'in işi " +
          'değil, `items` süzülmüş hâlde gelir. Alan, süzmeyi yapan sayfa katmanına bırakılmış ' +
          'bir bildirimdir — yetkisiz satır burada soluk gösterilmez, hiç gelmez. ' +
          '`collapsed` iken etiketler kırpma tekniğiyle gizlenir, `visibility: hidden` ile ' +
          '**değil**: o, bağlantının erişilebilir adını yok ederdi. Gören kullanıcı adı ' +
          "Tooltip'ten okur. Aktifliğin tek kaynağı `activeItemId`, URL değil — bu yüzden " +
          'satırlar `NavLink` değil `Link`. Aktif çocuk ebeveynini kendiliğinden açar.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'navigation',
      useWhen: [
        'Panelin ana bölümleri arasında gezinme menüsü gerekiyorsa',
        "AppShell'in `navigation` yuvası dolduruluyorsa",
      ],
      doNotUseWhen: [
        'Yetkiye göre süzme bekleniyorsa — süzme çağıranın işi, `items` süzülmüş gelmeli',
        'Tek bir ekranın içindeki görünüm gruplaması için — Tabs kullanın',
        'Sayfa başlığı, breadcrumb veya sayfa eylemleri için — PageHeader kullanın',
        'Global arama, profil veya bildirim için — TopBar kullanın',
      ],
    },
  },

  args: {
    items: MENU,
    activeItemId: 'dashboard',
  },

  argTypes: {
    items: { control: false },
    activeItemId: { control: 'select', options: TUM_ID },
    collapsed: { control: 'boolean' },
    mobileOpen: { control: 'boolean' },
  },

  /** Ray `blockSize: 100%` — yüksekliği olan bir kap olmadan hiç görünmez. */
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: '34rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SidebarNav>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onCollapsedChange: fn() },
}

/** Varyant: etiketler, rozetler ve grup okları görünür. Masaüstünün varsayılanı. */
export const Expanded: Story = {
  args: { collapsed: false, onCollapsedChange: fn() },
}

/**
 * Varyant: yalnız ikonlar. Etiket erişilebilirlik ağacında kalır, tooltip'e düşer;
 * rozet ikonun köşesine biner. Gruplar zorla açık — dar rayda gizli grup, hedefi
 * iki kapının arkasına koyardı.
 */
export const Collapsed: Story = {
  args: { collapsed: true, onCollapsedChange: fn() },
}

/**
 * Varyant: dar ekranda ray kalkar, menü çekmeceye döner.
 *
 * Çekmece yalnız `onMobileOpenChange` verilirse render edilir: kapatma yolu
 * olmayan, odak kilitli bir çekmece klavye tuzağıdır.
 */
export const MobileDrawer: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { mobileOpen: true, onMobileOpenChange: fn() },
}

/**
 * Menü boş: `<nav>` yine de kurulur, çökmez.
 *
 * Loading/Error story'si yok çünkü sözleşmede o kanallar yok — `items` yapısal
 * bir tanım, çekilen bir veri değil; menü hiçbir zaman "yükleniyor" olmaz.
 * Boş liste ise gerçek bir durum: hiçbir bölüme izni olmayan bir rol
 * (`items` süzülünce boşalır) menüyü boş görür.
 */
export const NoItems: Story = {
  args: { items: [], onCollapsedChange: fn() },
}

/** Aktif satır üst kademede: zemin, kalınlık, şerit ve `aria-current` birlikte. */
export const ActiveTopLevelItem: Story = {
  args: { activeItemId: 'users', onCollapsedChange: fn() },
}

/** Aktif satır bir alt öğe: ebeveyni kendiliğinden açık gelir. */
export const NestedOpen: Story = {
  args: { activeItemId: 'listings-queue', onCollapsedChange: fn() },
}

/** `onCollapsedChange` yok: daralt düğmesi hiç çıkmaz — AppShell'in `fixed` hâli. */
export const Fixed: Story = {
  args: { activeItemId: 'reports' },
}

/** Rozetsiz menü: "sıfır iş" bir bildirim değil, `badge: 0` rozet üretmez. */
export const WithoutBadges: Story = {
  args: {
    items: MENU.map((item) => ({
      ...item,
      badge: 0,
      ...(item.children !== undefined && {
        children: item.children.map((cocuk) => ({ ...cocuk, badge: 0 })),
      }),
    })),
    onCollapsedChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('link', { name: 'İlanlar' })).toBeInTheDocument()
    await expect(canvas.queryByText('0')).not.toBeInTheDocument()
  },
}

/**
 * Domain: `destek` rolünün gördüğü menü.
 *
 * Süzgeci **story uyguluyor**, component değil (bkz. `yetkiyeGoreSuz`). Rolde
 * `ListingApprove`, `PromotionManage`, `CategoryView`, `PermissionManage` ve
 * `AuditView` yok; moderasyon kuyruğu, doping, kategoriler, rol/izinler ve
 * denetim kaydı listeye hiç girmiyor. "İlanlar" grubu ayakta kalıyor çünkü
 * `ListingView` var — grup boşalsaydı satır yaprağa dönerdi.
 */
export const PermissionFilteredForSupport: Story = {
  name: `PermissionFiltered — ${ADMIN_ROLE_LABEL[AdminRole.Support]}`,
  args: {
    items: yetkiyeGoreSuz(MENU, ROLE_PERMISSIONS[AdminRole.Support]),
    activeItemId: 'reports',
    onCollapsedChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('link', { name: /^Şikayetler/ })).toHaveAttribute(
      'aria-current',
      'page',
    )

    // Süzgeç gerçekten uygulandı: yetkisiz satır soluk değil, yok.
    await expect(canvas.queryByRole('link', { name: 'Kategoriler' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('link', { name: 'Denetim kaydı' })).not.toBeInTheDocument()

    // "İlanlar" grubu açılınca yalnız izinli çocuk kalmalı.
    await userEvent.click(canvas.getByRole('button', { name: 'İlanlar alt menüsü' }))
    await expect(canvas.getByRole('link', { name: 'Tüm ilanlar' })).toBeInTheDocument()
    await expect(canvas.queryByRole('link', { name: /Moderasyon kuyruğu/ })).not.toBeInTheDocument()
  },
}

/**
 * Domain: `icerikDenetcisi` başka bir kesit görür.
 *
 * `UserView` ve `AuditView` yok — "Kullanıcılar" ve "Denetim kaydı" düşer; ama
 * `CategoryView` ve `ListingApprove` var, yani "Kategoriler" ve moderasyon
 * kuyruğu kalır. İki rolün menüsü birbirinin alt kümesi değil: süzme, sabit bir
 * "az/çok" sıralaması değil izin listesinin kendisidir.
 */
export const PermissionFilteredForContentReviewer: Story = {
  name: `PermissionFiltered — ${ADMIN_ROLE_LABEL[AdminRole.ContentReviewer]}`,
  args: {
    items: yetkiyeGoreSuz(MENU, ROLE_PERMISSIONS[AdminRole.ContentReviewer]),
    activeItemId: 'listings-queue',
    onCollapsedChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('link', { name: /^Moderasyon kuyruğu/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(canvas.getByRole('link', { name: 'Kategoriler' })).toBeInTheDocument()
    await expect(canvas.queryByRole('link', { name: 'Kullanıcılar' })).not.toBeInTheDocument()
  },
}

/**
 * Uzun etiketler rayı taşırmaz, üç noktaya kırpılır — ama adları tam kalır.
 *
 * Sayaçlar da kırpılır: `128.450` bir menü rozetine sığmaz ve zaten hiçbir kararı
 * değiştirmez, `99+` olur. Kesin sayı bağlantının götürdüğü ekranın işi.
 */
export const LongContent: Story = {
  args: {
    activeItemId: 'listings-queue',
    onCollapsedChange: fn(),
    items: [
      {
        id: 'dashboard',
        label: 'Yönetim paneli genel bakış ve günlük operasyon özeti',
        href: '/',
        icon: <LayoutDashboard size={20} />,
      },
      {
        id: 'listings',
        label: 'Gayrimenkul ilanları ve moderasyon işlemleri',
        href: '/ilanlar',
        icon: <Building2 size={20} />,
        badge: 128_450,
        children: [
          {
            id: 'listings-queue',
            label: 'İnceleme bekleyen ilanların moderasyon kuyruğu',
            href: '/ilanlar/kuyruk',
            icon: <Inbox size={20} />,
            badge: 9_999,
          },
          {
            id: 'listings-all',
            label: 'Yayındaki ve arşivdeki bütün ilanların tam listesi',
            href: '/ilanlar/tumu',
            icon: <List size={20} />,
          },
        ],
      },
      {
        id: 'settings',
        label: 'Sistem ayarları, rol matrisi ve tema yönetimi',
        href: '/ayarlar',
        icon: <Settings size={20} />,
        children: [
          {
            id: 'settings-permissions',
            label: 'Rol ve izin matrisi düzenleme ekranı',
            href: '/ayarlar/izinler',
            icon: <ShieldCheck size={20} />,
          },
        ],
      },
    ],
  },
}

/**
 * Uzun etiketler daraltılmış rayda: ikonlar hizadan çıkmamalı, ray genişlememeli.
 *
 * Ölçülen şey rayın **genişliği**: uzun etiket ya da `128.450` yazan bir rozet
 * rayı esnetirse daraltma hiçbir işe yaramamış olur — daraltmanın tek vaadi yer
 * açmaktı.
 */
export const LongContentCollapsed: Story = {
  args: { ...LongContent.args, collapsed: true, onCollapsedChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'Ana menü' })

    // 4rem bekleniyor; eşik gevşek tutuldu ki tema ölçüsü değişince testi
    // yalnız gerçek bir regresyon düşürsün.
    await expect(nav.getBoundingClientRect().width).toBeLessThan(100)

    await expect(canvas.getAllByText('99+').length).toBe(2)
    await expect(canvas.queryByText('128.450')).not.toBeInTheDocument()

    // Kırpma görsel: ad tam kalır, "99+" adın içine sızmaz.
    await expect(
      canvas.getByRole('link', {
        name: 'Gayrimenkul ilanları ve moderasyon işlemleri 99+ bekleyen öğe',
      }),
    ).toBeInTheDocument()
  },
}

/**
 * Dar ekran: ray kalkar, menü hamburger düğmesinden açılan çekmeceye düşer.
 *
 * Çekmece kendiliğinden kapanmaz — bağlantıya basmak `onMobileOpenChange(false)`
 * çağırır ve state'i tutan katman kapatır.
 */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  render: function Render(args) {
    const [acik, setAcik] = useState(false)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
          <button
            type="button"
            aria-label="Menüyü aç"
            style={{ display: 'flex', padding: '0.75rem' }}
            onClick={() => setAcik(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <span style={{ fontSize: '1rem' }}>İlan Yönetimi</span>
        </div>

        <SidebarNav {...args} mobileOpen={acik} onMobileOpenChange={setAcik} />
      </div>
    )
  },
}

/**
 * Aktif çocuk ebeveynini gerçekten açmalı ve `aria-current` yalnız aktif satırda olmalı.
 *
 * DOM'dan ölçülüyor: "ebeveyn açılsın" niyeti kodda doğru görünüp render'da
 * yanlış çıkabilir — kapalı `<ul>` üstündeki `display: grid`, tarayıcının
 * `[hidden]` kuralını ezerek grubu açık bırakır.
 */
export const ActiveChildOpensParent: Story = {
  args: { activeItemId: 'listings-queue', onCollapsedChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'İlanlar alt menüsü' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    const aktif = canvas.getByRole('link', { name: /^Moderasyon kuyruğu/ })
    await expect(aktif).toHaveAttribute('aria-current', 'page')

    // Ebeveyn aktif değil: aktiflik `activeItemId` ile birebir eşleşir, dalla değil.
    await expect(canvas.getByRole('link', { name: /^İlanlar/ })).not.toHaveAttribute('aria-current')

    // Aktif olmayan grup kapalı: bağlantıları erişilebilirlik ağacında olmamalı.
    await expect(canvas.getByRole('button', { name: 'Ayarlar alt menüsü' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await expect(canvas.queryByRole('link', { name: 'Tema' })).not.toBeInTheDocument()
  },
}

/**
 * Grup klavyeyle açılıp kapanmalı ve kapanınca içerik ağaçtan **gerçekten** çıkmalı.
 *
 * `Enter` ve `Space` ayrı ayrı ölçülüyor: `<button>` ikisini de tıklamaya
 * çevirir, ama satır `<div onClick>`'e kaysaydı ikisi de sessizce ölürdü.
 */
export const NestedGroupTogglesWithKeyboard: Story = {
  args: { activeItemId: 'dashboard', onCollapsedChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole('button', { name: 'İlanlar alt menüsü' })

    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByRole('link', { name: 'Tüm ilanlar' })).not.toBeInTheDocument()

    toggle.focus()
    await expect(toggle).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('link', { name: 'Tüm ilanlar' })).toBeVisible()

    await userEvent.keyboard(' ')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByRole('link', { name: 'Tüm ilanlar' })).not.toBeInTheDocument()
  },
}

/**
 * Her ok **kendi** listesini işaret etmeli.
 *
 * Ray ile çekmece aynı ağacı iki kez render ediyor. `id`'ler `useId` önekiyle
 * ayrılmazsa DOM'da aynı `id`'den iki tane olur; `aria-controls` ilkini bulur ve
 * çekmecedeki ok rayın (görünmeyen) listesini işaret eder. Sessiz bir hata:
 * ekranda her şey doğru görünür, yalnız ekran okuyucu yanlış yere bakar.
 *
 * Ölçüm rol sorgularıyla değil doğrudan DOM'dan yapılıyor: açık bir Base UI
 * dialog'u sayfanın kalanını `aria-hidden` yapar, rayın okları rol sorgusundan
 * kaybolurdu — oysa test tam olarak onların varlığını ölçüyor.
 */
export const ToggleControlsItsOwnList: Story = {
  args: { activeItemId: 'dashboard', mobileOpen: true, onMobileOpenChange: fn() },
  play: async () => {
    await within(document.body).findByRole('dialog')

    // İki grup (İlanlar, Ayarlar) × iki kopya (ray, çekmece).
    const oklar = Array.from(document.querySelectorAll('button[aria-controls]'))
    await expect(oklar.length).toBe(4)

    const hedefIdler = oklar.map((ok) => ok.getAttribute('aria-controls'))
    await expect(new Set(hedefIdler).size).toBe(4)

    for (const id of hedefIdler) {
      const hedefler = document.querySelectorAll(`[id="${id}"]`)
      await expect(hedefler.length).toBe(1)
      await expect(hedefler[0]?.tagName).toBe('UL')
    }
  },
}

/**
 * Daraltılmış menüde erişilebilir adlar **kaybolmamalı**.
 *
 * Bu repoda birebir bu hata yaşandı: Button `loading` iken etiketini
 * `visibility: hidden` ile gizliyor, adsız kalıyordu — ve testler geçiyordu,
 * çünkü hiçbiri butonu **adıyla** sorgulamıyordu. Burada her satır adıyla
 * sorgulanıyor; rozetin sayısı da adın içinde ("24" tek başına bir ad değil).
 */
export const CollapsedKeepsAccessibleNames: Story = {
  args: { collapsed: true, activeItemId: 'users', onCollapsedChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('link', { name: 'Panel' })).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'Kullanıcılar' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(canvas.getByRole('link', { name: 'İlanlar 24 bekleyen öğe' })).toBeInTheDocument()
    await expect(
      canvas.getByRole('link', { name: 'Şikayetler 7 bekleyen öğe' }),
    ).toBeInTheDocument()

    // Gruplar daraltılmışken zorla açık: hiçbir hedef ikinci bir kapının arkasında değil.
    await expect(canvas.getByRole('link', { name: 'Tema' })).toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: 'Ayarlar alt menüsü' }),
    ).not.toBeInTheDocument()

    /*
      Adlar duruyor da menü gerçekten daraldı mı? Kutu ölçülüyor, çünkü `collapsed`
      niyeti CSS'te karşılığını bulmasaydı yukarıdaki adlar yine geçerdi.
      `toBeVisible()` burada işe yaramaz: jest-dom `display`/`visibility`/`opacity`
      bakar, kırpma tekniğini görmez ve etiketi "görünür" sayar — tam da bu yüzden
      genişlik ölçülüyor.
    */
    const nav = canvas.getByRole('navigation', { name: 'Ana menü' })
    await expect(nav.getBoundingClientRect().width).toBeLessThan(100)

    const etiket = canvas.getByText('Kullanıcılar')
    await expect(etiket.getBoundingClientRect().width).toBeLessThanOrEqual(1)
  },
}

/** Daralt düğmesi bir sonraki durumu bildirmeli; menü kendi daralmasını tutmaz. */
export const CollapseButtonReportsNextState: Story = {
  args: { collapsed: false, onCollapsedChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Menüyü daralt' }))
    await expect(args.onCollapsedChange).toHaveBeenCalledWith(true)
  },
}

/** `onCollapsedChange` yoksa düğme hiç render edilmemeli — kapalı da gösterilmemeli. */
export const FixedHidesCollapseButton: Story = {
  args: { activeItemId: 'reports' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: 'Menüyü daralt' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Menüyü genişlet' })).not.toBeInTheDocument()

    // Menünün kendisi duruyor: kayıp olan yalnız görünüm tercihi.
    await expect(canvas.getByRole('navigation', { name: 'Ana menü' })).toBeInTheDocument()
  },
}

/**
 * Çekmecedeki bağlantı çekmeceyi kapatmalı.
 *
 * Tek sayfalık uygulamada rota değişince çekmece kendiliğinden kapanmaz: menü
 * açık kalır ve kullanıcı gittiği sayfayı göremez.
 */
export const DrawerLinkClosesDrawer: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { mobileOpen: true, onMobileOpenChange: fn() },
  play: async ({ args }) => {
    // Çekmece portal'da: `canvasElement` içinde değil, `document.body` altında.
    const cekmece = within(await within(document.body).findByRole('dialog'))

    await userEvent.click(cekmece.getByRole('link', { name: 'Kullanıcılar' }))
    await expect(args.onMobileOpenChange).toHaveBeenCalledWith(false)
  },
}

/** Çekmece kapatma yolu olmadan açılmamalı: odak kilitli, çıkışsız panel tuzaktır. */
export const DrawerNeedsAHandler: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { mobileOpen: true },
  play: async () => {
    await expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument()
  },
}

/**
 * `requiredPermission` bir **kapı değil**: component onunla süzmez.
 *
 * Sözleşme boşluğunun regresyon testi. `AuditView` izni olmayan bir role ait
 * satır `items`'a konursa SidebarNav onu olduğu gibi gösterir — çünkü izin
 * listesini hiç görmez. Bu davranış bilinçli; süzmeyi çağıran yapar. Test,
 * ileride birinin "component süzsün" diye gizli bir kural eklemesini yakalar.
 */
export const RequiredPermissionIsNotAGate: Story = {
  args: {
    activeItemId: 'dashboard',
    items: [
      {
        id: 'dashboard',
        label: 'Panel',
        href: '/',
        icon: <LayoutDashboard size={20} />,
        requiredPermission: AdminPermission.DashboardView,
      },
      {
        id: 'audit',
        label: 'Denetim kaydı',
        href: '/denetim',
        icon: <ScrollText size={20} />,
        requiredPermission: AdminPermission.AuditView,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // `destek` rolünde AuditView yok — yine de render ediliyor, çünkü süzme
    // çağıranın işi ve bu story süzmeyi kasten atlıyor.
    await expect(ROLE_PERMISSIONS[AdminRole.Support]).not.toContain(AdminPermission.AuditView)
    await expect(canvas.getByRole('link', { name: 'Denetim kaydı' })).toBeInTheDocument()
  },
}

/**
 * Eşleşmeyen `activeItemId` çökmemeli: hiçbir satır aktif görünmez.
 *
 * Gerçek hâli: rota menüde karşılığı olmayan bir alt sayfaya inmiştir.
 */
export const UnknownActiveItemMarksNothing: Story = {
  args: { activeItemId: 'boyle-bir-ekran-yok', onCollapsedChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('navigation', { name: 'Ana menü' })).toBeInTheDocument()
    await expect(canvasElement.querySelectorAll('a[aria-current="page"]').length).toBe(0)
  },
}

export const VariantsComparison: Story = {
  args: { activeItemId: 'listings-queue' },
  parameters: {
    /*
      İki ray = "Ana menü" adlı iki `<nav>`. Uygulamada bir tane olur; ad
      component'te sabit yazılı olduğu için kopyalara ayrı ad verilemiyor.
      (Rayın ve çekmecenin ikisi birden "Ana menü" demesi ihlal değil: çekmece
      açıkken Base UI sayfanın kalanını `aria-hidden` yapıyor, kapalıyken de
      portal içeriği hiç render edilmiyor — ikisi aynı anda erişilebilirlik
      ağacında olmuyor. `MobileDrawer` story'si bunu geçerek doğruluyor.)
    */
    ...cokluKopyaLandmarkMuafiyeti,
    docs: {
      description: {
        story:
          'Mobil çekmece burada yok: rayı çekmeceye çeviren şey bir prop değil, ' +
          'viewport genişliği (`max-width: 47.99rem`). Yan yana koymak için `MobileDrawer` ' +
          "story'sine bakın.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', gap: '2rem', height: '34rem' }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <>
      {([false, true] as const).map((collapsed) => (
        <div key={String(collapsed)} style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6, padding: '0.5rem' }}>
            {collapsed ? 'collapsed' : 'expanded'}
          </span>
          <div style={{ display: 'flex', flex: 1 }}>
            <SidebarNav {...args} collapsed={collapsed} onCollapsedChange={fn()} />
          </div>
        </div>
      ))}
    </>
  ),
}
