import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

let pathname = "/admin/serp";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { AdminSectionTabs } from "../admin-section-tabs";

/** `aria-current="page"` daşıyan linkin ünvanı (atribut sırasından asılı deyil). */
function currentHref(html: string): string | undefined {
  return [...html.matchAll(/<a [^>]*>/g)].map((match) => match[0]).find((tag) => tag.includes('aria-current="page"'))?.match(/href="([^"]+)"/)?.[1];
}

describe("AdminSectionTabs", () => {
  it("aktiv alətin bölməsini və yalnız həmin bölmənin tablarını göstərir", () => {
    pathname = "/admin/serp/sitemap";
    const html = renderToStaticMarkup(<AdminSectionTabs module="serp" role="SUPER_ADMIN" />);
    expect(currentHref(html)).toBe("/admin/serp/sitemap");
    expect(html).toContain('href="/admin/redirects"');
    // Monitorinq bölməsinin alətləri bu bölmədə tab kimi göstərilmir (bölmə linki ilk alətə aparır).
    expect(html).not.toContain('href="/admin/serp/audit"');
    expect(html).toContain('href="/admin/serp"');
  });

  it("modulun kökündə ilk bölmə açılır, Redaktora icazəsiz alət göstərilmir", () => {
    pathname = "/admin/serp";
    const html = renderToStaticMarkup(<AdminSectionTabs module="serp" role="EDITOR" />);
    expect(currentHref(html)).toBe("/admin/serp");
    expect(html).toContain('href="/admin/serp/audit"');
    expect(html).not.toContain('href="/admin/seo"');
  });
});
