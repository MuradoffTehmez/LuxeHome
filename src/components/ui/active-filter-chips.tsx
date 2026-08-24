import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActiveFilterChip = {
  key: string;
  label: string;
  href: string;
};

export type ActiveFilterChipsProps = {
  items: readonly ActiveFilterChip[];
  resetHref?: string;
  className?: string;
};

/** URL-i mənbə saxlayan aktiv filter silmə naviqasiyası. */
export function ActiveFilterChips({
  items,
  resetHref,
  className,
}: ActiveFilterChipsProps) {
  const t = useTranslations("common.ui");
  if (items.length === 0) return null;

  return (
    <nav aria-label={t("activeFilters")} className={cn("min-w-0", className)}>
      <ul className="-mx-4 flex snap-x items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <li key={`${item.key}-${item.label}`} className="shrink-0 snap-start">
            <Link
              href={item.href}
              aria-label={t("removeFilter", { label: item.label })}
              className="inline-flex min-h-11 items-center gap-2 rounded-xs border border-line-strong bg-paper px-3 text-sm font-medium text-ink-soft transition-colors hover:border-gold hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              <span>{item.label}</span>
              <X className="size-3.5" aria-hidden="true" />
            </Link>
          </li>
        ))}

        {resetHref ? (
          <li className="shrink-0 snap-start">
            <Link
              href={resetHref}
              className="inline-flex min-h-11 items-center rounded-xs px-2 text-sm font-medium text-gold-deep underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {t("resetFilters")}
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
