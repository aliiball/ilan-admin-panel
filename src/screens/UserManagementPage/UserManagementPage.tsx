import { useState, type ReactNode } from 'react'
import { Flag } from 'lucide-react'
import {
  AdminPermission,
  AdminRole,
  UserStatus,
  UserType,
  type UserAccount,
} from '../../types/domain'
import {
  ADMIN_ROLE_LABEL,
  USER_STATUS_LABEL,
  USER_TYPE_LABEL,
  USER_VERIFICATION_LABEL,
} from '../../domain/labels'
import { formatDate, formatDateTime, machineDateTime } from '../../utils/formatDateTime'
import { Alert } from '../../components/primitives/Alert'
import { Avatar } from '../../components/primitives/Avatar'
import { Badge } from '../../components/primitives/Badge'
import { Button } from '../../components/primitives/Button'
import { Modal } from '../../components/primitives/Modal'
import { Select } from '../../components/primitives/Select'
import { ConfirmDialog } from '../../components/composites/ConfirmDialog'
import { DataTable } from '../../components/composites/DataTable'
import { EmptyState } from '../../components/composites/EmptyState'
import { ErrorState } from '../../components/composites/ErrorState'
import { FilterBar } from '../../components/composites/FilterBar'
import { Pagination } from '../../components/composites/Pagination'
import type {
  ColumnDef,
  DataTableProps,
  FilterDefinition,
  FilterValue,
  SelectOption,
  UserFilterValues,
  UserManagementPageProps,
} from '../../types/component-props'
import * as css from './UserManagementPage.css'

/* ── Yetki kademeleri ────────────────────────────────────────────────────────
 * Bu bölüm ekranın asıl işi: brifing 1.4'ün "Kullanıcı görüntüleme" × `destek`
 * hücresi ("Sınırlı") burada, **sütun sütun** uygulanıyor.
 */

/**
 * Görünüm kademesi.
 *
 * - `full`: `AdminPermission.UserView` — iç gerekçe, yaptırım geçmişi ve oturum
 *   bilgisi dahil her şey.
 * - `limited`: `AdminPermission.UserViewProfile` — `destek`in yüzü.
 * - `none`: kullanıcı görüntüleme izni hiç yok (`icerikDenetcisi`).
 */
type GorunumKademesi = 'full' | 'limited' | 'none'

/**
 * İzin listesinden görünüm kademesini çıkarır.
 *
 * **Sıra kritik ve tersine çevrilemez.** Kademeler dışlayıcı değil
 * **kapsayıcıdır**: `superAdmin` `ALL_ADMIN_PERMISSIONS` ile hem `UserView`'a
 * hem `UserViewProfile`'a sahiptir. Dolayısıyla "bu kullanıcı sınırlı mı?"
 * sorusu `includes(UserViewProfile)` ile **cevaplanamaz** — önce **tamı**
 * (`UserView`) sınanır, sonra sınırlıya düşülür. Ters sıra `superAdmin`'e
 * daraltılmış görünüm verirdi ve hiçbir test bunu görmezdi: ekran çalışmaya
 * devam eder, yalnız süper admin `lastLoginAt`'i bir daha hiç göremez.
 *
 * Aynı desen `UserEdit` → `UserEditProfile` → `UserEditContact` ve
 * `ReportTriage` → `ReportTriageLimited` için de geçerli (bkz. `domain.ts`).
 */
function gorunumKademesi(izinler: AdminPermission[]): GorunumKademesi {
  if (izinler.includes(AdminPermission.UserView)) return 'full'
  if (izinler.includes(AdminPermission.UserViewProfile)) return 'limited'
  return 'none'
}

/* ── Filtreler ───────────────────────────────────────────────────────────── */

/**
 * Filtrelerin varsayılanı: hiçbir şeyi elemeyen hâl.
 *
 * `query` ve `verified` **yok**, `undefined` değil: `exactOptionalPropertyTypes`
 * açıkken opsiyonel alana açıkça `undefined` atanamaz (TS2375) ve "filtre yok"u
 * alanın yokluğuyla söylemek `UserFilterValues`'ın kendi şeklidir.
 */
const VARSAYILAN_FILTRELER: UserFilterValues = { types: [], statuses: [], roles: [] }

/**
 * Kaç filtre gerçekten bir şey eliyor?
 *
 * **`filteredEmpty` `AsyncState`'in bir üyesi değil** — ve olmamalı: sunucu
 * "sonuç yok" der, "filtren yüzünden yok" demez. Ayrımı istemci yapar, çünkü
 * bilgi yalnız istemcide: `status === 'empty'` **ve** filtreler varsayılandan
 * farklıysa boşluğun sebebi filtredir ve kullanıcının atacağı adım "filtreleri
 * temizle"dir. Filtreler boşken aynı ekranı göstermek yalan olurdu: **"hiç
 * kullanıcı yok"ta temizlenecek filtre yoktur** ve olmayan bir eylemi önermek
 * kullanıcıyı boşa uğraştırır (`AsyncState`'in kendi JSDoc'u da bu yüzden
 * durumları ayırıyor: "her biri farklı bir şey yaptırır").
 *
 * Sayı `FilterBar`'a da geçiliyor — çubuğun kendi hesabı `definitions` üzerinden
 * çalışır ve **gizlenmiş bir alanı sayamaz**: `roles` filtresi `destek`e hiç
 * render edilmiyor (bkz. `filtreTanimlari`), ama kayıtlı bir görünümden gelen
 * `roles` değeri listeyi elemeye devam eder. Sayacın kaynağı bu yüzden çubuk
 * değil, `UserFilterValues`'ın kendisi: "aktif" olan şey kutunun görünürlüğü
 * değil, değerin varlığı.
 */
