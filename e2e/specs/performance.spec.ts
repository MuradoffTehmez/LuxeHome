import { expect, test } from "@playwright/test";
import { visit } from "../support/helpers";

/**
 * Performans büdcəsi.
 *
 * Bu testlər Lighthouse balı hesablamır — uzaq mühitə qarşı ölçülən bal
 * şəbəkə şəraitindən çox asılıdır və CI-də qeyri-sabit olur. Əvəzinə
 * **büdcə pozuntusu** yoxlanılır: həddindən artıq böyük bundle, ölçüsüz
 * şəkil, layout sürüşməsi kimi tətbiqdən asılı göstəricilər.
 *
 * Hədlər qəsdən genişdir: məqsəd reqressiyanı tutmaqdır, mikro-optimizasiya
 * yarışı deyil.
 */

/** Bir səhifədə yüklənən JS-in yuxarı həddi (sıxılmış, bayt). */
const JS_BUDGET_BYTES = 900 * 1024;

/** Şəkillərin ümumi ölçü həddi — ilk ekran üçün. */
const IMAGE_BUDGET_BYTES = 4 * 1024 * 1024;

type ResourceTotals = { js: number; css: number; image: number; total: number; requests: number };

/** Səhifə yüklənərkən şəbəkə cavablarının ölçüsünü toplayır. */
async function measure(page: import("@playwright/test").Page, path: string): Promise<ResourceTotals> {
  const totals: ResourceTotals = { js: 0, css: 0, image: 0, total: 0, requests: 0 };

  page.on("response", async (response) => {
    const type = response.request().resourceType();
    const lengthHeader = response.headers()["content-length"];
    const size = lengthHeader ? Number(lengthHeader) : 0;
    if (!Number.isFinite(size)) return;

    totals.requests += 1;
    totals.total += size;
    if (type === "script") totals.js += size;
    else if (type === "stylesheet") totals.css += size;
    else if (type === "image") totals.image += size;
  });

  await visit(page, path);
  await page.waitForLoadState("load");
  return totals;
}

test.describe("Resurs büdcəsi", () => {
  test("ana səhifə JS büdcəsini aşmır", async ({ page }) => {
    const totals = await measure(page, "/az");
    expect(
      totals.js,
      `JS ${(totals.js / 1024).toFixed(0)} KB — büdcə ${(JS_BUDGET_BYTES / 1024).toFixed(0)} KB`,
    ).toBeLessThan(JS_BUDGET_BYTES);
  });

  test("kataloq şəkil büdcəsini aşmır", async ({ page }) => {
    const totals = await measure(page, "/az/emlaklar");
    expect(
      totals.image,
      `şəkillər ${(totals.image / 1024 / 1024).toFixed(1)} MB`,
    ).toBeLessThan(IMAGE_BUDGET_BYTES);
  });
});

test.describe("Yükləmə göstəriciləri", () => {
  test("ana səhifə məqbul müddətdə interaktiv olur", async ({ page }) => {
    await visit(page, "/az");
    await page.waitForLoadState("load");

    const timing = await page.evaluate(() => {
      const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      if (!entry) return null;
      return {
        ttfb: entry.responseStart - entry.requestStart,
        domContentLoaded: entry.domContentLoadedEventEnd - entry.startTime,
        load: entry.loadEventEnd - entry.startTime,
      };
    });

    test.skip(!timing, "Navigation Timing əlçatan deyil");
    // Workers cold start + D1 sorğusu nəzərə alınıb; hədd reqressiya üçündür.
    expect(timing!.ttfb, `TTFB ${timing!.ttfb.toFixed(0)}ms`).toBeLessThan(8000);
    expect(timing!.domContentLoaded, `DCL ${timing!.domContentLoaded.toFixed(0)}ms`).toBeLessThan(
      15000,
    );
  });

  /**
   * Layout sürüşməsi (CLS) — şəkil və şrift ölçüləri əvvəlcədən verilmədikdə
   * yaranır. Kart şəbəkəsi bu problemə ən həssas səthdir.
   */
  test("kataloqda layout sürüşməsi hədd daxilindədir", async ({ page }) => {
    await visit(page, "/az/emlaklar");
    await page.waitForLoadState("load");
    await page.waitForTimeout(2500);

    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
              if (!shift.hadRecentInput) total += shift.value;
            }
          });
          try {
            observer.observe({ type: "layout-shift", buffered: true });
          } catch {
            resolve(-1);
            return;
          }
          setTimeout(() => {
            observer.disconnect();
            resolve(total);
          }, 1200);
        }),
    );

    test.skip(cls < 0, "layout-shift API dəstəklənmir");
    // Google-un «yaxşı» həddi 0.1-dir; burada reqressiya həddi olaraq 0.25 götürülüb.
    expect(cls, `CLS ${cls.toFixed(3)}`).toBeLessThan(0.25);
  });
});

test.describe("Şəkil optimizasiyası", () => {
  test("şəkillər ölçü atributu ilə gəlir", async ({ page }) => {
    await visit(page, "/az/emlaklar");

    const withoutDimensions = await page.locator("main img").evaluateAll((images) =>
      images
        .filter((image) => {
          const element = image as HTMLImageElement;
          const hasAttrs = element.hasAttribute("width") && element.hasAttribute("height");
          const hasStyle = element.style.aspectRatio || element.style.height;
          const hasFill = element.getAttribute("data-nimg") === "fill";
          return !hasAttrs && !hasStyle && !hasFill;
        })
        .map((image) => (image as HTMLImageElement).src.slice(0, 80)),
    );

    // Ölçüsüz şəkil layout sürüşməsinin əsas mənbəyidir.
    expect(withoutDimensions, `ölçüsüz şəkillər: ${withoutDimensions.join(", ")}`).toHaveLength(0);
  });

  test("kataloq şəkilləri lazy yüklənir", async ({ page }) => {
    await visit(page, "/az/emlaklar");

    const images = page.locator("main img");
    const count = await images.count();
    test.skip(count < 6, "lazy yükləmə üçün kifayət qədər şəkil yoxdur");

    // İlk ekrandan kənardakı şəkillər `loading="lazy"` daşımalıdır.
    const lazyCount = await images.evaluateAll(
      (list) => list.filter((image) => (image as HTMLImageElement).loading === "lazy").length,
    );
    expect(lazyCount, "heç bir şəkil lazy deyil").toBeGreaterThan(0);
  });
});
