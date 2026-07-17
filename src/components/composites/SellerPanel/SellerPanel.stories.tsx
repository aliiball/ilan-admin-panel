import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import type { UserAccount } from '../../../types/domain'
import {
  activeIndividualOwner,
  bannedIndividual,
  pendingVerificationOffice,
  suspendedIndividual,
  userByStatus,
  verifiedConstructionCompany,
  verifiedRealEstateOffice,
} from '../../../fixtures'
import { Button } from '../../primitives/Button'
import { SellerPanel } from './SellerPanel'

const VARYANTLAR = ['summary', 'detailed', 'risk'] as const

/**
 * Uzun içerik fixture'dan **türetiliyor**, sıfırdan uydurulmuyor: gerçek hesabın
 * tarihleri korunuyor, yalnız taşması istenen üç metin uzatılıyor. E-posta
 * `.invalid`, telefon `555` — kaynağından öyle geliyor.
 */
const UZUN_ICERIKLI_HESAP: UserAccount = {
  ...verifiedRealEstateOffice,
  fullName: 'Karadeniz Bölgesi Gayrimenkul Danışmanlığı ve Yatırım Hizmetleri Anonim Şirketi',
  companyName:
    'Karadeniz Bölgesi Gayrimenkul Danışmanlığı ve Yatırım Hizmetleri A.Ş. — Trabzon Merkez Şubesi',
  email: 'kurumsal.musteri.iliskileri.yonetimi@karadenizgayrimenkulyatirim.example.invalid',
}

/** Panelin kendi uydurmadığı, dışarıdan gelen eylemler. */
const EYLEMLER = (
  <>
    <Button variant="secondary" size="sm">
      Kullanıcıya git
    </Button>
    <Button variant="danger" size="sm">
      Askıya al
    </Button>
  </>
)

const meta = {
  title: 'Composites/SellerPanel',
  component: SellerPanel,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'İlanın sahibi: kim olduğu, hesabının durumu ve —istenirse— risk sinyalleri. Veri çekmez; ' +
          "hesap `user`'dan, sayılar kendi proplarından gelir. **Sayıların kaynağı proplardır**: " +
          '`user.listingCount`/`reportCount` bir toplamdır, prop ise bağlama göre süzülmüş ve yalnız ' +
          '**açık** şikayetleri sayan sayıdır — ikisini karıştırmak paneli kendi içinde çelişkiye ' +
          'düşürürdü, bu yüzden hesabın sayaçları hiç okunmaz. **Risk bir hüküm değil sinyaldir**: ' +
          '`risk` varyantı puan hesaplamaz, "şüpheli satıcı" demez; açık şikayeti, doğrulamayı, kayıt ' +
          'tarihini ve yaptırımı yan yana koyar, hükmü moderatöre bırakır. Hesap yaşı hesaplanmaz — ' +
          'göreli zaman determinizmi bozar, kayıt tarihi mutlak yazılır. Yetki panelin işi değil: ' +
          "yetkisiz eylem `disabled` verilmez, `actions`'a hiç konmaz.",
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'entity-panel',
      useWhen: [
        'İlan detayında ilan sahibi ve doğrulama durumu gösterilecekse — `summary`',
        'Kullanıcı detayında satıcının iletişim ve hesap geçmişi gerekiyorsa — `detailed`',
        'Şüpheli bir ilan incelenirken satıcının açık şikayet, yaptırım ve doğrulama sinyalleri gerekiyorsa — `risk`',
      ],
      doNotUseWhen: [
        'Kullanıcı listesi satırı için — UserSummaryCard kullanın',
        'Şikayetin kendisini göstermek için — ReportCard kullanın',
        'Risk puanı/hükmü üretmek için — panel sinyal gösterir, karar vermez',
        "Yalnız avatar ve ad gerekiyorsa — Avatar primitive'i yeter",
      ],
    },
  },

  args: {
    user: activeIndividualOwner,
    listingCount: 4,
    openReportCount: 0,
    variant: 'summary',
  },

  /*
    `actions` meta.args'ta YOK: yokluğu bir durum (eylemsiz panel) ve meta'ya
    konması prop'u bu dosyada zorunlu kılardı (exactOptionalPropertyTypes).
    İhtiyacı olan story kendi veriyor.
  */
  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    user: { control: false },
    actions: { control: false },
    listingCount: { control: { type: 'number', min: 0 } },
    openReportCount: { control: { type: 'number', min: 0 } },
  },
} satisfies Meta<typeof SellerPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** İlan detayının yanı: ad, tip, doğrulama. İletişim ve sayılar buraya girmez. */
export const Summary: Story = {
  args: { variant: 'summary' },
}

