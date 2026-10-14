"use client";

import { startTransition, useActionState, useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/field";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { REPORT_MESSAGE_MAX, REPORT_REASONS } from "@/lib/constants";
import { HONEYPOT_FIELD } from "@/lib/spam";
import { reportListing } from "@/app/[locale]/(site)/emlaklar/[slug]/report-actions";
import { cn } from "@/lib/utils";

/**
 * «Elanı şikayət et» (#159): elan səhifəsindəki kiçik keçid + dialoq. Səbəb siyahıdan
 * seçilir, «Digər» üçün izah məcburidir. Uğurdan sonra dialoq təşəkkür mesajına keçir.
 */
export function ReportListingButton({ propertyId, className }: { propertyId: string; className?: string }) {
  const t = useTranslations("property.report");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [state, formAction, pending] = useActionState(reportListing, IDLE_STATE);
  const groupId = useId();
  const done = state.status === "success";

  // Dialoq yenidən açılanda əvvəlki seçim qalmasın.
  useEffect(() => {
    if (!open && !done) setReason("");
  }, [open, done]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted underline-offset-4 after:absolute after:inset-x-0 after:-inset-y-3 hover:text-danger hover:underline",
          className,
        )}
      >
        <Flag className="size-3.5" aria-hidden="true" />
        {t("button")}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={done ? t("thanksTitle") : t("title")}
        description={done ? undefined : t("description")}
        size="sm"
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
            <p className="text-sm text-ink-soft">{state.message}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              {t("close")}
            </Button>
          </div>
        ) : (
          <form
            // React 19 `action` propu xətada da formanı sıfırlayır — izah mətni itməsin.
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              startTransition(() => formAction(data));
            }}
            className="relative flex flex-col gap-4"
            noValidate
          >
            <input type="hidden" name="propertyId" value={propertyId} />
            <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] size-px overflow-hidden">
              <input name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
            </div>

            <fieldset>
              <legend id={groupId} className="mb-2 text-sm font-medium text-ink">{t("reasonLabel")}</legend>
              <div role="radiogroup" aria-labelledby={groupId} className="flex flex-col gap-1.5">
                {Object.values(REPORT_REASONS).map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border px-3 text-sm transition-colors",
                      reason === value ? "border-gold bg-gold/10 text-ink" : "border-line text-ink-soft hover:border-gold",
                    )}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      checked={reason === value}
                      onChange={() => setReason(value)}
                      className="size-4 accent-gold"
                    />
                    {t(`reasons.${value}`)}
                  </label>
                ))}
              </div>
              {state.fieldErrors?.reason && <p className="mt-1.5 text-sm text-danger">{state.fieldErrors.reason}</p>}
            </fieldset>

            <Textarea
              name="message"
              label={reason === REPORT_REASONS.OTHER ? t("messageRequired") : t("messageOptional")}
              rows={3}
              maxLength={REPORT_MESSAGE_MAX}
              required={reason === REPORT_REASONS.OTHER}
              error={state.fieldErrors?.message}
            />

            {state.status === "error" && state.message && !state.fieldErrors && (
              <p role="alert" className="text-sm text-danger">{state.message}</p>
            )}

            <TurnstileWidget action="listing_report" resetSignal={state.message} />

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
                {t("cancel")}
              </Button>
              <Button type="submit" variant="danger" size="sm" loading={pending} disabled={!reason}>
                {t("submit")}
              </Button>
            </div>
            <p className="text-xs text-ink-muted">{t("privacy")}</p>
          </form>
        )}
      </Modal>
    </>
  );
}
