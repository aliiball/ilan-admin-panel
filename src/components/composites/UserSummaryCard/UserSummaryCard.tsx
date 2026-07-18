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
 * Hesap durumundan **yürürlükteki** yaptırımın tipine — `activeSanction`
 * verilmediğinde başvurulan yedek.
 *
 * `UserAccount` yaptırım kaydını taşımıyor; taşıdığı tek şey durumun kendisi.
 * Askıdaki hesap tanım gereği bir `suspension`, banlı hesap bir `ban`
 * yaptırımının sonucudur — bu bir uydurma değil, durumun tanımı. Gerekçe,
 * başlangıç ve bitiş buradan **türetilemez**; onları yalnız `activeSanction`
 * getirir (bkz. component JSDoc'u).
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
 * Ad–değer çifti — hem hesap alanları hem yaptırım kaydı için **tek** blok.
 *
 * `<dl>`/`<dt>`/`<dd>` semantik olarak tam da bu, ama kullanılamıyor: `onClick`
 * verilen kartın kökü bir `<button>`'a dönüyor ve `icerik` o butonla `<div>`
 * arasında tek koddan paylaşıldığı için içindeki her şey **her iki hâlde de**
 * phrasing content olmak zorunda — `<button>` yalnız phrasing content alır,
 * `<dl>`/`<div>`/`<dt>`/`<dd>` orada geçersiz HTML olur. Bu yüzden ızgara
 * `<span>` + `display: grid` ile kuruluyor: ad–değer düzeni görsel olarak
 * korunuyor (etiket kolonu + değer kolonu), element `<dl>` olmuyor.
 *
 * Emsal ReportCard: aynı çatışmayı `<span>` + grid lehine çözdü ("`<dl>`
 * semantik olarak daha doğru olurdu ama kullanılamıyor"). Span'e geçince
 * `<dd>`'nin 40 piksellik `margin-inline-start`'ı da düşer — dikey/yatay ritmi
 * artık yalnız `css.fact`/`css.facts`'ın `gap` token'ı belirliyor, tarayıcı
 * margin'i değil.
 */
function Bilgi({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className={css.fact}>
      <span className={css.factLabel}>{label}</span>
      <span className={css.factValue}>{children}</span>
    </span>
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
 * **Yaptırım kaydı `activeSanction` ile gelir ve alanları varyanta göre açılır —
 * bu bir yoğunluk tercihi değil, yetki sınırıdır.** `compact` hiç göstermez
 * (orada durum rozeti zaten tek bilgi); `detailed` yalnız **tipi** ve
 * **`endsAt`**'i — `destek` rolünün gördüğü yüz, "askınız 29 Tem'de bitiyor"
 * diyebilmeli; `security` ayrıca `reason`, `startsAt` ve `createdByAdminId`'yi.
 * `UserSanction.reason` **iç gerekçe metnidir**, müşteriye okunacak cümle değil:
 * `AdminPermission.UserViewProfile`'ın JSDoc'u onu alan alan gizli sayıyor.
 * Gizli alan soluk veya `disabled` gösterilmez, **DOM'da hiç olmaz** — reponun
 * en eski kuralı. Ölçüm: `SupportViewHidesSanctionReason`.
 *
 * **Kayıt gelmezse `security` yaptırımın yalnız tipini durumdan türetir** (Faz 2
 * davranışı, `SanctionIsSurfacedOnSecurity` ölçüyor). `detailed` **türetmez** ve
 * bu kasıtlı: kayıt yokken bandın söyleyebileceği tek kelimeyi durum rozeti
 * yirmi piksel yukarıda zaten yazıyor — bandı `detailed`'da haklı çıkaran şey
 * `endsAt`'tir ve o yalnız kayıtla gelir.
 *
 * **Süre mutlak yazılır** ("29 Tem 2026 10:30"), göreli değil: "14 gün kaldı"
 * hesabı "şimdi"ye dayanır, story'yi her gün değiştirir ve Chromatic'te gerçek
 * regresyonu gürültüye gömer. Bitişi olmayan yaptırım (süresiz ban) boş
 * bırakılmaz, "Süresiz" diye **söylenir** — "alan gelmedi" ile "bitmiyor" aynı
 * şey değil. Kaldırılmış yaptırım (`revokedAt` dolu) buraya konmaz çünkü
 * "yürürlükteki" değildir; kart bunu savunmacı bir kontrolle **denetlemez** —
 * sözleşme çağıranı bağlar, geçmiş yaptırımlar `SellerPanelProps.sanctions`'a
 * aittir.
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
  activeSanction,
  variant = 'compact',
  actions,
  onClick,
}: UserSummaryCardProps) {
  const tiklanabilir = onClick !== undefined
  const dogrulamaRozeti = variant !== 'compact' || !user.verified

  /*
    Bandın yazacağı tip: kayıt geldiyse **onun** tipi, gelmediyse `security`'de
    durumdan türetilen tip. `detailed` türetmiyor — gerekçesi component JSDoc'unda.

    Kayıt varken `user.status`'e değil `activeSanction.type`'a bakılıyor: ikisi
    çelişirse doğru cevap kaydındır, durum ondan türer.
  */
  const yaptirimTipi =
    activeSanction?.type ?? (variant === 'security' ? DURUM_YAPTIRIMI[user.status] : null)

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

          {/*
            Brifing 2.6: admin rolü yalnızca admin kullanıcılarında gösterilir —
            ve yalnız `security`'de.

            İkinci kapı Faz 3'te eklendi: rozet varyanttan **bağımsız** basılıyordu,
            yani `detailed` — `destek`in gördüğü yüz — admin rolünü gösteriyordu.
            `AdminPermission.UserViewProfile`'ın JSDoc'u `adminRole`'ü açıkça gizli
            sayıyor ve `variant`'ın kendi JSDoc'u da öyle; uygulama ikisiyle de
            çelişiyordu. `lastLoginAt` doğru kapılıydı, bu değildi — sızıntı tam
            olarak "bir alanı listeye yazıp kapıyı kurmayı unutmak" biçimindeydi.
            `UserManagementPage` ölçerken buldu.
          */}
          {variant === 'security' && user.adminRole !== undefined ? (
            <Badge tone="primary" variant="outline" size="sm">
              {ADMIN_ROLE_LABEL[user.adminRole]}
            </Badge>
          ) : null}
        </div>

        {/*
          Yaptırım bandı `compact`'te HİÇ yok: orada durum rozeti zaten tek bilgi
          ve bant satırı iki katına çıkarırdı.
        */}
        {variant !== 'compact' && yaptirimTipi !== null ? (
          <span className={css.sanction}>
            <Ban size={16} aria-hidden="true" />
            Yürürlükte olan yaptırım: {USER_SANCTION_TYPE_LABEL[yaptirimTipi]}
          </span>
        ) : null}

        {/*
          Kaydın alanları. **`variant` burada bir yetki kapısı**, bir yoğunluk
          ayarı değil: `detailed` yalnız `endsAt`'i görür, `security` gerekçeyi
          de. Gizli alan koşullu olarak **hiç render edilmiyor** — soluk veya
          `aria-hidden` bırakmak metni DOM'da bırakırdı ve `destek` rolü onu
          incelemede okurdu. Ölçüm: `SupportViewHidesSanctionReason`.
        */}
        {variant !== 'compact' && activeSanction !== undefined ? (
          <span className={css.sanctionFacts}>
            {variant === 'security' ? (
              <>
                <Bilgi label="Gerekçe">{activeSanction.reason}</Bilgi>
                <Bilgi label="Başlangıç">
                  <Zaman value={activeSanction.startsAt} saatli />
                </Bilgi>
              </>
            ) : null}

            <Bilgi label="Bitiş">
              {activeSanction.endsAt !== undefined ? (
                <Zaman value={activeSanction.endsAt} saatli />
              ) : (
                /*
                  Süresiz ban: `endsAt`'in yokluğu bir durum ve cümleyle
                  söyleniyor (fixture'ın kendi JSDoc'u da bilgiyi alanın
                  yokluğuna yüklüyor). Boş bırakmak "veri gelmedi" ile
                  "bitmiyor"u karıştırırdı — biri eksik veri, öteki kararın ta
                  kendisi.
                */
                <span className={css.missing}>Süresiz</span>
              )}
            </Bilgi>

            {/*
              Kararı veren admin ham UUID olarak yazılıyor: kart veri çekmez ve
              sözleşme yalnız `createdByAdminId` veriyor. ReportCard'ın
              `reporterUserId`/`assignedAdminId` boşluğunun aynısı — raporlandı.
            */}
            {variant === 'security' ? (
              <Bilgi label="Karar veren">{activeSanction.createdByAdminId}</Bilgi>
            ) : null}
          </span>
        ) : null}

        {/*
          `security`, `detailed`'ın ÜST KÜMESİ — Faz 3'te düzeltildi.

          Buradaki kapı `variant === 'detailed'` idi ve sonuç ters bir yetki
          modeliydi: `security` (tam görünüm, `UserView` ister) kullanıcının
          e-postasını, telefonunu ve ilan sayaçlarını **çizmiyordu**, `detailed`
          (`destek`in yüzü) çiziyordu. Yani moderatör ile süper admin, destek'in
          gördüğü iletişim bilgisini göremiyordu — oysa brifing 2.6 ikisini de
          görünen veri sayıyor ve `variant`'ın JSDoc'u `security`'ye "tam görünüm"
          diyor. `UserDetailPage` ölçerken buldu.

          Kademe artık gerçekten kademeli: compact ⊂ detailed ⊂ security.
        */}
        {variant !== 'compact' ? (
          <span className={css.facts}>
            <Bilgi label="E-posta">{user.email}</Bilgi>
            <Bilgi label="Telefon">{user.phone}</Bilgi>
            <Bilgi label="İlan">
              {user.listingCount.toLocaleString('tr-TR')} ilan ·{' '}
              {user.activeListingCount.toLocaleString('tr-TR')} yayında
            </Bilgi>
            <Bilgi label="Kayıt">
              <Zaman value={user.createdAt} saatli={false} />
            </Bilgi>
          </span>
        ) : null}

        {variant === 'security' ? (
          <span className={css.facts}>
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
          </span>
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