function aktifFiltreSayisi(filters: UserFilterValues): number {
  let sayi = 0
  if ((filters.query ?? '') !== '') sayi += 1
  if (filters.types.length > 0) sayi += 1
  if (filters.statuses.length > 0) sayi += 1
  if (filters.roles.length > 0) sayi += 1
  if (filters.verified !== undefined) sayi += 1
  return sayi
}

/**
 * Enum + etiket sözlüğü → `SelectOption[]`.
 *
 * Değerler `Object.values(Enum)` ile **türetiliyor**, elle yazılmıyor: elle
 * yazılmış bir liste enum'a yeni bir üye eklendiğinde sessizce eksik kalırdı
 * (`domain/categoryTree.ts` ile aynı gerekçe). Sıra enum'un bildirim sırası,
 * yani brifingin sırası. Tip argümanları açık veriliyor — `Record<T, string>`
 * çıkarımı sözlüğün anahtar literal'leri ile enum tipi arasında salınabiliyor.
 */
const secenekler = <T extends string>(sozluk: Record<T, string>, degerler: T[]): SelectOption[] =>
  degerler.map((deger) => ({ value: deger, label: sozluk[deger] }))

const USER_TYPE_DEGERLERI: UserType[] = Object.values(UserType)
const USER_STATUS_DEGERLERI: UserStatus[] = Object.values(UserStatus)
const ADMIN_ROLE_DEGERLERI: AdminRole[] = Object.values(AdminRole)

/*
  `FilterBar` değerleri `string[]` olarak geri veriyor, `UserFilterValues` ise
  `UserType[]`/`UserStatus[]`/`AdminRole[]` istiyor. Daraltma tip koruyucularla
  yapılıyor, `as` ile değil: elle yazılmış bir URL parametresinden gelen
  `types=uydurma` sessizce `UserType` sayılırsa etiket sözlüğü `undefined` döner
  ve hücre boş çıkar. Tanınmayan değer atılır. (`ListingFilterValues`'ın
  `string[]` → `SellerType[]` sapmasıyla aynı gerekçe.)
*/
const userTypeMi = (deger: string): deger is UserType =>
  (USER_TYPE_DEGERLERI as string[]).includes(deger)
const userStatusMi = (deger: string): deger is UserStatus =>
  (USER_STATUS_DEGERLERI as string[]).includes(deger)
const adminRoleMi = (deger: string): deger is AdminRole =>
  (ADMIN_ROLE_DEGERLERI as string[]).includes(deger)

const dizi = (deger: FilterValue): string[] => (Array.isArray(deger) ? deger : [])
const metin = (deger: FilterValue): string => (typeof deger === 'string' ? deger : '')

/**
 * Filtre alanları.
 *
 * **`roles` yetki kapılı.** Admin rolü `UserViewProfile`'ın gizli alanları
 * arasında; göremediği bir alana göre süzmek `destek`e o alanı **dolaylı**
 * okuturdu ("moderatör seç" → listede kalanlar moderatördür). Sütunu gizleyip
 * filtresini bırakmak, kapıyı kapatıp pencereyi açık unutmaktır.
 *
 * `verified` `select`, `boolean` değil: `FilterBar`'ın `boolean` alanı yalnız
 * `true`'yu filtre sayıyor (kapalı anahtar hiçbir şeyi elemez), oysa
 * `UserFilterValues.verified` üç hâl taşıyor — "doğrulanmış", "doğrulanmamış" ve
 * "fark etmez". Anahtar ortadaki hâli ifade edemezdi.
 */
function filtreTanimlari(kademe: GorunumKademesi): FilterDefinition[] {
  const tanimlar: FilterDefinition[] = [
    {
      id: 'query',
      label: 'Ara',
      type: 'text',
      placeholder: 'Ad, e-posta veya telefon',
    },
    {
      id: 'types',
      label: 'Kullanıcı tipi',
      type: 'multiSelect',
      options: secenekler<UserType>(USER_TYPE_LABEL, USER_TYPE_DEGERLERI),
      placeholder: 'Tümü',
    },
    {
      id: 'statuses',
      label: 'Hesap durumu',
      type: 'multiSelect',
      options: secenekler<UserStatus>(USER_STATUS_LABEL, USER_STATUS_DEGERLERI),
      placeholder: 'Tümü',
    },
  ]

  if (kademe === 'full') {
    tanimlar.push({
      id: 'roles',
      label: 'Admin rolü',
      type: 'multiSelect',
      options: secenekler<AdminRole>(ADMIN_ROLE_LABEL, ADMIN_ROLE_DEGERLERI),
      placeholder: 'Tümü',
    })
  }

  tanimlar.push({
    id: 'verified',
    label: 'Doğrulama',
    type: 'select',
    options: [
      { value: 'true', label: USER_VERIFICATION_LABEL.true },
      { value: 'false', label: USER_VERIFICATION_LABEL.false },
    ],
    placeholder: 'Fark etmez',
  })

  return tanimlar
}

