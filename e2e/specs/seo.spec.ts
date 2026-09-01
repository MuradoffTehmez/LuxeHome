import { expect, test } from "@playwright/test";
import { LOCALES, bodyOf, jsonLdBlocks, metaContent, visit } from "../support/helpers";

/**
 * SEO qatı.
 *
 * `src/lib/seo.ts` bütün metadata və struktur datanı təmin edir; bu testlər
 * həmin qatın **render nəticəsini** yoxlayır — vahid testlər funksiyanı ayrıca
 * yoxlayır, burada isə səhifənin faktiki `<head>`-i oxunur.
 */

const INDEXABLE_PAGES = ["/az", "/az/emlaklar", "/az/layiheler", "/az/blog", "/az/haqqimizda"];

test.describe("Metadata", () => {
  for (const path of INDEXABLE_PAGES) {
    test(`«${path}» başlıq və təsvir daşıyır`, async ({ page }) => {
      await visit(page, path);

      const title = await page.title();
      expect(title.length, "başlıq çox qısadır").toBeGreaterThan(10);
      expect(title.length, "başlıq çox uzundur").toBeLessThan(120);

      const description = await metaContent(page, 'meta[name="description"]');
      expect(description, "meta description yoxdur").toBeTruthy();
      expect(description!.length).toBeGreaterThan(30);
    });
  }

  test("canonical mütləq URL-dir və öz yoluna işarə edir", async ({ page }) => {
    await visit(page, "/az/emlaklar");
    const canonical = await page.locator('head link[rel="canonical"]').getAttribute("href");

    expect(canonical, "canonical yoxdur").toBeTruthy();
    expect(canonical!).toMatch(/^https?:\/\//);
    expect(new URL(canonical!).pathname).toBe("/az/emlaklar");
  });

  test("Open Graph dəsti tamdır", async ({ page }) => {
    await visit(page, "/az");

    for (const property of ["og:title", "og:description", "og:image", "og:type", "og:url"]) {
      const value = await metaContent(page, `meta[property="${property}"]`);
      expect(value, `${property} yoxdur`).toBeTruthy();
    }
  });

  test("Twitter kartı elan olunub", async ({ page }) => {
    await visit(page, "/az");
    const card = await metaContent(page, 'meta[name="twitter:card"]');
    expect(card).toBeTruthy();
  });
});

test.describe("Çoxdillilik — hreflang", () => {
  test("hər dil üçün alternate linki var", async ({ page }) => {
    await visit(page, "/az/emlaklar");

    const alternates = await page
      .locator('head link[rel="alternate"][hreflang]')
      .evaluateAll((links) =>
        links.map((link) => ({
          hreflang: link.getAttribute("hreflang"),
          href: link.getAttribute("href"),
        })),
      );

    test.skip(alternates.length === 0, "hreflang qatı bu səhifədə yoxdur");

    for (const locale of LOCALES) {
      const match = alternates.find((item) => item.hreflang?.startsWith(locale));
      expect(match, `${locale} üçün hreflang yoxdur`).toBeTruthy();
      expect(match!.href).toContain(`/${locale}/`);
    }
  });

  test("hər dildə `<html lang>` düzgündür", async ({ page }) => {
    for (const locale of LOCALES) {
      await visit(page, `/${locale}/emlaklar`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    }
  });
});

test.describe("Struktur data", () => {
  test("ana səhifədə təşkilat sxemi var", async ({ page }) => {
    await visit(page, "/az");
    const blocks = await jsonLdBlocks(page);

    expect(blocks.length, "JSON-LD yoxdur").toBeGreaterThan(0);
    const types = blocks.map((block) => String(block["@type"]));
    // `organizationSchema()` root layout-da `RealEstateAgent` yazır.
    expect(
      types.some((type) => /RealEstateAgent|Organization|LocalBusiness/i.test(type)),
      `tapılan tiplər: ${types.join(", ")}`,
    ).toBe(true);
  });

  test("bütün JSON-LD blokları düzgün parse olunur", async ({ page }) => {
    // `jsonLdBlocks` parse xətasında istisna atır — sınıq JSON burada tutulur.
    for (const path of INDEXABLE_PAGES) {
      await visit(page, path);
      const blocks = await jsonLdBlocks(page);
      for (const block of blocks) {
        expect(block["@context"] ?? block["@type"], `${path}: boş JSON-LD bloku`).toBeTruthy();
      }
    }
  });
});

test.describe("robots və sitemap", () => {
  test("robots.txt admin marşrutlarını bağlayır", async ({ page }) => {
    const body = await bodyOf(page, "/robots.txt");

    // Staging tam `Disallow: /` verir — orada ayrıca qayda gözlənilmir.
    if (/Disallow:\s*\/\s*$/m.test(body.split("\n").slice(0, 5).join("\n"))) {
      expect(body).toContain("Disallow: /");
      return;
    }
    expect(body).toContain("/admin");
  });

  /**
   * URL-lər mütləq və **vahid hostda** olmalıdır.
   *
   * Host production canonical-ıdır və deploy mühitindən asılı deyil
   * (`src/app/sitemap.ts` → `PRODUCTION_SITE_URL`): unudulmuş env dəyəri
   * indeksdə alternativ host yaratmamalıdır. Ona görə staging-də də
   * production hostu gözlənilir, təki hamısı eyni olsun.
   */
  test("sitemap URL-ləri mütləqdir və vahid hostdadır", async ({ page }) => {
    await page.goto("/sitemap.xml", { waitUntil: "domcontentloaded" });
    const body = await page.content();

    const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    test.skip(urls.length === 0, "sitemap boşdur");

    const hosts = new Set<string>();
    for (const url of urls.slice(0, 40)) {
      expect(url, "nisbi URL").toMatch(/^https?:\/\//);
      hosts.add(new URL(url).host);
    }
    expect([...hosts], `sitemap-da qarışıq host: ${[...hosts].join(", ")}`).toHaveLength(1);
  });

  /**
   * Nümunə məzmun rejim açıq olsa belə sitemap-a düşməməlidir:
   * `indexablePropertyWhere()` bunu təmin edir. Rejim söndürüləndən sonra
   * indeksdə qırıq URL qalmasının qarşısı burada alınır.
   */
  test("sitemap nümunə məzmun daşımır", async ({ page }) => {
    await page.goto("/sitemap.xml", { waitUntil: "domcontentloaded" });
    expect(await page.content(), "sitemap-da demo URL var").not.toContain("/demo-");
  });
});

test.describe("İndeksləşmə siqnalları", () => {
  test("ictimai səhifə noindex daşımır", async ({ page, baseURL }) => {
    const isStaging = baseURL!.includes("staging");
    await visit(page, "/az/emlaklar");

    const robots = await metaContent(page, 'meta[name="robots"]');
    if (isStaging) {
      // Staging qəsdən indeksdən kənardır.
      expect(robots ?? "").toMatch(/noindex/i);
      return;
    }
    expect(robots ?? "").not.toMatch(/noindex/i);
  });
});
