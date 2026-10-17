import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";
import { getAreaInsights } from "@/lib/area-insights";
import { getIndexableTaxonomyLandings, getTaxonomyLandingProperties } from "@/lib/queries";
import { buildTaxonomyLandingDescriptor } from "@/lib/seo-landings";

/** Ərazi səhifəsi: məlumat bloku və şəhər landing-i (#240, PRD 12.4, 12.5) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;

beforeAll(async () => {
  const location = DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, ?, 0)');
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "area", "pricePeriod", "typeId", "cityId", "districtId", "createdAt", "updatedAt")
     VALUES (?, 'Elan', ?, 'Təsvir', 'x', ?, ?, ?, ?, ?, ?, 'ai-city', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (\'ai-flat\', \'Mənzil\', \'menzil\', \'ai-menzil\'), (\'ai-house\', \'Həyət evi\', \'heyet evi\', \'ai-heyet\')'),
    location.bind("ai-city", "Ağcity", "agcity", "ai-agcity", LOCATION_KINDS.CITY, null),
    location.bind("ai-d1", "Birinci", "birinci", "ai-birinci", LOCATION_KINDS.DISTRICT, "ai-city"),
    location.bind("ai-d2", "İkinci", "ikinci", "ai-ikinci", LOCATION_KINDS.DISTRICT, "ai-city"),
    location.bind("ai-d3", "Boş", "bos", "ai-bos", LOCATION_KINDS.DISTRICT, "ai-city"),
    location.bind("ai-s1", "Qəsəbə", "qesebe", "ai-qesebe", LOCATION_KINDS.SETTLEMENT, "ai-d1"),
    // Elanı yalnız alt massivdə olan rayon — əlaqəli ərazilərdə uşaq sayı ilə görünməlidir.
    location.bind("ai-d4", "Dördüncü", "dorduncu", "ai-dorduncu", LOCATION_KINDS.DISTRICT, "ai-city"),
    location.bind("ai-n4", "Massiv", "massiv", "ai-massiv", LOCATION_KINDS.NEIGHBORHOOD, "ai-d4"),
    // Birinci rayonda 5 satış (m² medianı üçün kifayət), 2 kirayə (median üçün az); qaralama sayılmır.
    ...[100_000, 120_000, 150_000, 90_000, 200_000].map((price, index) =>
      property.bind(`ai-s${index}`, `ai-s${index}`, "SALE", PROPERTY_STATUSES.PUBLISHED, price, 100, null, "ai-flat", index === 4 ? "ai-s1" : "ai-d1")),
    property.bind("ai-r1", "ai-r1", "RENT", PROPERTY_STATUSES.PUBLISHED, 800, 60, "MONTH", "ai-flat", "ai-d1"),
    property.bind("ai-r2", "ai-r2", "RENT", PROPERTY_STATUSES.PUBLISHED, 1200, 80, "MONTH", "ai-house", "ai-d1"),
    property.bind("ai-draft", "ai-draft", "SALE", PROPERTY_STATUSES.DRAFT, 999_999, 10, null, "ai-flat", "ai-d1"),
    property.bind("ai-x1", "ai-x1", "SALE", PROPERTY_STATUSES.PUBLISHED, 50_000, 50, null, "ai-house", "ai-d2"),
    property.bind("ai-n1", "ai-n1", "SALE", PROPERTY_STATUSES.PUBLISHED, 70_000, 70, null, "ai-flat", "ai-n4"),
    // Satılmış elan ictimaidir, amma aktiv təklif deyil — saylara və mediana düşmür.
    property.bind("ai-sold", "ai-sold", "SALE", PROPERTY_STATUSES.SOLD, 1_000_000, 100, null, "ai-flat", "ai-d1"),
  ]);
});

describe("ərazi məlumat bloku", () => {
  it("rayon: satış/kirayə sayı, kifayət edən nümunədə median, növlər və elanı olan əlaqəli ərazilər", async () => {
    const data = await getAreaInsights({ kind: "DISTRICT", location: { id: "ai-d1", slug: "ai-birinci", parentId: "ai-city" } });
    expect(data).toMatchObject({ total: 7, sale: 5, rent: 2, salePricePerSqm: 1200, monthlyRent: null, rentSample: 2 });
    expect(data.types.map((type) => [type.slug, type.count])).toEqual([["ai-menzil", 6], ["ai-heyet", 1]]);
    // Qonşular «İkinci» və «Dördüncü» (alt massivdən) və alt «Qəsəbə»; elansız «Boş» linklənmir.
    expect(data.related.map((item) => item.slug).sort()).toEqual(["ai-dorduncu", "ai-ikinci", "ai-qesebe"]);
  });

  it("şəhər: bütün rayonların elanları və alt ərazilər", async () => {
    const data = await getAreaInsights({ kind: "CITY", location: { id: "ai-city", slug: "ai-agcity", parentId: null } });
    expect(data).toMatchObject({ total: 9, sale: 7, rent: 2 });
    // «Birinci» alt qəsəbənin elanını da sayır; «Dördüncü»nün bütün elanı alt massivdədir.
    expect(data.related.map((item) => [item.slug, item.count])).toEqual([["ai-birinci", 7], ["ai-dorduncu", 1], ["ai-ikinci", 1]]);
  });
});

describe("şəhər landing-i", () => {
  it("sorğu, descriptor və sitemap", async () => {
    const result = await getTaxonomyLandingProperties("CITY", "ai-agcity");
    expect(result?.total).toBe(9);
    expect(await getTaxonomyLandingProperties("CITY", "ai-birinci")).toBeNull();
    const landing = buildTaxonomyLandingDescriptor("CITY", { name: "Ağcity", slug: "ai-agcity", kind: LOCATION_KINDS.CITY, parent: null });
    expect(landing).toMatchObject({ path: "/seher/ai-agcity", h1: "Ağcity üzrə daşınmaz əmlaklar", filters: { citySlug: "ai-agcity" } });
    expect(buildTaxonomyLandingDescriptor("CITY", { name: "Baku", slug: "x", kind: LOCATION_KINDS.CITY, parent: null }, "en").h1).toBe("Property in Baku");
    const cities = await getIndexableTaxonomyLandings("CITY");
    expect(cities.find((item) => item.slug === "ai-agcity")?.count).toBe(9);
  });
});
