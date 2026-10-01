import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { visit } from "../support/helpers";

/**
 * Analitika razılıq kartı (#143).
 *
 * Banner yalnız production tipli build-də (`NEXT_PUBLIC_GA_MEASUREMENT_ID` ilə) render olunur;
 * staging və lokal E2E bundle-ında analitika konfiqurasiya olunmayıb — orada bu testlər atlanır.
 * Konfiqurasiya olunmuş bundle ilə işlətmək üçün: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST npm run e2e:local:build`.
 */

const COOKIE = "analytics_consent";

function dialog(page: Page) {
  return page.getByRole("dialog", { name: /Analitika cookie|Analytics cookies|Аналитические cookie/i });
}

async function openBlog(page: Page) {
  await visit(page, "/az/blog");
  await page.waitForLoadState("load");
}

async function consentCookie(page: Page) {
  return (await page.context().cookies()).find((cookie) => cookie.name === COOKIE)?.value ?? null;
}

test.describe("Analitika razılıq kartı", () => {
  test.beforeEach(async ({ page }) => {
    await openBlog(page);
    // Footer düyməsi server HTML-indədir (hidratasiya tələb etmir): analitika konfiqurasiya olunubsa dərhal görünür.
    // Banner özü isə yalnız hidratasiyadan sonra çıxır, ona görə gözlənilir.
    const configured = (await page.getByRole("button", { name: /Cookie parametrləri/ }).count()) > 0;
    test.skip(!configured, "analitika bu bundle-da konfiqurasiya olunmayıb");
    await expect(dialog(page)).toBeVisible();
  });

  test("ilk ziyarətdə görünür, klaviaturada ilk fokus nöqtəsidir və axe pozuntusu yoxdur", async ({ page }) => {
    await expect(dialog(page)).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(dialog(page).locator(":focus")).toHaveCount(1);

    const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);

    await expect(dialog(page).getByRole("link", { name: /Cookie siyasəti/ })).toHaveAttribute("href", /cookie-siyaseti/);
  });

  test("imtina seçimi saxlanılır, banner yenidən çıxmır", async ({ page }) => {
    await dialog(page).getByRole("button", { name: /İmtina edirəm/ }).click();

    await expect(dialog(page)).toHaveCount(0);
    expect(await consentCookie(page)).toBe("denied");

    await page.reload();
    await page.waitForLoadState("load");
    await expect(dialog(page)).toHaveCount(0);
  });

  test("seçim edilmiş istifadəçiyə server HTML-i banner göndərmir", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    await context.addCookies([{ name: COOKIE, value: "denied", url: baseURL ?? "http://localhost:5174" }]);
    const page = await context.newPage();
    await page.goto("/az/blog", { waitUntil: "domcontentloaded" });

    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await context.close();
  });

  test("footer düyməsi seçimi yenidən açır; geri çəkmə analitika cookie-lərini silir", async ({ page, baseURL }) => {
    await dialog(page).getByRole("button", { name: /İcazə verirəm/ }).click();
    expect(await consentCookie(page)).toBe("granted");

    // GA-nın qoyduğu cookie-ni təqlid edirik (real GA bu testdə yüklənməyə bilər)
    await page.context().addCookies([{ name: "_ga", value: "GA1.1.123", url: baseURL ?? "http://localhost:5174" }]);

    await page.getByRole("button", { name: /Cookie parametrləri/ }).click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).getByRole("status")).toContainText("icazə verilib");
    await expect(dialog(page)).toBeFocused();

    await dialog(page).getByRole("button", { name: /İmtina edirəm/ }).click();

    await expect(dialog(page)).toHaveCount(0);
    expect(await consentCookie(page)).toBe("denied");
    await expect
      .poll(async () => (await page.context().cookies()).some((cookie) => cookie.name === "_ga"))
      .toBe(false);
  });

  test("Escape parametrləri seçimi dəyişmədən bağlayır və fokus düyməyə qayıdır", async ({ page }) => {
    await dialog(page).getByRole("button", { name: /İcazə verirəm/ }).click();
    const opener = page.getByRole("button", { name: /Cookie parametrləri/ });
    await opener.focus();
    await opener.press("Enter");
    await expect(dialog(page)).toBeFocused();

    await page.keyboard.press("Escape");

    await expect(dialog(page)).toHaveCount(0);
    expect(await consentCookie(page)).toBe("granted");
    await expect(opener).toBeFocused();
  });

  test("cookie siyasəti səhifəsində də parametrlər düyməsi var", async ({ page }) => {
    await visit(page, "/az/cookie-siyaseti");
    await expect(page.getByRole("main").getByRole("button", { name: /Cookie parametrləri/ })).toBeVisible();
  });
});
