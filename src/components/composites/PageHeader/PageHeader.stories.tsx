import type { Meta, StoryObj } from '@storybook/react-vite'
import { Columns3, Download, Plus, Printer, RefreshCw, Settings, Upload } from 'lucide-react'
import { expect, within } from 'storybook/test'
import type { BreadcrumbItem } from '../../../types/component-props'
import { residentialPendingVilla } from '../../../fixtures'
import { formatDateTime } from '../../../utils/formatDateTime'
import { Button } from '../../primitives/Button'
import { StatusBadge } from '../StatusBadge'
import { PageHeader } from './PageHeader'
import { cokluKopyaLandmarkMuafiyeti } from '../../../storybook/a11y'

const ilan = residentialPendingVilla

const LISTE_YOLU: BreadcrumbItem[] = [{ label: 'Panel', href: '/panel' }, { label: 'İlanlar' }]

const DETAY_YOLU: BreadcrumbItem[] = [
  { label: 'Panel', href: '/panel' },
  { label: 'İlanlar', href: '/panel/ilanlar' },
  { label: 'İnceleme kuyruğu', href: '/panel/ilanlar/kuyruk' },
  { label: ilan.title },
]

/** Son öğeye `href` verilmiş bir yol: sözleşme yasaklıyor, başlık yine de yutmalı. */
const SON_OGESI_HREFLI_YOL: BreadcrumbItem[] = [
  { label: 'Panel', href: '/panel' },
  { label: 'İlanlar', href: '/panel/ilanlar' },
  { label: 'Konyaaltı villası', href: '/panel/ilanlar/konyaalti-villa' },
]

const AnaEylem = (
  <Button variant="primary" leadingIcon={<Plus size={16} />}>
    Yeni ilan
  </Button>
)

const IkincilEylemler = (
  <>
    <Button variant="secondary" leadingIcon={<RefreshCw size={16} />}>
      Yenile
    </Button>
    <Button variant="secondary" leadingIcon={<Download size={16} />}>
      Dışa aktar
    </Button>
  </>
)

const IlanMetasi = (
  <>
    <StatusBadge status={ilan.status} />
    <span>İlan no {ilan.listingNo}</span>
    <span>Son güncelleme {formatDateTime(ilan.updatedAt)}</span>
  </>
)

const meta = {
  title: 'Composites/PageHeader',
  component: PageHeader,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Ekranın adı, yolu ve eylemleri. Başlık **ekranın tek `<h1>`'idir**: ekran okuyucu " +
          'kullanıcısı "neredeyim" sorusunu belge taslağından cevaplar, panel başlıkları onun ' +
          'altına `<h2>` olarak dizilir. Kırıntı yolu `<nav aria-label="Sayfa yolu">` + `<ol>`; ' +
          '**son öğe `href` verilse bile bağlantı olmaz**, `aria-current="page"` taşıyan düz ' +
          'metin olur — yol route yapılandırmasından mekanik türetildiğinde kullanıcıyı ' +
          'bulunduğu yere götüren bağlantı üretmesin diye. Eylemler taşarsa sarar: sözleşme ' +
          'onları opak `ReactNode` verdiği için "…" menüsüne toplanamaz, menüyü sayfa kurar.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'page-header',
      useWhen: [
        'Bir ekranın en üstünde: sayfanın adı, kırıntı yolu ve sayfa düzeyindeki eylemler',
        'İlan/kullanıcı detayında durum rozeti ve kayıt numarası göstermek için (meta)',
      ],
      doNotUseWhen: [
        'Kart veya panel başlığı için — o bölüm kendi <h2>/<h3>ünü taşır, h1 ekranda tektir',
        'Global bağlam çubuğu, arama ve profil için — TopBar kullanın',
        'Modal başlığı için — Modal.title kullanın',
        'Seçili kayıtların toplu eylemleri için — BulkActionBar kullanın',
      ],
    },
  },

  /*
    TUZAK: meta.args'a konan her prop o dosyada tipini sabitler ve
    `exactOptionalPropertyTypes` açıkken story onu `undefined` ile geri alamaz
    (TS2375). `description`, `breadcrumbs`, `meta` ve eylemlerin **yokluğu birer
    durum** (Basic hepsinden yoksun), bu yüzden yalnız `title` burada.
  */
  args: {
    title: 'İlanlar',
  },

  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    /* ReactNode ve nesne dizisi: Controls'ta anlamlı bir düzenleyici yok. */
    breadcrumbs: { control: false },
    primaryAction: { control: false },
    secondaryActions: { control: false },
    meta: { control: false },
  },
} satisfies Meta<typeof PageHeader>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    description: 'Yayındaki ve incelemedeki ilanları görüntüleyin, filtreleyin ve yönetin.',
    breadcrumbs: LISTE_YOLU,
    primaryAction: AnaEylem,
  },
}

