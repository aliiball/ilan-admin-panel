import { useState } from 'react'
import { FileSearch, RefreshCw } from 'lucide-react'
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
import { AdminRole, type AuditLogEntry, type Paginated } from '../../types/domain'
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
 * Filtre alanları.
 *
 * **Sözleşme boşluğu:** brifing 2.10 "Tarih, rol, **kullanıcı** ve **eyleme**
 * göre filtreleme" istiyor, ama `AuditLogFilters` yalnız `query` / `roles` /
 * `entityTypes` / `dateRange` taşıyor — aktör ve eylem için ayrı kanal yok.
 * Serbest metin (`query`) ikisinin de yerini **yaklaşık** tutuyor ve placeholder
 * bunu açıkça söylüyor; uydurma prop eklenmedi (`actorIds`, `actions`).
 * `entityTypes` ise tersi: sözleşmede var, brifingin eylem listesinde yok —
 * fixture'ın altı varlık tipini kapsaması onun filtrelenmek için orada olduğunu
 * gösteriyor.
 */
const FILTRE_TANIMLARI: FilterDefinition[] = [
  {
    id: ALAN.query,
    type: 'text',
    label: 'Ara',
    placeholder: 'Admin adı, eylem kodu veya varlık kimliği',
  },
  {
    id: ALAN.roles,
    type: 'multiSelect',
    label: 'Rol',
    options: ROL_SECENEKLERI,
    placeholder: 'Tüm roller',
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
 * ## `onEntryOpen` JSON detayını açar; "ilgili varlığa gitme" bugün YOK
 *
 * Brifing 2.10 iki ayrı eylem istiyor — "JSON detayını açma" ve "**İlgili
 * varlığa gitme**" — ama sözleşmede tek bir kanal var: `onEntryOpen(entry)`.
 * Bir kanal iki işi yapamaz: biri çekmece açar (kayıtta kalır), öteki rota
 * değiştirir (ekrandan ayrılır).
 *
 * Ayrımı `AuditLogPageProps.onEntryOpen`'in kendi JSDoc'u karara bağlıyor ve bu
 * ekran onu uyguluyor: **kanal JSON detayını açar**; "varlığa gitme" için ayrı
 * bir `onEntityOpen(entry)` gerekir, imzalar donduruldu ve boşluk raporlandı —
 * bugün o eylem bu ekranda **yok**. Uydurma bir buton eklenmedi: basınca hiçbir
 * şey yapmayan "İlgili varlığa git", olmayan butondan kötüdür.
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
 * ## Kanalsız kalan üç gereksinim — uydurulmadı, raporlandı
 *
 * - **"Yetkiye göre dışa aktarma"** (brifing 2.10): ne `onExport` var ne de
 *   yetkiyi okuyacak bir izin listesi. İkisi birden gerekir; biri olmadan öteki
 *   işe yaramaz — yetkisiz kullanıcıya `disabled` buton değil, hiç buton.
 * - **"İlgili varlığa gitme"**: yukarıdaki `onEntryOpen` bölümü.
 * - **"Kullanıcı ve eyleme göre filtreleme"**: `AuditLogFilters`'ta aktör/eylem
 *   kanalı yok; serbest metin (`query`) ikisinin de yerini yaklaşık tutuyor.
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
 *   onRetry={refetch}
 * />
 */
export function AuditLogPage({
  state,
  filters,
  onFiltersChange,
  onPageChange,
  onEntryOpen,
  onRetry,
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
      <h2 className={css.baslik}>Audit kayıtları</h2>

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
        definitions={FILTRE_TANIMLARI}
        values={{
          [ALAN.query]: filters.query ?? '',
          [ALAN.roles]: filters.roles,
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
        /* `footer` verilmiyor: brifing 2.10'un "İlgili varlığa gitme" eylemi bu
           şeridin doğal yeri olurdu ama kanalı yok (`onEntryOpen` JSON detayına
           bağlandı, `onEntityOpen` sözleşmede tanımlı değil — RAPOR EDİLDİ).
           Basınca hiçbir şey yapmayan buton, olmayan butondan kötü. */
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
