import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import {
  AttributeDataType,
  BuildingSubCategory,
  CommercialSubCategory,
  LandSubCategory,
  ListingCategory,
  ResidentialSubCategory,
  ResidentialTransactionType,
  TimeshareSubCategory,
  TourismFacilitySubCategory,
  type CategoryAttributeDefinition,
  type ListingSubCategory,
} from '../../types/domain'
import { CATEGORY_SUB_CATEGORIES } from '../../domain/categoryTree'
import { LISTING_CATEGORY_LABEL, LISTING_SUB_CATEGORY_LABEL } from '../../domain/labels'
import type { CategoryAttributePageData, CategoryTreeNode } from '../../types/component-props'
import { CategoryAttributePage } from './CategoryAttributePage'

/* ──────────────────────────────────────────────────────────────────────────
   Fixture — story-yerel

   `src/fixtures/` altında kategori ağacı ve öznitelik fixture'ı **yok** (orada
   listings, moderationEvents, users, reports, dashboard, audit var); bu ekran
   ikisini birden istiyor. CategoryTree ve AttributeEditor aynı boşluğu
   story-yerel fixture ile kapatmıştı, buradaki veriler onlarınkiyle birebir
   aynı: aynı ağaç iki story dosyasında iki farklı sayı göstermemeli. Kalıcı
   çözüm `src/fixtures/categories.ts` — raporlandı, bu ekranın yetkisi dışında.
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Alt kategori düğümünün kimliği.
 *
 * Kök kimliği `ListingCategory`'nin kendisi; alt kategoriler **öneklendiriliyor**
 * çünkü değerler kategori boyunca benzersiz değil: Devremülk kategorisinin değeri
 * de (`devremulk`) tek alt kategorisinin değeri de (`devremulk`) aynı. Önek
 * olmasa iki düğüm aynı `id`'yi taşır ve seçim ikisini birden vururdu. Çakışma
 * işlem türlerinde daha da yaygın (`ResidentialTransactionType.Sale` ile
 * `LandTransactionType.Sale` ikisi de `'satilik'`) — bir değere bakıp
 * kategorisini çıkarmak mümkün değil, cevabı yanındaki `category` verir.
 */
const altId = (category: ListingCategory, sub: ListingSubCategory) => `${category}-${sub}`

/**
 * Yayından kaldırılmış düğümler: iki yaprak ve bir **kök**.
 *
 * Devremülk kategorisinin tamamı pasif ama 62 ilanı ve öznitelikleri duruyor —
 * pasif kategorinin özniteliklerini düzenlemek onu yeniden yayına almanın ilk
 * adımı, bu yüzden ağaçta soluk ama tıklanabilir.
 */
const PASIF_IDLER = new Set<string>([
  altId(ListingCategory.Residential, ResidentialSubCategory.Prefabricated),
  altId(ListingCategory.TourismFacility, TourismFacilitySubCategory.Campground),
  ListingCategory.Timeshare,
  altId(ListingCategory.Timeshare, TimeshareSubCategory.Timeshare),
])

/**
 * Alt kategori sayaçları: düğüm kimliği → yayındaki ilan sayısı.
 *
 * Sabit ve elle yazılı — `Math.random`/`Date.now` yok; Chromatic her koşuda aynı
 * kareyi görmeli. Ağaç bu sözlükten **türetilmiyor**, yalnız sayıları buradan
 * okuyor: yapı `CATEGORY_SUB_CATEGORIES`'ten geliyor, dolayısıyla enum'a yeni bir
 * alt kategori eklendiğinde ağaç onu kendiliğinden gösterir (sayacı `0` olur) ve
 * elle yazılmış bir listenin yapacağı gibi sessizce eksik kalmaz.
 */
const SAYAC: Record<string, number> = {
  [altId(ListingCategory.Residential, ResidentialSubCategory.Apartment)]: 4820,
  [altId(ListingCategory.Residential, ResidentialSubCategory.Residence)]: 610,
  [altId(ListingCategory.Residential, ResidentialSubCategory.DetachedHouse)]: 342,
  [altId(ListingCategory.Residential, ResidentialSubCategory.Villa)]: 288,
  [altId(ListingCategory.Residential, ResidentialSubCategory.SummerHouse)]: 174,
  [altId(ListingCategory.Residential, ResidentialSubCategory.FarmHouse)]: 46,
  [altId(ListingCategory.Residential, ResidentialSubCategory.Prefabricated)]: 31,

  [altId(ListingCategory.Land, LandSubCategory.ResidentialZoned)]: 912,
  [altId(ListingCategory.Land, LandSubCategory.CommercialZoned)]: 388,
  [altId(ListingCategory.Land, LandSubCategory.IndustrialZoned)]: 141,
  [altId(ListingCategory.Land, LandSubCategory.TourismZoned)]: 77,
  [altId(ListingCategory.Land, LandSubCategory.Field)]: 654,
  [altId(ListingCategory.Land, LandSubCategory.VineyardGarden)]: 209,

  [altId(ListingCategory.Commercial, CommercialSubCategory.ShopStore)]: 1163,
  [altId(ListingCategory.Commercial, CommercialSubCategory.Office)]: 842,
  [altId(ListingCategory.Commercial, CommercialSubCategory.Plaza)]: 58,
  [altId(ListingCategory.Commercial, CommercialSubCategory.Warehouse)]: 274,
  [altId(ListingCategory.Commercial, CommercialSubCategory.Factory)]: 96,
  [altId(ListingCategory.Commercial, CommercialSubCategory.Workshop)]: 187,

  [altId(ListingCategory.Building, BuildingSubCategory.CompleteBuilding)]: 143,

  [altId(ListingCategory.Timeshare, TimeshareSubCategory.Timeshare)]: 62,

  [altId(ListingCategory.TourismFacility, TourismFacilitySubCategory.Hotel)]: 118,
  [altId(ListingCategory.TourismFacility, TourismFacilitySubCategory.BoutiqueHotel)]: 64,
  [altId(ListingCategory.TourismFacility, TourismFacilitySubCategory.ApartHotel)]: 39,
  [altId(ListingCategory.TourismFacility, TourismFacilitySubCategory.Pension)]: 52,
  [altId(ListingCategory.TourismFacility, TourismFacilitySubCategory.Motel)]: 17,
  [altId(ListingCategory.TourismFacility, TourismFacilitySubCategory.HolidayVillage)]: 23,
  [altId(ListingCategory.TourismFacility, TourismFacilitySubCategory.Campground)]: 11,
}

/**
 * Brifing 1.1'in kategori ağacı: altı kök, yirmi sekiz alt kategori.
 *
 * Yapı `domain/categoryTree.ts`'ten **türetiliyor**, elle yazılmıyor. Etiketler
 * `domain/labels.ts`'ten: aynı kategori ağaçta, filtrede ve ilan kartında aynı
 * yazılır. Kök sayacı çocuklarının toplamı — `count`'un alt düğümleri kapsayıp
 * kapsamadığına çağıran karar veriyor (bkz. `CategoryTreeNode.count`) ve kategori
 * yönetiminde beklenen okuma "Konut'ta toplam kaç ilan var".
 */
