"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/admin/audit";
import { failure, invalid, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";
import { LOCALES, NEARBY_PLACE_CATEGORIES, PERMISSIONS, PREMIUM_DURATIONS_DAYS, type Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
import { prisma } from "@/lib/prisma";
import { revalidatePublicContent } from "@/lib/revalidate-public";

function numberValue(formData: FormData, name: string) {
  return form.number(formData, name);
}

/**
 * İctimai marşrutlar `/[locale]/...` altındadır, ona görə prefiksiz `revalidatePath`
 * heç bir səhifəyə dəymir. Rayon analitikası dəyişəndə hər üç dilin səhifəsi
 * təzələnməlidir.
 */
function revalidateDistrictPage(slug: string) {
  for (const locale of Object.values(LOCALES)) {
    revalidatePath(localizePath(`/rayon/${slug}`, locale as Locale));
  }
}

const nearbySchema = z.object({
  propertyId: z.string().min(1),
  category: z.enum(Object.values(NEARBY_PLACE_CATEGORIES)),
  name: z.string().trim().min(2).max(160),
  distanceMeters: z.number().int().min(0).max(100000).nullable(),
  walkingMinutes: z.number().int().min(0).max(1440).nullable(),
  source: z.string().trim().max(300).optional(),
});

export async function createNearbyPlace(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try { actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE); }
  catch (error) { if (error instanceof AdminGuardError) return failure(error.message); throw error; }
  const parsed = nearbySchema.safeParse({
    propertyId: form.text(formData, "propertyId"), category: form.text(formData, "category"), name: form.text(formData, "name"),
    distanceMeters: form.integer(formData, "distanceMeters"), walkingMinutes: form.integer(formData, "walkingMinutes"), source: form.text(formData, "source"),
  });
  if (!parsed.success) return invalid(parsed.error);
  try {
    await prisma.nearbyPlace.create({ data: { ...parsed.data, source: parsed.data.source || null } });
    const property = await prisma.property.findUnique({
      where: { id: parsed.data.propertyId },
      select: { slug: true },
    });
    await recordAudit(actor, "CREATE", "Property", parsed.data.propertyId, `Yaxın obyekt: ${parsed.data.name}`);
    revalidatePath("/admin/ictimai-imkanlar");
    // Əmlak detalı `getCachedPropertyBySlug` (unstable_cache) üzərindən oxunur, ona görə
    // yalnız `revalidatePath` kifayət etmir — teq təmizlənməsə dəyişiklik səhifədə
    // görünmür. `revalidatePublicContent` teqi və hər üç dilin yolunu birlikdə örtür.
    if (property) revalidatePublicContent("property", property.slug);
    return success("Yaxın obyekt əlavə edildi.");
  } catch (error) { return unexpected("yaxın obyekt yaradılmadı", error); }
}

const neighborhoodSchema = z.object({
  locationId: z.string().min(1),
  description: z.string().trim().max(3000).optional(), descriptionEn: z.string().trim().max(3000).optional(), descriptionRu: z.string().trim().max(3000).optional(),
  averagePrice: z.number().min(0).nullable(), medianPrice: z.number().min(0).nullable(), averagePricePerSqm: z.number().min(0).nullable(),
  annualChangePercent: z.number().min(-100).max(1000).nullable(), saleRentRatio: z.number().min(0).max(10000).nullable(),
  averageRent: z.number().min(0).nullable(), rentalYieldPercent: z.number().min(-100).max(1000).nullable(),
  dataSource: z.string().trim().max(500).optional(), measuredAt: z.date().nullable(),
});

export async function upsertNeighborhoodProfile(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try { actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE); }
  catch (error) { if (error instanceof AdminGuardError) return failure(error.message); throw error; }
  const parsed = neighborhoodSchema.safeParse({
    locationId: form.text(formData, "locationId"), description: form.text(formData, "description"), descriptionEn: form.text(formData, "descriptionEn"), descriptionRu: form.text(formData, "descriptionRu"),
    averagePrice: numberValue(formData, "averagePrice"), medianPrice: numberValue(formData, "medianPrice"), averagePricePerSqm: numberValue(formData, "averagePricePerSqm"),
    annualChangePercent: numberValue(formData, "annualChangePercent"), saleRentRatio: numberValue(formData, "saleRentRatio"),
    averageRent: numberValue(formData, "averageRent"), rentalYieldPercent: numberValue(formData, "rentalYieldPercent"), dataSource: form.text(formData, "dataSource"), measuredAt: form.date(formData, "measuredAt"),
  });
  if (!parsed.success) return invalid(parsed.error);
  try {
    const data = { ...parsed.data, description: parsed.data.description || null, descriptionEn: parsed.data.descriptionEn || null, descriptionRu: parsed.data.descriptionRu || null, dataSource: parsed.data.dataSource || null };
    await prisma.neighborhoodProfile.upsert({ where: { locationId: parsed.data.locationId }, create: data, update: data });
    const location = await prisma.location.findUnique({
      where: { id: parsed.data.locationId },
      select: { name: true, slug: true },
    });
    await recordAudit(actor, "UPDATE", "Property", null, `Rayon analitikası yeniləndi: ${location?.name ?? parsed.data.locationId}`);
    revalidatePath("/admin/ictimai-imkanlar");
    if (location) revalidateDistrictPage(location.slug);
    // Analitika əmlak detalında da göstərilir və orada keşli sorğudan gəlir.
    revalidatePublicContent("property");
    return success("Rayon analitikası yadda saxlanıldı.");
  } catch (error) { return unexpected("rayon analitikası yenilənmədi", error); }
}

