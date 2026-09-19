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
   * R2-dən gələn `/media/...` avatarı `next/image` optimizatorundan keçirilsə,
   * `/_next/image?url=/media/...` 404 qaytarır və paneldə sınıq şəkil görünür.
   * Optimizator yan keçildikdə `src` xam yolu saxlayır.
   */
  it("R2 avatarını next/image optimizatorundan yan keçirir", () => {
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

    expect(html).toContain('src="/media/umumi/2026/09/avatar.webp"');
    expect(html).not.toContain("/_next/image?url=%2Fmedia");
  });
});
