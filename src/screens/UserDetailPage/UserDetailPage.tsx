import { useState, type ReactNode } from 'react'
import { Ban, ShieldOff } from 'lucide-react'
import {
  AdminPermission,
  AdminRole,
  type AuditLogEntry,
  type Listing,
  type ListingReport,
  type Paginated,
  type UserAccount,
} from '../../types/domain'
import {
  ADMIN_PERMISSION_LABEL,
  ADMIN_ROLE_LABEL,
  AUDIT_ENTITY_TYPE_LABEL,
  LISTING_CATEGORY_LABEL,
  TRANSACTION_TYPE_LABEL,
} from '../../domain/labels'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateTime, machineDateTime } from '../../utils/formatDateTime'
import { Alert } from '../../components/primitives/Alert'
import { Button } from '../../components/primitives/Button'
import { Select } from '../../components/primitives/Select'
import { Skeleton } from '../../components/primitives/Skeleton'
import { Tabs } from '../../components/primitives/Tabs'
import { ConfirmDialog } from '../../components/composites/ConfirmDialog'
import { DataTable } from '../../components/composites/DataTable'
import { EmptyState } from '../../components/composites/EmptyState'
import { ErrorState } from '../../components/composites/ErrorState'
import { ReportCard } from '../../components/composites/ReportCard'
import { StatusBadge } from '../../components/composites/StatusBadge'
import { UserSummaryCard } from '../../components/composites/UserSummaryCard'
import type {
  ColumnDef,
  SelectOption,
  TabItem,
  UiError,
  UserDetailData,
  UserDetailPageProps,
} from '../../types/component-props'
import * as css from './UserDetailPage.css'

/* ────────────────────────────────────────────────────────────────────────────
   Sekme kimlikleri
   ──────────────────────────────────────────────────────────────────────────── */

const SEKME_ILANLAR = 'listings'
const SEKME_SIKAYETLER = 'reports'
const SEKME_AUDIT = 'audit'

/* ────────────────────────────────────────────────────────────────────────────
   Yetki kapıları
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Hesabın **tam** görünümü açık mı?
 *
 * **Sıra kritik ve tersine çevrilemez.** `AdminPermission` kademeleri dışlayıcı
 * değil **kapsayıcıdır**: `superAdmin` `ALL_ADMIN_PERMISSIONS` ile hem
 * `UserView`'a hem `UserViewProfile`'a sahiptir (bkz. `ROLE_PERMISSIONS`).
 * Dolayısıyla "bu kullanıcı sınırlı mı?" sorusu `includes(UserViewProfile)` ile
 * **cevaplanamaz** — o soru `superAdmin` için de `true` döner ve süper admin'e
 * destek'in daraltılmış görünümü gösterilirdi.
 *
 * Doğru sıra: **önce tamını sor**, sınırlı kademeye ondan sonra düş. Aynı desen
 * `UserEditContact` ve `ReportTriageLimited` için de geçerli.
 */
function tamGorunumVarMi(izinler: AdminPermission[]): boolean {
  return izinler.includes(AdminPermission.UserView)
}

