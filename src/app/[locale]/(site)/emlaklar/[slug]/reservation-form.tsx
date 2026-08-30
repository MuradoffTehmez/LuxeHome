"use client";

import { useActionState } from "react";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { Button } from "@/components/ui/button";
import { createReservation } from "./reservation-actions";

type Labels = {
  title: string; description: string; firstName: string; lastName: string; phone: string;
  email: string; date: string; message: string; terms: string; submit: string;
};

export function ReservationForm({
  propertyId,
  initial,
  labels,
}: {
  propertyId: string;
  initial?: { name: string; phone?: string | null; email: string } | null;
  labels: Labels;
}) {
  const [state, action, pending] = useActionState(createReservation, IDLE_STATE);
  const [firstName = "", ...lastNameParts] = initial?.name.split(/\s+/) ?? [];

  return (
    <form action={action} className="rounded-md border border-line bg-paper p-5 sm:p-6">
      <input type="hidden" name="propertyId" value={propertyId} />
      <h2 className="font-display text-xl text-ink">{labels.title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{labels.description}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm text-ink">{labels.firstName}<input name="firstName" required minLength={2} maxLength={80} defaultValue={firstName} className="min-h-11 rounded-xs border border-line-strong bg-paper px-3" /></label>
        <label className="flex flex-col gap-1.5 text-sm text-ink">{labels.lastName}<input name="lastName" required minLength={2} maxLength={80} defaultValue={lastNameParts.join(" ")} className="min-h-11 rounded-xs border border-line-strong bg-paper px-3" /></label>
        <label className="flex flex-col gap-1.5 text-sm text-ink">{labels.phone}<input name="phone" type="tel" required defaultValue={initial?.phone ?? ""} className="min-h-11 rounded-xs border border-line-strong bg-paper px-3" /></label>
        <label className="flex flex-col gap-1.5 text-sm text-ink">{labels.email}<input name="email" type="email" required defaultValue={initial?.email ?? ""} className="min-h-11 rounded-xs border border-line-strong bg-paper px-3" /></label>
        <label className="flex flex-col gap-1.5 text-sm text-ink sm:col-span-2">{labels.date}<input name="requestedFor" type="datetime-local" required className="min-h-11 rounded-xs border border-line-strong bg-paper px-3" /></label>
        <label className="flex flex-col gap-1.5 text-sm text-ink sm:col-span-2">{labels.message}<textarea name="message" rows={3} maxLength={1000} className="rounded-xs border border-line-strong bg-paper p-3" /></label>
      </div>
      <label className="mt-4 flex min-h-11 items-center gap-2 text-sm text-ink"><input type="checkbox" name="terms" required className="size-5 accent-gold" />{labels.terms}</label>
      {state.message && <p role={state.status === "error" ? "alert" : "status"} className={`mt-3 text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p>}
      <Button type="submit" loading={pending} className="mt-4">{labels.submit}</Button>
    </form>
  );
}
