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

  it("agentliyin mühitinə aid elanları (agencyId) satış/kirayə üzrə toplayır", async () => {
    db.propertyGroupBy.mockResolvedValue([
      { agencyId: "a1", listingType: "SALE", _count: { _all: 1 } },
      { agencyId: "a1", listingType: "RENT", _count: { _all: 2 } },
      { agencyId: "a2", listingType: "SALE", _count: { _all: 4 } },
    ]);

    const stats = await countAgencyOffers([{ id: "a1", userId: "owner-1" }, { id: "a2", userId: "owner-2" }]);

    // Agentin şəxsi elanı (agencyId = null) agentlikdə sayılmır (#210, PRD 6.3).
    expect(stats.get("a1")).toEqual({ total: 3, sale: 1, rent: 2 });
    expect(stats.get("a2")).toEqual({ total: 4, sale: 4, rent: 0 });
    expect(db.propertyGroupBy).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ agencyId: { in: ["a1", "a2"] } }),
    }));
    expect(db.employeeFindMany).not.toHaveBeenCalled();
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
