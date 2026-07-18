import { useState } from 'react'
import { ArrowUpRight, Download, FileSearch, RefreshCw } from 'lucide-react'
import { Link } from 'react-router'
import { Alert } from '../../components/primitives/Alert'
import { Badge } from '../../components/primitives/Badge'
import { Button } from '../../components/primitives/Button'
import { Drawer } from '../../components/primitives/Drawer'
import { DataTable } from '../../components/composites/DataTable'
import { EmptyState } from '../../components/composites/EmptyState'
import { ErrorState } from '../../components/composites/ErrorState'
import { FilterBar } from '../../components/composites/FilterBar'
import { Pagination } from '../../components/composites/Pagination'
import {
  ADMIN_PERMISSION_LABEL,
  ADMIN_ROLE_LABEL,
  AUDIT_ENTITY_TYPE_LABEL,
} from '../../domain/labels'
import { formatDateTime } from '../../utils/formatDateTime'
import { AdminPermission, AdminRole, type AuditLogEntry, type Paginated } from '../../types/domain'
import type {
  AuditLogFilters,
  AuditLogPageProps,
  ColumnDef,
  DateRange,
  FilterDefinition,
  FilterValue,
  NumberRange,
  SelectOption,
  UiError,
} from '../../types/component-props'
import * as css from './AuditLogPage.css'

type VarlikTipi = AuditLogEntry['entityType']

/**
 * Filtre alanlarının kimlikleri.
 *
 * `AuditLogFilters`in alan adlarıyla **birebir aynı** tutuluyor: `FilterBar`
 * düz bir `onChange(id, value)` bildiriyor ve id'yi tekrar tipli alana çevirmek
 * bu ekranın işi. İki isim uzayı olsaydı (`'tarih'` → `dateRange`) eşleme
 * sessizce kayabilirdi; anahtarlar aynıyken kayamıyor.
 */
const ALAN = {
  query: 'query',
  roles: 'roles',
  entityTypes: 'entityTypes',
  actorIds: 'actorIds',
  actions: 'actions',
  dateRange: 'dateRange',
} as const satisfies Record<keyof AuditLogFilters, string>

/**
 * `action` kodunun etiketi.
 *
 * `AuditLogEntry.action` sözleşmede `string`, ama fixture'daki kodlar
 * `AdminPermission` sözlüğünden geliyor (`listing:reject`, `user:suspend`,
 * `theme:setDefault`) — gerekçesi `fixtures/audit.ts`'in başında yazılı:
 * *audit'e giren her eylem tam olarak bir izin kapısından geçmiştir, kapının adı
 * eylemin de adıdır.* Bu yüzden **yeni bir sözlük yazılmadı**;
 * `ADMIN_PERMISSION_LABEL` 33 kodun hepsini zaten Türkçeleştiriyor.
 *
 * Okuma `?? action` ile bitiyor, çünkü alan `string` kalmalı: sunucu bir gün bu
 * kümede olmayan bir kod gönderebilir (`auth:login`). **Tanınmayan kodu ham
 * göstermek boş hücre göstermekten iyidir** — audit'te "ne olduğu bilinmiyor"
 * ile "hiçbir şey olmadı" aynı şey değil.
 *
 * Sözlük yayılarak kopyalanıyor: `ADMIN_PERMISSION_LABEL`in anahtar uzayı
 * `AdminPermission`, `action` ise `string` — taze bir nesne literali örtük
 * indeks imzası kazandığı için `string` ile indekslenebiliyor ve tip iddiası
 * gerekmiyor.
 */
const EYLEM_ETIKETI: Record<string, string | undefined> = { ...ADMIN_PERMISSION_LABEL }

const eylemEtiketi = (action: string): string => EYLEM_ETIKETI[action] ?? action

/**
 * Varlık tipi seçenekleri, `AUDIT_ENTITY_TYPE_LABEL`in **anahtarlarından**
 * türetiliyor.
 *
 * Elle yazılmış bir liste `entityType` birleşimine yeni bir üye eklendiğinde
 * sessizce eksik kalırdı. Sözlük `satisfies Record<VarlikTipi, string>` ile
 * bildirildiği için anahtar kümesi tam olarak birleşimin kendisi — çalışma
 * anındaki `Object.keys` ile tip düzeyindeki birleşim ayrışamaz.
 * (`domain/categoryTree.ts`'in `Object.values(Enum)` kalıbının string-birleşim
 * hâli: `entityType` enum değil, bu yüzden `Object.values` yerine `Object.keys`.)
 */
