"use client";

import { useActionState, useState } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { completeEnrollment, finishEnrollment, type EnrollmentState } from "../actions";

/**
 * Qurulum forması iki mərhələlidir.
 *
 * 1. Tətbiqdəki kod yoxlanılır — uğurlu halda action ehtiyat kodları qaytarır.
 * 2. Kodlar **yalnız bir dəfə** göstərilir; istifadəçi onları saxladığını təsdiqləyəndən
 *    sonra `finishEnrollment` sessiyanı açıb panelə yönləndirir.
 */
export function EnrollForm() {
  const [state, formAction, pending] = useActionState<EnrollmentState, FormData>(
    completeEnrollment,
    {},
  );

  if (state.backupCodes) return <BackupCodes codes={state.backupCodes} />;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Tətbiqdəki kod" htmlFor="enroll-code" required>
        <input
          id="enroll-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          autoFocus
          required
          placeholder="123456"
          className="min-h-12 w-full rounded-xs border border-line-strong bg-paper px-4 py-3 text-center text-lg tracking-[0.4em] text-ink transition-colors duration-200 placeholder:tracking-normal placeholder:text-ink-muted hover:border-ink-muted focus:border-gold"
        />
      </Field>

      {state.error && (
        <p
          role="alert"
          className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger [overflow-wrap:anywhere]"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {!pending && <ShieldCheck className="size-4.5" aria-hidden="true" />}
        Doğrulamanı aktivləşdir
      </Button>
    </form>
  );
}

function BackupCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copyCodes() {
    await navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xs border border-warning/30 bg-warning-bg px-4 py-3">
        <p className="text-sm leading-relaxed text-warning">
          <strong>Ehtiyat kodlarınızı indi saxlayın.</strong> Bu kodlar bir daha
          göstərilməyəcək. Telefonunuz əlinizdə olmayanda hər kod bir dəfə giriş üçün işləyir.
        </p>
      </div>

      <ul className="grid min-w-0 grid-cols-2 gap-2 rounded-xs border border-line bg-paper p-3 sm:p-4">
        {codes.map((code) => (
          <li key={code} className="min-w-0 text-center font-mono text-sm tracking-wide text-ink [overflow-wrap:anywhere]">
            {code}
          </li>
        ))}
      </ul>

      <Button type="button" variant="outline" size="lg" fullWidth onClick={copyCodes}>
        {copied ? (
          <Check className="size-4.5" aria-hidden="true" />
        ) : (
          <Copy className="size-4.5" aria-hidden="true" />
        )}
        {copied ? "Kopyalandı" : "Kodları kopyala"}
      </Button>

      <form action={finishEnrollment}>
        <Button type="submit" size="lg" fullWidth>
          Kodları saxladım, panelə keç
        </Button>
      </form>
    </div>
  );
}
