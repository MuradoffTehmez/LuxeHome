import { describe, expect, it } from "vitest";
import { buildSitemap } from "@/app/sitemap";

const updatedAt = new Date("2026-08-20T10:00:00.000Z");

describe("sitemap assembler", () => {
  it("yalnız canonical və indexable public entity-ləri daxil edir", () => {
    const sitemap = buildSitemap({
      properties: [
        { slug: "aktiv-villa", updatedAt, status: "PUBLISHED", noIndex: false, canonicalUrl: null },
        { slug: "satilib", updatedAt, status: "SOLD", noIndex: false, canonicalUrl: null },
        { slug: "noindex", updatedAt, status: "PUBLISHED", noIndex: true, canonicalUrl: null },
        { slug: "duplicate", updatedAt, status: "PUBLISHED", noIndex: false, canonicalUrl: "/emlaklar/aktiv-villa" },
      ],
      projects: [
        { slug: "sahil", updatedAt, noIndex: false, canonicalUrl: null },
        { slug: "dublikat-layihe", updatedAt, noIndex: false, canonicalUrl: "/layiheler/sahil" },
      ],
      services: [{ slug: "qiymetlendirme", updatedAt, noIndex: false, canonicalUrl: null }],
      posts: [{ slug: "ev-secimi", updatedAt, noIndex: false, canonicalUrl: null }],
      agencies: [{ slug: "etibar-emlak", updatedAt }],
      partners: [{ slug: "treva", updatedAt }],
      landings: [{ path: "/satilan-emlaklar", updatedAt }],
    });
    const urls = sitemap.map((entry) => entry.url);

    expect(urls).toContain("https://luxehomeestate.az/az/emlaklar/aktiv-villa");
    expect(urls).toContain("https://luxehomeestate.az/en/emlaklar/aktiv-villa");
    expect(urls).toContain("https://luxehomeestate.az/ru/agentlikler/etibar-emlak");
    expect(urls).toContain("https://luxehomeestate.az/az/terefdaslar/treva");
    expect(urls).toContain("https://luxehomeestate.az/en/terefdaslar/treva");
    expect(urls).toContain("https://luxehomeestate.az/az/satilan-emlaklar");
    expect(urls).not.toContain("https://luxehomeestate.az/az/emlaklar/satilib");
    expect(urls).not.toContain("https://luxehomeestate.az/az/emlaklar/noindex");
    expect(urls).not.toContain("https://luxehomeestate.az/az/emlaklar/duplicate");
    expect(urls).not.toContain("https://luxehomeestate.az/az/layiheler/dublikat-layihe");
  });

  it("agentlik, FAQ və hüquqi hub-ları absolute HTTPS URL kimi elan edir", () => {
    const sitemap = buildSitemap({
      properties: [],
      projects: [],
      services: [],
      posts: [],
      agencies: [],
      partners: [],
      landings: [],
    });
    const urls = sitemap.map((entry) => entry.url);

    for (const path of [
      "/agentlikler",
      "/terefdaslar",
      "/suallar",
      "/haqqimizda",
      "/elaqe",
      "/mexfilik-siyaseti",
      "/istifade-sertleri",
      "/cookie-siyaseti",
    ]) {
      expect(urls).toContain(`https://luxehomeestate.az/az${path}`);
      expect(urls).toContain(`https://luxehomeestate.az/en${path}`);
      expect(urls).toContain(`https://luxehomeestate.az/ru${path}`);
    }
    expect(urls.every((url) => url.startsWith("https://luxehomeestate.az/"))).toBe(true);
  });
});
