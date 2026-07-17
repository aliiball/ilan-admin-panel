import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { AdminRole } from '../../../types/domain'
import { ADMIN_ROLE_LABEL } from '../../../domain/labels'
import { moderatorUser, userByRole, verifiedRealEstateOffice } from '../../../fixtures'
import { TopBar } from './TopBar'

const BASLIK = 'İlan Moderasyonu'

/**
 * Her story kendi mock üçlüsünü alır.
 *
 * Tek bir paylaşılan `fn()` story'ler arasında çağrı biriktirir; daha önemlisi,
 * bunlar `meta.args`'a **konmuyor**: üç handler'ın da yokluğu birer durum
 * (arama kutusuz compact çubuk, hamburger'sız masaüstü, tıklanamayan profil) ve
 * `meta.args`'a konan bir prop `exactOptionalPropertyTypes` altında o dosyada
 * `undefined` geçilemez hâle gelir (AGENTS.md, TS2375).
 */
const handlerlar = () => ({
  onSearchChange: fn(),
  onMenuClick: fn(),
  onProfileClick: fn(),
})

const ROL_SIRASI = [
  AdminRole.SuperAdmin,
  AdminRole.Moderator,
  AdminRole.ContentReviewer,
  AdminRole.Support,
] as const

/**
 * `VariantsComparison`ın `full` çubuğuna arama kutusunu açan handler.
 *
 * Modül seviyesinde: render içinde `fn()` çağırmak her render'da yeni bir mock
 * üretirdi. Story'nin `args`'ında olmadığı için Storybook onu sıfırlamıyor —
 * karşılaştırma story'si tıklanmıyor, yalnız bakılıyor.
 */
const gorselAramaHandler = fn()

const meta = {
  title: 'Composites/TopBar',
  component: TopBar,

  tags: ['stable'],

  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Panelin üst çubuğu: bölüm başlığı, global arama, okunmamış bildirim sayısı ve oturum ' +
          'sahibi. **Varyant prop’u yok:** brifingin full/compact/mobile üçlüsü veriden ve ' +
          'ekrandan doğar — `onSearchChange` verilmezse arama kutusu hiç çıkmaz (compact), ' +
          'mobile ise viewport’un işidir. **Bildirim sayacı düğme değil, gösterge:** ' +
          'sözleşmede `onNotificationsClick` yok ve hiçbir şey yapmayan zil kapalı zilden ' +
          'kötüdür. `0` bildirimde rozet çıkmaz; `99`’un üstü görselde `99+` diye kırpılır ' +
          'ama ekran okuyucuya gerçek sayı gider. Çubuk veri çekmez ve aramayı geciktirmez.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'navigation',
      useWhen: [
        'AppShell’in üst şeridi gerekiyorsa: bölüm bağlamı, global arama, bildirim ve oturum kimliği',
      ],
      doNotUseWhen: [
        'Sayfanın kendi başlığı ve eylemleri için — PageHeader kullanın; TopBar’ın başlığı <h1> değildir',
        'Bölüm bağlantıları için — SidebarNav kullanın',
        'Yalnız liste araması için — FilterBar veya SearchInput kullanın',
      ],
    },
  },

  args: {
    currentUser: moderatorUser,
  },

  argTypes: {
    currentUser: { control: false },
    title: { control: 'text' },
    searchValue: { control: 'text' },
    notificationsCount: { control: { type: 'number', min: 0 } },
  },
} satisfies Meta<typeof TopBar>

export default meta

type Story = StoryObj<typeof meta>

/** Günlük hâl: bağlam başlığı, boş arama kutusu, üç okunmamış bildirim, moderatör. */
export const Default: Story = {
  args: { ...handlerlar(), title: BASLIK, searchValue: '', notificationsCount: 3 },
}

/** Tam çubuk — brifing 3.4’ün `full` varyantı: dört yeteneğin hepsi açık. */
export const Full: Story = {
  args: { ...handlerlar(), title: BASLIK, searchValue: '', notificationsCount: 3 },
}

/**
 * `compact` varyantı: `onSearchChange` verilmedi, arama kutusu hiç render edilmiyor.
 *
 * Kendi arama alanı olan ekranlarda (ilan listesi FilterBar ile arıyor) global
 * arama tekrar eder; iki kutudan hangisinin neyi aradığı belirsizleşir.
 */
export const Compact: Story = {
  args: {
    onMenuClick: fn(),
    onProfileClick: fn(),
    title: BASLIK,
    notificationsCount: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    /* `hidden: true`: iddia "gizli" değil, "DOM’da hiç yok". */
    await expect(canvas.queryAllByRole('searchbox', { hidden: true })).toHaveLength(0)
  },
}

