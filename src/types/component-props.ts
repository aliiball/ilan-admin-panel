import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  Ref,
  TextareaHTMLAttributes,
} from 'react'

import type {
  AdminNote,
  AdminPermission,
  AdminRole,
  AuditLogEntry,
  AutomatedCheckResult,
  CategoryAttributeDefinition,
  Currency,
  DashboardMetrics,
  ISODate,
  ISODateTime,
  Listing,
  ListingCategory,
  ListingPhoto,
  ListingPromotion,
  ListingReport,
  ListingStatus,
  ModerationEvent,
  Paginated,
  PromotionFlags,
  PromotionType,
  RejectionReason,
  ReportReason,
  ReportSeverity,
  ReportStatus,
  SellerType,
  UserAccount,
  UserSanction,
  UserStatus,
  UserType,
} from './domain'

export type ControlSize = 'sm' | 'md' | 'lg'
export type AsyncStatus =
  'idle' | 'loading' | 'empty' | 'success' | 'partialSuccess' | 'unauthorized' | 'error'

/**
 * Kullanıcıya **gösterilebilir** hata.
 *
 * Ham sunucu hatası değil: yığın izi, HTTP gövdesi ve "TypeError: undefined"
 * burada durmaz. Çeviriyi sayfa katmanı yapar; component'ler bu şekli olduğu
 * gibi `ErrorState`'e taşır ve hiçbiri hatayı yorumlamaz — aynı hata listede,
 * kuyrukta ve detayda aynı cümleyi yazsın diye.
 *
 * Component prop'u değildir (manifest'te görünmez) ama `AsyncState`,
 * `DataTableProps.error` ve `ChartCardProps.error` üzerinden her ekranın
 * yazdığı şekil budur.
 */
export interface UiError {
  /** Neyin başarısız olduğu. "Hata" değil, "İlanlar yüklenemedi". */
  title: string
  /**
   * Ne yapılabileceği: kullanıcının okuyup bir sonraki adımını seçeceği cümle.
   *
   * `ErrorState.description`'a gider ve **zorunludur** — başlığı tek başına
   * göstermek "bir şeyler ters gitti" ekranı üretir, ki o da kullanıcıyı
   * sayfayı yenilemekten başka bir şey yapamaz hâlde bırakır.
   */
  message: string
  /**
   * Destek ekibinin arayabileceği kod. Verilirse mono yazıyla ve seçilebilir
   * gösterilir: kullanıcı onu telefonda okuyabilmeli, ekran görüntüsünden
   * kopyalayamaz.
   */
  code?: string
  /**
   * Aynı isteği tekrar göndermenin **anlamlı** olup olmadığı.
   *
   * Tek başına "tekrar dene" butonu **çıkarmaz**: buton için ayrıca bir
   * `onRetry` bağlanmalı (`ChartCardProps.onRetry`, `DataTableProps.onRetry`).
   * Hatanın tekrar denenebilir _olduğunu bilmek_, tekrar denemeyi _yapabilmek_
   * değil; iki kapı birden açılmalı, yoksa basınca hiçbir şey yapmayan bir
   * buton çıkar.
   *
   * `AsyncState`'in `unauthorized` üyesinde tip düzeyinde `false`'a sabitlenir:
   * 403'ü tekrarlamak aynı 403'ü verir ve kullanıcıyı döngüye sokar.
   */
  retryable: boolean
}

/**
 * Bir ekranın veri durumu.
 *
 * `status` tek doğruluk kaynağıdır: aynı anda hem yükleniyor hem hatalı bir
 * ekran yoktur. Durumlar bilerek ayrı, çünkü **her biri farklı bir şey
 * yaptırır**: `empty` filtreyi gevşetmeyi, `error` tekrar denemeyi,
 * `unauthorized` yetki istemeyi. Üçünü tek bir "veri yok" hâline indirmek
 * kullanıcıya yanlış eylemi önerir.
 */
export type AsyncState<T> =
  /*
    `idle` ve `loading` AYRI üyeler — tek bir `{ status: 'idle' | 'loading' }`
    değil. Anlam aynı, ama **daraltılabilirlik** aynı değil ve fark Faz 3'te
    ölçüldü.

    Ayrık birleşimin discriminant'ı birleşim tipi olunca (`status: 'idle' |
    'loading'`) TypeScript o üyeyi `===` denetimiyle eleyemiyor: ne
    `if (s.status === 'idle' || s.status === 'loading') return` ne de arka arkaya
    iki ayrı `if` üyeyi düşürüyor; sonraki satırda `s.data` hâlâ TS2339 veriyor.
    (Yalnız `switch` çalışıyor — `switch` üye başına ayrı daraltma yapıyor.)
    tsc 6.0.3 ile izole doğrulandı.

    Beş ekran bağımsız olarak doğal deyimi yazdı ve beşi birden aynı hatayı aldı;
    yani kusur ekranlarda değil sözleşmedeydi. İki üyeye bölmek `||`'ı da, ayrı
    `if`leri de çalıştırıyor ve kimseyi `switch` yazmaya zorlamıyor.

    Semantik fark yok: `idle` "ilk sorgu henüz başlatılmadı", `loading` "sorgu
    sürüyor" (brifing 2.1) — ikisi de veri taşımaz ve çoğu ekran ikisini aynı
    iskelete düşürür, ama artık bunu KENDİ seçiyor.
  */
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'empty'; data?: T }
  | { status: 'error'; error: UiError }
  /**
   * Kullanıcının bu veriyi görme yetkisi yok (HTTP 403).
   *
   * `error`'dan **ayrı bir durum**, çünkü ikisi farklı ekran ister: `error`
   * "bir şey ters gitti, tekrar dene" der, bu ise "bu senin görebileceğin bir
   * şey değil" der ve tekrar denemek hiçbir şeyi değiştirmez. `UiError.retryable`
   * yalnız butonu gizlerdi; ekran yine "sunucu bozuldu" diye özür dilerdi.
   * Brifing 3.5 `ListingListPage`, `SettingsPage` ve `AuditLogPage` için
   * `Unauthorized` story'sini zorunlu tutuyor.
   *
   * `retryable` tip düzeyinde `false`'a sabitlendi: 403'ü tekrar denemek aynı
   * 403'ü verir ve "tekrar dene" butonu kullanıcıyı döngüye sokar.
   *
   * Yetkisizliği **önden** bilen ekran buraya hiç gelmez: yetki kontrolü
   * component'in işi değil, yetkisi olmayan kullanıcıya buton hiç render
   * edilmez. Bu durum sunucunun reddettiği hâl içindir — istemcinin izin
   * listesi bayatlamış olabilir.
   */
  | { status: 'unauthorized'; error: UiError & { retryable: false } }
  /**
   * Verinin bir kısmı geldi, bir kısmı gelmedi (brifing 2.2: "bazı grafikler
   * yüklenemese de başarılı kartlar görünür").
   *
   * Dashboard KPI'ları ve her grafiği **bağımsız** sorgularla çekiyor; biri
   * düşünce ötekileri ayakta kalmalı. Tek bir `error` bütün ekranı hata
   * bloğuna çevirirdi — çalışan beş kartı, düşen bir grafik yüzünden gizlemek.
   *
   * `data` bilerek `Partial<T>`: gelmeyen alan **yok**, boş değil. Boş dizi
   * koymak `empty` ile `error`'ı karıştırırdı — "bu aralıkta ilan yok" ile "ilan
   * sayısı çekilemedi" kullanıcı için aynı şey değil ve `ChartCardProps.empty`
   * tam da bu farkı ayırmak için var.
   *
   * `errors` `data` ile **aynı anahtar uzayını** kullanır: her alan için ya
   * `data`'da değeri vardır ya `errors`'ta hatası. Anahtarların `keyof T`'ye
   * bağlı olması, düşen grafiği doğru `ChartCard`'a yönlendirmeyi tip düzeyinde
   * garantiler — düz bir `UiError[]` hangi hatanın hangi karta ait olduğunu
   * söyleyemezdi.
   */
  | {
      status: 'partialSuccess'
      data: Partial<T>
      errors: Partial<Record<keyof T & string, UiError>>
    }
  | { status: 'success'; data: T; stale?: boolean }

/**
 * Dokuz form kontrolünün paylaştığı etiket / yardımcı metin / hata üçlüsü.
 *
 * İşaretlemeyi (etiket–control eşlemesi, `aria-describedby`, `data-invalid`)
 * `internal/FieldShell` kurar; bu dört prop dokuz component'te birebir aynı
 * anlama gelir — açıklamaları da tek kaynaktan, buradan gelir.
 */
export interface FieldMetaProps {
  /**
   * Alanın görünür etiketi; kontrolün erişilebilir adı olur.
   *
   * Etiketsiz kullanmayın. `placeholder` etiket yerine **geçmez**: kullanıcı
   * yazmaya başlar başlamaz kaybolur ve o andan sonra alanın ne olduğunu hiçbir
   * şey söylemez.
   */
  label?: string
  /**
   * Etiketin altındaki yardımcı metin: beklenen biçim, sınır, örnek değer.
   *
   * `error` doluyken **gizlenir**. İkisi birden okunursa ekran okuyucu
   * kullanıcısı önce çözümü, sonra sorunu duyar — tersine bir sıra.
   */
  helperText?: string
  /**
   * Doğrulama hatası. Dolu olması alanı geçersiz işaretler: kırmızı kenarlık,
   * `data-invalid` ve `helperText`'in yerine geçen hata mesajı.
   *
   * Boş string hata sayılmaz (`''` → geçerli); "hata yok"u `undefined` yerine
   * boş string ile ifade eden çağıran da doğru davranır.
   *
   * Doğrulamayı kontrol **yapmaz**: kuralın sahibi form katmanıdır, alan yalnız
   * sonucu gösterir.
   */
  error?: string
  /**
   * Etikete `*` ekler ve — kontrol destekliyorsa — kontrolün `required`
   * attribute'u olarak da geçirilir.
   *
   * Yalnız **işaretler, denetlemez**: boş bırakılmış zorunlu alanı yakalamak ve
   * gönderimi kapatmak form katmanının işidir. `*`'ın kendisi `aria-hidden`'dır;
   * zorunluluğu ekran okuyucuya yıldız değil, kontrolün attribute'u bildirir.
   *
   * @default false
   */
  required?: boolean
}

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /**
   * Butonun görsel önem seviyesi.
   *
   * - `primary`: Ekrandaki ana eylem. Bir ekranda tek tane olmalı.
   * - `secondary`: İkincil eylem (İptal, Geri, Taslak kaydet).
   * - `ghost`: Tablo satırı ve toolbar gibi yoğun alanlarda düşük vurgulu eylem.
   * - `danger`: Geri alınamayan yıkıcı eylem (silme, kalıcı reddetme).
   *
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /**
   * Buton yüksekliği. Tablo satırlarında `sm`, form ve sayfa eylemlerinde `md`.
   * @default 'md'
   */
  size?: ControlSize
  /**
   * İşlem sürerken butonu devre dışı bırakır ve spinner gösterir. Etiket gizlenir
   * ama yerini korur, böylece buton boyutu değişmez ve düzen zıplamaz.
   * @default false
   */
  loading?: boolean
  /** Etiketin solunda gösterilen ikon. Dekoratiftir, ekran okuyucudan gizlenir. */
  leadingIcon?: ReactNode
  /** Etiketin sağında gösterilen ikon. Dekoratiftir, ekran okuyucudan gizlenir. */
  trailingIcon?: ReactNode
  /**
   * Butonu bulunduğu kabın tam genişliğine yayar. Mobilde ana eylem için kullanılır.
   * @default false
   */
  fullWidth?: boolean
  /**
   * Butonu devre dışı bırakır.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa buton `disabled`
   * verilmez, hiç render edilmez — brifingin "geçersiz eylem sunulmamalıdır"
   * kriteri budur. Bu prop, kullanıcının yapabileceği ama *şu an*
   * yapamayacağı işler içindir: form eksik, sınırdaki sayfa, seçim boş.
   *
   * `loading` zaten devre dışı bırakır; ikisini birlikte vermeye gerek yok.
   *
   * Native attribute yeniden bildiriliyor çünkü react-docgen onu (component
   * imzasında varsayılanı olduğu için) prop olarak sayıyor ve açıklamasız
   * bırakılırsa Controls panelinde boş görünüyor.
   *
   * @default false
   */
  disabled?: boolean | undefined
  /**
   * Native buton tipi.
   *
   * Varsayılan bilerek `button`: HTML'in kendi varsayılanı `submit` ve bir formun
   * içindeki her buton istemeden formu göndermiş olur. Form gönderen butonda
   * açıkça `type="submit"` verin.
   *
   * @default 'button'
   */
  type?: 'submit' | 'reset' | 'button' | undefined
}

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'color'
> {
  /** Gösterilecek ikon. Dekoratiftir; erişilebilir isim `label`'dan gelir. */
  icon: ReactNode
  /**
   * Erişilebilir isim. Zorunludur: yalnız ikonlu butonun görünür metni olmadığı
   * için ekran okuyucunun okuyacağı tek kaynak budur. Aynı zamanda tooltip metni.
   */
  label: string
  /**
   * Butonun görsel önem seviyesi. Tablo ve toolbar içinde genellikle `ghost`.
   * @default 'ghost'
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /**
   * Buton boyutu. Her boyut en az 44x44px dokunma hedefi sağlar.
   * @default 'md'
   */
  size?: ControlSize
  /**
   * İşlem sürerken butonu devre dışı bırakır ve ikonun yerine spinner gösterir.
   * @default false
   */
  loading?: boolean
  /**
   * Butonu devre dışı bırakır.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa buton `disabled`
   * verilmez, hiç render edilmez — brifingin "geçersiz eylem sunulmamalıdır"
   * kriteri budur. Bu prop, kullanıcının yapabileceği ama *şu an*
   * yapamayacağı işler içindir: seçim boş, sınırdaki sayfa oku, kilitli satır.
   *
   * `loading` zaten devre dışı bırakır; ikisini birlikte vermeye gerek yok.
   *
   * Native attribute yeniden bildiriliyor çünkü react-docgen onu (component
   * imzasında varsayılanı olduğu için) prop olarak sayıyor ve açıklamasız
   * bırakılırsa Controls panelinde boş görünüyor.
   *
   * @default false
   */
  disabled?: boolean | undefined
  /**
   * Native buton tipi.
   *
   * Varsayılan bilerek `button`: HTML'in kendi varsayılanı `submit` ve bir formun
   * içindeki her buton istemeden formu göndermiş olur. Bir ikon butonunun bunu
   * yapması özellikle şaşırtıcıdır — form gönderen ikon butonunda açıkça
   * `type="submit"` verin.
   *
   * @default 'button'
   */
  type?: 'submit' | 'reset' | 'button' | undefined
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Rozetin dolgu stili.
   *
   * - `solid`: Dolu arka plan, en yüksek vurgu.
   * - `soft`: Açık arka plan, koyu metin. Yoğun listelerde tercih edilir.
   * - `outline`: Yalnız kenarlık.
   *
   * @default 'soft'
   */
  variant?: 'solid' | 'soft' | 'outline'
  /**
   * Anlamsal renk. Renk tek başına gösterge değildir; rozet her zaman metin de taşır.
   * @default 'neutral'
   */
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /**
   * Rozet boyutu. Tablo satırında ve kart üstünde `sm`, detay başlığında `md`.
   * @default 'md'
   */
  size?: 'sm' | 'md'
  /** Metnin solunda gösterilen ikon. Dekoratiftir, ekran okuyucudan gizlenir. */
  leadingIcon?: ReactNode
}

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Seçili görünüm. Filtre çipi olarak kullanıldığında hangi değerin açık
   * olduğunu gösterir.
   *
   * Yalnız görünümdür: Tag seçim durumunu kendi tutmaz ve tıklamayı kendi
   * yakalamaz — seçim mantığı çağıranındır.
   *
   * @default false
   */
  selected?: boolean
  /**
   * Etiketin sağında kaldırma (×) butonu gösterir. `onRemove` ile birlikte
   * verilmelidir; sonuçsuz bir × sunmanın anlamı yok.
   *
   * @default false
   */
  removable?: boolean
  /**
   * Etiketi soluk gösterir ve kaldırma butonunu kapatır.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa etiket `disabled`
   * verilmez, hiç render edilmez. Bu prop "şu an kaldırılamaz" içindir —
   * örneğin filtre uygulanırken.
   *
   * @default false
   */
  disabled?: boolean
  /**
   * Kaldırma butonuna basıldığında çalışır. Etiketi listeden çıkarmak
   * çağıranın işi: Tag kendini kaldırmaz.
   */
  onRemove?: () => void
}

// `required` native attribute'lardan çıkarıldı: exactOptionalPropertyTypes açıkken
// HTML'in `required?: boolean | undefined` tipi ile FieldMetaProps'un
// `required?: boolean` tipi çakışıyordu (TS2320). Zorunluluk bilgisi tek
// kaynaktan, FieldMetaProps'tan gelir.
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'required'>, FieldMetaProps {
  /**
   * Kutu yüksekliği. Tablo satırı içinde `sm`, formlarda `md`.
   * @default 'md'
   */
  size?: ControlSize
  /** Kutunun solunda gösterilen ikon. Dekoratiftir, ekran okuyucudan gizlenir. */
  leadingIcon?: ReactNode
  /** Kutunun sağında gösterilen eylem (temizle, göster/gizle gibi). */
  trailingAction?: ReactNode
  /**
   * Kutuyu devre dışı bırakır.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa alan `disabled`
   * verilmez, hiç render edilmez. Bu prop "şu an yazılamaz" içindir: form
   * gönderilirken, ya da başka bir alanın seçimi beklenirken.
   *
   * Salt okunur ama kopyalanabilir bir değer gösteriyorsanız `readOnly`
   * kullanın — `disabled` alanı odak sırasından da çıkarır.
   *
   * Native attribute yeniden bildiriliyor: react-docgen onu (component
   * imzasında varsayılanı olduğu için) prop sayıyor, açıklamasız bırakılırsa
   * Controls panelinde boş görünüyor.
   *
   * @default false
   */
  disabled?: boolean | undefined
  /**
   * Alanı **mesajsız** geçersiz işaretler: kırmızı kenarlık + `aria-invalid`,
   * ama alanın altında metin yok.
   *
   * `error` (FieldMetaProps) bir dizedir ve **hem** kutuyu kırmızıya boyar **hem**
   * o dizeyi alanın altına basar. Ama bazı geçersizlikler alan bazında bir cümle
   * ÜRETMEZ: giriş ekranında "e-posta ya da parola hatalı" tek bir üst uyarıdır —
   * hangi alanın yanlış olduğunu söylemek "bu e-posta kayıtlı" bilgisini
   * sızdırır — yine de **iki alan da** kırmızı olmalı. Faz 3'e kadar bunu ifade
   * etmenin yolu yoktu: `data-invalid` yalnız dolu bir `error`'dan doğuyordu,
   * yani mesajsız kırmızı kenarlık **imkânsızdı** ve `AuthScreen`'in giriş
   * hatasında alanları kırmızı olmuyordu (ölçüldü).
   *
   * Öncelik: `error` doluysa o kazanır (kırmızı + mesaj). `invalid` yalnız
   * `error` boşken devreye girer; ikisi de `Field.Root`'a `data-invalid`
   * yazdırır ve `aria-invalid` verir.
   *
   * @default false
   */
  invalid?: boolean
  /**
   * Asıl `<input>` elementine erişim.
   *
   * Brifingden sapma: `InputHTMLAttributes` `ref` içermez, bu yüzden açıkça eklendi.
   * Gerekçe: SearchInput temizleme butonuna basıldığında odağı input'a geri
   * vermek zorunda — vermezse klavye kullanıcısı ortada kalır.
   */
  ref?: Ref<HTMLInputElement>
}

export interface SearchInputProps extends InputProps {
  /**
   * Arama tetiklendiğinde çalışır — her tuş vuruşunda değil, `debounceMs`
   * kadar sessizlikten sonra.
   *
   * İlk render'da çağrılmaz: sayfa açılır açılmaz boş bir arama isteği gitmesin
   * diye. Değeri anında takip etmek istiyorsanız `onChange` kullanın; ikisi
   * farklı sorulara cevap verir — `onChange` "ne yazıyor", `onSearch` "ne
   * aransın".
   */
  onSearch?: (value: string) => void
  /**
   * Temizleme butonuna basıldığında çalışır. Buton yalnız kutuda değer varken
   * görünür.
   *
   * Kutuyu boşaltmak ve odağı geri vermek component'in işi; bu callback yalnız
   * haber verir — kontrollü kullanımda değeri sıfırlamak çağırana düşer.
   */
  onClear?: () => void
  /**
   * `onSearch` çağrılmadan önce beklenecek sessizlik süresi (ms).
   *
   * Geciktirme, ilan listesi gibi büyük sorgularda her harfe bir istek
   * gitmesini engeller. `0` vermek geciktirmeyi kapatır — yalnız istemci
   * tarafında süzülen küçük listelerde mantıklıdır.
   *
   * @default 300
   */
  debounceMs?: number
}

export interface NumberInputProps extends FieldMetaProps {
  /**
   * Kontrollü değer. Boş kutu `undefined` ile ifade edilir.
   *
   * Brifingden sapma: tip `number` yerine `number | undefined`. Gerekçe:
   * `onValueChange` kutu boşaltılınca `undefined` veriyor, ama `value?: number`
   * (exactOptionalPropertyTypes açıkken) onu geri almıyordu — kontrollü kullanımda
   * gidiş-dönüş kırıktı. Aynı düzeltme CurrencyInput ve Select'te de yapıldı.
   */
  value?: number | undefined
  /**
   * İzin verilen en küçük değer. Değer buraya inince azalt butonu kendiliğinden
   * kapanır.
   *
   * Negatif değer alamayan alanlarda (m², oda sayısı, kat) açıkça `0` veya `1`
   * verin: brifing 1.1'in "fiyat, m², tarih ve sayaçlar negatif değer alamaz"
   * kuralını kutu düzeyinde uygulayan tek şey budur.
   */
  min?: number
  /** İzin verilen en büyük değer. Değer buraya çıkınca artır butonu kapanır. */
  max?: number
  /**
   * Artır/azalt butonlarının ve ok tuşlarının adım miktarı.
   * @default 1
   */
  step?: number
  /**
   * Kutu yüksekliği. Tablo satırı ve filtre çubuğunda `sm`, formlarda `md`.
   * @default 'md'
   */
  size?: ControlSize
  /**
   * Kutuyu ve artır/azalt butonlarını devre dışı bırakır.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa alan `disabled`
   * verilmez, hiç render edilmez. Bu prop "şu an değiştirilemez" içindir.
   *
   * @default false
   */
  disabled?: boolean
  /**
   * Değeri kilitler ama alanı okunabilir ve odaklanabilir bırakır.
   *
   * `disabled`'dan farkı: `readOnly` kutuyu odak sırasında tutar ve soluklaştırmaz,
   * böylece değer seçilip kopyalanabilir. Gösterilen ama düzenlenmeyen bir sayı
   * için doğru olan budur.
   *
   * @default false
   */
  readOnly?: boolean
  /** Değer değiştiğinde çalışır. Kutu boşaltılırsa `undefined` gelir. */
  onValueChange?: (value: number | undefined) => void
}

export interface CurrencyInputProps extends FieldMetaProps {
  /** Tutar. Boş kutu `undefined`. Bkz. NumberInputProps.value — aynı düzeltme. */
  value?: number | undefined
  /** Seçili para birimi. */
  currency: Currency
  /** Seçilebilir para birimleri. Verilmezse yalnız `currency` gösterilir. */
  currencies?: Currency[]
  /**
   * İzin verilen en küçük tutar.
   *
   * Fiyat alanlarında `0` verin: brifing 1.1 fiyatın negatif olamayacağını şart
   * koşuyor ve bunu kutu düzeyinde uygulayan tek şey bu sınırdır.
   */
  min?: number
  /** İzin verilen en büyük tutar. */
  max?: number
  /**
   * Kutu yüksekliği. Filtre çubuğunda `sm`, ilan formunda `md`.
   * @default 'md'
   */
  size?: ControlSize
  /**
   * Tutar kutusunu ve para birimi seçicisini birlikte devre dışı bırakır.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa alan `disabled`
   * verilmez, hiç render edilmez. Bu prop "şu an değiştirilemez" içindir.
   *
   * İkisi birlikte kapanır çünkü tutar ve para birimi tek bir `Money` değerinin
   * parçaları — birini kilitleyip diğerini açık bırakmak tutarsız değer üretir.
   *
   * @default false
   */
  disabled?: boolean
  /** Tutar değiştiğinde çalışır. Kutu boşaltılırsa `undefined` gelir. */
  onValueChange?: (value: number | undefined) => void
  /** Para birimi değiştiğinde çalışır. */
  onCurrencyChange?: (currency: Currency) => void
}

export interface SelectOption {
  /** Seçildiğinde `onValueChange`'e geçilecek değer. Liste içinde benzersiz olmalı. */
  value: string
  /** Görünür metin. Aranabilir listelerde süzme bunun üzerinden yapılır. */
  label: string
  /**
   * Etiketin altında gösterilen ek açıklama. Birbirine yakın seçenekleri
   * ayırt ettirmek için ("Belge Uyumsuzluğu" ile "Yetki Belgesi Eksik" gibi).
   */
  description?: string
  /**
   * Bu seçeneği seçilemez kılar.
   *
   * **Yetki için kullanmayın**: kullanıcının seçmeye yetkisi olmayan bir
   * seçenek listeye hiç konmamalıdır. Bu alan "şu an geçersiz" içindir —
   * örneğin bu kategoride kullanılamayan bir işlem türü.
   *
   * @default false
   */
  disabled?: boolean
}

export interface SelectProps extends FieldMetaProps {
  /** Seçili değer. Seçim yoksa `undefined`. Bkz. NumberInputProps.value — aynı düzeltme. */
  value?: string | undefined
  /**
   * Seçenekler, verilen sırayla gösterilir. Sıralama Select'in işi değil:
   * "en çok kullanılan üstte" mi yoksa alfabetik mi olacağı ekrana göre değişir.
   */
  options: SelectOption[]
  /** Seçim yokken gösterilen metin. Etiket yerine geçmez. */
  placeholder?: string
  /**
   * Kontrol yüksekliği. Tablo ve filtre çubuğunda `sm`, formlarda `md`.
   * @default 'md'
   */
  size?: ControlSize
  /**
   * Kontrolü devre dışı bırakır ve listeyi açılamaz kılar.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa alan `disabled`
   * verilmez, hiç render edilmez. Bu prop "şu an seçilemez" içindir — örneğin
   * il seçilmeden ilçe listesi.
   *
   * Tek tek seçenekleri kapatmak için `SelectOption.disabled` kullanın.
   *
   * @default false
   */
  disabled?: boolean
  /** Seçenek listesinde arama kutusu gösterir. Uzun listelerde açılmalı. */
  searchable?: boolean
  /** Seçimi temizleme butonu gösterir. */
  clearable?: boolean
  /** Seçenekler yüklenirken gösterilir. */
  loading?: boolean
  /** Seçim değiştiğinde çalışır. Seçim temizlenirse `undefined` gelir. */
  onValueChange?: (value: string | undefined) => void
}

export interface MultiSelectProps extends FieldMetaProps {
  /**
   * Seçili değerler. Kontrollüdür: seçimi MultiSelect değil çağıran tutar.
   *
   * `options`'ta karşılığı olmayan bir değer çip üretmez — sessizce yok sayılır,
   * çökmez. Seçenekler sonradan yüklenirken (`loading`) bu normaldir.
   */
  values: string[]
  /** Seçenekler, verilen sırayla gösterilir. Sıralama çağıranın kararı. */
  options: SelectOption[]
  /**
   * Hiçbir şey seçili değilken gösterilen metin. Etiket yerine geçmez.
   * @default 'Seçin'
   */
  placeholder?: string
  /**
   * Kontrol yüksekliği. Filtre çubuğunda `sm`, formlarda `md`.
   * @default 'md'
   */
  size?: ControlSize
  /**
   * Kontrolü devre dışı bırakır; çipler kaldırılamaz, liste açılamaz.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa alan `disabled`
   * verilmez, hiç render edilmez. Bu prop "şu an seçilemez" içindir.
   *
   * @default false
   */
  disabled?: boolean
  /**
   * Yazarak süzme kutusunu açar.
   *
   * Varsayılanı `true` — Select'in tersine. Gerekçe: çoklu seçim zaten uzun
   * listeler içindir (durum, kategori, promosyon) ve aranamayan bir çoklu seçim
   * kutusunda kullanıcı hangi seçenekleri işaretlediğini kaydırarak takip etmek
   * zorunda kalır.
   *
   * @default true
   */
  searchable?: boolean
  /**
   * Seçenekler yüklenirken listede spinner gösterir. Kutunun kendisi açık kalır.
   * @default false
   */
  loading?: boolean
  /**
   * Kutuda gösterilecek en fazla çip sayısı; fazlası `+3` şeklinde özetlenir.
   *
   * Verilmezse tüm çipler görünür ve çok seçim yapıldığında kutu büyüyüp sayfayı
   * aşağı iter. Dar alanlarda (filtre çubuğu, tablo başlığı) mutlaka verin.
   */
  maxVisibleTags?: number
  /** Seçim değiştiğinde yeni listenin **tamamıyla** çalışır — fark değil, son hâl. */
  onValuesChange?: (values: string[]) => void
}

// Brifingden sapma: `onChange` native attribute'lardan çıkarıldı ve yerine
// `onCheckedChange` eklendi. Gerekçe: brifing SwitchProps'u `onCheckedChange` ile
// temiz tanımlamış ama CheckboxProps'a native onChange'i miras bırakmış — iki
// benzer kontrol iki farklı API sunuyordu. Ayrıca Base UI'ın Checkbox'ı bir
// `<button role="checkbox">` render ettiği için native ChangeEvent hiç doğmuyor;
// onu taklit etmek tip sistemine yalan söylemek olurdu.
export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'onChange'
> {
  /** Kutunun yanında görünen etiket. Tıklanabilir alan etiketi de kapsar. */
  label: string
  /** Etiketin altında gösterilen ek açıklama. */
  description?: string
  /**
   * Kısmi seçim. Tablo başlığındaki "tümünü seç" kutusu için: bazı satırlar
   * seçiliyken ne işaretli ne boş görünmeli. `aria-checked="mixed"` olarak duyurulur.
   * @default false
   */
  indeterminate?: boolean
  /**
   * Etiketi görsel olarak gizler ama ekran okuyucuya bırakır.
   *
   * Brifingden sapma: tablo satırı seçim kutusunda etiket görünürse her satırda
   * tekrar eder, yatay alan yer ve tabloyu okunmaz hale getirir. Ama etiket
   * tamamen kaldırılamaz — ekran okuyucu kullanıcısı kutunun neyi seçtiğini
   * yalnızca ondan öğrenir. Gizlemek doğru orta yol.
   *
   * @default false
   */
  hideLabel?: boolean
  /**
   * Kutuyu devre dışı bırakır.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa kutu `disabled`
   * verilmez, hiç render edilmez. Bu prop "şu an işaretlenemez" içindir —
   * örneğin toplu işlem sürerken kilitlenen satır seçimi.
   *
   * Base UI Checkbox'ı native `<input>` değil `<span role="checkbox">` render
   * eder ve devre dışılığını `aria-disabled` ile bildirir. Testte `toBeDisabled()`
   * bunu göremez ve kutu gerçekten kilitliyken bile düşer;
   * `toHaveAttribute('aria-disabled', 'true')` kullanın.
   *
   * Native attribute yeniden bildiriliyor: react-docgen onu (component
   * imzasında varsayılanı olduğu için) prop sayıyor, açıklamasız bırakılırsa
   * Controls panelinde boş görünüyor.
   *
   * @default false
   */
  disabled?: boolean | undefined
  /** Seçim değiştiğinde çalışır. */
  onCheckedChange?: (checked: boolean) => void
}

export interface RadioOption {
  /** Seçildiğinde `onValueChange`'e geçilecek değer. Grup içinde benzersiz olmalı. */
  value: string
  /** Radyo düğmesinin yanındaki etiket; tıklanabilir alan onu da kapsar. */
  label: string
  /** Etiketin altında gösterilen ek açıklama: seçeneğin sonucu ne olur. */
  description?: string
  /**
   * Bu seçeneği seçilemez kılar. Grubun tamamı için `RadioGroupProps.disabled`
   * kullanın.
   *
   * **Yetki için kullanmayın**: yetkisiz seçenek listeye hiç konmamalıdır.
   *
   * @default false
   */
  disabled?: boolean
}

