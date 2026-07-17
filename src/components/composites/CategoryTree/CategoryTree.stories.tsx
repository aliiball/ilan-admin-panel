import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import {
  BuildingSubCategory,
  CommercialSubCategory,
  LandSubCategory,
  ListingCategory,
  ResidentialSubCategory,
  TimeshareSubCategory,
  TourismFacilitySubCategory,
  type ListingSubCategory,
} from '../../../types/domain'
import { LISTING_CATEGORY_LABEL, LISTING_SUB_CATEGORY_LABEL } from '../../../domain/labels'
import type { CategoryTreeNode } from '../../../types/component-props'
import { CategoryTree } from './CategoryTree'
import * as css from './CategoryTree.css'

const VARYANTLAR = ['sidebar', 'panel', 'compact'] as const

/**
 * Alt kategori düğümünün kimliği.
 *
 * Kök kimliği `ListingCategory`'nin kendisi; alt kategoriler öneklendiriliyor
 * çünkü değerler kategori boyunca benzersiz **değil** — Devremülk kategorisinin
 * değeri de tek alt kategorisinin değeri de `devremulk`. Önek olmasa iki düğüm
 * aynı `id`'yi taşır ve seçim ikisini birden vururdu.
 */
const altId = (category: ListingCategory, sub: ListingSubCategory) => `${category}-${sub}`

const alt = (
  category: ListingCategory,
  sub: ListingSubCategory,
  count: number,
  active = true,
): CategoryTreeNode => ({
  id: altId(category, sub),
  /* Etiket domain'den: aynı kategori ağaçta, filtrede ve ilan kartında aynı yazılır. */
  label: LISTING_SUB_CATEGORY_LABEL[sub],
  active,
  count,
})

/**
 * Kök düğüm. Sayaç çocuklarının toplamı: `count`'un alt düğümleri kapsayıp
 * kapsamadığına **çağıran** karar veriyor (bkz. `CategoryTreeNode.count`) ve
 * kategori yönetiminde beklenen okuma "Konut'ta toplam kaç ilan var".
 */
const kok = (
  category: ListingCategory,
  children: CategoryTreeNode[],
  active = true,
): CategoryTreeNode => ({
  id: category,
  label: LISTING_CATEGORY_LABEL[category],
  category,
  active,
  children,
  count: children.reduce((toplam, cocuk) => toplam + (cocuk.count ?? 0), 0),
})

/**
 * Brifing 1.1'in kategori ağacı: altı kök, yirmi sekiz alt kategori.
 *
 * Sayılar sabit — `Math.random`/`Date.now` yok. Fixture'ın kendisi iki domain
 * durumunu da taşıyor: Prefabrik ile Kamp Yeri pasife alınmış yapraklar,
 * Devremülk ise pasife alınmış bir **kök** (kategorinin tamamı yayından
 * kaldırılmış ama 62 ilanı ve öznitelikleri duruyor).
 */
