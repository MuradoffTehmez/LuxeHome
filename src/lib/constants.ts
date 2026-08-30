/**
 * Domen sabitləri — SQLite native enum dəstəkləmədiyi üçün bütün status və
 * kateqoriya dəyərləri burada mərkəzləşdirilib. Həm server, həm client tərəfdə
 * eyni mənbədən istifadə olunur.
 */

// ---------------------------------------------------------------------------
// İSTİFADƏÇİ ROLLARI
// ---------------------------------------------------------------------------

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Redaktor",
};

/** Sistemdəki bütün icazələr. */
export const PERMISSIONS = {
  PROPERTY_MANAGE: "property:manage",
  PROJECT_MANAGE: "project:manage",
  SERVICE_MANAGE: "service:manage",
  BLOG_MANAGE: "blog:manage",
  LEAD_MANAGE: "lead:manage",
  MEDIA_MANAGE: "media:manage",
  USER_MANAGE: "user:manage",
  SETTINGS_MANAGE: "settings:manage",
  TRANSLATION_MANAGE: "translation:manage",
  PARTNER_VIEW: "partner:view",
  PARTNER_CREATE: "partner:create",
  PARTNER_UPDATE: "partner:update",
  PARTNER_DELETE: "partner:delete",
  PARTNER_VERIFY: "partner:verify",
  PARTNER_PUBLISH: "partner:publish",
  PARTNER_RELATION_MANAGE: "partner:relationships",
  /**
   * Müqavilə metadatası (nömrə, tarixlər, sənəd, daxili qeydlər) ayrıca icazədir:
   * bu məlumat kommersiya sirridir və adi paneldə avtomatik görünməməlidir.
   */
  PARTNER_CONTRACT_MANAGE: "partner:contract",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Rol → icazə matrisi. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: [
    PERMISSIONS.PROPERTY_MANAGE,
    PERMISSIONS.PROJECT_MANAGE,
    PERMISSIONS.SERVICE_MANAGE,
    PERMISSIONS.BLOG_MANAGE,
    PERMISSIONS.LEAD_MANAGE,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.TRANSLATION_MANAGE,
    PERMISSIONS.PARTNER_VIEW,
    PERMISSIONS.PARTNER_CREATE,
    PERMISSIONS.PARTNER_UPDATE,
    PERMISSIONS.PARTNER_DELETE,
    PERMISSIONS.PARTNER_VERIFY,
    PERMISSIONS.PARTNER_PUBLISH,
    PERMISSIONS.PARTNER_RELATION_MANAGE,
  ],
  EDITOR: [PERMISSIONS.BLOG_MANAGE, PERMISSIONS.MEDIA_MANAGE, PERMISSIONS.TRANSLATION_MANAGE, PERMISSIONS.PARTNER_VIEW],
};

export const TRANSLATION_STATUSES = {
  DRAFT: "DRAFT",
  READY: "READY",
  PUBLISHED: "PUBLISHED",
} as const;

export type TranslationStatus =
  (typeof TRANSLATION_STATUSES)[keyof typeof TRANSLATION_STATUSES];

export const TRANSLATION_STATUS_LABELS: Record<TranslationStatus, string> = {
  DRAFT: "Qaralama",
  READY: "Yoxlamaya hazır",
  PUBLISHED: "Dərc edilib",
};

export const TRANSLATION_ENTITY_TYPES = {
  PROPERTY: "PROPERTY",
  PROJECT: "PROJECT",
  SERVICE: "SERVICE",
  BLOG_POST: "BLOG_POST",
} as const;

export type TranslationEntityType =
  (typeof TRANSLATION_ENTITY_TYPES)[keyof typeof TRANSLATION_ENTITY_TYPES];

// ---------------------------------------------------------------------------
// ƏMLAK
// ---------------------------------------------------------------------------

export const LISTING_TYPES = {
  SALE: "SALE",
  RENT: "RENT",
} as const;

export type ListingType = (typeof LISTING_TYPES)[keyof typeof LISTING_TYPES];

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  SALE: "Satılır",
  RENT: "Kirayə",
};

