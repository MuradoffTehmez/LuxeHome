import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  userUpdate: vi.fn(),
  userFindUnique: vi.fn(),
  userFindMany: vi.fn(),
  userDelete: vi.fn(),
  propertyUpdateMany: vi.fn(),
}));
const events = vi.hoisted(() => ({ record: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: database.userUpdate,
      findUnique: database.userFindUnique,
      findMany: database.userFindMany,
      delete: database.userDelete,
    },
    property: { updateMany: database.propertyUpdateMany },
  },
}));
vi.mock("@/lib/admin/events", () => ({ recordDomainEvent: events.record }));

import {
  processPendingAccountDeletions,
  requestAccountDeletion,
} from "@/lib/account-deletion";
import { PROPERTY_STATUSES } from "@/lib/constants";

describe("D1 üçün davamlı hesab silmə axını", () => {
  const now = new Date("2026-09-03T08:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    database.userUpdate.mockResolvedValue({});
    database.userFindUnique.mockResolvedValue({ isActive: false, deletionRequestedAt: now });
    database.userFindMany.mockResolvedValue([]);
    database.propertyUpdateMany.mockResolvedValue({ count: 1 });
    database.userDelete.mockResolvedValue({});
    events.record.mockResolvedValue(undefined);
  });

  it("əvvəl hesabı bloklayıb marker yazır, sonra əlaqəli elanları arxivləyir", async () => {
    await expect(requestAccountDeletion("user-1", now)).resolves.toEqual({ finalized: true });

    expect(database.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { isActive: false, deletionRequestedAt: now },
    });
    expect(events.record).toHaveBeenCalledWith("account.deletion_requested", "User", "user-1");
    expect(database.propertyUpdateMany).toHaveBeenCalledWith({
      where: { authorId: "user-1", deletedAt: null },
      data: { deletedAt: now, status: PROPERTY_STATUSES.ARCHIVED },
    });
    expect(database.userDelete).toHaveBeenCalledWith({ where: { id: "user-1" } });
  });

  it("ikinci addım alınmayanda hesabı aktivləşdirmir və növbədə saxlayır", async () => {
    database.propertyUpdateMany.mockRejectedValueOnce(new Error("D1 unavailable"));

    await expect(requestAccountDeletion("user-2", now)).resolves.toEqual({ finalized: false });
    expect(database.userUpdate).toHaveBeenCalledOnce();
    expect(database.userDelete).not.toHaveBeenCalled();
  });

  it("gündəlik maintenance marker-li hesabları yenidən sınayır", async () => {
    database.userFindMany.mockResolvedValue([{ id: "user-3" }, { id: "user-4" }]);
    database.userDelete.mockRejectedValueOnce(new Error("temporary failure"));

    await expect(processPendingAccountDeletions(now, 10)).resolves.toEqual({ completed: 1, failed: 1 });
    expect(database.userFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
    expect(database.propertyUpdateMany).toHaveBeenCalledTimes(2);
  });
});
