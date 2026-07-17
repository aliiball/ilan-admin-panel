import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Bell,
  Flag,
  LayoutDashboard,
  ListChecks,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { expect, userEvent, within } from 'storybook/test'
import { allListingFixtures, moderatorUser } from '../../../fixtures'
import { AppShell } from './AppShell'

const MODLAR = ['fixed', 'collapsible'] as const

interface MenuOgesi {
  id: string
  label: string
  icon: ReactNode
}

const MENU: MenuOgesi[] = [
  { id: 'dashboard', label: 'Panel', icon: <LayoutDashboard size={18} /> },
  { id: 'listings', label: 'İlanlar', icon: <ListChecks size={18} /> },
  { id: 'moderation', label: 'Moderasyon Kuyruğu', icon: <ShieldCheck size={18} /> },
  { id: 'users', label: 'Kullanıcılar', icon: <Users size={18} /> },
  { id: 'reports', label: 'Şikayetler', icon: <Flag size={18} /> },
  { id: 'settings', label: 'Ayarlar', icon: <Settings size={18} /> },
]

/** Aynı kimlikler, taşacak kadar uzun etiketler: kolon genişliğini menü belirler. */
const UZUN_MENU: MenuOgesi[] = MENU.map((oge) => ({
  ...oge,
  label: `${oge.label} ve bekleyen tüm kayıtların birleşik görünümü`,
}))

/**
 * Görsel olarak gizler ama erişilebilirlik ağacında bırakır.
 *
 * `visibility: hidden` erişilebilir adı yok eder (bkz. AGENTS.md); daraltılmış
 * menüde geriye yalnız ikon kalırdı ve satırların adı olmazdı.
 */
const GORSEL_GIZLI: CSSProperties = {
  position: 'absolute',
  inlineSize: '1px',
  blockSize: '1px',
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
}

/**
 * Temsili menü.
 *
 * Gerçek `SidebarNav` bu turda ayrı yazılıyor ve AppShell onu zaten tanımıyor:
 * slot `ReactNode`. Buradaki kutu tam da kabuğun gördüğü kadarını temsil eder —
 * genişliğini kendi belirleyen, `<nav>` landmark'ını kendi açan bir çocuk.
 */
