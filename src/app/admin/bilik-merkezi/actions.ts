"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KNOWLEDGE_STATUSES, PERMISSIONS } from "@/lib/constants";
import { readingMinutes } from "@/lib/utils";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { sanitizeRichText, stripTags } from "@/lib/admin/html";
import { parseSingleImage } from "@/lib/admin/images";
import {
  knowledgeArticleSchema,
  knowledgeCategorySchema,
  knowledgeFaqSchema,
  knowledgeTermSchema,
} from "@/lib/admin/schemas";
import { uniqueSlug } from "@/lib/admin/slug";
import { ensureSlugRedirect } from "@/lib/admin/slug-redirect";
import * as form from "@/lib/admin/form";
import { normalizeSearchText } from "@/lib/search-normalization";
import { knowledgeSearchText, termInitial } from "@/lib/knowledge";
import { revalidatePublicContent } from "@/lib/revalidate-public";

/**
 * Bilik Mərkəzinin idarəsi.
 *
 * Bələdçi mətni və termin izahı zəngin HTML-dir və ictimai səhifədə
 * `dangerouslySetInnerHTML` ilə verilir. Ona görə mətn **yazılmadan əvvəl**
 * `sanitizeRichText()`-dən keçir — bloq modulundakı ilə eyni invariant.
 *
 * Hər action öz guard-ını ilk sətirdə çağırır: server action-ları
 * `admin/layout.tsx`-dən keçmir və birbaşa POST ilə çağırıla bilir.
 */

const LIST_PATH = "/admin/bilik-merkezi";
const CATEGORIES_PATH = "/admin/bilik-merkezi/kateqoriyalar";
const TERMS_PATH = "/admin/bilik-merkezi/lugat";
const FAQ_PATH = "/admin/bilik-merkezi/suallar";

async function guard() {
  return requireAdminAction(PERMISSIONS.KNOWLEDGE_MANAGE);
}

function readArticleForm(formData: FormData) {
  return {
    title: form.text(formData, "title"),
    slug: form.text(formData, "slug"),
    excerpt: form.text(formData, "excerpt"),
    content: form.text(formData, "content"),
    coverAlt: form.optionalText(formData, "coverAlt"),
    categoryId: form.optionalText(formData, "categoryId"),
    audience: form.text(formData, "audience"),
    level: form.text(formData, "level"),
    status: form.text(formData, "status"),
    isFeatured: form.boolean(formData, "isFeatured"),
    legalStatus: form.text(formData, "legalStatus"),
    riskLevel: form.text(formData, "riskLevel"),
    jurisdiction: form.text(formData, "jurisdiction"),
    legalReviewedAt: form.date(formData, "legalReviewedAt"),
    legalActs: form.lines(formData, "legalActs"),
    sourceUrls: form.lines(formData, "sourceUrls"),
    legalBasis: form.optionalText(formData, "legalBasis"),
    requiredDocuments: form.optionalText(formData, "requiredDocuments"),
    procedure: form.optionalText(formData, "procedure"),
    duration: form.optionalText(formData, "duration"),
    costs: form.optionalText(formData, "costs"),
    risks: form.optionalText(formData, "risks"),
    checklist: form.optionalText(formData, "checklist"),
    template: form.optionalText(formData, "template"),
    courtPosition: form.optionalText(formData, "courtPosition"),
    metaTitle: form.optionalText(formData, "metaTitle"),
    metaDescription: form.optionalText(formData, "metaDescription"),
    noIndex: form.boolean(formData, "noIndex"),
    canonicalUrl: form.optionalText(formData, "canonicalUrl"),
    ogTitle: form.optionalText(formData, "ogTitle"),
    ogDescription: form.optionalText(formData, "ogDescription"),
    ogImage: form.optionalText(formData, "ogImage"),
  };
}

async function sanitizeOptional(value: string | null): Promise<string | null> {
  return value ? sanitizeRichText(value) : null;
}

