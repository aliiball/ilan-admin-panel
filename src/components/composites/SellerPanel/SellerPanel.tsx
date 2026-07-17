import type { ReactNode } from 'react'
import { Ban, Flag, ShieldAlert, ShieldCheck } from 'lucide-react'
import {
  SellerVerificationStatus,
  UserStatus,
  UserType,
  type ISODateTime,
  type UserSanction,
} from '../../../types/domain'
import {
  SELLER_VERIFICATION_STATUS_LABEL,
  USER_SANCTION_TYPE_LABEL,
  USER_STATUS_LABEL,
  USER_TYPE_LABEL,
} from '../../../domain/labels'
import { formatDate, formatDateTime, machineDateTime } from '../../../utils/formatDateTime'
import { Avatar } from '../../primitives/Avatar'
import { Badge } from '../../primitives/Badge'
import type { SellerPanelProps } from '../../../types/component-props'
import * as css from './SellerPanel.css'

/**
 * Dört hesap durumunun **dört ayrı tonu** — aynı tonu iki duruma vermek, rozetin
 * metnini okumayan bir moderatöre "askıdaki" ile "banlı"yı aynı gösterirdi.
 *
 * `satisfies Record<UserStatus, ...>` bilerek: `UserStatus`'e beşinci bir değer
 * eklenirse bu tablo derlenmez ve yeni durum sessizce nötr renkte çıkmaz.
 */
const DURUM_TONU = {
  [UserStatus.PendingVerification]: 'info',
  [UserStatus.Active]: 'success',
  [UserStatus.Suspended]: 'warning',
  [UserStatus.Banned]: 'danger',
} as const satisfies Record<UserStatus, 'info' | 'success' | 'warning' | 'danger'>

/**
 * Hesap durumundan **yürürlükteki** yaptırımın tipine.
 *
 * `UserAccount` yaptırım kaydını taşımıyor ve `SellerPanelProps`'ta da
 * `UserSanction` kanalı yok; panelin elindeki tek bilgi durumun kendisi. Askıdaki
 * hesap tanım gereği bir `suspension`, banlı hesap bir `ban` yaptırımının
 * sonucudur — panelin dürüstçe söyleyebileceği kadarı bu. Gerekçe, başlangıç ve
 * bitiş `UserSanction`'da; sözleşmeye gelene kadar uydurulmuyor (bkz. component
 * JSDoc'undaki "yaptırım geçmişi" notu).
 */
const DURUM_YAPTIRIMI = {
  [UserStatus.PendingVerification]: null,
  [UserStatus.Active]: null,
  [UserStatus.Suspended]: 'suspension',
  [UserStatus.Banned]: 'ban',
} as const satisfies Record<UserStatus, UserSanction['type'] | null>

/** Yoğunluk arttıkça avatar büyür; `summary` ilan detayının yan kolonunda durur. */
const AVATAR_BOYUTU = {
  summary: 'md',
  detailed: 'lg',
  risk: 'lg',
} as const satisfies Record<NonNullable<SellerPanelProps['variant']>, 'md' | 'lg'>

/**
 * Kurumsal satıcı tipleri — brifing 1.1: emlak ofisi ve inşaat firmasında
 * doğrulama durumu admin ekranında **her zaman** gösterilir.
 *
 * `UserType` üzerinden, `SellerType` üzerinden değil: panel `UserAccount` alıyor
 * (bkz. prop JSDoc'u). İki enum aynı şeyi söylemiyor — `UserType`'ta `admin` var,
 * `SellerType`'ta yok.
 */
const KURUMSAL_TIPLER: readonly UserType[] = [
  UserType.RealEstateOffice,
  UserType.ConstructionCompany,
]

/**
 * Doğrulama etiketi — **geçici köprü, ikinci kez.**
 *
 * `domain/labels.ts`'te hesap doğrulaması için sözlük yok: `USER_TYPE_LABEL` ve
 * `USER_STATUS_LABEL` var, `UserAccount.verified`'ınki yazılmamış. `UserSummaryCard`
 * aynı köprüyü kurarken bu component'in de aynı iki kelimeye ihtiyaç duyacağını
 * yazmıştı — duydu. Metin yine tek kaynaktan, `SELLER_VERIFICATION_STATUS_LABEL`'dan
 * okunuyor; buraya gömseydik aynı etiket iki dosyada ayrı yaşar, birinde değişip
 * diğerinde eski kalırdı.
 *
 * Köprü olduğu açık: o sözlük dört değerli `SellerVerificationStatus` için yazıldı,
 * `UserAccount.verified` ise iki değerli bir bayrak. Borç artık iki çağıranlı —
 * `domain/labels.ts`'e `USER_VERIFICATION_LABEL` eklenmesi gerekiyor (raporlandı);
 * eklendiğinde bu iki fonksiyonun gövdesi ona döner, çağrı yerleri değişmez.
 */
