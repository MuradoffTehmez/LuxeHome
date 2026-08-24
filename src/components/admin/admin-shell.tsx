"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { ROLE_LABELS } from "@/lib/constants";
import type { AuthUser } from "@/lib/auth/types";
import { signOut } from "@/app/[locale]/giris/actions";
import { adminNav } from "./admin-nav";
import { AdminIcon } from "./admin-icon";

type AdminShellProps = {
  user: AuthUser;
  counters?: { newLeads?: number; draftProperties?: number; pendingModeration?: number };
  children: React.ReactNode;
};

type SidebarContentProps = {
  pathname: string;
  user: AuthUser;
  counters: { newLeads?: number; draftProperties?: number; pendingModeration?: number };
  tone: "light" | "dark";
  onNavigate?: () => void;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdminShell({ user, counters = {}, children }: AdminShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-beige">
      <aside className="dark-surface fixed inset-y-0 left-0 hidden w-[264px] flex-col border-r border-white/10 bg-[#101a28] text-white lg:flex">
        <SidebarContent pathname={pathname} user={user} counters={counters} tone="dark" />
      </aside>

      <Overlay
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="İdarə paneli menyusu"
        placement="left"
        className="w-[min(20rem,88vw)] lg:hidden"
      >
        <SidebarContent
          pathname={pathname}
          user={user}
          counters={counters}
          tone="light"
          onNavigate={() => setDrawerOpen(false)}
        />
      </Overlay>

      <div className="flex min-h-dvh flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-[var(--z-header)] flex min-h-16 items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menyunu aç"
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xs text-ink transition-colors hover:bg-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xs px-3 text-sm text-ink-soft transition-colors hover:bg-beige hover:text-ink">
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Saytı aç</span>
            </Link>
            <div className="hidden h-8 w-px bg-line sm:block" aria-hidden="true" />
            <div className="flex min-w-0 items-center gap-3 pl-1">
              <div aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-charcoal text-sm font-semibold text-ink-invert">
                {initials(user.name)}
              </div>
              <div className="hidden min-w-0 leading-tight sm:block">
                <p className="max-w-48 truncate text-sm font-medium text-ink">{user.name}</p>
                <p className="text-xs text-ink-muted">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname, user, counters, tone, onNavigate }: SidebarContentProps) {
  const dark = tone === "dark";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn("shrink-0 border-b px-3 pb-4", dark ? "border-white/10" : "border-line")}>
        <Link href="/admin" onClick={onNavigate} className={cn("flex min-h-14 items-center gap-2.5 rounded-xs px-2 leading-none", dark ? "text-white" : "text-ink")}>
          <Image src="/logo-mark.png" alt="" width={512} height={512} className="size-9 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate font-display text-sm tracking-[0.14em]">LUXE HOME ESTATE</span>
            <span className={cn("mt-1 block text-[10px] tracking-[0.2em]", dark ? "text-gold-soft" : "text-gold-deep")}>İDARƏ PANELİ</span>
          </span>
        </Link>
      </div>

      <nav aria-label="Admin naviqasiyası" className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {adminNav.map((group) => (
          <div key={group.title} className="mb-6 last:mb-0">
            <p className={cn("px-3 pb-2 text-[11px] font-semibold tracking-[0.16em] uppercase", dark ? "text-white/45" : "text-ink-muted")}>{group.title}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                const badge = item.badgeKey ? counters[item.badgeKey] : undefined;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-xs px-3 text-sm transition-colors duration-200",
                        dark
                          ? isActive ? "bg-gold/15 font-medium text-gold-soft" : "text-white/75 hover:bg-white/8 hover:text-white"
                          : isActive ? "bg-beige font-medium text-ink" : "text-ink-soft hover:bg-beige/60 hover:text-ink",
                      )}
                    >
                      <AdminIcon name={item.icon} className="size-4.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {badge ? <span className="inline-flex min-w-6 justify-center rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-semibold text-ink tabular-nums">{badge}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("shrink-0 border-t p-3", dark ? "border-white/10" : "border-line")}>
        <div className="px-3 pb-3">
          <p className={cn("truncate text-sm", dark ? "text-white/90" : "text-ink")}>{user.name}</p>
          <p className={cn("truncate text-xs", dark ? "text-white/50" : "text-ink-muted")}>{user.email}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className={cn("flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xs px-3 text-sm transition-colors", dark ? "text-white/75 hover:bg-white/8 hover:text-white" : "text-ink-soft hover:bg-danger-bg hover:text-danger")}>
            <LogOut className="size-4.5 shrink-0" aria-hidden="true" />
            Çıxış
          </button>
        </form>
        <p className={cn("px-3 pt-3 text-[11px] leading-relaxed", dark ? "text-white/40" : "text-ink-muted")}>
          {siteConfig.legalName}<br />Sahibi: {siteConfig.owner.name}
        </p>
      </div>
    </div>
  );
}
