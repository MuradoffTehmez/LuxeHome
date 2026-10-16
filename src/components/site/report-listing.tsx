"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Flag, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/field";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { ImagePrepareError, prepareImageForUpload } from "@/components/admin/image-prepare";
import { Link, usePathname } from "@/i18n/navigation";
import { IDLE_STATE } from "@/lib/admin/action-state";
import {
  REPORT_EVIDENCE_MAX_BYTES,
  REPORT_EVIDENCE_MAX_FILES,
  REPORT_MESSAGE_MAX,
  REPORT_REASONS,
  type ReportReason,
} from "@/lib/constants";
import { HONEYPOT_FIELD } from "@/lib/spam";
import { reportListing } from "@/app/[locale]/(site)/emlaklar/[slug]/report-actions";
import { cn } from "@/lib/utils";

/** Sübut şəkli brauzerdə bu ölçüyə kiçildilir — 300 KB-a ekran görüntüsü oxunaqlı sığır. */
const EVIDENCE_MAX_DIMENSION = 1600;

type Evidence = { file: File; preview: string };

/**
 * «Elanı şikayət et» (#159, #195): elan səhifəsindəki kiçik keçid + dialoq. Bir və ya bir
 * neçə səbəb seçilir, «Digər» üçün izah məcburidir. Daxil olmuş istifadəçi sübut şəkli də
 * əlavə edə bilir — elan səhifəsi kənar keşdədir, ona görə giriş vəziyyəti dialoq açılanda
 * `no-store` `/api/hesab/elaqe`-dən oxunur. Uğurdan sonra dialoq təşəkkür mesajına keçir.
 */