function dogrulamaEtiketi(verified: boolean): string {
  return SELLER_VERIFICATION_STATUS_LABEL[
    verified ? SellerVerificationStatus.Verified : SellerVerificationStatus.Unverified
  ]
}

/**
 * Ad–değer çifti. `<dl>`/`<dt>`/`<dd>` semantik olarak tam da bu, ama üçü de
 * tarayıcı varsayılanı taşıyor — özellikle `<dd>`'nin 40 piksellik
 * `margin-inline-start`'ı. Sıfırlaması `.css.ts`'te.
 */
function Bilgi({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={css.fact}>
      <dt className={css.factLabel}>{label}</dt>
      <dd className={css.factValue}>{children}</dd>
    </div>
  )
}

/** Görünen metin biçimli, `datetime` ham ISO: makineye kaynağın kendisi gider. */
function Zaman({ value, saatli }: { value: ISODateTime; saatli: boolean }) {
  return (
    <time dateTime={machineDateTime(value)}>
      {saatli ? formatDateTime(value) : formatDate(value)}
    </time>
  )
}

/** `4` → `4 ilan`. Sayı `tr-TR` binlik ayırıcısıyla; `1.240 ilan`. */
function ilanMetni(count: number): string {
  return `${count.toLocaleString('tr-TR')} ilan`
}

