import { describe, expect, it } from "vitest";
import { ACCOUNT_TYPES, AUTH_KINDS } from "@/lib/constants";
import { signedSessionRedirect } from "../session-routing";

describe("imzalı sessiya marşrutları", () => {
  it("köhnə və ya etibarsız cookie ilə kabinetdən reauth ünvanına yönləndirir", () => {
    expect(signedSessionRedirect("/ru/kabinet", "?filtr=1", null)).toBe(
      "/ru/daxil-ol?davam=%2Fru%2Fkabinet%3Ffiltr%3D1&yeniden=1",
    );
  });

  it("ictimai sessiyanın admin panelinə keçməsini kabinetə yönləndirir", () => {
    expect(
      signedSessionRedirect("/admin/emlaklar", "", {
        accountType: ACCOUNT_TYPES.USER,
        authKind: AUTH_KINDS.PUBLIC,
      }, "en"),
    ).toBe("/en/kabinet");
  });

  it("staff sessiyası kabinet əvəzinə panelə yönləndirilir", () => {
    expect(
      signedSessionRedirect("/az/kabinet", "", {
        accountType: ACCOUNT_TYPES.STAFF,
        authKind: AUTH_KINDS.STAFF_2FA,
      }),
    ).toBe("/admin");
  });

  it("yenidən giriş flag-i olduqda köhnə staff cookie-si login səhifəsindən panelə qaytarmır", () => {
    expect(
      signedSessionRedirect("/ru/giris", "?yeniden=1", {
        accountType: ACCOUNT_TYPES.STAFF,
        authKind: AUTH_KINDS.STAFF_2FA,
      }),
    ).toBeNull();
  });

  it("ictimai sessiyanı locale-prefiksli işçi girişindən eyni dildə kabinetə qaytarır", () => {
    expect(
      signedSessionRedirect("/en/giris", "", {
        accountType: ACCOUNT_TYPES.OWNER,
        authKind: AUTH_KINDS.PUBLIC,
      }),
    ).toBe("/en/kabinet");
  });

  /**
   * Marşrut təsnifatının bütövlüyü.
   *
   * CodeQL bu funksiyadakı `if (isAdminRoute)` şərtini `js/user-controlled-bypass`
   * kimi işarələyir, çünki şərti URL — yəni istifadəçinin seçdiyi dəyər — idarə edir.
   * Router-də bu qaçılmazdır; real sual budur ki, panel yolunun hansısa yazılışı
   * təsnifatdan **kənarda** qalıb qapını yan keçə bilirmi. Aşağıdakı matris həmin
   * invariantı bağlayır.
   *
   * Qapı onsuz da yeganə müdafiə deyil: `admin/layout.tsx` və hər server action
   * sessiyanı D1-dən oxuyur (CLAUDE.md, «Qoruma iki həlqəlidir»).
   */
  describe("panel yolunun təsnifatı", () => {
    const adminPaths = ["/admin", "/admin/", "/admin/emlaklar", "/admin/emlaklar/yeni"];
    // Locale prefiksli variant middleware-də `canonicalAdminPath()` ilə 308 alır;
    // buraya düşsə belə locale soyulduğu üçün yenə qapıdan keçməlidir.
    const localePrefixed = ["/az/admin", "/en/admin/emlaklar", "/ru/admin/audit"];

    for (const pathname of [...adminPaths, ...localePrefixed]) {
      it(`sessiyasız keçid vermir: ${pathname}`, () => {
        expect(signedSessionRedirect(pathname, "", null)).not.toBeNull();
      });

      // Yönləndirmə marşrutun öz dilində qalır (`/en/admin/...` → `/en/kabinet`).
      it(`ictimai sessiyaya keçid vermir: ${pathname}`, () => {
        expect(
          signedSessionRedirect(pathname, "", {
            accountType: ACCOUNT_TYPES.USER,
            authKind: AUTH_KINDS.PUBLIC,
          }),
        ).toMatch(/^\/(az|en|ru)\/kabinet$/);
      });

      it(`ikinci mərhələsi bitməmiş staff sessiyasına keçid vermir: ${pathname}`, () => {
        expect(
          signedSessionRedirect(pathname, "", {
            accountType: ACCOUNT_TYPES.STAFF,
            authKind: AUTH_KINDS.PUBLIC,
          }),
        ).not.toBeNull();
      });
    }

    it("panel olmayan, adı oxşar yolu səhvən qapıya salmır", () => {
      for (const pathname of ["/administrator", "/adminx", "/az/administrator"]) {
        expect(signedSessionRedirect(pathname, "", null)).toBeNull();
      }
    });

    it("tam 2FA-lı staff sessiyasını panelə buraxır", () => {
      for (const pathname of adminPaths) {
        expect(
          signedSessionRedirect(pathname, "", {
            accountType: ACCOUNT_TYPES.STAFF,
            authKind: AUTH_KINDS.STAFF_2FA,
          }),
        ).toBeNull();
      }
    });
  });
});
