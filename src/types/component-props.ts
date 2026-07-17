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
  AdminPermission,
  AdminRole,
  AuditLogEntry,
  AutomatedCheckResult,
  CategoryAttributeDefinition,
  Currency,
  DashboardMetrics,
  ISODate,
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
  UserStatus,
  UserType,
} from './domain'

export type ControlSize = 'sm' | 'md' | 'lg'
export type AsyncStatus =
  'idle' | 'loading' | 'empty' | 'success' | 'partialSuccess' | 'unauthorized' | 'error'

export interface UiError {
  title: string
  message: string
  code?: string
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
  | { status: 'idle' | 'loading' }
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

export interface DateRange {
  from?: ISODate
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

export interface ColumnDef<T> {
  id: string
  header: ReactNode
  accessor?: keyof T
  cell?: (row: T) => ReactNode
  sortable?: boolean
  hideable?: boolean
  width?: string
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
  min?: number
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
   * - `trend`: `trend` bilgisini büyütür ve mini bir eğri için yer açar.
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
   * - `compact`: tek satırlık özet. Şikayet listesinde.
   * - `detailed`: şikayetçinin açıklaması, atanmış admin ve çözüm notu görünür.
   *   Şikayet detayında.
   * - `queue`: triage kuyruğu için; şiddet ve bekleme süresi öne çıkar.
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
   * Satıcının **açık** şikayet sayısı.
   *
   * `user.reportCount` toplamı verir, oysa risk sinyali olan çözülmemiş
   * olanlardır: on şikayeti çözülmüş bir satıcı ile iki şikayeti açık duran
   * satıcı aynı şey değildir.
   */
  openReportCount: number
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

export interface DashboardStatsProps {
  state: AsyncState<DashboardMetrics>
  dateRange: DateRange
  onDateRangeChange: (value: DateRange) => void
  onMetricClick?: (metricId: string) => void
  onRetry?: () => void
}

export interface ListingFilterValues {
  query?: string
  categories: ListingCategory[]
  statuses: ListingStatus[]
  cityCode?: string
  districtId?: string
  neighborhoodId?: string
  minPrice?: number
  maxPrice?: number
  currencies: Currency[]
  // Brifingden sapma: `string[]` yerine gerçek domain tipleri. Brifingin kendi
  // tip güvenliği kriteri gereği; `string[]` ile geçersiz değer yazılabiliyordu.
  sellerTypes: SellerType[]
  dateRange: DateRange
  promotionTypes: PromotionType[]
  reportedOnly?: boolean
  reviewerId?: string
}

export interface ListingListPageProps {
  state: AsyncState<Paginated<Listing>>
  filters: ListingFilterValues
  selectedIds: string[]
  availablePermissions: AdminPermission[]
  onFiltersChange: (filters: ListingFilterValues) => void
  onSelectionChange: (ids: string[]) => void
  onPageChange: (page: number) => void
  onListingOpen: (listing: Listing) => void
  onBulkAction: (actionId: string, ids: string[]) => void
  onRetry: () => void
}

export interface ApprovalQueueProps {
  state: AsyncState<Paginated<Listing>>
  selectedListingId?: string
  lockedListingIds?: string[]
  currentAdminId: string
  capabilities: ModerationCapabilities
  onSelectListing: (listingId: string) => void
  onAssignToSelf: (listingId: string) => void
  onSkip: (listingId: string) => void
  onOpenDetail: (listingId: string) => void
  onRetry: () => void
}

export interface ListingReviewData {
  listing: Listing
  events: ModerationEvent[]
  reports: ListingReport[]
  seller: UserAccount
  previousRevision?: Listing
}

export interface ListingReviewPanelProps {
  state: AsyncState<ListingReviewData>
  capabilities: ModerationCapabilities
  submittingAction?: ModerationActionBarProps['submittingAction']
  /**
   * Karar çubuğuna geçirilir; brifing 3.5'in `Conflict` story'si budur.
   *
   * `state` ile aynı eksende **değil**: ilan başarıyla yüklenmişken karar
   * reddedilebilir — bkz. `ModerationDecisionError`.
   */
  decisionError?: ModerationActionBarProps['decisionError']
  onApprove: ModerationActionBarProps['onApprove']
  onReject: ModerationActionBarProps['onReject']
  onRequestChanges: ModerationActionBarProps['onRequestChanges']
  onPause?: ModerationActionBarProps['onPause']
  onArchive?: ModerationActionBarProps['onArchive']
  onRetry: () => void
}

export interface UserFilterValues {
  query?: string
  types: UserType[]
  statuses: UserStatus[]
  roles: AdminRole[]
  verified?: boolean
}

export interface UserManagementPageProps {
  state: AsyncState<Paginated<UserAccount>>
  filters: UserFilterValues
  availablePermissions: AdminPermission[]
  onFiltersChange: (filters: UserFilterValues) => void
  onPageChange: (page: number) => void
  onUserOpen: (user: UserAccount) => void
  onSuspend: (user: UserAccount) => void
  onBan: (user: UserAccount) => void
  onRoleChange: (user: UserAccount, role: AdminRole) => void
  onRetry: () => void
}

export interface UserDetailData {
  user: UserAccount
  listings: Paginated<Listing>
  reports: ListingReport[]
  auditEntries: AuditLogEntry[]
}

export interface UserDetailPageProps {
  state: AsyncState<UserDetailData>
  availablePermissions: AdminPermission[]
  onListingOpen: (listing: Listing) => void
  onSuspend: () => void
  onBan: () => void
  onRoleChange: (role: AdminRole) => void
  onRetry: () => void
}

export interface CategoryAttributePageData {
  tree: CategoryTreeNode[]
  attributes: CategoryAttributeDefinition[]
  selectedNodeId?: string
}

export interface CategoryAttributePageProps {
  state: AsyncState<CategoryAttributePageData>
  editorValue?: Partial<CategoryAttributeDefinition>
  editorMode?: 'create' | 'edit' | 'readOnly'
  dirty?: boolean
  saving?: boolean
  onNodeSelect: (id: string) => void
  onEditorChange: (value: Partial<CategoryAttributeDefinition>) => void
  onSave: () => void
  onPublish: () => void
  onRetry: () => void
}

export interface ReportFilterValues {
  query?: string
  reasons: ReportReason[]
  statuses: ReportStatus[]
  severities: ReportSeverity[]
  assignedAdminId?: string
  dateRange: DateRange
}

export interface ReportManagementPageProps {
  state: AsyncState<Paginated<ListingReport>>
  filters: ReportFilterValues
  onFiltersChange: (filters: ReportFilterValues) => void
  onPageChange: (page: number) => void
  onReportOpen: (report: ListingReport) => void
  onResolve: (report: ListingReport) => void
  onDismiss: (report: ListingReport) => void
  onEscalate: (report: ListingReport) => void
  onRetry: () => void
}

export type ThemeName = 'corporate-blue' | 'neutral-slate' | 'warm-amber'

export interface SettingsPageProps {
  rolePermissions: Record<AdminRole, readonly AdminPermission[]>
  currentTheme: ThemeName
  systemDefaultTheme: ThemeName
  canManagePermissions: boolean
  canManageDefaultTheme: boolean
  saving?: boolean
  dirty?: boolean
  onPermissionChange: (role: AdminRole, permission: AdminPermission, enabled: boolean) => void
  onThemeChange: (theme: ThemeName) => void
  onSystemDefaultThemeChange: (theme: ThemeName) => void
  onSave: () => void
  onReset: () => void
}

export interface AuditLogFilters {
  query?: string
  roles: AdminRole[]
  entityTypes: AuditLogEntry['entityType'][]
  dateRange: DateRange
}

export interface AuditLogPageProps {
  state: AsyncState<Paginated<AuditLogEntry>>
  filters: AuditLogFilters
  onFiltersChange: (filters: AuditLogFilters) => void
  onPageChange: (page: number) => void
  onEntryOpen: (entry: AuditLogEntry) => void
  onRetry: () => void
}

export interface AuthScreenProps {
  mode: 'login' | 'sessionExpired' | 'forbidden' | 'notFound' | 'fatalError'
  loading?: boolean
  error?: string
  onSubmit?: (credentials: { email: string; password: string }) => void
  onPrimaryAction?: () => void
}
