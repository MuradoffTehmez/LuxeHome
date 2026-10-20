"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { confirmTelegramSignup } from "../oauth-signup-actions";

export function TelegramConfirmForm({ token, email }: { token: string; email: string }) {
  const t = useTranslations("auth.telegram.confirm");
  const [state, formAction, pending] = useActionState(confirmTelegramSignup, IDLE_STATE);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-ink-soft">{t("emailLine", { email })}</p>
      {state.status === "error" && state.message ? (
        <p role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">{state.message}</p>
      ) : null}
      <Button type="submit" loading={pending} className="w-full">{t("submit")}</Button>
    </form>
  );
}
