import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import {
  AttributeDataType,
  CommercialSubCategory,
  CommercialTransactionType,
  ListingCategory,
  ResidentialSubCategory,
  ResidentialTransactionType,
  type CategoryAttributeDefinition,
} from '../../../types/domain'
import { AttributeEditor } from './AttributeEditor'

const MODLAR = ['create', 'edit', 'readOnly'] as const

/**
 * Handler'lar meta.args'a **konmuyor**: `onChange`'in yokluğu bir durum
 * (editör salt okunura düşer, bkz. `NoChangeHandlerIsReadOnly`), `onSave`/
 * `onCancel`'ın yokluğu ise butonu gizler. `exactOptionalPropertyTypes` açıkken
 * meta'daki `fn()` prop'un tipini `Mock`'a sabitler ve o story'ler `undefined`
 * geçemez (TS2375). İhtiyacı olan story kendisi veriyor.
 */
const handlers = () => ({ onChange: fn(), onSave: fn(), onCancel: fn() })

/** Sayısal öznitelik: en az/en çok anlamlı, seçenek listesi anlamsız. */
const ODA_SAYISI: Partial<CategoryAttributeDefinition> = {
  id: 'attr-konut-oda-sayisi',
  category: ListingCategory.Residential,
  appliesToSubCategories: [
    ResidentialSubCategory.Apartment,
    ResidentialSubCategory.Residence,
    ResidentialSubCategory.Villa,
  ],
  appliesToTransactionTypes: [ResidentialTransactionType.Sale, ResidentialTransactionType.Rent],
  key: 'odaSayisi',
  label: 'Oda Sayısı',
  description: 'Salon hariç oda sayısı. 3+1 bir dairede 3 girilir.',
  dataType: AttributeDataType.Number,
  required: true,
  filterable: true,
  visibleInList: true,
  active: true,
  order: 3,
  options: [],
  validation: { min: 1, max: 20 },
  createdAt: '2026-01-12T10:00:00+03:00',
  updatedAt: '2026-06-28T14:30:00+03:00',
}

/** Tekli seçim: seçenek listesi anlamlı, sınırlar anlamsız. */
const ISITMA_TIPI: Partial<CategoryAttributeDefinition> = {
  id: 'attr-konut-isitma-tipi',
  category: ListingCategory.Residential,
  appliesToSubCategories: [ResidentialSubCategory.Apartment, ResidentialSubCategory.DetachedHouse],
  appliesToTransactionTypes: [ResidentialTransactionType.Sale, ResidentialTransactionType.Rent],
  key: 'isitmaTipi',
  label: 'Isıtma Tipi',
  description: 'Konutun ana ısıtma sistemi.',
  dataType: AttributeDataType.SingleSelect,
  required: true,
  filterable: true,
  visibleInList: false,
  active: true,
  order: 7,
  options: [
    { value: 'dogalgazKombi', label: 'Doğalgaz (Kombi)', order: 1, active: true },
    { value: 'merkeziSistem', label: 'Merkezi Sistem', order: 2, active: true },
    { value: 'yerdenIsitma', label: 'Yerden Isıtma', order: 3, active: true },
    { value: 'sobali', label: 'Sobalı', order: 4, active: false },
  ],
  validation: {},
  createdAt: '2026-01-12T10:00:00+03:00',
  updatedAt: '2026-05-04T09:15:00+03:00',
}

/** Çoklu seçim: aynı seçenek listesi, tek farkı kaç tanesinin seçilebileceği. */
const CEPHE: Partial<CategoryAttributeDefinition> = {
  ...ISITMA_TIPI,
  id: 'attr-konut-cephe',
  key: 'cephe',
  label: 'Cephe',
  description: 'Konutun baktığı yönler. Birden çok seçilebilir.',
  dataType: AttributeDataType.MultiSelect,
  required: false,
  order: 9,
  options: [
    { value: 'kuzey', label: 'Kuzey', order: 1, active: true },
    { value: 'guney', label: 'Güney', order: 2, active: true },
    { value: 'dogu', label: 'Doğu', order: 3, active: true },
    { value: 'bati', label: 'Batı', order: 4, active: true },
  ],
}

