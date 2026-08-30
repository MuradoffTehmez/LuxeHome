"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  PERMISSIONS,
  TRANSLATION_ENTITY_TYPES,
  TRANSLATION_STATUSES,
} from "@/lib/constants";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import * as form from "@/lib/admin/form";
import { sanitizeRichText } from "@/lib/admin/html";

const LIST_PATH = "/admin/tercumeler";
const schema = z.object({
  id: z.string().optional(),
  entity: z.string().regex(/^(PROPERTY|PROJECT|SERVICE|BLOG_POST|KNOWLEDGE_ARTICLE|KNOWLEDGE_TERM|KNOWLEDGE_FAQ):[^:]+$/, "Məzmun seçin"),
  locale: z.enum(["en", "ru"]),
  status: z.enum(Object.values(TRANSLATION_STATUSES) as [string, ...string[]]),
  title: z.string().trim().min(2, "Başlıq ən azı 2 simvol olmalıdır").max(240),
  summary: z.string().trim().max(1_000).nullable(),
  content: z.string().trim().max(100_000).nullable(),
  metaTitle: z.string().trim().max(70).nullable(),
  metaDescription: z.string().trim().max(170).nullable(),
});

async function entityExists(type: string, id: string): Promise<boolean> {
  if (type === TRANSLATION_ENTITY_TYPES.PROPERTY) return Boolean(await prisma.property.findFirst({ where: { id, deletedAt: null }, select: { id: true } }));
  if (type === TRANSLATION_ENTITY_TYPES.PROJECT) return Boolean(await prisma.project.findFirst({ where: { id, deletedAt: null }, select: { id: true } }));
  if (type === TRANSLATION_ENTITY_TYPES.SERVICE) return Boolean(await prisma.service.findUnique({ where: { id }, select: { id: true } }));
  if (type === TRANSLATION_ENTITY_TYPES.BLOG_POST) return Boolean(await prisma.blogPost.findFirst({ where: { id, deletedAt: null }, select: { id: true } }));
  if (type === TRANSLATION_ENTITY_TYPES.KNOWLEDGE_ARTICLE) return Boolean(await prisma.knowledgeArticle.findFirst({ where: { id, deletedAt: null }, select: { id: true } }));
  if (type === TRANSLATION_ENTITY_TYPES.KNOWLEDGE_TERM) return Boolean(await prisma.knowledgeTerm.findUnique({ where: { id }, select: { id: true } }));
  if (type === TRANSLATION_ENTITY_TYPES.KNOWLEDGE_FAQ) return Boolean(await prisma.knowledgeFaq.findUnique({ where: { id }, select: { id: true } }));
  return false;
}

export async function saveTranslation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.TRANSLATION_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  const parsed = schema.safeParse({
    id: form.optionalText(formData, "id") ?? undefined,
    entity: form.text(formData, "entity"),
    locale: form.text(formData, "locale"),
    status: form.text(formData, "status"),
    title: form.text(formData, "title"),
    summary: form.optionalText(formData, "summary"),
    content: form.optionalText(formData, "content"),
    metaTitle: form.optionalText(formData, "metaTitle"),
    metaDescription: form.optionalText(formData, "metaDescription"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const [entityType, entityId] = parsed.data.entity.split(":", 2);
  if (!(await entityExists(entityType, entityId))) return failure("Seçilmiş məzmun tapılmadı.");

  try {
    const data = {
      entityType,
      entityId,
      locale: parsed.data.locale,
      status: parsed.data.status,
      title: parsed.data.title,
      summary: parsed.data.summary,
      // Tərcümə kontenti blog/bələdçi/FAQ səhifələrində HTML kimi render olunur.
      // Mənbə kontent kimi bu yol da yazı anında sanitizasiya edilməlidir;
      // əks halda tərcümə redaktoru saxlanmış XSS yarada bilərdi.
      content: parsed.data.content ? await sanitizeRichText(parsed.data.content) : null,
      metaTitle: parsed.data.metaTitle,
      metaDescription: parsed.data.metaDescription,
      updatedById: user.id,
    };
    const saved = await prisma.contentTranslation.upsert({
      where: { entityType_entityId_locale: { entityType, entityId, locale: parsed.data.locale } },
      create: data,
      update: data,
    });
    await recordAudit(user, parsed.data.id ? "UPDATE" : "CREATE", "ContentTranslation", saved.id, `${entityType} · ${parsed.data.locale}`);
    revalidatePath(LIST_PATH);
    revalidatePath("/", "layout");
    return success("Tərcümə yadda saxlanıldı.");
  } catch (error) {
    return unexpected("tərcümə saxlanılmadı", error);
  }
}

export async function deleteTranslation(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.TRANSLATION_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    const deleted = await prisma.contentTranslation.delete({ where: { id } });
    await recordAudit(user, "DELETE", "ContentTranslation", id, `${deleted.entityType} · ${deleted.locale}`);
    revalidatePath(LIST_PATH);
    revalidatePath("/", "layout");
    return success("Tərcümə silindi.");
  } catch (error) {
    return unexpected("tərcümə silinmədi", error);
  }
}
