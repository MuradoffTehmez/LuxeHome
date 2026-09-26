import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";
import { getIndexableTaxonomyLandings, getProperties } from "@/lib/queries";

/**
 * Kataloq sorğularının real D1 üzərində integration testləri (#85).
 *
 * CLAUDE.md-dəki mərkəzi qaydalar yoxlanır: ictimai sorğu qaralama, silinmiş və
 * (demo rejimi bağlı ikən) nümunə elanları qaytarmamalıdır; filtr və səhifələmə
 * isə yerləşmə ağacının üç səviyyəsində düzgün işləməlidir.
 */

const DB = (env as unknown as { DB: D1Database }).DB;

beforeAll(async () => {
  const location = DB.prepare(
    'INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, ?, 0)',
  );
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price",
       "typeId", "cityId", "districtId", "isDemo", "deletedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', ?, ?, ?, ?, 'type-apt', 'test-baki', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );

  const statements: D1PreparedStatement[] = [
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind(
      "type-apt",
      "Mənzillər",
      "menziller",
      "test-menziller",
    ),
    location.bind("test-baki", "Test Bakı", "test baki", "test-baki", LOCATION_KINDS.CITY, null),
    location.bind("test-sabuncu", "Test Sabunçu", "test sabuncu", "test-sabuncu", LOCATION_KINDS.DISTRICT, "test-baki"),
    location.bind("test-mastaga", "Test Maştağa", "test mastaga", "test-mastaga", LOCATION_KINDS.SETTLEMENT, "test-sabuncu"),
    location.bind("test-nesimi", "Test Nəsimi", "test nesimi", "test-nesimi", LOCATION_KINDS.DISTRICT, "test-baki"),
  ];

  // 30 görünən elan: 10-u birbaşa Sabunçuda, 10-u Maştağada, 10-u Nəsimidə.
  const districts = ["test-sabuncu", "test-mastaga", "test-nesimi"];
  for (let index = 0; index < 30; index += 1) {
    statements.push(
      property.bind(`p-${index}`, `Elan ${index}`, `test-elan-${index}`, `elan ${index}`, index % 2 ? "RENT" : "SALE",
        PROPERTY_STATUSES.PUBLISHED, 100_000 + index * 1_000, districts[index % 3], 0, null),
    );
  }
  // Sızmamalı olanlar: qaralama, silinmiş və nümunə elan.
  statements.push(
    property.bind("p-draft", "Qaralama", "test-qaralama", "qaralama", "SALE", PROPERTY_STATUSES.DRAFT, 1, "test-sabuncu", 0, null),
    property.bind("p-deleted", "Silinmiş", "test-silinmis", "silinmis", "SALE", PROPERTY_STATUSES.PUBLISHED, 1, "test-sabuncu", 0, new Date().toISOString()),
    property.bind("p-demo", "Nümunə", "test-numune", "numune", "SALE", PROPERTY_STATUSES.PUBLISHED, 1, "test-sabuncu", 1, null),
  );
  await DB.batch(statements);
});

describe("ictimai kataloq qaydaları", () => {
  it("qaralama, silinmiş və demo rejimi bağlı ikən nümunə elan sızmır", async () => {
    const { items, total } = await getProperties({ citySlug: "test-baki", pageSize: 100 });
    const slugs = items.map((item) => item.slug);

    expect(total).toBe(30);
    expect(slugs).not.toContain("test-qaralama");
    expect(slugs).not.toContain("test-silinmis");
    expect(slugs).not.toContain("test-numune");
  });

  it("elan növü, qiymət aralığı və səhifələmə birlikdə işləyir", async () => {
    const firstPage = await getProperties({ citySlug: "test-baki", listingType: "SALE", maxPrice: 120_000, pageSize: 5, page: 1 });
    const secondPage = await getProperties({ citySlug: "test-baki", listingType: "SALE", maxPrice: 120_000, pageSize: 5, page: 2 });

    // SALE = cüt indekslər; qiymət ≤ 120 000 → indeks 0..20 arası cütlər (11 elan).
    expect(firstPage.total).toBe(11);
    expect(firstPage.items).toHaveLength(5);
    expect(secondPage.items).toHaveLength(5);
    const overlap = firstPage.items.filter((item) => secondPage.items.some((other) => other.slug === item.slug));
    expect(overlap).toEqual([]);
  });

  it("inzibati rayon seçiləndə onun qəsəbələrindəki elanlar da nəticəyə düşür", async () => {
    const sabuncu = await getProperties({ districtSlug: "test-sabuncu", pageSize: 100 });
    // 10 birbaşa Sabunçuda + 10 Maştağada (Sabunçunun qəsəbəsi).
    expect(sabuncu.total).toBe(20);

    const mastaga = await getProperties({ districtSlug: "test-mastaga", pageSize: 100 });
    expect(mastaga.total).toBe(10);

    const nesimi = await getProperties({ districtSlug: "test-nesimi", pageSize: 100 });
    expect(nesimi.total).toBe(10);
  });
});

describe("rayon landing-lərinin sitemap uyğunluğu", () => {
  it("qəsəbə elanları valideyn inzibati rayonun sayına və tarixinə toplanır", async () => {
    // Birbaşa Sabunçuda elan azdırsa belə, qəsəbələri ilə birlikdə kifayətdir.
    await DB.prepare(`UPDATE "Property" SET "districtId" = 'test-mastaga' WHERE "id" IN ('p-0', 'p-3', 'p-6')`).run();
    await DB.prepare(`UPDATE "Property" SET "updatedAt" = '2030-01-01T00:00:00.000Z' WHERE "id" = 'p-1'`).run();

    const landings = await getIndexableTaxonomyLandings("DISTRICT");
    const bySlug = new Map(landings.map((landing) => [landing.slug, landing]));

    expect(bySlug.get("test-sabuncu")?.count).toBe(20);
    expect(bySlug.get("test-mastaga")?.count).toBe(13);
    // Maştağadakı p-1-in yenilənməsi valideynin `lastModified`-inə düşür.
    expect(bySlug.get("test-sabuncu")?.updatedAt?.toISOString()).toBe("2030-01-01T00:00:00.000Z");
    expect(bySlug.get("test-nesimi")?.count).toBe(10);
  });
});