/** Metin: uzunluk ve desen anlamlı; seçenek ve sınır anlamsız. */
const SITE_ADI: Partial<CategoryAttributeDefinition> = {
  ...ODA_SAYISI,
  id: 'attr-konut-site-adi',
  key: 'siteAdi',
  label: 'Site Adı',
  description: 'Site içerisindeki konutlarda doldurulur.',
  dataType: AttributeDataType.Text,
  required: false,
  filterable: false,
  order: 14,
  options: [],
  validation: { maxLength: 80, pattern: '^[^<>]+$' },
}

/** Para: sınırlar anlamlı, para birimi ilanın kendi alanı. */
const AIDAT: Partial<CategoryAttributeDefinition> = {
  ...ODA_SAYISI,
  id: 'attr-konut-aidat',
  key: 'aidat',
  label: 'Aidat',
  description: 'Aylık aidat tutarı.',
  dataType: AttributeDataType.Money,
  required: false,
  visibleInList: false,
  order: 11,
  validation: { min: 0 },
}

/** Evet/Hayır: ne seçeneği ne sınırı var — doğrulama bölümü hiç çıkmamalı. */
const ASANSOR: Partial<CategoryAttributeDefinition> = {
  ...ODA_SAYISI,
  id: 'attr-konut-asansor',
  key: 'hasElevator',
  label: 'Asansör',
  description: 'Binada asansör var mı?',
  dataType: AttributeDataType.Boolean,
  required: false,
  order: 12,
  validation: {},
}

/**
 * Pasife alınmış öznitelik: yeni ilanlarda sorulmaz, mevcut değerler durur.
 * Bayrakların hepsinin kapalı olduğu hâl de bir tasarım durumudur.
 */
const PASIF: Partial<CategoryAttributeDefinition> = {
  ...ISITMA_TIPI,
  id: 'attr-konut-yakit-tipi',
  key: 'yakitTipi',
  label: 'Yakıt Tipi',
  description: 'Isıtma Tipi özniteliğiyle birleştirildi; yeni ilanlarda sorulmuyor.',
  required: false,
  filterable: false,
  visibleInList: false,
  active: false,
}

/**
 * `create`: kapsam ağaçtan gelmiş, gerisi boş.
 *
 * `id`, `createdAt`, `updatedAt` **yok** — onları sunucu verir; `Partial`'ın
 * varlık sebebi tam olarak bu hâl.
 */
const YENI: Partial<CategoryAttributeDefinition> = {
  category: ListingCategory.Commercial,
  appliesToSubCategories: [CommercialSubCategory.Office, CommercialSubCategory.Plaza],
  appliesToTransactionTypes: [CommercialTransactionType.Rent],
  dataType: AttributeDataType.Text,
  required: false,
  filterable: false,
  visibleInList: true,
  active: true,
  order: 18,
  options: [],
  validation: {},
}

