import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getLoginMethods, linkGoogleToUser, linkSocialToUser, unlinkLoginMethod } from "@/lib/auth/linked-logins";

/** Kabinetin «Bağlı giriş üsulları» qatı real D1-ə qarşı: bağlama, başqa hesabdakı kimlik, son giriş yolunun qorunması. */
const DB = (env as unknown as { DB: D1Database }).DB;

async function insertUser(id: string, passwordHash = "disabled") {
  await DB.prepare(
    'INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, \'EDITOR\', \'USER\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
  ).bind(id, id, `${id}@example.test`, passwordHash).run();
}

beforeAll(async () => {
  await insertUser("ll-a");
  await insertUser("ll-b", "pbkdf2$100000$x$y");
});

describe("bağlama", () => {
  it("Apple və Facebook (təsdiqsiz e-poçtla da) sessiya sahibinin hesabına bağlanır", async () => {
    expect(await linkSocialToUser("ll-a", "APPLE", { subject: "apple-1", email: "x@privaterelay.appleid.com", emailVerified: true })).toBe("linked");
    expect(await linkSocialToUser("ll-a", "FACEBOOK", { subject: "fb-1", email: "a@b.az", emailVerified: false })).toBe("linked");
    expect(await linkSocialToUser("ll-a", "APPLE", { subject: "apple-1", email: null, emailVerified: false })).toBe("already");
    expect(await linkSocialToUser("ll-a", "APPLE", { subject: "apple-2", email: null, emailVerified: false })).toBe("other");
  });

  it("başqa hesabdakı kimlik bağlanmır", async () => {
    expect(await linkSocialToUser("ll-b", "APPLE", { subject: "apple-1", email: null, emailVerified: true })).toBe("taken");
    expect(await linkGoogleToUser("ll-a", "google-1")).toBe("linked");
    expect(await linkGoogleToUser("ll-b", "google-1")).toBe("taken");
    expect(await linkGoogleToUser("ll-a", "google-2")).toBe("other");
  });
});

describe("ayırma", () => {
  it("başqa yol qaldıqca ayrılır, son yol qorunur", async () => {
    expect(await unlinkLoginMethod("ll-a", "APPLE")).toBe("unlinked");
    expect(await unlinkLoginMethod("ll-a", "GOOGLE")).toBe("unlinked");
    // Parolsuz hesabda yalnız Facebook qalıb.
    expect(await unlinkLoginMethod("ll-a", "FACEBOOK")).toBe("last-method");
    expect(await unlinkLoginMethod("ll-a", "APPLE")).toBe("not-linked");
    const view = await getLoginMethods("ll-a");
    expect(view.methods).toMatchObject({ password: false, google: false, apple: false, facebook: true });
    expect(await prisma.securityEvent.count({ where: { userId: "ll-a", kind: { in: ["LOGIN_METHOD_LINKED", "LOGIN_METHOD_UNLINKED"] } } })).toBe(5);
  });

  it("parollu hesab yeganə provayderi də ayıra bilir", async () => {
    expect(await linkGoogleToUser("ll-b", "google-b")).toBe("linked");
    expect(await unlinkLoginMethod("ll-b", "GOOGLE")).toBe("unlinked");
  });
});
