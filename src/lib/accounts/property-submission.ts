import { PROPERTY_STATUSES } from "@/lib/constants";
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
    metaTitle: true,
    metaDescription: true,
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
    "metaTitle",
    "metaDescription",
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
  identity: {
    userId: string;
    accountType: string;
    agencyVerified: boolean;
    now?: Date;
  },
) {
  const policy = submissionPolicy(identity.accountType, identity.agencyVerified, identity.now);
  return {
    ...input,
    slug: "",
    status: policy.status,
    projectId: null,
    isFeatured: false,
    metaTitle: null,
    metaDescription: null,
    authorId: identity.userId,
    isDemo: false,
    publishedAt: policy.publishedAt,
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
  deleteProperty(propertyId: string): Promise<void>;
};

/**
 * D1 transaction dəstəkləmədiyi üçün əlaqələr uğursuz olarsa əsas Property sətrini
 * kompensasiya olaraq silir. Bu, yarımçıq ictimai elanın kabinetdə qalmasının qarşısını alır.
 */
export async function createPropertyWithRelations<TData>(
  writer: PropertyWriter<TData>,
  data: TData,
): Promise<{ id: string }> {
  const property = await writer.createProperty(data);
  try {
    await writer.createRelations(property.id);
  } catch (error) {
    await writer.deleteProperty(property.id).catch(() => undefined);
    throw error;
  }
  return property;
}