const meta = {
  title: 'Composites/AttributeEditor',
  component: AttributeEditor,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`dataType` neyin görüneceğini belirler: seçenek listesi yalnız tekli/çoklu seçimde, ' +
          'en az/en çok yalnız sayı ve parada, uzunluk ile desen yalnız metinde çıkar — ' +
          '"Evet/Hayır" özniteliğine minimum değer sormak sunucuya anlamsız veri yazdırırdı. ' +
          '`key` yalnız `create` modunda düzenlenir; `edit`te kilitlidir (`disabled` değil ' +
          '`readOnly`: anahtar okunması ve kopyalanması gereken bir tanımlayıcı) çünkü yayındaki ' +
          'ilanların verisi ona bağlı. `readOnly` modda kontrol değil **metin** gösterilir — ' +
          'devre dışı bir form alanı okunmak için tasarlanmamıştır. Doğrulama yapmaz: ' +
          '`validationErrors` alan adına göre ilgili kutunun `error`ına bağlanır, tepede toplu ' +
          'liste yoktur.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'form-editor',
      useWhen: [
        'Kategori ve öznitelik yönetiminde bir öznitelik tanımlanacak veya düzenlenecekse',
        'Bir öznitelik tanımının tamamı okunur biçimde gösterilecekse (readOnly)',
      ],
      doNotUseWhen: [
        'Kategori ağacında düğüm seçilecekse — CategoryTree kullanın',
        'İlan formunda özniteliğin *değeri* girilecekse — bu editör tanımı düzenler, değeri değil',
        "Yalnız tek bir alan gerekiyorsa — primitive'i (Input, Select) doğrudan kullanın",
      ],
    },
  },

  args: {
    value: ODA_SAYISI,
    mode: 'edit',
    dirty: false,
    saving: false,
  },

  argTypes: {
    mode: { control: 'inline-radio', options: MODLAR },
    dirty: { control: 'boolean' },
    saving: { control: 'boolean' },
    value: { control: false },
    validationErrors: { control: 'object' },
  },
} satisfies Meta<typeof AttributeEditor>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { ...handlers() },
}

/** `create`: anahtar düzenlenebilir, başlık "Yeni öznitelik", buton "Oluştur". */
export const Create: Story = {
  args: { ...handlers(), mode: 'create', value: YENI, dirty: true },
}

/** `edit`: anahtar kilitli, mevcut değerler dolu. */
export const Edit: Story = {
  args: { ...handlers(), mode: 'edit', value: ISITMA_TIPI },
}

/** `readOnly`: kontrol yok, okunur metin var. Çıkış yolu "Kapat". */
export const ReadOnly: Story = {
  args: { mode: 'readOnly', value: ISITMA_TIPI, onCancel: fn() },
}

/** Sunucudan dönen alan hataları: her biri kendi kutusunda. */
export const ValidationErrors: Story = {
  args: {
    ...handlers(),
    mode: 'create',
    dirty: true,
    value: { ...YENI, key: 'metrekare', label: '' },
    validationErrors: {
      key: 'Bu anahtar bu kategoride zaten kullanılıyor.',
      label: 'Etiket boş bırakılamaz.',
      'validation.maxLength': 'En fazla karakter 1 ile 500 arasında olmalı.',
    },
  },
}

/** Boş `value`: `Partial`'ın en uç hâli. Hiçbir alan yok, hiçbir şey çökmüyor. */
export const EmptyValue: Story = {
  args: { ...handlers(), mode: 'create', value: {} },
}

/** Kaydedilmemiş değişiklik: rozet çıkar, "Kaydet" etkinleşir. */
export const Dirty: Story = {
  args: { ...handlers(), dirty: true },
}

/** Kaydetme sürerken alanlar kilitli, buton spinner'lı, "Vazgeç" kapalı. */
export const Saving: Story = {
  args: { ...handlers(), dirty: true, saving: true },
}

/** Metin: uzunluk ve desen görünür, seçenek ve sınır görünmez. */
export const TextDataType: Story = {
  args: { ...handlers(), value: SITE_ADI },
}

/** Sayı: en az/en çok görünür. */
export const NumberDataType: Story = {
  args: { ...handlers(), value: ODA_SAYISI },
}

/** Para: sayı gibi sınırlanır; para birimi ilanın kendi alanı, özniteliğin değil. */
export const MoneyDataType: Story = {
  args: { ...handlers(), value: AIDAT },
}

/** Evet/Hayır: ne seçenek ne sınır — doğrulama bölümü hiç çıkmaz. */
export const BooleanDataType: Story = {
  args: { ...handlers(), value: ASANSOR },
}

/** Tekli seçim: seçenek listesi açılır. Dördüncü seçenek pasif. */
export const SingleSelectDataType: Story = {
  args: { ...handlers(), value: ISITMA_TIPI },
}

