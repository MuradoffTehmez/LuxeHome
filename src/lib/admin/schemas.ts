import { z } from "zod";
import {
  BUILDING_TYPES,
  CURRENCIES,
  DOCUMENT_STATUSES,
  FEATURE_GROUPS,
  LEAD_STATUSES,
  LISTING_TYPES,
  FAQ_CATEGORIES,
  KNOWLEDGE_AUDIENCES,
  KNOWLEDGE_LEVELS,
  KNOWLEDGE_RISK_LEVELS,
  KNOWLEDGE_STATUSES,
  LEGAL_CONTENT_STATUSES,
  POST_STATUSES,
  PRICE_PERIODS,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  PARTNER_RELATION_ROLES,
  PARTNER_STATUSES,
  PARTNERSHIP_TYPES,
  PROPERTY_STATUSES,
  RENOVATIONS,
  ROLES,
} from "@/lib/constants";

/**
 * Admin formalarının validasiya sxemləri.
 *
 * Sabitlərdən qurulan `z.enum` dəyərləri sxemlə `constants.ts` arasında uyğunsuzluğu
 * kompilyasiya vaxtı tutur: yeni status əlavə ediləndə forma da avtomatik qəbul edir.
 */

const requiredText = (label: string, min = 2, max = 200) =>
  z
    .string()
    .trim()
    .min(min, `${label} ən azı ${min} simvol olmalıdır`)
    .max(max, `${label} ${max} simvoldan uzun ola bilməz`);

const optionalText = (max = 200) =>
  z.string().trim().max(max, `Mətn ${max} simvoldan uzun ola bilməz`).nullable();

const positiveNumber = (label: string) =>
  z.number().positive(`${label} sıfırdan böyük olmalıdır`);

const optionalCount = (label: string, max = 500) =>
  z
    .number()
    .int(`${label} tam ədəd olmalıdır`)
    .min(0, `${label} mənfi ola bilməz`)
    .max(max, `${label} çox böyükdür`)
    .nullable();

const cuid = z.string().min(1);

/** Yalnız `https://` sxemli kənar ünvanlar — `javascript:` və `data:` bağlıdır. */
const externalUrl = z
  .string()
  .trim()
  .url("Ünvan düzgün deyil")
  .refine((value) => value.startsWith("https://"), "Ünvan https:// ilə başlamalıdır")
  .nullable();

const enumOf = <T extends Record<string, string>>(values: T) =>
  z.enum(Object.values(values) as [string, ...string[]]);

// ---------------------------------------------------------------------------
// ƏMLAK
// ---------------------------------------------------------------------------

export const propertyFieldsSchema = z.object({
    title: requiredText("Başlıq", 5, 160),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]*$/, "Slug yalnız kiçik latın hərfi, rəqəm və defis ola bilər")
      .max(90),
    description: requiredText("Təsvir", 20, 8000),

    listingType: enumOf(LISTING_TYPES),
    status: enumOf(PROPERTY_STATUSES),

    price: positiveNumber("Qiymət"),
    currency: enumOf(CURRENCIES),
    pricePeriod: enumOf(PRICE_PERIODS).nullable(),

    typeId: cuid,
    cityId: cuid,
    districtId: cuid.nullable(),
    metroId: cuid.nullable(),
    projectId: cuid.nullable(),
    address: optionalText(240),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),

    rooms: optionalCount("Otaq sayı", 50),
    bedrooms: optionalCount("Yataq otağı sayı", 50),
    bathrooms: optionalCount("Sanitar qovşaq sayı", 50),
    area: z.number().positive("Sahə sıfırdan böyük olmalıdır").nullable(),
    landArea: z.number().positive("Torpaq sahəsi sıfırdan böyük olmalıdır").nullable(),
    floor: optionalCount("Mərtəbə", 200),
    totalFloors: optionalCount("Mərtəbə sayı", 200),

    renovation: enumOf(RENOVATIONS).nullable(),
    documentStatus: enumOf(DOCUMENT_STATUSES).nullable(),
    buildingType: enumOf(BUILDING_TYPES).nullable(),

    videoUrl: externalUrl,
    // `mortgageAvailable` / `installmentAvailable` burada yoxdur: dəyər `PAYMENT`
    // qrupundakı xüsusiyyət seçimindən törədilir (`admin/payment-features.ts`).
    isFeatured: z.boolean(),
    featuredUntil: z.coerce.date().nullable(),
    reservationEnabled: z.boolean(),
    assignedAgentId: cuid.nullable(),

    metaTitle: optionalText(70),
    metaDescription: optionalText(180),
    noIndex: z.boolean(),
    canonicalUrl: optionalText(300),
    ogTitle: optionalText(70),
    ogDescription: optionalText(200),
    ogImage: optionalText(500),

    featureIds: z.array(cuid),
  });

