import { describe, expect, it, vi } from "vitest";

// `excludeLastFloor` şərti iki sütunu müqayisə etmək üçün `prisma.property.fields`-ə
// toxunur; klient isə Proxy arxasında D1 binding-i axtarır. Bu testin sorğu icrasına
// ehtiyacı yoxdur — yalnız qurulan `where` obyektinin formasını yoxlayır.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { fields: { totalFloors: "__field:totalFloors__" } },
    // `demoWhere()` paneldəki demo açarını oxuyur. Bu testdə rejim bağlıdır,
    // yəni baza şərti həmişə `isDemo: false` daşımalıdır.
    setting: { findUnique: async () => null },
  },
}));

import { buildPropertyWhere } from "../queries";

/**
 * Filtr birləşmə müqaviləsi.
 *
 * Tarixi səbəb: `featureSlugs` bloku `where.AND` sahəsinə birbaşa yazırdı və
 * «son mərtəbə olmasın» şərtini səssizcə silirdi — filtr UI-da aktiv görünürdü,
 * nəticə isə yanlış idi. Müstəqil filtrlərin bir-birini üzərinə yazmadığını
 * yoxlayan testlər burada saxlanılır.
 */

/** `where.AND`-i həmişə massiv kimi oxuyur. */
function andConditions(where: Awaited<ReturnType<typeof buildPropertyWhere>>): unknown[] {
  if (Array.isArray(where.AND)) return where.AND;
  return where.AND ? [where.AND] : [];
}

function hasFeature(conditions: unknown[], slug: string): boolean {
  return conditions.some(
    (condition) =>
      JSON.stringify(condition) ===
      JSON.stringify({ features: { some: { feature: { slug } } } }),
  );
}

describe("buildPropertyWhere — baza şərti", () => {
  it("hər sorğuya ictimai görünürlük şərtini əlavə edir", async () => {
    const where = await buildPropertyWhere({});

    expect(where.deletedAt).toBeNull();
    expect(where.isDemo).toBe(false);
    expect(where.status).toEqual({ in: expect.arrayContaining(["PUBLISHED"]) });
  });
});

describe("buildPropertyWhere — müstəqil filtrlərin birləşməsi", () => {
  it("xüsusiyyət filtri «son mərtəbə olmasın» şərtini silmir", async () => {
    const where = await buildPropertyWhere({
      excludeLastFloor: true,
      featureSlugs: ["hovuz"],
    });

    const conditions = andConditions(where);
    expect(hasFeature(conditions, "hovuz")).toBe(true);
    // Son mərtəbə şərti `totalFloors` müqayisəsi daşıyan OR blokudur
    expect(conditions.some((condition) => JSON.stringify(condition).includes("totalFloors"))).toBe(
      true,
    );
  });

  it("hər xüsusiyyət ayrıca AND şərti kimi əlavə olunur", async () => {
    const where = await buildPropertyWhere({ featureSlugs: ["hovuz", "qaraj", "lift"] });
    const conditions = andConditions(where);

    expect(conditions).toHaveLength(3);
    for (const slug of ["hovuz", "qaraj", "lift"]) {
      expect(hasFeature(conditions, slug)).toBe(true);
    }
  });

  it("mətn axtarışı xüsusiyyət filtri ilə birlikdə qalır", async () => {
    const where = await buildPropertyWhere({
      featureSlugs: ["hovuz"],
      search: "Yasamal",
    });

    const conditions = andConditions(where);
    expect(hasFeature(conditions, "hovuz")).toBe(true);
    expect(conditions.some((condition) => JSON.stringify(condition).includes("Yasamal"))).toBe(true);
  });

  it("üç OR/AND filtri eyni anda verildikdə hamısı qorunur", async () => {
    const where = await buildPropertyWhere({
      excludeLastFloor: true,
      featureSlugs: ["qaraj"],
      search: "villa",
    });

    const serialized = JSON.stringify(andConditions(where));
    expect(serialized).toContain("totalFloors");
    expect(serialized).toContain("qaraj");
    expect(serialized).toContain("villa");
  });

  it("birinci mərtəbə istisnası mərtəbə aralığını pozmur", async () => {
    const where = await buildPropertyWhere({ minFloor: 2, maxFloor: 9, excludeFirstFloor: true });

    expect(where.floor).toEqual({ gte: 2, lte: 9, gt: 1 });
  });
});

describe("buildPropertyWhere — filtr olmayan hallar", () => {
  it("boş xüsusiyyət siyahısı AND yaratmır", async () => {
    const where = await buildPropertyWhere({ featureSlugs: [] });
    expect(where.AND).toBeUndefined();
  });

  it("boşluqdan ibarət axtarış sözü şərt yaratmır", async () => {
    const where = await buildPropertyWhere({ search: "   " });
    expect(where.AND).toBeUndefined();
  });
});
