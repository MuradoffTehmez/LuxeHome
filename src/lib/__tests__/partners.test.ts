import { describe, expect, it } from "vitest";
import { PARTNER_STATUSES, PERMISSIONS, ROLES } from "@/lib/constants";
import { hasPermission } from "@/lib/auth/permissions";
import { uniqueSlug } from "@/lib/admin/slug";
import {
  daysUntilPartnershipEnd,
  isOfficialPartnerVisible,
  isPartnerPubliclyVisible,
  isPartnershipExpired,
  partnerDomain,
  shouldMarkExpired,
} from "@/lib/partners";

const activePartner = {
  status: PARTNER_STATUSES.ACTIVE,
  verified: true,
  officialPartner: true,
  showPublicly: true,
  partnershipEndDate: null,
  deletedAt: null,
};

describe("tərəfdaşlıq domen qaydaları", () => {
  it("rəsmi badge üçün bütün təhlükəsizlik şərtlərini birlikdə tələb edir", () => {
    expect(isOfficialPartnerVisible(activePartner)).toBe(true);
    for (const patch of [
      { status: PARTNER_STATUSES.SUSPENDED },
      { verified: false },
      { officialPartner: false },
      { showPublicly: false },
      { deletedAt: new Date() },
    ]) {
      expect(isOfficialPartnerVisible({ ...activePartner, ...patch })).toBe(false);
    }
  });

  it("bitmə tarixini Bakı təqvim gününün sonuna qədər etibarlı saxlayır", () => {
    const partner = { partnershipEndDate: "2026-08-27T00:00:00.000Z" };
    expect(isPartnershipExpired(partner, new Date("2026-08-27T19:59:59.000Z"))).toBe(false);
    expect(isPartnershipExpired(partner, new Date("2026-08-27T20:00:01.000Z"))).toBe(true);
    expect(daysUntilPartnershipEnd(partner, new Date("2026-08-27T08:00:00.000Z"))).toBe(0);
  });

  it("müddəti bitmiş ACTIVE tərəfdaşı publicdən çıxarır və expiration namizədi edir", () => {
    const expired = { ...activePartner, partnershipEndDate: "2026-08-26T00:00:00.000Z" };
    const now = new Date("2026-08-27T08:00:00.000Z");
    expect(isPartnerPubliclyVisible(expired, now)).toBe(false);
    expect(shouldMarkExpired(expired, now)).toBe(true);
  });

  it("dublikat yoxlaması üçün website domenini normallaşdırır", () => {
    expect(partnerDomain("https://www.TREVA.realestate/az")).toBe("treva.realestate");
    expect(partnerDomain("https://treva.realestate")).toBe("treva.realestate");
    expect(partnerDomain("javascript:alert(1)")).toBeNull();
  });
});

describe("tərəfdaş slug və RBAC", () => {
  it("slug toqquşmasında deterministik növbəti ünvanı seçir", async () => {
    const existing = new Set(["treva", "treva-2"]);
    await expect(
      uniqueSlug("TREVA", async (slug) => existing.has(slug) ? { id: slug } : null),
    ).resolves.toBe("treva-3");
  });

  it("adi admin müqavilə metadatasını, redaktor isə yazma icazələrini almır", () => {
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.PARTNER_UPDATE)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.PARTNER_CONTRACT_MANAGE)).toBe(false);
    expect(hasPermission(ROLES.EDITOR, PERMISSIONS.PARTNER_VIEW)).toBe(true);
    expect(hasPermission(ROLES.EDITOR, PERMISSIONS.PARTNER_UPDATE)).toBe(false);
    expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.PARTNER_CONTRACT_MANAGE)).toBe(true);
  });
});
