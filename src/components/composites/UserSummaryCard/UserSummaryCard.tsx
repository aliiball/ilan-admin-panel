import type { ReactNode } from 'react'
import { Ban, Flag, ShieldAlert, ShieldCheck } from 'lucide-react'
import { UserStatus, type ISODateTime, type UserSanction } from '../../../types/domain'
import {
  ADMIN_ROLE_LABEL,
  USER_SANCTION_TYPE_LABEL,
  USER_STATUS_LABEL,
  USER_TYPE_LABEL,
  USER_VERIFICATION_LABEL,
} from '../../../domain/labels'
import { formatDate, formatDateTime, machineDateTime } from '../../../utils/formatDateTime'
import { Avatar } from '../../primitives/Avatar'
import { Badge } from '../../primitives/Badge'
import type { UserSummaryCardProps } from '../../../types/component-props'
import * as css from './UserSummaryCard.css'

/**
 * Dört hesap durumunun **dört ayrı tonu**. Aynı tonu iki duruma vermek, rozetin
 * metnini okumayan bir moderatöre "askıdaki" ile "banlı"yı aynı gösterirdi;
 * `listingByStatus` sapmasında (bkz. AGENTS.md) tam olarak bu yaşandı.
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
 * `UserAccount` yaptırım kaydını taşımıyor; taşıdığı tek şey durumun kendisi.
 * Askıdaki hesap tanım gereği bir `suspension`, banlı hesap bir `ban`
 * yaptırımının sonucudur — kartın söyleyebileceği kadarı bu. Gerekçe, başlangıç
 * ve bitiş `UserSanction`'da ve karta gelmiyor (bkz. component JSDoc'u).
 */
const DURUM_YAPTIRIMI = {
  [UserStatus.PendingVerification]: null,
  [UserStatus.Active]: null,
  [UserStatus.Suspended]: 'suspension',
  [UserStatus.Banned]: 'ban',
} as const satisfies Record<UserStatus, UserSanction['type'] | null>

/** Yoğunluk arttıkça avatar büyür; `compact` liste satırında durur. */
const AVATAR_BOYUTU = {
  compact: 'md',
  detailed: 'lg',
  security: 'lg',
} as const satisfies Record<NonNullable<UserSummaryCardProps['variant']>, 'md' | 'lg'>

