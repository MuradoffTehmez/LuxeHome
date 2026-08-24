import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const messages: Record<string, string> = {
      home: "Ana səhifə",
      properties: "Əmlaklar",
      projects: "Yaşayış kompleksləri",
      agencies: "Agentliklər",
      services: "Xidmətlər",
      blog: "Bloq",
      contact: "Əlaqə",
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

import { Navbar } from "../navbar";

describe("Navbar", () => {
  it("desktop əsas sətrini yığcam naviqasiya və əsas əməl ilə məhdudlaşdırır", () => {
    const html = renderToStaticMarkup(<Navbar />);

    expect(html).toContain("Yaşayış kompleksləri");
    expect(html).not.toContain("+994 51 922 85 85");
    expect(html).toContain("Elan ver");
  });
});
