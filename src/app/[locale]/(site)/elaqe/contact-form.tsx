"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { submitContactForm, type ContactFormState } from "./actions";
import { trackEvent } from "@/lib/client-analytics";
import { HONEYPOT_FIELD } from "@/lib/spam";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { AttributionFields } from "@/components/analytics/attribution-fields";

const initialState: ContactFormState = { success: false };

type ContactFormProps = {
  /** `OWNER` — satıcı səhifəsindən gələn müraciət (#105). */
  source?: "CONTACT" | "OWNER";
  defaultSubject?: string;
  defaultMessage?: string;
  /** Analitika hadisəsindəki yerləşmə adı. */
  placement?: string;
  /** Elan səhifəsindəki forma — müraciət elana bağlanır və elan sahibinə gedir. */
  propertyId?: string;
  /** Agentlik profilindəki forma (#161): müraciət ofisə deyil, agentliyə gedir. */
  agencySlug?: string;
};

export function ContactForm({ source = "CONTACT", defaultSubject, defaultMessage, placement = "contact_form", propertyId, agencySlug }: ContactFormProps = {}) {
  const t = useTranslations("contact");
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState,
  );
  useEffect(() => {
    if (state.success) {
      trackEvent("contact_submit", { status: "success" });
      trackEvent("form_submit", { status: "success", placement });
    }
  }, [state.success, placement]);

  if (state.success) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h3 className="text-xl text-ink">
          {t("successTitle")}
        </h3>
        <p className="max-w-sm text-sm text-ink-soft">
          {t("successDescription")}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <AttributionFields />
      <input type="hidden" name="source" value={source} />
      {propertyId && <input type="hidden" name="propertyId" value={propertyId} />}
      {agencySlug && <input type="hidden" name="agency" value={agencySlug} />}
      {/*
        Honeypot — ziyarətçi görmür, bot doldurur. Ekrandan kənara çıxarılır,
        `display: none` işlədilmir: botların bir hissəsi məhz həmin xassəyə görə
        sahəni atır. `aria-hidden` + `tabindex="-1"` klaviatura və ekran
        oxuyucusunu ondan uzaq saxlayır.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>{t("website")}</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-xs border border-danger/25 bg-danger-bg/50 px-4 py-3 text-sm text-danger"
        >
          {state.error}
        </div>
      )}

      {propertyId && (
        // Müraciətin məqsədi (#222, PRD 8.2): baxış görüşü və əlavə məlumat ayrıca mənbədir.
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-ink">{t("intent.legend")}</legend>
          <div className="flex flex-wrap gap-2">
            {(["PROPERTY", "VIEWING", "INFO"] as const).map((value) => (
              <label
                key={value}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line px-4 text-sm text-ink-soft transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:checked]:text-ink hover:border-gold"
              >
                <input type="radio" name="intent" value={value} defaultChecked={value === "PROPERTY"} className="size-4 accent-gold" />
                {t(`intent.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          name="name"
          label={t("fullName")}
          placeholder={t("namePlaceholder")}
          maxLength={120}
          required
          error={state.fieldErrors?.name}
        />
        <Input
          name="phone"
          label={t("phone")}
          type="tel"
          placeholder="+994 50 XXX XX XX"
          maxLength={40}
          required
          error={state.fieldErrors?.phone}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          name="email"
          label={t("email")}
          type="email"
          placeholder="name@example.com"
          maxLength={200}
          error={state.fieldErrors?.email}
        />
        <Input
          name="subject"
          label={t("subject")}
          placeholder={t("subjectPlaceholder")}
          defaultValue={defaultSubject}
          maxLength={200}
          error={state.fieldErrors?.subject}
        />
      </div>

      <Textarea
        name="message"
        label={t("message")}
        placeholder={t("messagePlaceholder")}
        defaultValue={defaultMessage}
        maxLength={4000}
        required
        rows={5}
        error={state.fieldErrors?.message}
      />

      <TurnstileWidget action="contact" resetSignal={state.error ?? state.fieldErrors} />

      <Button type="submit" variant="primary" size="lg" loading={isPending} className="w-full sm:w-auto sm:self-start">
        {t("send")}
      </Button>
    </form>
  );
}
