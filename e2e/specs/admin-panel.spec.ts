import { expect, test } from "@playwright/test";
import { ADMIN_STORAGE_STATE, authFixturesEnabled, expectNoRawMessageKeys, makeJpegFiles } from "../support/auth";

/**
 * Admin panel — lokal stack-də real 2FA sessiyası ilə (#87).
 *
 * Fixture admini panel dilini `en` saxlayır: tərcümənin panel boyu düşdüyü
 * (xam açar görünmədiyi) EN-də yoxlanır.
 */
test.skip(!authFixturesEnabled, "auth fixture-ları yoxdur (staging run)");
test.use({ storageState: ADMIN_STORAGE_STATE });

test.describe("Admin panel", () => {
  const pages = ["/admin", "/admin/emlaklar", "/admin/emlaklar/yeni", "/admin/media", "/admin/parametrler", "/admin/layiheler"];

  for (const path of pages) {
    test(`«${path}» sessiya ilə açılır və xam tərcümə açarı göstərmir`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} statusu`).toBe(200);
      await expect(page).toHaveURL(new RegExp(`${path}(?:[?#]|$)`));
      await expectNoRawMessageKeys(page);
    });
  }

  test("elan formasında 8 böyük şəkil toplu yüklənir (#79)", async ({ page }) => {
    await page.goto("/admin/emlaklar/yeni");
    await expect(page).toHaveURL(/\/admin\/emlaklar\/yeni/);
    const files = await makeJpegFiles(page, 8);
    await page.locator('input[type="file"][multiple]').first().setInputFiles(files);

    // Hər hazır şəkil formaya gizli `images` sahəsi kimi düşür.
    await expect(page.locator('input[type="hidden"][name="images"]')).toHaveCount(8, { timeout: 90_000 });
    await expect(page.locator("body")).not.toContainText("Unexpected token");
    await expectNoRawMessageKeys(page);

    // Brauzerdə kiçildilmə: 3200 px-lik mənbə serverə 2400 px ilə çatır.
    const urls = await page
      .locator('input[type="hidden"][name="images"]')
      .evaluateAll((inputs) => inputs.map((input) => JSON.parse((input as HTMLInputElement).value).url as string));
    expect(new Set(urls).size).toBe(8);
    expect(urls.every((url) => url.startsWith("/media/emlaklar/"))).toBe(true);
  });
});
