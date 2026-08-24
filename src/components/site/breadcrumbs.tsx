import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type BreadcrumbLink = { label: string; href?: string };

export function Breadcrumbs({
  items,
  locale = DEFAULT_LOCALE,
  className,
}: {
  items: BreadcrumbLink[];
  locale?: Locale;
  className?: string;
}) {
  const t = useTranslations("common.ui");

  return (
    <nav aria-label={t("breadcrumbs")} className={cn(className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1 || !item.href;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
              {isCurrent ? (
                <span aria-current="page" className="truncate text-ink-soft">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href as string}
                  locale={locale}
                  className="inline-flex min-h-11 items-center transition-colors hover:text-gold-deep"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