/** Kullanıcı detayı: iletişim ve hesap geçmişi de görünür. */
export const Detailed: Story = {
  args: {
    variant: 'detailed',
    user: verifiedRealEstateOffice,
    listingCount: 6,
    openReportCount: 3,
  },
}

/**
 * Şüpheli ilan incelenirken: açık şikayet, doğrulama, kayıt tarihi, yaptırım.
 *
 * Marmara Emlak **doğrulanmış ve aktif** bir hesap; üç açık şikayeti altı ilanına
 * dağılmış. Panel bunu "şüpheli" diye özetlemiyor — sayıları yan yana koyup
 * hükmü moderatöre bırakıyor.
 */
export const Risk: Story = {
  args: { variant: 'risk', user: verifiedRealEstateOffice, listingCount: 6, openReportCount: 3 },
}

/** Eylemler dışarıdan gelir; panel kendi eylemini uydurmaz. */
export const WithActions: Story = {
  args: { variant: 'detailed', user: suspendedIndividual, listingCount: 0, actions: EYLEMLER },
}

/**
 * Yetkisiz eylem **hiç render edilmez** — kapalı buton verilmez.
 *
 * `destek` rolü askıya alamaz (`AdminPermission.UserSuspend` yok); yapabildiği
 * tek şey iletişim alanlarını düzenlemek (`AdminPermission.UserEditContact`).
 * Panel bunu bilmez, karar çağıranındır.
 */
export const LimitedPermissionActions: Story = {
  args: {
    variant: 'detailed',
    actions: (
      <Button variant="secondary" size="sm">
        İletişimi düzenle
      </Button>
    ),
  },
}

/** Doğrulanmış hesap. Bireysel satıcıda `summary` rozeti göstermez — sinyal değil. */
export const Verified: Story = {
  args: { variant: 'detailed' },
}

/**
 * Doğrulanmamış hesap: rozet `summary`'de de çıkar, çünkü sinyal odur.
 *
 * Ege Emlak doğrulama belgesini bekliyor; hesap açıldı, bir daha giriş yapılmadı.
 */
export const Unverified: Story = {
  args: { variant: 'summary', user: pendingVerificationOffice, listingCount: 0 },
}

/** Askıya alınmış satıcı: durum rozeti üç varyantta da görünür, yaptırım bandı `risk`'te. */
export const Suspended: Story = {
  args: { variant: 'risk', user: suspendedIndividual, listingCount: 0, openReportCount: 0 },
}

/** Banlı satıcı: doğrulanmamış, süresiz yaptırımlı. Son girişi ban tarihinden önce. */
export const Banned: Story = {
  args: { variant: 'risk', user: bannedIndividual, listingCount: 0, openReportCount: 0 },
}

/**
 * Kurumsal satıcı: doğrulama durumu `summary`'de bile **her zaman** yazılır
 * (brifing 1.1).
 */
export const CorporateSeller: Story = {
  args: { variant: 'summary', user: verifiedConstructionCompany, listingCount: 2 },
}

/** Hiç giriş yapmamış hesap: alan boş bırakılmaz, cümleyle söylenir. */
export const NeverLoggedIn: Story = {
  args: { variant: 'detailed', user: pendingVerificationOffice, listingCount: 0 },
}

/** Açık şikayeti olmayan satıcı: sinyalin yokluğu da yazılır. */
export const NoOpenReports: Story = {
  args: { variant: 'risk', openReportCount: 0 },
}

/**
 * Bağlama göre süzülmüş sayılar: "bu kategoride 2 ilan, 1 açık şikayet".
 *
 * Hesabın kendi sayaçları 6 ilan ve 3 şikayet diyor; panel onları **okumaz**.
 * Hangi sorunun cevabı gösterildiğini çağıran bilir.
 */
export const ContextuallyFilteredCounts: Story = {
  args: { variant: 'risk', user: verifiedRealEstateOffice, listingCount: 2, openReportCount: 1 },
}

