"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Phone, Plus, Search } from "lucide-react";
import { navigation, siteConfig } from "@/config/site";
import { isNavigationItemActive } from "@/lib/ui/navigation";
import { cn } from "@/lib/utils";
import { ButtonLink, IconButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Overlay } from "@/components/ui/overlay";
import { AccountMenu } from "./account-menu";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const COMPACT_NAVIGATION_LABELS: Record<string, string> = {
  "/": "Ana",
  "/emlaklar": "Əmlaklar",
  "/layiheler": "Komplekslər",
  "/agentlikler": "Agentliklər",
  "/xidmetler": "Xidmətlər",
  "/blog": "Bloq",
  "/elaqe": "Əlaqə",
};

/** Fixed, responsive ictimai sayt başlığı. */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const transparent = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isOverlay = transparent && !scrolled && !menuOpen;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[var(--z-header)] border-b transition-[background-color,box-shadow] duration-300",
        isOverlay
          ? "border-white/10 bg-transparent"
          : "border-line bg-paper/95 shadow-[0_10px_30px_rgba(24,29,39,0.06)] backdrop-blur-xl",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-[var(--z-toast)] focus:rounded-xs focus:bg-charcoal focus:px-4 focus:py-2 focus:text-sm focus:text-ink-invert"
      >
        Əsas məzmuna keç
      </a>

      <Container
        size="wide"
        className={cn(
          "flex min-h-[var(--header-h)] min-w-0 items-center gap-2 lg:gap-3 2xl:gap-5",
          isOverlay && "on-dark",
        )}
      >
        <Logo
          tone={isOverlay ? "dark" : "light"}
          compact
          className="shrink-0 lg:hidden 2xl:inline-flex"
        />
        <Logo
          tone={isOverlay ? "dark" : "light"}
          compact
          className="hidden shrink-0 lg:inline-flex 2xl:hidden [&>span]:hidden"
        />

        <nav aria-label="Əsas naviqasiya" className="hidden min-w-0 flex-1 justify-center lg:flex">
          <ul className="flex min-w-0 items-center">
            {navigation.map((item) => {
              const active = isNavigationItemActive(pathname, item.href);

              return (
                <li key={item.href} className="min-w-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative inline-flex min-h-11 items-center whitespace-nowrap rounded-xs px-2 text-xs font-medium transition-colors duration-300 2xl:px-3 2xl:text-sm",
                      isOverlay
                        ? active
                          ? "text-gold-soft"
                          : "text-white hover:text-gold-soft"
                        : active
                          ? "text-gold-deep"
                          : "text-ink-soft hover:text-ink",
                    )}
                  >
                    <span className="2xl:hidden">
                      {COMPACT_NAVIGATION_LABELS[item.href] ?? item.label}
                    </span>
                    <span className="hidden 2xl:inline">{item.label}</span>
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

        <div className="ml-auto flex shrink-0 items-center gap-1 2xl:gap-2">
          <ThemeToggle />

          <Link
            href="/favoritler"
            aria-label="Favorit əmlaklarım"
            title="Favoritlər"
            className={cn(
              "hidden size-11 items-center justify-center rounded-xs transition-colors duration-200 xl:inline-flex",
              isOverlay ? "text-white hover:text-gold-soft" : "text-ink-soft hover:text-gold-deep",
            )}
          >
            <Heart className="size-5" aria-hidden="true" />
          </Link>

          <a
            href={siteConfig.phoneHref}
            className={cn(
              "hidden min-h-11 shrink-0 items-center gap-2 text-sm font-medium transition-colors 2xl:inline-flex",
              isOverlay
                ? "text-ink-invert-soft hover:text-gold-soft"
                : "text-ink-soft hover:text-gold-deep",
            )}
          >
            <Phone className="size-4" aria-hidden="true" />
            {siteConfig.phone}
          </a>

          <div
            className={cn(
              "hidden items-center border-l pl-1 lg:flex 2xl:ml-1 2xl:pl-3",
              isOverlay ? "border-white/20" : "border-line",
            )}
          >
            <AccountMenu isOverlay={isOverlay} />
          </div>

          <ButtonLink
            href="/kabinet/elanlar/yeni"
            variant="primary"
            size="sm"
            className="hidden px-2.5 lg:inline-flex 2xl:px-4"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="2xl:hidden">Elan ver</span>
            <span className="hidden 2xl:inline">Əmlak əlavə et</span>
          </ButtonLink>

          <IconButton
            label={menuOpen ? "Menyu açıqdır" : "Menyunu aç"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className={cn(
              "lg:hidden",
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
        title="Menyu"
        placement="right"
        className="w-[min(26rem,92vw)]"
      >
        <nav aria-label="Mobil naviqasiya">
          <ul className="flex flex-col">
            {navigation.map((item) => {
              const active = isNavigationItemActive(pathname, item.href);

              return (
                <li key={item.href} className="border-b border-line last:border-0">
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 items-center justify-between rounded-xs text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                      active ? "text-gold-deep" : "text-ink",
                    )}
                  >
                    {item.label}
                    {active ? <span aria-hidden="true" className="h-px w-6 bg-gold" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-7 border-t border-line pt-6">
          <p className="editorial-kicker mb-4 text-ink-muted">Sürətli keçidlər</p>
          <div className="flex flex-col gap-3">
            <ButtonLink
              href="/emlaklar"
              onClick={() => setMenuOpen(false)}
              variant="primary"
              size="lg"
              fullWidth
            >
              <Search className="size-4" aria-hidden="true" />
              Əmlak axtar
            </ButtonLink>
            <AccountMenu variant="mobile" />
            <ButtonLink
              href="/favoritler"
              onClick={() => setMenuOpen(false)}
              variant="outline"
              size="lg"
              fullWidth
            >
              <Heart className="size-4" aria-hidden="true" />
              Favoritlərim
            </ButtonLink>
            <a
              href={siteConfig.phoneHref}
              className="inline-flex min-h-14 items-center justify-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-gold-deep"
            >
              <Phone className="size-4" aria-hidden="true" />
              {siteConfig.phone}
            </a>
          </div>
        </div>
      </Overlay>
    </header>
  );
}
