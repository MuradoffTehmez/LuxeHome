"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants";
import {
  type ActionState,
  failure,
  invalid,
  success,
  unexpected,
} from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { uniqueSlug } from "@/lib/admin/slug";
import { featureCreateSchema, propertyTypeCreateSchema } from "@/lib/admin/schemas";
import * as form from "@/lib/admin/form";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { normalizeSearchText } from "@/lib/search-normalization";
import { msg } from "@/lib/admin/server-message";

const LIST_PATH = "/admin/taksonomiya";

export async function createPropertyType(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = propertyTypeCreateSchema.safeParse({ name: form.text(formData, "name") });
  if (!parsed.success) return invalid(parsed.error, msg("server.common.formInvalid"));

  try {
    const slug = await uniqueSlug(parsed.data.name, (candidate) =>
      prisma.propertyType.findUnique({ where: { slug: candidate }, select: { id: true } }),
    );
    const maxOrder = await prisma.propertyType.aggregate({ _max: { order: true } });

    const type = await prisma.propertyType.create({
      data: { name: parsed.data.name, searchName: normalizeSearchText(parsed.data.name), slug, order: (maxOrder._max.order ?? 0) + 10 },
      select: { id: true },
    });

    await recordAudit(actor, "CREATE", "Property", type.id, `Əmlak növü: ${parsed.data.name}`);
    revalidatePath(LIST_PATH);
    revalidatePublicContent("taxonomy");
    return success(msg("server.taksonomiya.emlakNovuElaveEdildi", { p0: String(parsed.data.name) }));
  } catch (error) {
    return unexpected("əmlak növü yaradıla bilmədi", error, msg("server.common.unexpected"));
  }
}

export async function togglePropertyTypeActive(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const type = await prisma.propertyType.findUnique({ where: { id }, select: { name: true, isActive: true } });
    if (!type) return failure(msg("server.taksonomiya.emlakNovuTapilmadi"));

    await prisma.propertyType.update({ where: { id }, data: { isActive: !type.isActive } });
    await recordAudit(actor, "UPDATE", "Property", id, `${type.name} — ${type.isActive ? "deaktiv edildi" : "aktivləşdirildi"}`);
    revalidatePath(LIST_PATH);
    return success(msg("server.taksonomiya.emlakNovuYenilendi"));
  } catch (error) {
    return unexpected("əmlak növü yenilənmədi", error, msg("server.common.unexpected"));
  }
}

export async function deletePropertyType(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const type = await prisma.propertyType.findUnique({
      where: { id },
      select: { name: true, _count: { select: { properties: true } } },
    });
    if (!type) return failure(msg("server.taksonomiya.emlakNovuTapilmadi"));
    if (type._count.properties > 0) {
      return failure(msg("server.taksonomiya.buNovdeEmlakVarEvvelce", { p0: String(type._count.properties) }));
    }

    await prisma.propertyType.delete({ where: { id } });
    await recordAudit(actor, "DELETE", "Property", id, `Əmlak növü silindi: ${type.name}`);
    revalidatePath(LIST_PATH);
    return success(msg("server.taksonomiya.emlakNovuSilindi"));
  } catch (error) {
    return unexpected("əmlak növü silinmədi", error, msg("server.common.unexpected"));
  }
}

export async function createFeature(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = featureCreateSchema.safeParse({
    name: form.text(formData, "name"),
    group: form.text(formData, "group"),
  });
  if (!parsed.success) return invalid(parsed.error, msg("server.common.formInvalid"));

  try {
    const slug = await uniqueSlug(parsed.data.name, (candidate) =>
      prisma.feature.findUnique({ where: { slug: candidate }, select: { id: true } }),
    );
    const maxOrder = await prisma.feature.aggregate({
      _max: { order: true },
      where: { group: parsed.data.group },
    });

    const feature = await prisma.feature.create({
      data: {
        name: parsed.data.name,
        searchName: normalizeSearchText(parsed.data.name),
        slug,
        group: parsed.data.group,
        order: (maxOrder._max.order ?? 0) + 10,
      },
      select: { id: true },
    });

    await recordAudit(actor, "CREATE", "Property", feature.id, `Xüsusiyyət: ${parsed.data.name}`);
    revalidatePath(LIST_PATH);
    return success(msg("server.taksonomiya.xususiyyetiElaveEdildi", { p0: String(parsed.data.name) }));
  } catch (error) {
    return unexpected("xüsusiyyət yaradıla bilmədi", error, msg("server.common.unexpected"));
  }
}

export async function deleteFeature(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const feature = await prisma.feature.findUnique({
      where: { id },
      select: { name: true, _count: { select: { properties: true } } },
    });
    if (!feature) return failure(msg("server.taksonomiya.xususiyyetTapilmadi"));
    if (feature._count.properties > 0) {
      return failure(msg("server.taksonomiya.buXususiyyetEmlakaBaglidirEvvelce", { p0: String(feature._count.properties) }));
    }

    await prisma.feature.delete({ where: { id } });
    await recordAudit(actor, "DELETE", "Property", id, `Xüsusiyyət silindi: ${feature.name}`);
    revalidatePath(LIST_PATH);
    return success(msg("server.taksonomiya.xususiyyetSilindi"));
  } catch (error) {
    return unexpected("xüsusiyyət silinmədi", error, msg("server.common.unexpected"));
  }
}
