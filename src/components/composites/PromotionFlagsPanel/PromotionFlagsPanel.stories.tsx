import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import {
  PromotionStatus,
  PromotionType,
  type ListingPromotion,
  type PromotionFlags,
} from '../../../types/domain'
import { residentialPublishedApartment } from '../../../fixtures'
import type { PromotionFlagsPanelProps } from '../../../types/component-props'
import { PromotionFlagsPanel } from './PromotionFlagsPanel'

const VARYANTLAR = ['badges', 'cards', 'table'] as const

/**
 * Fixture anları sabit: `Date.now()` / `new Date()` yok. Panel de mutlak tarih
 * yazıyor, dolayısıyla story dünden bugüne değişmiyor.
 */
const AN = {
  haziranAlim: '2026-06-01T09:00:00+03:00',
  haziranBitis: '2026-06-15T09:00:00+03:00',
  temmuzAlim: '2026-07-10T09:00:00+03:00',
  temmuzBitis: '2026-07-24T09:00:00+03:00',
  agustosBaslangic: '2026-08-01T09:00:00+03:00',
  agustosBitis: '2026-08-15T09:00:00+03:00',
} as const

const promosyon = (
  type: PromotionType,
  status: PromotionStatus,
  ek?: Partial<ListingPromotion>,
): ListingPromotion => ({
  id: `promotion-${type}-${status}`,
  type,
  status,
  purchasedAt: AN.temmuzAlim,
  startsAt: AN.temmuzAlim,
  endsAt: AN.temmuzBitis,
  source: 'paid',
  ...ek,
})

/** Fixture fabrikasıyla aynı mantık: verilen tipler açık, kalan beşi kapalı. */
const bayraklar = (...acik: PromotionType[]): PromotionFlags => ({
  oneCikan: acik.includes(PromotionType.Featured),
  acil: acik.includes(PromotionType.Urgent),
  vitrin: acik.includes(PromotionType.Showcase),
  anasayfaVitrini: acik.includes(PromotionType.HomepageShowcase),
  kategoriOneCikan: acik.includes(PromotionType.CategoryFeatured),
})

/** `none`: hiçbir bayrak açık değil, hiç kayıt yok. */
const YOK = { flags: bayraklar(), promotions: [] as ListingPromotion[] }

/** `active`: iki doping açık, ikisinin de aktif kaydı var. Tutarlı. */
const AKTIF = {
  flags: bayraklar(PromotionType.Featured, PromotionType.CategoryFeatured),
  promotions: [
    promosyon(PromotionType.Featured, PromotionStatus.Active),
    promosyon(PromotionType.CategoryFeatured, PromotionStatus.Active),
  ],
}

/**
 * `scheduled`: kayıt alındı ama daha başlamadı — bayrak **kapalı** olmalı.
 * Tutarlı hâli budur; başlamamış promosyonun bayrağı açıksa o bir çelişkidir.
 */
const PLANLI = {
  flags: bayraklar(),
  promotions: [
    promosyon(PromotionType.Showcase, PromotionStatus.Scheduled, {
      startsAt: AN.agustosBaslangic,
      endsAt: AN.agustosBitis,
    }),
  ],
}

/** `expired`: süresi dolmuş kayıt, bayrak kapatılmış. Tutarlı — bu bir geçmiş. */
const SURESI_DOLMUS = {
  flags: bayraklar(),
  promotions: [
    promosyon(PromotionType.Featured, PromotionStatus.Expired, {
      purchasedAt: AN.haziranAlim,
      startsAt: AN.haziranAlim,
      endsAt: AN.haziranBitis,
    }),
  ],
}

/**
 * Çelişki 1 — karşılıksız bayrak: kaydın süresi dolmuş ama bayrak açık kalmış.
 * İlan, kimsenin ödemediği bir görünürlük alıyor.
 */
const CELISKI_KARSILIKSIZ = {
  flags: bayraklar(PromotionType.Featured),
  promotions: [
    promosyon(PromotionType.Featured, PromotionStatus.Expired, {
      purchasedAt: AN.haziranAlim,
      startsAt: AN.haziranAlim,
      endsAt: AN.haziranBitis,
    }),
  ],
}

