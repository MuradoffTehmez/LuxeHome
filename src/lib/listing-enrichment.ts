import { getCloudflareContext } from "@opennextjs/cloudflare";
import { parseAiJson, runAiText, runAiVision } from "@/lib/ai";
import { AI_SYSTEM_PROMPTS } from "@/lib/ai-prompts";
import { LOCATION_KINDS } from "@/lib/constants";
import { composeImageAlt, fallbackImageAlt, parseImageRoom, type AltFacts } from "@/lib/image-alt";
import { addressParts } from "@/lib/location-path";
import { readImageBytes } from "@/lib/media/read-image";
import { prisma } from "@/lib/prisma";
import {
  SEO_COPY_SCHEMA,
  fallbackListingSeo,
  fallbackPageSeo,
  sanitizeSeoCopy,
  type ListingSeoFacts,
  type SeoCopy,
} from "@/lib/seo-copy";

/**
 * Elan yazılandan sonra avtomatik SEO və şəkil ALT mətni.
 *
 * İstifadəçi SEO sahəsi yazmır: elan göndərilən (və ya redaktə edilən) kimi
 * faktlardan meta başlıq/təsvir, Open Graph, açar sözlər və sosial paylaşım
 * mətni hazırlanır, boş ALT-lar isə fotoda görünən sahəyə görə doldurulur.
 *
 * - AI (Workers AI) əlçatan deyilsə deterministik mətn yazılır — elan heç vaxt
 *   SEO-suz qalmır.
 * - Redaktorun əl ilə yazdığı SEO sahəsi (`seoGeneratedAt = null`) üzərinə
 *   yazılmır — yalnız boş sahələr doldurulur. Əl ilə yazılmış ALT da toxunulmur.
 * - İş action cavabını gözlətmir (`waitUntil`) və xətası yazmanı sındırmır.
 */

/** Bir işdə vision modelinə göndərilən ən çox şəkil — `waitUntil` vaxtına sığmalıdır. */
const MAX_AI_ALT_IMAGES = 6;

const enrichmentSelect = {
  id: true,
  title: true,
  description: true,
  listingType: true,
  price: true,
  currency: true,
  pricePeriod: true,
  rooms: true,
  area: true,
  landArea: true,
  floor: true,
  totalFloors: true,
  street: true,
  building: true,
  neighborhoodName: true,
  address: true,
  metaTitle: true,
  metaDescription: true,
  ogTitle: true,
  ogDescription: true,
  metaKeywords: true,
  socialText: true,
  seoGeneratedAt: true,
  type: { select: { name: true, slug: true } },
  city: { select: { name: true, slug: true, kind: true } },
  district: {
    select: { name: true, slug: true, kind: true, parent: { select: { name: true, slug: true, kind: true } } },
  },
  features: { select: { feature: { select: { name: true } } } },
  images: { select: { id: true, url: true, thumbUrl: true, alt: true, order: true }, orderBy: { order: "asc" as const } },
} as const;

type EnrichmentProperty = NonNullable<Awaited<ReturnType<typeof loadProperty>>>;

function loadProperty(id: string) {
  return prisma.property.findUnique({ where: { id }, select: enrichmentSelect });
}

export function listingSeoFacts(property: EnrichmentProperty): ListingSeoFacts {
  const district = property.district;
  const parts = addressParts(
    {
      city: property.city,
      district: district ? { ...district, parent: district.parent } : null,
      neighborhoodName: property.neighborhoodName,
    },
    "az",
  );
  return {
    title: property.title,
    description: property.description,
    listingType: property.listingType,
    propertyType: property.type.name,
    place: parts.join(", "),
    placeShort: district ? district.name : property.city.name,
    city: property.city.name,
    price: property.price,
    currency: property.currency,
    pricePeriod: property.pricePeriod,
    rooms: property.rooms,
    area: property.area,
    landArea: property.landArea,
    floor: property.floor,
    totalFloors: property.totalFloors,
    features: property.features.map((item) => item.feature.name),
  };
}

export type GeneratedSeo = { copy: SeoCopy; source: "ai" | "fallback"; model: string | null };

/** AI ilə SEO mətni; alınmasa deterministik ehtiyat. Heç vaxt atmır. */
export async function generateSeoCopy(input: {
  facts: Record<string, unknown>;
  fallback: SeoCopy;
  context: string;
}): Promise<GeneratedSeo> {
  try {
    const response = await runAiText({
      instructions: AI_SYSTEM_PROMPTS.seo,
      prompt: `Dil: az. Kontekst: ${input.context}. INPUT: ${JSON.stringify(input.facts)}`,
      jsonSchema: SEO_COPY_SCHEMA,
      maxTokens: 700,
    });
    const raw = parseAiJson<Partial<Record<keyof SeoCopy, unknown>>>(response.text);
    return { copy: sanitizeSeoCopy(raw, input.fallback), source: "ai", model: response.model };
  } catch (error) {
    console.error("[seo-ai] AI SEO alınmadı, ehtiyat mətn yazılır:", error instanceof Error ? error.message : error);
    return { copy: input.fallback, source: "fallback", model: null };
  }
}

/** Admin forması üçün: başlıq və mətndən (elan deyil) SEO təklifi. */
export function generatePageSeoCopy(input: { seoTitle: string; title: string; body: string; kind: string }) {
  const title = input.seoTitle.trim() || input.title.trim();
  return generateSeoCopy({
    facts: { title, heading: input.title, body: input.body.slice(0, 3000), kind: input.kind },
    fallback: fallbackPageSeo({ title, body: input.body }),
    context: `${input.kind} səhifəsi`,
  });
}

