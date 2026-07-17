import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import type { Coordinates, Listing, Location } from '../../../types/domain'
import { residentialPublishedApartment } from '../../../fixtures'
import { LocationPanel } from './LocationPanel'

const VARYANTLAR = ['summary', 'mapSplit', 'addressDetail'] as const

/**
 * Gerçek ilan fixture'ının koordinatı (`residentialPublishedApartment`).
 * Sabit — `Math.random`/`Date.now` yok, Chromatic her gün aynı kareyi görsün.
 */
const KOORDINAT: Coordinates = { latitude: 40.9888, longitude: 29.0277 }

/**
 * Uydurulmuş bir adres: gerçek bir kapı numarası story'ye girmez (aynı gerekçe
 * telefonları `555`, e-postaları `.invalid` yapıyor). "Örnek Sok." bunun
 * uydurma olduğunu okuyana da söyler.
 */
const ACIK_ADRES = 'Caferağa Mah. Örnek Sok. No: 12 D: 5'

/**
 * `coordinates` **dışarıda**: `Omit` sayesinde koordinatsız hâli
 * `coordinates: undefined` yazmadan kurabiliyoruz — `exactOptionalPropertyTypes`
 * açıkken o atama TS2375 verir, anahtarın hiç olmaması gerekir.
 */
const KADIKOY: Omit<Location, 'coordinates'> = {
  countryCode: 'TR',
  cityCode: '34',
  cityName: 'İstanbul',
  districtId: 'kadikoy',
  districtName: 'Kadıköy',
  neighborhoodId: 'caferaga',
  neighborhoodName: 'Caferağa',
  showExactLocation: false,
}

/** Sahip kesin konumu gizlemeyi seçti; adres ve koordinat dolu. Tipik hâl. */
const TERCIH_GIZLI: Location = {
  ...KADIKOY,
  addressLine: ACIK_ADRES,
  postalCode: '34710',
  coordinates: KOORDINAT,
}

/** Sahip kesin konumu yayınlamayı seçti: son kullanıcı da görüyor. */
const TERCIH_YAYINDA: Location = { ...TERCIH_GIZLI, showExactLocation: true }

/** Koordinat hiç girilmemiş: harita çizilecek nokta yok. */
const KOORDINATSIZ: Location = {
  ...KADIKOY,
  addressLine: ACIK_ADRES,
  postalCode: '34710',
}

/**
 * Açık adres ve posta kodu girilmemiş — `fixtures/listings.ts`'in **tamamının**
 * hâli: `createLocation` yalnız il/ilçe/mahalle ve koordinat üretiyor.
 */
const ADRESSIZ: Location = { ...KADIKOY, coordinates: KOORDINAT }

/**
 * Uzun adres + uzun mahalle adı: satırlar sarmalı, panel yatay kaydırmamalı.
 *
 * Başka bir il olduğu için `KADIKOY`'u spread etmiyor, alanları tek tek yazıyor
 * — `showExactLocation` dâhil. `false` seçildi: hem `KADIKOY`'un tipik hâliyle
 * aynı, hem de bu story'lerin `revealExactLocation: true`'suyla birleşince
 * ezilen tercih bandını çıkarıyor. Band uzun mahalle adını **ikinci kez**,
 * cümle içinde sarmalatıyor; sarmalanacak metni artırmak bu fixture'ın işi.
 */
const UZUN: Location = {
  countryCode: 'TR',
  cityCode: '07',
  cityName: 'Antalya',
  districtId: 'konyaalti',
  districtName: 'Konyaaltı',
  neighborhoodId: 'hurma-sehitler',
  neighborhoodName: 'Hurma Şehitler Anıtı Yeni Cumhuriyet',
  addressLine:
    'Hurma Şehitler Anıtı Yeni Cumhuriyet Mahallesi, Akdeniz Bulvarı ile Örnek Caddesi kesişimi, Deniz Manzaralı Villalar Sitesi B Blok, Kapı No: 128, Daire: 5 (site girişi Akdeniz Bulvarı tarafında, güvenlik kulübesinin arkasındaki ikinci yol)',
  postalCode: '07070',
  coordinates: { latitude: 36.8623, longitude: 30.6339 },
  showExactLocation: false,
}