/* ────────────────────────────────────────────────────────────────────────────
   Sınırlı görünümün veri sınırı
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * `UserAccount`'un yalnız **sınırlı görünümde gösterilebilen** alanlarını seçer.
 *
 * Kapsam `AdminPermission.UserViewProfile`'ın JSDoc'undan **birebir** geliyor:
 * gizli olan iki hesap alanı `adminRole` ve `lastLoginAt`; geri kalan her şey
 * (ad, avatar, tip, firma, `verified`, e-posta, telefon, `status`, `createdAt`,
 * ilan sayaçları, `reportCount`) destek'e açık.
 *
 * **Neden kartın varyantına güvenilmiyor:** varyant bir **görünüm** kararıdır,
 * yetki kararı değil. `UserSummaryCard` bir zamanlar `adminRole` rozetini
 * varyanttan bağımsız basıyordu — yani `detailed` (destek'in yüzü) admin rolünü
 * sızdırıyordu; kusuru bu ekranın story'leri buldu ve rozet artık
 * `variant === 'security'` kapısının arkasında. Ama kapının kartta kapanmış
 * olması buradaki seçmeyi gereksizleştirmiyor, çünkü **yetki sınırı fail-closed
 * olmalı**: kart yarın `detailed`'a bir alan eklediğinde (bu turda `security`
 * `detailed`'ın üst kümesi yapılırken tam da böyle alanlar taşındı) sızıntıyı
 * durduracak şey sayfanın kapısıdır. "Yetki kontrolü component'in işi değil"
 * kuralının doğal sonucu: kartın görmemesi gereken veriyi ona **hiç vermemek**.
 * Gizli alan `disabled` veya soluk değil, **DOM'a hiç girmiyor**.
 *
 * **Neden çıkarma (omit) değil seçme (pick):** bu bir yetki sınırı ve yetki
 * sınırı **fail-closed** olmalı. `UserAccount`'a yarın opsiyonel bir alan
 * eklenirse omit kalıbı onu destek'e sessizce **açardı**; seçme kalıbı sessizce
 * **kapatır**. Zorunlu bir alan eklenirse TS2739 bu fonksiyonu derletmez ve
 * kararı insana geri verir — istenen tam olarak budur.
 *
 * Koşullu spread: `exactOptionalPropertyTypes` açıkken opsiyonel alana açıkça
 * `undefined` atanamaz (TS2375); alan ya vardır ya yoktur.
 */
