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
export type AsyncStatus = 'idle' | 'loading' | 'empty' | 'success' | 'error'

export interface UiError {
  title: string
  message: string
  code?: string
  retryable: boolean
}

export type AsyncState<T> =
  | { status: 'idle' | 'loading' }
  | { status: 'empty'; data?: T }
  | { status: 'error'; error: UiError }
  | { status: 'success'; data: T; stale?: boolean }

export interface FieldMetaProps {
  label?: string
  helperText?: string
  error?: string
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
  /** @default 'md' */
  size?: 'sm' | 'md'
  /** Metnin solunda gösterilen ikon. Dekoratiftir, ekran okuyucudan gizlenir. */
  leadingIcon?: ReactNode
}

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  selected?: boolean
  removable?: boolean
  disabled?: boolean
  onRemove?: () => void
}

// `required` native attribute'lardan çıkarıldı: exactOptionalPropertyTypes açıkken
// HTML'in `required?: boolean | undefined` tipi ile FieldMetaProps'un
// `required?: boolean` tipi çakışıyordu (TS2320). Zorunluluk bilgisi tek
// kaynaktan, FieldMetaProps'tan gelir.
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'required'>, FieldMetaProps {
  /** @default 'md' */
  size?: ControlSize
  /** Kutunun solunda gösterilen ikon. Dekoratiftir, ekran okuyucudan gizlenir. */
  leadingIcon?: ReactNode
  /** Kutunun sağında gösterilen eylem (temizle, göster/gizle gibi). */
  trailingAction?: ReactNode
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
  onSearch?: (value: string) => void
  onClear?: () => void
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
  min?: number
  max?: number
  step?: number
  /** @default 'md' */
  size?: ControlSize
  disabled?: boolean
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
  min?: number
  max?: number
  /** @default 'md' */
  size?: ControlSize
  disabled?: boolean
  /** Tutar değiştiğinde çalışır. Kutu boşaltılırsa `undefined` gelir. */
  onValueChange?: (value: number | undefined) => void
  /** Para birimi değiştiğinde çalışır. */
  onCurrencyChange?: (currency: Currency) => void
}

export interface SelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface SelectProps extends FieldMetaProps {
  /** Seçili değer. Seçim yoksa `undefined`. Bkz. NumberInputProps.value — aynı düzeltme. */
  value?: string | undefined
  options: SelectOption[]
  /** Seçim yokken gösterilen metin. Etiket yerine geçmez. */
  placeholder?: string
  /** @default 'md' */
  size?: ControlSize
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
  values: string[]
  options: SelectOption[]
  placeholder?: string
  size?: ControlSize
  disabled?: boolean
  searchable?: boolean
  loading?: boolean
  maxVisibleTags?: number
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
  /** Seçim değiştiğinde çalışır. */
  onCheckedChange?: (checked: boolean) => void
}

export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface RadioGroupProps extends FieldMetaProps {
  value?: string
  options: RadioOption[]
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
  onValueChange?: (value: string) => void
}

export interface SwitchProps {
  checked: boolean
  label: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  onCheckedChange?: (checked: boolean) => void
}

// `required` için InputProps ile aynı gerekçe.
export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'color' | 'required'>, FieldMetaProps {
  resize?: 'none' | 'vertical' | 'both'
  showCharacterCount?: boolean
  maxLength?: number
}

export interface DateRange {
  from?: ISODate
  to?: ISODate
}

export interface DateRangePickerProps extends FieldMetaProps {
  value: DateRange
  min?: ISODate
  max?: ISODate
  disabled?: boolean
  presets?: Array<{ label: string; value: DateRange }>
  onValueChange?: (value: DateRange) => void
}

export interface TooltipProps {
  content: ReactNode
  children: ReactElement
  placement?: 'top' | 'right' | 'bottom' | 'left'
  delayMs?: number
  disabled?: boolean
}

export interface AvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy'
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label: string
}

export interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rectangle'
  width?: string
  height?: string
  lines?: number
}

export interface ModalProps {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
  onOpenChange: (open: boolean) => void
}

export interface DrawerProps {
  open: boolean
  title: string
  children: ReactNode
  footer?: ReactNode
  side?: 'left' | 'right' | 'bottom'
  size?: 'sm' | 'md' | 'lg'
  onOpenChange: (open: boolean) => void
}

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastProps {
  open: boolean
  title: string
  description?: string
  tone?: 'success' | 'warning' | 'danger' | 'info'
  action?: ToastAction
  durationMs?: number
  onOpenChange: (open: boolean) => void
}

