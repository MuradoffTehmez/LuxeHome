"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, PROPERTY_STATUSES } from "@/lib/constants";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { parseImages } from "@/lib/admin/images";
import { propertySchema, type PropertyInput } from "@/lib/admin/schemas";
import {
  nextPublishedAt,
  propertyData,
  readPropertyForm,
} from "@/lib/admin/property-input";
import { uniqueSlug } from "@/lib/admin/slug";
import * as form from "@/lib/admin/form";
import { notifyMatchingSavedSearches } from "@/lib/queries";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { recordPropertyPriceChange } from "@/lib/price-drop";

/**
 * Əmlak CRUD-u.
 *
 * Hər action `requireAdminAction()` ilə başlayır: mənbə (CSRF), səlahiyyət və sürət
 * limiti bir yerdə yoxlanılır. Layout guard-ı burada kifayət etmir, çünki action
 * layout-dan keçmir.
 *
 * D1 transaction dəstəkləmir. Yazı sırası ona görə belədir: əvvəl əsas qeyd, sonra
 * əlaqəli sətirlər (xüsusiyyət, şəkil). Yarımçıq qalan halda elan mövcud olur, sadəcə
 * qalereyası natamam görünür — tərsinə olsaydı, sahibsiz sətirlər qalardı.
 */

const LIST_PATH = "/admin/emlaklar";

/** Verilən ID-lərin həqiqətən mövcud olduğunu yoxlayır — uydurma ID ilə yazı bağlanmasın. */
async function validateRelations(input: PropertyInput): Promise<Record<string, string> | null> {
  const errors: Record<string, string> = {};

  const [type, city, district, project] = await Promise.all([
    prisma.propertyType.findUnique({ where: { id: input.typeId }, select: { id: true } }),
    prisma.location.findUnique({ where: { id: input.cityId }, select: { id: true } }),
    input.districtId
      ? prisma.location.findUnique({ where: { id: input.districtId }, select: { parentId: true } })
      : null,
    input.projectId
      ? prisma.project.findUnique({ where: { id: input.projectId }, select: { id: true } })
      : null,
  ]);

  if (!type) errors.typeId = "Əmlak növü seçilməyib";
  if (!city) errors.cityId = "Şəhər seçilməyib";
  if (input.districtId && !district) errors.districtId = "Rayon tapılmadı";
  if (district && district.parentId !== input.cityId) {
    errors.districtId = "Seçilmiş rayon bu şəhərə aid deyil";
  }
  if (input.projectId && !project) errors.projectId = "Layihə tapılmadı";

  return Object.keys(errors).length > 0 ? errors : null;
}

/** Xüsusiyyət və şəkil sətirlərini yenidən qurur. */
async function replaceRelations(
  propertyId: string,
  featureIds: string[],
  images: { url: string; alt: string; isCover: boolean }[],
) {
  await prisma.propertyFeature.deleteMany({ where: { propertyId } });
  for (const featureId of featureIds) {
    // Silinmiş xüsusiyyət ID-si gəlsə, xarici açar xətası bütün yazını dayandırardı
    await prisma.propertyFeature
      .create({ data: { propertyId, featureId } })
      .catch(() => undefined);
  }

  await prisma.propertyImage.deleteMany({ where: { propertyId } });
  for (const [order, image] of images.entries()) {
    await prisma.propertyImage.create({
      data: { propertyId, url: image.url, alt: image.alt, order, isCover: image.isCover },
    });
  }
}