/** Varyant: yalnız başlık. Kırıntısız, metasız, eylemsiz — en küçük hâli. */
export const Basic: Story = {
  args: {
    title: 'Denetim kaydı',
  },
}

/** Açıklama başlığın altında: sayfanın ne işe yaradığını söyler. */
export const WithDescription: Story = {
  args: {
    title: 'İnceleme kuyruğu',
    description:
      'Gönderim sırasına göre bekleyen ilanlar. Kuyruktan çıkan her ilan bir karar kaydı bırakır.',
  },
}

/** Varyant: başlığın yanında bağlam — durum rozeti, ilan no, son güncelleme. */
export const WithMeta: Story = {
  args: {
    title: ilan.title,
    meta: IlanMetasi,
  },
}

/** Varyant: ana eylem sağda, ikincil eylemler solunda. */
export const WithActions: Story = {
  args: {
    title: 'İlanlar',
    description: 'Yayındaki ve incelemedeki ilanları görüntüleyin, filtreleyin ve yönetin.',
    primaryAction: AnaEylem,
    secondaryActions: IkincilEylemler,
  },
}

/** Kırıntı yolu başlığın üstünde; son öğe bağlantı değil. */
export const WithBreadcrumbs: Story = {
  args: {
    title: ilan.title,
    breadcrumbs: DETAY_YOLU,
  },
}

/** Yetkisi olmayan kullanıcı: ana eylem **kapalı değil, yok.** */
export const WithoutPrimaryAction: Story = {
  args: {
    title: 'İlanlar',
    description: 'İlanları görüntüleyebilirsiniz. Yeni ilan oluşturma yetkiniz yok.',
    breadcrumbs: LISTE_YOLU,
    secondaryActions: IkincilEylemler,
  },
}

/** Bütün yuvalar dolu: gerçek bir ilan detay başlığı. */
export const AllSlots: Story = {
  args: {
    title: ilan.title,
    description: ilan.description,
    breadcrumbs: DETAY_YOLU,
    meta: IlanMetasi,
    primaryAction: <Button variant="primary">Onayla</Button>,
    secondaryActions: (
      <>
        <Button variant="secondary">Düzeltme iste</Button>
        <Button variant="danger">Reddet</Button>
      </>
    ),
  },
}

/**
 * State: eylem taşması. Altı eylem tek satıra sığmaz; çubuk kaydırma çubuğu
 * çıkarmaz ve "…" menüsüne toplamaz — alt satıra sarar.
 */