function OrnekMenu({
  collapsed = false,
  ogeler = MENU,
}: {
  collapsed?: boolean
  ogeler?: MenuOgesi[]
}) {
  return (
    <nav
      aria-label="Ana menü"
      style={{
        blockSize: '100%',
        inlineSize: collapsed ? '4.5rem' : '15rem',
        padding: '0.75rem',
        background: 'var(--color-bg-surface)',
        borderInlineEnd: '1px solid var(--color-border-subtle)',
      }}
    >
      <ul style={{ display: 'grid', gap: '0.25rem', margin: 0, padding: 0, listStyle: 'none' }}>
        {ogeler.map((oge) => {
          const aktif = oge.id === 'moderation'

          return (
            <li key={oge.id}>
              <a
                href="#"
                aria-current={aktif ? 'page' : undefined}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  minBlockSize: '2.75rem',
                  padding: '0 0.75rem',
                  borderRadius: '0.5rem',
                  color: aktif ? 'var(--color-action-primary-text)' : 'var(--color-text-secondary)',
                  background: aktif ? 'var(--color-action-primary-bg)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                <span aria-hidden="true" style={{ display: 'flex', flexShrink: 0 }}>
                  {oge.icon}
                </span>
                <span style={collapsed ? GORSEL_GIZLI : { fontSize: '1rem' }}>{oge.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * Temsili çekmece.
 *
 * Kapalıyken **hiç render edilmez** — gerçek `SidebarNav`'ın `mobileOpen={false}`
 * hâli. Açıkken `position: fixed` ile içeriğin üstüne biner: kabuk ona kolon
 * ayırmadığı için başka türlüsü mümkün de değil. Odak tuzağı ve `Escape`
 * çekmeceyi çizenin işi, kabuğun değil; burada yalnız kabuğun yer ayırmadığını
 * göstermek için temsili bir panel var.
 */
function OrnekCekmece({ open, onClose }: { open: boolean; onClose?: () => void }) {
  if (!open) return null

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 'var(--z-drawer)',
          background: 'var(--color-bg-overlay)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          insetBlock: 0,
          insetInlineStart: 0,
          zIndex: 'var(--z-drawer)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.25rem',
          padding: '0.25rem',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <OrnekMenu />
        {onClose !== undefined && (
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              inlineSize: '2.75rem',
              blockSize: '2.75rem',
              border: 0,
              borderRadius: '0.5rem',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
            }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </>
  )
}

const IKON_DUGMESI: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  inlineSize: '2.75rem',
  blockSize: '2.75rem',
  border: 0,
  borderRadius: '0.5rem',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
}

/** Temsili üst çubuk. Hamburger yalnız `onMenuClick` verilirse çıkar — `TopBarProps`'un kuralı. */
function OrnekUstCubuk({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        minBlockSize: '3.5rem',
        padding: '0 0.75rem',
        background: 'var(--color-bg-elevated)',
        borderBlockEnd: '1px solid var(--color-border-subtle)',
      }}
    >
      {onMenuClick !== undefined && (
        <button type="button" aria-label="Menüyü aç" onClick={onMenuClick} style={IKON_DUGMESI}>
          <Menu size={20} aria-hidden="true" />
        </button>
      )}

      <strong
        style={{
          fontSize: '1rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        Moderasyon
      </strong>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flex: '1 1 6rem',
          minInlineSize: 0,
          marginInlineStart: 'auto',
          padding: '0 0.75rem',
          borderRadius: '0.5rem',
          background: 'var(--color-bg-subtle)',
        }}
      >
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          aria-label="Global arama"
          placeholder="Ara"
          style={{
            inlineSize: '100%',
            minInlineSize: 0,
            minBlockSize: '2.75rem',
            border: 0,
            background: 'transparent',
            color: 'inherit',
          }}
        />
      </div>

      <button type="button" aria-label="Bildirimler (3 okunmamış)" style={IKON_DUGMESI}>
        <Bell size={18} aria-hidden="true" />
      </button>

      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          inlineSize: '2rem',
          blockSize: '2rem',
          borderRadius: '999px',
          background: 'var(--color-primary-100)',
          color: 'var(--color-primary-900)',
          fontSize: '1rem',
        }}
      >
        {moderatorUser.fullName.charAt(0)}
      </span>
    </div>
  )
}

/** Temsili sayfa içeriği. `<h1>` sayfanındır (PageHeader'ın işi), kabuğun değil. */
function OrnekSayfa({
  ilanSayisi = 6,
  genisTablo = false,
}: {
  ilanSayisi?: number
  genisTablo?: boolean
}) {
  return (
    <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Moderasyon Kuyruğu</h1>
      <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
        Bekleyen ilanlar gönderim sırasına göre incelenir.
      </p>

      {genisTablo && (
        /* Geniş tablo kendi kabında kaydırılır (DataTable'ın yaptığı gibi): kabuk yatay kaydırma üretmemeli. */
        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-subtle)' }}>
          <div style={{ inlineSize: '72rem', padding: '0.75rem', fontSize: '1rem' }}>
            72rem genişliğinde bir tablo satırı — kabuk değil bu kap kaydırır.
          </div>
        </div>
      )}

      {allListingFixtures.slice(0, ilanSayisi).map((ilan) => (
        <article
          key={ilan.id}
          style={{
            display: 'grid',
            gap: '0.25rem',
            padding: '0.75rem',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '0.75rem',
            background: 'var(--color-bg-surface)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1rem' }}>{ilan.title}</h2>
          <span style={{ color: 'var(--color-text-muted)' }}>İlan no: {ilan.listingNo}</span>
        </article>
      ))}
    </div>
  )
}

const meta = {
  title: 'Composites/AppShell',
  component: AppShell,

  tags: ['stable'],

  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Panelin iskeleti: `<header>`, menü slot'u ve `<main>`. **Salt düzendir** — `navigation` " +
          've `topBar` birer `ReactNode`, kabuk menünün daraltılmışlığını da aktif rotayı da bilmez. ' +
          'Çekmeceyi de o açmaz: sözleşmesinde `mobileOpen`/`onMenuClick` yok, ikisi de ' +
          "`SidebarNav`/`TopBar`'ın. Dar ekranda kabuğun payına düşen tek şey menüye kolon " +
          'ayırmamak. `sidebarMode` düzende yalnız üst çubuğun nereden başladığını değiştirir: ' +
          "`fixed`'te menü tam boy soldadır, `collapsible`'da çubuk tam genişlikte üsttedir — " +
          'menü daralırken arama kutusu yana kaymasın diye.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'layout',
      useWhen: ['Panelin her ekranını saran kök düzen gerekiyorsa (router layout route)'],
      doNotUseWhen: [
        "Sayfa içi iki kolonlu düzen için — bu kabuk `<main>` ve banner landmark'ı açar, sayfa içinde ikincisi olmamalı",
        'Menünün kendisi için — SidebarNav kullanın; kabuk onu yalnız yerleştirir',
        'Sayfa başlığı ve breadcrumb için — PageHeader kullanın',
      ],
    },
  },

  args: {
    navigation: <OrnekMenu />,
    topBar: <OrnekUstCubuk />,
    children: <OrnekSayfa />,
    sidebarMode: 'fixed',
  },

  argTypes: {
    sidebarMode: { control: 'inline-radio', options: MODLAR },
    navigation: { control: false },
    topBar: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof AppShell>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Menü tam yükseklikte solda, üst çubuk onun sağında: genişliği hiç değişmeyeceği için yapabilir. */
export const Fixed: Story = {
  args: { sidebarMode: 'fixed' },
}

/**
 * Üst çubuk tam genişlikte üstte.
 *
 * Daralt/genişlet düğmesi menünün kendisindedir (`SidebarNav.onCollapsedChange`);
 * kabuk yalnız çubuğu daralmanın yolundan çeker.
 */
export const Collapsible: Story = {
  args: { sidebarMode: 'collapsible' },
}

/** Geniş ekran: menü kolonu açık, içerik en geniş dolguyu alır. */
export const Desktop: Story = {
  globals: { viewport: { value: 'desktop1440' } },
}

/**
 * Tabletde menü kolonu zaten var (eşik 768).
 *
 * Menüyü daraltmak sayfa katmanının kararı — burada `collapsed` bir menü
 * geçiliyor ve kolon kendiliğinden daralıyor: genişliği kabuk değil menü verir.
 */
export const Tablet: Story = {
  globals: { viewport: { value: 'tablet768' } },
  args: { navigation: <OrnekMenu collapsed /> },
}

/** Daraltılmış menü: kabukta hiçbir prop değişmedi, kolon menüyü takip etti. */
export const SidebarCollapsed: Story = {
  globals: { viewport: { value: 'desktop1440' } },
  args: { navigation: <OrnekMenu collapsed /> },
}

/**
 * Mobil çekmece.
 *
 * Zinciri sayfa katmanı kurar: hamburger → `mobileOpen`. Kabuk hiçbir aşamada
 * yer almaz; çekmece içeriğin üstüne biner çünkü kabuk ona kolon ayırmamıştır.
 */
export const MobileDrawer: Story = {
  globals: { viewport: { value: 'mobile320' } },
  render: function Render(args) {
    const [acik, setAcik] = useState(true)

    return (
      <AppShell
        {...args}
        navigation={<OrnekCekmece open={acik} onClose={() => setAcik(false)} />}
        topBar={<OrnekUstCubuk onMenuClick={() => setAcik(true)} />}
      />
    )
  },
}

/**
 * Uzun menü etiketleri, uzun içerik ve kendi kabında kaydırılan geniş bir tablo.
 *
 * Ölçülen iddia: kabuk yatay kaydırma üretmez. `main`'in `min-inline-size: 0`'ı
 * unutulsaydı grid öğesinin `auto` minimumu 72rem'lik tabloyu kolonun dışına
 * taşırır, sayfa yana kayardı — ve hiçbir tip hatası vermezdi.
 */
export const LongContent: Story = {
  globals: { viewport: { value: 'desktop1440' } },
  args: {
    navigation: <OrnekMenu ogeler={UZUN_MENU} />,
    children: <OrnekSayfa ilanSayisi={allListingFixtures.length} genisTablo />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const anaIcerik = canvas.getByRole('main')
    const kabuk = anaIcerik.parentElement
    if (kabuk === null) throw new Error('AppShell kökü bulunamadı')

    /* Ölçüm viewport'tan bağımsız: içerik kolonu hiçbir genişlikte kabuğu taşırmamalı. */
    await expect(anaIcerik.getBoundingClientRect().width).toBeLessThanOrEqual(
      kabuk.getBoundingClientRect().width,
    )
    await expect(anaIcerik.scrollWidth).toBeLessThanOrEqual(anaIcerik.clientWidth)
  },
}

/** Dar ekran, çekmece kapalı: menü hiç render edilmez, kabuk tek kolondur. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    navigation: <OrnekCekmece open={false} />,
    topBar: <OrnekUstCubuk onMenuClick={() => {}} />,
  },
}

/**
 * Atlama bağlantısının üç ölçülebilir iddiası: ilk Tab ona gelir, hedefi kendi
 * kabuğunun `<main>`'idir ve o `<main>` gerçekten odak alır.
 *
 * **Enter'a basılmıyor — bilerek.** Bağlantıyı gerçekten etkinleştirmek bir
 * fragment navigasyonu başlatır ve bunun iki ayrı yan etkisi var. Birincisi:
 * navigasyon HTML spec'ine göre kuyruğa alınır, tıklamayla eşzamanlı değildir —
 * `keyboard('{Enter}')` döndüğünde odak hâlâ bağlantıdadır, yani beklemeden
 * yapılan bir `toHaveFocus()` tarayıcı doğru davransa bile düşer. İkincisi ve
 * asıl olanı: navigasyon test koşucusunun KENDİ sayfasının URL'ini değiştirir,
 * Playwright bunu sayfa gezinmesi sayar ve Vitest oturumu koparır — dosyadaki
 * bütün story'ler "Browser connection was closed" ile ölür. Ölçüm aracı ölçtüğü
 * şeyi yok ediyordu.
 *
 * Bunu component'e `onClick` + `main.focus()` ekleyerek "çözmek" de yanlış olurdu:
 * navigasyonu durdurmak için `preventDefault()` gerekir, o da adres çubuğundaki
 * fragment'i ve geçmiş kaydını gerçek kullanımda yok eder. Testi kurtarmak için
 * ürünü bozmak.
 *
 * **Kaybedilen iddia yok.** Odağı fragment hedefine taşımak tarayıcının işidir
 * (spec: "scroll to the fragment" → hedefe focusing steps uygular), AppShell'in
 * değil — AppShell bir kod değişikliğiyle onu bozamaz. Story'nin var oluş sebebi
 * olan regresyon ise (`tabIndex={-1}` düşerse tarayıcı yalnız kaydırır, odak
 * menüde kalır) `anaIcerik.focus()` ile doğrudan yakalanıyor: tabindex'siz bir
 * `<main>` odağı hiç almaz, satır düşer. Attribute ölçümü de duruyor, çünkü
 * `tabindex="0"` da odak alırdı ama `<main>`'i sekme sırasına sokardı — ikisi
 * birlikte kalıbın tamamını çiviliyor.
 */
export const SkipLinkTargetsFocusableMain: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const anaIcerik = canvas.getByRole('main')
    const baglanti = canvas.getByRole('link', { name: 'İçeriğe atla' })

    /* Bağlantı kendi kabuğunun içeriğine bağlı; hedef sekme sırasına girmiyor. */
    await expect(baglanti).toHaveAttribute('href', `#${anaIcerik.id}`)
    await expect(anaIcerik).toHaveAttribute('tabindex', '-1')

    /* Klavye kullanıcısının ilk durağı: 20 menü satırından önce. */
    canvasElement.ownerDocument.body.focus()
    await userEvent.tab()
    await expect(baglanti).toHaveFocus()

    /* Hedef gerçekten odaklanabilir mi: `tabIndex={-1}` düşerse burası düşer. */
    anaIcerik.focus()
    await expect(anaIcerik).toHaveFocus()
  },
}

