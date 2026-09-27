import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/prisma";
import { PUBLIC_PROPERTY_STATUSES } from "@/lib/constants";

/**
 * Semantik axtarış (#107): Workers AI embedding + Cloudflare Vectorize.
 *
 * Əvvəlki «semantik» axtarış normallaşdırılmış mətn terminləri ilə leksik idi — «uşaqlı
 * ailə üçün sakit, parka yaxın» kimi sorğu sözlər üst-üstə düşmədikdə heç nə tapmırdı.
 * İndi elan mətni vektora çevrilir və sorğu mənaca ən yaxın elanları qaytarır.
 *
 * - Model çoxdillidir (`bge-m3`) — AZ/RU/EN sorğusu eyni indeksdə işləyir.
 * - İndeksdə ictimai statuslu, silinməmiş elanlar saxlanılır; gizlənən və ya silinən
 *   elan sinxronizasiyada çıxarılır. Demo elanlar da indeksdədir — demo rejiminin
 *   süzgəci sorğu zamanı `publicPropertyWhere()` ilə tətbiq olunur (rejim açarı
 *   dəyişəndə indeksi yenidən qurmaq lazım gəlməsin).
 * - Binding yoxdursa (lokal E2E, `next dev`) funksiyalar `null` qaytarır və axtarış
 *   leksik rejimə düşür — heç bir axın semantik indeksdən asılı deyil.
 */

const EMBEDDING_MODEL = "@cf/baai/bge-m3";
const EMBED_BATCH = 50;
const TEXT_LIMIT = 1500;
/** Bu oxşarlıqdan aşağı nəticə «mənaca uyğun» sayılmır. */
export const MIN_SIMILARITY = 0.45;

type Bindings = { ai: Ai; index: Vectorize };

function bindings(): Bindings | null {
  try {
    const env = getCloudflareContext().env as unknown as { AI?: Ai; PROPERTY_VECTORS?: Vectorize };
    return env.AI && env.PROPERTY_VECTORS ? { ai: env.AI, index: env.PROPERTY_VECTORS } : null;
  } catch {
    return null;
  }
}

export function isSemanticSearchReady(): boolean {
  return bindings() !== null;
}

type EmbeddableProperty = {
  title: string;
  description: string;
  listingType: string;
  rooms: number | null;
  area: number | null;
  address: string | null;
  type: { name: string };
  city: { name: string };
  district: { name: string } | null;
  metro: { name: string } | null;
  features: { feature: { name: string } }[];
};

/** Embedding üçün mətn — axtarışda mənası olan sahələr, sabit ardıcıllıqla. */
export function propertyEmbeddingText(property: EmbeddableProperty): string {
  const parts = [
    property.title,
    property.listingType === "RENT" ? "Kirayə" : "Satış",
    property.type.name,
    [property.district?.name, property.city.name].filter(Boolean).join(", "),
    property.metro ? `Metro ${property.metro.name}` : "",
    property.rooms ? `${property.rooms} otaqlı` : "",
    property.area ? `${Math.round(property.area)} m²` : "",
    property.address ?? "",
    property.features.map((item) => item.feature.name).join(", "),
    property.description,
  ];
  return parts.filter(Boolean).join(". ").replace(/\s+/g, " ").slice(0, TEXT_LIMIT);
}

async function embed(ai: Ai, texts: string[]): Promise<number[][]> {
  const result = (await ai.run(EMBEDDING_MODEL, { text: texts })) as { data?: number[][] };
  if (!result.data || result.data.length !== texts.length) throw new Error("embedding cavabı natamamdır");
  return result.data;
}

const indexedWhere = { deletedAt: null, status: { in: [...PUBLIC_PROPERTY_STATUSES] } };

const embeddableSelect = {
  id: true,
  title: true,
  description: true,
  listingType: true,
  rooms: true,
  area: true,
  address: true,
  type: { select: { name: true } },
  city: { select: { name: true } },
  district: { select: { name: true } },
  metro: { select: { name: true } },
  features: { select: { feature: { select: { name: true } } } },
} as const;

/**
 * Verilən elanların vektorlarını yeniləyir: indeksə açıq olanlar upsert, qalanları silinir.
 * Qaytarılan dəyər — upsert edilmiş vektor sayı (binding yoxdursa `null`).
 */
export async function syncPropertyVectors(ids: string[]): Promise<number | null> {
  const env = bindings();
  if (!env || ids.length === 0) return env ? 0 : null;
  let upserted = 0;
  for (let offset = 0; offset < ids.length; offset += EMBED_BATCH) {
    const chunk = ids.slice(offset, offset + EMBED_BATCH);
    const visible = await prisma.property.findMany({
      where: { ...indexedWhere, id: { in: chunk } },
      select: embeddableSelect,
    });
    const visibleIds = new Set(visible.map((item) => item.id));
    const hidden = chunk.filter((id) => !visibleIds.has(id));
    if (hidden.length) await env.index.deleteByIds(hidden);
    if (visible.length === 0) continue;
    const vectors = await embed(env.ai, visible.map(propertyEmbeddingText));
    await env.index.upsert(visible.map((item, index) => ({ id: item.id, values: vectors[index] })));
    upserted += visible.length;
  }
  return upserted;
}

/**
 * Yazma action-larından çağırılır: sinxronizasiya cavabı gözlətmir (`waitUntil`) və
 * xətası action-u heç vaxt uğursuz etmir — indeks köməkçi səthdir.
 */
export function queuePropertyVectorSync(ids: string[]): void {
  if (ids.length === 0 || !bindings()) return;
  const task = syncPropertyVectors(ids).catch((error) => {
    console.error("[semantic] vektor sinxronizasiyası alınmadı:", error instanceof Error ? error.message : error);
  });
  try {
    getCloudflareContext().ctx.waitUntil(task);
  } catch {
    void task;
  }
}

/** Sorğuya mənaca ən yaxın elanlar: `id → oxşarlıq (0–1)`. Binding yoxdursa `null`. */
export async function semanticPropertyMatches(query: string, topK = 48): Promise<Map<string, number> | null> {
  const env = bindings();
  if (!env) return null;
  try {
    const [vector] = await embed(env.ai, [query.slice(0, 500)]);
    const result = await env.index.query(vector, { topK, returnValues: false, returnMetadata: "none" });
    return new Map(result.matches.filter((match) => match.score >= MIN_SIMILARITY).map((match) => [match.id, match.score]));
  } catch (error) {
    console.error("[semantic] sorğu alınmadı:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Bütün ictimai elanları yenidən indeksləyir (admin düyməsi). */
export async function reindexAllProperties(): Promise<number | null> {
  if (!bindings()) return null;
  const rows = await prisma.property.findMany({ where: indexedWhere, select: { id: true }, orderBy: { id: "asc" } });
  return syncPropertyVectors(rows.map((row) => row.id));
}