export function ReportListingButton({ propertyId, className }: { propertyId: string; className?: string }) {
  const t = useTranslations("property.report");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [state, formAction, pending] = useActionState(reportListing, IDLE_STATE);
  const groupId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const done = state.status === "success";

  // Dialoq yenidən açılanda əvvəlki seçim qalmasın.
  useEffect(() => {
    if (!open && !done) {
      setReasons([]);
      setEvidenceError(null);
      setEvidence((current) => {
        current.forEach((item) => URL.revokeObjectURL(item.preview));
        return [];
      });
    }
  }, [open, done]);

  useEffect(() => {
    if (!open || signedIn !== null) return;
    let cancelled = false;
    fetch("/api/hesab/elaqe", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        if (!cancelled) setSignedIn((body as { signedIn?: boolean } | null)?.signedIn === true);
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, signedIn]);

  function toggleReason(value: ReportReason) {
    setReasons((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  async function addEvidence(files: FileList | null) {
    if (!files || files.length === 0) return;
    setEvidenceError(null);
    const room = REPORT_EVIDENCE_MAX_FILES - evidence.length;
    if (files.length > room) setEvidenceError(t("errors.evidenceCount"));
    setPreparing(true);
    try {
      const prepared: Evidence[] = [];
      for (const file of Array.from(files).slice(0, Math.max(0, room))) {
        try {
          const ready = await prepareImageForUpload(file, REPORT_EVIDENCE_MAX_BYTES, { maxDimension: EVIDENCE_MAX_DIMENSION });
          prepared.push({ file: ready, preview: URL.createObjectURL(ready) });
        } catch (error) {
          setEvidenceError(
            error instanceof ImagePrepareError && error.kind === "tooLarge" ? t("errors.evidenceSize") : t("errors.evidenceType"),
          );
        }
      }
      setEvidence((current) => [...current, ...prepared].slice(0, REPORT_EVIDENCE_MAX_FILES));
    } finally {
      setPreparing(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function removeEvidence(index: number) {
    setEvidence((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((_, position) => position !== index);
    });
  }

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
        size="md"
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
            <p className="text-sm text-ink-soft">{state.message}</p>
            {signedIn && <p className="text-xs text-ink-muted">{t("thanksSignedIn")}</p>}
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
              data.delete("evidence");
              if (signedIn) evidence.forEach((item) => data.append("evidence", item.file));
              startTransition(() => formAction(data));
            }}
            className="relative flex flex-col gap-4"
            noValidate
          >
            <input type="hidden" name="propertyId" value={propertyId} />
            <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] size-px overflow-hidden">
              <input name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
            </div>

            <fieldset aria-describedby={`${groupId}-hint`}>
              <legend className="text-sm font-medium text-ink">{t("reasonLabel")}</legend>
              <p id={`${groupId}-hint`} className="mb-2 text-xs text-ink-muted">{t("reasonHint")}</p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {Object.values(REPORT_REASONS).map((value) => {
                  const checked = reasons.includes(value);
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border px-3 py-2 text-sm transition-colors",
                        checked ? "border-gold bg-gold/10 text-ink" : "border-line text-ink-soft hover:border-gold",
                      )}
                    >
                      <input
                        type="checkbox"
                        name="reason"
                        value={value}
                        checked={checked}
                        onChange={() => toggleReason(value)}
                        className="size-4 shrink-0 accent-gold"
                      />
                      {t(`reasons.${value}`)}
                    </label>
                  );
                })}
              </div>
              {state.fieldErrors?.reason && <p className="mt-1.5 text-sm text-danger">{state.fieldErrors.reason}</p>}
            </fieldset>

            <Textarea
              name="message"
              label={reasons.includes(REPORT_REASONS.OTHER) ? t("messageRequired") : t("messageOptional")}
              rows={3}
              maxLength={REPORT_MESSAGE_MAX}
              required={reasons.includes(REPORT_REASONS.OTHER)}
              error={state.fieldErrors?.message}
            />

            <section aria-labelledby={`${groupId}-evidence`} className="flex flex-col gap-2">
              <h3 id={`${groupId}-evidence`} className="text-sm font-medium text-ink">{t("evidenceLabel")}</h3>
              {signedIn ? (
                <>
                  <p className="text-xs text-ink-muted">{t("evidenceHint", { count: REPORT_EVIDENCE_MAX_FILES })}</p>
                  {evidence.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {evidence.map((item, index) => (
                        <li key={item.preview} className="relative size-20 overflow-hidden rounded-sm border border-line">
                          {/* Yerli `blob:` önizləmə — `next/image` optimizasiyasına ehtiyac yoxdur. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.preview} alt={t("evidenceAlt", { index: index + 1 })} className="size-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeEvidence(index)}
                            aria-label={t("evidenceRemove", { index: index + 1 })}
                            className="on-image-chip absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full"
                          >
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {evidence.length < REPORT_EVIDENCE_MAX_FILES && (
                    <div>
                      <input
                        ref={fileInput}
                        id={`${groupId}-file`}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
                        multiple
                        className="sr-only"
                        onChange={(event) => void addEvidence(event.currentTarget.files)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        loading={preparing}
                        onClick={() => fileInput.current?.click()}
                        className="gap-1.5"
                      >
                        <ImagePlus className="size-4" aria-hidden="true" />
                        {t("evidenceAdd")}
                      </Button>
                    </div>
                  )}
                  {(evidenceError || state.fieldErrors?.evidence) && (
                    <p role="alert" className="text-sm text-danger">{evidenceError ?? state.fieldErrors?.evidence}</p>
                  )}
                </>
              ) : signedIn === false ? (
                <p className="text-xs text-ink-muted">
                  {t("evidenceSignIn")}{" "}
                  <Link
                    href={{ pathname: "/daxil-ol", query: { davam: pathname } }}
                    className="font-medium text-gold-deep underline underline-offset-4"
                  >
                    {t("signIn")}
                  </Link>
                </p>
              ) : null}
            </section>

            {state.status === "error" && state.message && !state.fieldErrors && (
              <p role="alert" className="text-sm text-danger">{state.message}</p>
            )}

            <TurnstileWidget action="listing_report" resetSignal={state.message} />

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
                {t("cancel")}
              </Button>
              <Button type="submit" variant="danger" size="sm" loading={pending} disabled={reasons.length === 0 || preparing}>
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