export const propertySchema = propertyFieldsSchema
  .refine((data) => data.listingType !== "RENT" || data.pricePeriod !== null, {
    message: "Kirayə elanı üçün qiymət dövrü seçilməlidir",
    path: ["pricePeriod"],
  })
  .refine(
    (data) => data.floor === null || data.totalFloors === null || data.floor <= data.totalFloors,
    { message: "Mərtəbə binanın mərtəbə sayından çox ola bilməz", path: ["floor"] },
  );

export type PropertyInput = z.infer<typeof propertySchema>;

// ---------------------------------------------------------------------------
// LAYİHƏ
// ---------------------------------------------------------------------------

export const projectSchema = z.object({
  name: requiredText("Ad", 3, 160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Slug yalnız kiçik latın hərfi, rəqəm və defis ola bilər")
    .max(90),
  description: requiredText("Təsvir", 20, 8000),
  summary: optionalText(300),

  projectType: enumOf(PROJECT_TYPES),
  status: enumOf(PROJECT_STATUSES),

  cityId: cuid.nullable(),
  address: optionalText(240),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),

  startDate: z.date().nullable(),
  deliveryDate: z.date().nullable(),
  year: z.number().int().min(1990).max(2100).nullable(),

  totalArea: z.number().positive().nullable(),
  floors: optionalCount("Mərtəbə sayı", 200),
  unitCount: optionalCount("Mənzil sayı", 100000),

  highlights: z.array(z.string().trim().min(1).max(160)),
  timeline: z.array(
    z.object({
      title: z.string().trim().min(1).max(160),
      done: z.boolean(),
    }),
  ),

  isActive: z.boolean(),
  order: z.number().int().min(0).max(9999),

  metaTitle: optionalText(70),
  metaDescription: optionalText(180),
  noIndex: z.boolean(),
  canonicalUrl: optionalText(300),
  ogTitle: optionalText(70),
  ogDescription: optionalText(200),
  ogImage: optionalText(500),
});

export type ProjectInput = z.infer<typeof projectSchema>;

// ---------------------------------------------------------------------------
// BLOQ
// ---------------------------------------------------------------------------

export const postSchema = z.object({
  title: requiredText("Başlıq", 5, 160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Slug yalnız kiçik latın hərfi, rəqəm və defis ola bilər")
    .max(90),
  excerpt: requiredText("Qısa təsvir", 20, 300),
  content: requiredText("Mətn", 50, 100000),
  coverAlt: optionalText(160),
  categoryId: cuid.nullable(),
  status: enumOf(POST_STATUSES),
  metaTitle: optionalText(70),
  metaDescription: optionalText(180),
  noIndex: z.boolean(),
  canonicalUrl: optionalText(300),
  ogTitle: optionalText(70),
  ogDescription: optionalText(200),
  ogImage: optionalText(500),
});

export type PostInput = z.infer<typeof postSchema>;

export const blogCategorySchema = z.object({
  name: requiredText("Ad", 2, 80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Slug yalnız kiçik latın hərfi, rəqəm və defis ola bilər")
    .max(90),
  description: optionalText(300),
  order: z.number().int().min(0).max(9999),
});

// ---------------------------------------------------------------------------
// BİLİK MƏRKƏZİ
// ---------------------------------------------------------------------------

const knowledgeSlug = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]*$/, "Slug yalnız kiçik latın hərfi, rəqəm və defis ola bilər")
  .max(90);

export const knowledgeCategorySchema = z.object({
  name: requiredText("Ad", 2, 80),
  slug: knowledgeSlug,
  /**
   * Kateqoriya izahı **məcburidir və uzundur**: Bilik Mərkəzinin girişində hər
   * mövzu üçün oxucuya nə tapacağını izah edən mətn göstərilir. Qısa etiket
   * kifayət etmir — istifadəçi hansı bölməyə girəcəyini oradan seçir.
   */
  description: requiredText("İzah", 40, 1200),
  icon: optionalText(40),
  order: z.number().int().min(0).max(9999),
  isActive: z.boolean(),
});

