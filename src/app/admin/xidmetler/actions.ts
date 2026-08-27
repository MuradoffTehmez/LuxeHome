"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants";
import { SERVICE_ICON_NAMES } from "@/components/site/service-icon";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { parseSingleImage } from "@/lib/admin/images";
import { serviceSchema } from "@/lib/admin/schemas";
import { uniqueSlug } from "@/lib/admin/slug";
import * as form from "@/lib/admin/form";
import { revalidatePublicContent } from "@/lib/revalidate-public";

/**
 * Xidmət CRUD-u.
 *
 * `icon` sahəsi sərbəst mətndir, amma ictimai `ServiceIcon` yalnız icazəli adları
 * tanıyır. Yoxlama burada da təkrarlanır ki, siyahıda olmayan ad ümumiyyətlə
 * bazaya düşməsin — əks halda saytda səssizcə neytral ikon görünərdi.
 */

const LIST_PATH = "/admin/xidmetler";

function readForm(formData: FormData) {
  return {
    title: form.text(formData, "title"),
    slug: form.text(formData, "slug"),
    shortDescription: form.text(formData, "shortDescription"),
    description: form.text(formData, "description"),
    icon: form.text(formData, "icon"),
    bullets: form.lines(formData, "bullets"),
    order: form.integer(formData, "order") ?? 0,
    isActive: form.boolean(formData, "isActive"),
    metaTitle: form.optionalText(formData, "metaTitle"),
    metaDescription: form.optionalText(formData, "metaDescription"),
    noIndex: form.boolean(formData, "noIndex"),
    canonicalUrl: form.optionalText(formData, "canonicalUrl"),
    ogTitle: form.optionalText(formData, "ogTitle"),
    ogDescription: form.optionalText(formData, "ogDescription"),
    ogImage: form.optionalText(formData, "ogImage"),
  };
}

export async function saveService(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.SERVICE_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  const parsed = serviceSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  if (!SERVICE_ICON_NAMES.includes(parsed.data.icon)) {
    return failure("İkon seçimi düzgün deyil.", { icon: "Siyahıdan bir ikon seçin" });
  }

  let serviceId = id;

  try {
    const existing = id
      ? await prisma.service.findUnique({ where: { id }, select: { slug: true } })
      : null;
    if (id && !existing) return failure("Redaktə edilən xidmət tapılmadı. Siyahını yeniləyin.");

    const slug = await uniqueSlug(
      parsed.data.slug || parsed.data.title,
      (candidate) => prisma.service.findUnique({ where: { slug: candidate }, select: { id: true } }),
      id || undefined,
    );

    const image = parseSingleImage(formData, "image");

    const data = {
      title: parsed.data.title,
      slug,
      shortDescription: parsed.data.shortDescription,
      description: parsed.data.description,
      icon: parsed.data.icon,
      imageUrl: image?.url ?? null,
      bullets: form.jsonArray(parsed.data.bullets),
      order: parsed.data.order,
      isActive: parsed.data.isActive,
      metaTitle: parsed.data.metaTitle,
      metaDescription: parsed.data.metaDescription,
      noIndex: parsed.data.noIndex,
      canonicalUrl: parsed.data.canonicalUrl,
      ogTitle: parsed.data.ogTitle,
      ogDescription: parsed.data.ogDescription,
      ogImage: parsed.data.ogImage,
    };

    if (id) {
      await prisma.service.update({ where: { id }, data });
      await recordAudit(user, "UPDATE", "Service", id, parsed.data.title);
      revalidatePath(LIST_PATH);
      revalidatePath(`/xidmetler/${slug}`);
      if (existing && existing.slug !== slug) {
        revalidatePath(`/xidmetler/${existing.slug}`);
        revalidatePublicContent("service", existing.slug);
      }
      revalidatePublicContent("service", slug);
      return success("Xidmət yeniləndi.");
    }

    const created = await prisma.service.create({ data, select: { id: true } });
    serviceId = created.id;
    await recordAudit(user, "CREATE", "Service", serviceId, parsed.data.title);
  } catch (error) {
    return unexpected("xidmət saxlanılmadı", error);
  }

  revalidatePath(LIST_PATH);
  revalidatePublicContent("service");
  redirect(`${LIST_PATH}/${serviceId}`);
}

/**
 * Xidmətin silinməsi.
 *
 * `Service` modelində `deletedAt` yoxdur. Silmək əvəzinə redaktor adətən
 * «Saytda göstərilsin» seçimini söndürür; bu action isə həqiqi silmədir.
 */
export async function deleteService(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.SERVICE_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const service = await prisma.service.delete({
      where: { id },
      select: { title: true, slug: true },
    });

    await recordAudit(user, "DELETE", "Service", id, service.title);
    revalidatePath(LIST_PATH);
    revalidatePath(`/xidmetler/${service.slug}`);
    revalidatePublicContent("service", service.slug);
    return success("Xidmət silindi.");
  } catch (error) {
    return unexpected("xidmət silinmədi", error);
  }
}
