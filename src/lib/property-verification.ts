import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  DOCUMENT_STATUSES,
  PROPERTY_DOCUMENT_MAX_BYTES,
  PROPERTY_DOCUMENT_MAX_FILES,
  PROPERTY_DOCUMENT_RETENTION_DAYS,
  PROPERTY_DOCUMENT_STATUSES,
  type VerificationBadge,
} from "@/lib/constants";
import { deletePrivateImage, putPrivateImage } from "@/lib/media/storage";

/**
 * Əmlak və profil doğrulaması (#256, PRD Modul 17).
 *
 * Nişanlar ayrı yoxlama səviyyələridir (PRD 19.3): telefon və e-poçt hesabın, agentlik nişanı agentlik
 * məlumatlarının, «Sənədlər yoxlanılıb» və «Məlumatlar yoxlanılıb» isə elanın moderator yoxlamasıdır.
 * Telefon təsdiqi əmlakın hüquqi vəziyyətini təsdiqləmir — UI hər nişanın mənasını ayrıca yazır.
 *
 * Sənəd təhlükəsizliyi (PRD 19.4): şəkil R2-nin `private/` prefiksinə yazılır (ictimai `/media` vermir),
 * yalnız `property:manage` moderator görür, hər baxış və qərar `DocumentAccessLog`-a düşür; qərardan
 * `PROPERTY_DOCUMENT_RETENTION_DAYS` sonra fayl silinir. İctimai səhifəyə sənədin özü və növü çıxmır.
 */

const DAY = 86_400_000;

/** Saf: hansı nişanlar göstərilir (sıra sabitdir). */
export function verificationBadges(input: {
  phoneVerified: boolean;
  emailVerified: boolean;
  agencyVerified: boolean;
  documentsVerified: boolean;
  dataVerified: boolean;
}): VerificationBadge[] {
  const badges: VerificationBadge[] = [];
  if (input.phoneVerified) badges.push("PHONE");
  if (input.emailVerified) badges.push("EMAIL");
  if (input.agencyVerified) badges.push("AGENCY");
  if (input.documentsVerified) badges.push("DOCUMENTS");
  if (input.dataVerified) badges.push("DATA");
  return badges;
}

/** Elan detalı üçün nişanlar — yalnız boolean-lar oxunur, şəxsi məlumat (nömrə, e-poçt) seçilmir. */
export async function getListingVerification(propertyId: string): Promise<VerificationBadge[]> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      documentsVerifiedAt: true,
      dataVerifiedAt: true,
      author: { select: { accountType: true, verifiedPhone: true, emailVerifiedAt: true, agency: { select: { isVerified: true } } } },
    },
  });
  if (!property) return [];
  const author = property.author;
  // Şirkət (STAFF) elanında hesab nişanları göstərilmir — elanı ofis yerləşdirib.
  const personal = author && author.accountType !== ACCOUNT_TYPES.STAFF;
  return verificationBadges({
    phoneVerified: Boolean(personal && author?.verifiedPhone),
    emailVerified: Boolean(personal && author?.emailVerifiedAt),
    agencyVerified: Boolean(personal && author?.agency?.isVerified),
    documentsVerified: Boolean(property.documentsVerifiedAt),
    dataVerified: Boolean(property.dataVerifiedAt),
  });
}

export function isDocumentKind(value: unknown): value is string {
  return typeof value === "string" && value !== DOCUMENT_STATUSES.NONE && Object.hasOwn(DOCUMENT_STATUSES, value);
}

export type UploadDocumentResult =
  | { ok: true; count: number }
  | { ok: false; reason: "listing" | "kind" | "empty" | "limit" | "tooLarge" | "unsupported" | "storage" };