export const knowledgeArticleSchema = z.object({
  title: requiredText("Başlıq", 5, 180),
  slug: knowledgeSlug,
  excerpt: requiredText("Qısa təsvir", 20, 400),
  content: requiredText("Mətn", 50, 200000),
  coverAlt: optionalText(160),
  categoryId: cuid.nullable(),
  audience: enumOf(KNOWLEDGE_AUDIENCES),
  level: enumOf(KNOWLEDGE_LEVELS),
  status: enumOf(KNOWLEDGE_STATUSES),
  isFeatured: z.boolean(),
  legalStatus: enumOf(LEGAL_CONTENT_STATUSES),
  riskLevel: enumOf(KNOWLEDGE_RISK_LEVELS),
  jurisdiction: requiredText("Yurisdiksiya", 3, 120),
  legalReviewedAt: z.coerce.date().nullable(),
  legalActs: z.array(z.string().trim().min(2).max(300)).max(30),
  sourceUrls: z.array(z.string().url("Rəsmi mənbə URL-i düzgün deyil").max(1000)).max(30),
  legalBasis: optionalText(40000),
  requiredDocuments: optionalText(40000),
  procedure: optionalText(40000),
  duration: optionalText(10000),
  costs: optionalText(40000),
  risks: optionalText(40000),
  checklist: optionalText(40000),
  template: optionalText(80000),
  courtPosition: optionalText(40000),
  metaTitle: optionalText(70),
  metaDescription: optionalText(180),
  noIndex: z.boolean(),
  canonicalUrl: optionalText(300),
  ogTitle: optionalText(70),
  ogDescription: optionalText(200),
  ogImage: optionalText(500),
});

export type KnowledgeArticleInput = z.infer<typeof knowledgeArticleSchema>;

export const knowledgeTermSchema = z.object({
  term: requiredText("Termin", 2, 120),
  slug: knowledgeSlug,
  shortDefinition: requiredText("Qısa tərif", 10, 400),
  definition: optionalText(40000),
  categoryId: cuid.nullable(),
  status: enumOf(KNOWLEDGE_STATUSES),
  order: z.number().int().min(0).max(9999),
  relatedSlugs: z.array(z.string().trim().max(90)).max(10),
});

export const knowledgeFaqSchema = z.object({
  question: requiredText("Sual", 8, 300),
  answer: requiredText("Cavab", 10, 8000),
  category: enumOf(FAQ_CATEGORIES),
  status: enumOf(KNOWLEDGE_STATUSES),
  order: z.number().int().min(0).max(9999),
});

// ---------------------------------------------------------------------------
// XİDMƏT
// ---------------------------------------------------------------------------

export const serviceSchema = z.object({
  title: requiredText("Başlıq", 3, 160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Slug yalnız kiçik latın hərfi, rəqəm və defis ola bilər")
    .max(90),
  shortDescription: requiredText("Qısa təsvir", 20, 300),
  description: requiredText("Təsvir", 40, 8000),
  icon: requiredText("İkon", 2, 40),
  bullets: z.array(z.string().trim().min(1).max(200)),
  order: z.number().int().min(0).max(9999),
  isActive: z.boolean(),
  metaTitle: optionalText(70),
  metaDescription: optionalText(180),
  noIndex: z.boolean(),
  canonicalUrl: optionalText(300),
  ogTitle: optionalText(70),
  ogDescription: optionalText(200),
  ogImage: optionalText(500),
});

// ---------------------------------------------------------------------------
// MÜRACİƏT
// ---------------------------------------------------------------------------

export const leadUpdateSchema = z.object({
  status: enumOf(LEAD_STATUSES),
  adminNote: optionalText(2000),
  assigneeId: cuid.nullable(),
});

// ---------------------------------------------------------------------------
// İSTİFADƏÇİ
// ---------------------------------------------------------------------------

export const userCreateSchema = z.object({
  name: requiredText("Ad", 2, 120),
  email: z.string().trim().toLowerCase().pipe(z.email("E-poçt ünvanı düzgün deyil")),
  role: enumOf(ROLES),
});

export const userUpdateSchema = z.object({
  name: requiredText("Ad", 2, 120),
  role: enumOf(ROLES),
  isActive: z.boolean(),
});

// ---------------------------------------------------------------------------
// TAKSONOMİYA
// ---------------------------------------------------------------------------

export const propertyTypeCreateSchema = z.object({
  name: requiredText("Ad", 2, 80),
});

export const featureCreateSchema = z.object({
  name: requiredText("Ad", 2, 80),
  group: enumOf(FEATURE_GROUPS),
});

// ---------------------------------------------------------------------------
// YÖNLƏNDİRMƏLƏR
// ---------------------------------------------------------------------------

export const redirectCreateSchema = z.object({
  fromPath: z
    .string()
    .trim()
    .min(1, "Köhnə ünvan tələb olunur")
    .regex(/^\/\S*$/, "Aparıcı / ilə başlamalı və boşluq olmamalıdır")
    .max(300),
  toPath: z
    .string()
    .trim()
    .min(1, "Yeni ünvan tələb olunur")
    .regex(/^(\/\S*|https?:\/\/\S+)$/, "Ya / ilə başlayan yol, ya da tam URL olmalıdır")
    .max(500),
  statusCode: z.union([z.literal(301), z.literal(302)]),
});

// ---------------------------------------------------------------------------
// PARAMETRLƏR
// ---------------------------------------------------------------------------

export const settingSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9_.]+$/, "Açar yalnız kiçik hərf, rəqəm, nöqtə və alt xətt ola bilər")
    .max(60),
  value: z.string().trim().max(2000),
});

