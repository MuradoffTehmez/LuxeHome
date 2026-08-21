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
  ],
  EDITOR: [PERMISSIONS.BLOG_MANAGE, PERMISSIONS.MEDIA_MANAGE],
};

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

export const DOCUMENT_STATUSES = {
  TITLE_DEED: "TITLE_DEED",
  CONTRACT: "CONTRACT",
  NONE: "NONE",
} as const;

export type DocumentStatus =
  (typeof DOCUMENT_STATUSES)[keyof typeof DOCUMENT_STATUSES];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  TITLE_DEED: "Çıxarış",
  CONTRACT: "Müqavilə",
  NONE: "Sənədsiz",
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
