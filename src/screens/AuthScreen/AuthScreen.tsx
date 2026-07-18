import type { FormEvent } from 'react'
import { AlertTriangle, Building2, Clock, SearchX, ShieldAlert } from 'lucide-react'
// Göreli yol: react-docgen `@/` alias'ını çözemiyor ve çözemeyince component'in
// tamamını atlıyor — prop tablosu ve AI manifest'i sessizce boşalıyor.
import type { AuthScreenProps } from '../../types/component-props'
import { Alert } from '../../components/primitives/Alert'
import { Button } from '../../components/primitives/Button'
import { Input } from '../../components/primitives/Input'
import * as css from './AuthScreen.css'

/**
 * Alan adları: `FormData` anahtarı ve tarayıcının parola yöneticisi için.
 *
 * Ekran değeri state'te tutmuyor — sözleşmede `value`/`onChange` yok, yalnız
 * `onSubmit` var. Native form gönderiminden `FormData` ile okumak, kontrollü
 * olmayan iki alan için gereksiz bir state'ten daha az yalan söyler.
 */
const EPOSTA_ALANI = 'email'
const PAROLA_ALANI = 'password'

/**
 * Ekranın metinleri burada, `domain/labels.ts`'te değil.
 *
 * Emsal `LOCATION_FIELD_LABEL`: ortada bir enum yok (mod birleşimi bir domain
 * tipi değil, ekranın kendi durumu), etiketler tek bir tüketiciye ait ve hiçbiri
 * listede/kuyrukta/detayda tekrar görünmüyor. Aynı cümleler ikinci bir ekranda
 * gerekirse `labels.ts`'e taşınmalı — `USER_VERIFICATION_LABEL` köprüsüyle aynı
 * desen.
 */
const GIRIS_BASLIGI = 'Yönetim paneline giriş'
const GIRIS_ACIKLAMASI = 'Devam etmek için yönetici hesabınızla giriş yapın.'
const GIRIS_BUTONU = 'Giriş yap'
const EPOSTA_ETIKETI = 'E-posta'
const PAROLA_ETIKETI = 'Parola'

const MARKA_ADI = 'İlan Yönetim Paneli'
const MARKA_CUMLESI = 'Gayrimenkul ilanlarının moderasyonu, denetimi ve operasyonu tek panelde.'

/**
 * Dört mesaj modunun başlığı, açıklaması, eylem etiketi ve ikonu.
 *
 * `forbidden` ve `fatalError`'ın eylemleri **kasten farklı**: 403'ü tekrar
 * denemek aynı 403'ü verir (bkz. component JSDoc'u), beklenmeyen bir hatayı
 * tekrar denemek ise tam olarak doğru adımdır.
 */
const MOD_ICERIGI = {
  sessionExpired: {
    baslik: 'Oturum süreniz doldu',
    aciklama:
      'Güvenlik gereği oturumunuz sonlandırıldı. Kaldığınız yerden devam etmek için tekrar giriş yapın.',
    eylemEtiketi: 'Giriş ekranına dön',
    Ikon: Clock,
  },
  forbidden: {
    baslik: 'Bu sayfaya erişim yetkiniz yok',
    aciklama:
      'Hesabınızın rolü bu sayfayı görüntülemeye izin vermiyor. Erişim gerekiyorsa panel yöneticinizden yetki isteyin.',
    eylemEtiketi: 'Panele dön',
    Ikon: ShieldAlert,
  },
  notFound: {
    baslik: 'Sayfa bulunamadı',
    aciklama: 'Aradığınız sayfa taşınmış, adı değişmiş veya hiç var olmamış olabilir.',
    eylemEtiketi: 'Panele dön',
    Ikon: SearchX,
  },
  fatalError: {
    baslik: 'Beklenmeyen bir hata oluştu',
    aciklama: 'İşleminiz tamamlanamadı. Tekrar deneyin; sorun sürerse yöneticinize bildirin.',
    eylemEtiketi: 'Tekrar dene',
    Ikon: AlertTriangle,
  },
} as const

interface MesajBloguProps {
  mode: Exclude<AuthScreenProps['mode'], 'login'>
  loading: boolean
  error?: string
  onPrimaryAction?: () => void
}

/**
 * Giriş dışındaki dört modun gövdesi.
 *
 * Ayrı bir dosya değil çünkü katalog component'i değil — AuthScreen'in kendi
 * içindeki bir düzen parçası (emsal: SellerPanel'in `YaptirimKaydi`'ı). Dışa da
 * açılmıyor; `index.ts` yalnız AuthScreen'i veriyor.
 */
