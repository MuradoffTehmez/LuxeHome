import { describe, expect, it } from "vitest";
import { ACCOUNT_TYPES, AUTH_KINDS } from "@/lib/constants";
import { signedSessionRedirect } from "../session-routing";

describe("imzalı sessiya marşrutları", () => {
  it("köhnə və ya etibarsız cookie ilə kabinetdən reauth ünvanına yönləndirir", () => {
    expect(signedSessionRedirect("/kabinet", "?filtr=1", null)).toBe(
      "/daxil-ol?davam=%2Fkabinet%3Ffiltr%3D1&yeniden=1",
    );
  });

  it("ictimai sessiyanın admin panelinə keçməsini kabinetə yönləndirir", () => {
    expect(
      signedSessionRedirect("/admin/emlaklar", "", {
        accountType: ACCOUNT_TYPES.USER,
        authKind: AUTH_KINDS.PUBLIC,
      }),
    ).toBe("/kabinet");
  });

  it("staff sessiyası kabinet əvəzinə panelə yönləndirilir", () => {
    expect(
      signedSessionRedirect("/kabinet", "", {
        accountType: ACCOUNT_TYPES.STAFF,
        authKind: AUTH_KINDS.STAFF_2FA,
      }),
    ).toBe("/admin");
  });

  it("yenidən giriş flag-i olduqda köhnə staff cookie-si login səhifəsindən panelə qaytarmır", () => {
    expect(
      signedSessionRedirect("/giris", "?yeniden=1", {
        accountType: ACCOUNT_TYPES.STAFF,
        authKind: AUTH_KINDS.STAFF_2FA,
      }),
    ).toBeNull();
  });
});