/**
 * Konumu değiştirilmiş ilan. `residentialPublishedApartment` somut bir
 * `ResidentialListing`; birleşim (`Listing`) üzerinden değil ondan türetmek
 * spread'in tipini tek parçada tutuyor.
 */
function ilan(location: Location): Listing {
  return { ...residentialPublishedApartment, location }
}

const ILAN_TERCIH_GIZLI = ilan(TERCIH_GIZLI)
const ILAN_TERCIH_YAYINDA = ilan(TERCIH_YAYINDA)
const ILAN_KOORDINATSIZ = ilan(KOORDINATSIZ)
const ILAN_ADRESSIZ = ilan(ADRESSIZ)
const ILAN_UZUN = ilan(UZUN)

const meta = {
  title: 'Composites/LocationPanel',
  component: LocationPanel,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`location.showExactLocation` ilan sahibinin **son kullanıcıya** dair tercihidir (brifing 1.1); ' +
          '`revealExactLocation` ise moderatörün **bu paneldeki** yetkisidir. Panel ikisini birbirine ' +
          'bağlamaz — bağlasaydı "konum tutarlılığı" kontrolü doğrulanamazdı — ama tercihin ezildiğini ' +
          'açıkça söyler: moderatör, gördüğü adresin kamuya açık sayfada görünmediğini bilmeli. ' +
          'Kesin konum gizliyken yerine **mahallenin adı** konur; yuvarlanmış bir koordinat üretilmez ' +
          '(iki basamak hâlâ ~1,1 km yarıçapta binayı buldurur). Harita karosu çekilmez: ' +
          'çerçeve yer tutar, sağlayıcı seçilince içi dolacak.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'data-panel',
      useWhen: [
        'İlan detay veya inceleme ekranında konum özeti, açık adres ve koordinat gösterilecekse',
        'Moderatör "konum tutarlılığı" otomatik kontrolünün bulgusunu adresi okuyarak doğrulayacaksa',
        'Belge kontrolünde adres ve posta kodu kopyalanacaksa (`addressDetail`)',
      ],
      doNotUseWhen: [
        'Liste satırında yalnız ilçe/il yazılacaksa — ListingCard bunu zaten gösteriyor',
        'Konum düzenlenecekse — panel salt okunur, veri girişi yapmaz',
        'Yetkisiz kullanıcıdan adresi saklamak için — `revealExactLocation` bir yetki kapısı değil; ' +
          "yetkiye sayfa katmanı karar verir ve prop'u öyle geçer",
      ],
    },
  },

  args: {
    listing: ILAN_TERCIH_GIZLI,
    variant: 'summary',
    revealExactLocation: false,
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    revealExactLocation: { control: 'boolean' },
    listing: { control: false },
  },
} satisfies Meta<typeof LocationPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Liste satırı ve yan panel: mahalle, ilçe / il. Tek satır. */
export const Summary: Story = {
  args: { variant: 'summary' },
}

/** Solda harita alanı, sağda adres. Konum doğrulanırken geniş ekranda. */
export const MapSplit: Story = {
  args: { variant: 'mapSplit', revealExactLocation: true },
}

/** Belge kontrolü: bütün alanlar metin olarak, seçilip kopyalanabilir. */
export const AddressDetail: Story = {
  args: { variant: 'addressDetail', revealExactLocation: true },
}

/**
 * **Exact hidden.** Varsayılan hâl: kesin konum kişisel veriye yakındır,
 * istendiği an değil gerekçesi olduğunda açılır.
 */
export const ExactHidden: Story = {
  args: { variant: 'addressDetail', revealExactLocation: false },
}

/**
 * **Exact visible.** Moderatör açtı; sahip gizlemeyi seçmişti, bu yüzden bant
 * tercihin ezildiğini söylüyor.
 */
export const ExactVisible: Story = {
  args: { variant: 'addressDetail', revealExactLocation: true },
}

/**
 * **No coordinates.** Nokta yok: harita çerçevesi boş bir kutu değil, bir bulgu
 * gösterir — "konum tutarlılığı" kontrolü bu ilanda hiç çalışamaz.
 */
export const NoCoordinates: Story = {
  args: { variant: 'mapSplit', listing: ILAN_KOORDINATSIZ, revealExactLocation: false },
}

