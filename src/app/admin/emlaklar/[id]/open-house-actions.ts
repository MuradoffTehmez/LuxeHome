"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";
import { msg } from "@/lib/admin/server-message";
import { revalidatePublicContent } from "@/lib/revalidate-public";

/** Açıq qapı slotlarının idarəsi (#109). Vaxt Bakı vaxtı kimi daxil edilir. */

const BAKU_OFFSET = "+04:00";

const slotSchema = z.object({
  propertyId: z.string().min(1),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(15).max(600),
  capacity: z.number().int().min(1).max(500).nullable(),
  note: z.string().trim().max(200).nullable(),
});

type Guarded = { user: Awaited<ReturnType<typeof requireAdminAction>> } | { error: ActionState };

async function guard(): Promise<Guarded> {
  try {
    return { user: await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE) };
  } catch (error) {
    if (error instanceof AdminGuardError) return { error: failure(error.message) };
    throw error;
  }
}

export async function addOpenHouse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await guard();
  if ("error" in access) return access.error;
  const capacity = form.text(formData, "capacity");
  const parsed = slotSchema.safeParse({
    propertyId: form.text(formData, "propertyId"),
    startsAt: form.text(formData, "startsAt"),
    durationMinutes: Number(form.text(formData, "durationMinutes") || "120"),
    capacity: capacity ? Number(capacity) : null,
    note: form.optionalText(formData, "note"),
  });
  if (!parsed.success) return invalid(parsed.error, msg("server.common.formInvalid"));

  const startsAt = new Date(`${parsed.data.startsAt}:00${BAKU_OFFSET}`);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
    return failure(msg("server.openHouse.invalidTime"), { startsAt: msg("server.openHouse.invalidTime") });
  }

  try {
    const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId }, select: { id: true, slug: true } });
    if (!property) return failure(msg("server.common.unexpected"));
    await prisma.openHouse.create({
      data: {
        propertyId: property.id,
        startsAt,
        endsAt: new Date(startsAt.getTime() + parsed.data.durationMinutes * 60_000),
        capacity: parsed.data.capacity,
        note: parsed.data.note,
      },
    });
    await recordAudit(access.user, "UPDATE", "Property", property.id, `Açıq qapı: ${parsed.data.startsAt}`);
    revalidatePath(`/admin/emlaklar/${property.id}`);
    revalidatePublicContent("property", property.slug);
    return success(msg("server.openHouse.added"));
  } catch (error) {
    return unexpected("açıq qapı əlavə olunmadı", error, msg("server.common.unexpected"));
  }
}

export async function deleteOpenHouse(id: string): Promise<ActionState> {
  const access = await guard();
  if ("error" in access) return access.error;
  try {
    const slot = await prisma.openHouse.delete({ where: { id }, select: { propertyId: true, property: { select: { slug: true } } } });
    await recordAudit(access.user, "UPDATE", "Property", slot.propertyId, "Açıq qapı slotu silindi");
    revalidatePath(`/admin/emlaklar/${slot.propertyId}`);
    revalidatePublicContent("property", slot.property.slug);
    return success(msg("server.openHouse.deleted"));
  } catch (error) {
    return unexpected("açıq qapı silinmədi", error, msg("server.common.unexpected"));
  }
}
