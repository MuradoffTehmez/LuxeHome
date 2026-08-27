import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin" }));
vi.mock("@/app/[locale]/giris/actions", () => ({ signOut: vi.fn() }));

import { AdminShell } from "../admin-shell";

describe("AdminShell", () => {
  it("real mobile drawer trigger-i saxlayır və saxta axtarışı göstərmir", () => {
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
    expect(html).toContain("hidden w-[264px]");
    expect(html).not.toContain("admin-search");
  });
});
