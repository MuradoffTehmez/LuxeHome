"use client";

import { useActionState, useEffect, useRef } from "react";
import { useSessionState } from "@/components/site/use-session-state";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { Button } from "@/components/ui/button";
import { createReservation } from "./reservation-actions";

type Labels = {
  title: string; description: string; firstName: string; lastName: string; phone: string;
  email: string; date: string; message: string; terms: string; submit: string;
};

type AccountContact = { signedIn: true; name: string; email: string } | { signedIn: false };

/** Boş sahəni doldurur; ziyarətçi artıq yazıbsa toxunmur. */
function fillIfEmpty(input: HTMLInputElement | null, value: string) {
  if (input && !input.value && value) input.value = value;
}

/**
 * Daxil olmuş ictimai istifadəçinin ad/e-poçtu brauzerdə gətirilir (#177): səhifə sessiya
 * oxumur ki, kənar keşdən verilə bilsin. Sahələr idarə olunmur, ona görə dəyər yalnız
 * boş sahəyə yazılır — ziyarətçinin yazdığı mətn üzərinə yazılmır.
 */
function useAccountPrefill(fields: {
  firstName: React.RefObject<HTMLInputElement | null>;
  lastName: React.RefObject<HTMLInputElement | null>;
  email: React.RefObject<HTMLInputElement | null>;
}) {
  // Ad burada göstərilmir — yalnız giriş vəziyyəti lazımdır.
  const session = useSessionState("");
  const signedInPublic = session.status === "signed-in" && !session.isStaff;

  useEffect(() => {
    if (!signedInPublic) return;
    let cancelled = false;
    fetch("/api/hesab/elaqe", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<AccountContact>) : null))
      .then((contact) => {
        if (cancelled || !contact?.signedIn) return;
        const [firstName = "", ...lastNameParts] = contact.name.trim().split(/\s+/);
        fillIfEmpty(fields.firstName.current, firstName);
        fillIfEmpty(fields.lastName.current, lastNameParts.join(" "));
        fillIfEmpty(fields.email.current, contact.email);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [signedInPublic, fields.firstName, fields.lastName, fields.email]);
}

export function ReservationForm({
  propertyId,
  labels,
}: {
  propertyId: string;
  labels: Labels;
}) {
  const [state, action, pending] = useActionState(createReservation, IDLE_STATE);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  useAccountPrefill({ firstName: firstNameRef, lastName: lastNameRef, email: emailRef });

  return (
    <form action={action} className="rounded-xl border border-line bg-paper p-5 sm:p-6 shadow-xs">
      <input type="hidden" name="propertyId" value={propertyId} />
      <h2 className="font-display text-xl text-ink">{labels.title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{labels.description}</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm text-ink">{labels.firstName}<input ref={firstNameRef} name="firstName" required minLength={2} maxLength={80} className="min-h-11 rounded-sm border border-line-strong bg-paper px-3" /></label>
        <label className="flex flex-col gap-1.5 text-sm text-ink">{labels.lastName}<input ref={lastNameRef} name="lastName" required minLength={2} maxLength={80} className="min-h-11 rounded-sm border border-line-strong bg-paper px-3" /></label>
        <label className="flex flex-col gap-1.5 text-sm text-ink">{labels.phone}<input name="phone" type="tel" required className="min-h-11 rounded-sm border border-line-strong bg-paper px-3" /></label>
        <label className="flex flex-col gap-1.5 text-sm text-ink">{labels.email}<input ref={emailRef} name="email" type="email" required className="min-h-11 rounded-sm border border-line-strong bg-paper px-3" /></label>
        <label className="flex flex-col gap-1.5 text-sm text-ink sm:col-span-2">{labels.date}<input name="requestedFor" type="datetime-local" required className="min-h-11 rounded-sm border border-line-strong bg-paper px-3" /></label>
        <label className="flex flex-col gap-1.5 text-sm text-ink sm:col-span-2">{labels.message}<textarea name="message" rows={3} maxLength={1000} className="rounded-sm border border-line-strong bg-paper p-3" /></label>
      </div>
      <label className="mt-4 flex min-h-11 items-center gap-2 text-sm text-ink"><input type="checkbox" name="terms" required className="size-5 accent-gold" />{labels.terms}</label>
      {state.message && <p role={state.status === "error" ? "alert" : "status"} className={`mt-3 text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p>}
      <Button type="submit" loading={pending} className="mt-4">{labels.submit}</Button>
    </form>
  );
}
