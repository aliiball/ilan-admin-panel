import {
  AssetModerationStatus,
  AutomatedCheckCode,
  AutomatedCheckResultStatus,
  BuildingAge,
  BuildingCondition,
  BuildingSubCategory,
  BuildingTransactionType,
  BuildingUsageType,
  CommercialSubCategory,
  CommercialTransactionType,
  Currency,
  HeatingType,
  InfrastructureType,
  LandSubCategory,
  LandTransactionType,
  ListingCategory,
  ListingSource,
  ListingStatus,
  LoanEligibility,
  OccupancyStatus,
  ParkingType,
  PricePeriod,
  PromotionStatus,
  PromotionType,
  RejectionReason,
  ResidentialSubCategory,
  ResidentialTransactionType,
  SellerType,
  SellerVerificationStatus,
  TimeshareSeason,
  TimeshareSubCategory,
  TimeshareTransactionType,
  TitleDeedStatus,
  TourismFacilitySubCategory,
  TourismFacilityTransactionType,
  ZoningStatus,
  type BuildingListing,
  type CommercialListing,
  type LandListing,
  type Listing,
  type ListingBase,
  type ListingPhoto,
  type Location,
  type ModerationSummary,
  type ResidentialListing,
  type SellerSummary,
  type TimeshareListing,
  type TourismFacilityListing,
} from '../types/domain'

const ownerSeller: SellerSummary = {
  id: 'seller-owner-ayse-demir',
  type: SellerType.Owner,
  displayName: 'Ayşe Demir',
  verificationStatus: SellerVerificationStatus.Verified,
}

const officeSeller: SellerSummary = {
  id: 'seller-office-marmara-emlak',
  type: SellerType.RealEstateOffice,
  displayName: 'Marmara Emlak Danışmanlığı',
  companyName: 'Marmara Emlak Danışmanlık Ltd. Şti.',
  verificationStatus: SellerVerificationStatus.Verified,
}

const constructionSeller: SellerSummary = {
  id: 'seller-construction-yapi-proje',
  type: SellerType.ConstructionCompany,
  displayName: 'Yapı Proje Gayrimenkul',
  companyName: 'Yapı Proje İnşaat A.Ş.',
  verificationStatus: SellerVerificationStatus.Verified,
}

function createLocation(
  cityCode: string,
  cityName: string,
  districtId: string,
  districtName: string,
  neighborhoodId: string,
  neighborhoodName: string,
  latitude: number,
  longitude: number,
): Location {
  return {
    countryCode: 'TR',
    cityCode,
    cityName,
    districtId,
    districtName,
    neighborhoodId,
    neighborhoodName,
    coordinates: {
      latitude,
      longitude,
    },
    showExactLocation: false,
  }
}

function createPhoto(listingKey: string, order: number, altText: string): ListingPhoto {
  return {
    id: `${listingKey}-photo-${order}`,
    url: `/fixtures/listings/${listingKey}-${order}.webp`,
    thumbnailUrl: `/fixtures/listings/${listingKey}-${order}-thumb.webp`,
    altText,
    order,
    isCover: order === 1,
    width: 1600,
    height: 1067,
    mimeType: 'image/webp',
    moderationStatus: AssetModerationStatus.Approved,
  }
}