/**
 * Doğrulama etiketi.
 *
 * Köprü kaldırıldı: `USER_VERIFICATION_LABEL` eklenene kadar bu fonksiyon
 * `SELLER_VERIFICATION_STATUS_LABEL`'ın dört değerli enum'undan okuyordu —
 * `UserAccount.verified` iki değerli bir bayrak olduğu için yanlışlık ekranda
 * değil tipte görünüyordu. Söz verildiği gibi yalnız **gövde** değişti.
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

/**
 * Kullanıcı hesabının özeti: liste satırında, kullanıcı detayının başında ve
 * yaptırım kararı verilirken bakılan yüz.
 *
 * Veri çekmez — hesap `user` prop'undan gelir; etiketler `domain/labels.ts`'ten.
 *
 * **Üç varyant üç ayrı soruyu cevaplar**, aynı kartın büyüyüp küçülmüş hâli
 * değildir. `compact` "bu kim?" (liste satırı), `detailed` "bu hesap nedir?"
 * (iletişim, ilan sayıları, kayıt), `security` "bu hesaba yaptırım uygulanmalı
 * mı?" (son giriş, doğrulama, açık şikayet, yürürlükteki yaptırım). Bir kararı
 * verirken bakılmayan alan, o varyantta gürültüdür.
 *
 * **Durum yalnız renkle ifade edilmez** (brifingin kabul kriteri): rozet her
 * zaman `USER_STATUS_LABEL`'ın metnini yazar ve dört durumun dört ayrı tonu
 * vardır. Doğrulama rozeti ayrıca ikon taşır — üç kanal birden.
 *
 * **Doğrulama rozeti `compact`'te yalnız `verified === false` iken çıkar.** Her
 * satırda yanan "Doğrulanmış" yoğun bir listede gürültüdür ve asıl sinyali
 * ("Doğrulanmamış") bastırır; `detailed`/`security`'de ise iki hâl de yazılır,
 * çünkü orada rozetin yokluğu "doğrulanmamış" mı "alan gelmedi" mi belirsiz
 * kalırdı. `pendingVerification` durumundaki hesapta bilgi iki kez görünür
 * (durum rozeti de "Doğrulama Bekliyor" der) — bu tekrar kasıtlı: `banned` +
 * `verified: false` gibi durum rozetinin doğrulamayı söylemediği hesaplar var
 * (`bannedIndividual` fixture'ı), yani iki alan bağımsız.
 *
 * **Avatar'ın durum noktası kullanılmıyor.** `AvatarProps.status`
 * `online`/`offline`/`busy` — anlık *varlık*, hesap *durumu* değil. Askıdaki bir
 * kullanıcı da çevrimiçi olabilir; ikisini aynı noktaya bindirmek, admin'e
 * "çevrimdışı" ile "banlı"yı karıştırtırdı.
 *
 * **Avatar erişilebilirlik ağacından gizleniyor.** Base UI'ın `Avatar.Fallback`'i
 * baş harfleri `aria-hidden`'sız bir `<span>`e yazıyor; kart tıklanabilirken
 * buton adını içeriğinden hesapladığı için ad "AD Ayşe Demir …" diye başlardı.
 * Regresyon testi: `CardAccessibleNameStartsWithTheName`.
 *
 * **Tıklanabilir bölge `<button>`'dır ama kartın tamamını sarmaz.** `<div onClick>`
 * klavyeyle erişilemez ve ekran okuyucuya tıklanabilir olduğunu söylemez; buna
 * karşılık `actions` da etkileşimli ve iç içe buton geçersiz HTML olup klavye
 * sırasını bozar. Bu yüzden `actions` butonun **kardeşidir**, çocuğu değil —
 * sözleşmenin "actions içindeki butonlara tıklamak onClick'i tetiklemez"
 * garantisi `stopPropagation` ile değil, DOM yapısıyla sağlanıyor: olay zaten
 * kartın butonundan geçmiyor. `onClick` yoksa bölge sıradan bir `<div>`: imleç
 * değişmez, hover'da kart kalkmaz, klavye sırasında yer tutmaz.
 *
 * **Yaptırımın gerekçesi ve süresi bu kartta yok**, çünkü `UserAccount`'ta yok:
 * kart yürürlükte bir yaptırım *olduğunu* söyler (`security` varyantı), "neden"i
 * ve "ne zamana kadar"ı `UserSanction` taşır ve sözleşmede karta gelmiyor.
 * Uydurulmuş bir "14 gün" yazmaktansa susmak doğru — sayfa bu bilgiyi kendi
 * yaptırım geçmişi bölümünde gösterir.
 *
 * **Yetki kartın işi değil:** `actions` dışarıdan gelir, kart eylem uydurmaz.
 * Kullanıcının yapamayacağı eylem `disabled` verilmez, `actions`'a hiç konmaz.
 * Kademeli düzenleme yetkisi (`UserEdit` → `UserEditProfile` → `UserEditContact`)
 * kapsayıcı olduğu için çağıran **önce tamını** sınamalı.
 *
 * `loading`/`error` varyantı yoktur ve olmamalı: kart tek bir hesabı gösterir,
 * onu getiren istek sayfanındır. Bekleyen liste `Skeleton`, boş liste
 * `EmptyState`, başarısız istek `ErrorState` ile karşılanır.
 *
 * @example
 * <UserSummaryCard
 *   user={user}
 *   variant="security"
 *   actions={yetkiler.canSuspend ? <Button size="sm">Askıya al</Button> : undefined}
 *   onClick={(secilen) => navigate(`/kullanicilar/${secilen.id}`)}
 * />
 */