const KATEGORI_AGACI: CategoryTreeNode[] = [
  kok(ListingCategory.Residential, [
    alt(ListingCategory.Residential, ResidentialSubCategory.Apartment, 4820),
    alt(ListingCategory.Residential, ResidentialSubCategory.Residence, 610),
    alt(ListingCategory.Residential, ResidentialSubCategory.DetachedHouse, 342),
    alt(ListingCategory.Residential, ResidentialSubCategory.Villa, 288),
    alt(ListingCategory.Residential, ResidentialSubCategory.SummerHouse, 174),
    alt(ListingCategory.Residential, ResidentialSubCategory.FarmHouse, 46),
    alt(ListingCategory.Residential, ResidentialSubCategory.Prefabricated, 31, false),
  ]),

  kok(ListingCategory.Land, [
    alt(ListingCategory.Land, LandSubCategory.ResidentialZoned, 912),
    alt(ListingCategory.Land, LandSubCategory.CommercialZoned, 388),
    alt(ListingCategory.Land, LandSubCategory.IndustrialZoned, 141),
    alt(ListingCategory.Land, LandSubCategory.TourismZoned, 77),
    alt(ListingCategory.Land, LandSubCategory.Field, 654),
    alt(ListingCategory.Land, LandSubCategory.VineyardGarden, 209),
  ]),

  kok(ListingCategory.Commercial, [
    alt(ListingCategory.Commercial, CommercialSubCategory.ShopStore, 1163),
    alt(ListingCategory.Commercial, CommercialSubCategory.Office, 842),
    alt(ListingCategory.Commercial, CommercialSubCategory.Plaza, 58),
    alt(ListingCategory.Commercial, CommercialSubCategory.Warehouse, 274),
    alt(ListingCategory.Commercial, CommercialSubCategory.Factory, 96),
    alt(ListingCategory.Commercial, CommercialSubCategory.Workshop, 187),
  ]),

  kok(ListingCategory.Building, [
    alt(ListingCategory.Building, BuildingSubCategory.CompleteBuilding, 143),
  ]),

  kok(
    ListingCategory.Timeshare,
    [alt(ListingCategory.Timeshare, TimeshareSubCategory.Timeshare, 62, false)],
    false,
  ),

  kok(ListingCategory.TourismFacility, [
    alt(ListingCategory.TourismFacility, TourismFacilitySubCategory.Hotel, 118),
    alt(ListingCategory.TourismFacility, TourismFacilitySubCategory.BoutiqueHotel, 64),
    alt(ListingCategory.TourismFacility, TourismFacilitySubCategory.ApartHotel, 39),
    alt(ListingCategory.TourismFacility, TourismFacilitySubCategory.Pension, 52),
    alt(ListingCategory.TourismFacility, TourismFacilitySubCategory.Motel, 17),
    alt(ListingCategory.TourismFacility, TourismFacilitySubCategory.HolidayVillage, 23),
    alt(ListingCategory.TourismFacility, TourismFacilitySubCategory.Campground, 11, false),
  ]),
]

/** Sayaçsız ağaç: `count` verilmezse satırda sayı hiç görünmemeli. */
const SAYACSIZ: CategoryTreeNode[] = KATEGORI_AGACI.map((kokDugum) => ({
  id: kokDugum.id,
  label: kokDugum.label,
  active: kokDugum.active,
  children: (kokDugum.children ?? []).map((cocuk) => ({
    id: cocuk.id,
    label: cocuk.label,
    active: cocuk.active,
  })),
}))

const TUM_KOKLER = KATEGORI_AGACI.map((kokDugum) => kokDugum.id)

/**
 * Etiketiyle bir düğüm.
 *
 * Sorgu satırın **etiket kutusuna** iniyor, düğümün adına değil: kökteki "Konut"
 * ile Arsa'nın "Konut İmarlı"sı ad sorgusunda birbirine karışır, etiket
 * kutusunun kendi metni ise tam eşleşir. Kutudan `closest` ile `treeitem`'a
 * çıkılıyor.
 */
const dugum = (canvasElement: HTMLElement, etiket: string): HTMLElement => {
  const treeitem = within(canvasElement).getByText(etiket).closest('[role="treeitem"]')
  if (treeitem === null) throw new Error(`"${etiket}" bir treeitem içinde değil`)

  return treeitem as HTMLElement
}

/** Düğümün satır kutusu. `aria-labelledby` zaten oraya işaret ediyor. */
const satirKutusu = (treeitem: HTMLElement): HTMLElement => {
  const id = treeitem.getAttribute('aria-labelledby') ?? ''
  const satir = treeitem.ownerDocument.getElementById(id)
  if (satir === null) throw new Error('Düğümün aria-labelledby hedefi yok')

  return satir
}