const KATEGORI_AGACI: CategoryTreeNode[] = Object.values(ListingCategory).map((category) => {
  /*
    Ara değişken şart: `CATEGORY_SUB_CATEGORIES` her kategoride **farklı bir dizi
    tipi** taşıyor (`ResidentialSubCategory[] | LandSubCategory[] | …`) ve
    TypeScript dizi birleşiminde `.map`'i çağıramıyor — üyelerin her birinin kendi
    generic imzası var. Sözlüğün `satisfies` ile vaat ettiği ortak tipe atamak
    hem derler hem de vaadin kendisini sınar.
  */
  const altKategoriler: readonly ListingSubCategory[] = CATEGORY_SUB_CATEGORIES[category]

  const cocuklar: CategoryTreeNode[] = altKategoriler.map((sub) => {
    const id = altId(category, sub)

    return {
      id,
      label: LISTING_SUB_CATEGORY_LABEL[sub],
      active: !PASIF_IDLER.has(id),
      count: SAYAC[id] ?? 0,
    }
  })

  return {
    id: category,
    label: LISTING_CATEGORY_LABEL[category],
    category,
    active: !PASIF_IDLER.has(category),
    children: cocuklar,
    count: cocuklar.reduce((toplam, cocuk) => toplam + (cocuk.count ?? 0), 0),
  }
})

/** Konut özniteliklerinin ortak kapsamı ve doğuş tarihi. Fixture "bugün"ü: 2026-07-16. */
const KONUT_KAPSAMI = {
  category: ListingCategory.Residential,
  appliesToSubCategories: [
    ResidentialSubCategory.Apartment,
    ResidentialSubCategory.Residence,
    ResidentialSubCategory.Villa,
  ] as ListingSubCategory[],
  appliesToTransactionTypes: [ResidentialTransactionType.Sale, ResidentialTransactionType.Rent],
  createdAt: '2026-01-12T10:00:00+03:00',
}

const ODA_SAYISI: CategoryAttributeDefinition = {
  ...KONUT_KAPSAMI,
  id: 'attr-konut-oda-sayisi',
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
  updatedAt: '2026-06-28T14:30:00+03:00',
}

const ISITMA_TIPI: CategoryAttributeDefinition = {
  ...KONUT_KAPSAMI,
  id: 'attr-konut-isitma-tipi',
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
  updatedAt: '2026-05-04T09:15:00+03:00',
}

const CEPHE: CategoryAttributeDefinition = {
  ...KONUT_KAPSAMI,
  id: 'attr-konut-cephe',
  key: 'cephe',
  label: 'Cephe',
  description: 'Konutun baktığı yönler. Birden çok seçilebilir.',
  dataType: AttributeDataType.MultiSelect,
  required: false,
  filterable: true,
  visibleInList: false,
  active: true,
  order: 9,
  options: [
    { value: 'kuzey', label: 'Kuzey', order: 1, active: true },
    { value: 'guney', label: 'Güney', order: 2, active: true },
    { value: 'dogu', label: 'Doğu', order: 3, active: true },
    { value: 'bati', label: 'Batı', order: 4, active: true },
  ],
  validation: {},
  updatedAt: '2026-07-02T11:20:00+03:00',
}

const AIDAT: CategoryAttributeDefinition = {
  ...KONUT_KAPSAMI,
  id: 'attr-konut-aidat',
  key: 'aidat',
  label: 'Aidat',
  description: 'Aylık aidat tutarı.',
  dataType: AttributeDataType.Money,
  required: false,
  filterable: true,
  visibleInList: false,
  active: true,
  order: 11,
  options: [],
  validation: { min: 0 },
  updatedAt: '2026-07-14T16:45:00+03:00',
}

const ASANSOR: CategoryAttributeDefinition = {
  ...KONUT_KAPSAMI,
  id: 'attr-konut-asansor',
  key: 'hasElevator',
  label: 'Asansör',
  description: 'Binada asansör var mı?',
  dataType: AttributeDataType.Boolean,
  required: false,
  filterable: true,
  visibleInList: true,
  active: true,
  order: 12,
  options: [],
  validation: {},
  updatedAt: '2026-03-18T08:05:00+03:00',
}

const SITE_ADI: CategoryAttributeDefinition = {
  ...KONUT_KAPSAMI,
  id: 'attr-konut-site-adi',
  key: 'siteAdi',
  label: 'Site Adı',
  description: 'Site içerisindeki konutlarda doldurulur.',
  dataType: AttributeDataType.Text,
  required: false,
  filterable: false,
  visibleInList: false,
  active: true,
  order: 14,
  options: [],
  validation: { maxLength: 80, pattern: '^[^<>]+$' },
  updatedAt: '2026-02-09T13:00:00+03:00',
}

/** Pasife alınmış öznitelik: yeni ilanlarda sorulmaz, mevcut değerler silinmez. */
const YAKIT_TIPI: CategoryAttributeDefinition = {
  ...ISITMA_TIPI,
  id: 'attr-konut-yakit-tipi',
  key: 'yakitTipi',
  label: 'Yakıt Tipi',
  description: 'Isıtma Tipi özniteliğiyle birleştirildi; yeni ilanlarda sorulmuyor.',
  required: false,
  filterable: false,
  visibleInList: false,
  active: false,
  order: 16,
  updatedAt: '2026-06-01T10:30:00+03:00',
}

/**
 * Seçili düğümün öznitelikleri: altı veri tipinin hepsi + bir pasif tanım.
 *
 * Liste **süzülmüş** geliyor: ekran onu seçili düğüme göre süzemez, çünkü düğüm
 * kimliğinden kategoriye inen bir kanal yok (`CategoryTreeNode` yalnız köklerde
 * `category` taşıyor, alt kategori düğümünde `subCategory` diye bir alan hiç
 * yok). Gerçek uygulamada sunucudan seçili düğümün tanımları gelir.
 */
const KONUT_OZNITELIKLERI: CategoryAttributeDefinition[] = [
  ODA_SAYISI,
  ISITMA_TIPI,
  CEPHE,
  AIDAT,
  ASANSOR,
  SITE_ADI,
  YAKIT_TIPI,
]

const VERI: CategoryAttributePageData = {
  tree: KATEGORI_AGACI,
  attributes: KONUT_OZNITELIKLERI,
  selectedNodeId: ListingCategory.Residential,
}

/* ──────────────────────────────────────────────────────────────────────────
   Play yardımcıları
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Base UI popup'ının kapanışını bekler.
 *
 * a11y kapısı `'error'` ve play bittiğinde axe çalışıyor. Base UI popup açıkken
 * odak tuzağı için `aria-hidden="true"` + `tabindex="0"` taşıyan koruma span'leri
 * basıyor; **kapanma animasyonu** sürerken bitirilen bir story'de bunlar DOM'da
 * kalıyor ve axe `aria-hidden-focus` görüyor — story yazı-tura düşüyor
 * (`Select`'in iki story'si beş koşuda üç kez düştü, aynı kod). Kalıp
 * `Select.stories.tsx`'ten devralındı. Açık **bırakılan** popup sorun değil;
 * sorun tam olarak kapanırken bitirmek.
 */
