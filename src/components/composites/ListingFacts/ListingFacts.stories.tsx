import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import type { LandListing, ResidentialListing } from '../../../types/domain'
import {
  buildingExpiredComplete,
  commercialChangesRequestedOffice,
  landDraftResidentialZoned,
  landRejectedField,
  residentialPendingVilla,
  residentialPublishedApartment,
  timesharePendingThermal,
  timesharePublishedBodrum,
  tourismPublishedBoutiqueHotel,
  tourismRejectedPension,
} from '../../../fixtures'
import { ListingFacts } from './ListingFacts'

const VARYANTLAR = ['sections', 'definitionList', 'comparison'] as const

/**
 * Kadıköy dairesinin ikinci revizyonu: fixture'ın kendisi, yalnız revizyon
 * numarası ve güncellenme anı ileri alınmış.
 */
const KADIKOY_YENI: ResidentialListing = {
  ...residentialPublishedApartment,
  revision: 2,
  updatedAt: '2026-07-14T11:20:00+03:00',
}

/**
 * Aynı ilanın birinci revizyonu.
 *
 * Beş alan bilerek farklı: fiyat, açıklama, net m², eşyalı ve site bilgisi.
 * Site bilgisi **kalkmış** (önce "Yalı Konakları", sonra yok) — `comparison`'ın
 * bir alanın silinmesini de gösterebildiğini ölçmek için. `updatedAt` de
 * farklı ama vurgulanmıyor: panelin farkı kendi hesaplamadığının kanıtı.
 */
const KADIKOY_ONCEKI: ResidentialListing = {
  ...residentialPublishedApartment,
  revision: 1,
  updatedAt: '2026-07-10T12:05:00+03:00',
  description: "Kadıköy Caferağa'da 3+1 daire. Detaylı bilgi için ilan sahibine ulaşınız.",
  price: { ...residentialPublishedApartment.price, amount: 17_250_000 },
  attributes: {
    ...residentialPublishedApartment.attributes,
    netSquareMeters: 132,
    furnished: true,
    inComplex: true,
    complexName: 'Yalı Konakları',
  },
}

/** Sayfanın "maddi değişiklik" kararı; panel bunu hesaplamaz, alır. */
const KADIKOY_MADDI_DEGISIKLIKLER = [
  'price',
  'description',
  'attributes.netSquareMeters',
  'attributes.furnished',
  'attributes.inComplex',
  'attributes.complexName',
]

/**
 * Kategorisi değişmiş ilan: konut → arsa.
 *
 * Brifing 1.1 kategoriyi maddi değişiklik sayıyor, yani gerçekten olabiliyor.
 * İki tarafın öznitelik anahtarları hiç örtüşmez; panel bunu anahtar
 * eşlemesiyle çözüyor, özel bir dalla değil.
 */
const KATEGORI_YENI: LandListing = {
  ...landDraftResidentialZoned,
  id: residentialPendingVilla.id,
  listingNo: residentialPendingVilla.listingNo,
  revision: 2,
}

/** Uzun başlık, uzun açıklama, çok etiket ve uzun site adı bir arada. */
const UZUN_ICERIK: ResidentialListing = {
  ...residentialPendingVilla,
  title:
    'Büyükçekmece Mimaroba Mevkiinde Denize Sıfır Konumda, Özel Havuzlu ve Geniş Bahçeli, Akıllı Ev Sistemleriyle Donatılmış Müstakil Lüks Villa',
  description:
    'Mimaroba sahil bandında, kendi parselinde konumlanan villa iki katlı olarak inşa edilmiştir. Giriş katında salon, amerikan mutfak, ebeveyn banyolu yatak odası ve misafir tuvaleti; üst katta üç yatak odası, iki banyo ve deniz manzaralı geniş teras bulunmaktadır. Bahçede özel yüzme havuzu, kapalı otopark alanı ve otomatik sulama sistemi mevcuttur. Isıtma yerden ısıtma sistemiyle sağlanmaktadır. Yapı ruhsatı ve iskânı tamdır; tapu kat mülkiyetlidir. Tesisat ve elektrik altyapısı 2024 yılında tamamen yenilenmiştir.',
  tags: [
    'yüksekDeğer',
    'denizeSıfır',
    'havuzlu',
    'akıllıEv',
    'yeniBaşvuru',
    'belgeKontrolü',
    'öncelikliİnceleme',
    'kurumsalSatıcı',
  ],
  attributes: {
    ...residentialPendingVilla.attributes,
    inComplex: true,
    complexName: 'Mimaroba Deniz Konakları Özel Güvenlikli Villa Sitesi Etap 2',
  },
}

