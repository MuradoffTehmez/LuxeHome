import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { AGENCY_ACTIVITY_ACTIONS } from "@/lib/constants";
import { AGENCY_ACTIVITY_PAGE_SIZE, getAgencyActivity, isAgencyActivityGroup, recordAgencyActivity } from "@/lib/accounts/agency-activity";
import { prisma } from "@/lib/prisma";

/** Agentlik daxili fəaliyyət jurnalı (#214, PRD 7.4) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;
const owner = { id: "act-owner", name: "Sahib" };
const agent = { id: "act-agent", name: "Agent Əli" };

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  await DB.batch([
    user.bind("act-owner", "Sahib", "act-owner@example.test", "disabled", "EDITOR", "AGENCY"),
    user.bind("act-agent", "Agent Əli", "act-agent@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("act-other", "Başqa sahib", "act-other@example.test", "disabled", "EDITOR", "AGENCY"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').bind("act-agency", "act-owner", "Alfa", "act-alfa"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').bind("act-agency-2", "act-other", "Beta", "act-beta"),
  ]);
});

describe("fəaliyyət jurnalı", () => {
  it("agentliyə aid olmayan obyekti yazmır və xətada atmır", async () => {
    await recordAgencyActivity({ agencyId: null, actor: agent, action: AGENCY_ACTIVITY_ACTIONS.LISTING_CREATED, entityType: "Property", entityLabel: "Şəxsi elan" });
    // Mövcud olmayan agentlik (FK xətası) — əsas əməliyyatı sındırmamalıdır.
    await expect(recordAgencyActivity({ agencyId: "yoxdur", actor: agent, action: AGENCY_ACTIVITY_ACTIONS.LISTING_CREATED, entityType: "Property" })).resolves.toBeUndefined();
    await expect(prisma.agencyActivity.count()).resolves.toBe(0);
  });

  it("qrup, icraçı filtri və səhifələmə ilə oxunur, başqa agentliyin qeydi düşmür", async () => {
    await recordAgencyActivity({ agencyId: "act-agency", actor: agent, action: AGENCY_ACTIVITY_ACTIONS.LISTING_CREATED, entityType: "Property", entityId: "p1", entityLabel: "Mənzil" });
    await recordAgencyActivity({
      agencyId: "act-agency", actor: agent, action: AGENCY_ACTIVITY_ACTIONS.PRICE_CHANGED, entityType: "Property", entityId: "p1", entityLabel: "Mənzil",
      details: { from: 120000, to: 115000, currency: "AZN" },
    });
    await recordAgencyActivity({ agencyId: "act-agency", actor: owner, action: AGENCY_ACTIVITY_ACTIONS.MEMBER_INVITED, entityType: "AgencyEmployee", entityLabel: "Agent Əli" });
    await recordAgencyActivity({ agencyId: "act-agency", actor: null, action: AGENCY_ACTIVITY_ACTIONS.TRANSFER_DECIDED, entityType: "ListingTransfer", details: { stage: "admin", approved: true } });
    await recordAgencyActivity({ agencyId: "act-agency-2", actor: owner, action: AGENCY_ACTIVITY_ACTIONS.LISTING_DELETED, entityType: "Property" });

    const all = await getAgencyActivity({ agencyId: "act-agency" });
    expect(all.total).toBe(4);
    expect(all.items[0]).toMatchObject({ action: AGENCY_ACTIVITY_ACTIONS.TRANSFER_DECIDED, actorId: null, actorName: "—" });
    expect(all.actors.map((actor) => actor.name)).toEqual(["Agent Əli", "Sahib"]);

    const listings = await getAgencyActivity({ agencyId: "act-agency", group: "listings" });
    expect(listings.items.map((item) => item.action).sort()).toEqual([AGENCY_ACTIVITY_ACTIONS.LISTING_CREATED, AGENCY_ACTIVITY_ACTIONS.PRICE_CHANGED].sort());
    expect(listings.items.find((item) => item.action === AGENCY_ACTIVITY_ACTIONS.PRICE_CHANGED)?.details).toEqual({ from: 120000, to: 115000, currency: "AZN" });

    const byOwner = await getAgencyActivity({ agencyId: "act-agency", actorId: "act-owner" });
    expect(byOwner.items.map((item) => item.action)).toEqual([AGENCY_ACTIVITY_ACTIONS.MEMBER_INVITED]);

    expect(isAgencyActivityGroup("team")).toBe(true);
    expect(isAgencyActivityGroup("toString")).toBe(false);
  });

  it("səhifələr ölçüyə görə bölünür", async () => {
    for (let index = 0; index < AGENCY_ACTIVITY_PAGE_SIZE; index += 1) {
      await recordAgencyActivity({ agencyId: "act-agency", actor: agent, action: AGENCY_ACTIVITY_ACTIONS.LISTING_UPDATED, entityType: "Property", entityLabel: `Elan ${index}` });
    }
    const first = await getAgencyActivity({ agencyId: "act-agency" });
    const second = await getAgencyActivity({ agencyId: "act-agency", page: 2 });
    expect(first.pages).toBe(2);
    expect(first.items).toHaveLength(AGENCY_ACTIVITY_PAGE_SIZE);
    expect(second.items).toHaveLength(4);
    expect(new Set([...first.items, ...second.items].map((item) => item.id)).size).toBe(AGENCY_ACTIVITY_PAGE_SIZE + 4);
    // Mövcud olmayan səhifə son səhifəyə sıxılır, sabit hədd yoxdur.
    const beyond = await getAgencyActivity({ agencyId: "act-agency", page: 10_000 });
    expect(beyond.page).toBe(2);
    expect(beyond.items.map((item) => item.id)).toEqual(second.items.map((item) => item.id));
  });
});
