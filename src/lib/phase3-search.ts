import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkAiSearchLimit, clientIp } from "@/lib/auth/rate-limit";
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

/**
 * Sorğudan çıxarılan rəqəmi sxem diapazonuna salır.
 *
 * `criteriaSchema` yuxarı hədlər qoyur (otaq ≤ 20, sahə ≤ 100 000, qiymət ≤ 1e9).
 * Sorğudakı rəqəm həmin həddi aşanda `parse()` istisna atırdı — «50 otaq» və ya
 * «min 200000 m2» kimi adi yazılış fallback-i sındırırdı. İndi dəyər yuxarı həddə
 * sıxılır; aşağı həddən kiçik və ya rəqəm olmayan dəyər isə tamamilə atılır,
 * çünki onu yuxarı çəkmək istifadəçinin demədiyi meyar uydurmaq olardı.
 */
function withinRange(value: number | undefined, min: number, max: number): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value < min) return undefined;
  return Math.min(value, max);
}

/**
 * Workers AI olmadıqda axtarışı işlək saxlayan, qəsdən konservativ parser.
 *
 * **İstisna atmamalıdır.** Həm model xətasının, həm də kvota limitinin düşdüyü
 * yoldur; burada atılan istisna `parseQuery()`-dən keçib səhifə xətasına çevrilir,
 * yəni «zərif deqradasiya» əvəzinə istifadəçi 500 görür. Dəyərlər əvvəlcə sxem
 * diapazonuna salınır, sonra `safeParse()` son qoruyucu kimi işləyir: gözlənilməz
 * hal boş meyar dəstinə düşür, sorğu isə yenə cavab verir.
 */
export function parseSearchFallback(query: string): AiSearchCriteria {
  const normalized = normalizeSearchText(query);
  const price = normalized.match(/([\d][\d\s.,]*)\s*(?:azn|manat|₼)/i)
    ?? normalized.match(/(?:qeder|qədər|maksimum|max|under|do)\s*([\d][\d\s.,]*)/i);
  const room = normalized.match(/(\d{1,2})\s*(?:otaq|room|komnat)/i);
  const area = normalized.match(/(?:minimum|min|en azi|ən az)\s*(\d+)\s*(?:m2|m²|kv)/i);
  const numericPrice = price ? Number(price[1].replace(/[\s,.]/g, "")) : undefined;
  const criteria = criteriaSchema.safeParse(compact({
    listingType: /kiraye|icar[eə]|rent|arenda/.test(normalized) ? "RENT" : /sat[iı][sş]|buy|sale/.test(normalized) ? "SALE" : undefined,
    maxPrice: withinRange(numericPrice, 1, 1_000_000_000),
    rooms: withinRange(room ? Number(room[1]) : undefined, 1, 20),
    minArea: withinRange(area ? Number(area[1]) : undefined, 1, 100_000),
    featureSlugs: [
      /parking|qaraj|parkinq/.test(normalized) ? "parking" : "",
      /hovuz|pool|basseyn/.test(normalized) ? "hovuz" : "",
      /deniz|dəniz|sea|more/.test(normalized) ? "denize-yaxin" : "",
    ].filter(Boolean),
    // Tək söz 80 simvoldan uzun ola bilər (məs. yapışmış URL) — sxem onu da rədd edirdi.
    semanticTerms: normalized
      .split(/\s+/)
      .filter((term) => term.length > 3)
      .slice(0, 8)
      .map((term) => term.slice(0, 80)),
  }));

  // Son qoruyucu literal-dır, `criteriaSchema.parse({})` deyil: sxem gələcəkdə
  // məcburi sahə qazansa, parse-a qayıtmaq eyni istisnanı geri gətirərdi.
  return criteria.success ? criteria.data : { featureSlugs: [], semanticTerms: [] };
}

