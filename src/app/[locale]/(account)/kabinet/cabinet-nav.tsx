"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, BarChart3, ChevronDown, Bell, CalendarCheck, ClipboardList, Contact, Crown, Flag, Gauge, History, LayoutGrid, ListChecks, LogOut, MessageSquare, Plus, ScrollText, Search, ShieldAlert, Sparkles, Star, UserCog, UserRound, Users } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { activeCabinetHref, CABINET_ITEM_SECTION, defaultOpenCabinetSections, getCabinetItems, groupCabinetItems, type CabinetNavItem, type CabinetSection } from "@/lib/accounts/cabinet-navigation";
import { signOutAccount } from "../hesab/actions";

/**
 * Kabinetin yan naviqasiyası.
 *
 * Çıxış düyməsi buradadır: əvvəl kabinetdə heç bir çıxış yolu yox idi və istifadəçi
 * sessiyanı yalnız cookie-ni əl ilə silərək bağlaya bilirdi.
 */

type CabinetNavProps = {
  name: string;
  accountLabel: string;
  canList: boolean;
  canManageTeam?: boolean;
  canTransfer?: boolean;
  canAssignListings?: boolean;
  canViewAnalytics?: boolean;
  hiddenItems?: readonly CabinetNavItem["id"][];
  /** Oxunmamış bildiriş sayı — «Bildirişlər» bəndində nişan. */
  unreadNotifications?: number;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

const ICONS = {
  overview: LayoutGrid,
  "agency-dashboard": Gauge,
  "agency-analytics": BarChart3,
  assignments: UserCog,
  listings: ListChecks,
  "new-listing": Plus,
  leads: MessageSquare,
  clients: Contact,
  analytics: BarChart3,
  packages: Crown,
  team: Users,
  activity: ScrollText,
  tasks: ClipboardList,
  transfers: ArrowLeftRight,
  reviews: Star,
  "saved-searches": Search,
  notifications: Bell,
  reports: Flag,
  restrictions: ShieldAlert,
  reservations: CalendarCheck,
  recommendations: Sparkles,
  "recently-viewed": History,
  profile: UserRound,
} as const;

const LABEL_KEYS = {
  overview: "overview",
  "agency-dashboard": "agencyDashboard",
  "agency-analytics": "agencyAnalytics",
  assignments: "assignments",
  listings: "listings",
  "new-listing": "newListing",
  leads: "leads",
  clients: "clients",
  analytics: "analytics",
  packages: "packages",
  team: "team",
  activity: "activity",
  tasks: "tasks",
  transfers: "transfers",
  reviews: "reviews",
  "saved-searches": "savedSearches",
  notifications: "notifications",
  reports: "reports",
  restrictions: "restrictions",
  reservations: "reservations",
  recommendations: "recommendations",
  "recently-viewed": "recentlyViewed",
  profile: "profile",
} as const;

function SignOutButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("auth.cabinet");

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-50"
    >
      <LogOut className="size-4" aria-hidden="true" />
      {pending ? t("signingOut") : t("signOut")}
    </button>
  );
}

export function CabinetNav({
  name,
  accountLabel,
  canList,
  canManageTeam = false,
  canTransfer = false,
  canAssignListings = false,
  canViewAnalytics = false,
  hiddenItems = [],
  unreadNotifications = 0,
  variant = "desktop",
  onNavigate,
}: CabinetNavProps) {
  const pathname = usePathname();
  const t = useTranslations("auth.cabinet");
  const items = getCabinetItems(canList, canManageTeam, canTransfer, canAssignListings, canViewAnalytics, hiddenItems);
  const activeHref = activeCabinetHref(pathname, items);
  const groups = groupCabinetItems(items);
  const [open, setOpen] = useState<ReadonlySet<CabinetSection>>(() => new Set(defaultOpenCabinetSections(groups, activeHref)));
  const activeItem = items.find((item) => item.href === activeHref);
  const activeSection = activeItem ? CABINET_ITEM_SECTION[activeItem.id] : null;

  // Başqa bölməyə keçəndə həmin bölmə açılır; istifadəçinin açdığı digər bölmələr açıq qalır.
  useEffect(() => {
    if (activeSection) setOpen((current) => (current.has(activeSection) ? current : new Set([...current, activeSection])));
  }, [activeSection]);

  function toggle(section: CabinetSection) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  return (
    <nav aria-label={t("menu")} className="flex flex-col gap-4">
      <div className={cn("rounded-xl border border-line bg-paper px-4 py-3 shadow-xs", variant === "mobile" && "bg-beige/45")}>
        <p className="text-xs font-semibold text-gold-deep">{accountLabel}</p>
        <p className="mt-1 truncate font-medium text-ink">{name}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        {groups.map((group) => {
          const expanded = open.has(group.section);
          const listId = `cabinet-nav-${variant}-${group.section}`;
          const hasUnread = group.items.some((item) => item.id === "notifications") && unreadNotifications > 0;
          return (
            <div key={group.section}>
              <button
                type="button"
                onClick={() => toggle(group.section)}
                aria-expanded={expanded}
                aria-controls={listId}
                className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-sm px-3 text-left text-[11px] font-semibold tracking-[0.14em] text-ink-muted uppercase transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold max-lg:min-h-11"
              >
                <span className="min-w-0 flex-1 truncate">{t(`sections.${group.section}`)}</span>
                {!expanded && (
                  <span className={cn("inline-flex min-w-5 justify-center rounded-full px-1.5 text-[10px] tracking-normal tabular-nums", hasUnread ? "bg-gold text-on-gold" : "bg-beige text-ink-soft")}>
                    {group.items.length}
                  </span>
                )}
                <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
              </button>
              <ul id={listId} hidden={!expanded} className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = item.href === activeHref;
                  const Icon = ICONS[item.id];
                  const badge = item.id === "notifications" ? unreadNotifications : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group/nav inline-flex min-h-11 w-full items-center gap-2.5 rounded-md border px-3 text-sm transition-colors lg:min-h-9",
                          active
                            ? "border-line bg-paper font-semibold text-ink shadow-xs"
                            : "border-transparent text-ink-soft hover:bg-beige/60 hover:text-ink",
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", active ? "text-gold-deep" : "text-ink-muted group-hover/nav:text-ink")} aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{t(LABEL_KEYS[item.id])}</span>
                        {badge > 0 && (
                          <span className="inline-flex min-w-5 justify-center rounded-full bg-gold px-1.5 text-[11px] font-semibold text-on-gold tabular-nums">
                            {badge > 99 ? "99+" : badge}
                            <span className="sr-only"> {t("unreadBadge")}</span>
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <form action={signOutAccount} className="border-t border-line pt-2">
        <SignOutButton />
      </form>
    </nav>
  );
}