/**
 * Çelişki 2 — yansımamış kayıt: aktif promosyon var ama bayrak kapalı.
 * İlan sahibi ödediği görünürlüğü almıyor.
 */
const CELISKI_YANSIMAMIS = {
  flags: bayraklar(),
  promotions: [promosyon(PromotionType.Showcase, PromotionStatus.Active)],
}

/** Elle açılmış vitrin: parası ödenmiş vitrinden farklı bir denetim konusu. */
const ELLE_ACILMIS = {
  flags: bayraklar(PromotionType.Showcase, PromotionType.HomepageShowcase),
  promotions: [
    promosyon(PromotionType.Showcase, PromotionStatus.Active, {
      source: 'manualAdmin',
      activatedByAdminId: 'a1f0c2d4-0000-4000-8000-000000000001',
    }),
    promosyon(PromotionType.HomepageShowcase, PromotionStatus.Active),
  ],
}

/** Aynı tipten iki kayıt: haziranda bitmiş bir Vitrin + temmuzda aktif Vitrin. */
const COKLU_KAYIT = {
  flags: bayraklar(PromotionType.Showcase),
  promotions: [
    promosyon(PromotionType.Showcase, PromotionStatus.Expired, {
      id: 'promotion-vitrin-haziran',
      purchasedAt: AN.haziranAlim,
      startsAt: AN.haziranAlim,
      endsAt: AN.haziranBitis,
    }),
    promosyon(PromotionType.Showcase, PromotionStatus.Active, { id: 'promotion-vitrin-temmuz' }),
  ],
}

/**
 * Beş dopingin beş farklı okuması — panelin tüm hâllerini tek veride toplar:
 *
 * - Öne Çıkan: bayrak açık + aktif kayıt → tutarlı.
 * - Acil: bayrak açık + süresi dolmuş kayıt → **karşılıksız**.
 * - Vitrin: bayrak kapalı + aktif kayıt → **bayrak kapalı** (ödendi, verilmedi).
 * - Anasayfa Vitrini: bayrak kapalı + planlı kayıt → tutarlı (henüz başlamadı).
 * - Kategoride Öne Çıkan: bayrak açık + iptal edilmiş kayıt → **karşılıksız**.
 */
const KARISIK = {
  flags: bayraklar(PromotionType.Featured, PromotionType.Urgent, PromotionType.CategoryFeatured),
  promotions: [
    promosyon(PromotionType.Featured, PromotionStatus.Active),
    promosyon(PromotionType.Urgent, PromotionStatus.Expired, {
      purchasedAt: AN.haziranAlim,
      startsAt: AN.haziranAlim,
      endsAt: AN.haziranBitis,
    }),
    promosyon(PromotionType.Showcase, PromotionStatus.Active),
    promosyon(PromotionType.HomepageShowcase, PromotionStatus.Scheduled, {
      startsAt: AN.agustosBaslangic,
      endsAt: AN.agustosBitis,
    }),
    promosyon(PromotionType.CategoryFeatured, PromotionStatus.Cancelled, {
      source: 'manualAdmin',
      activatedByAdminId: 'a1f0c2d4-0000-4000-8000-000000000002',
    }),
  ],
}

/**
 * `editable` kontrollü: panel kendi durumunu tutmaz, `onChange` **tüm** nesneyi
 * verir. Story'nin state'i burada sunucunun yerine geçiyor.
 */
function DuzenlenebilirOrnek({
  variant,
  baslangic,
  promotions,
}: {
  variant: (typeof VARYANTLAR)[number]
  baslangic: PromotionFlags
  promotions: ListingPromotion[]
}) {
  const [flags, setFlags] = useState<PromotionFlags>(baslangic)

  return (
    <PromotionFlagsPanel
      flags={flags}
      promotions={promotions}
      variant={variant}
      editable
      onChange={setFlags}
    />
  )
}

