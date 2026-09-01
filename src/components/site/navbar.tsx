"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ChevronDown, Heart, Menu, Phone, Plus, Search } from "lucide-react";
import { navigation, siteConfig } from "@/config/site";
import { isNavigationItemActive } from "@/lib/ui/navigation";
import { cn } from "@/lib/utils";
import { IconButton, buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Overlay } from "@/components/ui/overlay";
import { AccountMenu } from "./account-menu";
import { Logo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSelector } from "./theme-selector";
import { ThemeToggle } from "./theme-toggle";

/** `siteConfig.navigation`-dakı href → tərcümə açarı. Kompakt (xl-dən aşağı) etiket
 * də eyni açardan gəlir — ayrıca sabit lüğət artıq lazım deyil. */
const NAV_KEYS: Record<string, "home" | "properties" | "projects" | "agencies" | "services" | "blog" | "contact" | "partners"> = {
  "/": "home",
  "/emlaklar": "properties",
  "/layiheler": "projects",
  "/agentlikler": "agencies",
  "/terefdaslar": "partners",
  "/xidmetler": "services",
  "/blog": "blog",
  "/elaqe": "contact",
};

/**
 * Uzun lokallaşdırılmış etiketlərdə header-i sıxmamaq üçün əsas sətrdə yalnız
 * ən çox istifadə olunan keçidlər saxlanılır. Ana səhifə loqodan da əlçatandır,
 * tərəfdaşlar isə desktop overflow və mobil menyuda qalır. Əlaqə hər zaman əsas
 * sətrdədir — locale uzunluğu onun görünməsinə təsir etmir.
 */
const OVERFLOW_HREFS = new Set(["/", "/terefdaslar"]);
const MOBILE_PRIMARY_HREFS = new Set(["/", "/emlaklar", "/layiheler", "/agentlikler", "/xidmetler"]);
export const desktopNavigationGroups = {
  primary: navigation.filter((item) => !OVERFLOW_HREFS.has(item.href)),
  overflow: navigation.filter((item) => OVERFLOW_HREFS.has(item.href)),
};

/**
 * Fixed, responsive ictimai sayt başlığı.
 *
 * Dil seçici cari locale-prefiksli marşrutda qalaraq bütün ictimai və hesab
 * səhifələrində eyni naviqasiya davranışını saxlayır.
 */
