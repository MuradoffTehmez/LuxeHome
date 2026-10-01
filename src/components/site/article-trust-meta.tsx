import { Calendar, CalendarClock, Clock, Eye, UserRound, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { siteConfig } from "@/config/site";
import { formatLocalizedDate } from "@/i18n/date";
import type { Locale } from "@/lib/constants";
import { cn, formatNumber } from "@/lib/utils";

type ArticleTrustMetaProps = {
  authorName?: string | null;
  publishedAt: Date;
  updatedAt: Date;
  readMinutes: number;
  viewCount: number;
};

/**
 * `dl > div > dt + dd` — ikon `dt`-nin içindədir, çünki qrup `div`-i yalnız `dt`/`dd` saxlaya bilər
 * (əlavə `span` qardaşı `dlitem`/`definition-list` a11y qaydasını pozur).
 */
function MetaItem({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 lg:px-8 lg:first:pl-0 lg:not-first:border-l lg:not-first:border-line",
        className,
      )}
    >
      <dt className="flex items-center gap-2 text-xs font-medium tracking-wide text-ink-muted uppercase">
        <Icon className="size-4 shrink-0 text-gold-deep" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1.5 pl-6 text-[0.9375rem] font-semibold text-ink [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/**
 * Məqalənin müəllif, tarix, oxuma vaxtı və baxış məlumatı.
 *
 * Hər dəyər öz başlığı ilə ayrıca blokdur (əvvəlki kimi bir sətirdə «Dərc edilib: …
 * Yenilənib: …» yığını deyil). Tarix `Intl`-dən deyil, `formatLocalizedDate`-dən gəlir:
 * Workers-in ICU datasında Azərbaycan ay adları yoxdur.
 */
export function ArticleTrustMeta({
  authorName,
  publishedAt,
  updatedAt,
  readMinutes,
  viewCount,
}: ArticleTrustMetaProps) {
  const t = useTranslations("content.articleMeta");
  const locale = useLocale() as Locale;
  const published = formatLocalizedDate(publishedAt, locale);
  const updated = formatLocalizedDate(updatedAt, locale);
  const hasMeaningfulUpdate = Boolean(updated) && updated !== published;

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-y-4">
      <MetaItem icon={UserRound} label={t("author")} className="col-span-2 sm:col-span-1">
        {authorName || siteConfig.legalName}
      </MetaItem>
      <MetaItem icon={Calendar} label={t("published")}>
        <time dateTime={publishedAt.toISOString()}>{published}</time>
      </MetaItem>
      {hasMeaningfulUpdate && (
        <MetaItem icon={CalendarClock} label={t("updated")}>
          <time dateTime={updatedAt.toISOString()}>{updated}</time>
        </MetaItem>
      )}
      <MetaItem icon={Clock} label={t("readingTime")}>
        {t("readValue", { count: readMinutes })}
      </MetaItem>
      <MetaItem icon={Eye} label={t("views")}>
        {formatNumber(viewCount)}
      </MetaItem>
    </dl>
  );
}