/** Uzun kurum adı ve uzun e-posta: sarmalı, kesilmeli, paneli taşırmamalı. */
export const LongContent: Story = {
  args: {
    variant: 'detailed',
    user: UZUN_ICERIKLI_HESAP,
    listingCount: 6,
    openReportCount: 3,
    actions: EYLEMLER,
  },
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
        <SellerPanel {...args} key={user.id} user={user} variant="summary" />
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
 * Sayılar **proplardan** okunmalı, `user`'ın sayaçlarından değil.
 *
 * DOM'dan ölçülüyor: hesabın kendi sayaçları 6 ilan / 3 şikayet, prop ise 2 ilan /
 * 1 şikayet diyor. Panel `user.listingCount`'a düşseydi süzülmüş bağlamda yanlış
 * sayı gösterir ve moderatör "bu kategoride altı ilanı var" diye okurdu.
 */
export const CountsComeFromPropsNotFromAccount: Story = {
  args: { variant: 'risk', user: verifiedRealEstateOffice, listingCount: 2, openReportCount: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('2 ilan')).toBeInTheDocument()
    await expect(canvas.getByText('1 açık şikayet')).toBeInTheDocument()

    await expect(canvas.queryByText('6 ilan')).not.toBeInTheDocument()
    await expect(canvas.queryByText('3 açık şikayet')).not.toBeInTheDocument()
  },
}

/**
 * `risk` bir hüküm yazmamalı: panel sayıları gösterir, "şüpheli/sahtekâr/riskli"
 * demez.
 *
 * Tam da sınırdaki hesapla ölçülüyor: Marmara Emlak doğrulanmış ve aktif, ama üç
 * açık şikayeti var. Bir gün biri "Risk: Yüksek" rozeti veya bir puan eklemek
 * isterse bu test düşer ve kararın konuşulması gerektiğini hatırlatır — sayılar
 * moderatörün, hüküm panelin değil.
 */
export const RiskShowsSignalsNotAVerdict: Story = {
  args: { variant: 'risk', user: verifiedRealEstateOffice, listingCount: 6, openReportCount: 3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('3 açık şikayet')).toBeInTheDocument()
    await expect(canvas.getByText('6 ilan')).toBeInTheDocument()

    await expect(canvas.queryByText(/riskli/i)).not.toBeInTheDocument()
    await expect(canvas.queryByText(/şüpheli/i)).not.toBeInTheDocument()
    await expect(canvas.queryByText(/sahtekâr/i)).not.toBeInTheDocument()
    await expect(canvas.queryByText(/risk skoru/i)).not.toBeInTheDocument()
  },
}

/**
 * Yürürlükteki yaptırım `risk` varyantında açıkça yazılmalı, aktif hesapta hiç
 * çıkmamalı.
 */
export const SanctionIsSurfacedOnRisk: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <SellerPanel {...args} user={suspendedIndividual} variant="risk" />
      <SellerPanel {...args} user={bannedIndividual} variant="risk" />
      <SellerPanel {...args} user={activeIndividualOwner} variant="risk" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText(/Yürürlükte olan yaptırım: Askıya Alma/)).toBeInTheDocument()
    await expect(canvas.getByText(/Yürürlükte olan yaptırım: Ban/)).toBeInTheDocument()
    await expect(canvas.getAllByText(/Yürürlükte olan yaptırım/)).toHaveLength(2)
  },
}

/** Açık şikayet yoksa alan boş bırakılmamalı: "sayı gelmedi" ile karışırdı. */
export const NoOpenReportsIsStated: Story = {
  args: { variant: 'risk', openReportCount: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Açık şikayet yok')).toBeInTheDocument()
    /* Sayılı rozet ("0 açık şikayet") çıkmamalı: sıfır bir rozeti hak etmez. */
    await expect(canvas.queryByText(/\d+ açık şikayet/)).not.toBeInTheDocument()
  },
}

/**
 * Kayıt tarihi mutlak ve İstanbul saatinde yazılmalı; hesap **yaşı**
 * hesaplanmamalı.
 *
 * Beklenen metin sabit: `formatDate` hem `tr-TR` hem `Europe/Istanbul`
 * sabitliyor. "2 yıl önce" yazsaydık aynı story yarın başka bir şey yazar ve
 * Chromatic her gün fark üretirdi — gerçek regresyon o gürültüde kaybolurdu.
 */
export const AccountAgeIsAnAbsoluteDate: Story = {
  args: { variant: 'risk' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('12 Mar 2024')).toBeInTheDocument()
    await expect(canvas.getByText('16 Tem 2026 08:05')).toBeInTheDocument()
    await expect(canvas.queryByText(/önce$/)).not.toBeInTheDocument()
    await expect(canvas.queryByText(/yaşında/)).not.toBeInTheDocument()
  },
}

/**
 * Tarihin makine okunur hâli ham ISO olmalı.
 *
 * `<time datetime>` erişilebilirlik ağacına ve tarayıcıya kaynağın kendisini
 * verir; biçimlendirilmiş metin oraya yazılsaydı makine "12 Mar 2024"ü tarih
 * olarak okuyamazdı.
 */