export function Navbar({
  showLocaleSwitcher = false,
}: {
  showLocaleSwitcher?: boolean;
}) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLLIElement>(null);
  const overflowButtonRef = useRef<HTMLButtonElement>(null);
  const transparent = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOverflowOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!overflowOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!overflowRef.current?.contains(event.target as Node)) setOverflowOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOverflowOpen(false);
        overflowButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [overflowOpen]);

  const isOverlay = transparent && !scrolled && !menuOpen;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[var(--z-header)] border-b transition-[background-color,box-shadow] duration-300",
        isOverlay
          ? "border-white/15 bg-charcoal/[0.66] backdrop-blur-md"
          : "border-line bg-paper/95 shadow-[0_10px_30px_rgba(24,29,39,0.06)] backdrop-blur-xl",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-[var(--z-toast)] focus:rounded-xs focus:bg-charcoal focus:px-4 focus:py-2 focus:text-sm focus:text-ink-invert"
      >
        {t("skipToContent")}
      </a>

      <Container
        size="wide"
        className={cn(
          "flex min-h-[var(--header-h)] min-w-0 items-center gap-2 min-[1440px]:grid min-[1440px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[1440px]:gap-3 min-[1800px]:max-w-[120rem] min-[1800px]:gap-5 min-[2200px]:gap-7",
          isOverlay && "on-dark",
        )}
      >
        <Logo
          tone={isOverlay ? "dark" : "light"}
          compact
          className="shrink-0 max-[639px]:[&>span]:hidden min-[1440px]:hidden"
        />
        <Logo
          tone={isOverlay ? "dark" : "light"}
          compact
          className="hidden shrink-0 min-[1440px]:inline-flex [&>span]:hidden min-[1800px]:[&>span]:flex"
        />

        <nav
          aria-label={t("mainNavigation")}
          className="hidden min-w-0 justify-center min-[1440px]:flex min-[1800px]:hidden"
          data-navigation-section="desktop"
          data-navigation-mode="compact"
        >
          <ul className="flex min-w-0 items-center gap-1">
            {desktopNavigationGroups.primary.map((item) => {
              const active = isNavigationItemActive(pathname, item.href);

              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative inline-flex min-h-11 items-center whitespace-nowrap rounded-xs px-2.5 text-sm font-medium transition-colors duration-300",
                      isOverlay
                        ? active
                          ? "text-gold-soft"
                          : "text-white hover:text-gold-soft"
                        : active
                          ? "text-gold-deep"
                          : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {NAV_KEYS[item.href] ? t(NAV_KEYS[item.href]) : item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-2 bottom-1.5 h-px origin-left transition-transform duration-300 ease-out-soft",
                        isOverlay ? "bg-gold-soft" : "bg-gold-deep",
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      )}
                    />
                  </Link>
                </li>
              );
            })}

            <li ref={overflowRef} className="relative shrink-0">
              <button
                ref={overflowButtonRef}
                type="button"
                aria-expanded={overflowOpen}
                aria-controls="desktop-navigation-overflow"
                onClick={() => setOverflowOpen((open) => !open)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-xs px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  isOverlay
                    ? "text-white hover:text-gold-soft"
                    : "text-ink-soft hover:text-ink",
                )}
              >
                {t("more")}
                <ChevronDown
                  aria-hidden="true"
                  className={cn("size-4 transition-transform", overflowOpen && "rotate-180")}
                />
              </button>

              {overflowOpen ? (
                <ul
                  id="desktop-navigation-overflow"
                  className="absolute top-[calc(100%+0.5rem)] right-0 min-w-52 rounded-sm border border-line bg-paper p-2 shadow-editorial"
                >
                  {desktopNavigationGroups.overflow.map((item) => {
                    const active = isNavigationItemActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setOverflowOpen(false)}
                          className={cn(
                            "flex min-h-11 items-center rounded-xs px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                            active ? "bg-beige text-gold-deep" : "text-ink hover:bg-beige/60",
                          )}
                        >
                          {NAV_KEYS[item.href] ? t(NAV_KEYS[item.href]) : item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          </ul>
        </nav>

        <nav
          aria-label={t("mainNavigation")}
          className="hidden min-w-0 justify-center min-[1800px]:flex"
          data-navigation-section="desktop-full"
          data-navigation-mode="full"
        >
          <ul className="flex min-w-0 items-center gap-0 min-[2200px]:gap-1">
            {navigation.map((item) => {
              const active = isNavigationItemActive(pathname, item.href);

              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative inline-flex min-h-11 items-center whitespace-nowrap rounded-xs px-2 text-[0.8125rem] font-medium transition-colors duration-300 min-[2200px]:px-2.5 min-[2200px]:text-sm",
                      isOverlay
                        ? active
                          ? "text-gold-soft"
                          : "text-white hover:text-gold-soft"
                        : active
                          ? "text-gold-deep"
                          : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {NAV_KEYS[item.href] ? t(NAV_KEYS[item.href]) : item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-2 bottom-1.5 h-px origin-left transition-transform duration-300 ease-out-soft",
                        isOverlay ? "bg-gold-soft" : "bg-gold-deep",
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 min-[1440px]:ml-0 min-[1440px]:gap-1.5">
          <div className="hidden items-center gap-1 min-[1440px]:flex">
            <ThemeToggle isOverlay={isOverlay} />
            {showLocaleSwitcher ? <LocaleSwitcher isOverlay={isOverlay} /> : null}
          </div>

          <Link
            href="/favoritler"
            aria-label={t("myFavorites")}
            title={t("favorites")}
            className={cn(
              "hidden size-11 items-center justify-center rounded-full transition-colors duration-200 min-[1440px]:inline-flex",
              isOverlay
                ? "text-white/90 hover:bg-white/10 hover:text-gold-soft"
                : "text-ink-soft hover:bg-beige hover:text-gold-deep",
            )}
          >
            <Heart className="size-5" aria-hidden="true" />
          </Link>

          <div
            className={cn(
              "hidden items-center border-l pl-1 min-[1440px]:ml-0.5 min-[1440px]:flex min-[1440px]:pl-2",
              isOverlay ? "border-white/20" : "border-line",
            )}
          >
            <AccountMenu isOverlay={isOverlay} />
          </div>

          <Link
            href="/kabinet/elanlar/yeni"
            aria-label={t("listProperty")}
            className={buttonClassName("primary", "sm", false, "inline-flex min-w-11 px-2.5 sm:px-3 xl:px-4")}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="max-sm:hidden [@media(min-width:1440px)_and_(max-width:1799px)]:sr-only">
              {t("listProperty")}
            </span>
          </Link>

          <IconButton
            label={menuOpen ? t("menuOpen") : t("openMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className={cn(
              "min-[1440px]:hidden",
              isOverlay ? "text-ink-invert hover:bg-white/10" : "text-ink",
            )}
          >
            <Menu className="size-6" aria-hidden="true" />
          </IconButton>
        </div>
      </Container>

      <Overlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t("menu")}
        placement="right"
        className="w-[min(24rem,94vw)]"
      >
        <section aria-labelledby="mobile-main-actions">
          <p id="mobile-main-actions" className="editorial-kicker mb-3 text-ink-muted">
            {t("mainActions")}
          </p>
          <div className="grid gap-2.5">
            <Link
              href="/emlaklar"
              onClick={() => setMenuOpen(false)}
              className={buttonClassName("primary", "lg", true)}
            >
              <Search className="size-4" aria-hidden="true" />
              {t("searchProperties")}
            </Link>
            <Link
              href="/kabinet/elanlar/yeni"
              onClick={() => setMenuOpen(false)}
              className={buttonClassName("outline", "lg", true)}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("listProperty")}
            </Link>
          </div>
        </section>

        <nav aria-label={t("mobileNavigation")} className="mt-7 border-t border-line pt-6">
          <p className="editorial-kicker mb-3 text-ink-muted">{t("explore")}</p>
          <ul className="overflow-hidden rounded-md border border-line bg-paper">
            {[...navigation]
              .sort((a, b) => Number(MOBILE_PRIMARY_HREFS.has(b.href)) - Number(MOBILE_PRIMARY_HREFS.has(a.href)))
              .map((item) => {
              const active = isNavigationItemActive(pathname, item.href);

              return (
                <li key={item.href} className="border-b border-line last:border-0">
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center justify-between px-3.5 text-[0.9375rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold",
                      active ? "bg-gold/10 text-gold-deep" : "text-ink hover:bg-beige/60",
                    )}
                  >
                    {NAV_KEYS[item.href] ? t(NAV_KEYS[item.href]) : item.label}
                    {active ? <span aria-hidden="true" className="h-px w-6 bg-gold" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-labelledby="mobile-preferences" className="mt-7 border-t border-line pt-6">
          <p id="mobile-preferences" className="editorial-kicker mb-4 text-ink-muted">
            {t("preferences")}
          </p>
          <div className="space-y-5">
            {showLocaleSwitcher ? (
              <div>
                <p className="mb-2 text-xs font-semibold text-ink-soft">{t("language")}</p>
                <LocaleSwitcher variant="mobile" onSelect={() => setMenuOpen(false)} />
              </div>
            ) : null}
            <div>
              <p className="mb-2 text-xs font-semibold text-ink-soft">{t("appearance")}</p>
              <ThemeSelector />
            </div>
          </div>
        </section>

        <section className="mt-7 border-t border-line pt-6" aria-label={t("quickLinks")}>
          <p className="editorial-kicker mb-4 text-ink-muted">{t("quickLinks")}</p>
          <div className="flex flex-col gap-2.5">
            <AccountMenu variant="mobile" />
            <Link
              href="/favoritler"
              onClick={() => setMenuOpen(false)}
              className={buttonClassName("outline", "lg", true)}
            >
              <Heart className="size-4" aria-hidden="true" />
              {t("myFavorites")}
            </Link>
            <a
              href={siteConfig.phoneHref}
              className="inline-flex min-h-14 items-center justify-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-gold-deep"
            >
              <Phone className="size-4" aria-hidden="true" />
              {siteConfig.phone}
            </a>
          </div>
        </section>
      </Overlay>
    </header>
  );
}
