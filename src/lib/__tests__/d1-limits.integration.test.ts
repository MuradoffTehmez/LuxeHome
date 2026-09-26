import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { LOCATION_CHILD_KINDS, LOCATION_KINDS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/**
 * Real D1 üzərində 100 bound-parametr həddinin reqressiya testləri (#74, #85).
 *
 * Rəsmi yerləşmə ağacının ölçüsü təkrarlanır: 75 şəhər/rayon və ~600 alt yer.
 * İlk test mühitin həddi həqiqətən tətbiq etdiyini sübut edir — #68-in nested
 * sorğusu burada düşməlidir; düşməsəydi, qalan testlər heç nəyi qorumazdı.
 */

const DB = (env as unknown as { DB: D1Database }).DB;

const CITY_COUNT = 75;
const CHILD_COUNT = 600;

async function countLocations() {
  const row = await DB.prepare(
    `SELECT
       SUM(CASE WHEN "kind" = ? THEN 1 ELSE 0 END) AS cities,
       SUM(CASE WHEN "kind" IN (?, ?, ?, ?) THEN 1 ELSE 0 END) AS children,
       SUM(CASE WHEN "kind" IN (?, ?, ?, ?) AND "parentId" IS NOT NULL THEN 1 ELSE 0 END) AS attached
     FROM "Location"`,
  )
    .bind(LOCATION_KINDS.CITY, ...LOCATION_CHILD_KINDS, ...LOCATION_CHILD_KINDS)
    .first<{ cities: number; children: number; attached: number }>();
  // Təzə bazada `baki` sətri olmadığı üçün 0031 miqrasiyasının bəzi yerləri
  // valideynsiz yaranır; filtr ağacı onları göstərə bilməz, forma isə `kind` üzrə alır.
  return { cities: row?.cities ?? 0, children: row?.children ?? 0, attached: row?.attached ?? 0 };
}

beforeAll(async () => {
  const statements: D1PreparedStatement[] = [];
  const insert = DB.prepare(
    'INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  for (let city = 0; city < CITY_COUNT; city += 1) {
    statements.push(insert.bind(`city-${city}`, `Şəhər ${city}`, `seher ${city}`, `seher-${city}`, LOCATION_KINDS.CITY, null, city));
  }
  // Bakının inzibati rayonları şəhərin, qəsəbələri isə rayonun uşağıdır.
  for (let district = 0; district < 12; district += 1) {
    statements.push(insert.bind(`district-${district}`, `Rayon ${district}`, `rayon ${district}`, `baki-rayon-${district}`, LOCATION_KINDS.DISTRICT, "city-0", district));
  }
  const kinds = [LOCATION_KINDS.SETTLEMENT, LOCATION_KINDS.VILLAGE, LOCATION_KINDS.NEIGHBORHOOD];
  for (let place = 0; place < CHILD_COUNT; place += 1) {
    const parent = place < 60 ? `district-${place % 12}` : `city-${1 + (place % (CITY_COUNT - 1))}`;
    statements.push(insert.bind(`place-${place}`, `Yer ${place}`, `yer ${place}`, `yer-${place}`, kinds[place % kinds.length], parent, place));
  }
  await DB.batch(statements);
});

describe("D1 100 bound-parametr həddi", () => {
  it("mühit həddi tətbiq edir: #68-in nested children sorğusu düşür", async () => {
    await expect(
      prisma.location.findMany({
        where: { kind: LOCATION_KINDS.CITY },
        select: {
          slug: true,
          children: {
            where: { kind: { in: LOCATION_CHILD_KINDS } },
            select: { slug: true, children: { where: { kind: { in: LOCATION_CHILD_KINDS } }, select: { slug: true } } },
          },
        },
      }),
    ).rejects.toThrow(/too many SQL variables/);
  });
});

describe("yerləşmə ağacı sorğuları (#74)", () => {
  it("getFilterOptions() bütün ağacı D1 həddini aşmadan qaytarır", async () => {
    const { getFilterOptions } = await import("@/lib/queries");
    const { cities } = await getFilterOptions();
    // 0031 miqrasiyası da öz yerlərini yaradır — gözlənilən say bazadan oxunur.
    const expected = await countLocations();

    expect(cities).toHaveLength(expected.cities);
    const baku = cities.find((city) => city.slug === "seher-0");
    const district = baku?.children.find((child) => child.slug === "baki-rayon-0");
    expect(district?.kind).toBe(LOCATION_KINDS.DISTRICT);
    // Bakı qəsəbələri üçüncü səviyyədədir.
    expect(district?.children.length).toBeGreaterThan(0);
    const total = cities.reduce(
      (sum, city) => sum + city.children.length + city.children.reduce((inner, child) => inner + child.children.length, 0),
      0,
    );
    expect(total).toBe(expected.attached);
  });

  it("getPropertyFormOptions() qəsəbə üçün kök şəhəri və qrupu hesablayır", async () => {
    const { getPropertyFormOptions } = await import("@/lib/queries");
    const { districts } = await getPropertyFormOptions();
    const settlement = districts.find((item) => item.slug === "yer-0");
    expect(settlement).toMatchObject({ cityId: "city-0", group: "Rayon 0" });
    expect(districts).toHaveLength((await countLocations()).children);
  });
});

describe("tərcümə sorğuları (#85)", () => {
  const ENTITY_COUNT = 250;

  beforeAll(async () => {
    const insert = DB.prepare(
      'INSERT INTO "ContentTranslation" ("id", "entityType", "entityId", "locale", "status", "title", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    );
    await DB.batch(
      Array.from({ length: ENTITY_COUNT }, (_, index) =>
        // Hər üçüncüsü qaralamadır — status şərti də yoxlanır.
        insert.bind(`tr-${index}`, "PROPERTY", `entity-${index}`, "en", index % 3 === 0 ? "DRAFT" : "PUBLISHED", `Title ${index}`),
      ),
    );
  });

  it("getPublishedContentTranslations() 250 qeydi hissələrə bölüb düzgün süzür", async () => {
    const { getPublishedContentTranslations } = await import("@/lib/content-translation");
    const ids = Array.from({ length: ENTITY_COUNT }, (_, index) => `entity-${index}`);
    const translations = await getPublishedContentTranslations("PROPERTY", ids, "en");

    expect(translations.size).toBe(ENTITY_COUNT - Math.ceil(ENTITY_COUNT / 3));
    expect(translations.get("entity-1")?.title).toBe("Title 1");
    expect(translations.has("entity-0")).toBe(false);
  });
});
