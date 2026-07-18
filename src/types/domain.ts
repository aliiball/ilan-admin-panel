export type UUID = string
export type ISODate = `${number}-${number}-${number}`
export type ISODateTime = string

export enum ListingStatus {
  Draft = 'draft',
  PendingReview = 'pendingReview',
  ChangesRequested = 'changesRequested',
  Published = 'published',
  Rejected = 'rejected',
  Paused = 'paused',
  Expired = 'expired',
  Archived = 'archived',
}

export enum ListingCategory {
  Residential = 'konut',
  Land = 'arsa',
  Commercial = 'isyeri',
  Building = 'bina',
  Timeshare = 'devremulk',
  TourismFacility = 'turistikTesis',
}

export enum ResidentialSubCategory {
  Apartment = 'daire',
  Residence = 'rezidans',
  DetachedHouse = 'mustakilEv',
  Villa = 'villa',
  SummerHouse = 'yazlik',
  FarmHouse = 'ciftlikEvi',
  Prefabricated = 'prefabrik',
}

export enum LandSubCategory {
  ResidentialZoned = 'konutImarli',
  CommercialZoned = 'ticariImarli',
  IndustrialZoned = 'sanayiImarli',
  TourismZoned = 'turizmImarli',
  Field = 'tarla',
  VineyardGarden = 'bagBahce',
}

export enum CommercialSubCategory {
  ShopStore = 'dukkanMagaza',
  Office = 'ofis',
  Plaza = 'plaza',
  Warehouse = 'depoAntrepo',
  Factory = 'fabrika',
  Workshop = 'atolye',
}

export enum BuildingSubCategory {
  CompleteBuilding = 'kompleBina',
}

export enum TimeshareSubCategory {
  Timeshare = 'devremulk',
}

export enum TourismFacilitySubCategory {
  Hotel = 'otel',
  BoutiqueHotel = 'butikOtel',
  ApartHotel = 'apartOtel',
  Pension = 'pansiyon',
  Motel = 'motel',
  HolidayVillage = 'tatilKoyu',
  Campground = 'kampYeri',
}

export type ListingSubCategory =
  | ResidentialSubCategory
  | LandSubCategory
  | CommercialSubCategory
  | BuildingSubCategory
  | TimeshareSubCategory
  | TourismFacilitySubCategory

export enum ResidentialTransactionType {
  Sale = 'satilik',
  Rent = 'kiralik',
  DailyRent = 'gunlukKiralik',
}

export enum LandTransactionType {
  Sale = 'satilik',
  Rent = 'kiralik',
}

export enum CommercialTransactionType {
  Sale = 'satilik',
  Rent = 'kiralik',
  Transfer = 'devren',
}

export enum BuildingTransactionType {
  Sale = 'satilik',
  Rent = 'kiralik',
}

export enum TimeshareTransactionType {
  Sale = 'satilik',
  Rent = 'kiralik',
}

export enum TourismFacilityTransactionType {
  Sale = 'satilik',
  Rent = 'kiralik',
  Transfer = 'devren',
}

export type ListingTransactionType =
  | ResidentialTransactionType
  | LandTransactionType
  | CommercialTransactionType
  | BuildingTransactionType
  | TimeshareTransactionType
  | TourismFacilityTransactionType

export enum Currency {
  Try = 'TRY',
  Usd = 'USD',
  Eur = 'EUR',
  Gbp = 'GBP',
}

export enum PricePeriod {
  OneTime = 'tekSefer',
  Monthly = 'aylik',
  Daily = 'gunluk',
  Yearly = 'yillik',
}

