import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

let pathname = "/admin";
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/[locale]/giris/actions", () => ({ signOut: vi.fn() }));

import { AdminShell } from "../admin-shell";

describe("AdminShell", () => {
  it("mobil drawer və işlək admin axtarışını göstərir", () => {
    pathname = "/admin";
    const html = renderToStaticMarkup(
      <AdminShell
        user={{
          id: "staff-1",
          name: "Admin User",
          email: "admin@example.az",
          avatarUrl: null,
          role: "SUPER_ADMIN",
          accountType: "STAFF",
          mustChangePassword: false,
          totpEnabled: true,
          locale: "az",
          themePreference: "system",
        }}
      >
        <p>Panel məzmunu</p>
      </AdminShell>,
    );

    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-label="Admin naviqasiyası"');
    expect(html).toContain("hidden w-[292px]");
    expect(html).toContain('aria-label="Admin paneldə axtar"');
    expect(html).toContain("Ctrl K");
  });

  it("cari SERP alt səhifəsini sidebar daxilində açıq və aktiv göstərir", () => {
    pathname = "/admin/serp/audit";
    const html = renderToStaticMarkup(
      <AdminShell
        user={{
          id: "staff-1",
          name: "Admin User",
          email: "admin@example.az",
          avatarUrl: null,
          role: "SUPER_ADMIN",
          accountType: "STAFF",
          mustChangePassword: false,
          totpEnabled: true,
          locale: "az",
          themePreference: "system",
        }}
      >
        <p>SEO audit</p>
      </AdminShell>,
    );

    expect(html).toContain('aria-controls="admin-submenu-serp"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("SEO audit");
  });

  /**
   * `/_next/image?url=/media/...` OpenNext-də 404 qaytarır — ona görə `/media` avatarı
   * əvvəllər `unoptimized` idi. İndi qlobal loader onu worker-in `/media/...?w=` yoluna
   * göndərir (#167), şəkil isə srcset ilə optimallaşdırılır.
   */
  it("R2 avatarı optimallaşdırılmış srcset ilə verilir", () => {
    pathname = "/admin";
    const html = renderToStaticMarkup(
      <AdminShell
        user={{
          id: "staff-1",
          name: "Admin User",
          email: "admin@example.az",
          avatarUrl: "/media/umumi/2026/09/avatar.webp",
          role: "SUPER_ADMIN",
          accountType: "STAFF",
          mustChangePassword: false,
          totpEnabled: true,
          locale: "az",
          themePreference: "system",
        }}
      >
        <p>Panel məzmunu</p>
      </AdminShell>,
    );

    // `/media` artıq optimallaşdırılır (#167): production-da qlobal loader onu `/media/...?w=`-ə
    // çevirir və `/_next/image`-ə getmir (`image-loader.test.ts`). Testdə `next.config` yüklənmir,
    // ona görə burada yalnız şəklin `unoptimized` olmadığı (srcset yarandığı) yoxlanılır.
    expect(html).toContain(encodeURIComponent("/media/umumi/2026/09/avatar.webp"));
    expect(html).toContain("srcSet=");
  });
});