async function popupKapanmasiniBekle(): Promise<void> {
  await waitFor(() =>
    expect(document.querySelector('[data-base-ui-focus-guard]')).not.toBeInTheDocument(),
  )
}

/** Portal'daki dialog. Açıkken sayfanın kalanı `aria-hidden`, canvas sorgusu onu bulamaz. */
const dialogIcinde = () => within(document.body)

/**
 * Dialog'u bulur ve **açılış animasyonu oturana kadar** bekler.
 *
 * `popupKapanmasiniBekle`'nin simetriği ve aynı ailenin ikinci üyesi; bu turda
 * ölçüldü. `Modal.css.ts`'in popup'ı `scaleIn` ile açılıyor
 * (`from { opacity: 0 }`, `duration.normal` = 180ms) ve `findByRole` element DOM'a
 * girer girmez çözülüyor — yani iddia animasyonun **ilk karesinde** koşuyor.
 * jest-dom'un `toBeVisible`'ı hesaplanmış `opacity`'ye dize olarak bakıyor
 * (`opacity !== '0'`, storybook/dist/test/index.js → `isStyleVisible`), ilk
 * karede değer tam olarak `'0'` ve matcher dialog'u **görünmez** sayıyor.
 *
 * İhlal ne gerçek bir kusur (dialog gerçekten açılıyor, 180ms sonra opak) ne de
 * artefakt: testin kendi erken ölçümü. Bu yüzden çözüm iddiayı gevşetmek değil
 * beklemek — `toBeVisible` olduğu gibi duruyor, yalnız animasyon bitene kadar
 * yeniden deneniyor. Kapanış yarışı gibi bu da **yazı-tura** düşüyordu (aynı
 * kod, 10 ve 9 düşen test veren iki ardışık koşu).
 */
async function dialogGorunurOlsun(ad: string): Promise<HTMLElement> {
  const dialog = await dialogIcinde().findByRole('dialog', { name: ad })
  await waitFor(() => expect(dialog).toBeVisible())

  return dialog
}

/**
 * Ağacın içi. **Kategori etiketi arayan her sorgu bundan geçmeli.**
 *
 * Bu turda ölçüldü: `AttributeEditor` özniteliğin kapsamını okunur rozet olarak
 * gösteriyor — `<Badge tone="primary">Konut</Badge>` ve alt kategori rozetleri
 * ("Daire", "Rezidans", "Villa"). Yani editör açıkken "Konut" ve "Villa" sayfada
 * **ikişer kez** var: biri ağacın satırı, öteki editörün kapsam rozeti;
 * `within(canvasElement).getByText('Konut')` "found multiple elements" ile
 * düşüyor.
 *
 * `getByText`'in bu dosyada güvenilen davranışı ("yalnız DOĞRUDAN metin
 * çocuklarına bakar") **başka** bir tuzağı çözüyor: "Konut"u Arsa'nın "Konut
 * İmarlı"sından ayırmayı. Aynı metnin ikinci bir **kopyasına** çare değil —
 * onu ayıran şey kapsam. İkisi karıştırıldığı için bu dosyanın yedi story'si
 * düşüyordu.
 *
 * `{ hidden: true }`: ağaç, detay panosuna geçildikten sonra dar ekranda
 * (414px test viewport'u) `display: none` kalıyor; iddia "DOM'da var/yok"
 * düzeyinde ve viewport'tan bağımsız — dosyanın geri kalanındaki kalıbın aynısı.
 */
const agacIcinde = (canvasElement: HTMLElement) =>
  within(within(canvasElement).getByRole('tree', { name: 'Kategori ağacı', hidden: true }))

/**
 * Detay panosuna geçer. **Detay panosuna dokunan her play bununla başlamalı.**
 *
 * Sebep ölçülebilir bir gerçek: test tarayıcısının viewport'u 414 piksel (vitest
 * browser modunun varsayılanı, `vite.config.ts`'te ezilmiyor — AGENTS.md) ve bu
 * ekranın kırılımı 64rem. Yani play testleri **drill-down tarafında** çalışıyor
 * ve detay panosu `display: none`: `getByRole` erişilebilirlik ağacına baktığı
 * için oradaki hiçbir düğmeyi bulamaz.
 *
 * **Seçili** düğüme basmak panoyu çeviriyor ama `onNodeSelect`'i çağırmıyor
 * (`id === seciliId` kısa devresi) ve `dirty` iken onay da sormuyor — ölçüm
 * kirlenmez. Geniş ekranda ikisi de görünür olduğu için adım zararsız: iddia her
 * iki viewport'ta da aynı şeyi ölçer.
 *
 * Sorgu ağaca kapsanıyor: aynı etiket editörün kapsam rozetinde de yazılı
 * (bkz. `agacIcinde`).
 */
async function detayaGec(canvasElement: HTMLElement, kategoriEtiketi = 'Konut'): Promise<void> {
  await userEvent.click(agacIcinde(canvasElement).getByText(kategoriEtiketi))
}

const meta = {
  title: 'Screens/CategoryAttributePage',
  component: CategoryAttributePage,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Kategori ağacını, seçili düğümün öznitelik listesini ve öznitelik editörünü ' +
          'birleştirir. **Veri çekmez**: her şey prop olarak gelir. Geniş ekranda ağaç ve ' +
          'detay yan yana, dar ekranda drill-down (ağaç → seçim → detay → geri). Sayfanın ' +
          'tek `<h1>` başlığı kabuğa (PageHeader) ait olduğu için ekran `<h2>` ile başlar. ' +
          '**`editorMode` verilmezse `readOnly`**: yetki listesi sözleşmede yok ve ' +
          '`category:manage` yalnız süper adminde (brifing 1.4); varsayılanı `edit` yapmak, ' +
          'modu göndermeyi unutan çağırana sessizce düzenleme yetkisi verirdi. **`saving` ' +
          'yalnız taslak kaydetmeyi kapsar**; brifing 2.7 içindeki `publishPending`, ' +
          '`conflict` ve `validationError` durumlarının kanalı yok ve uydurulmadı.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'screen',
      useWhen: [
        'Kategori ve öznitelik yönetimi ekranı kurulacaksa (brifing 2.7)',
        'Kategori ağacı ile öznitelik editörü tek ekranda birleştirilecekse',
      ],
      doNotUseWhen: [
        'Yalnız kategori hiyerarşisinde gezinilecekse — CategoryTree kullanın',
        'Yalnız tek bir öznitelik tanımı düzenlenecekse — AttributeEditor kullanın',
        'İlan formunda özniteliğin *değeri* girilecekse — bu ekran tanımı yönetir, değeri değil',
      ],
    },
  },

  /*
    `editorValue`, `editorMode`, `dirty` ve `saving` **bilerek yok**: dördünün de
    yokluğu bir durum (öznitelik seçilmemiş / yetkisiz okuma / temiz taslak /
    kaydetme uçmuyor). `exactOptionalPropertyTypes` açıkken meta.args'a konan her
    prop o dosyada geri alınamaz oluyor (TS2375) — ihtiyacı olan story kendisi
    veriyor. Kalan altısı zorunlu prop; yoklukları zaten temsil edilemiyor.
  */
  args: {
    state: { status: 'success', data: VERI },
    onNodeSelect: fn(),
    onEditorChange: fn(),
    onSave: fn(),
    onPublish: fn(),
    onRetry: fn(),
  },

  argTypes: {
    state: { control: false },
    editorValue: { control: false },
    editorMode: { control: 'inline-radio', options: ['create', 'edit', 'readOnly'] },
    dirty: { control: 'boolean' },
    saving: { control: 'boolean' },
  },
} satisfies Meta<typeof CategoryAttributePage>

