"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Loader2 } from "lucide-react";
import { SecretPanel } from "@/components/admin/secret-panel";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { regenerateBackupCodes } from "./actions";
import { useLocalizedActionState } from "@/components/admin/use-server-message";

function Submit() {
  const { pending } = useFormStatus();
  const t = useTranslations("admin");
  return (
    <button type="submit" disabled={pending} className="inline-flex min-h-11 cursor-pointer items-center gap-2 self-start rounded-sm border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold disabled:opacity-50">
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
      {t("pages.account.generateNewCodes")}
    </button>
  );
}

export function BackupCodesForm() {
  const t = useTranslations("admin");
  const [rawState, action] = useActionState(regenerateBackupCodes, IDLE_STATE);
  const state = useLocalizedActionState(rawState);
  return (
    <form action={action} className="mt-4 flex max-w-xl flex-col gap-3">
      {state.message ? <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-sm text-danger" : "text-sm text-success"}>{state.message}</p> : null}
      {state.secret ? <SecretPanel secret={state.secret} title={t("pages.account.2faEhtiyatKodlariBir")} note={t("pages.account.herKodYalnizBir")} /> : null}
      <label className="text-sm text-ink-soft">
        {t("pages.account.tehlukesizlikUcunCariParol")}
        <input name="currentPassword" type="password" autoComplete="current-password" required aria-invalid={Boolean(state.fieldErrors?.currentPassword) || undefined} className="mt-1 block min-h-11 w-full rounded-sm border border-line-strong bg-paper px-3 text-ink outline-none focus:border-gold" />
      </label>
      <Submit />
    </form>
  );
}