const meta = {
  title: 'Composites/CategoryTree',
  component: CategoryTree,

  tags: ['stable'],

  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '**Açıklık kontrollü, odak değil.** `expandedIds` dışarıdan gelir — derin bir düğüm ' +
          'seçiliyken atalarının açık gelmesi gerekir ve o yolu ancak veriyi bilen katman kurar. ' +
          'Roving tabindex (ağacın tamamı tek Tab durağı) ve ok tuşlarıyla gezinme ağacın kendi ' +
          'işi. **Satıra tıklamak seçer ve açar, asla kapatmaz**: seçim birincil eylem (brifing ' +
          '2.7) ve dokunmatik kullanıcının 44 piksellik tek açma hedefi satırın kendisi; kapatmak ' +
          'oka ve sol ok tuşuna bırakıldı. Pasif düğüm **solar ama gizlenmez** — özniteliklerini ' +
          'düzenlemek onu yeniden yayına almanın ilk adımı. Hata kanalı yok: ağaç veri çekmez, ' +
          'yükleme başarısızsa sayfa ağacın yerine `ErrorState` gösterir.',
      },
    },
    ai: {
      project: 'admin-panel',
      role: 'navigation-tree',
      useWhen: [
        'Kategori ve öznitelik yönetiminde kategori hiyerarşisinde gezinilecekse',
        'Bir kategori düğümü seçilip sağdaki editöre bağlanacaksa',
      ],
      doNotUseWhen: [
        'Panelin ana gezinme menüsü için — SidebarNav kullanın',
        'Kategori seçtiren bir form alanı için — Select veya Combobox kullanın',
        'Kategoriye göre süzme için — FilterBar kullanın',
      ],
    },
  },

  args: {
    nodes: KATEGORI_AGACI,
    expandedIds: [ListingCategory.Residential],
    variant: 'sidebar',
    loading: false,
    onSelect: fn(),
    onExpandedIdsChange: fn(),
  },

  argTypes: {
    variant: { control: 'inline-radio', options: VARYANTLAR },
    loading: { control: 'boolean' },
    selectedId: { control: 'text' },
    nodes: { control: false },
    expandedIds: { control: false },
  },

  /* Ağaç dar bir kolonda yaşıyor; tam genişlikte kırpma ve girinti görünmez. */
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '22rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CategoryTree>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Dar kolon: kategori yönetiminin sol paneli. */
export const Sidebar: Story = {
  args: { variant: 'sidebar' },
}

/** Geniş kart: kendi yüzeyi var, satırlar ferah, pasiflik rozetle söyleniyor. */
export const Panel: Story = {
  args: { variant: 'panel' },
}

/** Sıkışık: dialog ve yan panel. Girinti daralır, satır yüksekliği düşmez. */
export const Compact: Story = {
  args: { variant: 'compact' },
}

/**
 * Yükleme: Skeleton'ın tamamı `aria-hidden`, dolayısıyla meşguliyeti kapsayan
 * kutu duyuruyor. Yarım bir `role="tree"` duyurulmuyor — boş bir ağaç, hiç ağaç
 * olmamasından kötü.
 */
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[aria-busy="true"]')).not.toBeNull()
    await expect(within(canvasElement).queryByRole('tree')).not.toBeInTheDocument()
  },
}

/** Kategori tanımı yok: boşluk bir yapılandırma eksikliği. */
export const Empty: Story = {
  args: { nodes: [] },
}

/** Seçili yaprak: atası açık gelmeli — o yolu çağıran kurar. */
export const Selected: Story = {
  args: {
    expandedIds: [ListingCategory.Residential],
    selectedId: altId(ListingCategory.Residential, ResidentialSubCategory.Villa),
  },
}

/** Seçili kök: kategorinin kendi öznitelikleri düzenleniyor. */
export const SelectedRoot: Story = {
  args: { selectedId: ListingCategory.Commercial },
}

/** Hepsi kapalı: altı kök, ağacın ilk açılışı. */
export const Collapsed: Story = {
  args: { expandedIds: [] },
}

/** İki dal birden açık. */
export const Expanded: Story = {
  args: { expandedIds: [ListingCategory.Residential, ListingCategory.TourismFacility] },
}

/** Hepsi açık: otuz dört satır, kolon kaydırılıyor. */
export const AllExpanded: Story = {
  args: { expandedIds: TUM_KOKLER },
}

/** `count` yoksa sayaç hiç çizilmez — sıfır ile "bilinmiyor" karıştırılmaz. */
export const WithoutCounts: Story = {
  args: { nodes: SAYACSIZ, expandedIds: [ListingCategory.Residential] },
}

/**
 * Pasif kategoriler: Devremülk kökü ve iki yaprak yayından kaldırılmış.
 *
 * Solmuşlar ama listede duruyorlar ve tıklanabilirler: pasif kategorinin
 * özniteliklerini düzenlemek onu geri getirmenin ilk adımı.
 */
export const PassiveNodes: Story = {
  args: { expandedIds: [ListingCategory.Timeshare, ListingCategory.TourismFacility] },
}

/** Pasiflik `panel`'de rozetle söylenir. */
export const PassiveNodesInPanel: Story = {
  args: {
    variant: 'panel',
    expandedIds: [ListingCategory.Timeshare, ListingCategory.TourismFacility],
  },
}

