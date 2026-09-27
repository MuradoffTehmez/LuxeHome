import { getTranslations } from "next-intl/server";
import { CalendarCheck, Crown, Heart, ListChecks, Plus, Search, SearchCheck, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type QuickAction = {
  key: "newListing" | "listings" | "favorites" | "savedSearches" | "reservations" | "profile" | "search" | "packages";
  href: string;
  icon: typeof Plus;
  primary?: boolean;
};

/**
 * Kabinetin ana səhifəsindəki sürətli əməliyyatlar: ən çox işlənən funksiyalara
 * menyudan keçmədən bir kliklə çatılır. Elan yerləşdirmə hüququ olmayan hesabda
 * elanla bağlı kartlar göstərilmir.
 */
export async function CabinetQuickActions({ canList }: { canList: boolean }) {
  const t = await getTranslations("auth.cabinet");
  const actions: QuickAction[] = [
    ...(canList
      ? ([
          { key: "newListing", href: "/kabinet/elanlar/yeni", icon: Plus, primary: true },
          { key: "listings", href: "/kabinet/elanlar", icon: ListChecks },
          { key: "packages", href: "/kabinet/paketler", icon: Crown },
        ] satisfies QuickAction[])
      : ([{ key: "search", href: "/emlaklar", icon: Search, primary: true }] satisfies QuickAction[])),
    { key: "favorites", href: "/favoritler", icon: Heart },
    { key: "savedSearches", href: "/kabinet/axtarislarim", icon: SearchCheck },
    { key: "reservations", href: "/kabinet/rezervasiyalar", icon: CalendarCheck },
    { key: "profile", href: "/kabinet/profil", icon: UserRound },
  ];

  return (
    <section aria-labelledby="cabinet-quick-actions" className="flex flex-col gap-3">
      <div>
        <h2 id="cabinet-quick-actions" className="font-sans text-lg font-semibold text-ink">
          {t("quickActions")}
        </h2>
        <p className="text-sm text-ink-muted">{t("quickActionsDescription")}</p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {actions.map(({ key, href, icon: Icon, primary }) => (
          <li key={key}>
            <Link
              href={href}
              className={cn(
                "card-surface flex h-full min-h-24 flex-col gap-2 rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                primary ? "border-gold bg-gold/10" : "border-line bg-paper hover:border-gold",
              )}
            >
              <Icon className={cn("size-5", primary ? "text-gold-deep" : "text-ink-soft")} aria-hidden="true" />
              <span className="text-sm font-semibold text-ink">{t(`quick.${key}`)}</span>
              <span className="text-xs text-ink-muted">{t(`quick.${key}Hint`)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