/**
 * Kabuk kendi `<nav>`'ını açmamalı.
 *
 * Menü yerine düz bir kutu veriliyor: geriye hiç navigation landmark'ı kalmıyorsa
 * o landmark gerçekten SidebarNav'ın demektir. Kabuk kendi `<nav>`'ını açsaydı
 * gerçek kullanımda iç içe iki navigation landmark'ı olur, ekran okuyucu menüyü
 * iki kez listelerdi.
 */
export const RendersNoNavigationLandmark: Story = {
  args: { navigation: <div>Menü yerine düz kutu</div> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryAllByRole('navigation')).toHaveLength(0)
    await expect(canvas.getAllByRole('banner')).toHaveLength(1)
    await expect(canvas.getAllByRole('main')).toHaveLength(1)
  },
}

/**
 * Dar ekranda menüye kolon ayrılmamalı.
 *
 * DOM'dan ölçülüyor: `main` ekranın sol kenarından başlıyor ve açık çekmece
 * onunla yatayda çakışıyor — yani çekmece içeriğin üstünde, yanında değil.
 * Ölçüm dar ekranda anlamlı olduğu için test viewport'undan bağımsız: hem
 * 320'de hem test koşucusunun varsayılan genişliğinde kabuk tek kolondur.
 */
export const MobileReservesNoSidebarColumn: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    navigation: <OrnekCekmece open />,
    topBar: <OrnekUstCubuk onMenuClick={() => {}} />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const anaIcerik = canvas.getByRole('main').getBoundingClientRect()
    const cekmece = canvas.getByRole('navigation').getBoundingClientRect()

    await expect(anaIcerik.left).toBeLessThan(2)
    await expect(cekmece.left).toBeLessThan(anaIcerik.right)
    await expect(cekmece.right).toBeGreaterThan(anaIcerik.left)
  },
}

