import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/constants";
import type { PropertyFilters } from "@/lib/queries";
import type { SeoLanding } from "@/lib/seo-landings";

function parseArray<T>(value: string, guard: (item: unknown) => item is T): T[] {
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter(guard) : []; }
  catch { return []; }
}

export async function getPublishedDbSeoLanding(slug: string, locale: Locale): Promise<{ landing: SeoLanding; policy: { indexable: boolean; indexEmpty: boolean; minInventory: number; canonical: string | null } } | null> {
  const row = await prisma.seoLandingPage.findFirst({ where: { slug, locale, status: "PUBLISHED" } });
  if (!row) return null;
  let filters: PropertyFilters;
  try { const parsed: unknown = JSON.parse(row.filtersJson); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null; filters = parsed as PropertyFilters; }
  catch { return null; }
  const faq = parseArray(row.faqJson, (item): item is { question: string; answer: string } => Boolean(item && typeof item === "object" && typeof (item as Record<string, unknown>).question === "string" && typeof (item as Record<string, unknown>).answer === "string"));
  const relatedPaths = parseArray(row.relatedPathsJson, (item): item is string => typeof item === "string" && item.startsWith("/"));
  const content = [row.introContent, row.bottomContent].filter((value): value is string => Boolean(value)).flatMap((value) => value.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean));
  return {
    landing: { slug: row.slug, path: `/${row.slug}`, title: row.title, description: row.description, h1: row.h1, overline: row.name, filters, content, faq, relatedPaths },
    policy: { indexable: row.indexable, indexEmpty: row.indexEmpty, minInventory: row.minInventory, canonical: row.canonical },
  };
}

