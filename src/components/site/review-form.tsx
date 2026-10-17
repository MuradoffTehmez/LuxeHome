"use client";

import { useActionState } from "react";
import { Star } from "lucide-react";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";
import { Button } from "@/components/ui/button";
import { REVIEW_CRITERIA, type ReviewCriterion } from "@/lib/constants";

export type ReviewFormLabels = {
  title: string;
  hint: string;
  criteria: Record<ReviewCriterion, string>;
  comment: string;
  serviceType: string;
  submit: string;
};

/**
 * Agent və agentlik rəyi forması (#230, PRD 10.4): beş meyar 1–5 ulduzla. Hədəf gizli sahədədir
 * (`agentId` / `agencyId`); bütün yoxlamalar serverdədir.
 */
export function ReviewForm({
  action,
  targetField,
  targetId,
  labels,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  targetField: "agentId" | "agencyId";
  targetId: string;
  labels: ReviewFormLabels;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} className="rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-6">
      <input type="hidden" name={targetField} value={targetId} />
      <h2 className="font-display text-xl text-ink">{labels.title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{labels.hint}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {REVIEW_CRITERIA.map((criterion) => (
          <fieldset key={criterion} className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium text-ink">{labels.criteria[criterion]}</legend>
            {/* Sıra tərsdir (5 → 1): seçilmiş ulduz və ondan sonra gələnlər (vizual olaraq solda, aşağı dəyərlər) dolur. */}
            <div className="flex flex-row-reverse justify-end gap-1 [&>label:has(input:checked)_svg]:fill-gold [&>label:has(input:checked)_svg]:text-gold-deep [&>label:has(input:checked)~label_svg]:fill-gold [&>label:has(input:checked)~label_svg]:text-gold-deep">
              {[5, 4, 3, 2, 1].map((value) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name={criterion}
                    value={value}
                    required
                    defaultChecked={value === 5}
                    className="peer sr-only"
                    aria-label={`${labels.criteria[criterion]}: ${value} / 5`}
                  />
                  <Star
                    className="size-7 rounded-xs text-line-strong transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-gold"
                    aria-hidden="true"
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          {labels.serviceType}
          <input name="serviceType" maxLength={80} className="min-h-11 rounded-sm border border-line-strong bg-paper px-3 font-normal" />
        </label>
      </div>
      <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-ink">
        {labels.comment}
        <textarea name="comment" required minLength={20} maxLength={2000} rows={5} className="rounded-sm border border-line-strong bg-paper p-3 font-normal" />
      </label>
      {state.message && (
        <p role={state.status === "error" ? "alert" : "status"} className={`mt-3 text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" loading={pending} className="mt-4">{labels.submit}</Button>
    </form>
  );
}
