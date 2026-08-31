import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const messages: Record<string, string> = {
      home: "Ana səhifə",
      properties: "Əmlaklar",
      projects: "Yaşayış kompleksləri",
      agencies: "Agentliklər və agentlər",
      partners: "Tərəfdaşlar",
      services: "Xidmətlər",
      blog: "Bloq",
      contact: "Əlaqə",
      more: "Daha çox",
      favorites: "Favoritlər",
      listProperty: "Elan ver",
      openMenu: "Menyunu aç",
      menuOpen: "Menyu açıqdır",
      quickLinks: "Sürətli keçidlər",
      searchProperties: "Əmlak axtar",
      myFavorites: "Favoritlərim",
      submitProperty: "Elan ver",
    };
    return (key: string) => messages[key] ?? key;
  },
  useLocale: () => "az",
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("../locale-switcher", () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}));

vi.mock("../account-menu", () => ({
  AccountMenu: () => <div data-testid="account-menu" />,
}));

vi.mock("../theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

import { desktopNavigationGroups, Navbar } from "../navbar";

describe("Navbar", () => {
  it("desktop əsas sətrini yığcam naviqasiya və əsas əməl ilə məhdudlaşdırır", () => {
    const html = renderToStaticMarkup(<Navbar />);

    expect(html).toContain("Yaşayış kompleksləri");
    expect(html).toContain("Agentliklər və agentlər");
    expect(desktopNavigationGroups.overflow.map((item) => item.href)).toContain("/terefdaslar");
    expect(desktopNavigationGroups.primary.map((item) => item.href)).toContain("/elaqe");
    expect(html).not.toContain("AI Axtarış");
    expect(html).not.toContain('href="/agentler"');
    expect(html).not.toContain("+994 51 922 85 85");
    expect(html).toContain("Elan ver");
    expect(html).toContain('href="/kabinet/elanlar/yeni"');
    expect(html).toContain("max-[639px]:[&amp;&gt;span]:hidden");
    expect(html).toContain("min-[1440px]:grid");
    expect(html).toContain("min-[1800px]:max-w-[120rem]");

    const desktopNavigation = html.match(/<nav[^>]*data-navigation-section="desktop"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    expect(desktopNavigation).toBeDefined();
    expect(desktopNavigation).toContain("Əlaqə");
    expect(desktopNavigation).toContain("Daha çox");
    expect(desktopNavigation).not.toContain("Tərəfdaşlar");

    const fullNavigation = html.match(/<nav[^>]*data-navigation-section="desktop-full"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    expect(fullNavigation).toBeDefined();
    expect(fullNavigation).toContain("Ana səhifə");
    expect(fullNavigation).toContain("Tərəfdaşlar");
    expect(fullNavigation).toContain("Əlaqə");
    expect(fullNavigation).not.toContain("Daha çox");
  });
});
