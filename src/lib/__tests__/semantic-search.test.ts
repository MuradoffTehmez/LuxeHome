import { beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({
  AI: { run: vi.fn() },
  PROPERTY_VECTORS: { upsert: vi.fn(), deleteByIds: vi.fn(), query: vi.fn() },
}));
const db = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: () => ({ env, ctx: { waitUntil: vi.fn() } }) }));
vi.mock("@/lib/prisma", () => ({ prisma: { property: { findMany: db.findMany } } }));

import { MIN_SIMILARITY, propertyEmbeddingText, semanticPropertyMatches, syncPropertyVectors } from "@/lib/semantic-search";

const property = {
  id: "p1",
  title: "Parka yaxın 3 otaqlı mənzil",
  description: "Sakit məhəllə, uşaq bağçası yaxındadır.",
  listingType: "SALE",
  rooms: 3,
  area: 92.4,
  address: null,
  type: { name: "Mənzillər" },
  city: { name: "Bakı" },
  district: { name: "Nərimanov" },
  metro: { name: "Nərimanov" },
  features: [{ feature: { name: "Lift" } }],
};

describe("semantik axtarış", () => {
  beforeEach(() => vi.clearAllMocks());

  it("embedding mətnini axtarışda mənalı sahələrdən qurur", () => {
    const text = propertyEmbeddingText(property);
    expect(text).toContain("Parka yaxın 3 otaqlı mənzil");
    expect(text).toContain("Satış");
    expect(text).toContain("Nərimanov, Bakı");
    expect(text).toContain("Metro Nərimanov");
    expect(text).toContain("92 m²");
    expect(text).toContain("Lift");
    expect(propertyEmbeddingText({ ...property, description: "x".repeat(5000) }).length).toBeLessThanOrEqual(1500);
  });

  it("görünən elanı upsert edir, gizlənmiş və ya silinmiş elanı indeksdən çıxarır", async () => {
    db.findMany.mockResolvedValue([property]);
    env.AI.run.mockResolvedValue({ data: [[0.1, 0.2]] });
    await expect(syncPropertyVectors(["p1", "p-hidden"])).resolves.toBe(1);
    expect(env.PROPERTY_VECTORS.deleteByIds).toHaveBeenCalledWith(["p-hidden"]);
    expect(env.PROPERTY_VECTORS.upsert).toHaveBeenCalledWith([{ id: "p1", values: [0.1, 0.2] }]);
  });

  it("zəif oxşarlıqlı nəticələri atır, xətada null qaytarır", async () => {
    env.AI.run.mockResolvedValue({ data: [[0.3, 0.4]] });
    env.PROPERTY_VECTORS.query.mockResolvedValue({ matches: [{ id: "a", score: 0.82 }, { id: "b", score: MIN_SIMILARITY - 0.01 }] });
    const matches = await semanticPropertyMatches("uşaqlı ailə üçün sakit mənzil");
    expect([...(matches ?? new Map()).entries()]).toEqual([["a", 0.82]]);

    env.AI.run.mockRejectedValue(new Error("model down"));
    await expect(semanticPropertyMatches("test")).resolves.toBeNull();
  });
});