function createModeration(
  status: ListingStatus,
  overrides: Partial<ModerationSummary> = {},
): ModerationSummary {
  const defaultSummary: ModerationSummary = {
    rejectionReasons: [],
    automatedChecks: [
      {
        code: AutomatedCheckCode.RequiredFields,
        status: AutomatedCheckResultStatus.Passed,
        message: 'Zorunlu alanlar tamamlandı.',
        checkedAt: '2026-07-14T09:00:00+03:00',
      },
      {
        code: AutomatedCheckCode.ContactInfoDetection,
        status: AutomatedCheckResultStatus.Passed,
        message: 'Açıklamada harici iletişim bilgisi bulunmadı.',
        checkedAt: '2026-07-14T09:00:02+03:00',
      },
      {
        code: AutomatedCheckCode.ImageQuality,
        status: AutomatedCheckResultStatus.Passed,
        score: 0.92,
        message: 'Fotoğrafların çözünürlüğü yeterli.',
        checkedAt: '2026-07-14T09:00:04+03:00',
      },
    ],
  }

  if (status === ListingStatus.PendingReview) {
    defaultSummary.submittedAt = '2026-07-14T09:05:00+03:00'
    defaultSummary.currentReviewerId = 'admin-content-reviewer-1'
  }

  if (status === ListingStatus.Published) {
    defaultSummary.submittedAt = '2026-07-10T11:30:00+03:00'
    defaultSummary.lastReviewedAt = '2026-07-10T12:05:00+03:00'
    defaultSummary.reviewNote = 'İlan alanları ve görseller uygun.'
  }

  if (status === ListingStatus.ChangesRequested) {
    defaultSummary.submittedAt = '2026-07-13T10:00:00+03:00'
    defaultSummary.lastReviewedAt = '2026-07-13T10:24:00+03:00'
    defaultSummary.rejectionReasons = [RejectionReason.MisleadingOrIncompleteInfo]
    defaultSummary.reviewNote =
      'Net m² bilgisi ile açıklamadaki değer uyuşmuyor; açıklama güncellenmeli.'
  }

  if (status === ListingStatus.Rejected) {
    defaultSummary.submittedAt = '2026-07-12T14:00:00+03:00'
    defaultSummary.lastReviewedAt = '2026-07-12T14:18:00+03:00'
    defaultSummary.rejectionReasons = [RejectionReason.DuplicateListing]
    defaultSummary.reviewNote = 'Aynı gayrimenkule ait aktif bir ilan bulundu.'
  }

  return {
    ...defaultSummary,
    ...overrides,
  }
}

interface BaseFixtureArgs {
  id: string
  listingNo: string
  title: string
  description: string
  status: ListingStatus
  priceAmount: number
  currency?: Currency
  pricePeriod: PricePeriod
  location: Location
  seller: SellerSummary
  ownerUserId: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  expiresAt?: string
  tags?: string[]
  viewCount?: number
  favoriteCount?: number
  reportCount?: number
  promotionTypes?: PromotionType[]
  moderation?: ModerationSummary
  /**
   * İlanın kaçıncı revizyonu. Varsayılan 1.
   *
   * `moderationEvents.ts`'teki geçmişle örtüşmelidir: brifing 1.2'ye göre
   * revizyon, istenen düzeltmeler yapılınca artar — geçmişinde `edited` olayı
   * olan ilan 1'de kalamaz.
   */
  revision?: number
}

function createBaseListing(args: BaseFixtureArgs): ListingBase {
  const promotionTypes = args.promotionTypes ?? []
  const submittedAt = args.moderation?.submittedAt ?? createModeration(args.status).submittedAt

  return {
    id: args.id,
    listingNo: args.listingNo,
    title: args.title,
    description: args.description,
    status: args.status,
    price: {
      amount: args.priceAmount,
      currency: args.currency ?? Currency.Try,
      period: args.pricePeriod,
      negotiable: true,
    },
    location: args.location,
    photos: [
      createPhoto(args.id, 1, `${args.title} kapak görünümü`),
      createPhoto(args.id, 2, `${args.title} iç mekan veya arazi görünümü`),
    ],
    listingDate: args.createdAt,
    createdAt: args.createdAt,
    updatedAt: args.updatedAt,
    // Brifingden sapma: opsiyonel tarihler koşullu spread ile veriliyor.
    // Brifingin kendi kodu bunları doğrudan atıyordu (`publishedAt: args.publishedAt`),
    // ama exactOptionalPropertyTypes — yine brifingin kendi kabul kriteri — opsiyonel
    // bir alana açıkça `undefined` atanmasını yasaklıyor (TS2375). Alan ya vardır ya yoktur.
    ...(submittedAt !== undefined && { submittedAt }),
    ...(args.publishedAt !== undefined && { publishedAt: args.publishedAt }),
    ...(args.expiresAt !== undefined && { expiresAt: args.expiresAt }),
    ownerUserId: args.ownerUserId,
    seller: args.seller,
    contact: {
      phone: args.seller.type === SellerType.Owner ? '+90 555 000 11 22' : '+90 212 555 01 40',
      email:
        args.seller.type === SellerType.Owner
          ? 'ayse.demir@example.invalid'
          : 'ilan@example.invalid',
      allowPhone: true,
      allowMessage: true,
      preferredContactMethod: 'both',
    },
    promotionFlags: {
      oneCikan: promotionTypes.includes(PromotionType.Featured),
      acil: promotionTypes.includes(PromotionType.Urgent),
      vitrin: promotionTypes.includes(PromotionType.Showcase),
      anasayfaVitrini: promotionTypes.includes(PromotionType.HomepageShowcase),
      kategoriOneCikan: promotionTypes.includes(PromotionType.CategoryFeatured),
    },
    promotions: promotionTypes.map((type, index) => ({
      id: `${args.id}-promotion-${index + 1}`,
      type,
      status: PromotionStatus.Active,
      purchasedAt: '2026-07-10T09:00:00+03:00',
      startsAt: '2026-07-10T09:00:00+03:00',
      endsAt: '2026-07-24T09:00:00+03:00',
      source: 'paid',
    })),
    moderation: args.moderation ?? createModeration(args.status),
    metrics: {
      viewCount: args.viewCount ?? 0,
      favoriteCount: args.favoriteCount ?? 0,
      messageCount: Math.floor((args.favoriteCount ?? 0) / 3),
      reportCount: args.reportCount ?? 0,
    },
    source: ListingSource.Web,
    revision: args.revision ?? 1,
    tags: args.tags ?? [],
  }
}

