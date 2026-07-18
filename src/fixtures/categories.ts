import { CATEGORY_SUB_CATEGORIES } from '../domain/categoryTree'
import { LISTING_CATEGORY_LABEL, LISTING_SUB_CATEGORY_LABEL } from '../domain/labels'
import {
  AttributeDataType,
  CommercialSubCategory,
  ListingCategory,
  ResidentialSubCategory,
  type CategoryAttributeDefinition,
  type ListingSubCategory,
} from '../types/domain'
import type { CategoryTreeNode } from '../types/component-props'

/**
 * Kategori ve öznitelik fixture'ı.
 *
 * **Faz 3 sonrası (b) turunda eklendi.** Faz 3'te `CategoryAttributePage`,
 * `CategoryTree` ve `AttributeEditor` üçü de story-yerel ağaç kuruyordu (RAPOR
 * EDİLMİŞTİ); bu dosya tek kaynak.
 *
 * Ağaç `CATEGORY_SUB_CATEGORIES`'ten **türetiliyor**, elle yazılmıyor: enum'a
 * yeni bir alt kategori eklenirse ağaçta kendiliğinden görünür (AGENTS'ın
 * `categoryTree` dersi). Ama "yönetilen" katman elle: `count` (kategorideki ilan
 * sayısı) ve `active` (pasife alınmış düğüm) enum'da yok, burada veriliyor.
 *
 * Düğüm id'leri **kategori önekli** (`konut-daire`): alt enum değerleri
 * çakışıyor (`ResidentialTransactionType.Sale` ve `LandTransactionType.Sale`
 * ikisi de `'satilik'`) ve önek olmadan iki düğüm aynı id'yi taşırdı.
 */

/** Kategorideki (yönetilen) ilan sayaçları; kök başına. `categoryDistribution` ile tutarlı. */
const KATEGORI_SAYAC: Record<ListingCategory, number> = {
  [ListingCategory.Residential]: 1_612,
  [ListingCategory.Land]: 558,
  [ListingCategory.Commercial]: 465,
  [ListingCategory.Building]: 186,
  [ListingCategory.Timeshare]: 155,
  [ListingCategory.TourismFacility]: 124,
}

/**
 * Pasife alınmış alt kategori düğümleri (yönetilen durum, enum'da yok).
 * İşyeri → "Atölye" örnek olarak pasif — `CategoryTree`'nin `panel` varyantı
 * pasiflik rozetini bunda gösterir, düğüm `active: false` taşır.
 */
const PASIF_ALT_KATEGORILER = new Set<ListingSubCategory>([CommercialSubCategory.Workshop])

function altDugum(category: ListingCategory, sub: ListingSubCategory): CategoryTreeNode {
  return {
    id: `${category}-${sub}`,
    label: LISTING_SUB_CATEGORY_LABEL[sub],
    active: !PASIF_ALT_KATEGORILER.has(sub),
  }
}

/**
 * Yönetilen kategori ağacı. Kökler `count` ve `category` taşır; alt düğümler
 * `CATEGORY_SUB_CATEGORIES`'ten türetilir.
 */
export const categoryTreeFixture: CategoryTreeNode[] = (
  Object.values(ListingCategory) as ListingCategory[]
).map((category) => ({
  id: category,
  label: LISTING_CATEGORY_LABEL[category],
  category,
  active: true,
  count: KATEGORI_SAYAC[category],
  children: (CATEGORY_SUB_CATEGORIES[category] as readonly ListingSubCategory[]).map((sub) =>
    altDugum(category, sub),
  ),
}))

/** Boş durum için. */
export const emptyCategoryTreeFixture: CategoryTreeNode[] = []

function nitelik(
  args: Pick<CategoryAttributeDefinition, 'key' | 'label' | 'dataType' | 'order'> &
    Partial<CategoryAttributeDefinition>,
): CategoryAttributeDefinition {
  return {
    id: `attr-residential-${args.key}`,
    category: ListingCategory.Residential,
    appliesToSubCategories: [ResidentialSubCategory.Apartment, ResidentialSubCategory.Residence],
    appliesToTransactionTypes: [],
    required: false,
    filterable: true,
    visibleInList: false,
    active: true,
    options: [],
    validation: {},
    createdAt: '2024-06-03T10:00:00+03:00',
    updatedAt: '2026-05-27T15:05:00+03:00',
    ...args,
  }
}

/**
 * Konut kategorisinin öznitelik tanımları (seçili düğüm = Konut). Beş öznitelik,
 * altı `AttributeDataType` türünden farklılarını kapsıyor — editörün her tipi
 * gösterebildiği ölçülebilsin.
 */
export const residentialAttributes: CategoryAttributeDefinition[] = [
  nitelik({
    key: 'grossSquareMeters',
    label: 'Brüt m²',
    dataType: AttributeDataType.Number,
    order: 1,
    required: true,
    visibleInList: true,
    validation: { min: 1, max: 100_000 },
  }),
  nitelik({
    key: 'roomCount',
    label: 'Oda Sayısı',
    dataType: AttributeDataType.SingleSelect,
    order: 2,
    required: true,
    visibleInList: true,
    options: [
      { value: '1+0', label: '1+0', order: 1, active: true },
      { value: '1+1', label: '1+1', order: 2, active: true },
      { value: '2+1', label: '2+1', order: 3, active: true },
      { value: '3+1', label: '3+1', order: 4, active: true },
    ],
  }),
  nitelik({
    key: 'hasBalcony',
    label: 'Balkon',
    dataType: AttributeDataType.Boolean,
    order: 3,
  }),
  nitelik({
    key: 'heatingType',
    label: 'Isıtma Tipi',
    dataType: AttributeDataType.SingleSelect,
    order: 4,
    options: [
      { value: 'dogalgaz', label: 'Doğalgaz', order: 1, active: true },
      { value: 'merkezi', label: 'Merkezi', order: 2, active: true },
      { value: 'yerden', label: 'Yerden Isıtma', order: 3, active: true },
      { value: 'yok', label: 'Yok', order: 4, active: false },
    ],
  }),
  nitelik({
    key: 'siteName',
    label: 'Site Adı',
    dataType: AttributeDataType.Text,
    order: 5,
    validation: { maxLength: 120 },
  }),
]

/** Düğüm id → öznitelik listesi. Konut dışındaki düğümler şimdilik boş (başlangıç). */
export const categoryAttributesByNodeId: Record<string, CategoryAttributeDefinition[]> = {
  [ListingCategory.Residential]: residentialAttributes,
}

/** Öznitelikleri henüz olmayan bir düğüm için boş liste (başlangıç durumu). */
export const emptyAttributeList: CategoryAttributeDefinition[] = []