const meta = {
  title: 'Composites/ListingFacts',
  component: ListingFacts,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`Listing` ayrık bir birleşim ve panelin bütün işi onu doğru daraltmak: `switch (listing.category)` ' +
          '`attributes`\'ı da daraltıyor, `as` cast\'i yok — arsanın "İmar Durumu"nu konut ilanında göstermek ' +
          'derleme aşamasında imkânsız. Öznitelik değerleri `satisfies Record<keyof XAttributes, Deger>` ile ' +
          "yazıldı: domain'e yeni bir alan eklenirse panel derlenmez, sessizce atlamaz. **Farkı panel " +
          "hesaplamaz** — hangi değişikliğin maddi olduğu bir iş kuralıdır ve domain'e aittir; " +
          '`comparison` iki değeri yan yana koyar, vurgu yalnız `highlightedFields` ile gelir. ' +
          'Konum, fotoğraf, satıcı ve moderasyon burada tekrarlanmaz; brifing 2.5 onları kendi panellerine vermiş.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'data-panel',
      useWhen: [
        'İlan detayında kategoriye özel öznitelikler ve ortak alanlar tablo hâlinde gösterilecekse',
        'İki revizyon arasındaki değerler yan yana karşılaştırılacaksa (`comparison`)',
        'Dar bir yan panelde ilanın alanları özetlenecekse (`definitionList`)',
      ],
      doNotUseWhen: [
        'Konum, satıcı, fotoğraf, promosyon veya moderasyon gösterilecekse — LocationPanel, SellerPanel, ImageGallery, PromotionFlagsPanel, ModerationHistory kullanın',
        'Alanlar düzenlenecekse — bu panel yalnız okur, form değildir',
        'Hangi alanın değiştiğini bulmak gerekiyorsa — panel farkı hesaplamaz, `highlightedFields` ile söylenir',
        'İlan listesindeki kart özeti için — ListingCard kullanın',
      ],
    },
  },

  args: {
    listing: residentialPublishedApartment,
    variant: 'sections',
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    listing: { control: false },
    previousListing: { control: false },
    highlightedFields: { control: 'object' },
  },
} satisfies Meta<typeof ListingFacts>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Konu başlıklarına gruplanmış ızgara. İlan detayının ana gövdesi. */
export const Sections: Story = {
  args: { variant: 'sections' },
}

/** Sıkışık `<dl>`; başlıksız ve tek kolon. Yan panelde ve dar kolonda. */
export const DefinitionList: Story = {
  args: { variant: 'definitionList' },
}

/** İki revizyon yan yana. Moderatörün sorusu "ilan ne" değil "ne değişti". */
export const Comparison: Story = {
  args: {
    variant: 'comparison',
    listing: KADIKOY_YENI,
    previousListing: KADIKOY_ONCEKI,
    highlightedFields: KADIKOY_MADDI_DEGISIKLIKLER,
  },
}

/** `previousListing` yoksa `comparison` tek sütuna düşer; çökmez, boş kalmaz. */
export const ComparisonWithoutPrevious: Story = {
  args: { variant: 'comparison' },
}

/** Konut: oda sayısı, bina yaşı, aidat, krediye uygunluk. */
export const Residential: Story = {
  args: { listing: residentialPublishedApartment },
}

/** Arsa: imar durumu, ada/parsel/pafta, KAKS, gabari, altyapı. */
export const Land: Story = {
  args: { listing: landDraftResidentialZoned },
}