export const residentialPublishedApartment: ResidentialListing = {
  ...createBaseListing({
    id: 'listing-residential-kadikoy-apartment',
    listingNo: '1245789630',
    title: "Caferağa'da Asansörlü Binada Ferah 3+1 Daire",
    description:
      "Kadıköy Caferağa Mahallesi'nde, toplu ulaşıma yakın, çift cepheli ve yenilenmiş 3+1 daire. Salon ve odalar gün ışığı almaktadır. Binada asansör ve kapalı otopark bulunmaktadır.",
    status: ListingStatus.Published,
    priceAmount: 18_750_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '34',
      'İstanbul',
      'kadikoy',
      'Kadıköy',
      'caferaga',
      'Caferağa',
      40.9888,
      29.0277,
    ),
    seller: officeSeller,
    ownerUserId: 'user-office-marmara-emlak',
    createdAt: '2026-07-10T10:45:00+03:00',
    updatedAt: '2026-07-10T12:05:00+03:00',
    publishedAt: '2026-07-10T12:05:00+03:00',
    expiresAt: '2026-08-09T12:05:00+03:00',
    tags: ['yüksekDeğer', 'kadıköy'],
    viewCount: 1_842,
    favoriteCount: 126,
    reportCount: 0,
    promotionTypes: [PromotionType.Featured, PromotionType.CategoryFeatured],
  }),
  category: ListingCategory.Residential,
  transactionType: ResidentialTransactionType.Sale,
  subCategory: ResidentialSubCategory.Apartment,
  attributes: {
    grossSquareMeters: 145,
    netSquareMeters: 128,
    roomCount: '3+1',
    buildingAge: BuildingAge.ElevenToFifteen,
    floorLocation: '4',
    floorCount: 7,
    heatingType: HeatingType.NaturalGasCombi,
    bathroomCount: 2,
    hasBalcony: true,
    hasElevator: true,
    parkingType: ParkingType.Closed,
    furnished: false,
    occupancyStatus: OccupancyStatus.Vacant,
    inComplex: false,
    monthlyFee: {
      amount: 1_850,
      currency: Currency.Try,
      period: PricePeriod.Monthly,
      negotiable: false,
    },
    loanEligibility: LoanEligibility.Eligible,
    titleDeedStatus: TitleDeedStatus.Condominium,
    swapAccepted: false,
  },
}