export interface TabItem {
  id: string
  label: string
  badge?: string | number
  disabled?: boolean
  content: ReactNode
}

export interface TabsProps {
  value: string
  items: TabItem[]
  variant?: 'underline' | 'pill' | 'contained'
  orientation?: 'horizontal' | 'vertical'
  onValueChange: (value: string) => void
}

export interface AccordionItem {
  id: string
  title: string
  description?: string
  content: ReactNode
  disabled?: boolean
}

export interface AccordionProps {
  items: AccordionItem[]
  expandedIds: string[]
  allowMultiple?: boolean
  variant?: 'separated' | 'bordered' | 'plain'
  onExpandedIdsChange: (ids: string[]) => void
}

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  label?: string
}

export interface AlertProps {
  tone: 'success' | 'warning' | 'danger' | 'info'
  title: string
  description?: string
  variant?: 'solid' | 'soft' | 'outline'
  action?: ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: ReactNode
  badge?: number
  requiredPermission?: AdminPermission
  children?: NavigationItem[]
}

export interface SidebarNavProps {
  items: NavigationItem[]
  activeItemId: string
  collapsed?: boolean
  mobileOpen?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  onMobileOpenChange?: (open: boolean) => void
}

export interface TopBarProps {
  title?: string
  searchValue?: string
  currentUser: UserAccount
  notificationsCount?: number
  onSearchChange?: (value: string) => void
  onMenuClick?: () => void
  onProfileClick?: () => void
}

export interface AppShellProps {
  navigation: ReactNode
  topBar: ReactNode
  children: ReactNode
  sidebarMode?: 'fixed' | 'collapsible'
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
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
  listing: Listing
  variant?: 'compact' | 'detailed' | 'grid'
  selected?: boolean
  flagged?: boolean
  showModerationMeta?: boolean
  actions?: ReactNode
  onClick?: (listing: Listing) => void
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
  label: string
  value: string | number
  description?: string
  trend?: {
    direction: 'up' | 'down' | 'flat'
    value: string
    sentiment: 'positive' | 'negative' | 'neutral'
  }
  icon?: ReactNode
  variant?: 'plain' | 'accent' | 'trend'
  loading?: boolean
  onClick?: () => void
}

export interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  toolbar?: ReactNode
  loading?: boolean
  error?: UiError
  empty?: boolean
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
  roles: AdminRole[]
  permissions: AdminPermission[]
  value: Record<AdminRole, readonly AdminPermission[]>
  variant?: 'editable' | 'readOnly' | 'diff'
  disabled?: boolean
  saving?: boolean
  onChange?: (role: AdminRole, permission: AdminPermission, enabled: boolean) => void
}

export interface CategoryTreeNode {
  id: string
  label: string
  category?: ListingCategory
  children?: CategoryTreeNode[]
  active: boolean
  count?: number
}

export interface CategoryTreeProps {
  nodes: CategoryTreeNode[]
  selectedId?: string
  expandedIds: string[]
  variant?: 'sidebar' | 'panel' | 'compact'
  loading?: boolean
  onSelect: (id: string) => void
  onExpandedIdsChange: (ids: string[]) => void
}

export interface AttributeEditorProps {
  value: Partial<CategoryAttributeDefinition>
  mode: 'create' | 'edit' | 'readOnly'
  dirty?: boolean
  saving?: boolean
  validationErrors?: Record<string, string>
  onChange?: (value: Partial<CategoryAttributeDefinition>) => void
  onSave?: () => void
  onCancel?: () => void
}

export interface UserSummaryCardProps {
  user: UserAccount
  variant?: 'compact' | 'detailed' | 'security'
  actions?: ReactNode
  onClick?: (user: UserAccount) => void
}

export interface ReportCardProps {
  report: ListingReport
  listing?: Listing
  variant?: 'compact' | 'detailed' | 'queue'
  actions?: ReactNode
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
  listing: Listing
  variant?: 'sections' | 'definitionList' | 'comparison'
  previousListing?: Listing
  highlightedFields?: string[]
}

export interface LocationPanelProps {
  listing: Listing
  variant?: 'summary' | 'mapSplit' | 'addressDetail'
  revealExactLocation?: boolean
}

export interface SellerPanelProps {
  user: UserAccount
  listingCount: number
  openReportCount: number
  variant?: 'summary' | 'detailed' | 'risk'
  actions?: ReactNode
}

export interface PromotionFlagsPanelProps {
  flags: PromotionFlags
  promotions: ListingPromotion[]
  editable?: boolean
  variant?: 'badges' | 'cards' | 'table'
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