/**
 * İlanın sahibi: kim olduğu, hesabının durumu ve —istenirse— risk sinyalleri.
 *
 * İlan detayının yanında (`summary`), kullanıcı detayında (`detailed`) ve şüpheli
 * bir ilan incelenirken (`risk`) aynı hesabın üç ayrı sorusu sorulur. Veri
 * çekmez; hesap `user`'dan, sayılar kendi proplarından, etiketler
 * `domain/labels.ts`'ten gelir.
 *
 * **Sayılar `user`'dan değil proplardan okunuyor — hem de yalnızca proplardan.**
 * Sözleşme aynı sayıyı iki yerde taşıyor: `user.listingCount`/`activeListingCount`/
 * `reportCount` ile `listingCount`/`openReportCount` propları. Kaynak **proplar**,
 * çünkü prop JSDoc'larının kendisi öyle diyor: prop'taki sayı bağlama göre
 * süzülmüş olabilir ("bu kategoride kaç ilan") ve `openReportCount` yalnız
 * **çözülmemiş** şikayetleri sayar, oysa `user.reportCount` bir toplamdır. İkisini
 * karıştırmak panelin kendi içinde yalan söylemesine yol açardı: süzülmüş
 * `listingCount: 2` ile hesabın `activeListingCount: 6`'sı yan yana yazıldığında
 * "2 ilan · 6 yayında" çıkar. Bu yüzden `user`'ın üç sayacı **hiç okunmuyor**:
 * hangi sorunun cevabı gösterildiğini çağıran bilir, panel saymaz. Bedeli,
 * "yayında kaç ilanı var" sorusunun bu panelde cevapsız kalması (sözleşmede o
 * prop yok, raporlandı) — yanlış cevaptan iyidir.
 *
 * **Risk bir hüküm değil sinyaldir.** `risk` varyantı puan hesaplamaz, eşik
 * uygulamaz, "şüpheli satıcı" demez: açık şikayet sayısını, doğrulama durumunu,
 * kayıt tarihini ve yürürlükteki yaptırımı yan yana koyar, hükmü moderatöre
 * bırakır. Panelin gövdesi de kırmızıya boyanmaz — yalnız gerçekten olumsuz olan
 * kayıtlar (yaptırım bandı, açık şikayet rozeti) renk taşır; hesabın tamamını
 * kırmızı bir kutuya koymak, üç ilanından birine şikayet gelmiş dürüst bir emlak
 * ofisini görsel olarak mahkûm ederdi. İlan sayısı bu yüzden `risk`'te de var:
 * paydasız bir "3 açık şikayet" iki ilanlı hesapta da altı ilanlıda da aynı
 * görünür.
 *
 * **Hesap yaşı hesaplanmıyor, kayıt tarihi yazılıyor.** Yaş "şimdi"ye dayanır;
 * "dün açılmış hesap" bugün "2 gün" olur ve aynı story her gün farklı çıkar
 * (AGENTS.md: göreli zaman determinizmi tek başına bozar). Sözleşmede `now`
 * prop'u yok, component de saati kendi okumamalı — bu yüzden mutlak tarih
 * gösteriliyor: `12 Mar 2024` ile `15 Tem 2026` arasındaki farkı moderatör
 * görür, panel uydurmaz.
 *
 * **Durum yalnız renkle ifade edilmez** (brifingin kabul kriteri): rozet her
 * zaman `USER_STATUS_LABEL`'ın metnini yazar, dört durumun dört ayrı tonu vardır,
 * doğrulama rozeti ayrıca ikon taşır ve yaptırım bandı cümle kurar.
 *
 * **Doğrulama rozeti `summary`'de yalnız gerektiğinde çıkar:** kurumsal satıcıda
 * her zaman (brifing 1.1 şart koşuyor), bireysel satıcıda yalnız
 * `verified === false` iken. Her ilanın yanında yanan "Doğrulanmış" gürültüdür ve
 * asıl sinyali bastırır; `detailed`/`risk`'te iki hâl de yazılır, çünkü orada
 * rozetin yokluğu "doğrulanmamış" mı "alan gelmedi" mi belirsiz kalırdı.
 *
 * **Panel bir `region`, başlık değil.** Ad `<h3>` yazılmıyor: aynı panel ilan
 * detayında bir `<h2>`'nin altında, kullanıcı detayında başka bir derinlikte
 * duruyor ve seviyeyi tahmin eden component yanlış tahmin eder (sözleşmede
 * `headingLevel` yok). Bunun yerine `<section aria-label="İlan sahibi">`: ekran
 * okuyucu kullanıcısı bölgeye landmark listesinden gider, başlık hiyerarşisi
 * bozulmaz.
 *
 * **Avatar erişilebilirlik ağacından gizleniyor:** Base UI'ın `Avatar.Fallback`'i
 * baş harfleri `aria-hidden`'sız bir `<span>`e yazıyor ve avatar zaten dekoratif
 * (adı yanında yazıyor); gizlenmezse bölgenin içeriği "AD Ayşe Demir…" diye
 * başlar.
 *
 * **`loading`/`empty`/`error` varyantı yok ve olmamalı:** panel tek bir hesabı
 * gösterir, onu getiren istek sayfanındır. Bekleyen istek `Skeleton`, gelmeyen
 * kayıt `EmptyState`, başarısız istek `ErrorState` ile karşılanır — panel veri
 * çekmediği için kendi hata durumunu da uyduramaz.
 *
 * **Yetki panelin işi değil:** `actions` dışarıdan gelir, panel eylem uydurmaz.
 * Kullanıcının yapamayacağı eylem `disabled` verilmez, `actions`'a **hiç
 * konmaz** — "Askıya al" butonunu kapalı göstermek destek personeline sahip
 * olmadığı bir yetkiyi merak ettirir.
 *
 * @example
 * <SellerPanel
 *   user={satici}
 *   listingCount={saticininIlanlari.length}
 *   openReportCount={acikSikayetler.length}
 *   variant="risk"
 *   actions={yetkiler.canSuspend ? <Button size="sm">Askıya al</Button> : undefined}
 * />
 */