/**
 * Tikilinin növü — yerli bazarda əmlak növündən ayrı ikinci ölçüdür.
 * Qiymət, sənəd vəziyyəti və ipoteka uyğunluğu birbaşa bundan asılıdır.
 */
export const BUILDING_TYPES = {
  NEW: "NEW",
  OLD: "OLD",
} as const;

export type BuildingType = (typeof BUILDING_TYPES)[keyof typeof BUILDING_TYPES];

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  NEW: "Yeni tikili",
  OLD: "Köhnə tikili",
};

/** Yerləşmə ağacının səviyyələri — `Location.kind` sahəsinin icazə verilən dəyərləri. */
export const LOCATION_KINDS = {
  CITY: "CITY",
  DISTRICT: "DISTRICT",
  METRO: "METRO",
  SETTLEMENT: "SETTLEMENT",
  LANDMARK: "LANDMARK",
} as const;

export type LocationKind = (typeof LOCATION_KINDS)[keyof typeof LOCATION_KINDS];

/** Yer göstərilərkən ada əlavə olunan qısaltma: «Nəsimi m.», «Mərdəkan q.». */
export const LOCATION_KIND_SUFFIX: Record<LocationKind, string> = {
  CITY: "",
  DISTRICT: "r.",
  METRO: "m.",
  SETTLEMENT: "q.",
  LANDMARK: "",
};

export const PROPERTY_STATUSES = {
  DRAFT: "DRAFT",
  /** Kənar istifadəçi göndərib, admin təsdiqi gözlənilir. */
  PENDING: "PENDING",
  PUBLISHED: "PUBLISHED",
  RESERVED: "RESERVED",
  SOLD: "SOLD",
  RENTED: "RENTED",
  ARCHIVED: "ARCHIVED",
} as const;

export type PropertyStatus =
  (typeof PROPERTY_STATUSES)[keyof typeof PROPERTY_STATUSES];

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  DRAFT: "Qaralama",
  PENDING: "Təsdiq gözləyir",
  PUBLISHED: "Dərc olunub",
  RESERVED: "Beh alınıb",
  SOLD: "Satılıb",
  RENTED: "Kirayə verilib",
  ARCHIVED: "Arxiv",
};

/** Frontend-də badge rəngi üçün istifadə olunan variant adları. */
export const PROPERTY_STATUS_TONE: Record<
  PropertyStatus,
  "neutral" | "success" | "warning" | "danger" | "gold"
> = {
  DRAFT: "neutral",
  PENDING: "warning",
  PUBLISHED: "success",
  RESERVED: "warning",
  SOLD: "danger",
  RENTED: "danger",
  ARCHIVED: "neutral",
};

/** Saytda ictimai olaraq görünə bilən statuslar. */
export const PUBLIC_PROPERTY_STATUSES: PropertyStatus[] = [
  PROPERTY_STATUSES.PUBLISHED,
  PROPERTY_STATUSES.RESERVED,
  PROPERTY_STATUSES.SOLD,
  PROPERTY_STATUSES.RENTED,
];

export const RENOVATIONS = {
  NEW_BUILDING: "NEW_BUILDING",
  DESIGNER: "DESIGNER",
  RENOVATED: "RENOVATED",
  COSMETIC: "COSMETIC",
  UNRENOVATED: "UNRENOVATED",
} as const;

export type Renovation = (typeof RENOVATIONS)[keyof typeof RENOVATIONS];

export const RENOVATION_LABELS: Record<Renovation, string> = {
  NEW_BUILDING: "Yeni tikili",
  DESIGNER: "Dizayner təmiri",
  RENOVATED: "Əla təmirli",
  COSMETIC: "Kosmetik təmir",
  UNRENOVATED: "Təmirsiz",
};

/**
 * Əmlak sənədləri.
 *
 * Yerli bazarda sənəd növü qiymətə birbaşa təsir edir və alıcının ilk soruşduğu
 * göstəricilərdəndir, ona görə siyahı bina.az/emlak.az dəsti ilə eyni saxlanılır.
 */