/** `UserFilterValues` → `FilterBar`'ın beklediği sözlük. */
function filtreDegerleri(filters: UserFilterValues): Record<string, FilterValue> {
  return {
    query: filters.query ?? '',
    types: filters.types,
    statuses: filters.statuses,
    roles: filters.roles,
    verified: filters.verified === undefined ? '' : String(filters.verified),
  }
}

/**
 * `FilterBar`'ın `(id, value)` bildirimini `UserFilterValues`'a yazar.
 *
 * Her alanın **kendi dalı** var; `{ ...filters, [id]: value }` yazılmadı.
 * Sebebi AGENTS'ta ölçülü: hesaplanmış birleşim anahtarı TS denetimini sessizce
 * atlıyor — `{ [alan]: 'bu bir string' }` `Partial<UserFilterValues>`'a giderken
 * bile temiz derleniyor. Kopya + `delete` kalıbı (FilterBar'ın
 * `aralikGuncelle`'si) hem tip güvenli hem `exactOptionalPropertyTypes`
 * uyumlu: temizlenen alan `undefined` yapılmaz, **silinir**.
 */
function filtreYaz(filters: UserFilterValues, id: string, value: FilterValue): UserFilterValues {
  const sonraki: UserFilterValues = { ...filters }

  switch (id) {
    case 'query': {
      const deger = metin(value)
      if (deger === '') delete sonraki.query
      else sonraki.query = deger
      return sonraki
    }
    case 'types':
      sonraki.types = dizi(value).filter(userTypeMi)
      return sonraki
    case 'statuses':
      sonraki.statuses = dizi(value).filter(userStatusMi)
      return sonraki
    case 'roles':
      sonraki.roles = dizi(value).filter(adminRoleMi)
      return sonraki
    case 'verified': {
      const deger = metin(value)
      if (deger === 'true') sonraki.verified = true
      else if (deger === 'false') sonraki.verified = false
      else delete sonraki.verified
      return sonraki
    }
    default:
      /* Tanımlanmamış bir alan geldiyse (eski kaydedilmiş görünüm) yok sayılır. */
      return sonraki
  }
}

/* ── Sütunlar ────────────────────────────────────────────────────────────── */

/**
 * Dört hesap durumunun **dört ayrı tonu** — `UserSummaryCard.DURUM_TONU` ile
 * birebir aynı eşleme, çünkü aynı durum listede ve detayda aynı renkte
 * görünmeli.
 *
 * `StatusBadge` kullanılamıyor: sözleşmesi `ListingStatus` alıyor, `UserStatus`
 * değil (brifing 2.6 onu türetilen component sayıyor ama tipler örtüşmüyor —
 * raporlandı). `Badge` + `USER_STATUS_LABEL` aynı işi yapıyor ve durum yalnız
 * renkle değil **metinle** de söyleniyor.
 */
const DURUM_TONU = {
  [UserStatus.PendingVerification]: 'info',
  [UserStatus.Active]: 'success',
  [UserStatus.Suspended]: 'warning',
  [UserStatus.Banned]: 'danger',
} as const satisfies Record<UserStatus, 'info' | 'success' | 'warning' | 'danger'>

/**
 * Ekranın sütunu.
 *
 * `ColumnDef<UserAccount>`'u iki yönde daraltıyor:
 * - `header` `string` (`ReactNode` değil): mobil kartta `<dt>`'nin metni olacak.
 * - `cardSlot`: aynı sütun listesinin karta nasıl yerleşeceği. Tablo ile kartın
 *   **tek bir gate'ten** doğmasının yolu bu — iki ayrı liste yazılsaydı yetki
 *   kapısı iki yerde tekrar eder ve biri sessizce sapardı.
 */
interface KullaniciSutunu extends ColumnDef<UserAccount> {
  header: string
  cell: (row: UserAccount) => ReactNode
  cardSlot: 'identity' | 'field' | 'actions'
}

interface SutunSecenekleri {
  kademe: GorunumKademesi
  askiyaAlinabilir: boolean
  banlanabilir: boolean
  rolAtanabilir: boolean
  onUserOpen: (user: UserAccount) => void
  onSuspend: (user: UserAccount) => void
  onBanIste: (user: UserAccount) => void
  onRolIste: (user: UserAccount) => void
}

/**
 * Sütunları **yetkiye göre** kurar.
 *
 * Gizli sütun `disabled` verilmiyor, boş bırakılmıyor, soluklaştırılmıyor:
 * diziye **hiç konmuyor**. Kolonun `disabled` diye bir hâli yok ve olsaydı da
 * yanlış olurdu — reponun en eski kuralı "yetkisi yoksa hiç render etme".
 *
 * `UserViewProfile`'ın JSDoc'u görünür ve gizli alanları alan alan sayıyor;
 * aşağıdaki liste onun birebir karşılığı:
 *
 * | Sütun                | Gerekli izin                       |
 * | -------------------- | ---------------------------------- |
 * | Kullanıcı (ad, avatar, firma) | `UserView` veya `UserViewProfile` |
 * | Kullanıcı tipi       | `UserView` veya `UserViewProfile`  |
 * | İletişim             | `UserView` veya `UserViewProfile`  |
 * | Doğrulama            | `UserView` veya `UserViewProfile`  |
 * | Hesap durumu         | `UserView` veya `UserViewProfile`  |
 * | **Admin rolü**       | **yalnız `UserView`**              |
 * | İlan sayaçları       | `UserView` veya `UserViewProfile`  |
 * | Şikayet sayısı       | `UserView` veya `UserViewProfile`  |
 * | **Son giriş**        | **yalnız `UserView`**              |
 * | Kayıt tarihi         | `UserView` veya `UserViewProfile`  |
 * | Eylemler             | `UserSuspend` / `UserBan` / `UserAssignRole` (her buton ayrı) |
 *
 * Ayıran ilke **destek durumu açıklar, moderatör durumu belirler**: destek
 * "hesabınız askıda" diyebilmeli, oturum takibi ve admin rol dağılımı ise kararı
 * veren rolün işi.
 */
