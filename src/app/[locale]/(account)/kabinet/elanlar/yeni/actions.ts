"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { type ActionState, failure, unexpected } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { parseImages } from "@/lib/admin/images";
import { propertyData } from "@/lib/admin/property-input";
import { uniqueSlug } from "@/lib/admin/slug";
import {
  buildPublicPropertyData,
  createPropertyWithRelations,
  hasAllowedPropertyImageCount,
  hasExclusiveMediaOwnership,
  publicPropertySchema,
  readPublicPropertyForm,
  submissionPolicy,
  validatePublicPropertyRelations,
} from "@/lib/accounts/property-submission";
import { ACCOUNT_TYPES, MAX_PROPERTY_IMAGES, PROPERTY_STATUSES, type Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { localizePath } from "@/i18n/path-locale";

const LIST_PATH = "/kabinet/elanlar";

async function ownsImages(userId: string, urls: string[]): Promise<boolean> {
  if (urls.length === 0) return true;

  const owned = await prisma.media.findMany({
    where: { uploaderId: userId, url: { in: urls } },
    select: { url: true },
  });
  return hasExclusiveMediaOwnership(
    urls,
    owned.map((media) => media.url),
  );
}

async function createRelations(
  propertyId: string,
  featureIds: string[],
  images: { url: string; alt: string; isCover: boolean }[],
) {
  for (const featureId of featureIds) {
    await prisma.propertyFeature.create({ data: { propertyId, featureId } });
  }

  for (const [order, image] of images.entries()) {
    await prisma.propertyImage.create({
      data: { propertyId, url: image.url, alt: image.alt, order, isCover: image.isCover },
    });
  }
}

/** İctimai hesabın elan göndərməsi — panel səlahiyyətlərini qəbul etmir. */
export async function createPublicProperty(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let user;
  try {
    user = await requirePublicAction("property", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(t("actions.actionUnavailable"));
    throw error;
  }
  const parsed = publicPropertySchema.safeParse(readPublicPropertyForm(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = t("actions.invalidField");
    }
    return failure(t("actions.invalidForm"), fieldErrors);
  }

  const relationErrors = await validatePublicPropertyRelations(
    {
      findType: (id) =>
        prisma.propertyType.findUnique({ where: { id }, select: { isActive: true } }),
      findLocation: (id) =>
        prisma.location.findUnique({ where: { id }, select: { kind: true, parentId: true } }),
      countFeatures: (ids) => prisma.feature.count({ where: { id: { in: ids } } }),
    },
    parsed.data,
  );
  if (relationErrors) {
    return failure(
      t("actions.taxonomyInvalid"),
      Object.fromEntries(Object.keys(relationErrors).map((key) => [key, t("actions.invalidField")])),
    );
  }

  const images = parseImages(formData, "images");
  if (!hasAllowedPropertyImageCount(images.length)) {
    return failure(t("actions.tooManyImages", { count: MAX_PROPERTY_IMAGES }), {
      images: t("actions.tooManyImagesField", { count: MAX_PROPERTY_IMAGES }),
    });
  }
  if (!(await ownsImages(user.id, images.map((image) => image.url)))) {
    return failure(t("actions.imageOwnership"));
  }

  const agency =
    user.accountType === ACCOUNT_TYPES.AGENCY
      ? await prisma.agency.findUnique({ where: { userId: user.id }, select: { isVerified: true } })
      : null;
  const finalPolicy = submissionPolicy(user.accountType, agency?.isVerified ?? false);
  try {
    const slug = await uniqueSlug(parsed.data.title, (candidate) =>
      prisma.property.findUnique({ where: { slug: candidate }, select: { id: true } }),
    );
    const data = {
      ...buildPublicPropertyData(parsed.data, {
        userId: user.id,
      }),
      slug,
    };

    await createPropertyWithRelations(
      {
        createProperty: (propertyInput) =>
          prisma.property.create({
            data: {
              ...propertyData(propertyInput),
              slug: propertyInput.slug,
              authorId: propertyInput.authorId,
              isDemo: propertyInput.isDemo,
              publishedAt: propertyInput.publishedAt,
            },
            select: { id: true },
          }),
        createRelations: (propertyId) => createRelations(propertyId, parsed.data.featureIds, images),
        finalizeProperty: async (propertyId) => {
          await prisma.property.update({
            where: { id: propertyId },
            data: {
              status: PROPERTY_STATUSES.PUBLISHED,
              publishedAt: finalPolicy.publishedAt,
            },
          });
        },
        deleteProperty: async (propertyId) => {
          await prisma.property.delete({ where: { id: propertyId } });
        },
      },
      data,
      finalPolicy.status === PROPERTY_STATUSES.PUBLISHED,
    );
  } catch (error) {
    // Şəkil yükləmələri qəsdən silinmir: istifadəçi formadakı xətanı düzəldib yenidən göndərə bilər.
    return unexpected("elan göndərilə bilmədi", error, t("actions.unexpected"));
  }

  revalidatePath(localizePath("/kabinet", locale));
  revalidatePath(localizePath(LIST_PATH, locale));
  revalidatePublicContent("property");
  redirect(localizePath(`${LIST_PATH}?yeni=1`, locale));
}
