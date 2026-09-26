import { expect, test } from "@playwright/test";
import { authFixturesEnabled, expectNoRawMessageKeys, makeJpegFiles, signInAsLister } from "../support/auth";

/** Kabinet — elan sahibinin real sessiyası ilə (#79, #81, #87). */
test.skip(!authFixturesEnabled, "auth fixture-ları yoxdur (staging run)");

test.describe("Kabinet elan forması", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await signInAsLister(context, baseURL!);
  });

  for (const locale of ["az", "en", "ru"] as const) {
    test(`«${locale}» formasında xam admin.* açarı görünmür`, async ({ page }) => {
      const response = await page.goto(`/${locale}/kabinet/elanlar/yeni`);
      expect(response?.status()).toBe(200);
      // Giriş səhifəsi də 200 qaytarır — formanın özündə qaldığımız ayrıca yoxlanır.
      await expect(page).toHaveURL(new RegExp(`/${locale}/kabinet/elanlar/yeni`));
      await expect(page.locator('input[type="file"][multiple]')).toHaveCount(1);
      await expectNoRawMessageKeys(page);
    });
  }

  test("6 şəkil toplu yüklənir və hamısı hazır olur", async ({ page }) => {
    // Brauzerdə kiçiltmə + server tərəfdə Images çevirməsi yavaş runner-də uzun çəkir.
    test.setTimeout(240_000);
    await page.goto("/az/kabinet/elanlar/yeni");
    await expect(page).toHaveURL(/\/az\/kabinet\/elanlar\/yeni/);
    const files = await makeJpegFiles(page, 6);
    await page.locator('input[type="file"][multiple]').first().setInputFiles(files);

    await expect(page.locator('input[type="hidden"][name="images"]')).toHaveCount(6, { timeout: 200_000 });
    await expect(page.locator("body")).not.toContainText("Unexpected token");
    await expectNoRawMessageKeys(page);
  });
});
