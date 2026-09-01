import { expect, type Locator, type Page, type Response } from "@playwright/test";

/**
 * Testlərin paylaşdığı köməkçilər.
 *
 * Burada yalnız **davranış** köməkçiləri var; seçicilər səhifə obyektlərindədir
 * (`e2e/pages/`). Bölgü qəsdəndir: UI dəyişəndə yalnız səhifə obyekti yenilənir.
 */

/** Saytın dəstəklədiyi dillər — `src/lib/constants.ts`-dəki `LOCALES` ilə eyni. */
export const LOCALES = ["az", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

/** İctimai marşrutlar. Ad azərbaycancadır və URL-in bir hissəsidir. */
export const PUBLIC_ROUTES = [
  "",
  "/emlaklar",
  "/layiheler",
  "/xidmetler",
  "/haqqimizda",
  "/blog",
  "/elaqe",
  "/agentler",
  "/agentlikler",
  "/terefdaslar",
  "/bilik-merkezi",
  "/lugat",
  "/kalkulyator",
  "/suallar",
  "/favoritler",
  "/muqayise",
  "/bazar-analitikasi",
] as const;

/**
 * Səhifəni açır və HTTP statusunu qaytarır.
 *
 * `page.goto()` yönləndirmədən sonrakı cavabı verir; status yoxlaması üçün
 * `null` halı ayrıca tutulur, əks halda `response!.status()` testi anlaşılmaz
 * `TypeError` ilə sındırardı.
 */
export async function visit(page: Page, path: string): Promise<Response> {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  if (!response) throw new Error(`Cavab alınmadı: ${path}`);
  return response;
}

/** Səhifənin 200 ilə açıldığını və boş olmadığını yoxlayır. */
export async function expectPageOk(page: Page, path: string): Promise<void> {
  const response = await visit(page, path);
  expect(response.status(), `${path} statusu`).toBe(200);
  await expect(page.locator("body")).toBeVisible();
  // Next.js xəta sərhədi `error.tsx` da 200 qaytara bilər — mətnlə də yoxlanılır.
  await expect(page.locator("body")).not.toContainText("Application error");
}

/**
 * Kataloqdakı elan kartları.
 *
 * Kart başlığı `<h3><a href="/{locale}/emlaklar/{slug}">` formasındadır və
 * seçici məhz ona bağlanır: kartda şəkil, favorit və müqayisə elementləri də
 * var, ona görə sadəcə `a[href^=...]` saymaq hər kartı bir neçə dəfə sayardı.
 * `h3 > a` isə kart başına dəqiq bir dənədir.
 */
export function propertyCardLinks(page: Page, locale: Locale = "az"): Locator {
  return page.locator(`h3 a[href^="/${locale}/emlaklar/"]`);
}

/** «300 nəticə» sətrindən rəqəmi çıxarır. Sətir tapılmasa `null`. */
export async function readResultCount(page: Page): Promise<number | null> {
  const text = await page.locator("body").innerText();
  const match = text.match(/(\d[\d\s]*)\s*(?:nəticə|result|результат)/i);
  if (!match) return null;
  return Number(match[1].replace(/\s/g, ""));
}

/** URL query parametrini oxuyur. */
export function queryParam(page: Page, name: string): string | null {
  return new URL(page.url()).searchParams.get(name);
}

/**
 * Səhifədə ən azı bir elan kartının olmasını gözləyir.
 *
 * Boş kataloq real haldır (production-da az məzmun), ona görə bu köməkçi
 * yalnız məzmun gözlənilən testlərdə çağırılır.
 */
export async function expectHasProperties(page: Page, locale: Locale = "az"): Promise<number> {
  const cards = propertyCardLinks(page, locale);
  await expect(cards.first()).toBeVisible();
  return cards.count();
}

/** `<head>` içindəki meta məzmununu qaytarır. */
export async function metaContent(page: Page, selector: string): Promise<string | null> {
  const element = page.locator(`head ${selector}`).first();
  if ((await element.count()) === 0) return null;
  return element.getAttribute("content");
}

/** Səhifədəki bütün JSON-LD bloklarını parse edir. */
export async function jsonLdBlocks(page: Page): Promise<Array<Record<string, unknown>>> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  const blocks: Array<Record<string, unknown>> = [];
  for (const item of raw) {
    try {
      const parsed = JSON.parse(item);
      // `@graph` sarğısı da işlədilir — hər iki forma düzləşdirilir.
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else if (Array.isArray(parsed?.["@graph"])) blocks.push(...parsed["@graph"]);
      else blocks.push(parsed);
    } catch {
      throw new Error(`JSON-LD parse olunmadı: ${item.slice(0, 120)}`);
    }
  }
  return blocks;
}

/**
 * Konsol xətalarını toplayır.
 *
 * Şəkil 404-ləri və üçüncü tərəf skript xəbərdarlıqları süzülür: onlar real
 * tətbiq xətası deyil və testi səbəbsiz qırmamalıdır.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/favicon|net::ERR_|Failed to load resource|googletagmanager|gtag/i.test(text)) return;
    errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

/** Cookie/consent banner varsa bağlayır ki, kliklərin üstünü örtməsin. */
export async function dismissBanners(page: Page): Promise<void> {
  const candidates = [
    page.getByRole("button", { name: /qəbul|razıyam|accept|принять/i }),
    page.getByRole("button", { name: /bağla|close|закрыть/i }),
  ];
  for (const candidate of candidates) {
    const first = candidate.first();
    if ((await first.count()) > 0 && (await first.isVisible().catch(() => false))) {
      await first.click().catch(() => undefined);
    }
  }
}

/**
 * Hidratasiyadan sonra klik.
 *
 * Server HTML-i düyməni dərhal göstərir, lakin React hidratasiya edənə qədər
 * `onClick` bağlanmır — `domcontentloaded`-dan sonrakı klik səssizcə itir.
 * `waitForLoadState("networkidle")` bu layihədə etibarlı deyil (analitika və
 * şəkil sorğuları uzun quyruq buraxır), ona görə klik `verify` şərti ödənənə
 * qədər təkrarlanır.
 *
 * @param locator klik ediləcək element
 * @param verify  klikin işlədiyini təsdiqləyən şərt
 */
export async function clickUntil(
  locator: Locator,
  verify: () => Promise<boolean>,
  options: { attempts?: number; gapMs?: number } = {},
): Promise<void> {
  const attempts = options.attempts ?? 6;
  const gapMs = options.gapMs ?? 700;

  await expect(locator).toBeVisible();

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await locator.click({ trial: false }).catch(() => undefined);
    await locator.page().waitForTimeout(gapMs);
    if (await verify()) return;
  }

  throw new Error(`Klik ${attempts} cəhddən sonra da nəticə vermədi (hidratasiya?)`);
}

/** `localStorage`-dəki favorit ID-lərini oxuyur. */
export async function readFavorites(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("luxehomeestate:favorites");
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  });
}