export interface RadioGroupProps extends FieldMetaProps {
  /** Seçili seçeneğin değeri. Hiçbiri seçili değilse `undefined`. */
  value?: string
  /**
   * Seçenekler, verilen sırayla gösterilir.
   *
   * Radyo grubu **hepsinin aynı anda görünmesi** gereken az sayıda seçenek
   * içindir; liste uzuyorsa `Select` kullanın — on radyo düğmesi ekranı boğar.
   */
  options: RadioOption[]
  /**
   * Seçeneklerin dizilimi. `horizontal` yalnız kısa etiketli iki-üç seçenekte
   * kullanılır; uzun etiketler dar ekranda sarıp hizayı bozar.
   *
   * @default 'vertical'
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * Grubun tamamını devre dışı bırakır.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa grup `disabled`
   * verilmez, hiç render edilmez. Bu prop "şu an seçilemez" içindir.
   *
   * Tek tek seçenekleri kapatmak için `RadioOption.disabled` kullanın.
   *
   * @default false
   */
  disabled?: boolean
  /** Seçim değiştiğinde çalışır. Radyo grubunda seçim geri alınamaz — `undefined` gelmez. */
  onValueChange?: (value: string) => void
}

export interface SwitchProps {
  /**
   * Anahtarın durumu. Kontrollüdür: Switch kendi durumunu tutmaz.
   *
   * Değişiklik **anında** uygulanır varsayımıyla tasarlandı; "Kaydet"e kadar
   * bekleyen bir ayarda `Checkbox` kullanın — kullanıcı switch'i çevirince işin
   * bittiğini sanır.
   */
  checked: boolean
  /** Anahtarın yanında görünen etiket; erişilebilir adı olur. Tıklanabilir alan etiketi de kapsar. */
  label: string
  /** Etiketin altında gösterilen ek açıklama: ayarın ne yaptığı, ne zaman etkili olduğu. */
  description?: string
  /**
   * Anahtarı devre dışı bırakır.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa anahtar `disabled`
   * verilmez, hiç render edilmez. Bu prop "şu an çevrilemez" içindir — örneğin
   * ayar sunucuya yazılırken.
   *
   * Base UI Switch'i de Checkbox gibi `aria-disabled` ile bildirir; testte
   * `toBeDisabled()` yerine `toHaveAttribute('aria-disabled', 'true')` kullanın.
   *
   * @default false
   */
  disabled?: boolean
  /**
   * Anahtar boyutu. Liste satırı içinde `sm`, ayar sayfasında `md`.
   * @default 'md'
   */
  size?: 'sm' | 'md'
  /** Durum değiştiğinde çalışır. */
  onCheckedChange?: (checked: boolean) => void
}

// `required` için InputProps ile aynı gerekçe.
export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'color' | 'required'>, FieldMetaProps {
  /**
   * Kullanıcının kutuyu yeniden boyutlandırma yönü.
   *
   * - `vertical`: yalnız dikey. Varsayılan — moderasyon notu uzayabilir ama
   *   yatay büyüme dar ekranda düzeni taşırır.
   * - `none`: sabit. Kutunun yüksekliği düzenin bir parçasıysa.
   * - `both`: serbest. Uzun serbest metin (ilan açıklaması) düzenlenirken.
   *
   * @default 'vertical'
   */
  resize?: 'none' | 'vertical' | 'both'
  /**
   * Kutunun altında karakter sayacı gösterir. `maxLength` ile birlikte
   * verildiğinde `120 / 500` biçiminde, sınıra yaklaşınca renk değiştirerek.
   *
   * Sayaç `aria-live="polite"` ile duyurulur: ekran okuyucu kullanıcısı sınıra
   * yaklaştığını her tuş vuruşunda değil, yazmayı bıraktığında öğrenir.
   *
   * @default false
   */
  showCharacterCount?: boolean
  /**
   * En fazla karakter sayısı. Hem native attribute olarak geçirilir hem de
   * sayacın paydası olur (`120 / 500`).
   *
   * Native attribute yazmayı sınırda durdurur, dolayısıyla kullanıcı bunu
   * yazarak aşamaz. Sayacın "aşıldı" hâli (kırmızı) yine de var, çünkü
   * **dışarıdan gelen değer** sınırı aşabilir: sunucudan yüklenen eski bir not
   * ya da sonradan düşürülmüş bir sınır. O metni kesmek veya gönderimi kapatmak
   * form katmanının işi — Textarea kullanıcının yazdığını silmez.
   *
   * `showCharacterCount` olmadan da verilebilir; o zaman yalnız native sınır
   * uygulanır, sayaç görünmez.
   */
  maxLength?: number
  /**
   * Kutuyu devre dışı bırakır.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa alan `disabled`
   * verilmez, hiç render edilmez. Bu prop "şu an yazılamaz" içindir — örneğin
   * moderasyon kararı gönderilirken notun kilitlenmesi.
   *
   * Yazılamayan ama okunması/kopyalanması gereken metinde `readOnly` kullanın.
   *
   * Textarea gerçek bir native `<textarea>` render eder; burada `toBeDisabled()`
   * doğru matcher'dır (Base UI kontrollerinin aksine).
   *
   * Native attribute yeniden bildiriliyor: react-docgen onu (component
   * imzasında varsayılanı olduğu için) prop sayıyor, açıklamasız bırakılırsa
   * Controls panelinde boş görünüyor.
   *
   * @default false
   */
  disabled?: boolean | undefined
}

/**
 * Tarih aralığı filtresinin değeri (`FilterDefinition.type === 'dateRange'`).
 *
 * İki ucu da opsiyonel çünkü **yarım aralık geçerli bir sorudur**: "1 Mayıs'tan
 * beri" ile "1 Mayıs'a kadar" farklı filtrelerdir, üstelik kullanıcı takvimde
 * ilk tıklamayı yaptığı anda aralık zaten yarımdır ve o hâlde de render edilir.
 * Boş nesne (`{}`) "aralık yok" demektir; `FilterBar` onu aktif filtre saymaz.
 *
 * Gün hassasiyetinde (`ISODate`), saat değil: "3 Mayıs'ta eklenen ilanlar"
 * sorusunun saat dilimi yoktur. `ISODateTime` kullanmak aynı günü makineye göre
 * iki farklı güne bölerdi — reponun saat dilimi tuzağının filtre hâli.
 */
export interface DateRange {
  /** Aralığın başlangıcı, bu gün **dahil**. Verilmezse alt sınır yok. */
  from?: ISODate
  /** Aralığın sonu, bu gün **dahil**. Verilmezse üst sınır yok. */
  to?: ISODate
}

export interface DateRangePickerProps extends FieldMetaProps {
  /**
   * Seçili aralık. Kontrollüdür: seçimi picker değil çağıran tutar.
   *
   * Yarım aralık geçerlidir — `from` seçilip `to` seçilmemiş hâl, kullanıcının
   * takvimde ilk tıklamayı yaptığı andır ve o hâlde de render edilir.
   */
  value: DateRange
  /** Seçilebilecek en erken gün. Öncesi takvimde kapalı görünür. */
  min?: ISODate
  /**
   * Seçilebilecek en geç gün. Sonrası takvimde kapalı görünür.
   *
   * Geleceğe kapalı filtrelerde (dashboard, audit log) bugünü verin — ama sabit
   * bir fixture'da `new Date()` **kullanmayın**: değer dışarıdan gelmeli, yoksa
   * story her gün farklı render edilir.
   */
  max?: ISODate
  /**
   * Alanı devre dışı bırakır; takvim açılamaz.
   *
   * **Yetki için kullanmayın**: kullanıcının yetkisi yoksa alan `disabled`
   * verilmez, hiç render edilmez. Bu prop "şu an seçilemez" içindir.
   *
   * @default false
   */
  disabled?: boolean
  /**
   * Takvimin yanında tek tıkla seçilen hazır aralıklar ("Son 7 gün", "Bu ay").
   *
   * Aralıklar burada **hesaplanmış hâlde** gelir; picker "son 7 gün"ün ne
   * olduğunu bilmez ve bilmemelidir — hesabı "şimdi"ye dayanır ve component
   * saati kendi okursa aynı story dün ile bugün farklı render edilir.
   */
  presets?: Array<{ label: string; value: DateRange }>
  /**
   * Aralık değiştiğinde çalışır. Kullanıcı ilk günü seçtiğinde de çağrılır —
   * o an `to` boştur.
   */
  onValueChange?: (value: DateRange) => void
}

export interface TooltipProps {
  /**
   * Balonda gösterilecek içerik.
   *
   * **Tetikleyicinin erişilebilir adıyla yakından eşleşmelidir.** Tooltip ekran
   * okuyucuya hiçbir şey söylemez — Base UI bunu bilerek yapmaz. Buraya
   * etiketten farklı bir bilgi koyarsanız o bilgi ekran okuyucu ve dokunmatik
   * kullanıcılara **hiç ulaşmaz**. Yani "Arşivle" butonunun tooltip'i "Arşivle"
   * yazar; "bu işlem 30 gün sonra geri alınamaz" görünür metne veya `Alert`'e
   * yazılır.
   */
  content: ReactNode
  /**
   * Tooltip'i tetikleyen element. Tek bir React element olmalı — Base UI
   * `render` ile onun üstüne biner, sarmalayıcı bir kutu eklemez.
   *
   * Kendi erişilebilir adını taşımalıdır (`IconButton`'ın `label`'ı gibi);
   * tooltip o adın yerine geçmez.
   */
  children: ReactElement
  /**
   * Balonun tercih edilen yönü. Ekrana sığmazsa Base UI kendiliğinden çevirir.
   * @default 'top'
   */
  placement?: 'top' | 'right' | 'bottom' | 'left'
  /**
   * Balon açılmadan önce beklenecek süre (ms).
   *
   * Gecikme Provider'da yönetilir: ilk tooltip açıldıktan sonra komşuları
   * gecikmesiz açılır — toolbar'da ikondan ikona gezerken her seferinde
   * beklemek sinir bozucu olurdu.
   *
   * @default 400
   */
  delayMs?: number
  /**
   * Tooltip'i tamamen kapatır; `children` sarmalanmadan olduğu gibi render edilir.
   *
   * Etiketin zaten görünür olduğu yerlerde (geniş ekranda metinli buton) işe
   * yarar: aynı metni bir de balonda tekrar etmenin anlamı yok.
   *
   * @default false
   */
  disabled?: boolean
}

export interface AvatarProps {
  /**
   * Görsel adresi. Yüklenemezse baş harflere düşülür — bozuk resim ikonu
   * gösterilmez. Silinmiş avatar'lar ve fixture görselleri için önemli.
   */
  src?: string
  /**
   * Kullanıcının tam adı. Baş harfler bundan türetilir (Türkçe kurallarıyla:
   * `i` → `İ`).
   *
   * Zorunludur ama `alt` olarak **kullanılmaz**: avatar dekoratiftir ve yanında
   * zaten ad yazar; `alt` verilseydi ekran okuyucu adı iki kez okurdu.
   */
  name: string
  /**
   * Avatar çapı. Tablo satırında `sm`, kartta `md`, kullanıcı detayında `lg`/`xl`.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Sağ altta gösterilen durum noktası. Verilmezse nokta hiç çıkmaz.
   *
   * Renk tek başına gösterge değildir: nokta `role="img"` ve Türkçe
   * `aria-label` ile duyurulur ("Çevrimiçi").
   */
  status?: 'online' | 'offline' | 'busy'
}

export interface SpinnerProps {
  /**
   * Halka çapı. Buton içinde `sm`, bölüm ortasında `md`/`lg`.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Neyin beklendiğini söyleyen metin ("İlanlar yükleniyor").
   *
   * Zorunludur: ekran okuyucu kullanıcısı dönen halkayı göremez, beklenen şeyi
   * yalnız bu metinden öğrenir. Görsel olarak gizlenir ama erişilebilirlik
   * ağacında kalır.
   */
  label: string
}

export interface SkeletonProps {
  /**
   * Yerini tutacağı içeriğin biçimi.
   *
   * - `text`: metin satırı. `lines` ile çok satırlı olur.
   * - `circle`: avatar ve yuvarlak ikonlar.
   * - `rectangle`: görsel, kart, grafik.
   *
   * @default 'text'
   */
  variant?: 'text' | 'circle' | 'rectangle'
  /**
   * CSS genişliği. Gerçek içeriğin ölçüsünü taklit etmeli — Skeleton'ın tek işi
   * veri gelince düzenin zıplamamasıdır.
   *
   * Ham ölçü kuralının istisnası: değer dışarıdan gelir ve iskeletin taklit
   * ettiği içeriğe göre değişir, token'a bağlanamaz.
   */
  width?: string
  /** CSS yüksekliği. `width` ile aynı gerekçe. */
  height?: string
  /**
   * `variant="text"` iken satır sayısı. Son satır bilerek kısa çizilir —
   * gerçek paragraflar da öyle biter.
   *
   * Diğer varyantlarda yok sayılır.
   */
  lines?: number
}

export interface ModalProps {
  /** Dialog'un görünürlüğü. Kontrollüdür: Modal kendi açıklığını tutmaz. */
  open: boolean
  /**
   * Dialog'un başlığı ve **erişilebilir adı**.
   *
   * Zorunludur ve atlanamaz: başlıksız bir modal ekran okuyucuda yalnız "dialog"
   * diye okunur ve kullanıcı nereye düştüğünü anlamaz.
   */
  title: string
  /** Başlığın altındaki açıklama; dialog'un `aria-describedby`'si olur. */
  description?: string
  /** Dialog gövdesi. Boş bırakılabilir — başlıkla footer arasında boş bant kalmaz. */
  children: ReactNode
  /**
   * Alt şerit; genelde eylem butonları. Verilmezse şerit hiç render edilmez.
   *
   * Butonların sırasını ve tonunu çağıran belirler — Modal "onayla/vazgeç"
   * kalıbını dayatmaz. Geri alınamayan bir eylemi onaylatıyorsanız
   * `ConfirmDialog` kullanın.
   */
  footer?: ReactNode
  /**
   * Dialog genişliği. `sm` kısa onaylar, `md` formlar, `lg`/`xl` tablo ve
   * galeri gibi geniş içerikler için.
   *
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Dışarı tıklamanın dialog'u kapatıp kapatmayacağı.
   *
   * Veri kaybı riski olan formlarda `false` verin: yanlışlıkla dışarı tıklayıp
   * doldurulmuş formu kaybetmek kötü bir sürprizdir. `Escape` bundan
   * etkilenmez — klavye kullanıcısının çıkışı her zaman açık kalmalı.
   *
   * @default true
   */
  closeOnBackdrop?: boolean
  /**
   * Açıklık değiştiğinde çalışır: kapatma butonu, `Escape` ve (izinliyse)
   * dışarı tıklama hepsi buraya çıkar.
   *
   * Base UI'ın ikinci `eventDetails` argümanı sarmalanıp ayıklanır; yalnız
   * `open` gelir.
   */
  onOpenChange: (open: boolean) => void
}

export interface DrawerProps {
  /** Panelin görünürlüğü. Kontrollüdür: Drawer kendi açıklığını tutmaz. */
  open: boolean
  /**
   * Panelin başlığı ve **erişilebilir adı**. Modal ile aynı gerekçeyle zorunlu.
   */
  title: string
  /** Panel gövdesi. Taşarsa kendi içinde kaydırılır, sayfayı itmez. */
  children: ReactNode
  /** Alt şerit; genelde "Uygula" / "Temizle" gibi eylemler. Verilmezse render edilmez. */
  footer?: ReactNode
  /**
   * Panelin açılacağı kenar.
   *
   * - `right`: varsayılan. Audit log detayı, yan bilgi paneli.
   * - `left`: mobil navigasyon çekmecesi.
   * - `bottom`: mobilde tercih edilir — başparmakla erişilir ve iOS ana
   *   çubuğunun güvenli alanı hesaba katılır.
   *
   * @default 'right'
   */
  side?: 'left' | 'right' | 'bottom'
  /**
   * Panelin kalınlığı (yan kenarlarda genişlik, altta yükseklik).
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Açıklık değiştiğinde çalışır: kapatma butonu, `Escape` ve dışarı tıklama
   * buraya çıkar. Base UI'ın ikinci argümanı ayıklanır.
   */
  onOpenChange: (open: boolean) => void
}

export interface ToastAction {
  /** Butonun görünür metni. Eylemi söyler ("Geri al"), "Tamam" demez. */
  label: string
  /**
   * Basıldığında çalışır. Toast'u kapatmak çağıranın işi — eylem başarısız
   * olursa bildirim ayakta kalıp sonucu gösterebilmeli.
   */
  onClick: () => void
}

export interface ToastProps {
  /** Bildirimin görünürlüğü. Kontrollüdür: Toast kendi açıklığını tutmaz. */
  open: boolean
  /** Ne olduğunu söyleyen kısa metin. "İlan onaylandı". */
  title: string
  /** Ek ayrıntı. Toast kaybolur — buraya kaçırılmaması gereken bilgi yazmayın. */
  description?: string
  /**
   * Bildirimin anlamı. İkonu, rengini ve **duyurulma biçimini** belirler:
   *
   * - `danger`: `role="alert"` + `aria-live="assertive"`, anında duyurulur ve
   *   **otomatik kapanmaz** — hata mesajı kullanıcı okumadan kaybolmamalı.
   * - `success` / `warning` / `info`: `role="status"` ile kibarca bildirilir,
   *   `durationMs` dolunca kapanır.
   *
   * @default 'info'
   */
  tone?: 'success' | 'warning' | 'danger' | 'info'
  /** Sağda gösterilen tek eylem ("Geri al"). Toast eylemi kendi uydurmaz. */
  action?: ToastAction
  /**
   * Otomatik kapanmadan önceki süre (ms). Fareyle üzerine gelindiğinde sayaç
   * durur — okurken kaybolması sinir bozucudur.
   *
   * `0` veya negatif değer otomatik kapanmayı iptal eder. `tone="danger"`'da
   * bu prop zaten yok sayılır.
   *
   * @default 5000
   */
  durationMs?: number
  /**
   * Açıklık değiştiğinde çalışır: kapatma butonu ve süre dolması buraya çıkar.
   * Toast kendini kaldırmaz, yalnız haber verir.
   */
  onOpenChange: (open: boolean) => void
}

export interface TabItem {
  /** Benzersiz kimlik; `TabsProps.value` bununla eşlenir. */
  id: string
  /** Sekmenin görünür metni. Kısa tutun — taşan şerit yatay kaydırılır. */
  label: string
  /** Sekme adının yanındaki sayaç veya kısa etiket ("3", "Yeni"). */
  badge?: string | number
  /**
   * Sekmeyi seçilemez kılar.
   *
   * **Yetki için kullanmayın**: kullanıcının göremeyeceği bir bölüm sekme
   * olarak hiç listelenmemelidir — kilitli sekme, olduğunu bildiği ama
   * açamadığı bir kapıdır.
   *
   * @default false
   */
  disabled?: boolean
  /**
   * Sekmenin paneli.
   *
   * Tüm panellerin içeriği **her render'da oluşturulur**; ağır içerikleri
   * (grafik, tablo) tembel yüklemek çağıranın işi.
   */
  content: ReactNode
}

export interface TabsProps {
  /** Seçili sekmenin `TabItem.id`'si. Kontrollüdür: seçimi Tabs değil çağıran tutar. */
  value: string
  /**
   * Sekmeler ve panelleri, verilen sırayla. Taşarsa yatay kaydırılır, kesilmez.
   *
   * Çok sayıda bölüm varsa mobilde `Accordion` daha uygun: dar ekranda sekme
   * başlıkları sığmaz.
   */
  items: TabItem[]
  /**
   * - `underline`: seçili sekmenin altında çizgi. Sayfa içi bölümler.
   * - `pill`: dolgulu hap. Küçük, kapalı gruplarda (görünüm değiştirici).
   * - `contained`: kutulu sekmeler; panel ile birleşik bir yüzey oluşturur.
   *
   * Her üçünde de seçili sekme yalnız renkle değil, çizgi/dolgu ile de bellidir.
   *
   * @default 'underline'
   */
  variant?: 'underline' | 'pill' | 'contained'
  /**
   * Sekme şeridinin yönü. `vertical` geniş ekranda uzun sekme listesi için.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * Sekme değiştiğinde çalışır.
   *
   * Aktivasyon **manueldir**: ok tuşu yalnız odağı taşır, bu callback'i Enter
   * veya Space tetikler. Otomatik olsaydı 5 sekme arasında ok tuşuyla gezinmek
   * 5 ayrı veri isteği doğururdu.
   */
  onValueChange: (value: string) => void
}

export interface AccordionItem {
  /** Benzersiz kimlik; `expandedIds` bununla eşlenir. */
  id: string
  /** Bölümün başlığı; açma düğmesinin erişilebilir adı olur. */
  title: string
  /** Başlığın altında, bölüm kapalıyken de görünen özet. */
  description?: string
  /** Bölümün içeriği. Yalnız açıkken görünür. */
  content: ReactNode
  /**
   * Bölümü açılamaz kılar.
   *
   * **Yetki için kullanmayın**: yetkisiz bölüm `items`'a hiç konmamalıdır.
   *
   * @default false
   */
  disabled?: boolean
}

export interface AccordionProps {
  /** Bölümler, verilen sırayla. */
  items: AccordionItem[]
  /**
   * Açık bölümlerin id'leri. Kontrollüdür: açıklığı Accordion değil çağıran
   * tutar — hangi bölümün açık geleceği ekrana göre değişir.
   */
  expandedIds: string[]
  /**
   * Aynı anda birden çok bölümün açık kalabilmesi.
   *
   * `false` iken yeni bölüm açılınca öncekiler kapanır; uzun içeriklerde
   * kullanıcının kaybolmasını engeller.
   *
   * @default true
   */
  allowMultiple?: boolean
  /**
   * - `separated`: bölümler arası boşluklu, her biri kendi kartında.
   * - `bordered`: bitişik bölümler, aralarında tek çizgi. Yoğun listeler.
   * - `plain`: çerçevesiz. Zaten kartın içindeyken.
   *
   * @default 'separated'
   */
  variant?: 'separated' | 'bordered' | 'plain'
  /** Bir bölüm açılıp kapandığında açık id listesinin **tamamıyla** çalışır. */
  onExpandedIdsChange: (ids: string[]) => void
}

export interface DividerProps {
  /**
   * Ayırıcının yönü. `vertical` yalnız yatay kaplarda (toolbar) anlamlıdır ve
   * kabın yüksekliğini alır.
   *
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * Ayırıcının ortasında görünen metin; ayırıcının `aria-label`'ı olur.
   *
   * Metin ayırıcının bir parçasıdır, **ayrı bir başlık değildir** — bölüm
   * başlığı gerekiyorsa `PageHeader` ya da bir `<h*>` kullanın; ekran okuyucu
   * kullanıcısı başlık listesinde bunu göremez.
   *
   * `vertical` yönde yok sayılır.
   */
  label?: string
}

export interface AlertProps {
  /**
   * Bildirimin anlamı. Rengin yanı sıra **ikonu ve duyurulma biçimini** de
   * belirler:
   *
   * - `danger` / `warning`: `role="alert"` — ekran okuyucu anında duyurur,
   *   kullanıcının işini böler. Gerçekten acil olmayan şeye vermeyin.
   * - `success` / `info`: `role="status"` — kibarca, sıra gelince bildirilir.
   *
   * Her ton kendi ikonunu taşır: renk tek başına gösterge olamaz, renk körü
   * kullanıcı hatayı ikondan ve metinden ayırt eder.
   */
  tone: 'success' | 'warning' | 'danger' | 'info'
  /** Ne olduğunu tek cümlede söyleyen başlık. "Hata" değil, "İlan yüklenemedi". */
  title: string
  /** Ne yapılabileceği. Yığın izi veya ham sunucu mesajı değil. */
  description?: string
  /**
   * Dolgu stili.
   *
   * - `soft`: açık zemin. Sayfa içinde varsayılan.
   * - `solid`: dolu zemin, en yüksek vurgu. Sayfanın en tepesindeki tek uyarı.
   * - `outline`: yalnız kenarlık. Zaten renkli bir zeminin üstündeyken.
   *
   * @default 'soft'
   */
  variant?: 'solid' | 'soft' | 'outline'
  /** Sağda gösterilen eylem (genelde bir buton). Alert eylemi kendi uydurmaz. */
  action?: ReactNode
  /**
   * Kapatma (×) butonu gösterir. `onDismiss` ile birlikte verilmelidir.
   *
   * Kalıcı bir sorunu (yetki yok, veri bayat) kapatılabilir yapmayın: kullanıcı
   * kapatır, sorun durur.
   *
   * @default false
   */
  dismissible?: boolean
  /**
   * Kapatmaya basıldığında çalışır. Alert kendini kaldırmaz — görünürlüğü
   * çağıran tutar.
   */
  onDismiss?: () => void
}

export interface NavigationItem {
  /** Benzersiz kimlik; `activeItemId` bununla eşlenir. */
  id: string
  /**
   * Görünür etiket.
   *
   * `collapsed` iken görsel olarak gizlenir ama erişilebilirlik ağacında kalır:
   * daraltılmış menüde bağlantının adı yalnız buradan gelir. (Gizlerken
   * `visibility: hidden` **kullanılmaz** — erişilebilir adı yok eder.)
   */
  label: string
  /** Hedef yol (React Router). Dış bağlantı değil, panel içi rota beklenir. */
  href: string
  /**
   * Satırın ikonu. Dekoratiftir, ekran okuyucudan gizlenir — adı `label` taşır.
   *
   * `collapsed` iken tek görünen şey budur, bu yüzden atlanamaz.
   */
  icon: ReactNode
  /**
   * Satırın sağındaki sayaç (bekleyen ilan, açık şikayet). `0` ise rozet
   * gösterilmez — "sıfır iş" bir bildirim değildir.
   */
  badge?: number
  /**
   * Bu satırın görünmesi için gereken izin.
   *
   * **Filtreyi SidebarNav uygulamaz.** Yetki kontrolü component'in işi değil:
   * kullanıcının izni yoksa satır soluk gösterilmez, `items`'a hiç konmaz —
   * süzme, izinleri bilen sayfa/uygulama katmanının işidir. Bu alan o katmanın
   * süzerken okuduğu bildirimdir ve menü tanımını tek yerde tutar.
   */
  requiredPermission?: AdminPermission
  /**
   * Alt satırlar. Bir çocuk aktifse ebeveyn kendiliğinden açık gelir —
   * kullanıcı hangi bölümde olduğunu göremezse gezinme işe yaramaz.
   */
  children?: NavigationItem[]
}

export interface SidebarNavProps {
  /**
   * Gösterilecek menü satırları, verilen sırayla.
   *
   * **Yetkiye göre süzülmüş hâlde gelir**; `NavigationItem.requiredPermission`
   * bir bildirimdir, kapı değil (bkz. oradaki not).
   */
  items: NavigationItem[]
  /**
   * Aktif satırın `id`'si; `aria-current="page"` ile işaretlenir.
   *
   * Eşleşme yoksa hiçbir satır aktif görünmez — çökmez. Aktif satır bir alt
   * satırsa ebeveyni açılır.
   */
  activeItemId: string
  /**
   * Menüyü yalnız ikonlara daraltır (masaüstü).
   *
   * Etiketler görsel olarak gizlenir ama erişilebilirlik ağacında kalır; daraltma
   * bir görünüm tercihidir, ekran okuyucu kullanıcısını cezalandırmamalı.
   *
   * @default false
   */
  collapsed?: boolean
  /**
   * Mobil çekmecenin açıklığı. Dar ekranda menü kenarda durmaz, `Drawer` olarak
   * açılır.
   *
   * @default false
   */
  mobileOpen?: boolean
  /**
   * Daralt/genişlet düğmesine basıldığında çalışır. Verilmezse düğme hiç
   * görünmez — menü sabit kalır (`AppShell`'in `sidebarMode="fixed"` hâli).
   */
  onCollapsedChange?: (collapsed: boolean) => void
  /** Mobil çekmece kapatıldığında çalışır: bağlantıya tıklama, `Escape`, dışarı tıklama. */
  onMobileOpenChange?: (open: boolean) => void
}

export interface TopBarProps {
  /**
   * Çubukta gösterilen bağlam başlığı (bulunulan bölüm).
   *
   * Sayfanın `<h1>`'i **değildir** — o `PageHeader`'ın işi. İkisi karışırsa
   * ekran okuyucu kullanıcısı aynı sayfada iki başlık duyar.
   */
  title?: string
  /** Global arama kutusunun değeri. Kontrollüdür: değeri TopBar tutmaz. */
  searchValue?: string
  /**
   * Oturumu açık admin; avatar ve profil menüsü bundan kurulur.
   *
   * Yalnız **gösterim** içindir. Kullanıcının rolüne bakıp menü öğesi
   * gizlemeyin: yetkiye göre süzme sayfa katmanının işi.
   */
  currentUser: UserAccount
  /**
   * Zil ikonundaki okunmamış bildirim sayısı. `0` veya verilmemişse rozet
   * çıkmaz — "sıfır bildirim" bir bildirim değildir.
   */
  notificationsCount?: number
  /**
   * Arama kutusuna yazıldığında çalışır. Verilmezse arama kutusu hiç render
   * edilmez.
   *
   * Anında çağrılır; geciktirme (debounce) sayfa katmanının işidir — TopBar
   * veri çekmez ve neyin pahalı olduğunu bilmez.
   */
  onSearchChange?: (value: string) => void
  /**
   * Mobildeki hamburger düğmesine basıldığında çalışır; genelde `SidebarNav`'ın
   * `mobileOpen`'ını açar. Verilmezse düğme görünmez.
   */
  onMenuClick?: () => void
  /** Avatara/profil alanına tıklandığında çalışır. Verilmezse alan tıklanamaz. */
  onProfileClick?: () => void
}

export interface AppShellProps {
  /**
   * Kenar menüsü; genelde bir `SidebarNav`.
   *
   * `ReactNode` olarak alınır çünkü AppShell yalnız **düzendir**: menünün
   * daraltılmışlığını, yetkiye göre süzülmüş satırlarını ve aktif rotasını
   * bilmez, bilmemeli. `SidebarNavProps`'u buraya kopyalamak iki component'i
   * birbirine kilitlerdi.
   */
  navigation: ReactNode
  /** Üst çubuk; genelde bir `TopBar`. `navigation` ile aynı gerekçeyle `ReactNode`. */
  topBar: ReactNode
  /**
   * Ana içerik alanı. Sayfanın kendisi buraya girer.
   *
   * `<main>` landmark'ı ve "içeriğe atla" bağlantısının hedefi AppShell'in
   * sorumluluğudur — klavye kullanıcısı her sayfada menüyü baştan geçmemeli.
   */
  children: ReactNode
  /**
   * - `fixed`: menü hep açık, daraltılamaz. Ekranın genişliği yetiyorsa en az
   *   sürprizli düzen.
   * - `collapsible`: daralt/genişlet düğmesi görünür; geniş tabloların (audit
   *   log, ilan listesi) nefes alması için yer açılabilir.
   *
   * Dar ekranda ikisi de aynıdır: menü kenardan kalkar ve çekmeceye döner.
   *
   * @default 'fixed'
   */
  sidebarMode?: 'fixed' | 'collapsible'
}

export interface BreadcrumbItem {
  /**
   * Görünür metin. Etiketi kısa tutun.
   *
   * **Dar ekranda kısalmaz, sarar** (`overflow-wrap: anywhere`). Kısaltma
   * bilerek uygulanmadı: kırpılmış bir yol ("Kadıköy Merkez'de 3+1 De…")
   * kullanıcıya hangi kayıtta olduğunu söylemez, sarma ise iki satır yer alıp
   * bilginin tamamını verir — kırpma bilgi kaybettirir, sarma yalnız yer
   * harcar. Etiketi kısa tutmak yine de çağıranın işi; sarma bir çözüm değil,
   * güvenlik ağı.
   */
  label: string
  /**
   * Hedef yol. Verilmezse öğe bağlantı değil, düz metin olur.
   *
   * Son kırıntı (bulunulan sayfa) `href` **almamalıdır**: kullanıcıyı bulunduğu
   * yere götüren bir bağlantı gürültüdür ve ekran okuyucuda da öyle duyulur.
   */
  href?: string
}

