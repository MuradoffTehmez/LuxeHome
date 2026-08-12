"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Phone, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigation, siteConfig } from "@/config/site";
import { ButtonAnchor, ButtonLink, IconButton } from "@/components/ui/button";
import { Logo } from "./logo";

/**
 * Fixed header — hero şəklinin üstündə oturur.
 *
 * Davranış:
 * - Səhifənin başında şəffaf (hero şəklinin üstündə overlay kimi dayanır)
 * - Scroll ≥ 24px olduqda ivory fona keçir və kölgə alır
 * - Mobil versiyada tam ekran drawer açılır
 *
 * Header `fixed` olduğu üçün kontentin üstünə düşür — `<main>` elementinə
 * `pt-[--header-h]` əlavə edilir ki, kontentlər header-in altında qalmasın.
 * Ana səhifədə hero bölməsi öz daxili padding-i ilə bunu idarə edir.
 */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Şəffaf başlıq yalnız tam ekran hero-su olan ana səhifədə istifadə olunur.
  const transparent = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Marşrut dəyişəndə menyu bağlanır
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Menyu açıqkən arxa fon scroll-u bloklanır
  useEffect(() => {
    if (!menuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  /** Şəffaf rejim yalnız hero-lu səhifədə və scroll edilməyibsə aktivdir. */
  const isOverlay = transparent && !scrolled && !menuOpen;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "fixed top-0 z-40 w-full transition-[background-color,box-shadow] duration-300",
        isOverlay
          ? "border-b border-white/10 bg-transparent"
          : "border-b border-line bg-ivory/95 shadow-sm backdrop-blur-md",
      )}
    >
      {/* Klaviatura istifadəçiləri üçün keçid linki */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:rounded-xs focus:bg-charcoal focus:px-4 focus:py-2 focus:text-sm focus:text-ink-invert"
      >
        Əsas məzmuna keç
      </a>

      <div className={cn(
        "mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-6 lg:px-10",
        isOverlay && "on-dark",
      )}>
        <Logo tone={isOverlay ? "dark" : "light"} />

        {/* Desktop naviqasiya */}
        <nav aria-label="Əsas naviqasiya" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-11 items-center rounded-xs px-3 text-sm font-medium transition-colors duration-200",
                      isOverlay
                        ? active
                          ? "text-gold-soft"
                          : "text-ink-invert hover:text-gold-soft"
                        : active
                          ? "text-gold-deep"
                          : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {item.label}
                    {active && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute inset-x-3 bottom-1.5 h-px",
                          isOverlay ? "bg-gold-soft" : "bg-gold",
                        )}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sağ tərəf — hərəkətlər */}
        <div className="flex items-center gap-2">
          <Link
            href="/favoritler"
            aria-label="Favorit əmlaklarım"
            title="Favoritlər"
            className={cn(
              "hidden size-11 items-center justify-center rounded-xs transition-colors duration-200 sm:inline-flex",
              isOverlay
                ? "text-ink-invert hover:text-gold-soft"
                : "text-ink-soft hover:text-gold-deep",
            )}
          >
            <Heart className="size-5" aria-hidden="true" />
          </Link>

          <ButtonAnchor
            href={siteConfig.phoneHref}
            variant={isOverlay ? "onDark" : "outline"}
            size="sm"
            className="hidden xl:inline-flex"
          >
            <Phone className="size-4" aria-hidden="true" />
            {siteConfig.phone}
          </ButtonAnchor>

          <ButtonLink href="/emlaklar" variant="primary" size="sm" className="hidden sm:inline-flex">
            <Search className="size-4" aria-hidden="true" />
            Əmlak axtar
          </ButtonLink>

          {/* Mobil menyu açarı */}
          <IconButton
            label={menuOpen ? "Menyunu bağla" : "Menyunu aç"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "lg:hidden",
              isOverlay ? "text-ink-invert hover:bg-white/10" : "text-ink",
            )}
          >
            {menuOpen ? (
              <X className="size-6" aria-hidden="true" />
            ) : (
              <Menu className="size-6" aria-hidden="true" />
            )}
          </IconButton>
        </div>
      </div>

      {/* Mobil drawer */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="animate-fade-in fixed inset-x-0 top-[var(--header-h)] bottom-0 z-40 overflow-y-auto border-t border-line bg-ivory lg:hidden"
        >
          <nav aria-label="Mobil naviqasiya" className="px-5 py-4">
            <ul className="flex flex-col">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href} className="border-b border-line last:border-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-14 items-center justify-between text-base font-medium transition-colors",
                        active ? "text-gold-deep" : "text-ink",
                      )}
                    >
                      {item.label}
                      {active && (
                        <span aria-hidden="true" className="h-px w-6 bg-gold" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex flex-col gap-3 px-5 pt-2 pb-10">
            <ButtonLink href="/emlaklar" variant="primary" size="lg" fullWidth>
              <Search className="size-4" aria-hidden="true" />
              Əmlak axtar
            </ButtonLink>
            <ButtonLink href="/favoritler" variant="outline" size="lg" fullWidth>
              <Heart className="size-4" aria-hidden="true" />
              Favoritlərim
            </ButtonLink>
            <ButtonAnchor href={siteConfig.phoneHref} variant="ghost" size="lg" fullWidth>
              <Phone className="size-4" aria-hidden="true" />
              {siteConfig.phone}
            </ButtonAnchor>
          </div>
        </div>
      )}
    </header>
  );
}