export const DOCUMENT_STATUSES = {
  TITLE_DEED: "TITLE_DEED",
  CONTRACT: "CONTRACT",
  MUNICIPAL: "MUNICIPAL",
  DECREE: "DECREE",
  POWER_OF_ATTORNEY: "POWER_OF_ATTORNEY",
  EXTRACT_COMMERCIAL: "EXTRACT_COMMERCIAL",
  NONE: "NONE",
} as const;

export type DocumentStatus =
  (typeof DOCUMENT_STATUSES)[keyof typeof DOCUMENT_STATUSES];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  TITLE_DEED: "Kupça (Çıxarış)",
  CONTRACT: "Müqavilə",
  MUNICIPAL: "Bələdiyyə sənədi",
  DECREE: "Sərəncam",
  POWER_OF_ATTORNEY: "Etibarnamə",
  EXTRACT_COMMERCIAL: "Çıxarış (qeyri-yaşayış)",
  NONE: "Kupçasız",
};

export const PRICE_PERIODS = {
  MONTH: "MONTH",
  DAY: "DAY",
} as const;

export type PricePeriod = (typeof PRICE_PERIODS)[keyof typeof PRICE_PERIODS];

export const PRICE_PERIOD_LABELS: Record<PricePeriod, string> = {
  MONTH: "ay",
  DAY: "gün",
};

// ---------------------------------------------------------------------------
// LAYİHƏ
// ---------------------------------------------------------------------------

export const PROJECT_STATUSES = {
  PLANNED: "PLANNED",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
} as const;

export type ProjectStatus =
  (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: "Planlaşdırılır",
  ONGOING: "Davam edir",
  COMPLETED: "Tamamlanıb",
};

export const PROJECT_TYPES = {
  RESIDENTIAL: "RESIDENTIAL",
  COMMERCIAL: "COMMERCIAL",
  VILLA: "VILLA",
  MIXED: "MIXED",
} as const;

export type ProjectType = (typeof PROJECT_TYPES)[keyof typeof PROJECT_TYPES];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  RESIDENTIAL: "Yaşayış layihəsi",
  COMMERCIAL: "Kommersiya layihəsi",
  VILLA: "Villa layihəsi",
  MIXED: "Qarışıq təyinatlı",
};

export const PROJECT_IMAGE_CATEGORIES = {
  EXTERIOR: "EXTERIOR",
  INTERIOR: "INTERIOR",
  CONSTRUCTION: "CONSTRUCTION",
  LANDSCAPE: "LANDSCAPE",
} as const;

export type ProjectImageCategory =
  (typeof PROJECT_IMAGE_CATEGORIES)[keyof typeof PROJECT_IMAGE_CATEGORIES];

export const PROJECT_IMAGE_CATEGORY_LABELS: Record<
  ProjectImageCategory,
  string
> = {
  EXTERIOR: "Eksteryer",
  INTERIOR: "İnteryer",
  CONSTRUCTION: "Tikinti",
  LANDSCAPE: "Landşaft",
};

// ---------------------------------------------------------------------------
// BLOQ
// ---------------------------------------------------------------------------

export const POST_STATUSES = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export type PostStatus = (typeof POST_STATUSES)[keyof typeof POST_STATUSES];

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: "Qaralama",
  PUBLISHED: "Dərc olunub",
  ARCHIVED: "Arxiv",
};

// ---------------------------------------------------------------------------
// MÜRACİƏTLƏR
// ---------------------------------------------------------------------------

export const LEAD_STATUSES = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CLOSED: "CLOSED",
} as const;

export type LeadStatus = (typeof LEAD_STATUSES)[keyof typeof LEAD_STATUSES];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Yeni",
  CONTACTED: "Əlaqə saxlanılıb",
  IN_PROGRESS: "İşlənir",
  COMPLETED: "Tamamlanıb",
  CLOSED: "Bağlanıb",
};

export const LEAD_STATUS_TONE: Record<
  LeadStatus,
  "neutral" | "success" | "warning" | "danger" | "gold"
> = {
  NEW: "gold",
  CONTACTED: "warning",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CLOSED: "neutral",
};