export interface Money {
  amount: number
  currency: Currency
  period: PricePeriod
  negotiable: boolean
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Location {
  countryCode: 'TR'
  cityCode: string
  cityName: string
  districtId: string
  districtName: string
  neighborhoodId: string
  neighborhoodName: string
  addressLine?: string
  postalCode?: string
  coordinates?: Coordinates
  showExactLocation: boolean
}

export enum RejectionReason {
  WrongCategory = 'yanlisKategori',
  DuplicateListing = 'mukerrerIlan',
  MisleadingOrIncompleteInfo = 'yanilticiEksikBilgi',
  InappropriateImage = 'uygunsuzGorsel',
  ContactInformationViolation = 'iletisimBilgisiIhlali',
  PricingError = 'fiyatHatasi',
  ProhibitedContent = 'yasakliIcerik',
  IncorrectLocation = 'yanlisKonum',
  MissingAuthorizationDocument = 'yetkiBelgesiEksik',
  DocumentMismatch = 'belgeUyusmazligi',
  SpamTitle = 'baslikSpam',
  InsufficientPhotoQuality = 'fotografKalitesiYetersiz',
  PersonalDataViolation = 'kisiselVeriIhlali',
  SuspectedFraud = 'sahteIlanSuphesi',
  OtherPolicyViolation = 'digerPolitikaIhlali',
}

export enum AssetModerationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export interface ListingPhoto {
  id: UUID
  url: string
  thumbnailUrl: string
  altText: string
  order: number
  isCover: boolean
  width: number
  height: number
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  moderationStatus: AssetModerationStatus
  rejectionReason?: RejectionReason
  moderationNote?: string
}

export enum SellerType {
  Owner = 'sahibinden',
  RealEstateOffice = 'emlakOfisi',
  ConstructionCompany = 'insaatFirmasi',
}

export enum SellerVerificationStatus {
  Unverified = 'unverified',
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected',
}

export interface SellerSummary {
  id: UUID
  type: SellerType
  displayName: string
  companyName?: string
  avatarUrl?: string
  verificationStatus: SellerVerificationStatus
}

export interface ListingContact {
  phone: string
  email?: string
  allowPhone: boolean
  allowMessage: boolean
  preferredContactMethod: 'phone' | 'message' | 'both'
}

export enum PromotionType {
  Featured = 'oneCikan',
  Urgent = 'acil',
  Showcase = 'vitrin',
  HomepageShowcase = 'anasayfaVitrini',
  CategoryFeatured = 'kategoriOneCikan',
}

export interface PromotionFlags {
  oneCikan: boolean
  acil: boolean
  vitrin: boolean
  anasayfaVitrini: boolean
  kategoriOneCikan: boolean
}

export enum PromotionStatus {
  Scheduled = 'scheduled',
  Active = 'active',
  Expired = 'expired',
  Cancelled = 'cancelled',
}

export interface ListingPromotion {
  id: UUID
  type: PromotionType
  status: PromotionStatus
  purchasedAt: ISODateTime
  startsAt: ISODateTime
  endsAt: ISODateTime
  source: 'paid' | 'manualAdmin'
  activatedByAdminId?: UUID
}

export enum ListingSource {
  Web = 'web',
  Mobile = 'mobile',
  Api = 'api',
  AdminImport = 'adminImport',
}

export interface ListingMetrics {
  viewCount: number
  favoriteCount: number
  messageCount: number
  reportCount: number
}

export enum AutomatedCheckCode {
  RequiredFields = 'requiredFields',
  DuplicateContent = 'duplicateContent',
  PriceAnomaly = 'priceAnomaly',
  ContactInfoDetection = 'contactInfoDetection',
  ImageQuality = 'imageQuality',
  ImageSafety = 'imageSafety',
  LocationConsistency = 'locationConsistency',
  FraudRisk = 'fraudRisk',
}

export enum AutomatedCheckResultStatus {
  Passed = 'passed',
  Warning = 'warning',
  Failed = 'failed',
}

export interface AutomatedCheckResult {
  code: AutomatedCheckCode
  status: AutomatedCheckResultStatus
  score?: number
  message: string
  checkedAt: ISODateTime
}

export interface ModerationSummary {
  currentReviewerId?: UUID
  submittedAt?: ISODateTime
  lastReviewedAt?: ISODateTime
  rejectionReasons: RejectionReason[]
  reviewNote?: string
  automatedChecks: AutomatedCheckResult[]
}

export type RoomCount =
  | '1+0'
  | '1+1'
  | '2+1'
  | '2+2'
  | '3+1'
  | '3+2'
  | '4+1'
  | '4+2'
  | '5+1'
  | '5+2'
  | '6+1'
  | '7+1'
  | '8+'
  | 'diger'

export enum BuildingAge {
  New = '0',
  OneToFive = '1-5',
  SixToTen = '6-10',
  ElevenToFifteen = '11-15',
  SixteenToTwenty = '16-20',
  TwentyOnePlus = '21+',
}

export type FloorLocation =
  | 'bodrumKat'
  | 'bahceKati'
  | 'zeminKat'
  | 'yuksekGiris'
  | 'girisKati'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11-20'
  | '21-30'
  | '30+'
  | 'catiKati'
  | 'mustakil'

export enum HeatingType {
  NaturalGasCombi = 'dogalgazKombi',
  Central = 'merkezi',
  FloorFurnace = 'katKaloriferi',
  Underfloor = 'yerden',
  AirConditioner = 'klima',
  Stove = 'soba',
  FanCoil = 'fanCoil',
  HeatPump = 'isiPompasi',
  None = 'yok',
}

export type BathroomCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export enum ParkingType {
  None = 'yok',
  Open = 'acik',
  Closed = 'kapali',
  OpenAndClosed = 'acikVeKapali',
}

export enum OccupancyStatus {
  Vacant = 'bos',
  Tenant = 'kiraci',
  Owner = 'mulkSahibi',
}

export enum LoanEligibility {
  Eligible = 'uygun',
  Ineligible = 'uygunDegil',
  Unknown = 'bilinmiyor',
}

export enum TitleDeedStatus {
  Condominium = 'katMulkiyeti',
  ConstructionServitude = 'katIrtifaki',
  Shared = 'hisseli',
  LandTitle = 'arsaTapulu',
}

export interface ResidentialAttributes {
  grossSquareMeters: number
  netSquareMeters: number
  roomCount: RoomCount
  buildingAge: BuildingAge
  floorLocation: FloorLocation
  floorCount: number
  heatingType: HeatingType
  bathroomCount: BathroomCount
  hasBalcony: boolean
  hasElevator: boolean
  parkingType: ParkingType
  furnished: boolean
  occupancyStatus: OccupancyStatus
  inComplex: boolean
  complexName?: string
  monthlyFee?: Money
  loanEligibility: LoanEligibility
  titleDeedStatus: TitleDeedStatus
  swapAccepted: boolean
}

export enum ZoningStatus {
  Residential = 'konut',
  Commercial = 'ticari',
  Industrial = 'sanayi',
  Tourism = 'turizm',
  Field = 'tarla',
  VineyardGarden = 'bagBahce',
  Unplanned = 'plansiz',
  Other = 'diger',
}

export enum InfrastructureType {
  Electricity = 'elektrik',
  Water = 'su',
  NaturalGas = 'dogalgaz',
  Sewer = 'kanalizasyon',
  Road = 'yol',
}

export interface LandAttributes {
  squareMeters: number
  zoningStatus: ZoningStatus
  block?: string
  parcel?: string
  mapSheet?: string
  floorAreaRatio?: number
  maxBuildingHeightMeters?: number
  pricePerSquareMeter: Money
  roadFrontageMeters?: number
  infrastructure: InfrastructureType[]
}

export enum BuildingCondition {
  New = 'sifir',
  Used = 'ikinciEl',
  UnderConstruction = 'yapimAsamasinda',
  RenovationRequired = 'renovasyonGerekli',
}

export interface CommercialAttributes {
  squareMeters: number
  roomCount: number | 'acikPlan'
  floorCount: number
  floorLocation?: FloorLocation
  heatingType: HeatingType
  deposit?: Money
  buildingCondition: BuildingCondition
  hasElevator: boolean
  parkingType: ParkingType
  furnished: boolean
  monthlyFee?: Money
  transferFee?: Money
  occupancyStatus: OccupancyStatus
}

export enum BuildingUsageType {
  Residential = 'konut',
  Commercial = 'ticari',
  Mixed = 'karma',
}

export interface BuildingAttributes {
  totalSquareMeters: number
  netSquareMeters?: number
  buildingAge: BuildingAge
  floorCount: number
  independentUnitCount: number
  hasOccupancyPermit: boolean
  hasElevator: boolean
  parkingType: ParkingType
  heatingType: HeatingType
  usageType: BuildingUsageType
  monthlyRentalIncome?: Money
  titleDeedStatus: TitleDeedStatus
  swapAccepted: boolean
}

export enum TimeshareSeason {
  Spring = 'ilkbahar',
  Summer = 'yaz',
  Autumn = 'sonbahar',
  Winter = 'kis',
  AllYear = 'tumYil',
}

export interface TimeshareAttributes {
  facilityName: string
  squareMeters: number
  roomCount: RoomCount
  usagePeriod: string
  usageDays: number
  season: TimeshareSeason
  annualMaintenanceFee: Money
  titleDeedStatus: TitleDeedStatus
  exchangeProgram?: string
  furnished: boolean
}

export type StarRating = 1 | 2 | 3 | 4 | 5

export interface TourismFacilityAttributes {
  roomCount: number
  bedCount: number
  starRating?: StarRating
  floorCount: number
  indoorSquareMeters: number
  outdoorSquareMeters: number
  buildingAge: BuildingAge
  hasOperatingLicense: boolean
  hasAlcoholLicense: boolean
  distanceToBeachMeters?: number
  buildingCondition: BuildingCondition
  furnished: boolean
  parkingType: ParkingType
  transferIncluded: boolean
  annualRevenue?: Money
}

export interface ListingBase {
  id: UUID
  listingNo: string
  title: string
  description: string
  status: ListingStatus
  price: Money
  location: Location
  photos: ListingPhoto[]
  listingDate: ISODateTime
  createdAt: ISODateTime
  updatedAt: ISODateTime
  submittedAt?: ISODateTime
  publishedAt?: ISODateTime
  expiresAt?: ISODateTime
  ownerUserId: UUID
  seller: SellerSummary
  contact: ListingContact
  promotionFlags: PromotionFlags
  promotions: ListingPromotion[]
  moderation: ModerationSummary
  metrics: ListingMetrics
  source: ListingSource
  revision: number
  tags: string[]
}

export interface ResidentialListing extends ListingBase {
  category: ListingCategory.Residential
  transactionType: ResidentialTransactionType
  subCategory: ResidentialSubCategory
  attributes: ResidentialAttributes
}

export interface LandListing extends ListingBase {
  category: ListingCategory.Land
  transactionType: LandTransactionType
  subCategory: LandSubCategory
  attributes: LandAttributes
}

export interface CommercialListing extends ListingBase {
  category: ListingCategory.Commercial
  transactionType: CommercialTransactionType
  subCategory: CommercialSubCategory
  attributes: CommercialAttributes
}

export interface BuildingListing extends ListingBase {
  category: ListingCategory.Building
  transactionType: BuildingTransactionType
  subCategory: BuildingSubCategory
  attributes: BuildingAttributes
}

export interface TimeshareListing extends ListingBase {
  category: ListingCategory.Timeshare
  transactionType: TimeshareTransactionType
  subCategory: TimeshareSubCategory
  attributes: TimeshareAttributes
}

export interface TourismFacilityListing extends ListingBase {
  category: ListingCategory.TourismFacility
  transactionType: TourismFacilityTransactionType
  subCategory: TourismFacilitySubCategory
  attributes: TourismFacilityAttributes
}

export type Listing =
  | ResidentialListing
  | LandListing
  | CommercialListing
  | BuildingListing
  | TimeshareListing
  | TourismFacilityListing

export enum AdminRole {
  SuperAdmin = 'superAdmin',
  Moderator = 'moderator',
  ContentReviewer = 'icerikDenetcisi',
  Support = 'destek',
}

export enum AdminPermission {
  DashboardView = 'dashboard:view',

