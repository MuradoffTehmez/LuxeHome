import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "az",
  useTranslations: () => (key: string) => key === "switch" ? "Dili dəyiş" : key,
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/emlaklar",
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/lib/locale-actions", () => ({
  saveLocalePreference: vi.fn(),
}));

vi.mock("@/components/site/navigation-progress", () => ({
  startNavigationProgress: vi.fn(),
}));

import { LocaleSwitcher } from "../locale-switcher";

describe("LocaleSwitcher", () => {
  it("mobil menyuda üç dili bayraq və tam adı ilə birbaşa göstərir", () => {
    const html = renderToStaticMarkup(<LocaleSwitcher variant="mobile" />);

    expect(html).toContain("🇦🇿");
    expect(html).toContain("Azərbaycan");
    expect(html).toContain("🇬🇧");
    expect(html).toContain("English");
    expect(html).toContain("🇷🇺");
    expect(html).toContain("Русский");
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain("role=\"dialog\"");
  });

  it("desktopda cari dili kompakt dropdown düyməsində göstərir", () => {
    const html = renderToStaticMarkup(<LocaleSwitcher />);

    expect(html).toContain("🇦🇿");
    expect(html).toContain(">az<");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Dili dəyiş"');
  });
});