/** İşyeri: açık plan oda sayısı, depozito, yapının durumu. */
export const Commercial: Story = {
  args: { listing: commercialChangesRequestedOffice },
}

/** Bina: bağımsız bölüm sayısı, yapı kullanım izni, kira getirisi. */
export const Building: Story = {
  args: { listing: buildingExpiredComplete },
}

/** Devremülk: tesis adı, kullanım dönemi, sezon, yıllık aidat. */
export const Timeshare: Story = {
  args: { listing: timesharePublishedBodrum },
}

/** Turistik tesis: yatak sayısı, yıldız, ruhsatlar, sahile uzaklık, ciro. */
export const TourismFacility: Story = {
  args: { listing: tourismPublishedBoutiqueHotel },
}

/**
 * Opsiyonel alanları boş ilan.
 *
 * Pansiyonun yıldızı ve cirosu yok; reddedildiği için yayın ve bitiş tarihi de
 * yok. Satırlar duruyor ve `—` gösteriyor: boşluk moderatör için bir bulgudur,
 * satırı gizlemek onu görünmez yapardı.
 */
export const MissingOptionalValues: Story = {
  args: { listing: tourismRejectedPension },
}

/** Arsada pafta, KAKS ve gabari girilmemiş — imar incelemesinin ilk sorusu. */
export const MissingOptionalValuesLand: Story = {
  args: { listing: landRejectedField },
}

/** Değişen alanlar `sections`'ta da işaretlenir; `comparison` şart değil. */
export const ChangedFields: Story = {
  args: {
    listing: KADIKOY_YENI,
    highlightedFields: KADIKOY_MADDI_DEGISIKLIKLER,
  },
}

/**
 * Kategori değişmiş: konut → arsa.
 *
 * Öznitelik anahtarları hiç örtüşmüyor; konutun alanları `→ —`, arsanınkiler
 * `— →` olarak çıkıyor. Neden olduğunu "Kategori" satırı söylüyor.
 */
export const ComparisonCategoryChanged: Story = {
  args: {
    variant: 'comparison',
    listing: KATEGORI_YENI,
    previousListing: residentialPendingVilla,
    highlightedFields: ['category', 'subCategory', 'transactionType', 'price'],
  },
}

/** Devremülkte değişim programı yok; devremülk alanlarının tamamı görünür. */
export const TimeshareMissingExchangeProgram: Story = {
  args: { listing: timesharePendingThermal },
}

/** Uzun başlık, uzun açıklama ve sekiz etiket ızgarayı taşırmamalı. */
export const LongContent: Story = {
  args: { listing: UZUN_ICERIK },
}

/** Aynı uzun içerik dar `<dl>`'de: etiket sütunu ezilmemeli. */
export const LongContentDefinitionList: Story = {
  args: { variant: 'definitionList', listing: UZUN_ICERIK },
}

/** 320 pikselde ızgara tek kolona iner. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { listing: UZUN_ICERIK },
}

/** Dar ekranda üç sütunlu karşılaştırma; sayfa değil tablo yatay kaymalı. */
export const MobileComparison: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    variant: 'comparison',
    listing: KADIKOY_YENI,
    previousListing: KADIKOY_ONCEKI,
    highlightedFields: KADIKOY_MADDI_DEGISIKLIKLER,
  },
}

/**
 * Birleşim daraltması ekranda da görünmeli.
 *
 * Konut ilanı arsa alanlarını göstermez. Derleyici bunu zaten engelliyor ama
 * ölçüm ucuz: `bolumler()` yanlış kurgulanırsa (örneğin bütün sözlükler
 * birleştirilirse) tip hatası çıkmadan alanlar sızabilir.
 */
export const ResidentialDoesNotShowLandFields: Story = {
  args: { listing: residentialPublishedApartment },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Oda Sayısı')).toBeInTheDocument()
    await expect(canvas.getByText('Krediye Uygunluk')).toBeInTheDocument()

    await expect(canvas.queryByText('İmar Durumu')).not.toBeInTheDocument()
    await expect(canvas.queryByText('KAKS')).not.toBeInTheDocument()
    await expect(canvas.queryByText('Bağımsız Bölüm Sayısı')).not.toBeInTheDocument()
  },
}