export default meta

type Story = StoryObj<typeof meta>

/* ──────────────────────────────────────────────────────────────────────────
   Zorunlu durum story'leri (brifing 3.5)

   `Conflict` **yazılmadı ve uydurulmadı**: kanalı yok. Brifing 2.7 `conflict`'i
   bir ekran durumu sayıyor ama `CategoryAttributePageProps` onu ifade edecek
   hiçbir alan taşımıyor — `AsyncState`'te de olamaz, çünkü `AsyncState` "veri
   geldi mi" sorusunu cevaplıyor, çakışma ise "gönderdiğim kayıt/yayın uygulandı
   mı" sorusunu: ağaç ve öznitelikler sorunsuz yüklüyken (`status: 'success'`)
   yayın reddedilebilir ve aynı eksende olsalardı reddedilen yayın ekranda duran
   ağacı hata bloğuna çevirirdi. Moderasyon tarafında bu tam olarak böyle
   çözüldü: `ModerationDecisionError` ayrı bir prop olarak eklendi
   (`ModerationActionBarProps.decisionError`). Bu ekranın simetriği
   (`publishError?: { kind: 'revisionConflict' | ... }`) sözleşmeye eklenmeden
   story yazılamaz; `state.status = 'error'` ile taklit etmek "yükleme çöktü"
   demek olurdu. Emsal: PromotionFlagsPanel ve SellerPanel'in yazılmayan
   Loading/Error story'lerinin gerekçesi de kendi story dosyalarında duruyor.
   Aynı gerekçe `publishPending` için de geçerli. Raporlandı.
   ────────────────────────────────────────────────────────────────────────── */

/** Kategori seçili, yedi öznitelik listede, editör bir tanım okuyor. */
export const Success: Story = {
  args: { editorValue: ISITMA_TIPI, editorMode: 'edit' },
}

/**
 * Yükleme: ölçü korunuyor.
 *
 * İki pano, iki başlık ve tablonun sütun başlıkları yerinde; yalnız satırlar ve
 * editörün gövdesi iskelet. Brifing 2.1: "yalnızca spinner ile boş ekran
 * gösterilmez".
 */