export function UserSummaryCard({
  user,
  variant = 'compact',
  actions,
  onClick,
}: UserSummaryCardProps) {
  const tiklanabilir = onClick !== undefined
  const yaptirim = DURUM_YAPTIRIMI[user.status]
  const dogrulamaRozeti = variant !== 'compact' || !user.verified

  const icerik = (
    <>
      {/*
        Avatar erişilebilirlik ağacından **gizleniyor**. Base UI'ın
        `Avatar.Fallback`'i baş harfleri sıradan bir `<span>`e yazıyor ve ona
        `aria-hidden` koymuyor (ölçüldü: `@base-ui/react/avatar/fallback`'te tek
        bir aria attribute'u yok). Kart tıklanabilirken buton adını içeriğinden
        hesaplıyor, dolayısıyla gizlenmezse ad "AD Ayşe Demir Bireysel Aktif"
        diye başlıyor — ekran okuyucu kullanıcısına önce anlamsız iki harf
        okunuyor. Avatar zaten dekoratif (kendi JSDoc'u da öyle diyor: adı
        yanında yazıyor), yani gizlemekle bilgi kaybı yok.

        `AvatarProps.status` kullanılsaydı bu gizleme onun `aria-label`'ını da
        yutardı; kullanılmıyor (bkz. component JSDoc'u).
      */}
      <span className={css.avatarSlot} aria-hidden="true">
        <Avatar
          name={user.fullName}
          size={AVATAR_BOYUTU[variant]}
          /*
            Koşullu spread: `AvatarProps.src` `string | undefined` değil `string`;
            `exactOptionalPropertyTypes` açıkken `src={user.avatarUrl}` TS2375 verir.
            Fixture'ların hiçbirinde avatar yok — yokluk bir durum, Avatar baş
            harflere düşer.
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

          {/* Brifing 2.6: admin rolü yalnızca admin kullanıcılarında gösterilir. */}
          {user.adminRole !== undefined ? (
            <Badge tone="primary" variant="outline" size="sm">
              {ADMIN_ROLE_LABEL[user.adminRole]}
            </Badge>
          ) : null}
        </div>

        {variant === 'detailed' ? (
          <dl className={css.facts}>
            <Bilgi label="E-posta">{user.email}</Bilgi>
            <Bilgi label="Telefon">{user.phone}</Bilgi>
            <Bilgi label="İlan">
              {user.listingCount.toLocaleString('tr-TR')} ilan ·{' '}
              {user.activeListingCount.toLocaleString('tr-TR')} yayında
            </Bilgi>
            <Bilgi label="Kayıt">
              <Zaman value={user.createdAt} saatli={false} />
            </Bilgi>
          </dl>
        ) : null}

        {variant === 'security' ? (
          <>
            {yaptirim !== null ? (
              <p className={css.sanction}>
                <Ban size={16} aria-hidden="true" />
                Yürürlükte olan yaptırım: {USER_SANCTION_TYPE_LABEL[yaptirim]}
              </p>
            ) : null}

            <dl className={css.facts}>
              <Bilgi label="Son giriş">
                {user.lastLoginAt !== undefined ? (
                  <Zaman value={user.lastLoginAt} saatli />
                ) : (
                  /*
                    Alanın yokluğu bir durum ve cümleyle söyleniyor. Boş bırakmak
                    "veri gelmedi" ile "hiç giriş yapmadı"yı karıştırırdı; ikisi
                    yaptırım kararında aynı şey değil.
                  */
                  <span className={css.missing}>Hiç giriş yapmadı</span>
                )}
              </Bilgi>

              {/*
                Doğrulama burada TEKRAR yazılmıyor: rozet zaten yukarıda ve
                `security`'de iki hâli de gösteriyor. "Doğrulama: Doğrulanmış"
                satırı aynı kelimeyi yirmi piksel altında ikinci kez söyler ve
                asıl bulguları (son giriş, şikayet) aşağı iterdi.
              */}
              <Bilgi label="Şikayet">
                {user.reportCount > 0 ? (
                  <Badge tone="danger" variant="soft" size="sm" leadingIcon={<Flag size={12} />}>
                    {user.reportCount.toLocaleString('tr-TR')} açık şikayet
                  </Badge>
                ) : (
                  <span className={css.clean}>Açık şikayet yok</span>
                )}
              </Bilgi>
            </dl>
          </>
        ) : null}
      </div>
    </>
  )

  return (
    <article
      className={css.card({ variant, withActions: actions !== undefined })}
      data-clickable={tiklanabilir ? '' : undefined}
    >
      {onClick !== undefined ? (
        <button type="button" className={css.clickRegion} onClick={() => onClick(user)}>
          {icerik}
        </button>
      ) : (
        <div className={css.clickRegion}>{icerik}</div>
      )}

      {actions !== undefined ? <div className={css.actionsSlot}>{actions}</div> : null}
    </article>
  )
}
