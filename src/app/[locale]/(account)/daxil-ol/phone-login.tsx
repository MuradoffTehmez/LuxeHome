"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { requestLoginCode, verifyLoginCode, type PhoneLoginState } from "./phone-actions";

const INITIAL: PhoneLoginState = { step: "phone" };

/** Telefonla giriş (#109): nömrə → SMS kodu → sessiya. SMS qurulmayıbsa render olunmur. */
export function PhoneLogin({ next }: { next?: string }) {
  const t = useTranslations("auth.phoneLogin");
  const [open, setOpen] = useState(false);
  const [requestState, requestAction, requesting] = useActionState(requestLoginCode, INITIAL);
  const [verifyState, verifyAction, verifying] = useActionState(verifyLoginCode, INITIAL);
  const [phone, setPhone] = useState<string | null>(null);

  // Kod göndərildikdən sonra ikinci addıma keçilir; kod mərhələsi uğursuz başa çatıb
  // (sessiya açılmadı) birinci addıma qaytarıbsa nömrə sıfırlanır.
  useEffect(() => {
    if (requestState.step === "code" && requestState.phone) setPhone(requestState.phone);
  }, [requestState]);
  useEffect(() => {
    if (verifyState.step === "phone") setPhone(null);
  }, [verifyState]);

  const error = phone ? verifyState.error ?? requestState.error : requestState.error;

  if (!open) {
    return (
      <Button type="button" variant="outline" fullWidth onClick={() => setOpen(true)}>
        <Smartphone className="size-4" aria-hidden="true" />
        {t("open")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-sm border border-line p-4">
      {error ? <p role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">{error}</p> : null}
      {!phone ? (
        <form action={requestAction} className="flex flex-col gap-4">
          <Input name="phone" label={t("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="+994 50 123 45 67" required />
          <TurnstileWidget action="phone_login" resetSignal={requestState.error} />
          <Button type="submit" loading={requesting} fullWidth>{t("sendCode")}</Button>
          <p className="text-xs text-ink-muted">{t("hint")}</p>
        </form>
      ) : (
        <form action={verifyAction} className="flex flex-col gap-4">
          {requestState.notice ? <p role="status" className="text-sm text-ink-soft">{requestState.notice}</p> : null}
          <input type="hidden" name="phone" value={phone} />
          {next ? <input type="hidden" name="davam" value={next} /> : null}
          <Input name="code" label={t("code")} inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" placeholder="123456" required autoFocus />
          <Button type="submit" loading={verifying} fullWidth>{t("verify")}</Button>
          <button type="button" onClick={() => setPhone(null)} className="inline-flex min-h-11 items-center self-center text-sm text-gold-deep underline-offset-4 hover:underline">
            {t("changeNumber")}
          </button>
        </form>
      )}
    </div>
  );
}
