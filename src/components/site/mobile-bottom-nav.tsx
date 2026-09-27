"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, Home, Map, Search, UserRound } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

/** Detal səhifəsinin öz sabit əməl paneli var — alt naviqasiya orada göstərilmir. */
export function isBottomNavHidden(pathname: string): boolean {
  return /^\/emlaklar\/[^/]+\/?$/.test(pathname);
}

type NavItem = { key: "home" | "search" | "map" | "favorites" | "account"; href: string; icon: typeof Home };

const ITEMS: NavItem[] = [
  { key: "home", href: "/", icon: Home },
  { key: "search", href: "/emlaklar", icon: Search },
  { key: "map", href: "/emlaklar?gorunus=xerite", icon: Map },
  { key: "favorites", href: "/favoritler", icon: Heart },
  { key: "account", href: "/kabinet", icon: UserRound },
];

/**
 * Telefonda sabit alt naviqasiya (#107) — əmlak tətbiqlərindəki kimi bir əllə istifadə.
 *
 * Yalnız `lg`-dən kiçik ekranda görünür. Görünəndə `globals.css` `--bottom-nav-offset`
 * dəyişənini təyin edir; müqayisə paneli, toast və cookie banneri ondan istifadə edib
 * panelin üstünə qalxır, səhifənin sonu isə panelin altında qalmır.
 */
export function MobileBottomNav() {
  const t = useTranslations("navigation.bottom");
  const pathname = usePathname();
  const { ids, ready } = useFavorites();
  // `?gorunus=` yalnız mount-dan sonra oxunur: render zamanı `window` oxumaq server
  // HTML-i ilə uyğunsuzluq, `useSearchParams` isə statik səhifələrdə Suspense tələb edərdi.
  const [mapView, setMapView] = useState(false);
  useEffect(() => {
    const sync = () => setMapView(new URLSearchParams(window.location.search).get("gorunus") === "xerite");
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname]);

  if (isBottomNavHidden(pathname)) return null;

  const isActive = (item: NavItem) => {
    if (item.key === "home") return pathname === "/";
    if (item.key === "search") return pathname === "/emlaklar" && !mapView;
    if (item.key === "map") return pathname === "/emlaklar" && mapView;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <nav
      data-bottom-nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-[calc(var(--z-sticky)+1)] border-t border-line bg-paper/95 pb-[var(--safe-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-xl grid-cols-5 pr-[var(--safe-right)] pl-[var(--safe-left)]">
        {ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
                  active ? "text-gold-deep" : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon className={cn("size-5", active && item.key === "favorites" && "fill-current")} aria-hidden="true" />
                <span>{t(item.key)}</span>
                {item.key === "favorites" && ready && ids.length > 0 ? (
                  <span className="tabular absolute top-2 left-1/2 ml-1.5 grid min-w-4 place-items-center rounded-full bg-gold px-1 text-[0.625rem] leading-4 font-semibold text-on-gold">
                    {ids.length > 99 ? "99+" : ids.length}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
