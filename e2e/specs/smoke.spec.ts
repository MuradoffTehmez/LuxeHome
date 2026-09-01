import { expect, test } from "@playwright/test";
import { LOCALES, PUBLIC_ROUTES, collectConsoleErrors, expectPageOk } from "../support/helpers";

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
  test("robots.txt cavab verir", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("User-Agent");
  });

  test("sitemap.xml düzgün XML qaytarır", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<?xml");
    expect(body).toMatch(/<(urlset|sitemapindex)/);
  });

  test("llms.txt cavab verir", async ({ request }) => {
    const response = await request.get("/llms.txt");
    expect([200, 404]).toContain(response.status());
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