/**
 * İki mod yan yana.
 *
 * Kabuk viewport yüksekliğindedir (`100dvh`) — panelin kökü olarak doğrusu bu.
 * Karşılaştırmada iki kabuk alt alta sığsın diye kutuya hapsedilip kırpılıyor;
 * fark zaten tepede: `fixed`'te menü çubuğun soluna tam boy çıkar,
 * `collapsible`'da çubuk üstte tam genişliktedir.
 *
 * Aynı sayfada iki kabuk olması `useId`'nin sınavı: play fonksiyonu her atlama
 * bağlantısının KENDİ kabuğunun `<main>`'ini hedeflediğini ölçüyor. Sabit bir
 * `id` yazsaydık ikisi de birinci kabuğa atlardı ve hiçbir test düşmezdi.
 */
export const VariantsComparison: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const baglantilar = canvas.getAllByRole('link', { name: 'İçeriğe atla' })
    const kimlikler = canvas.getAllByRole('main').map((anaIcerik) => anaIcerik.id)

    await expect(baglantilar).toHaveLength(MODLAR.length)
    await expect(new Set(kimlikler).size).toBe(MODLAR.length)
    await expect(baglantilar.map((baglanti) => baglanti.getAttribute('href'))).toEqual(
      kimlikler.map((id) => `#${id}`),
    )
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem', padding: '1rem' }}>
      {MODLAR.map((mod) => (
        <div key={mod} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{mod}</span>
          <div
            style={{
              blockSize: '20rem',
              overflow: 'hidden',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '0.75rem',
            }}
          >
            <AppShell {...args} sidebarMode={mod} />
          </div>
        </div>
      ))}
    </div>
  ),
}