export const LEAD_SOURCES = {
  PROPERTY: "PROPERTY",
  CONTACT: "CONTACT",
  SERVICE: "SERVICE",
  PROJECT: "PROJECT",
} as const;

export type LeadSource = (typeof LEAD_SOURCES)[keyof typeof LEAD_SOURCES];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  PROPERTY: "Əmlak səhifəsi",
  CONTACT: "Əlaqə səhifəsi",
  SERVICE: "Xidmət səhifəsi",
  PROJECT: "Layihə səhifəsi",
};

// ---------------------------------------------------------------------------
// SAXLANMIŞ AXTARIŞLAR VƏ BİLDİRİŞLƏR
// ---------------------------------------------------------------------------

export const SAVED_SEARCH_FREQUENCIES = {
  IMMEDIATE: "IMMEDIATE",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  OFF: "OFF",
} as const;

export type SavedSearchFrequency =
  (typeof SAVED_SEARCH_FREQUENCIES)[keyof typeof SAVED_SEARCH_FREQUENCIES];

/**
 * Bildiriş növləri. Hazırda yalnız saxlanmış axtarış uyğunluğu istehsal edir —
 * gələcək alt-layihələr PRICE_DROP (qiymət düşməsi) və MEETING_REMINDER (görüş
 * xatırlatması) əlavə edəcək, `Notification` modeli onlar üçün sxem dəyişikliyi
 * olmadan hazırdır.
 */
export const NOTIFICATION_TYPES = {
  SAVED_SEARCH_MATCH: "SAVED_SEARCH_MATCH",
  PRICE_DROP: "PRICE_DROP",
  RESERVATION_STATUS: "RESERVATION_STATUS",
  RECOMMENDATION: "RECOMMENDATION",
  MEETING_REMINDER: "MEETING_REMINDER",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  SAVED_SEARCH_MATCH: "Saxlanmış axtarışa uyğun elan",
  PRICE_DROP: "Qiymət endirimi",
  RESERVATION_STATUS: "Rezervasiya statusu",
  RECOMMENDATION: "Fərdi tövsiyə",
  MEETING_REMINDER: "Görüş xatırlatması",
};

// ---------------------------------------------------------------------------
// PUBLIC PLATFORM — PHASE 2
// ---------------------------------------------------------------------------

export const RESERVATION_STATUSES = {
  REQUESTED: "REQUESTED",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  COMPLETED: "COMPLETED",
} as const;

export type ReservationStatus =
  (typeof RESERVATION_STATUSES)[keyof typeof RESERVATION_STATUSES];

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  REQUESTED: "Sorğu göndərilib",
  PENDING: "Baxılır",
  APPROVED: "Təsdiqlənib",
  REJECTED: "Rədd edilib",
  CANCELLED: "Ləğv edilib",
  EXPIRED: "Müddəti bitib",
  COMPLETED: "Tamamlanıb",
};

export const REVIEW_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  HIDDEN: "HIDDEN",
} as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[keyof typeof REVIEW_STATUSES];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: "Moderasiya gözləyir",
  APPROVED: "Təsdiqlənib",
  REJECTED: "Rədd edilib",
  HIDDEN: "Gizlədilib",
};

export const NEARBY_PLACE_CATEGORIES = {
  METRO: "METRO",
  BUS: "BUS",
  SCHOOL: "SCHOOL",
  UNIVERSITY: "UNIVERSITY",
  KINDERGARTEN: "KINDERGARTEN",
  HOSPITAL: "HOSPITAL",
  CLINIC: "CLINIC",
  PHARMACY: "PHARMACY",
  SUPERMARKET: "SUPERMARKET",
  RESTAURANT: "RESTAURANT",
  PARK: "PARK",
  SHOPPING_CENTER: "SHOPPING_CENTER",
} as const;

export type NearbyPlaceCategory =
  (typeof NEARBY_PLACE_CATEGORIES)[keyof typeof NEARBY_PLACE_CATEGORIES];