const VARLIK_TIPLERI = Object.keys(AUDIT_ENTITY_TYPE_LABEL) as VarlikTipi[]

const ROL_SECENEKLERI: SelectOption[] = Object.values(AdminRole).map((rol) => ({
  value: rol,
  label: ADMIN_ROLE_LABEL[rol],
}))

const VARLIK_SECENEKLERI: SelectOption[] = VARLIK_TIPLERI.map((tip) => ({
  value: tip,
  label: AUDIT_ENTITY_TYPE_LABEL[tip],
}))

/**
 * Eylem filtresi seçenekleri — `AdminPermission` uzayından türetiliyor.
 *
 * Gerekçe `fixtures/audit.ts` ile aynı: **audit'e giren her eylem tam olarak bir
 * izin kapısından geçmiştir**, dolayısıyla `action` kodları `AdminPermission`
 * değerleridir (`listing:reject`, `user:suspend`, `theme:setDefault`) ve
 * `ADMIN_PERMISSION_LABEL` 33 kodun hepsini Türkçeleştiriyor. Liste elle
 * yazılmıyor, `Object.values(AdminPermission)` ile türetiliyor: enum'a yeni bir
 * izin eklendiğinde seçenek kendiliğinden geliyor (`ROL_SECENEKLERI` ile aynı
 * kalıp). Tam uzay veriliyor, yalnız fixture'da görünen kodlar değil — ekran
 * süzmüyor, seçenekler sunucunun süzeceği eylem kümesidir ve bir eylemin bugün
 * kaydı olmaması onu filtrelenemez yapmaz.
 */
const EYLEM_SECENEKLERI: SelectOption[] = Object.values(AdminPermission).map((izin) => ({
  value: izin,
  label: ADMIN_PERMISSION_LABEL[izin],
}))

/**
 * Filtre alanları — aktör hariç sabit olan taban.
 *
 * Brifing 2.10'un dört boyutu (Faz 3 sonrası (b) turunda tamamı bağlandı):
 * **tarih** (`dateRange`), **rol** (`roles`), **kullanıcı** (`actorIds`) ve
 * **eylem** (`actions`). Aktör filtresi tabanda değil, çünkü seçenekleri
 * (`actorOptions`) prop'tan gelir — ekran kimlikleri adlara çeviremez (veri
 * çekmez) — ve `actorOptions` verilmedikçe render edilmez; bileşen içinde
 * koşullu eklenir ({@link AuditLogPage}). `entityTypes` brifingin eylem
 * listesinde yok ama sözleşmede var; fixture'ın altı varlık tipini kapsaması
 * onun filtrelenmek için orada olduğunu gösteriyor. Serbest metin (`query`)
 * artık aktör/eylemin yerine değil, özet ve varlık kimliği gibi tipli kanalı
 * olmayan alanların yaklaşık araması.
 */
const FILTRE_TANIMLARI_TABAN: FilterDefinition[] = [
  {
    id: ALAN.query,
    type: 'text',
    label: 'Ara',
    placeholder: 'Admin adı, özet veya varlık kimliği',
  },
  {
    id: ALAN.roles,
    type: 'multiSelect',
    label: 'Rol',
    options: ROL_SECENEKLERI,
    placeholder: 'Tüm roller',
  },
  {
    id: ALAN.actions,
    type: 'multiSelect',
    label: 'Eylem',
    options: EYLEM_SECENEKLERI,
    placeholder: 'Tüm eylemler',
  },
  {
    id: ALAN.entityTypes,
    type: 'multiSelect',
    label: 'Varlık tipi',
    options: VARLIK_SECENEKLERI,
    placeholder: 'Tüm varlıklar',
  },
  { id: ALAN.dateRange, type: 'dateRange', label: 'Tarih aralığı' },
]

/**
 * `actorOptions` verildiğinde aktör filtresini `roles`'un hemen ardına ekler.
 *
 * `roles` "hangi rol", `actorIds` "hangi kişi" — ikisi yan yana okunur. Seçenek
 * adları (`id → ad`) sayfa katmanından gelir; verilmezse aktör filtresi çıkmaz.
 */
function filtreTanimlari(actorOptions: SelectOption[] | undefined): FilterDefinition[] {
  if (actorOptions === undefined) return FILTRE_TANIMLARI_TABAN
  return [
    ...FILTRE_TANIMLARI_TABAN.slice(0, 2),
    {
      id: ALAN.actorIds,
      type: 'multiSelect',
      label: 'Kullanıcı',
      options: actorOptions,
      placeholder: 'Tüm kullanıcılar',
    },
    ...FILTRE_TANIMLARI_TABAN.slice(2),
  ]
}

