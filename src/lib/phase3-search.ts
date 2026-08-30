import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseAiJson, runAiText } from "@/lib/ai";
import { AI_SYSTEM_PROMPTS } from "@/lib/ai-prompts";
import { normalizeSearchText } from "@/lib/search-normalization";
import { propertyCardSelect, publicPropertyWhere } from "@/lib/queries";

const criteriaSchema = z.object({
  listingType: z.enum(["SALE", "RENT"]).optional(),
  typeSlug: z.string().max(80).optional(),
  citySlug: z.string().max(80).optional(),
  districtSlug: z.string().max(80).optional(),
  maxPrice: z.number().nonnegative().max(1_000_000_000).optional(),
  minPrice: z.number().nonnegative().max(1_000_000_000).optional(),
  rooms: z.number().int().min(1).max(20).optional(),
  minArea: z.number().nonnegative().max(100_000).optional(),
  featureSlugs: z.array(z.string().max(80)).max(10).default([]),
  semanticTerms: z.array(z.string().max(80)).max(12).default([]),
  clarification: z.string().max(240).optional(),
});

export type AiSearchCriteria = z.infer<typeof criteriaSchema>;
export type AiSearchResult = Awaited<ReturnType<typeof searchPropertiesWithAi>>;

const guidedSchema = {
  type: "object",
  properties: {
    listingType: { type: "string", enum: ["SALE", "RENT"] },
    typeSlug: { type: "string" }, citySlug: { type: "string" }, districtSlug: { type: "string" },
    maxPrice: { type: "number" }, minPrice: { type: "number" }, rooms: { type: "integer" },
    minArea: { type: "number" }, featureSlugs: { type: "array", items: { type: "string" } },
    semanticTerms: { type: "array", items: { type: "string" } }, clarification: { type: "string" },
  },
  required: ["featureSlugs", "semanticTerms"],
  additionalProperties: false,
} as const;

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== "")) as T;
}

/** Workers AI olmadıqda axtarışı işlək saxlayan, qəsdən konservativ parser. */
export function parseSearchFallback(query: string): AiSearchCriteria {
  const normalized = normalizeSearchText(query);
  const price = normalized.match(/([\d][\d\s.,]*)\s*(?:azn|manat|₼)/i)
    ?? normalized.match(/(?:qeder|qədər|maksimum|max|under|do)\s*([\d][\d\s.,]*)/i);
  const room = normalized.match(/(\d{1,2})\s*(?:otaq|room|komnat)/i);
  const area = normalized.match(/(?:minimum|min|en azi|ən az)\s*(\d+)\s*(?:m2|m²|kv)/i);
  const numericPrice = price ? Number(price[1].replace(/[\s,.]/g, "")) : undefined;
  return criteriaSchema.parse(compact({
    listingType: /kiraye|icar[eə]|rent|arenda/.test(normalized) ? "RENT" : /sat[iı][sş]|buy|sale/.test(normalized) ? "SALE" : undefined,
    maxPrice: numericPrice && numericPrice > 0 ? numericPrice : undefined,
    rooms: room ? Number(room[1]) : undefined,
    minArea: area ? Number(area[1]) : undefined,
    featureSlugs: [
      /parking|qaraj|parkinq/.test(normalized) ? "parking" : "",
      /hovuz|pool|basseyn/.test(normalized) ? "hovuz" : "",
      /deniz|dəniz|sea|more/.test(normalized) ? "denize-yaxin" : "",
    ].filter(Boolean),
    semanticTerms: normalized.split(/\s+/).filter((term) => term.length > 3).slice(0, 8),
  }));
}