/** Çoklu seçim: aynı liste editörü. */
export const MultiSelectDataType: Story = {
  args: { ...handlers(), value: CEPHE },
}

/** Seçim tipi ama hiç seçenek yok: boşluk açıkça anlatılıyor. */
export const SelectWithoutOptions: Story = {
  args: { ...handlers(), value: { ...ISITMA_TIPI, options: [] } },
}

/** Pasife alınmış öznitelik. */
export const InactiveAttribute: Story = {
  args: { ...handlers(), value: PASIF },
}

/** `onSave` yoksa "Kaydet" hiç render edilmez; basılınca hiçbir şey yapmayan buton olmaz. */
export const WithoutSaveHandler: Story = {
  args: { onChange: fn(), onCancel: fn(), dirty: true },
}

/**
 * `onChange` yoksa sözleşme gereği editör salt okunur davranır — mod `edit`
 * olsa bile. Kutular donmuş görünmemeli: hiç olmamalı.
 */
export const NoChangeHandlerIsReadOnly: Story = {
  args: { mode: 'edit', value: ISITMA_TIPI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument()
    await expect(canvas.getByText('Salt okunur')).toBeInTheDocument()
  },
}

/** Uzun etiket, uzun açıklama ve uzun seçenek metinleri kabı taşırmamalı. */
export const LongContent: Story = {
  args: {
    ...handlers(),
    value: {
      ...ISITMA_TIPI,
      key: 'binaninAnaIsitmaSistemiVeYakitTuruBilgisi',
      label:
        'Binanın Ana Isıtma Sistemi ve Kullanılan Yakıt Türü (merkezi sistemlerde pay ölçer dahil)',
      description:
        'Konutun ısıtmasının hangi sistemle sağlandığını belirtir. Merkezi sistemlerde pay ölçer bulunup bulunmadığı, kombi kullanılan dairelerde cihazın yaşı ve son bakım tarihi ilan sahibinden ayrıca istenir; bu alan yalnız ana sistemi kaydeder ve arama ekranında filtre olarak kullanılır.',
      options: [
        {
          value: 'merkeziSistemPayOlcer',
          label: 'Merkezi Sistem (pay ölçer ile, ısı gideri daire başına paylaştırılır)',
          order: 1,
          active: true,
        },
        {
          value: 'dogalgazKombiYogusmali',
          label: 'Doğalgaz — Yoğuşmalı Kombi (bireysel, daire içi cihaz)',
          order: 2,
          active: true,
        },
      ],
    },
  },
}

/** Dar ekranda seçenek satırı tek kolona iner, sayfa yatay kaymaz. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { ...handlers(), value: ISITMA_TIPI, dirty: true },
}

/**
 * `dataType` alan görünürlüğünü değiştirmeli.
 *
 * Panelin en kolay yapacağı hata her alanı her tipte göstermek olurdu:
 * "Evet/Hayır" özniteliğine sorulan minimum değer sunucuya anlamsız veri yazar.
 */
