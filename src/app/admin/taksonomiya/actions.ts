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
  if (!parsed.success) return invalid(parsed.error);

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
    return success(`«${parsed.data.name}» əmlak növü əlavə edildi.`);
  } catch (error) {
    return unexpected("əmlak növü yaradıla bilmədi", error);
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
    if (!type) return failure("Əmlak növü tapılmadı.");

    await prisma.propertyType.update({ where: { id }, data: { isActive: !type.isActive } });
    await recordAudit(actor, "UPDATE", "Property", id, `${type.name} — ${type.isActive ? "deaktiv edildi" : "aktivləşdirildi"}`);
    revalidatePath(LIST_PATH);
    return success("Əmlak növü yeniləndi.");
  } catch (error) {
    return unexpected("əmlak növü yenilənmədi", error);
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
    if (!type) return failure("Əmlak növü tapılmadı.");
    if (type._count.properties > 0) {
      return failure(`Bu növdə ${type._count.properties} əmlak var — əvvəlcə onları başqa növə köçürün.`);
    }

    await prisma.propertyType.delete({ where: { id } });
    await recordAudit(actor, "DELETE", "Property", id, `Əmlak növü silindi: ${type.name}`);
    revalidatePath(LIST_PATH);
    return success("Əmlak növü silindi.");
  } catch (error) {
    return unexpected("əmlak növü silinmədi", error);
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
  if (!parsed.success) return invalid(parsed.error);

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
    return success(`«${parsed.data.name}» xüsusiyyəti əlavə edildi.`);
  } catch (error) {
    return unexpected("xüsusiyyət yaradıla bilmədi", error);
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
    if (!feature) return failure("Xüsusiyyət tapılmadı.");
    if (feature._count.properties > 0) {
      return failure(`Bu xüsusiyyət ${feature._count.properties} əmlaka bağlıdır — əvvəlcə onlardan çıxarın.`);
    }

    await prisma.feature.delete({ where: { id } });
    await recordAudit(actor, "DELETE", "Property", id, `Xüsusiyyət silindi: ${feature.name}`);
    revalidatePath(LIST_PATH);
    return success("Xüsusiyyət silindi.");
  } catch (error) {
    return unexpected("xüsusiyyət silinmədi", error);
  }
}
