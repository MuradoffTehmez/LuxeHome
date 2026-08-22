"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";
import { changePassword, updateProfile } from "./actions";

/** Uğur və xəta mesajı — toast yerinə qalıcı sətir, çünki nəticə oxunmalıdır. */
function StateMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;

  const error = state.status === "error";
  const Icon = error ? AlertCircle : CheckCircle2;

  return (
    <p
      role={error ? "alert" : "status"}
      className={
        error
          ? "flex items-start gap-2.5 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger"
          : "flex items-start gap-2.5 rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {state.message}
    </p>
  );
}

export function ProfileForm({
  name,
  phone,
  isAgency,
  agency,
}: {
  name: string;
  phone: string;
  isAgency: boolean;
  agency: { name: string; description: string; address: string; website: string } | null;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, IDLE_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <StateMessage state={state} />

      <Input name="name" label="Ad Soyad" required defaultValue={name} maxLength={120} error={state.fieldErrors?.name} />
      <Input
        name="phone"
        label="Telefon"
        type="tel"
        defaultValue={phone}
        placeholder="+994 XX XXX XX XX"
        error={state.fieldErrors?.phone}
      />

      {isAgency && (
        <>
          <Input
            name="agencyName"
            label="Agentliyin adı"
            required
            defaultValue={agency?.name ?? ""}
            maxLength={160}
            error={state.fieldErrors?.agencyName}
          />
          <Textarea
            name="agencyDescription"
            label="Agentlik haqqında"
            rows={4}
            maxLength={2000}
            defaultValue={agency?.description ?? ""}
            error={state.fieldErrors?.agencyDescription}
          />
          <Input
            name="agencyAddress"
            label="Ünvan"
            defaultValue={agency?.address ?? ""}
            maxLength={240}
            error={state.fieldErrors?.agencyAddress}
          />
          <Input
            name="agencyWebsite"
            label="Veb sayt"
            type="url"
            placeholder="https://"
            defaultValue={agency?.website ?? ""}
            error={state.fieldErrors?.agencyWebsite}
          />
        </>
      )}

      <Button type="submit" loading={pending} className="w-fit">
        Yadda saxla
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, IDLE_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <StateMessage state={state} />

      <Input
        name="current"
        label="Cari parol"
        type="password"
        required
        autoComplete="current-password"
        error={state.fieldErrors?.current}
      />
      <Input
        name="next"
        label="Yeni parol"
        type="password"
        required
        autoComplete="new-password"
        hint="Ən azı 10 simvol."
        error={state.fieldErrors?.next}
      />
      <Input
        name="repeat"
        label="Yeni parol (təkrar)"
        type="password"
        required
        autoComplete="new-password"
        error={state.fieldErrors?.repeat}
      />

      <Button type="submit" variant="outline" loading={pending} className="w-fit">
        Parolu dəyiş
      </Button>
    </form>
  );
}