export const DataTypeDrivesFields: Story = {
  args: { ...handlers() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Sayı: sınırlar var, seçenek yok.
    await expect(canvas.getByLabelText('En az')).toBeInTheDocument()
    await expect(canvas.getByLabelText('En çok')).toBeInTheDocument()
    await expect(canvas.queryByRole('group', { name: '1. seçenek' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Seçenek ekle' })).not.toBeInTheDocument()
    await expect(canvas.queryByLabelText('En fazla karakter')).not.toBeInTheDocument()
  },
}

/** Tekli seçimde tam tersi: seçenekler var, sınırlar yok. */
export const SelectTypeShowsOptionsNotBounds: Story = {
  args: { ...handlers(), value: ISITMA_TIPI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Seçenek ekle' })).toBeInTheDocument()
    await expect(canvas.getByRole('group', { name: '1. seçenek' })).toBeInTheDocument()
    await expect(canvas.queryByLabelText('En az')).not.toBeInTheDocument()
    await expect(canvas.queryByLabelText('En çok')).not.toBeInTheDocument()
  },
}

/** Evet/Hayır hiçbir doğrulama alanı açmamalı. */
export const BooleanShowsNoValidationFields: Story = {
  args: { ...handlers(), value: ASANSOR },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByLabelText('En az')).not.toBeInTheDocument()
    await expect(canvas.queryByLabelText('En fazla karakter')).not.toBeInTheDocument()
    await expect(canvas.queryByLabelText('Desen')).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Seçenek ekle' })).not.toBeInTheDocument()
  },
}

/**
 * `key` `edit`te kilitli, `create`te serbest.
 *
 * Gerçek `<input>` olduğu için native matcher doğru araç (Base UI'ın
 * `role="checkbox"` span'lerinin aksine). `readonly` ölçülüyor, `disabled`
 * değil: kilitli anahtar okunabilir ve odaklanabilir kalmalı.
 */
export const KeyIsLockedInEditMode: Story = {
  args: { ...handlers() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const anahtar = canvas.getByLabelText(/^Anahtar/)

    await expect(anahtar).toHaveAttribute('readonly')
    await expect(anahtar).not.toBeDisabled()
    await expect(anahtar).toHaveValue('odaSayisi')
  },
}

export const KeyIsEditableInCreateMode: Story = {
  args: { ...handlers(), mode: 'create', value: YENI },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const anahtar = canvas.getByLabelText(/^Anahtar/)

    await expect(anahtar).not.toHaveAttribute('readonly')

    // Tek karakter: kutu kontrollü ve story onu geri yazmıyor, dolayısıyla her
    // tuş vuruşu yine boş değerin üstüne biner. Ölçülen şey yazılan metin değil,
    // handler'ın **birleştirilmiş** değeri (farkı değil) vermesi.
    await userEvent.type(anahtar, 'k')

    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: 'k', category: ListingCategory.Commercial }),
    )
  },
}

/**
 * Hata alan anahtarına göre **ilgili kutuya** bağlanmalı.
 *
 * Erişilebilir açıklama ölçülüyor: mesajın ekranda bir yerde görünmesi yetmez,
 * ekran okuyucu kullanıcısının kutuya girdiğinde onu duyması gerekir. Sayfanın
 * tepesindeki toplu liste bu testi geçemezdi.
 */
export const ValidationErrorsBindToTheirField: Story = {
  args: {
    ...handlers(),
    mode: 'create',
    value: { ...YENI, key: 'metrekare', label: '' },
    validationErrors: {
      key: 'Bu anahtar bu kategoride zaten kullanılıyor.',
      label: 'Etiket boş bırakılamaz.',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByLabelText(/^Anahtar/)).toHaveAccessibleDescription(
      'Bu anahtar bu kategoride zaten kullanılıyor.',
    )
    await expect(canvas.getByLabelText(/^Etiket/)).toHaveAccessibleDescription(
      'Etiket boş bırakılamaz.',
    )
  },
}

/**
 * Karşılığı olmayan anahtar sessizce yok sayılmalı: editör çökmez, mesaj da
 * hiçbir yere sızmaz. Yardımcı metin yerinde kalır — hata yok çünkü.
 */
export const UnknownErrorKeyIsIgnored: Story = {
  args: {
    ...handlers(),
    validationErrors: { bilinmeyenAlan: 'Bu mesajın bağlanacağı bir kutu yok.' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByText('Bu mesajın bağlanacağı bir kutu yok.')).not.toBeInTheDocument()
    await expect(canvas.getByLabelText(/^Etiket/)).toHaveAccessibleDescription(
      'İlan formunda ve filtrelerde görünen ad. Örn. Oda Sayısı.',
    )
  },
}

