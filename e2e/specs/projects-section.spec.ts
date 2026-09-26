import { expect, test, type Page } from "@playwright/test";
import { ADMIN_STORAGE_STATE, authFixturesEnabled } from "../support/auth";
import { visit } from "../support/helpers";

// Hər iki blok eyni parametri paylaşır (açar testi onu dəyişir) — paralel işləsə
// yarış yaranar, ona görə fayl ardıcıl işləyir.
test.describe.configure({ mode: "serial" });

/**
 * «Yaşayış kompleksləri» bölməsi paneldən açılıb-bağlanır (#83), defolt gizlidir.
 *
 * Test mühitin cari rejimini ana səhifənin menyusundan oxuyur və bütün səthlərin
 * **bir-biri ilə ardıcıl** olmasını tələb edir: menyuda keçid yoxdursa marşrut 404
 * verməli və sitemap-da olmamalıdır; keçid varsa səhifə açılmalıdır. Beləliklə
 * test redaktor açarı dəyişdikdə də düzgün qalır.
 */
test.describe("Yaşayış kompleksləri bölməsinin görünürlüyü", () => {
  test("menyu, marşrut və sitemap eyni rejimdədir", async ({ page, request }) => {
    await visit(page, "/az");
    const linked = (await page.locator('a[href^="/az/layiheler"]').count()) > 0;

    const listResponse = await request.get("/az/layiheler", { maxRedirects: 0 });
    const sitemap = await (await request.get("/sitemaps/pages-az.xml")).text();

    if (linked) {
      expect(listResponse.status(), "bölmə açıqdır — siyahı səhifəsi açılmalıdır").toBe(200);
    } else {
      expect(listResponse.status(), "bölmə gizlidir — marşrut 404 verməlidir").toBe(404);
      expect(sitemap, "gizli bölmə sitemap-da olmamalıdır").not.toContain("/layiheler");
      expect((await request.get("/az/layiheler/istenilen-layihe", { maxRedirects: 0 })).status()).toBe(404);
    }
  });
});

/** Admin açarı ilə bölmənin açılıb-bağlanması — lokal stack (#83, #87). */
test.describe("Yaşayış kompleksləri — admin açarı", () => {
  test.skip(!authFixturesEnabled, "auth fixture-ları yoxdur (staging run)");
  test.use({ storageState: ADMIN_STORAGE_STATE });

  async function toggle(page: Page, label: RegExp) {
    await page.goto("/admin/parametrler");
    await page.getByRole("button", { name: label }).click();
    await expect(page.getByRole("status")).toBeVisible();
  }

  test("açıldıqda səhifə 200, bağlandıqda 404 verir", async ({ page, request }) => {
    const initial = (await request.get("/az/layiheler", { maxRedirects: 0 })).status();

    await toggle(page, /show section/i);
    expect((await request.get("/az/layiheler", { maxRedirects: 0 })).status()).toBe(200);

    await toggle(page, /hide section/i);
    expect((await request.get("/az/layiheler", { maxRedirects: 0 })).status()).toBe(404);

    // Başlanğıc vəziyyət bərpa olunur — digər spec-lər ona güvənir.
    if (initial === 200) await toggle(page, /show section/i);
  });
});
