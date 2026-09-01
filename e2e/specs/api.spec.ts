import { expect, test } from "@playwright/test";
import { botProtectionActive, statusOf } from "../support/helpers";

/**
 * API qatı.
 *
 * Layihədə ayrıca REST qatı yoxdur — səhifələr Server Component-dir və yazma
 * Server Action ilə gedir. `/api/*` altında yalnız **infrastruktur** route-ları
 * var: media proxy, monitorinq, cron, webhook, təhlükəsizlik. Bu testlər həmin
 * route-ların müqaviləsini yoxlayır: icazəsiz sorğu keçmir, cavab formatı
 * gözlənilən olur, xəta halında səhifə çökmür.
 */

test.describe("Qorunan API route-ları", () => {
  /**
   * Bu uc nöqtələr ya auth, ya imza, ya da xüsusi başlıq tələb edir. Anonim
   * `GET` heç birində məlumat qaytarmamalıdır.
   */
  const guarded = [
    "/api/admin/media",
    "/api/hesab/export",
    "/api/hesab/favoritler",
    "/api/hesab/media",
    "/api/cron/saved-search-digest",
  ];

  for (const path of guarded) {
    test(`«${path}» anonim sorğunu qaytarmır`, async ({ page }) => {
      const status = await statusOf(page, path);

      // 401/403 gözlənilir; 404 və 405 də qəbul edilir (route gizlədilib).
      expect([401, 403, 404, 405, 302, 307], `${path} → ${status}`).toContain(status);
    });
  }

  /**
   * Hesab menyusu qəsdən ictimaidir: navbar anonim istifadəçi üçün də onu
   * çağırır. Şərt odur ki, cavab **yalnız giriş vəziyyətini** desin — ad,
   * e-poçt və ya digər şəxsi məlumat daşımasın.
   */
  test("«/api/hesab/menu» anonimə şəxsi məlumat vermir", async ({ page }) => {
    if ((await statusOf(page, "/api/hesab/menu")) !== 200) return;

    const body = await page.evaluate(() => document.body?.innerText ?? "");
    expect(body).toMatch(/"signedIn"\s*:\s*false/);
    expect(body, "anonim cavabda e-poçt var").not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i);
    expect(body, "anonim cavabda ad sahəsi var").not.toMatch(/"(name|email|role|userId)"/);
  });

  test("webhook imzasız POST-u rədd edir", async ({ request, baseURL }) => {
    test.skip(botProtectionActive(baseURL), "bot qoruması sorğu-səviyyəli testi bloklayır");
    const response = await request.post("/api/webhooks/resend", {
      data: { type: "email.delivered" },
      failOnStatusCode: false,
    });
    // 503 — webhook secret-i bu mühitdə qurulmayıb; imzasız sorğu yenə keçmir.
    expect([400, 401, 403, 404, 503], `status ${response.status()}`).toContain(response.status());
  });
});

test.describe("Monitorinq uc nöqtələri", () => {
  test("vitals yalnız POST qəbul edir", async ({ page }) => {
    const status = await statusOf(page, "/api/monitoring/vitals");
    expect([404, 405, 400], `GET → ${status}`).toContain(status);
  });

  test("pozulmuş JSON gövdəsi 500 vermir", async ({ request, baseURL }) => {
    test.skip(botProtectionActive(baseURL), "bot qoruması sorğu-səviyyəli testi bloklayır");
    // Səhv formatlı sorğu idarə olunan xəta ilə cavablanmalıdır, çökmə ilə deyil.
    const response = await request.post("/api/monitoring/error", {
      headers: { "content-type": "application/json" },
      data: "{bozuk-json",
      failOnStatusCode: false,
    });
    expect(response.status(), "pozulmuş gövdə server xətası verdi").toBeLessThan(500);
  });
});

test.describe("Media proxy", () => {
  test("mövcud olmayan media açarı 404 verir", async ({ page }) => {
    const status = await statusOf(page, "/media/movcud-olmayan/fayl-e2e.webp");
    expect([404, 403], `status ${status}`).toContain(status);
  });

  test("media açarında path traversal işləmir", async ({ page }) => {
    const status = await statusOf(page, "/media/../../wrangler.jsonc");
    expect(status, "path traversal keçdi").not.toBe(200);
  });
});

test.describe("Xəritə tile proxy", () => {
  test("naməlum tile yolu 200 qaytarmır", async ({ page }) => {
    const status = await statusOf(page, "/api/map-tiles/invalid/path/e2e");
    expect(status, `status ${status}`).not.toBe(200);
  });
});

test.describe("Sitemap feed-ləri", () => {
  test("hər feed düzgün XML content-type verir", async ({ page }) => {
    const response = await page.goto("/sitemap.xml", { waitUntil: "domcontentloaded" });
    expect(response?.headers()["content-type"] ?? "").toMatch(/xml/);
  });

  test("naməlum feed adı 404 verir", async ({ page }) => {
    const status = await statusOf(page, "/sitemaps/movcud-olmayan-feed.xml");
    expect([404, 400], `status ${status}`).toContain(status);
  });
});

test.describe("Cavab başlıqları", () => {
  test("HTML cavabları düzgün content-type daşıyır", async ({ page }) => {
    const response = await page.goto("/az", { waitUntil: "domcontentloaded" });
    expect(response?.headers()["content-type"] ?? "").toMatch(/text\/html/);
  });

  test("statik aktivlər keşlənir", async ({ page }) => {
    await page.goto("/az", { waitUntil: "domcontentloaded" });
    const scriptSrc = await page
      .locator('script[src^="/_next/static"]')
      .first()
      .getAttribute("src");
    test.skip(!scriptSrc, "statik skript tapılmadı");

    const response = await page.goto(scriptSrc!, { waitUntil: "domcontentloaded" });
    const cacheControl = response?.headers()["cache-control"] ?? "";
    // `/_next/static` məzmunu hash-lidir və uzunmüddətli keşlənməlidir.
    expect(cacheControl, `cache-control: ${cacheControl}`).toMatch(/max-age=\d{4,}|immutable/);
  });
});
