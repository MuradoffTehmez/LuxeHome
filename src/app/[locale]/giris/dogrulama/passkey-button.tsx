"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Fingerprint } from "lucide-react";
import { browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { beginPasskeyLogin, finishPasskeyLogin } from "../actions";

/**
 * Passkey ilə ikinci mərhələ (#109). Uğurda server action sessiyanı açıb panelə
 * yönləndirir; brauzer WebAuthn dəstəkləmirsə düymə göstərilmir.
 */
export function PasskeyButton() {
  const t = useTranslations("auth.verification");
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);

  if (!supported) return null;

  function run() {
    setError(null);
    startTransition(async () => {
      const started = await beginPasskeyLogin();
      if (started.status === "error") {
        setError(started.error);
        return;
      }
      let response;
      try {
        response = await startAuthentication({ optionsJSON: started.options });
      } catch {
        // İstifadəçi pəncərəni bağlayıb və ya cihaz imtina edib — hesab sayğacına toxunulmur.
        setError(t("passkeyCancelled"));
        return;
      }
      const result = await finishPasskeyLogin(response);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-ink-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        {t("or")}
        <span className="h-px flex-1 bg-line" />
      </div>
      <Button type="button" variant="outline" size="lg" fullWidth loading={pending} onClick={run}>
        {!pending && <Fingerprint className="size-4.5" aria-hidden="true" />}
        {t("usePasskey")}
      </Button>
      {error ? (
        <p role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger [overflow-wrap:anywhere]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
