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
  rows: T[]
  columns: ColumnDef<T>[]
  rowKey?: (row: T) => string
  /**
   * Satır seçim kutusunun erişilebilir etiketi.
   *
   * Brifingden sapma: eklendi. Gerekçe: etiket verilmezse ekran okuyucu
   * kullanıcısı 12 satırda da aynı metni duyar ve hangisini seçtiğini anlamaz.
   * Verilmezse satır numarasına düşülür — jenerik ama en azından benzersiz.
   */
  rowLabel?: (row: T) => string
  density?: 'comfortable' | 'compact'
  visualStyle?: 'plain' | 'bordered' | 'striped'
  mobileMode?: 'scroll' | 'cards'
  loading?: boolean
  error?: UiError
  emptyState?: ReactNode
  selectable?: boolean
  selectedIds?: string[]
  sort?: { columnId: string; direction: 'asc' | 'desc' }
  stickyHeader?: boolean
  onSelectionChange?: (ids: string[]) => void
  onSortChange?: (sort: { columnId: string; direction: 'asc' | 'desc' }) => void
  onRowClick?: (row: T) => void
  renderMobileCard?: (row: T) => ReactNode
}

export type FilterValue = string | number | boolean | string[] | DateRange | null | undefined

export interface FilterDefinition {
  id: string
  label: string
  type: 'text' | 'select' | 'multiSelect' | 'numberRange' | 'dateRange' | 'boolean'
  options?: SelectOption[]
  placeholder?: string
}

export interface FilterBarProps {
  definitions: FilterDefinition[]
  values: Record<string, FilterValue>
  variant?: 'inline' | 'stacked' | 'drawer'
  activeFilterCount?: number
  loading?: boolean
  disabled?: boolean
  savedViewName?: string
  onChange: (id: string, value: FilterValue) => void
  onClear: () => void
  onApply?: () => void
  onSaveView?: (name: string) => void
}

export interface StatusBadgeProps {
  status: ListingStatus
  variant?: 'solid' | 'soft' | 'outline'
  size?: 'sm' | 'md'
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

export interface ModerationCapabilities {
  canApprove: boolean
  canReject: boolean
  canRequestChanges: boolean
  canPause: boolean
  canArchive: boolean
}

export interface ModerationDecisionPayload {
  listingId: string
  expectedRevision: number
  reasons: RejectionReason[]
  note?: string
}

export interface ModerationActionBarProps {
  listingId: string
  status: ListingStatus
  revision: number
  capabilities: ModerationCapabilities
  variant?: 'stickyBottom' | 'inline' | 'sideRail'
  submittingAction?: 'approve' | 'reject' | 'requestChanges' | 'pause' | 'archive'
  onApprove: (payload: ModerationDecisionPayload) => void | Promise<void>
  onReject: (payload: ModerationDecisionPayload) => void | Promise<void>
  onRequestChanges: (payload: ModerationDecisionPayload) => void | Promise<void>
  onPause?: (payload: ModerationDecisionPayload) => void | Promise<void>
  onArchive?: (payload: ModerationDecisionPayload) => void | Promise<void>
}

export interface ImageGalleryProps {
  photos: ListingPhoto[]
  activePhotoId?: string
  variant?: 'mosaic' | 'filmstrip' | 'split'
  loading?: boolean
  allowModeration?: boolean
  onActivePhotoChange?: (photoId: string) => void
  onPhotoApprove?: (photoId: string) => void
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
  page: number
  pageSize: number
  totalItems: number
  pageSizeOptions?: number[]
  variant?: 'numbered' | 'compact' | 'loadMore'
  disabled?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export interface RejectionReasonPickerProps {
  value: RejectionReason[]
  note: string
  variant?: 'cards' | 'list' | 'compactSelect'
  required?: boolean
  disabled?: boolean
  error?: string
  onValueChange: (reasons: RejectionReason[]) => void
  onNoteChange: (note: string) => void
}

export interface EmptyStateProps {
  title: string
  description?: string
  illustration?: ReactNode
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  variant?: 'default' | 'compact' | 'filtered'
}

export interface ErrorStateProps {
  title: string
  description: string
  code?: string
  retryLabel?: string
  variant?: 'page' | 'section' | 'inline'
  onRetry?: () => void
}

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'neutral' | 'danger'
  requireText?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export interface BulkActionDefinition {
  id: string
  label: string
  tone?: 'neutral' | 'danger'
  icon?: ReactNode
  disabled?: boolean
}

export interface BulkActionBarProps {
  selectedCount: number
  actions: BulkActionDefinition[]
  variant?: 'floating' | 'sticky' | 'inline'
  loadingActionId?: string
  onAction: (actionId: string) => void
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
  events: ModerationEvent[]
  variant?: 'timeline' | 'table' | 'compact'
  loading?: boolean
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

export interface AutomatedCheckItem {
  id: string
  label: string
  status: 'passed' | 'warning' | 'failed'
  message: string
  score?: number
}

export interface AutomatedChecksPanelProps {
  items: AutomatedCheckItem[]
  variant?: 'list' | 'cards' | 'summary'
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