export const ActionsOverflow: Story = {
  args: {
    title: 'İlanlar',
    description: 'Yayındaki ve incelemedeki ilanları görüntüleyin, filtreleyin ve yönetin.',
    breadcrumbs: LISTE_YOLU,
    primaryAction: AnaEylem,
    secondaryActions: (
      <>
        <Button variant="secondary" leadingIcon={<RefreshCw size={16} />}>
          Yenile
        </Button>
        <Button variant="secondary" leadingIcon={<Download size={16} />}>
          Dışa aktar
        </Button>
        <Button variant="secondary" leadingIcon={<Upload size={16} />}>
          Toplu içe aktar
        </Button>
        <Button variant="secondary" leadingIcon={<Columns3 size={16} />}>
          Sütunları düzenle
        </Button>
        <Button variant="secondary" leadingIcon={<Printer size={16} />}>
          Yazdır
        </Button>
        <Button variant="secondary" leadingIcon={<Settings size={16} />}>
          Liste ayarları
        </Button>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    /*
      Sarma iddiası DOM'dan ölçülüyor: kap yatay kaydırmıyorsa hiçbir eylem
      dışarı taşmamıştır. `flexShrink: 0` verilseydi bu ölçüm düşerdi.
    */
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/**
 * State: uzun başlık. Başlık sarar, eylemleri dışarı itmez; boşluksuz uzun bir
 * dize bile kabı taşırmaz (`overflowWrap: anywhere`).
 */
export const LongContent: Story = {
  args: {
    title:
      "Konyaaltı Hurma Mahallesi'nde Havuzlu, Bahçeli, Tam Eşyalı ve Uzun Dönem Kiralamaya Uygun Müstakil Villa — Referans-1245790148-KONYAALTI-HURMA-VILLA",
    description:
      'Bu ilan, otomatik kontrollerin üçünde uyarı üretti ve iki kez düzeltme istendi. Karar vermeden önce fotoğrafların sahiplik durumunu ve metrekare beyanını doğrulayın; ilan sahibi son revizyonda açıklamayı tamamen değiştirmiş.',
    breadcrumbs: [
      { label: 'Panel', href: '/panel' },
      { label: 'İlan yönetimi ve moderasyon', href: '/panel/ilanlar' },
      { label: 'Öncelikli inceleme kuyruğu', href: '/panel/ilanlar/kuyruk' },
      {
        label:
          "Konyaaltı Hurma Mahallesi'nde Havuzlu, Bahçeli, Tam Eşyalı Müstakil Villa (Referans-1245790148)",
      },
    ],
    meta: IlanMetasi,
    primaryAction: AnaEylem,
    secondaryActions: IkincilEylemler,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/** Domain: ilan detayı. Durum rozeti metada, karar eylemleri sağda. */
export const ListingDetail: Story = {
  args: {
    title: ilan.title,
    breadcrumbs: DETAY_YOLU,
    meta: IlanMetasi,
    primaryAction: <Button variant="primary">Onayla</Button>,
    secondaryActions: <Button variant="danger">Reddet</Button>,
  },
}

/** Domain: liste ekranı. Kullanıcı yönetiminde ana eylem "Yeni yönetici". */
export const UserListPage: Story = {
  args: {
    title: 'Kullanıcılar',
    description: 'Bireysel üyeler, emlak ofisleri ve yönetici hesapları.',
    breadcrumbs: [{ label: 'Panel', href: '/panel' }, { label: 'Kullanıcılar' }],
    primaryAction: (
      <Button variant="primary" leadingIcon={<Plus size={16} />}>
        Yeni yönetici
      </Button>
    ),
    secondaryActions: (
      <Button variant="secondary" leadingIcon={<Download size={16} />}>
        Dışa aktar
      </Button>
    ),
  },
}

/**
 * 320 pikselde başlık ve eylemler dikey sıralanır (brifingin responsive kabul
 * kriteri) ve başlık `2xl`e düşer.
 */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    title: ilan.title,
    description: ilan.description,
    breadcrumbs: DETAY_YOLU,
    meta: IlanMetasi,
    primaryAction: <Button variant="primary">Onayla</Button>,
    secondaryActions: <Button variant="danger">Reddet</Button>,
  },
  play: async ({ canvasElement }) => {
    /*
      Ölçüm yatay taşmayı yakalar; dikey sıralamanın kendisi ekran görüntüsünün
      işi (medya sorgusu viewport'a bağlı, `canvasElement`in genişliğine değil).
    */
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/** Kırıntı yolu 320 pikselde kısaltılmaz, sarar: yol okunur kalmalı. */
export const MobileBreadcrumbs: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    title: ilan.title,
    breadcrumbs: DETAY_YOLU,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/**
 * Kırıntı yolunun semantiği: adlandırılmış gezinme + sıralı liste, son öğe
 * `aria-current="page"` ve bağlantı **değil**.
 */
export const BreadcrumbSemantics: Story = {
  args: {
    title: ilan.title,
    breadcrumbs: DETAY_YOLU,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const yol = canvas.getByRole('navigation', { name: 'Sayfa yolu' })
    const yolIcinde = within(yol)

    await expect(yolIcinde.getByRole('list')).toBeInTheDocument()
    await expect(yolIcinde.getAllByRole('listitem')).toHaveLength(4)

    await expect(yolIcinde.getByRole('link', { name: 'Panel' })).toHaveAttribute('href', '/panel')
    await expect(yolIcinde.getByRole('link', { name: 'İlanlar' })).toHaveAttribute(
      'href',
      '/panel/ilanlar',
    )

    /* Bulunulan sayfa: bağlantı yok, aria-current var. */
    await expect(yolIcinde.queryByRole('link', { name: ilan.title })).not.toBeInTheDocument()
    await expect(yolIcinde.getByText(ilan.title)).toHaveAttribute('aria-current', 'page')

    /* Ayraç ikonu erişilebilirlik ağacında görünmemeli: yol dört öğedir, yedi değil. */
    await expect(yolIcinde.getAllByRole('link')).toHaveLength(3)
  },
}

/**
 * Son kırıntının `href`i **yutulur**. Sözleşme "vermeyin" diyor; yol route'tan
 * mekanik türetildiğinde yine de gelir ve kullanıcıyı bulunduğu yere götüren bir
 * bağlantı üretmemeli.
 */
export const LastCrumbIgnoresHref: Story = {
  args: {
    title: ilan.title,
    breadcrumbs: SON_OGESI_HREFLI_YOL,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('link', { name: 'Konyaaltı villası' })).not.toBeInTheDocument()
    await expect(canvas.getByText('Konyaaltı villası')).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getAllByRole('link')).toHaveLength(2)
  },
}

/** `href`siz ara kırıntı düz metindir: tıklanacak bir şey sunmaz. */
export const CrumbWithoutHrefIsPlainText: Story = {
  args: {
    title: 'İlanlar',
    breadcrumbs: [{ label: 'Panel', href: '/panel' }, { label: 'Arşiv' }, { label: 'İlanlar' }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('link', { name: 'Arşiv' })).not.toBeInTheDocument()
    await expect(canvas.getByText('Arşiv')).not.toHaveAttribute('aria-current')
  },
}

/**
 * Başlık ekranın tek `<h1>`'i ve meta onun erişilebilir adına karışmaz.
 *
 * `name: 'İlanlar'` tam eşleşmedir: rozet h1'in içine alınsaydı ad "İlanlar
 * İnceleme bekliyor İlan no…" olur ve bu sorgu düşerdi.
 */
export const TitleIsTheOnlyLevelOneHeading: Story = {
  args: {
    title: 'İlanlar',
    description: 'Yayındaki ve incelemedeki ilanları görüntüleyin.',
    breadcrumbs: LISTE_YOLU,
    meta: IlanMetasi,
    primaryAction: AnaEylem,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    await expect(canvas.getByRole('heading', { level: 1, name: 'İlanlar' })).toBeInTheDocument()

    /*
      Meta okunacak bilgidir, tıklanacak değil: ekrandaki tek buton ana eylem.
      Rozet ve ilan no metin olarak durur.
    */
    await expect(canvas.getByText(`İlan no ${ilan.listingNo}`)).toBeInTheDocument()
    await expect(canvas.getAllByRole('button')).toHaveLength(1)
  },
}

/** Kırıntı yoksa `<nav>` hiç render edilmez — boş dizi de dahil. */
export const EmptyBreadcrumbsRenderNoNav: Story = {
  args: {
    title: 'Panel',
    breadcrumbs: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('navigation')).not.toBeInTheDocument()
    await expect(canvas.queryByRole('list')).not.toBeInTheDocument()
  },
}

/**
 * Kırıntı bağlantısının dokunma hedefi en az 44×44 piksel (brifing
 * erişilebilirlik kriteri).
 *
 * DOM'dan ölçülüyor: 1rem'lik metin kendi başına ~22 piksel yüksekliğinde kalır
 * ve "yeterince büyük görünüyor" iddiası ekran görüntüsünde fark edilmez.
 */
export const BreadcrumbTouchTargets: Story = {
  args: {
    title: ilan.title,
    breadcrumbs: DETAY_YOLU,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const ad of ['Panel', 'İlanlar', 'İnceleme kuyruğu']) {
      const kutu = canvas.getByRole('link', { name: ad }).getBoundingClientRect()

      await expect(kutu.height).toBeGreaterThanOrEqual(44)
      await expect(kutu.width).toBeGreaterThanOrEqual(44)
    }
  },
}

/** Eylemlerin DOM sırası görsel sırayla aynı: tab ana eyleme en son varır. */
export const ActionTabOrderEndsWithPrimary: Story = {
  args: {
    title: 'İlanlar',
    primaryAction: AnaEylem,
    secondaryActions: IkincilEylemler,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const butonlar = canvas.getAllByRole('button')
    const adlar = butonlar.map((buton) => buton.textContent)

    await expect(adlar).toEqual(['Yenile', 'Dışa aktar', 'Yeni ilan'])
  },
}

/**
 * Üç varyant bir arada: basic, with meta, with actions.
 *
 * Her başlık kendi `<h1>`'ini render eder; karşılaştırma sayfasında üç h1 olması
 * kaçınılmaz ve gerçek kullanımı temsil etmez — ekranda tek başlık vardır.
 */
export const VariantsComparison: Story = {
  /*
    Her PageHeader bir `<header>` açıyor ve Storybook'ta banner sayılıyor
    (uygulamada AppShell'in `<main>`'i içinde kalır — bilinen tuzak).
    Kırıntı yolunun `<nav aria-label="Sayfa yolu">`'su da kopyalanıyor.
  */
  parameters: { ...cokluKopyaLandmarkMuafiyeti, layout: 'fullscreen' },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem', padding: '1rem' }}>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <span style={{ fontSize: '1rem', opacity: 0.6 }}>basic</span>
        <PageHeader {...args} title="Denetim kaydı" />
      </div>

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <span style={{ fontSize: '1rem', opacity: 0.6 }}>with meta</span>
        <PageHeader {...args} title={ilan.title} meta={IlanMetasi} />
      </div>

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <span style={{ fontSize: '1rem', opacity: 0.6 }}>with actions</span>
        <PageHeader
          {...args}
          title="İlanlar"
          description="Yayındaki ve incelemedeki ilanları görüntüleyin, filtreleyin ve yönetin."
          breadcrumbs={LISTE_YOLU}
          primaryAction={AnaEylem}
          secondaryActions={IkincilEylemler}
        />
      </div>
    </div>
  ),
}
