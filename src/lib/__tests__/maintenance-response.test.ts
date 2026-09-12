import { describe, expect, it } from "vitest";
import { SYSTEM_MODES } from "@/lib/constants";
import { siteConfig } from "@/config/site";
import { maintenanceResponse } from "@/lib/maintenance-response";
import { DEFAULT_SYSTEM_MODE_CONFIG } from "@/lib/system-mode-policy";

/**
 * Texniki xidmət cavabının müqaviləsi.
 *
 * Bu cavab middleware-dən qaytarılır və Next server-inə heç vaxt çatmır, ona görə
 * onu qoruyan başqa qat yoxdur: status kodu, başlıqlar və səhifənin özü-özünə
 * bəs etməsi burada yoxlanılır. Səhv 200 status və ya indekslənməyə icazə verən
 * başlıq axtarış nəticələrinə birbaşa zərər verərdi.
 */

const config = { ...DEFAULT_SYSTEM_MODE_CONFIG, mode: SYSTEM_MODES.MAINTENANCE };
const now = new Date("2026-09-12T12:00:00.000Z");

async function render(overrides: Partial<typeof config> = {}, locale: "az" | "en" | "ru" = "az") {
  const response = maintenanceResponse({ ...config, ...overrides }, locale, now);
  return { response, html: await response.text() };
}

describe("HTTP müqaviləsi", () => {
  it("503 qaytarır — 200 və ya 404 deyil", async () => {
    const { response } = await render();
    expect(response.status).toBe(503);
  });

  it("axtarış sistemləri üçün tələb olunan başlıqları daşıyır", async () => {
    const { response } = await render();
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(response.headers.get("Retry-After")).toBe("3600");
  });

  it("heç bir keş qatında saxlanılmır", async () => {
    const { response } = await render();
    // Rejim söndürüləndən sonra köhnə səhifənin qalması ən pis nəticədir.
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("CDN-Cache-Control")).toBe("no-store");
    expect(response.headers.get("Cloudflare-CDN-Cache-Control")).toBe("no-store");
    // Cavab dilə və sessiyaya görə dəyişir (super admin bypass alır).
    expect(response.headers.get("Vary")).toContain("Cookie");
  });
});

describe("səhifənin müstəqilliyi", () => {
  it("kənar resurs yükləmir — yalnız data URI şəkli", async () => {
    const { response, html } = await render();
    expect(response.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
    expect(response.headers.get("Content-Security-Policy")).toContain("img-src data:");

    // `src`/`href` ilə kənar (və ya daxili) fayl çəkilməməlidir: bu səhifə məhz
    // sistem çətinlik çəkəndə göstərilir, asset pipeline-ına güvənə bilməz.
    const externalRefs = html.match(/(?:src|href)="(?!data:)[^"]*"/g) ?? [];
    expect(externalRefs).toEqual([]);
  });

  it("loqonu gömülü daşıyır", async () => {
    const { html } = await render();
    expect(html).toContain('class="brand-mark"');
    expect(html).toContain("data:image/png;base64,");
  });
});

describe("dil seçimi", () => {
  it.each([
    ["az", "Saytımız müvəqqəti əlçatmazdır"],
    ["en", "Our website is temporarily unavailable"],
    ["ru", "Сайт временно недоступен"],
  ] as const)("%s üçün öz mətnini verir", async (locale, heading) => {
    const { response, html } = await render({}, locale);
    expect(html).toContain(heading);
    expect(html).toContain(`lang="${locale}"`);
    expect(response.headers.get("Content-Language")).toBe(locale);
  });

  it("paneldən yazılmış mətn defoltu əvəz edir", async () => {
    const { html } = await render({
      title: { az: "Öz başlığımız", en: "", ru: "" },
      description: { az: "Öz açıqlamamız", en: "", ru: "" },
    });
    expect(html).toContain("Öz başlığımız");
    expect(html).toContain("Öz açıqlamamız");
    expect(html).not.toContain("Saytımız müvəqqəti əlçatmazdır");
  });

  it("bir dildə boş qalan mətn AZ-a düşür", async () => {
    const { html } = await render({ title: { az: "Yalnız AZ", en: "", ru: "" } }, "en");
    expect(html).toContain("Yalnız AZ");
  });
});

describe("paneldən gələn mətnin təhlükəsizliyi", () => {
  it("HTML-i qaçırır — panel mətni skriptə çevrilə bilməz", async () => {
    const { html } = await render({
      title: { az: '<script>alert("xss")</script>', en: "", ru: "" },
      description: { az: "a < b && c > d", en: "", ru: "" },
    });
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a &lt; b &amp;&amp; c &gt; d");
  });
});

describe("geri sayım", () => {
  it("gələcək hədəf üçün sayğacı və skripti daxil edir", async () => {
    const target = new Date("2026-09-25T05:00:00.000Z");
    const { html } = await render({ endAt: target.toISOString() });
    expect(html).toContain(`data-target="${target.getTime()}"`);
    expect(html).toContain('id="countdown"');
  });

  it("hədəf yoxdursa sayğac da, skript də olmur", async () => {
    const { html } = await render({ endAt: null });
    expect(html).not.toContain('id="countdown"');
    expect(html).not.toContain("<script>");
  });

  it("keçmiş hədəf göstərilmir — rejim isə yerində qalır", async () => {
    const { response, html } = await render({ endAt: "2026-09-12T11:00:00.000Z" });
    expect(html).not.toContain('id="countdown"');
    expect(response.status).toBe(503);
  });

  it("söndürüləndə geri sayım əvəzinə təxmini vaxt göstərilir", async () => {
    const { html } = await render({
      showCountdown: false,
      endAt: "2026-09-25T05:00:00.000Z",
      expectedBackAt: "2026-09-25T05:00:00.000Z",
    });
    expect(html).not.toContain('id="countdown"');
    expect(html).toContain("panel-label");
  });
});

describe("brend", () => {
  it("adı və hüquqi sahibi `siteConfig`-dən götürür — hardcode edilmir", async () => {
    const { html } = await render();
    expect(html).toContain(siteConfig.name);
    expect(html).toContain(siteConfig.legalName);
    expect(html).toContain(siteConfig.owner.name);
  });
});