const premiumSchema = z.object({ propertyId: z.string().min(1), durationDays: z.coerce.number().refine((value) => (PREMIUM_DURATIONS_DAYS as readonly number[]).includes(value)) });

export async function activatePremiumListing(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try { actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE); }
  catch (error) { if (error instanceof AdminGuardError) return failure(error.message); throw error; }
  const parsed = premiumSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  try {
    const featuredUntil = new Date(Date.now() + parsed.data.durationDays * 24 * 60 * 60 * 1000);
    const property = await prisma.property.update({ where: { id: parsed.data.propertyId }, data: { isFeatured: true, featuredUntil }, select: { title: true, slug: true } });
    await recordAudit(actor, "UPDATE", "Property", parsed.data.propertyId, `${property.title} — ${parsed.data.durationDays} günlük premium`);
    revalidatePath("/admin/ictimai-imkanlar");
    revalidatePublicContent("property", property.slug);
    return success(`Elan ${parsed.data.durationDays} gün premium edildi.`);
  } catch (error) { return unexpected("premium elan aktiv edilmədi", error); }
}

/**
 * Yaxın obyekti silir.
 *
 * Modul əvvəl yalnız yaratma axını verirdi: səhv yazılmış obyekt əmlak səhifəsində
 * qalır və panel vasitəsilə götürülə bilmirdi — mənbəli məlumat vədi ilə ziddiyyət
 * təşkil edirdi.
 */
export async function deleteNearbyPlace(id: string): Promise<ActionState> {
  let actor;
  try { actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE); }
  catch (error) { if (error instanceof AdminGuardError) return failure(error.message); throw error; }
  try {
    const place = await prisma.nearbyPlace.findUnique({
      where: { id },
      select: { name: true, propertyId: true, property: { select: { slug: true } } },
    });
    if (!place) return failure("Yaxın obyekt tapılmadı.");
    await prisma.nearbyPlace.delete({ where: { id } });
    await recordAudit(actor, "DELETE", "Property", place.propertyId, `Yaxın obyekt silindi: ${place.name}`);
    revalidatePath("/admin/ictimai-imkanlar");
    revalidatePublicContent("property", place.property.slug);
    return success("Yaxın obyekt silindi.");
  } catch (error) { return unexpected("yaxın obyekt silinmədi", error); }
}

/** Rayon analitikasını tamamilə götürür — ictimai səhifədə bölmə yox olur. */
export async function deleteNeighborhoodProfile(id: string): Promise<ActionState> {
  let actor;
  try { actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE); }
  catch (error) { if (error instanceof AdminGuardError) return failure(error.message); throw error; }
  try {
    const profile = await prisma.neighborhoodProfile.findUnique({
      where: { id },
      select: { location: { select: { name: true, slug: true } } },
    });
    if (!profile) return failure("Rayon analitikası tapılmadı.");
    await prisma.neighborhoodProfile.delete({ where: { id } });
    await recordAudit(actor, "DELETE", "Property", null, `Rayon analitikası silindi: ${profile.location.name}`);
    revalidatePath("/admin/ictimai-imkanlar");
    revalidateDistrictPage(profile.location.slug);
    revalidatePublicContent("property");
    return success("Rayon analitikası silindi.");
  } catch (error) { return unexpected("rayon analitikası silinmədi", error); }
}

/**
 * Premium statusu vaxtından əvvəl bitirir.
 *
 * `featuredUntil` də sıfırlanır: yalnız `isFeatured` söndürülsəydi, gündəlik
 * maintenance işi qeydi «müddəti bitmiş premium» kimi saymağa davam edərdi.
 */
export async function cancelPremiumListing(id: string): Promise<ActionState> {
  let actor;
  try { actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE); }
  catch (error) { if (error instanceof AdminGuardError) return failure(error.message); throw error; }
  try {
    const property = await prisma.property.update({
      where: { id },
      data: { isFeatured: false, featuredUntil: null },
      select: { title: true, slug: true },
    });
    await recordAudit(actor, "UPDATE", "Property", id, `${property.title} — premium dayandırıldı`);
    revalidatePath("/admin/ictimai-imkanlar");
    revalidatePublicContent("property", property.slug);
    return success("Premium status dayandırıldı.");
  } catch (error) { return unexpected("premium status dayandırılmadı", error); }
}