/** Sahib öz elanına sənəd şəkli yükləyir (gözləyən sənədlərlə birlikdə ən çox `PROPERTY_DOCUMENT_MAX_FILES`). */
export async function uploadPropertyDocuments(input: { userId: string; propertyId: string; kind: string; files: File[] }): Promise<UploadDocumentResult> {
  const property = await prisma.property.findFirst({ where: { id: input.propertyId, authorId: input.userId, deletedAt: null }, select: { id: true } });
  if (!property) return { ok: false, reason: "listing" };
  if (!isDocumentKind(input.kind)) return { ok: false, reason: "kind" };
  const files = input.files.filter((file) => file.size > 0);
  if (files.length === 0) return { ok: false, reason: "empty" };
  const pending = await prisma.propertyDocument.count({ where: { propertyId: property.id, status: PROPERTY_DOCUMENT_STATUSES.PENDING } });
  if (pending + files.length > PROPERTY_DOCUMENT_MAX_FILES) return { ok: false, reason: "limit" };

  let count = 0;
  for (const file of files) {
    const stored = await putPrivateImage(file, "senedler", PROPERTY_DOCUMENT_MAX_BYTES);
    if (!stored.ok) return count > 0 ? { ok: true, count } : { ok: false, reason: stored.reason === "empty" ? "empty" : stored.reason };
    try {
      await prisma.propertyDocument.create({
        data: { propertyId: property.id, uploaderId: input.userId, kind: input.kind, key: stored.key, contentType: stored.contentType, size: stored.size },
      });
      count += 1;
    } catch (error) {
      // Sətir yazılmadısa fayl yetim qalmasın.
      await deletePrivateImage(stored.key).catch(() => undefined);
      throw error;
    }
  }
  // Yeni sənəd gəlib — əvvəlki «yoxlanılıb» nişanı yeni yoxlamaya qədər qalır (moderator qərarı ayrıca verir).
  return { ok: true, count };
}

/** Sahib gözləyən sənədini geri götürür (fayl dərhal silinir). */
export async function deletePendingDocument(input: { userId: string; documentId: string }): Promise<boolean> {
  const document = await prisma.propertyDocument.findFirst({
    where: { id: input.documentId, uploaderId: input.userId, status: PROPERTY_DOCUMENT_STATUSES.PENDING },
    select: { id: true, key: true, propertyId: true },
  });
  if (!document) return false;
  const { count } = await prisma.propertyDocument.deleteMany({ where: { id: document.id, status: PROPERTY_DOCUMENT_STATUSES.PENDING } });
  if (count === 0) return false;
  await deletePrivateImage(document.key).catch(() => undefined);
  await prisma.documentAccessLog.create({ data: { documentId: document.id, propertyId: document.propertyId, userId: input.userId, action: "DELETE" } });
  return true;
}

/** Moderatorun sənəd faylına girişi — hər baxış tarixçəyə yazılır. */
export async function openDocumentForStaff(input: { documentId: string; staffId: string }) {
  const document = await prisma.propertyDocument.findUnique({ where: { id: input.documentId }, select: { id: true, key: true, contentType: true, propertyId: true } });
  if (!document) return null;
  await prisma.documentAccessLog.create({ data: { documentId: document.id, propertyId: document.propertyId, userId: input.staffId, action: "VIEW" } });
  return document;
}

export type DocumentDecisionResult = { ok: true } | { ok: false; reason: "notFound" | "note" };

/**
 * Moderator qərarı: elanın bütün gözləyən sənədlərini təsdiqləyir və ya rədd edir. Təsdiq elana
 * «Sənədlər yoxlanılıb» nişanını verir, rədd onu götürür (səbəb məcburi). Fayllar saxlama müddətindən sonra silinir.
 */