  ListingView = 'listing:view',
  ListingEdit = 'listing:edit',
  ListingSubmit = 'listing:submit',
  ListingApprove = 'listing:approve',
  ListingReject = 'listing:reject',
  ListingRequestChanges = 'listing:requestChanges',
  ListingPause = 'listing:pause',
  ListingArchive = 'listing:archive',
  ListingRestore = 'listing:restore',
  ListingBulkModerate = 'listing:bulkModerate',
  ListingAssignReviewer = 'listing:assignReviewer',
  ListingAddNote = 'listing:addNote',
  PromotionManage = 'promotion:manage',

  /**
   * Kullanıcı hesabının **tam** görüntülenmesi — iç gerekçeler, yaptırım
   * geçmişi ve oturum bilgisi dahil.
   *
   * Brifing 1.4 matrisi "Kullanıcı görüntüleme" satırında `moderator` ve
   * `superAdmin`'e "Tam", `destek`'e **"Sınırlı"** diyor. Bu yüzden `destek`
   * bunu almaz; `UserViewProfile` ile daraltılmış görünümü alır.
   */
  UserView = 'user:view',
  /**
   * Kullanıcı hesabının **sınırlı** görüntülenmesi — müşteriye anlatılabilen
   * yüz.
   *
   * Brifing 1.4 matrisinin "Kullanıcı görüntüleme" × `destek` hücresi. Matris
   * hangi alanların gizleneceğini söylemiyordu; kapsam kullanıcıya soruldu ve
   * onaylandı. Ayıran ilke: **destek durumu açıklar, moderatör durumu
   * belirler.** Destek "hesabınız 29 Temmuz'a kadar askıda" diyebilmeli;
   * "neden askıya alındığı"nı okumak kararı veren rolün işi.
   *
   * Görünür: ad, avatar, tip, firma, `verified`, e-posta, telefon (destek
   * zaten `UserEditContact` ile düzenleyebiliyor — göremediğini düzenlemek
   * anlamsız), `status` + yürürlükteki yaptırımın `endsAt`'i, `createdAt`,
   * ilan sayaçları, `reportCount`, kullanıcının kendi ilanları.
   *
   * Gizli: `UserSanction.reason` (iç gerekçe metni — müşteriye okunacak cümle
   * değil), yaptırım geçmişi ve `createdByAdminId` (kimin karar verdiği iç
   * bilgi), `lastLoginAt` (oturum takibi destek işi değil), `adminRole`.
   *
   * `UserSummaryCard`'ın `security` varyantı = tam görünüm; `destek` onu
   * görmez.
   *
   * `UserView`'un alt kümesidir ve **kademeler dışlayıcı değil, kapsayıcıdır:**
   * `superAdmin` ikisine birden sahiptir. "Bu kullanıcı sınırlı mı?" sorusu
   * `includes(UserViewProfile)` ile **cevaplanamaz** — önce `UserView`
   * sınanmalı, sonra buna düşülmeli; tersi `superAdmin`'e daraltılmış görünüm
   * gösterir. Aynı desen: `UserEditContact`, `ReportTriageLimited`.
   */
  UserViewProfile = 'user:viewProfile',
  /**
   * Kullanıcı bilgisinin **tam** düzenlenmesi — hesap durumu ve doğrulama dahil
   * her alan.
   *
   * Brifing 1.4 matrisi "Kullanıcı bilgisi düzenleme" satırında yalnız
   * `superAdmin`'e "Tam" veriyor; `moderator` "Sınırlı", `destek` "Sınırlı
   * destek alanları". Bu yüzden bu izin **yalnız `superAdmin`'dedir**; diğer iki
   * rol `UserEditProfile` / `UserEditContact` ile daraltılmış kümeyi alır.
   */
  UserEdit = 'user:edit',
  /**
   * Kullanıcı profil bilgisi düzenleme — ad, e-posta, telefon, avatar, firma adı.
   *
   * Brifing 1.4 matrisinin "Kullanıcı bilgisi düzenleme" satırında `moderator`
   * için yazan **"Sınırlı"** hücresi. Matris hangi alanların sınırlı olduğunu
   * söylemiyordu; kapsam kullanıcıya soruldu ve onaylandı.
   *
   * Kapsam dışı: hesap durumu (`UserSuspend`/`UserBan`'in işi), admin rolü
   * (`UserAssignRole`) ve doğrulama bayrağı — bunlar `UserEdit`'te kalır.
   */
  UserEditProfile = 'user:editProfile',
  /**
   * Kullanıcı iletişim bilgisi düzenleme — **yalnız** e-posta ve telefon.
   *
   * Brifing 1.4 matrisinin "Kullanıcı bilgisi düzenleme" satırında `destek` için
   * yazan **"Sınırlı destek alanları"** hücresi; brifing 2.6 aynı eylemi
   * "İletişim veya doğrulama alanlarını düzenleme" diye anıyor. Alan kümesi
   * kullanıcıya soruldu ve onaylandı: destek yanlış yazılmış bir telefonu
   * düzeltebilmeli, ama kimliği (ad, firma) değiştirememeli.
   *
   * `UserEditProfile`'ın alt kümesidir. **Kademeler dışlayıcı değil, kapsayıcı:**
   * `superAdmin` `ALL_ADMIN_PERMISSIONS` ile üç izne birden sahiptir. Dolayısıyla
   * "bu kullanıcı sınırlı mı?" sorusu `includes(UserEditContact)` ile
   * cevaplanamaz — önce `UserEdit`, sonra `UserEditProfile`, en sonda bu
   * sınanmalı, yoksa `superAdmin`'e daraltılmış form gösterilir.
   */
  UserEditContact = 'user:editContact',
  UserSuspend = 'user:suspend',
  UserBan = 'user:ban',
  UserAssignRole = 'user:assignRole',