export const Loading: Story = {
  args: { state: { status: 'loading' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Skeleton'ın tamamı `aria-hidden`; meşguliyeti kapsayan kutu duyuruyor. */
    await expect(canvasElement.querySelector('[aria-busy="true"]')).not.toBeNull()
    await expect(canvas.getByRole('heading', { name: 'Kategoriler' })).toBeVisible()

    /* `{ hidden: true }`: detay panosu test viewport'unda (414px) drill-down
       yüzünden gizli; iddia "sütun başlıkları DOM'da duruyor" düzeyinde ve
       viewport'tan bağımsız. Yükleme burada ağacı da iskelete çevirdiği için
       `detayaGec` kullanılamıyor — tıklanacak düğüm yok. */
    await expect(
      canvas.getByRole('columnheader', { name: 'Öznitelik', hidden: true }),
    ).toBeInTheDocument()
  },
}

/** İlk sorgu başlamadı. `loading` ile aynı iskelet: kullanıcı için ikisi de "henüz yok". */
export const Idle: Story = {
  args: { state: { status: 'idle' } },
}

/**
 * Kategori tanımı yok.
 *
 * Bu ekranın filtresi yok: boşluk "aramaya uyan yok" değil, bir yapılandırma
 * eksikliği. Kullanıcının atabileceği tek adım yeniden yüklemek — "Öznitelik
 * ekle" ana eylem olurdu ama kanalı yok.
 */
export const Empty: Story = {
  args: { state: { status: 'empty' } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Kategori tanımı yok')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Yeniden yükle' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/** Yükleme çöktü: hata kodu ve tekrar deneme. */
export const Error: Story = {
  args: {
    state: {
      status: 'error',
      error: {
        title: 'Kategoriler yüklenemedi',
        message: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
        code: 'NETWORK_TIMEOUT',
        retryable: true,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Hata kodu:')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Tekrar dene' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * Kaydedilmemiş değişiklik: rozet çıkar, "Kaydet" etkinleşir.
 *
 * `dirty`'yi ekran **hesaplamaz**: "değişti mi" sorusu taslağı sunucudaki hâliyle
 * karşılaştırmayı gerektirir ve o hâli yalnız çağıran bilir.
 */
export const Dirty: Story = {
  args: {
    editorValue: { ...ISITMA_TIPI, label: 'Isıtma Sistemi' },
    editorMode: 'edit',
    dirty: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await detayaGec(canvasElement)

    await expect(canvas.getByText('Kaydedilmemiş değişiklik')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Kaydet' }))
    await expect(args.onSave).toHaveBeenCalledTimes(1)
  },
}

/**
 * Taslak kaydediliyor: editör kilitli, yayın kapalı.
 *
 * Yayın düğmesinde **spinner yok**: `saving` yalnız kaydetmeyi kapsıyor
 * (`AttributeEditorProps.saving`'in sözleşmesi birebir bunu diyor) ve spinner
 * "yayın uçuyor" demek olurdu — o bilgi bu ekrana gelmiyor. `publishPending`
 * kanalsız; raporlandı.
 */
export const Saving: Story = {
  args: {
    /* Sayısal öznitelik bilerek: seçenek listesi olan bir tanımda her seçenek
       satırının kendi "Etiket" kutusu var ve aşağıdaki `getByLabelText` beş
       eşleşme bulup patlardı. Ölçülen şey tipe bağlı değil. */
    editorValue: { ...ODA_SAYISI, label: 'Oda Adedi' },
    editorMode: 'edit',
    dirty: true,
    saving: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Yayın düğmesi split'in dışında, araç çubuğunda: her viewport'ta görünür. */
    await expect(canvas.getByRole('button', { name: 'Değişiklikleri yayınla' })).toBeDisabled()

    /* Gerçek `<input>`: native matcher doğru araç (Base UI'ın span kutularının
       aksine). `getByLabelText` etiket bağından gider, görünürlüğe bakmaz —
       drill-down'da gizli kalan editörde de doğru ölçer. */
    await expect(canvas.getByLabelText(/^Etiket/)).toBeDisabled()
  },
}

/* ──────────────────────────────────────────────────────────────────────────
   Zorunlu düzen varyantları (brifing 3.5)
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Mobil drill-down, birinci adım: yalnız ağaç.
 *
 * Detay panosu DOM'da duruyor ama dar ekranda `display: none`. Hangi panonun
 * göründüğü bir **gösterim** durumu, sözleşmede yok: `onNodeSelect` seçimi
 * kaldıramadığı için (`(id: string)`) "geri" düğmesi seçimi temizleyerek
 * çözülemezdi.
 */
export const MobileDrillDown: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { editorValue: ISITMA_TIPI, editorMode: 'edit' },
  play: async ({ canvasElement }) => {
    /* Medya sorgusu viewport'a bağlı ve viewport global'inin uygulandığı
       doğrulanmadı (AGENTS.md); dolayısıyla ölçülen şey görünürlük değil,
       yatay taşmanın yokluğu. Dikey sıralama ekran görüntüsünün işi. */
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/**
 * Mobil drill-down, ikinci adım: kategoriye girildi, detay açıldı, geri yolu var.
 *
 * 320 pikselde asıl sınav burada: dokuz sütunlu tablo kendi kaydırma kabına
 * düşmeli, **sayfayı** yatay kaydırmamalı.
 */
export const MobileDrillDownDetail: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: { editorValue: ISITMA_TIPI, editorMode: 'edit' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await detayaGec(canvasElement)

    /* `{ hidden: true }`: iddia "DOM'da var" düzeyinde. Geri düğmesi geniş
       ekranda `display: none` ve o durumda erişilebilirlik ağacında hiç yok;
       viewport global'inin test tarayıcısına uygulandığı da doğrulanmadı. */
    await expect(
      canvas.getByRole('button', { name: 'Kategori ağacına dön', hidden: true }),
    ).toBeInTheDocument()
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/** Masaüstü split: ağaç solda, öznitelikler ve editör sağda. */
export const DesktopSplit: Story = {
  globals: { viewport: { value: 'desktop1440' } },
  args: { editorValue: ISITMA_TIPI, editorMode: 'edit' },
}

/** Tablet: kırılımın altında kalıyor, panolar alt alta. */
export const Tablet: Story = {
  globals: { viewport: { value: 'tablet768' } },
  args: { editorValue: ISITMA_TIPI, editorMode: 'edit' },
}

/* ──────────────────────────────────────────────────────────────────────────
   Diğer durumlar
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Yetkisiz (403): tekrar deneme **yok**.
 *
 * `error`'dan ayrı bir durum çünkü ikisi farklı ekran ister: hata "bir şey ters
 * gitti, tekrar dene", bu ise "bu senin görebileceğin bir şey değil" der.
 * `retryable` tip düzeyinde `false`'a sabitli — buton kodda değil sözleşmede
 * kapatılıyor. Brifing 2.1 ayrıca "güvenli geri dönüş bağlantısı" istiyor;
 * `ErrorStateProps`'ta o kanal yok, raporlandı.
 */
export const Unauthorized: Story = {
  args: {
    state: {
      status: 'unauthorized',
      error: {
        title: 'Bu sayfayı görüntüleme yetkiniz yok',
        message:
          'Kategori ve öznitelik yönetimi yalnız süper adminlere açıktır. Erişim gerekiyorsa sistem yöneticinizden isteyin.',
        code: 'HTTP_403',
        retryable: false,
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole('button', { name: 'Tekrar dene' }),
    ).not.toBeInTheDocument()
  },
}

/**
 * Ağaç geldi, öznitelikler düşmedi — ama tersi de olabilir: burada öznitelik
 * sorgusu düştü, ağaç ayakta.
 *
 * `partialSuccess`'in varlık sebebi tam da bu: tek bir `error` çalışan ağacı da
 * gizlerdi. Hata panonun içinde kalıyor, sayfa ayakta ve kullanıcı kategori
 * seçmeye devam edebiliyor.
 */
export const PartialSuccess: Story = {
  args: {
    state: {
      status: 'partialSuccess',
      data: { tree: KATEGORI_AGACI, selectedNodeId: ListingCategory.Residential },
      errors: {
        attributes: {
          title: 'Öznitelikler yüklenemedi',
          message: 'Tanımlar getirilemedi. Kategori seçimi çalışmaya devam ediyor.',
          code: 'ATTR_FETCH_FAILED',
          retryable: true,
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Ağaç ayakta: hata onu gizlemedi. */
    await expect(canvas.getByRole('tree', { name: 'Kategori ağacı' })).toBeInTheDocument()
    await expect(canvas.getByText('Öznitelikler yüklenemedi')).toBeInTheDocument()
  },
}

/**
 * Ağaç düştü, öznitelikler geldi: hata sol panonun içinde kalıyor ve **gelmiş
 * olan liste görünmeye devam ediyor**.
 *
 * Seçim (`selectedNodeId`) biliniyor ama düğüm nesnesi ağaçla birlikte gitti;
 * kaybolan tek şey başlıktaki kategori adı. Detay panosunun kapısı bu yüzden
 * düğüm nesnesi değil seçim kimliği.
 */
export const PartialSuccessTreeFailed: Story = {
  args: {
    state: {
      status: 'partialSuccess',
      data: { attributes: KONUT_OZNITELIKLERI, selectedNodeId: ListingCategory.Residential },
      errors: {
        tree: {
          title: 'Kategori ağacı yüklenemedi',
          message: 'Ağaç getirilemedi. Yeniden yüklemeyi deneyin.',
          retryable: true,
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Kategori ağacı yüklenemedi')).toBeInTheDocument()
    /* Liste gelmişti ve görünüyor: `getByText` görünürlüğe bakmaz, iddia
       "DOM'da duruyor" düzeyinde. */
    await expect(canvas.getByText('Isıtma Tipi')).toBeInTheDocument()
    await expect(canvas.queryByText('Kategori seçilmedi')).not.toBeInTheDocument()
  },
}

/**
 * Bayat veri: son başarılı yükleme gösteriliyor, üstte uyarı.
 *
 * `info`, `warning` değil: gösterilen şey hâlâ doğru, yalnız eski — `warning`
 * `role="alert"` taşır ve ekran okuyucu kullanıcısının işini bölerdi.
 */
export const Stale: Story = {
  args: {
    state: { status: 'success', data: VERI, stale: true },
    editorValue: ISITMA_TIPI,
    editorMode: 'edit',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Gösterilen veri güncel olmayabilir')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Yeniden yükle' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/**
 * Kategori seçilmemiş: editör ve liste yerine ne yapılacağını söyleyen boşluk.
 *
 * `selectedNodeId` opsiyonel ve ilk açılışta boş gelebilir; ağaç da kapalı
 * başlar (altı kök).
 */
export const NoSelection: Story = {
  args: {
    state: { status: 'success', data: { tree: KATEGORI_AGACI, attributes: [] } },
  },
}

/** Öznitelik seçilmemiş: liste dolu, editör ne yapılacağını söylüyor. */
export const NoEditorValue: Story = {}

/** Kategori seçili ama hiç öznitelik tanımlanmamış. */
export const WithoutAttributes: Story = {
  args: {
    state: {
      status: 'success',
      data: { tree: KATEGORI_AGACI, attributes: [], selectedNodeId: ListingCategory.Building },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Bu kategoride öznitelik yok')).toBeInTheDocument()
    /* Ana eylem yok: "Öznitelik ekle" olurdu, kanalı yok. */
    await expect(canvas.queryByRole('button', { name: /Öznitelik ekle/ })).not.toBeInTheDocument()
  },
}

/**
 * Pasif kategori: ağaçta soluk, detayda rozetli.
 *
 * Rozet detayda tekrar ediliyor çünkü dar ekranda ağaç görünmüyor ve kullanıcı
 * pasif bir kategorinin özniteliklerini düzenlediğini bilmeli.
 */
export const PassiveCategory: Story = {
  args: {
    state: {
      status: 'success',
      data: {
        tree: KATEGORI_AGACI,
        attributes: [],
        selectedNodeId: ListingCategory.Timeshare,
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Pasif kategori')).toBeInTheDocument()
  },
}

/** Alt kategori seçili: atası açık gelmeli — o yolu ağaç değil ekran kurar. */
export const SubCategorySelected: Story = {
  args: {
    state: {
      status: 'success',
      data: {
        tree: KATEGORI_AGACI,
        attributes: KONUT_OZNITELIKLERI,
        selectedNodeId: altId(ListingCategory.Residential, ResidentialSubCategory.Villa),
      },
    },
    editorValue: ODA_SAYISI,
    editorMode: 'edit',
  },
  play: async ({ canvasElement }) => {
    /* Ağaca kapsanıyor: "Villa" editörün kapsam rozetlerinde de yazılı
       (`ODA_SAYISI.appliesToSubCategories`) ve kapsanmayan sorgu iki eşleşme
       bulup düşüyordu — bkz. `agacIcinde`. */
    const agac = agacIcinde(canvasElement)

    /* Seçili yaprak görünür olmalı: atası kapalı kalsaydı DOM'da hiç olmazdı. */
    await expect(agac.getByText('Villa')).toBeInTheDocument()
    await expect(agac.getByText('Villa').closest('[role="treeitem"]')).toHaveAttribute(
      'aria-selected',
      'true',
    )
  },
}

/** Yeni öznitelik: kapsam ağaçtan gelmiş, gerisi boş. */
export const CreateMode: Story = {
  args: {
    editorValue: {
      category: ListingCategory.Residential,
      appliesToSubCategories: [ResidentialSubCategory.Apartment],
      appliesToTransactionTypes: [ResidentialTransactionType.Sale],
      dataType: AttributeDataType.Text,
      required: false,
      filterable: false,
      visibleInList: true,
      active: true,
      order: 18,
      options: [],
      validation: {},
    },
    editorMode: 'create',
    dirty: true,
  },
}

/**
 * `category:manage` izni olmayan kullanıcı.
 *
 * Editör **`disabled` değil `readOnly`**: kilitli bir form okunmak için değil,
 * dokunulmamak için tasarlanmıştır (soluk kontrast, kayıp odak). Yetkiyi taşıyan
 * ayrı bir prop yok — `CategoryAttributePageProps` izin listesi almıyor ve
 * `editorMode` bu bilgiyi taşıyan tek alan. Raporlandı.
 */
export const ReadOnlyWithoutPermission: Story = {
  args: { editorValue: ISITMA_TIPI, editorMode: 'readOnly' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await detayaGec(canvasElement)

    await expect(canvas.getByText('Salt okunur')).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Kaydet' })).not.toBeInTheDocument()
  },
}

/*
  `ValidationErrors` story'si **yazılamadı**: kanalı yok.

  Brifing 2.7 `validationError`'ı bir ekran durumu sayıyor ve `AttributeEditor`
  onu gösterecek prop'u taşıyor (`validationErrors: Record<string, string>`, alan
  adına göre ilgili kutunun `error`'ına bağlanıyor) — ama
  `CategoryAttributePageProps`'ta o değeri editöre **geçirecek** hiçbir alan yok.
  Ekran onları kendi de üretemez: doğrulama ("bu anahtar bu kategoride zaten
  kullanılıyor") sunucuyu gerektiriyor ve ekran veri çekmiyor. Eksik olan tek
  şey bir `editorValidationErrors?: Record<string, string>` prop'u; eklenene
  kadar bu ekranda alan hatası gösterilemez. Raporlandı.
*/

/**
 * Uzun içerik: uzun kategori adı, uzun öznitelik etiketi ve boşluksuz uzun bir
 * anahtar. Hiçbiri kabı taşırmamalı.
 */
export const LongContent: Story = {
  args: {
    state: {
      status: 'success',
      data: {
        tree: [
          {
            id: 'imar',
            label: 'Arsa ve İmar Durumu Değerlendirmesi Bekleyen Parseller',
            active: true,
            count: 128_460,
            children: [
              {
                id: 'imar-revizyon',
                label: 'Turizm İmarlı Sahil Bandı Parseli — İmar Planı Revizyonu Beklemede',
                active: true,
                count: 9_412,
              },
            ],
          },
          ...KATEGORI_AGACI,
        ],
        attributes: [
          {
            ...ISITMA_TIPI,
            /* Ayrı `id`: DataTable satır anahtarını `row.id`'den alıyor, aynı
               kimlik iki satırda React anahtarını çakıştırırdı. */
            id: 'attr-konut-isitma-detayli',
            key: 'binaninAnaIsitmaSistemiVeKullanilanYakitTuruBilgisiDetayli',
            label:
              'Binanın Ana Isıtma Sistemi ve Kullanılan Yakıt Türü (merkezi sistemlerde pay ölçer dahil)',
          },
          ...KONUT_OZNITELIKLERI,
        ],
        selectedNodeId: 'imar-revizyon',
      },
    },
    editorValue: {
      ...ISITMA_TIPI,
      label:
        'Binanın Ana Isıtma Sistemi ve Kullanılan Yakıt Türü (merkezi sistemlerde pay ölçer dahil)',
      description:
        'Konutun ısıtmasının hangi sistemle sağlandığını belirtir. Merkezi sistemlerde pay ölçer bulunup bulunmadığı, kombi kullanılan dairelerde cihazın yaşı ve son bakım tarihi ilan sahibinden ayrıca istenir; bu alan yalnız ana sistemi kaydeder.',
    },
    editorMode: 'edit',
  },
  play: async ({ canvasElement }) => {
    /* İki pano iki ayrı ölçüm: test viewport'unda (414px) aynı anda yalnız biri
       görünüyor, dolayısıyla tek ölçüm ötekini hiç sınamazdı. Önce ağaç
       (uzun kategori adı), sonra detay (dokuz sütunlu tablo + uzun etiket). */
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)

    await detayaGec(
      canvasElement,
      'Turizm İmarlı Sahil Bandı Parseli — İmar Planı Revizyonu Beklemede',
    )
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth)
  },
}

/* ──────────────────────────────────────────────────────────────────────────
   Ölçümler
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Ekranın `<h1>`'i olmamalı, başlıklar `<h2>`'den başlamalı.
 *
 * Sayfanın `<h1>`'i PageHeader'ın; ekran kendi kabuğunu render etmiyor. İki
 * `<h1>` olsaydı başlık listesi yalan söylerdi — kabuk gelince fark edilmesi zor
 * bir hata.
 */
export const HeadingsStartAtLevelTwo: Story = {
  args: { editorValue: ISITMA_TIPI, editorMode: 'edit' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /*
      Hepsi `{ hidden: true }`: iki pano test viewport'unda (414px) aynı anda
      görünmüyor — drill-down'un tanımı bu. İddia "DOM'da doğru düzeyde başlıklar
      var, `<h1>` hiç yok" düzeyinde ve viewport'tan bağımsız. Yokluk iddiası da
      böylece güçleniyor: "gizli değil, hiç yok".
    */
    await expect(canvas.queryByRole('heading', { level: 1, hidden: true })).not.toBeInTheDocument()
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Kategoriler', hidden: true }),
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Konut öznitelikleri', hidden: true }),
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('heading', { level: 3, name: 'Tanımlı öznitelikler', hidden: true }),
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('heading', { level: 3, name: 'Öznitelik düzenleyici', hidden: true }),
    ).toBeInTheDocument()
  },
}

/**
 * Etiketler domain'den gelmeli: enum değeri hiçbir ekranda görünmez.
 *
 * Üç bayrak sütunu `BOOLEAN_IS_LABEL`'dan okunuyor, `BOOLEAN_HAS_LABEL`'dan
 * değil: "zorunlu mu?" bir önermenin doğruluğu ("Evet"), bir niteliğin varlığı
 * ("Var") değil. Karıştırılsaydı tabloda "Zorunlu: Var" yazardı.
 */
export const LabelsComeFromDomain: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const agac = agacIcinde(canvasElement)

    /* `getByText` görünürlüğe bakmaz (rol sorgusunun aksine): drill-down'da gizli
       kalan tabloda da ölçüyor. İki `singleSelect` var — Isıtma Tipi ve pasif
       Yakıt Tipi — dolayısıyla sayıya dayalı sorgu şart. */
    await expect(canvas.getAllByText('Tekli Seçim')).toHaveLength(2)
    await expect(canvas.getByText('Çoklu Seçim')).toBeInTheDocument()
    await expect(canvas.getByText('Evet/Hayır')).toBeInTheDocument()
    await expect(canvas.queryByText('singleSelect')).not.toBeInTheDocument()

    /*
      Arsa **önce açılıyor**: `CategoryTree` kapalı bir dalın çocuklarını hiç
      render etmiyor (`gorunurDugumler`), dolayısıyla kapalı ağaçta "Konut
      İmarlı" DOM'da bile yoktu ve aşağıdaki iddia "bulunamadı" ile düşüyordu —
      yani ayrımı ölçtüğünü sanıp hiç sınamıyordu. Satıra tıklamak seçer **ve
      açar**; CategoryTree'nin sözleşmesi bu (`satirSecildi`). Bu ekranda seçim
      story'nin sabit `state`'ini değiştirmiyor, ölçüm kirlenmiyor.
    */
    await userEvent.click(agac.getByText('Arsa'))

    /* "Konut" kökü, Arsa'nın "Konut İmarlı"sıyla karışmamalı: `getByText` yalnız
       doğrudan metin çocuklarına bakar, ad sorgusu ikisini karıştırırdı. */
    await expect(agac.getByText('Konut')).toBeInTheDocument()
    await expect(agac.getByText('Konut İmarlı')).toBeInTheDocument()
  },
}

/**
 * Üç bayrak sütunu yedi satırın hepsinde bir değer basmalı.
 *
 * Sayıya dayalı iddia bilerek: `toHaveTextContent('Evet')` alt dize arar ve
 * "Evet/Hayır" veri tipi etiketiyle de eşleşirdi — bu repoda ölçülmüş bir tuzak.
 * `getAllByText` tam metin eşleştirir ve sayı, hücrelerin **hepsinin**
 * dolduğunu da doğrular: 7 satır × 3 sütun = 21.
 */
export const FlagColumnsReadAsEvetHayir: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Zorunlu: Oda Sayısı ve Isıtma Tipi → 2 "Evet", 5 "Hayır".
       Filtrelenebilir: Site Adı ve Yakıt Tipi dışında hepsi → 5 "Evet", 2 "Hayır".
       Listede görünür: Oda Sayısı ve Asansör → 2 "Evet", 5 "Hayır". */
    await expect(canvas.getAllByText('Evet')).toHaveLength(9)
    await expect(canvas.getAllByText('Hayır')).toHaveLength(12)
  },
}

/** Düğüm seçimi yalnız bildirilir: seçimi ekran değil çağıran tutar. */
export const SelectingNodeNotifiesCaller: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(agacIcinde(canvasElement).getByText('Arsa'))

    await expect(args.onNodeSelect).toHaveBeenCalledTimes(1)
    await expect(args.onNodeSelect).toHaveBeenCalledWith(ListingCategory.Land)
  },
}

/**
 * Özniteliği editöre yükleyen yol **düğme**, satır tıklaması değil.
 *
 * `DataTableProps.onRowClick` `<tr>`'ye yalnız `onClick` koyuyor; satırın rolü de
 * `tabIndex`'i de yok, yani klavye kullanıcısı hiçbir özniteliği açamazdı.
 * Düğmenin adı satırın etiketini taşıyor: yedi satırda yedi kez "Aç" duyan ekran
 * okuyucu kullanıcısı hangisini açtığını bilemezdi.
 */
export const OpeningAttributeSendsWholeDefinition: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await detayaGec(canvasElement)

    await userEvent.click(
      canvas.getByRole('button', { name: 'Isıtma Tipi tanımını düzenleyicide aç' }),
    )

    await expect(args.onEditorChange).toHaveBeenCalledTimes(1)
    await expect(args.onEditorChange).toHaveBeenCalledWith(ISITMA_TIPI)
  },
}

/** Her satırın düğmesi ayrı adlandırılmalı: yedi satır, yedi benzersiz ad. */
export const RowButtonsAreDistinguishable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await detayaGec(canvasElement)

    await expect(
      canvas.getAllByRole('button', { name: /tanımını düzenleyicide aç$/ }),
    ).toHaveLength(7)
    await expect(
      canvas.getByRole('button', { name: 'Yakıt Tipi tanımını düzenleyicide aç' }),
    ).toBeInTheDocument()
  },
}

/**
 * `editorMode` verilmezse editör `readOnly` açılmalı.
 *
 * Yetki listesi sözleşmede yok ve `category:manage` yalnız `superAdmin`'de
 * (brifing 1.4): varsayılanı `edit` yapmak, modu göndermeyi unutan çağırana
 * sessizce düzenleme yetkisi verirdi. Testin ölçtüğü şey kutuların **yokluğu** —
 * `readOnly` kontrol değil metin gösterir.
 */
export const EditorDefaultsToReadOnly: Story = {
  args: { editorValue: ISITMA_TIPI },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    /* Drill-down'a geçilmezse kutuların yokluğu **yanlış sebeple** doğru çıkardı:
       gizli pano zaten hiçbir rolü ağaca vermiyor. */
    await detayaGec(canvasElement)

    await expect(canvas.getByText('Salt okunur')).toBeInTheDocument()
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument()
    await expect(canvas.queryByRole('combobox')).not.toBeInTheDocument()
  },
}

/**
 * Yayın onay ister.
 *
 * Kaydedilmemiş taslak varken uyarı metne ekleniyor: yayın **kaydedilmiş**
 * tanımları alır, editördeki taslağı değil. Dialog onayla kapanıyor çünkü bu
 * ekranda gösterilecek bir yayın hatası kanalı yok; kanal gelince dialog
 * `loading` ile açık kalmalı.
 */
export const PublishAsksForConfirmation: Story = {
  args: { editorValue: ISITMA_TIPI, editorMode: 'edit' },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Değişiklikleri yayınla' }),
    )

    /* Açılış animasyonu bekleniyor: `toBeVisible` ilk karede `opacity: 0` görüp
       düşüyordu — iddia doğru, ölçüm erkendi (bkz. `dialogGorunurOlsun`). */
    await dialogGorunurOlsun('Değişiklikleri yayınla')
    await expect(args.onPublish).not.toHaveBeenCalled()

    const dialog = dialogIcinde()
    await userEvent.click(dialog.getByRole('button', { name: 'Yayınla' }))
    await expect(args.onPublish).toHaveBeenCalledTimes(1)

    await popupKapanmasiniBekle()
  },
}

/** Vazgeçilen yayın çalışmamalı. Dialog açık bırakılmıyor: kapanışı bekleniyor. */
export const PublishCanBeCancelled: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Değişiklikleri yayınla' }),
    )

    const dialog = dialogIcinde()
    await userEvent.click(await dialog.findByRole('button', { name: 'Vazgeç' }))

    await expect(args.onPublish).not.toHaveBeenCalled()
    await popupKapanmasiniBekle()
  },
}

/**
 * Kaydedilmemiş taslak varken kategori değiştirmek **önce sorar**.
 *
 * `AttributeEditorProps.dirty`'nin kendi cümlesi: "kullanıcı ayrılmak isterse
 * uyarılabilir". Sormasaydı taslak sessizce silinirdi ve ekranın onu geri
 * getirecek bir kanalı yok.
 */
export const DirtyNodeSwitchAsksFirst: Story = {
  args: {
    editorValue: { ...ISITMA_TIPI, label: 'Isıtma Sistemi' },
    editorMode: 'edit',
    dirty: true,
  },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(agacIcinde(canvasElement).getByText('Arsa'))

    /* Seçim henüz gitmedi: dialog cevaplanmadan çağıran haberdar edilmemeli. */
    await expect(args.onNodeSelect).not.toHaveBeenCalled()

    /* Açılış animasyonu bekleniyor: bkz. `dialogGorunurOlsun`. */
    await dialogGorunurOlsun('Kaydedilmemiş değişiklikleri at')

    const dialog = dialogIcinde()
    await userEvent.click(dialog.getByRole('button', { name: 'Değişiklikleri at' }))
    await expect(args.onNodeSelect).toHaveBeenCalledWith(ListingCategory.Land)

    await popupKapanmasiniBekle()
  },
}

/** Vazgeçilen geçiş taslağı korumalı: seçim değişmez. */
export const DirtyNodeSwitchCanBeCancelled: Story = {
  args: {
    editorValue: { ...ISITMA_TIPI, label: 'Isıtma Sistemi' },
    editorMode: 'edit',
    dirty: true,
  },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(agacIcinde(canvasElement).getByText('Arsa'))

    const dialog = dialogIcinde()
    await userEvent.click(await dialog.findByRole('button', { name: 'Vazgeç' }))

    await expect(args.onNodeSelect).not.toHaveBeenCalled()
    await popupKapanmasiniBekle()
  },
}

/** Taslak temizken soru sorulmaz: onay bir engel değil, bir koruma. */
export const CleanNodeSwitchDoesNotAsk: Story = {
  args: { editorValue: ISITMA_TIPI, editorMode: 'edit', dirty: false },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(agacIcinde(canvasElement).getByText('Arsa'))

    await expect(args.onNodeSelect).toHaveBeenCalledWith(ListingCategory.Land)
    await expect(document.querySelector('[role="dialog"]')).toBeNull()
  },
}

