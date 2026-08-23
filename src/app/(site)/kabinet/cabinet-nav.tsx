"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { LayoutGrid, ListChecks, LogOut, Plus, UserRound, Users } from "lucide-react";
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
  profile: UserRound,
} as const;

function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xs px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-50"
    >
      <LogOut className="size-4" aria-hidden="true" />
      {pending ? "Çıxış edilir…" : "Çıxış"}
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
  const items = getCabinetItems(canList, canManageTeam);

  return (
    <nav aria-label="Kabinet menyusu" className="flex flex-col gap-4">
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
                {item.label}
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
