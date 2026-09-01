"use server";

import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";
import { AI_CONTENT_DRAFT_STATUSES, PERMISSIONS } from "@/lib/constants";
import { parseAiJson, runAiText, runAiVision } from "@/lib/ai";
import { AI_SYSTEM_PROMPTS } from "@/lib/ai-prompts";
import { prisma } from "@/lib/prisma";
import { revalidatePublicContent } from "@/lib/revalidate-public";

type DescriptionOutput = { title?: string; description: string; highlights?: string[] };
type PhotoIssue = { score: number; issues: string[] };

/** Model cavabını forma məcbur edən sxem — sərbəst mətn təmizləməkdən etibarlıdır. */
const DESCRIPTION_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    highlights: { type: "array", items: { type: "string" } },
  },
  required: ["description"],
} as const;

/** Bir çağırışda analiz edilən maksimum şəkil — xərci və icra vaxtını məhdudlaşdırır. */
const MAX_ANALYZED_IMAGES = 6;

/**
 * Model çıxışını təsvir qaralamasına çevirir.
 *
 * Sxem prompta verilir və JSON mode ilə məcbur edilir, lakin kiçik modellər bəzən
 * yenə də sərbəst mətn qaytarır. Belə halda cavabı atmaq mənasızdır: mətn faktiki
 * olaraq istənilən təsvirdir və onsuz da qaralama kimi saxlanılır — redaktor
 * dərc etməzdən əvvəl onu nəzərdən keçirir. Ona görə JSON alınmayanda mətnin
 * özü təsvir sayılır.
 */
