"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { TRUST_REASON_MAX } from "@/lib/constants";
import { appealRestrictionAction } from "./actions";

export function AppealForm({ restrictionId }: { restrictionId: string }) {
  const t = useTranslations("account.restrictions");
  const [state, action, pending] = useActionState(appealRestrictionAction, IDLE_STATE);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="restrictionId" value={restrictionId} />
      <Textarea name="message" label={t("appealLabel")} hint={t("appealHint")} rows={3} maxLength={TRUST_REASON_MAX} required />
      {state.status !== "idle" && state.message && (
        <p role={state.status === "error" ? "alert" : "status"} className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p>
      )}
      <div><Button type="submit" size="sm" variant="outline" loading={pending}>{t("appealSubmit")}</Button></div>
    </form>
  );
}