export function SellerPanel({
  user,
  listingCount,
  openReportCount,
  variant = 'summary',
  actions,
}: SellerPanelProps) {
  const yaptirim = DURUM_YAPTIRIMI[user.status]
  const kurumsal = KURUMSAL_TIPLER.includes(user.type)
  const dogrulamaRozeti = variant !== 'summary' || kurumsal || !user.verified

  return (
    <section className={css.root({ variant })} aria-label="İlan sahibi">
      <div className={css.head({ withActions: actions !== undefined })}>
        {/*
          Avatar erişilebilirlik ağacından gizleniyor: Base UI'ın `Avatar.Fallback`'i
          baş harfleri sıradan bir `<span>`e yazıyor ve ona `aria-hidden` koymuyor
          (ölçüldü, `UserSummaryCard`'da da aynı sonuç). Avatar dekoratif — adı
          hemen yanında — yani gizlemekle bilgi kaybı yok.
        */}
        <span className={css.avatarSlot} aria-hidden="true">
          <Avatar
            name={user.fullName}
            size={AVATAR_BOYUTU[variant]}
            /*
              Koşullu spread: `AvatarProps.src` `string`, `string | undefined`
              değil; `exactOptionalPropertyTypes` açıkken `src={user.avatarUrl}`
              TS2375 verir. Fixture'ların hiçbirinde avatar yok — yokluk bir
              durum, Avatar baş harflere düşer.
            */
            {...(user.avatarUrl !== undefined && { src: user.avatarUrl })}
          />
        </span>

        <div className={css.body}>
          <div className={css.identity}>
            <span className={css.name}>{user.fullName}</span>
            <span className={css.subtitle}>
              {USER_TYPE_LABEL[user.type]}
              {user.companyName !== undefined ? ` · ${user.companyName}` : null}
            </span>
          </div>

          <div className={css.badges}>
            <Badge tone={DURUM_TONU[user.status]} variant="soft" size="sm">
              {USER_STATUS_LABEL[user.status]}
            </Badge>

            {dogrulamaRozeti ? (
              <Badge
                tone={user.verified ? 'success' : 'warning'}
                variant="outline"
                size="sm"
                leadingIcon={user.verified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
              >
                {dogrulamaEtiketi(user.verified)}
              </Badge>
            ) : null}
          </div>
        </div>

        {actions !== undefined ? <div className={css.actionsSlot}>{actions}</div> : null}
      </div>

      {variant === 'detailed' ? (
        <dl className={css.facts}>
          <Bilgi label="E-posta">{user.email}</Bilgi>
          <Bilgi label="Telefon">{user.phone}</Bilgi>
          <Bilgi label="İlan">{ilanMetni(listingCount)}</Bilgi>
          <Bilgi label="Kayıt">
            <Zaman value={user.createdAt} saatli={false} />
          </Bilgi>
          <Bilgi label="Son giriş">
            {user.lastLoginAt !== undefined ? (
              <Zaman value={user.lastLoginAt} saatli />
            ) : (
              <span className={css.missing}>Hiç giriş yapmadı</span>
            )}
          </Bilgi>
        </dl>
      ) : null}

      {variant === 'risk' ? (
        <>
          {yaptirim !== null ? (
            <p className={css.sanction}>
              <Ban size={16} aria-hidden="true" />
              Yürürlükte olan yaptırım: {USER_SANCTION_TYPE_LABEL[yaptirim]}
            </p>
          ) : null}

          <dl className={css.facts}>
            <Bilgi label="Açık şikayet">
              {openReportCount > 0 ? (
                <Badge tone="danger" variant="soft" size="sm" leadingIcon={<Flag size={12} />}>
                  {openReportCount.toLocaleString('tr-TR')} açık şikayet
                </Badge>
              ) : (
                /*
                  Sinyalin yokluğu da bir sinyal ve cümleyle söyleniyor: boş
                  bırakılsaydı "şikayet yok" ile "sayı gelmedi" aynı görünürdü —
                  risk incelemesinde bu ikisi aynı şey değil.
                */
                <span className={css.clean}>Açık şikayet yok</span>
              )}
            </Bilgi>

            {/*
              Payda: "3 açık şikayet" iki ilanlı hesapta başka, altı ilanlıda
              başka bir şey söyler. Sayı proptan gelir — `user.listingCount`
              bağlamı bilmez (bkz. component JSDoc'u).
            */}
            <Bilgi label="İlan">{ilanMetni(listingCount)}</Bilgi>

            {/*
              Hesap yaşı DEĞİL, kayıt tarihi. Yaş "şimdi"ye dayanır ve aynı story
              her gün farklı çıkar; sözleşmede `now` prop'u yok, component saati
              kendi okumaz (AGENTS.md).
            */}
            <Bilgi label="Kayıt">
              <Zaman value={user.createdAt} saatli={false} />
            </Bilgi>

            <Bilgi label="Son giriş">
              {user.lastLoginAt !== undefined ? (
                <Zaman value={user.lastLoginAt} saatli />
              ) : (
                <span className={css.missing}>Hiç giriş yapmadı</span>
              )}
            </Bilgi>
          </dl>

          {/*
            Doğrulama burada TEKRAR yazılmıyor: rozet yukarıda ve `risk`'te iki
            hâli de gösteriliyor. "Doğrulama: Doğrulanmış" satırı aynı kelimeyi
            yirmi piksel altında ikinci kez söyler, asıl bulguları aşağı iterdi.
          */}
        </>
      ) : null}
    </section>
  )
}
