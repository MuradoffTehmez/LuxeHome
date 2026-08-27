"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { submitContactForm, type ContactFormState } from "./actions";
import { trackEvent } from "@/lib/client-analytics";
import { HONEYPOT_FIELD } from "@/lib/spam";

const initialState: ContactFormState = { success: false };

export function ContactForm() {
  const t = useTranslations("contact");
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState,
  );
  useEffect(() => {
    if (state.success) trackEvent("contact_submit", { status: "success" });
  }, [state.success]);

  if (state.success) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h3 className="font-display text-xl text-ink">
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="name"
          label={t("fullName")}
          placeholder={t("namePlaceholder")}
          required
          error={state.fieldErrors?.name}
        />
        <Input
          name="phone"
          label={t("phone")}
          type="tel"
          placeholder="+994 50 XXX XX XX"
          required
          error={state.fieldErrors?.phone}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="email"
          label={t("email")}
          type="email"
          placeholder="ad@domen.az"
          error={state.fieldErrors?.email}
        />
        <Input
          name="subject"
          label={t("subject")}
          placeholder={t("subjectPlaceholder")}
          error={state.fieldErrors?.subject}
        />
      </div>

      <Textarea
        name="message"
        label={t("message")}
        placeholder={t("messagePlaceholder")}
        required
        rows={5}
        error={state.fieldErrors?.message}
      />

      <Button type="submit" variant="primary" size="lg" loading={isPending} className="w-full sm:w-auto sm:self-start">
        {t("send")}
      </Button>
    </form>
  );
}
