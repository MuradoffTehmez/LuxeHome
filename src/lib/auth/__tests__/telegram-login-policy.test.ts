import { describe, expect, it } from "vitest";
import { telegramIdentityFromClaims, telegramLoginDecision, validateTelegramClaims } from "@/lib/auth/telegram-login-policy";

const NOW = new Date("2026-10-18T10:00:00Z");
const exp = Math.floor(NOW.getTime() / 1000) + 300;
const base = { iss: "https://oauth.telegram.org", aud: 7_000_000_001, exp, sub: "sub-1", id: 123456789, name: "Əli", preferred_username: "ali_az", nonce: "n1" };

const user = (overrides: Partial<{ userId: string; accountType: string; isActive: boolean; lockedUntil: Date | null; deletionRequestedAt: Date | null; oidcSub: string | null }> = {}) => ({
  userId: "u1",
  accountType: "USER",
  isActive: true,
  lockedUntil: null,
  deletionRequestedAt: null,
  oidcSub: null,
  ...overrides,
});

describe("Telegram OIDC iddiaları", () => {
  it("issuer, audience (rəqəm də ola bilər), exp və nonce yoxlanılır", () => {
    expect(validateTelegramClaims(base, { clientId: "7000000001", nonce: "n1", now: NOW })).toMatchObject({ sub: "sub-1", telegramUserId: "123456789", username: "ali_az" });
    expect(validateTelegramClaims({ ...base, iss: "https://evil.example" }, { clientId: "7000000001", nonce: "n1", now: NOW })).toBeNull();
    expect(validateTelegramClaims({ ...base, aud: "999" }, { clientId: "7000000001", nonce: "n1", now: NOW })).toBeNull();
    expect(validateTelegramClaims({ ...base, exp: exp - 600 }, { clientId: "7000000001", nonce: "n1", now: NOW })).toBeNull();
    expect(validateTelegramClaims({ ...base, nonce: "başqa" }, { clientId: "7000000001", nonce: "n1", now: NOW })).toBeNull();
  });

  it("kimlik dəyişməz ID-dir, istifadəçi adı deyil", () => {
    expect(telegramIdentityFromClaims({ sub: "s", preferred_username: "ali" })).toBeNull();
    expect(telegramIdentityFromClaims({ sub: "s", id: 1.5 })).toBeNull();
    expect(telegramIdentityFromClaims({ sub: "555", preferred_username: "bad name!" })).toEqual({ sub: "555", telegramUserId: "555", name: null, username: null });
  });
});

describe("hesab qərarı", () => {
  it("tanınmayan kimlik — yeni hesab axını (avtomatik birləşdirmə yoxdur)", () => {
    expect(telegramLoginDecision({ bySub: null, byTelegramId: null, sub: "s", now: NOW })).toEqual({ action: "ONBOARD" });
  });

  it("bağlı kimlik — giriş; ilk OIDC girişində `sub` yazılır", () => {
    expect(telegramLoginDecision({ bySub: null, byTelegramId: user(), sub: "s", now: NOW })).toEqual({ action: "SIGN_IN", userId: "u1", storeSub: true });
    expect(telegramLoginDecision({ bySub: user({ oidcSub: "s" }), byTelegramId: user({ oidcSub: "s" }), sub: "s", now: NOW })).toEqual({ action: "SIGN_IN", userId: "u1", storeSub: false });
  });

  it("ziddiyyət, əməkdaş, deaktiv və kilidli hesab rədd olunur", () => {
    expect(telegramLoginDecision({ bySub: user(), byTelegramId: user({ userId: "u2" }), sub: "s", now: NOW })).toEqual({ action: "REJECT", reason: "CONFLICT" });
    expect(telegramLoginDecision({ bySub: null, byTelegramId: user({ oidcSub: "other" }), sub: "s", now: NOW })).toEqual({ action: "REJECT", reason: "CONFLICT" });
    expect(telegramLoginDecision({ bySub: null, byTelegramId: user({ accountType: "STAFF" }), sub: "s", now: NOW })).toEqual({ action: "REJECT", reason: "STAFF" });
    expect(telegramLoginDecision({ bySub: null, byTelegramId: user({ isActive: false }), sub: "s", now: NOW })).toEqual({ action: "REJECT", reason: "INACTIVE" });
    expect(telegramLoginDecision({ bySub: null, byTelegramId: user({ deletionRequestedAt: NOW }), sub: "s", now: NOW })).toEqual({ action: "REJECT", reason: "INACTIVE" });
    expect(telegramLoginDecision({ bySub: null, byTelegramId: user({ lockedUntil: new Date(NOW.getTime() + 60_000) }), sub: "s", now: NOW })).toEqual({ action: "REJECT", reason: "LOCKED" });
  });
});
