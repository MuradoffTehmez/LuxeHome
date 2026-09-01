import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { visit } from "../support/helpers";

/**
 * Əlçatanlıq (WCAG).
 *
 * `axe-core` avtomatik yoxlanıla bilən pozuntuları tapır — bu, əl ilə auditin
 * yerini tutmur, lakin reqressiyanı tutur. Layihədə əvvəllər real problemlər
 * olub: `focus:outline-none` klaviatura fokusunu silirdi, dark rejimdə mətn
 * kontrastı 2.6:1 idi, toxunma hədəfi 40px-ə düşmüşdü.
 *
 * `serious` və `critical` səviyyəli pozuntular qəbul edilmir; `moderate` və
 * `minor` isə hesabata yazılır, testi qırmır.
 */

const AUDITED_PAGES = [
  { name: "Ana səhifə", path: "/az" },
  { name: "Kataloq", path: "/az/emlaklar" },
  { name: "Layihələr", path: "/az/layiheler" },
  { name: "Bloq", path: "/az/blog" },
  { name: "Əlaqə", path: "/az/elaqe" },
  { name: "Kalkulyator", path: "/az/kalkulyator" },
];

for (const target of AUDITED_PAGES) {
  test(`${target.name} — ciddi əlçatanlıq pozuntusu yoxdur`, async ({ page }, testInfo) => {
    await visit(page, target.path);
    await page.waitForLoadState("load");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );

    // Bütün pozuntular hesabata əlavə olunur — `moderate`/`minor` da görünsün.
    if (results.violations.length > 0) {
      await testInfo.attach(`axe-${target.name}.json`, {
        body: JSON.stringify(results.violations, null, 2),
        contentType: "application/json",
      });
    }

    const summary = blocking
      .map((violation) => `${violation.id} (${violation.nodes.length} element): ${violation.help}`)
      .join("\n");

    expect(blocking, `Ciddi pozuntular:\n${summary}`).toHaveLength(0);
  });
}

test.describe("Klaviatura naviqasiyası", () => {
  /**
   * Tarixi reqressiya: `field.tsx` və `search-panel.tsx`-də `focus:outline-none`
   * klaviatura fokus konturunu silirdi — bütün formaları əhatə edən pozuntu idi.
   * Bu test fokusun görünən qaldığını yoxlayır.
   */
  test("fokus göstəricisi görünür qalır", async ({ page }) => {
    await visit(page, "/az/emlaklar");
    await page.waitForLoadState("load");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const focusStyle = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element || element === document.body) return null;
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
        tag: element.tagName,
      };
    });

    test.skip(!focusStyle, "fokus alan element tapılmadı");

    const hasOutline = focusStyle!.outlineStyle !== "none" && focusStyle!.outlineWidth !== "0px";
    const hasShadow = focusStyle!.boxShadow !== "none" && focusStyle!.boxShadow !== "";
    expect(
      hasOutline || hasShadow,
      `${focusStyle!.tag} fokusda görünən göstərici daşımır`,
    ).toBe(true);
  });

  test("Tab ilə naviqasiya interaktiv elementlərə çatır", async ({ page }) => {
    await visit(page, "/az");
    await page.waitForLoadState("load");

    const reached: string[] = [];
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press("Tab");
      const tag = await page.evaluate(() => document.activeElement?.tagName ?? "");
      if (tag) reached.push(tag);
    }

    // Fokus ardıcıllığı linklərə və düymələrə çatmalıdır.
    expect(
      reached.some((tag) => ["A", "BUTTON", "INPUT", "SELECT"].includes(tag)),
      `fokus zənciri: ${reached.join(" → ")}`,
    ).toBe(true);
  });
});

test.describe("Semantik struktur", () => {
  test("hər səhifədə tək h1 var", async ({ page }) => {
    for (const target of AUDITED_PAGES) {
      await visit(page, target.path);
      const count = await page.locator("h1").count();
      expect(count, `${target.path}: h1 sayı ${count}`).toBe(1);
    }
  });

  test("şəkillərdə alt atributu var", async ({ page }) => {
    await visit(page, "/az/emlaklar");

    const missingAlt = await page.locator("main img").evaluateAll((images) =>
      images
        .filter((image) => !(image as HTMLImageElement).hasAttribute("alt"))
        .map((image) => (image as HTMLImageElement).src.slice(0, 70)),
    );
    expect(missingAlt, `alt-sız şəkillər: ${missingAlt.join(", ")}`).toHaveLength(0);
  });

  test("landmark strukturu mövcuddur", async ({ page }) => {
    await visit(page, "/az");
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator("header, [role=banner]").first()).toBeVisible();
    await expect(page.locator("footer, [role=contentinfo]").first()).toBeVisible();
  });
});

test.describe("Dark rejim kontrastı", () => {
  /**
   * Dark rejim `dark:` variantları ilə deyil, `.dark` klassı altında eyni CSS
   * dəyişənlərinin yenidən təyini ilə işləyir. Tokenlər açıq rejimlə eyni
   * qalsaydı, tünd fonda kontrast WCAG həddindən aşağı düşərdi — bu, əvvəllər
   * real problem olub (`--color-ink-muted` 2.6:1).
   */
  test("tünd rejimdə ciddi kontrast pozuntusu yoxdur", async ({ page }, testInfo) => {
    /**
     * Rejim `prefers-color-scheme` ilə deyil, `.dark` klassı ilə işləyir
     * (`next-themes`, `attribute="class"`), ona görə `emulateMedia` təkbaşına
     * kifayət etmir — seçim `localStorage`-ə yazılır və sonra səhifə açılır.
     */
    await page.addInitScript(() => {
      try {
        localStorage.setItem("theme", "dark");
      } catch {
        // private rejimdə yazıla bilməz — test onsuz da skip olunur
      }
    });
    await page.emulateMedia({ colorScheme: "dark" });
    await visit(page, "/az/emlaklar");
    await page.waitForLoadState("load");

    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    test.skip(!isDark, "tünd rejim aktivləşmədi");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .include("main")
      .analyze();

    const contrast = results.violations.filter((violation) => violation.id === "color-contrast");
    if (contrast.length > 0) {
      await testInfo.attach("axe-dark-contrast.json", {
        body: JSON.stringify(contrast, null, 2),
        contentType: "application/json",
      });
    }

    const serious = contrast.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(serious, "tünd rejimdə kontrast pozuntusu").toHaveLength(0);
  });
});
