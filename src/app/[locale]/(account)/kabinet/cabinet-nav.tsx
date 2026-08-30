"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Bell, CalendarCheck, History, LayoutGrid, ListChecks, LogOut, Plus, Search, Sparkles, UserRound, Users } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getCabinetItems, isCabinetItemActive } from "@/lib/accounts/cabinet-navigation";
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
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

const ICONS = {
  overview: LayoutGrid,
  listings: ListChecks,
  "new-listing": Plus,
  team: Users,
  "saved-searches": Search,
  notifications: Bell,
  reservations: CalendarCheck,
  recommendations: Sparkles,
  "recently-viewed": History,
  profile: UserRound,
} as const;

const LABEL_KEYS = {
  overview: "overview",
  listings: "listings",
  "new-listing": "newListing",
  team: "team",
  "saved-searches": "savedSearches",
  notifications: "notifications",
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
      className="inline-flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xs px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-50"
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
  variant = "desktop",
  onNavigate,
}: CabinetNavProps) {
  const pathname = usePathname();
  const t = useTranslations("auth.cabinet");
  const items = getCabinetItems(canList, canManageTeam);

  return (
    <nav aria-label={t("menu")} className="flex flex-col gap-4">
      <div className={cn("rounded-md border border-line bg-paper p-4", variant === "mobile" && "bg-beige/45")}>
        <p className="text-xs tracking-wide text-ink-muted uppercase">{accountLabel}</p>
        <p className="mt-1 truncate font-medium text-ink">{name}</p>
      </div>

      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = isCabinetItemActive(pathname, item.href);
          const Icon = ICONS[item.id];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 w-full items-center gap-2 rounded-xs px-3 text-sm transition-colors",
                  active
                    ? "bg-beige font-medium text-ink"
                    : "text-ink-soft hover:bg-beige/60 hover:text-ink",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {t(LABEL_KEYS[item.id])}
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={signOutAccount} className="border-t border-line pt-2">
        <SignOutButton />
      </form>
    </nav>
  );
}