/**
 * Düzenlenebilir story'lerin ortak `render`'ı.
 *
 * `variant` args'tan okunuyor ki Controls paneli yalan söylemesin: `render`
 * içinde sabitlenseydi kullanıcı radyo düğmesini çevirir ve hiçbir şey olmazdı.
 * `args.variant` meta'da her zaman dolu ama tipi opsiyonel — panelin kendi
 * varsayılanıyla aynı değere düşülüyor.
 */
const duzenlenebilirRender = (args: PromotionFlagsPanelProps) => (
  <DuzenlenebilirOrnek
    variant={args.variant ?? 'badges'}
    baslangic={args.flags}
    promotions={args.promotions}
  />
)

const meta = {
  title: 'Composites/PromotionFlagsPanel',
  component: PromotionFlagsPanel,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'İki kaynağı **yüzleştirir**: `flags` ilanın şu anda ne gösterdiğini, `promotions` bunun neden ' +
          'böyle olduğunu söyler. Brifing 1.1 ikisinin tutarlı olmasını şart koşuyor — yani tutarsızlık ' +
          'bir hatadır ve panel onu gizlemek yerine görünür kılar; sessizce birini seçmek hatayı ' +
          'görebilecek tek ekrandan silerdi. Çelişkinin yönü ayrıca **cümleyle** söylenir: süresi dolmuş ' +
          'kaydı olan açık bayrak ("Karşılıksız") bedava dağıtılan görünürlüktür, aktif kaydı olan kapalı ' +
          'bayrak ("Bayrak kapalı") ödenip verilmeyen görünürlük — biri faturanın, diğeri desteğin işi. ' +
          '`editable` yetki kapısı değildir: `promotion:manage` izni olmayana düzenlenebilir hâl hiç ' +
          'render edilmez.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'data-panel',
      useWhen: [
        'İlan listesinde veya kart üstünde açık dopingler rozetle gösterilecekse (`badges`)',
        'İlan detayında promosyonların tarihi, kaynağı ve tutarlılığı denetlenecekse (`cards`, `table`)',
        'promotion:manage yetkisi olan kullanıcı bayrakları değiştirecekse (`editable` + `onChange`)',
      ],
      doNotUseWhen: [
        'İlanın moderasyon durumu gösterilecekse — StatusBadge kullanın',
        'Promosyon satın alma veya kayıt oluşturma akışı için — panel kayıt üretmez, yalnız gösterir',
        'Yetkisiz kullanıcıya düzenlemeyi kapatmak için — `editable={false}` değil, düzenlenebilir hâli hiç render etmeyin',
      ],
    },
  },

  args: {
    flags: AKTIF.flags,
    promotions: AKTIF.promotions,
    variant: 'badges',
    editable: false,
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    editable: { control: 'boolean' },
    flags: { control: false },
    promotions: { control: false },
    onChange: { control: false },
  },

  /*
    `onChange` meta.args'a `fn()` ile konmuyor: handler'ın **yokluğu bir durum**
    (EditableWithoutOnChange). exactOptionalPropertyTypes açıkken meta'daki
    `fn()` prop'u `Mock`'a sabitler ve o story `onChange: undefined` yazamaz
    (TS2375). İhtiyacı olan story kendi veriyor.
  */
} satisfies Meta<typeof PromotionFlagsPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/* ── Görsel varyantlar ── */

/** Rozetler: "şu an ne açık?" İlan satırında ve kart üstünde. */
export const Badges: Story = {
  args: { variant: 'badges', ...KARISIK },
}

/** Kartlar: "bu dopingin hikâyesi ne?" Tarih ve kaynak da görünür. */
export const Cards: Story = {
  args: { variant: 'cards', ...KARISIK },
}

/** Tablo: "hepsi ne durumda?" Beş dopingin tamamı, tarihleri ve kaynağıyla. */
export const Table: Story = {
  args: { variant: 'table', ...KARISIK },
}

/* ── Veri state'leri ── */

/*
  `Loading` ve `Error` story'si yok: sözleşmede `loading`/`error` prop'u yok.
  Panel veri çekmez ve ilan detayının yükleme/hata durumu sayfanın (`AsyncState`)
  işidir — panelin kendi iskeletini uydurması, veri gelmediğinde "promosyon yok"
  demekle aynı yalanı söylerdi.
*/

