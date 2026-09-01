import { expect, test } from "@playwright/test";
import { ListingsPage } from "../pages/listings.page";
import { jsonLdBlocks, metaContent, visit } from "../support/helpers";

/**
 * Elan detal səhifəsi.
 *
 * Konkret slug hardcode edilmir — kataloqdan ilk elan götürülür. Belə olduqda
 * testlər həm nümunə məzmunlu staging-də, həm də real məzmunlu production-da
 * eyni işləyir və məzmun dəyişəndə sınmır.
 */

/** Kataloqdan ilk elanın yolunu qaytarır; kataloq boşdursa `null`. */
async function firstPropertyPath(page: import("@playwright/test").Page): Promise<string | null> {
  const listings = new ListingsPage(page);
  await listings.open();
  return listings.firstPropertyHref();
}

test.describe("Elan detalı", () => {
  test("başlıq, qiymət və şəkil görünür", async ({ page }) => {
    const path = await firstPropertyPath(page);
    test.skip(!path, "kataloqda elan yoxdur");

    const response = await visit(page, path!);
    expect(response.status()).toBe(200);

    await expect(page.locator("h1")).toBeVisible();
    const heading = (await page.locator("h1").innerText()).trim();
    expect(heading.length).toBeGreaterThan(3);

    // Qiymət manat işarəsi ilə göstərilir.
    await expect(page.locator("body")).toContainText(/₼|AZN/);

    // Ən azı bir şəkil yüklənməlidir.
    const images = page.locator("main img");
    await expect(images.first()).toBeVisible();
  });

  test("şəkillər faktiki olaraq yüklənir (sınıq deyil)", async ({ page }) => {
    const path = await firstPropertyPath(page);
    test.skip(!path, "kataloqda elan yoxdur");
    await visit(page, path!);

    const firstImage = page.locator("main img").first();
    await expect(firstImage).toBeVisible();

    // `naturalWidth === 0` sınıq şəkil deməkdir — `next/image` optimizasiyası
    // Cloudflare Images binding-i üzərindən gedir və orada sınma real riskdir.
    // Yükləmə şəbəkədən asılıdır, ona görə dəyər `poll` ilə gözlənilir; dərhal
    // oxunsa hələ yüklənməmiş şəkil yalançı uğursuzluq verərdi.
    await expect
      .poll(
        async () => firstImage.evaluate((img) => (img as HTMLImageElement).naturalWidth),
        { message: "şəkil yüklənmədi", timeout: 20_000 },
      )
      .toBeGreaterThan(0);
  });

  test("breadcrumb kataloqa qayıdır", async ({ page }) => {
    const path = await firstPropertyPath(page);
    test.skip(!path, "kataloqda elan yoxdur");
    await visit(page, path!);

    // Kataloq linki səhifədə bir neçə dəfə var (breadcrumb, navbar, mobil çekmece);
    // çekmecedəkilər gizlidir, ona görə yalnız görünən nüsxə yoxlanılır.
    const backLink = page.locator('a[href="/az/emlaklar"]:visible').first();
    await expect(backLink).toBeVisible();

    // Paralel işləmədə staging worker-i yavaşlaya bilir; naviqasiya üçün
    // standart timeout-dan geniş pəncərə verilir.
    await backLink.click();
    await page.waitForURL("**/az/emlaklar", { timeout: 30_000 });
    expect(new URL(page.url()).pathname).toBe("/az/emlaklar");
  });

  test("əlaqə kanalı təklif olunur", async ({ page }) => {
    const path = await firstPropertyPath(page);
    test.skip(!path, "kataloqda elan yoxdur");
    await visit(page, path!);

    // Elan aktivdirsə CTA, satılıbsa status bildirişi olur — biri mütləq var.
    const contactSurface = page.locator(
      'a[href^="tel:"], a[href*="wa.me"], a[href*="whatsapp"], form',
    );
    const statusNotice = page.getByText(/satılıb|kirayə verilib|arxiv/i);

    const hasContact = (await contactSurface.count()) > 0;
    const hasStatus = (await statusNotice.count()) > 0;
    expect(hasContact || hasStatus, "nə əlaqə kanalı, nə status bildirişi var").toBe(true);
  });
});

