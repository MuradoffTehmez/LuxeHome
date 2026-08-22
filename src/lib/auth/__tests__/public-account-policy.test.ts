import { describe, expect, it } from "vitest";
import { ACCOUNT_TYPES } from "@/lib/constants";
import {
  canAccessAdmin,
  canUsePublicSignIn,
  isCabinetPath,
  safePublicTarget,
} from "../public-account-policy";

describe("ictimai hesab giriş siyasəti", () => {
  it("əməkdaş hesabını ictimai girişdən kənarda saxlayır", () => {
    expect(canUsePublicSignIn(ACCOUNT_TYPES.STAFF)).toBe(false);
    expect(canUsePublicSignIn(ACCOUNT_TYPES.USER)).toBe(true);
    expect(canUsePublicSignIn(ACCOUNT_TYPES.OWNER)).toBe(true);
    expect(canUsePublicSignIn(ACCOUNT_TYPES.AGENCY)).toBe(true);
  });

  it("ictimai hesabın admin panelinə girişini rədd edir", () => {
    expect(canAccessAdmin(ACCOUNT_TYPES.STAFF)).toBe(true);
    expect(canAccessAdmin(ACCOUNT_TYPES.USER)).toBe(false);
    expect(canAccessAdmin(ACCOUNT_TYPES.OWNER)).toBe(false);
    expect(canAccessAdmin(ACCOUNT_TYPES.AGENCY)).toBe(false);
  });
});

describe("ictimai girişdən sonrakı davam ünvanı", () => {
  it("saytdaxili nisbi kabinet yolunu saxlayır", () => {
    expect(safePublicTarget("/kabinet/elanlar/yeni?qaralama=1")).toBe(
      "/kabinet/elanlar/yeni?qaralama=1",
    );
  });

  it("admin və kənar yönləndirmələri rədd edir", () => {
    expect(safePublicTarget("/admin/emlaklar")).toBeUndefined();
    expect(safePublicTarget("//example.com")).toBeUndefined();
    expect(safePublicTarget("https://example.com")).toBeUndefined();
  });
});

describe("kabinet marşrut qapısı", () => {
  it("kabinetin özünü və alt marşrutlarını qorunan sayır", () => {
    expect(isCabinetPath("/kabinet")).toBe(true);
    expect(isCabinetPath("/kabinet/elanlar/yeni")).toBe(true);
    expect(isCabinetPath("/emlaklar")).toBe(false);
  });
});
