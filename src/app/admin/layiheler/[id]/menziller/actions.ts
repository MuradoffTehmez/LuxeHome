"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CURRENCIES, PERMISSIONS, PROJECT_UNIT_STATUSES } from "@/lib/constants";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";
import { msg } from "@/lib/admin/server-message";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { generateUnits } from "@/lib/project-units";

/**
 * Mənzil şahmatının idarəsi (#107). Generator mövcud blok+nömrəni **üzərinə yazmır** —
 * satış ofisinin qoyduğu status və qiymət təkrar generasiyada itməməlidir.
 */

type Guarded = { user: Awaited<ReturnType<typeof requireAdminAction>> } | { error: ActionState };

async function guard(): Promise<Guarded> {
  try {
    return { user: await requireAdminAction(PERMISSIONS.PROJECT_MANAGE) };
  } catch (error) {
    if (error instanceof AdminGuardError) return { error: failure(error.message) };
    throw error;
  }
}

async function refresh(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { slug: true } });
  revalidatePath(`/admin/layiheler/${projectId}/menziller`);
  if (project) revalidatePublicContent("project", project.slug);
}

const optionalNumber = (value: string) => (value.trim() === "" ? null : Number(value.replace(",", ".")));

const generatorSchema = z.object({
  blocks: z.array(z.string().trim().min(1).max(20)).min(1).max(20),
  floorFrom: z.number().int().min(-3).max(200),
  floorTo: z.number().int().min(-3).max(200),
  unitsPerFloor: z.number().int().min(1).max(40),
  rooms: z.number().int().min(1).max(20).nullable(),
  area: z.number().positive().max(10000).nullable(),
});

export async function generateProjectUnits(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await guard();
  if ("error" in access) return access.error;
  const projectId = form.text(formData, "projectId");

  const parsed = generatorSchema.safeParse({
    blocks: form.text(formData, "blocks").split(/[,\n]/).map((item) => item.trim()).filter(Boolean),
    floorFrom: Number(form.text(formData, "floorFrom")),
    floorTo: Number(form.text(formData, "floorTo")),
    unitsPerFloor: Number(form.text(formData, "unitsPerFloor")),
    rooms: optionalNumber(form.text(formData, "rooms")),
    area: optionalNumber(form.text(formData, "area")),
  });
  if (!parsed.success) return invalid(parsed.error, msg("server.common.formInvalid"));
  const units = generateUnits(parsed.data);
  if (!units) return failure(msg("server.projectUnits.tooMany"));

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } });
    if (!project) return failure(msg("server.projectUnits.projectNotFound"));

    const existing = await prisma.projectUnit.findMany({ where: { projectId }, select: { block: true, number: true } });
    const taken = new Set(existing.map((unit) => `${unit.block}|${unit.number}`));
    const fresh = units.filter((unit) => !taken.has(`${unit.block}|${unit.number}`));
    // D1 bir sorğuda 100 parametr qəbul edir: sətir başına 7 sahə → 12-lik paketlər.
    for (let index = 0; index < fresh.length; index += 12) {
      await prisma.projectUnit.createMany({
        data: fresh.slice(index, index + 12).map((unit) => ({ projectId, ...unit })),
      });
    }
    await recordAudit(access.user, "CREATE", "Project", projectId, `${project.name}: +${fresh.length} mənzil`);
    await refresh(projectId);
    return success(msg("server.projectUnits.generated", { created: fresh.length, skipped: units.length - fresh.length }));
  } catch (error) {
    return unexpected("mənzillər yaradılmadı", error, msg("server.common.unexpected"));
  }
}

const unitSchema = z.object({
  status: z.enum([PROJECT_UNIT_STATUSES.AVAILABLE, PROJECT_UNIT_STATUSES.RESERVED, PROJECT_UNIT_STATUSES.SOLD]),
  price: z.number().positive().max(1e10).nullable(),
  currency: z.enum([CURRENCIES.AZN, CURRENCIES.USD, CURRENCIES.EUR]),
  rooms: z.number().int().min(1).max(20).nullable(),
  area: z.number().positive().max(10000).nullable(),
});

export async function updateProjectUnit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await guard();
  if ("error" in access) return access.error;
  const id = form.text(formData, "id");

  const parsed = unitSchema.safeParse({
    status: form.text(formData, "status"),
    price: optionalNumber(form.text(formData, "price")),
    currency: form.text(formData, "currency") || "AZN",
    rooms: optionalNumber(form.text(formData, "rooms")),
    area: optionalNumber(form.text(formData, "area")),
  });
  if (!parsed.success) return invalid(parsed.error, msg("server.common.formInvalid"));

  try {
    const unit = await prisma.projectUnit.update({ where: { id }, data: parsed.data, select: { projectId: true, block: true, number: true } });
    await recordAudit(access.user, "UPDATE", "Project", unit.projectId, `${unit.block}-${unit.number} → ${parsed.data.status}`);
    await refresh(unit.projectId);
    return success(msg("server.projectUnits.saved"));
  } catch (error) {
    return unexpected("mənzil yenilənmədi", error, msg("server.common.unexpected"));
  }
}

/** Bir blokun bütün mənzillərini silir (səhv generasiyanı geri almaq üçün). */
export async function deleteProjectBlock(id: string): Promise<ActionState> {
  const access = await guard();
  if ("error" in access) return access.error;
  const [projectId, block] = id.split("::");
  if (!projectId || !block) return failure(msg("server.projectUnits.projectNotFound"));

  try {
    const { count } = await prisma.projectUnit.deleteMany({ where: { projectId, block } });
    await recordAudit(access.user, "DELETE", "Project", projectId, `Blok ${block}: −${count} mənzil`);
    await refresh(projectId);
    return success(msg("server.projectUnits.blockDeleted", { count }));
  } catch (error) {
    return unexpected("blok silinmədi", error, msg("server.common.unexpected"));
  }
}
