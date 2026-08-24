"use client";

import { Calendar, Clock, Eye, UserRound } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { siteConfig } from "@/config/site";

type ArticleTrustMetaProps = {
  authorName?: string | null;
  publishedAt: Date;
  updatedAt: Date;
  readMinutes: number;
  viewCount: number;
};

export function ArticleTrustMeta({
  authorName,
  publishedAt,
  updatedAt,
  readMinutes,
  viewCount,
}: ArticleTrustMetaProps) {
  const t = useTranslations("content.articleMeta");
  const format = useFormatter();
  const formatDate = (date: Date) => format.dateTime(date, { day: "2-digit", month: "short", year: "numeric" });
  const hasMeaningfulUpdate = updatedAt.toDateString() !== publishedAt.toDateString();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted">
      <span className="flex items-center gap-1.5">
        <Calendar className="size-4" aria-hidden="true" />
        {t("published")} <time dateTime={publishedAt.toISOString()}>{formatDate(publishedAt)}</time>
      </span>
      {hasMeaningfulUpdate && (
        <span className="flex items-center gap-1.5">
          <Calendar className="size-4" aria-hidden="true" />
          {t("updated")} <time dateTime={updatedAt.toISOString()}>{formatDate(updatedAt)}</time>
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <UserRound className="size-4" aria-hidden="true" />
        {authorName || siteConfig.legalName}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="size-4" aria-hidden="true" />
        {t("read", { count: readMinutes })}
      </span>
      <span className="flex items-center gap-1.5">
        <Eye className="size-4" aria-hidden="true" />
        {t("views", { count: viewCount })}
      </span>
    </div>
  );
}