/**
 * Koordinatsız ilanda kapıyı açmak bir harita üretmez (prop sözleşmesi).
 * Adres açılır, çerçeve aynı bulguyu göstermeye devam eder.
 */
export const NoCoordinatesRevealed: Story = {
  args: { variant: 'mapSplit', listing: ILAN_KOORDINATSIZ, revealExactLocation: true },
}

/**
 * Sahip kesin konumu **yayınlamayı** seçmiş. Panel yine de kapalı açılır:
 * sahibin bayrağı bu paneli açmaz (bkz. component JSDoc'u).
 */
export const OwnerPublishesExactLocation: Story = {
  args: { variant: 'addressDetail', listing: ILAN_TERCIH_YAYINDA, revealExactLocation: false },
}

/** Sahip yayınlamayı seçmiş ve moderatör de açmış: ezilen bir tercih yok, bant çıkmaz. */
export const OwnerPublishesAndModeratorReveals: Story = {
  args: { variant: 'addressDetail', listing: ILAN_TERCIH_YAYINDA, revealExactLocation: true },
}

/**
 * Açık adres hiç girilmemiş — `fixtures/listings.ts`'in tamamının hâli.
 * "Girilmemiş" ile "gizli" ayrı yazılır: biri ilanın kusuru, öteki bir politika.
 */
export const AddressNotEntered: Story = {
  args: { variant: 'addressDetail', listing: ILAN_ADRESSIZ, revealExactLocation: true },
}

/** Gerçek fixture, hiç dokunulmadan: koordinat var, adres yok, sahip gizlemiş. */
export const FromListingFixture: Story = {
  args: { variant: 'mapSplit', listing: residentialPublishedApartment },
}

/** Uzun adres ve uzun mahalle adı sarmalı; 4/3 çerçeve ve dl taşmamalı. */
export const LongContent: Story = {
  args: { variant: 'addressDetail', listing: ILAN_UZUN, revealExactLocation: true },
}

/** Dar ekranda harita ve adres alt alta iner, etiket kolonu değerin üstüne çıkar. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { variant: 'mapSplit', listing: ILAN_UZUN, revealExactLocation: true },
}

/**
 * **Gizli demek "DOM'da yok" demek.**
 *
 * Görsel olarak saklanan bir adres, kaynağı görüntüleyen veya ekran okuyucu
 * kullanan herkes için hâlâ oradadır — yani gizlenmemiştir. Bu story onu ölçer:
 * adres de koordinat da ağaçta değil. Yuvarlanmış bir "yaklaşık koordinat" da
 * üretilmiyor (`40,9…` / `40.9…` hiçbir yerde geçmiyor); yaklaşıklık mahallenin
 * adının kendisi.
 */
export const HiddenExactLocationIsAbsentFromTheDom: Story = {
  args: { variant: 'addressDetail', listing: ILAN_TERCIH_GIZLI, revealExactLocation: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /** `textContent` `string | null`; matcher'a `null` geçirmemek için daraltılıyor. */
    const metin = canvasElement.textContent ?? ''

    await expect(canvas.queryByText(ACIK_ADRES)).not.toBeInTheDocument()
    await expect(metin).not.toContain('29.027700')
    await expect(metin).not.toMatch(/40[.,]9/)

    /** Adres ve koordinat satırlarının ikisi de "gizli" der, "girilmemiş" demez. */
    await expect(canvas.getAllByText('Kesin konum gizli')).toHaveLength(2)

    /** Yaklaşıklık burada: mahallenin adı. */
    await expect(canvas.getByText('Caferağa')).toBeInTheDocument()
  },
}

/**
 * Ezilen tercih duyurulmalı.
 *
 * Moderatör adresi görebilir, ama bunun bir tercihi aştığını ve gördüğü metnin
 * kamuya açık sayfada bulunmadığını bilmeden karar veremez.
 */
export const OverrideIsAnnouncedWhenOwnerChoseToHide: Story = {
  args: { variant: 'addressDetail', listing: ILAN_TERCIH_GIZLI, revealExactLocation: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText(ACIK_ADRES)).toBeInTheDocument()
    await expect(canvas.getByText(/İlan sahibi kesin konumu gizlemeyi seçti/)).toBeInTheDocument()
    await expect(canvas.getByText('Kesin konum son kullanıcıya gizli')).toBeInTheDocument()
  },
}

