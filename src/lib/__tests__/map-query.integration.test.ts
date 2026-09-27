import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";
import { pointInPolygon, type LatLng } from "@/lib/geo-polygon";
import { getPropertiesForMap, getSeoAuditItems, savedSearchMatchStore } from "@/lib/queries";

/**
 * Xəritə görünüşü 98-dən çox markerlə (#107 zamanı tapıldı).
 *
 * `images: { take: 1, orderBy }` əlaqəsi 98-dən çox valideyn üçün Prisma D1 sorğusunu
 * ilişdirirdi və staging-də `/emlaklar?gorunus=xerite` 500 qaytarırdı. Şəkillər indi
 * hissələrlə oxunur; bu test 150 elanla həm xəritəni, həm SEO auditini yoxlayır.
 */

const DB = (env as unknown as { DB: D1Database }).DB;
const COUNT = 150;

beforeAll(async () => {
  const statements: D1PreparedStatement[] = [
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("map-type", "Mənzillər", "menziller", "map-menziller"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("map-city", "Bakı", "baki", "map-baki", LOCATION_KINDS.CITY),
  ];
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price",
       "typeId", "cityId", "latitude", "longitude", "isDemo", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir mətni', 'x', 'SALE', ?, ?, 'map-type', 'map-city', ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  const image = DB.prepare('INSERT INTO "PropertyImage" ("id", "propertyId", "url", "alt", "order", "isCover") VALUES (?, ?, ?, ?, ?, ?)');
  for (let index = 0; index < COUNT; index += 1) {
    statements.push(property.bind(`map-${index}`, `Elan ${index}`, `map-elan-${index}`, PROPERTY_STATUSES.PUBLISHED, 100000 + index, 40.35 + index / 10000, 49.8 + index / 10000));
    statements.push(image.bind(`map-img-${index}-a`, `map-${index}`, `/media/emlaklar/a-${index}.webp`, "a", 1, 0));
    statements.push(image.bind(`map-img-${index}-b`, `map-${index}`, `/media/emlaklar/b-${index}.webp`, "b", 2, 1));
  }
  await DB.batch(statements);
});

describe("böyük xəritə nəticəsi", () => {
  it("150 markeri üz qabığı şəkli ilə qaytarır (ilişmədən)", async () => {
    const { items, total } = await getPropertiesForMap({ citySlug: "map-baki" });
    expect(total).toBe(COUNT);
    expect(items).toHaveLength(COUNT);
    // Hər elanın ilk şəkli `isCover` olandır.
    expect(items.every((item) => item.images[0]?.url.includes("/b-"))).toBe(true);
  });

  it("çəkilmiş sahəyə düşən markerləri saxlayır", async () => {
    const { items } = await getPropertiesForMap({
      citySlug: "map-baki",
      polygon: [[40.34, 49.79], [40.34, 49.8050], [40.3550, 49.8050], [40.3550, 49.79]],
    });
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThan(COUNT);
    expect(items.every((item) => (item.latitude as number) <= 40.355)).toBe(true);
  });

  it("üçbucaq sahədə limit dəqiq süzgəcdən sonra tətbiq olunur, say dəqiqdir", async () => {
    // Sərhəd qutusu bütün 150 nöqtəni əhatə edir; hipotenuz (lat + lng = 90.1655) isə
    // təxminən yarısını kəsir və heç bir test nöqtəsi düz sərhədin üzərinə düşmür.
    const triangle: LatLng[] = [[40.34, 49.79], [40.34, 49.8255], [40.3755, 49.79]];
    const expected = Array.from({ length: COUNT }, (_, index) => [40.35 + index / 10000, 49.8 + index / 10000] as LatLng)
      .filter((point) => pointInPolygon(point, triangle)).length;
    const { items, total } = await getPropertiesForMap({ citySlug: "map-baki", polygon: triangle });
    expect(expected).toBeGreaterThan(50);
    expect(expected).toBeLessThan(COUNT);
    expect(total).toBe(expected);
    expect(items).toHaveLength(expected);
  });

  it("saxlanmış axtarış sərhəd qutusunun küncündəki elanı uyğun saymır", async () => {
    const triangle: LatLng[] = [[40.349, 49.799], [40.349, 49.9], [40.45, 49.9]];
    // map-0 (40.35, 49.80) üçbucağın xaricindədir, amma qutunun içindədir.
    expect(pointInPolygon([40.35, 49.8], triangle)).toBe(false);
    await expect(savedSearchMatchStore.matchesFilters({ citySlug: "map-baki", polygon: triangle }, "map-0")).resolves.toBe(false);
    await expect(savedSearchMatchStore.matchesFilters({ citySlug: "map-baki" }, "map-0")).resolves.toBe(true);
  });

  it("SEO auditi 150 elanla ilişmir və şəkilləri bağlayır", async () => {
    const { issues } = await getSeoAuditItems();
    // Şəkillər hissələrlə bağlanıb: test elanlarından heç birində «üz qabığı yoxdur» olmamalıdır.
    const missingCover = issues.filter((issue) => issue.code === "cover_missing" && issue.contentId.startsWith("map-"));
    expect(missingCover).toEqual([]);
  });
});