  CategoryView = 'category:view',
  CategoryManage = 'category:manage',

  ReportView = 'report:view',
  /**
   * Şikayet triage'ı — **tam**: sınıflandırma, şiddet seviyesi (`severity`)
   * değiştirme ve admin atama (`assignedAdminId`).
   *
   * Brifing 1.4 matrisi bu satırda `moderator` ve `destek`'e "Tam" veriyor;
   * `icerikDenetcisi` "Sınırlı" olduğu için onda `ReportTriageLimited` var.
   */
  ReportTriage = 'report:triage',
  /**
   * Şikayet triage'ı — **sınırlı**: okur, sınıflandırır, moderatöre eskale eder.
   *
   * Brifing 1.4 matrisinin "Şikayet triage etme" satırında `icerikDenetcisi`
   * için yazan **"Sınırlı"** hücresi. Matris kapsamı tanımlamıyordu; kullanıcıya
   * soruldu ve onaylandı.
   *
   * Kapsam dışı: `severity` ve `assignedAdminId` değiştirme. Gerekçe brifing
   * 1.4'ün rol tanımıyla örtüşüyor: içerik denetçisi ilan kararı verir, iş
   * dağıtımı ve önceliklendirme yapmaz — şiddet seviyesini yükseltmek kuyruğun
   * sırasını değiştirmektir.
   *
   * `ReportTriage`'ın alt kümesidir ve kademeler dışlayıcı değildir:
   * `superAdmin` ikisine birden sahiptir. Kapıyı `ReportTriage`'a bakarak aç,
   * bu izne düşmeden önce — bkz. `UserEditContact`.
   */
  ReportTriageLimited = 'report:triageLimited',
  ReportResolve = 'report:resolve',