/** Uzun etiket kırpılır, satırı taşırmaz; sayaç ve pasiflik yerinde kalır. */
export const LongContent: Story = {
  args: {
    expandedIds: ['imar'],
    selectedId: 'imar-revizyon',
    nodes: [
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
          {
            id: 'imar-iptal',
            label: 'Sanayi İmarlı Organize Bölge Parseli — Plan Notu İptal Edildi',
            active: false,
            count: 3,
          },
        ],
      },
      ...KATEGORI_AGACI,
    ],
  },
}

/** 320 pikselde: girinti, ok ve sayaç birlikte sığmalı, yatay kaydırma olmamalı. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile320' } },
  args: {
    expandedIds: [ListingCategory.Residential],
    selectedId: altId(ListingCategory.Residential, ResidentialSubCategory.Apartment),
  },
}

/**
 * Ağacın iskeleti ölçülüyor: rol, kademe ve açıklık.
 *
 * "Hiyerarşi ekran okuyucuda da hiyerarşidir" iddiası koddan bakınca hep doğru
 * görünür; bu repoda testler geçerken erişilebilirlik iddialarının yanlış çıktığı
 * görüldü.
 */
export const TreeSemantics: Story = {
  args: { expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('tree', { name: 'Kategori ağacı' })).toBeInTheDocument()
    await expect(canvas.getAllByRole('treeitem')).toHaveLength(13)

    /* Yalnız açık dal bir grup üretir: kapalı dalın çocukları hiç render edilmez. */
    await expect(canvas.getAllByRole('group')).toHaveLength(1)

    const konut = dugum(canvasElement, 'Konut')
    await expect(konut).toHaveAttribute('aria-level', '1')
    await expect(konut).toHaveAttribute('aria-expanded', 'true')

    const arsa = dugum(canvasElement, 'Arsa')
    await expect(arsa).toHaveAttribute('aria-expanded', 'false')

    const daire = dugum(canvasElement, 'Daire')
    await expect(daire).toHaveAttribute('aria-level', '2')
    /* Yaprakta `aria-expanded` hiç olmamalı: açılacak bir şey yok. */
    await expect(daire).not.toHaveAttribute('aria-expanded')
  },
}

/**
 * Düğümün adı satırından gelmeli, alt ağacından değil.
 *
 * `aria-labelledby` olmasaydı `treeitem`'ın adı "içerikten" hesaplanır ve içine
 * gömülü `role="group"` da hesaba katılırdı: açık Konut düğümü ekran okuyucuda
 * "Konut Daire Rezidans Müstakil Ev Villa..." diye okunurdu. Test tam olarak bunu
 * yakalıyor.
 */
export const NodeNameExcludesSubtree: Story = {
  args: { expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement }) => {
    const konut = dugum(canvasElement, 'Konut')

    await expect(konut).toHaveAccessibleName(/^Konut\b/)
    await expect(konut).not.toHaveAccessibleName(/Rezidans/)
    await expect(konut).not.toHaveAccessibleName(/Villa/)
  },
}

/** Sayaç adın parçası: çıplak "4.820" neyi saydığını söylemez. */
export const CountIsPartOfTheName: Story = {
  args: { expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement }) => {
    const daire = dugum(canvasElement, 'Daire')

    await expect(daire).toHaveAccessibleName(/4\.820/)
    await expect(daire).toHaveAccessibleName(/ilan/)
  },
}

/** `count` verilmemişse satırda sayı olmamalı. */
export const WithoutCountsShowsNoNumber: Story = {
  args: { nodes: SAYACSIZ, expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement }) => {
    const daire = dugum(canvasElement, 'Daire')

    await expect(daire).toHaveAccessibleName('Daire')
    await expect(within(canvasElement).queryByText('4.820')).not.toBeInTheDocument()
  },
}

/**
 * `aria-selected` yalnız seçili düğümde olmalı.
 *
 * Her satıra `aria-selected="false"` yazmak on üç kez "seçili değil" dedirtir;
 * tek seçimli ağaçta ARIA bunu istemiyor.
 */