export interface PageHeaderProps {
  /**
   * Sayfanın başlığı ve **`<h1>`'i**. Her ekranda tek tanedir.
   *
   * `TopBar.title` ile karıştırmayın: o bağlam çubuğudur, bu sayfanın adı.
   */
  title: string
  /** Başlığın altında, sayfanın ne işe yaradığını söyleyen bir-iki cümle. */
  description?: string
  /**
   * Kırıntı yolu; başlığın **üstünde** render edilir.
   *
   * `<nav aria-label="Sayfa yolu">` içinde sıralı liste olur. Bulunulan sayfa
   * son öğedir ve `aria-current="page"` alır; oraya `href` vermeyin.
   */
  breadcrumbs?: BreadcrumbItem[]
  /**
   * Sayfanın ana eylemi ("Yeni ilan"). Sağ üstte, en yüksek vurguyla.
   *
   * Bir ekranda tek tane olmalı. Yetkisi olmayan kullanıcıya `disabled` buton
   * vermeyin — prop'u hiç geçmeyin; başlık ne verilirse onu gösterir.
   */
  primaryAction?: ReactNode
  /**
   * İkincil eylemler ("Dışa aktar", "Yenile"). Ana eylemin solunda.
   *
   * **Dar ekranda taşarsa alt satıra sarar; "…" menüsüne toplanmaz.** Prop opak
   * bir `ReactNode` olduğu sürece toplanamaz da: başlık içinde kaç eylem
   * olduğunu **sayamaz** (`Children.toArray` fragment/dizi/tek düğüm ayrımını
   * tahmine bırakır), hangisinin taşacağını ölçemez ve hangisini menüye alacağını
   * seçemez — üstelik repoda menü primitive'i yok (Select/MultiSelect var,
   * DropdownMenu yok).
   *
   * Menü gerekiyorsa onu **sayfa katmanı kurar** ve buraya hazır geçer; sayfa
   * kaç eylemi olduğunu bilen taraftır. Menüyü component'in işi yapmak isteniyorsa
   * prop `PageHeaderAction[]` gibi **sayılabilir** bir sözleşmeye çevrilmeli ve
   * bir menü primitive'i eklenmeli — ikisi bir arada, ayrı ayrı değil.
   */
  secondaryActions?: ReactNode
  /**
   * Başlığın yanındaki bağlam bilgisi: durum rozeti, ilan no, son güncelleme.
   *
   * Eylem koymayın — `meta` okunacak bilgidir, tıklanacak değil.
   */
  meta?: ReactNode
}

/**
 * `DataTable`'ın tek bir sütunu.
 *
 * Manifest'te prop olarak görünmez — `DataTableProps.columns`'un içidir — ama
 * tabloyu kullanan her ekran bu nesneleri **elle yazar**; sözleşmesi çağıranı
 * doğrudan ilgilendirir.
 */
export interface ColumnDef<T> {
  /**
   * Sütunun benzersiz kimliği; `DataTableProps.sort.columnId` bununla eşlenir.
   *
   * `accessor`'dan **türetilmez**, çünkü her sütun tek bir alana bağlı değil:
   * eylem kolonunun ve birleşik "konum" (il/ilçe/mahalle) sütununun accessor'ı
   * yoktur ama sıralanabilir bir kimliği olabilir.
   */
  id: string
  /**
   * Başlık hücresinin içeriği.
   *
   * `ReactNode` çünkü başlık her zaman düz metin değildir (ikon + metin,
   * "tümünü seç" kutusu). Etiket buraya **hazır** gelir: tablo
   * `domain/labels.ts`'e bakmaz — aynı kolonun adı listede ve kuyrukta farklı
   * yazılamasın diye sözlüğü çağıran okur.
   */
  header: ReactNode
  /**
   * Hücre değerini okuyacak alan adı. `cell` verilmezse hücre bu alanın değerini
   * `String()` ile olduğu gibi basar; ikisi de yoksa hücre boş kalır.
   *
   * `keyof T` olduğu için yazım hatası **derlenmez** — düz `string` olsaydı
   * yanlış alan adı sessizce boş hücre üretirdi. Biçimlenmesi gereken değerlerde
   * (para, tarih, enum etiketi) yetmez ve kullanılmamalı: ham `String()` bir
   * `Money`'yi `[object Object]`, bir enum'u da İngilizce anahtarı olarak yazar.
   */
  accessor?: keyof T
  /**
   * Hücreyi çizen fonksiyon; verilirse `accessor`'ın **önüne geçer**.
   *
   * Satırın tamamını alır çünkü hücre çoğu zaman tek alandan fazlasını okur
   * (durum rozeti + revizyon, kapak fotoğrafı + başlık). Biçimleme burada
   * yapılır: `utils/formatCurrency` ve `utils/formatDateTime` çağrılır, tablo
   * kendi `Intl`'ini kurmaz — kurarsa sayı ve tarih makineye göre değişir.
   */
  cell?: (row: T) => ReactNode
  /**
   * Başlığı sıralama düğmesine çevirir; basılınca `onSortChange` çalışır ve
   * aynı sütuna tekrar basmak yönü çevirir.
   *
   * Sıralamayı **tablo yapmaz**: niyeti bildirir, sıralı veriyi `rows`'ta geri
   * bekler. `onSortChange` bağlanmamışsa düğme çıkar ama hiçbir şey olmaz —
   * ikisini birlikte verin.
   *
   * @default false
   */
  sortable?: boolean
  /**
   * Sütunun kullanıcı tarafından gizlenebileceğini bildirir (brifing 2.3:
   * "görünür kolonları seçme").
   *
   * Bir **bildirimdir, kapı değil** — `NavigationItem.requiredPermission` ile
   * birebir aynı desen: kolon seçicisini kuran ve `columns`'u süzen sayfa
   * katmanıdır, tablo kendi sütununu gizlemez ve bu alana bugün **hiç bakmaz**.
   * Yani tek başına işaretlemek hiçbir şey yapmaz; sütun seçicisi henüz hiçbir
   * ekranda yok (Faz 3'ün açık kararı — repoda menü primitive'i de yok).
   *
   * @default false
   */
  hideable?: boolean
  /**
   * Sütunun CSS genişliği (`'12rem'`, `'20%'`). Verilmezse genişlik içeriğe göre
   * dağılır.
   *
   * Ham ölçü kuralının istisnası: değer sütunun taşıdığı içeriğe göre değişir ve
   * token'a bağlanamaz — `SkeletonProps.width` ile aynı gerekçe.
   */
  width?: string
  /**
   * Hücrenin ve başlığın hizası.
   *
   * Sayısal sütunlarda (fiyat, sayaç) `end` verin: basamaklar alt alta hizalanır
   * ve "hangisi büyük" sorusu okumadan, gözle cevaplanır. `start`/`end`
   * mantıksal yönlerdir — `left`/`right` değil.
   *
   * @default 'start'
   */
  align?: 'start' | 'center' | 'end'
}

export interface DataTableProps<T extends { id: string }> {
  /**
   * Gösterilecek satırlar; **sıralanmış ve sayfalanmış hâlde** gelir. Tablo veriyi
   * çekmez, süzmez ve sıralamaz — yalnız gösterir ve niyeti dışarı bildirir.
   */
  rows: T[]
  /** Sütun tanımları, verilen sırayla render edilir. */
  columns: ColumnDef<T>[]
  /** Satırın benzersiz anahtarı. Verilmezse `row.id` kullanılır. */
  rowKey?: (row: T) => string
  /**
   * Satır seçim kutusunun erişilebilir etiketi.
   *
   * Brifingden sapma: eklendi. Gerekçe: etiket verilmezse ekran okuyucu
   * kullanıcısı 12 satırda da aynı metni duyar ve hangisini seçtiğini anlamaz.
   * Verilmezse satır numarasına düşülür — jenerik ama en azından benzersiz.
   */
  rowLabel?: (row: T) => string
  /**
   * Satır yüksekliği. `compact` aynı ekrana daha çok satır sığdırır ve uzun
   * listelerde taramayı hızlandırır; dokunma hedefini küçülttüğü için mobilde
   * `comfortable` tercih edilir.
   *
   * @default 'comfortable'
   */
  density?: 'comfortable' | 'compact'
  /**
   * Satırların birbirinden nasıl ayrıldığı. `striped` çok sütunlu tabloda gözün
   * satırı kaydırmasını önler.
   *
   * @default 'plain'
   */
  visualStyle?: 'plain' | 'bordered' | 'striped'
  /**
   * Dar ekranda ne olacağı.
   *
   * - `scroll`: tablo yatay kaydırılır. Sütunların kendisi önemliyse (audit log).
   * - `cards`: her satır karta dönüşür. Okunabilirlik önemliyse (ilan listesi).
   *   `renderMobileCard` ile birlikte verilmelidir; verilmezse tablo görünümünde kalır.
   *
   * @default 'scroll'
   */
  mobileMode?: 'scroll' | 'cards'
  /**
   * Başlık korunur, satırlar skeleton olur — veri gelince düzen zıplamaz.
   * @default false
   */
  loading?: boolean
  /** Verilirse satırların yerine hata bloğu gösterilir ve `rows` yok sayılır. */
  error?: UiError
  /**
   * `error.retryable` iken hata bloğundaki "tekrar dene" butonunu çalıştırır.
   *
   * `error` ile **birlikte** verilmeli: `retryable: true` deyip bu kanalı
   * bağlamamak, basınca hiçbir şey yapmayan bir buton çıkarırdı — bu yüzden
   * tablo `onRetry` yoksa butonu **hiç göstermez**, `retryable` ne derse desin.
   * (`ChartCardProps.onRetry` ile aynı kural; ikisi tek kararın iki yüzü.)
   *
   * Yokluğu bir durum (tekrar denenemeyen hata), dolayısıyla `meta.args`'a
   * konmaz.
   */
  onRetry?: () => void
  /**
   * Kayıt yokken satırların yerine gösterilir. Verilmezse yalın bir "Kayıt
   * bulunamadı" yazar; filtre sonucu boşsa `EmptyState` ile filtreyi temizleme
   * eylemi geçilmelidir — boşluğun sebebi kullanıcının atacağı adımı değiştirir.
   */
  emptyState?: ReactNode
  /**
   * Satır seçim kutularını ve başlıktaki "tümünü seç" kutusunu açar.
   * @default false
   */
  selectable?: boolean
  /** Seçili satır anahtarları. Kontrollüdür: seçimi tablo değil çağıran tutar. */
  selectedIds?: string[]
  /**
   * Sıralı sütun ve yön. Yalnız görünümü belirler — sıralamayı tablo yapmaz,
   * `onSortChange` ile bildirir ve sıralı veriyi `rows`'ta geri bekler.
   */
  sort?: { columnId: string; direction: 'asc' | 'desc' }
  /**
   * Kaydırırken başlık üstte kalır. Uzun listede sütunun ne olduğu unutulmaz.
   * @default false
   */
  stickyHeader?: boolean
  /** Seçim değiştiğinde yeni anahtar listesinin tamamıyla çalışır. */
  onSelectionChange?: (ids: string[]) => void
  /**
   * Sıralanabilir bir başlığa basıldığında çalışır. Aynı sütuna tekrar basmak
   * yönü çevirir.
   */
  onSortChange?: (sort: { columnId: string; direction: 'asc' | 'desc' }) => void
  /**
   * Satıra tıklandığında çalışır; verilirse satır tıklanabilir görünür. Seçim
   * kutusuna tıklamak bunu tetiklemez.
   */
  onRowClick?: (row: T) => void
  /** `mobileMode="cards"` iken satırın kart görünümü. */
  renderMobileCard?: (row: T) => ReactNode
}

/**
 * Sayısal aralık filtresinin değeri (`FilterDefinition.type === 'numberRange'`).
 *
 * Brifingden sapma: eklendi. Gerekçe: brifing `numberRange` filtre tipini
 * tanımlıyor ama `FilterValue` birleşiminde aralık ifade edebilecek bir üye
 * bırakmamış — tek bir `number` "en az 500.000" ile "en çok 500.000" arasındaki
 * farkı taşıyamaz. `dateRange` için `DateRange` nesnesi zaten var; bu onun
 * sayısal simetriğidir.
 */
export interface NumberRange {
  /** Alt sınır, **dahil**. Verilmezse alt sınır yok — yalnız `max` "en çok X" der. */
  min?: number
  /** Üst sınır, **dahil**. Verilmezse üst sınır yok — yalnız `min` "en az X" der. */
  max?: number
}

export type FilterValue =
  string | number | boolean | string[] | DateRange | NumberRange | null | undefined

export interface FilterDefinition {
  /** `values` sözlüğündeki anahtar. `onChange`'in ilk argümanı olarak geri döner. */
  id: string
  /** Alanın görünür etiketi. `numberRange`'de grubun (fieldset) başlığı olur. */
  label: string
  /**
   * Hangi kontrolün render edileceğini ve `values[id]`'nin hangi şekli
   * taşıyacağını belirler:
   *
   * - `text` → `string`, Input
   * - `select` → `string`, tekli Select (temizlenebilir)
   * - `multiSelect` → `string[]`, çip gösteren MultiSelect
   * - `numberRange` → `NumberRange`, yan yana iki NumberInput
   * - `dateRange` → `DateRange`, DateRangePicker
   * - `boolean` → `boolean`, Switch
   *
   * Değer beklenen şekilde değilse alan boş kabul edilir, çökmez.
   */
  type: 'text' | 'select' | 'multiSelect' | 'numberRange' | 'dateRange' | 'boolean'
  /** `select` ve `multiSelect` için seçenekler. Diğer tiplerde yok sayılır. */
  options?: SelectOption[]
  /** `text`, `select` ve `multiSelect` için boşken görünen metin. Etiket yerine geçmez. */
  placeholder?: string
}

export interface FilterBarProps {
  /** Gösterilecek filtre alanları, verilen sırayla render edilir. */
  definitions: FilterDefinition[]
  /**
   * Filtrelerin güncel değerleri; `FilterDefinition.id` ile eşlenir.
   *
   * Component kontrollüdür ve kendi kopyasını tutmaz: değer buradan gelir,
   * değişiklik `onChange` ile bildirilir.
   */
  values: Record<string, FilterValue>
  /**
   * - `inline`: alanlar yatay sarmalı satırda. Liste ekranı toolbar'ı.
   * - `stacked`: alanlar alt alta, tam genişlik. Dar kolon veya yan panel.
   * - `drawer`: alanlar Drawer içinde; dışarıda yalnız sayaçlı bir tetikleyici
   *   buton durur. Mobilde tercih edilir.
   *
   * @default 'inline'
   */
  variant?: 'inline' | 'stacked' | 'drawer'
  /**
   * Rozette ve tetikleyicide gösterilen aktif filtre sayısı.
   *
   * Verilmezse `definitions` üzerinden hesaplanır: boş metin, boş dizi, `null`,
   * `undefined`, boş aralık ve `false` aktif sayılmaz. Değer, alanın tipine göre
   * daraltılarak sayılır — kutuda boş görünen bir alan sayaçta da boş sayılır.
   *
   * "Aktif"in tanımı ekrana göre değişiyorsa (varsayılan değerler aktif
   * sayılmasın gibi) üst katman kendi sayısını geçer.
   */
  activeFilterCount?: number
  /**
   * Seçenekler (il, ilçe, kategori) yüklenirken `select` ve `multiSelect`
   * alanlarında spinner gösterir. Metin alanları yazılabilir kalır — seçenek
   * beklerken yazmayı engellemenin sebebi yok.
   *
   * @default false
   */
  loading?: boolean
  /**
   * Tüm alanları ve butonları devre dışı bırakır. Yetki için kullanmayın:
   * kullanıcının yetkisi yoksa FilterBar hiç render edilmemelidir.
   *
   * @default false
   */
  disabled?: boolean
  /** Kayıtlı görünümün adı. Verilirse başlıkta rozet olarak gösterilir. */
  savedViewName?: string
  /** Bir alan değiştiğinde çalışır. Anında çağrılır; geciktirme sayfa katmanının işidir. */
  onChange: (id: string, value: FilterValue) => void
  /** "Temizle"ye basıldığında çalışır. Buton yalnız aktif filtre varken görünür. */
  onClear: () => void
  /**
   * Verilirse filtreler taslak sayılır ve "Uygula" butonu görünür; `onChange`
   * taslağı, `onApply` commit'i bildirir. Verilmezse filtreler canlıdır.
   */
  onApply?: () => void
  /** Verilirse "Görünümü kaydet" butonu görünür ve ad soran satırı açar. */
  onSaveView?: (name: string) => void
}

export interface StatusBadgeProps {
  /**
   * Gösterilecek ilan durumu. Sekiz `ListingStatus` değerinin her birinin kendi
   * zemini vardır; etiket `domain/labels.ts`'ten, renk `status` token'larından
   * gelir — ikisi de component içine gömülmez.
   */
  status: ListingStatus
  /**
   * Dolgu stili.
   *
   * - `solid`: en yüksek vurgu. Tek bir durumun öne çıkması gerekiyorsa.
   * - `soft`: açık zemin, koyu metin. Yoğun listelerde tercih edilir — satır satır
   *   tekrar eden rozet bağırmamalı.
   * - `outline`: yalnız kenarlık. Rozet zaten renkli bir zeminin üstündeyse.
   *
   * @default 'soft'
   */
  variant?: 'solid' | 'soft' | 'outline'
  /**
   * Rozet boyutu. Tablo satırında ve kart üstünde `sm`, detay başlığında `md`.
   * @default 'md'
   */
  size?: 'sm' | 'md'
  /**
   * Etiketin solunda durum renginde küçük bir nokta gösterir.
   *
   * Nokta yalnız tarama hızını artırır, anlamı taşımaz: renk tek başına gösterge
   * değildir ve rozet her zaman metnini de yazar. Bu yüzden ekran okuyucudan
   * gizlenir.
   *
   * @default false
   */
  showDot?: boolean
}

export interface ListingCardProps {
  /**
   * Gösterilecek ilan. Kart veri **çekmez** — brifingin "composites domain
   * verisini görselleştirebilir ancak veri çekmez" kuralı.
   *
   * Kapak `photos`'ta `isCover` ile bulunur, yoksa ilk fotoğrafa düşülür;
   * fotoğrafsız ilan kırık resim değil, açık bir "görsel yok" durumu gösterir —
   * yayına alınmadan önce fark edilmesi gereken bir eksik.
   */
  listing: Listing
  /**
   * Kartın yoğunluğu.
   *
   * - `compact`: tek satırlık özet. Moderasyon kuyruğunda, çok sayıda ilan
   *   arasında hızlı tarama için.
   * - `detailed`: fotoğraf, fiyat, konum ve meta birlikte. İlan listesinde.
   * - `grid`: kare kart, ızgara düzeninde. Dashboard'da.
   *
   * @default 'compact'
   */
  variant?: 'compact' | 'detailed' | 'grid'
  /**
   * Seçili görünüm ve seçim kutusunun işaretli hâli.
   *
   * `onSelectedChange` verilmeden kutu render edilmez; seçim toplu işlem
   * yapılabilen listelere özgüdür.
   *
   * @default false
   */
  selected?: boolean
  /**
   * İlanı dikkat çekilmiş olarak işaretler: sol kenarda kırmızı şerit.
   *
   * Renk tek başına gösterge değildir — kenarlığın **kalınlığı** da değişir.
   * Şikayet almış veya otomatik kontrolden kalmış ilanları listede öne
   * çıkarmak için.
   *
   * @default false
   */
  flagged?: boolean
  /**
   * Moderasyon meta bilgisini gösterir: gönderim zamanı, atanmış moderatör,
   * revizyon.
   *
   * Kuyrukta ve ilan listesinde açılır; dashboard'ın ızgarasında gereksiz
   * gürültüdür.
   *
   * @default false
   */
  showModerationMeta?: boolean
  /**
   * Kartın sağ üstünde, durum rozetinin yanında gösterilen eylemler.
   *
   * Yetkisiz eylemler buraya hiç konmamalıdır: kart yetki bilmez, ne verilirse
   * onu gösterir.
   */
  actions?: ReactNode
  /**
   * Karta tıklandığında çalışır; verilirse kart tıklanabilir görünür. Seçim
   * kutusuna ve `actions` içindeki butonlara tıklamak bunu tetiklemez.
   */
  onClick?: (listing: Listing) => void
  /**
   * Verilirse kartta seçim kutusu görünür ve seçim değiştiğinde çalışır.
   * Verilmezse kutu hiç render edilmez.
   */
  onSelectedChange?: (selected: boolean) => void
}

/**
 * Kullanıcının bu ilan üzerindeki moderasyon yetkileri.
 *
 * Yetki *kimin* yapabileceğini söyler; ilanın durumu *neyin şu an mümkün
 * olduğunu*. İkisi ayrı: `canPause` verilse bile taslak ilan pasife alınamaz.
 * Durum boyutu `domain/moderationActions.ts`'te.
 *
 * Değerler `ROLE_PERMISSIONS`'tan türetilir (`listing:approve` gibi), burada
 * elle uydurulmaz.
 */
export interface ModerationCapabilities {
  /** `listing:approve` — onay eylemi gösterilsin mi? */
  canApprove: boolean
  /** `listing:reject` — red eylemi gösterilsin mi? */
  canReject: boolean
  /** `listing:requestChanges` — düzeltme isteme eylemi gösterilsin mi? */
  canRequestChanges: boolean
  /** `listing:pause` — pasife alma eylemi gösterilsin mi? */
  canPause: boolean
  /** `listing:archive` — arşivleme eylemi gösterilsin mi? */
  canArchive: boolean
}

/** Bir moderasyon kararının sunucuya gidecek yükü. */
export interface ModerationDecisionPayload {
  /** Kararın uygulanacağı ilan. */
  listingId: string
  /**
   * Moderatörün **gördüğü** revizyon; sunucu kararı buna karşı uygular.
   *
   * İyimser eşzamanlılık kilidi: karar verilirken başka bir moderatör ilanı
   * düzenlemişse sunucudaki revizyon artmış olur, gönderilen değerle uyuşmaz ve
   * karar reddedilir. Olmasaydı, iki dakika önceki içeriğe bakarak verilen
   * "onayla" kararı, o arada değişmiş bir ilanı yayına almış olurdu.
   */
  expectedRevision: number
  /**
   * Seçilen red gerekçeleri. Onay ve arşivde boş dizi gelir; red ve düzeltme
   * isteğinde en az bir üye içerir.
   */
  reasons: RejectionReason[]
  /**
   * Moderatörün notu. Red, düzeltme ve pasife almada doludur; onayda
   * kullanıcı yazmadıysa hiç gelmez.
   */
  note?: string
}

/**
 * Bir moderasyon kararının **reddedilme** sebebi.
 *
 * `AsyncState`'in bir üyesi **değil** ve olmamalı: `AsyncState` "veri geldi mi"
 * sorusunu cevaplıyor, bu ise "gönderdiğim karar uygulandı mı" sorusunu. İlan
 * detayı sorunsuz yüklenmişken (`status: 'success'`) karar reddedilebilir; ikisi
 * aynı eksende olsaydı reddedilen bir karar, ekranda duran ilanı hata bloğuna
 * çevirirdi.
 *
 * Brifing 3.5 `ApprovalQueue` ve `ListingReviewPanel` için `Conflict`
 * story'sini zorunlu tutuyor; `ModerationActionBar` çakışmayı **tespit
 * etmiyor**, `expectedRevision` damgasıyla tespit _edilebilir_ kılıyor —
 * cevabı sunucu veriyor ve bu kanaldan geri geliyor.
 */
export type ModerationDecisionError =
  /**
   * Revizyon çakışması: moderatör kararı verirken ilan değişti.
   *
   * Kararın damgalandığı `expectedRevision` sunucudakiyle tutmadı, yani karar
   * **artık var olmayan bir içeriğe** verilmiş. Tekrar denemek doğru değil:
   * aynı damga aynı çakışmayı üretir, damgayı yenilemek ise görülmemiş bir
   * içeriği onaylamak olur. Doğru eylem ilanı yeniden yüklemek ve **yeniden
   * bakmak** — bu yüzden ayrı bir `kind`, `failed`'in bir alt hâli değil.
   *
   * Taslak (gerekçe + not) korunmalı: moderatörün yazdığı not, çakışma yüzünden
   * kaybolmamalı.
   */
  | {
      kind: 'revisionConflict'
      /** Kararın damgalandığı revizyon — moderatörün gördüğü. */
      expectedRevision: number
      /** Sunucudaki güncel revizyon. `expectedRevision`'dan büyüktür. */
      currentRevision: number
    }
  /**
   * Karar uygulanamadı: ağ, sunucu ya da arada değişen yetki.
   *
   * Çakışmadan farkı, içeriğin hâlâ moderatörün gördüğü içerik olması —
   * `UiError.retryable` ise aynı kararı yeniden göndermenin anlamlı olup
   * olmadığını söyler.
   */
  | { kind: 'failed'; error: UiError }

export interface ModerationActionBarProps {
  /** Karar verilecek ilan; `ModerationDecisionPayload.listingId` olarak geri döner. */
  listingId: string
  /**
   * İlanın güncel durumu. Hangi eylemlerin **var olduğunu** belirler: incelemedeki
   * ilanda onay/red/düzeltme, yayındakinde pasife alma, taslakta yalnız arşivleme
   * görünür. Geçersiz eylem `disabled` verilmez, hiç render edilmez.
   */
  status: ListingStatus
  /** İlanın güncel revizyonu; `expectedRevision` olarak yüke konur. */
  revision: number
  /** Kullanıcının yetkileri. Yetkisi olmayan eylem hiç render edilmez. */
  capabilities: ModerationCapabilities
  /**
   * - `stickyBottom`: ekranın altına yapışır, uzun detay sayfasında hep erişilir.
   *   Mobilde safe-area boşluğunu bırakır.
   * - `inline`: normal akışta; kuyrukta kartın altında.
   * - `sideRail`: dikey kolon, tam genişlik butonlar. Geniş ekranda yan panelde.
   *
   * @default 'inline'
   */
  variant?: 'stickyBottom' | 'inline' | 'sideRail'
  /**
   * Süren kararın adı. O butonda spinner çıkar, **diğerleri kapanır**: aynı ilana
   * aynı anda iki karar göndermek, hangisinin son yazdığına bağlı bir sonuç üretir.
   */
  submittingAction?: 'approve' | 'reject' | 'requestChanges' | 'pause' | 'archive'
  /**
   * Son kararın **reddedildiğini** bildirir; çubuk sonucu kendi başına bilemez.
   *
   * Verilirse çubuk kararı uygulanmamış sayar: taslağı (gerekçe + not) tutar ve
   * sebebi gösterir. `revisionConflict`'te tekrar göndermek çözüm olmadığı için
   * kararı yeniden sunmaz — ilanın yeniden yüklenmesi gerekir, o da sayfanın
   * işi.
   *
   * Yokluğu bir durum: karar gönderilmemiş ya da başarılı olmuştur. Bu yüzden
   * `meta.args`'a **konmaz** (AGENTS.md, TS2375).
   */
  decisionError?: ModerationDecisionError
  /** Onay kararı. Kullanıcı onay dialog'unu geçtikten sonra çağrılır. */
  onApprove: (payload: ModerationDecisionPayload) => void | Promise<void>
  /** Red kararı. `reasons` en az bir üye, `note` dolu gelir — çubuk ikisini toplamadan çağırmaz. */
  onReject: (payload: ModerationDecisionPayload) => void | Promise<void>
  /** Düzeltme isteği. Red gibi: `reasons` ve `note` doludur. */
  onRequestChanges: (payload: ModerationDecisionPayload) => void | Promise<void>
  /** Pasife alma. Verilmezse eylem hiç görünmez — `capabilities.canPause` ile birlikte verilmeli. */
  onPause?: (payload: ModerationDecisionPayload) => void | Promise<void>
  /** Arşivleme. Verilmezse eylem hiç görünmez — `capabilities.canArchive` ile birlikte verilmeli. */
  onArchive?: (payload: ModerationDecisionPayload) => void | Promise<void>
}

export interface ImageGalleryProps {
  /**
   * Gösterilecek fotoğraflar. `order` alanına göre sıralanır — dizinin geliş
   * sırasına güvenilmez; kapak `isCover` ile işaretlidir.
   */
  photos: ListingPhoto[]
  /**
   * Büyük görünümdeki fotoğraf. Verilmezse kapak, o da yoksa ilk fotoğraf
   * gösterilir. Kontrollüdür: verildiğinde galeri kendi seçimini tutmaz.
   */
  activePhotoId?: string
  /**
   * - `mosaic`: kapak büyük, diğerleri ızgarada. Genel bakış.
   * - `filmstrip`: tek büyük görsel + altta kaydırılan şerit. Tek tek inceleme.
   * - `split`: görsel solda, moderasyon paneli sağda. Geniş ekranda karar verme.
   *
   * @default 'mosaic'
   */
  variant?: 'mosaic' | 'filmstrip' | 'split'
  /**
   * Fotoğraflar yüklenirken skeleton gösterir. Düzen korunur — veri gelince
   * ızgara zıplamaz.
   *
   * @default false
   */
  loading?: boolean
  /**
   * Fotoğraf bazlı onay/red kontrollerini gösterir. Yetki için kullanılır:
   * kullanıcı görsel moderasyonu yapamıyorsa kontroller hiç render edilmez.
   *
   * `onPhotoApprove`/`onPhotoReject` verilmeden `true` yapmak kontrolleri
   * göstermez — sonuçsuz buton sunmanın anlamı yok.
   *
   * @default false
   */
  allowModeration?: boolean
  /** Büyük görünümdeki fotoğraf değiştiğinde çalışır. */
  onActivePhotoChange?: (photoId: string) => void
  /** Fotoğraf uygun işaretlendiğinde çalışır. */
  onPhotoApprove?: (photoId: string) => void
  /**
   * Fotoğraf uygunsuz işaretlendiğinde çalışır.
   *
   * Gerekçe zorunlu: ilan sahibi "bir fotoğrafınız kaldırıldı" değil, hangisi ve
   * neden olduğunu görmeli. Not opsiyoneldir ve gerekçeyi somutlaştırır.
   */
  onPhotoReject?: (photoId: string, reason: RejectionReason, note?: string) => void
}

export interface StatCardProps {
  /** Metriğin adı ("Bekleyen ilan"). Kartın erişilebilir adının parçası olur. */
  label: string
  /**
   * Gösterilecek değer.
   *
   * `string` de kabul edilir çünkü her KPI ham sayı değildir: oran (`%12,4`) ve
   * süre (`4 sa 12 dk`) biçimlenmiş gelir. Biçimleme **çağıranın** işi — kart
   * kendi `Intl`'ini kurmaz (makineye göre değişir); para için
   * `utils/formatCurrency`, tarih için `utils/formatDateTime` kullanın.
   */
  value: string | number
  /** Değerin altındaki açıklama: neyi kapsadığı, hangi aralığa ait olduğu. */
  description?: string
  /**
   * Bir önceki döneme göre değişim.
   *
   * Üç alanı da ayrı olmalı çünkü **yön ile iyi/kötü aynı şey değildir**:
   * "reddedilen ilan %20 arttı" yukarı ok ama kötü haberdir. `direction` oku
   * (yukarı/aşağı/düz), `sentiment` rengi (yeşil/kırmızı/nötr) belirler; hangi
   * metriğin artışının iyi olduğunu kart bilemez, çağıran bilir.
   *
   * `value` biçimlenmiş metindir (`+%12`, `-3 gün`).
   */
  trend?: {
    /** Değişimin yönü; oku belirler. */
    direction: 'up' | 'down' | 'flat'
    /** Biçimlenmiş değişim metni (`+%12`). Kart hesaplamaz. */
    value: string
    /** Değişimin iyi mi kötü mü olduğu; rengi belirler. `direction`'dan bağımsızdır. */
    sentiment: 'positive' | 'negative' | 'neutral'
  }
  /** Sağ üstteki ikon. Dekoratiftir, ekran okuyucudan gizlenir — anlamı `label` taşır. */
  icon?: ReactNode
  /**
   * - `plain`: sade kart. Dashboard'ın çoğunluğu.
   * - `accent`: renkli vurgu şeridi. Dikkat çekmesi gereken tek KPI (bekleyen ilan).
   * - `trend`: `trend` bilgisini büyütür.
   *
   * **Sparkline yok — Faz 3'te karara bağlandı.** Faz 2'de bu satır "mini bir
   * eğri için yer açar" diyordu ama eğrinin verisini taşıyan bir alan yoktu:
   * sözleşme olmayan bir şeyi vaat ediyordu. Tüketici görününce (`DashboardStats`)
   * cevap netleşti ve eklememek çıktı:
   *
   * 1. **Veri yedi KPI'ın yalnız ikisinde var.** `DashboardMetrics` iki seri
   *    taşıyor (`dailyNewListings`, `dailyModerationCount`); kalan beş kart
   *    (yayındaki ilan, red oranı, ortalama inceleme süresi, açık şikayet, bugünkü
   *    yeni ilan) için seri **yok**. Eğrili ve eğrisiz kartlar aynı ızgarada ya
   *    farklı yükseklikte durur ya da beşinde kalıcı bir delik açılır — kartın
   *    "veri kanalı olmayan şeye yer ayırmam" kuralının ihlal ettiği tam da bu.
   * 2. **O iki seri zaten aynı ekranda tam boy `ChartCard` olarak çiziliyor**
   *    (brifing 2.2: "günlük ve haftalık onay/red sayısı"). Sparkline, iki yüz
   *    piksel aşağıdaki grafiğin okunması daha zor bir ikinci kopyası olurdu.
   *
   * Üstelik **repo bu kararı Faz 2'de zaten vermişti, farkında olmadan**:
   * `ChartCardProps.height`'ın `sm` değeri "eksensiz mini eğri" diye tanımlı ve
   * `ChartCard.css.ts` onu "mini eğri trendi gösterir, sayıyı `StatCard` söyler"
   * diye gerekçelendiriyor. Yani eğrinin sahibi çoktan belliydi; iki JSDoc
   * birbiriyle çelişiyordu, StatCard'ınki yanlış olandı.
   *
   * Gerçekten bir gün her KPI'ın kendi serisi gelirse
   * `sparkline?: TimeSeriesPoint[]` geriye dönük uyumlu bir ektir; bugün
   * eklemek, tüketicisi olmayan bir kanal açmak olurdu.
   *
   * @default 'plain'
   */
  variant?: 'plain' | 'accent' | 'trend'
  /**
   * Değerin yerine skeleton gösterir; **kartın ölçüsü korunur** — veri gelince
   * dashboard zıplamaz (brifing: "loading durumları layout shift üretmemelidir").
   *
   * @default false
   */
  loading?: boolean
  /**
   * Verilirse kart tıklanabilir olur (`<button>` gibi davranır, klavyeyle
   * odaklanılır). Genelde filtrelenmiş ilan listesine götürür.
   *
   * Verilmezse kart düz bir gösterge kalır — tıklanamayan şeyi tıklanabilir
   * göstermeyin.
   */
  onClick?: () => void
}

