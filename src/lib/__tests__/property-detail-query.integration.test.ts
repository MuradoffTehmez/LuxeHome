import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { LOCATION_KINDS, PROPERTY_STATUSES, REVIEW_STATUSES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getPropertyBySlug } from "@/lib/queries";

/**
 * Elan detalı əlaqələri paralel oxuyur (#179). Bu test iki şeyi qoruyur:
 * nəticə köhnə tək `include` sorğusu ilə eynidir və gözləmə əlaqə sayına deyil,
 * ən dərin əlaqəyə bağlıdır (D1-ə gediş-gəlişlər üst-üstə düşür).
 */

const DB = (env as unknown as { DB: D1Database }).DB;
type Context = { env: { DB: D1Database } };
const context = () => (globalThis as Record<symbol, Context>)[Symbol.for("__cloudflare-context__")];

beforeAll(async () => {
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("pd-type", "Mənzil", "menzil", "pd-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("pd-city", "Bakı", "baki", "pd-baki", LOCATION_KINDS.CITY),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, ?, 0)').bind("pd-district", "Yasamal", "yasamal", "pd-yasamal", LOCATION_KINDS.DISTRICT, "pd-city"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, ?, 0)').bind("pd-metro", "Elmlər", "elmler", "pd-elmler", LOCATION_KINDS.METRO, "pd-city"),
  ]);
  const author = await prisma.user.create({ data: { name: "Sahib", email: "pd-owner@example.com", passwordHash: "disabled" } });
  const agency = await prisma.agency.create({ data: { userId: author.id, name: "Agentlik", slug: "pd-agentlik" } });
  const agent = await prisma.agentProfile.create({ data: { slug: "pd-agent", name: "Agent", agencyId: agency.id } });
  await prisma.agentReview.createMany({
    data: [
      { agentId: agent.id, customerName: "A", rating: 5, comment: "Əla", status: REVIEW_STATUSES.APPROVED },
      { agentId: agent.id, customerName: "B", rating: 1, comment: "Gizli", status: REVIEW_STATUSES.PENDING },
    ],
  });
  await prisma.neighborhoodProfile.create({ data: { locationId: "pd-district" } });
  const project = await prisma.project.create({ data: { name: "Kompleks", slug: "pd-kompleks", description: "x" } });
  const feature = await prisma.feature.create({ data: { name: "Lift", slug: "pd-lift" } });
  await prisma.property.create({
    data: {
      title: "Elan",
      slug: "pd-elan",
      description: "Təsvir",
      searchText: "elan",
      listingType: "SALE",
      status: PROPERTY_STATUSES.PUBLISHED,
      price: 150000,
      area: 90,
      publishedAt: new Date("2026-10-01T00:00:00Z"),
      type: { connect: { id: "pd-type" } },
      city: { connect: { id: "pd-city" } },
      district: { connect: { id: "pd-district" } },
      metro: { connect: { id: "pd-metro" } },
      project: { connect: { id: project.id } },
      author: { connect: { id: author.id } },
      assignedAgent: { connect: { id: agent.id } },
      images: { create: [{ url: "/media/emlaklar/a.webp", order: 2 }, { url: "/media/emlaklar/b.webp", order: 1, isCover: true }] },
      features: { create: [{ featureId: feature.id }] },
      priceHistory: { create: [{ oldPrice: 160000, newPrice: 150000 }] },
      floorPlans: { create: [{ url: "/media/emlaklar/plan.webp" }] },
      nearbyPlaces: { create: [{ category: "METRO", name: "Elmlər", distanceMeters: 400 }] },
    },
  });
});

