import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  userFindMany: vi.fn(),
  userFindFirst: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  userDelete: vi.fn(),
  userCount: vi.fn(),
  backupCodeDeleteMany: vi.fn(),
}));

const effects = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireAdminAction: vi.fn(),
  hashPassword: vi.fn(),
  revokeAllSessions: vi.fn(),
  recordAudit: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: effects.revalidatePath }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: database.userFindMany,
      findFirst: database.userFindFirst,
      findUnique: database.userFindUnique,
      create: database.userCreate,
      update: database.userUpdate,
      delete: database.userDelete,
      count: database.userCount,
    },
    backupCode: { deleteMany: database.backupCodeDeleteMany },
  },
}));
vi.mock("@/lib/admin/guard", () => ({
  AdminGuardError: class AdminGuardError extends Error {},
  requireAdminAction: effects.requireAdminAction,
}));
vi.mock("@/lib/auth/password", () => ({ hashPassword: effects.hashPassword }));
vi.mock("@/lib/auth/session", () => ({ revokeAllSessions: effects.revokeAllSessions }));
vi.mock("@/lib/admin/audit", () => ({ recordAudit: effects.recordAudit }));

import { resetUserPassword, updateUser } from "@/app/admin/istifadeciler/actions";
import { getAdminUsers } from "@/lib/queries";

describe("panel istifadəçi idarəsinin STAFF sərhədi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    effects.requireAdminAction.mockResolvedValue({
      id: "actor-staff",
      email: "admin@example.test",
      name: "Admin",
      role: "SUPER_ADMIN",
      accountType: "STAFF",
      isActive: true,
    });
    effects.hashPassword.mockResolvedValue("hashed-password");
    database.userUpdate.mockResolvedValue({ email: "public@example.test" });
  });

  it("ictimai hesabı parol sıfırlama hədəfi kimi tapılmamış sayır", async () => {
    database.userFindFirst.mockImplementation(async (args: { where?: Record<string, unknown> }) =>
      args.where?.id === "public-user" && args.where?.accountType !== "STAFF"
        ? {
            id: "public-user",
            email: "public@example.test",
            role: "SUPER_ADMIN",
            isActive: true,
            accountType: "OWNER",
          }
        : null,
    );

    const result = await resetUserPassword("public-user");

    expect(result).toMatchObject({ status: "error", message: "İstifadəçi tapılmadı." });
    expect(database.userUpdate).not.toHaveBeenCalled();
    expect(effects.revokeAllSessions).not.toHaveBeenCalled();
    expect(effects.recordAudit).not.toHaveBeenCalled();
  });

  it("son aktiv STAFF Super Admin hesablananda ictimai Super Admin rollarını saymır", async () => {
    database.userFindFirst.mockResolvedValue({
      id: "last-staff-super-admin",
      email: "staff@example.test",
      role: "SUPER_ADMIN",
      isActive: true,
      accountType: "STAFF",
    });
    database.userCount.mockImplementation(async (args: { where?: Record<string, unknown> }) =>
      args.where?.accountType === "STAFF" ? 1 : 2,
    );

    const formData = new FormData();
    formData.set("id", "last-staff-super-admin");
    formData.set("name", "Son Admin");
    formData.set("role", "ADMIN");
    formData.set("isActive", "on");

    const result = await updateUser({ status: "idle" }, formData);

    expect(result).toMatchObject({
      status: "error",
      message: "Sistemdə ən azı bir aktiv Super Admin qalmalıdır.",
    });
    expect(database.userUpdate).not.toHaveBeenCalled();
  });

  it("panel siyahısında yalnız STAFF hesablarını sorğulayır", async () => {
    database.userFindMany.mockResolvedValue([]);

    await getAdminUsers();

    expect(database.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { accountType: "STAFF" } }),
    );
  });
});