export const NEARBY_PLACE_CATEGORY_LABELS: Record<NearbyPlaceCategory, string> = {
  METRO: "Metro",
  BUS: "Avtobus dayanacağı",
  SCHOOL: "Məktəb",
  UNIVERSITY: "Universitet",
  KINDERGARTEN: "Uşaq bağçası",
  HOSPITAL: "Xəstəxana",
  CLINIC: "Klinika",
  PHARMACY: "Aptek",
  SUPERMARKET: "Supermarket",
  RESTAURANT: "Restoran",
  PARK: "Park",
  SHOPPING_CENTER: "Ticarət mərkəzi",
};

export const PREMIUM_DURATIONS_DAYS = [3, 7, 14, 30] as const;

export const AI_CONTENT_DRAFT_STATUSES = {
  DRAFT: "DRAFT",
  APPLIED: "APPLIED",
  DISCARDED: "DISCARDED",
} as const;

// ---------------------------------------------------------------------------
// SIRALAMA VƏ SƏHİFƏLƏMƏ
// ---------------------------------------------------------------------------

export const SORT_OPTIONS = [
  { value: "newest", label: "Ən yeni" },
  { value: "price_asc", label: "Ən ucuz" },
  { value: "price_desc", label: "Ən bahalı" },
  { value: "area_desc", label: "Sahəyə görə" },
  { value: "featured", label: "Tövsiyə olunan" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 12;

// ---------------------------------------------------------------------------
// MEDİA
// ---------------------------------------------------------------------------

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/** 8 MB */
export const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;
/** İctimai elanın qəbul etdiyi maksimum qalereya şəkli. */
export const MAX_PROPERTY_IMAGES = 20;

// ---------------------------------------------------------------------------
// VALYUTA
// ---------------------------------------------------------------------------

export const CURRENCIES = {
  AZN: "AZN",
  USD: "USD",
  EUR: "EUR",
} as const;

export type Currency = (typeof CURRENCIES)[keyof typeof CURRENCIES];

export const CURRENCY_LABELS: Record<Currency, string> = {
  AZN: "AZN (₼)",
  USD: "USD ($)",
  EUR: "EUR (€)",
};

// ---------------------------------------------------------------------------
// PANELDƏ SƏHİFƏLƏMƏ
// ---------------------------------------------------------------------------

/** Admin cədvəllərində bir səhifədəki sətir sayı. */
export const ADMIN_PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// XÜSUSİYYƏT QRUPLARI
// ---------------------------------------------------------------------------

export const FEATURE_GROUPS = {
  GENERAL: "GENERAL",
  UTILITY: "UTILITY",
  PAYMENT: "PAYMENT",
  INDOOR: "INDOOR",
  OUTDOOR: "OUTDOOR",
  SECURITY: "SECURITY",
} as const;

export type FeatureGroup = (typeof FEATURE_GROUPS)[keyof typeof FEATURE_GROUPS];

export const FEATURE_GROUP_LABELS: Record<FeatureGroup, string> = {
  GENERAL: "Ümumi",
  UTILITY: "Kommunal",
  PAYMENT: "Ödəniş şərtləri",
  INDOOR: "Daxili",
  OUTDOOR: "Xarici",
  SECURITY: "Təhlükəsizlik",
};

// ---------------------------------------------------------------------------
// HESAB NÖVLƏRİ (İCTİMAİ QEYDİYYAT)
// ---------------------------------------------------------------------------

/**
 * Hesabın kim olduğu — `role` isə **yalnız** panel səlahiyyətini göstərir.
 *
 * İki ölçü qəsdən ayrıdır: şirkət əməkdaşı (`STAFF`) panelə girir, ictimai hesablar
 * isə heç bir panel icazəsi almır. Beləliklə yeni hesab növü əlavə etmək RBAC
 * matrisinə toxunmur.
 */
export const ACCOUNT_TYPES = {
  STAFF: "STAFF",
  USER: "USER",
  OWNER: "OWNER",
  AGENCY: "AGENCY",
} as const;

export type AccountType = (typeof ACCOUNT_TYPES)[keyof typeof ACCOUNT_TYPES];

/** Sessiyanın hansı giriş axınından yaradıldığını göstərir. */
export const AUTH_KINDS = {
  STAFF_2FA: "STAFF_2FA",
  PUBLIC: "PUBLIC",
} as const;

export type AuthKind = (typeof AUTH_KINDS)[keyof typeof AUTH_KINDS];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  STAFF: "Şirkət əməkdaşı",
  USER: "İstifadəçi",
  OWNER: "Mülk sahibi",
  AGENCY: "Agentlik",
};

/** Qeydiyyat formasında seçilə bilən növlər — `STAFF` yalnız paneldən yaradılır. */
export const PUBLIC_ACCOUNT_TYPES: AccountType[] = [
  ACCOUNT_TYPES.USER,
  ACCOUNT_TYPES.OWNER,
  ACCOUNT_TYPES.AGENCY,
];

/** Öz elanını yerləşdirə bilən hesab növləri. */
export const LISTING_ACCOUNT_TYPES: AccountType[] = [
  ACCOUNT_TYPES.OWNER,
  ACCOUNT_TYPES.AGENCY,
];

// ---------------------------------------------------------------------------
// ÖDƏNİŞ VƏ SATIŞ ŞƏRTLƏRİ
// ---------------------------------------------------------------------------

/**
 * Alıcının ödəniş imkanları.
 *
 * Ayrıca cədvəl yaradılmır: bu dəyərlər `Feature` taksonomiyasında `PAYMENT`
 * qrupunda saxlanılır və mövcud `featureSlugs` filtri onları pulsuz dəstəkləyir.
 * `Property.mortgageAvailable` və `installmentAvailable` sahələri geriyə uyğunluq
 * üçün qalır və müvafiq slug ilə sinxron yazılır.
 */
export const PAYMENT_OPTIONS = {
  CREDIT: "kredit",
  INTEREST_FREE_CREDIT: "faizsiz-kredit",
  MORTGAGE: "ipoteka",
  READY_MORTGAGE: "hazir-ipoteka",
  BARTER: "barter",
  INSTALLMENT: "taksit",
} as const;

export type PaymentOption = (typeof PAYMENT_OPTIONS)[keyof typeof PAYMENT_OPTIONS];

export const PAYMENT_OPTION_LABELS: Record<PaymentOption, string> = {
  kredit: "Kredit",
  "faizsiz-kredit": "Faizsiz kredit",
  ipoteka: "İpoteka",
  "hazir-ipoteka": "Hazır ipoteka",
  barter: "Barter",
  taksit: "Taksit",
};

/** `Feature.group` dəyəri — ödəniş şərtləri adi xüsusiyyətlərdən ayrı göstərilir. */
export const PAYMENT_FEATURE_GROUP = "PAYMENT";

// ---------------------------------------------------------------------------
// DİL (i18n)
// ---------------------------------------------------------------------------

export const LOCALES = {
  AZ: "az",
  EN: "en",
  RU: "ru",
} as const;

export type Locale = (typeof LOCALES)[keyof typeof LOCALES];

export const LOCALE_LABELS: Record<Locale, string> = {
  az: "Azərbaycan",
  en: "English",
  ru: "Русский",
};

export const DEFAULT_LOCALE: Locale = LOCALES.AZ;

// ---------------------------------------------------------------------------
// AGENTLİK KOMANDASI
// ---------------------------------------------------------------------------

/** Sahibdən (Agency.userId) aşağı əməkdaş rolu. */
export const AGENCY_EMPLOYEE_ROLES = {
  MANAGER: "MANAGER",
  AGENT: "AGENT",
} as const;

export type AgencyEmployeeRole = (typeof AGENCY_EMPLOYEE_ROLES)[keyof typeof AGENCY_EMPLOYEE_ROLES];

export const AGENCY_EMPLOYEE_ROLE_LABELS: Record<AgencyEmployeeRole, string> = {
  MANAGER: "Menecer",
  AGENT: "Agent",
};

export const AGENCY_EMPLOYEE_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type AgencyEmployeeStatus =
  (typeof AGENCY_EMPLOYEE_STATUSES)[keyof typeof AGENCY_EMPLOYEE_STATUSES];

export const AGENCY_EMPLOYEE_STATUS_LABELS: Record<AgencyEmployeeStatus, string> = {
  PENDING: "Təsdiq gözləyir",
  APPROVED: "Təsdiqləndi",
  REJECTED: "Rədd edildi",
};

/** Sahibdən əlavə maksimum əməkdaş sayı — PRD Phase 1 tələbi. */
export const MAX_AGENCY_EMPLOYEES = 3;

// ---------------------------------------------------------------------------
// TƏRƏFDAŞLAR (PARTNERS)
// ---------------------------------------------------------------------------

/**
 * Tərəfdaşlıq növü.
 *
 * Ayrıca taksonomiya cədvəli qəsdən yaradılmır: dəyər dəsti biznes qərarıdır,
 * redaktor tərəfindən genişləndirilmir və digər status sahələri ilə eyni
 * konvensiyaya (String sütun + burada sabit) tabedir.
 */
export const PARTNERSHIP_TYPES = {
  BROKER: "BROKER",
  REAL_ESTATE_AGENCY: "REAL_ESTATE_AGENCY",
  DEVELOPER: "DEVELOPER",
  CONSTRUCTION_COMPANY: "CONSTRUCTION_COMPANY",
  INVESTMENT: "INVESTMENT",
  BANK: "BANK",
  MORTGAGE: "MORTGAGE",
  INSURANCE: "INSURANCE",
  TECHNOLOGY: "TECHNOLOGY",
  MEDIA: "MEDIA",
  MARKETING: "MARKETING",
  SERVICE_PROVIDER: "SERVICE_PROVIDER",
  STRATEGIC_PARTNER: "STRATEGIC_PARTNER",
  OTHER: "OTHER",
} as const;

export type PartnershipType = (typeof PARTNERSHIP_TYPES)[keyof typeof PARTNERSHIP_TYPES];

/** Panel etiketləri. İctimai tərəfdə mətn `partners` i18n namespace-indən gəlir. */
export const PARTNERSHIP_TYPE_LABELS: Record<PartnershipType, string> = {
  BROKER: "Broker",
  REAL_ESTATE_AGENCY: "Daşınmaz əmlak agentliyi",
  DEVELOPER: "Developer",
  CONSTRUCTION_COMPANY: "Tikinti şirkəti",
  INVESTMENT: "İnvestisiya",
  BANK: "Bank",
  MORTGAGE: "İpoteka",
  INSURANCE: "Sığorta",
  TECHNOLOGY: "Texnologiya",
  MEDIA: "Media",
  MARKETING: "Marketinq",
  SERVICE_PROVIDER: "Xidmət təminatçısı",
  STRATEGIC_PARTNER: "Strateji tərəfdaş",
  OTHER: "Digər",
};

export const PARTNER_STATUSES = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  EXPIRED: "EXPIRED",
  TERMINATED: "TERMINATED",
  ARCHIVED: "ARCHIVED",
} as const;