/**
 * `readOnly` kontrol değil metin göstermeli.
 *
 * Brifingin kendi ifadesiyle "yalnız gösterim". Devre dışı kutularla çözmek en
 * kolay yol olurdu ve tam da okunmayan bir ekran üretirdi: soluk kontrast, odak
 * dışı alanlar. Test kutuların **yokluğunu** ölçüyor.
 */
export const ReadOnlyShowsTextNotDisabledControls: Story = {
  args: { mode: 'readOnly', value: ISITMA_TIPI, onCancel: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument()
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument()
    await expect(canvas.queryByRole('combobox')).not.toBeInTheDocument()
    await expect(canvas.queryByRole('spinbutton')).not.toBeInTheDocument()

    // Kap yine de adlandırılmış bir bölge: ekran okuyucu kullanıcısı panelin
    // hangi öznitelik olduğunu gezinirken duyar.
    await expect(canvas.getByRole('region', { name: 'Isıtma Tipi' })).toBeInTheDocument()

    // Değerler okunur metin olarak duruyor; veri tipi etiketi domain'den geliyor.
    await expect(canvas.getByText('Tekli Seçim')).toBeInTheDocument()
    await expect(canvas.getByText('Doğalgaz (Kombi)')).toBeInTheDocument()
    await expect(canvas.getByText('Salt okunur')).toBeInTheDocument()
  },
}

/** `readOnly`de kaydedilecek bir şey yok: "Kaydet" hiç render edilmemeli. */
export const ReadOnlyHasNoSaveButton: Story = {
  args: { mode: 'readOnly', value: ISITMA_TIPI, onSave: fn(), onCancel: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('button', { name: 'Kaydet' })).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Kapat' })).toBeInTheDocument()
  },
}

/** Değişiklik yokken kaydetmek boş bir istek atar ve `updatedAt`'i sebepsiz ileri alır. */
export const SaveWaitsForDirty: Story = {
  args: { ...handlers(), dirty: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'Kaydet' })).toBeDisabled()
    await expect(canvas.queryByText('Kaydedilmemiş değişiklik')).not.toBeInTheDocument()
  },
}

export const DirtyEnablesSave: Story = {
  args: { ...handlers(), dirty: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Kaydedilmemiş değişiklik')).toBeInTheDocument()

    const kaydet = canvas.getByRole('button', { name: 'Kaydet' })
    await expect(kaydet).not.toBeDisabled()

    await userEvent.click(kaydet)
    await expect(args.onSave).toHaveBeenCalledTimes(1)
  },
}

/**
 * `saving` alanları kilitlemeli.
 *
 * İki farklı matcher bilinçli: `<input>` gerçek native kontrol
 * (`toBeDisabled()` doğru), Checkbox ise `<span role="checkbox">` ve
 * devre dışılığını `aria-disabled` ile bildiriyor — orada `toBeDisabled()`
 * kutu gerçekten kilitliyken de düşer.
 */
export const SavingLocksFields: Story = {
  args: { ...handlers(), dirty: true, saving: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByLabelText(/^Etiket/)).toBeDisabled()
    await expect(canvas.getByRole('checkbox', { name: /Zorunlu/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'Vazgeç' })).toBeDisabled()
  },
}

/**
 * Seçenek taşıma `order`'ı yeniden numaralamalı.
 *
 * Sıranın iki kaynağı olamaz: dizi ile `order` çelişirse seçenekler ilan
 * formunda başka, burada başka sırada görünür.
 */
export const MovingOptionRenumbersOrder: Story = {
  args: { ...handlers(), value: ISITMA_TIPI },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: '1. seçeneği aşağı taşı' }))

    await expect(args.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { value: 'merkeziSistem', label: 'Merkezi Sistem', order: 1, active: true },
          { value: 'dogalgazKombi', label: 'Doğalgaz (Kombi)', order: 2, active: true },
          { value: 'yerdenIsitma', label: 'Yerden Isıtma', order: 3, active: true },
          { value: 'sobali', label: 'Sobalı', order: 4, active: false },
        ],
      }),
    )
  },
}