/* ── `FilterValue` → `AuditLogFilters` daraltması ────────────────────────────
 * `FilterBar` altı şeklin birleşimini (`FilterValue`) geri veriyor; hangi şeklin
 * geleceğini `definition.type` söylüyor. Şekli bozuk bir değer (kaydedilmiş eski
 * görünüm, elle yazılmış URL parametresi) alanı boşaltır, ekranı çökertmez —
 * `FilterBar`'ın kendi içinde yaptığı daraltmanın dışarı bakan yüzü.
 */

const nesneMi = (deger: FilterValue): deger is DateRange | NumberRange =>
  typeof deger === 'object' && deger !== null && !Array.isArray(deger)

const tarihAraligiOku = (deger: FilterValue): DateRange =>
  nesneMi(deger) && ('from' in deger || 'to' in deger) ? deger : {}

const ROL_DEGERLERI: readonly string[] = Object.values(AdminRole)

const rolleriOku = (deger: FilterValue): AdminRole[] =>
  Array.isArray(deger) ? deger.filter((x): x is AdminRole => ROL_DEGERLERI.includes(x)) : []

const VARLIK_DEGERLERI: readonly string[] = VARLIK_TIPLERI

const varlikTipleriniOku = (deger: FilterValue): VarlikTipi[] =>
  Array.isArray(deger) ? deger.filter((x): x is VarlikTipi => VARLIK_DEGERLERI.includes(x)) : []

/**
 * Serbest string dizisi filtrelerini (aktör, eylem) okur.
 *
 * `roles`/`entityTypes`'ın aksine kapalı bir küme yok: `actorId` her admini
 * gösterebilir, `action` sözlükte olmayan bir sunucu kodu (`auth:login`)
 * taşıyabilir — daraltma yalnız "dize mi" diye sorar, üyelik değil.
 */
const dizeDizisiOku = (deger: FilterValue): string[] =>
  Array.isArray(deger) ? deger.filter((x): x is string => typeof x === 'string') : []

/**
 * Tek bir alanın değişimini `AuditLogFilters`e yazar.
 *
 * `query` boşalınca alan `undefined` yapılmaz, **silinir**:
 * `exactOptionalPropertyTypes` açıkken `query?: string` alanına `undefined`
 * atanamaz (TS2375) ve "boş arama" ile "arama yok" sunucu için aynı şey.
 * (`FilterBar`'ın `aralikGuncelle`'siyle aynı kalıp.)
 */
function filtreGuncelle(mevcut: AuditLogFilters, id: string, deger: FilterValue): AuditLogFilters {
  const sonraki: AuditLogFilters = { ...mevcut }

  switch (id) {
    case ALAN.query: {
      const metin = typeof deger === 'string' ? deger : ''
      if (metin === '') delete sonraki.query
      else sonraki.query = metin
      return sonraki
    }

    case ALAN.roles:
      sonraki.roles = rolleriOku(deger)
      return sonraki

    case ALAN.entityTypes:
      sonraki.entityTypes = varlikTipleriniOku(deger)
      return sonraki

    /*
      Aktör/eylem **opsiyonel** alanlar: boşaldıklarında `query` gibi `undefined`
      atanamaz (TS2375), **silinirler** — "seçim yok" ile "hepsi" audit için aynı
      şey ve fixtures'ın "verilmemiş = hepsi" sözleşmesiyle örtüşüyor.
    */
    case ALAN.actorIds: {
      const secili = dizeDizisiOku(deger)
      if (secili.length === 0) delete sonraki.actorIds
      else sonraki.actorIds = secili
      return sonraki
    }

    case ALAN.actions: {
      const secili = dizeDizisiOku(deger)
      if (secili.length === 0) delete sonraki.actions
      else sonraki.actions = secili
      return sonraki
    }

    case ALAN.dateRange:
      sonraki.dateRange = tarihAraligiOku(deger)
      return sonraki

    /** Tanımlarda olmayan bir id gelemez; gelirse filtre değişmemiş sayılır. */
    default:
      return mevcut
  }
}

/**
 * Bir filtrenin gerçekten bir şey eleyip elemediği.
 *
 * `EmptyState`'in varyantını bu seçiyor: boşluğun sebebi kullanıcının atacağı
 * adımı değiştirir — hiç kayıt yoksa yapacak bir şey yok, filtre elediyse
 * yapılacak şey filtreyi gevşetmek.
 */