export type PartnerStatus = (typeof PARTNER_STATUSES)[keyof typeof PARTNER_STATUSES];

export const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  DRAFT: "Qaralama",
  PENDING: "Gözləyir",
  ACTIVE: "Aktiv",
  SUSPENDED: "Dayandırılıb",
  EXPIRED: "Müddəti bitib",
  TERMINATED: "Xitam verilib",
  ARCHIVED: "Arxiv",
};

export const PARTNER_STATUS_TONE: Record<
  PartnerStatus,
  "neutral" | "success" | "warning" | "danger" | "gold" | "info"
> = {
  DRAFT: "neutral",
  PENDING: "warning",
  ACTIVE: "success",
  SUSPENDED: "warning",
  EXPIRED: "danger",
  TERMINATED: "danger",
  ARCHIVED: "neutral",
};

/**
 * İctimai tərəfdə görünə bilən yeganə status.
 *
 * Siyahı `PUBLIC_PROPERTY_STATUSES` ilə eyni rolu oynayır: hər ictimai tərəfdaş
 * sorğusu bu şərtdən başlamalıdır, əks halda qaralama və xitam verilmiş
 * tərəfdaşlar sayta sızır.
 */
export const PUBLIC_PARTNER_STATUSES: PartnerStatus[] = [PARTNER_STATUSES.ACTIVE];