/** Aynı kapı ters yönde: arsa ilanı konutun alanlarını göstermez. */
export const LandDoesNotShowResidentialFields: Story = {
  args: { listing: landDraftResidentialZoned },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('İmar Durumu')).toBeInTheDocument()
    await expect(canvas.getByText('Pafta')).toBeInTheDocument()

    await expect(canvas.queryByText('Oda Sayısı')).not.toBeInTheDocument()
    await expect(canvas.queryByText('Balkon')).not.toBeInTheDocument()
    await expect(canvas.queryByText('Aidat')).not.toBeInTheDocument()
  },
}

/**
 * Etiketler `domain/labels.ts`'ten gelmeli — alan adı da, değer de.
 *
 * `roomCount: 'acikPlan'` ham basılsaydı ekranda kod görünürdü; `COMMERCIAL_OPEN_PLAN_LABEL`
 * bunun için var.
 */
export const LabelsComeFromDomain: Story = {
  args: { listing: commercialChangesRequestedOffice },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Yapının Durumu')).toBeInTheDocument()
    await expect(canvas.getByText('Açık Plan')).toBeInTheDocument()
    await expect(canvas.getByText('Merkezi')).toBeInTheDocument()
    await expect(canvas.getByText('İkinci El')).toBeInTheDocument()

    await expect(canvas.queryByText('acikPlan')).not.toBeInTheDocument()
  },
}

/**
 * Panel yalnız sahibi olduğu alanları gösterir.
 *
 * Konum, satıcı ve metrikler brifing 2.5'te kendi panellerinde. "Sunulmamalı"
 * iddiası ölçülmeden bırakılmaz — bir `bolumler()` düzenlemesi bunları sessizce
 * geri getirebilir.
 */
export const DoesNotDuplicateOtherPanels: Story = {
  args: { listing: residentialPublishedApartment },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.queryByText(residentialPublishedApartment.seller.displayName),
    ).not.toBeInTheDocument()
    await expect(
      canvas.queryByText(residentialPublishedApartment.contact.phone),
    ).not.toBeInTheDocument()
    await expect(canvas.queryByText(residentialPublishedApartment.id)).not.toBeInTheDocument()
    /* 1.842 görüntülenme — metrikler bu panelin işi değil. */
    await expect(canvas.queryByText('1.842')).not.toBeInTheDocument()
  },
}

/**
 * Değeri olmayan alan ekran okuyucuya "Belirtilmemiş" der.
 *
 * Tire tek başına yetmez: ekran okuyucular `—`'yi ya "em dash" der ya hiç
 * okumaz. Tirenin `aria-hidden` olduğunu ve her tirenin bir metin karşılığı
 * bulunduğunu ölçüyoruz — sayılar eşit değilse biri sessiz kalmış demektir.
 */
export const MissingValueIsAnnounced: Story = {
  args: { listing: tourismRejectedPension },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const metinler = canvas.getAllByText('Belirtilmemiş')
    await expect(metinler.length).toBeGreaterThanOrEqual(2)

    const tireler = canvasElement.querySelectorAll('span[aria-hidden="true"]')
    await expect(tireler).toHaveLength(metinler.length)

    /* Yıldızı olmayan tesiste satır silinmiyor, duruyor. */
    await expect(canvas.getByText('Yıldız Sayısı')).toBeInTheDocument()
  },
}

/**
 * Vurgu yalnız renk değil.
 *
 * Vurgulanan alanın erişilebilir adı rozeti de içeriyor ("Fiyat Değişti");
 * vurgulanmayanınki içermiyor. Aynı test panelin **farkı hesaplamadığını** da
 * ölçüyor: `updatedAt` iki revizyonda gerçekten farklı ama
 * `highlightedFields`'te olmadığı için işaretlenmiyor.
 */