export const SelectionMarksOnlyOneNode: Story = {
  args: {
    expandedIds: [ListingCategory.Residential],
    selectedId: altId(ListingCategory.Residential, ResidentialSubCategory.Villa),
  },
  play: async ({ canvasElement }) => {
    await expect(dugum(canvasElement, 'Villa')).toHaveAttribute('aria-selected', 'true')
    await expect(canvasElement.querySelectorAll('[aria-selected]')).toHaveLength(1)
  },
}

/** Eşleşmeyen `selectedId` çökertmemeli, hiçbir düğümü de seçili göstermemeli. */
export const UnknownSelectedIdIsHarmless: Story = {
  args: { selectedId: 'boyle-bir-kategori-yok' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[aria-selected]')).toHaveLength(0)
    await expect(within(canvasElement).getAllByRole('treeitem').length).toBeGreaterThan(0)
  },
}

/**
 * Ağacın tamamı **tek** Tab durağı olmalı.
 *
 * `tabIndex={0}` seçili düğüme düşer; on üç satırı Tab ile geçmek zorunda kalan
 * klavye kullanıcısı ağacı kullanmaz.
 */
export const RovingTabIndexHasOneStop: Story = {
  args: {
    expandedIds: [ListingCategory.Residential],
    selectedId: altId(ListingCategory.Residential, ResidentialSubCategory.Villa),
  },
  play: async ({ canvasElement }) => {
    const duraklar = canvasElement.querySelectorAll('[role="treeitem"][tabindex="0"]')

    await expect(duraklar).toHaveLength(1)
    await expect(duraklar.item(0)).toBe(dugum(canvasElement, 'Villa'))
  },
}

/**
 * Seçili düğüm kapalı bir dalın içinde kalırsa durak ilk köke düşmeli.
 *
 * `tabIndex={0}` hiç render edilmeyen bir satıra verilseydi ağaca Tab ile
 * girilemezdi — ve bu, koda bakarak fark edilmesi en zor hâl.
 */
export const TabStopFallsBackWhenSelectionIsHidden: Story = {
  args: {
    expandedIds: [],
    selectedId: altId(ListingCategory.Residential, ResidentialSubCategory.Villa),
  },
  play: async ({ canvasElement }) => {
    const duraklar = canvasElement.querySelectorAll('[role="treeitem"][tabindex="0"]')

    await expect(duraklar).toHaveLength(1)
    await expect(duraklar.item(0)).toBe(dugum(canvasElement, 'Konut'))
  },
}

/** Yukarı/aşağı ok **görünen** sırayı izlemeli; Home ve End uçlara gitmeli. */
export const KeyboardArrowNavigation: Story = {
  args: { expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement }) => {
    dugum(canvasElement, 'Konut').focus()
    await expect(dugum(canvasElement, 'Konut')).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    await expect(dugum(canvasElement, 'Daire')).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    await expect(dugum(canvasElement, 'Rezidans')).toHaveFocus()

    await userEvent.keyboard('{ArrowUp}')
    await expect(dugum(canvasElement, 'Daire')).toHaveFocus()

    /* Son görünür satır: açık dalın çocukları araya girer, kapalıların girmez. */
    await userEvent.keyboard('{End}')
    await expect(dugum(canvasElement, 'Turistik Tesis')).toHaveFocus()

    await userEvent.keyboard('{Home}')
    await expect(dugum(canvasElement, 'Konut')).toHaveFocus()
  },
}

/**
 * Sağ ok kapalı düğümü açar, açık düğümde ilk çocuğa iner; sol ok açık düğümü
 * kapatır, yaprakta ataya çıkar. WAI-ARIA ağaç kalıbı.
 */
export const KeyboardExpandsAndCollapses: Story = {
  args: { expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement, args }) => {
    dugum(canvasElement, 'Konut').focus()

    /* Açık düğümde sağ ok gezinir, tekrar açmaz. */
    await userEvent.keyboard('{ArrowRight}')
    await expect(dugum(canvasElement, 'Daire')).toHaveFocus()
    await expect(args.onExpandedIdsChange).not.toHaveBeenCalled()

    /* Yaprakta sol ok ataya çıkar. */
    await userEvent.keyboard('{ArrowLeft}')
    await expect(dugum(canvasElement, 'Konut')).toHaveFocus()

    /* Açık düğümde sol ok kapatır — kararı çağıran uygular. */
    await userEvent.keyboard('{ArrowLeft}')
    await expect(args.onExpandedIdsChange).toHaveBeenCalledWith([])
  },
}

