import { useId, type ReactNode } from 'react'
import { Ban, Flag, ShieldAlert, ShieldCheck } from 'lucide-react'
import { UserStatus, UserType, type ISODateTime, type UserSanction } from '../../../types/domain'
import {
  USER_SANCTION_TYPE_LABEL,
  USER_STATUS_LABEL,
  USER_TYPE_LABEL,
  USER_VERIFICATION_LABEL,
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
 * Askıdaki hesap tanım gereği bir `suspension`, banlı hesap bir `ban`
 * yaptırımının sonucudur. Kaynağı `user.status`, yani sunucunun hükmü.
 *
 * `sanctions` prop'u Faz 3'te gelince bu tablo **kalktı sanılmasın**: sicil
 * kayıtları "şu an hangisi yürürlükte" sorusunu cevaplayamaz, çünkü cevap
 * `endsAt`'i "şimdi" ile karşılaştırmayı gerektirir ve panelde "şimdi" yok
 * (sözleşmede `now` prop'u yok, component saati kendi okumamalı). İkisi ayrı
 * soruya bakıyor ve ikisi de gerekli: bant **durumu** söyler (`status`'ten,
 * `sanctions` verilmese de çalışır), liste **sicili** — gerekçeleriyle ve
 * kaldırılmışlarıyla.
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
 * Doğrulama etiketi.
 *
 * İki çağıranlı köprü kapandı: `USER_VERIFICATION_LABEL` eklendi ve söz
 * verildiği gibi yalnız bu fonksiyonun **gövdesi** değişti — `UserSummaryCard`
 * ile ikisi artık aynı iki kelimeyi aynı sözlükten okuyor.
 */
function dogrulamaEtiketi(verified: boolean): string {
  return USER_VERIFICATION_LABEL[`${verified}`]
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

/** `4` → `4 yayında`. Sözleşmenin kelimesi: prop "**yayında** olan ilan sayısı". */
function yayindaMetni(count: number): string {
  return `${count.toLocaleString('tr-TR')} yayında`
}

/**
 * Toplam ilan sayısı ve —verilmişse— yayındakiler: `6 ilan · 4 yayında`.
 *
 * `activeListingCount` yoksa yalnız toplam yazılır; panel `user.activeListingCount`'a
 * **düşmez** (bkz. component JSDoc'u). Yokluk bir durum: sayfa o sayıyı vermediyse
 * panel onu uydurmaz.
 */
function IlanSayilari({ toplam, yayinda }: { toplam: number; yayinda: number | undefined }) {
  return (
    <span className={css.countLine}>
      <span>{ilanMetni(toplam)}</span>
      {yayinda !== undefined ? (
        <>
          <span className={css.countSeparator} aria-hidden="true">
            ·
          </span>
          <span className={css.countActive}>{yayindaMetni(yayinda)}</span>
        </>
      ) : null}
    </span>
  )
}

/**
 * Tek bir yaptırım kaydı: tipi, gerekçesi, tarihleri.
 *
 * **"Yürürlükte" demiyor, diyemez.** Bir kaydın şu an geçerli olup olmadığı
 * `endsAt`'i "şimdi" ile karşılaştırmayı gerektirir; sözleşmede `now` prop'u yok
 * ve component saati kendi okumamalı (AGENTS.md: göreli zaman determinizmi tek
 * başına bozar). Bu yüzden yalnız `revokedAt` işaretleniyor — o, "şimdi"den
 * bağımsız bir olgu: kaydın kaldırıldığı yazıyor. Süresi dolmuş ama
 * kaldırılmamış bir askı "kaldırıldı" değildir ve panel ikisini karıştırmaz.
 * Yürürlükteki yaptırımın **tipini** yukarıdaki bant `user.status`'ten söylüyor —
 * o sunucunun hükmü, panelin tarih aritmetiği değil.
 */
function YaptirimKaydi({ sanction }: { sanction: UserSanction }) {
  const kaldirildi = sanction.revokedAt !== undefined

  return (
    <li className={css.sanctionItem({ revoked: kaldirildi })}>
      <div className={css.sanctionItemBadges}>
        {/*
          Kaldırılmış kayıt tipinin rengini bırakıyor: affedilmiş bir askı sicilde
          durur ama moderatörün gözünü çekmesi gereken şey değil. Renk kaybı bilgi
          kaybı değil — "Kaldırıldı" rozeti bunu metinle söylüyor.
        */}
        <Badge
          tone={kaldirildi ? 'neutral' : sanction.type === 'ban' ? 'danger' : 'warning'}
          variant="soft"
          size="sm"
        >
          {USER_SANCTION_TYPE_LABEL[sanction.type]}
        </Badge>

        {kaldirildi ? (
          <Badge tone="neutral" variant="outline" size="sm">
            Kaldırıldı
          </Badge>
        ) : null}
      </div>

      {/*
        İç gerekçe metni. Bu panel `destek` rolüne gösterilmemeli — kararı `risk`
        varyantını seçen sayfa katmanı verir (bkz. prop JSDoc'u ve
        `AdminPermission.UserViewProfile`). Panel yetki bilmez.
      */}
      <p className={css.sanctionReason}>{sanction.reason}</p>

      <p className={css.sanctionDates}>
        <Zaman value={sanction.startsAt} saatli={false} />
        {' – '}
        {sanction.endsAt !== undefined ? (
          <Zaman value={sanction.endsAt} saatli={false} />
        ) : (
          /* Bitiş tarihinin yokluğu bir durum: ban süresizdir (fixtures/users.ts). */
          'Süresiz'
        )}
        {sanction.revokedAt !== undefined ? (
          <>
            {' · Kaldırıldı: '}
            <Zaman value={sanction.revokedAt} saatli={false} />
          </>
        ) : null}
      </p>
    </li>
  )
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
 * `reportCount` ile `listingCount`/`activeListingCount`/`openReportCount` propları.
 * Kaynak **proplar**, çünkü prop JSDoc'larının kendisi öyle diyor: prop'taki sayı
 * bağlama göre süzülmüş olabilir ("bu kategoride kaç ilan") ve `openReportCount`
 * yalnız **çözülmemiş** şikayetleri sayar, oysa `user.reportCount` bir toplamdır.
 * İkisini karıştırmak panelin kendi içinde yalan söylemesine yol açardı: süzülmüş
 * `listingCount: 2` ile hesabın `user.activeListingCount: 6`'sı yan yana
 * yazıldığında "2 ilan · 6 yayında" çıkar — okunamaz bir cümle. Bu yüzden `user`'ın
 * üç sayacı **hiç okunmuyor**: hangi sorunun cevabı gösterildiğini çağıran bilir,
 * panel saymaz.
 *
 * Faz 3'te `activeListingCount` prop'u eklendi ve "yayında kaç ilanı var" (brifing
 * 2.6) artık cevaplanıyor — ama **yalnız verilirse**: yokluğu bir durumdur, panel
 * o sayıyı hesabın süzülmemiş sayacından tamamlamaz. Verilmezse yalnız toplam
 * yazılır; eksik cevap yanlış cevaptan iyidir.
 *
 * **Yaptırım geçmişi yalnız `risk`'te.** `sanctions` verilirse sicil — yürürlükteki
 * **ve** kaldırılmış kayıtlar — verildiği sırada listelenir; `revokedAt` dolu olan
 * "Kaldırıldı" diye işaretlenir ama listeden **düşürülmez**: bir kez askıya alınıp
 * affedilmiş hesap ile hiç yaptırım görmemiş hesap aynı şey değildir. `summary` ve
 * `detailed` sicili hiç göstermez — onlar hesabın kendisini anlatır. Boş dizi ile
 * verilmemiş olmak da aynı şey değil: `[]` "kayıt yok" diye yazılır (sinyalin
 * yokluğu da sinyaldir, `openReportCount: 0` ile aynı ilke), `undefined` ise hiç
 * konuşulmaz — sayfa o veriyi getirmemiştir.
 *
 * **Risk bir hüküm değil sinyaldir.** `risk` varyantı puan hesaplamaz, eşik
 * uygulamaz, "şüpheli satıcı" demez: açık şikayet sayısını, doğrulama durumunu,
 * kayıt tarihini, yürürlükteki yaptırımı ve sicili yan yana koyar, hükmü moderatöre
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
 *   activeListingCount={saticininIlanlari.filter(yayinda).length}
 *   openReportCount={acikSikayetler.length}
 *   sanctions={saticininYaptirimlari}
 *   variant="risk"
 *   actions={yetkiler.canSuspend ? <Button size="sm">Askıya al</Button> : undefined}
 * />
 */
export function SellerPanel({
  user,
  listingCount,
  activeListingCount,
  openReportCount,
  sanctions,
  variant = 'summary',
  actions,
}: SellerPanelProps) {
  const yaptirim = DURUM_YAPTIRIMI[user.status]
  const kurumsal = KURUMSAL_TIPLER.includes(user.type)
  const dogrulamaRozeti = variant !== 'summary' || kurumsal || !user.verified
  /*
    Listenin adı görünür etiketten geliyor (`aria-labelledby`). `useId`: aynı
    panel bir story'de iki kez çizilebilir (VariantsComparison) ve sabit bir id
    orada sessizce çakışırdı — ekranda her şey doğru görünür, yalnız ekran
    okuyucu yanlış etikete bakardı (AGENTS.md, SidebarNav'ın ölçtüğü tuzak).
  */
  const sicilBaslikId = useId()

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
          <Bilgi label="İlan">
            <IlanSayilari toplam={listingCount} yayinda={activeListingCount} />
          </Bilgi>
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
            <Bilgi label="İlan">
              <IlanSayilari toplam={listingCount} yayinda={activeListingCount} />
            </Bilgi>

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

          {/*
            Sicil yalnız `risk`'te ve yalnız verilirse. `undefined` ile `[]` ayrı
            durumlar: sayfa veriyi getirmediyse panel susar, "kayıt yok" demez —
            o cümle bir iddiadır ve panelin elinde onu söyleyecek bilgi yoktur.
          */}
          {sanctions !== undefined ? (
            <div className={css.sanctionsGroup}>
              <span className={css.sanctionsLabel} id={sicilBaslikId}>
                Yaptırım geçmişi
              </span>

              {sanctions.length > 0 ? (
                /*
                  `aria-labelledby` yeni bir landmark üretmiyor: `<ol>`'un rolü
                  `list`, landmark değil. Panelin tek landmark'ı
                  `<section aria-label="İlan sahibi">` ve öyle kalmalı — ikincisi
                  `landmark-unique`'i kendi ürettiğimiz gürültüyle doldururdu
                  (AGENTS.md).
                */
                <ol className={css.sanctionList} aria-labelledby={sicilBaslikId}>
                  {/*
                    Sıra bozulmuyor: sözleşme "verildiği sırada render edilir"
                    diyor. Panel sıralamıyor — hangi sıranın doğru olduğunu
                    (en yeni önce mi, kronolojik mi) çağıran bilir.
                  */}
                  {sanctions.map((sanction) => (
                    <YaptirimKaydi key={sanction.id} sanction={sanction} />
                  ))}
                </ol>
              ) : (
                /*
                  Boş dizi bir cevaptır: "veri geldi, kayıt yok". Liste boş
                  bırakılsaydı "sicili temiz" ile "sicil gelmedi" aynı görünürdü —
                  risk incelemesinde bu ikisi aynı şey değil (`openReportCount: 0`
                  ile aynı ilke).
                */
                <span className={css.clean}>Yaptırım kaydı yok</span>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