export async function decideDocuments(input: { staffId: string; propertyId: string; verified: boolean; note?: string | null; now?: Date }): Promise<DocumentDecisionResult> {
  const now = input.now ?? new Date();
  const note = (input.note ?? "").trim().slice(0, 500) || null;
  if (!input.verified && (!note || note.length < 5)) return { ok: false, reason: "note" };
  const pending = await prisma.propertyDocument.findMany({
    where: { propertyId: input.propertyId, status: PROPERTY_DOCUMENT_STATUSES.PENDING },
    select: { id: true },
  });
  if (pending.length === 0) return { ok: false, reason: "notFound" };
  // Kompensasiya üçün nişanın əvvəlki dəyəri (yarımçıq qərarda bərpa olunur).
  const before = await prisma.property.findUnique({ where: { id: input.propertyId }, select: { documentsVerifiedAt: true, documentsVerifiedById: true } });
  const purgeAfter = new Date(now.getTime() + PROPERTY_DOCUMENT_RETENTION_DAYS * DAY);
  const claimed = await prisma.propertyDocument.updateMany({
    where: { id: { in: pending.map((row) => row.id) }, status: PROPERTY_DOCUMENT_STATUSES.PENDING },
    data: {
      status: input.verified ? PROPERTY_DOCUMENT_STATUSES.VERIFIED : PROPERTY_DOCUMENT_STATUSES.REJECTED,
      reviewedById: input.staffId,
      reviewedAt: now,
      note,
      purgeAfter,
    },
  });
  // Eyni anda iki moderator: yalnız sənədləri həqiqətən götürən qərar elanı və tarixçəni yazır.
  if (claimed.count === 0) return { ok: false, reason: "notFound" };
  try {
    await prisma.property.update({
      where: { id: input.propertyId },
      data: input.verified ? { documentsVerifiedAt: now, documentsVerifiedById: input.staffId } : { documentsVerifiedAt: null, documentsVerifiedById: null },
    });
    await prisma.documentAccessLog.createMany({
      data: pending.map((row) => ({ documentId: row.id, propertyId: input.propertyId, userId: input.staffId, action: "DECISION" })),
    });
  } catch (error) {
    // D1-də tranzaksiya yoxdur: nişan və ya tarixçə yazılmasa bu qərarın götürdüyü sənədlər `PENDING`-ə qayıdır
    // və nişan əvvəlki dəyərinə bərpa olunur ki, qərar yenidən verilə bilsin (gözləyən sənəddə «yoxlanılıb» qalmasın).
    if (before) {
      await prisma.property.update({
        where: { id: input.propertyId },
        data: { documentsVerifiedAt: before.documentsVerifiedAt, documentsVerifiedById: before.documentsVerifiedById },
      }).catch(() => undefined);
    }
    await prisma.propertyDocument.updateMany({
      where: { id: { in: pending.map((row) => row.id) }, reviewedById: input.staffId, reviewedAt: now },
      data: { status: PROPERTY_DOCUMENT_STATUSES.PENDING, reviewedById: null, reviewedAt: null, note: null, purgeAfter: null },
    }).catch(() => undefined);
    throw error;
  }
  return { ok: true };
}

/** «Əmlak məlumatları əlavə yoxlamadan keçib» — moderatorun ayrıca qərarı (aç/söndür). */
export async function setDataVerified(input: { staffId: string; propertyId: string; verified: boolean; now?: Date }): Promise<boolean> {
  const { count } = await prisma.property.updateMany({
    where: { id: input.propertyId, deletedAt: null },
    data: input.verified ? { dataVerifiedAt: input.now ?? new Date(), dataVerifiedById: input.staffId } : { dataVerifiedAt: null, dataVerifiedById: null },
  });
  return count > 0;
}

/** Gündəlik baxım: saxlama müddəti bitmiş sənəd faylları silinir (sətir də — giriş tarixçəsi qalır). */
export async function purgeReviewedDocuments(now = new Date()): Promise<number> {
  const expired = await prisma.propertyDocument.findMany({ where: { purgeAfter: { lte: now } }, select: { id: true, key: true }, take: 200 });
  return deleteDocumentFiles(expired);
}

/**
 * Faylı R2-dən silir, yalnız uğurlu olanda sətri silir — keçici R2 xətasında sətir (yeganə açar) qalır və
 * növbəti baxım yenidən sınayır; məxfi şəkil saxlama müddətindən sonra yaddaşda qalmır.
 */
async function deleteDocumentFiles(documents: { id: string; key: string }[]): Promise<number> {
  let deleted = 0;
  for (const document of documents) {
    try {
      await deletePrivateImage(document.key);
    } catch (error) {
      console.error("[documents] fayl silinmədi, növbəti cəhdə qalır:", error instanceof Error ? error.message : error);
      continue;
    }
    await prisma.propertyDocument.deleteMany({ where: { id: document.id } });
    deleted += 1;
  }
  return deleted;
}

/** Hesab silinəndə (#256): istifadəçinin yüklədiyi bütün sənəd faylları və sətirləri. Xəta silinməni saxlayır (retry). */
export async function purgeUserDocuments(userId: string): Promise<void> {
  const documents = await prisma.propertyDocument.findMany({ where: { uploaderId: userId }, select: { id: true, key: true } });
  const deleted = await deleteDocumentFiles(documents);
  if (deleted < documents.length) throw new Error("Sənəd faylları silinmədi.");
}