function toDescriptionOutput(text: string): DescriptionOutput {
  try {
    const parsed = parseAiJson<DescriptionOutput>(text);
    if (parsed.description?.trim()) return parsed;
  } catch {
    // aşağıdakı mətn variantına düşülür
  }

  // Kod bloku qalıqları təmizlənir — mətn birbaşa redaktora göstərilir.
  const plain = text.replace(/```(?:json)?/gi, "").trim();
  return { description: plain };
}

async function guard() {
  try {
    return await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
}

/** Binding/model zəncirini real sorğu ilə yoxlayır; saxta "configured" statusu göstərmir. */
export async function testAiProvider(): Promise<ActionState> {
  const actor = await guard();
  if ("status" in actor) return actor;
  try {
    const response = await runAiText({
      instructions: "Yalnız JSON qaytar. Verilməyən faktı uydurma.",
      prompt: "Sağlıq yoxlaması. {\"ok\":true} qaytar.",
      jsonSchema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false },
      maxTokens: 40,
    });
    const parsed = parseAiJson<{ ok?: boolean }>(response.text);
    if (parsed.ok !== true) return failure("Workers AI cavab verdi, amma sağlıq sxeminə uyğun olmadı.");
    await recordAudit(actor, "TEST", "AiProvider", null, `Workers AI sağlıq yoxlaması: ${response.model}`);
    return success(`Workers AI işləyir: ${response.model}`);
  } catch (error) {
    return unexpected("Workers AI işləmir", error, error instanceof Error ? error.message : undefined);
  }
}

/** Vision modelinə göndərilən şəklin yuxarı həddi — böyük fayl sorğunu uzadır. */
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

/**
 * Elan şəklini bayt massivi kimi oxuyur.
 *
 * Paneldən yüklənən şəkillərin URL-i `/media/<açar>` formatındadır və birbaşa R2
 * binding-indən oxunur: bu, bir şəbəkə gedişini aradan qaldırır və hələ dərc
 * edilməmiş elanın şəkli üçün də işləyir.
 *
 * Bazadakı hər şəkil isə R2-də olmur — stok və nümunə elanlar xarici URL daşıyır
 * (`images.unsplash.com`), R2 custom domeni də mütləq URL verir. Əvvəllər belə
 * şəkillər sadəcə `null` qaytarırdı və foto məsləhətçisi «heç bir şəkil analiz
 * edilə bilmədi» deyirdi. İndi mütləq `https:` URL-lər çəkilir.
 *
 * `http:` və digər sxemlər qəsdən qəbul edilmir, ölçü isə həm başlıqla, həm də
 * faktiki bayt sayı ilə yoxlanılır.
 */
async function readImageBytes(url: string): Promise<Uint8Array | null> {
  if (url.startsWith("/media/")) {
    const bucket = getCloudflareContext().env.MEDIA;
    const object = await bucket?.get(url.slice("/media/".length));
    if (!object) return null;
    return new Uint8Array(await object.arrayBuffer());
  }

  if (!url.startsWith("https://")) return null;

  const response = await fetch(url, { headers: { accept: "image/*" } });
  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) return null;

  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_IMAGE_BYTES) return null;

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) return null;

  return new Uint8Array(buffer);
}

export async function generatePropertyDescription(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await guard();
  if ("status" in actor) return actor;

  const propertyId = form.text(formData, "propertyId");
  const locale = form.text(formData, "locale") || "az";
  if (!propertyId) return failure("Elan seçin.");

  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { type: true, city: true, district: true, features: { include: { feature: true } } },
    });
    if (!property) return failure("Elan tapılmadı.");

    const facts = {
      currentTitle: property.title,
      listingType: property.listingType,
      propertyType: property.type.name,
      city: property.city.name,
      district: property.district?.name,
      address: property.address,
      price: property.price,
      currency: property.currency,
      rooms: property.rooms,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      landArea: property.landArea,
      floor: property.floor,
      totalFloors: property.totalFloors,
      renovation: property.renovation,
      documentStatus: property.documentStatus,
      features: property.features.map((item) => item.feature.name),
    };

    const response = await runAiText({
      instructions: AI_SYSTEM_PROMPTS.description,
      prompt: `Dil: ${locale}. Elan faktları: ${JSON.stringify(facts)}`,
      jsonSchema: DESCRIPTION_SCHEMA,
    });

    const output = toDescriptionOutput(response.text);
    if (!output.description?.trim()) return failure("AI cavabında təsvir yoxdur.");

    const draft = await prisma.aiContentDraft.create({
      data: {
        propertyId,
        requestedById: actor.id,
        locale,
        inputJson: JSON.stringify(facts),
        outputJson: JSON.stringify(output),
        provider: "workers-ai",
        model: response.model,
      },
    });
    await recordAudit(actor, "CREATE", "Property", propertyId, `AI mətn qaralaması: ${draft.id}`);
    revalidatePath("/admin/ai-komekci");
    return success("AI təsvir qaralaması yaradıldı. Dərc etməzdən əvvəl yoxlayın.");
  } catch (error) {
    return unexpected("AI təsvir yaradılmadı", error, error instanceof Error ? error.message : undefined);
  }
}

export async function analyzePropertyPhotos(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await guard();
  if ("status" in actor) return actor;

  const propertyId = form.text(formData, "propertyId");
  if (!propertyId) return failure("Elan seçin.");

  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        title: true,
        images: { orderBy: { order: "asc" }, take: MAX_ANALYZED_IMAGES, select: { id: true, url: true } },
      },
    });
    if (!property || property.images.length === 0) return failure("Elanın analiz ediləcək şəkli yoxdur.");

    // Vision modeli bir çağırışda bir şəkil qəbul edir, ona görə şəkillər bir-bir gedir.
    const results: Array<{ id: string; score: number; issues: string[] }> = [];
    let model = "";
    let unreadable = 0;
    for (const image of property.images) {
      const bytes = await readImageBytes(image.url);
      if (!bytes) {
        unreadable += 1;
        console.error(`[ai] «${image.id}» şəkli oxunmadı: ${image.url}`);
        continue;
      }
      try {
        const response = await runAiVision({
          instructions: AI_SYSTEM_PROMPTS.photoAdvisor,
          prompt: `Elan: ${property.title}. Şəkli qiymətləndir.`,
          image: bytes,
        });
        model = response.model;
        const parsed = parseAiJson<PhotoIssue>(response.text);
        const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
        const issues = Array.isArray(parsed.issues)
          ? parsed.issues.filter((issue) => typeof issue === "string").slice(0, 12)
          : [];
        results.push({ id: image.id, score, issues });
      } catch (error) {
        // Bir şəklin analizi alınmasa qalanları dayandırmır — nəticə qismən olur.
        console.error(`[ai] «${image.id}» şəkli analiz edilmədi:`, error);
      }
    }

    if (results.length === 0) {
      return failure(
        unreadable === property.images.length
          ? "Şəkillər oxunmadı — fayl mənbəyi əlçatan deyil."
          : "Heç bir şəkil analiz edilə bilmədi. AI modeli cavab vermədi.",
      );
    }

    for (const result of results) {
      await prisma.propertyImage.update({
        where: { id: result.id },
        data: {
          qualityScore: result.score,
          qualityIssues: JSON.stringify(result.issues),
          analyzedAt: new Date(),
        },
      });
    }

    await prisma.aiContentDraft.create({
      data: {
        propertyId,
        requestedById: actor.id,
        inputJson: JSON.stringify({ imageIds: results.map((result) => result.id) }),
        outputJson: JSON.stringify({ images: results }),
        provider: "workers-ai",
        model,
      },
    });
    await recordAudit(actor, "UPDATE", "Property", propertyId, "AI foto keyfiyyəti analizi");
    revalidatePath("/admin/ai-komekci");
    return success(`${results.length} şəkil analiz edildi.`);
  } catch (error) {
    return unexpected("AI foto analizi tamamlanmadı", error, error instanceof Error ? error.message : undefined);
  }
}

export async function applyDescriptionDraft(id: string): Promise<ActionState> {
  const actor = await guard();
  if ("status" in actor) return actor;

  try {
    const draft = await prisma.aiContentDraft.findFirst({
      where: { id, status: AI_CONTENT_DRAFT_STATUSES.DRAFT, propertyId: { not: null } },
    });
    if (!draft?.propertyId) return failure("Qaralama tapılmadı və ya artıq işlənib.");

    const output = parseAiJson<DescriptionOutput>(draft.outputJson);
    if (!output.description?.trim()) return failure("Qaralamada təsvir yoxdur.");

    const property = await prisma.property.update({
      where: { id: draft.propertyId },
      data: {
        description: output.description.trim(),
        ...(output.title?.trim() ? { title: output.title.trim() } : {}),
      },
      select: { slug: true },
    });
    await prisma.aiContentDraft.update({
      where: { id },
      data: { status: AI_CONTENT_DRAFT_STATUSES.APPLIED, appliedAt: new Date() },
    });
    await recordAudit(actor, "UPDATE", "Property", draft.propertyId, `AI qaralaması insan təsdiqi ilə tətbiq edildi: ${id}`);
    revalidatePath("/admin/ai-komekci");
    revalidatePublicContent("property", property.slug);
    return success("Qaralama elana tətbiq edildi.");
  } catch (error) {
    return unexpected("AI qaralaması tətbiq edilmədi", error);
  }
}

export async function discardDescriptionDraft(id: string): Promise<ActionState> {
  const actor = await guard();
  if ("status" in actor) return actor;

  try {
    const draft = await prisma.aiContentDraft.findFirst({
      where: { id, status: AI_CONTENT_DRAFT_STATUSES.DRAFT },
      select: { id: true },
    });
    if (!draft) return failure("Qaralama tapılmadı və ya artıq işlənib.");

    await prisma.aiContentDraft.update({
      where: { id },
      data: { status: AI_CONTENT_DRAFT_STATUSES.DISCARDED },
    });
    await recordAudit(actor, "UPDATE", "Property", null, `AI qaralaması rədd edildi: ${id}`);
    revalidatePath("/admin/ai-komekci");
    return success("Qaralama rədd edildi.");
  } catch (error) {
    return unexpected("AI qaralaması rədd edilmədi", error);
  }
}