const filtreAktifMi = (filters: AuditLogFilters): boolean =>
  (filters.query ?? '') !== '' ||
  filters.roles.length > 0 ||
  (filters.actorIds?.length ?? 0) > 0 ||
  (filters.actions?.length ?? 0) > 0 ||
  filters.entityTypes.length > 0 ||
  filters.dateRange.from !== undefined ||
  filters.dateRange.to !== undefined

/** Her çağrıda taze: paylaşılan bir sabit, çağıranın kendi state'ine sızardı. */
const bosFiltre = (): AuditLogFilters => ({ roles: [], entityTypes: [], dateRange: {} })

/** `metadata`daki korelasyon kimliği; `Record<string, unknown>`ten güvenli okuma. */
function korelasyonKimligi(metadata: Record<string, unknown>): string | undefined {
  const deger = metadata['correlationId']
  return typeof deger === 'string' ? deger : undefined
}

/**
 * Audit log: filtreleme, tablo, sayfalama ve JSON detay incelemesi
 * (brifing 2.10).
 *
 * Veri **çekmez**: `state` prop'tan gelir (`AsyncState<Paginated<AuditLogEntry>>`).
 * Kabuk da değildir — `AppShell`/`TopBar`/`SidebarNav`/`PageHeader` render etmez,
 * sayfanın `<h1>`'i onlarındır; buradaki en üst başlık `<h2>`.
 *
 * ## İki eylem, iki kanal: `onEntryOpen` detayı açar, `onEntityOpen` ekrandan çıkar
 *
 * Brifing 2.10 iki ayrı eylem istiyor — "JSON detayını açma" ve "**İlgili
 * varlığa gitme**" — ve Faz 3 sonrası (b) turunda ikisinin de kanalı var, artık
 * karışmıyorlar: `onEntryOpen(entry)` çekmeceyi açar (kayıtta kalır),
 * `onEntityOpen(entry)` `entityType`+`entityId` ile ilan/kullanıcı/şikayet
 * detayına götürür (rota değişir, **ekrandan ayrılır**). Bir kanal iki işi
 * yapamazdı; Faz 3'te tek `onEntryOpen` vardı ve boşluk **raporlanmıştı**.
 *
 * `onEntityOpen` **opsiyonel**: verilmezse çekmecenin alt şeridindeki "İlgili
 * varlığa git" butonu hiç çıkmaz — basınca hiçbir şey yapmayan buton, olmayan
 * butondan kötüdür.
 *
 * Çekmecenin **açıklığı** yine de burada, `useState`'te — aynı JSDoc'un
 * "açıklık görüntü state'idir, prop değil" cümlesi bunu söylüyor ve sözleşmede
 * `openEntryId` gibi bir kanal da yok. Yani satıra basmak iki şey yapıyor:
 * çekmeceyi açıyor **ve** kanalı bildiriyor (çağıran isterse kaydı izler).
 * "Ekran veri çekmez" kuralı ihlal edilmiyor: çekilen bir şey yok, tutulan şey
 * hangi satırın detayının açık olduğu.
 *
 * ## JSON detayı `<pre>` ile kuruluyor, `CodeBlock` ile değil
 *
 * Brifing 2.10 "türetilen componentler" listesinde `CodeBlock` var, ama
 * brifingin kendi yetkili katalogunda (3.3 primitive'ler + 3.4 composite'ler)
 * **yok** ve repoda da yok — 26 primitive + 29 composite'in ikisi de onu
 * listelemiyor. Faz 3'ün kapsamı 11 ekran; katalog component'i eklemek kapsam
 * dışı ve tek tüketicisi olan bir component'i "ileride lazım olur" diye katalog
 * yüzeyine koymak, `PHOTO_REJECTION_REASONS`'ın tersi bir hata olurdu. JSON
 * bloğu bu yüzden ekranın içinde: bir `<pre>`, `overflow: auto` ve `tabIndex={0}`
 * (gerekçeler `.css.ts`'te). İkinci bir tüketici çıkarsa (hata ayıklama paneli,
 * webhook kaydı) o zaman gerçekten bir `CodeBlock` gerekir.
 *
 * ## Gösterilen JSON tam olarak `metadata`dır
 *
 * Brifing 2.10 "önceki ve sonraki değerler" ve "istek korelasyon kimliği"
 * istiyor; `AuditLogEntry`'de bunları taşıyan ayrı alan **yok** ve `domain.ts`
 * fiilen FastAPI'nin şartnamesi, oraya alan eklenmedi. Sözleşmeyi
 * `fixtures/audit.ts` kuruyor (`{ correlationId, before, after, ... }`) ve
 * çekmecedeki JSON tam olarak o nesne. Korelasyon kimliği ayrıca ad-değer
 * listesinde de yazılı: destek ekibinin sunucu loglarıyla eşlemek için
 * kopyaladığı tek dize, JSON'un içinde aranmamalı.
 *
 * ## Yetki kapısı sunucudadır
 *
 * `audit:view` yalnız `superAdmin` ve `moderator`'da (brifing 1.4: satır
 * `icerikDenetcisi` ve `destek`te "Yok"). `AuditLogPageProps`'ta izin listesi
 * yok ve olmamalı — yetkisizliği **önden** bilen kabuk bu ekrana hiç
 * yönlendirmez; `state.status === 'unauthorized'` istemcinin izin listesi
 * bayatladığında sunucunun verdiği 403'ün karşılığıdır. Tekrar deneme butonu
 * yok: `retryable` tip düzeyinde `false`, aynı 403 aynı 403'ü verir.
 *
 * ## Faz 3'te kanalsız kalan üç gereksinim — (b) turunda bağlandı
 *
 * - **"Yetkiye göre dışa aktarma"** (brifing 2.10): `onExport` eklendi ve
 *   **opsiyonel**. Yetki kapısı sunucuda: `onExport` verilmedikçe dışa aktar
 *   butonu render edilmez — yetkisiz kullanıcıya `disabled` buton değil, hiç
 *   buton.
 * - **"İlgili varlığa gitme"**: `onEntityOpen`, yukarıdaki bölüm.
 * - **"Kullanıcı ve eyleme göre filtreleme"**: `AuditLogFilters`'a `actorIds`
 *   (kullanıcı) ve `actions` (eylem) eklendi; ikisi de `multiSelect` filtre.
 *   `query` artık ikisinin yerine değil, tipli kanalı olmayan alanların
 *   (özet, varlık kimliği) yaklaşık araması.
 *
 * ## Sıralama yok
 *
 * `AuditLogPageProps`'ta `sort`/`onSortChange` yok, dolayısıyla hiçbir sütun
 * `sortable` değil: satırlar sunucudan sayfalanmış geliyor ve tek sayfayı
 * istemcide sıralamak "en yeni kayıt" sorusuna yanlış cevap verir. Sıralanabilir
 * başlık koymak, basınca hiçbir şey yapmayan bir buton üretirdi.
 *
 * @example
 * <AuditLogPage
 *   state={{ status: 'success', data: sayfa }}
 *   filters={filtreler}
 *   onFiltersChange={setFiltreler}
 *   onPageChange={setSayfa}
 *   onEntryOpen={(entry) => izle('audit_detay_acildi', entry.id)}
 *   onEntityOpen={(entry) => git(entry.entityType, entry.entityId)}
 *   onRetry={refetch}
 *   actorOptions={adminSecenekleri}
 *   onExport={dosyayaAktar}
 * />
 */
