"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { parseImages } from "@/lib/admin/images";
import { propertyData, propertyLifecycleData } from "@/lib/admin/property-input";
import { paymentFlagsFromFeatures } from "@/lib/admin/payment-features";
import {
  hasAllowedPropertyImageCount,
  hasExclusiveMediaOwnership,
  isListingMediaUrl,
  publicPropertySchema,
  readPublicPropertyForm,
  submissionPolicy,
  validatePublicPropertyRelations,
} from "@/lib/accounts/property-submission";
import {
  ACCOUNT_TYPES,
  AGENCY_ACTIVITY_ACTIONS,
  ACTIVE_OFFER_STATUSES,
  LISTING_TYPES,
  MAX_PROPERTY_IMAGES,
  APPEAL_MESSAGE_MAX,
  APPEAL_MESSAGE_MIN,
  MODERATION_HOLD_STATUSES,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_SOURCES,
  type Locale,
} from "@/lib/constants";
import { recordPropertyStatusChange } from "@/lib/property-status-history";
import { getListingExpiryConfig } from "@/lib/settings";
import { submitListingAppeal } from "@/lib/listing-appeals";
import { localizePath } from "@/i18n/path-locale";
import { prisma } from "@/lib/prisma";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { recordPropertyPriceChange } from "@/lib/price-drop";
import { queuePropertyVectorSync } from "@/lib/semantic-search";
import { refreshListingRisk } from "@/lib/moderation/listing-risk";
import { queueListingEnrichment } from "@/lib/listing-enrichment";
import { publicationExpiryReset, renewedExpiry } from "@/lib/listing-expiry-policy";
import { recordDomainEvent } from "@/lib/admin/events";
import { recordAgencyActivity } from "@/lib/accounts/agency-activity";
import { notSuspendedAgencyListing } from "@/lib/accounts/agency-access";
import { propertyRetentionDays } from "@/lib/property-publish-validation";

const LIST_PATH = "/kabinet/elanlar";