/**
 * Açıklık **kontrollü**: ağaç kendi kopyasını tutmamalı.
 *
 * `expandedIds` sabit bir arg olduğu için sağ ok yalnız haber verir, ağaç açılmaz.
 * Açılsaydı sözleşme kırılırdı: iki doğru kaynak olurdu ve çağıranın kurduğu yol
 * (derin seçimin ataları) ağacın kendi hafızasıyla çatışırdı.
 */
export const ExpansionIsControlled: Story = {
  args: { expandedIds: [] },
  play: async ({ canvasElement, args }) => {
    const konut = dugum(canvasElement, 'Konut')
    konut.focus()

    await userEvent.keyboard('{ArrowRight}')

    await expect(args.onExpandedIdsChange).toHaveBeenCalledWith([ListingCategory.Residential])
    await expect(konut).toHaveAttribute('aria-expanded', 'false')
    await expect(within(canvasElement).queryByText('Daire')).not.toBeInTheDocument()
  },
}

/** Kapalı satıra tıklamak hem seçer hem açar: dokunmatikte tek 44 piksellik hedef. */
export const RowClickSelectsAndExpands: Story = {
  args: { expandedIds: [] },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByText('Konut'))

    await expect(args.onSelect).toHaveBeenCalledWith(ListingCategory.Residential)
    await expect(args.onExpandedIdsChange).toHaveBeenCalledWith([ListingCategory.Residential])
  },
}

/**
 * Açık bir kökü seçmek onu **kapatmamalı**.
 *
 * Kapatsaydı "Konut"un özniteliklerine bakmak isteyen kullanıcı yedi alt
 * kategorisini kaybederdi. Seçim açıklığa dokunmuyor: `onExpandedIdsChange` hiç
 * çağrılmıyor, çünkü düğüm zaten açık.
 */
export const SelectingExpandedParentNeverCollapses: Story = {
  args: { expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByText('Konut'))

    await expect(args.onSelect).toHaveBeenCalledWith(ListingCategory.Residential)
    await expect(args.onExpandedIdsChange).not.toHaveBeenCalled()
    await expect(dugum(canvasElement, 'Konut')).toHaveAttribute('aria-expanded', 'true')
  },
}

/** Ok kapatır ama seçmez: kapatmak bilinçli, seçimden ayrı bir eylem. */
export const ToggleCollapsesWithoutSelecting: Story = {
  args: { expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement, args }) => {
    const ok = dugum(canvasElement, 'Konut').querySelector(`.${css.toggle}`)
    await expect(ok).not.toBeNull()

    await userEvent.click(ok as HTMLElement)

    await expect(args.onExpandedIdsChange).toHaveBeenCalledWith([])
    await expect(args.onSelect).not.toHaveBeenCalled()
  },
}

/**
 * Çocuğa tıklamak atasını seçmemeli.
 *
 * Tıklama `<li>`'de olsaydı çocuğun olayı bütün atalarına kabarır ve en dıştaki
 * ata en son seçilen olurdu: "Daire"ye basan kullanıcı "Konut" seçili bulurdu.
 * Çağrı sayısı ölçülüyor — tek `onSelect`, doğru kimlikle.
 */
export const ChildClickDoesNotSelectAncestor: Story = {
  args: { expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByText('Daire'))

    await expect(args.onSelect).toHaveBeenCalledTimes(1)
    await expect(args.onSelect).toHaveBeenCalledWith(
      altId(ListingCategory.Residential, ResidentialSubCategory.Apartment),
    )
  },
}

/**
 * Pasiflik yalnız renkle söylenmemeli.
 *
 * Dar varyantlarda düğüm soluyor — solma tek gösterge olsaydı renk körü
 * kullanıcı pasif kategoriyi ayırt edemezdi. İkon renksiz ikinci gösterge, gizli
 * metin de "Pasif"i düğümün adına ekliyor. Düğüm gizlenmiyor: yönetim ekranı.
 */
export const PassiveIsNotOnlyColor: Story = {
  args: { expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement }) => {
    const prefabrik = dugum(canvasElement, 'Prefabrik')

    await expect(prefabrik).toHaveAccessibleName(/Pasif/)
    await expect(prefabrik).toBeVisible()

    /* Aktif kardeşinin adına "Pasif" bulaşmamalı. */
    await expect(dugum(canvasElement, 'Villa')).not.toHaveAccessibleName(/Pasif/)
  },
}