/**
 * Tərəfdaşın konkret elan/layihə üzərindəki rolu.
 *
 * Bir əmlak eyni anda bir neçə şirkətlə əlaqəli ola bilir (developer + satış
 * tərəfdaşı + agentlik), ona görə əlaqə çox-çoxadır və rol əlaqənin özündə saxlanılır.
 */
export const PARTNER_RELATION_ROLES = {
  SOURCE: "SOURCE",
  BROKER: "BROKER",
  CO_BROKER: "CO_BROKER",
  DEVELOPER: "DEVELOPER",
  EXCLUSIVE_SALES: "EXCLUSIVE_SALES",
  SALES_PARTNER: "SALES_PARTNER",
  MARKETING_PARTNER: "MARKETING_PARTNER",
  MANAGEMENT_PARTNER: "MANAGEMENT_PARTNER",
  OTHER: "OTHER",
} as const;

export type PartnerRelationRole =
  (typeof PARTNER_RELATION_ROLES)[keyof typeof PARTNER_RELATION_ROLES];

export const PARTNER_RELATION_ROLE_LABELS: Record<PartnerRelationRole, string> = {
  SOURCE: "Mənbə",
  BROKER: "Broker",
  CO_BROKER: "Ortaq broker",
  DEVELOPER: "Developer",
  EXCLUSIVE_SALES: "Eksklüziv satış",
  SALES_PARTNER: "Satış tərəfdaşı",
  MARKETING_PARTNER: "Marketinq tərəfdaşı",
  MANAGEMENT_PARTNER: "İdarəetmə tərəfdaşı",
  OTHER: "Digər",
};