/**
 * `cards` boşken `EmptyState` verir: detay sayfasında sessizlik "promosyon yok"
 * ile "veri gelmedi"yi ayırt ettirmez.
 */
export const Empty: Story = {
  args: { variant: 'cards', ...YOK },
}

/** Gerçek fixture: `residentialPublishedApartment` — Featured + CategoryFeatured. */
export const FromListingFixture: Story = {
  args: {
    flags: residentialPublishedApartment.promotionFlags,
    promotions: residentialPublishedApartment.promotions,
    variant: 'cards',
  },
}

/* ── Etkileşim ── */

/** Düzenleme kipinde beş dopingin de anahtarı var: kapalıyı açmanın yolu olmalı. */
export const Editable: Story = {
  args: { variant: 'badges', editable: true, ...AKTIF },
  render: duzenlenebilirRender,
}

export const EditableCards: Story = {
  args: { variant: 'cards', editable: true, ...KARISIK },
  render: duzenlenebilirRender,
}

/** Tabloda ad sütunu anahtarın kendisi; ayrı "Bayrak" sütunu yok. */
export const EditableTable: Story = {
  args: { variant: 'table', editable: true, ...KARISIK },
  render: duzenlenebilirRender,
}

/** Salt okunur: hiç anahtar yok, yalnız okunacak bilgi var. */
export const ReadOnly: Story = {
  args: { variant: 'table', editable: false, ...KARISIK },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryAllByRole('switch')).toHaveLength(0)
    // Bayrak salt okunur kipte kendi sütununda: üç açık, iki kapalı.
    await expect(canvas.getAllByText('Açık')).toHaveLength(3)
    await expect(canvas.getAllByText('Kapalı')).toHaveLength(2)
  },
}

/**
 * `editable` var ama `onChange` yok: anahtar gösterilmez.
 *
 * Çevrildiğinde hiçbir şey olmayan bir Switch, kapalı Switch'ten kötüdür —
 * kullanıcı ayarı değiştirdiğini sanıp ekrandan çıkar.
 */
export const EditableWithoutOnChange: Story = {
  args: { variant: 'cards', editable: true, ...KARISIK },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryAllByRole('switch')).toHaveLength(0)
    // Panel susmuyor, yalnız düzenletmiyor: salt okunur gösterim yerinde.
    await expect(canvas.getByText('Öne Çıkan')).toBeInTheDocument()
  },
}

/* ── Domain state'leri ── */

/** `none` + `badges`: gösterilecek doping yok, panel hiç render edilmez. */
export const NoneBadges: Story = {
  args: { variant: 'badges', ...YOK },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('list')).not.toBeInTheDocument()
    await expect(canvasElement.textContent?.trim()).toBe('')
  },
}

/** `none` + `table`: matris hiç boşalmaz — kapalı olanı göstermek de bilgidir. */
export const NoneTable: Story = {
  args: { variant: 'table', ...YOK },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByText('Kapalı')).toHaveLength(5)
    await expect(canvas.getAllByText('Kayıt yok')).toHaveLength(5)
  },
}

/** `active`: bayrak ve kayıt aynı şeyi söylüyor — uyarı yok. */
export const Active: Story = {
  args: { variant: 'cards', ...AKTIF },
}

/** `scheduled`: kayıt var, henüz başlamadı; bayrak kapalı olduğu için tutarlı. */
export const Scheduled: Story = {
  args: { variant: 'cards', ...PLANLI },
}

/** `expired`: süresi dolmuş kayıt, bayrak kapatılmış. Geçmiş, hata değil. */
export const Expired: Story = {
  args: { variant: 'cards', ...SURESI_DOLMUS },
}

/**
 * Süresi dolmuş ve bayrağı kapatılmış doping `badges`'te görünmez: rozetler
 * "şu an ne açık?" sorusunun cevabı, geçmişin değil.
 */