export const residentialPendingVilla: ResidentialListing = {
  ...createBaseListing({
    id: 'listing-residential-konyaalti-villa',
    listingNo: '1245790148',
    title: "Konyaaltı'nda Havuzlu ve Eşyalı Müstakil Villa",
    description:
      "Konyaaltı Hurma Mahallesi'nde, özel havuzlu, bahçeli ve tam eşyalı villa. Uzun dönem kiralamaya uygundur.",
    status: ListingStatus.PendingReview,
    priceAmount: 65_000,
    pricePeriod: PricePeriod.Monthly,
    location: createLocation(
      '07',
      'Antalya',
      'konyaalti',
      'Konyaaltı',
      'hurma',
      'Hurma',
      36.8589,
      30.6089,
    ),
    seller: ownerSeller,
    ownerUserId: 'user-owner-ayse-demir',
    createdAt: '2026-07-14T08:42:00+03:00',
    updatedAt: '2026-07-14T09:05:00+03:00',
    tags: ['yeniBaşvuru'],
  }),
  category: ListingCategory.Residential,
  transactionType: ResidentialTransactionType.Rent,
  subCategory: ResidentialSubCategory.Villa,
  attributes: {
    grossSquareMeters: 280,
    netSquareMeters: 240,
    roomCount: '5+1',
    buildingAge: BuildingAge.OneToFive,
    floorLocation: 'mustakil',
    floorCount: 2,
    heatingType: HeatingType.Underfloor,
    bathroomCount: 4,
    hasBalcony: true,
    hasElevator: false,
    parkingType: ParkingType.Open,
    furnished: true,
    occupancyStatus: OccupancyStatus.Vacant,
    inComplex: false,
    monthlyFee: {
      amount: 0,
      currency: Currency.Try,
      period: PricePeriod.Monthly,
      negotiable: false,
    },
    loanEligibility: LoanEligibility.Unknown,
    titleDeedStatus: TitleDeedStatus.Condominium,
    swapAccepted: false,
  },
}

export const landDraftResidentialZoned: LandListing = {
  ...createBaseListing({
    id: 'listing-land-urla-residential',
    listingNo: '1245791041',
    title: "Urla Kuşçular'da Konut İmarlı 550 m² Arsa",
    description:
      "Kuşçular Mahallesi'nde yola cepheli, elektrik ve su altyapısı bulunan konut imarlı arsa.",
    status: ListingStatus.Draft,
    priceAmount: 9_900_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '35',
      'İzmir',
      'urla',
      'Urla',
      'kuscular',
      'Kuşçular',
      38.2933,
      26.6903,
    ),
    seller: ownerSeller,
    ownerUserId: 'user-owner-ayse-demir',
    createdAt: '2026-07-15T15:10:00+03:00',
    // `restoredDraftHistory`'nin son olayı (arşivden geri yükleme) ile aynı an:
    // geçmişte ilana dokunulmuşsa `updatedAt` oluşturulma anında kalamaz.
    updatedAt: '2026-07-16T11:15:00+03:00',
    tags: ['taslak'],
  }),
  category: ListingCategory.Land,
  transactionType: LandTransactionType.Sale,
  subCategory: LandSubCategory.ResidentialZoned,
  attributes: {
    squareMeters: 550,
    zoningStatus: ZoningStatus.Residential,
    block: '112',
    parcel: '8',
    mapSheet: 'L18-C-12-A',
    floorAreaRatio: 0.4,
    maxBuildingHeightMeters: 6.5,
    pricePerSquareMeter: {
      amount: 18_000,
      currency: Currency.Try,
      period: PricePeriod.OneTime,
      negotiable: true,
    },
    roadFrontageMeters: 21,
    infrastructure: [
      InfrastructureType.Electricity,
      InfrastructureType.Water,
      InfrastructureType.Road,
    ],
  },
}

export const landRejectedField: LandListing = {
  ...createBaseListing({
    id: 'listing-land-corlu-field',
    listingNo: '1245791558',
    title: "Çorlu'da Sanayi Bölgesine Yakın 12.450 m² Tarla",
    description:
      'Ana yola yakın, tek tapu tarla. Aynı taşınmaz için daha önce açılan aktif kayıt nedeniyle ilan tekrar incelemeye alınmıştır.',
    status: ListingStatus.Rejected,
    priceAmount: 23_000_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '59',
      'Tekirdağ',
      'corlu',
      'Çorlu',
      'turkgucu',
      'Türkgücü',
      41.1546,
      27.8064,
    ),
    seller: officeSeller,
    ownerUserId: 'user-office-marmara-emlak',
    createdAt: '2026-07-12T13:40:00+03:00',
    updatedAt: '2026-07-12T14:18:00+03:00',
    reportCount: 1,
    tags: ['mükerrerRisk'],
    moderation: createModeration(ListingStatus.Rejected, {
      rejectionReasons: [RejectionReason.DuplicateListing],
      reviewNote: '1245700021 numaralı aktif ilanla aynı ada, parsel ve fotoğraflar kullanılmış.',
    }),
  }),
  category: ListingCategory.Land,
  transactionType: LandTransactionType.Sale,
  subCategory: LandSubCategory.Field,
  attributes: {
    squareMeters: 12_450,
    zoningStatus: ZoningStatus.Field,
    block: '246',
    parcel: '19',
    pricePerSquareMeter: {
      amount: 1_847.39,
      currency: Currency.Try,
      period: PricePeriod.OneTime,
      negotiable: true,
    },
    roadFrontageMeters: 86,
    infrastructure: [InfrastructureType.Electricity, InfrastructureType.Road],
  },
}