/**
 * İctimai filtr qrupları — bir neçə `PartnershipType` bir düymə altında toplanır,
 * çünki ziyarətçi «Maliyyə» axtarır, «BANK / MORTGAGE / INSURANCE» yox.
 * `slug` URL-dəki `?tip=` dəyəridir, `key` isə i18n açarıdır.
 */
export const PARTNER_FILTER_GROUPS = [
  {
    slug: "brokerler",
    key: "brokers",
    types: [PARTNERSHIP_TYPES.BROKER],
  },
  {
    slug: "agentlikler",
    key: "agencies",
    types: [PARTNERSHIP_TYPES.REAL_ESTATE_AGENCY],
  },
  {
    slug: "developerler",
    key: "developers",
    types: [PARTNERSHIP_TYPES.DEVELOPER, PARTNERSHIP_TYPES.CONSTRUCTION_COMPANY],
  },
  {
    slug: "strateji",
    key: "strategic",
    types: [PARTNERSHIP_TYPES.STRATEGIC_PARTNER],
  },
  {
    slug: "texnologiya",
    key: "technology",
    types: [PARTNERSHIP_TYPES.TECHNOLOGY, PARTNERSHIP_TYPES.MEDIA, PARTNERSHIP_TYPES.MARKETING],
  },
  {
    slug: "maliyye",
    key: "finance",
    types: [
      PARTNERSHIP_TYPES.INVESTMENT,
      PARTNERSHIP_TYPES.BANK,
      PARTNERSHIP_TYPES.MORTGAGE,
      PARTNERSHIP_TYPES.INSURANCE,
    ],
  },
  {
    slug: "diger",
    key: "other",
    types: [PARTNERSHIP_TYPES.SERVICE_PROVIDER, PARTNERSHIP_TYPES.OTHER],
  },
] as const;

export type PartnerFilterGroup = (typeof PARTNER_FILTER_GROUPS)[number];
export type PartnerFilterGroupSlug = PartnerFilterGroup["slug"];

/** Yüklənə bilən ən böyük loqo ölçüsü — `MAX_UPLOAD_SIZE`-dan kiçikdir, loqo ağır olmamalıdır. */
export const MAX_PARTNER_LOGO_SIZE = 2 * 1024 * 1024;
