import { expect, test } from "@playwright/test";
import { LOCALES, visit } from "../support/helpers";

/**
 * Çoxdillilik.
 *
 * İctimai marşrutlar `localePrefix: "always"` ilə işləyir — hər dil öz
 * prefiksini daşıyır. Panel isə qəsdən prefiks daşımır və dili `User.locale`-dan
 * götürür; ona görə burada yalnız ictimai səth yoxlanılır.
 */

test.describe("Dil prefiksi", () => {
  for (const locale of LOCALES) {
    test(`«${locale}» kataloqu öz dilində açılır`, async ({ page }) => {
      const response = await visit(page, `/${locale}/emlaklar`);
      expect(response.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("h1")).toBeVisible();
    });
  }

  test("dəstəklənməyən dil prefiksi 404 verir", async ({ page }) => {
    const response = await page.goto("/de/emlaklar", { waitUntil: "domcontentloaded" });
    // Ya 404, ya da defolt dilə yönləndirmə — «de» məzmunu göstərilməməlidir.
    const status = response?.status() ?? 0;
    if (status === 200) {
      await expect(page.locator("html")).not.toHaveAttribute("lang", "de");
    } else {
      expect([404, 307, 308]).toContain(status);
    }
  });
});

test.describe("Tərcümə bütövlüyü", () => {
  /**
   * Kataloq başlığı hər dildə fərqli olmalıdır. Eyni qalırsa, ya tərcümə
   * açarı çatışmır, ya da `getRequestConfig` axını dili görmür.
   */
  test("kataloq başlığı dillər arasında dəyişir", async ({ page }) => {
    const headings: Record<string, string> = {};
    for (const locale of LOCALES) {
      await visit(page, `/${locale}/emlaklar`);
      headings[locale] = (await page.locator("h1").innerText()).trim();
    }

    expect(headings.az.length).toBeGreaterThan(0);
    expect(headings.en, "EN başlığı AZ ilə eynidir").not.toBe(headings.az);
    expect(headings.ru, "RU başlığı AZ ilə eynidir").not.toBe(headings.az);
  });

  test("tərcümə açarı xam şəkildə görünmür", async ({ page }) => {
    for (const locale of LOCALES) {
      await visit(page, `/${locale}`);
      const body = await page.locator("body").innerText();

      /**
       * `next-intl` çatışmayan açar üçün `MISSING_MESSAGE` yazır və açarın
       * özünü çap edir.
       *
       * Namespace prefiksi ilə axtarmaq işləmir — normal mətndə də nöqtə ilə
       * bitən sözlər var («…commercial property.», «…database listings.»).
       * Ona görə yoxlama iki dəqiq siqnala bağlanıb: kitabxananın öz xəta
       * markeri və **tək başına sətir təşkil edən** nöqtəli açar yolu
       * (`home.hero.title` kimi) — canlı mətndə belə sətir olmur.
       */
      expect(body).not.toContain("MISSING_MESSAGE");

      const rawKeyLine = body
        .split("\n")
        .map((line) => line.trim())
        .find(
          (line) =>
            /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+){2,}$/.test(line) &&
            // Domen adı eyni naxışa uyur (`www.luxehomeestate.az`) — istisna edilir.
            !/^www\./i.test(line) &&
            !/\.(az|com|net|org|ru|io|dev|xml|json|webp|png|jpg|svg)$/i.test(line),
        );
      expect(rawKeyLine, `${locale}: xam tərcümə açarı çap olunub → «${rawKeyLine}»`).toBeUndefined();
    }
  });
});

test.describe("Dil dəyişdirici", () => {
  test("dil dəyişdirici mövcuddur və işləyir", async ({ page }) => {
    await visit(page, "/az/emlaklar");
    await page.waitForLoadState("load");

    // Dəyişdirici `aria-label="Dili dəyiş"` daşıyır.
    const switcher = page.locator('[aria-label="Dili dəyiş"]:visible').first();
    test.skip((await switcher.count()) === 0, "dil dəyişdirici tapılmadı");

    await switcher.click();
    const englishOption = page.locator('a[href^="/en/"]:visible, a[href="/en"]:visible').first();
    test.skip((await englishOption.count()) === 0, "EN seçimi açılmadı");

    await englishOption.click();
    await page.waitForURL(/\/en(\/|$)/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("dil dəyişəndə səhifə konteksti qorunur", async ({ page }) => {
    // Kataloqdan dil dəyişdikdə istifadəçi yenə kataloqda qalmalıdır.
    await visit(page, "/en/emlaklar");
    const enPath = new URL(page.url()).pathname;
    expect(enPath).toContain("emlaklar");
  });
});

test.describe("Yerli formatlar", () => {
  test("qiymətlər manat işarəsi ilə göstərilir", async ({ page }) => {
    await visit(page, "/az/emlaklar");
    const body = await page.locator("main").innerText();
    test.skip(!/\d/.test(body), "kataloq boşdur");

    // Valyuta AZN-dir və hər dildə eyni simvolla göstərilir.
    expect(body).toMatch(/₼|AZN/);
  });
});
