import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/az/blog" }));

import { AnalyticsProvider } from "../analytics-provider";
import { ConsentBanner } from "../consent-banner";
import { CookiePreferencesButton } from "../cookie-preferences-button";

const noop = () => undefined;

describe("ConsentBanner", () => {
  it("qeyri-modal dialoqdur: başlıq və təsvirlə əlaqəli, aside landmark-ı deyil", () => {
    const html = renderToStaticMarkup(<ConsentBanner mode="initial" choice="unset" onAccept={noop} onDecline={noop} />);

    expect(html).toMatch(/^<div role="dialog"/);
    expect(html).toContain('aria-modal="false"');
    expect(html).toMatch(/aria-labelledby="[^"]+"/);
    expect(html).toMatch(/aria-describedby="[^"]+"/);
    expect(html).not.toContain("<aside");
    expect(html).toContain("Analitika cookie-ləri");
  });

  it("cookie siyasətinə yerli keçid və ad/telefon/e-poçt toplanmadığını bildirən dəqiq mətn göstərir", () => {
    const html = renderToStaticMarkup(<ConsentBanner mode="initial" choice="unset" onAccept={noop} onDecline={noop} />);

    expect(html).toContain('href="/cookie-siyaseti"');
    expect(html).toContain("ad, telefon və ya e-poçt kimi məlumat toplamadan");
    expect(html).not.toContain("şəxsi məlumat toplamadan");
  });

  it("iki seçim bərabər ölçüdə və 44 px hədəfdir", () => {
    const html = renderToStaticMarkup(<ConsentBanner mode="initial" choice="unset" onAccept={noop} onDecline={noop} />);
    const buttons = html.match(/<button[^>]*class="[^"]*"/g) ?? [];

    expect(buttons).toHaveLength(2);
    expect(html).toContain("grid-cols-2");
    for (const button of buttons) expect(button).toContain("min-h-11");
    expect(html).toContain("İcazə verirəm");
    expect(html).toContain("İmtina edirəm");
  });

  it("alt naviqasiya və sticky CTA zolağının üstündə qalmaq üçün hər iki ofseti işlədir", () => {
    const html = renderToStaticMarkup(<ConsentBanner mode="initial" choice="unset" onAccept={noop} onDecline={noop} />);

    expect(html).toContain("var(--bottom-nav-offset)");
    expect(html).toContain("var(--sticky-bar-offset)");
    expect(html).toContain("var(--safe-left)");
  });

  it("ilk seçimdə bağlama düyməsi və cari seçim yazısı yoxdur", () => {
    const html = renderToStaticMarkup(<ConsentBanner mode="initial" choice="unset" onAccept={noop} onDecline={noop} onClose={noop} />);

    expect(html).not.toContain('aria-label="Bağla"');
    expect(html).not.toContain('role="status"');
  });

  it("parametrlər rejimində cari seçimi göstərir və bağlamağa imkan verir", () => {
    const granted = renderToStaticMarkup(<ConsentBanner mode="preferences" choice="granted" onAccept={noop} onDecline={noop} onClose={noop} />);
    const denied = renderToStaticMarkup(<ConsentBanner mode="preferences" choice="denied" onAccept={noop} onDecline={noop} onClose={noop} />);

    expect(granted).toContain('aria-label="Bağla"');
    expect(granted).toContain('role="status"');
    expect(granted).toContain("analitikaya icazə verilib");
    expect(denied).toContain("analitikadan imtina edilib");
  });
});

describe("AnalyticsProvider SSR", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /**
   * Reqressiya: banner server HTML-inə hamı üçün yazılırdı, ona görə artıq seçim edən istifadəçi də
   * JS yüklənənə qədər onu görürdü. Seçim yalnız brauzerdə oxunur — server heç vaxt banner render etmir.
   */
  it("analitika konfiqurasiya olunsa belə server HTML-ində banner yoxdur", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123456");

    expect(renderToStaticMarkup(<AnalyticsProvider />)).toBe("");
  });

  it("analitika konfiqurasiya olunmayıbsa heç nə render etmir", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "");

    expect(renderToStaticMarkup(<AnalyticsProvider />)).toBe("");
  });
});

describe("CookiePreferencesButton", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("analitika yoxdursa görünmür", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "");

    expect(renderToStaticMarkup(<CookiePreferencesButton />)).toBe("");
  });

  it("production-da GA ID varsa «Cookie parametrləri» düyməsi çıxır", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123456");

    const footer = renderToStaticMarkup(<CookiePreferencesButton variant="footer" />);
    const page = renderToStaticMarkup(<CookiePreferencesButton variant="page" />);

    expect(footer).toContain("Cookie parametrləri");
    expect(footer).toContain('type="button"');
    expect(footer).toContain("min-h-11");
    expect(page).toContain("Cookie parametrləri");
    expect(page).toContain("min-h-11");
  });
});
