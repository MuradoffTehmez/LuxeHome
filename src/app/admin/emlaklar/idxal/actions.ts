"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, PROPERTY_STATUSES } from "@/lib/constants";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { uniqueSlug } from "@/lib/admin/slug";
import { propertyData, propertyLifecycleData } from "@/lib/admin/property-input";
import { paymentFlagsFromFeatures } from "@/lib/admin/payment-features";
import { parseCsv } from "@/lib/admin/csv";
import {
  IMPORT_BATCH_SIZE,
  importRowKey,
  mapImportRows,
  type ImportIssue,
  type ImportLookups,
  type ImportRow,
} from "@/lib/admin/property-import";
import { putImage } from "@/lib/media/storage";
import { readLimited } from "@/lib/read-limited";
import { MAX_UPLOAD_SIZE } from "@/lib/constants";
import { propertyRetentionDays } from "@/lib/property-publish-validation";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { msg } from "@/lib/admin/server-message";

/**
 * CSV ilə toplu elan idxalı (#103).
 *
 * İki addım: `previewPropertyImport` faylı yoxlayır və heç nə yazmır;
 * `commitPropertyImport` isə client-in göndərdiyi sətir nömrələrini **partiyalarla**
 * (`IMPORT_BATCH_SIZE`) yaradır. Fayl hər dəfə yenidən oxunub yoxlanır — client-in
 * «bu sətir düzgündür» iddiasına güvənilmir.
 *
 * Təkrar göndərmə təhlükəsizdir: eyni başlıq + şəhər + qiymətlə silinməmiş elan
 * varsa sətir «dublikat» kimi buraxılır, ona görə yarımçıq qalan idxal yenidən
 * işə salına bilər. Elanlar həmişə qaralama yaranır.
 */

const MAX_CSV_BYTES = 900 * 1024;
const IMAGE_FETCH_TIMEOUT_MS = 15_000;

export type ImportPreviewRow = {
  line: number;
  title: string;
  imageCount: number;
  errors: ImportIssue[];
};

export type ImportPreviewResult =
  | { ok: true; headerErrors: ImportIssue[]; rows: ImportPreviewRow[] }
  | { ok: false; error: string };

export type ImportCommitRow = {
  line: number;
  status: "created" | "resumed" | "duplicate" | "invalid" | "failed";
  propertyId?: string;
  imagesSaved?: number;
  imagesFailed?: number;
};

export type ImportCommitResult =
  | { ok: true; rows: ImportCommitRow[] }
  | { ok: false; error: string };

async function guard() {
  try {
    return { user: await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE) };
  } catch (error) {
    if (error instanceof AdminGuardError) return { error: error.message };
    throw error;
  }
}

async function loadLookups(): Promise<ImportLookups> {
  // Yerləşmə ağacı ~700 sətirdir: nested relation əvəzinə düz sorğu (D1 100 parametr limiti).
  const [types, locations, features] = await Promise.all([
    prisma.propertyType.findMany({ select: { id: true, slug: true, name: true } }),
    prisma.location.findMany({ select: { id: true, slug: true, name: true, kind: true, parentId: true } }),
    prisma.feature.findMany({ select: { id: true, slug: true, name: true } }),
  ]);
  const parents = new Map(locations.map((location) => [location.id, location.parentId]));
  return {
    types,
    features,
    locations: locations.map((location) => ({
      ...location,
      parent: location.parentId ? { parentId: parents.get(location.parentId) ?? null } : null,
    })),
  };
}

function readTable(csv: string): string[][] | null {
  if (new TextEncoder().encode(csv).byteLength > MAX_CSV_BYTES) return null;
  return parseCsv(csv);
}

type ExistingState =
  | { kind: "complete" }
  | { kind: "incomplete"; id: string };

/**
 * Sətrin bazadakı vəziyyəti.
 *
 * - Eyni `importKey` və `importCompletedAt` dolu → tam idxal olunub, dublikat.
 * - Eyni `importKey`, marker boş, hələ qaralama → yarımçıq idxal, **davam etdirilir**.
 *   Redaktor qaralamanı artıq dərc edibsə toxunulmur (dublikat sayılır).
 * - Açar yoxdur, amma eyni başlıq + şəhər + qiymətlə elan var (əl ilə yaradılıb) → dublikat.
 */
async function existingState(row: ImportRow, key: string | null): Promise<ExistingState | null> {
  if (!row.input || !key) return null;
  const imported = await prisma.property.findFirst({
    where: { deletedAt: null, importKey: key },
    select: { id: true, status: true, importCompletedAt: true },
  });
  if (imported) {
    return imported.importCompletedAt || imported.status !== PROPERTY_STATUSES.DRAFT
      ? { kind: "complete" }
      : { kind: "incomplete", id: imported.id };
  }
  const manual = await prisma.property.findFirst({
    where: { deletedAt: null, title: row.input.title, cityId: row.input.cityId, price: row.input.price },
    select: { id: true },
  });
  return manual ? { kind: "complete" } : null;
}

export async function previewPropertyImport(csv: string): Promise<ImportPreviewResult> {
  const access = await guard();
  if ("error" in access) return { ok: false, error: access.error ?? msg("server.common.unexpected") };

  const table = readTable(csv);
  if (!table) return { ok: false, error: msg("server.propertyImport.fileTooLarge") };

  const parsed = mapImportRows(table, await loadLookups());
  const rows: ImportPreviewRow[] = [];
  for (const row of parsed.rows) {
    const errors = [...row.errors];
    const state = await existingState(row, await importRowKey(row));
    if (state?.kind === "complete") errors.push({ code: "duplicate" });
    rows.push({ line: row.line, title: row.title, imageCount: row.images.length, errors });
  }
  return { ok: true, headerErrors: parsed.headerErrors, rows };
}