export async function createProperty(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = propertySchema.safeParse(readPropertyForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  const relationErrors = await validateRelations(parsed.data);
  if (relationErrors) {
    return failure("Seçilmiş taksonomiya dəyərləri düzgün deyil.", relationErrors);
  }

  const images = parseImages(formData, "images");
  let propertyId: string;

  try {
    const slug = await uniqueSlug(parsed.data.slug || parsed.data.title, (candidate) =>
      prisma.property.findUnique({ where: { slug: candidate }, select: { id: true } }),
    );

    const property = await prisma.property.create({
      data: {
        ...propertyData(parsed.data),
        slug,
        authorId: user.id,
        isDemo: false,
        publishedAt: nextPublishedAt(parsed.data.status, null),
      },
      select: { id: true },
    });
    propertyId = property.id;

    await replaceRelations(propertyId, parsed.data.featureIds, images);
    await recordAudit(user, "CREATE", "Property", propertyId, parsed.data.title);

    if (parsed.data.status === PROPERTY_STATUSES.PUBLISHED) {
      await notifyMatchingSavedSearches(propertyId);
    }
  } catch (error) {
    return unexpected("əmlak yaradıla bilmədi", error);
  }

  revalidatePath(LIST_PATH);
  revalidatePublicContent("property");
  redirect(`${LIST_PATH}/${propertyId}?yeni=1`);
}

export async function updateProperty(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  if (!id) return failure("Elan tapılmadı.");

  const parsed = propertySchema.safeParse(readPropertyForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  const relationErrors = await validateRelations(parsed.data);
  if (relationErrors) {
    return failure("Seçilmiş taksonomiya dəyərləri düzgün deyil.", relationErrors);
  }

  try {
    const existing = await prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, publishedAt: true, status: true, price: true, currency: true },
    });
    if (!existing) return failure("Elan tapılmadı və ya silinib.");

    const slug = await uniqueSlug(
      parsed.data.slug || parsed.data.title,
      (candidate) => prisma.property.findUnique({ where: { slug: candidate }, select: { id: true } }),
      id,
    );

    const publishedAt = nextPublishedAt(parsed.data.status, existing.publishedAt);

    await prisma.property.update({
      where: { id },
      data: { ...propertyData(parsed.data), slug, publishedAt },
    });

    await recordPropertyPriceChange({
      propertyId: id,
      oldPrice: existing.price,
      newPrice: parsed.data.price,
      currency: existing.currency,
      changedById: user.id,
      source: "ADMIN",
    });

    await replaceRelations(id, parsed.data.featureIds, parseImages(formData, "images"));
    await recordAudit(user, "UPDATE", "Property", id, parsed.data.title);

    if (existing.publishedAt === null && parsed.data.status === PROPERTY_STATUSES.PUBLISHED) {
      await notifyMatchingSavedSearches(id);
    }

    revalidatePath(LIST_PATH);
    revalidatePath(`/emlaklar/${slug}`);
    revalidatePublicContent("property", slug);
    return success("Elan yeniləndi.");
  } catch (error) {
    return unexpected("əmlak yenilənmədi", error);
  }
}

export async function deleteProperty(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    // Soft delete: ictimai sorğular `deletedAt: null` şərtinə görə qeydi görmür,
    // amma müraciət tarixçəsi və audit izi qırılmır
    const property = await prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { title: true, slug: true },
    });

    await recordAudit(user, "DELETE", "Property", id, property.title);
    revalidatePath(LIST_PATH);
    revalidatePath(`/emlaklar/${property.slug}`);
    revalidatePublicContent("property", property.slug);
    return success("Elan silindi.");
  } catch (error) {
    return unexpected("əmlak silinmədi", error);
  }
}

export async function restoreProperty(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const property = await prisma.property.update({
      where: { id },
      data: { deletedAt: null },
      select: { title: true },
    });

    await recordAudit(user, "RESTORE", "Property", id, property.title);
    revalidatePath(LIST_PATH);
    revalidatePublicContent("property");
    return success("Elan bərpa edildi.");
  } catch (error) {
    return unexpected("əmlak bərpa edilmədi", error);
  }
}

