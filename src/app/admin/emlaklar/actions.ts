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
import { uniqueSlug } from "@/lib/admin/slug";
import * as form from "@/lib/admin/form";

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

function readForm(formData: FormData): PropertyInput {
  return {
    title: form.text(formData, "title"),
    slug: form.text(formData, "slug"),
    description: form.text(formData, "description"),

    listingType: form.text(formData, "listingType"),
    status: form.text(formData, "status"),

    price: form.number(formData, "price") ?? 0,
    currency: form.text(formData, "currency"),
    pricePeriod: form.optionalText(formData, "pricePeriod"),

    typeId: form.text(formData, "typeId"),
    cityId: form.text(formData, "cityId"),
    districtId: form.optionalText(formData, "districtId"),
    projectId: form.optionalText(formData, "projectId"),
    address: form.optionalText(formData, "address"),
    latitude: form.number(formData, "latitude"),
    longitude: form.number(formData, "longitude"),

    rooms: form.integer(formData, "rooms"),
    bedrooms: form.integer(formData, "bedrooms"),
    bathrooms: form.integer(formData, "bathrooms"),
    area: form.number(formData, "area"),
    landArea: form.number(formData, "landArea"),
    floor: form.integer(formData, "floor"),
    totalFloors: form.integer(formData, "totalFloors"),

    renovation: form.optionalText(formData, "renovation"),
    documentStatus: form.optionalText(formData, "documentStatus"),
    buildingType: form.optionalText(formData, "buildingType"),

    videoUrl: form.optionalText(formData, "videoUrl"),
    mortgageAvailable: form.boolean(formData, "mortgageAvailable"),
    installmentAvailable: form.boolean(formData, "installmentAvailable"),
    isFeatured: form.boolean(formData, "isFeatured"),

    metaTitle: form.optionalText(formData, "metaTitle"),
    metaDescription: form.optionalText(formData, "metaDescription"),

    featureIds: form.list(formData, "featureIds"),
  } as PropertyInput;
}

/** Elanın sahələrini Prisma-nın gözlədiyi formaya salır. */
function toData(input: PropertyInput) {
  return {
    title: input.title,
    description: input.description,
    listingType: input.listingType,
    status: input.status,
    price: input.price,
    currency: input.currency,
    // Satış elanında dövr sahəsi məna daşımır
    pricePeriod: input.listingType === "RENT" ? input.pricePeriod : null,
    typeId: input.typeId,
    cityId: input.cityId,
    districtId: input.districtId,
    projectId: input.projectId,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    rooms: input.rooms,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    area: input.area,
    landArea: input.landArea,
    floor: input.floor,
    totalFloors: input.totalFloors,
    renovation: input.renovation,
    documentStatus: input.documentStatus,
    buildingType: input.buildingType,
    videoUrl: input.videoUrl,
    mortgageAvailable: input.mortgageAvailable,
    installmentAvailable: input.installmentAvailable,
    isFeatured: input.isFeatured,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
  };
}

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

  const parsed = propertySchema.safeParse(readForm(formData));
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
        ...toData(parsed.data),
        slug,
        authorId: user.id,
        isDemo: false,
        publishedAt:
          parsed.data.status === PROPERTY_STATUSES.PUBLISHED ? new Date() : null,
      },
      select: { id: true },
    });
    propertyId = property.id;

    await replaceRelations(propertyId, parsed.data.featureIds, images);
    await recordAudit(user, "CREATE", "Property", propertyId, parsed.data.title);
  } catch (error) {
    return unexpected("əmlak yaradıla bilmədi", error);
  }

  revalidatePath(LIST_PATH);
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

  const parsed = propertySchema.safeParse(readForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  const relationErrors = await validateRelations(parsed.data);
  if (relationErrors) {
    return failure("Seçilmiş taksonomiya dəyərləri düzgün deyil.", relationErrors);
  }

  try {
    const existing = await prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, publishedAt: true, status: true },
    });
    if (!existing) return failure("Elan tapılmadı və ya silinib.");

    const slug = await uniqueSlug(
      parsed.data.slug || parsed.data.title,
      (candidate) => prisma.property.findUnique({ where: { slug: candidate }, select: { id: true } }),
      id,
    );

    // Dərc tarixi bir dəfə qoyulur: sonrakı statuslar (satıldı, arxiv) onu silmir
    const publishedAt =
      parsed.data.status === PROPERTY_STATUSES.PUBLISHED && !existing.publishedAt
        ? new Date()
        : existing.publishedAt;

    await prisma.property.update({
      where: { id },
      data: { ...toData(parsed.data), slug, publishedAt },
    });

    await replaceRelations(id, parsed.data.featureIds, parseImages(formData, "images"));
    await recordAudit(user, "UPDATE", "Property", id, parsed.data.title);

    revalidatePath(LIST_PATH);
    revalidatePath(`/emlaklar/${slug}`);
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
        publishedAt:
          status === PROPERTY_STATUSES.PUBLISHED && !existing.publishedAt
            ? new Date()
            : existing.publishedAt,
      },
    });

    await recordAudit(user, "PUBLISH", "Property", id, `${existing.title} → ${status}`);
    revalidatePath(LIST_PATH);
    revalidatePath(`/emlaklar/${existing.slug}`);
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
    return success(existing.isFeatured ? "Tövsiyədən çıxarıldı." : "Tövsiyəyə əlavə edildi.");
  } catch (error) {
    return unexpected("tövsiyə nişanı dəyişmədi", error);
  }
}