export const MachineReadableDateIsRawIso: Story = {
  args: { variant: 'detailed' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const kayit = canvas.getByText('12 Mar 2024')
    await expect(kayit.tagName).toBe('TIME')
    await expect(kayit).toHaveAttribute('datetime', '2024-03-12T10:20:00+03:00')
  },
}

/**
 * `summary` iletişim ve sayı göstermez; `detailed` gösterir.
 *
 * Sözleşme `summary` için "ad, tip, doğrulama" diyor: ilan detayının yan
 * kolonunda telefon numarası sorulan soru değil.
 */
export const SummaryWithholdsContactAndCounts: Story = {
  args: { variant: 'summary', user: verifiedRealEstateOffice, listingCount: 6, openReportCount: 3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Marmara Emlak Danışmanlığı')).toBeInTheDocument()
    await expect(canvas.queryByText('E-posta')).not.toBeInTheDocument()
    await expect(canvas.queryByText('yonetim@marmaraemlak.example.invalid')).not.toBeInTheDocument()
    await expect(canvas.queryByText('6 ilan')).not.toBeInTheDocument()
    await expect(canvas.queryByText(/açık şikayet/)).not.toBeInTheDocument()
  },
}

/**
 * Doğrulama rozeti: `summary`'de bireysel doğrulanmış hesapta çıkmaz, kurumsalda
 * ve doğrulanmamışta çıkar.
 *
 * Kurumsal tarafı brifing 1.1'in şartı, bireysel tarafı gürültü kararı: her
 * ilanın yanında yanan "Doğrulanmış" asıl sinyali ("Doğrulanmamış") bastırır.
 */
export const SummaryVerificationBadgeIsSelective: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <SellerPanel {...args} user={activeIndividualOwner} variant="summary" />
      <SellerPanel {...args} user={verifiedConstructionCompany} variant="summary" />
      <SellerPanel {...args} user={pendingVerificationOffice} variant="summary" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Doğrulanmış bireysel satıcı rozeti yok; kurumsal olan tek "Doğrulanmış". */
    await expect(canvas.getAllByText('Doğrulanmış')).toHaveLength(1)
    await expect(canvas.getByText('Doğrulanmamış')).toBeInTheDocument()
  },
}

/** `detailed`/`risk` iki hâli de yazar: rozetin yokluğu belirsiz kalmamalı. */
export const DetailedShowsBothVerificationStates: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <SellerPanel {...args} user={activeIndividualOwner} variant="detailed" />
      <SellerPanel {...args} user={pendingVerificationOffice} variant="detailed" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Doğrulanmış')).toBeInTheDocument()
    await expect(canvas.getByText('Doğrulanmamış')).toBeInTheDocument()
  },
}

/**
 * Panel adlandırılmış bir `region` olmalı, başlık seviyesi uydurmamalı ve avatarın
 * baş harfleri erişilebilirlik ağacına sızmamalı.
 *
 * `<h3>` yazılmıyor: aynı panel ilan detayında ve kullanıcı detayında farklı
 * derinliklerde duruyor, seviyeyi tahmin eden yanlış tahmin eder. Landmark bu
 * yüzden tek navigasyon yolu ve gerçekten var olduğu ölçülüyor.
 *
 * Baş harfler DOM'da **duruyor** (Base UI `Avatar.Fallback`'i onları sıradan bir
 * `<span>`e yazıyor); ölçülen şey `aria-hidden` atasının varlığı — `queryByText`
 * gizli alt ağacı yok saymaz ve "yok" demek yanlış olurdu. Bu gizleme olmasaydı
 * bölgenin içeriği ekran okuyucuya "AD Ayşe Demir…" diye başlardı.
 */
export const PanelIsANamedRegionWithoutAvatarInitials: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const bolge = canvas.getByRole('region', { name: 'İlan sahibi' })
    await expect(bolge).toBeInTheDocument()
    await expect(canvas.getByText('Ayşe Demir')).toBeInTheDocument()

    const basHarfler = canvas.getByText('AD')
    await expect(basHarfler.closest('[aria-hidden="true"]')).not.toBeNull()

    /* Başlık seviyesi tahmin edilmiyor: panelde hiç başlık olmamalı. */
    await expect(canvas.queryByRole('heading')).not.toBeInTheDocument()
  },
}

/** Dar ekranda eylemler alt satıra iner; panel 320 pikselde yatay kaydırmamalı. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    variant: 'risk',
    user: UZUN_ICERIKLI_HESAP,
    listingCount: 6,
    openReportCount: 3,
    actions: EYLEMLER,
  },
}

export const VariantsComparison: Story = {
  args: { user: verifiedRealEstateOffice, listingCount: 6, openReportCount: 3 },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <SellerPanel {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