export const HighlightIsNotOnlyColor: Story = {
  args: {
    variant: 'comparison',
    listing: KADIKOY_YENI,
    previousListing: KADIKOY_ONCEKI,
    highlightedFields: KADIKOY_MADDI_DEGISIKLIKLER,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByText('Değişti')).toHaveLength(KADIKOY_MADDI_DEGISIKLIKLER.length)
    await expect(canvas.getByRole('rowheader', { name: 'Fiyat Değişti' })).toBeInTheDocument()

    /* Değeri değişmiş ama "maddi" denmemiş alan işaretsiz kalır. */
    await expect(canvas.getByRole('rowheader', { name: 'Güncellenme Tarihi' })).toBeInTheDocument()
  },
}

/** Karşılaştırma iki revizyonu da göstermeli; eskisi kaybolmamalı. */
export const ComparisonShowsBothRevisions: Story = {
  args: {
    variant: 'comparison',
    listing: KADIKOY_YENI,
    previousListing: KADIKOY_ONCEKI,
    highlightedFields: KADIKOY_MADDI_DEGISIKLIKLER,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('17.250.000 ₺ (pazarlıklı)')).toBeInTheDocument()
    await expect(canvas.getByText('18.750.000 ₺ (pazarlıklı)')).toBeInTheDocument()

    /* Kalkan alan: önce site adı vardı, şimdi yok. */
    await expect(canvas.getByText('Yalı Konakları')).toBeInTheDocument()
    await expect(canvas.getByRole('rowheader', { name: 'Site Adı Değişti' })).toBeInTheDocument()
  },
}

/** `previousListing` yokken karşılaştırma çökmemeli, bölümlere düşmeli. */
export const ComparisonWithoutPreviousFallsBack: Story = {
  args: { variant: 'comparison', listing: residentialPublishedApartment },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('table')).not.toBeInTheDocument()
    await expect(canvas.getByRole('heading', { name: 'İlan Bilgileri' })).toBeInTheDocument()
    await expect(canvas.getByText('Brüt m²')).toBeInTheDocument()
  },
}

/**
 * Kategori değişince iki tarafın alanları da görünmeli.
 *
 * Konutun "Oda Sayısı"nın eski değeri de, arsanın "İmar Durumu"nun yeni değeri
 * de tabloda olmalı — biri kaybolursa moderatör neyin gittiğini göremez.
 */
export const CategoryChangeKeepsBothSides: Story = {
  args: {
    variant: 'comparison',
    listing: KATEGORI_YENI,
    previousListing: residentialPendingVilla,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Konutun oda sayısı yalnız eski revizyonda var; satırı kalmalı. */
    await expect(canvas.getByRole('rowheader', { name: 'Oda Sayısı' })).toBeInTheDocument()
    await expect(canvas.getByText('5+1')).toBeInTheDocument()

    /* Arsanın imar durumu yalnız yeni revizyonda var. */
    await expect(canvas.getByRole('rowheader', { name: 'İmar Durumu' })).toBeInTheDocument()
    /* İki kez: alt kategori ("Konut İmarlı") ve imar durumu aynı metni üretiyor. */
    await expect(canvas.getAllByText('Konut İmarlı')).toHaveLength(2)
  },
}

/**
 * Tarih biçimi makineye göre değişmemeli: `tr-TR` + `Europe/Istanbul` sabit.
 *
 * `formatDateTime` olmasaydı bu satırlar UTC runner'da `09:05`, Los Angeles'ta
 * bir **gün önce** görünürdü.
 */
export const DatesAreDeterministic: Story = {
  args: { listing: residentialPublishedApartment },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Güncellenme ve yayın anı aynı; ilan tarihi ile oluşturulma anı da. */
    await expect(canvas.getAllByText('10 Tem 2026 12:05')).toHaveLength(2)
    await expect(canvas.getAllByText('10 Tem 2026 10:45')).toHaveLength(2)
    await expect(canvas.getByText('9 Ağu 2026 12:05')).toBeInTheDocument()
  },
}

export const VariantsComparison: Story = {
  args: {
    listing: KADIKOY_YENI,
    previousListing: KADIKOY_ONCEKI,
    highlightedFields: KADIKOY_MADDI_DEGISIKLIKLER,
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <ListingFacts {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