async function ownerAndGuard(id: string, locale: Locale) {
  const user = await requirePublicAction("property", locale);
  const property = await prisma.property.findFirst({
    where: { id, authorId: user.id, deletedAt: null, ...notSuspendedAgencyListing(user.id) },
    select: {
      id: true,
      slug: true,
      title: true,
      agencyId: true,
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
      status: true,
      listingType: true,
      publishedAt: true,
      closedAt: true,
      listingExpiresAt: true,
      expiredAt: true,
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
      // `parent.parentId` Bakı qəsəbələri üçün şəhəri verir — onlar rayonun
      // uşağıdır, ona görə tək səviyyəli yoxlama onları səhvən rədd edərdi.
      findLocation: (id) =>
        prisma.location.findUnique({
          where: { id },
          select: { kind: true, parentId: true, parent: { select: { parentId: true } } },
        }),
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
  const allowedUrls = [...media.map((item) => item.url).filter(isListingMediaUrl), ...property.images.map((item) => item.url)];
  if (!hasExclusiveMediaOwnership(images.map((image) => image.url), allowedUrls)) {
    return failure(t("actions.imageOwnership"));
  }

  const agency = user.accountType === ACCOUNT_TYPES.AGENCY
    ? await prisma.agency.findUnique({ where: { userId: user.id }, select: { isVerified: true } })
    : null;
  const policy = submissionPolicy(user.accountType, agency?.isVerified ?? false);
  // Moderatorun saxladığı elan (dayandırılıb, rədd edilib, düzəliş tələb olunub) redaktədən sonra
  // həmişə yenidən yoxlamaya gedir — təsdiqlənmiş agentlik onu birbaşa dərc edə bilməz (#202).
  const nextStatus = (MODERATION_HOLD_STATUSES as readonly string[]).includes(property.status)
    ? PROPERTY_STATUSES.PENDING
    : policy.status;

  const paymentFlags = await paymentFlagsFromFeatures(parsed.data.featureIds);
  const { lifetimeDays } = await getListingExpiryConfig();

  try {
    await prisma.property.update({
      where: { id: property.id },
      data: {
        ...propertyData({
          ...parsed.data,
          slug: property.slug,
          status: nextStatus,
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
        }, paymentFlags),
        status: nextStatus,
        moderationNote: null,
        publishedAt: nextStatus === PROPERTY_STATUSES.PUBLISHED
          ? (property.publishedAt ?? policy.publishedAt)
          : property.publishedAt,
        ...(nextStatus === PROPERTY_STATUSES.PUBLISHED ? publicationExpiryReset(property, new Date(), lifetimeDays) : {}),
      },
    });

    // Status yazılan kimi tarixçəyə düşür (#204) — sonrakı əlaqə yazılışları alınmasa da keçid itməsin.
    await recordPropertyStatusChange({
      propertyId: property.id, from: property.status, to: nextStatus, source: PROPERTY_STATUS_SOURCES.OWNER, changedById: user.id,
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
  // Agentlik jurnalı (#214): redaktə və qiymət dəyişikliyi ayrıca görünür.
  const activity = { agencyId: property.agencyId, actor: user, entityType: "Property" as const, entityId: property.id, entityLabel: parsed.data.title };
  await recordAgencyActivity({ ...activity, action: AGENCY_ACTIVITY_ACTIONS.LISTING_UPDATED });
  if (property.price !== parsed.data.price) {
    await recordAgencyActivity({
      ...activity,
      action: AGENCY_ACTIVITY_ACTIONS.PRICE_CHANGED,
      details: { from: property.price, to: parsed.data.price, currency: property.currency },
    });
  }

  // Avtomatik moderasiya (#159): redaktədən sonra risk yenidən hesablanır; dərc olunmuş
  // elan yüksək riskə düşərsə yenidən moderatora gedir.
  const risk = await refreshListingRisk(id);
  const heldForReview = nextStatus === PROPERTY_STATUSES.PUBLISHED && risk.level === "hold";
  if (heldForReview) {
    // Saxlama səssizcə udulmur: alınmasa elan dərcdə qalardı, istifadəçi xəta görüb təkrar göndərir.
    try {
      await prisma.property.update({ where: { id }, data: { status: PROPERTY_STATUSES.PENDING } });
    } catch (error) {
      return unexpected("riskli elan moderasiyaya göndərilmədi", error, t("actions.unexpected"));
    }
    await recordPropertyStatusChange({
      propertyId: id, from: nextStatus, to: PROPERTY_STATUSES.PENDING, source: PROPERTY_STATUS_SOURCES.SYSTEM,
      note: "Avtomatik moderasiya: yüksək risk",
    });
  }
  queuePropertyVectorSync([id]);
  queueListingEnrichment(id);
  revalidatePath(localizePath(LIST_PATH, locale));
  revalidatePath(localizePath(`${LIST_PATH}/${id}`, locale));
  revalidatePublicContent("property");
  return success(
    heldForReview || nextStatus === PROPERTY_STATUSES.PENDING ? t("listings.heldForReview") : t("actions.propertyUpdated"),
  );
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
    await recordPropertyStatusChange({
      propertyId: guarded.property.id, from: guarded.property.status, to: PROPERTY_STATUSES.ARCHIVED,
      source: PROPERTY_STATUS_SOURCES.OWNER, changedById: guarded.user.id, note: "Sahib elanı sildi",
    });
  } catch (error) {
    return unexpected("istifadəçi elanı silinmədi", error, t("actions.unexpected"));
  }
  await recordAgencyActivity({
    agencyId: guarded.property.agencyId, actor: guarded.user, action: AGENCY_ACTIVITY_ACTIONS.LISTING_DELETED,
    entityType: "Property", entityId: guarded.property.id, entityLabel: guarded.property.title,
  });

  queuePropertyVectorSync([id]);
  revalidatePath(localizePath(LIST_PATH, locale));
  revalidatePublicContent("property");
  return success(t("actions.propertyDeleted"));
}

/**
 * Elanın müddətini yeniləyir (#109). Müddəti bitib arxivlənmiş elan yenidən dərc olunur —
 * məzmun dəyişmədiyi üçün təkrar moderasiya tələb olunmur; redaktə edilən elan isə
 * adi yeniləmə axınından keçir.
 */
export async function renewPublicProperty(id: string): Promise<ActionState> {
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
    const current = await prisma.property.findUnique({ where: { id }, select: { status: true, expiredAt: true } });
    const canRenew = current?.status === PROPERTY_STATUSES.PUBLISHED
      || current?.status === PROPERTY_STATUSES.EXPIRED;
    if (!canRenew) return failure(t("listings.renewUnavailable"));
    await prisma.property.update({
      where: { id },
      data: {
        status: PROPERTY_STATUSES.PUBLISHED,
        listingExpiresAt: renewedExpiry(new Date(), (await getListingExpiryConfig()).lifetimeDays),
        expiryReminderSentAt: null,
        expiredAt: null,
      },
    });
    await recordPropertyStatusChange({
      propertyId: id, from: current?.status ?? null, to: PROPERTY_STATUSES.PUBLISHED, source: PROPERTY_STATUS_SOURCES.OWNER, changedById: guarded.user.id,
    });
    await recordDomainEvent("property.renewed", "Property", id, { by: guarded.user.id });
  } catch (error) {
    return unexpected("elan yenilənmədi", error, t("actions.unexpected"));
  }
  await recordAgencyActivity({
    agencyId: guarded.property.agencyId, actor: guarded.user, action: AGENCY_ACTIVITY_ACTIONS.LISTING_RENEWED,
    entityType: "Property", entityId: id, entityLabel: guarded.property.title,
  });

  queuePropertyVectorSync([id]);
  revalidatePath(localizePath(LIST_PATH, locale));
  revalidatePublicContent("property", guarded.property.slug);
  return success(t("listings.renewed"));
}

/**
 * «Satıldı» / «Kirayəyə verildi» (#202, PRD 5.3): yalnız dərcdə olan və ya beh alınmış elan
 * bağlanır. Elan ictimai qalır (statistika və «Uğurlu sövdələşmələr»), amma aktiv axtarışdan çıxır
 * və müraciət qəbul etmir (`resolveLeadProperty().closed`). Status elan tipindən gəlir.
 */
export async function closePublicProperty(id: string): Promise<ActionState> {
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

  const status = property.listingType === LISTING_TYPES.RENT ? PROPERTY_STATUSES.RENTED : PROPERTY_STATUSES.SOLD;
  try {
    // Şərti yazılış: arada moderator elanı dayandırıbsa, sahib onu «satıldı» ilə yenidən ictimai edə bilməz.
    const { count } = await prisma.property.updateMany({
      where: { id: property.id, authorId: user.id, deletedAt: null, status: { in: [...ACTIVE_OFFER_STATUSES] }, ...notSuspendedAgencyListing(user.id) },
      data: { status, ...propertyLifecycleData(status, property, await propertyRetentionDays()) },
    });
    if (count === 0) return failure(t("listings.closeUnavailable"));
    await recordPropertyStatusChange({
      propertyId: property.id, from: property.status, to: status, source: PROPERTY_STATUS_SOURCES.OWNER, changedById: user.id,
    });
    await recordDomainEvent("property.status_changed", "Property", property.id, { status, by: user.id });
  } catch (error) {
    return unexpected("elan bağlanmadı", error, t("actions.unexpected"));
  }
  await recordAgencyActivity({
    agencyId: property.agencyId, actor: user, action: AGENCY_ACTIVITY_ACTIONS.LISTING_CLOSED,
    entityType: "Property", entityId: property.id, entityLabel: property.title, details: { status },
  });

  queuePropertyVectorSync([property.id]);
  revalidatePath(localizePath(LIST_PATH, locale));
  revalidatePublicContent("property", property.slug);
  return success(status === PROPERTY_STATUSES.RENTED ? t("listings.markedRented") : t("listings.markedSold"));
}

/**
 * Moderasiya qərarına etiraz (#206, PRD 20.4): yalnız sahibin öz rədd edilmiş/dayandırılmış elanı,
 * elan başına bir açıq etiraz. Etirazı qərarı verən moderatordan başqa şəxs həll edir.
 */
export async function submitPropertyAppeal(id: string, message: string): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let user;
  try {
    user = await requirePublicAction("property", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(t("actions.actionUnavailable"));
    throw error;
  }
  // Abzaslar saxlanılır — etiraz uzun izah ola bilər; yalnız sətirdaxili boşluqlar sıxılır.
  const text = typeof message === "string" ? message.trim().replace(/[ \t]+/g, " ") : "";
  if (text.length < APPEAL_MESSAGE_MIN || text.length > APPEAL_MESSAGE_MAX) {
    return failure(t("listings.appeal.length", { min: APPEAL_MESSAGE_MIN, max: APPEAL_MESSAGE_MAX }));
  }
  try {
    const result = await submitListingAppeal({ propertyId: String(id).slice(0, 40), userId: user.id, message: text });
    if (result === "notAllowed") return failure(t("listings.appeal.notAllowed"));
    if (result === "duplicate") return failure(t("listings.appeal.duplicate"));
  } catch (error) {
    return unexpected("etiraz göndərilmədi", error, t("actions.unexpected"));
  }
  revalidatePath(localizePath(LIST_PATH, locale));
  revalidatePath("/admin/etirazlar");
  return success(t("listings.appeal.sent"));
}