async function parseQuery(query: string): Promise<{ criteria: AiSearchCriteria; model: string }> {
  const [types, locations, features] = await Promise.all([
    prisma.propertyType.findMany({ where: { isActive: true }, select: { slug: true, name: true } }),
    prisma.location.findMany({ select: { slug: true, name: true, kind: true } }),
    prisma.feature.findMany({ select: { slug: true, name: true } }),
  ]);
  try {
    const result = await runAiText({
      instructions: AI_SYSTEM_PROMPTS.queryParser,
      prompt: JSON.stringify({ query, taxonomy: { types, locations, features } }),
      jsonSchema: guidedSchema,
      maxTokens: 700,
    });
    return { criteria: criteriaSchema.parse(parseAiJson(result.text)), model: result.model };
  } catch {
    return { criteria: parseSearchFallback(query), model: "deterministic-fallback" };
  }
}

function scoreProperty(property: {
  listingType: string; price: number; rooms: number | null; area: number | null;
  type: { slug: string }; city: { slug: string }; district: { slug: string } | null;
  features: Array<{ feature: { slug: string } }>;
}, criteria: AiSearchCriteria) {
  const checks: Array<{ active: boolean; matched: boolean; reason: string }> = [
    { active: Boolean(criteria.listingType), matched: property.listingType === criteria.listingType, reason: "Elan növü uyğundur" },
    { active: Boolean(criteria.typeSlug), matched: property.type.slug === criteria.typeSlug, reason: "Əmlak növü uyğundur" },
    { active: Boolean(criteria.citySlug), matched: property.city.slug === criteria.citySlug, reason: "Şəhər uyğundur" },
    { active: Boolean(criteria.districtSlug), matched: property.district?.slug === criteria.districtSlug, reason: "Rayon uyğundur" },
    { active: criteria.maxPrice !== undefined, matched: criteria.maxPrice === undefined || property.price <= criteria.maxPrice, reason: "Büdcəyə uyğundur" },
    { active: criteria.minPrice !== undefined, matched: criteria.minPrice === undefined || property.price >= criteria.minPrice, reason: "Minimum qiymət meyarına uyğundur" },
    { active: criteria.rooms !== undefined, matched: criteria.rooms === undefined || property.rooms === criteria.rooms, reason: "Otaq sayı uyğundur" },
    { active: criteria.minArea !== undefined, matched: criteria.minArea === undefined || (property.area ?? 0) >= criteria.minArea, reason: "Sahə meyarına uyğundur" },
    ...criteria.featureSlugs.map((slug) => ({ active: true, matched: property.features.some((item) => item.feature.slug === slug), reason: `${slug} xüsusiyyəti mövcuddur` })),
  ];
  const active = checks.filter((item) => item.active);
  const matched = active.filter((item) => item.matched);
  return { score: active.length ? Math.round((matched.length / active.length) * 100) : 70, reasons: matched.map((item) => item.reason).slice(0, 4) };
}

export async function searchPropertiesWithAi(rawQuery: string) {
  const query = rawQuery.trim().slice(0, 500);
  if (query.length < 3) return { query, criteria: criteriaSchema.parse({}), model: "none", items: [], clarification: undefined };
  const { criteria, model } = await parseQuery(query);
  const terms = criteria.semanticTerms.map(normalizeSearchText).filter(Boolean);
  const candidates = await prisma.property.findMany({
    where: {
      AND: [
        publicPropertyWhere(),
        criteria.listingType ? { listingType: criteria.listingType } : {},
        criteria.maxPrice !== undefined ? { price: { lte: criteria.maxPrice * 1.15 } } : {},
        criteria.minPrice !== undefined ? { price: { gte: criteria.minPrice * 0.85 } } : {},
        criteria.citySlug ? { city: { slug: criteria.citySlug } } : {},
        criteria.typeSlug ? { type: { slug: criteria.typeSlug } } : {},
        terms.length ? { OR: terms.flatMap((term) => [{ searchText: { contains: term } }, { description: { contains: term } }]) } : {},
      ],
    },
    select: { ...propertyCardSelect, features: { select: { feature: { select: { slug: true } } } } },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: 36,
  });
  const items = candidates.map((property) => {
    const match = scoreProperty(property, criteria);
    const { features: _features, ...card } = property;
    return { property: card, ...match };
  }).sort((a, b) => b.score - a.score).slice(0, 12);
  return { query, criteria, model, items, clarification: criteria.clarification };
}
