import { env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";

/**
 * CSV idxalının davametmə məntiqi — real D1 (#103, Codex rəyi).
 *
 * D1-də tranzaksiya yoxdur: əsas qeyd yazılıb şəkil/xüsusiyyət yarımçıq qala bilər.
 * `importCompletedAt` markeri boş olan qaralama təkrar idxalda **dublikat sayılmamalı**,
 * qalereyası yenidən qurulmalıdır. Tam idxal olunmuş və ya redaktorun dərc etdiyi qeyd isə
 * toxunulmaz qalmalıdır.
 */

const uploads = vi.hoisted(() => ({ count: 0 }));

// Orijinal guard `next/navigation`-ı yükləyir, o isə workerd test mühitində işləmir.
vi.mock("@/lib/admin/guard", () => ({
  AdminGuardError: class AdminGuardError extends Error {},
  requireAdminAction: async () => ({ id: "import-admin", email: "admin@luxehomeestate.test", role: "SUPER_ADMIN" }),
}));
vi.mock("@/lib/admin/audit", () => ({ recordAudit: vi.fn(async () => undefined) }));
vi.mock("next/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/cache")>()),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/revalidate-public", () => ({ revalidatePublicContent: vi.fn() }));
vi.mock("@/lib/media/storage", () => ({
  putImage: vi.fn(async () => {
    uploads.count += 1;
    return {
      ok: true,
      key: `emlaklar/test-${uploads.count}.webp`,
      url: `/media/emlaklar/test-${uploads.count}.webp`,
      thumbUrl: `/media/emlaklar/test-${uploads.count}-thumb.webp`,
      mimeType: "image/webp",
      size: 10,
      checksum: `sum-${uploads.count}`,
      watermarkApplied: false,
    };
  }),
}));

import { commitPropertyImport } from "../actions";

const DB = (env as unknown as { DB: D1Database }).DB;

const CSV = [
  "title;description;listing_type;price;type;city;features;images",
  "Davam testi üçün mənzil;Yarımçıq idxalın davam etdirilməsini yoxlayan test sətri.;SALE;150000;test-import-menzil;test-import-baki;test-lift;https://images.example/a.jpg|https://images.example/b.jpg",
].join("\n");

async function propertyRow() {
  return DB.prepare(
    `SELECT "id", "status", "importKey", "importCompletedAt",
       (SELECT COUNT(*) FROM "PropertyImage" i WHERE i."propertyId" = p."id") AS images,
       (SELECT COUNT(*) FROM "PropertyFeature" f WHERE f."propertyId" = p."id") AS features
     FROM "Property" p WHERE p."title" = 'Davam testi üçün mənzil' AND p."deletedAt" IS NULL`,
  ).all<{ id: string; status: string; importKey: string | null; importCompletedAt: string | null; images: number; features: number }>();
}

beforeAll(async () => {
  await DB.batch([
    DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
      .bind("import-admin", "İdxal", "admin@luxehomeestate.test", "disabled", "SUPER_ADMIN"),
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)')
      .bind("import-type", "Mənzillər", "menziller", "test-import-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)')
      .bind("import-city", "Test İdxal Bakı", "test idxal baki", "test-import-baki", LOCATION_KINDS.CITY),
    DB.prepare('INSERT INTO "Feature" ("id", "name", "slug", "group") VALUES (?, ?, ?, ?)')
      .bind("import-lift", "Lift", "test-lift", "BUILDING"),
  ]);
});

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 })));
});

describe("CSV idxalının davam etdirilməsi", () => {
  it("təzə sətri yaradır, marker qoyur, təkrar cəhddə dublikat sayır", async () => {
    const first = await commitPropertyImport(CSV, [2]);
    expect(first).toMatchObject({ ok: true, rows: [{ line: 2, status: "created", imagesSaved: 2 }] });

    const [row] = (await propertyRow()).results;
    expect(row).toMatchObject({ status: PROPERTY_STATUSES.DRAFT, images: 2, features: 1 });
    expect(row.importKey).toMatch(/^[0-9a-f]{64}$/);
    expect(row.importCompletedAt).not.toBeNull();

    const second = await commitPropertyImport(CSV, [2]);
    expect(second).toMatchObject({ ok: true, rows: [{ line: 2, status: "duplicate" }] });
    expect((await propertyRow()).results).toHaveLength(1);
  });

  it("marker boş qalmış yarımçıq qaralamanı yeni qeyd yaratmadan davam etdirir", async () => {
    const [before] = (await propertyRow()).results;
    // Əvvəlki cəhd şəkillərin yalnız birini yazıb dayanıb (xəta simulyasiyası).
    await DB.batch([
      DB.prepare('UPDATE "Property" SET "importCompletedAt" = NULL WHERE "id" = ?').bind(before.id),
      DB.prepare('DELETE FROM "PropertyImage" WHERE "propertyId" = ? AND "order" = 1').bind(before.id),
      DB.prepare('DELETE FROM "PropertyFeature" WHERE "propertyId" = ?').bind(before.id),
    ]);

    const resumed = await commitPropertyImport(CSV, [2]);
    expect(resumed).toMatchObject({ ok: true, rows: [{ line: 2, status: "resumed", propertyId: before.id, imagesSaved: 2 }] });

    const rows = (await propertyRow()).results;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: before.id, images: 2, features: 1 });
    expect(rows[0].importCompletedAt).not.toBeNull();
  });

  it("redaktor dərc edibsə marker boş olsa da qeydə toxunmur", async () => {
    const [before] = (await propertyRow()).results;
    await DB.prepare('UPDATE "Property" SET "importCompletedAt" = NULL, "status" = ? WHERE "id" = ?')
      .bind(PROPERTY_STATUSES.PUBLISHED, before.id)
      .run();

    const result = await commitPropertyImport(CSV, [2]);
    expect(result).toMatchObject({ ok: true, rows: [{ line: 2, status: "duplicate" }] });
    const [after] = (await propertyRow()).results;
    expect(after).toMatchObject({ status: PROPERTY_STATUSES.PUBLISHED, images: 2 });
  });
});
