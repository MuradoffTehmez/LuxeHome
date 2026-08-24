"use client";

import { useActionState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { submitContactForm, type ContactFormState } from "./actions";
import { trackEvent } from "@/lib/client-analytics";

const initialState: ContactFormState = { success: false };

export function ContactForm() {
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
          Müraciətiniz göndərildi!
        </h3>
        <p className="max-w-sm text-sm text-ink-soft">
          Komandamız ən qısa zamanda sizinlə əlaqə saxlayacaq.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
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
          label="Ad, soyad"
          placeholder="Adınızı daxil edin"
          required
          error={state.fieldErrors?.name}
        />
        <Input
          name="phone"
          label="Telefon"
          type="tel"
          placeholder="+994 50 XXX XX XX"
          required
          error={state.fieldErrors?.phone}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="email"
          label="E-poçt"
          type="email"
          placeholder="ad@domen.az"
          error={state.fieldErrors?.email}
        />
        <Input
          name="subject"
          label="Mövzu"
          placeholder="Müraciətin mövzusu"
          error={state.fieldErrors?.subject}
        />
      </div>

      <Textarea
        name="message"
        label="Mesaj"
        placeholder="Müraciətinizi yazın..."
        required
        rows={5}
        error={state.fieldErrors?.message}
      />

      <Button type="submit" variant="primary" size="lg" loading={isPending} className="w-full sm:w-auto sm:self-start">
        Göndər
      </Button>
    </form>
  );
}