export interface ChartCardProps {
  /** Grafiğin başlığı. Grafiğin erişilebilir adı olur. */
  title: string
  /** Başlığın altında: grafiğin neyi, hangi aralıkta ölçtüğü. */
  description?: string
  /**
   * Grafiğin kendisi (genelde bir Recharts bileşeni).
   *
   * Kart veri **çekmez ve grafiği kendi çizmez** — yalnız kabıdır: başlık,
   * araç çubuğu, yükseklik ve dört durum (loading/empty/error/success) onun işi.
   *
   * Grafiğin salt görsel olduğunu unutmayın: veriyi ekran okuyucuya taşıyan bir
   * özet veya tablo alternatifi de buraya girmeli.
   */
  children: ReactNode
  /** Sağ üstteki eylemler: aralık seçici, "CSV indir". Verilmezse şerit render edilmez. */
  toolbar?: ReactNode
  /**
   * Grafiğin yerine skeleton gösterir; kartın yüksekliği korunur.
   * @default false
   */
  loading?: boolean
  /**
   * Verilirse grafiğin yerine hata bloğu gösterilir ve `children` **render
   * edilmez**.
   *
   * Kartın kendi hata kanalı var çünkü dashboard'da grafikler bağımsız yüklenir:
   * biri düşerken diğerleri ve KPI kartları ayakta kalmalı (brifing 2.2'nin
   * `partialSuccess` durumu). `UiError.retryable` tekrar denenip denenemeyeceğini
   * söyler, `onRetry` ise onu eyleme çevirir.
   */
  error?: UiError
  /**
   * `error.retryable` iken hata bloğundaki "tekrar dene" butonunu çalıştırır.
   *
   * `AsyncState`'in `partialSuccess`'i tam da bunun için var: düşen grafiğin
   * hatası `errors[alan]`'dan gelir, tekrar denemesi de yalnız o alanın
   * sorgusunu tazeler — bütün dashboard'ı değil.
   *
   * Kanal yokken `retryable`'ın JSDoc'u tutulamayan bir söz veriyordu: kart
   * `ErrorState`'i `onRetry`'siz çağırdığı için buton hiç çıkmıyordu
   * (`ErrorHasNoRetryButton` bunu ölçüyor). Kural aynı kalıyor —
   * **`onRetry` yoksa buton yok**, `retryable` ne derse desin; basınca bir şey
   * yapmayan buton koymaktansa doğrusu bu. `DataTableProps.onRetry` ile
   * birlikte kararlaştırıldı.
   *
   * Yokluğu bir durum, dolayısıyla `meta.args`'a konmaz.
   */
  onRetry?: () => void
  /**
   * Boş durumu zorlar: seçilen aralıkta veri yok.
   *
   * Ayrı bir bayrak çünkü kart `children`'ın içine bakamaz — grafiğin sıfır
   * noktası olduğunu yalnız veriyi çeken katman bilir. Boş bir grafik ile eksen
   * çizip veri çizmemek arasındaki farkı kullanıcı anlamalı.
   *
   * `loading` ve `error` bunun önüne geçer.
   *
   * @default false
   */
  empty?: boolean
  /**
   * Grafik alanının yüksekliği. Sabit tutulur ki durumlar arasında geçerken
   * (loading → success) kart zıplamasın.
   *
   * `sm` mini eğriler, `md` çoğu grafik, `lg` dashboard'ın ana grafiği için.
   *
   * @default 'md'
   */
  height?: 'sm' | 'md' | 'lg'
}

export interface PaginationProps {
  /**
   * Geçerli sayfa. **1'den başlar**, 0'dan değil — kullanıcıya gösterilen sayı
   * ile aynı olsun diye. Aralık dışı bir değer verilirse gösterim sırasında
   * kırpılır (bkz. Pagination JSDoc), çökmez.
   */
  page: number
  /** Sayfa başına kayıt sayısı. Toplam sayfa bundan ve `totalItems`'tan türetilir. */
  pageSize: number
  /** Filtrelenmiş toplam kayıt sayısı. `0` ise component hiç render edilmez. */
  totalItems: number
  /** Sunulacak sayfa boyutları. `onPageSizeChange` ile birlikte verilmezse seçici çıkmaz. */
  pageSizeOptions?: number[]
  /**
   * - `numbered`: sayfa numaraları, aradaki boşluklar `…` ile kısaltılır. Masaüstü.
   * - `compact`: yalnız ileri/geri ve "Sayfa 3 / 12". Dar ekran.
   * - `loadMore`: biriktirerek yükleyen tek buton. Sonsuz akış hissi verir.
   *
   * @default 'numbered'
   */
  variant?: 'numbered' | 'compact' | 'loadMore'
  /**
   * Tüm sayfalama kontrollerini devre dışı bırakır — genelde yeni sayfa
   * yüklenirken. Sınırdaki ileri/geri butonları bundan bağımsız olarak zaten
   * kapalıdır.
   *
   * @default false
   */
  disabled?: boolean
  /** Sayfa değiştiğinde 1-tabanlı yeni sayfa ile çalışır. */
  onPageChange: (page: number) => void
  /**
   * Sayfa boyutu değiştiğinde çalışır. Üst katman bunu alınca sayfayı 1'e
   * döndürmelidir: 10. sayfadayken boyut 20'den 100'e çıkarsa o sayfa artık yok.
   */
  onPageSizeChange?: (pageSize: number) => void
}

export interface RejectionReasonPickerProps {
  /**
   * Seçili gerekçeler. Kontrollüdür: seçimi picker değil çağıran tutar — aynı
   * seçim karar dialog'unda ve ekranın özetinde birden görünebilir.
   */
  value: RejectionReason[]
  /**
   * Moderatörün notu. Boş string boş alan demektir.
   *
   * Gerekçe ile not birlikte alınır çünkü ikisi tek bir karara gider: gerekçe
   * *hangi kural*, not *bu ilanda tam olarak ne* sorusunu cevaplar. "Yanıltıcı
   * Bilgi" tek başına ilan sahibine neyi düzelteceğini söylemez.
   */
  note: string
  /**
   * - `cards`: her gerekçe açıklamasıyla birlikte kart. Kararın asıl verildiği
   *   yer — moderatör "Belge Uyumsuzluğu" ile "Yetki Belgesi Eksik" farkını
   *   ancak açıklamayı okuyarak seçer.
   * - `list`: açıklamasız, sıkışık liste. Dialog gibi dar alanlarda.
   * - `compactSelect`: tek satırlık çoklu seçim kutusu. Toolbar ve satır içi.
   *
   * @default 'cards'
   */
  variant?: 'cards' | 'list' | 'compactSelect'
  /**
   * En az bir gerekçe zorunlu olduğunu işaretler ve alanı `*` ile gösterir.
   *
   * Zorunluluğu **denetlemez**: seçimin yeterli olup olmadığına karar veren ve
   * gönderimi kapatan, kararın sahibi olan üst katmandır
   * (`isModerationDecisionComplete`). Picker yalnız işareti gösterir.
   *
   * @default false
   */
  required?: boolean
  /**
   * Tüm alanları devre dışı bırakır — genelde karar gönderilirken. Yetki için
   * kullanmayın: yetkisiz kullanıcıya picker hiç render edilmez.
   *
   * @default false
   */
  disabled?: boolean
  /** Doğrulama hatası. Verilirse gerekçe grubunun altında kırmızı gösterilir. */
  error?: string
  /** Gerekçe seçimi değiştiğinde yeni listenin tamamıyla çalışır. */
  onValueChange: (reasons: RejectionReason[]) => void
  /** Not her tuş vuruşunda bildirilir; geciktirme çağıranın işi. */
  onNoteChange: (note: string) => void
}

export interface EmptyStateProps {
  /** Durumu tek cümlede söyleyen başlık. "Veri yok" değil, "Henüz ilan eklenmemiş". */
  title: string
  /** Neden boş olduğunu ve ne yapılabileceğini açıklar. */
  description?: string
  /** Dekoratif görsel veya ikon; ekran okuyucudan gizlenir. Anlam taşımamalıdır. */
  illustration?: ReactNode
  /** Ana eylem. Component eylemi kendi uydurmaz — sayfa katmanı verir. */
  primaryAction?: ReactNode
  /** İkincil eylem (yardım, dokümantasyon). */
  secondaryAction?: ReactNode
  /**
   * Başlığın başlık düzeyi (`<h2>`…`<h6>`). Verilmezse başlık **`<p>`** olarak
   * basılır — Faz 3'e kadar tek davranış buydu.
   *
   * Sebep: bir composite, bir sayfanın içinde **hangi düzeyde** yaşadığını
   * bilemez; kör bir `<h3>` basmak `heading-order` ihlali riski taşırdı, bu
   * yüzden başlık `<p>` idi. Ama **tam sayfa** bir ekran (`AuthScreen`) düzeyini
   * BİLİR ve orada `<p>` başlık sayfayı `<h1>`'siz bırakırdı; brifing 2.11
   * `EmptyState`'i türetiyor. Aynı boşluk `ListingFactsProps.headingLevel`'la
   * kardeş — fark şu ki burada gerçek bir tüketici var.
   *
   * Bilen çağıran verir; verilmezse davranış aynen korunur (`<p>`).
   *
   * @default undefined (başlık `<p>`)
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /**
   * - `default`: sayfanın tamamı boşken. Geniş nefes alanı.
   * - `compact`: kart, panel veya tablo içinde. Daha az dikey alan.
   * - `filtered`: filtre sonucu boşken. Kesik kenarlıkla ayrılır — veri
   *   *yok* değil, *bu filtreye uyan* yok; kullanıcının atacağı adım farklı.
   *
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'filtered'
}

export interface ErrorStateProps {
  /** Neyin başarısız olduğu. "Hata" değil, "İlanlar yüklenemedi". */
  title: string
  /** Ne yapılabileceği. Yığın izi veya ham sunucu mesajı değil. */
  description: string
  /** Destek ekibinin arayabileceği kod. Verilirse mono yazıyla, seçilebilir gösterilir. */
  code?: string
  /**
   * Yeniden deneme butonunun metni.
   * @default 'Tekrar dene'
   */
  retryLabel?: string
  /**
   * - `page`: ekranın tamamı yüklenemediğinde.
   * - `section`: panel veya kart içeriği yüklenemediğinde; çevresi ayakta kalır.
   * - `inline`: tek satır. Toolbar veya form içindeki dar alanlarda.
   *
   * @default 'page'
   */
  variant?: 'page' | 'section' | 'inline'
  /**
   * Verilirse yeniden deneme butonu görünür. Verilmezse hata kalıcıdır
   * (`UiError.retryable === false` karşılığı) — tekrar denemenin işe yaramayacağı
   * yerde buton sunmak kullanıcıyı boşa uğraştırır.
   */
  onRetry?: () => void
  /**
   * "Tekrar dene"nin yanındaki ikincil eylem — tipik olarak **güvenli geri dönüş
   * bağlantısı**.
   *
   * Brifing 2.1: 403 ve benzeri kalıcı hatalar "güvenli bir geri dönüş bağlantısı"
   * göstermeli, ama `ErrorState`'in slotu yoktu; `AuditLogPage` bağlantıyı kendi
   * `<p><Link/></p>`'siyle çizmek zorunda kaldı (ve bu yüzden ekran Router
   * context'i gerektirdi). Buraya bir `<Link>` veya `<Button>` geçmek onu
   * standartlaştırır.
   *
   * `onRetry` tekrar denemenin **anlamlı** olduğu yerdedir; bu ise
   * `unauthorized`/`notFound` gibi tekrar denemenin işe yaramadığı yerde
   * kullanıcıya bir çıkış verir. İkisi birlikte de olabilir.
   */
  secondaryAction?: ReactNode
  /**
   * Başlığın başlık düzeyi. Verilmezse başlık **`<p>`** olarak basılır.
   *
   * Gerekçe `EmptyStateProps.headingLevel` ile birebir aynı: composite düzeyini
   * bilemez, ama tam sayfa bir ekran bilir ve `variant="page"` bir `<h1>`'siz
   * sayfa üretmemeli. `AuthScreen`'in `fatalError`/`forbidden`/`notFound` modları
   * bunu ister.
   *
   * @default undefined (başlık `<p>`)
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

export interface ConfirmDialogProps {
  /** Dialog'un görünürlüğü. Kapanınca `requireText` alanına yazılan metin sıfırlanır. */
  open: boolean
  /** Onaylanacak eylem. Soru değil, eylemin adı: "İlanı kalıcı olarak sil". */
  title: string
  /** Sonucun ne olacağı ve geri alınıp alınamayacağı. Dialog'un açıklaması olur. */
  description: string
  /** Onay butonunun metni. Eylemi tekrar eder ("Sil"), "Tamam" demez. */
  confirmLabel: string
  /**
   * Vazgeçme butonunun metni.
   * @default 'Vazgeç'
   */
  cancelLabel?: string
  /**
   * `danger` onay butonunu yıkıcı stile alır. Geri alınamayan işlemlerde kullanın.
   * @default 'neutral'
   */
  tone?: 'neutral' | 'danger'
  /**
   * Verilirse kullanıcı bu metni birebir yazana kadar onay butonu kapalı kalır.
   * Toplu silme gibi tek tıkla dönülemeyecek işlemler için: yazmak, kullanıcıyı
   * ne yaptığını okumaya zorlar.
   */
  requireText?: string
  /**
   * İşlem sürerken onay butonunda spinner gösterir, vazgeçmeyi kapatır ve
   * dialog'un dışarı tıklama / `Escape` ile kapanmasını engeller — istek
   * uçarken dialog'un kapanması kullanıcıya sonucu göstermez.
   *
   * @default false
   */
  loading?: boolean
  /**
   * Onaya basıldığında çalışır. Dialog'u kapatmak çağıranın işi: işlem
   * başarısız olursa dialog açık kalıp hatayı gösterebilmeli.
   */
  onConfirm: () => void
  /** Vazgeçme, kapatma, `Escape` ve dışarı tıklama — hepsi buraya çıkar. */
  onCancel: () => void
}

export interface BulkActionDefinition {
  /** `onAction`'a geri verilecek kimlik. */
  id: string
  /** Butonun görünür metni. İkon tek başına yeterli değildir. */
  label: string
  /**
   * `danger` yıkıcı stil verir (toplu silme, toplu reddetme).
   * @default 'neutral'
   */
  tone?: 'neutral' | 'danger'
  /** Etiketin solundaki ikon. Dekoratiftir, ekran okuyucudan gizlenir. */
  icon?: ReactNode
  /** Eylem bu seçim için geçersizse kapatır. Yetki içinse eylemi hiç listelemeyin. */
  disabled?: boolean
}

export interface BulkActionBarProps {
  /** Seçili kayıt sayısı. `0` ise component hiç render edilmez. */
  selectedCount: number
  /** Sunulacak toplu eylemler. Yetkisiz eylemler bu listeye hiç konmamalıdır. */
  actions: BulkActionDefinition[]
  /**
   * - `floating`: ekranın altında yüzen ada. Yer kaplamaz, uzun listede hep erişilir.
   * - `sticky`: içerik kabının alt kenarına yapışır, tam genişlik.
   * - `inline`: normal akışta, tablonun üstündeki toolbar'da.
   *
   * @default 'floating'
   */
  variant?: 'floating' | 'sticky' | 'inline'
  /**
   * Süren eylemin id'si. O butonda spinner çıkar, **diğerleri kapanır**: aynı
   * seçim üzerinde iki toplu işlemin yarışması veri kaybına yol açar.
   */
  loadingActionId?: string
  /**
   * Bir eyleme basıldığında `BulkActionDefinition.id` ile çalışır. Hangi
   * kayıtlara uygulanacağını çağıran bilir — çubuk yalnız sayıyı görür.
   */
  onAction: (actionId: string) => void
  /** Seçimi temizler. Kullanıcının seçimden çıkışı her zaman açık olmalı. */
  onClearSelection: () => void
}

export interface RolePermissionMatrixProps {
  /** Sütun olarak gösterilecek roller, verilen sırayla. Etiketler `ADMIN_ROLE_LABEL`'dan. */
  roles: AdminRole[]
  /**
   * Satır olarak gösterilecek izinler, verilen sırayla. Etiketler
   * `ADMIN_PERMISSION_LABEL`'dan gelir, matrisin içine gömülmez.
   *
   * Sıra çağıranındır: izinleri konuya göre gruplamak (ilan / kullanıcı /
   * şikayet) 32 satırlık bir tabloyu okunur kılan tek şey.
   */
  permissions: AdminPermission[]
  /**
   * Rol → izin eşlemesi; hücrelerin işaretliliği buradan gelir. Kontrollüdür:
   * matris kendi kopyasını tutmaz.
   *
   * `ROLE_PERMISSIONS` doğrudan geçilebilir.
   *
   * **Kademeler kapsayıcıdır, dışlayıcı değil.** `superAdmin` hem `UserEdit`'e
   * hem daraltılmış `UserEditProfile`/`UserEditContact`'e sahiptir; aynısı
   * `ReportTriage` ile `ReportTriageLimited` için de geçerli. Matris hücreleri
   * olduğu gibi gösterir — "tam yetkilide sınırlı satırı gizle" gibi bir yorum
   * yapmaz; brifingin "Sınırlı" hücreleri artık kendi izinleriyle temsil
   * edildiği için gizlenecek bir şey de yok.
   */
  value: Record<AdminRole, readonly AdminPermission[]>
  /**
   * `diff` varyantının **neye göre** değiştiğini söylediği taban.
   *
   * Faz 3'te eklendi. Faz 2'de sözleşme bunu hiç söylemiyordu ve matris tabanı
   * `ROLE_PERMISSIONS`'tan okuyordu — yani domain sabitinden. O varsayım
   * yalnızca kayıtlı izinler sabitle aynı kaldığı sürece doğru: `superAdmin` bir
   * izni değiştirip **kaydettiği an** sunucunun gerçeği sabitten ayrılır ve
   * matris o günden sonra her açılışta "değişmiş" hücreler göstermeye başlar —
   * hiçbir şey değişmemişken. Diff sessizce yalan söylerdi.
   *
   * Verilmezse davranış aynen korunur (`ROLE_PERMISSIONS`) — geriye dönük
   * uyumlu. Ayarlar ekranı **kayıtlı** hâli geçirir, dolayısıyla diff "kaydetmeden
   * önce neyi değiştiriyorum" sorusunu cevaplar; `SettingsPageProps`'un
   * `savedRolePermissions`'ına bak.
   *
   * `value` ile aynı anahtar uzayını kullanır: karşılaştırma rol rol, izin izin
   * yapılır. Tabanda olup `value`'da olmayan izin "kaldırıldı", tersi "eklendi".
   */
  baseline?: Record<AdminRole, readonly AdminPermission[]>
  /**
   * - `editable`: hücreler işaretlenebilir kutu. Ayarlar ekranı.
   * - `readOnly`: hücreler yalnız ikon (✓/–). Kullanıcı detayında "bu rol ne
   *   yapabilir" sorusunu cevaplar; kimse yanlışlıkla değiştiremez.
   * - `diff`: değişen hücreler önceki hâliyle karşılaştırmalı vurgulanır.
   *   Kaydetmeden önce "neyi değiştiriyorum" sorusu — yetki değişikliği geri
   *   alınması pahalı bir iştir.
   *
   * @default 'editable'
   */
  variant?: 'editable' | 'readOnly' | 'diff'
  /**
   * Tüm hücreleri devre dışı bırakır.
   *
   * **Yetki için kullanmayın**: `permission:manage` izni olmayan kullanıcıya
   * kilitli matris göstermeyin — `readOnly` varyantını verin ya da hiç render
   * etmeyin. Bu prop "şu an değiştirilemez" içindir.
   *
   * @default false
   */
  disabled?: boolean
  /**
   * Kaydetme sürerken hücreleri kilitler ve ilerlemeyi gösterir.
   *
   * `disabled`'dan ayrı çünkü sebebi farklı ve geçici: kullanıcı beklediğini
   * bilmeli, "yetkim mi yok?" diye düşünmemeli.
   *
   * @default false
   */
  saving?: boolean
  /**
   * Bir hücre değiştiğinde çalışır. Verilmezse matris `editable` olsa bile
   * salt okunur davranır — sonuçsuz kutu sunmanın anlamı yok.
   *
   * Tek hücreyi bildirir, tabloyu değil: değişikliği `value`'ya işlemek ve
   * kaydetmek çağıranın işi.
   */
  onChange?: (role: AdminRole, permission: AdminPermission, enabled: boolean) => void
}

export interface CategoryTreeNode {
  /** Benzersiz kimlik; `selectedId` ve `expandedIds` bununla eşlenir. */
  id: string
  /** Görünür etiket. Ağaç etiketi kendi türetmez — çağıran `LISTING_CATEGORY_LABEL`'dan verir. */
  label: string
  /**
   * Düğümün bağlı olduğu üst kategori.
   *
   * Opsiyoneldir çünkü ağacın her düğümü bir `ListingCategory` değildir: alt
   * kategoriler ve gruplama düğümleri de vardır. Yalnız altı kök düğüm bunu
   * taşır.
   */
  category?: ListingCategory
  /** Alt düğümler. Boş dizi ile `undefined` aynı anlama gelir: yaprak düğüm. */
  children?: CategoryTreeNode[]
  /**
   * Kategorinin yayında olup olmadığı (`CategoryAttributeDefinition.active`
   * ile aynı kavram).
   *
   * `false` ise düğüm soluk gösterilir ama **gizlenmez ve tıklanabilir kalır**:
   * pasif kategorinin özniteliklerini düzenlemek, onu yeniden yayına almanın ilk
   * adımıdır. Renk tek başına gösterge değildir; pasiflik metinle de belirtilir.
   */
  active: boolean
  /**
   * Bu kategorideki ilan sayısı. Verilmezse sayaç gösterilmez.
   *
   * Alt düğümleri kapsayıp kapsamadığına **çağıran** karar verir; ağaç toplama
   * yapmaz — "bu kategoride kaç ilan var" sorusunun cevabı sunucudan gelir.
   */
  count?: number
}

export interface CategoryTreeProps {
  /**
   * Kök düğümler, verilen sırayla. Ağaç `<ul>`/`<li>` ile kurulur ve
   * `role="tree"` ile duyurulur — hiyerarşi ekran okuyucuda da hiyerarşidir.
   */
  nodes: CategoryTreeNode[]
  /**
   * Seçili düğümün `id`'si; `aria-selected` ile işaretlenir. Eşleşme yoksa
   * hiçbir düğüm seçili görünmez, çökmez.
   */
  selectedId?: string
  /**
   * Açık düğümlerin id'leri. Kontrollüdür: açıklığı ağaç değil çağıran tutar —
   * derin bir düğüm seçiliyken atalarının açık gelmesi gerekir ve bunu ancak
   * yolu bilen katman kurabilir.
   */
  expandedIds: string[]
  /**
   * - `sidebar`: dar kolon, kategori yönetiminin sol paneli. Varsayılan.
   * - `panel`: geniş kart içinde, sayaçlar ve pasiflik rozeti görünür.
   * - `compact`: sıkışık satırlar. Dialog ve yan panelde.
   *
   * @default 'sidebar'
   */
  variant?: 'sidebar' | 'panel' | 'compact'
  /**
   * Ağacın yerine skeleton gösterir. Düzen korunur.
   * @default false
   */
  loading?: boolean
  /** Bir düğüme tıklandığında çalışır. Seçimi ağaç tutmaz, yalnız bildirir. */
  onSelect: (id: string) => void
  /** Bir düğüm açılıp kapandığında açık id listesinin **tamamıyla** çalışır. */
  onExpandedIdsChange: (ids: string[]) => void
}

export interface AttributeEditorProps {
  /**
   * Düzenlenen öznitelik tanımı. Kontrollüdür: taslağı editör değil çağıran tutar.
   *
   * `Partial` çünkü `create` modunda tanım henüz eksiktir — `id`, `createdAt` gibi
   * alanları sunucu verir ve kullanıcı formu doldururken çoğu alan boştur. Tam
   * bir `CategoryAttributeDefinition` istemek, yeni öznitelik eklemeyi
   * imkânsız kılardı.
   *
   * Hangi kontrollerin görüneceğini `dataType` belirler: `singleSelect` /
   * `multiSelect` seçenek listesi açar, `number` / `money` ise `validation`'ın
   * min-max alanlarını.
   */
  value: Partial<CategoryAttributeDefinition>
  /**
   * - `create`: yeni öznitelik. `key` düzenlenebilir.
   * - `edit`: mevcut öznitelik. `key` **kilitlidir** — yayındaki ilanların
   *   verisi ona bağlı; değiştirmek eski değerleri öksüz bırakır.
   * - `readOnly`: yalnız gösterim, hiçbir alan düzenlenemez.
   *
   * `readOnly`'yi yetki kapısı olarak kullanabilirsiniz — ama tercihen
   * `category:manage` izni olmayan kullanıcıya editörü hiç render etmeyin.
   */
  mode: 'create' | 'edit' | 'readOnly'
  /**
   * Kaydedilmemiş değişiklik olduğunu işaretler: "Kaydet" etkinleşir ve
   * kullanıcı ayrılmak isterse uyarılabilir.
   *
   * Editör bunu **kendi hesaplamaz**: "değişti mi" sorusu `value`'yu sunucudaki
   * hâliyle karşılaştırmayı gerektirir ve o hâli yalnız çağıran bilir.
   *
   * @default false
   */
  dirty?: boolean
  /**
   * Kaydetme sürerken alanları kilitler ve butonda spinner gösterir.
   * @default false
   */
  saving?: boolean
  /**
   * Alan adı → hata mesajı. İlgili kontrolün `error` prop'una bağlanır.
   *
   * Anahtarlar `CategoryAttributeDefinition`'ın alan adlarıdır (`key`, `label`,
   * `validation.min`). Karşılığı olmayan anahtar sessizce yok sayılır — çökmez.
   *
   * Doğrulamayı editör **yapmaz**: benzersiz `key` gibi kurallar sunucuyu
   * gerektirir; editör yalnız sonucu gösterir.
   */
  validationErrors?: Record<string, string>
  /**
   * Bir alan değiştiğinde **birleştirilmiş** yeni değerle çalışır (fark değil,
   * son hâl). Verilmezse editör salt okunur davranır.
   */
  onChange?: (value: Partial<CategoryAttributeDefinition>) => void
  /**
   * "Kaydet"e basıldığında çalışır. Verilmezse buton görünmez.
   *
   * Zorunlu alanların dolu olup olmadığına karar veren ve gönderimi kapatan
   * çağırandır — editör işaretler, denetlemez.
   */
  onSave?: () => void
  /** "Vazgeç"e basıldığında çalışır. Verilmezse buton görünmez. */
  onCancel?: () => void
}

export interface UserSummaryCardProps {
  /**
   * Gösterilecek kullanıcı. Kart veri çekmez.
   *
   * `adminRole` yalnız admin kullanıcılarında doludur ve yalnız o zaman
   * gösterilir (brifing 2.6). Hesap durumu ve doğrulama rozet olarak görünür;
   * etiketler `USER_STATUS_LABEL` / `USER_TYPE_LABEL`'dan gelir.
   */
  user: UserAccount
  /**
   * Yürürlükteki yaptırım kaydı — `status` yaptırımın **olduğunu** söyler, bu
   * "neden" ve "ne zamana kadar"ı söyler.
   *
   * Faz 3'te eklendi; Faz 2'de kart yaptırımın yalnız **tipini** `status`'ten
   * türetip gerisini susarak geçiyordu (uydurmaktansa doğrusu buydu). Brifing
   * 2.6 "aktif yaptırım"ı gösterilecek veri sayıyor ve `fixtures/users.ts`
   * `activeSuspensionSanction`'ı `endsAt` ile yazdı: "askı 29 Tem'de bitiyor"
   * yaptırım kararı verilirken tam olarak bakılan bilgi.
   *
   * **Alanları varyanta göre açılır ve bu bir yetki sınırıdır** (bkz. `variant`):
   * - `detailed`: yalnız tip ve `endsAt`. `destek`in görebildiği kadarı —
   *   "askınız 29 Tem'de bitiyor" diyebilmeli.
   * - `security`: ayrıca `reason`, `startsAt` ve `createdByAdminId`.
   *   `UserSanction.reason` **iç gerekçe metnidir**, müşteriye okunacak cümle
   *   değil; `AdminPermission.UserViewProfile`'ın JSDoc'u onu açıkça gizli
   *   sayıyor.
   * - `compact`: hiç gösterilmez; o varyantta durum rozeti zaten tek bilgi.
   *
   * Gizli alan **hiç render edilmez**, soluk veya `disabled` gösterilmez —
   * reponun en eski kuralı. Kaldırılmış yaptırım (`revokedAt` dolu) buraya
   * konmaz: "yürürlükteki" değildir. Geçmiş yaptırımlar `SellerPanelProps`'un
   * `sanctions`'ına aittir.
   */
  activeSanction?: UserSanction
  /**
   * - `compact`: avatar, ad, durum. Liste satırında ve ilan detayının yanında.
   * - `detailed`: iletişim, ilan sayıları, kayıt tarihi de görünür. Kullanıcı
   *   detayının başında.
   * - `security`: son giriş, doğrulama ve aktif yaptırım öne çıkar. Yaptırım
   *   kararı verilirken bakılan yüz.
   *
   * **`security` bir yetki kapısıdır, yalnız bir düzen değil:** tam görünüm
   * odur ve `AdminPermission.UserView` ister. `destek` rolü yalnız
   * `UserViewProfile`'a sahiptir (brifing 1.4: "Kullanıcı görüntüleme" ×
   * `destek` = "Sınırlı") ve bu varyantı **görmemelidir** — ayıran ilke
   * "destek durumu açıklar, moderatör durumu belirler". Kart yetki bilmez;
   * varyantı seçen sayfa katmanı **önce `UserView`'u** sınamalı, yoksa
   * `UserViewProfile`'a düşmeli (kademe kapsayıcı — `superAdmin` ikisine de
   * sahip, ters sıra ona daraltılmış görünüm gösterir).
   *
   * Sınırlı görünümde gizlenecekler `AdminPermission.UserViewProfile`'ın
   * JSDoc'unda alan alan yazılı; kartın bugün gösterdiklerinden `lastLoginAt`
   * ve `adminRole` o listede.
   *
   * @default 'compact'
   */
  variant?: 'compact' | 'detailed' | 'security'
  /**
   * Kartta gösterilecek eylemler (Askıya al, Yasakla, Rolü değiştir).
   *
   * Yetkisiz eylemler buraya **hiç konmamalıdır**: kart yetki bilmez.
   * Askıya alma `user:suspend`, yasaklama `user:ban` ister; kullanıcı bilgisi
   * düzenleme ise kademelidir — `UserEdit` (tam), `UserEditProfile`,
   * `UserEditContact`. Kademeler kapsayıcı olduğu için **önce tamı** sınanmalı,
   * yoksa `superAdmin`'e daraltılmış form gösterilir.
   */
  actions?: ReactNode
  /**
   * Karta tıklandığında çalışır; verilirse kart tıklanabilir görünür.
   * `actions` içindeki butonlara tıklamak bunu tetiklemez.
   */
  onClick?: (user: UserAccount) => void
}