test.describe("Elan detalı — SEO", () => {
  test("canonical öz URL-inə işarə edir", async ({ page }) => {
    const path = await firstPropertyPath(page);
    test.skip(!path, "kataloqda elan yoxdur");
    await visit(page, path!);

    const canonical = await page.locator('head link[rel="canonical"]').getAttribute("href");
    expect(canonical, "canonical yoxdur").toBeTruthy();
    expect(new URL(canonical!).pathname).toBe(path);
  });

  test("Open Graph və başlıq metadatası doludur", async ({ page }) => {
    const path = await firstPropertyPath(page);
    test.skip(!path, "kataloqda elan yoxdur");
    await visit(page, path!);

    await expect(page).toHaveTitle(/.{10,}/);
    expect(await metaContent(page, 'meta[name="description"]')).toBeTruthy();
    expect(await metaContent(page, 'meta[property="og:title"]')).toBeTruthy();
    expect(await metaContent(page, 'meta[property="og:image"]')).toBeTruthy();
  });

  test("struktur data elanı təsvir edir", async ({ page }) => {
    const path = await firstPropertyPath(page);
    test.skip(!path, "kataloqda elan yoxdur");
    await visit(page, path!);

    const blocks = await jsonLdBlocks(page);
    expect(blocks.length, "JSON-LD bloku yoxdur").toBeGreaterThan(0);

    const types = blocks.map((block) => block["@type"]).flat();
    // `propertySchema()` elan üçün məhsul/əmlak tipli blok yazır, `breadcrumbSchema()`
    // isə naviqasiya zəncirini. İkisindən biri mütləq olmalıdır.
    expect(
      types.some((type) =>
        /Residence|Product|Offer|RealEstate|Accommodation|Apartment|House|Place|BreadcrumbList/i.test(
          String(type),
        ),
      ),
      `gözlənilməyən JSON-LD tipləri: ${JSON.stringify(types)}`,
    ).toBe(true);
  });
});

test.describe("Elan detalı — mövcud olmayan elan", () => {
  /**
   * 404 statusu qəsdən qorunur: public ağacda route səviyyəli `loading.tsx`
   * yoxdur, çünki Suspense streaming başlıqları erkən göndərib `notFound()`
   * cavabının statusunu 200-ə çevirə bilir. Bu test həmin güzəştin işlədiyini
   * yoxlayır — status kodu SEO üçün kritikdir.
   */
  test("naməlum slug 404 statusu qaytarır", async ({ page }) => {
    const response = await page.goto("/az/emlaklar/movcud-olmayan-elan-e2e-yoxlamasi", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(404);
  });

  /**
   * 404 səhifəsi qəsdən sadədir — navbar/footer daşımır, ona görə burada
   * landmark deyil, brend məzmunu və çıxış yolları yoxlanılır.
   */
  test("404 səhifəsi brend görünüşündə və azərbaycancadır", async ({ page }) => {
    await page.goto("/az/emlaklar/movcud-olmayan-elan-e2e-yoxlamasi", {
      waitUntil: "domcontentloaded",
    });

    // Xam Next.js xəta ekranı deyil, layihənin `not-found.tsx`-i göstərilməlidir.
    await expect(page.locator("body")).not.toContainText("This page could not be found");
    await expect(page.locator("h1")).toContainText(/tapılmadı/i);

    /**
     * Çıxış linkləri **locale prefiksi daşımalıdır**. Tarixi baq: `not-found.tsx`
     * AZ üçün prefiksi boş qoyurdu (`/emlaklar`), halbuki `routing.ts`-də
     * `localePrefix: "always"`-dır — nəticədə hər klik əlavə 307 yönləndirmədən
     * keçirdi. Bu test həmin reqressiyanı bağlayır.
     */
    const homeLink = page.locator('a[href="/az"], a[href="/az/"]').first();
    const listingsLink = page.locator('a[href="/az/emlaklar"]').first();
    await expect(homeLink.or(listingsLink).first()).toBeVisible();
    expect(await page.locator('a[href="/emlaklar"]').count(), "prefiksiz link qalıb").toBe(0);
  });

  test("404 səhifəsi hər dildə öz mətnini göstərir", async ({ page }) => {
    await page.goto("/en/emlaklar/movcud-olmayan-elan-e2e-yoxlamasi", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toBeVisible();
  });
});
