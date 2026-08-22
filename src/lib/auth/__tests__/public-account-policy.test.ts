import { describe, expect, it } from "vitest";
import { ACCOUNT_TYPES } from "@/lib/constants";
import {
  accountAuthHref,
  canAccessAdmin,
  canUsePublicSignIn,
  publicSignInOutcome,
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

  it("giriş və qeydiyyat arasında təhlükəsiz davam ünvanını qoruyur", () => {
    expect(accountAuthHref("/qeydiyyat", "/kabinet/elanlar/yeni?qaralama=1")).toBe(
      "/qeydiyyat?davam=%2Fkabinet%2Felanlar%2Fyeni%3Fqaralama%3D1",
    );
    expect(accountAuthHref("/daxil-ol", "/admin")).toBe("/daxil-ol");
  });
});

describe("kabinet marşrut qapısı", () => {
  it("kabinetin özünü və alt marşrutlarını qorunan sayır", () => {
    expect(isCabinetPath("/kabinet")).toBe(true);
    expect(isCabinetPath("/kabinet/elanlar/yeni")).toBe(true);
    expect(isCabinetPath("/emlaklar")).toBe(false);
  });
});

describe("ictimai giriş cavabı", () => {
  it("staff yönləndirməsini yalnız düzgün paroldan sonra verir", () => {
    const staff = { accountType: ACCOUNT_TYPES.STAFF, isActive: true, lockedUntil: null };

    expect(publicSignInOutcome(staff, false, new Date("2026-08-22T10:00:00Z"))).toBe("INVALID");
    expect(publicSignInOutcome(staff, true, new Date("2026-08-22T10:00:00Z"))).toBe("STAFF");
  });

  it("deaktiv və ya yanlış parollu hesabı generik rədd edir", () => {
    expect(
      publicSignInOutcome(
        { accountType: ACCOUNT_TYPES.USER, isActive: false, lockedUntil: null },
        true,
        new Date("2026-08-22T10:00:00Z"),
      ),
    ).toBe("INVALID");
    expect(publicSignInOutcome(null, false, new Date("2026-08-22T10:00:00Z"))).toBe("INVALID");
  });
});
