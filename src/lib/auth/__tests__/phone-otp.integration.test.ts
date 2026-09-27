import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { OTP_PURPOSES, consumePhoneOtp, issuePhoneOtp, otpCodeHash } from "../phone-otp";
import { OTP_MAX_ATTEMPTS, generateOtpCode, normalizeAzMobile, otpSendDecision } from "../phone-otp-policy";

/** Telefon OTP-si (#109): normallaşdırma, göndəriş limiti və real D1-də birdəfəlik kod. */
const DB = (env as unknown as { DB: D1Database }).DB;
const phone = "+994501234567";
const now = new Date("2026-10-01T10:00:00.000Z");

beforeAll(() => {
  process.env.AUTH_SECRET = "test-auth-secret-32-bytes-minimum-length";
});

async function seedOtp(code: string, overrides: { expiresAt?: Date; attempts?: number } = {}) {
  const id = crypto.randomUUID();
  await DB.prepare('INSERT INTO "PhoneOtp" ("id", "phone", "purpose", "userId", "codeHash", "attempts", "expiresAt", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, phone, OTP_PURPOSES.LOGIN, "user-1", await otpCodeHash(phone, OTP_PURPOSES.LOGIN, code), overrides.attempts ?? 0,
      (overrides.expiresAt ?? new Date(now.getTime() + 5 * 60_000)).toISOString(), now.toISOString())
    .run();
  return id;
}

describe("telefon nömrəsi və kod", () => {
  it("Azərbaycan mobil nömrəsini E.164-ə salır, stasionar və pozulmuşu rədd edir", () => {
    expect(normalizeAzMobile("050 123 45 67")).toBe(phone);
    expect(normalizeAzMobile("+994 50 123-45-67")).toBe(phone);
    expect(normalizeAzMobile("501234567")).toBe(phone);
    expect(normalizeAzMobile("+994 12 404 00 00")).toBeNull();
    expect(normalizeAzMobile("12345")).toBeNull();
    expect(normalizeAzMobile(null)).toBeNull();
  });

  it("6 rəqəmli kod yaradır", () => {
    for (let index = 0; index < 50; index++) expect(generateOtpCode()).toMatch(/^\d{6}$/);
  });

  it("göndərişi fasilə və saatlıq limitlə məhdudlaşdırır", () => {
    expect(otpSendDecision([], now)).toBe("SEND");
    expect(otpSendDecision([new Date(now.getTime() - 30_000)], now)).toBe("COOLDOWN");
    expect(otpSendDecision([new Date(now.getTime() - 90_000)], now)).toBe("SEND");
    const five = Array.from({ length: 5 }, (_, index) => new Date(now.getTime() - (index + 2) * 60_000));
    expect(otpSendDecision(five, now)).toBe("LIMIT");
    expect(otpSendDecision(five.map((date) => new Date(date.getTime() - 3_600_000)), now)).toBe("SEND");
  });
});

describe("OTP D1-də", () => {
  it("düzgün kodu bir dəfə qəbul edir", async () => {
    await seedOtp("123456");
    await expect(consumePhoneOtp({ phone, purpose: OTP_PURPOSES.LOGIN, code: "123 456", now })).resolves.toEqual({ ok: true, userId: "user-1" });
    await expect(consumePhoneOtp({ phone, purpose: OTP_PURPOSES.LOGIN, code: "123456", now })).resolves.toEqual({ ok: false, reason: "expired" });
  });

  it("səhv cəhdləri sayır və limitdən sonra düzgün kodu da rədd edir", async () => {
    const id = await seedOtp("654321");
    for (let index = 0; index < OTP_MAX_ATTEMPTS; index++) {
      await expect(consumePhoneOtp({ phone, purpose: OTP_PURPOSES.LOGIN, code: "000000", now })).resolves.toEqual({ ok: false, reason: "invalid" });
    }
    const row = await DB.prepare('SELECT "attempts" FROM "PhoneOtp" WHERE "id" = ?').bind(id).first<{ attempts: number }>();
    expect(row?.attempts).toBe(OTP_MAX_ATTEMPTS);
    await expect(consumePhoneOtp({ phone, purpose: OTP_PURPOSES.LOGIN, code: "654321", now })).resolves.toEqual({ ok: false, reason: "expired" });
  });

  it("vaxtı bitmiş kodu və başqa məqsədin kodunu qəbul etmir", async () => {
    await seedOtp("111111", { expiresAt: new Date(now.getTime() - 1000) });
    await expect(consumePhoneOtp({ phone, purpose: OTP_PURPOSES.LOGIN, code: "111111", now })).resolves.toEqual({ ok: false, reason: "expired" });
    await seedOtp("222222");
    await expect(consumePhoneOtp({ phone, purpose: OTP_PURPOSES.VERIFY, code: "222222", now })).resolves.toEqual({ ok: false, reason: "expired" });
  });

  it("SMS qurulmayanda da limit tətbiq olunur, yeni kod köhnəni etibarsız edir", async () => {
    const later = new Date(now.getTime() + 10 * 60_000);
    const first = await issuePhoneOtp({ phone: "+994551112233", purpose: OTP_PURPOSES.LOGIN, userId: "user-2", locale: "az", now: later });
    expect(first).toEqual({ decision: "SEND", sent: false });
    const second = await issuePhoneOtp({ phone: "+994551112233", purpose: OTP_PURPOSES.LOGIN, userId: "user-2", locale: "az", now: new Date(later.getTime() + 10_000) });
    expect(second).toEqual({ decision: "COOLDOWN", sent: false });
    const third = await issuePhoneOtp({ phone: "+994551112233", purpose: OTP_PURPOSES.LOGIN, userId: "user-2", locale: "az", now: new Date(later.getTime() + 120_000) });
    expect(third.decision).toBe("SEND");
    const active = await DB.prepare('SELECT COUNT(*) AS n FROM "PhoneOtp" WHERE "phone" = ? AND "consumedAt" IS NULL').bind("+994551112233").first<{ n: number }>();
    expect(active?.n).toBe(1);
  });
});