/** Kənar şəkli yükləyir və media kitabxanasına (R2 + `Media`) salır. */
async function importImage(url: string, title: string, uploaderId: string): Promise<string | null> {
  try {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS) });
    if (!response.ok) return null;
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAX_UPLOAD_SIZE) return null;
    // Başlıq olmaya və ya yalan ola bilər — limit axın oxunarkən tətbiq olunur ki,
    // böyük fayl Worker yaddaşını doldurmasın.
    const bytes = await readLimited(response, MAX_UPLOAD_SIZE);
    if (!bytes) return null;
    const name = new URL(url).pathname.split("/").pop() || "image";
    // Tip və ölçü yoxlaması (magic byte) `putImage` içindədir — cavab başlığına güvənilmir.
    const result = await putImage(new File([bytes], name.slice(0, 120)), "emlaklar", title);
    if (!result.ok) return null;
    await prisma.media.create({
      data: {
        url: result.url,
        thumbUrl: result.thumbUrl,
        originalName: name.slice(0, 160),
        mimeType: result.mimeType,
        size: result.size,
        width: result.width ?? null,
        height: result.height ?? null,
        uploaderId,
        checksum: result.checksum,
        watermarkApplied: result.watermarkApplied,
      },
    });
    return result.url;
  } catch (error) {
    console.error("[idxal] şəkil yüklənmədi:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function commitPropertyImport(csv: string, lines: number[]): Promise<ImportCommitResult> {
  const access = await guard();
  if ("error" in access) return { ok: false, error: access.error ?? msg("server.common.unexpected") };
  const { user } = access;

  const wanted = new Set(lines.slice(0, IMPORT_BATCH_SIZE));
  const table = readTable(csv);
  if (!table) return { ok: false, error: msg("server.propertyImport.fileTooLarge") };

  const parsed = mapImportRows(table, await loadLookups());
  if (parsed.headerErrors.length > 0) return { ok: false, error: msg("server.propertyImport.invalidFile") };

  const retentionDays = await propertyRetentionDays();
  const results: ImportCommitRow[] = [];
  for (const row of parsed.rows) {
    if (!wanted.has(row.line)) continue;
    if (!row.input) {
      results.push({ line: row.line, status: "invalid" });
      continue;
    }
    try {
      const input = row.input;
      const key = await importRowKey(row);
      const state = await existingState(row, key);
      if (state?.kind === "complete") {
        results.push({ line: row.line, status: "duplicate" });
        continue;
      }
      const resumed = state?.kind === "incomplete";

      const propertyId = resumed
        ? state.id
        : (await prisma.property.create({
            data: {
              ...propertyData(input, await paymentFlagsFromFeatures(input.featureIds)),
              slug: await uniqueSlug(input.title, (candidate) =>
                prisma.property.findUnique({ where: { slug: candidate }, select: { id: true } }),
              ),
              authorId: user.id,
              isDemo: false,
              importKey: key,
              ...propertyLifecycleData(PROPERTY_STATUSES.DRAFT, { publishedAt: null }, retentionDays),
            },
            select: { id: true },
          })).id;

      // Davam etdirmədə əvvəlki cəhdin yarımçıq qalereyası atılır və yenidən qurulur —
      // hansı şəklin yazılıb-yazılmadığını təxmin etməkdən etibarlıdır. Media kitabxanası
      // sətirləri qalır (başqa elanda da işlənə bilər).
      if (resumed) await prisma.propertyImage.deleteMany({ where: { propertyId } });
      const linked = resumed
        ? new Set((await prisma.propertyFeature.findMany({ where: { propertyId }, select: { featureId: true } })).map((item) => item.featureId))
        : new Set<string>();
      for (const featureId of input.featureIds) {
        if (linked.has(featureId)) continue;
        await prisma.propertyFeature.create({ data: { propertyId, featureId } });
      }

      // Tək şəklin yüklənməməsi (kənar server, format) sətri dayandırmır — say hesabatda görünür.
      let saved = 0;
      for (const url of row.images) {
        const stored = await importImage(url, input.title, user.id);
        if (!stored) continue;
        await prisma.propertyImage.create({
          data: { propertyId, url: stored, alt: input.title, order: saved, isCover: saved === 0 },
        });
        saved += 1;
      }

      // Marker ən sonda yazılır: bundan əvvəlki istənilən xəta sətri «yarımçıq» saxlayır.
      await prisma.property.update({ where: { id: propertyId }, data: { importCompletedAt: new Date() } });
      await recordAudit(user, resumed ? "UPDATE" : "CREATE", "Property", propertyId, `CSV: ${input.title}`);
      results.push({
        line: row.line,
        status: resumed ? "resumed" : "created",
        propertyId,
        imagesSaved: saved,
        imagesFailed: row.images.length - saved,
      });
    } catch (error) {
      console.error(`[idxal] sətir ${row.line} yaradılmadı:`, error);
      results.push({ line: row.line, status: "failed" });
    }
  }

  if (results.some((row) => row.status === "created" || row.status === "resumed")) {
    revalidatePath("/admin/emlaklar");
    // Qaralama ictimai sayta düşmür, amma say keşləri (kateqoriya sayları) təzələnir.
    revalidatePublicContent("property");
  }
  return { ok: true, rows: results };
}