async function legalArticleData(data: ReturnType<typeof readArticleForm> & {
  legalActs: string[];
  sourceUrls: string[];
}) {
  return {
    legalStatus: data.legalStatus,
    riskLevel: data.riskLevel,
    jurisdiction: data.jurisdiction,
    legalReviewedAt: data.legalReviewedAt,
    legalActs: form.jsonArray(data.legalActs),
    sourceUrls: form.jsonArray(data.sourceUrls),
    legalBasis: await sanitizeOptional(data.legalBasis),
    requiredDocuments: await sanitizeOptional(data.requiredDocuments),
    procedure: await sanitizeOptional(data.procedure),
    duration: await sanitizeOptional(data.duration),
    costs: await sanitizeOptional(data.costs),
    risks: await sanitizeOptional(data.risks),
    checklist: await sanitizeOptional(data.checklist),
    template: await sanitizeOptional(data.template),
    courtPosition: await sanitizeOptional(data.courtPosition),
  };
}

// ---------------------------------------------------------------------------
// BƏLƏDÇİLƏR
// ---------------------------------------------------------------------------

export async function createKnowledgeArticle(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await guard();
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = knowledgeArticleSchema.safeParse(readArticleForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  let articleId: string;
  try {
    const content = await sanitizeRichText(parsed.data.content);
    const cover = parseSingleImage(formData, "cover");
    const slug = await uniqueSlug(parsed.data.slug || parsed.data.title, (candidate) =>
      prisma.knowledgeArticle.findUnique({ where: { slug: candidate }, select: { id: true } }),
    );

    const article = await prisma.knowledgeArticle.create({
      data: {
        title: parsed.data.title,
        slug,
        searchText: knowledgeSearchText(parsed.data),
        excerpt: parsed.data.excerpt,
        content,
        coverUrl: cover?.url ?? null,
        coverAlt: cover?.alt || parsed.data.coverAlt || "",
        categoryId: parsed.data.categoryId,
        audience: parsed.data.audience,
        level: parsed.data.level,
        status: parsed.data.status,
        isFeatured: parsed.data.isFeatured,
        ...(await legalArticleData(parsed.data)),
        isDemo: false,
        readMinutes: readingMinutes(stripTags(content)),
        authorId: user.id,
        publishedAt: parsed.data.status === KNOWLEDGE_STATUSES.PUBLISHED ? new Date() : null,
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
    articleId = article.id;
    await recordAudit(user, "CREATE", "KnowledgeArticle", articleId, parsed.data.title);
  } catch (error) {
    return unexpected("bələdçi yaradıla bilmədi", error);
  }

  revalidatePath(LIST_PATH);
  revalidatePublicContent("knowledge");
  redirect(`${LIST_PATH}/${articleId}`);
}

export async function updateKnowledgeArticle(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await guard();
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  if (!id) return failure("Bələdçi tapılmadı.");

  const parsed = knowledgeArticleSchema.safeParse(readArticleForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, publishedAt: true, coverUrl: true, slug: true },
    });
    if (!existing) return failure("Bələdçi tapılmadı və ya silinib.");

    const content = await sanitizeRichText(parsed.data.content);
    const cover = parseSingleImage(formData, "cover");
    const slug = await uniqueSlug(
      parsed.data.slug || parsed.data.title,
      (candidate) =>
        prisma.knowledgeArticle.findUnique({ where: { slug: candidate }, select: { id: true } }),
      id,
    );

    await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        title: parsed.data.title,
        slug,
        searchText: knowledgeSearchText(parsed.data),
        excerpt: parsed.data.excerpt,
        content,
        coverUrl: cover?.url ?? null,
        coverAlt: cover?.alt || parsed.data.coverAlt || "",
        categoryId: parsed.data.categoryId,
        audience: parsed.data.audience,
        level: parsed.data.level,
        status: parsed.data.status,
        isFeatured: parsed.data.isFeatured,
        ...(await legalArticleData(parsed.data)),
        readMinutes: readingMinutes(stripTags(content)),
        // Dərc tarixi bir dəfə qoyulur: sonradan qaralamaya çevrilsə də ilk
        // dərc anı struktur datada saxlanılmalıdır.
        publishedAt:
          parsed.data.status === KNOWLEDGE_STATUSES.PUBLISHED
            ? (existing.publishedAt ?? new Date())
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

    await ensureSlugRedirect("/bilik-merkezi", existing.slug, slug, user);
    await recordAudit(user, "UPDATE", "KnowledgeArticle", id, parsed.data.title);
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}`);
    revalidatePublicContent("knowledge", slug);
    if (existing.slug !== slug) revalidatePublicContent("knowledge", existing.slug);
    return success("Bələdçi yeniləndi.");
  } catch (error) {
    return unexpected("bələdçi yenilənmədi", error);
  }
}

export async function deleteKnowledgeArticle(id: string): Promise<ActionState> {
  let user;
  try {
    user = await guard();
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const article = await prisma.knowledgeArticle.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, title: true, slug: true },
    });
    if (!article) return failure("Bələdçi tapılmadı.");

    // Soft-delete: ictimai sorğular `deletedAt: null` şərtindən keçir, ona görə
    // qeyd dərhal saytdan çıxır, lakin audit izi və keçmiş link qorunur.
    await prisma.knowledgeArticle.update({ where: { id }, data: { deletedAt: new Date() } });
    await recordAudit(user, "DELETE", "KnowledgeArticle", id, article.title);

    revalidatePath(LIST_PATH);
    revalidatePublicContent("knowledge", article.slug);
    return success("Bələdçi silindi.");
  } catch (error) {
    return unexpected("bələdçi silinmədi", error);
  }
}

// ---------------------------------------------------------------------------
// KATEQORİYALAR
// ---------------------------------------------------------------------------

export async function saveKnowledgeCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await guard();
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.optionalText(formData, "id");
  const parsed = knowledgeCategorySchema.safeParse({
    name: form.text(formData, "name"),
    slug: form.text(formData, "slug"),
    description: form.text(formData, "description"),
    icon: form.optionalText(formData, "icon"),
    order: form.integer(formData, "order") ?? 0,
    isActive: form.boolean(formData, "isActive"),
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    const slug = await uniqueSlug(
      parsed.data.slug || parsed.data.name,
      (candidate) =>
        prisma.knowledgeCategory.findUnique({ where: { slug: candidate }, select: { id: true } }),
      id ?? undefined,
    );

    const data = {
      name: parsed.data.name,
      slug,
      searchName: normalizeSearchText(parsed.data.name),
      description: parsed.data.description,
      icon: parsed.data.icon,
      order: parsed.data.order,
      isActive: parsed.data.isActive,
    };

    const saved = id
      ? await prisma.knowledgeCategory.update({ where: { id }, data, select: { id: true } })
      : await prisma.knowledgeCategory.create({ data, select: { id: true } });

    await recordAudit(
      user,
      id ? "UPDATE" : "CREATE",
      "KnowledgeCategory",
      saved.id,
      parsed.data.name,
    );
    revalidatePath(CATEGORIES_PATH);
    revalidatePublicContent("knowledge");
    return success(id ? "Kateqoriya yeniləndi." : "Kateqoriya yaradıldı.");
  } catch (error) {
    return unexpected("kateqoriya yadda saxlanmadı", error);
  }
}

export async function deleteKnowledgeCategory(id: string): Promise<ActionState> {
  let user;
  try {
    user = await guard();
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const category = await prisma.knowledgeCategory.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!category) return failure("Kateqoriya tapılmadı.");

    // Bələdçi və terminlər silinmir — `onDelete: SetNull` ilə kateqoriyasız qalır.
    await prisma.knowledgeCategory.delete({ where: { id } });
    await recordAudit(user, "DELETE", "KnowledgeCategory", id, category.name);

    revalidatePath(CATEGORIES_PATH);
    revalidatePublicContent("knowledge");
    return success("Kateqoriya silindi.");
  } catch (error) {
    return unexpected("kateqoriya silinmədi", error);
  }
}

// ---------------------------------------------------------------------------
// LÜĞƏT
// ---------------------------------------------------------------------------

export async function saveKnowledgeTerm(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    user = await guard();
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.optionalText(formData, "id");
  const parsed = knowledgeTermSchema.safeParse({
    term: form.text(formData, "term"),
    slug: form.text(formData, "slug"),
    shortDefinition: form.text(formData, "shortDefinition"),
    definition: form.optionalText(formData, "definition"),
    categoryId: form.optionalText(formData, "categoryId"),
    status: form.text(formData, "status"),
    order: form.integer(formData, "order") ?? 0,
    relatedSlugs: form.lines(formData, "relatedSlugs"),
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    const slug = await uniqueSlug(
      parsed.data.slug || parsed.data.term,
      (candidate) =>
        prisma.knowledgeTerm.findUnique({ where: { slug: candidate }, select: { id: true } }),
      id ?? undefined,
    );

    const data = {
      term: parsed.data.term,
      slug,
      searchName: normalizeSearchText(parsed.data.term),
      shortDefinition: parsed.data.shortDefinition,
      definition: parsed.data.definition
        ? await sanitizeRichText(parsed.data.definition)
        : null,
      initial: termInitial(parsed.data.term),
      categoryId: parsed.data.categoryId,
      status: parsed.data.status,
      order: parsed.data.order,
      relatedSlugs: form.jsonArray(parsed.data.relatedSlugs),
    };

    const saved = id
      ? await prisma.knowledgeTerm.update({ where: { id }, data, select: { id: true } })
      : await prisma.knowledgeTerm.create({ data, select: { id: true } });

    await recordAudit(user, id ? "UPDATE" : "CREATE", "KnowledgeTerm", saved.id, parsed.data.term);
    revalidatePath(TERMS_PATH);
    revalidatePublicContent("knowledge");
    return success(id ? "Termin yeniləndi." : "Termin əlavə olundu.");
  } catch (error) {
    return unexpected("termin yadda saxlanmadı", error);
  }
}

export async function deleteKnowledgeTerm(id: string): Promise<ActionState> {
  let user;
  try {
    user = await guard();
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const term = await prisma.knowledgeTerm.findUnique({
      where: { id },
      select: { id: true, term: true },
    });
    if (!term) return failure("Termin tapılmadı.");

    await prisma.knowledgeTerm.delete({ where: { id } });
    await recordAudit(user, "DELETE", "KnowledgeTerm", id, term.term);

    revalidatePath(TERMS_PATH);
    revalidatePublicContent("knowledge");
    return success("Termin silindi.");
  } catch (error) {
    return unexpected("termin silinmədi", error);
  }
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export async function saveFaqEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await guard();
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.optionalText(formData, "id");
  const parsed = knowledgeFaqSchema.safeParse({
    question: form.text(formData, "question"),
    answer: form.text(formData, "answer"),
    category: form.text(formData, "category"),
    status: form.text(formData, "status"),
    order: form.integer(formData, "order") ?? 0,
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    const data = {
      question: parsed.data.question,
      answer: await sanitizeRichText(parsed.data.answer),
      category: parsed.data.category,
      status: parsed.data.status,
      order: parsed.data.order,
    };

    const saved = id
      ? await prisma.knowledgeFaq.update({ where: { id }, data, select: { id: true } })
      : await prisma.knowledgeFaq.create({ data, select: { id: true } });

    await recordAudit(user, id ? "UPDATE" : "CREATE", "KnowledgeFaq", saved.id, parsed.data.question);
    revalidatePath(FAQ_PATH);
    revalidatePublicContent("knowledge");
    return success(id ? "Sual yeniləndi." : "Sual əlavə olundu.");
  } catch (error) {
    return unexpected("sual yadda saxlanmadı", error);
  }
}

export async function deleteFaqEntry(id: string): Promise<ActionState> {
  let user;
  try {
    user = await guard();
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const entry = await prisma.knowledgeFaq.findUnique({
      where: { id },
      select: { id: true, question: true },
    });
    if (!entry) return failure("Sual tapılmadı.");

    await prisma.knowledgeFaq.delete({ where: { id } });
    await recordAudit(user, "DELETE", "KnowledgeFaq", id, entry.question);

    revalidatePath(FAQ_PATH);
    revalidatePublicContent("knowledge");
    return success("Sual silindi.");
  } catch (error) {
    return unexpected("sual silinmədi", error);
  }
}