/** Ezilen bir tercih yoksa bant çıkmamalı: her açılışta uyarmak uyarıyı öldürür. */
export const NoOverrideNoticeWhenOwnerPublished: Story = {
  args: { variant: 'addressDetail', listing: ILAN_TERCIH_YAYINDA, revealExactLocation: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText(ACIK_ADRES)).toBeInTheDocument()
    await expect(
      canvas.queryByText(/İlan sahibi kesin konumu gizlemeyi seçti/),
    ).not.toBeInTheDocument()
    await expect(canvas.getByText('Kesin konum son kullanıcıya açık')).toBeInTheDocument()
  },
}

/**
 * Koordinat noktayla yazılır, virgülle değil.
 *
 * `toLocaleString('tr-TR')` `40,988800, 29,027700` üretirdi: hangi virgülün
 * ondalık hangisinin ayırıcı olduğu okunamaz ve hiçbir harita aracı kabul etmez.
 * `formatDateTime`/`formatCurrency`'nin yerel ayar tuzağının koordinat hâli —
 * bu story onun regresyon testi.
 */
export const CoordinateUsesDecimalPointNotComma: Story = {
  args: { variant: 'addressDetail', listing: ILAN_TERCIH_GIZLI, revealExactLocation: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('40.988800, 29.027700')).toBeInTheDocument()
    await expect(canvasElement.textContent ?? '').not.toContain('40,988800')
  },
}

/**
 * Yokluk gizlemeyi yener.
 *
 * Koordinat girilmemişse satır "gizli" demez — açacak bir şey yok ve boşluğun
 * kendisi bir bulgu: "konum tutarlılığı" kontrolü noktasız çalışamaz. "Gizli"
 * yazmak, kullanıcıyı olmayan bir kapıyı açmaya gönderirdi. Aynı ilanda dolu
 * olan adres ise gerçekten gizli — ikisi ayrı metin.
 */
export const MissingCoordinateIsNotDisguisedAsHidden: Story = {
  args: { variant: 'mapSplit', listing: ILAN_KOORDINATSIZ, revealExactLocation: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /** Harita çerçevesinde bulgu, adres listesinde satır: aynı metin iki yerde. */
    await expect(canvas.getAllByText('Koordinat girilmemiş')).toHaveLength(2)

    /** Yalnız adres gizli; koordinat gizli değil, yok. */
    await expect(canvas.getAllByText('Kesin konum gizli')).toHaveLength(1)
  },
}

/** Koordinat yoksa kapıyı açmak harita üretmez; adres açılır, bulgu yerinde kalır. */
export const RevealingWithoutCoordinatesDrawsNoMap: Story = {
  args: { variant: 'mapSplit', listing: ILAN_KOORDINATSIZ, revealExactLocation: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText(ACIK_ADRES)).toBeInTheDocument()
    await expect(canvas.getAllByText('Koordinat girilmemiş')).toHaveLength(2)
    await expect(canvas.queryByText(/Harita sağlayıcısı bağlanmadı/)).not.toBeInTheDocument()
  },
}

/** Gizliyken harita çerçevesinde iğne ve koordinat değil, mahallenin adı durur. */
export const HiddenMapShowsNeighbourhoodNotAPin: Story = {
  args: { variant: 'mapSplit', listing: ILAN_TERCIH_GIZLI, revealExactLocation: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Caferağa Mahallesi, Kadıköy')).toBeInTheDocument()
    await expect(canvasElement.textContent ?? '').not.toMatch(/40[.,]9/)
  },
}

/**
 * Posta kodu kapının dışında.
 *
 * Türkiye'de posta kodu mahalle ölçeğinde: 34710 = Caferağa. "Caferağa, Kadıköy"
 * zaten yazılıyken hiçbir bina göstermez, dolayısıyla gizlemek koruma değil
 * koruma tiyatrosu olur — belge kontrolünde ise kodun eşleşmesi aranır.
 */
export const PostalCodeIsVisibleEvenWhenExactLocationIsHidden: Story = {
  args: { variant: 'addressDetail', listing: ILAN_TERCIH_GIZLI, revealExactLocation: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('34710')).toBeInTheDocument()
  },
}

export const VariantsComparison: Story = {
  args: { listing: ILAN_TERCIH_GIZLI, revealExactLocation: true },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <LocationPanel {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