export const commercialChangesRequestedOffice: CommercialListing = {
  ...createBaseListing({
    id: 'listing-commercial-sisli-office',
    listingNo: '1245792010',
    title: "Şişli Merkez'de Metroya Yakın 180 m² Kiralık Ofis",
    description:
      'Şişli merkezde açık plan çalışma alanı, toplantı odası ve mutfak bulunan kiralık ofis.',
    status: ListingStatus.ChangesRequested,
    priceAmount: 95_000,
    pricePeriod: PricePeriod.Monthly,
    location: createLocation(
      '34',
      'İstanbul',
      'sisli',
      'Şişli',
      'merkez',
      'Merkez',
      41.0603,
      28.9877,
    ),
    seller: officeSeller,
    ownerUserId: 'user-office-marmara-emlak',
    createdAt: '2026-07-13T09:40:00+03:00',
    updatedAt: '2026-07-13T10:24:00+03:00',
    tags: ['düzeltmeBekliyor'],
  }),
  category: ListingCategory.Commercial,
  transactionType: CommercialTransactionType.Rent,
  subCategory: CommercialSubCategory.Office,
  attributes: {
    squareMeters: 180,
    roomCount: 'acikPlan',
    floorCount: 8,
    floorLocation: '5',
    heatingType: HeatingType.Central,
    deposit: {
      amount: 190_000,
      currency: Currency.Try,
      period: PricePeriod.OneTime,
      negotiable: false,
    },
    buildingCondition: BuildingCondition.Used,
    hasElevator: true,
    parkingType: ParkingType.Closed,
    furnished: false,
    monthlyFee: {
      amount: 8_500,
      currency: Currency.Try,
      period: PricePeriod.Monthly,
      negotiable: false,
    },
    occupancyStatus: OccupancyStatus.Vacant,
  },
}

export const commercialPausedWarehouse: CommercialListing = {
  ...createBaseListing({
    id: 'listing-commercial-gebze-warehouse',
    listingNo: '1245792454',
    title: 'Gebze OSB Yakınında 2.400 m² Lojistik Deposu',
    description:
      'Tır girişine uygun, yüksek tavanlı, yangın sistemi ve yükleme rampaları bulunan depo.',
    status: ListingStatus.Paused,
    priceAmount: 420_000,
    pricePeriod: PricePeriod.Monthly,
    location: createLocation(
      '41',
      'Kocaeli',
      'gebze',
      'Gebze',
      'balcik',
      'Balçık',
      40.8642,
      29.4929,
    ),
    seller: constructionSeller,
    ownerUserId: 'user-construction-yapi-proje',
    createdAt: '2026-06-18T11:00:00+03:00',
    updatedAt: '2026-07-11T16:20:00+03:00',
    publishedAt: '2026-06-18T12:30:00+03:00',
    expiresAt: '2026-07-18T12:30:00+03:00',
    viewCount: 784,
    favoriteCount: 31,
    tags: ['geçiciPasif'],
  }),
  category: ListingCategory.Commercial,
  transactionType: CommercialTransactionType.Rent,
  subCategory: CommercialSubCategory.Warehouse,
  attributes: {
    squareMeters: 2_400,
    roomCount: 'acikPlan',
    floorCount: 1,
    floorLocation: 'zeminKat',
    heatingType: HeatingType.None,
    deposit: {
      amount: 840_000,
      currency: Currency.Try,
      period: PricePeriod.OneTime,
      negotiable: true,
    },
    buildingCondition: BuildingCondition.Used,
    hasElevator: false,
    parkingType: ParkingType.Open,
    furnished: false,
    occupancyStatus: OccupancyStatus.Vacant,
  },
}

