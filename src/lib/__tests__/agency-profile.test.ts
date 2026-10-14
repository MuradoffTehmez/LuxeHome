import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  employeeFindMany: vi.fn(),
  propertyGroupBy: vi.fn(),
  propertyFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    agencyEmployee: { findMany: db.employeeFindMany },
    property: { groupBy: db.propertyGroupBy, findMany: db.propertyFindMany },
  },
}));
vi.mock("@/lib/queries", () => ({
  propertyCardSelect: {},
  publicPropertyWhere: async () => ({ deletedAt: null }),
}));
vi.mock("@/lib/demo-content", () => ({ demoWhere: async () => ({}) }));

import { agentListingWhere, countAgencyOffers, countAgentListings } from "../agency-profile";
import { isPhoneLike } from "../accounts/profile-fields";

describe("agentlik təklif sayı", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sahibin və təsdiqlənmiş agentlərin elanlarını satış/kirayə üzrə toplayır", async () => {
    db.employeeFindMany.mockResolvedValue([{ agencyId: "a1", userId: "agent-1" }]);
    db.propertyGroupBy.mockResolvedValue([
      { authorId: "owner-1", listingType: "SALE", _count: { _all: 0 } },
      { authorId: "agent-1", listingType: "SALE", _count: { _all: 1 } },
      { authorId: "agent-1", listingType: "RENT", _count: { _all: 2 } },
    ]);

    const stats = await countAgencyOffers([{ id: "a1", userId: "owner-1" }]);

    // Ekran görüntüsündəki hal: sahibin 0, agentin 1 elanı — kart «1 təklif» yazmalıdır.
    expect(stats.get("a1")).toEqual({ total: 3, sale: 1, rent: 2 });
    expect(db.propertyGroupBy).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ authorId: { in: ["owner-1", "agent-1"] } }),
    }));
  });
});

describe("agent elan sayı", () => {
  beforeEach(() => vi.clearAllMocks());

  it("öz yerləşdirdiyi və təyin edilmiş elanları təkrarsız sayır", async () => {
    db.propertyFindMany.mockResolvedValue([
      { id: "p1", authorId: "user-1", assignedAgentId: null },
      { id: "p2", authorId: "staff", assignedAgentId: "agent-1" },
      { id: "p3", authorId: "user-1", assignedAgentId: "agent-1" },
    ]);

    const counts = await countAgentListings([{ id: "agent-1", userId: "user-1" }, { id: "agent-2", userId: null }]);

    expect(counts.get("agent-1")).toBe(3);
    expect(counts.get("agent-2")).toBe(0);
  });

  it("istifadəçisi olmayan agentdə yalnız təyin edilmiş elanları axtarır", () => {
    expect(agentListingWhere({ id: "agent-2", userId: null })).toEqual({ assignedAgentId: "agent-2" });
    expect(agentListingWhere({ id: "agent-1", userId: "user-1" })).toEqual({
      OR: [{ assignedAgentId: "agent-1" }, { authorId: "user-1" }],
    });
  });
});

describe("telefon formatı", () => {
  it("telefon nömrələrini qəbul edir, e-poçt və qısa mətni rədd edir", () => {
    expect(isPhoneLike("+994 50 123 45 67")).toBe(true);
    expect(isPhoneLike("(012) 526-94-94")).toBe(true);
    expect(isPhoneLike("azeorxan1985@gmail.com")).toBe(false);
    expect(isPhoneLike("12345")).toBe(false);
    expect(isPhoneLike(null)).toBe(false);
  });
});
