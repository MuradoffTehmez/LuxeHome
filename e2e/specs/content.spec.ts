import { expect, test } from "@playwright/test";
import { visit } from "../support/helpers";

/**
 * Məzmun səthləri: layihələr, bloq, bilik mərkəzi, lüğət, suallar, xidmətlər.
 *
 * Hər biri üçün eyni müqavilə yoxlanılır: siyahı açılır → ilk element linkdir →
 * detal səhifəsi 200 verir və başlıq daşıyır. Konkret slug hardcode edilmir.
 */

type ListingSurface = {
  name: string;
  listPath: string;
  /** Detal linklərinin prefiksi; `null` olduqda detal səhifəsi yoxdur. */
  detailPrefix: string | null;
};

const SURFACES: ListingSurface[] = [
  { name: "Layihələr", listPath: "/az/layiheler", detailPrefix: "/az/layiheler/" },
  { name: "Bloq", listPath: "/az/blog", detailPrefix: "/az/blog/" },
  { name: "Xidmətlər", listPath: "/az/xidmetler", detailPrefix: "/az/xidmetler/" },
  { name: "Bilik mərkəzi", listPath: "/az/bilik-merkezi", detailPrefix: "/az/bilik-merkezi/" },
];

for (const surface of SURFACES) {
  test.describe(surface.name, () => {
    test("siyahı səhifəsi açılır və başlıq daşıyır", async ({ page }) => {
      await visit(page, surface.listPath);
      await expect(page.locator("h1")).toBeVisible();
    });

    test("ilk element detal səhifəsinə aparır", async ({ page }) => {
      test.skip(!surface.detailPrefix, "detal səhifəsi yoxdur");
      await visit(page, surface.listPath);

      const link = page.locator(`a[href^="${surface.detailPrefix}"]:visible`).first();
      const count = await link.count();
      test.skip(count === 0, "siyahıda element yoxdur");

      const href = await link.getAttribute("href");
      const response = await visit(page, href!);
      expect(response.status(), `${href} statusu`).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
    });

    test("mövcud olmayan slug 404 qaytarır", async ({ page }) => {
      test.skip(!surface.detailPrefix, "detal səhifəsi yoxdur");
      const response = await page.goto(`${surface.detailPrefix}e2e-movcud-olmayan-qeyd`, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(404);
    });
  });
}

test.describe("Bloq — kateqoriya filtri", () => {
  test("kateqoriya seçimi səhifəni sındırmır", async ({ page }) => {
    await visit(page, "/az/blog");
    const categoryLink = page.locator('a[href*="/az/blog?"]:visible').first();
    test.skip((await categoryLink.count()) === 0, "kateqoriya filtri yoxdur");

    await categoryLink.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Lüğət və suallar", () => {
  test("lüğətdə termin siyahısı var", async ({ page }) => {
    await visit(page, "/az/lugat");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("main")).not.toBeEmpty();
  });

  /**
   * FAQ iki ayrı məhsul səthidir və birləşdirilməməlidir: `/suallar` sayt üzrə
   * statik sualları (`src/i18n/site-faq.ts`), `/bilik-merkezi/suallar` isə CMS
   * məzmununu göstərir. Test hər ikisinin ayrı yaşadığını təsdiqləyir.
   */
  test("sayt sualları və bilik mərkəzi FAQ-ı ayrı səhifələrdir", async ({ page }) => {
    const siteFaq = await visit(page, "/az/suallar");
    expect(siteFaq.status()).toBe(200);
    const siteText = await page.locator("main").innerText();

    const knowledgeFaq = await page.goto("/az/bilik-merkezi/suallar", {
      waitUntil: "domcontentloaded",
    });
    // Səhifə mövcuddursa məzmunu saytdakından fərqli olmalıdır.
    if (knowledgeFaq?.status() === 200) {
      const knowledgeText = await page.locator("main").innerText();
      expect(knowledgeText).not.toBe(siteText);
    }
  });
});

test.describe("Kalkulyator", () => {
  test("ipoteka kalkulyatoru hesablama aparır", async ({ page }) => {
    await visit(page, "/az/kalkulyator");
    await expect(page.locator("h1")).toBeVisible();

    const numberInputs = page.locator('input[type="number"], input[inputmode="numeric"]');
    test.skip((await numberInputs.count()) === 0, "kalkulyator sahələri tapılmadı");

    const firstInput = numberInputs.first();
    const currentValue = await firstInput.inputValue();
    const before = await page.locator("main").innerText();

    // Sahə defolt dəyərlə gəlir (məs. 150000); eyni dəyəri yazmaq heç nə
    // dəyişmir, ona görə mövcuddan fərqli məbləğ verilir.
    const nextValue = currentValue === "250000" ? "180000" : "250000";
    await firstInput.fill(nextValue);
    await firstInput.blur();
    await page.waitForTimeout(1200);

    const after = await page.locator("main").innerText();
    // Dəyər dəyişəndə nəticə də yenilənməlidir (client-side hesablama).
    expect(after, "kalkulyator nəticəsi yenilənmədi").not.toBe(before);
  });
});