export const buildingExpiredComplete: BuildingListing = {
  ...createBaseListing({
    id: 'listing-building-cankaya-complete',
    listingNo: '1245793008',
    title: "Çankaya'da 14 Bağımsız Bölümlü Komple Bina",
    description: 'Konut ve ofis kullanımına uygun, düzenli kira getirisi bulunan komple bina.',
    status: ListingStatus.Expired,
    priceAmount: 85_000_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '06',
      'Ankara',
      'cankaya',
      'Çankaya',
      'gaziosmanpasa',
      'Gaziosmanpaşa',
      39.8988,
      32.8633,
    ),
    seller: officeSeller,
    ownerUserId: 'user-office-marmara-emlak',
    createdAt: '2026-06-10T09:00:00+03:00',
    updatedAt: '2026-07-10T09:00:00+03:00',
    publishedAt: '2026-06-10T10:15:00+03:00',
    expiresAt: '2026-07-10T10:15:00+03:00',
    viewCount: 2_410,
    favoriteCount: 98,
    tags: ['süresiDolmuş'],
  }),
  category: ListingCategory.Building,
  transactionType: BuildingTransactionType.Sale,
  subCategory: BuildingSubCategory.CompleteBuilding,
  attributes: {
    totalSquareMeters: 1_100,
    netSquareMeters: 960,
    buildingAge: BuildingAge.SixToTen,
    floorCount: 7,
    independentUnitCount: 14,
    hasOccupancyPermit: true,
    hasElevator: true,
    parkingType: ParkingType.Closed,
    heatingType: HeatingType.Central,
    usageType: BuildingUsageType.Mixed,
    monthlyRentalIncome: {
      amount: 420_000,
      currency: Currency.Try,
      period: PricePeriod.Monthly,
      negotiable: false,
    },
    titleDeedStatus: TitleDeedStatus.Condominium,
    swapAccepted: false,
  },
}

export const buildingArchivedMixedUse: BuildingListing = {
  ...createBaseListing({
    id: 'listing-building-osmangazi-archived',
    listingNo: '1245793411',
    title: "Osmangazi'de Cadde Üzeri Karma Kullanımlı Komple Bina",
    description: 'Zemin katta mağaza, üst katlarda ofis ve konut birimleri bulunan komple bina.',
    status: ListingStatus.Archived,
    priceAmount: 45_000_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '16',
      'Bursa',
      'osmangazi',
      'Osmangazi',
      'altiparmak',
      'Altıparmak',
      40.1944,
      29.0551,
    ),
    seller: ownerSeller,
    ownerUserId: 'user-owner-ayse-demir',
    createdAt: '2026-05-03T10:30:00+03:00',
    updatedAt: '2026-07-01T13:12:00+03:00',
    publishedAt: '2026-05-03T12:00:00+03:00',
    expiresAt: '2026-06-02T12:00:00+03:00',
    viewCount: 3_201,
    favoriteCount: 144,
    tags: ['satıldı', 'arşiv'],
    // `archivedBuildingHistory`'de bir `edited` olayı var: düzeltme istenmiş,
    // yapılmış ve revizyon 2'ye çıkmıştı.
    revision: 2,
  }),
  category: ListingCategory.Building,
  transactionType: BuildingTransactionType.Sale,
  subCategory: BuildingSubCategory.CompleteBuilding,
  attributes: {
    totalSquareMeters: 650,
    netSquareMeters: 580,
    buildingAge: BuildingAge.SixteenToTwenty,
    floorCount: 5,
    independentUnitCount: 9,
    hasOccupancyPermit: true,
    hasElevator: true,
    parkingType: ParkingType.None,
    heatingType: HeatingType.NaturalGasCombi,
    usageType: BuildingUsageType.Mixed,
    monthlyRentalIncome: {
      amount: 260_000,
      currency: Currency.Try,
      period: PricePeriod.Monthly,
      negotiable: false,
    },
    titleDeedStatus: TitleDeedStatus.Condominium,
    swapAccepted: false,
  },
}

