import { describe, expect, it } from "vitest";
import {
  appleClaimsFromPayload,
  appleUserName,
  facebookClaimsFromProfile,
  socialFailureCode,
  socialLinkDecision,
} from "@/lib/auth/social-login-policy";

const NOW = new Date("2026-10-18T10:00:00Z");
const user = (overrides: Partial<{ id: string; accountType: string; isActive: boolean; lockedUntil: Date | null; emailVerifiedAt: Date | null; deletionRequestedAt: Date | null }> = {}) => ({
  id: "u1",
  accountType: "USER",
  isActive: true,
  lockedUntil: null,
  emailVerifiedAt: NOW,
  deletionRequestedAt: null,
  ...overrides,
});
const verified = { subject: "s1", email: "a@b.az", emailVerified: true, name: null };
const unverified = { ...verified, emailVerified: false };

describe("Apple/Facebook hesab qərarı", () => {
  it("bağlı kimlik — giriş", () => {
    expect(socialLinkDecision({ claims: verified, bySubject: user(), byEmail: null, byEmailHasOtherIdentity: false, now: NOW })).toEqual({ action: "SIGN_IN", userId: "u1" });
  });

  it("təsdiqli e-poçt (Apple): yoxdursa yarat, varsa bağla; təsdiqsiz hesabın parolu ləğv olunur", () => {
    expect(socialLinkDecision({ claims: verified, bySubject: null, byEmail: null, byEmailHasOtherIdentity: false, now: NOW })).toEqual({ action: "CREATE" });
    expect(socialLinkDecision({ claims: verified, bySubject: null, byEmail: user(), byEmailHasOtherIdentity: false, now: NOW })).toEqual({ action: "LINK", userId: "u1", revokePassword: false });
    expect(socialLinkDecision({ claims: verified, bySubject: null, byEmail: user({ emailVerifiedAt: null }), byEmailHasOtherIdentity: false, now: NOW })).toEqual({ action: "LINK", userId: "u1", revokePassword: true });
  });

  it("təsdiqsiz e-poçt (Facebook): mövcud hesaba bağlanmır, yeni hesab yalnız e-poçt təsdiqi ilə", () => {
    expect(socialLinkDecision({ claims: unverified, bySubject: null, byEmail: user(), byEmailHasOtherIdentity: false, now: NOW })).toEqual({ action: "REJECT", reason: "EMAIL_EXISTS" });
    expect(socialLinkDecision({ claims: unverified, bySubject: null, byEmail: null, byEmailHasOtherIdentity: false, now: NOW })).toEqual({ action: "CONFIRM_EMAIL" });
  });

  it("e-poçtsuz, əməkdaş və başqa kimlikli hesab rədd olunur", () => {
    expect(socialLinkDecision({ claims: { ...verified, email: null }, bySubject: null, byEmail: null, byEmailHasOtherIdentity: false, now: NOW })).toEqual({ action: "REJECT", reason: "NO_EMAIL" });
    expect(socialLinkDecision({ claims: verified, bySubject: user({ accountType: "STAFF" }), byEmail: null, byEmailHasOtherIdentity: false, now: NOW })).toEqual({ action: "REJECT", reason: "STAFF" });
    expect(socialLinkDecision({ claims: verified, bySubject: null, byEmail: user(), byEmailHasOtherIdentity: true, now: NOW })).toEqual({ action: "REJECT", reason: "OTHER_IDENTITY" });
    expect(socialFailureCode("STAFF")).toBe("emekdas");
  });
});

describe("provayder iddiaları", () => {
  it("Apple: nonce məcburidir, `email_verified` sətir də ola bilər", () => {
    expect(appleClaimsFromPayload({ sub: "001.abc", email: "X@Privaterelay.appleid.com", email_verified: "true", nonce: "n" }, "n")).toEqual({ subject: "001.abc", email: "x@privaterelay.appleid.com", emailVerified: true });
    expect(appleClaimsFromPayload({ sub: "001.abc", nonce: "başqa" }, "n")).toBeNull();
    expect(appleClaimsFromPayload({ sub: "001.abc", email: "a@b.az", email_verified: false, nonce: "n" }, "n")?.emailVerified).toBe(false);
    expect(appleUserName(JSON.stringify({ name: { firstName: "Əli", lastName: "Vəliyev" } }))).toBe("Əli Vəliyev");
    expect(appleUserName("{pozuq")).toBeNull();
  });

  it("Facebook: e-poçt həmişə təsdiqsizdir, ID yalnız rəqəmdir", () => {
    expect(facebookClaimsFromProfile({ id: "1234", email: "a@b.az", name: "Ə" })).toEqual({ subject: "1234", email: "a@b.az", emailVerified: false, name: "Ə" });
    expect(facebookClaimsFromProfile({ id: "abc" })).toBeNull();
  });
});
