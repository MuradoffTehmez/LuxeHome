import { describe, expect, it } from "vitest";
// Script production-da birbaşa Node ilə işləyir; test yalnız saf inspector export-larını istifadə edir.
import {
  extractSitemapLocations,
  inspectHtml,
  inspectRobots,
  inspectSitemap,
} from "../../../scripts/seo-smoke.mjs";

const validHtml = `<!doctype html><html><head>
  <title>Bakıda daşınmaz əmlak</title>
  <meta name="description" content="Bakıda daşınmaz əmlak satışı və icarəsi üçün etibarlı elanlar.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Bakıda daşınmaz əmlak">
  <meta property="og:description" content="Etibarlı elanlar">
  <meta property="og:url" content="https://luxehomeestate.az/">
  <link rel="canonical" href="https://luxehomeestate.az/">
  <script type="application/ld+json">{"@type":"Organization"}</script>
</head><body><h1>Bakıda daşınmaz əmlak satışı və icarəsi</h1><a href="/emlaklar">Əmlaklar</a></body></html>`;

describe("SEO HTTP smoke inspector", () => {
  it("tam sənədi qəbul edir", () => {
    expect(inspectHtml(validHtml).errors).toEqual([]);
  });

  it("kritik head, H1, href və JSON-LD səhvlərini aşkarlayır", () => {
    const result = inspectHtml("<html><head><title>X</title></head><body><h1>A</h1><h1>B</h1></body></html>");
    expect(result.errors).toContain("meta description yoxdur");
    expect(result.errors).toContain("canonical yoxdur");
    expect(result.errors).toContain("H1 sayı 1 deyil: 2");
    expect(result.errors).toContain("daxili href yoxdur");
    expect(result.errors).toContain("JSON-LD yoxdur");
  });

  it("robots meta-sı buraxılanda index/follow defaultunu qəbul edir, noindex-i rədd edir", () => {
    const withoutRobots = validHtml.replace('<meta name="robots" content="index, follow">', "");
    expect(inspectHtml(withoutRobots).errors).toEqual([]);

    const noIndex = validHtml.replace("index, follow", "noindex, follow");
    expect(inspectHtml(noIndex).errors).toContain(
      "indexable route noindex qaytarır: noindex, follow",
    );
  });

  it("robots və sitemap canonical hostunu yoxlayır", () => {
    expect(inspectRobots("User-agent: *\nSitemap: https://luxehomeestate.az/sitemap.xml")).toEqual([]);
    expect(inspectSitemap("<urlset><url><loc>https://luxehomeestate.az/</loc></url></urlset>")).toEqual([]);
    expect(inspectSitemap("<urlset><url><loc>https://www.luxehomeestate.az/?x=1</loc></url></urlset>")).toHaveLength(2);
    expect(
      extractSitemapLocations(
        "<urlset><url><loc>https://luxehomeestate.az/</loc></url></urlset>",
      ),
    ).toEqual(["https://luxehomeestate.az/"]);
  });
});
