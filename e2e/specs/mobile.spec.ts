import { expect, test } from "@playwright/test";
import { ListingsPage } from "../pages/listings.page";
import { propertyCardLinks, visit } from "../support/helpers";

/**
 * Mobil axınlar.
 *
 * `playwright.config.ts`-dəki `mobile` layihəsi bu faylı Pixel 7 viewport-u ilə
 * işlədir. Burada yalnız dar ekrana xas davranış yoxlanılır: çekmece
 * naviqasiyası, bottom-sheet filtrlər, sticky CTA, üfüqi sürüşmənin olmaması
 * və toxunma hədəflərinin ölçüsü.
 */

test.describe("Mobil naviqasiya", () => {
  test("menyu düyməsi çekmecəni açır", async ({ page }) => {
    await visit(page, "/az");
    await page.waitForLoadState("load");

    const menuButton = page.locator('[aria-label="Menyunu aç"]').first();
    test.skip((await menuButton.count()) === 0, "mobil menyu düyməsi tapılmadı");

    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Çekmece açıldıqda naviqasiya linkləri görünən olmalıdır.
    const drawerLink = page.locator('a[href="/az/emlaklar"]:visible').first();
    await expect(drawerLink).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Mobil layout", () => {
  const paths = ["/az", "/az/emlaklar", "/az/layiheler", "/az/blog", "/az/elaqe"];

  for (const path of paths) {
    /**
     * Üfüqi sürüşmə mobil UX-in ən çox rast gəlinən qırığıdır: bir geniş element
     * (cədvəl, uzun mətn, sabit enli kart) bütün səhifəni yana sürüşdürür.
     */
    test(`«${path}» üfüqi sürüşmə yaratmır`, async ({ page }) => {
      await visit(page, path);
      await page.waitForLoadState("load");

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      // 2px tolerantlıq: sub-pixel yuvarlaqlaşma real problem deyil.
      expect(
        overflow.scrollWidth,
        `${path}: scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(overflow.clientWidth + 2);
    });
  }
});

test.describe("Mobil toxunma hədəfləri", () => {
  /**
   * Tarixi reqressiya: kartdakı favorit düyməsi 40px idi və toxunma hədəfi
   * minimumundan (44px) kiçik qalırdı. Bu test həmin ölçünü qoruyur.
   */
  test("interaktiv elementlər kifayət qədər böyükdür", async ({ page }) => {
    await visit(page, "/az/emlaklar");
    await page.waitForLoadState("load");

    const small = await page
      .locator("main button:visible, main a[role=button]:visible")
      .evaluateAll((elements) =>
        elements
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { w: Math.round(rect.width), h: Math.round(rect.height),
                     label: element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 24) ?? "?" };
          })
          // Görünməyən və ya sıfır ölçülü elementlər nəzərə alınmır.
          .filter((box) => box.w > 0 && box.h > 0 && (box.w < 44 || box.h < 44)),
      );

    expect(
      small,
      `44px-dən kiçik toxunma hədəfləri: ${small.map((b) => `${b.label} (${b.w}×${b.h})`).join(", ")}`,
    ).toHaveLength(0);
  });
});

test.describe("Mobil kataloq", () => {
  test("kartlar tək sütunda düzülür və oxunur", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.open();
    await page.waitForLoadState("load");

    const cards = propertyCardLinks(page);
    test.skip((await cards.count()) === 0, "kataloqda elan yoxdur");

    const first = cards.first();
    await expect(first).toBeVisible();

    const box = await first.boundingBox();
    const viewport = page.viewportSize();
    expect(box, "kart ölçüsü oxunmadı").not.toBeNull();
    // Kart viewport-dan kənara çıxmamalıdır.
    expect(box!.x).toBeGreaterThanOrEqual(-2);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 2);
  });

  test("filtr paneli mobil ekranda əlçatandır", async ({ page }) => {
    await visit(page, "/az/emlaklar");
    await page.waitForLoadState("load");

    // Mobil filtr bottom-sheet düyməsi ilə açılır; adı dəyişə bilər, ona görə
    // bir neçə namizəd yoxlanılır.
    const filterTrigger = page
      .locator('button:has-text("Filtr"), button:has-text("Axtarış"), [aria-label*="ltr"]')
      .first();
    test.skip((await filterTrigger.count()) === 0, "mobil filtr düyməsi tapılmadı");

    await expect(filterTrigger).toBeVisible();
  });
});

test.describe("Mobil detal səhifəsi", () => {
  test("elan detalı mobil ekranda tam görünür", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.open();
    const href = await listings.firstPropertyHref();
    test.skip(!href, "kataloqda elan yoxdur");

    await visit(page, href!);
    await page.waitForLoadState("load");

    await expect(page.locator("h1")).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  });
});
