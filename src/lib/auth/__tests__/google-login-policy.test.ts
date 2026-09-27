import { describe, expect, it } from "vitest";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { googleLinkDecision } from "../google-login-policy";

const now = new Date("2026-10-01T10:00:00Z");
const claims = { sub: "g-1", email: "user@example.test", emailVerified: true };
const user = (overrides: Partial<Parameters<typeof googleLinkDecision>[0]["byEmail"] & object> = {}) => ({
  id: "u-1",
  accountType: ACCOUNT_TYPES.USER,
  isActive: true,
  lockedUntil: null,
  googleSub: null,
  emailVerifiedAt: new Date("2026-01-01T00:00:00Z"),
  deletionRequestedAt: null,
  ...overrides,
});

describe("Google ilə giriş — hesab bağlama", () => {
  it("bağlı Google kimliyi ilə daxil edir, yeni e-poçtla hesab yaradır", () => {
    expect(googleLinkDecision({ claims, bySub: user({ googleSub: "g-1" }), byEmail: null, now })).toEqual({ action: "SIGN_IN", userId: "u-1" });
    expect(googleLinkDecision({ claims, bySub: null, byEmail: null, now })).toEqual({ action: "CREATE" });
  });

  it("təsdiqlənməmiş Google e-poçtu ilə nə hesab yaradır, nə bağlayır", () => {
    const unverified = { ...claims, emailVerified: false };
    expect(googleLinkDecision({ claims: unverified, bySub: null, byEmail: null, now })).toEqual({ action: "REJECT", reason: "UNVERIFIED_EMAIL" });
    expect(googleLinkDecision({ claims: unverified, bySub: null, byEmail: user(), now })).toEqual({ action: "REJECT", reason: "UNVERIFIED_EMAIL" });
  });

  it("əməkdaş, deaktiv, silinməkdə olan və kilidli hesabı rədd edir", () => {
    expect(googleLinkDecision({ claims, bySub: null, byEmail: user({ accountType: ACCOUNT_TYPES.STAFF }), now })).toEqual({ action: "REJECT", reason: "STAFF" });
    expect(googleLinkDecision({ claims, bySub: user({ accountType: ACCOUNT_TYPES.STAFF, googleSub: "g-1" }), byEmail: null, now })).toEqual({ action: "REJECT", reason: "STAFF" });
    expect(googleLinkDecision({ claims, bySub: null, byEmail: user({ isActive: false }), now })).toEqual({ action: "REJECT", reason: "INACTIVE" });
    expect(googleLinkDecision({ claims, bySub: null, byEmail: user({ deletionRequestedAt: now }), now })).toEqual({ action: "REJECT", reason: "INACTIVE" });
    expect(googleLinkDecision({ claims, bySub: null, byEmail: user({ lockedUntil: new Date(now.getTime() + 60_000) }), now })).toEqual({ action: "REJECT", reason: "LOCKED" });
  });

  it("təsdiqlənmiş hesabı parolunu saxlayaraq, təsdiqlənməmişi parolunu ləğv edərək bağlayır", () => {
    expect(googleLinkDecision({ claims, bySub: null, byEmail: user(), now })).toEqual({ action: "LINK", userId: "u-1", revokePassword: false });
    // Pre-hijacking: başqasının e-poçtu ilə əvvəlcədən açılmış hesabın parolu işləməz qalmalıdır.
    expect(googleLinkDecision({ claims, bySub: null, byEmail: user({ emailVerifiedAt: null }), now })).toEqual({ action: "LINK", userId: "u-1", revokePassword: true });
  });

  it("başqa Google kimliyinə bağlı hesaba ikinci kimlik bağlamır", () => {
    expect(googleLinkDecision({ claims, bySub: null, byEmail: user({ googleSub: "g-2" }), now })).toEqual({ action: "REJECT", reason: "OTHER_GOOGLE_ACCOUNT" });
  });
});