export const ExpiredBadgesShowNothing: Story = {
  args: { variant: 'badges', ...SURESI_DOLMUS },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent?.trim()).toBe('')
  },
}

/** Çelişki: bayrak açık, kaydın süresi dolmuş. Bedava dağıtılan görünürlük. */
export const ContradictionUnbackedFlag: Story = {
  args: { variant: 'cards', ...CELISKI_KARSILIKSIZ },
}

/** Çelişki: aktif kayıt var, bayrak kapalı. Ödenip verilmeyen görünürlük. */
export const ContradictionUnappliedPromotion: Story = {
  args: { variant: 'cards', ...CELISKI_YANSIMAMIS },
}

/** Elle açılmış vitrin: `activatedByAdminId` denetimin tek ipucu. */
export const ManualAdminSource: Story = {
  args: { variant: 'table', ...ELLE_ACILMIS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Aynı doping, iki farklı denetim konusu: biri elle açılmış, biri ödenmiş.
    await expect(canvas.getByText('Yönetici tanımladı')).toBeInTheDocument()
    await expect(
      canvas.getByText('Yönetici: a1f0c2d4-0000-4000-8000-000000000001'),
    ).toBeInTheDocument()
    await expect(canvas.getAllByText('Satın alındı').length).toBeGreaterThan(0)
  },
}

/** Aynı tipten iki kayıt: yürürlükteki gösterilir, eskisi sayılır. */
export const MultipleRecordsPerType: Story = {
  args: { variant: 'table', ...COKLU_KAYIT },
}

/* ── Ölçümler ── */

/**
 * Çelişki `badges`'te de görünmeli.
 *
 * Rozet ilan satırındaki tek kanal: çelişki yalnız kartlarda söylenirse
 * listedeki karşılıksız bayrak hiç fark edilmez.
 */
export const ContradictionIsVisibleInBadges: Story = {
  args: { variant: 'badges', ...CELISKI_KARSILIKSIZ },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Öne Çıkan · Karşılıksız')).toBeInTheDocument()
  },
}

/**
 * İki çelişki iki **farklı** cümleyle söylenmeli.
 *
 * İkisi de turuncu; ayrımı renge bırakmak "hangi yönde bozuk?" sorusunu
 * cevapsız bırakırdı — biri parayı, diğeri müşteriyi ilgilendiriyor.
 */
export const BothContradictionsAreNamed: Story = {
  args: { variant: 'cards', ...KARISIK },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Acil: bayrak açık, kaydın süresi dolmuş.
    await expect(canvas.getByText(/kaydın durumu "Süresi Doldu"/)).toBeInTheDocument()
    // Kategoride Öne Çıkan: bayrak açık, kayıt iptal edilmiş. Aynı çelişki,
    // farklı sebep — cümle sebebi de söylüyor.
    await expect(canvas.getByText(/kaydın durumu "İptal Edildi"/)).toBeInTheDocument()
    // Vitrin: aktif kayıt var ama bayrak kapalı — ters yöndeki çelişki.
    await expect(
      canvas.getByText(/Aktif promosyon kaydı var ama bayrak kapalı/),
    ).toBeInTheDocument()
  },
}

/** Tutarlı satırda uyarı çıkmamalı — her turuncu bir hata iddiasıdır. */
export const ConsistentRowsHaveNoWarning: Story = {
  args: { variant: 'cards', ...AKTIF },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByText(/Bayrak açık ama/)).not.toBeInTheDocument()
    await expect(canvas.queryByText(/bayrak kapalı/)).not.toBeInTheDocument()
    await expect(canvas.getAllByText('Aktif')).toHaveLength(2)
  },
}

/**
 * Çelişki yalnız renkle anlatılmamalı.
 *
 * Brifingin kabul kriteri. Karşılıksız bayrak ile tutarlı bir "Planlandı" rozeti
 * aynı metni paylaşsaydı ikisini ayıran tek şey turuncu ton olurdu.
 */