/**
 * Kvota qapısı — model çağırışından **əvvəl**.
 *
 * Səhifə anonimdir və `force-dynamic`-dir, yəni hər `?q=` dəyəri yeni inference
 * deməkdir. Limit aşılanda sorğu xəta vermir, deterministik parser-ə düşür:
 * axtarış işləməyə davam edir, provayder büdcəsi isə qorunur.
 *
 * İki xəta halı qəsdən fərqli həll olunur:
 *
 * - **Sorğu konteksti yoxdur** (`headers()` atır — build, unit test): limit tətbiq
 *   edilmir, çünki sayılacaq sorğu da yoxdur. Layihənin qalan limitləri ilə eyni.
 * - **Limiter özü atır** (binding nasazlığı, konfiqurasiya xətası): deterministik
 *   parser-ə düşürük. Burada fail-open etmək müdafiəni məhz sorğuların sayıla
 *   bilmədiyi anda söndürərdi — yəni kvota ən çox risk altında olanda.
 *
 * Binding-in **yoxluğu** xəta deyil: `checkAiSearchLimit()` onu lokal `next dev`
 * halı kimi qəbul edib `true` qaytarır.
 */
async function aiBudgetAvailable(): Promise<boolean> {
  let ip: string;
  try {
    ip = clientIp(await headers());
  } catch {
    return true;
  }

  try {
    return await checkAiSearchLimit(ip);
  } catch (error) {
    console.error("[ai-search] sürət limiti yoxlanmadı:", error);
    return false;
  }
}

async function parseQuery(query: string): Promise<{ criteria: AiSearchCriteria; model: string }> {
  // Taksonomiya sorğuları yalnız model çağırılacaqsa lazımdır.
  if (!(await aiBudgetAvailable())) {
    return { criteria: parseSearchFallback(query), model: "deterministic-fallback" };
  }

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
  type: { slug: string }; city: { slug: string }; district: { slug: string; parent?: { slug: string } | null } | null;
  features: Array<{ feature: { slug: string } }>;
}, criteria: AiSearchCriteria) {
  const checks: Array<{ active: boolean; matched: boolean; reason: string }> = [
    { active: Boolean(criteria.listingType), matched: property.listingType === criteria.listingType, reason: "Elan növü uyğundur" },
    { active: Boolean(criteria.typeSlug), matched: property.type.slug === criteria.typeSlug, reason: "Əmlak növü uyğundur" },
    { active: Boolean(criteria.citySlug), matched: property.city.slug === criteria.citySlug, reason: "Şəhər uyğundur" },
    { active: Boolean(criteria.districtSlug), matched: property.district?.slug === criteria.districtSlug || property.district?.parent?.slug === criteria.districtSlug, reason: "Rayon uyğundur" },
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
        await publicPropertyWhere(),
        criteria.listingType ? { listingType: criteria.listingType } : {},
        criteria.maxPrice !== undefined ? { price: { lte: criteria.maxPrice * 1.15 } } : {},
        criteria.minPrice !== undefined ? { price: { gte: criteria.minPrice * 0.85 } } : {},
        criteria.citySlug ? { city: { slug: criteria.citySlug } } : {},
        criteria.typeSlug ? { type: { slug: criteria.typeSlug } } : {},
        terms.length ? { OR: terms.flatMap((term) => [{ searchText: { contains: term } }, { description: { contains: term } }]) } : {},
      ],
    },
    select: {
      ...propertyCardSelect,
      // Qəsəbədəki elan rayon meyarına da uyğun sayılır (#85) — kataloq filtri ilə eyni.
      district: { select: { name: true, slug: true, parent: { select: { slug: true } } } },
      features: { select: { feature: { select: { slug: true } } } },
    },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: 36,
  });
  const items = candidates.map((property) => {
    const match = scoreProperty(property, criteria);
    const card = { ...property };
    delete (card as Partial<typeof property>).features;
    return { property: card, ...match };
  }).sort((a, b) => b.score - a.score).slice(0, 12);
  return { query, criteria, model, items, clarification: criteria.clarification };
}
