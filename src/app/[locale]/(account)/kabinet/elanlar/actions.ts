"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { parseImages } from "@/lib/admin/images";
import { propertyData } from "@/lib/admin/property-input";
import {
  hasAllowedPropertyImageCount,
  hasExclusiveMediaOwnership,
  publicPropertySchema,
  readPublicPropertyForm,
  submissionPolicy,
  validatePublicPropertyRelations,
} from "@/lib/accounts/property-submission";
import { ACCOUNT_TYPES, MAX_PROPERTY_IMAGES, PROPERTY_STATUSES, type Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
import { prisma } from "@/lib/prisma";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { recordPropertyPriceChange } from "@/lib/price-drop";

const LIST_PATH = "/kabinet/elanlar";

async function ownerAndGuard(id: string, locale: Locale) {
  const user = await requirePublicAction("property", locale);
  const property = await prisma.property.findFirst({
    where: { id, authorId: user.id, deletedAt: null },
    select: {
      id: true,
      slug: true,
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
      publishedAt: true,
      price: true,
      currency: true,
      images: { select: { url: true } },
    },
  });
  return { user, property };
}

async function validateRelations(input: Parameters<typeof validatePublicPropertyRelations>[1]) {
  return validatePublicPropertyRelations(
    {
      findType: (id) => prisma.propertyType.findUnique({ where: { id }, select: { isActive: true } }),
      findLocation: (id) => prisma.location.findUnique({ where: { id }, select: { kind: true, parentId: true } }),
      countFeatures: (ids) => prisma.feature.count({ where: { id: { in: ids } } }),
    },
    input,
  );
}

export async function updatePublicProperty(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let guarded;
  try {
    guarded = await ownerAndGuard(id, locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(t("actions.actionUnavailable"));
    throw error;
  }
  const { user, property } = guarded;
  if (!property) return failure(t("actions.propertyNotFound"));

  const parsed = publicPropertySchema.safeParse(readPublicPropertyForm(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = t("actions.invalidField");
    }
    return failure(t("actions.invalidForm"), fieldErrors);
  }

  const relationErrors = await validateRelations(parsed.data);
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
  const media = await prisma.media.findMany({
    where: { uploaderId: user.id, url: { in: images.map((image) => image.url) } },
    select: { url: true },
  });
  const allowedUrls = [...media.map((item) => item.url), ...property.images.map((item) => item.url)];
  if (!hasExclusiveMediaOwnership(images.map((image) => image.url), allowedUrls)) {
    return failure(t("actions.imageOwnership"));
  }

  const agency = user.accountType === ACCOUNT_TYPES.AGENCY
    ? await prisma.agency.findUnique({ where: { userId: user.id }, select: { isVerified: true } })
    : null;
  const policy = submissionPolicy(user.accountType, agency?.isVerified ?? false);

  try {
    await prisma.property.update({
      where: { id: property.id },
      data: {
        ...propertyData({
          ...parsed.data,
          slug: property.slug,
          status: policy.status,
          projectId: property.projectId,
          isFeatured: property.isFeatured,
          featuredUntil: property.featuredUntil,
          reservationEnabled: property.reservationEnabled,
          assignedAgentId: property.assignedAgentId,
          metaTitle: property.metaTitle,
          metaDescription: property.metaDescription,
          noIndex: property.noIndex,
          canonicalUrl: property.canonicalUrl,
          ogTitle: property.ogTitle,
          ogDescription: property.ogDescription,
          ogImage: property.ogImage,
        }),
        status: policy.status,
        moderationNote: null,
        publishedAt: policy.status === PROPERTY_STATUSES.PUBLISHED
          ? (property.publishedAt ?? policy.publishedAt)
          : property.publishedAt,
      },
    });

    await recordPropertyPriceChange({
      propertyId: property.id,
      oldPrice: property.price,
      newPrice: parsed.data.price,
      currency: property.currency,
      changedById: user.id,
      source: "OWNER",
    });

    await prisma.propertyFeature.deleteMany({ where: { propertyId: property.id } });
    for (const featureId of parsed.data.featureIds) {
      await prisma.propertyFeature.create({ data: { propertyId: property.id, featureId } });
    }
    await prisma.propertyImage.deleteMany({ where: { propertyId: property.id } });
    for (const [order, image] of images.entries()) {
      await prisma.propertyImage.create({
        data: { propertyId: property.id, url: image.url, alt: image.alt, isCover: image.isCover, order },
      });
    }
  } catch (error) {
    return unexpected("istifadəçi elanı yenilənmədi", error, t("actions.unexpected"));
  }

  revalidatePath(localizePath(LIST_PATH, locale));
  revalidatePath(localizePath(`${LIST_PATH}/${id}`, locale));
  revalidatePublicContent("property");
  return success(t("actions.propertyUpdated"));
}

export async function deletePublicProperty(id: string): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let guarded;
  try {
    guarded = await ownerAndGuard(id, locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(t("actions.actionUnavailable"));
    throw error;
  }
  if (!guarded.property) return failure(t("actions.propertyNotFound"));

  try {
    await prisma.property.update({
      where: { id: guarded.property.id },
      data: { deletedAt: new Date(), status: PROPERTY_STATUSES.ARCHIVED },
    });
  } catch (error) {
    return unexpected("istifadəçi elanı silinmədi", error, t("actions.unexpected"));
  }

  revalidatePath(localizePath(LIST_PATH, locale));
  revalidatePublicContent("property");
  return success(t("actions.propertyDeleted"));
}