function sutunlariKur({
  kademe,
  askiyaAlinabilir,
  banlanabilir,
  rolAtanabilir,
  onUserOpen,
  onSuspend,
  onBanIste,
  onRolIste,
}: SutunSecenekleri): KullaniciSutunu[] {
  const tamGorunum = kademe === 'full'

  const sutunlar: KullaniciSutunu[] = [
    {
      id: 'user',
      header: 'Kullanıcı',
      cardSlot: 'identity',
      width: '18rem',
      cell: (row) => (
        <button type="button" className={css.userButton} onClick={() => onUserOpen(row)}>
          {/*
            Avatar erişilebilirlik ağacından **gizleniyor**. Base UI'ın
            `Avatar.Fallback`'i baş harfleri `aria-hidden`'sız düz bir `<span>`e
            yazıyor; butonun adı içeriğinden hesaplandığı için gizlenmezse
            "AD Ayşe Demir" diye başlar ve ekran okuyucu kullanıcısı her satırda
            önce iki anlamsız harf duyar. Avatar dekoratif (adı yanında yazılı),
            yani bilgi kaybı yok. `AvatarProps.status` kullanılmıyor — kullanılsa
            bu sarmalayıcı onun `aria-label`'ını da yutardı ve nokta dışarıda
            bırakılmalıydı. Ölçüm: `RowNameIsTheAccessibleName`.
          */}
          <span className={css.avatarSlot} aria-hidden="true">
            <Avatar
              name={row.fullName}
              size="sm"
              /*
                Koşullu spread: `AvatarProps.src` `string`, `string | undefined`
                değil — `exactOptionalPropertyTypes` açıkken doğrudan geçmek
                TS2375 verir. Fixture'ların hiçbirinde avatar yok.
              */
              {...(row.avatarUrl !== undefined && { src: row.avatarUrl })}
            />
          </span>
          <span className={css.identity}>
            <span className={css.userName}>{row.fullName}</span>
            {row.companyName !== undefined ? (
              <span className={css.userCompany}>{row.companyName}</span>
            ) : null}
          </span>
        </button>
      ),
    },
    {
      id: 'type',
      header: 'Kullanıcı tipi',
      cardSlot: 'field',
      cell: (row) => USER_TYPE_LABEL[row.type],
    },
    {
      id: 'contact',
      header: 'İletişim',
      cardSlot: 'field',
      cell: (row) => (
        <span className={css.contact}>
          <span>{row.email}</span>
          <span className={css.contactSecondary}>{row.phone}</span>
        </span>
      ),
    },
    {
      id: 'verified',
      header: 'Doğrulama',
      cardSlot: 'field',
      cell: (row) => (
        <Badge tone={row.verified ? 'success' : 'warning'} variant="outline" size="sm">
          {USER_VERIFICATION_LABEL[`${row.verified}`]}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Hesap durumu',
      cardSlot: 'field',
      /*
        Brifing 2.6 "aktif yaptırım"ı da gösterilecek veri sayıyor ve
        `UserViewProfile` yürürlükteki yaptırımın `endsAt`'ini `destek`e bile
        açıyor — ama `UserManagementPageProps` yalnız `AsyncState<Paginated<
        UserAccount>>` taşıyor ve `UserAccount` yaptırım kaydını bilmiyor.
        Durumun kendisi yaptırımın **olduğunu** söyler, "ne zamana kadar"ı
        söyleyemez. Uydurulmadı, raporlandı (bkz. component JSDoc'u).
      */
      cell: (row) => (
        <Badge tone={DURUM_TONU[row.status]} variant="soft" size="sm">
          {USER_STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
  ]

  /*
    ── Kapı 1: Admin rolü ──
    `UserViewProfile`'ın JSDoc'u `adminRole`'ü açıkça **gizli** sayıyor. Brifing
    2.6 sütunu istiyor ("Admin rolü; yalnızca admin kullanıcılarında") ama o
    cümle veri boyutunu anlatıyor, yetki boyutunu değil — iki kapı birden var:
    izin (`UserView`) ve kaydın kendisi (`adminRole !== undefined`).
  */
  if (tamGorunum) {
    sutunlar.push({
      id: 'adminRole',
      header: 'Admin rolü',
      cardSlot: 'field',
      cell: (row) =>
        row.adminRole !== undefined ? (
          <Badge tone="primary" variant="outline" size="sm">
            {ADMIN_ROLE_LABEL[row.adminRole]}
          </Badge>
        ) : (
          /* Yalnızca admin kullanıcılarında dolu; boş bırakmak "veri gelmedi" derdi. */
          <span className={css.missing}>Admin değil</span>
        ),
    })
  }

  sutunlar.push(
    {
      id: 'listings',
      header: 'İlan',
      cardSlot: 'field',
      align: 'end',
      cell: (row) => (
        <span className={css.numeric}>
          {row.listingCount.toLocaleString('tr-TR')} ilan ·{' '}
          {row.activeListingCount.toLocaleString('tr-TR')} yayında
        </span>
      ),
    },
    {
      id: 'reports',
      header: 'Şikayet',
      cardSlot: 'field',
      align: 'end',
      cell: (row) =>
        row.reportCount > 0 ? (
          <Badge tone="danger" variant="soft" size="sm" leadingIcon={<Flag size={12} />}>
            {row.reportCount.toLocaleString('tr-TR')} açık şikayet
          </Badge>
        ) : (
          <span className={css.missing}>Açık şikayet yok</span>
        ),
    },
  )

  /*
    ── Kapı 2: Son giriş ──
    `UserViewProfile`: "`lastLoginAt` (oturum takibi destek işi değil)". Kolon
    `destek`te diziye hiç konmuyor; `disabled` bir kolon diye bir şey yok ve
    olsaydı da metin DOM'da kalırdı. Ölçüm: `RoleRestricted`.
  */
  if (tamGorunum) {
    sutunlar.push({
      id: 'lastLogin',
      header: 'Son giriş',
      cardSlot: 'field',
      cell: (row) =>
        row.lastLoginAt !== undefined ? (
          <time dateTime={machineDateTime(row.lastLoginAt)}>{formatDateTime(row.lastLoginAt)}</time>
        ) : (
          /*
            Alanın yokluğu bir durum ve cümleyle söyleniyor: "veri gelmedi" ile
            "hiç giriş yapmadı" yaptırım kararında aynı şey değil
            (`pendingVerificationOffice` fixture'ı tam olarak bu hâl).
          */
          <span className={css.missing}>Hiç giriş yapmadı</span>
        ),
    })
  }

  sutunlar.push({
    id: 'createdAt',
    header: 'Kayıt tarihi',
    cardSlot: 'field',
    cell: (row) => (
      <time dateTime={machineDateTime(row.createdAt)}>{formatDate(row.createdAt)}</time>
    ),
  })

  /*
    ── Kapı 3: Eylemler ──
    Her buton kendi iznine bağlı; hiçbiri yoksa sütunun kendisi de yok. Yetkisi
    olmayan kullanıcıya `disabled` buton gösterilmiyor — göstermek "bunu
    yapabilirsin ama şu an değil" der, oysa doğru cümle "bu senin işin değil".
  */
  if (askiyaAlinabilir || banlanabilir || rolAtanabilir) {
    sutunlar.push({
      id: 'actions',
      header: 'Eylemler',
      cardSlot: 'actions',
      cell: (row) => (
        <span className={css.actions}>
          {/*
            İkinci kapı durumun kendisi: askıdaki hesabı tekrar askıya almak,
            banlı hesabı tekrar banlamak bir şey yapmaz. `domain/moderationActions.ts`
            ilan tarafında aynı ikiliyi (yetki + durum) kuruyor; `UserStatus` için
            böyle bir tablo yok — brifing 1.2 yalnız ilan durum makinesini
            tanımlıyor. Yaptırımı **kaldırma** kanalı sözleşmede olmadığı için
            askıdaki hesabın satırında hiç eylem kalmıyor (raporlandı).

            `aria-label`'lar satırı adlandırıyor: `DataTableProps.rowLabel` ve
            `CheckboxProps.hideLabel` sapmalarının çözdüğü sorunun aynısı —
            etiketsiz bırakılırsa ekran okuyucu kullanıcısı on satırda da "Banla"
            duyar ve hangi hesabı banladığını anlamaz. Görünür metin adın
            **başında** duruyor (WCAG 2.5.3 "Label in Name": erişilebilir ad,
            görünen etiketi birebir içermeli).
          */}
          {askiyaAlinabilir &&
          row.status !== UserStatus.Suspended &&
          row.status !== UserStatus.Banned ? (
            <Button
              variant="secondary"
              size="sm"
              aria-label={`Askıya al: ${row.fullName}`}
              onClick={() => onSuspend(row)}
            >
              Askıya al
            </Button>
          ) : null}

          {banlanabilir && row.status !== UserStatus.Banned ? (
            <Button
              variant="danger"
              size="sm"
              aria-label={`Banla: ${row.fullName}`}
              onClick={() => onBanIste(row)}
            >
              Banla
            </Button>
          ) : null}

          {rolAtanabilir ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Rol ata: ${row.fullName}`}
              onClick={() => onRolIste(row)}
            >
              Rol ata
            </Button>
          ) : null}
        </span>
      ),
    })
  }

  return sutunlar
}

/* ── Mobil kart ──────────────────────────────────────────────────────────── */

/**
 * Satırın kart hâli.
 *
 * Sütun listesini **yeniden kullanıyor**, kendi alan listesini kurmuyor: yetki
 * kapısı tek yerde (`sutunlariKur`) uygulanıyor ve iki düzen birebir aynı kümeyi
 * gösteriyor. Kart kendi listesini yazsaydı `destek`in mobil görünümü sessizce
 * sızdırabilirdi — ve bu tam olarak `UserSummaryCard`'ın bugün yaptığı şey
 * (`detailed` varyantı `adminRole` rozetini varyanttan bağımsız basıyor;
 * raporlandı, bu yüzden kart burada kullanılmadı).
 */
function KullaniciKarti({ row, sutunlar }: { row: UserAccount; sutunlar: KullaniciSutunu[] }) {
  const kimlik = sutunlar.find((s) => s.cardSlot === 'identity')
  const eylemler = sutunlar.find((s) => s.cardSlot === 'actions')
  const alanlar = sutunlar.filter((s) => s.cardSlot === 'field')

  return (
    <div className={css.card}>
      {kimlik !== undefined ? kimlik.cell(row) : null}

      <dl className={css.cardFacts}>
        {alanlar.map((sutun) => (
          <div key={sutun.id} className={css.cardFact}>
            <dt className={css.cardFactLabel}>{sutun.header}</dt>
            <dd className={css.cardFactValue}>{sutun.cell(row)}</dd>
          </div>
        ))}
      </dl>

      {eylemler !== undefined ? eylemler.cell(row) : null}
    </div>
  )
}

/* ── Ekran ───────────────────────────────────────────────────────────────── */

/**
 * Kullanıcı liste, filtre ve yaptırım ekranı (brifing 2.6).
 *
 * Veri **çekmez**: `state` prop'tan gelir. Kabuk **değildir**: `AppShell`,
 * `TopBar`, `SidebarNav` ve `PageHeader` render etmez — ekranın `<h1>`'i yok,
 * en üstteki başlık `<h2>`.
 *
 * ## Yetki: sütun sütun
 *
 * Ekranın asıl işi brifing 1.4'ün "Kullanıcı görüntüleme" × `destek` = "Sınırlı"
 * hücresini uygulamak. `availablePermissions` iki kademe tanır ve **sıra
 * kritiktir**: önce tam (`UserView`), sonra sınırlı (`UserViewProfile`) — bkz.
 * `gorunumKademesi`. `destek`te `Admin rolü` ve `Son giriş` sütunları diziye
 * **hiç konmaz**; `disabled` veya soluk gösterilmez, DOM'da bulunmazlar. Aynı
 * kapı filtre çubuğunda da var: göremediği alana göre süzmek, alanı dolaylı
 * okutur. Ölçüm: `RoleRestricted` (yokluk) + `Success` (kontrol grubu) — iddia
 * ancak ikisi birlikte anlam taşır.
 *
 * Eylemler ayrı ayrı kapılı: `user:suspend`, `user:ban`, `user:assignRole`
 * (yalnız `superAdmin`). Yetkisi olmayan kullanıcıya buton hiç render edilmez.
 *
 * ## `RoleRestricted` ≠ `unauthorized`
 *
 * İkisi farklı sorular. `unauthorized` **sunucunun** reddi (HTTP 403): veri hiç
 * gelmez, ekran boştur, tekrar denemek aynı 403'ü verir. `RoleRestricted`'ta
 * veri **gelir ve gösterilir** — yalnız `availablePermissions` dar olduğu için
 * sütunlar ve eylemler eksilir. Biri "bu senin görebileceğin bir şey değil"
 * der, öteki "bunun bir kısmı senin görebileceğin bir şey".
 *
 * ## Düzen
 *
 * Dolu liste iki kez çiziliyor (tablo + kart) ve seçimi CSS yapıyor:
 * `DataTable.mobileMode` medya sorgusu değil, düz bir prop. Her viewport'ta
 * yalnız biri erişilebilirlik ağacında — gerekçe ve maliyet `.css.ts`'te.
 *
 * @example
 * <UserManagementPage
 *   state={{ status: 'success', data: sayfa }}
 *   filters={filtreler}
 *   availablePermissions={ROLE_PERMISSIONS[oturum.role]}
 *   onFiltersChange={setFiltreler}
 *   onPageChange={setSayfa}
 *   onUserOpen={(user) => navigate(`/kullanicilar/${user.id}`)}
 *   onSuspend={askiyaAl}
 *   onBan={banla}
 *   onRoleChange={rolAta}
 *   onRetry={refetch}
 * />
 */
export function UserManagementPage({
  state,
  filters,
  availablePermissions,
  onFiltersChange,
  onPageChange,
  onUserOpen,
  onSuspend,
  onBan,
  onRoleChange,
  onRetry,
}: UserManagementPageProps) {
  /*
    Onay bekleyen kullanıcı; dialog'un açıklığı da bu state'ten türüyor. Ban
    geri döndürülemez, bu yüzden butona basmak doğrudan `onBan`'i çağırmıyor:
    önce onay.
  */
  const [banAdayi, setBanAdayi] = useState<UserAccount | undefined>(undefined)
  const [rolAdayi, setRolAdayi] = useState<UserAccount | undefined>(undefined)
  const [secilenRol, setSecilenRol] = useState<string | undefined>(undefined)

  const kademe = gorunumKademesi(availablePermissions)

  /*
    İzin listesi hiç kullanıcı görüntüleme içermiyorsa (`icerikDenetcisi`) ekran
    veriyi göstermez. Bu `unauthorized`'ın yerine geçmez — o sunucunun reddi;
    bu, istemcinin **kendi bildiği** yetkisizlik. Asıl kapı yönlendirme
    katmanında (`NavigationItem.requiredPermission`) ve o süzgeç henüz sayfa
    katmanında değil (AGENTS: "SidebarNav yetkiye göre süzmüyor" — bilerek).
    Buraya yanlışlıkla gelen kullanıcıya sınırlı görünümü göstermek, tam da bu
    ekranın ölçtüğü sızıntının kendisi olurdu.
  */
  if (kademe === 'none') {
    return (
      <section className={css.page}>
        <h2 className={css.title}>Kullanıcılar</h2>
        <ErrorState
          variant="page"
          title="Kullanıcı listesini görme yetkiniz yok"
          description="Bu sayfa kullanıcı görüntüleme izni gerektirir. Erişim gerekiyorsa yöneticinizden isteyin."
        />
      </section>
    )
  }

  if (state.status === 'unauthorized') {
    return (
      <section className={css.page}>
        <h2 className={css.title}>Kullanıcılar</h2>
        {/*
          Tekrar deneme butonu **yok** ve `onRetry` bağlanmıyor: `AsyncState`
          403'ün `retryable`'ını tip düzeyinde `false`'a sabitliyor — aynı istek
          aynı cevabı verir ve buton kullanıcıyı döngüye sokar. Güvenli geri
          dönüş `ErrorState`'in eylemi değil, sayfanın kendi bağlantısı.
        */}
        <ErrorState
          variant="page"
          title={state.error.title}
          description={state.error.message}
          {...(state.error.code !== undefined && { code: state.error.code })}
        />
        {/*
          Güvenli geri dönüş. `ErrorState`'in bir eylem slotu yok ve olması da
          gerekmiyor: yetkisizlikte yapılacak tek şey buradan çıkmak.
        */}
        <a className={css.backLink} href="/">
          Panel ana sayfasına dön
        </a>
      </section>
    )
  }

  const askiyaAlinabilir = availablePermissions.includes(AdminPermission.UserSuspend)
  const banlanabilir = availablePermissions.includes(AdminPermission.UserBan)
  const rolAtanabilir = availablePermissions.includes(AdminPermission.UserAssignRole)

  const sutunlar = sutunlariKur({
    kademe,
    askiyaAlinabilir,
    banlanabilir,
    rolAtanabilir,
    onUserOpen,
    onSuspend,
    onBanIste: (user) => setBanAdayi(user),
    onRolIste: (user) => {
      setSecilenRol(user.adminRole)
      setRolAdayi(user)
    },
  })

  const yukleniyor = state.status === 'idle' || state.status === 'loading'

  /*
    `partialSuccess` bu ekranda **beklenmiyor**: liste tek bir sorgu, dashboard
    gibi bağımsız parçaları yok. Ama `AsyncState`'in üyesi ve birleşim onu
    içeriyor; sessizce `empty`'ye düşürmek "hiç kullanıcı yok" yalanını söylerdi
    — oysa doğru cümle "listenin bir kısmı gelmedi". Gelen `items` gösteriliyor,
    eksiklik uyarıyla bildiriliyor.
  */
  const satirlar: UserAccount[] =
    state.status === 'success' || state.status === 'empty' || state.status === 'partialSuccess'
      ? (state.data?.items ?? [])
      : []

  /*
    Sayfalama yalnız `success`'te: `empty`'de sayfalanacak bir şey yok,
    `partialSuccess`'te `totalItems` gelmemiş olabilir ve olmayan bir toplamdan
    sayfa sayısı uydurmak kullanıcıyı var olmayan sayfalara götürürdü.
  */
  const sayfalama = state.status === 'success' ? state.data : undefined
  const bayat = state.status === 'success' && state.stale === true
  const hata = state.status === 'error' ? state.error : undefined

  const aktifSayi = aktifFiltreSayisi(filters)
  const filtreliBosluk = state.status === 'empty' && aktifSayi > 0

  const filtreleriTemizle = () => onFiltersChange(VARSAYILAN_FILTRELER)

  const bosDurum = filtreliBosluk ? (
    <EmptyState
      variant="filtered"
      title="Filtrelere uyan kullanıcı yok"
      description="Arama terimini kısaltmayı veya filtreleri gevşetmeyi deneyin."
      primaryAction={
        <Button variant="secondary" onClick={filtreleriTemizle}>
          Filtreleri temizle
        </Button>
      }
    />
  ) : (
    /*
      Düz boşluk: temizlenecek filtre YOK, bu yüzden eylem de yok. "Filtreleri
      temizle" butonu burada basınca hiçbir şeyin değişmediği bir buton olurdu.
    */
    <EmptyState
      variant="compact"
      title="Henüz kullanıcı yok"
      description="Platforma kayıt olan ilk kullanıcı bu listede görünecek."
    />
  )

  /*
    Ortak tablo props'ları: dolu listede iki görünüm de aynı veriyi ve aynı
    (yetkiye göre kurulmuş) sütunları kullanır.

    `onRetry` koşullu geçiliyor: `DataTableProps.onRetry`'nin JSDoc'u iki kapıyı
    şart koşuyor — `retryable: true` **ve** handler bağlı. Burada `onRetry`
    sözleşme gereği zorunlu bir prop, yani ikinci kapı her zaman açık; kapatan
    tek şey `UiError.retryable`. Tabloya yine de koşullu geçiliyor ki kararın
    sahibi görünür olsun (`ErrorHasNoRetryButton` ölçüyor).
  */
  const ortakTablo: Omit<
    DataTableProps<UserAccount>,
    'rows' | 'mobileMode' | 'renderMobileCard'
  > = {
    columns: sutunlar,
    density: 'comfortable',
    visualStyle: 'bordered',
    emptyState: bosDurum,
    loading: yukleniyor,
    ...(hata !== undefined && { error: hata }),
    ...(hata?.retryable === true && { onRetry }),
  }

  return (
    <section className={css.page}>
      <h2 className={css.title}>Kullanıcılar</h2>

      {bayat ? (
        /*
          Veri duruyor ama tazelenmedi. `info` tonu bilerek: `role="status"` ile
          kibarca bildirilir, moderatörün işini bölmez. Kapatılabilir değil —
          kapatılan bir uyarı sorunu çözmez, yalnız gizler.
        */
        <Alert
          tone="info"
          title="Liste güncel olmayabilir"
          description="Gösterilen kayıtlar önbellekten geliyor. Yenilendiğinde otomatik güncellenecek."
        />
      ) : null}

      {state.status === 'partialSuccess' ? (
        <Alert
          tone="warning"
          title="Kullanıcı listesi eksik geldi"
          description="Bazı alanlar yüklenemedi; görünen kayıtlar eksik olabilir ve sayfalama gösterilmiyor."
        />
      ) : null}

      <FilterBar
        definitions={filtreTanimlari(kademe)}
        values={filtreDegerleri(filters)}
        activeFilterCount={aktifSayi}
        /* Base UI/component handler'ları sarmalanır; çıplak geçirilmez. */
        onChange={(id, value) => onFiltersChange(filtreYaz(filters, id, value))}
        onClear={filtreleriTemizle}
      />

      {satirlar.length === 0 ? (
        /*
          Yükleme iskeleti, boş durum ve hata bloğu **tek** DataTable'dan
          geliyor: üçünün de kart hâli yok (iskelet iskelettir, boşluk
          boşluktur), dolayısıyla düzen ikizlemesine gerek yok ve play
          sorguları tek bir kopya görüyor.

          `loading`: başlık korunur, satırlar skeleton olur — veri gelince düzen
          zıplamaz. `error`: DataTable `ErrorState variant="section"` çiziyor
          (tablo düştü, filtre çubuğu ayakta) ve iki kapıyı kendi uyguluyor.
        */
        <DataTable<UserAccount> {...ortakTablo} rows={[]} mobileMode="scroll" />
      ) : (
        <>
          <div className={css.tableView} data-view="table">
            <DataTable<UserAccount> {...ortakTablo} rows={satirlar} mobileMode="scroll" />
          </div>
          <div className={css.cardView} data-view="cards">
            <DataTable<UserAccount>
              {...ortakTablo}
              rows={satirlar}
              mobileMode="cards"
              renderMobileCard={(row) => <KullaniciKarti row={row} sutunlar={sutunlar} />}
            />
          </div>
        </>
      )}

      {sayfalama !== undefined ? (
        <Pagination
          page={sayfalama.page}
          pageSize={sayfalama.pageSize}
          totalItems={sayfalama.totalItems}
          variant="numbered"
          onPageChange={(sayfa) => onPageChange(sayfa)}
        />
      ) : null}

      {/*
        Dialog'lar aday varken **mount ediliyor**: `title` erişilebilir addır ve
        zorunludur; kapalı hâlde aday olmadığı için yazacak bir ad da yok.
        Kapanış = unmount, yani portal ve Base UI'ın odak koruma span'leri
        (`data-base-ui-focus-guard`) beraber gidiyor.
      */}
      {banAdayi !== undefined ? (
        <ConfirmDialog
          open
          tone="danger"
          title={`${banAdayi.fullName} hesabını banla`}
          description="Hesap kalıcı olarak engellenir, kullanıcı giriş yapamaz ve ilanları yayından kalkar. Bu işlem bu ekrandan geri alınamaz."
          confirmLabel="Banla"
          onConfirm={() => {
            onBan(banAdayi)
            setBanAdayi(undefined)
          }}
          onCancel={() => setBanAdayi(undefined)}
        />
      ) : null}

      {rolAdayi !== undefined ? (
        /*
          `ConfirmDialog` kullanılamıyor: sözleşmesinde gövde slotu yok ve rol
          seçilmeden onaylanacak bir şey de yok. Modal + Select doğru araç.
        */
        <Modal
          open
          size="sm"
          title={`${rolAdayi.fullName} için admin rolü ata`}
          description="Rol, kullanıcının panelde görebileceği ve yapabileceği her şeyi belirler."
          onOpenChange={(acik) => {
            if (!acik) setRolAdayi(undefined)
          }}
          footer={
            <div className={css.actions}>
              <Button variant="secondary" onClick={() => setRolAdayi(undefined)}>
                Vazgeç
              </Button>
              <Button
                disabled={secilenRol === undefined || secilenRol === rolAdayi.adminRole}
                onClick={() => {
                  if (secilenRol !== undefined && adminRoleMi(secilenRol)) {
                    onRoleChange(rolAdayi, secilenRol)
                  }
                  setRolAdayi(undefined)
                }}
              >
                Rolü ata
              </Button>
            </div>
          }
        >
          <div className={css.roleDialogBody}>
            <Select
              label="Admin rolü"
              value={secilenRol}
              options={secenekler<AdminRole>(ADMIN_ROLE_LABEL, ADMIN_ROLE_DEGERLERI)}
              placeholder="Rol seçin"
              onValueChange={(deger) => setSecilenRol(deger)}
            />
          </div>
        </Modal>
      ) : null}
    </section>
  )
}
