"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { joinAgencyWithLink } from "./actions";

/** «Komandaya qoşul» — uğurda action kabinet profilinə yönləndirir. */
export function JoinAgencyForm({ token, agencyName }: { token: string; agencyName: string }) {
  const t = useTranslations("account.join");
  const [state, formAction, pending] = useActionState(joinAgencyWithLink, IDLE_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      {state.status === "error" && state.message && (
        <p role="alert" className="flex items-start gap-2.5 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      )}
      <Button type="submit" loading={pending} fullWidth>
        <UserPlus className="size-4" aria-hidden="true" />
        {t("submit", { name: agencyName })}
      </Button>
    </form>
  );
}
