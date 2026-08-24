"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, PROJECT_IMAGE_CATEGORIES } from "@/lib/constants";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { parseImages } from "@/lib/admin/images";
import { projectSchema, type ProjectInput } from "@/lib/admin/schemas";
import { uniqueSlug } from "@/lib/admin/slug";
import * as form from "@/lib/admin/form";
import { revalidatePublicContent } from "@/lib/revalidate-public";

/**
 * Layihə CRUD-u.
 *
 * `highlights` və `timeline` sxemdə JSON sətri kimi saxlanılır (SQLite-də massiv
 * tipi yoxdur). Formada hər ikisi sətir-başına-bir-maddə formatındadır; icra
 * olunmuş mərhələ `[x]` prefiksi ilə işarələnir.
 */

const LIST_PATH = "/admin/layiheler";

/** `[x] Bünövrə` → `{ title: "Bünövrə", done: true }` */
function parseTimeline(formData: FormData) {
  return form.lines(formData, "timeline").map((line) => {
    const done = /^\[x\]\s*/i.test(line);
    return { title: line.replace(/^\[x?\s*\]\s*/i, "").trim(), done };
  });
}

function readForm(formData: FormData): ProjectInput {
  return {
    name: form.text(formData, "name"),
    slug: form.text(formData, "slug"),
    description: form.text(formData, "description"),
    summary: form.optionalText(formData, "summary"),

    projectType: form.text(formData, "projectType"),
    status: form.text(formData, "status"),

    cityId: form.optionalText(formData, "cityId"),
    address: form.optionalText(formData, "address"),
    latitude: form.number(formData, "latitude"),
    longitude: form.number(formData, "longitude"),

    startDate: form.date(formData, "startDate"),
    deliveryDate: form.date(formData, "deliveryDate"),
    year: form.integer(formData, "year"),

    totalArea: form.number(formData, "totalArea"),
    floors: form.integer(formData, "floors"),
    unitCount: form.integer(formData, "unitCount"),

    highlights: form.lines(formData, "highlights"),
    timeline: parseTimeline(formData),

    isActive: form.boolean(formData, "isActive"),
    order: form.integer(formData, "order") ?? 0,

    metaTitle: form.optionalText(formData, "metaTitle"),
    metaDescription: form.optionalText(formData, "metaDescription"),
    noIndex: form.boolean(formData, "noIndex"),
    canonicalUrl: form.optionalText(formData, "canonicalUrl"),
    ogTitle: form.optionalText(formData, "ogTitle"),
    ogDescription: form.optionalText(formData, "ogDescription"),
    ogImage: form.optionalText(formData, "ogImage"),
  } as ProjectInput;
}

function toData(input: ProjectInput, coverUrl: string | null) {
  return {
    name: input.name,
    description: input.description,
    summary: input.summary,
    projectType: input.projectType,
    status: input.status,
    cityId: input.cityId,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    startDate: input.startDate,
    deliveryDate: input.deliveryDate,
    year: input.year,
    totalArea: input.totalArea,
    floors: input.floors,
    unitCount: input.unitCount,
    highlights: form.jsonArray(input.highlights),
    timeline: form.jsonArray(input.timeline),
    isActive: input.isActive,
    order: input.order,
    coverUrl,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    noIndex: input.noIndex,
    canonicalUrl: input.canonicalUrl,
    ogTitle: input.ogTitle,
    ogDescription: input.ogDescription,
    ogImage: input.ogImage,
  };
}

async function replaceImages(
  projectId: string,
  images: { url: string; alt: string }[],
): Promise<void> {
  await prisma.projectImage.deleteMany({ where: { projectId } });
  for (const [order, image] of images.entries()) {
    await prisma.projectImage.create({
      data: {
        projectId,
        url: image.url,
        alt: image.alt,
        order,
        // Şəkil kateqoriyası hələ UI-da açılmayıb — ictimai səhifə qalereyanı
        // düz siyahı kimi göstərir, ona görə hamısı eyni kateqoriyadadır
        category: PROJECT_IMAGE_CATEGORIES.EXTERIOR,
      },
    });
  }
}

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROJECT_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = projectSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  const images = parseImages(formData, "images");
  let projectId: string;

  try {
    const slug = await uniqueSlug(parsed.data.slug || parsed.data.name, (candidate) =>
      prisma.project.findUnique({ where: { slug: candidate }, select: { id: true } }),
    );

    const cover = images.find((image) => image.isCover) ?? images[0] ?? null;

    const project = await prisma.project.create({
      data: { ...toData(parsed.data, cover?.url ?? null), slug, isDemo: false },
      select: { id: true },
    });
    projectId = project.id;

    await replaceImages(projectId, images);
    await recordAudit(user, "CREATE", "Project", projectId, parsed.data.name);
  } catch (error) {
    return unexpected("layihə yaradıla bilmədi", error);
  }

  revalidatePath(LIST_PATH);
  revalidatePublicContent("project");
  redirect(`${LIST_PATH}/${projectId}`);
}

export async function updateProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROJECT_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  if (!id) return failure("Layihə tapılmadı.");

  const parsed = projectSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const existing = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return failure("Layihə tapılmadı və ya silinib.");

    const images = parseImages(formData, "images");
    const cover = images.find((image) => image.isCover) ?? images[0] ?? null;

    const slug = await uniqueSlug(
      parsed.data.slug || parsed.data.name,
      (candidate) => prisma.project.findUnique({ where: { slug: candidate }, select: { id: true } }),
      id,
    );

    await prisma.project.update({
      where: { id },
      data: { ...toData(parsed.data, cover?.url ?? null), slug },
    });

    await replaceImages(id, images);
    await recordAudit(user, "UPDATE", "Project", id, parsed.data.name);

    revalidatePath(LIST_PATH);
    revalidatePath(`/layiheler/${slug}`);
    revalidatePublicContent("project", slug);
    return success("Layihə yeniləndi.");
  } catch (error) {
    return unexpected("layihə yenilənmədi", error);
  }
}

export async function deleteProject(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROJECT_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { name: true, slug: true },
    });

    await recordAudit(user, "DELETE", "Project", id, project.name);
    revalidatePath(LIST_PATH);
    revalidatePath(`/layiheler/${project.slug}`);
    revalidatePublicContent("project", project.slug);
    return success("Layihə silindi.");
  } catch (error) {
    return unexpected("layihə silinmədi", error);
  }
}

export async function restoreProject(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.PROJECT_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: { deletedAt: null },
      select: { name: true },
    });

    await recordAudit(user, "RESTORE", "Project", id, project.name);
    revalidatePath(LIST_PATH);
    revalidatePublicContent("project");
    return success("Layihə bərpa edildi.");
  } catch (error) {
    return unexpected("layihə bərpa edilmədi", error);
  }
}