export interface ReportCardProps {
  /**
   * Gösterilecek şikayet. Kart veri çekmez.
   *
   * Etiketler `REPORT_REASON_LABEL`, `REPORT_STATUS_LABEL` ve
   * `REPORT_SEVERITY_LABEL`'dan gelir. Şiddet seviyesi renkle **ve** metinle
   * gösterilir — `critical` ile `high` farkı yalnız tondan okunamaz.
   */
  report: ListingReport
  /**
   * Şikayet edilen ilan. Verilirse başlık, ilan no ve kapak görseli de gösterilir.
   *
   * Opsiyonel çünkü şikayet listesi ilanları ayrı bir sorguyla getirir ve
   * gelmeden de kart render edilebilmeli; ayrıca ilan silinmiş olabilir. Yoksa
   * kart yalnız `report.listingId`'yi gösterir — kırık bir başvuru değil, eksik
   * bir bağlam.
   */
  listing?: Listing
  /**
   * Şikayeti açan kullanıcı; verilirse `reporterUserId` yerine **adı** gösterilir.
   *
   * Faz 3'te eklendi. Brifing 2.8 "şikayet eden kullanıcı"yı gösterilecek veri
   * sayıyor ama sözleşme yalnız UUID veriyordu ve kart veri çekemez — ham
   * kimlik basılıyordu, ki bu bir kullanıcı adı değil bir kayıt numarasıdır.
   *
   * `AdminUser` diye bir tip **yok**: admin de son kullanıcı da `UserAccount`,
   * admin olanın `adminRole`'ü dolu (`fixtures/users.ts` → `adminUserFixtures`).
   *
   * Opsiyonel çünkü `report.reporterUserId`'nin kendisi opsiyonel (anonim
   * şikayet) ve ad çözümlemesi ayrı bir sorgu; gelmeden de kart render
   * edilebilmeli. Yoksa kart kimliği gösterir — eksik bağlam, kırık başvuru
   * değil.
   */
  reporter?: UserAccount
  /**
   * Şikayete atanmış admin; verilirse `assignedAdminId` yerine **adı** gösterilir.
   *
   * `reporter` ile aynı gerekçe (brifing 2.8: "atanan admin"). Atanmamış
   * şikayette hiç gelmez ve kart "Atanmadı" der — boş bir ad değil, bilinen
   * bir durum.
   */
  assignedAdmin?: UserAccount
  /**
   * Aynı ilana bağlı **diğer** şikayetlerin sayısı ("2 benzer şikayet daha").
   *
   * Faz 3'te eklendi; brifing 2.8'in "benzer şikayet sayısı" verisi sözleşmede
   * hiç yoktu. `fixtures/reports.ts` → `kadikoyApartmentReports` aynı ilana üç
   * şikayet taşıyor ve bu bilgi kart üzerinde gösterilemiyordu: üç ayrı kartı
   * yan yana görmek "bu ilan üç kez şikayet edilmiş" demenin yerini tutmaz —
   * kuyrukta kartlar yan yana gelmeyebilir.
   *
   * **Bu kartın kendisi sayılmaz**: 3 şikayetli bir ilanın her kartı `2` taşır.
   * Sayan çağırandır; `0` ise gösterilmez.
   */
  relatedReportCount?: number
  /**
   * "Şimdi" — bekleme süresi (`queue` varyantı) bunun üzerinden hesaplanır.
   *
   * Faz 3'te eklendi. `variant` JSDoc'u "queue: şiddet ve **bekleme süresi** öne
   * çıkar" diyordu ama yaş hesabı "şimdi"yi gerektiriyor ve **component saati
   * kendi okuyamaz**: `new Date()` yazan bir kart, aynı story'yi dün "3 gün
   * önce", bugün "4 gün önce" gösterir; brifing fixture'ların deterministik
   * olmasını şart koşuyor ve Chromatic her gün fark üretirdi. Kart bu yüzden
   * bugüne kadar açılış anını **mutlak tarih** olarak gösteriyordu.
   *
   * Verilmezse davranış aynen korunur (mutlak tarih) — geriye dönük uyumlu.
   * Verilirse `queue` varyantı "4 gündür bekliyor" der. Sayfa katmanı bunu bir
   * kez okuyup bütün karta geçirmeli; story sabit bir değer verir.
   */
  now?: ISODateTime
  /**
   * - `compact`: tek satırlık özet. Şikayet listesinde.
   * - `detailed`: şikayetçinin açıklaması, atanmış admin ve çözüm notu görünür.
   *   Şikayet detayında.
   * - `queue`: triage kuyruğu için; şiddet ve bekleme süresi öne çıkar
   *   (bekleme süresi için `now` gerekir).
   *
   * @default 'compact'
   */
  variant?: 'compact' | 'detailed' | 'queue'
  /**
   * Kartta gösterilecek eylemler (Çöz, Reddet, Eskale et).
   *
   * Yetkisiz eylemler buraya hiç konmamalıdır. Triage kademelidir:
   * `report:triage` tam yetkidir (sınıflandırma + `severity` + `assignedAdminId`),
   * `report:triageLimited` ise yalnız okuma, sınıflandırma ve eskalasyon verir —
   * içerik denetçisi şiddet seviyesini değiştiremez, çünkü onu yükseltmek
   * kuyruğun sırasını değiştirmektir. Kademeler kapsayıcı: **önce
   * `report:triage`'ı** sınayın.
   */
  actions?: ReactNode
  /** Karta tıklandığında çalışır; verilirse kart tıklanabilir görünür. */
  onClick?: (report: ListingReport) => void
}

export interface ModerationHistoryProps {
  /**
   * Gösterilecek olaylar. Component bunları **kendisi tarihe göre eskiden yeniye
   * sıralar**: geçmiş sırasız okunamaz ve sıralamayı her çağırana bırakmak, aynı
   * geçmişin iki ekranda ters görünmesi demekti.
   */
  events: ModerationEvent[]
  /**
   * - `timeline`: dikey zaman çizgisi. İlan detayında; "ne oldu, sonra ne oldu".
   * - `table`: sütunlu tablo. Tarama ve karşılaştırma; audit'e yakın okuma.
   * - `compact`: tek satırlık özetler. Yan panel ve dar kolon.
   *
   * @default 'timeline'
   */
  variant?: 'timeline' | 'table' | 'compact'
  /**
   * Olaylar yüklenirken skeleton gösterir.
   * @default false
   */
  loading?: boolean
  /**
   * Boş durumu zorlar.
   *
   * `events` zaten boşsa gerekmez — boş dizi kendiliğinden boş durumu verir.
   * Bu bayrak, çağıranın "veri geldi ve gerçekten boş" ile "henüz sormadım"
   * ayrımını yapabildiği yerler içindir.
   *
   * @default false
   */
  empty?: boolean
}

export interface ListingFactsProps {
  /**
   * Alanları gösterilecek ilan.
   *
   * Hangi alanların görüneceğini `category` belirler: `Listing` ayrık bir
   * birleşimdir ve `attributes` her varyantta başka bir şekildir — arsanın
   * "imar durumu"nu, konutun "oda sayısı"nı gösterir. Etiketler
   * `LISTING_FIELD_LABEL` ve kategoriye özel `*_ATTRIBUTE_LABEL`
   * sözlüklerinden gelir; panel etiket uydurmaz.
   *
   * Değerler `utils/formatCurrency` ve `utils/formatDateTime` ile biçimlenir —
   * panel kendi `Intl`'ini kurmaz.
   */
  listing: Listing
  /**
   * - `sections`: alanlar konu başlıklarına gruplanır. İlan detayında.
   * - `definitionList`: sıkışık `<dl>`; etiket-değer çiftleri alt alta. Yan
   *   panelde ve dar kolonda.
   * - `comparison`: `previousListing` ile yan yana. Değişen alanları görmek için.
   *
   * @default 'sections'
   */
  variant?: 'sections' | 'definitionList' | 'comparison'
  /**
   * Karşılaştırılacak önceki revizyon; yalnız `variant="comparison"`'da kullanılır.
   *
   * Yayındaki bir ilan maddi olarak düzenlenince otomatik `pendingReview`'a
   * döner (brifing 1.1); moderatörün cevaplaması gereken soru "ilan ne" değil,
   * **"ne değişti"**dir — daha önce onaylanmış bir ilanı baştan okumak boşa
   * emektir.
   *
   * Verilmezse `comparison` tek sütuna düşer, çökmez.
   */
  previousListing?: Listing
  /**
   * Vurgulanacak alan adları (`LISTING_FIELD_LABEL`'ın anahtarları veya
   * `attributes.grossSquareMeters` gibi noktalı yollar).
   *
   * Vurgu yalnız renk değildir: alan ayrıca işaretle belirtilir ve
   * `comparison`'da değişimin kendisi zaten metinle görünür.
   *
   * Farkı panel **hesaplamaz** — hangi değişikliğin "maddi" olduğu bir iş
   * kuralıdır (fiyat değişimi maddi, etiket eklemek değil) ve domain'e aittir;
   * panel yalnız söyleneni vurgular.
   */
  highlightedFields?: string[]
}

export interface LocationPanelProps {
  /**
   * Konumu gösterilecek ilan. `listing.location` okunur.
   *
   * İl/ilçe/mahalle her zaman görünür; açık adres ve koordinat ise
   * `revealExactLocation`'a bağlıdır.
   */
  listing: Listing
  /**
   * - `summary`: il / ilçe / mahalle satırı. İlan listesinde ve yan panelde.
   * - `mapSplit`: solda harita, sağda adres. Geniş ekranda konum doğrulanırken.
   * - `addressDetail`: açık adres, posta kodu ve koordinatlar metin olarak.
   *   Kopyalanabilir; belge kontrolünde gerekir.
   *
   * @default 'summary'
   */
  variant?: 'summary' | 'mapSplit' | 'addressDetail'
  /**
   * Açık adresi ve koordinatları gösterir.
   *
   * **`listing.location.showExactLocation`'dan ayrıdır ve onu geçersiz kılmaz.**
   * O bayrak *son kullanıcıya* (public site) gösterimi yönetir (brifing 1.1);
   * bu prop ise *admin panelinde* gösterimi yönetir. İkisi ayrı sorular:
   * moderatör, ilan sahibi kesin konumu gizlemeyi seçmiş olsa bile adresi
   * görmek zorunda kalabilir — "konum tutarlılığı" otomatik kontrolü ancak
   * adres okunarak doğrulanır.
   *
   * Bu yüzden varsayılan kapalı: kesin konum kişisel veriye yakındır, istendiği
   * an değil, gerekçesi olduğunda açılır. Kimin açabileceğine sayfa katmanı
   * karar verir.
   *
   * **Ayrı bir izin gerekmiyor — Faz 3'te karara bağlandı.** Faz 2
   * `AdminPermission.ListingViewExactLocation` gibi bir kademe gerekebileceğini
   * not etmişti; tüketici (`ListingReviewPanel`) görününce brifingin cevabı
   * zaten yazılı çıktı ve **eklememek** doğru oldu:
   *
   * - Brifing 1.4 yetki matrisinde "İlan görüntüleme" satırı **dört rolde de
   *   "Tam"**. Kesin konum ilanın bir alanı; onu ayrı bir izne bağlamak o satırı
   *   sessizce "Sınırlı"ya çevirirdi — yani matrisi kod üzerinden değiştirmek.
   *   Faz 2'de eklenen dört kademe tam tersini yapıyordu: matris "Sınırlı"
   *   derken kod tam yetki veriyordu, kod matrise **uyduruldu**. Buradaki
   *   hareket matrisi koda uydurmak olurdu.
   * - Brifing 1.1'in kendi cümlesi (satır 183) `showExactLocation`'ı "kesin adres
   *   ve koordinatın **son kullanıcıya** gösterilip gösterilmeyeceği" diye
   *   tanımlıyor. O bayrak public sitenin sorusudur; admin tarafında bir yetki
   *   kapısı olduğuna dair tek kelime yok.
   *
   * Kalan şey bir **gösterim** kapısı: moderatör gerekçesi olduğunda açar, kapalı
   * başlar. `ListingReviewPanelProps.revealExactLocation` bunu sayfa katmanına
   * taşıyor.
   *
   * Koordinat yoksa (`location.coordinates` boş) `true` verilse de harita
   * çizilmez; panel açık bir "koordinat yok" durumu gösterir.
   *
   * @default false
   */
  revealExactLocation?: boolean
}

export interface SellerPanelProps {
  /**
   * İlan sahibi. Panel veri çekmez.
   *
   * `UserAccount`'tur, `listing.seller` (`SellerSummary`) değil: panel hesabın
   * durumunu, doğrulamasını ve geçmişini gösterir — ilan üstündeki özet bunları
   * taşımaz. Kurumsal satıcıda (`realEstateOffice`, `constructionCompany`)
   * doğrulama durumu her zaman gösterilir (brifing 1.1).
   */
  user: UserAccount
  /**
   * Satıcının toplam ilan sayısı.
   *
   * `user.listingCount` varken ayrı prop olmasının sebebi: bu sayı çoğu zaman
   * **bağlama göre süzülür** (bu kategoride, bu tarih aralığında kaç ilan).
   * Hangi sorunun cevabı olduğunu çağıran bilir; panel saymaz.
   */
  listingCount: number
  /**
   * Satıcının **yayında** olan ilan sayısı.
   *
   * Faz 3'te eklendi. `listingCount` ile aynı gerekçeyle ayrı prop: panel
   * `user.activeListingCount`'u okumuyor, çünkü süzülmüş bir toplamın
   * (`listingCount`) yanında hesabın süzülmemiş aktif sayısı **çelişkili**
   * görünürdü — "bu kategoride 3 ilan, 12'si yayında" okunamaz bir cümle.
   * İki sayı da aynı bağlamdan gelmeli; hangisi olduğunu çağıran bilir.
   *
   * Brifing 2.6 "toplam ve aktif ilan sayısı"nı gösterilecek veri sayıyor;
   * verilmezse panel yalnız toplamı gösterir — uydurmaz.
   */
  activeListingCount?: number
  /**
   * Satıcının **açık** şikayet sayısı.
   *
   * `user.reportCount` toplamı verir, oysa risk sinyali olan çözülmemiş
   * olanlardır: on şikayeti çözülmüş bir satıcı ile iki şikayeti açık duran
   * satıcı aynı şey değildir.
   */
  openReportCount: number
  /**
   * Hesabın yaptırım kayıtları — yürürlükteki **ve** kaldırılmış geçmiş.
   *
   * Faz 3'te eklendi; `risk` varyantı brifing 3.4'ün istediği "yaptırım
   * geçmişi"ni bunsuz gösteremiyordu: `UserStatus`'ten yalnız yürürlükteki
   * yaptırımın **tipi** türetilebiliyor, gerekçesi ve kaldırılmış geçmişi
   * görünmüyordu. Oysa risk sorusu tam da geçmişi soruyor — bir kez askıya
   * alınıp affedilmiş hesap ile temiz hesap aynı şey değil.
   *
   * Yalnız `risk` varyantında görünür (`summary`/`detailed` hesabın kendisini
   * anlatır, sicilini değil). Sıra bozulmadan render edilir; `revokedAt` dolu
   * olan kayıt "kaldırıldı" diye işaretlenir, listeden **düşürülmez** —
   * kaldırılmış yaptırım da sicildir.
   *
   * `UserSanction.reason` iç gerekçe metnidir: bu panel `destek`e
   * gösterilmemeli (bkz. `AdminPermission.UserViewProfile`). Panel yetki
   * bilmez; `risk` varyantını seçen sayfa katmanı sınar.
   */
  sanctions?: UserSanction[]
  /**
   * - `summary`: ad, tip, doğrulama. İlan detayının yanında.
   * - `detailed`: iletişim ve hesap geçmişi de görünür.
   * - `risk`: açık şikayetler, yaptırımlar ve hesap durumu öne çıkar. Şüpheli
   *   ilan incelenirken.
   *
   * Hiçbiri risk **puanı** hesaplamaz: panel sayıları gösterir, yorumu
   * moderatöre bırakır.
   *
   * @default 'summary'
   */
  variant?: 'summary' | 'detailed' | 'risk'
  /**
   * Panelde gösterilecek eylemler (Kullanıcıya git, Askıya al).
   *
   * Yetkisiz eylemler buraya hiç konmamalıdır — panel yetki bilmez.
   */
  actions?: ReactNode
}

export interface PromotionFlagsPanelProps {
  /**
   * İlanın promosyon bayrakları (`listing.promotionFlags`); hangi dopingin
   * **açık** olduğunu söyler.
   *
   * Etiketler `PROMOTION_TYPE_LABEL`'dan gelir.
   */
  flags: PromotionFlags
  /**
   * Promosyon kayıtları (`listing.promotions`); bayrağın **neden** açık
   * olduğunu söyler: ne zaman satın alındı, ne zaman bitiyor, parayla mı geldi
   * yoksa admin mi açtı (`source`).
   *
   * İkisi ayrı prop çünkü ayrı sorulara cevap veriyorlar ve **tutarsız
   * olabilirler**: brifing 1.1 `promotionFlags` ile aktif `promotions`'ın
   * tutarlı olmasını şart koşar — yani tutarsızlık bir hatadır ve panel onu
   * gizlemek yerine görünür kılar. Süresi dolmuş kaydı olan açık bir bayrak,
   * fark edilmesi gereken bir şeydir.
   *
   * Tarihler `utils/formatDateTime` ile biçimlenir; göreli zaman ("3 gün önce")
   * yazılmaz.
   */
  promotions: ListingPromotion[]
  /**
   * Bayrakları değiştirilebilir kılar (Switch'ler görünür).
   *
   * **Yetki kapısı değildir**: `promotion:manage` izni olmayan kullanıcıya
   * `editable={false}` vermek yerine düzenlenebilir hâli hiç render etmeyin —
   * bu bayrak "bu ekranda düzenleme var mı" sorusunun cevabıdır (ilan
   * listesinde yok, detayda var).
   *
   * `onChange` verilmeden `true` yapmak Switch'leri göstermez.
   *
   * @default false
   */
  editable?: boolean
  /**
   * - `badges`: aktif dopingler rozet olarak. Liste satırında ve kart üstünde.
   * - `cards`: her doping kendi kartında; tarih ve kaynak da görünür.
   * - `table`: sütunlu tablo. Tüm dopingleri tarihleriyle karşılaştırmak için.
   *
   * @default 'badges'
   */
  variant?: 'badges' | 'cards' | 'table'
  /**
   * Bir bayrak değiştiğinde **tüm** `PromotionFlags` nesnesiyle çalışır —
   * tek alan değil, son hâl.
   *
   * Panel `promotions` kayıtlarını **oluşturmaz**: admin bir bayrağı elle
   * açtığında ona karşılık gelen `manualAdmin` kaydını üretmek sunucunun işi.
   */
  onChange?: (flags: PromotionFlags) => void
}

// Brifingden sapma: `AutomatedCheckItem` kaldırıldı, panel domain tipini
// (`AutomatedCheckResult`) alıyor. Kullanıcı onayladı.
//
// Gerekçe: brifingin kendi domain modelinde `ModerationSummary.automatedChecks`
// zaten `AutomatedCheckResult[]`. Panel ayrı bir DTO isteseydi her ekran ilanın
// gerçek sonuçlarını el ile o şekle çevirecekti — ve çeviri iki bilgiyi
// bozuyordu: `AutomatedCheckItem.status` string birleşimiydi (enum değil, yani
// `AutomatedCheckResultStatus` ile eşleşmesi derleyiciye görünmüyordu) ve
// `label` DTO'nun içindeydi; oysa etiket `domain/labels.ts`'in işi —
// component'e etiket taşıtmak "iş kuralları domain'de" kuralını deler ve aynı
// kontrolün adı kuyrukta başka, detayda başka yazılabilirdi.
//
// Kaybedilen bir şey yok: `id` yerine `code` benzersiz anahtar, `label` yerine
// `AUTOMATED_CHECK_LABEL[code]`, `status` yerine aynı üç değerin enum'u.
// `checkedAt` ise kazanç — kontrolün ne zaman çalıştığı artık gösterilebiliyor.
export interface AutomatedChecksPanelProps {
  /**
   * Kontrol sonuçları; `listing.moderation.automatedChecks` doğrudan geçilebilir.
   *
   * Sıra bozulmadan, geldiği gibi render edilir — sonuçların önem sırası
   * sunucunun kararıdır.
   */
  items: AutomatedCheckResult[]
  /**
   * - `list`: kod, durum ve mesaj alt alta. Varsayılan okuma.
   * - `cards`: her kontrol kendi kartında; skor ve zaman damgası da görünür.
   * - `summary`: tek satır özet ("6 geçti, 1 uyarı, 1 başarısız") + yalnız
   *   sorunlular. Kuyrukta karar hızı için.
   *
   * @default 'list'
   */
  variant?: 'list' | 'cards' | 'summary'
  /**
   * Kontroller çalışırken skeleton gösterir.
   * @default false
   */
  loading?: boolean
}

/**
 * Dashboard ekranı (brifing 2.2).
 *
 * **Kabuk değil, içerik.** `AppShell`/`TopBar`/`SidebarNav`/`PageHeader`'ı Faz 4
 * kompoze eder; bu ekran `<h1>` **basmaz** — sayfanın adı `PageHeader`'ın işi ve
 * iki `<h1>` ekran okuyucuda aynı sayfada iki başlık demektir.
 *
 * **Veri çekmez**: durum `state`'ten gelir. Görüntü state'i (açık çekmece,
 * seçili sekme) ekranın kendi işidir; sorgu sayfa katmanının.
 */
export interface DashboardStatsProps {
  /**
   * Dashboard verisinin durumu.
   *
   * `AsyncState` şart, çünkü brifing 2.2 `partialSuccess`'i **zorunlu story**
   * sayıyor ve onu ifade eden başka şekil yok: KPI'lar ve her grafik bağımsız
   * sorgularla geliyor, biri düşünce ötekiler ayakta kalmalı. Düz bir
   * `data + error` ikilisi çalışan beş kartı düşen bir grafik yüzünden hata
   * bloğuna çevirirdi. Düşen grafiğin hatası `errors[alan]`'dan okunup **o**
   * `ChartCard`'ın `error`'una bağlanır; `data`'nın `Partial<T>` olması da
   * bunun için — gelmeyen alan yok, boş değil.
   *
   * `empty` "seçilen tarih aralığında veri yok" demektir ve `error`'dan ayrı
   * durur: biri aralığı genişletmeyi, öteki tekrar denemeyi yaptırır.
   *
   * **Brifing 2.2'nin üç verisi Faz 3 sonrası (b) turunda `DashboardMetrics`'e
   * eklendi ve artık gösteriliyor** (hepsi opsiyonel, backend gelince kesinleşir):
   * - `longestWaitingListings` — "en uzun süredir bekleyen ilanlar".
   * - `recentModerationEvents` — "son moderasyon işlemleri".
   * - `moderatorVolume` — "moderatör bazında işlem hacmi". Yetki kapısı: brifing
   *   "yalnızca yetkili rollere" diyor ama ekranın `availablePermissions`'ı yok;
   *   blok verildiğinde gösterilir, verip vermemeye **sayfa katmanı** karar verir
   *   (Faz 4). "Yetki kontrolü component'in işi değil" kuralının doğal sonucu.
   * - `dailyApprovals`/`dailyRejections` — `dailyModerationCount`'un onay/red
   *   ayrımı; brifingin istediği "onay/red sayısı" grafiği artık çizilebiliyor.
   *   Ayrışmamış toplam serisi de duruyor (biri toplam, biri ayrım).
   *
   * Kalan tek kanalsız istek: kategori/işlem türü/moderatör **filtreleri**
   * (`dateRange` dışında) — `DashboardMetrics` o kırılımları taşımadığı için
   * uygulanamıyor (bkz. `dateRange`).
   */
  state: AsyncState<DashboardMetrics>
  /**
   * Metriklerin kapsadığı tarih aralığı; `DateRangePicker`'a geçirilir.
   *
   * Kontrollü ve **zorunlu**: aralığı bilmeden `empty` durumu okunamaz —
   * "seçilen tarih aralığında veri yok" hangi aralık olduğunu söylemeyen bir
   * cümledir. Ekran varsayılanı **kendi hesaplamaz** ("son 30 gün" hesabı
   * "şimdi"ye dayanır ve component saati kendi okursa aynı story dün ile bugün
   * farklı render edilir; `fixtures/dashboard.ts`'in penceresi tam bu yüzden
   * sabit yazılı: 2026-06-17 → 2026-07-16).
   *
   * **Tek filtre kanalı budur.** Brifing 2.2 ayrıca kategori, işlem türü ve
   * moderatör filtresi istiyor; sözleşmede karşılıkları **yok**, dolayısıyla bu
   * ekranda uygulanamıyorlar (RAPOR EDİLDİ). Uydurma bir `filters` prop'u
   * eklemek yerine boşluk görünür bırakıldı: `DashboardMetrics` zaten o
   * kırılımları taşımıyor, filtre kanalı açmak sonucu değişmeyen üç kontrol
   * çıkarırdı.
   */
  dateRange: DateRange
  /** Aralık değiştiğinde çalışır. Yeni veriyi çekmek sayfa katmanının işi. */
  onDateRangeChange: (value: DateRange) => void
  /**
   * Bir KPI kartına tıklandığında `StatCardProps.onClick` üzerinden çalışır
   * (brifing 2.2: "KPI kartından filtrelenmiş ilan listesine gitme", "bekleyen
   * ilanlardan moderasyon kuyruğuna geçme").
   *
   * `metricId` bir `DashboardMetrics` alan adıdır (`pendingReviewCount`) ama tipi
   * düz `string`, `keyof DashboardMetrics` değil: hedef rota metriğin **kendi**
   * alanından türemiyor — "bekleyen onay" kuyruğa, "açık şikayet" şikayet
   * listesine gider. Eşlemeyi bilen sayfa katmanıdır, tip değil.
   *
   * Verilmezse kartlar düz gösterge kalır; tıklanamayan şeyi tıklanabilir
   * göstermeyin. Hangi metriğin bir listeye karşılığı olduğunu ekran bilmez.
   */
  onMetricClick?: (metricId: string) => void
  /**
   * `error` ve `partialSuccess` durumlarındaki "tekrar dene" butonunu çalıştırır.
   *
   * Opsiyonel çünkü **yokluğu bir durum**: tekrar denenemeyen hata
   * (`UiError.retryable === false`) ve `unauthorized` bu kanalı hiç kullanmaz.
   * Bu yüzden `meta.args`'a konmaz (AGENTS.md, TS2375) — ihtiyacı olan story
   * kendi verir.
   *
   * **Alan bilmiyor.** `ChartCardProps.onRetry`'nin JSDoc'u "yalnız o alanın
   * sorgusunu tazeler" diyor, ama bu kanal argümansız: her grafiğin tekrar
   * denemesi aynı handler'a çıkar ve bütün dashboard'ı tazeler.
   * `(field?: keyof DashboardMetrics) => void` bunu düzeltirdi; imzalar bu turda
   * donduruldu, RAPOR EDİLDİ.
   *
   * Brifing 2.2'nin "dashboard verisini yenileme" eylemi de **bu değil**: yenileme
   * hata olmadan da yapılabilmeli, bu buton yalnız hata bloğunda görünür. Ayrı
   * bir `onRefresh` kanalı yok (RAPOR EDİLDİ). "Grafik verisini CSV olarak dışa
   * aktarma" için de kanal yok — `ChartCardProps.toolbar` yeri açıyor ama onu
   * dolduracak handler sözleşmede tanımlı değil.
   */
  onRetry?: () => void
}

/**
 * İlan listesi ekranının filtre değerleri (brifing 2.3).
 *
 * **`filteredEmpty` buradan türetilir — `AsyncState`'in üyesi değildir.**
 * Brifing 2.3 onu ayrı bir zorunlu story sayıyor, ama `AsyncStatus`'e üye olarak
 * eklemek yanlış olurdu: "veri geldi mi" sorusunu sunucu, "neden boş" sorusunu
 * ekranın kendi filtreleri cevaplıyor. Kurulan okuma:
 *
 * - `state.status === 'empty'` **ve** filtreler varsayılandan farklı →
 *   `EmptyState variant="filtered"`: "bu filtreye uyan ilan yok" + filtreleri
 *   temizleme eylemi.
 * - `state.status === 'empty'` **ve** filtreler varsayılan → `variant="default"`:
 *   "henüz ilan eklenmemiş".
 *
 * İkisi aynı ekran değil çünkü kullanıcının atacağı adım farklı — birinde filtre
 * gevşetilir, ötekinde beklenir; `EmptyStateProps.variant`'ın `filtered`'ı tam
 * bu ayrım için var.
 *
 * "Varsayılan"ın tanımı da bu yüzden burada yaşıyor: **koleksiyon alanları boş
 * dizi, tekil alanlar `undefined`, `dateRange` boş nesne** (`{}`). Zorunlu /
 * opsiyonel ayrımı bunu tip düzeyinde taşıyor — çoklu seçimler her zaman bir
 * dizidir (boş olabilir ama yoktur denemez), böylece `values.statuses.length`
 * `?.` istemez ve `MultiSelectProps.values`'a doğrudan geçer. Tekil alanlarda
 * yokluk zaten "filtre yok" demek, ayrıca boş dize uydurmaya gerek yok.
 *
 * **Brifing 2.3'ün dört filtresinin kanalı yok** (imzalar donduruldu, RAPOR
 * EDİLDİ): alt kategori, işlem türü, "güncellenme tarihi aralığı" (tek bir
 * `dateRange` var) ve "kayıtlı filtre görünümü" (`FilterBarProps.savedViewName`
 * adı gösterebiliyor ama seçili görünüm bu değerlerin parçası değil).
 */