export const ContradictionIsNotOnlyColor: Story = {
  args: { variant: 'badges', ...KARISIK },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Acil · Karşılıksız')).toBeInTheDocument()
    await expect(canvas.getByText('Kategoride Öne Çıkan · Karşılıksız')).toBeInTheDocument()
    await expect(canvas.getByText('Vitrin · Bayrak kapalı')).toBeInTheDocument()
    await expect(canvas.getByText('Anasayfa Vitrini · Planlandı')).toBeInTheDocument()
    // Tutarlı ve aktif olan yalnız adıyla görünür: sessizlik "sorun yok" demek.
    await expect(canvas.getByText('Öne Çıkan')).toBeInTheDocument()
  },
}

/** Etiketler domain'den gelmeli; panel kendi sözlüğünü kurmamalı. */
export const LabelsComeFromDomain: Story = {
  args: { variant: 'table', ...KARISIK },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // `PROMOTION_TYPE_LABEL` — "Kategori öne çıkan" değil.
    await expect(canvas.getByText('Kategoride Öne Çıkan')).toBeInTheDocument()
    // `PROMOTION_STATUS_LABEL` ve `PROMOTION_SOURCE_LABEL`.
    await expect(canvas.getByText('Süresi Doldu')).toBeInTheDocument()
    await expect(canvas.getByText('Yönetici tanımladı')).toBeInTheDocument()
  },
}

/**
 * Anahtarın erişilebilir adı yalnız dopingin adı olmalı.
 *
 * Base UI Switch bir `<span role="switch">` render ediyor ve adını sarmalayan
 * `<label>`'dan `aria-labelledby` ile alıyor — ad, label'ın **tüm** metninden
 * hesaplanır. Kayıt özeti Switch'in `description`'ına konsaydı ad "Öne Çıkan"
 * değil "Öne Çıkan Aktif · Satın alındı · Bitiş: 24 Tem 2026 09:00" olurdu ve
 * veri değiştikçe değişirdi. Özet bu yüzden anahtarın yanında duruyor.
 */
export const SwitchNameIsJustTheLabel: Story = {
  args: { variant: 'badges', editable: true, ...KARISIK },
  render: duzenlenebilirRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (const ad of ['Öne Çıkan', 'Acil', 'Vitrin', 'Anasayfa Vitrini', 'Kategoride Öne Çıkan']) {
      await expect(canvas.getByRole('switch', { name: ad })).toBeInTheDocument()
    }

    // Özet yine ekranda — yalnız adın içinde değil.
    await expect(canvas.getAllByText(/Satın alındı/).length).toBeGreaterThan(0)
  },
}

/**
 * `onChange` tek alanı değil **tüm** `PromotionFlags` nesnesini almalı.
 *
 * Sözleşme bunu söylüyor; yalnız değişen alanı vermek her çağıranı birleştirmeye
 * zorlardı. Kapalı bir bayrağı açmak diğer dördünü olduğu gibi geçirmeli.
 */
export const ToggleSendsWholeFlagsObject: Story = {
  args: { variant: 'badges', editable: true, ...AKTIF, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('switch', { name: 'Acil' }))

    await expect(args.onChange).toHaveBeenCalledWith({
      oneCikan: true,
      acil: true,
      vitrin: false,
      anasayfaVitrini: false,
      kategoriOneCikan: true,
    })
  },
}

/** Açık bir bayrağı kapatmak da aynı sözleşmeden geçer. */
export const ToggleOffSendsWholeFlagsObject: Story = {
  args: { variant: 'badges', editable: true, ...AKTIF, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('switch', { name: 'Öne Çıkan' }))

    await expect(args.onChange).toHaveBeenCalledWith({
      oneCikan: false,
      acil: false,
      vitrin: false,
      anasayfaVitrini: false,
      kategoriOneCikan: true,
    })
  },
}

/**
 * Düzenleme kipi kapsamı daraltmamalı.
 *
 * `badges` salt okunurken yalnız açık olanları gösteriyor; aynı filtre düzenleme
 * kipinde de uygulansaydı kapalı bir dopingi açmanın yolu kalmazdı.
 */