/** Köhnə tək sorğu — müqayisə üçün etalon. */
async function legacyDetail(slug: string) {
  return prisma.property.findFirst({
    where: { slug, status: PROPERTY_STATUSES.PUBLISHED, deletedAt: null },
    include: {
      type: true,
      city: true,
      district: { include: { neighborhoodProfile: true, parent: { select: { name: true, slug: true, kind: true } } } },
      metro: true,
      landmark: { select: { name: true, slug: true } },
      images: { orderBy: [{ isCover: "desc" }, { order: "asc" }] },
      features: { include: { feature: true } },
      project: { select: { name: true, slug: true } },
      priceHistory: { orderBy: { changedAt: "desc" }, take: 20 },
      floorPlans: { orderBy: { order: "asc" }, select: { id: true, url: true, title: true } },
      nearbyPlaces: { orderBy: [{ category: "asc" }, { distanceMeters: "asc" }] },
      assignedAgent: {
        include: {
          agency: { select: { name: true, slug: true } },
          reviews: { where: { status: REVIEW_STATUSES.APPROVED }, orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
    },
  });
}

describe("elan detalının paralel oxunuşu (#179)", () => {
  it("nəticə tək include sorğusu ilə eynidir", async () => {
    const detail = await getPropertyBySlug("pd-elan");
    const legacy = await legacyDetail("pd-elan");
    expect(detail).not.toBeNull();
    const { author, ...rest } = detail!;
    expect(rest).toEqual(legacy);
    expect(author?.id).toBeTruthy();
    expect(detail!.images[0].url).toContain("/b.webp");
    expect(detail!.assignedAgent?.reviews).toHaveLength(1);
    expect(detail!.district?.parent?.slug).toBe("pd-baki");
  });

  it("ictimai olmayan elan üçün null qaytarır", async () => {
    await prisma.property.update({ where: { slug: "pd-elan" }, data: { status: PROPERTY_STATUSES.DRAFT } });
    try {
      expect(await getPropertyBySlug("pd-elan")).toBeNull();
    } finally {
      await prisma.property.update({ where: { slug: "pd-elan" }, data: { status: PROPERTY_STATUSES.PUBLISHED } });
    }
    expect(await getPropertyBySlug("yoxdur")).toBeNull();
  });

  it("D1 gediş-gəlişləri ardıcıl deyil, üst-üstə düşür", async () => {
    // Hər D1 çağırışına gecikmə əlavə edən sarğı: ardıcıl yükləmə ~sorğu sayı × gecikmə çəkərdi.
    const delay = 60;
    let calls = 0;
    const wrapStatement = (statement: D1PreparedStatement): D1PreparedStatement =>
      new Proxy(statement, {
        get(target, property) {
          const value = Reflect.get(target, property) as unknown;
          if (typeof value !== "function") return value;
          if (property === "bind") return (...args: unknown[]) => wrapStatement((value as (...a: unknown[]) => D1PreparedStatement).apply(target, args));
          if (["all", "raw", "first", "run"].includes(String(property))) {
            return async (...args: unknown[]) => {
              calls += 1;
              await new Promise((resolve) => setTimeout(resolve, delay));
              return (value as (...a: unknown[]) => unknown).apply(target, args);
            };
          }
          return (value as (...a: unknown[]) => unknown).bind(target);
        },
      });
    const slowDb = new Proxy(DB, {
      get(target, property) {
        if (property === "prepare") return (sql: string) => wrapStatement(target.prepare(sql));
        const value = Reflect.get(target, property) as unknown;
        return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(target) : value;
      },
    });

    const ctx = context();
    const original = ctx.env;
    // Klient sorğu konteksti (`ctx`) üzrə yaradılır — yeni kontekst yeni (yavaş) klient verir.
    (globalThis as Record<symbol, unknown>)[Symbol.for("__cloudflare-context__")] = {
      ...ctx,
      env: { ...original, DB: slowDb },
      ctx: { waitUntil: () => undefined, passThroughOnException: () => undefined },
    };
    try {
      const started = Date.now();
      const detail = await getPropertyBySlug("pd-elan");
      const elapsed = Date.now() - started;
      expect(detail).not.toBeNull();
      // Ardıcıl yükləmədə `calls × delay` olardı; paralel yükləmə ən dərin əlaqəyə bağlıdır.
      expect(calls).toBeGreaterThan(10);
      expect(elapsed).toBeLessThan((calls * delay) / 2);
    } finally {
      (globalThis as Record<symbol, unknown>)[Symbol.for("__cloudflare-context__")] = ctx;
    }
  });
});