function MesajBlogu({ mode, loading, error, onPrimaryAction }: MesajBloguProps) {
  const { baslik, aciklama, eylemEtiketi, Ikon } = MOD_ICERIGI[mode]

  return (
    <div className={css.message}>
      <span className={css.messageIcon} aria-hidden="true">
        <Ikon size={32} />
      </span>

      <h1 className={css.heading}>{baslik}</h1>

      {/* Sunucunun somut sebebi varsa modun genel cümlesinin yerine geçer. */}
      <p className={css.description}>{error !== undefined && error !== '' ? error : aciklama}</p>

      {onPrimaryAction !== undefined ? (
        <div className={css.messageAction}>
          <Button variant="primary" loading={loading} onClick={onPrimaryAction}>
            {eylemEtiketi}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Kimlik doğrulama ve erişim ekranları: giriş, oturum sonu, 403, 404 ve
 * beklenmeyen hata (brifing 2.11).
 *
 * **Kendi `<h1>`'ini basar — diğer on ekran basmaz.** Faz 3'ün geri kalanı bir
 * sayfanın *içeriğidir* ve sayfanın `<h1>`'i PageHeader'ındır, bu yüzden onlar
 * `<h2>` ile başlar. AuthScreen ise kabuğun **dışında** yaşayan tam sayfadır:
 * giriş ekranında sidebar, üst çubuk ve PageHeader yoktur, dolayısıyla `<h1>`'i
 * basacak başka kimse de yoktur. Onu atlamak sayfayı başlıksız bırakırdı.
 * (Sınır: `forbidden`/`notFound` kabuğun *içinde* de gösterilebilirse iki `<h1>`
 * doğar — bu bir sözleşme sorusu, raporlandı; brifing 2.11 bu beşini ayrı bir
 * ekran grubu saydığı için burada tam sayfa varsayıldı.)
 *
 * **EmptyState/ErrorState kullanılmadı, ikisi de bilerek.** Brifing 2.11 bu
 * ekranları onlardan türetiyor ama ikisi de başlığını `<p>` basıyor — ve bunu
 * doğru sebeple yapıyor: "component hangi başlık seviyesinde durduğunu bilemez".
 * Tam sayfa bir ekran bilir. Kullanmak ya sayfayı `<h1>`'siz bırakır ya da
 * `<h1>` + aynı metnin `<p>` kopyasını yan yana koyardı. Aradaki eksik parça
 * `ListingFactsProps.headingLevel` ile aynı boşluk (AGENTS'ta açık madde):
 * `EmptyStateProps`/`ErrorStateProps` bir `headingLevel` alsaydı türetme
 * tutardı. Raporlandı, uydurulmadı.
 *
 * **Düzen varyantları prop değil, kırılımdır.** Brifing "centered card" ve
 * "split brand panel" istiyor, `AuthScreenProps`'ta karşılığı yok — çünkü ikisi
 * bir tercih değil, aynı ekranın iki genişlikteki hâli: 320 pikselde marka
 * paneline yer yok, 1440'ta boş yarım ekran var. Prop uydurmak çağırana
 * telefonda `split` seçtirirdi. Gerekçe ve eşik `AuthScreen.css.ts`'te.
 *
 * **`mode: 'forbidden'` ile `AsyncState`'in `unauthorized`'ı aynı şeyi söyler,
 * farklı kanaldan.** `unauthorized` bir *veri ekranının* 403'üdür: kabuk ayakta,
 * menü ve üst çubuk duruyor, yalnız o panelin içeriği gelmedi. `mode:'forbidden'`
 * ise *sayfanın* 403'üdür: kullanıcı o rotaya hiç girememeli, gösterilecek kabuk
 * da yok. İkisi de **"tekrar dene" sunmaz** ve bu tesadüf değil:
 * `unauthorized.retryable` tip düzeyinde `false`'a sabitlenmiş, aynı gerekçeyle
 * 403 sayfası da yenile butonu göstermez — 403'ü tekrar denemek aynı 403'ü
 * verir. Doğru eylem yetkisi olan bir yere dönmektir.
 *
 * **Handler yoksa sonuçsuz buton sunulmaz.** `onSubmit` verilmezse gönder
 * butonu, `onPrimaryAction` verilmezse eylem butonu hiç render edilmez —
 * `ErrorState`'in `onRetry`'siyle aynı kural ("tekrar denemenin işe
 * yaramayacağı yerde buton sunmak kullanıcıyı boşa uğraştırır"). Form yine de
 * `preventDefault` eder: handler'sız bir `<form>`'da Enter'a basmak sayfayı
 * sunucuya gönderip paneli yeniden yükletirdi.
 *
 * **`error` bir kez yazılır.** Giriş hatasında mesaj `danger` bir `Alert`'e
 * gider (`role="alert"` — ekran okuyucu anında duyar, kullanıcı sekmeyle oraya
 * varana kadar beklemez); alanların kendi `error` prop'una da verilseydi aynı
 * cümle üç kez okunurdu. Alanlar bunun yerine `aria-invalid` ile işaretlenir.
 * Bunun bir bedeli var ve raporlandı: `InputProps` "mesajsız geçersiz"i ifade
 * edemiyor (`data-invalid` yalnız `error` doluyken doğuyor), dolayısıyla kutular
 * kırmızı kenarlık **almıyor**. Dört mesaj modunda `error`, modun sabit
 * açıklamasının yerine geçer: sunucunun söylediği somut sebep ("Bu ilanı görme
 * yetkiniz yok") genel cümleden iyidir.
 *
 * Göreli zaman yazılmaz: "oturumunuz 3 dk önce doldu" hesabı "şimdi"ye dayanır
 * ve ekran saati kendi okuyamaz.
 *
 * @example
 * <AuthScreen mode="login" error={hata} loading={gonderiliyor} onSubmit={girisYap} />
 */
export function AuthScreen({
  mode,
  loading = false,
  error,
  onSubmit,
  onPrimaryAction,
}: AuthScreenProps) {
  /*
    Boş string hata sayılmaz — `FieldMetaProps.error`'ün sözleşmesi ('' → geçerli).
    "Hata yok"u boş string ile ifade eden çağıran da doğru davranır, bu yüzden
    ikisi tek yerde tek bir değere indiriliyor.
  */
  const hataMesaji = error !== undefined && error !== '' ? error : undefined

  const gonder = (olay: FormEvent<HTMLFormElement>) => {
    /*
      Her koşulda: handler yokken de. `<form>`'un varsayılan davranışı sayfayı
      sunucuya göndermek ve paneli baştan yüklemektir.
    */
    olay.preventDefault()

    if (onSubmit === undefined) {
      return
    }

    const veri = new FormData(olay.currentTarget)
    onSubmit({
      email: String(veri.get(EPOSTA_ALANI) ?? ''),
      password: String(veri.get(PAROLA_ALANI) ?? ''),
    })
  }

  return (
    <div className={css.root}>
      {/*
        Dekoratif marka paneli. `aria-hidden`: 64rem altında hiç görünmediği için
        bilgi taşıyamaz — taşısaydı mobil kullanıcı onu hiç okuyamazdı. İçinde
        odaklanılabilir hiçbir şey yok, dolayısıyla `aria-hidden-focus` doğmuyor.
      */}
      <div className={css.brand} aria-hidden="true">
        <span className={css.brandIcon}>
          <Building2 size={40} />
        </span>
        <p className={css.brandTitle}>{MARKA_ADI}</p>
        <p className={css.brandTagline}>{MARKA_CUMLESI}</p>
      </div>

      <main className={css.panel}>
        <div className={css.card}>
          {mode === 'login' ? (
            <form className={css.form} onSubmit={gonder}>
              <div className={css.headingBlock}>
                <h1 className={css.heading}>{GIRIS_BASLIGI}</h1>
                <p className={css.description}>{GIRIS_ACIKLAMASI}</p>
              </div>

              {hataMesaji !== undefined ? <Alert tone="danger" title={hataMesaji} /> : null}

              <div className={css.fields}>
                {/*
                  `aria-invalid` alanların tek geçersizlik işareti: mesaj yukarıda,
                  Alert'te. `error` prop'u verilseydi aynı cümle kutunun altında
                  ikinci ve üçüncü kez yazılırdı.

                  İkisi birden işaretleniyor çünkü sunucu hangisinin yanlış
                  olduğunu söylemez — söylemesi de istenmez: yalnız parolayı
                  işaretlemek "bu e-posta kayıtlı" demek olurdu.
                */}
                <Input
                  name={EPOSTA_ALANI}
                  type="email"
                  label={EPOSTA_ETIKETI}
                  autoComplete="username"
                  inputMode="email"
                  required
                  disabled={loading}
                  {...(hataMesaji !== undefined && { 'aria-invalid': true })}
                />

                <Input
                  name={PAROLA_ALANI}
                  type="password"
                  label={PAROLA_ETIKETI}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  {...(hataMesaji !== undefined && { 'aria-invalid': true })}
                />
              </div>

              {/* Handler yoksa buton yok: basınca hiçbir şey olmayan buton,
                  olmayan butondan kötüdür (ErrorState'in `onRetry` kuralı). */}
              {onSubmit !== undefined ? (
                <Button type="submit" fullWidth loading={loading}>
                  {GIRIS_BUTONU}
                </Button>
              ) : null}
            </form>
          ) : (
            <MesajBlogu
              mode={mode}
              loading={loading}
              {...(hataMesaji !== undefined && { error: hataMesaji })}
              {...(onPrimaryAction !== undefined && { onPrimaryAction })}
            />
          )}
        </div>
      </main>
    </div>
  )
}
