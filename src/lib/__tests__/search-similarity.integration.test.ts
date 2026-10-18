import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { PROPERTY_STATUSES } from "@/lib/constants";
import { getProperties, getSimilarProperties } from "@/lib/queries";
import { parseSavedSearchFilters } from "@/lib/saved-search-filters";
import { rankSimilar, similarityScore } from "@/lib/similarity";

/** Yerləşdirilmə tarixi filtri və balla oxşar elanlar (#254, PRD Modul 16) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;
const DAY = 86_400_000;

const base = { id: "b", typeId: "t1", cityId: "c1", districtId: "d1", price: 100_000, area: 80, rooms: 2, currency: "AZN" };

describe("oxşarlıq balı", () => {
  it("eyni rayon, növ, yaxın qiymət, otaq və sahə ən yüksək bal alır; fərqli valyutada qiymət müqayisə olunmur", () => {
    expect(similarityScore(base, { ...base })).toBe(100);
    expect(similarityScore(base, { ...base, districtId: "d2" })).toBe(85);
    expect(similarityScore(base, { ...base, currency: "USD" })).toBe(75);
    expect(similarityScore(base, { ...base, price: 300_000 })).toBe(75);
    expect(similarityScore(base, { ...base, rooms: 3 })).toBeLessThan(100);
    const ranked = rankSimilar(base, [
      { ...base, id: "far", typeId: "t2", districtId: "d9", price: 400_000, rooms: 5, area: 300 },
      { ...base, id: "close", price: 105_000 },
      { ...base, id: "b" },
    ], 2);
    expect(ranked.map((row) => row.id)).toEqual(["close", "far"]);
  });
});

beforeAll(async () => {
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "area", "rooms", "typeId", "cityId", "districtId", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'ss', 'SALE', ?, ?, ?, ?, ?, 'ss-city', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  const now = Date.now();
  await DB.batch([
    DB.prepare(`INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES ('ss-flat', 'Mənzil', 'menzil', 'ss-menzil'), ('ss-house', 'Ev', 'ev', 'ss-ev')`),
    DB.prepare(`INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES ('ss-city', 'Sscity', 'sscity', 'ss-sscity', 'CITY', NULL, 0), ('ss-d1', 'Bir', 'bir', 'ss-bir', 'DISTRICT', 'ss-city', 0), ('ss-d2', 'İki', 'iki', 'ss-iki', 'DISTRICT', 'ss-city', 1)`),
    property.bind("ss-base", "Əsas", "ss-base", PROPERTY_STATUSES.PUBLISHED, 100_000, 80, 2, "ss-flat", "ss-d1", new Date(now - 40 * DAY).toISOString()),
    property.bind("ss-twin", "Əkiz", "ss-twin", PROPERTY_STATUSES.PUBLISHED, 102_000, 82, 2, "ss-flat", "ss-d1", new Date(now - 20 * DAY).toISOString()),
    property.bind("ss-other", "Başqa", "ss-other", PROPERTY_STATUSES.PUBLISHED, 450_000, 300, 6, "ss-house", "ss-d2", new Date(now - 2 * DAY).toISOString()),
    property.bind("ss-mid", "Orta", "ss-mid", PROPERTY_STATUSES.PUBLISHED, 120_000, 90, 3, "ss-flat", "ss-d2", new Date(now - 5 * DAY).toISOString()),
    property.bind("ss-sold", "Satılıb", "ss-sold", PROPERTY_STATUSES.SOLD, 100_000, 80, 2, "ss-flat", "ss-d1", new Date(now - 1 * DAY).toISOString()),
  ]);
});

describe("axtarış və oxşar elanlar", () => {
  it("?tarix filtri son N gündə dərc olunanları qaytarır; icazəsiz dəyər nəzərə alınmır", async () => {
    const recent = (await getProperties({ citySlug: "ss-sscity", postedWithinDays: 7 })).items.map((item) => item.id).sort();
    expect(recent).toContain("ss-mid");
    expect(recent).toContain("ss-other");
    expect(recent).not.toContain("ss-twin");
    const all = (await getProperties({ citySlug: "ss-sscity", postedWithinDays: 5000 })).items.length;
    expect(all).toBeGreaterThanOrEqual(4);
    expect(parseSavedSearchFilters(JSON.stringify({ postedWithinDays: 7 }))).toMatchObject({ postedWithinDays: 7 });
    expect(parseSavedSearchFilters(JSON.stringify({ postedWithinDays: 2 }))).toBeNull();
  });

  it("oxşar elanlar balla sıralanır: əkiz birinci, satılmış düşmür", async () => {
    const similar = await getSimilarProperties({ id: "ss-base", cityId: "ss-city", typeId: "ss-flat", listingType: "SALE", districtId: "ss-d1", price: 100_000, area: 80, rooms: 2, currency: "AZN" }, 3);
    const ids = similar.map((item) => item.id);
    expect(ids[0]).toBe("ss-twin");
    expect(ids).not.toContain("ss-sold");
    expect(ids).not.toContain("ss-base");
    expect(ids.indexOf("ss-mid")).toBeLessThan(ids.indexOf("ss-other"));
  });
});
