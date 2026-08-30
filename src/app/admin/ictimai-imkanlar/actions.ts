"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/admin/audit";
import { failure, invalid, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";
import { NEARBY_PLACE_CATEGORIES, PERMISSIONS, PREMIUM_DURATIONS_DAYS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

function numberValue(formData: FormData, name: string) {
  return form.number(formData, name);
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
    const place = await prisma.nearbyPlace.create({ data: { ...parsed.data, source: parsed.data.source || null } });
    await recordAudit(actor, "CREATE", "Property", parsed.data.propertyId, `Yaxın obyekt: ${parsed.data.name}`);
    revalidatePath("/admin/ictimai-imkanlar");
    revalidatePath("/emlaklar");
    return success("Yaxın obyekt əlavə edildi.");
  } catch (error) { return unexpected("yaxın obyekt yaradılmadı", error); }
}

const neighborhoodSchema = z.object({
  locationId: z.string().min(1),
  description: z.string().trim().max(3000).optional(), descriptionEn: z.string().trim().max(3000).optional(), descriptionRu: z.string().trim().max(3000).optional(),
  averagePrice: z.number().min(0).nullable(), averagePricePerSqm: z.number().min(0).nullable(), annualChangePercent: z.number().min(-100).max(1000).nullable(),
  averageRent: z.number().min(0).nullable(), rentalYieldPercent: z.number().min(-100).max(1000).nullable(),
  dataSource: z.string().trim().max(500).optional(), measuredAt: z.date().nullable(),
});

export async function upsertNeighborhoodProfile(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try { actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE); }
  catch (error) { if (error instanceof AdminGuardError) return failure(error.message); throw error; }
  const parsed = neighborhoodSchema.safeParse({
    locationId: form.text(formData, "locationId"), description: form.text(formData, "description"), descriptionEn: form.text(formData, "descriptionEn"), descriptionRu: form.text(formData, "descriptionRu"),
    averagePrice: numberValue(formData, "averagePrice"), averagePricePerSqm: numberValue(formData, "averagePricePerSqm"), annualChangePercent: numberValue(formData, "annualChangePercent"),
    averageRent: numberValue(formData, "averageRent"), rentalYieldPercent: numberValue(formData, "rentalYieldPercent"), dataSource: form.text(formData, "dataSource"), measuredAt: form.date(formData, "measuredAt"),
  });
  if (!parsed.success) return invalid(parsed.error);
  try {
    const data = { ...parsed.data, description: parsed.data.description || null, descriptionEn: parsed.data.descriptionEn || null, descriptionRu: parsed.data.descriptionRu || null, dataSource: parsed.data.dataSource || null };
    await prisma.neighborhoodProfile.upsert({ where: { locationId: parsed.data.locationId }, create: data, update: data });
    await recordAudit(actor, "UPDATE", "Property", null, "Rayon analitikası yeniləndi");
    revalidatePath("/admin/ictimai-imkanlar");
    revalidatePath("/emlaklar");
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
    revalidatePath("/admin/ictimai-imkanlar"); revalidatePath("/emlaklar"); revalidatePath(`/emlaklar/${property.slug}`); revalidatePath("/");
    return success(`Elan ${parsed.data.durationDays} gün premium edildi.`);
  } catch (error) { return unexpected("premium elan aktiv edilmədi", error); }
}
