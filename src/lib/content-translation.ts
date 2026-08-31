import type { ContentTranslation } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_LOCALE,
  TRANSLATION_ENTITY_TYPES,
  TRANSLATION_STATUSES,
  type Locale,
  type TranslationEntityType,
} from "@/lib/constants";

export async function getPublishedContentTranslation(
  entityType: TranslationEntityType,
  entityId: string,
  locale: Locale,
) {
  if (locale === DEFAULT_LOCALE) return null;
  return prisma.contentTranslation.findUnique({
    where: { entityType_entityId_locale: { entityType, entityId, locale } },
  }).then((translation) =>
    translation?.status === TRANSLATION_STATUSES.PUBLISHED ? translation : null,
  );
}

/**
 * Siyahılar üçün toplu variant.
 *
 * `getPublishedContentTranslation()` hər element üçün ayrıca `findUnique` atır;
 * 50 elementlik FAQ siyahısı EN/RU-da 50 D1 gediş-gəlişi demək idi. Burada eyni
 * nəticə tək `findMany` ilə alınır və `Map` şəklində qaytarılır.
 */
export async function getPublishedContentTranslations(
  entityType: TranslationEntityType,
  entityIds: readonly string[],
  locale: Locale,
): Promise<Map<string, ContentTranslation>> {
  if (locale === DEFAULT_LOCALE || entityIds.length === 0) return new Map();

  const rows = await prisma.contentTranslation.findMany({
    where: {
      entityType,
      locale,
      status: TRANSLATION_STATUSES.PUBLISHED,
      entityId: { in: [...entityIds] },
    },
  });

  return new Map(rows.map((row) => [row.entityId, row]));
}

/** Boş tərcümə sahəsi mənbə AZ məzmununa təhlükəsiz fallback edir. */
export function applyContentTranslation<T extends object>(
  entityType: TranslationEntityType,
  source: T,
  translation: Awaited<ReturnType<typeof getPublishedContentTranslation>>,
): T {
  if (!translation) return source;
  const record = source as T & Record<string, unknown>;
  const translated: Record<string, unknown> = { ...record };
  const set = (key: string, value: string | null) => {
    if (value?.trim()) translated[key] = value.trim();
  };

  set("title", translation.title);
  set("metaTitle", translation.metaTitle);
  set("metaDescription", translation.metaDescription);
  if (entityType === TRANSLATION_ENTITY_TYPES.PROJECT) {
    set("name", translation.title);
    set("summary", translation.summary);
    set("description", translation.content);
  } else if (entityType === TRANSLATION_ENTITY_TYPES.SERVICE) {
    set("shortDescription", translation.summary);
    set("description", translation.content);
  } else if (entityType === TRANSLATION_ENTITY_TYPES.BLOG_POST) {
    set("excerpt", translation.summary);
    set("content", translation.content);
  } else if (entityType === TRANSLATION_ENTITY_TYPES.KNOWLEDGE_ARTICLE) {
    set("excerpt", translation.summary);
    set("content", translation.content);
  } else if (entityType === TRANSLATION_ENTITY_TYPES.KNOWLEDGE_TERM) {
    // Termində «title» = termin adının özüdür; qısa tərif summary, geniş izah content.
    set("term", translation.title);
    set("shortDefinition", translation.summary);
    set("definition", translation.content);
  } else if (entityType === TRANSLATION_ENTITY_TYPES.KNOWLEDGE_FAQ) {
    set("question", translation.title);
    set("answer", translation.content);
  } else {
    set("description", translation.content);
  }
  return translated as T;
}
