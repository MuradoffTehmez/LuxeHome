import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { AGENCY_EMPLOYEE_STATUSES, LOCATION_KINDS, NEARBY_PLACE_CATEGORIES, PROPERTY_STATUSES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { findPropertyCards, propertyCardSelect } from "@/lib/queries";
import { withSlowD1 } from "@/test/slow-d1";

/**
 * Elan kartı sorğusu əlaqələri paralel oxuyur (#181): nəticə `select: propertyCardSelect`
 * ilə eyni olmalı, sıra saxlanmalı və gözləmə əlaqə sayına bağlı olmamalıdır.
 */

const DB = (env as unknown as { DB: D1Database }).DB;
const COUNT = 6;
const where = { slug: { startsWith: "pc-elan-" } };

beforeAll(async () => {
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("pc-type", "Mənzil", "menzil", "pc-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("pc-city", "Bakı", "baki", "pc-baki", LOCATION_KINDS.CITY),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, ?, 0)').bind("pc-district", "Yasamal", "yasamal", "pc-yasamal", LOCATION_KINDS.DISTRICT, "pc-city"),
  ]);
  const owner = await prisma.user.create({ data: { name: "Sahib", email: "pc-owner@example.com", passwordHash: "disabled", accountType: "AGENCY" } });
  const agency = await prisma.agency.create({ data: { userId: owner.id, name: "Agentlik", slug: "pc-agentlik" } });
  const agent = await prisma.user.create({ data: { name: "Agent", email: "pc-agent@example.com", passwordHash: "disabled", accountType: "AGENT" } });
  await prisma.agencyEmployee.create({ data: { agencyId: agency.id, userId: agent.id, status: AGENCY_EMPLOYEE_STATUSES.APPROVED } });
  const authors = [owner.id, agent.id, null];

  for (let index = 0; index < COUNT; index += 1) {
    const authorId = authors[index % authors.length];
    await prisma.property.create({
      data: {
        title: `Elan ${index}`,
        slug: `pc-elan-${index}`,
        description: "Təsvir",
        searchText: "elan",
        listingType: "SALE",
        status: PROPERTY_STATUSES.PUBLISHED,
        price: 100000 + index,
        area: 50 + index,
        // İkisinin tarixi eynidir — sıra `id` ilə qırılır və iki yol eyni nəticə verməlidir.
        publishedAt: new Date(Date.UTC(2026, 9, 1 + Math.min(index, 4))),
        type: { connect: { id: "pc-type" } },
        city: { connect: { id: "pc-city" } },
        ...(index % 2 === 0 ? { district: { connect: { id: "pc-district" } } } : {}),
        ...(authorId ? { author: { connect: { id: authorId } } } : {}),
        images: {
          create: [
            { url: `/media/emlaklar/${index}-a.webp`, order: 2 },
            { url: `/media/emlaklar/${index}-b.webp`, order: 1, isCover: index % 2 === 0 },
          ],
        },
        nearbyPlaces: {
          create: [
            { category: NEARBY_PLACE_CATEGORIES.METRO, name: "Uzaq", distanceMeters: 900 },
            { category: NEARBY_PLACE_CATEGORIES.METRO, name: "Yaxın", distanceMeters: 300 + index },
          ],
        },
        priceHistory: index % 3 === 0 ? { create: [{ oldPrice: 120000, newPrice: 100000 + index }] } : undefined,
      },
    });
  }
});

describe("elan kartlarının paralel oxunuşu (#181)", () => {
  it("nəticə və sıra tək select sorğusu ilə eynidir", async () => {
    const args = { where, orderBy: [{ publishedAt: "desc" as const }, { id: "asc" as const }] };
    const cards = await findPropertyCards(args);
    const legacy = await prisma.property.findMany({ ...args, select: propertyCardSelect });
    expect(cards).toHaveLength(COUNT);
    expect(cards).toEqual(legacy);
    // Agentlik sahibi və təsdiqlənmiş əməkdaşın kartında agentlik görünür.
    expect(cards.some((card) => card.author?.agency?.slug === "pc-agentlik")).toBe(true);
    expect(cards.some((card) => card.author?.agencyEmployments[0]?.agency.slug === "pc-agentlik")).toBe(true);
    expect(cards.every((card) => card.nearbyPlaces[0]?.name === "Yaxın")).toBe(true);
  });

  it("skip/take və boş nəticə", async () => {
    const args = { where, orderBy: [{ price: "asc" as const }], skip: 2, take: 3 };
    expect(await findPropertyCards(args)).toEqual(await prisma.property.findMany({ ...args, select: propertyCardSelect }));
    expect(await findPropertyCards({ where: { slug: "yoxdur" } })).toEqual([]);
  });

  it("əlaqələr ardıcıl deyil, paralel oxunur", async () => {
    const delay = 60;
    const args = { where, orderBy: [{ publishedAt: "desc" as const }], take: 4 };
    const parallel = await withSlowD1(DB, delay, () => findPropertyCards(args));
    const legacy = await withSlowD1(DB, delay, () => prisma.property.findMany({ ...args, select: propertyCardSelect }));
    expect(parallel.result).toHaveLength(4);
    // Sorğu sayı artır, amma gözləmə ən uzun əlaqə zəncirinə bağlıdır.
    expect(parallel.elapsed, `paralel ${parallel.elapsed} ms, köhnə ${legacy.elapsed} ms`).toBeLessThan(legacy.elapsed * 0.7);
  });
});
