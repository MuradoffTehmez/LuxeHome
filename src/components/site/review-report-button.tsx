"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { REVIEW_REPORT_COMMENT_MAX, REVIEW_REPORT_REASONS, type ReviewReportKind, type ReviewReportReason } from "@/lib/constants";
import { reportReview } from "@/app/[locale]/(site)/review-report-actions";

export type ReviewReportLabels = {
  open: string;
  title: string;
  description: string;
  reason: string;
  reasons: Record<ReviewReportReason, string>;
  comment: string;
  submit: string;
  cancel: string;
};

/**
 * «Rəydən şikayət et» (#232). Mətnlər server komponentindən prop kimi gəlir — ictimai səhifədə
 * client kataloqu yalnız `PUBLIC_CLIENT_MESSAGE_PATHS`-dir. Profil səhifələri kənar keşdə ola
 * bildiyi üçün giriş vəziyyəti serverdə, göndərişdə yoxlanılır.
 */
export function ReviewReportButton({ kind, reviewId, labels }: { kind: ReviewReportKind; reviewId: string; labels: ReviewReportLabels }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReviewReportReason>("FAKE");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      const result = await reportReview(kind, reviewId, reason, comment);
      setMessage({ ok: result.status === "success", text: result.message ?? "" });
      if (result.status === "success") setOpen(false);
    });

  return (
    <>
      <button
        type="button"
        onClick={() => { setMessage(null); setOpen(true); }}
        className="relative inline-flex items-center gap-1 text-xs text-ink-muted underline-offset-4 after:absolute after:-inset-y-3 hover:text-danger hover:underline"
      >
        <Flag className="size-3" aria-hidden="true" />
        {labels.open}
      </button>
      {message && !open && <p role={message.ok ? "status" : "alert"} className={`text-xs ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</p>}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={labels.title}
        description={labels.description}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>{labels.cancel}</Button>
            <Button variant="danger" loading={pending} onClick={submit}>{labels.submit}</Button>
          </div>
        }
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-ink">{labels.reason}</legend>
          {REVIEW_REPORT_REASONS.map((value) => (
            <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-line px-3 text-sm text-ink has-[:checked]:border-gold has-[:checked]:bg-gold/10">
              <input type="radio" name="review-report-reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="size-4 accent-gold" />
              {labels.reasons[value]}
            </label>
          ))}
        </fieldset>
        <label className="mt-3 flex flex-col gap-1.5 text-sm font-medium text-ink">
          {labels.comment}
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={REVIEW_REPORT_COMMENT_MAX}
            rows={3}
            className="rounded-sm border border-line-strong bg-paper p-3 font-normal"
          />
        </label>
        {message && !message.ok && <p role="alert" className="mt-2 text-sm text-danger">{message.text}</p>}
      </Modal>
    </>
  );
}
