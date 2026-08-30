"use server";

import { revalidatePath } from "next/cache";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";
import { AI_CONTENT_DRAFT_STATUSES, PERMISSIONS } from "@/lib/constants";
import { createPhase2AiResponse, parseAiJson } from "@/lib/openai-phase2";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/config/site";

type DescriptionOutput = { title?: string; description: string; highlights?: string[] };
type PhotoOutput = { images: Array<{ id: string; score: number; issues: string[] }> };

async function guard() {
  try { return await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE); }
  catch (error) { if (error instanceof AdminGuardError) return failure(error.message); throw error; }
}

export async function generatePropertyDescription(_previous: ActionState, formData: FormData): Promise<ActionState> {
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
      currentTitle: property.title, listingType: property.listingType, propertyType: property.type.name,
      city: property.city.name, district: property.district?.name, address: property.address,
      price: property.price, currency: property.currency, rooms: property.rooms, bedrooms: property.bedrooms,
      bathrooms: property.bathrooms, area: property.area, landArea: property.landArea, floor: property.floor,
      totalFloors: property.totalFloors, renovation: property.renovation, documentStatus: property.documentStatus,
      features: property.features.map((item) => item.feature.name),
    };
    const response = await createPhase2AiResponse({
      userId: actor.id,
      instructions: "Sən daşınmaz əmlak redaktorusan. Yalnız verilmiş faktlardan istifadə et, heç bir imkan, lokasiya üstünlüyü və ya hüquqi iddia uydurma. Cavabı yalnız etibarlı JSON kimi qaytar: {\"title\":string,\"description\":string,\"highlights\":string[]}. Mətn peşəkar, aydın və seçilmiş dildə olsun.",
      text: `Dil: ${locale}. Elan faktları: ${JSON.stringify(facts)}`,
    });
    const output = parseAiJson<DescriptionOutput>(response.text);
    if (!output.description?.trim()) return failure("AI cavabında təsvir yoxdur.");
    const draft = await prisma.aiContentDraft.create({
      data: { propertyId, requestedById: actor.id, locale, inputJson: JSON.stringify(facts), outputJson: JSON.stringify(output), provider: "openai", model: response.model },
    });
    await recordAudit(actor, "CREATE", "Property", propertyId, `AI mətn qaralaması: ${draft.id}`);
    revalidatePath("/admin/ai-komekci");
    return success("AI təsvir qaralaması yaradıldı. Dərc etməzdən əvvəl yoxlayın.");
  } catch (error) { return unexpected("AI təsvir yaradılmadı", error, error instanceof Error ? error.message : undefined); }
}

export async function analyzePropertyPhotos(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await guard();
  if ("status" in actor) return actor;
  const propertyId = form.text(formData, "propertyId");
  if (!propertyId) return failure("Elan seçin.");
  try {
    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { title: true, images: { orderBy: { order: "asc" }, take: 12, select: { id: true, url: true } } } });
    if (!property || property.images.length === 0) return failure("Elanın analiz ediləcək şəkli yoxdur.");
    const imageUrls = property.images.map((image) => image.url.startsWith("http") ? image.url : siteUrl(image.url));
    const response = await createPhase2AiResponse({
      userId: actor.id,
      instructions: "Daşınmaz əmlak foto keyfiyyəti məsləhətçisisən. Hər şəkli texniki və təqdimat keyfiyyətinə görə 0-100 qiymətləndir. Obyektin özünü dəyişdirməyi təklif etmə; işıq, kadr, bulanıqlıq, şaquli xətlər, məxfilik və təkrarı qeyd et. Şəkillər giriş sırasındadır. Yalnız JSON qaytar: {\"images\":[{\"id\":string,\"score\":number,\"issues\":string[]}]}",
      text: `Elan: ${property.title}. Şəkil ID-ləri sıra ilə: ${property.images.map((image) => image.id).join(", ")}`,
      imageUrls,
    });
    const output = parseAiJson<PhotoOutput>(response.text);
    const allowed = new Set(property.images.map((image) => image.id));
    for (const result of output.images ?? []) {
      if (!allowed.has(result.id)) continue;
      const score = Math.max(0, Math.min(100, Math.round(Number(result.score) || 0)));
      const issues = Array.isArray(result.issues) ? result.issues.filter((issue) => typeof issue === "string").slice(0, 12) : [];
      await prisma.propertyImage.update({ where: { id: result.id }, data: { qualityScore: score, qualityIssues: JSON.stringify(issues), analyzedAt: new Date() } });
    }
    await prisma.aiContentDraft.create({ data: { propertyId, requestedById: actor.id, inputJson: JSON.stringify({ imageIds: property.images.map((image) => image.id) }), outputJson: JSON.stringify(output), provider: "openai", model: response.model } });
    await recordAudit(actor, "UPDATE", "Property", propertyId, "AI foto keyfiyyəti analizi");
    revalidatePath("/admin/ai-komekci");
    return success("Foto analizi tamamlandı.");
  } catch (error) { return unexpected("AI foto analizi tamamlanmadı", error, error instanceof Error ? error.message : undefined); }
}

export async function applyDescriptionDraft(id: string): Promise<ActionState> {
  const actor = await guard();
  if ("status" in actor) return actor;
  try {
    const draft = await prisma.aiContentDraft.findFirst({ where: { id, status: AI_CONTENT_DRAFT_STATUSES.DRAFT, propertyId: { not: null } } });
    if (!draft?.propertyId) return failure("Qaralama tapılmadı və ya artıq işlənib.");
    const output = parseAiJson<DescriptionOutput>(draft.outputJson);
    if (!output.description?.trim()) return failure("Qaralamada təsvir yoxdur.");
    const property = await prisma.property.update({ where: { id: draft.propertyId }, data: { description: output.description.trim(), ...(output.title?.trim() ? { title: output.title.trim() } : {}) }, select: { slug: true } });
    await prisma.aiContentDraft.update({ where: { id }, data: { status: AI_CONTENT_DRAFT_STATUSES.APPLIED, appliedAt: new Date() } });
    await recordAudit(actor, "UPDATE", "Property", draft.propertyId, `AI qaralaması insan təsdiqi ilə tətbiq edildi: ${id}`);
    revalidatePath("/admin/ai-komekci"); revalidatePath(`/emlaklar/${property.slug}`);
    return success("Qaralama elana tətbiq edildi.");
  } catch (error) { return unexpected("AI qaralaması tətbiq edilmədi", error); }
}
