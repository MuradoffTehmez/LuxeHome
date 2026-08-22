"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { LayoutGrid, ListChecks, LogOut, Plus, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
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
};

const BASE_ITEMS = [
  { href: "/kabinet", label: "Ümumi baxış", icon: LayoutGrid },
  { href: "/kabinet/profil", label: "Profil", icon: UserRound },
];

const LISTING_ITEMS = [
  { href: "/kabinet/elanlar", label: "Elanlarım", icon: ListChecks },
  { href: "/kabinet/elanlar/yeni", label: "Yeni elan", icon: Plus },
];

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

export function CabinetNav({ name, accountLabel, canList }: CabinetNavProps) {
  const pathname = usePathname();

  // «Yeni elan» ünvanı «Elanlarım» ilə eyni prefiksi bölüşür, ona görə tam
  // uyğunluq yoxlanılır — əks halda hər iki bənd eyni anda aktiv görünərdi
  const items = canList ? [BASE_ITEMS[0], ...LISTING_ITEMS, BASE_ITEMS[1]] : BASE_ITEMS;

  return (
    <nav aria-label="Kabinet menyusu" className="flex flex-col gap-4">
      <div className="rounded-md border border-line bg-paper p-4">
        <p className="text-xs tracking-wide text-ink-muted uppercase">{accountLabel}</p>
        <p className="mt-1 truncate font-medium text-ink">{name}</p>
      </div>

      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 w-full items-center gap-2 rounded-xs px-3 text-sm transition-colors",
                  active
                    ? "bg-beige font-medium text-ink"
                    : "text-ink-soft hover:bg-beige/60 hover:text-ink",
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden="true" />
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
