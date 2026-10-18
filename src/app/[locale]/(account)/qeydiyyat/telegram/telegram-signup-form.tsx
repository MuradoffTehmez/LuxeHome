"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { startTelegramSignup } from "../../hesab/oauth-signup-actions";

/** Telegram ilə qeydiyyat forması — hesab e-poçt təsdiqindən sonra yaranır. */
export function TelegramSignupForm({ defaults, username }: { defaults: { firstName: string; lastName: string }; username: string | null }) {
  const t = useTranslations("auth.telegram.signup");
  const [state, formAction, pending] = useActionState(startTelegramSignup, IDLE_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {username ? <p className="text-sm text-ink-soft">{t("verifiedAs", { username })}</p> : null}
      {state.status === "error" && state.message ? (
        <p role="alert" className="flex items-start gap-2 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input name="firstName" label={t("firstName")} autoComplete="given-name" defaultValue={defaults.firstName} required error={state.fieldErrors?.firstName} />
        <Input name="lastName" label={t("lastName")} autoComplete="family-name" defaultValue={defaults.lastName} required error={state.fieldErrors?.lastName} />
      </div>
      <Input name="email" type="email" label={t("email")} hint={t("emailHint")} autoComplete="email" inputMode="email" required error={state.fieldErrors?.email} />
      <TurnstileWidget action="registration" resetSignal={state.message} />
      <Button type="submit" loading={pending} className="w-full">{t("submit")}</Button>
      <p className="text-xs text-ink-muted">{t("privacy")}</p>
    </form>
  );
}
