"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ExternalLink, LogOut, Menu } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { cn } from "@/lib/utils";
import { localizePath } from "@/i18n/path-locale";
import type { Locale } from "@/lib/constants";
import { siteConfig } from "@/config/site";
import type { AuthUser } from "@/lib/auth/types";
import { signOut } from "@/app/[locale]/giris/actions";
import { adminNav } from "./admin-nav";
import { AdminIcon } from "./admin-icon";
import { AdminCommandMenu } from "./admin-command-menu";

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
  const t = useTranslations("admin");
  // Paneldən ictimai sayta keçid istifadəçinin panel dilində açılır
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-ivory">
      <aside className="dark-surface fixed inset-y-0 left-0 z-[var(--z-sticky)] hidden w-[292px] flex-col border-r border-white/10 bg-[#101a28] text-white shadow-lg lg:flex">
        <SidebarContent pathname={pathname} user={user} counters={counters} tone="dark" />
      </aside>

      <Overlay
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t("shell.menuTitle")}
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

      <div className="flex min-h-dvh flex-col lg:pl-[292px]">
        <header className="sticky top-0 z-[var(--z-header)] flex min-h-[72px] items-center gap-3 border-b border-line bg-paper/90 px-4 shadow-xs backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("shell.openMenu")}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-xs text-ink transition-colors hover:bg-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <div className="flex min-w-0 flex-1 justify-end px-0 md:justify-center md:px-4">
            <AdminCommandMenu />
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Link href={localizePath("/", locale)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xs px-3 text-sm text-ink-soft transition-colors hover:bg-beige hover:text-ink">
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t("shell.openSite")}</span>
            </Link>
            <div className="hidden h-8 w-px bg-line sm:block" aria-hidden="true" />
            <div className="flex min-w-0 items-center gap-3 pl-1">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt="" width={72} height={72} className="size-9 shrink-0 rounded-full object-cover" />
              ) : (
                <div aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-charcoal text-sm font-semibold text-ink-invert">
                  {initials(user.name)}
                </div>
              )}
              <div className="hidden min-w-0 leading-tight sm:block">
                <p className="max-w-48 truncate text-sm font-medium text-ink">{user.name}</p>
                <p className="text-xs text-ink-muted">{t(`labels.role.${user.role}`)}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname, user, counters, tone, onNavigate }: SidebarContentProps) {
  const t = useTranslations("admin");
  const dark = tone === "dark";
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      adminNav.flatMap((group) =>
        group.items
          .filter((item) => item.children?.some((child) => routeIsActive(child.href, pathname)))
          .map((item) => [item.href, true]),
      ),
    ),
  );

  useEffect(() => {
    const activeParents = adminNav.flatMap((group) =>
      group.items.filter((item) => item.children?.some((child) => routeIsActive(child.href, pathname))),
    );
    if (activeParents.length === 0) return;
    setExpandedItems((current) => ({
      ...current,
      ...Object.fromEntries(activeParents.map((item) => [item.href, true])),
    }));
  }, [pathname]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn("shrink-0 border-b px-4 py-4", dark ? "border-white/10" : "border-line")}>
        <Link href="/admin" onClick={onNavigate} className={cn("flex min-h-14 items-center gap-3 rounded-md px-2 leading-none", dark ? "text-white" : "text-ink")}>
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-md", dark ? "bg-white/8" : "bg-beige")}>
            <Image src="/logo-mark.png" alt="" width={512} height={512} className="size-8" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-sm tracking-[0.14em]">LUXE HOME ESTATE</span>
            <span className={cn("mt-1 block text-[10px] tracking-[0.2em]", dark ? "text-gold-soft" : "text-gold-deep")}>{t("shell.brandSubtitle")}</span>
          </span>
        </Link>
      </div>

      <nav aria-label={t("shell.navLabel")} className="min-h-0 flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin]">
        {adminNav.map((group) => (
          <div key={group.titleKey} className="mb-6 last:mb-0">
            <p className={cn("px-3 pb-2 text-[11px] font-semibold tracking-[0.16em] uppercase", dark ? "text-white/45" : "text-ink-muted")}>{t(`nav.groups.${group.titleKey}`)}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const hasChildren = Boolean(item.children?.length);
                const activeChildHref = getActiveChildHref(item.children ?? [], pathname);
                const childIsActive = Boolean(activeChildHref);
                const isActive = hasChildren ? childIsActive : routeIsActive(item.href, pathname);
                const badge = item.badgeKey ? counters[item.badgeKey] : undefined;
                const expanded = hasChildren && Boolean(expandedItems[item.href]);
                const submenuId = `admin-submenu-${item.labelKey}`;

                return (
                  <li key={item.href}>
                    <div className={cn(
                      "flex min-h-11 items-center rounded-md transition-colors duration-200",
                      dark
                        ? isActive ? "bg-gold/15 text-gold-soft" : "text-white/75 hover:bg-white/8 hover:text-white"
                        : isActive ? "bg-beige text-ink" : "text-ink-soft hover:bg-beige/60 hover:text-ink",
                    )}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={!hasChildren && isActive ? "page" : undefined}
                        className={cn("flex min-h-11 min-w-0 flex-1 items-center gap-3 px-3 text-sm", isActive && "font-medium")}
                      >
                        <AdminIcon name={item.icon} className="size-4.5 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{t(`nav.items.${item.labelKey}`)}</span>
                        {badge ? <span className="inline-flex min-w-6 justify-center rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-semibold text-ink tabular-nums">{badge}</span> : null}
                      </Link>
                      {hasChildren && (
                        <button
                          type="button"
                          onClick={() => setExpandedItems((current) => ({ ...current, [item.href]: !current[item.href] }))}
                          aria-expanded={expanded}
                          aria-controls={submenuId}
                          aria-label={t(expanded ? "shell.collapseSection" : "shell.expandSection", { section: t(`nav.items.${item.labelKey}`) })}
                          className={cn("mr-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-xs focus-visible:outline-none", dark ? "hover:bg-white/10" : "hover:bg-black/5")}
                        >
                          <ChevronDown className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")} aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    {hasChildren && expanded && (
                      <ul id={submenuId} className={cn("mt-1 ml-5 grid gap-0.5 border-l py-1 pl-3", dark ? "border-white/12" : "border-line-strong")}>
                        {item.children?.map((child) => {
                          const active = child.href.split("#", 1)[0] === activeChildHref;
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={onNavigate}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                  "relative flex min-h-10 items-center rounded-md px-3 text-[13px] transition-colors",
                                  dark
                                    ? active ? "bg-white/8 font-medium text-white" : "text-white/60 hover:bg-white/6 hover:text-white"
                                    : active ? "bg-beige font-medium text-ink" : "text-ink-muted hover:bg-beige/60 hover:text-ink",
                                )}
                              >
                                {active && <span className="absolute top-1/2 -left-[13px] h-5 w-0.5 -translate-y-1/2 bg-gold" aria-hidden="true" />}
                                <span className="truncate">{t(`nav.items.${child.labelKey}`)}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
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
            {t("shell.signOut")}
          </button>
        </form>
        <p className={cn("px-3 pt-3 text-[11px] leading-relaxed", dark ? "text-white/40" : "text-ink-muted")}>
          {siteConfig.legalName}<br />{t("shell.ownedBy", { name: siteConfig.owner.name })}
        </p>
      </div>
    </div>
  );
}

function routeIsActive(href: string, pathname: string): boolean {
  if (href.includes("#")) return false;
  const cleanHref = href.split("?", 1)[0];
  if (cleanHref === "/admin") return pathname === "/admin";
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

function getActiveChildHref(children: { href: string }[], pathname: string): string | undefined {
  return children
    .filter((child) => !child.href.includes("#"))
    .map((child) => child.href.split("?", 1)[0])
    .filter((href, index, values) => values.indexOf(href) === index)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}