export const timesharePublishedBodrum: TimeshareListing = {
  ...createBaseListing({
    id: 'listing-timeshare-bodrum-summer',
    listingNo: '1245793892',
    title: "Bodrum'da Temmuz Dönemi 14 Günlük 2+1 Devremülk",
    description:
      'Denize yürüme mesafesinde, havuzlu tesiste her yıl temmuz döneminde 14 gün kullanım hakkı.',
    status: ListingStatus.Published,
    priceAmount: 1_650_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '48',
      'Muğla',
      'bodrum',
      'Bodrum',
      'gumbet',
      'Gümbet',
      37.0323,
      27.4029,
    ),
    seller: ownerSeller,
    ownerUserId: 'user-owner-ayse-demir',
    createdAt: '2026-07-08T12:10:00+03:00',
    updatedAt: '2026-07-08T13:05:00+03:00',
    publishedAt: '2026-07-08T13:05:00+03:00',
    expiresAt: '2026-08-07T13:05:00+03:00',
    viewCount: 521,
    favoriteCount: 38,
    promotionTypes: [PromotionType.Urgent],
  }),
  category: ListingCategory.Timeshare,
  transactionType: TimeshareTransactionType.Sale,
  subCategory: TimeshareSubCategory.Timeshare,
  attributes: {
    facilityName: 'Bodrum Mavi Tatil Evleri',
    squareMeters: 84,
    roomCount: '2+1',
    usagePeriod: '10 Temmuz - 24 Temmuz',
    usageDays: 14,
    season: TimeshareSeason.Summer,
    annualMaintenanceFee: {
      amount: 18_500,
      currency: Currency.Try,
      period: PricePeriod.Yearly,
      negotiable: false,
    },
    titleDeedStatus: TitleDeedStatus.Condominium,
    exchangeProgram: 'Uluslararası tesis değişim programı',
    furnished: true,
  },
}

export const timesharePendingThermal: TimeshareListing = {
  ...createBaseListing({
    id: 'listing-timeshare-afyon-thermal',
    listingNo: '1245794107',
    title: 'Afyon Termal Tesiste Kış Dönemi 7 Günlük Devremülk',
    description:
      'Termal havuz ve aile banyolarına erişim sağlayan, her yıl şubat ayında 7 günlük kullanım hakkı.',
    status: ListingStatus.PendingReview,
    priceAmount: 480_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '03',
      'Afyonkarahisar',
      'merkez',
      'Merkez',
      'gazligol',
      'Gazlıgöl',
      38.8756,
      30.5162,
    ),
    seller: officeSeller,
    ownerUserId: 'user-office-marmara-emlak',
    createdAt: '2026-07-14T16:20:00+03:00',
    updatedAt: '2026-07-14T16:45:00+03:00',
    tags: ['termal', 'yeniBaşvuru'],
  }),
  category: ListingCategory.Timeshare,
  transactionType: TimeshareTransactionType.Sale,
  subCategory: TimeshareSubCategory.Timeshare,
  attributes: {
    facilityName: 'Gazlıgöl Termal Yaşam Merkezi',
    squareMeters: 58,
    roomCount: '1+1',
    usagePeriod: 'Şubat ayının ikinci haftası',
    usageDays: 7,
    season: TimeshareSeason.Winter,
    annualMaintenanceFee: {
      amount: 9_750,
      currency: Currency.Try,
      period: PricePeriod.Yearly,
      negotiable: false,
    },
    titleDeedStatus: TitleDeedStatus.Shared,
    furnished: true,
  },
}