// ---------------------------------------------------------------------------
// TƏRƏFDAŞ
// ---------------------------------------------------------------------------

/** `YYYY-MM-DD` sahəsi — boş buraxıla bilər. */
const optionalDate = z.date().nullable();

const partnerBaseSchema = z.object({
  name: requiredText("Ad", 2, 160),
  legalName: optionalText(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Slug yalnız kiçik latın hərfi, rəqəm və defis ola bilər")
    .max(90),
  partnershipType: enumOf(PARTNERSHIP_TYPES),
  status: enumOf(PARTNER_STATUSES),

  shortDescription: optionalText(300),
  shortDescriptionEn: optionalText(300),
  shortDescriptionRu: optionalText(300),
  description: z.string().trim().max(20000).nullable(),
  descriptionEn: z.string().trim().max(20000).nullable(),
  descriptionRu: z.string().trim().max(20000).nullable(),
  disclaimer: optionalText(600),
  disclaimerEn: optionalText(600),
  disclaimerRu: optionalText(600),

  websiteUrl: externalUrl,
  email: z.string().trim().email("E-poçt ünvanı düzgün deyil").max(160).nullable(),
  phone: optionalText(40),
  whatsapp: optionalText(40),

  country: optionalText(80),
  city: optionalText(80),
  address: optionalText(240),

  verified: z.boolean(),
  officialPartner: z.boolean(),
  featured: z.boolean(),
  showPublicly: z.boolean(),
  showOnHomepage: z.boolean(),

  officialSince: optionalDate,
  partnershipEndDate: optionalDate,
  sortOrder: z.number().int().min(0, "Sıra mənfi ola bilməz").max(9999),

  seoTitle: optionalText(70),
  seoDescription: optionalText(180),
  seoKeywords: optionalText(300),
  ogImage: optionalText(500),
});

/**
 * Tərəfdaş forması.
 *
 * İki qayda `superRefine`-dədir, çünki hər ikisi sahələrarası münasibətdir və
 * tək sahə səviyyəsində ifadə oluna bilmir:
 *
 * 1. `partnershipEndDate >= officialSince` — tərs müddət məlumat xətasıdır.
 * 2. **«Rəsmi tərəfdaş» yalnız təsdiqlə birlikdə.** Redaktor `officialPartner`-i
 *    işarələyib `verified`-i unutsa, ictimai tərəfdə nişan onsuz da görünməzdi
 *    (`isOfficialPartnerVisible`) — nəticədə redaktor «işarələdim, amma görünmür»
 *    vəziyyətində qalardı. Forma bunu qəbul anında izah edir.
 */
export const partnerSchema = partnerBaseSchema.superRefine((value, ctx) => {
  if (
    value.officialSince &&
    value.partnershipEndDate &&
    value.partnershipEndDate.getTime() < value.officialSince.getTime()
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["partnershipEndDate"],
      message: "Bitmə tarixi başlama tarixindən əvvəl ola bilməz",
    });
  }

  if (value.officialPartner && !value.verified) {
    ctx.addIssue({
      code: "custom",
      path: ["verified"],
      message: "«Rəsmi tərəfdaş» nişanı yalnız təsdiqlənmiş tərəfdaşda göstərilir",
    });
  }

  if (value.showOnHomepage && !value.showPublicly) {
    ctx.addIssue({
      code: "custom",
      path: ["showOnHomepage"],
      message: "Ana səhifədə göstərmək üçün əvvəlcə «Saytda göstərilsin» seçilməlidir",
    });
  }
});

export type PartnerInput = z.infer<typeof partnerSchema>;

/** Müqavilə metadatası — ayrıca sxem, çünki ayrıca icazə ilə qorunur. */
export const partnerContractSchema = z
  .object({
    contractNumber: optionalText(80),
    contractStartDate: optionalDate,
    contractEndDate: optionalDate,
    contractDocument: optionalText(500),
    internalNotes: z.string().trim().max(4000).nullable(),
  })
  .superRefine((value, ctx) => {
    if (
      value.contractStartDate &&
      value.contractEndDate &&
      value.contractEndDate.getTime() < value.contractStartDate.getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["contractEndDate"],
        message: "Müqavilənin bitmə tarixi başlama tarixindən əvvəl ola bilməz",
      });
    }
  });

export type PartnerContractInput = z.infer<typeof partnerContractSchema>;

/** Elan/layihə ↔ tərəfdaş əlaqəsi. */
export const partnerRelationSchema = z.object({
  partnerId: cuid,
  role: enumOf(PARTNER_RELATION_ROLES),
  sourceUrl: externalUrl,
  isPublic: z.boolean(),
  isPrimary: z.boolean(),
});

export type PartnerRelationInput = z.infer<typeof partnerRelationSchema>;