export interface ListingFilterValues {
  /**
   * Serbest metin araması: ilan no, başlık veya kullanıcı (brifing 2.3).
   *
   * Üçünü **tek kutu** arıyor çünkü moderatör elindeki şeyi yazar — bazen ilan
   * no, bazen satıcının adı; hangi alana ait olduğunu önce seçtirmek fazladan
   * bir karar. Ayırt etmek sunucunun işi.
   *
   * `SearchInput` ile geciktirilerek toplanır: her tuş vuruşu bir liste sorgusu
   * demek olurdu. Boş dize ile `undefined` aynı anlama gelir (arama yok).
   */
  query?: string
  /**
   * Seçili kategoriler; boş dizi "hepsi" demektir, "hiçbiri" değil.
   *
   * Çoklu çünkü kategori bir **daraltma**, seçim değil: moderatör "konut ve
   * işyeri" kuyruğuna bakabilmeli. Etiketler `LISTING_CATEGORY_LABEL`'dan gelir.
   */
  categories: ListingCategory[]
  /**
   * Seçili ilan durumları; boş dizi "hepsi".
   *
   * Sekiz `ListingStatus` değerinin herhangi bir alt kümesi olabilir — en sık
   * kullanılan görünüm ("incelemede olanlar") tek üyeli bir dizidir.
   */
  statuses: ListingStatus[]
  /**
   * Seçili il (plaka/kod). Tekil: il, ilçe ve mahalle **kademeli** bir seçim ve
   * iki ili aynı anda seçmek ilçe listesini anlamsız kılardı.
   */
  cityCode?: string
  /**
   * Seçili ilçe. `cityCode` olmadan anlamlı değildir — ilçe listesi ile
   * doldurulur, il değişince temizlenmelidir; bunu yapan sayfa katmanıdır, tip
   * bu bağı ifade edemez (discriminated union gerekirdi).
   */
  districtId?: string
  /** Seçili mahalle. `districtId`'ye bağlıdır; `districtId` ile aynı zincir. */
  neighborhoodId?: string
  /**
   * En düşük fiyat. `maxPrice` ile birlikte bir aralık kurar.
   *
   * `NumberRange` yerine **iki ayrı alan** olmasının sebebi tarihsel: brifingin
   * kendi `ListingFilterValues` sözleşmesi böyle yazılmış ve imza dondurulmuş
   * durumda. `FilterBar`'a geçerken `{ min, max }`'e çevrilir — `FilterValue`
   * birleşimindeki `numberRange` üyesi odur.
   *
   * Negatif değer alamaz (brifing 1.1); sınırı `CurrencyInputProps.min` uygular.
   */
  minPrice?: number
  /** En yüksek fiyat. `minPrice` ile aynı gerekçe; yalnız biri de verilebilir. */
  maxPrice?: number
  /**
   * Seçili para birimleri; boş dizi "hepsi".
   *
   * Fiyat aralığıyla birlikte okunması **çağıranın** işi: 500.000 ₺ ile
   * 500.000 $ aynı sayı değildir ve bu değerler dönüşüm yapmaz. Tek para birimi
   * seçilmeden aralık filtresi vermek anlamı belirsiz bir sorgu üretir; uyarmak
   * ya da kısıtlamak sayfa katmanına düşer — tip bunu ifade edemiyor (RAPOR
   * EDİLDİ, düzeltilmedi).
   */
  currencies: Currency[]
  // Brifingden sapma: `string[]` yerine gerçek domain tipleri. Brifingin kendi
  // tip güvenliği kriteri gereği; `string[]` ile geçersiz değer yazılabiliyordu.
  /**
   * "Kimden" filtresi (bireysel / emlak ofisi / inşaat firması); boş dizi "hepsi".
   *
   * Yukarıdaki sapma notu bunu ve `promotionTypes`'ı kapsıyor: `string[]` ile
   * `'bireysel1'` yazmak derleniyordu ve sessizce hiçbir şey eşleşmiyordu.
   */
  sellerTypes: SellerType[]
  /**
   * İlan tarihi aralığı; boş nesne (`{}`) "aralık yok".
   *
   * **Hangi tarih olduğu sözleşmede yazılı değil** ve tek bir aralık var; brifing
   * 2.3 hem "ilan tarihi aralığı" hem "güncellenme tarihi aralığı" istiyor.
   * Kurulan okuma: bu alan **ilan tarihi** (`createdAt`) — brifingin listesinde
   * önce gelen ve moderasyonun sorduğu soru odur ("dün gelenler"). Güncellenme
   * aralığı bu ekranda süzülemiyor (RAPOR EDİLDİ); ikincisi eklenirse iki alan
   * ayrı adlandırılmalı, çünkü tek `DateRange` ikisini ayıramaz.
   */
  dateRange: DateRange
  /** Seçili promosyon (doping) tipleri; boş dizi "hepsi". Sapma notu bunu da kapsıyor. */
  promotionTypes: PromotionType[]
  /**
   * Yalnız şikayet almış ilanları göster.
   *
   * Üç durumlu okunur: `true` süzer, `false` ve `undefined` **süzmez**. Yani
   * `false` "şikayetsizleri göster" demek değil — `Switch` kapalıyken filtre
   * yoktur; bu yüzden `FilterBar`'ın sayacı `false`'u aktif filtre saymaz.
   */
  reportedOnly?: boolean
  /**
   * İnceleyen moderatörün kimliği (`listing.moderation.reviewerId`).
   *
   * Tekil ve UUID; ekran adı **çözemez** (veri çekmez). Seçenek listesini
   * adlarıyla kuran sayfa katmanıdır — `FilterDefinition.options`'a
   * `{ value: id, label: ad }` geçer.
   */
  reviewerId?: string
}

/**
 * İlan listesi ekranı (brifing 2.3): filtre, tablo, seçim ve toplu işlem.
 *
 * **Kabuk değil, içerik** ve **veri çekmez** — bkz. `DashboardStatsProps`.
 */
/**
 * İlan listesi filtrelerinin **seçenek kaynakları** (Faz 3 sonrası (b) turunda
 * eklendi). Ekran bunları veriden türetemez (bkz. `ListingListPageProps.filterOptions`).
 *
 * Her alan opsiyonel: yalnız verilen filtreler seçenekli render edilir. Değerler
 * `SelectOption` (`value` + görünür `label`), yani `districtId`/`reviewerId` gibi
 * UUID'ler `label`'la eşlenmiş gelir — filtre adı gösterir, id gönderir.
 */
export interface ListingFilterOptions {
  /** İl seçenekleri (`ListingFilterValues.cityCode`). */
  cities?: SelectOption[]
  /** İlçe seçenekleri (`districtId`). Seçili ile göre süzülmüş gelebilir. */
  districts?: SelectOption[]
  /** Mahalle seçenekleri (`neighborhoodId`). */
  neighborhoods?: SelectOption[]
  /** İnceleyen moderatör seçenekleri (`reviewerId`); `label` adminin adı. */
  reviewers?: SelectOption[]
}

export interface ListingListPageProps {
  /**
   * Listenin durumu.
   *
   * `Paginated<Listing>` çünkü sayfalama **sunucu tarafında**: `totalItems` ve
   * `totalPages` `Pagination`'ın girdisi ve onları yalnız veriyi çeken katman
   * bilir. Düz bir `Listing[]` ile "3.381 ilandan 1-20 arası" yazılamazdı ve
   * `items.length` yalnız o sayfanın uzunluğunu verirdi — sayfa sayısı da
   * kayıt sayısı da hesaplanamazdı.
   *
   * `empty`'nin iki okuması var (gerçekten boş / filtre sonucu boş); ayrımı
   * `filters` yapar, bkz. `ListingFilterValues`. `unauthorized` brifing 3.5'in
   * bu ekran için zorunlu tuttuğu story ve tekrar deneme sunmaz.
   */
  state: AsyncState<Paginated<Listing>>
  /**
   * Filtrelerin güncel değeri; `FilterBar`'a çevrilerek geçirilir.
   *
   * Kontrollü ve zorunlu: ekran kendi kopyasını tutmaz. Ayrıca `empty`
   * durumunun hangi `EmptyState` varyantına düşeceğini **bu** belirler —
   * varsayılandan farklıysa `filtered`. `ListingFilterValues`'ın JSDoc'una bakın:
   * "varsayılan"ın tanımı orada.
   */
  filters: ListingFilterValues
  /**
   * Seçili satır anahtarları; `DataTableProps.selectedIds`'e geçirilir.
   *
   * Kontrollü ve zorunlu — boş dizi "seçim yok" demektir ve `BulkActionBar`
   * `selectedCount === 0` iken **hiç render edilmez**. Brifing 2.3'ün
   * `selection` durumu tam olarak bu dizinin dolması.
   *
   * Seçim sayfa değişince ne olur sorusunun cevabı **çağıranındır**: ekran
   * temizlemez. İki okuma da savunulabilir (sayfalar arası seçim korunur /
   * sıfırlanır) ve hangisi olduğu toplu işlemin anlamını değiştirir.
   */
  selectedIds: string[]
  /**
   * Oturumdaki kullanıcının izinleri; hangi toplu eylemlerin **listeleneceğini**
   * belirler (brifing 2.3: "yetkiye göre toplu onay, red, arşivleme veya
   * moderatör atama").
   *
   * Yetkisiz eylem `disabled` verilmez, `BulkActionBar.actions`'a **hiç
   * konmaz** — reponun en eski kuralı. Ekran süzmeyi yapar çünkü eylem listesini
   * kuran odur; `BulkActionBar`'ın kendisi yetki bilmez.
   *
   * **Kademeli izinler kapsayıcıdır, dışlayıcı değil**: `superAdmin` hem tam
   * yetkiye hem daraltılmışına sahip. Dolayısıyla "bu kullanıcı sınırlı mı?"
   * sorusu `includes(Limited)` ile **cevaplanamaz** — önce tamını (`ListingEdit`,
   * `UserView`, `ReportTriage` gibi) sınayın, sınırlı kademeye ondan sonra düşün.
   * Ters sıra `superAdmin`'e daraltılmış görünüm verir.
   */
  availablePermissions: AdminPermission[]
  /**
   * Filtre **seçenek kaynakları**: il/ilçe/mahalle ve inceleyen moderatör listeleri
   * (Faz 3'te kanalsızdı → bu filtreler seçenek üretemiyordu, RAPOR EDİLMİŞTİ).
   *
   * Ekran seçenekleri `state.data.items`'tan **türetemez** — süzülmüş liste yalnız
   * o sayfadaki değerleri içerir ve filtreledikçe seçenekler daralırdı. Sunucu
   * (ya da statik il/ilçe verisi) tam listeyi verir; sayfa katmanı doldurur.
   * Verilmezse o filtreler render edilmez (seçeneği olmayan filtre sunmak
   * `SearchInput`'un bağlanmamış `onClear`'ı gibi sessiz bir bozukluktur).
   *
   * **Backend gelince kesinleşir:** il/ilçe/mahalle hiyerarşisinin tam şekli
   * (kademeli mi, düz mü) sunucunun kararı.
   */
  filterOptions?: ListingFilterOptions
  /**
   * Sıralama değiştiğinde çalışır (Faz 3'te kanalsızdı → hiçbir kolon `sortable`
   * değildi). Opsiyonel; `sort` ile birlikte. `DataTableProps.onSortChange`.
   */
  onSortChange?: DataTableProps<Listing>['onSortChange']
  /** Aktif sıralama; `DataTableProps.sort`'a geçer. Opsiyonel. */
  sort?: DataTableProps<Listing>['sort']
  /**
   * Bir filtre değiştiğinde **birleştirilmiş** yeni değerle çalışır (fark değil,
   * son hâl) — `AttributeEditorProps.onChange` ile aynı kalıp.
   *
   * Sayfayı 1'e döndürmek çağıranın işi: 10. sayfadayken filtre daraltılırsa o
   * sayfa artık olmayabilir (`PaginationProps.onPageSizeChange` ile aynı tuzak).
   */
  onFiltersChange: (filters: ListingFilterValues) => void
  /** Seçim değiştiğinde yeni anahtar listesinin **tamamıyla** çalışır. */
  onSelectionChange: (ids: string[]) => void
  /** Sayfa değiştiğinde **1-tabanlı** yeni sayfa ile çalışır (`PaginationProps.page`). */
  onPageChange: (page: number) => void
  /**
   * Bir satıra/karta tıklandığında çalışır; ilan detayına götürür.
   *
   * `Listing`'in tamamını verir, `id`'sini değil: çağıran çoğu zaman zaten
   * kayda ihtiyaç duyar (rota + başlık) ve satırı `id` ile yeniden aramak
   * `rows`'u ikinci kez taramak olurdu.
   */
  onListingOpen: (listing: Listing) => void
  /**
   * Bir toplu eyleme basıldığında `BulkActionDefinition.id` ve **seçili
   * kayıtlarla** çalışır.
   *
   * `ids` ayrıca geçirilir çünkü `BulkActionBar` yalnız sayıyı görür, hangi
   * kayıtlar olduğunu değil — çubuk `onAction(actionId)` der, ekran `selectedIds`
   * ile birleştirip buraya çıkarır.
   *
   * Onaylatmayı **çağıran** yapar: geri alınamayan toplu işlem (toplu red,
   * arşivleme) `ConfirmDialog` ister ve ekran hangi eylemin yıkıcı olduğunu
   * bilmez — o bilgi `BulkActionDefinition.tone`'da, onu da çağıran yazar.
   */
  onBulkAction: (actionId: string, ids: string[]) => void
  /**
   * Hata bloğundaki "tekrar dene" butonunu çalıştırır.
   *
   * Burada **zorunlu** (`DashboardStatsProps.onRetry`'nin aksine): liste ekranının
   * `error` durumu brifing 2.3'te "yeniden dene" diye tanımlı ve tekrar
   * denenemeyen bir liste hatası yok — kanal her zaman bağlanır. Butonu yine de
   * `UiError.retryable` kapatır: `unauthorized`'da (403) buton çıkmaz, handler
   * bağlı olsa bile.
   */
  onRetry: () => void
}

/**
 * Moderasyon kuyruğu ekranı (brifing 2.4).
 *
 * **Kabuk değil, içerik** ve **veri çekmez** — bkz. `DashboardStatsProps`.
 *
 * **Bu ekran karar VERMİYOR, karar ekranına yönlendiriyor.** Brifing 2.4 hızlı
 * onay, hızlı red ve düzeltme isteme eylemlerini istiyor ama sözleşmede
 * `onApprove`/`onReject`/`onRequestChanges` **yok**: kuyruğun tek çıkışı
 * `onOpenDetail` ile `ListingReviewPanel`. Bunun iki sonucu var ve ikisi de
 * bilerek yazıldı:
 *
 * - `capabilities` burada eylem **göstermez**, yalnız hangi ilanların bu
 *   kullanıcı için anlamlı olduğunu bildirir (bkz. kendi JSDoc'u).
 * - Brifing 3.5'in bu ekran için zorunlu tuttuğu **`Conflict` story'si
 *   yazılamıyor**: `ModerationActionBarProps.decisionError`'ın buradaki eşleniği
 *   (`decisionError`) sözleşmede yok, ve zaten karar gönderilmediği için
 *   revizyon çakışması bu ekranda **doğamaz**. Çakışma karar ekranının hâli.
 *
 * Kanalı olmayan diğer brifing 2.4 istekleri (hepsi RAPOR EDİLDİ, uydurulmadı):
 * kuyruk önceliğini değiştirme, klavye kısayollarıyla karar verme, ilanı **başka
 * bir moderatöre** atama (yalnız `onAssignToSelf` var) ve "kuyruk sırası +
 * bekleme süresi" için gereken `now` — `ReportCardProps.now` ile aynı tuzak:
 * component saati kendi okuyamaz.
 */
export interface ApprovalQueueProps {
  /**
   * Kuyruğun durumu.
   *
   * `Paginated<Listing>` — `ListingListPageProps.state` ile aynı gerekçe; kuyruk
   * da sunucu tarafında sayfalanır (brifing 2.4 `Pagination`'ı türetilen
   * component sayıyor).
   *
   * `empty` burada "tüm kuyruk tamamlandı" demektir ve **iyi haberdir**: filtre
   * gevşetmeyi değil, tebriği hak eden bir boşluk. `EmptyState`'in metni bu
   * yüzden ilan listesininkiyle aynı olamaz — kuyrukta filtre de yok, dolayısıyla
   * `filtered` varyantı bu ekranda hiç kullanılmaz.
   *
   * Sıra `items`'ın sırasıdır: kuyruğun önceliğini **sunucu** belirler, ekran
   * yeniden sıralamaz.
   */
  state: AsyncState<Paginated<Listing>>
  /**
   * Üzerinde durulan ilan (`split view` düzeninde sağ panelde açık olan).
   *
   * Opsiyonel çünkü yokluğu bir durum: `single column` düzeninde ve ilk açılışta
   * seçim yoktur — o hâlde sağ panel bir "kuyruktan bir ilan seçin" boşluğu
   * gösterir. Kontrollü, çünkü "atla" (`onSkip`) seçimi **ekranın dışından**
   * ilerletir: bir sonraki ilanın hangisi olduğunu kuyruğun sahibi bilir.
   *
   * Eşleşme yoksa hiçbir satır seçili görünmez, çökmez.
   */
  selectedListingId?: string
  /**
   * Başka bir moderatör tarafından **aktif olarak incelenen** ilanlar; brifing
   * 2.4'ün `locked` durumu ve 3.5'in zorunlu `Locked` story'si.
   *
   * Kilitli satır **görünür kalır ama karar akışına sokulmaz** — gizlemek yanlış
   * olurdu: kuyruğun 12 ilanı varken 9 görmek, moderatöre işin bittiğini
   * düşündürür. Kilit bir yasak değil bir bilgidir ("Elif Kaya inceliyor");
   * ilanı açmak yine mümkün, iki kişinin aynı ilana aynı anda karar vermesi
   * `ModerationDecisionPayload.expectedRevision` ile zaten engelleniyor.
   *
   * Kimin kilitlediğini **söyleyemiyor**: yalnız id listesi var, `Record<string,
   * UUID>` değil — yani "başka biri inceliyor" denebiliyor, "kim" denemiyor
   * (RAPOR EDİLDİ). `undefined` ile boş dizi aynı: kilit yok.
   */
  lockedListingIds?: string[]
  /**
   * Oturumdaki adminin kimliği.
   *
   * İki soruyu cevaplıyor: bir ilan **bana mı** atanmış
   * (`listing.moderation.reviewerId === currentAdminId` → "sahiplen" yerine
   * "devam et") ve `onAssignToSelf`'in kime atadığı. Ekran veri çekmediği için
   * oturumu kendi okuyamaz; `TopBarProps.currentUser` ile aynı desen.
   *
   * `UserAccount` değil düz `string`: kuyruğun adı göstereceği yer yok — atanmış
   * moderatörün **adı** `listing.moderation` içinden gelir, buradan değil.
   */
  currentAdminId: string
  /**
   * Kullanıcının moderasyon yetkileri.
   *
   * **Bu ekranda buton kapısı değil** (ekran karar vermiyor, bkz. tip JSDoc'u):
   * `ListingReviewPanel`'e taşınacak yetkinin önden bilinmesini sağlıyor —
   * hiçbir kararı veremeyecek bir kullanıcıyı ilan detayına göndermek, onu
   * eylemsiz bir ekranda bırakmak olur.
   *
   * Yetki *kimin*, durum *neyin şu an mümkün olduğunu* söyler; ikisi ayrı
   * kapıdır (`domain/moderationActions.ts`). Değerler `ROLE_PERMISSIONS`'tan
   * türetilir, elle uydurulmaz.
   */
  capabilities: ModerationCapabilities
  /** Kuyrukta bir ilana tıklandığında çalışır; seçimi ekran tutmaz, bildirir. */
  onSelectListing: (listingId: string) => void
  /**
   * "Sahiplen" — ilanı `currentAdminId`'ye atar (brifing 2.4).
   *
   * Yalnız **kendine** atayabiliyor: brifingin istediği "moderatör atama" için
   * kanal yok (`onAssign(listingId, adminId)` gerekirdi) ve admin listesi de bu
   * ekranın paketinde yok — RAPOR EDİLDİ.
   *
   * Zaten başkasına atanmış ilanda ne olacağına **çağıran** karar verir: ekran
   * atamayı yapmaz, niyeti bildirir.
   */
  onAssignToSelf: (listingId: string) => void
  /**
   * "Atla" — bu ilan üzerinde karar vermeden sıradakine geçer.
   *
   * Karar **değildir**: ilanın durumunu ve revizyonunu değiştirmez, kuyrukta
   * kalır. Bu yüzden `ModerationDecisionPayload` almaz — atlamanın gerekçesi ve
   * damgası yok.
   */
  onSkip: (listingId: string) => void
  /** Detaylı inceleme ekranını açar; kararın **tam** akışına çıkış. */
  onOpenDetail: (listingId: string) => void
  /**
   * Süren hızlı kararın adı; brifing 2.4'ün "karar" akışı kuyrukta da mümkün.
   *
   * `ListingReviewPanelProps.submittingAction` ile birebir aynı desen ve aynı
   * indeksleme (`ModerationActionBarProps['submittingAction']`): seçili ilanın
   * karar çubuğunda o butonda spinner çıkar, diğerleri kapanır. Yokluğu bir durum
   * → `meta.args`'a konmaz.
   */
  submittingAction?: ModerationActionBarProps['submittingAction']
  /**
   * Reddedilen hızlı kararın sebebi; **brifing 3.5'in zorunlu `Conflict` story'si
   * artık bu ekranda ifade edilebiliyor** (Faz 3'te kanalsızdı, RAPOR EDİLMİŞTİ).
   *
   * Faz 3'te ayrık bir sorundu: kuyruk karar göndermiyordu, dolayısıyla revizyon
   * çakışması burada **doğamıyordu**. Kuyruğa hızlı karar handler'ları
   * (`onApprove`/`onReject`/`onRequestChanges` — brifing 2.4) eklenince çakışma da
   * anlamlı hâle geldi: seçili ilana verilen hızlı karar, başka moderatör onu bu
   * arada düzenlediyse reddedilir. `ListingReviewPanelProps.decisionError` ile
   * birebir aynı (`ModerationActionBarProps['decisionError']`); `state` ile aynı
   * eksende değil (ilan yüklüyken karar reddedilebilir).
   *
   * `revisionConflict`'te tekrar deneme butonu **yok** — aynı damga aynı çakışmayı
   * verir; doğru eylem ilanı `onOpenDetail` ile açıp yeniden bakmak.
   */
  decisionError?: ModerationActionBarProps['decisionError']
  /**
   * Hızlı onay — seçili ilanın karar çubuğuna geçer (brifing 2.4 "hızlı onay").
   *
   * **Opsiyonel, çünkü kuyruğun birincil çıkışı `onOpenDetail`'dir**: hızlı karar
   * bir hızlandırmadır, zorunluluk değil. Verilmezse o eylem **hiç görünmez**
   * (reponun "handler yoksa buton yok" kuralı) ve kuyruk yalnız detaya yönlendirir
   * — Faz 3'ün davranışı, geriye dönük uyumlu. `capabilities.canApprove` ile
   * **birlikte** verilmeli: iki kapı birden açılmadan buton çıkmaz.
   *
   * Çubuk doğrudan çağırmaz; dialog açıp gerekçe/not toplar
   * (`ListingReviewPanelProps.onApprove` ile aynı sözleşme).
   */
  onApprove?: ModerationActionBarProps['onApprove']
  /** Hızlı red. Opsiyonel; `onApprove` ile aynı gerekçe ve sözleşme. */
  onReject?: ModerationActionBarProps['onReject']
  /** Hızlı düzeltme isteği. Opsiyonel; `onApprove` ile aynı gerekçe ve sözleşme. */
  onRequestChanges?: ModerationActionBarProps['onRequestChanges']
  /** Hata bloğundaki "tekrar dene" butonu. `ListingListPageProps.onRetry` ile aynı gerekçe. */
  onRetry: () => void
}

/**
 * İlan inceleme ekranının veri paketi (brifing 2.5).
 *
 * Tek bir `AsyncState`'in içinde **tek paket** olmasının sebebi: bu ekranda
 * kısmi başarı bir hâl değil. Satıcısı gelmemiş bir ilana karar vermek —
 * "hesabı doğrulanmış mı, kaç şikayeti var" bilmeden onaylamak — bir moderasyon
 * kararı değildir. Dashboard'ın tersine (`partialSuccess`, bkz.
 * `DashboardStatsProps.state`): orada düşen bir grafik ötekileri ayakta bırakır,
 * burada eksik bir parça kararın kendisini geçersiz kılar.
 *
 * **Faz 3 sonrası (b) turunda eklenen kanallar:** `sanctions` (SellerPanel'in
 * `risk` varyantı artık yaptırım geçmişini gösterebiliyor), `revisionHistory`
 * (tam geçmiş, yalnız _n-1_ değil), `adminNotes`, `similarListings`. `Listing`
 * taşıyan üçü **backend gelince kesinleşir** diye işaretli — `domain.ts` FastAPI
 * şartnamesi. Önceki/sonraki kuyruk ilanı navigasyonu `ListingReviewPanelProps`'ta
 * (`onPreviousListing`/`onNextListing`).
 */
export interface ListingReviewData {
  /**
   * İncelenen ilan; ekranın merkezi.
   *
   * `ImageGallery`, `ListingFacts`, `LocationPanel`, `PromotionFlagsPanel` ve
   * `AutomatedChecksPanel` hepsi bunun alanlarından beslenir — hangi
   * özniteliklerin görüneceğini `listing.category` belirler (`Listing` ayrık bir
   * birleşim). `revision` alanı `ModerationDecisionPayload.expectedRevision`
   * olarak karar yüküne damgalanır.
   */
  listing: Listing
  /**
   * Moderasyon geçmişi; `ModerationHistoryProps.events`'e geçirilir.
   *
   * Sıralamayı `ModerationHistory` **kendi** yapar (eskiden yeniye), bu yüzden
   * paket sırası önemsiz. Boş dizi geçerli: hiç işlem görmemiş yeni ilanın
   * geçmişi boştur ve bu bir hata değil.
   */
  events: ModerationEvent[]
  /**
   * İlana açılmış şikayetler (brifing 2.5: "açık şikayetler").
   *
   * `ListingReport[]`, `Paginated` değil: bir ilanın şikayetleri sayfalanacak
   * kadar çok olmaz ve olduysa o zaten kararın kendisidir.
   *
   * **Yalnız açık olanlar mı, hepsi mi?** Sözleşme söylemiyor; alan adı
   * nötr. Kurulan okuma: ne verilirse o gösterilir, süzmeyi çağıran yapar —
   * `ReportCard` `report.status`'ü zaten rozet olarak yazıyor, dolayısıyla
   * çözülmüş bir şikayetin listede görünmesi yanıltıcı değil, bağlam.
   */
  reports: ListingReport[]
  /**
   * İlan sahibinin **hesabı**; `SellerPanelProps.user`'a geçirilir.
   *
   * `UserAccount`'tur, `listing.seller` (`SellerSummary`) değil: panel hesabın
   * durumunu, doğrulamasını ve geçmişini gösterir, ilan üstündeki özet bunları
   * taşımaz. Zorunlu — bkz. tip JSDoc'u: satıcısı bilinmeyen ilana karar
   * verilmez.
   */
  seller: UserAccount
  /**
   * Bir önceki revizyon; `ListingFactsProps.previousListing`'e geçirilir ve
   * `comparison` varyantını besler.
   *
   * Yayındaki ilan maddi olarak düzenlenince otomatik `pendingReview`'a döner
   * (brifing 1.1) ve moderatörün sorusu "ilan ne" değil **"ne değişti"**dir.
   *
   * Opsiyonel çünkü yokluğu bir durum: ilk kez incelenen ilanın öncesi yoktur.
   * Verilmezse `comparison` tek sütuna düşer, çökmez.
   *
   * `revisionHistory` (aşağıda) verilirse bu alanın işini o üstlenir; ikisi de
   * verilirse `revisionHistory` kazanır.
   */
  previousRevision?: Listing
  /**
   * İlanın **tam** revizyon geçmişi; brifing 2.5'in "revizyon geçmişi" ve
   * "revizyonlar arasında karşılaştırma" verisi (Faz 3'te yalnız _n-1_ vardı,
   * RAPOR EDİLMİŞTİ).
   *
   * En yeni **başta**, en eski sonda. İki eski revizyonu karşılaştırmak artık
   * mümkün. `previousListing`'e geçirilecek olan `[1]` (bir önceki). Opsiyonel:
   * verilmezse ekran `previousRevision`'a düşer (Faz 3 davranışı).
   *
   * **Backend gelince kesinleşir:** revizyonun tam `Listing` mi yoksa yalnız
   * değişen alanların bir özeti mi taşınacağı sunucunun kararı; şimdilik tam
   * `Listing[]` (fixture bu şekilde doldurulabilir).
   */
  revisionHistory?: Listing[]
  /**
   * Yürürlükteki **ve** kaldırılmış yaptırımlar; `SellerPanelProps.sanctions`'a
   * ve `UserSummaryCardProps.activeSanction`'a bağlanır (Faz 3'te kanalsızdı, RAPOR
   * EDİLMİŞTİ — `SellerPanel`'in `risk` varyantı bu ekranda yaptırım geçmişini
   * gösteremiyordu, oysa şüpheli ilan incelenirken sorulan tam olarak o).
   *
   * `seller`'a aittir (`userId === seller.id`). `UserSanction.reason` iç gerekçe;
   * sayfa katmanı yetkiye göre `risk` varyantına verir ya da vermez. Opsiyonel.
   */
  sanctions?: UserSanction[]
  /**
   * İlan sahibinin **notları / admin notları** (brifing 2.5: "admin notları";
   * Faz 3'te kanalsızdı, RAPOR EDİLMİŞTİ).
   *
   * Moderatörlerin ilana iliştirdiği serbest metin notlar, en yeni başta.
   * Opsiyonel; boş dizi "not yok". **Backend gelince kesinleşir:** notun yapısı
   * (yazar, zaman, metin) sunucunun kararı — şimdilik `AdminNote`.
   */
  adminNotes?: AdminNote[]
  /**
   * Benzer / mükerrer ilan önerileri (brifing 2.5; Faz 3'te kanalsızdı, RAPOR
   * EDİLMİŞTİ).
   *
   * Bir mükerrer-tespit sisteminin döndürdüğü aday ilanlar; "yeni sekmede aç"
   * eylemi bunlara uygulanır. Opsiyonel. **Backend gelince kesinleşir:** benzerlik
   * skoru taşınıp taşınmayacağı sunucunun kararı — şimdilik düz `Listing[]`.
   */
  similarListings?: Listing[]
}

/**
 * İlan inceleme / karar ekranı (brifing 2.5).
 *
 * **Kabuk değil, içerik** ve **veri çekmez** — bkz. `DashboardStatsProps`.
 */
