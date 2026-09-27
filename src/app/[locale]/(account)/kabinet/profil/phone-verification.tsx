"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { formatPhone } from "@/lib/utils";
import { confirmPhoneVerification, removeVerifiedPhone, requestPhoneVerification, type PhoneVerifyState } from "./phone-actions";

const INITIAL: PhoneVerifyState = { step: "phone" };

/** Nömrə təsdiqi (#109) — təsdiqlənmiş nömrə ilə SMS kodu vasitəsilə daxil olmaq mümkündür. */
export function PhoneVerification({ verifiedPhone, currentPhone }: { verifiedPhone: string | null; currentPhone: string }) {
  const t = useTranslations("account.phoneVerification");
  const router = useRouter();
  const [requestState, requestAction, requesting] = useActionState(requestPhoneVerification, INITIAL);
  const [confirmState, confirmAction, confirming] = useActionState(confirmPhoneVerification, INITIAL);
  const [phone, setPhone] = useState<string | null>(null);
  const [removing, startRemove] = useTransition();
  const [removeMessage, setRemoveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (requestState.step === "code" && requestState.phone) setPhone(requestState.phone);
  }, [requestState]);
  useEffect(() => {
    if (confirmState.success) {
      setPhone(null);
      router.refresh();
    }
  }, [confirmState, router]);

  const error = phone ? confirmState.error ?? requestState.error : requestState.error;

  return (
    <div className="flex max-w-md flex-col gap-4">
      <p className="text-sm text-ink-soft">{t("description")}</p>
      {verifiedPhone ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-success/30 bg-success-bg px-4 py-3">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-success">
            <BadgeCheck className="size-4" aria-hidden="true" />
            {t("verifiedAs", { phone: formatPhone(verifiedPhone) })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={removing}
            onClick={() => startRemove(async () => {
              const result = await removeVerifiedPhone();
              setRemoveMessage(result.error ?? result.success ?? null);
              router.refresh();
            })}
          >
            {t("remove")}
          </Button>
        </div>
      ) : null}
      {error ? <p role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">{error}</p> : null}
      {confirmState.success || removeMessage ? <p role="status" className="text-sm text-success">{confirmState.success ?? removeMessage}</p> : null}
      {!phone ? (
        <form action={requestAction} className="flex flex-col gap-4">
          <Input name="phone" label={t("phone")} type="tel" inputMode="tel" autoComplete="tel" defaultValue={currentPhone} placeholder="+994 50 123 45 67" required />
          <TurnstileWidget action="phone_verify" resetSignal={requestState.error} />
          <Button type="submit" variant="outline" loading={requesting} className="w-full sm:w-fit">{verifiedPhone ? t("changeAction") : t("sendCode")}</Button>
        </form>
      ) : (
        <form action={confirmAction} className="flex flex-col gap-4">
          <p role="status" className="text-sm text-ink-soft">{t("codeSent", { phone: formatPhone(phone) })}</p>
          <input type="hidden" name="phone" value={phone} />
          <Input name="code" label={t("code")} inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" placeholder="123456" required autoFocus />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={confirming}>{t("confirm")}</Button>
            <Button type="button" variant="ghost" onClick={() => setPhone(null)}>{t("back")}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