/** `panel`'de pasiflik görünür rozetle söylenir. */
export const PassiveBadgeInPanel: Story = {
  args: { variant: 'panel', expandedIds: [ListingCategory.Timeshare] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    /* Devremülk kökü ve tek alt kategorisi: ikisi de pasif. */
    await expect(canvas.getAllByText('Pasif')).toHaveLength(2)
  },
}

/**
 * Odak halkasının satıra taşınma sebebi ölçülüyor.
 *
 * Açık bir düğümün `<li role="treeitem">`'ı bütün alt ağacını kapsıyor: global
 * `:focus-visible` halkası onun kutusuna çizilseydi Konut'un değil Konut ve yedi
 * çocuğunun etrafına çizilir, odaktaki satır kaybolurdu. Aradaki fark burada
 * pikselle görünüyor — bu iddia yalnız ekran görüntüsüyle veya ölçüyle
 * doğrulanabilir, koda bakmakla değil.
 */
export const FocusRingIsOnTheRowNotTheSubtree: Story = {
  args: { expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement }) => {
    const konut = dugum(canvasElement, 'Konut')
    konut.focus()
    await expect(konut).toHaveFocus()

    const satirYuksekligi = satirKutusu(konut).getBoundingClientRect().height
    const dugumYuksekligi = konut.getBoundingClientRect().height

    /* Konut + yedi alt kategori: düğümün kutusu satırın en az beş katı. */
    await expect(dugumYuksekligi).toBeGreaterThan(satirYuksekligi * 5)
  },
}

/** Satır 44 piksellik dokunma hedefini korumalı — `compact` de dahil. */
export const RowMeetsTouchTarget: Story = {
  args: { variant: 'compact', expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement }) => {
    const satir = satirKutusu(dugum(canvasElement, 'Daire'))

    await expect(satir.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
  },
}

/** Girinti kademeye göre artmalı: yaprak atasından içeride başlar. */
export const IndentationFollowsLevel: Story = {
  args: { expandedIds: [ListingCategory.Residential] },
  play: async ({ canvasElement }) => {
    const kokSol = satirKutusu(dugum(canvasElement, 'Konut')).getBoundingClientRect().left
    const yaprakSol = satirKutusu(dugum(canvasElement, 'Daire')).getBoundingClientRect().left

    /*
      Kutular aynı yerden başlar: girinti satırın padding'i, alt listenin değil.
      Alt liste itilseydi seçili yaprağın zemini de girintiden başlar, dar kolonda
      "hangi kategorideyim" çubuğu yarım kalırdı.
    */
    await expect(yaprakSol).toBeCloseTo(kokSol, 0)

    const kokEtiket = within(canvasElement).getByText('Konut').getBoundingClientRect().left
    const yaprakEtiket = within(canvasElement).getByText('Daire').getBoundingClientRect().left

    await expect(yaprakEtiket).toBeGreaterThan(kokEtiket)
  },
}

/** Gerçek durumla: seçim ve açıklık çağıranda, ağaç yalnız bildirir. */
export const Interactive: Story = {
  render: function Render(args) {
    const [acik, setAcik] = useState<string[]>([ListingCategory.Residential])
    const [secili, setSecili] = useState<string | undefined>(undefined)

    return (
      <CategoryTree
        {...args}
        expandedIds={acik}
        /* Koşullu spread: `exactOptionalPropertyTypes` açıkken `selectedId={undefined}` yazılamaz. */
        {...(secili !== undefined && { selectedId: secili })}
        onSelect={(id) => setSecili(id)}
        onExpandedIdsChange={(ids) => setAcik(ids)}
      />
    )
  },
}

export const VariantsComparison: Story = {
  args: {
    expandedIds: [ListingCategory.Residential],
    selectedId: altId(ListingCategory.Residential, ResidentialSubCategory.Villa),
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {VARYANTLAR.map((variant) => (
        <div key={variant} style={{ display: 'grid', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.6 }}>{variant}</span>
          <CategoryTree {...args} variant={variant} />
        </div>
      ))}
    </div>
  ),
}
