"use client";

import { useActionState } from "react";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { Button } from "@/components/ui/button";
import { submitAgentReview } from "./actions";

export function AgentReviewForm({
  agentId,
  labels,
}: {
  agentId: string;
  labels: {
    title: string;
    rating: string;
    comment: string;
    serviceType: string;
    submit: string;
  };
}) {
  const [state, action, pending] = useActionState(submitAgentReview, IDLE_STATE);

  return (
    <form action={action} className="rounded-md border border-line bg-paper p-5 sm:p-6">
      <input type="hidden" name="agentId" value={agentId} />
      <h2 className="font-display text-xl text-ink">{labels.title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm text-ink">
          {labels.rating}
          <select name="rating" required defaultValue="5" className="min-h-11 rounded-xs border border-line-strong bg-paper px-3">
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink">
          {labels.serviceType}
          <input name="serviceType" maxLength={80} className="min-h-11 rounded-xs border border-line-strong bg-paper px-3" />
        </label>
      </div>
      <label className="mt-4 flex flex-col gap-1.5 text-sm text-ink">
        {labels.comment}
        <textarea name="comment" required minLength={20} maxLength={2000} rows={5} className="rounded-xs border border-line-strong bg-paper p-3" />
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