export const tourismPublishedBoutiqueHotel: TourismFacilityListing = {
  ...createBaseListing({
    id: 'listing-tourism-kemer-boutique-hotel',
    listingNo: '1245794559',
    title: "Kemer'de Faaliyette 28 Odalı Butik Otel",
    description:
      'Sahile 250 metre mesafede, işletme ve alkol ruhsatı bulunan, faal durumdaki butik otel.',
    status: ListingStatus.Published,
    priceAmount: 120_000_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '07',
      'Antalya',
      'kemer',
      'Kemer',
      'merkez',
      'Merkez',
      36.6005,
      30.5595,
    ),
    seller: constructionSeller,
    ownerUserId: 'user-construction-yapi-proje',
    createdAt: '2026-07-05T09:30:00+03:00',
    updatedAt: '2026-07-05T11:10:00+03:00',
    publishedAt: '2026-07-05T11:10:00+03:00',
    expiresAt: '2026-08-04T11:10:00+03:00',
    viewCount: 936,
    favoriteCount: 46,
    promotionTypes: [PromotionType.Showcase, PromotionType.HomepageShowcase],
  }),
  category: ListingCategory.TourismFacility,
  transactionType: TourismFacilityTransactionType.Sale,
  subCategory: TourismFacilitySubCategory.BoutiqueHotel,
  attributes: {
    roomCount: 28,
    bedCount: 64,
    starRating: 4,
    floorCount: 4,
    indoorSquareMeters: 2_100,
    outdoorSquareMeters: 1_350,
    buildingAge: BuildingAge.SixToTen,
    hasOperatingLicense: true,
    hasAlcoholLicense: true,
    distanceToBeachMeters: 250,
    buildingCondition: BuildingCondition.Used,
    furnished: true,
    parkingType: ParkingType.Open,
    transferIncluded: true,
    annualRevenue: {
      amount: 24_500_000,
      currency: Currency.Try,
      period: PricePeriod.Yearly,
      negotiable: false,
    },
  },
}

export const tourismRejectedPension: TourismFacilityListing = {
  ...createBaseListing({
    id: 'listing-tourism-marmaris-pension',
    listingNo: '1245795024',
    title: "Marmaris Merkez'de 16 Odalı Pansiyon",
    description:
      'Merkezi konumda 16 odalı turistik tesis. Ruhsat bilgileri için moderasyon incelemesi yapılmıştır.',
    status: ListingStatus.Rejected,
    priceAmount: 48_000_000,
    pricePeriod: PricePeriod.OneTime,
    location: createLocation(
      '48',
      'Muğla',
      'marmaris',
      'Marmaris',
      'tepe',
      'Tepe',
      36.855,
      28.2742,
    ),
    seller: officeSeller,
    ownerUserId: 'user-office-marmara-emlak',
    createdAt: '2026-07-12T16:00:00+03:00',
    updatedAt: '2026-07-12T16:42:00+03:00',
    reportCount: 2,
    tags: ['belgeKontrolü'],
    moderation: createModeration(ListingStatus.Rejected, {
      rejectionReasons: [
        RejectionReason.MissingAuthorizationDocument,
        RejectionReason.DocumentMismatch,
      ],
      reviewNote:
        'Yüklenen işletme belgesi farklı ada ait. Yetki ve ruhsat belgeleri doğrulanamadı.',
    }),
  }),
  category: ListingCategory.TourismFacility,
  transactionType: TourismFacilityTransactionType.Sale,
  subCategory: TourismFacilitySubCategory.Pension,
  attributes: {
    roomCount: 16,
    bedCount: 34,
    floorCount: 3,
    indoorSquareMeters: 980,
    outdoorSquareMeters: 240,
    buildingAge: BuildingAge.ElevenToFifteen,
    hasOperatingLicense: false,
    hasAlcoholLicense: false,
    distanceToBeachMeters: 620,
    buildingCondition: BuildingCondition.Used,
    furnished: true,
    parkingType: ParkingType.None,
    transferIncluded: false,
  },
}

export const allListingFixtures: Listing[] = [
  residentialPublishedApartment,
  residentialPendingVilla,
  landDraftResidentialZoned,
  landRejectedField,
  commercialChangesRequestedOffice,
  commercialPausedWarehouse,
  buildingExpiredComplete,
  buildingArchivedMixedUse,
  timesharePublishedBodrum,
  timesharePendingThermal,
  tourismPublishedBoutiqueHotel,
  tourismRejectedPension,
]

export const listingByStatus = {
  [ListingStatus.Draft]: landDraftResidentialZoned,
  [ListingStatus.PendingReview]: residentialPendingVilla,
  [ListingStatus.ChangesRequested]: commercialChangesRequestedOffice,
  [ListingStatus.Published]: residentialPublishedApartment,
  [ListingStatus.Rejected]: landRejectedField,
  [ListingStatus.Paused]: commercialPausedWarehouse,
  [ListingStatus.Expired]: buildingExpiredComplete,
  [ListingStatus.Archived]: buildingArchivedMixedUse,
} satisfies Record<ListingStatus, Listing>
