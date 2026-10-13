import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  employeeUpdateMany: vi.fn(),
  employeeFindFirst: vi.fn(),
  profileFindMany: vi.fn(),
  profileUpdateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    agencyEmployee: { updateMany: db.employeeUpdateMany, findFirst: db.employeeFindFirst },
    agentProfile: { findMany: db.profileFindMany, updateMany: db.profileUpdateMany },
  },
}));
vi.mock("@/lib/revalidate-public", () => ({ revalidatePublicContent: vi.fn() }));

import { commitMembershipDecision, hasOtherApprovedMembership } from "../agency-membership";

const base = { id: "emp-1", userId: "user-1", agencyId: "agency-1" };

describe("agentlik üzvlüyü qərarı", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.employeeUpdateMany.mockResolvedValue({ count: 1 });
    db.profileFindMany.mockResolvedValue([{ id: "profile-1", slug: "rauf" }]);
    db.profileUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("təsdiqdə statusu şərti yazır və agent profilini agentliyə bağlayır", async () => {
    await expect(commitMembershipDecision({ ...base, approved: true, currentStatus: "PENDING" })).resolves.toBe("done");
    expect(db.employeeUpdateMany).toHaveBeenCalledWith({
      where: { id: "emp-1", status: "PENDING" },
      data: expect.objectContaining({ status: "APPROVED" }),
    });
    expect(db.profileUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ["profile-1"] } },
      data: { agencyId: "agency-1" },
    });
  });

  it("profil bağlantısı alınmasa statusu PENDING-ə qaytarır ki, təkrar cəhd mümkün olsun", async () => {
    db.profileUpdateMany.mockRejectedValue(new Error("D1 kəsildi"));

    await expect(commitMembershipDecision({ ...base, approved: true, currentStatus: "PENDING" })).rejects.toThrow("D1 kəsildi");
    expect(db.employeeUpdateMany).toHaveBeenLastCalledWith({
      where: { id: "emp-1", status: "APPROVED" },
      data: { status: "PENDING", approvedAt: null },
    });
  });

  it("artıq təsdiqlənmiş qeydin təkrar təsdiqi yalnız bağlantını tamamlayır", async () => {
    await expect(commitMembershipDecision({ ...base, approved: true, currentStatus: "APPROVED" })).resolves.toBe("resumed");
    expect(db.employeeUpdateMany).not.toHaveBeenCalled();
    expect(db.profileUpdateMany).toHaveBeenCalled();
  });

  it("başqa tərəf artıq qərar veribsə üzərinə yazmır", async () => {
    db.employeeUpdateMany.mockResolvedValue({ count: 0 });
    await expect(commitMembershipDecision({ ...base, approved: true, currentStatus: "PENDING" })).resolves.toBe("conflict");
    expect(db.profileUpdateMany).not.toHaveBeenCalled();
  });

  it("rəddə profilə toxunmur", async () => {
    await expect(commitMembershipDecision({ ...base, approved: false, currentStatus: "PENDING" })).resolves.toBe("done");
    expect(db.profileUpdateMany).not.toHaveBeenCalled();
  });

  it("başqa agentlikdəki təsdiqlənmiş üzvlüyü tapır", async () => {
    db.employeeFindFirst.mockResolvedValue({ id: "emp-2" });
    await expect(hasOtherApprovedMembership("user-1", "agency-1")).resolves.toBe(true);
    expect(db.employeeFindFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", agencyId: { not: "agency-1" }, status: "APPROVED" },
      select: { id: true },
    });
  });
});
