import { LOCATION_KINDS, MAX_PROPERTY_IMAGES, PROPERTY_STATUSES } from "@/lib/constants";
import { readPropertyForm } from "@/lib/admin/property-input";
import { propertyFieldsSchema } from "@/lib/admin/schemas";

/**
 * İctimai elan formasının sxemi.
 *
 * Status, müəllif, seçilmiş nişanı və SEO məlumatı yalnız panel tərəfindən
 * idarə olunur. Bu sahələri forma gövdəsindən çıxarmaq istifadəçinin onları
 * göndərsə belə, server qərarına təsir etməməsini təmin edir.
 */
export const publicPropertySchema = propertyFieldsSchema
  .omit({
    slug: true,
    status: true,
    projectId: true,
    isFeatured: true,
    featuredUntil: true,
    reservationEnabled: true,
    assignedAgentId: true,
    metaTitle: true,
    metaDescription: true,
    noIndex: true,
    canonicalUrl: true,
    ogTitle: true,
    ogDescription: true,
    ogImage: true,
  })
  .refine((data) => data.listingType !== "RENT" || data.pricePeriod !== null, {
    message: "Kirayə elanı üçün qiymət dövrü seçilməlidir",
    path: ["pricePeriod"],
  })
  .refine(
    (data) => data.floor === null || data.totalFloors === null || data.floor <= data.totalFloors,
    { message: "Mərtəbə binanın mərtəbə sayından çox ola bilməz", path: ["floor"] },
  );

export type PublicPropertyInput = typeof publicPropertySchema._output;

/** İctimai formanın icazəli sahələrini oxuyur. */
export function readPublicPropertyForm(formData: FormData): PublicPropertyInput {
  const input = { ...readPropertyForm(formData) } as Record<string, unknown>;
  const restrictedKeys = [
    "slug",
    "status",
    "projectId",
    "isFeatured",
    "featuredUntil",
    "reservationEnabled",
    "assignedAgentId",
    "metaTitle",
    "metaDescription",
    "noIndex",
    "canonicalUrl",
    "ogTitle",
    "ogDescription",
    "ogImage",
  ];
  for (const key of restrictedKeys) {
    delete input[key];
  }
  return input as PublicPropertyInput;
}

/** Hesab növü və agentlik təsdiqinə görə dəyişməz dərc siyasəti. */
export function submissionPolicy(accountType: string, agencyVerified: boolean, now = new Date()) {
  if (accountType === "AGENCY" && agencyVerified) {
    return { status: PROPERTY_STATUSES.PUBLISHED, publishedAt: now };
  }

  return { status: PROPERTY_STATUSES.PENDING, publishedAt: null };
}

/** Public action üçün admin sahələrini server tərəfdə dəyişməz təyin edir. */
export function buildPublicPropertyData(
  input: PublicPropertyInput,
  identity: { userId: string },
) {
  return {
    ...input,
    slug: "",
    // Əlaqələr yazılarkən hər elan ictimai deyil; dərc yalnız sonrakı addımdadır.
    status: PROPERTY_STATUSES.PENDING,
    projectId: null,
    isFeatured: false,
    featuredUntil: null,
    reservationEnabled: false,
    assignedAgentId: null,
    metaTitle: null,
    metaDescription: null,
    noIndex: false,
    canonicalUrl: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    authorId: identity.userId,
    isDemo: false,
    publishedAt: null,
  };
}

/** Hər göndərilən media URL-nin cari hesabın adına yazıldığını yoxlayır. */
export function hasExclusiveMediaOwnership(submittedUrls: string[], ownedUrls: string[]): boolean {
  const owned = new Set(ownedUrls);
  return submittedUrls.every((url) => owned.has(url));
}

type PropertyWriter<TData> = {
  createProperty(data: TData): Promise<{ id: string }>;
  createRelations(propertyId: string): Promise<void>;
  finalizeProperty?(propertyId: string): Promise<void>;
  deleteProperty(propertyId: string): Promise<void>;
};

/**
 * D1 transaction dəstəkləmədiyi üçün əlaqələr uğursuz olarsa əsas Property sətrini
 * kompensasiya olaraq silir. Bu, yarımçıq ictimai elanın kabinetdə qalmasının qarşısını alır.
 */
export async function createPropertyWithRelations<TData>(
  writer: PropertyWriter<TData>,
  data: TData,
  shouldFinalize = false,
): Promise<{ id: string }> {
  const property = await writer.createProperty(data);
  try {
    await writer.createRelations(property.id);
    if (shouldFinalize) {
      if (!writer.finalizeProperty) throw new Error("Elanın dərc addımı tapılmadı.");
      await writer.finalizeProperty(property.id);
    }
  } catch (error) {
    await writer.deleteProperty(property.id).catch(() => undefined);
    throw error;
  }
  return property;
}

export function hasAllowedPropertyImageCount(count: number): boolean {
  return count <= MAX_PROPERTY_IMAGES;
}

const PUBLIC_DISTRICT_KINDS = [
  LOCATION_KINDS.DISTRICT,
  LOCATION_KINDS.SETTLEMENT,
  LOCATION_KINDS.METRO,
] as const;

type PublicPropertyRelationStore = {
  findType(id: string): Promise<{ isActive: boolean } | null>;
  findLocation(id: string): Promise<{ kind: string; parentId: string | null } | null>;
  countFeatures(ids: string[]): Promise<number>;
};

/** İctimai forma üçün saxtalaşdırılmış və passiv taksonomiya ID-lərini rədd edir. */
export async function validatePublicPropertyRelations(
  store: PublicPropertyRelationStore,
  input: { typeId: string; cityId: string; districtId: string | null; featureIds: string[] },
): Promise<Record<string, string> | null> {
  const errors: Record<string, string> = {};
  const [type, city, district, featureCount] = await Promise.all([
    store.findType(input.typeId),
    store.findLocation(input.cityId),
    input.districtId ? store.findLocation(input.districtId) : null,
    store.countFeatures(input.featureIds),
  ]);

  if (!type?.isActive) errors.typeId = "Əmlak növü seçilməyib";
  if (!city || city.kind !== LOCATION_KINDS.CITY) errors.cityId = "Şəhər seçilməyib";
  if (input.districtId && !district) errors.districtId = "Rayon tapılmadı";
  if (district && !PUBLIC_DISTRICT_KINDS.includes(district.kind as never)) {
    errors.districtId = "Seçilmiş rayon düzgün deyil";
  }
  if (district && district.parentId !== input.cityId) {
    errors.districtId = "Seçilmiş rayon bu şəhərə aid deyil";
  }
  if (featureCount !== input.featureIds.length) {
    errors.featureIds = "Seçilmiş xüsusiyyətlərdən biri tapılmadı";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