/** Kaydedilmemiş taslak varken başka bir öznitelik açmak da sorar. */
export const DirtyAttributeSwitchAsksFirst: Story = {
  args: {
    editorValue: { ...ISITMA_TIPI, label: 'Isıtma Sistemi' },
    editorMode: 'edit',
    dirty: true,
  },
  play: async ({ canvasElement, args }) => {
    await detayaGec(canvasElement)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Aidat tanımını düzenleyicide aç' }),
    )

    await expect(args.onEditorChange).not.toHaveBeenCalled()

    const dialog = dialogIcinde()
    await userEvent.click(await dialog.findByRole('button', { name: 'Değişiklikleri at' }))
    await expect(args.onEditorChange).toHaveBeenCalledWith(AIDAT)

    await popupKapanmasiniBekle()
  },
}

/**
 * Düzenlenen özniteliği yeniden açmak taslağı **atmamalı**.
 *
 * Sessiz veri kaybının en kolay hâli: aynı satırın düğmesine ikinci kez basmak
 * `onEditorChange(sunucudakiKopya)` gönderirdi ve kullanıcı yazdıklarını
 * kaybederdi.
 */
export const ReopeningTheEditedAttributeIsNoOp: Story = {
  args: {
    editorValue: { ...ISITMA_TIPI, label: 'Isıtma Sistemi' },
    editorMode: 'edit',
    dirty: true,
  },
  play: async ({ canvasElement, args }) => {
    await detayaGec(canvasElement)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Isıtma Tipi tanımını düzenleyicide aç' }),
    )

    await expect(args.onEditorChange).not.toHaveBeenCalled()
    await expect(document.querySelector('[role="dialog"]')).toBeNull()
  },
}

