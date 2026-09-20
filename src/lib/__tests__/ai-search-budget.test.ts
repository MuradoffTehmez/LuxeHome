import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * AI axtarışının kvota qapısı.
 *
 * Yoxlanılan invariant: **ödənişli inference yalnız limit onu açıq şəkildə
 * icazə verəndə** çağırılır. Limiter cavab verməyəndə (binding nasazlığı) fail-open
 * etmək müdafiəni məhz sorğuların sayıla bilmədiyi anda söndürərdi.
 */

const limiter = vi.hoisted(() => ({
  result: async (): Promise<boolean> => true,
}));
const model = vi.hoisted(() => ({ runAiText: vi.fn() }));
const database = vi.hoisted(() => ({ propertyFindMany: vi.fn(), taxonomyFindMany: vi.fn() }));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "cf-connecting-ip": "203.0.113.7" }),
}));
vi.mock("@/lib/auth/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/rate-limit")>()),
  checkAiSearchLimit: () => limiter.result(),
}));
vi.mock("@/lib/ai", () => ({
  runAiText: model.runAiText,
  parseAiJson: (value: string) => JSON.parse(value),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findMany: database.propertyFindMany },
    propertyType: { findMany: database.taxonomyFindMany },
    location: { findMany: database.taxonomyFindMany },
    feature: { findMany: database.taxonomyFindMany },
  },
}));
vi.mock("@/lib/queries", () => ({
  publicPropertyWhere: async () => ({ deletedAt: null }),
  propertyCardSelect: { id: true },
}));

import { searchPropertiesWithAi } from "@/lib/phase3-search";

describe("AI axtarışının kvota qapısı", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    limiter.result = async () => true;
    database.propertyFindMany.mockResolvedValue([]);
    database.taxonomyFindMany.mockResolvedValue([]);
    model.runAiText.mockResolvedValue({ text: JSON.stringify({ featureSlugs: [], semanticTerms: [] }), model: "test-model" });
  });

  it("limit açıq olanda modeli çağırır", async () => {
    const result = await searchPropertiesWithAi("3 otaqlı kirayə mənzil");

    expect(model.runAiText).toHaveBeenCalledOnce();
    expect(result.model).toBe("test-model");
  });

  it("limit dolanda modeli çağırmır və deterministik parser-ə düşür", async () => {
    limiter.result = async () => false;

    const result = await searchPropertiesWithAi("3 otaqlı kirayə mənzil");

    expect(model.runAiText).not.toHaveBeenCalled();
    expect(result.model).toBe("deterministic-fallback");
  });

  it("limit dolanda taksonomiya sorğularını da atır", async () => {
    limiter.result = async () => false;

    await searchPropertiesWithAi("3 otaqlı kirayə mənzil");

    expect(database.taxonomyFindMany).not.toHaveBeenCalled();
  });

  // Fail-open burada müdafiəni məhz sayğac işləmədiyi anda söndürərdi.
  it("limiter istisna atanda da modeli çağırmır", async () => {
    limiter.result = async () => {
      throw new Error("rate limit binding cavab vermədi");
    };

    const result = await searchPropertiesWithAi("3 otaqlı kirayə mənzil");

    expect(model.runAiText).not.toHaveBeenCalled();
    expect(result.model).toBe("deterministic-fallback");
  });

  it("limit dolanda da sxem hədlərini aşan sorğu səhifəni sındırmır", async () => {
    limiter.result = async () => false;

    const result = await searchPropertiesWithAi("50 otaq, min 200000 m2, 2000000000 azn");

    expect(result.model).toBe("deterministic-fallback");
    expect(result.criteria.rooms).toBe(20);
  });
});
