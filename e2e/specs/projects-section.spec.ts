import { expect, test } from "@playwright/test";
import { visit } from "../support/helpers";

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