/** Siyahıdan sürətli status dəyişməsi. */
export async function setPropertyStatus(id: string, status: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  if (!Object.values(PROPERTY_STATUSES).includes(status as never)) {
    return failure("Status dəyəri düzgün deyil.");
  }

  try {
    const existing = await prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { publishedAt: true, title: true, slug: true },
    });
    if (!existing) return failure("Elan tapılmadı.");

    await prisma.property.update({
      where: { id },
      data: {
        status,
        publishedAt: nextPublishedAt(status, existing.publishedAt),
      },
    });

    await recordAudit(user, "PUBLISH", "Property", id, `${existing.title} → ${status}`);

    if (existing.publishedAt === null && status === PROPERTY_STATUSES.PUBLISHED) {
      await notifyMatchingSavedSearches(id);
    }

    revalidatePath(LIST_PATH);
    revalidatePath(`/emlaklar/${existing.slug}`);
    revalidatePublicContent("property", existing.slug);
    return success("Status yeniləndi.");
  } catch (error) {
    return unexpected("status dəyişmədi", error);
  }
}

export async function togglePropertyFeatured(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const existing = await prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { isFeatured: true, title: true },
    });
    if (!existing) return failure("Elan tapılmadı.");

    await prisma.property.update({
      where: { id },
      data: { isFeatured: !existing.isFeatured },
    });

    await recordAudit(user, "UPDATE", "Property", id, `${existing.title} — tövsiyə nişanı`);
    revalidatePath(LIST_PATH);
    revalidatePublicContent("property");
    return success(existing.isFeatured ? "Tövsiyədən çıxarıldı." : "Tövsiyəyə əlavə edildi.");
  } catch (error) {
    return unexpected("tövsiyə nişanı dəyişmədi", error);
  }
}

const BULK_INTENTS = ["publish", "archive", "delete", "restore"] as const;
type BulkIntent = (typeof BULK_INTENTS)[number];

/**
 * Siyahıda seçilmiş bir neçə elana eyni əməliyyatı tətbiq edir.
 *
 * D1 `$transaction` dəstəkləmədiyi üçün hər id ayrıca yazılır — biri uğursuz olsa
 * digərləri geri qaytarılmır, ona görə nəticə mesajı neçəsinin işlədiyini bildirir.
 */
export async function bulkUpdateProperties(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const ids = form.uniqueList(formData, "ids");
  if (ids.length === 0) return failure("Heç bir elan seçilməyib.");

  const intent = form.text(formData, "intent") as BulkIntent;
  if (!BULK_INTENTS.includes(intent)) return failure("Naməlum əməliyyat.");

  const data =
    intent === "publish"
      ? { status: PROPERTY_STATUSES.PUBLISHED, publishedAt: new Date() }
      : intent === "archive"
        ? { status: PROPERTY_STATUSES.ARCHIVED }
        : intent === "delete"
          ? { deletedAt: new Date() }
          : { deletedAt: null };

  // Yalnız ilk dəfə dərc olunanlar (əvvəllər `publishedAt` boş olan) saxlanmış axtarış
  // bildirişinə səbəb olur — artıq dərc edilmiş elanın statusu təkrar "publish" ilə
  // toxunulsa belə, bildiriş təkrarlanmır.
  const previouslyUnpublished =
    intent === "publish"
      ? new Set(
          (
            await prisma.property.findMany({
              where: { id: { in: ids }, publishedAt: null },
              select: { id: true },
            })
          ).map((property) => property.id),
        )
      : null;

  let done = 0;
  for (const id of ids) {
    try {
      await prisma.property.update({ where: { id }, data });
      done += 1;
      if (previouslyUnpublished?.has(id)) {
        await notifyMatchingSavedSearches(id);
      }
    } catch {
      // Tək id uğursuz olsa qalanları dayandırmır — nəticədə sayılır
    }
  }

  await recordAudit(user, "UPDATE", "Property", null, `Kütləvi ${intent}: ${done}/${ids.length} elan`);
  revalidatePath(LIST_PATH);
  revalidatePublicContent("property");

  if (done === 0) return failure("Heç bir elan yenilənmədi.");
  if (done < ids.length) return failure(`${done}/${ids.length} elan yeniləndi, qalanları uğursuz oldu.`);
  return success(`${done} elan yeniləndi.`);
}
