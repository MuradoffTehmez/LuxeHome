import { describe, expect, it } from "vitest";
import { canUnlinkLogin, isLinkableProvider, linkDecision, linkResultQuery, type LoginMethods } from "@/lib/auth/linked-logins-policy";

const none: LoginMethods = { password: false, google: false, apple: false, facebook: false, telegram: false, phone: false };

describe("ayırma qaydası — hesab kilidlənmir", () => {
  it("yeganə giriş yolu ayrılmır", () => {
    expect(canUnlinkLogin({ ...none, google: true }, "GOOGLE")).toBe(false);
  });

  it("parol, başqa provayder, Telegram və ya SMS qalırsa ayrılır", () => {
    expect(canUnlinkLogin({ ...none, google: true, password: true }, "GOOGLE")).toBe(true);
    expect(canUnlinkLogin({ ...none, apple: true, facebook: true }, "APPLE")).toBe(true);
    expect(canUnlinkLogin({ ...none, facebook: true, telegram: true }, "FACEBOOK")).toBe(true);
    expect(canUnlinkLogin({ ...none, facebook: true, phone: true }, "FACEBOOK")).toBe(true);
  });

  it("bağlı olmayan provayder ayrılmır", () => {
    expect(canUnlinkLogin({ ...none, password: true }, "APPLE")).toBe(false);
  });
});

describe("bağlama qərarı", () => {
  it("başqa hesabdakı kimlik bağlanmır, mövcud kimlik əvəzlənmir", () => {
    expect(linkDecision({ userId: "u1", holderUserId: "u2", currentSubject: null, subject: "s" })).toBe("taken");
    expect(linkDecision({ userId: "u1", holderUserId: "u1", currentSubject: "s", subject: "s" })).toBe("already");
    expect(linkDecision({ userId: "u1", holderUserId: null, currentSubject: "köhnə", subject: "s" })).toBe("other");
    expect(linkDecision({ userId: "u1", holderUserId: null, currentSubject: null, subject: "s" })).toBe("linked");
  });

  it("yalnız allowlist provayderlər və nəticələr URL-ə düşür", () => {
    expect(isLinkableProvider("APPLE")).toBe(true);
    expect(isLinkableProvider("TELEGRAM")).toBe(false);
    expect(linkResultQuery("FACEBOOK", "taken")).toBe("bagla=facebook&netice=taken");
  });
});