export interface ListingReviewPanelProps {
  /**
   * İnceleme paketinin durumu; içeriği için `ListingReviewData`.
   *
   * **`notFound` bir `AsyncStatus` üyesi değil — `status === 'empty'` odur.**
   * Brifing 2.5 ve 3.5 `NotFound`'u ayrı bir zorunlu story sayıyor ama tek
   * kayıtlık bir ekranda "boş" ile "bulunamadı" aynı hâldir: listede `empty`
   * "hiç kayıt yok" der, burada "bu ilan yok" der — ikisi de aynı soruya
   * (`data` geldi mi) aynı cevabı veriyor. Ayrı bir üye eklemek `AsyncState`'i
   * ekran başına dallandırırdı; `EmptyState`'in metnini seçen zaten ekran.
   *
   * `unauthorized` (403) ile karıştırmayın: o "bu senin görebileceğin bir şey
   * değil" der, `empty` "böyle bir ilan yok". `AuthScreenProps.mode` ise üçüncü
   * bir kanal — o kabuğun **dışında**, tam sayfa.
   *
   * `stale` brifing 2.1'in durumu: son başarılı veri durur, üstte "güncellenemedi"
   * uyarısı çıkar. Kararın damgası (`revision`) o bayat veriden geldiği için
   * çakışma ihtimali artar — `decisionError` tam da bunu yakalar.
   */
  state: AsyncState<ListingReviewData>
  /**
   * Kullanıcının moderasyon yetkileri; `ModerationActionBarProps.capabilities`'e
   * doğrudan geçirilir.
   *
   * Yetkisi olmayan eylem `disabled` verilmez, **hiç render edilmez**. Yetki
   * *kimin*, `state.data.listing.status` *neyin şu an mümkün olduğunu* söyler;
   * bir eylem iki kapıdan da geçmeden görünmez (`domain/moderationActions.ts`).
   */
  capabilities: ModerationCapabilities
  /**
   * Süren kararın adı; brifing 2.5'in `decisionPending` durumu ve 3.5'in zorunlu
   * `DecisionPending` story'si.
   *
   * `ModerationActionBarProps['submittingAction']` diye **indekslenerek** alınıyor,
   * birleşim yeniden yazılarak değil: değer doğrudan çubuğa geçiyor ve iki liste
   * elle senkron tutulsaydı, çubuğa yeni bir eylem eklendiğinde bu ekran sessizce
   * geride kalırdı.
   *
   * Verildiğinde o butonda spinner çıkar ve **diğerleri kapanır** — aynı ilana
   * aynı anda iki karar göndermek, sonucu son yazana bırakır. Yokluğu bir durum
   * (karar gönderilmiyor), bu yüzden `meta.args`'a konmaz.
   */
  submittingAction?: ModerationActionBarProps['submittingAction']
  /**
   * Karar çubuğuna geçirilir; brifing 3.5'in `Conflict` story'si budur.
   *
   * `state` ile aynı eksende **değil**: ilan başarıyla yüklenmişken karar
   * reddedilebilir — bkz. `ModerationDecisionError`.
   */
  decisionError?: ModerationActionBarProps['decisionError']
  /**
   * Konum panelinde açık adresi ve koordinatı açar.
   *
   * `LocationPanelProps.revealExactLocation`'a doğrudan geçilir; **yetki kapısı
   * değil, gösterim kapısıdır** ve ayrı bir izin gerektirmiyor: brifing 1.4'te
   * "İlan görüntüleme" dört rolde de "Tam", `showExactLocation` ise son
   * kullanıcının sorusu (gerekçenin tamamı `LocationPanelProps`'ta).
   *
   * Varsayılan kapalı: kesin konum kişisel veriye yakın, gerekçesi olduğunda
   * açılır — moderatör "konum tutarlılığı" kontrolünü doğrulamak için adresi
   * okumak zorunda kalabilir. Açıp kapatma kararı sayfa katmanının.
   *
   * @default false
   */
  revealExactLocation?: boolean
  /**
   * Onay kararı; karar çubuğuna geçirilir.
   *
   * Çubuk **doğrudan çağırmaz**: `ModerationDecisionPayload` gerekçe ve not
   * istiyor, dolayısıyla önce dialog açılır. Onayda alan zorunlu değil ama dialog
   * yine de açılır (brifing 2.4: karar öncesi doğrulama zorunlu) — tek tıkla
   * yayına alınan bir ilan, kazayla yayına alınmış ilandır.
   *
   * Yükün `expectedRevision`'ı `state.data.listing.revision`'dan damgalanır:
   * moderatörün **gördüğü** revizyon. Zorunlu — onaylayamayan kullanıcıya bu
   * ekran gösterilebilir (okuma yetkisi dört rolde de tam), eylemi çıkaran
   * `capabilities`'tir.
   */
  onApprove: ModerationActionBarProps['onApprove']
  /**
   * Red kararı. `reasons` en az bir üye, `note` dolu gelir — çubuk ikisini
   * toplamadan çağırmaz.
   *
   * Gerekçe *hangi kural*, not *bu ilanda tam olarak ne* sorusunu cevaplar:
   * "Yanıltıcı Bilgi" tek başına ilan sahibine neyi düzelteceğini söylemez.
   */
  onReject: ModerationActionBarProps['onReject']
  /** Düzeltme isteği. Red gibi: `reasons` ve `note` doludur. */
  onRequestChanges: ModerationActionBarProps['onRequestChanges']
  /**
   * Pasife alma. Verilmezse eylem **hiç görünmez** — `capabilities.canPause` ile
   * birlikte verilmeli; iki kapı birden açılmadan buton çıkmaz.
   *
   * Opsiyonel çünkü yokluğu bir durum: taslak ilan pasife alınamaz, dolayısıyla
   * her ekranda anlamlı değil. `meta.args`'a konmaz.
   */
  onPause?: ModerationActionBarProps['onPause']
  /** Arşivleme. `onPause` ile aynı kural: `capabilities.canArchive` ile birlikte. */
  onArchive?: ModerationActionBarProps['onArchive']
  /**
   * Hata bloğundaki "tekrar dene" butonu; `state.error.retryable` iken görünür.
   *
   * **`decisionError`'ı tekrar denemez** ve denememeli: reddedilen bir kararı
   * yeniden göndermek `revisionConflict`'te aynı çakışmayı üretir. Doğru eylem
   * ilanı **yeniden yükleyip yeniden bakmak** — bu kanal tam olarak onu yapar,
   * ama kararı değil veriyi tazeler. İkisinin aynı butona bağlanmaması bu yüzden
   * kasıt.
   */
  onRetry: () => void
  /**
   * Bir fotoğrafı tekil olarak uygunsuz işaretler (brifing 2.5: "fotoğrafı tekil
   * olarak uygunsuz işaretleme"; Faz 3'te kanalsızdı → galeri salt okunurdu, RAPOR
   * EDİLMİŞTİ).
   *
   * `ImageGalleryProps`'un fotoğraf moderasyon eylemine bağlanır. Opsiyonel:
   * verilmezse galeri salt okunur kalır (Faz 3 davranışı). `capabilities`'e göre
   * kapılanır — fotoğraf reddetmek bir moderasyon eylemidir.
   */
  onPhotoModerate?: (photoId: string, appropriate: boolean) => void
  /**
   * Önceki / sonraki kuyruk ilanına geçiş (brifing 2.5). Opsiyonel: kuyruk
   * bağlamı dışında (ör. şikayet detayından gelince) verilmez → butonlar çıkmaz.
   * Hangi ilanın önceki/sonraki olduğunu kuyruğun sahibi bilir; ekran yalnız niyeti
   * bildirir.
   */
  onPreviousListing?: () => void
  /** Sonraki kuyruk ilanı; `onPreviousListing` ile aynı gerekçe. */
  onNextListing?: () => void
  /**
   * Benzer bir ilanı yeni sekmede açar (brifing 2.5). `ListingReviewData.similarListings`
   * ile birlikte anlamlı; verilmezse öneriler salt okunur görünür.
   */
  onOpenSimilar?: (listingId: string) => void
}

/**
 * Kullanıcı yönetimi ekranının filtre değerleri (brifing 2.6).
 *
 * `filteredEmpty` buradan türetilir — okumanın tamamı ve "varsayılan"ın tanımı
 * `ListingFilterValues`'ın JSDoc'unda; bu tip aynı kalıbı izler (koleksiyonlar
 * boş dizi, tekiller `undefined`).
 */
export interface UserFilterValues {
  /**
   * Serbest metin araması: ad, e-posta veya telefon.
   *
   * Alanı önce seçtirmemenin gerekçesi `ListingFilterValues.query` ile aynı;
   * destek ekibi elindeki şeyi yazar ve o çoğu zaman bir e-postadır.
   */
  query?: string
  /** Seçili kullanıcı tipleri (bireysel / emlak ofisi / inşaat firması); boş dizi "hepsi". */
  types: UserType[]
  /** Seçili hesap durumları (aktif / askıda / banlı …); boş dizi "hepsi". */
  statuses: UserStatus[]
  /**
   * Seçili admin rolleri; boş dizi "hepsi".
   *
   * **Dolu olması listeyi kendiliğinden adminlere daraltır**: `adminRole` yalnız
   * admin hesaplarında dolu (`fixtures/users.ts`), dolayısıyla bu filtre bir rol
   * seçildiği anda son kullanıcıları dışarıda bırakır. Ayrı bir "yalnız
   * adminler" filtresi bu yüzden gerekmedi.
   */
  roles: AdminRole[]
  /**
   * Doğrulama durumu filtresi.
   *
   * **Üç durumlu ve `reportedOnly`'den farklı**: burada `false` anlamlıdır —
   * "doğrulanmamış hesaplar" gerçek bir sorudur (doğrulama bekleyenleri bulmanın
   * yolu). Yani `undefined` "filtre yok", `false` "yalnız doğrulanmamışlar".
   * Kontrolü `Switch` ile kurmayın: kapalı switch `false` gönderir ve filtreyi
   * kaldırmanın yolu kalmaz — üç seçenekli bir `Select` gerekir.
   */
  verified?: boolean
}

/**
 * Kullanıcı yönetimi (liste) ekranı (brifing 2.6).
 *
 * **Kabuk değil, içerik** ve **veri çekmez** — bkz. `DashboardStatsProps`.
 */
export interface UserManagementPageProps {
  /**
   * Listenin durumu. `Paginated<UserAccount>` — gerekçe
   * `ListingListPageProps.state` ile aynı (sayfalama sunucuda).
   *
   * `empty`'nin iki okuması `filters` ile ayrılır. Brifing 3.5 bu ekran için
   * `RoleRestricted` story'sini zorunlu tutuyor: o `unauthorized` **değil** —
   * liste gelir, yalnız eylemler kısılır; kanalı `availablePermissions`.
   */
  state: AsyncState<Paginated<UserAccount>>
  /** Filtrelerin güncel değeri; kontrollü ve zorunlu. `empty`'nin varyantını bu belirler. */
  filters: UserFilterValues
  /**
   * Oturumdaki kullanıcının izinleri; hangi eylemlerin **listeleneceğini**
   * belirler. Brifing 3.5'in `RoleRestricted` story'si budur.
   *
   * Askıya alma `user:suspend`, yasaklama `user:ban`, rol atama yalnız
   * `superAdmin` (brifing 2.6). Yetkisiz eylem `disabled` verilmez, hiç render
   * edilmez.
   *
   * **Kademeli izinler kapsayıcıdır**: `superAdmin` hem `UserView`/`UserEdit`'e
   * hem daraltılmış `UserViewProfile`/`UserEditProfile`/`UserEditContact`'e
   * sahip. "Sınırlı mı?" sorusu `includes(Limited)` ile **cevaplanamaz** — önce
   * tamını sınayın, sınırlıya ondan sonra düşün; ters sıra `superAdmin`'e
   * daraltılmış görünüm verir. Aynı sıra `UserSummaryCardProps.variant`'ı
   * seçerken de geçerli (`security` tam görünümdür ve `UserView` ister).
   */
  availablePermissions: AdminPermission[]
  /** Bir filtre değiştiğinde birleştirilmiş yeni değerle çalışır (fark değil, son hâl). */
  onFiltersChange: (filters: UserFilterValues) => void
  /** Sayfa değiştiğinde 1-tabanlı yeni sayfa ile çalışır. */
  onPageChange: (page: number) => void
  /** Bir satıra tıklandığında çalışır; kullanıcı detayına götürür. */
  onUserOpen: (user: UserAccount) => void
  /** Sıralama değiştiğinde çalışır (Faz 3'te kanalsızdı → hiçbir kolon `sortable`
   * değildi). Opsiyonel; `sort` ile birlikte verilir. `DataTableProps.onSortChange`. */
  onSortChange?: DataTableProps<UserAccount>['onSortChange']
  /** Aktif sıralama; `DataTableProps.sort`'a geçer. Opsiyonel. */
  sort?: DataTableProps<UserAccount>['sort']
  /**
   * "Askıya al" eylemine basıldığında çalışır; brifing 2.6'nın `banPending`
   * ailesinden.
   *
   * `SanctionInput` opsiyonel ikinci argümanla toplanabiliyor (Faz 3'te alansızdı,
   * RAPOR EDİLMİŞTİ); geriye dönük uyum için opsiyonel — `onSuspend(user)` hâlâ
   * derlenir. Gerekçe/süre soran dialog'u çağıran kurar; onaylatma da çağıranın işi.
   */
  onSuspend: (user: UserAccount, input?: SanctionInput) => void
  /** "Yasakla". `onSuspend` ile aynı; ban süresiz olduğu için `SanctionInput.durationDays` verilmez. */
  onBan: (user: UserAccount, input?: SanctionInput) => void
  /**
   * Rol ataması; yalnız `superAdmin` (brifing 2.6).
   *
   * `expectedRoleVersion` opsiyonel üçüncü argümanla iyimser kilit:
   * `roleChangeConflict` (brifing 2.6) artık ifade edilebiliyor — iki superAdmin
   * aynı hesabın rolünü aynı anda değiştirirse damga uyuşmaz. Sonucu `roleChangeError`
   * taşır. Opsiyonel argüman → geriye dönük uyum.
   */
  onRoleChange: (user: UserAccount, role: AdminRole, expectedRoleVersion?: number) => void
  /**
   * Rol değişikliği reddedildi (`roleChangeConflict`, brifing 2.6).
   * `ModerationDecisionError` ailesinden; `state`'ten ayrı. Hangi kullanıcının rol
   * değişikliğinin düştüğünü `userId` taşır.
   *
   * @default undefined
   */
  roleChangeError?: { userId: string; error: UiError }
  /** Hata bloğundaki "tekrar dene" butonu. `ListingListPageProps.onRetry` ile aynı gerekçe. */
  onRetry: () => void
}

/**
 * Kullanıcı detay ekranının veri paketi (brifing 2.6).
 *
 * Tek paket, `ListingReviewData` ile aynı gerekçe: yaptırım kararı verirken
 * "kaç ilanı var, kaç şikayeti var" bilinmeden bakılan hesap, yarım bakılmış
 * hesaptır.
 *
 * **Paketin içinde olmak göstermek için yeterli DEĞİLDİR.** Bu tip verinin
 * *şeklini* söyler, kimin göreceğini değil; onu `UserDetailPageProps.
 * availablePermissions` söyler ve ikisi **örtüşmüyor** — en açık örneği
 * `auditEntries`, kendi JSDoc'una bakın. Sunucu paketi kırpsa bile ekran yine
 * de sınamalı: veri geldi diye render etmek, izin kapısını sunucunun iyi
 * niyetine bırakmak olur.
 */
/**
 * Bir yaptırım eyleminin (askıya alma / yasaklama) topladığı yük; brifing 2.6'nın
 * yaptırıma süre ve gerekçe iliştirme gereği.
 *
 * `UserSanction`'ın **istemci tarafı**: `id`/`createdByAdminId`/`createdAt`'i
 * sunucu üretir, istemci yalnız gerekçeyi ve (askıda) süreyi toplar.
 */
export interface SanctionInput {
  /** İç gerekçe metni; `UserSanction.reason` olur. Zorunlu — gerekçesiz yaptırım denetlenemez. */
  reason: string
  /**
   * Askı süresi, gün. Yasaklamada verilmez (ban süresiz — `endsAt` yok).
   * Askıda zorunlu: süresiz askı bir bandır, kavramsal olarak farklı.
   */
  durationDays?: number
}

export interface UserDetailData {
  /**
   * Hesabın kendisi; `UserSummaryCardProps.user`'a geçirilir.
   *
   * `user.status` yaptırımın *olduğunu* söyler; "neden" ve "ne zamana kadar"ı
   * `activeSanction` taşır (aşağıda, Faz 3 sonrası (b) turunda eklendi).
   */
  user: UserAccount
  /**
   * Yürürlükteki yaptırım; `UserSummaryCardProps.activeSanction`'a geçer (Faz 3'te
   * kanalsızdı, RAPOR EDİLMİŞTİ).
   *
   * Brifing 2.6 "aktif yaptırım"ı gösterilecek veri sayıyor. Kart alanları
   * varyanta göre açıyor ve bu bir **yetki sınırı**: `detailed` (destek'in yüzü)
   * yalnız tip + `endsAt`, `security` ayrıca `reason` + `startsAt` +
   * `createdByAdminId`. Verilmezse kart Faz 3 davranışına düşer (tipi `status`'ten
   * türetir, gerisini susar). `revokedAt` dolu kayıt buraya konmaz — "yürürlükteki"
   * değildir; geçmiş `sanctions`'a aittir.
   */
  activeSanction?: UserSanction
  /**
   * Hesabın yaptırım **geçmişi** (yürürlükteki + kaldırılmış). `SellerPanel`'in
   * `risk` varyantına ve `UserSummaryCard`'ın `security` görünümüne bağlanabilir.
   *
   * `UserSanction.reason` iç gerekçe metnidir — `destek` (`UserViewProfile`)
   * görmemeli; sayfa katmanı `availablePermissions`'a göre bu paketi ya hiç
   * göstermez ya `security`/`risk` varyantına verir.
   */
  sanctions?: UserSanction[]
  /**
   * Kullanıcının ilanları (brifing 2.6: "kullanıcı ilanlarını açma").
   *
   * `Paginated` — paketin **tek sayfalanan** parçası: bir emlak ofisinin yüzlerce
   * ilanı olabilir. Ama sayfayı değiştirecek bir kanal **yok**
   * (`UserDetailPageProps`'ta `onPageChange` bulunmuyor): ilk sayfa gösterilebilir,
   * ikincisine geçilemez. RAPOR EDİLDİ.
   */
  listings: Paginated<Listing>
  /**
   * Kullanıcıya/ilanlarına açılmış şikayetler. `ReportView` ister — dört rolün
   * dördünde de var, yani pratikte kapısız.
   *
   * `Paginated` değil: şikayet sayısı bir hesapta sayfalanacak kadar çok olursa
   * o zaten cevabın kendisidir.
   */
  reports: ListingReport[]
  /**
   * Hesapla ilgili audit kayıtları (brifing 2.6: "işlem geçmişini görüntüleme").
   *
   * **Her zaman pakette, ama her zaman gösterilmez.** `AdminPermission.AuditView`
   * yalnız `superAdmin` ve `moderator`'da var; `destek` ve `icerikDenetcisi`'nde
   * **yok** (`ROLE_PERMISSIONS`). Dolayısıyla bu veri gelmiş olsa bile o iki rol
   * için audit sekmesi **hiç render edilmez** — `TabItem.disabled` ile kilitli
   * gösterilmez, listeye konmaz: kilitli sekme, kullanıcının olduğunu bildiği ama
   * açamadığı bir kapıdır ve `TabItem.disabled`'ın JSDoc'u bunu açıkça yasaklıyor.
   *
   * Kural genel: **veri paketin içinde olması onu göstermek için yeterli
   * değildir.** Kapı `UserDetailPageProps.availablePermissions`.
   *
   * Boş dizi geçerli ve `AuditView`'suz rolün gördüğü şeyle **aynı değil**: biri
   * "bu hesapta işlem yok", öteki "bu senin bakacağın yer değil".
   */
  auditEntries: AuditLogEntry[]
}

/**
 * Kullanıcı detay ekranı (brifing 2.6).
 *
 * **Kabuk değil, içerik** ve **veri çekmez** — bkz. `DashboardStatsProps`.
 * Sekme seçimi görüntü state'idir: ekranın kendi işi, prop değil.
 */
export interface UserDetailPageProps {
  /**
   * Detay paketinin durumu; içeriği için `UserDetailData`.
   *
   * `status === 'empty'` burada "böyle bir kullanıcı yok" demektir —
   * `ListingReviewPanelProps.state` ile aynı okuma: tek kayıtlık ekranda `empty`
   * ile `notFound` aynı hâl.
   *
   * Brifing 3.5 bu ekran için `Suspended` ve `Banned` story'lerini zorunlu
   * tutuyor: ikisi de `AsyncState` durumu **değil**, `success`'in içindeki
   * `data.user.status` değerleri — hesabın askıda olması verinin gelmediği
   * anlamına gelmez. Bu yüzden `AsyncStatus`'e üye eklenmedi.
   */
  state: AsyncState<UserDetailData>
  /**
   * Oturumdaki kullanıcının izinleri. Bu ekranda **iki ayrı işi** var:
   *
   * 1. **Hangi sekmelerin var olduğu.** `AuditView` yoksa audit sekmesi hiç
   *    render edilmez — `UserDetailData.auditEntries` pakette gelse bile. Veri
   *    paketin içinde olması onu göstermek için yeterli değil.
   * 2. **Hangi eylemlerin listeleneceği** (`UserSummaryCardProps.actions`):
   *    askıya alma `user:suspend`, yasaklama `user:ban`, rol atama yalnız
   *    `superAdmin`. Yetkisiz eylem `disabled` verilmez, hiç render edilmez.
   *
   * Ayrıca `UserSummaryCardProps.variant`'ı seçen de budur ve orada varyant bir
   * **yetki kapısı**: `security` tam görünümdür ve `UserView` ister; `destek`
   * yalnız `UserViewProfile`'a sahiptir ve onu görmemelidir (ayıran ilke
   * "destek durumu açıklar, moderatör durumu belirler").
   *
   * **Kademeler kapsayıcı**: `superAdmin` ikisine de sahip. Bu yüzden **önce
   * `UserView`'u sınayın**, yoksa `UserViewProfile`'a düşün — ters sıra
   * `superAdmin`'e daraltılmış görünüm verir. `includes(UserViewProfile)` "bu
   * kullanıcı sınırlı" demek **değildir**.
   */
  availablePermissions: AdminPermission[]
  /** Kullanıcının ilanlarından birine tıklandığında çalışır; ilan detayına götürür. */
  onListingOpen: (listing: Listing) => void
  /**
   * `UserDetailData.listings`'in sayfasını değiştirir (Faz 3'te kanalsızdı, RAPOR
   * EDİLMİŞTİ — bir emlak ofisinin yüzlerce ilanı olabilir, ilk sayfa gösteriliyor
   * ama ikincisine geçilemiyordu).
   *
   * Opsiyonel: verilmezse ilanlar sekmesi tek sayfa gösterir (Faz 3 davranışı).
   * 1-tabanlı; yeni sayfayı çekmek çağıranın işi.
   */
  onListingsPageChange?: (page: number) => void
  /**
   * "Askıya al". Argümansız — `UserManagementPageProps.onSuspend`'in aksine:
   * detay ekranında hangi hesap olduğu zaten tek ve `state.data.user`'da.
   *
   * `SanctionInput` alıyor: süre ve gerekçe artık toplanabiliyor (Faz 3'te alansızdı,
   * RAPOR EDİLMİŞTİ). Argüman **opsiyonel** — geriye dönük uyum: `onSuspend()`
   * çağrısı hâlâ derlenir, dialog'u açıp yükü toplamak çağıranın işi.
   */
  onSuspend: (input?: SanctionInput) => void
  /** "Yasakla". `onSuspend` ile aynı; ban süresiz olduğu için `SanctionInput.durationDays` verilmez. */
  onBan: (input?: SanctionInput) => void
  /**
   * Rol ataması; yalnız `superAdmin` (brifing 2.6).
   *
   * `expectedRoleVersion` ile iyimser kilit: `roleChangeConflict`
   * (`UserManagementPageProps.onRoleChange`'e bakın) artık ifade edilebiliyor.
   * Opsiyonel ikinci argüman geriye dönük uyum için.
   */
  onRoleChange: (role: AdminRole, expectedRoleVersion?: number) => void
  /**
   * Rol değişikliği reddedildi (`roleChangeConflict`, brifing 2.6). Başka bir
   * superAdmin bu arada rolü değiştirdiyse `expectedRoleVersion` uyuşmaz.
   * `ModerationDecisionError` ile aynı aile; `state`'ten ayrı.
   *
   * @default undefined
   */
  roleChangeError?: UiError
  /**
   * Hata bloğundaki "tekrar dene" butonu.
   *
   * **Paketin tamamını tazeler**, parçasını değil: bu ekranda `partialSuccess`
   * yok ve olmamalı — bkz. `UserDetailData`.
   */
  onRetry: () => void
}

/**
 * Bir kategori yayınının **reddedilme** sebebi; `ModerationDecisionError`'ın
 * kategori karşılığı.
 *
 * `AsyncState`'in üyesi değil ve olmamalı — aynı gerekçe: `AsyncState` "ağaç geldi
 * mi", bu "gönderdiğim yayın uygulandı mı" sorusunu cevaplıyor.
 *
 * - `revisionConflict`: başka admin bu arada aynı kategoriyi yayınladı; taban
 *   revizyonu değişti. Tekrar denemek doğru değil (aynı taslak aynı çakışmayı
 *   verir), doğru eylem yeniden yükleyip taslağı gözden geçirmek.
 * - `validation`: sunucu alan hatası döndürdü; ayrıntı
 *   `CategoryAttributePageProps.editorValidationErrors`'ta.
 * - `failed`: geçici/bilinmeyen sunucu hatası; `retryable` tekrar denemenin
 *   anlamlı olup olmadığını söyler.
 */
export type CategoryPublishError =
  | { kind: 'revisionConflict'; message: string }
  | { kind: 'validation'; message: string }
  | { kind: 'failed'; error: UiError }

/** Kategori ve öznitelik yönetimi ekranının veri paketi (brifing 2.7). */
export interface CategoryAttributePageData {
  /**
   * Kategori ağacı; `CategoryTreeProps.nodes`'a geçirilir.
   *
   * Sunucudan hazır ağaç olarak gelir, `domain/categoryTree.ts`'ten **türetilmez**:
   * o sabit (`CATEGORY_SUB_CATEGORIES`) enum'un kendisini yansıtır, oysa bu ekranın
   * konusu kategorilerin **yönetilen** hâli — pasife alınmış bir düğüm ve ilan
   * sayaçları enum'da yok. Etiketler düğümün içinde hazır gelir; ağaç
   * `LISTING_CATEGORY_LABEL`'a bakmaz.
   */
  tree: CategoryTreeNode[]
  /**
   * Seçili düğümün öznitelik tanımları.
   *
   * `selectedNodeId`'ye göre **süzülmüş hâlde** gelir: ekran veri çekmez ve hangi
   * özniteliğin hangi kategoriye ait olduğunu okuyamaz —
   * `CategoryAttributeDefinition`'ın kapsam alanları ile ağaç düğümü arasındaki
   * eşlemeyi bilen sunucudur.
   *
   * Boş dizi geçerli: henüz özniteliği olmayan kategori bir hata değil, bir
   * başlangıç.
   */
  attributes: CategoryAttributeDefinition[]
  /**
   * Seçili kategori düğümü; `CategoryTreeProps.selectedId`'ye geçirilir.
   *
   * Veri paketinin içinde çünkü `attributes`'ı **o** belirliyor: ikisi ayrı
   * prop'lar olsaydı seçim değişip öznitelikler henüz gelmemişken ekran, yeni
   * kategorinin başlığıyla eski kategorinin özniteliklerini yan yana gösterirdi.
   * Aynı pakette gelmeleri bunu tip düzeyinde imkânsız kılıyor.
   *
   * Opsiyonel: ilk açılışta seçim yoktur ve sağ panel bir "kategori seçin"
   * boşluğu gösterir.
   */
  selectedNodeId?: string
}

/**
 * Kategori ve öznitelik yönetimi ekranı (brifing 2.7).
 *
 * **Kabuk değil, içerik** ve **veri çekmez** — bkz. `DashboardStatsProps`.
 *
 * **Faz 3 sonrası (b) turunda kapatılan boşluklar:** `publishing`
 * (`publishPending`), `publishError` (`conflict` — 3.5'in zorunlu `Conflict`
 * story'si), `editorValidationErrors` (`validationError`), `affectedListingCount`
 * ("yayın öncesi etkilenen ilan sayısı") ve `availablePermissions`
 * (`category:manage` kapısı). Kalan tek kanalsız istek **önizleme** (brifing 2.7):
 * taslağı canlı formda göstermek ayrı bir render yüzeyi ister, sözleşmede yok.
 */
export interface CategoryAttributePageProps {
  /**
   * Ağaç ve öznitelik paketinin durumu; içeriği için `CategoryAttributePageData`.
   *
   * Tek `AsyncState`: ağaç gelmeden öznitelik listesi anlamsız (hangi
   * kategorinin?), öznitelikler gelmeden ağaç yarım bir ekran.
   *
   * Brifing 2.7'nin `editing` / `dirty` / `saving` / `validationError` durumları
   * bu eksende **değil**: veri sorunsuz yüklenmişken taslak kirli olabilir ve
   * kaydetme düşebilir — `ModerationDecisionError`'ın `AsyncState`'ten ayrı
   * durmasıyla aynı ayrım. Kanalları `dirty`, `saving` ve
   * `AttributeEditorProps.validationErrors`.
   */
  state: AsyncState<CategoryAttributePageData>
  /**
   * Kullanıcının izinleri; `category:manage` kapısının anahtarı (Faz 3'te
   * kanalsızdı, RAPOR EDİLMİŞTİ).
   *
   * `category:manage` yalnız `superAdmin`'de (brifing 1.4). İzni olmayana editör
   * **`readOnly`** verilir ya da düzenleme eylemleri (ekle/kaydet/yayınla) hiç
   * render edilmez — kilitli (`disabled`) editör değil (o "şu an değiştirilemez"
   * demek, "yetkin yok" değil). Verilmezse ekran salt okunur davranır — sonuçsuz
   * buton sunmaz.
   */
  availablePermissions?: AdminPermission[]
  /**
   * Editördeki taslak; `AttributeEditorProps.value`'ya geçirilir.
   *
   * `Partial` çünkü `create` modunda tanım henüz eksiktir: `id` ve `createdAt`
   * gibi alanları sunucu verir. Kontrollü — taslağı ekran değil çağıran tutar,
   * `state`'ten **ayrı** durur: `state.data.attributes` sunucudaki hâl, bu
   * düzenlenmekte olan hâl; ikisinin farkı `dirty`.
   *
   * Verilmezse editör hiç açılmaz ve sağ panel öznitelik listesinde kalır —
   * yokluğu bir durum, `meta.args`'a konmaz.
   */
  editorValue?: Partial<CategoryAttributeDefinition>
  /**
   * Editörün modu; `AttributeEditorProps.mode`'a geçirilir.
   *
   * `edit`'te `key` **kilitlidir**: yayındaki ilanların verisi ona bağlı,
   * değiştirmek eski değerleri öksüz bırakır. `readOnly` bir yetki kapısı olarak
   * kullanılabilir ama tercih edilen `category:manage` izni olmayana editörü hiç
   * göstermemek — ki o izni bu ekranda okuyacak kanal yok (bkz. tip JSDoc'u).
   *
   * `editorValue` ile birlikte anlamlı; ikisi de yoksa editör açılmaz. Sözleşme
   * bu bağı ifade edemiyor (discriminated union gerekirdi) — `SidebarNav`'ın
   * `mobileOpen`/`onMobileOpenChange` asimetrisiyle aynı sınır.
   */
  editorMode?: 'create' | 'edit' | 'readOnly'
  /**
   * Kaydedilmemiş değişiklik var; brifing 2.7'nin `dirty` durumu ve 3.5'in
   * zorunlu `Dirty` story'si.
   *
   * Ekran bunu **kendi hesaplamaz**: "değişti mi" sorusu `editorValue`'yu
   * sunucudaki hâliyle karşılaştırmayı gerektirir ve karşılaştırmanın *maddi*
   * olanı bir iş kuralıdır. `AttributeEditorProps.dirty`'ye geçirilir; ayrılırken
   * uyarmak da çağıranın işi — ekran rota bilmez.
   *
   * @default false
   */
  dirty?: boolean
  /**
   * Kaydetme sürüyor; alanlar kilitlenir, butonda spinner çıkar.
   *
   * `dirty`'den ayrı ve `disabled`'dan da: sebebi geçici ve kullanıcı beklediğini
   * bilmeli, "yetkim mi yok?" diye düşünmemeli.
   *
   * @default false
   */
  saving?: boolean
  /**
   * Yayınlama sürüyor; brifing 2.7'nin `publishPending` durumu.
   *
   * `saving`'den ayrı: `saving` taslağı kaydediyor (`onSave`), bu yayınlıyor
   * (`onPublish`) — ikincisi yayındaki ilanların form şemasını değiştirdiği için
   * kullanıcının hangisinin sürdüğünü ayırt etmesi gerekir.
   *
   * @default false
   */
  publishing?: boolean
  /**
   * Yayınlama reddedildi; brifing 2.7'nin `conflict` durumu ve **3.5'in zorunlu
   * `Conflict` story'si** (Faz 3'te kanalsızdı, RAPOR EDİLMİŞTİ).
   *
   * `ModerationDecisionError` ile aynı aile ve aynı gerekçeyle `state`'ten ayrı:
   * ağaç sorunsuz yüklüyken (`status: 'success'`) yayınlama düşebilir — başka bir
   * admin bu arada aynı kategoriyi yayınladıysa taban revizyonu artmıştır. `state`
   * ile aynı eksende olsalardı, reddedilen yayın ekrandaki ağacı hata bloğuna
   * çevirirdi.
   *
   * `revisionConflict`'te tekrar deneme **doğru değil**: aynı taslak aynı
   * çakışmayı verir; doğru eylem `onRetry` ile yeniden yükleyip taslağı yeni
   * tabana göre gözden geçirmek. `validation` ise sunucunun reddettiği alan
   * hataları — `AttributeEditorProps.validationErrors`'a `editorValidationErrors`
   * ile ayrıca akar; bu bayrak yalnız "yayın düştü" üst durumunu taşır. Taslak
   * (`editorValue`) korunur.
   *
   * @default undefined (yayın reddedilmedi)
   */
  publishError?: CategoryPublishError
  /**
   * Öznitelik editörünün alan hataları; brifing 2.7'nin `validationError` durumu.
   *
   * `AttributeEditorProps.validationErrors`'a doğrudan geçer. Ekran doğrulamayı
   * **yapmaz** (benzersiz `key` gibi kurallar sunucuyu gerektirir); sunucunun
   * `onSave`/`onPublish` sonrası döndürdüğü hataları taşır. Faz 3'te editör bu
   * prop'a sahipti ama besleyecek kanal yoktu (RAPOR EDİLMİŞTİ) — artık var.
   */
  editorValidationErrors?: Record<string, string>
  /**
   * Taslak yayınlanırsa etkilenecek ilan sayısı; brifing 2.7'nin "yayın öncesi
   * etkilenen ilan sayısı" verisi (Faz 3'te kanalsızdı, RAPOR EDİLMİŞTİ).
   *
   * Onay dialog'u artık "bu değişiklik 1.284 ilanı etkileyecek" diyebilir. Ekran
   * **saymaz** — hangi ilanların bu şemaya bağlı olduğunu sunucu bilir; seçili
   * düğümün `count`'u yanlış cevaptır (o kategorideki toplam ilan, şemadan
   * etkilenen değil). Verilmezse dialog genel uyarıyla yetinir.
   */
  affectedListingCount?: number
  /** Ağaçta bir düğüme tıklandığında çalışır. Yeni öznitelikleri çekmek çağıranın işi. */
  onNodeSelect: (id: string) => void
  /**
   * Editörde bir alan değiştiğinde **birleştirilmiş** yeni değerle çalışır (fark
   * değil, son hâl).
   */
  onEditorChange: (value: Partial<CategoryAttributeDefinition>) => void
  /** "Taslağı kaydet" (brifing 2.7). Yayına almaz — bkz. `onPublish`. */
  onSave: () => void
  /**
   * "Değişiklikleri yayınla" (brifing 2.7). `onSave`'den **ayrı** çünkü sonucu
   * ayrı: kaydetmek taslağı saklar, yayınlamak yayındaki ilanların form şemasını
   * değiştirir.
   *
   * Onaylatmayı çağıran yapar ve yapmalı — ama "yayın öncesi etkilenen ilan
   * sayısı" (brifing 2.7'nin görünen verisi) sözleşmede yok: dialog "bu değişiklik
   * 1.284 ilanı etkileyecek" **diyemiyor**, yalnız genel bir uyarı verebiliyor.
   * RAPOR EDİLDİ.
   */
  onPublish: () => void
  /** Hata bloğundaki "tekrar dene" butonu; `state`'i tazeler, kaydetmeyi değil. */
  onRetry: () => void
}