export function AuditLogPage({
  state,
  filters,
  onFiltersChange,
  onPageChange,
  onEntryOpen,
  onEntityOpen,
  onRetry,
  actorOptions,
  onExport,
}: AuditLogPageProps) {
  /** Detayı açık olan kayıt. Görüntü state'i — çekilen veri değil. */
  const [detayKaydi, setDetayKaydi] = useState<AuditLogEntry | null>(null)

  /*
    `idle` de `loading` gibi davranır: ilk sorgu henüz başlamamışken de gösterilecek
    veri yok ve iskelet, spinner'lı boş ekrandan iyidir (brifing 2.1). `DataTable`
    yükleme hâlinde başlığı koruyup satırları iskelete çeviriyor — veri gelince
    düzen zıplamıyor.
  */
  const yukleniyor = state.status === 'idle' || state.status === 'loading'

  /*
    `partialSuccess` bu ekranda **üretilemez**: audit tek bir sayfalanmış istekten
    geliyor, dashboard gibi bağımsız sorgular yok ve brifing 2.10 onu ekran durumu
    saymıyor. Yine de tip düzeyinde mümkün, dolayısıyla çökmeden karşılanıyor:
    gelen ne varsa gösterilir, gelmeyeni `errors` kanalı bir uyarı olarak anlatır.
    Bu yüzden ortak tip `Partial<Paginated<...>>` — `success`in tamı da ona sığar.
  */
  const veri: Partial<Paginated<AuditLogEntry>> =
    state.status === 'success' || state.status === 'partialSuccess'
      ? state.data
      : state.status === 'empty'
        ? (state.data ?? {})
        : {}

  const satirlar = veri.items ?? []
  const filtreli = filtreAktifMi(filters)

  const filtreleriTemizle = () => onFiltersChange(bosFiltre())

  /*
    Sözleşmenin kurduğu okuma: `onEntryOpen` **JSON detayını açar**
    (`AuditLogPageProps.onEntryOpen`in JSDoc'u). Açıklığın kendisi yine ekranın:
    aynı sözleşme "çekmecenin açıklığı görüntü state'idir, prop değil" diyor ve
    `openEntryId` gibi bir kanal yok. İkisi çelişmiyor — kanal *bildirir*, state
    *tutar*; çağıran hangi kaydın incelendiğini izlemek isteyebilir.
  */
  const detayiAc = (entry: AuditLogEntry) => {
    setDetayKaydi(entry)
    onEntryOpen(entry)
  }

  const eksikVeriHatasi: UiError | undefined =
    state.status === 'partialSuccess'
      ? Object.values(state.errors).find((hata): hata is UiError => hata !== undefined)
      : undefined

  /*
    `rowLabel` **bilerek verilmiyor**: `DataTable` onu yalnız `selectable` iken,
    satır seçim kutusunun gizli etiketi olarak okuyor. Audit'te seçim yok (toplu
    eylem kanalı da yok), dolayısıyla prop ölü kalırdı. Etiketsiz kullanıcının her
    satırda aynı metni duyması sorunu buradaki tek dokunulabilir hedefte, "Detay"
    butonunun `aria-label`'ında çözülüyor: ad kaydı tanımlıyor, "Detay" demiyor.
  */
  const sutunlar: ColumnDef<AuditLogEntry>[] = [
    {
      id: 'createdAt',
      header: 'Zaman',
      cell: (row) => <span className={css.zamanHucresi}>{formatDateTime(row.createdAt)}</span>,
    },
    { id: 'actorName', header: 'Admin', accessor: 'actorName' },
    {
      id: 'actorRole',
      header: 'Rol',
      cell: (row) => (
        <Badge size="sm" variant="soft">
          {ADMIN_ROLE_LABEL[row.actorRole]}
        </Badge>
      ),
    },
    { id: 'action', header: 'Eylem', cell: (row) => eylemEtiketi(row.action) },
    {
      id: 'entityType',
      header: 'Varlık tipi',
      cell: (row) => AUDIT_ENTITY_TYPE_LABEL[row.entityType],
    },
    {
      id: 'entityId',
      header: 'Varlık kimliği',
      cell: (row) => <span className={css.kimlikHucresi}>{row.entityId}</span>,
    },
    { id: 'summary', header: 'Özet', accessor: 'summary' },
    {
      id: 'detail',
      header: 'Detay',
      align: 'end',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<FileSearch size={16} />}
          /*
            Ad kaydı tanımlıyor: sekiz satırda da "Detay" duyan kullanıcı hangisini
            açtığını bilemez. Görünür metin ("Detay") adın **içinde** kalıyor —
            aksi hâlde konuşarak kullanan biri gördüğü etiketi söyleyemez
            (WCAG 2.5.3, axe `label-content-name-mismatch`).
          */
          aria-label={`Detay: ${eylemEtiketi(row.action)} — ${formatDateTime(row.createdAt)}`}
          onClick={() => detayiAc(row)}
        >
          Detay
        </Button>
      ),
    },
  ]

  const bosDurum = filtreli ? (
    <EmptyState
      variant="filtered"
      title="Filtrelere uyan audit kaydı yok"
      description="Seçili tarih aralığı, rol ve varlık tipinde işlem kaydı bulunamadı. Filtreleri gevşetip tekrar deneyin."
      primaryAction={
        <Button variant="secondary" onClick={filtreleriTemizle}>
          Filtreleri temizle
        </Button>
      }
    />
  ) : (
    /*
      `compact`: boşluk bir tablonun içinde duruyor (`EmptyState`in kendi
      sözleşmesi: "kart, panel veya tablo içinde"). Eylem **yok** ve bu ekrana
      özgü: audit kaydı oluşturulamaz, yalnız adminler işlem yaptıkça doğar —
      "İlk kaydı oluştur" gibi bir birincil eylem burada yalan olurdu.
    */
    <EmptyState
      variant="compact"
      title="Henüz audit kaydı yok"
      description="Adminler ilan, kullanıcı, şikayet, kategori, izin veya tema üzerinde işlem yaptıkça kayıtlar burada listelenir."
    />
  )

  /*
    Yetkisizlik bütün ekranı değiştirir: filtrelenecek bir şey yok, dolayısıyla
    `FilterBar` ve tablo hiç render edilmiyor. `variant="page"` — düşen şey bir
    panel değil, sayfanın tamamı.
  */
  if (state.status === 'unauthorized') {
    return (
      <div className={css.root}>
        <h2 className={css.baslik}>Audit kayıtları</h2>

        <ErrorState
          variant="page"
          title={state.error.title}
          description={state.error.message}
          {...(state.error.code !== undefined && { code: state.error.code })}
        />

        {/* Brifing 2.1: 403 "güvenli geri dönüş bağlantısı" ile birlikte gösterilir.
            `ErrorState`in slotu yok (yalnız `onRetry` alıyor), bu yüzden bağlantı
            ekranın kendi elementinde. `/` = Dashboard: her rolde açık olan tek
            ekran (brifing 1.4'ün "Dashboard görüntüleme" satırı dört rolde de
            "Tam"), yani geri dönüşün gerçekten güvenli olduğu tek hedef. */}
        <p className={css.geriDonus}>
          {/* Metin JSX ifadesinde: JSX metin çocuğundaki kesme işareti
              `react/no-unescaped-entities`in kapsamına girer. */}
          <Link to="/">{"Dashboard'a dön"}</Link>
        </p>
      </div>
    )
  }

  return (
    <div className={css.root}>
      {/*
        Başlık ve "Dışa aktar" aynı satırda. Buton **opsiyonel**: `onExport`
        verilmedikçe (yetki kapısı sunucuda) hiç render edilmez — sonuçsuz buton
        sunmamak için. Mevcut filtreyle eşleşen kayıtları çağıran dışa aktarır;
        ne aktardığını (CSV/JSON) da o belirler.
      */}
      <div className={css.baslikSatiri}>
        <h2 className={css.baslik}>Audit kayıtları</h2>
        {onExport !== undefined ? (
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<Download size={16} />}
            onClick={onExport}
          >
            Dışa aktar
          </Button>
        ) : null}
      </div>

      {state.status === 'success' && state.stale === true ? (
        <Alert
          tone="info"
          title="Gösterilen kayıtlar güncel olmayabilir"
          description="Son başarılı sonuç gösteriliyor; bu sırada yeni işlemler kaydedilmiş olabilir."
          action={
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<RefreshCw size={16} />}
              onClick={onRetry}
            >
              Yenile
            </Button>
          }
        />
      ) : null}

      {eksikVeriHatasi !== undefined ? (
        <Alert tone="warning" title={eksikVeriHatasi.title} description={eksikVeriHatasi.message} />
      ) : null}

      <FilterBar
        definitions={filtreTanimlari(actorOptions)}
        values={{
          [ALAN.query]: filters.query ?? '',
          [ALAN.roles]: filters.roles,
          [ALAN.actorIds]: filters.actorIds ?? [],
          [ALAN.actions]: filters.actions ?? [],
          [ALAN.entityTypes]: filters.entityTypes,
          [ALAN.dateRange]: filters.dateRange,
        }}
        variant="inline"
        onChange={(id, deger) => onFiltersChange(filtreGuncelle(filters, id, deger))}
        onClear={filtreleriTemizle}
      />

      {/*
        `mobileMode="scroll"`: `DataTableProps.mobileMode`'un kendi sözleşmesi bu
        ekranı **adıyla** anıyor ("Sütunların kendisi önemliyse (audit log)") ve
        haklı — bir audit satırının kimliği (admin, rol, eylem, varlık, zaman)
        beşlisidir, kart hâline getirilince yan yana karşılaştırılamaz.
        Brifing 3.5'in "Mobile cards" isteğiyle çelişiyor; çelişkinin ayrıntısı
        ve `DataTable`'daki kaynağı raporda.

        `striped`: sekiz sütunda göz satır kaydırıyor.
        `compact`: audit bir kütük, taranarak okunur. Tek dokunma hedefi olan
        "Detay" butonu kendi yüksekliğini (`control.height.sm` = 2.75rem)
        koruyor, hücre dolgusundan bağımsız.

        İki kapı `DataTable`'ın içinde: `error.retryable && onRetry !== undefined`.
        `onRetry` sözleşmede **zorunlu**, yani her zaman bağlı — butonu çıkaran ya
        da gizleyen tek şey `retryable`.
      */}
      <DataTable<AuditLogEntry>
        rows={satirlar}
        columns={sutunlar}
        density="compact"
        visualStyle="striped"
        mobileMode="scroll"
        loading={yukleniyor}
        emptyState={bosDurum}
        {...(state.status === 'error' && { error: state.error, onRetry })}
      />

      {/* `Pagination` `totalItems === 0` iken kendini hiç render etmiyor; boş
          sonucun mesajını `EmptyState` veriyor. `partialSuccess`te sayaçlar
          gelmemiş olabilir — üçü birden yoksa sayfalama da yok. */}
      {veri.page !== undefined && veri.pageSize !== undefined && veri.totalItems !== undefined ? (
        <Pagination
          page={veri.page}
          pageSize={veri.pageSize}
          totalItems={veri.totalItems}
          variant="numbered"
          onPageChange={onPageChange}
        />
      ) : null}

      <Drawer
        open={detayKaydi !== null}
        title="Audit kaydı detayı"
        side="right"
        size="lg"
        /* Base UI `onOpenChange`'e ikinci bir `eventDetails` argümanı geçiyor;
           sarmalanmazsa kapanış çağrısı fazladan argümanla gelirdi. */
        onOpenChange={(acik) => {
          if (!acik) setDetayKaydi(null)
        }}
        /*
          Alt şerit brifing 2.10'un "İlgili varlığa gitme" eyleminin doğal yeri.
          `onEntityOpen` **opsiyonel**: verilmezse şerit hiç render edilmez —
          basınca hiçbir şey yapmayan buton, olmayan butondan kötü. `onEntryOpen`
          (çekmece açar) ile karıştırma: bu buton `entityType`+`entityId` ile
          ekrandan ayrılır. `detayKaydi` null iken de çıkmaz — kaydı yoksa
          gidilecek varlık da yok.
        */
        footer={
          onEntityOpen !== undefined && detayKaydi !== null ? (
            <Button
              variant="secondary"
              leadingIcon={<ArrowUpRight size={16} />}
              onClick={() => {
                if (detayKaydi !== null) onEntityOpen(detayKaydi)
              }}
            >
              İlgili varlığa git
            </Button>
          ) : undefined
        }
      >
        {detayKaydi === null ? null : (
          <div className={css.detayGovdesi}>
            <dl className={css.detayListesi}>
              <div className={css.detaySatiri}>
                <dt className={css.detayTerimi}>Admin</dt>
                <dd className={css.detayDegeri}>{detayKaydi.actorName}</dd>
              </div>
              <div className={css.detaySatiri}>
                <dt className={css.detayTerimi}>Rol</dt>
                <dd className={css.detayDegeri}>{ADMIN_ROLE_LABEL[detayKaydi.actorRole]}</dd>
              </div>
              <div className={css.detaySatiri}>
                <dt className={css.detayTerimi}>Eylem</dt>
                <dd className={css.detayDegeri}>{eylemEtiketi(detayKaydi.action)}</dd>
              </div>
              <div className={css.detaySatiri}>
                <dt className={css.detayTerimi}>Varlık tipi</dt>
                <dd className={css.detayDegeri}>
                  {AUDIT_ENTITY_TYPE_LABEL[detayKaydi.entityType]}
                </dd>
              </div>
              <div className={css.detaySatiri}>
                <dt className={css.detayTerimi}>Varlık kimliği</dt>
                <dd className={`${css.detayDegeri} ${css.kimlikHucresi}`}>{detayKaydi.entityId}</dd>
              </div>
              <div className={css.detaySatiri}>
                <dt className={css.detayTerimi}>Özet</dt>
                <dd className={css.detayDegeri}>{detayKaydi.summary}</dd>
              </div>
              <div className={css.detaySatiri}>
                <dt className={css.detayTerimi}>Zaman</dt>
                <dd className={css.detayDegeri}>{formatDateTime(detayKaydi.createdAt)}</dd>
              </div>
              <div className={css.detaySatiri}>
                <dt className={css.detayTerimi}>Korelasyon kimliği</dt>
                <dd className={`${css.detayDegeri} ${css.kimlikHucresi}`}>
                  {korelasyonKimligi(detayKaydi.metadata) ?? '—'}
                </dd>
              </div>
            </dl>

            <div className={css.jsonBolumu}>
              <h3 className={css.jsonBasligi}>JSON detayı</h3>
              {/* `tabIndex={0}`: kap yatay kaydırılıyor ve içinde odaklanılacak
                  hiçbir şey yok — klavye kullanıcısı fare olmadan kaydıramaz.
                  `role="region"` verilmedi (gerekçe `.css.ts`'te). */}
              <pre className={css.json} tabIndex={0}>
                {JSON.stringify(detayKaydi.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