/** Başlıksız: kimliği ve aramayı taşıyan çubuk, bağlam adı olmadan da geçerli. */
export const WithoutTitle: Story = {
  args: { ...handlerlar(), searchValue: '', notificationsCount: 3 },
}

/**
 * Arama etkin: değer varken SearchInput temizleme düğmesini çıkarır.
 *
 * Kontrollü kutuyu boşaltmak çağırana düşer — SearchInput yalnız haber verir.
 * Bu yüzden temizlemenin de `onSearchChange('')` ile bildirildiği ölçülüyor;
 * bağlanmasaydı düğme görünür ama hiçbir şey yapmazdı.
 */
export const SearchActive: Story = {
  args: { ...handlerlar(), title: BASLIK, searchValue: 'kadıköy 3+1 deniz manzaralı' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Aramayı temizle' }))
    await expect(args.onSearchChange).toHaveBeenCalledWith('')
  },
}

/** Sıfır bildirimde rozet çıkmamalı: "0 okunmamış bildirim" bir haber değildir. */
export const NoNotifications: Story = {
  args: { ...handlerlar(), title: BASLIK, searchValue: '', notificationsCount: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryAllByRole('status', { hidden: true })).toHaveLength(0)
    await expect(canvas.queryByText('0')).not.toBeInTheDocument()
  },
}

/**
 * Dört haneli sayı: rozet `99+` diye kırpılır ama ekran okuyucu gerçek sayıyı duyar.
 *
 * Kırpma bir yer sorunudur; bilgi kaybı değil. İkisi DOM’dan ayrı ayrı ölçülüyor.
 */
export const ManyNotifications: Story = {
  args: { ...handlerlar(), title: BASLIK, searchValue: '', notificationsCount: 1284 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('99+')).toBeInTheDocument()
    await expect(canvas.getByText('1.284 okunmamış bildirim')).toBeInTheDocument()
    await expect(canvas.getByRole('status', { hidden: true })).toBeInTheDocument()
  },
}

/** `onMenuClick` yoksa hamburger DOM’a hiç girmez — sabit kenar çubuğu olan düzen. */
export const WithoutMenuButton: Story = {
  args: {
    onSearchChange: fn(),
    onProfileClick: fn(),
    title: BASLIK,
    searchValue: '',
    notificationsCount: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dugmeler = canvas.queryAllByRole('button', { name: 'Menüyü aç', hidden: true })
    await expect(dugmeler).toHaveLength(0)
  },
}

/**
 * `onProfileClick` yoksa kimlik `<button>` değil: tıklanınca hiçbir şey yapmayan
 * bir düğme, düğme olmamasından kötüdür. Ad ve rol yine görünür.
 */
export const ReadOnlyProfile: Story = {
  args: {
    onSearchChange: fn(),
    onMenuClick: fn(),
    title: BASLIK,
    searchValue: '',
    notificationsCount: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const dugmeler = canvas.queryAllByRole('button', { name: /Elif Kaya/, hidden: true })
    await expect(dugmeler).toHaveLength(0)
    /* Metin hâlâ DOM’da: tıklanamamak, kimliğin okunamaması demek değil. */
    await expect(canvas.getByText('Elif Kaya')).toBeInTheDocument()
  },
}

/**
 * `adminRole` sözleşmede opsiyonel — rol satırı olmadan da çubuk kurulur.
 *
 * Rol uydurulmuyor: "Yönetici" gibi bir yer tutucu, rolü olmayan bir hesaba
 * olmadığı bir yetki atfeder.
 */
export const WithoutAdminRole: Story = {
  args: {
    ...handlerlar(),
    currentUser: verifiedRealEstateOffice,
    title: BASLIK,
    searchValue: '',
    notificationsCount: 3,
  },
}

/** Uzun başlık üç noktaya kırpılır, uzun ad kimliği taşırmaz, sayaç 99+’a düşer. */
export const LongContent: Story = {
  args: {
    ...handlerlar(),
    currentUser: verifiedRealEstateOffice,
    title: 'Şikayet Yönetimi — Kritik Öncelikli Açık Şikayetler ve Eskalasyon Kuyruğu',
    searchValue: 'kadıköy caferağa mahallesi deniz manzaralı 3+1 asansörlü otoparklı daire',
    notificationsCount: 1284,
  },
}

/**
 * Arama kutusunun erişilebilir adı var ve her tuş vuruşu **anında** bildiriliyor.
 *
 * `waitFor` bilerek yok: geciktirme (debounce) olsaydı iddia tam burada düşerdi.
 * Geciktirmek sayfa katmanının işi — TopBar neyin pahalı olduğunu bilmez.
 */
export const SearchIsLabelledAndReportsInstantly: Story = {
  args: { ...handlerlar(), title: BASLIK, searchValue: '' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const kutu = canvas.getByRole('searchbox', { name: 'Panelde ara' })
    await userEvent.type(kutu, 'k')

    await expect(args.onSearchChange).toHaveBeenCalledWith('k')
  },
}

