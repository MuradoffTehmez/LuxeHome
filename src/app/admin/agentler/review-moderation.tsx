import { BadgeCheck, Check, ShieldAlert, Star, X } from "lucide-react";
import { getAdminT } from "@/lib/admin-i18n";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import type { ActionState } from "@/lib/admin/action-state";
import { REVIEW_CRITERIA } from "@/lib/constants";
import { parseSuspicionFlags, reviewCriteriaAverages } from "@/lib/reviews";
import { formatDateTime } from "@/lib/utils";

export type ModerationReview = {
  id: string;
  customerName: string;
  targetName: string;
  rating: number;
  ratingCommunication: number | null;
  ratingAccuracy: number | null;
  ratingResponsiveness: number | null;
  ratingProfessionalism: number | null;
  comment: string;
  createdAt: Date;
  verifiedInteraction: boolean;
  suspicionFlags: string | null;
};

/**
 * Rəy moderasiyası növbəsi (#230, PRD 10.5): meyarlar, «təsdiqlənmiş əlaqə» və şübhə siqnalları
 * moderatora göstərilir. Siqnallar rəyi avtomatik rədd etmir — qərar moderatorundur.
 */
export async function ReviewModerationList({
  reviews,
  approve,
  reject,
  publicDescription,
}: {
  reviews: ModerationReview[];
  approve: (id: string) => Promise<ActionState>;
  reject: (id: string) => Promise<ActionState>;
  publicDescription: string;
}) {
  const t = await getAdminT();
  if (reviews.length === 0) return <div className="p-5"><EmptyState title={t("pages.agents.moderasiyaNovbesiBosdur")} /></div>;
  return (
    <ul className="divide-y divide-line">
      {reviews.map((review) => {
        const criteria = reviewCriteriaAverages([review]).filter((row) => row.criterion !== "overall" && row.average != null);
        const flags = parseSuspicionFlags(review.suspicionFlags);
        return (
          <li key={review.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink">{review.customerName} → {review.targetName}</p>
                <span className="flex items-center gap-1 text-sm text-gold-deep"><Star className="size-4 fill-current" aria-hidden="true" /> {review.rating}</span>
                {review.verifiedInteraction && (
                  <Badge tone="success" className="gap-1"><BadgeCheck className="size-3" aria-hidden="true" />{t("pages.agents.reviewModeration.verified")}</Badge>
                )}
                {flags.map((flag) => (
                  <Badge key={flag} tone="warning" className="gap-1"><ShieldAlert className="size-3" aria-hidden="true" />{t(`pages.agents.reviewModeration.flags.${flag}`)}</Badge>
                ))}
              </div>
              {criteria.length > 0 && (
                <p className="mt-1 text-xs text-ink-muted">
                  {criteria.map((row) => `${t(`pages.agents.reviewModeration.criteria.${row.criterion as Exclude<(typeof REVIEW_CRITERIA)[number], "overall">}`)}: ${row.average}`).join(" · ")}
                </p>
              )}
              <p className="mt-1 max-w-3xl text-sm text-ink-soft [overflow-wrap:anywhere]">{review.comment}</p>
              <p className="mt-1 text-xs text-ink-muted">{formatDateTime(review.createdAt)}</p>
            </div>
            <div className="flex shrink-0">
              <ConfirmAction action={approve} id={review.id} label={t("pages.agents.reyiTesdiqle")} title={t("pages.agents.reyTesdiqlensin")} description={publicDescription} confirmLabel={t("pages.agents.tesdiqle")} tone="neutral"><Check className="size-4" /></ConfirmAction>
              <ConfirmAction action={reject} id={review.id} label={t("pages.agents.reyiReddEt")} title={t("pages.agents.reyReddEdilsin")} description={t("pages.agents.reyIctimaiGosterilmeyecek")} confirmLabel={t("pages.agents.reddEt")}><X className="size-4" /></ConfirmAction>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