/** İlk satır yukarı, son satır aşağı taşınamaz: sınırdaki buton kapalı. */
export const OptionMoveButtonsRespectBounds: Story = {
  args: { ...handlers(), value: ISITMA_TIPI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: '1. seçeneği yukarı taşı' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: '1. seçeneği aşağı taşı' })).not.toBeDisabled()
    await expect(canvas.getByRole('button', { name: '4. seçeneği aşağı taşı' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: '4. seçeneği yukarı taşı' })).not.toBeDisabled()
  },
}

/**
 * Tekrar eden kutular satır numarasıyla ayrılmalı.
 *
 * Dört seçenekte dört kere "Etiket" duyan ekran okuyucu kullanıcısı hangisinde
 * olduğunu ancak grubun adından bilir; silme butonları da aynı sebeple
 * numaralı. Numarasız kalsalardı "sil" düğmesi dört kez aynı adı taşırdı.
 */
export const OptionRowsAreDistinguishable: Story = {
  args: { ...handlers(), value: ISITMA_TIPI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByRole('group', { name: /^\d+\. seçenek$/ })).toHaveLength(4)
    await expect(canvas.getByRole('group', { name: '3. seçenek' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: '3. seçeneği sil' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: '2. seçeneği sil' })).toBeInTheDocument()
  },
}

/** Seçenek eklemek boş bir satır üretmeli ve sırayı bozmamalı. */
export const AddingOptionAppendsRow: Story = {
  args: { ...handlers(), value: { ...ISITMA_TIPI, options: [] } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Seçenek ekle' }))

    await expect(args.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [{ value: '', label: '', order: 1, active: true }],
      }),
    )
  },
}

/** Etiketler domain'den gelmeli: `singleSelect` değil "Tekli Seçim", `konut` değil "Konut". */
export const LabelsComeFromDomain: Story = {
  args: { ...handlers(), value: ISITMA_TIPI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Konut')).toBeInTheDocument()
    await expect(canvas.getByText('Daire')).toBeInTheDocument()
    await expect(canvas.getByText('Satılık')).toBeInTheDocument()
    await expect(canvas.queryByText('singleSelect')).not.toBeInTheDocument()
    await expect(canvas.queryByText('konut')).not.toBeInTheDocument()
  },
}

/**
 * Bayraklar `Switch` değil `Checkbox` olmalı.
 *
 * `SwitchProps`'un kendi sözleşmesi: switch değişikliğin **anında**
 * uygulandığı ayarlar içindir, "Kaydet"e kadar bekleyen alanda `Checkbox`
 * kullanılmalı. Bu editör tam da öyle — çevirdiği anahtarın kaydedildiğini
 * sanan kullanıcı sekmeyi kapatıp değişikliği kaybederdi.
 */
export const FlagsAreCheckboxesNotSwitches: Story = {
  args: { ...handlers() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryAllByRole('switch')).toHaveLength(0)
    await expect(canvas.getByRole('checkbox', { name: /Zorunlu/ })).toBeInTheDocument()
    await expect(canvas.getByRole('checkbox', { name: /Aktif/ })).toBeInTheDocument()
  },
}

/** Bayrağı işaretlemek birleştirilmiş değeri vermeli. */
export const TogglingFlagSendsMergedValue: Story = {
  args: { ...handlers(), value: ASANSOR },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('checkbox', { name: /Zorunlu/ }))

    await expect(args.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ required: true, key: 'hasElevator' }),
    )
  },
}

export const VariantsComparison: Story = {
  args: { value: ISITMA_TIPI },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {MODLAR.map((mode) => (
        <div key={mode} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{mode}</span>
          <AttributeEditor
            {...args}
            mode={mode}
            value={mode === 'create' ? YENI : ISITMA_TIPI}
            dirty={mode === 'create'}
            onChange={fn()}
            onSave={fn()}
            onCancel={fn()}
          />
        </div>
      ))}
    </div>
  ),
}