/**
 * Profil düğmesinin erişilebilir adı, ad metni 320 pikselde görünmezken de durur.
 *
 * İki ayrı iddia ölçülüyor: (1) ad `display: none` ile silinmiyor, (2) avatarın
 * baş harf yedeği (`EK`) ada sızmıyor — bu yüzden ad `Elif Kaya` ile **başlar**.
 */
export const ProfileKeepsAccessibleNameWhenTextHides: Story = {
  args: { ...handlerlar(), title: BASLIK, searchValue: '', notificationsCount: 3 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const profil = canvas.getByRole('button', { name: /profil menüsü/ })
    await expect(profil).toHaveAccessibleName(/^Elif Kaya.*Moderatör.*profil menüsü$/)

    await userEvent.click(profil)
    await expect(args.onProfileClick).toHaveBeenCalled()
  },
}

/**
 * Çubuk bir `banner`, başlığı ise **başlık değil**.
 *
 * `title` sayfanın `<h1>`’i olsaydı ekran okuyucu kullanıcısı aynı sayfada
 * PageHeader ile birlikte iki birinci düzey başlık duyardı. İddia DOM’dan
 * ölçülüyor: çubukta hiçbir düzeyde başlık elementi yok.
 */
export const TitleIsNotAHeading: Story = {
  args: { ...handlerlar(), title: BASLIK, searchValue: '', notificationsCount: 3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('banner')).toBeInTheDocument()
    await expect(canvas.queryAllByRole('heading', { hidden: true })).toHaveLength(0)
    await expect(canvas.getByText(BASLIK)).toBeInTheDocument()
  },
}

/** Dört admin rolü: rol satırı `domain/labels.ts`’ten gelir, çubuğa gömülmez. */
export const EveryAdminRole: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {ROL_SIRASI.map((rol) => (
        <TopBar key={rol} {...args} currentUser={userByRole[rol]} title={ADMIN_ROLE_LABEL[rol]} />
      ))}
    </div>
  ),
  args: { ...handlerlar(), searchValue: '', notificationsCount: 3 },
}

/** Gerçek durumla: yazdıkça değer anında yukarı akar, çubuk onu geri gösterir. */
export const Interactive: Story = {
  render: function Render(args) {
    const [sorgu, setSorgu] = useState('')

    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <TopBar {...args} searchValue={sorgu} onSearchChange={setSorgu} />
        <p style={{ margin: 0, paddingInline: '1rem', color: 'var(--color-text-muted)' }}>
          Sayfanın gördüğü sorgu: {sorgu === '' ? '(boş)' : sorgu}
        </p>
      </div>
    )
  },
  args: { onMenuClick: fn(), onProfileClick: fn(), title: BASLIK, notificationsCount: 3 },
}

/**
 * 320 piksel: hamburger belirir, arama kendi satırına iner, ad ve rol yerini
 * bırakır — ama erişilebilirlik ağacında kalır (bkz.
 * `ProfileKeepsAccessibleNameWhenTextHides`).
 */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { ...handlerlar(), title: BASLIK, searchValue: '', notificationsCount: 3 },
}

/**
 * Hamburger tıklanınca haber veriyor.
 *
 * Sorgu `hidden: true` ile yapılıyor: düğme masaüstü genişliğinde `display: none`
 * ve test tarayıcısının viewport’u story’nin viewport global’iyle her koşulda
 * örtüşmüyor. Ölçülen iddia "DOM’da var ve tıklanınca `onMenuClick` çağrılıyor";
 * düğmenin masaüstünde gerçekten kaybolduğu ekran görüntüsüyle doğrulanır.
 */
export const MobileMenuOpensDrawer: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { ...handlerlar(), title: BASLIK, searchValue: '', notificationsCount: 3 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const dugme = canvas.getByRole('button', { name: 'Menüyü aç', hidden: true })
    await userEvent.click(dugme)

    await expect(args.onMenuClick).toHaveBeenCalled()
  },
}

/**
 * `full` ve `compact` yan yana. `mobile` burada yok ve olamaz: viewport
 * genişliğine bağlı, kabın genişliğine değil — onu `Mobile` story’si gösterir.
 */
export const VariantsComparison: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <span style={{ paddingInline: '1rem', fontSize: '1rem', opacity: 0.6 }}>full</span>
        <TopBar {...args} onSearchChange={gorselAramaHandler} />
      </div>

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <span style={{ paddingInline: '1rem', fontSize: '1rem', opacity: 0.6 }}>compact</span>
        <TopBar {...args} />
      </div>
    </div>
  ),
  args: {
    onMenuClick: fn(),
    onProfileClick: fn(),
    title: BASLIK,
    searchValue: '',
    notificationsCount: 3,
  },
}
