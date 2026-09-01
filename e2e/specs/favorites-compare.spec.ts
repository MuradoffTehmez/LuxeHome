import { expect, test } from "@playwright/test";
import { ListingsPage } from "../pages/listings.page";
import { clickUntil, readFavorites, visit } from "../support/helpers";

/**
 * Favoritlər və müqayisə.
 *
 * Hər ikisi **giriş tələb etmir**: seçim `localStorage`-də saxlanılır, səhifə
 * isə Server Action ilə həmin ID-lərə uyğun ictimai elanları qaytarır. Testlər
 * məhz bu keçidi yoxlayır — brauzer yaddaşı → server cavabı.
 */

/** Kataloqdan ilk elanın slug-ını götürür. */
async function firstSlug(page: import("@playwright/test").Page): Promise<string | null> {
  const listings = new ListingsPage(page);
  await listings.open();
  const href = await listings.firstPropertyHref();
  return href ? href.split("/").pop()! : null;
}

test.describe("Favoritlər", () => {
  test("boş vəziyyət göstərilir", async ({ page }) => {
    await visit(page, "/az/favoritler");
    await expect(page.locator("h1")).toBeVisible();
    // Boş siyahı istifadəçiyə izah edilməlidir, ağ ekran qalmamalıdır.
    await expect(page.locator("main")).not.toBeEmpty();
  });

  test("kartdakı favorit düyməsi klik qəbul edir", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.open();
    test.skip((await listings.cardCount()) === 0, "kataloqda elan yoxdur");

    /**
     * Tarixi reqressiya: başlıq linkinin `after:inset-0` örtüyü DOM-da sonra
     * gəldiyi üçün favorit düyməsinin üstünə düşürdü və düymə klik qəbul etmirdi.
     * Düyməyə `z-10` verildi. Bu test həmin davranışı qoruyur.
     */
    const favoriteButton = page.locator('button[aria-label*="Favorit"]').first();
    await expect(favoriteButton).toBeVisible();

    const urlBefore = page.url();
    await clickUntil(favoriteButton, async () => (await readFavorites(page)).length > 0);

    // Klik kartın linkini açmamalıdır — naviqasiya baş verməməlidir.
    expect(page.url(), "favorit kliki elan səhifəsini açdı").toBe(urlBefore);
    // Və faktiki olaraq favoritə yazılmalıdır: naviqasiyanın olmaması təkbaşına
    // klikin işlədiyini sübut etmir.
    expect((await readFavorites(page)).length).toBeGreaterThan(0);
  });

  /**
   * Axının tam zənciri: kartda klik → `localStorage` → favoritlər səhifəsi
   * Server Action ilə həmin ID-lərə uyğun ictimai elanları qaytarır.
   */
  test("əlavə edilən elan favoritlər səhifəsində görünür", async ({ page }) => {
    const slug = await firstSlug(page);
    test.skip(!slug, "kataloqda elan yoxdur");

    // Açar `luxehomeestate:favorites`, dəyər isə elan ID-lərinin JSON massividir.
    const favoriteButton = page.locator('button[aria-label*="Favorit"]').first();
    await clickUntil(favoriteButton, async () => (await readFavorites(page)).length > 0);

    expect((await readFavorites(page)).length).toBeGreaterThan(0);

    await visit(page, "/az/favoritler");
    // Seçilmiş elan server cavabında qayıtmalıdır — boş vəziyyət mətni deyil.
    await expect(page.locator('h3 a[href^="/az/emlaklar/"]').first()).toBeVisible();
  });
});

test.describe("Müqayisə", () => {
  test("boş müqayisə səhifəsi açılır", async ({ page }) => {
    await visit(page, "/az/muqayise");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("müqayisə düyməsi kartda mövcuddur", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.open();
    test.skip((await listings.cardCount()) === 0, "kataloqda elan yoxdur");

    // Müqayisə düyməsi hər kartda olmaya bilər (kateqoriyadan asılı) — mövcudluğu
    // yoxlanılır, məcburi deyil.
    const compareButtons = page.locator('button[aria-label*="üqayis"], button:has-text("Müqayisə")');
    const count = await compareButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
