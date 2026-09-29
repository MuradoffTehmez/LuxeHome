import { normalizeSearchText } from "./search-normalization";

/**
 * Bilik Mərkəzinin Prisma-sız mətn köməkçiləri — axtarış indeksi və tag-lar.
 *
 * Ayrıca modul saxlanılır ki, həm server action-ları (`knowledge.ts` vasitəsilə),
 * həm də `prisma/build-knowledge-guides-sql.ts` generatoru eyni indeksi qursun:
 * miqrasiya ilə gələn bələdçinin `searchText`-i paneldə saxlananla eyni olmalıdır.
 */

/**
 * Bələdçinin registrsiz/diakritiksiz axtarış indeksi.
 *
 * Başlıq və xülasədən əlavə məzmun, tag-lar, kateqoriya adı və hüquqi bloklar da
 * indeksə düşür — oxucu «kupça» yazanda sözü yalnız mətnin içində keçən bələdçini
 * də tapmalıdır. HTML teqləri atılır, mətn `normalizeSearchText()` ilə sabitlənir.
 */
export function knowledgeSearchText(input: {
  title: string;
  excerpt: string;
  content?: string | null;
  tags?: readonly string[] | null;
  categoryName?: string | null;
  extra?: ReadonlyArray<string | null | undefined>;
}): string {
  const parts = [
    input.title,
    input.excerpt,
    ...(input.tags ?? []),
    input.categoryName ?? "",
    ...(input.extra ?? []).map((value) => value ?? ""),
    input.content ?? "",
  ];
  return normalizeSearchText(
    parts
      .join(" ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&amp;|&quot;|&#39;|&lt;|&gt;/g, " "),
  );
}

/** Axtarış sorğusunu sözlərə bölür; hər söz ayrıca `contains` şərti olur (AND). */
export function knowledgeSearchTokens(search: string | undefined): string[] {
  if (!search?.trim()) return [];
  return [...new Set(normalizeSearchText(search).split(" ").filter((token) => token.length > 1))].slice(0, 8);
}

/**
 * Tag-ın URL formasını verir (`?teq=ilkin-odenis`): «İlkin ödəniş» və «ilkin odenis»
 * eyni tag-dır. Bazada isə oxunaqlı ad saxlanılır ki, diakritika itməsin.
 */
export function knowledgeTagSlug(value: string): string {
  return normalizeSearchText(value).replace(/ /g, "-").slice(0, 48);
}

/** Tag-ları təmizləyir: boşluqlar sıxılır, slug üzrə təkrarlar atılır, ən çox 20. */
export function cleanKnowledgeTags(values: readonly string[]): string[] {
  const bySlug = new Map<string, string>();
  for (const value of values) {
    const label = value.replace(/\s+/g, " ").trim().slice(0, 48);
    const slug = knowledgeTagSlug(label);
    if (slug.length >= 2 && !bySlug.has(slug)) bySlug.set(slug, label);
  }
  return [...bySlug.values()].slice(0, 20);
}

export function parseKnowledgeTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? cleanKnowledgeTags(parsed.filter((item): item is string => typeof item === "string"))
      : [];
  } catch {
    return [];
  }
}
