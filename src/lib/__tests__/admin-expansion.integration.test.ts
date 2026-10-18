import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { getAdminProperties } from "@/lib/queries";
import { getPlatformIndicators } from "@/lib/admin/platform-indicators";

/** Admin panelinin genişləndirilməsi (#260, PRD Modul 19): risk göstəriciləri və elan görünüşləri. */
const DB = (env as unknown as { DB: D1Database }).DB;
const future = new Date(Date.now() + 5 * 86_400_000).toISOString();

beforeAll(async () => {
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "riskScore", "isFeatured", "featuredUntil", "promotedUntil", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'ae-type', 'ae-city', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    DB.prepare(`INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES ('ae-type', 'Mənzil', 'menzil', 'ae-menzil')`),
    DB.prepare(`INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES ('ae-city', 'Ae', 'ae', 'ae-city', 'CITY', NULL, 0)`),
    property.bind("ae-risky", "Şübhəli", "ae-risky", "PENDING", 70, 0, null, null),
    property.bind("ae-vip", "VIP", "ae-vip", "PUBLISHED", 0, 1, future, null),
    property.bind("ae-promo", "İrəli", "ae-promo", "PUBLISHED", 0, 0, null, future),
    property.bind("ae-archive", "Arxiv", "ae-archive", "EXPIRED", 0, 0, null, null),
    DB.prepare(`INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "trustScore", "createdAt", "updatedAt") VALUES ('ae-user', 'Riskli', 'ae@example.test', 'disabled', 'EDITOR', 'OWNER', 75, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`),
  ]);
});

describe("admin görünüşləri və göstəricilər", () => {
  it("hər görünüş öz elanını qaytarır", async () => {
    const ids = async (view: string) => (await getAdminProperties({ cityId: "ae-city", view })).rows.map((row) => row.id);
    expect(await ids("subheli")).toEqual(["ae-risky"]);
    expect(await ids("vip")).toEqual(["ae-vip"]);
    expect(await ids("irelicekilmis")).toEqual(["ae-promo"]);
    expect(await ids("arxiv")).toEqual(["ae-archive"]);
    expect((await getAdminProperties({ cityId: "ae-city" })).rows).toHaveLength(4);
    // VIP görünüşü mətn axtarışını əvəz etmir — uyğun gəlməyən sorğu boş nəticə verir.
    expect((await getAdminProperties({ cityId: "ae-city", view: "vip", q: "uyğunsuz-söz" })).rows).toHaveLength(0);
    expect((await getAdminProperties({ cityId: "ae-city", view: "vip", q: "VIP" })).rows.map((row) => row.id)).toEqual(["ae-vip"]);
  });

  it("platforma göstəriciləri riskli elan və hesabları sayır", async () => {
    const data = await getPlatformIndicators();
    expect(data.riskyListings).toBeGreaterThanOrEqual(1);
    expect(data.riskyAccounts).toBeGreaterThanOrEqual(1);
    expect(data.newUsers).toBeGreaterThanOrEqual(1);
    expect(data.newListings).toBeGreaterThanOrEqual(4);
  });
});
