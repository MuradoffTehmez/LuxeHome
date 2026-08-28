"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, KeyRound, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { requestEmailVerification, requestPasswordReset, resetPassword } from "./actions";
import { TurnstileWidget } from "@/components/security/turnstile-widget";

function Result({ state }: { state: typeof IDLE_STATE & { message?: string } }) {
  if (state.status === "idle" || !state.message) return null;
  const Icon = state.status === "success" ? CheckCircle2 : AlertCircle;
  return (
    <p role={state.status === "success" ? "status" : "alert"} className={`flex items-start gap-2 rounded-xs border px-4 py-3 text-sm ${state.status === "success" ? "border-success/30 bg-success-bg text-success" : "border-danger/30 bg-danger-bg text-danger"}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{state.message}
    </p>
  );
}

export function VerificationRequestForm() {
  const t = useTranslations("auth.accountSecurity");
  const [state, action, pending] = useActionState(requestEmailVerification, IDLE_STATE);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Result state={state} />
      <Input name="email" type="email" inputMode="email" autoComplete="email" required label={t("email")} error={state.fieldErrors?.email} />
      <TurnstileWidget action="verification_resend" resetSignal={state.message} />
      <Button type="submit" loading={pending} fullWidth><MailCheck className="size-4" aria-hidden="true" />{t("resendVerification")}</Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth.accountSecurity");
  const [state, action, pending] = useActionState(requestPasswordReset, IDLE_STATE);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Result state={state} />
      <Input name="email" type="email" inputMode="email" autoComplete="email" required label={t("email")} error={state.fieldErrors?.email} />
      <TurnstileWidget action="password_reset" resetSignal={state.message} />
      <Button type="submit" loading={pending} fullWidth><KeyRound className="size-4" aria-hidden="true" />{t("sendReset")}</Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth.accountSecurity");
  const [state, action, pending] = useActionState(resetPassword, IDLE_STATE);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <Result state={state} />
      <Input name="password" type="password" autoComplete="new-password" required minLength={10} label={t("newPassword")} error={state.fieldErrors?.password} />
      <Input name="repeat" type="password" autoComplete="new-password" required minLength={10} label={t("repeatPassword")} error={state.fieldErrors?.repeat} />
      <Button type="submit" loading={pending} fullWidth><KeyRound className="size-4" aria-hidden="true" />{t("resetPassword")}</Button>
    </form>
  );
}