  SettingsView = 'settings:view',
  PermissionManage = 'permission:manage',
  /** Kendi arayüz temasını seçme. Her rolde vardır. */
  ThemeManage = 'theme:manage',
  /**
   * Sistem varsayılan temasını değiştirme.
   *
   * Brifingden sapma: eklendi. Brifingin yetki matrisi "tema seçimi" (herkes) ile
   * "sistem teması varsayılanını değiştirme" (yalnız superAdmin) satırlarını
   * ayırmış, ama enum'da tek bir `ThemeManage` vardı ve dört role de verilmişti —
   * yani destek rolü sistem varsayılanını değiştirebiliyor görünüyordu.
   */
  ThemeSetDefault = 'theme:setDefault',

  AuditView = 'audit:view',
}

export const ALL_ADMIN_PERMISSIONS = [
  AdminPermission.DashboardView,
  AdminPermission.ListingView,
  AdminPermission.ListingEdit,
  AdminPermission.ListingSubmit,
  AdminPermission.ListingApprove,
  AdminPermission.ListingReject,
  AdminPermission.ListingRequestChanges,
  AdminPermission.ListingPause,
  AdminPermission.ListingArchive,
  AdminPermission.ListingRestore,
  AdminPermission.ListingBulkModerate,
  AdminPermission.ListingAssignReviewer,
  AdminPermission.ListingAddNote,
  AdminPermission.PromotionManage,
  AdminPermission.UserView,
  AdminPermission.UserViewProfile,
  AdminPermission.UserEdit,
  AdminPermission.UserEditProfile,
  AdminPermission.UserEditContact,
  AdminPermission.UserSuspend,
  AdminPermission.UserBan,
  AdminPermission.UserAssignRole,
  AdminPermission.CategoryView,
  AdminPermission.CategoryManage,
  AdminPermission.ReportView,
  AdminPermission.ReportTriage,
  AdminPermission.ReportTriageLimited,
  AdminPermission.ReportResolve,
  AdminPermission.SettingsView,
  AdminPermission.PermissionManage,
  AdminPermission.ThemeManage,
  AdminPermission.ThemeSetDefault,
  AdminPermission.AuditView,
] as const satisfies readonly AdminPermission[]

/**
 * Rol → izin eşlemesi; brifing 1.4 yetki matrisinin birebir karşılığı.
 *
 * Matrisin **dört** "Sınırlı" hücresi enum'da karşılıksızdı ve bu tablo hepsini
 * **"Tam" okumuştu**: `moderator` ile `destek` `UserEdit`'e, `icerikDenetcisi`
 * `ReportTriage`'a, `destek` `UserView`'a sahip görünüyordu — yani matris
 * sınırlarken kod tam yetki veriyordu. Dördü de daraltılmış izinlerle
 * (`UserEditProfile`, `UserEditContact`, `ReportTriageLimited`,
 * `UserViewProfile`) değiştirildi. Matrisin "Sınırlı" hücresi kalmadı.
 *
 * Kademeler kapsayıcıdır: `superAdmin` hem tam hem sınırlı izne sahiptir. Yetki
 * sınayan kod **önce tamını** sorsun (bkz. `AdminPermission.UserEditContact`).
 */
export const ROLE_PERMISSIONS = {
  [AdminRole.SuperAdmin]: ALL_ADMIN_PERMISSIONS,

  [AdminRole.Moderator]: [
    AdminPermission.DashboardView,
    AdminPermission.ListingView,
    AdminPermission.ListingEdit,
    AdminPermission.ListingSubmit,
    AdminPermission.ListingApprove,
    AdminPermission.ListingReject,
    AdminPermission.ListingRequestChanges,
    AdminPermission.ListingPause,
    AdminPermission.ListingArchive,
    AdminPermission.ListingRestore,
    AdminPermission.ListingBulkModerate,
    AdminPermission.ListingAssignReviewer,
    AdminPermission.ListingAddNote,
    AdminPermission.PromotionManage,
    AdminPermission.UserView,
    // Matris: "Kullanıcı bilgisi düzenleme" = Sınırlı. Tam `UserEdit` değil.
    AdminPermission.UserEditProfile,
    AdminPermission.UserSuspend,
    AdminPermission.UserBan,
    AdminPermission.CategoryView,
    AdminPermission.ReportView,
    AdminPermission.ReportTriage,
    AdminPermission.ReportResolve,
    AdminPermission.SettingsView,
    AdminPermission.ThemeManage,
    AdminPermission.AuditView,
  ],

  [AdminRole.ContentReviewer]: [
    AdminPermission.DashboardView,
    AdminPermission.ListingView,
    AdminPermission.ListingApprove,
    AdminPermission.ListingReject,
    AdminPermission.ListingRequestChanges,
    AdminPermission.ListingAddNote,
    AdminPermission.CategoryView,
    AdminPermission.ReportView,
    // Matris: "Şikayet triage etme" = Sınırlı. Tam `ReportTriage` değil.
    AdminPermission.ReportTriageLimited,
    AdminPermission.SettingsView,
    AdminPermission.ThemeManage,
  ],

  [AdminRole.Support]: [
    AdminPermission.DashboardView,
    AdminPermission.ListingView,
    AdminPermission.ListingAddNote,
    // Matris: "Kullanıcı görüntüleme" = Sınırlı. Tam `UserView` değil.
    AdminPermission.UserViewProfile,
    // Matris: "Kullanıcı bilgisi düzenleme" = Sınırlı destek alanları.
    AdminPermission.UserEditContact,
    AdminPermission.ReportView,
    AdminPermission.ReportTriage,
    AdminPermission.SettingsView,
    AdminPermission.ThemeManage,
  ],
} satisfies Record<AdminRole, readonly AdminPermission[]>

export enum ModerationActorType {
  Admin = 'admin',
  ListingOwner = 'listingOwner',
  System = 'system',
}

export enum ModerationEventType {
  Created = 'created',
  Submitted = 'submitted',
  Assigned = 'assigned',
  Approved = 'approved',
  Rejected = 'rejected',
  ChangesRequested = 'changesRequested',
  Withdrawn = 'withdrawn',
  Edited = 'edited',
  Paused = 'paused',
  Resumed = 'resumed',
  Expired = 'expired',
  Archived = 'archived',
  Restored = 'restored',
  NoteAdded = 'noteAdded',
  ReportLinked = 'reportLinked',
}

export interface ModerationActor {
  type: ModerationActorType
  id?: UUID
  displayName: string
  adminRole?: AdminRole
}

export interface ModerationEvent {
  id: UUID
  listingId: UUID
  eventType: ModerationEventType
  fromStatus?: ListingStatus
  toStatus?: ListingStatus
  actor: ModerationActor
  rejectionReasons: RejectionReason[]
  note?: string
  revision: number
  createdAt: ISODateTime
}

export enum ListingTransitionTrigger {
  OwnerSubmit = 'ownerSubmit',
  OwnerWithdraw = 'ownerWithdraw',
  AdminDecision = 'adminDecision',
  MaterialEdit = 'materialEdit',
  PauseRequested = 'pauseRequested',
  PauseEnded = 'pauseEnded',
  ExpiryReached = 'expiryReached',
  AppealAccepted = 'appealAccepted',
  RenewalRequested = 'renewalRequested',
  ArchiveRequested = 'archiveRequested',
  RestoreRequested = 'restoreRequested',
  RetentionExpired = 'retentionExpired',
}

export interface ListingTransitionRule {
  from: ListingStatus
  to: ListingStatus
  allowedAdminRoles: AdminRole[]
  allowedActorTypes: ModerationActorType[]
  trigger: ListingTransitionTrigger
  requiresReason: boolean
  requiresNote: boolean
}

export interface ListingStatusTransitionRequest {
  listingId: UUID
  expectedRevision: number
  targetStatus: ListingStatus
  actor: ModerationActor
  trigger: ListingTransitionTrigger
  rejectionReasons: RejectionReason[]
  note?: string
}

export enum UserType {
  Individual = 'individual',
  RealEstateOffice = 'realEstateOffice',
  ConstructionCompany = 'constructionCompany',
  Admin = 'admin',
}

export enum UserStatus {
  PendingVerification = 'pendingVerification',
  Active = 'active',
  Suspended = 'suspended',
  Banned = 'banned',
}

export interface UserAccount {
  id: UUID
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  type: UserType
  status: UserStatus
  adminRole?: AdminRole
  verified: boolean
  companyName?: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
  lastLoginAt?: ISODateTime
  listingCount: number
  activeListingCount: number
  reportCount: number
}

export interface UserSanction {
  id: UUID
  userId: UUID
  type: 'suspension' | 'ban'
  reason: string
  startsAt: ISODateTime
  endsAt?: ISODateTime
  createdByAdminId: UUID
  createdAt: ISODateTime
  revokedAt?: ISODateTime
}

export enum ReportReason {
  MisleadingInformation = 'misleadingInformation',
  DuplicateListing = 'duplicateListing',
  SoldOrRented = 'soldOrRented',
  WrongCategory = 'wrongCategory',
  SuspectedFraud = 'suspectedFraud',
  InappropriateContent = 'inappropriateContent',
  ContactViolation = 'contactViolation',
  PriceManipulation = 'priceManipulation',
  Other = 'other',
}

export enum ReportStatus {
  Open = 'open',
  InReview = 'inReview',
  Resolved = 'resolved',
  Dismissed = 'dismissed',
}

export enum ReportSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface ListingReport {
  id: UUID
  listingId: UUID
  reporterUserId?: UUID
  reason: ReportReason
  detail?: string
  status: ReportStatus
  severity: ReportSeverity
  assignedAdminId?: UUID
  resolutionNote?: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
  resolvedAt?: ISODateTime
}

export enum AttributeDataType {
  Text = 'text',
  Number = 'number',
  Boolean = 'boolean',
  SingleSelect = 'singleSelect',
  MultiSelect = 'multiSelect',
  Money = 'money',
}

export interface AttributeOption {
  value: string
  label: string
  order: number
  active: boolean
}

export interface AttributeValidation {
  min?: number
  max?: number
  maxLength?: number
  pattern?: string
}

export interface CategoryAttributeDefinition {
  id: UUID
  category: ListingCategory
  appliesToSubCategories: ListingSubCategory[]
  appliesToTransactionTypes: ListingTransactionType[]
  key: string
  label: string
  description?: string
  dataType: AttributeDataType
  required: boolean
  filterable: boolean
  visibleInList: boolean
  active: boolean
  order: number
  options: AttributeOption[]
  validation: AttributeValidation
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface TimeSeriesPoint {
  date: ISODate
  value: number
}

export interface CategoryDistributionItem {
  category: ListingCategory
  count: number
  ratio: number
}

export interface DashboardMetrics {
  pendingReviewCount: number
  newListingCountToday: number
  publishedListingCount: number
  rejectedListingCount: number
  rejectionRate: number
  averageReviewMinutes: number
  openReportCount: number
  dailyNewListings: TimeSeriesPoint[]
  dailyModerationCount: TimeSeriesPoint[]
  categoryDistribution: CategoryDistributionItem[]
  /*
    Faz 3 sonrası (b) turunda eklenen alanlar — brifing 2.2'nin Faz 3'te
    KANALSIZ kalan üç verisi ("en uzun bekleyen ilanlar", "son moderasyon
    işlemleri", "moderatör bazında işlem hacmi") ve onay/red ayrımı. Hepsi
    OPSİYONEL: `fixtures/dashboard.ts` ve mevcut çağıranlar kırılmadan eklendi
    (geriye dönük uyum). `domain.ts` = FastAPI şartnamesi; bu alanlar backend
    gelince kesinleşir.
  */
  /** En uzun süredir onay bekleyen ilanlar (brifing 2.2). En eski başta. */
  longestWaitingListings?: Listing[]
  /** Son moderasyon işlemleri (brifing 2.2). En yeni başta. */
  recentModerationEvents?: ModerationEvent[]
  /**
   * Moderatör bazında işlem hacmi (brifing 2.2: "yalnızca yetkili rollere").
   * Yetki kapısı sayfa katmanının: `moderation:viewVolume` gibi bir izin yok,
   * ekran `availablePermissions`'a bakamıyor — dolayısıyla bu blok verildiğinde
   * gösterilir, gösterip göstermemeye çağıran karar verir.
   */
  moderatorVolume?: ModeratorVolumeItem[]
  /**
   * Günlük **onay** sayısı; `dailyModerationCount`'un ayrıştırılmış hâli.
   * Brifing 2.2 "onay/red sayısı" istiyordu ama `dailyModerationCount` tek
   * ayrışmamış seriydi — onay/red grafiği çizilemiyordu. `dailyRejections` ile
   * birlikte verilir; toplamları `dailyModerationCount`'a eşit olmalı.
   */
  dailyApprovals?: TimeSeriesPoint[]
  /** Günlük **red** sayısı; `dailyApprovals`'ın simetriği. */
  dailyRejections?: TimeSeriesPoint[]
}

/** Bir moderatörün belirli bir penceredeki işlem hacmi (brifing 2.2). */
export interface ModeratorVolumeItem {
  adminId: UUID
  adminName: string
  approvedCount: number
  rejectedCount: number
  changesRequestedCount: number
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface AuditLogEntry {
  id: UUID
  actorId: UUID
  actorName: string
  actorRole: AdminRole
  action: string
  entityType: 'listing' | 'user' | 'report' | 'category' | 'permission' | 'theme'
  entityId: UUID
  summary: string
  metadata: Record<string, unknown>
  createdAt: ISODateTime
}

/**
 * Bir ilana iliştirilen admin notu (brifing 2.5: "admin notları").
 *
 * Faz 3 sonrası (b) turunda eklendi; `ListingReviewData.adminNotes` taşır.
 * **Backend gelince kesinleşir** — `domain.ts` fiilen FastAPI'nin şartnamesidir,
 * bu tip sunucunun döndüreceği şekle göre daralabilir.
 */
export interface AdminNote {
  id: UUID
  listingId: UUID
  authorId: UUID
  authorName: string
  text: string
  createdAt: ISODateTime
}
