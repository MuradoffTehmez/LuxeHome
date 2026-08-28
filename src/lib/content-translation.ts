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
  } else {
    set("description", translation.content);
  }
  return translated as T;
}