/**
 * Gerçek durumla: seçim, taslak ve mod çağıranda.
 *
 * Ekranın kendi tuttuğu tek şey gösterim durumu (açık dallar, mobil pano, onay
 * dialog'u). `dirty` burada karşılaştırmayla hesaplanıyor — sözleşmenin
 * "çağıran hesaplar" dediği yer tam olarak burası.
 */
export const Interactive: Story = {
  render: function Render(args) {
    const [seciliId, setSeciliId] = useState<string>(ListingCategory.Residential)
    const [taslak, setTaslak] = useState<Partial<CategoryAttributeDefinition> | undefined>(
      undefined,
    )

    /* Story ölçeğinde yeterli bir karşılaştırma: alanlar aynı sırada üretiliyor
       (taslak sunucudaki kopyanın üstüne yazılıyor), dolayısıyla dize eşitliği
       "değişti mi" sorusunu doğru cevaplıyor. Gerçek uygulamada bu iş sorgu
       katmanının. */
    const sunucudakiHali = KONUT_OZNITELIKLERI.find((tanim) => tanim.id === taslak?.id)
    const kirli = taslak !== undefined && JSON.stringify(taslak) !== JSON.stringify(sunucudakiHali)

    return (
      <CategoryAttributePage
        {...args}
        state={{
          status: 'success',
          data: { tree: KATEGORI_AGACI, attributes: KONUT_OZNITELIKLERI, selectedNodeId: seciliId },
        }}
        /* Koşullu spread: `exactOptionalPropertyTypes` açıkken
           `editorValue={undefined}` yazılamaz (TS2375). */
        {...(taslak !== undefined && { editorValue: taslak, editorMode: 'edit' as const })}
        dirty={kirli}
        onNodeSelect={(id) => setSeciliId(id)}
        onEditorChange={(next) => setTaslak(next)}
      />
    )
  },
}