export const EditableShowsEveryPromotion: Story = {
  args: { variant: 'badges', editable: true, ...AKTIF },
  render: duzenlenebilirRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByRole('switch')).toHaveLength(5)
    // Kaydı hiç olmayan doping de çevrilebilir olmalı.
    await expect(canvas.getByRole('switch', { name: 'Vitrin' })).toBeInTheDocument()
    await expect(canvas.getAllByText('Promosyon kaydı yok.')).toHaveLength(3)
  },
}

/**
 * Sıra `promotions` dizisinden değil sabit `SIRA`'dan gelmeli.
 *
 * Kayıtlar burada ters sırayla veriliyor; panel yine de Öne Çıkan → Acil →
 * Vitrin → Anasayfa Vitrini → Kategoride Öne Çıkan sırasını korumalı. Sıra veriye
 * bırakılsaydı aynı doping iki ilanda iki farklı yerde görünürdü.
 */
export const OrderIsStableRegardlessOfInput: Story = {
  args: {
    variant: 'table',
    flags: bayraklar(),
    promotions: [...KARISIK.promotions].reverse(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // İlk satır başlık; dopingler onun altında. `noUncheckedIndexedAccess`
    // yüzünden tek tek indekslemek yerine ad sütununu topluca okuyoruz.
    const adlar = canvas
      .getAllByRole('row')
      .slice(1)
      .map((satir) => satir.querySelector('td')?.textContent?.trim() ?? '')

    await expect(adlar).toEqual([
      'Öne Çıkan',
      'Acil',
      'Vitrin',
      'Anasayfa Vitrini',
      'Kategoride Öne Çıkan',
    ])
  },
}

/**
 * Aynı tipten iki kayıtta yürürlükteki gösterilmeli.
 *
 * Haziranda bitmiş Vitrin ile temmuzda aktif Vitrin arasında bayrağı açıklayan
 * aktif olandır; süresi dolmuş olan "önceki kayıt" diye sayılır.
 */
export const GoverningRecordWins: Story = {
  args: { variant: 'table', ...COKLU_KAYIT },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Aktif')).toBeInTheDocument()
    await expect(canvas.getByText('+1 önceki kayıt')).toBeInTheDocument()
    // Yürürlükteki kayıt temmuzunki: haziran bitişi tabloda görünmemeli.
    await expect(canvas.queryByText('15 Haz 2026 09:00')).not.toBeInTheDocument()
    await expect(canvas.getByText('24 Tem 2026 09:00')).toBeInTheDocument()
  },
}

/** Tarihler mutlak ve İstanbul saatinde; göreli zaman yok. */
export const DatesAreAbsolute: Story = {
  args: { variant: 'cards', ...AKTIF },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByText('10 Tem 2026 09:00').length).toBeGreaterThan(0)
    await expect(canvas.queryByText(/önce$/)).not.toBeInTheDocument()
  },
}

/** Uzun içerik: beş doping, uzun uyarı cümleleri, uzun yönetici kimliği. */
export const LongContent: Story = {
  args: {
    variant: 'cards',
    flags: bayraklar(
      PromotionType.Featured,
      PromotionType.Urgent,
      PromotionType.Showcase,
      PromotionType.HomepageShowcase,
      PromotionType.CategoryFeatured,
    ),
    promotions: [
      promosyon(PromotionType.Featured, PromotionStatus.Expired, {
        source: 'manualAdmin',
        activatedByAdminId: 'a1f0c2d4-9b8e-4c7a-8d6f-5e4b3a2c1d0e',
      }),
      promosyon(PromotionType.Urgent, PromotionStatus.Cancelled),
      promosyon(PromotionType.Showcase, PromotionStatus.Scheduled, {
        startsAt: AN.agustosBaslangic,
        endsAt: AN.agustosBitis,
      }),
    ],
  },
}

/** Dar ekranda kartlar tek kolona iner. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'cards', ...KARISIK },
}

/** Dar ekranda tablo yatay kayar: sütunların kendisi bilgi, karta indirgenmez. */
export const MobileTable: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'table', ...KARISIK },
}

export const VariantsComparison: Story = {
  args: { ...KARISIK },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <PromotionFlagsPanel {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
