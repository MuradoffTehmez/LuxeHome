"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES, PUBLIC_ACCOUNT_TYPES } from "@/lib/constants";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { accountAuthHref } from "@/lib/auth/public-account-policy";
import { registerAccount } from "../hesab/actions";

const ACCOUNT_HINTS: Record<string, string> = {
  USER: "Favoritləri saxlayın və müraciətlərinizi izləyin.",
  OWNER: "Öz mülkünüzü elan kimi yerləşdirin. Elanlar admin təsdiqindən keçir.",
  AGENCY: "Şirkət profili və elan idarəetməsi. Təsdiqdən sonra elanlar dərhal dərc olunur.",
};

export function RegisterForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(registerAccount, IDLE_STATE);
  const [accountType, setAccountType] = useState<string>(ACCOUNT_TYPES.USER);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="davam" value={next} />}

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="flex min-w-0 items-start gap-2.5 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger [overflow-wrap:anywhere]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      )}

      <Select
        name="accountType"
        label="Hesab növü"
        required
        value={accountType}
        onChange={(event) => setAccountType(event.target.value)}
        options={PUBLIC_ACCOUNT_TYPES.map((value) => ({
          value,
          label: ACCOUNT_TYPE_LABELS[value],
        }))}
        hint={ACCOUNT_HINTS[accountType]}
        error={state.fieldErrors?.accountType}
      />

      {accountType === ACCOUNT_TYPES.AGENCY && (
        <Input
          name="agencyName"
          label="Agentliyin adı"
          required
          maxLength={160}
          error={state.fieldErrors?.agencyName}
        />
      )}

      <Input
        name="name"
        label="Ad Soyad"
        required
        autoComplete="name"
        maxLength={120}
        error={state.fieldErrors?.name}
      />

      <Input
        name="email"
        label="E-poçt"
        type="email"
        inputMode="email"
        required
        autoComplete="email"
        placeholder="ad@nümunə.az"
        error={state.fieldErrors?.email}
      />

      <Input
        name="phone"
        label="Telefon"
        type="tel"
        autoComplete="tel"
        placeholder="+994 XX XXX XX XX"
        required={accountType !== ACCOUNT_TYPES.USER}
        hint={
          accountType === ACCOUNT_TYPES.USER
            ? "İstəyə bağlıdır."
            : "Elan yerləşdirmək üçün tələb olunur."
        }
        error={state.fieldErrors?.phone}
      />

      <Input
        name="password"
        label="Parol"
        type="password"
        required
        autoComplete="new-password"
        placeholder="••••••••••"
        hint="Ən azı 10 simvol."
        error={state.fieldErrors?.password}
      />

      <Button type="submit" loading={pending} fullWidth>
        <UserPlus className="size-4" aria-hidden="true" />
        Qeydiyyatdan keç
      </Button>

      <p className="flex flex-wrap items-center justify-center gap-x-1 text-center text-sm text-ink-soft">
        <span>Hesabınız var?</span>
        <Link
          href={accountAuthHref("/daxil-ol", next)}
          className="inline-flex min-h-11 items-center rounded-xs text-gold-deep underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Daxil olun
        </Link>
      </p>
    </form>
  );
}
