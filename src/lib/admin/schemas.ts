import { z } from "zod";
import {
  BUILDING_TYPES,
  CURRENCIES,
  DOCUMENT_STATUSES,
  LEAD_STATUSES,
  LISTING_TYPES,
  POST_STATUSES,
  PRICE_PERIODS,
  PROJECT_STATUSES,
  PROJECT_TYPES,
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
    mortgageAvailable: z.boolean(),
    installmentAvailable: z.boolean(),
    isFeatured: z.boolean(),

    metaTitle: optionalText(70),
    metaDescription: optionalText(180),

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
