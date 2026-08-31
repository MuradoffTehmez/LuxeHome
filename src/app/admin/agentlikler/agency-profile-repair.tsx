"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { createAgencyProfile } from "./actions";

export function AgencyProfileRepair({ userId, defaultName }: { userId: string; defaultName: string }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(createAgencyProfile, IDLE_STATE);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!state.message) return;
    toast(state.message, state.status === "success" ? "success" : "error");
    if (state.status === "success") router.refresh();
  }, [router, state, toast]);

  return (
    <form action={action} className="flex min-w-60 flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="userId" value={userId} />
      <label className="min-w-0 flex-1 text-xs text-ink-muted">
        {t("pages.agents.agentliyinIctimaiAdi")}
        <input
          name="name"
          defaultValue={defaultName}
          required
          minLength={2}
          maxLength={160}
          className="mt-1 min-h-11 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink outline-none transition-colors focus:border-gold"
        />
      </label>
      <Button type="submit" size="sm" loading={pending} className="min-h-11 shrink-0">
        {t("pages.agents.profilYarat")}
      </Button>
      {state.fieldErrors?.name ? <p className="text-xs text-danger sm:col-span-2">{state.fieldErrors.name}</p> : null}
    </form>
  );
}
