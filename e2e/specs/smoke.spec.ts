import { expect, test } from "@playwright/test";
import {
  LOCALES,
  PUBLIC_ROUTES,
  bodyOf,
  collectConsoleErrors,
  expectPageOk,
  statusOf,
} from "../support/helpers";

/**
 * Smoke — hər ictimai marşrutun açıldığını yoxlayır.
 *
 * Bu, piramidanın ən geniş, ən ucuz browser qatıdır: dərinliyə getmir, amma
 * yayımdan sonra «hansısa səhifə tamamilə çökdü» halını dərhal tutur. Detallı
 * davranış ayrıca spec-lərdədir.
 */

test.describe("İctimai marşrutlar — AZ", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`«/az${route || ""}» açılır`, async ({ page }) => {
      await expectPageOk(page, `/az${route}`);
    });
  }
});

test.describe("Locale prefiksi", () => {
  for (const locale of LOCALES) {
    test(`«/${locale}» ana səhifəsi açılır`, async ({ page }) => {
      await expectPageOk(page, `/${locale}`);
      // `<html lang>` locale ilə uyğun olmalıdır — SEO və ekran oxuyucu üçün.
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });
  }

  test("prefikssiz kök defolt dilə yönləndirir", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    // `routing.ts` defolt locale-i AZ-dır; yönləndirmə sonrası URL onu daşımalıdır.
    expect(new URL(page.url()).pathname).toMatch(/^\/az(\/|$)/);
  });
});

test.describe("Texniki marşrutlar", () => {
  test("robots.txt cavab verir", async ({ page }) => {
    expect(await statusOf(page, "/robots.txt")).toBe(200);
    expect(await bodyOf(page, "/robots.txt")).toContain("User-Agent");
  });

  test("sitemap.xml düzgün XML qaytarır", async ({ page }) => {
    expect(await statusOf(page, "/sitemap.xml")).toBe(200);
    // Brauzer XML-i ağac kimi göstərir, ona görə mətn deyil, xam məzmun oxunur.
    const xml = await page.content();
    expect(xml).toMatch(/<(urlset|sitemapindex)/);
  });

  test("llms.txt cavab verir", async ({ page }) => {
    expect([200, 404]).toContain(await statusOf(page, "/llms.txt"));
  });
});

test.describe("Konsol sağlamlığı", () => {
  test("ana səhifə JS xətası vermir", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await expectPageOk(page, "/az");
    // Hidratasiya xətaları burada üzə çıxır — server və client render fərqi.
    expect(errors, `konsol xətaları: ${errors.join(" | ")}`).toHaveLength(0);
  });

  test("kataloq JS xətası vermir", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await expectPageOk(page, "/az/emlaklar");
    expect(errors, `konsol xətaları: ${errors.join(" | ")}`).toHaveLength(0);
  });
});
