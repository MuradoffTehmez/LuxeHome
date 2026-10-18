import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * «Məlumatlarımı yüklə» (#157) gizli dəyər daşımamalıdır. İxrac `select` ilə qurulur,
 * ona görə sahə adı mənbədə yoxdursa, JSON-a da düşə bilməz.
 */
const SOURCE = readFileSync("src/lib/accounts/data-export.ts", "utf8");

const SECRETS = [
  "passwordHash",
  "totpSecret",
  "backupCodes",
  "calendarToken",
  "inviteToken",
  "p256dh",
  "auth: true",
  "failedAttempts",
  "lockedUntil",
  "passkeys",
  // Telegram/sosial giriş: ID və tokenlər ixraca düşmür (yalnız status və istifadəçi adı).
  "telegramUserId",
  "oidcSub",
  "chatId: true",
  "subject: true",
  "tokenHash",
];

describe("hesab məlumatı ixracı (#157)", () => {
  it.each(SECRETS)("«%s» ixraca daxil edilmir", (field) => {
    expect(SOURCE).not.toContain(field);
  });

  it("başqasının əlaqə məlumatı (müraciət, rəy yazanın adı) ixraca düşmür", () => {
    expect(SOURCE).not.toMatch(/prisma\.lead\./);
    expect(SOURCE).not.toContain("customerName");
  });
});
