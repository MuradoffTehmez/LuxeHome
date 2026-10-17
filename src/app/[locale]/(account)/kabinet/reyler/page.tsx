import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BadgeCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { formatLocalizedDate } from "@/i18n/date";
import { requireAccount } from "@/lib/auth/guard";
import { buildManagedMetadata } from "@/lib/seo";
import { getRespondableReviews } from "@/lib/reviews";
import { ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ReviewReplyForm } from "./reply-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.reviews" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/reyler", noIndex: true, locale: locale as Locale });
}

/**
 * Rəylər (#230, PRD 10.5): agentin profilinə və agentliyə yazılmış **təsdiqlənmiş** rəylər və
 * onlara ictimai cavab. Moderasiyadakı rəylər burada görünmür — cavab yalnız ictimai rəyə yazılır.
 */
export default async function ReviewsPage() {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  if (user.accountType !== ACCOUNT_TYPES.AGENCY && user.accountType !== ACCOUNT_TYPES.AGENT) forbidden();
  const t = await getTranslations("account.reviews");
  const reviews = await getRespondableReviews(user.id);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      {reviews.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((review) => (
            <li key={`${review.kind}-${review.id}`} className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-0.5 text-gold-deep" aria-label={t("stars", { rating: review.rating })}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star key={index} className={cn("size-4", index < review.rating ? "fill-current" : "text-line-strong")} aria-hidden="true" />
                    ))}
                  </span>
                  <Badge tone="neutral">{t(review.kind === "agent" ? "aboutAgent" : "aboutAgency", { name: review.targetName })}</Badge>
                  {review.verifiedInteraction && (
                    <Badge tone="success" className="gap-1"><BadgeCheck className="size-3" aria-hidden="true" />{t("verified")}</Badge>
                  )}
                </div>
                <time className="text-xs text-ink-muted" dateTime={review.createdAt.toISOString()}>{formatLocalizedDate(review.createdAt, locale)}</time>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft [overflow-wrap:anywhere]">{review.comment}</p>
              <p className="text-xs text-ink-muted">{review.customerName}</p>
              <ReviewReplyForm kind={review.kind} id={review.id} reply={review.replyText} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