/**
 * Şikayet yönetimi ekranının filtre değerleri (brifing 2.8).
 *
 * `filteredEmpty` buradan türetilir — okumanın tamamı `ListingFilterValues`'ın
 * JSDoc'unda; aynı kalıp (koleksiyonlar boş dizi, tekiller `undefined`).
 */
export interface ReportFilterValues {
  /** Serbest metin araması: şikayet kimliği, ilan no veya açıklama metni. */
  query?: string
  /** Seçili şikayet sebepleri; boş dizi "hepsi". Etiketler `REPORT_REASON_LABEL`'dan. */
  reasons: ReportReason[]
  /** Seçili şikayet durumları; boş dizi "hepsi". */
  statuses: ReportStatus[]
  /**
   * Seçili şiddet seviyeleri; boş dizi "hepsi".
   *
   * Brifing 3.5'in bu ekran için zorunlu tuttuğu `CriticalReports` story'si
   * bunun `[critical]` olduğu hâldir — ayrı bir prop ya da `AsyncStatus` üyesi
   * değil, yalnız bir filtre değeri.
   */
  severities: ReportSeverity[]
  /**
   * Atanan adminin kimliği. Tekil ve UUID; ekran adı **çözemez** (veri çekmez) —
   * seçenek listesini adlarıyla kuran sayfa katmanıdır.
   *
   * "Atanmamışlar" bu alanla **sorulamıyor**: `undefined` "filtre yok" demek ve
   * boş atamayı ifade edecek bir değer (`null` gibi) tipte yok. Triage'ın en sık
   * sorusu — "sahipsiz şikayetler" — bu ekranda süzülemiyor. RAPOR EDİLDİ.
   */
  assignedAdminId?: string
  /** Şikayet tarihi aralığı; boş nesne (`{}`) "aralık yok". */
  dateRange: DateRange
}

/**
 * Şikayet / rapor yönetimi ekranı (brifing 2.8).
 *
 * **Kabuk değil, içerik** ve **veri çekmez** — bkz. `DashboardStatsProps`.
 *
 * **`availablePermissions` YOK ve bu ekranın en büyük boşluğu** (RAPOR EDİLDİ).
 * `ListingListPageProps` ve `UserManagementPageProps`'ta var, burada yok — oysa
 * triage brifingin **kademelendirdiği** üç yetkiden biri: `report:triage` tam
 * yetkidir (sınıflandırma + `severity` + `assignedAdminId`),
 * `report:triageLimited` yalnız okuma, sınıflandırma ve eskalasyon verir —
 * `icerikDenetcisi` şiddet seviyesini değiştiremez, çünkü onu yükseltmek
 * kuyruğun sırasını değiştirmektir. Kademe bu ekranda **kapılanamıyor**:
 * `ReportCardProps.actions`'ı kuran ekran, kullanıcının hangi kademede olduğunu
 * okuyamıyor ve eylemleri süzemiyor.
 *
 * Ad çözümlemesi için de paket yok: `ReportCardProps.reporter` ve
 * `assignedAdmin` `UserAccount` bekliyor ama bu ekranın state'i yalnız
 * `ListingReport` taşıyor — kart ham UUID basar. Aynı sebeple `listing` de
 * beslenemiyor: brifing 2.8'in "ilan özeti" ve "ilanın mevcut durumu" verileri
 * bu ekranda gösterilemiyor.
 */
export interface ReportManagementPageProps {
  /**
   * Listenin durumu. `Paginated<ListingReport>` — gerekçe
   * `ListingListPageProps.state` ile aynı (sayfalama sunucuda).
   *
   * `empty`'nin iki okuması `filters` ile ayrılır. Brifing 2.8'in
   * `alreadyResolved` ve `linkedListingUnavailable` durumlarının kanalı **yok**;
   * ilki `report.status` ile kısmen okunabiliyor, ikincisi hiç (`listing`
   * paketin içinde değil).
   */
  state: AsyncState<Paginated<ListingReport>>
  /** Filtrelerin güncel değeri; kontrollü ve zorunlu. `empty`'nin varyantını bu belirler. */
  filters: ReportFilterValues
  /**
   * Kullanıcının izinleri; triage kademesinin kapısı (Faz 3'te kanalsızdı, RAPOR
   * EDİLMİŞTİ — diğer liste ekranlarında vardı, burada yoktu).
   *
   * `report:triage` **tam** (sınıflandırma + `severity` + `assignedAdminId`),
   * `report:triageLimited` **sınırlı** (okur, sınıflandırır, eskale eder), `report:resolve`
   * ayrı. **Kademeler kapsayıcı** — önce `ReportTriage`'ı sına, sonra
   * `ReportTriageLimited`'a düş; ters sıra `superAdmin`'e daraltılmış görünüm verir.
   * Yetkisiz eylem `disabled` verilmez, hiç render edilmez. Verilmezse ekran
   * eylemleri yalnız `report.status`'e göre kapılar (Faz 3 davranışı).
   */
  availablePermissions?: AdminPermission[]
  /**
   * "Şimdi" — `ReportCard`'ın `queue` varyantındaki bekleme süresi bundan
   * hesaplanır (Faz 3'te kanalsızdı, RAPOR EDİLMİŞTİ; kart saati kendi okuyamaz).
   *
   * Verilmezse kartlar mutlak tarih gösterir (kartın belgelenmiş yedeği). Sayfa
   * katmanı bir kez okuyup bütün karta geçirir; story sabit bir değer verir —
   * `new Date()` deterministik fixture'ı bozar.
   */
  now?: ISODateTime
  /**
   * Kullanıcı çözümleme sözlüğü: `report.reporterUserId` / `assignedAdminId` →
   * `UserAccount` (Faz 3'te ad çözümleme paketi yoktu, RAPOR EDİLMİŞTİ).
   *
   * `ReportCard.reporter` ve `assignedAdmin` `UserAccount` bekliyor ama ekran veri
   * çekmez; sayfa katmanı şikayetlerin kullanıcılarını ayrı sorguyla getirip bu
   * sözlüğü doldurur. Eksik id "Bilinmiyor" olarak görünür, kart çökmez. `AdminUser`
   * diye ayrı bir tip **yok** — admin de `UserAccount`, `adminRole`'ü dolu.
   */
  usersById?: Record<string, UserAccount>
  /**
   * İlan çözümleme sözlüğü: `report.listingId` → `Listing` (brifing 2.8'in "ilan
   * özeti" ve "ilanın mevcut durumu" verileri; Faz 3'te beslenemezdi).
   *
   * `ReportCard.listing`'e geçer. Silinmiş ilan sözlükte yoktur → kart yalnız
   * `listingId`'yi gösterir (eksik bağlam, kırık başvuru değil — `linkedListingUnavailable`
   * durumu böyle ifade edilir).
   */
  listingsById?: Record<string, Listing>
  /** Bir filtre değiştiğinde birleştirilmiş yeni değerle çalışır (fark değil, son hâl). */
  onFiltersChange: (filters: ReportFilterValues) => void
  /** Sayfa değiştiğinde 1-tabanlı yeni sayfa ile çalışır. */
  onPageChange: (page: number) => void
  /** Bir şikayete tıklandığında çalışır; şikayet detayına götürür. */
  onReportOpen: (report: ListingReport) => void
  /**
   * "Çözümle" (brifing 2.8). `report:resolve` ister — ama izin listesi olmadığı
   * için bu ekran onu sınayamıyor (bkz. tip JSDoc'u).
   *
   * **Çözüm notunu toplamıyor**: brifing 2.8 "çözüm notu"nu gösterilecek veri
   * sayıyor, dolayısıyla bir yerde yazılması gerekiyor — bu imzada alan yok, notu
   * soran dialog'u ve yükü çağıran kurar. RAPOR EDİLDİ.
   */
  onResolve: (report: ListingReport) => void
  /** "Geçersiz say" (brifing 2.8). `onResolve` ile aynı boşluk: gerekçe alanı yok. */
  onDismiss: (report: ListingReport) => void
  /**
   * "Moderatöre eskale et" (brifing 2.8).
   *
   * Sınırlı kademenin (`report:triageLimited`) de yapabildiği tek yükseltme
   * eylemi budur: içerik denetçisi `severity`'yi değiştiremez ama işi yukarı
   * taşıyabilir. Kimin eskale edeceğini seçmek mümkün değil — hedef admin
   * argümanı yok.
   */
  onEscalate: (report: ListingReport) => void
  /** Hata bloğundaki "tekrar dene" butonu. `ListingListPageProps.onRetry` ile aynı gerekçe. */
  onRetry: () => void
}

/**
 * Seçilebilir tema; `src/tokens/`'ın üç tema dosyasıyla birebir.
 *
 * Enum değil düz birleşim: değerler çalışma anında bir sözlüğe anahtar olmuyor,
 * doğrudan `data-theme` attribute'una yazılıyor ve `domain.ts`'te de yer almıyor
 * — tema bir backend kavramı değil, bir tarayıcı tercihi. Storybook'un toolbar'ı
 * da aynı üç değeri kullanır.
 */
export type ThemeName = 'corporate-blue' | 'neutral-slate' | 'warm-amber'

/**
 * Ayarlar ekranı (brifing 2.9).
 *
 * **Kabuk değil, içerik** — bkz. `DashboardStatsProps`.
 *
 * **`state: AsyncState` yok — bilerek.** Ayarlar tek bir sorgu değil; izinler,
 * tema ve (ileride) moderasyon tercihleri ayrı kanallar. Faz 3'te bu, `Loading`
 * story'sinin yazılamamasına yol açıyordu; (b) turunda **`loading` bayrağı**
 * eklendi — reponun `StatCard`/`DataTable`/`RolePermissionMatrix.saving`
 * kalıbıyla aynı (her zaman var olan prop'un üstünde yükleme bayrağı). Kabuk
 * yüklenirken iskelet gösterilir, veri prop'ları (yer tutucu) yok sayılır.
 *
 * `Unauthorized` iki ayrı şey: `canManagePermissions: false` **düzenleme** kapısı
 * (matris `readOnly` görünür, Faz 3'ün story'si budur); sunucunun **403**'ü ise
 * "ayarları hiç göremezsin" — onun için `unauthorized` bayrağı eklendi.
 *
 * Kanalı hâlâ olmayan brifing 2.9 istekleri (backend gelince): moderasyon
 * tercihleri, ilan süreleri, sayfalama varsayılanları, audit özeti (hepsi
 * "görünen veri") ve `permissionConflict` — `RolePermissionMatrixProps.baseline`
 * karşılaştırma yapabiliyor ama "başka bir superAdmin senden önce kaydetti"yi
 * söyleyecek hata kanalı hâlâ yok.
 */
export interface SettingsPageProps {
  /**
   * İzin matrisinin **düzenlenmekte olan** hâli; `RolePermissionMatrixProps.value`'ya
   * geçirilir.
   *
   * Kontrollü ve zorunlu: taslağı ekran değil çağıran tutar. `savedRolePermissions`
   * ile farkı "kaydetmeden önce neyi değiştiriyorum" sorusunun cevabı.
   *
   * `ROLE_PERMISSIONS` doğrudan geçilebilir. **Kademeler kapsayıcıdır**:
   * `superAdmin` hem `UserEdit`'e hem `UserEditProfile`/`UserEditContact`'e
   * sahiptir ve matris hücreleri olduğu gibi gösterir — "tam yetkilide sınırlı
   * satırı gizle" gibi bir yorum yapmaz.
   */
  rolePermissions: Record<AdminRole, readonly AdminPermission[]>
  /**
   * İzinlerin **kayıtlı** hâli; `diff` görünümünün tabanı.
   *
   * `rolePermissions` düzenlenmekte olan taslaktır, bu ise sunucudaki son hâl:
   * ikisinin farkı "kaydetmeden önce neyi değiştiriyorum" sorusunun cevabıdır ve
   * `dirty` de tam olarak bu farkın boş olup olmadığını söyler.
   *
   * `RolePermissionMatrixProps.baseline`'a geçirilir. Verilmezse matris
   * `ROLE_PERMISSIONS`'a düşer ve diff "fabrika ayarından farkı" gösterir —
   * anlamlı ama başka bir soru; hangisini sorduğunuzu bilerek verin.
   */
  savedRolePermissions?: Record<AdminRole, readonly AdminPermission[]>
  /**
   * Oturumdaki kullanıcının **kendi** teması (brifing 2.9: "aktif kullanıcı
   * teması").
   *
   * `systemDefaultTheme` ile ayrı olmasının sebebi bir yetki ayrımı: temayı
   * seçmek `theme:manage` (dört rolde de var), sistem varsayılanını değiştirmek
   * `theme:setDefault` (yalnız `superAdmin`) ister. `AdminPermission.ThemeSetDefault`
   * tam bu yüzden eklendi — matris ikisini ayırmıştı, enum ayırmamıştı.
   */
  currentTheme: ThemeName
  /**
   * Yeni kullanıcıların ve tercih belirtmemişlerin göreceği tema (brifing 2.9).
   *
   * `currentTheme`'e **eşit olmak zorunda değil**: superAdmin kendisi koyu tema
   * kullanırken sistem varsayılanını kurumsal maviye bırakabilir. İkisini tek
   * alana indirmek bu ayrımı yok ederdi.
   */
  systemDefaultTheme: ThemeName
  /**
   * Kullanıcı rol izinlerini değiştirebiliyor mu (`permission:manage`, yalnız
   * `superAdmin` — brifing 2.9).
   *
   * `false` iken matris `readOnly` varyantıyla gösterilir, `disabled`'la
   * **değil**: `RolePermissionMatrixProps.disabled`'ın JSDoc'u bunu açıkça
   * söylüyor — kilitli matris "yetkim mi yok, sistem mi meşgul" sorusunu
   * cevaplamaz, salt okunur matris "bu rol ne yapabilir" sorusunu cevaplar.
   *
   * Düz `boolean`, izin listesi değil: bu ekranda tek bir izin sorusu var ve
   * cevabı çağıran zaten hesaplamış durumda. (`availablePermissions` alan
   * ekranlarda birden çok kapı var; burada yok.)
   */
  canManagePermissions: boolean
  /**
   * Kullanıcı sistem varsayılan temasını değiştirebiliyor mu
   * (`theme:setDefault`, yalnız `superAdmin`).
   *
   * `false` iken varsayılan tema seçicisi **hiç render edilmez**, `disabled`
   * verilmez — kullanıcının kendi teması (`currentTheme`) yine seçilebilir kalır;
   * iki kontrol farklı kapıların arkasında.
   */
  canManageDefaultTheme: boolean
  /**
   * Kabuk yükleniyor; brifing 3.5'in bu ekran için zorunlu `Loading` story'si
   * (Faz 3'te kanalsızdı, RAPOR EDİLMİŞTİ).
   *
   * `true` iken ekran iskelet gösterir ve veri prop'larını (`rolePermissions`,
   * `currentTheme` — yer tutucu geçilebilir) yok sayar. `AsyncState` yerine düz
   * bayrak: ayarlar tek sorgu değil, ve reponun `StatCard`/`DataTable` kalıbı bu
   * (her zaman var olan prop'un üstünde yükleme bayrağı). `saving`'den ayrı —
   * biri ilk yükleme, öteki kaydetme.
   *
   * @default false
   */
  loading?: boolean
  /**
   * Sunucu ayarları 403 ile reddetti; brifing 3.5'in zorunlu `Unauthorized`
   * story'sinin **sunucu** hâli.
   *
   * `canManagePermissions: false`'tan **farklı**: o "düzenleyemezsin ama görürsün"
   * (matris `readOnly`), bu "hiç göremezsin". `true` iken ekran
   * `ErrorState variant="page"` gösterir (tekrar dene yok — 403 tekrar denemekle
   * geçmez) ve matris/tema hiç render edilmez. İstemcinin izin listesi bayatlamış
   * olabilir; önden bilinen yetkisizlikte bu ekran zaten hiç açılmaz.
   *
   * @default false
   */
  unauthorized?: boolean
  /**
   * Kaydetme sürüyor; matris kilitlenir ve butonda spinner çıkar
   * (`RolePermissionMatrixProps.saving`).
   *
   * `canManagePermissions`'tan ayrı çünkü sebebi farklı ve geçici: kullanıcı
   * beklediğini bilmeli, "yetkim mi yok?" diye düşünmemeli.
   *
   * @default false
   */
  saving?: boolean
  /**
   * Kaydedilmemiş değişiklik var; brifing 2.9'un `dirty` durumu ve 3.5'in zorunlu
   * `Dirty` story'si.
   *
   * Ekran **hesaplamaz**: `rolePermissions` ile `savedRolePermissions`'ın farkının
   * boş olup olmadığı sorusudur ve `savedRolePermissions` opsiyonel — verilmediğinde
   * ekranın karşılaştıracağı bir taban yok. Ayrılırken uyarmak da çağıranın işi.
   *
   * @default false
   */
  dirty?: boolean
  /**
   * Bir izin hücresi değiştiğinde çalışır; `RolePermissionMatrixProps.onChange`'e
   * geçirilir.
   *
   * **Tek hücreyi bildirir, tabloyu değil**: değişikliği `rolePermissions`'a
   * işlemek ve kaydetmek çağıranın işi. Matrisin tamamını göndermek "kim neyi
   * değiştirdi" bilgisini kaybederdi — audit log'un (brifing 2.10) "önceki ve
   * sonraki değerler" sütunu tam olarak buna dayanır.
   */
  onPermissionChange: (role: AdminRole, permission: AdminPermission, enabled: boolean) => void
  /**
   * Kullanıcı kendi temasını seçtiğinde çalışır.
   *
   * **`onSave`'i beklemez varsayımıyla tasarlandı**: tema anında uygulanır —
   * "kaydet"e kadar bekleyen bir tema seçici, kullanıcıya seçtiği şeyi
   * göstermeden karar verdirir. Bu yüzden `dirty` bu değeri kapsamaz; `dirty`
   * yalnız izin matrisinin taslağını anlatır.
   */
  onThemeChange: (theme: ThemeName) => void
  /**
   * Sistem varsayılan teması değiştiğinde çalışır. `canManageDefaultTheme`
   * `false` iken kontrol hiç render edilmediği için çağrılmaz.
   */
  onSystemDefaultThemeChange: (theme: ThemeName) => void
  /**
   * "Kaydet" — izin taslağını sunucuya yazar.
   *
   * Onaylatmayı **çağıran** yapar ve yapmalı: yetki değişikliği geri alınması
   * pahalı bir iştir, `RolePermissionMatrix`'in `diff` varyantı da tam bu yüzden
   * var (kaydetmeden önce "neyi değiştiriyorum").
   *
   * Kaydetmenin **başarısız olduğunu** bildirecek kanal yok: brifing 2.9'un
   * `permissionConflict` durumu ifade edilemiyor (bkz. tip JSDoc'u).
   */
  onSave: () => void
  /**
   * "Varsayılana dön" (brifing 2.9).
   *
   * **Hangi varsayılan olduğu sözleşmede yazılı değil** ve iki okuması da
   * savunulabilir: kaydedilmiş hâle dönmek (`savedRolePermissions`) ya da fabrika
   * ayarına dönmek (`ROLE_PERMISSIONS`). İkisi farklı şeyler —
   * `savedRolePermissions`'ın JSDoc'u aynı ikiliği `baseline` için anlatıyor.
   * Kurulan okuma: **kaydedilmiş hâle dönmek**, yani "değişikliklerimi at" —
   * `dirty`'nin sıfırlanması budur ve fabrika ayarına dönmek yıkıcı bir eylemdir,
   * onay ister. Başka bir şey kastedildiyse tek satırlık netleştirme yeter.
   */
  onReset: () => void
}

/**
 * Audit log ekranının filtre değerleri (brifing 2.10).
 *
 * Adı `*FilterValues` değil `*Filters` — diğer üçünden sapan tek isim. Brifingin
 * kendi sözleşmesinden geliyor ve imza dondurulduğu için düzeltilmedi; anlamı ve
 * kalıbı aynı (koleksiyonlar boş dizi, tekiller `undefined`).
 *
 * `filteredEmpty` okuması `ListingFilterValues`'ın JSDoc'unda — ama brifing 2.10
 * bu ekran için yalnız düz `empty` istiyor.
 *
 * Faz 3 sonrası (b) turunda `actorId` ve `actions` eklendi — brifing 2.10'un
 * "kullanıcı ve eyleme göre filtreleme"si artık `query` serbest metnine mahkûm
 * değil.
 */
export interface AuditLogFilters {
  /** Serbest metin araması: admin adı, eylem veya varlık kimliği. */
  query?: string
  /** Seçili admin rolleri (`AuditLogEntry.actorRole`); boş dizi "hepsi". */
  roles: AdminRole[]
  /**
   * Seçili admin kimlikleri (`AuditLogEntry.actorId`); boş/verilmemiş "hepsi".
   * Brifing 2.10'un "kullanıcıya göre filtreleme"si. Seçenek adları
   * `AuditLogPageProps.actorOptions`'tan (id → ad).
   *
   * `roles`/`entityTypes`'ın aksine **opsiyonel** — Faz 3'ün mevcut çağıranlarını
   * kırmadan eklendi (geriye dönük uyum); yeni bir filtre olduğu için her çağıran
   * doldurmuyor.
   */
  actorIds?: string[]
  /**
   * Seçili eylem kodları (`AuditLogEntry.action`); boş/verilmemiş "hepsi". Brifing
   * 2.10'un "eyleme göre filtreleme"si. Kodlar `AdminPermission` uzayından
   * (`ADMIN_PERMISSION_LABEL` etiketler). Opsiyonel — `actorIds` ile aynı gerekçe.
   */
  actions?: string[]
  /**
   * Seçili varlık tipleri; boş dizi "hepsi".
   *
   * `AuditLogEntry['entityType']` diye **indekslenerek** alınıyor, altı değer
   * yeniden yazılarak değil: `domain.ts` fiilen FastAPI'nin şartnamesi ve oraya
   * yeni bir varlık tipi eklendiğinde elle yazılmış bir kopya sessizce geride
   * kalırdı — süzülemeyen ama listede görünen bir tip.
   */
  entityTypes: AuditLogEntry['entityType'][]
  /** Zaman aralığı (`AuditLogEntry.createdAt`); boş nesne (`{}`) "aralık yok". */
  dateRange: DateRange
}

/**
 * Audit log ekranı (brifing 2.10).
 *
 * **Kabuk değil, içerik** ve **veri çekmez** — bkz. `DashboardStatsProps`.
 * Detay çekmecesinin açıklığı görüntü state'idir: ekranın kendi işi, prop değil.
 */
export interface AuditLogPageProps {
  /**
   * Listenin durumu. `Paginated<AuditLogEntry>` — audit log reponun en çok
   * satırlı tablosu ve sayfalama sunucuda.
   *
   * `unauthorized` brifing 3.5'in bu ekran için zorunlu tuttuğu story ve burada
   * **gerçekten olası**: `AuditView` yalnız `superAdmin` ve `moderator`'da var
   * (`ROLE_PERMISSIONS`). Yine de tekrar deneme sunmaz — 403'ü tekrarlamak aynı
   * 403'ü verir.
   */
  state: AsyncState<Paginated<AuditLogEntry>>
  /** Filtrelerin güncel değeri; kontrollü ve zorunlu. */
  filters: AuditLogFilters
  /** Bir filtre değiştiğinde birleştirilmiş yeni değerle çalışır (fark değil, son hâl). */
  onFiltersChange: (filters: AuditLogFilters) => void
  /** Sayfa değiştiğinde 1-tabanlı yeni sayfa ile çalışır. */
  onPageChange: (page: number) => void
  /**
   * Bir kayda tıklandığında çalışır.
   *
   * **İki eylem tek kanala biniyor ve bu bir sözleşme hatası.** Brifing 2.10 iki
   * ayrı eylem istiyor: "JSON detayını açma" (`Drawer` + `CodeBlock`, kayıtta
   * kalır) ve "ilgili varlığa gitme" (`entityId` üzerinden ilan/kullanıcı
   * detayına, ekrandan **ayrılır**). Bu ad ikisi olarak da okunabiliyor, oysa
   * ikisi bir kanal olamaz — biri çekmece açar, öteki rota değiştirir.
   *
   * Kurulan okuma: **JSON detayını açar** (`Drawer`), çünkü brifing 2.10 `Drawer`
   * ve `CodeBlock`'u bu ekranın türetilen component'leri sayıyor ve satırın kendi
   * eylemi odur. "Varlığa gitme" artık ayrı bir kanal (`onEntityOpen`).
   */
  onEntryOpen: (entry: AuditLogEntry) => void
  /**
   * "İlgili varlığa gitme" (brifing 2.10); `entityType`+`entityId` ile ilan/
   * kullanıcı/şikayet detayına götürür — ekrandan **ayrılır** (Faz 3'te kanalsızdı,
   * `onEntryOpen` ile karışıyordu, RAPOR EDİLMİŞTİ). Opsiyonel; verilmezse detay
   * çekmecesinde "varlığa git" bağlantısı çıkmaz.
   */
  onEntityOpen?: (entry: AuditLogEntry) => void
  /** Hata bloğundaki "tekrar dene" butonu. */
  onRetry: () => void
  /**
   * Kullanıcı (aktör) filtresi için seçenek kaynağı: `actorId` → ad. Ekran
   * kimlikleri adlara çeviremez (veri çekmez); sayfa katmanı doldurur. Verilmezse
   * aktör filtresi render edilmez.
   */
  actorOptions?: SelectOption[]
  /**
   * "Yetkiye göre dışa aktarma" (brifing 2.10; Faz 3'te kanalsızdı, RAPOR
   * EDİLMİŞTİ). Mevcut filtreyle eşleşen kayıtları dışa aktarır — ne aktardığını
   * (CSV/JSON) çağıran belirler.
   *
   * Opsiyonel: yetki (`audit:view` zaten kapıda, dışa aktarma daha dar bir kapıya
   * bağlanabilir) olmadan verilmez → buton çıkmaz. Sonuçsuz buton sunmamak için
   * `onExport` verilmedikçe dışa aktar butonu render edilmez.
   */
  onExport?: () => void
}

/**
 * Kimlik doğrulama ve erişim ekranları (brifing 2.11).
 *
 * **Reponun tek istisnası: bu ekran kabuğun DIŞINDA, tam sayfa.** Diğer on
 * ekran `AppShell`'in `<main>`'ine girer ve `<h1>`'i `PageHeader`'a bırakır;
 * bunun etrafında kabuk **yoktur** — giriş yapmamış kullanıcıya menü ve profil
 * çubuğu gösterilemez, 404'te de gidilecek bir bölüm yok. Dolayısıyla sayfanın
 * `<h1>`'ini **bu ekran basar** ve tek `<h1>` kuralı yine korunur.
 *
 * **Düzen varyantı yok.** Brifing 3.5 `Centered card` ve `Split brand panel`
 * varyantlarını zorunlu tutuyor ama sözleşmede onları ayıracak bir prop
 * bulunmuyor — iki düzen aynı story'de seçilemiyor. RAPOR EDİLDİ.
 */
export interface AuthScreenProps {
  /**
   * Hangi erişim ekranı gösterilecek (brifing 2.11).
   *
   * - `login`: giriş formu. `onSubmit` ile birlikte anlamlı.
   * - `sessionExpired`: oturum doldu; form yine gösterilir ama bağlamı farklı —
   *   kullanıcı zaten giriş yapmıştı ve nereye döneceğini bilir.
   * - `forbidden`: tam sayfa 403.
   * - `notFound`: 404.
   * - `fatalError`: beklenmeyen global hata.
   *
   * **`forbidden` ile `AsyncState`'in `unauthorized`'ı farklı kanallar ve
   * karıştırılmamalı**: `unauthorized` bir veri ekranının 403'üdür — kabuğun
   * *içinde* olur, menü durur, kullanıcı başka bir bölüme geçebilir. Bu ise
   * sayfanın kendisine erişilememesidir. İkisi de **tekrar dene sunmaz**: aynı
   * kimlikle aynı isteği tekrarlamak aynı 403'ü verir; doğru çıkış güvenli bir
   * geri dönüş bağlantısıdır (`onPrimaryAction`).
   *
   * `notFound` da ayrı: `ListingReviewPanel`'in "ilan bulunamadı"sı bir
   * `status === 'empty'`tir ve kabuğun içinde kalır — kullanıcı kuyruğa
   * dönebilmeli. Bu ekran rotanın kendisinin olmadığı hâl.
   */
  mode: 'login' | 'sessionExpired' | 'forbidden' | 'notFound' | 'fatalError'
  /**
   * Giriş isteği uçuyor; butonda spinner çıkar ve alanlar kilitlenir.
   *
   * Yalnız `login` ve `sessionExpired`'da anlamlı — diğer üç mod bir istek
   * göndermez, gösterdikleri şey zaten sonucun kendisi.
   *
   * @default false
   */
  loading?: boolean
  /**
   * Gösterilecek hata: yanlış parola, kilitli hesap, sunucu hatası. `Alert` ile
   * gösterilir.
   *
   * Tipi bilerek `string` kaldı (diğer ekranların `UiError`'ından farklı): giriş
   * ekranının hatası tek bir cümledir, `ErrorState`'in başlık/açıklama/retryable
   * ayrımına ihtiyaç duymaz. **Destek kodu** eksikliği ise (`fatalError`'da
   * kullanıcının okuyacağı kod) ayrı bir alanla kapatıldı — `errorCode`.
   *
   * Yokluğu bir durum (hata yok), bu yüzden `meta.args`'a konmaz (AGENTS.md,
   * TS2375) — `LoginError` story'si kendi verir.
   */
  error?: string
  /**
   * Destek koduna eşlik eden kod; `fatalError`/`forbidden` modunda kullanıcının
   * destek ekibine okuyacağı referans (Faz 3'te kanalsızdı, RAPOR EDİLMİŞTİ —
   * `error` düz string olduğu için `UiError.code` karşılığı yoktu).
   *
   * `error` ile birlikte gösterilir; mono yazıyla, seçilebilir. Yokluğu bir durum.
   */
  errorCode?: string
  /**
   * Giriş formu gönderildiğinde çalışır. Verilmezse form hiç render edilmez.
   *
   * Doğrulamayı ekran **yapmaz**: parolanın doğru olup olmadığını sunucu söyler
   * ve sonucu `error` ile geri gelir. Alan boşluğu gibi biçimsel kurallar form
   * katmanının işi.
   *
   * Yalnız `login` ve `sessionExpired`'da anlamlı; diğer modlarda yok sayılır.
   */
  onSubmit?: (credentials: { email: string; password: string }) => void
  /**
   * Formsuz modların tek eylemi: "Panele dön" (`forbidden`/`notFound`), "Tekrar
   * dene" (`fatalError`).
   *
   * Etiketi **ekran** seçer, `mode`'a göre — bir `label` prop'u yok. Verilmezse
   * buton hiç görünmez: sonuçsuz bir çıkış butonu, kullanıcıyı çıkışı olduğuna
   * inandırıp bırakmak olur.
   *
   * `fatalError`'da tekrar denemek **anlamlı** (`forbidden`'ın aksine): beklenmeyen
   * bir hata geçici olabilir, 403 olmaz.
   */
  onPrimaryAction?: () => void
}
