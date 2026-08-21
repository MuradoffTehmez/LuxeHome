"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { ROLE_LABELS } from "@/lib/constants";
import type { AuthUser } from "@/lib/auth/types";
import { signOut } from "@/app/giris/actions";
import { adminNav } from "./admin-nav";
import { AdminIcon } from "./admin-icon";

type AdminShellProps = {
  /** Sessiyadan gələn istifadəçi — layout-dakı `requireUser()` təmin edir. */
  user: AuthUser;
  /** Yan paneldəki sayğaclar — server tərəfdən ötürülür. */
  counters?: { newLeads?: number; draftProperties?: number };
  children: React.ReactNode;
};

/** Ad və soyadın baş hərfləri — avatar şəkli olmadığı üçün. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const SIDEBAR_WIDTH = "lg:pl-[264px]";

export function AdminShell({ user, counters = {}, children }: AdminShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Səhifə dəyişəndə mobil çekmece bağlanır
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Çekmece açıqkən arxa fon sürüşməsin
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  // Escape ilə bağlanma — modal davranışı tələbi
  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh bg-beige">
      {/* --- Yan panel (desktop sabit, mobil çekmece) --- */}
      <Sidebar
        pathname={pathname}
        user={user}
        counters={counters}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className={cn("flex min-h-dvh flex-col", SIDEBAR_WIDTH)}>
        {/* --- Üst zolaq --- */}
        <header className="sticky top-0 z-[var(--z-header)] flex min-h-16 items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menyunu aç"
            aria-expanded={drawerOpen}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xs text-ink transition-colors hover:bg-beige lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          {/* Qlobal axtarış — hazırda dizayn mərhələsindədir */}
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <label htmlFor="admin-search" className="sr-only">
              Panel daxilində axtarış
            </label>
            <input
              id="admin-search"
              type="search"
              placeholder="Əmlak, müraciət və ya məqalə axtar…"
              className="min-h-11 w-full rounded-xs border border-line-strong bg-ivory pr-3 pl-9 text-sm text-ink transition-colors placeholder:text-ink-muted hover:border-ink-muted focus:border-gold"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xs px-3 text-sm text-ink-soft transition-colors hover:bg-beige hover:text-ink"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Saytı aç</span>
            </Link>

            <div className="hidden h-8 w-px bg-line sm:block" aria-hidden="true" />

            <div className="flex items-center gap-3 pl-1">
              <div
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-charcoal text-sm font-semibold text-ink-invert"
              >
                {initials(user.name)}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium text-ink">{user.name}</p>
                <p className="text-xs text-ink-muted">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Sidebar({
  pathname,
  user,
  counters,
  open,
  onClose,
}: {
  pathname: string;
  user: AuthUser;
  counters: { newLeads?: number; draftProperties?: number };
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobil örtük */}
      {open && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-[var(--z-drawer)] bg-charcoal/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[var(--z-drawer)] flex w-[264px] flex-col",
          "dark-surface border-r border-line-dark/15 bg-[#101a28] text-white",
          "transition-transform duration-300 ease-out-soft lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Admin naviqasiyası"
      >
        {/* Loqo */}
        <div className="flex min-h-16 items-center justify-between gap-2 border-b border-white/10 px-5">
          <Link href="/admin" className="flex flex-col leading-none">
            <span className="font-display text-lg tracking-[0.18em] text-white">
              LUXE HOME ESTATE
            </span>
            <span className="mt-1 text-[10px] tracking-[0.22em] text-gold-soft">
              İDARƏ PANELİ
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Menyunu bağla"
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {adminNav.map((group) => (
            <div key={group.title} className="mb-6 last:mb-0">
              <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.16em] text-white/40 uppercase">
                {group.title}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  // `/admin` yalnız dəqiq uyğunluqda aktivdir, digərləri prefiks üzrə
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  const badge = item.badgeKey ? counters[item.badgeKey] : undefined;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-xs px-3 text-sm transition-colors duration-200",
                          isActive
                            ? "bg-gold/15 font-medium text-gold-soft"
                            : "text-white/75 hover:bg-white/8 hover:text-white",
                        )}
                      >
                        <AdminIcon name={item.icon} className="size-4.5 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {badge ? (
                          <span className="tabular inline-flex min-w-6 justify-center rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-semibold text-ink">
                            {badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="px-3 pb-3">
            <p className="truncate text-sm text-white/90">{user.name}</p>
            <p className="truncate text-xs text-white/45">{user.email}</p>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xs px-3 text-sm text-white/75 transition-colors hover:bg-white/8 hover:text-white"
            >
              <LogOut className="size-4.5 shrink-0" aria-hidden="true" />
              Çıxış
            </button>
          </form>

          <p className="px-3 pt-3 text-[11px] leading-relaxed text-white/35">
            {siteConfig.legalName}
            <br />
            Sahibi: {siteConfig.owner.name}
          </p>
        </div>
      </aside>
    </>
  );
}
