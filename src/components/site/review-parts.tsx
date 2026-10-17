import { getTranslations } from "next-intl/server";
import { BadgeCheck, MessageSquareReply, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { REVIEW_REPORT_REASONS, type ReviewCriterion, type ReviewReportKind } from "@/lib/constants";
import { ReviewReportButton } from "@/components/site/review-report-button";
import { isFeatureEnabled } from "@/lib/feature-flags";

/**
 * Rəy göstərişinin ortaq hissələri (#230, PRD 10.2–10.5): meyar ortalamaları, «Təsdiqlənmiş əlaqə»
 * nişanı və agentin/agentliyin cavabı. Agent və agentlik profilləri eyni görünüşü işlədir.
 */

export async function ReviewCriteriaSummary({ averages }: { averages: { criterion: ReviewCriterion; average: number | null; count: number }[] }) {
  const t = await getTranslations("phase2");
  const rows = averages.filter((row) => row.average != null);
  if (rows.length === 0) return null;
  return (
    <dl className="mt-4 grid grid-cols-1 gap-2 rounded-lg border border-line bg-paper p-4 shadow-xs sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.criterion} className="flex items-center justify-between gap-3 text-sm">
          <dt className="text-ink-soft">{t(`agents.criteria.${row.criterion}`)}</dt>
          <dd className="flex items-center gap-2">
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <span className="block h-full rounded-full bg-gold" style={{ width: `${((row.average ?? 0) / 5) * 100}%` }} />
            </span>
            <span className="w-8 text-right font-medium text-ink">{row.average?.toFixed(1)}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export type PublicReview = {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  verifiedInteraction: boolean;
  replyText: string | null;
  replyAuthorName: string | null;
};

export async function ReviewCard({
  review,
  footer,
  className,
  report,
}: {
  review: PublicReview;
  footer?: React.ReactNode;
  className?: string;
  /** Rəydən şikayət (#232) — admin daxil etdiyi müştəri rəyində (`Testimonial`) yoxdur. */
  report?: ReviewReportKind | null;
}) {
  const [t, reportsEnabled] = await Promise.all([getTranslations("phase2"), isFeatureEnabled("REPORTS")]);
  return (
    <li className={cn("flex flex-col gap-2 rounded-xl border border-line bg-paper p-4 shadow-xs", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-0.5 text-gold-deep" aria-label={t("agents.reviewStars", { rating: review.rating })}>
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className={cn("size-4", index < review.rating ? "fill-current" : "text-line-strong")} aria-hidden="true" />
          ))}
        </p>
        {review.verifiedInteraction && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            {t("agents.verifiedInteraction")}
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-ink-soft [overflow-wrap:anywhere]">{review.comment}</p>
      <p className="mt-auto text-xs text-ink-muted">{review.customerName}{footer}</p>
      {report && reportsEnabled && (
        <ReviewReportButton
          kind={report}
          reviewId={review.id}
          labels={{
            open: t("agents.report.open"),
            title: t("agents.report.title"),
            description: t("agents.report.description"),
            reason: t("agents.report.reason"),
            reasons: Object.fromEntries(REVIEW_REPORT_REASONS.map((value) => [value, t(`agents.report.reasons.${value}`)])) as Record<(typeof REVIEW_REPORT_REASONS)[number], string>,
            comment: t("agents.report.comment"),
            submit: t("agents.report.submit"),
            cancel: t("agents.report.cancel"),
          }}
        />
      )}
      {review.replyText && (
        <div className="mt-1 rounded-sm border-l-2 border-gold bg-ivory px-3 py-2 text-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-ink">
            <MessageSquareReply className="size-3.5 text-gold-deep" aria-hidden="true" />
            {t("agents.replyFrom", { name: review.replyAuthorName ?? "—" })}
          </p>
          <p className="mt-1 whitespace-pre-line text-ink-soft [overflow-wrap:anywhere]">{review.replyText}</p>
        </div>
      )}
    </li>
  );
}