function seoIsEmpty(property: EnrichmentProperty): boolean {
  return ![
    property.metaTitle,
    property.metaDescription,
    property.ogTitle,
    property.ogDescription,
    property.metaKeywords,
    property.socialText,
  ].some((value) => value?.trim());
}

async function enrichSeo(property: EnrichmentProperty, force: boolean): Promise<"generated" | "filled" | "skipped"> {
  const managedAutomatically = force || property.seoGeneratedAt !== null || seoIsEmpty(property);
  const missing = {
    metaTitle: !property.metaTitle?.trim(),
    metaDescription: !property.metaDescription?.trim(),
    ogTitle: !property.ogTitle?.trim(),
    ogDescription: !property.ogDescription?.trim(),
    metaKeywords: !property.metaKeywords?.trim(),
    socialText: !property.socialText?.trim(),
  };
  if (!managedAutomatically && !Object.values(missing).some(Boolean)) return "skipped";

  const facts = listingSeoFacts(property);
  const { copy } = await generateSeoCopy({
    facts: { ...facts, description: facts.description.slice(0, 1500) },
    fallback: fallbackListingSeo(facts),
    context: "əmlak elanı",
  });
  const values = {
    metaTitle: copy.metaTitle,
    metaDescription: copy.metaDescription,
    ogTitle: copy.ogTitle,
    ogDescription: copy.ogDescription,
    metaKeywords: copy.keywords.join(", "),
    socialText: copy.socialText,
  };

  if (managedAutomatically) {
    await prisma.property.update({ where: { id: property.id }, data: { ...values, seoGeneratedAt: new Date() } });
    return "generated";
  }
  // Redaktorun yazdığı sahələr qalır — yalnız boşlar doldurulur.
  const data = Object.fromEntries(
    (Object.keys(values) as Array<keyof typeof values>).filter((key) => missing[key]).map((key) => [key, values[key]]),
  );
  await prisma.property.update({ where: { id: property.id }, data });
  return "filled";
}

function altFacts(property: EnrichmentProperty): AltFacts {
  return {
    listingType: property.listingType,
    typeSlug: property.type.slug,
    typeName: property.type.name,
    rooms: property.rooms,
    place: property.district ?? { ...property.city, kind: property.city.kind || LOCATION_KINDS.CITY },
  };
}

/** Vision modeli fotoda görünən sahəni seçir; alınmasa `null`. */
async function classifyImage(url: string, facts: AltFacts): Promise<ReturnType<typeof parseImageRoom> | null> {
  const bytes = await readImageBytes(url);
  if (!bytes) return null;
  try {
    const response = await runAiVision({
      instructions: AI_SYSTEM_PROMPTS.imageAlt,
      prompt: `Əmlak növü: ${facts.typeName}. Fotoda hansı sahə görünür?`,
      image: bytes,
      maxTokens: 40,
    });
    try {
      return parseImageRoom(parseAiJson<unknown>(response.text));
    } catch {
      return parseImageRoom(response.text);
    }
  } catch (error) {
    console.error("[image-alt] şəkil təsnif edilmədi:", error instanceof Error ? error.message : error);
    return null;
  }
}

async function enrichAlts(property: EnrichmentProperty, force: boolean): Promise<number> {
  const facts = altFacts(property);
  const targets = property.images.filter((image) => force || !image.alt.trim());
  if (targets.length === 0) return 0;

  // Əvvəlcə hamısına dərhal ehtiyat ALT — AI gecikərsə də boş ALT qalmır.
  for (const image of targets) {
    await prisma.propertyImage.update({
      where: { id: image.id },
      data: { alt: fallbackImageAlt(facts, image.order) },
    });
  }

  for (const image of targets.slice(0, MAX_AI_ALT_IMAGES)) {
    const room = await classifyImage(image.thumbUrl || image.url, facts);
    if (!room) continue;
    await prisma.propertyImage.update({
      where: { id: image.id },
      data: { alt: composeImageAlt(facts, room) },
    });
  }
  return targets.length;
}

export type EnrichmentResult = { seo: "generated" | "filled" | "skipped"; alts: number } | null;

/** SEO və ALT-ı indi yaradır (admin düyməsi `force` ilə hamısını yeniləyir). */
export async function enrichListing(
  propertyId: string,
  options: { force?: boolean; seo?: boolean; alts?: boolean } = {},
): Promise<EnrichmentResult> {
  const property = await loadProperty(propertyId);
  if (!property) return null;
  const force = options.force ?? false;
  const seo = options.seo === false ? "skipped" : await enrichSeo(property, force);
  const alts = options.alts === false ? 0 : await enrichAlts(property, force);
  return { seo, alts };
}

/**
 * Yazma action-larından çağırılır: cavabı gözlətmir, xətası action-u sındırmır.
 * Yeni elan yazma yolu əlavə edəndə bunu da çağır (`queuePropertyVectorSync` kimi).
 */
export function queueListingEnrichment(propertyId: string): void {
  const task = enrichListing(propertyId).catch((error) => {
    console.error("[enrichment] elan SEO/ALT yaradılmadı:", error instanceof Error ? error.message : error);
  });
  try {
    getCloudflareContext().ctx.waitUntil(task);
  } catch {
    void task;
  }
}