function sinirliGorunumHesabi(user: UserAccount): UserAccount {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    ...(user.avatarUrl !== undefined && { avatarUrl: user.avatarUrl }),
    type: user.type,
    status: user.status,
    verified: user.verified,
    ...(user.companyName !== undefined && { companyName: user.companyName }),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    listingCount: user.listingCount,
    activeListingCount: user.activeListingCount,
    reportCount: user.reportCount,
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   Etiketler
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * `ADMIN_PERMISSION_LABEL`'ın **açık uçlu anahtarla** okunabilen hâli.
 *
 * `AuditLogEntry.action`'ın tipi `AdminPermission` değil **`string`**
 * (`fixtures/audit.ts`'in gerekçesi: sunucu bir gün `auth:login` gibi bu kümede
 * olmayan bir kod gönderebilir). Sözlüğün çıkarılan tipi ise yalnız 33 izin
 * değerini anahtar sayıyor ve `sozluk[action]` derlenmez; `as AdminPermission`
 * yazmak ise tam da sözlüğün kapsamadığı kodu kapsıyormuş gibi yapmak olurdu —
 * tipi susturur, davranışı düzeltmez.
 *
 * `Map` bunu `as`'siz çözüyor ve tipi **doğruyu** söylüyor: anahtar uzayı
 * açıktır, `get` `string | undefined` döner ve bilinmeyen kod ham gösterilir.
 * (`AttributeEditor`'ın `String(tip) === next` kalıbıyla aynı ilke: enum'a
 * zorlamak yerine arayarak dönmek.)
 */
const IZIN_ETIKETLERI = new Map<string, string>(Object.entries(ADMIN_PERMISSION_LABEL))

/**
 * Audit eyleminin okunur adı.
 *
 * `ADMIN_PERMISSION_LABEL[action] ?? action`: **tanımadığı kodu ham göstermek,
 * boş hücre göstermekten iyidir** (`fixtures/audit.ts`). Kodlar uydurulmadı —
 * audit'e giren her eylem bir izin kapısından geçmiştir, kapının adı eylemin de
 * adıdır.
 */
function islemEtiketi(action: string): string {
  return IZIN_ETIKETLERI.get(action) ?? action
}

/** Görünen metin biçimli, `datetime` ham ISO: makineye kaynağın kendisi gider. */
function Zaman({ value }: { value: string }) {
  return (
    <time className={css.dateCell} dateTime={machineDateTime(value)}>
      {formatDateTime(value)}
    </time>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Sütunlar
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Kullanıcının ilanları.
 *
 * `ColumnDef<Listing>` açıkça yazılı: `cell` içinde `row` tipi `Listing`'dir,
 * `{ id: string }` değil — DataTable'ın generic'i ancak böyle korunur.
 */
const ILAN_SUTUNLARI: ColumnDef<Listing>[] = [
  /* `width` yok — gerekçesi `.css.ts` → `dateCell`. */
  { id: 'listingNo', header: 'İlan no', accessor: 'listingNo' },
  {
    id: 'title',
    header: 'Başlık',
    cell: (row) => <span className={css.cellText}>{row.title}</span>,
  },
  {
    id: 'category',
    header: 'Kategori',
    cell: (row) =>
      `${LISTING_CATEGORY_LABEL[row.category]} · ${TRANSACTION_TYPE_LABEL[row.transactionType]}`,
  },
  { id: 'price', header: 'Fiyat', cell: (row) => formatCurrency(row.price), align: 'end' },
  {
    id: 'status',
    header: 'Durum',
    cell: (row) => <StatusBadge status={row.status} size="sm" showDot />,
  },
]

/**
 * Hesabın işlem geçmişi.
 *
 * Tarih `formatDateTime`'dan geçiyor (`tr-TR` + `Europe/Istanbul` sabit): saat
 * dilimi verilmezse "karar hangi gün verildi" sorusu makineye göre farklı
 * cevaplanır. Göreli zaman ("3 gün önce") **yazılmıyor** — hesabı "şimdi"ye
 * dayanır ve fixture determinizmini tek başına bozar.
 */
const AUDIT_SUTUNLARI: ColumnDef<AuditLogEntry>[] = [
  { id: 'createdAt', header: 'Tarih', cell: (row) => <Zaman value={row.createdAt} /> },
  { id: 'action', header: 'İşlem', cell: (row) => islemEtiketi(row.action) },
  {
    id: 'actor',
    header: 'Yapan',
    cell: (row) => `${row.actorName} · ${ADMIN_ROLE_LABEL[row.actorRole]}`,
  },
  { id: 'entityType', header: 'Varlık', cell: (row) => AUDIT_ENTITY_TYPE_LABEL[row.entityType] },
  {
    id: 'summary',
    header: 'Özet',
    cell: (row) => <span className={css.cellText}>{row.summary}</span>,
  },
]

/** Rol seçeneği; `AdminRole` üzerinden **türetiliyor**, elle yazılmıyor. */
const ROL_DEGERLERI: AdminRole[] = Object.values(AdminRole)

const ROL_SECENEKLERI: SelectOption[] = ROL_DEGERLERI.map((rol) => ({
  value: rol,
  label: ADMIN_ROLE_LABEL[rol],
}))

/* ────────────────────────────────────────────────────────────────────────────
   Yardımcı bloklar
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Ölçü koruyan yükleme iskeleti.
 *
 * Spinner'lı boş ekran değil: brifingin "loading durumları layout shift
 * üretmemelidir" kuralı, iskeletin gerçek içerikle **aynı yeri** kaplamasını
 * istiyor. Kap `aria-busy` ile duyuruyor; `Skeleton`'ın kendisi `aria-hidden`
 * (boş kutular okunmaz).
 *
 * Buradaki ham ölçüler (`14rem`, `3rem`) kural ihlali değil: `SkeletonProps.width`
 * / `height` JSDoc'u onları açıkça istisna sayıyor — "değer dışarıdan gelir ve
 * iskeletin taklit ettiği içeriğe göre değişir, token'a bağlanamaz". İskeletin
 * tek işi taklit ettiği kutunun ölçüsünü tutturmak.
 */
function Iskelet() {
  return (
    <div className={css.root} aria-busy="true">
      <div className={css.columns}>
        <div className={css.summary}>
          <span className={css.titleSkeleton}>
            <Skeleton variant="text" width="14rem" />
          </span>

          <div className={css.cardSkeleton}>
            <Skeleton variant="circle" width="3rem" height="3rem" />
            <div className={css.cardSkeletonBody}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" lines={4} />
            </div>
          </div>
        </div>

        <div className={css.sections}>
          <div className={css.tabsSkeleton}>
            <Skeleton variant="text" width="5rem" />
            <Skeleton variant="text" width="6rem" />
            <Skeleton variant="text" width="7rem" />
          </div>
          <div className={css.tableSkeleton}>
            <Skeleton variant="text" lines={6} />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Bir bölümün (ilanlar / şikayetler / audit) yüklenememiş hâli.
 *
 * **İki kapı:** buton için `hata.retryable === true` **ve** `onRetry` bağlı
 * olmalı. Hatanın tekrar denenebilir _olduğunu bilmek_, tekrar denemeyi
 * _yapabilmek_ değil (bkz. `DataTableProps.onRetry`).
 *
 * `hata` hiç gelmemiş olabilir: `partialSuccess`'in sözleşmesi "her alan için ya
 * `data`'da değeri vardır ya `errors`'ta hatası" diyor, ama tip bunu garanti
 * etmiyor. O boşlukta sunucunun cümlesi yerine sayfanın cümlesi yazılıyor ve
 * tekrar deneme **sunulmuyor** — tekrar denenebilirliği bilmiyoruz.
 */
function BolumHatasi({
  hata,
  baslik,
  onRetry,
}: {
  hata: UiError | undefined
  baslik: string
  onRetry: () => void
}) {
  return (
    <ErrorState
      variant="section"
      title={hata?.title ?? baslik}
      description={
        hata?.message ?? 'Bu bölüm yüklenemedi. Sayfayı yeniden yükleyip tekrar deneyin.'
      }
      {...(hata?.code !== undefined && { code: hata.code })}
      {...(hata?.retryable === true && { onRetry })}
    />
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Ekran
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Kullanıcı detayı: hesap özeti, kullanıcının ilanları, şikayetleri ve işlem
 * geçmişi.
 *
 * **Veri çekmez** — `state: AsyncState<UserDetailData>` prop'undan gelir. Kabuk
 * de değildir: `AppShell`/`TopBar`/`SidebarNav`/`PageHeader` render etmez, bu
 * yüzden en üst başlığı `<h2>`'dir. Sayfanın `<h1>`'i `PageHeader`'ındır ve
 * zinciri route katmanı kurar.
 *
 * ## Yetki: destek durumu açıklar, moderatör durumu belirler
 *
 * `availablePermissions` bu ekranın **kapısının anahtarıdır** ve kapı üç yerde
 * ayrı ayrı işler:
 *
 * 1. **Görünüm kademesi.** Önce `UserView` (tam) sınanır, yoksa
 *    `UserViewProfile`'a düşülür. Kademeler kapsayıcı olduğu için sıra
 *    tersine çevrilemez — `superAdmin` ikisine birden sahiptir ve
 *    `includes(UserViewProfile)` ile sorulan soru ona da "sınırlı" derdi.
 *    Tam görünüm `UserSummaryCard`'ın `security` varyantıdır (kartın kendi
 *    JSDoc'u: "`security` bir yetki kapısıdır, yalnız bir düzen değil");
 *    sınırlı görünüm `detailed`'dır.
 * 2. **Alan sınırı.** `UserViewProfile`'ın gizli saydığı iki hesap alanı
 *    (`lastLoginAt`, `adminRole`) sınırlı görünümde karta **hiç verilmez** —
 *    bkz. `sinirliGorunumHesabi`. Gizli alan `disabled` değil, DOM'da yok.
 * 3. **Bölüm sınırı.** `UserDetailData.auditEntries` **her zaman pakette**, ama
 *    veri gelmesi sekmeyi çizmenin gerekçesi değil: `AuditView` yoksa sekme
 *    **hiç render edilmez** — boş sekme değil, `disabled` sekme değil, yok.
 *    `ROLE_PERMISSIONS`'ta `destek`in `AuditView`'u yoktur. `TabItem.disabled`'ın
 *    kendi JSDoc'u da bunu söylüyor: "kilitli sekme, olduğunu bildiği ama
 *    açamadığı bir kapıdır".
 *
 * Eylemler de kapılı ve yetkisi olmayana **hiç render edilmez** (reponun en eski
 * kuralı): askıya alma `user:suspend`, yasaklama `user:ban`, admin rolü atama
 * `user:assignRole` (yalnız `superAdmin`).
 *
 * **Yetkisizliği önden bilen kullanıcı buraya hiç gelmez** (`icerikDenetcisi`'nin
 * hiçbir kullanıcı görüntüleme izni yok); menü süzgeci ve route sayfa katmanının
 * işidir. Sunucunun reddettiği hâl `state.status === 'unauthorized'` olarak
 * gelir — istemcinin izin listesi bayatlamış olabilir.
 *
 * ## Yaptırım kaydı verilemiyor
 *
 * `UserSummaryCardProps.activeSanction` Faz 3'te tam da bu ekran için eklendi,
 * ama `UserDetailData` `UserSanction` **taşımıyor** (`user`, `listings`,
 * `reports`, `auditEntries`). Kart bu yüzden yaptırımın yalnız **tipini**
 * durumdan türetiyor; "neden" ve "ne zamana kadar" (brifing 2.6'nın "aktif
 * yaptırım" verisi) bu ekranda **cevapsız**. Uydurulmadı, raporlandı.
 *
 * ## Düzen
 *
 * "Mobile tabs, desktop columns" (brifing 3.5): bölümler **her zaman** sekmede,
 * kolonlaşan şey sayfanın çerçevesi. Gerekçesi `.css.ts`'te — bölümleri iki kez
 * çizmek yetki iddiasını sayı saymaya çevirirdi, `display: none` ile gizlemek
 * ise onu erişilebilirlik ağacından silip ölçülemez kılardı.
 *
 * @example
 * <UserDetailPage
 *   state={{ status: 'success', data }}
 *   availablePermissions={ROLE_PERMISSIONS[AdminRole.Support]}
 *   onListingOpen={(ilan) => navigate(`/ilanlar/${ilan.id}`)}
 *   onSuspend={askiyaAl}
 *   onBan={yasakla}
 *   onRoleChange={rolAta}
 *   onRetry={yenidenYukle}
 * />
 */
export function UserDetailPage({
  state,
  availablePermissions,
  onListingOpen,
  onSuspend,
  onBan,
  onRoleChange,
  onRetry,
}: UserDetailPageProps) {
  const [sekme, setSekme] = useState<string>(SEKME_ILANLAR)
  const [banOnayiAcik, setBanOnayiAcik] = useState(false)

  if (state.status === 'idle' || state.status === 'loading') {
    return <Iskelet />
  }

  /*
    `unauthorized` `error`'dan ayrı bir durum ve ayrı bir ekran ister: "bir şey
    ters gitti, tekrar dene" değil, "bu senin görebileceğin bir şey değil".
    Tekrar deneme **yok** — `UiError.retryable` burada tip düzeyinde `false` ve
    403'ü tekrar denemek aynı 403'ü verir.
  */
  if (state.status === 'unauthorized') {
    return (
      <ErrorState
        variant="page"
        title={state.error.title}
        description={state.error.message}
        {...(state.error.code !== undefined && { code: state.error.code })}
      />
    )
  }

  if (state.status === 'error') {
    return (
      <ErrorState
        variant="page"
        title={state.error.title}
        description={state.error.message}
        {...(state.error.code !== undefined && { code: state.error.code })}
        /*
          İki kapı: `retryable === true` VE `onRetry` bağlı. İkincisi burada
          sözleşme gereği hep açık — `UserDetailPageProps.onRetry` **zorunlu**,
          `DataTableProps.onRetry` / `ChartCardProps.onRetry` gibi opsiyonel
          değil. Yani kuralın yarısını tip zaten garantiliyor; koşullu spread
          şart, çünkü `exactOptionalPropertyTypes` açıkken
          `onRetry={... ? onRetry : undefined}` TS2375 verir.
        */
        {...(state.error.retryable && { onRetry })}
      />
    )
  }

  /*
    Tek bir kaydı gösteren ekranda `empty`nin tek anlamlı okuması "kayıt yok".
    `empty.data` bilerek yok sayılıyor: hesabı gelmemiş bir kullanıcı detayında
    gösterilecek bir şey yok ve yarım veriyi göstermek "bulundu" demek olurdu.
  */
  if (state.status === 'empty') {
    return (
      <EmptyState
        title="Kullanıcı bulunamadı"
        description="Bu kimlikle bir hesap yok. Bağlantı eski olabilir ya da hesap silinmiş olabilir."
      />
    )
  }

  const bayat = state.status === 'success' && state.stale === true
  const veri: Partial<UserDetailData> = state.data
  const hatalar: Partial<Record<keyof UserDetailData, UiError>> =
    state.status === 'partialSuccess' ? state.errors : {}

  /*
    Hesap gelmediyse (yalnız `partialSuccess`'te mümkün) gösterilecek bir şey
    yok: ilanlar ve audit bir hesabın *hakkında*. Sunucunun cümlesi varsa o
    yazılır; yoksa "bulunamadı"ya düşülür — olmayan bir hata metnini uydurmaktansa
    bilinen bir durumu söylemek doğru.
  */
  const user = veri.user
  if (user === undefined) {
    const hesapHatasi = hatalar.user
    return hesapHatasi !== undefined ? (
      <ErrorState
        variant="page"
        title={hesapHatasi.title}
        description={hesapHatasi.message}
        {...(hesapHatasi.code !== undefined && { code: hesapHatasi.code })}
        {...(hesapHatasi.retryable && { onRetry })}
      />
    ) : (
      <EmptyState
        title="Kullanıcı bulunamadı"
        description="Bu kimlikle bir hesap yok. Bağlantı eski olabilir ya da hesap silinmiş olabilir."
      />
    )
  }

  /* ── Yetki kapıları ── */

  const tamGorunum = tamGorunumVarMi(availablePermissions)
  const auditGorunur = availablePermissions.includes(AdminPermission.AuditView)
  const sikayetGorunur = availablePermissions.includes(AdminPermission.ReportView)
  const askiyaAlinabilir = availablePermissions.includes(AdminPermission.UserSuspend)
  const yasaklanabilir = availablePermissions.includes(AdminPermission.UserBan)
  const rolAtanabilir = availablePermissions.includes(AdminPermission.UserAssignRole)

  const kartHesabi = tamGorunum ? user : sinirliGorunumHesabi(user)

  /* ── Eylemler ── */

  const eylemler: ReactNode[] = []

  if (askiyaAlinabilir) {
    /*
      Askıya alma onay istemiyor: süreli ve geri alınabilir bir karar
      (`UserSanction.endsAt` + `revokedAt`). Yasaklama süresizdir
      (`permanentBanSanction`'ın `endsAt`'i **yok**) ve onay ister.
    */
    eylemler.push(
      <Button
        key="suspend"
        variant="secondary"
        size="sm"
        leadingIcon={<ShieldOff size={16} />}
        onClick={onSuspend}
      >
        Askıya al
      </Button>,
    )
  }

  if (yasaklanabilir) {
    eylemler.push(
      <Button
        key="ban"
        variant="danger"
        size="sm"
        leadingIcon={<Ban size={16} />}
        onClick={() => setBanOnayiAcik(true)}
      >
        Yasakla
      </Button>,
    )
  }

  /* ── Sekmeler ── */

  const listings: Paginated<Listing> | undefined = veri.listings
  const reports: ListingReport[] | undefined = veri.reports
  const auditEntries: AuditLogEntry[] | undefined = veri.auditEntries

  const sekmeler: TabItem[] = []

  sekmeler.push({
    id: SEKME_ILANLAR,
    label: 'İlanlar',
    ...(listings !== undefined && { badge: listings.totalItems }),
    content:
      listings === undefined ? (
        <BolumHatasi hata={hatalar.listings} baslik="İlanlar yüklenemedi" onRetry={onRetry} />
      ) : (
        <DataTable<Listing>
          rows={listings.items}
          columns={ILAN_SUTUNLARI}
          /*
            `mobileMode="cards"` bilerek kullanılmıyor: DataTable o modda
            **her genişlikte** kart çiziyor (`DataTable.tsx`'te tablo dalından
            önce koşulsuz `return`; `css.cards`'ta medya sorgusu yok), yani
            masaüstü kolonunda da tablo yerine kart görünürdü. Raporlandı.
          */
          mobileMode="scroll"
          onRowClick={(row) => onListingOpen(row)}
          emptyState={
            <EmptyState
              variant="compact"
              title="Bu hesabın hiç ilanı yok"
              description="Kullanıcı henüz ilan oluşturmamış."
            />
          }
        />
      ),
  })

  /*
    Şikayet listesi `report:view` ister. Bugün dört rolün dördünde de var, yani
    kapı hiçbir rolü dışarıda bırakmıyor — ama `ListingReport` kayıtlarını
    izinsiz göstermek bir sızıntı olurdu ve kapının adı enum'da zaten yazılı.
    `UserViewProfile`'ın gizli alan listesinde şikayetler yok; görünür listesinde
    `reportCount` var, yani destek bu bölümü görür.
  */
  if (sikayetGorunur) {
    sekmeler.push({
      id: SEKME_SIKAYETLER,
      label: 'Şikayetler',
      ...(reports !== undefined && { badge: reports.length }),
      content:
        reports === undefined ? (
          <BolumHatasi hata={hatalar.reports} baslik="Şikayetler yüklenemedi" onRetry={onRetry} />
        ) : reports.length === 0 ? (
          <EmptyState
            variant="compact"
            title="Bu hesaba bağlı şikayet yok"
            description="Kullanıcının ilanlarına açılmış bir şikayet bulunmuyor."
          />
        ) : (
          <ul className={css.reportList}>
            {reports.map((report) => {
              /*
                İlan bağlamı aynı paketten çözülüyor: `UserDetailData` ilanları da
                taşıyor ve şikayetler bu hesabın ilanlarına ait. Bulunamazsa kart
                `listingId`'yi gösterir — eksik bağlam, kırık başvuru değil
                (`ReportCardProps.listing`).
              */
              const ilan = listings?.items.find((l) => l.id === report.listingId)
              return (
                <li key={report.id} className={css.reportItem}>
                  <ReportCard
                    report={report}
                    variant="compact"
                    {...(ilan !== undefined && { listing: ilan })}
                  />
                </li>
              )
            })}
          </ul>
        ),
    })
  }

  /*
    ⚠ Ekranın yetki sınırının en keskin yeri.

    `UserDetailData.auditEntries` **her zaman pakette** — veri geldi diye sekme
    çizilmiyor. `AuditView` yoksa sekme hiç oluşturulmuyor: `TabItem` dizisine
    girmeyen sekme ne şeritte ne panelde DOM'a girer. `ROLE_PERMISSIONS`:
    `destek`te `AuditView` yok, `moderator` ve `superAdmin`'de var.
  */
  if (auditGorunur) {
    sekmeler.push({
      id: SEKME_AUDIT,
      label: 'İşlem Geçmişi',
      ...(auditEntries !== undefined && { badge: auditEntries.length }),
      content:
        auditEntries === undefined ? (
          <BolumHatasi
            hata={hatalar.auditEntries}
            baslik="İşlem geçmişi yüklenemedi"
            onRetry={onRetry}
          />
        ) : (
          <DataTable<AuditLogEntry>
            rows={auditEntries}
            columns={AUDIT_SUTUNLARI}
            density="compact"
            /* Audit'te sütunların kendisi önemli: tablo kesilmez, kaydırılır. */
            mobileMode="scroll"
            emptyState={
              <EmptyState
                variant="compact"
                title="Bu hesapta işlem kaydı yok"
                description="Hesabı hedef alan bir admin işlemi henüz yapılmamış."
              />
            }
          />
        ),
    })
  }

  /*
    Seçili sekme yetki değişince listeden düşmüş olabilir (destek'e audit
    sekmesi kapanır). Base UI'a var olmayan bir `value` vermek hiçbir paneli
    açmaz; ilk sekmeye düşülüyor.
  */
  const gecerliSekme = sekmeler.some((s) => s.id === sekme) ? sekme : (sekmeler[0]?.id ?? '')

  return (
    <div className={css.root}>
      {/*
        Bayat veri kapatılabilir değil: "Kalıcı bir sorunu (yetki yok, veri
        bayat) kapatılabilir yapmayın — kullanıcı kapatır, sorun durur"
        (`AlertProps.dismissible`). `info` değil `warning`: yaptırım kararı
        verirken bakılan sayıların eski olması bilgi değil uyarıdır.
      */}
      {bayat ? (
        <Alert
          tone="warning"
          title="Bu bilgiler güncel olmayabilir"
          description="Sunucudan yeni veri alınamadı; ekranda önbellekteki kayıt görünüyor."
        />
      ) : null}

      <div className={css.columns}>
        <div className={css.summary}>
          {/*
            Ekranın en üst başlığı. Avatar bilerek **içeride değil**: Base UI'ın
            `Avatar.Fallback`'i baş harfleri `aria-hidden`'sız bir `<span>`e
            yazıyor ve başlığın adı "MY Mert Yıldız" diye başlardı. Kartın
            avatarı zaten `aria-hidden` bir sarmalayıcının içinde
            (`UserSummaryCard.tsx`). Ölçüm: `Suspended` story'si — başlığın adını
            `/^Mert Yıldız/` ile, baş harflerin gizli atasını `closest(
            '[aria-hidden="true"]')` ile sınıyor. (`queryByText('MY')` ile
            kurulan iddia her zaman düşerdi: metin DOM'da duruyor, gizli olan
            erişilebilirlik ağacındaki hâli.)
          */}
          <h2 className={css.title}>{user.fullName}</h2>

          <UserSummaryCard
            user={kartHesabi}
            /*
              `security` = tam görünüm, `UserView` ister; `destek` onu görmez ve
              `detailed`'a düşer. Kart yetki bilmez — varyantı seçen sayfadır.

              `activeSanction` **verilemiyor**: `UserDetailData` `UserSanction`
              taşımıyor (bkz. component JSDoc'u → "Yaptırım kaydı verilemiyor").
              Kart bu yüzden `security`'de yaptırımın yalnız tipini durumdan
              türetecek; gerekçe ve bitiş tarihi bu ekranda yok.
            */
            variant={tamGorunum ? 'security' : 'detailed'}
            /*
              `onClick` verilmiyor: kart kullanıcı detayına götürür, biz zaten
              oradayız. Verilseydi kart bir `<button>`'a döner ve tıklanabilir
              görünürdü — olmayan bir eylem vaat etmek.
            */
            actions={eylemler.length > 0 ? <>{eylemler}</> : undefined}
          />

          {/*
            Admin rolü kendi kutusunda, kartın `actions` slot'unda değil.
            Sözleşme bize `onRoleChange(role: AdminRole)` veriyor — bir tetik
            değil bir **değer** istiyor, yani doğru kontrol buton değil alan.
            Etiketli bir alan ise kartın tek satırlık, ortalanmış eylem
            şeridinin ritmini bozar. Kartın JSDoc'u "Rolü değiştir"i eylem
            sayarken bir picker açan buton varsayıyor; elimizdeki sözleşmede
            öyle bir tetik yok.
          */}
          {rolAtanabilir ? (
            <div className={css.roleBox}>
              <Select
                label="Admin rolü"
                helperText="Rol değişikliği anında uygulanır."
                size="sm"
                placeholder="Rol atanmadı"
                options={ROL_SECENEKLERI}
                value={user.adminRole}
                /*
                  Base UI handler'ı sarmalanıyor (ikinci `eventDetails`
                  argümanını sözleşme tanımıyor) ve `string` dönen değer enum'a
                  `as` ile değil **arayarak** daraltılıyor — `AttributeEditor`'ın
                  `veriTipiSec`'i ile birebir aynı kalıp: listede olmayan bir
                  değer sessizce role dönüşmez.

                  `clearable` yok: `onRoleChange` `undefined` kabul etmiyor,
                  yani rolü *kaldırmanın* sözleşmede karşılığı yok (raporlandı).
                */
                onValueChange={(next) => {
                  const rol = ROL_DEGERLERI.find((r) => String(r) === next)
                  if (rol !== undefined) onRoleChange(rol)
                }}
              />
            </div>
          ) : null}

          {/*
            Onay dialog'u yalnız yetki varken DOM'a giriyor: yetkisiz kullanıcıya
            kapalı bir dialog bile render etmenin gereği yok.
          */}
          {yasaklanabilir ? (
            <ConfirmDialog
              open={banOnayiAcik}
              tone="danger"
              title={`${user.fullName} hesabını yasakla`}
              description="Hesap süresiz olarak kapatılır: kullanıcı giriş yapamaz ve ilan veremez. Yaptırım sonradan kaldırılabilir ama hesap o ana kadar kapalı kalır."
              confirmLabel="Yasakla"
              onConfirm={() => {
                setBanOnayiAcik(false)
                onBan()
              }}
              onCancel={() => setBanOnayiAcik(false)}
            />
          ) : null}
        </div>

        <div className={css.sections}>
          {/* Base UI handler'ı sarmalanıyor: ikinci argüman sözleşmede yok. */}
          <Tabs value={gecerliSekme} items={sekmeler} onValueChange={(next) => setSekme(next)} />
        </div>
      </div>
    </div>
  )
}
