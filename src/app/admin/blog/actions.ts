"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, POST_STATUSES } from "@/lib/constants";
import { readingMinutes, truncate } from "@/lib/utils";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { sanitizeRichText, stripTags } from "@/lib/admin/html";
import { parseSingleImage } from "@/lib/admin/images";
import { blogCategorySchema, postSchema } from "@/lib/admin/schemas";
import { uniqueSlug } from "@/lib/admin/slug";
import * as form from "@/lib/admin/form";

/**
 * Bloq idarəsi.
 *
 * Məqalə mətni zəngin HTML-dir və ictimai səhifədə `dangerouslySetInnerHTML` ilə
 * verilir. Ona görə mətn **yazılmadan əvvəl** `sanitizeRichText()`-dən keçir:
 * bazadakı dəyər həmişə təhlükəsizdir və göstərmə anında əlavə emal tələb etmir.
 */

const LIST_PATH = "/admin/blog";

export async function createPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.BLOG_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = postSchema.safeParse({
    title: form.text(formData, "title"),
    slug: form.text(formData, "slug"),
    excerpt: form.text(formData, "excerpt"),
    content: form.text(formData, "content"),
    coverAlt: form.optionalText(formData, "coverAlt"),
    categoryId: form.optionalText(formData, "categoryId"),
    status: form.text(formData, "status"),
    metaTitle: form.optionalText(formData, "metaTitle"),
    metaDescription: form.optionalText(formData, "metaDescription"),
    noIndex: form.boolean(formData, "noIndex"),
    canonicalUrl: form.optionalText(formData, "canonicalUrl"),
    ogTitle: form.optionalText(formData, "ogTitle"),
    ogDescription: form.optionalText(formData, "ogDescription"),
    ogImage: form.optionalText(formData, "ogImage"),
  });
  if (!parsed.success) return invalid(parsed.error);

  let postId: string;

  try {
    const content = await sanitizeRichText(parsed.data.content);
    const cover = parseSingleImage(formData, "cover");

    const slug = await uniqueSlug(parsed.data.slug || parsed.data.title, (candidate) =>
      prisma.blogPost.findUnique({ where: { slug: candidate }, select: { id: true } }),
    );

    const post = await prisma.blogPost.create({
      data: {
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt,
        content,
        coverUrl: cover?.url ?? null,
        coverAlt: cover?.alt || parsed.data.coverAlt || "",
        categoryId: parsed.data.categoryId,
        status: parsed.data.status,
        authorId: user.id,
        isDemo: false,
        readMinutes: readingMinutes(stripTags(content)),
        publishedAt: parsed.data.status === POST_STATUSES.PUBLISHED ? new Date() : null,
        metaTitle: parsed.data.metaTitle,
        metaDescription: parsed.data.metaDescription,
        noIndex: parsed.data.noIndex,
        canonicalUrl: parsed.data.canonicalUrl,
        ogTitle: parsed.data.ogTitle,
        ogDescription: parsed.data.ogDescription,
        ogImage: parsed.data.ogImage,
      },
      select: { id: true },
    });
    postId = post.id;

    await recordAudit(user, "CREATE", "BlogPost", postId, parsed.data.title);
  } catch (error) {
    return unexpected("məqalə yaradıla bilmədi", error);
  }

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}/${postId}`);
}

export async function updatePost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.BLOG_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  if (!id) return failure("Məqalə tapılmadı.");

  const parsed = postSchema.safeParse({
    title: form.text(formData, "title"),
    slug: form.text(formData, "slug"),
    excerpt: form.text(formData, "excerpt"),
    content: form.text(formData, "content"),
    coverAlt: form.optionalText(formData, "coverAlt"),
    categoryId: form.optionalText(formData, "categoryId"),
    status: form.text(formData, "status"),
    metaTitle: form.optionalText(formData, "metaTitle"),
    metaDescription: form.optionalText(formData, "metaDescription"),
    noIndex: form.boolean(formData, "noIndex"),
    canonicalUrl: form.optionalText(formData, "canonicalUrl"),
    ogTitle: form.optionalText(formData, "ogTitle"),
    ogDescription: form.optionalText(formData, "ogDescription"),
    ogImage: form.optionalText(formData, "ogImage"),
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    const existing = await prisma.blogPost.findFirst({
      where: { id, deletedAt: null },
      select: { publishedAt: true },
    });
    if (!existing) return failure("Məqalə tapılmadı və ya silinib.");

    const content = await sanitizeRichText(parsed.data.content);
    const cover = parseSingleImage(formData, "cover");

    const slug = await uniqueSlug(
      parsed.data.slug || parsed.data.title,
      (candidate) => prisma.blogPost.findUnique({ where: { slug: candidate }, select: { id: true } }),
      id,
    );

    await prisma.blogPost.update({
      where: { id },
      data: {
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt,
        content,
        coverUrl: cover?.url ?? null,
        coverAlt: cover?.alt || parsed.data.coverAlt || "",
        categoryId: parsed.data.categoryId,
        status: parsed.data.status,
        readMinutes: readingMinutes(stripTags(content)),
        // Dərc tarixi bir dəfə qoyulur — arxivləmə onu silmir
        publishedAt:
          parsed.data.status === POST_STATUSES.PUBLISHED && !existing.publishedAt
            ? new Date()
            : existing.publishedAt,
        metaTitle: parsed.data.metaTitle,
        metaDescription: parsed.data.metaDescription,
        noIndex: parsed.data.noIndex,
        canonicalUrl: parsed.data.canonicalUrl,
        ogTitle: parsed.data.ogTitle,
        ogDescription: parsed.data.ogDescription,
        ogImage: parsed.data.ogImage,
      },
    });

    await recordAudit(user, "UPDATE", "BlogPost", id, parsed.data.title);
    revalidatePath(LIST_PATH);
    revalidatePath(`/blog/${slug}`);
    return success("Məqalə yeniləndi.");
  } catch (error) {
    return unexpected("məqalə yenilənmədi", error);
  }
}

export async function deletePost(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.BLOG_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { title: true, slug: true },
    });

    await recordAudit(user, "DELETE", "BlogPost", id, post.title);
    revalidatePath(LIST_PATH);
    revalidatePath(`/blog/${post.slug}`);
    return success("Məqalə silindi.");
  } catch (error) {
    return unexpected("məqalə silinmədi", error);
  }
}

export async function restorePost(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.BLOG_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data: { deletedAt: null },
      select: { title: true },
    });

    await recordAudit(user, "RESTORE", "BlogPost", id, post.title);
    revalidatePath(LIST_PATH);
    return success("Məqalə bərpa edildi.");
  } catch (error) {
    return unexpected("məqalə bərpa edilmədi", error);
  }
}

// ---------------------------------------------------------------------------
// KATEQORİYALAR
// ---------------------------------------------------------------------------

export async function saveBlogCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.BLOG_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  const parsed = blogCategorySchema.safeParse({
    name: form.text(formData, "name"),
    slug: form.text(formData, "slug"),
    description: form.optionalText(formData, "description"),
    order: form.integer(formData, "order") ?? 0,
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    const slug = await uniqueSlug(
      parsed.data.slug || parsed.data.name,
      (candidate) =>
        prisma.blogCategory.findUnique({ where: { slug: candidate }, select: { id: true } }),
      id || undefined,
    );

    const data = { ...parsed.data, slug };

    if (id) {
      await prisma.blogCategory.update({ where: { id }, data });
      await recordAudit(user, "UPDATE", "BlogCategory", id, parsed.data.name);
    } else {
      const created = await prisma.blogCategory.create({ data, select: { id: true } });
      await recordAudit(user, "CREATE", "BlogCategory", created.id, parsed.data.name);
    }

    revalidatePath("/admin/blog/kateqoriyalar");
    revalidatePath("/blog");
    return success(id ? "Kateqoriya yeniləndi." : "Kateqoriya yaradıldı.");
  } catch (error) {
    return unexpected("kateqoriya saxlanılmadı", error);
  }
}

/**
 * Kateqoriyanın silinməsi.
 *
 * Sxemdə əlaqə `onDelete: SetNull`-dur: kateqoriya silinsə, məqalələr qalır və
 * kateqoriyasız olur. Redaktora bunun neçə məqaləyə toxunacağı bildirilir.
 */
export async function deleteBlogCategory(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.BLOG_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const category = await prisma.blogCategory.delete({
      where: { id },
      select: { name: true },
    });

    await recordAudit(user, "DELETE", "BlogCategory", id, category.name);
    revalidatePath("/admin/blog/kateqoriyalar");
    revalidatePath("/blog");
    return success(`«${truncate(category.name, 40)}» kateqoriyası silindi.`);
  } catch (error) {
    return unexpected("kateqoriya silinmədi", error);
  }
}
