"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { ACCOUNT_TYPES, PUBLIC_ACCOUNT_TYPES } from "@/lib/constants";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { accountAuthHref } from "@/lib/auth/public-account-policy";
import { Link } from "@/i18n/navigation";
import { registerAccount } from "../hesab/actions";
import { TurnstileWidget } from "@/components/security/turnstile-widget";

export function RegisterForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
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
        label={t("fields.accountType")}
        required
        value={accountType}
        onChange={(event) => setAccountType(event.target.value)}
        options={PUBLIC_ACCOUNT_TYPES.map((value) => ({
          value,
          label: t(`accountTypes.${value === ACCOUNT_TYPES.USER ? "user" : value === ACCOUNT_TYPES.OWNER ? "owner" : "agency"}`),
        }))}
        hint={t(`accountTypes.${accountType === ACCOUNT_TYPES.USER ? "userHint" : accountType === ACCOUNT_TYPES.OWNER ? "ownerHint" : "agencyHint"}`)}
        error={state.fieldErrors?.accountType}
      />

      {accountType === ACCOUNT_TYPES.AGENCY && (
        <Input
          name="agencyName"
          label={t("fields.agencyName")}
          required
          maxLength={160}
          error={state.fieldErrors?.agencyName}
        />
      )}

      <Input
        name="name"
        label={t("fields.name")}
        required
        autoComplete="name"
        maxLength={120}
        error={state.fieldErrors?.name}
      />

      <Input
        name="email"
        label={t("fields.email")}
        type="email"
        inputMode="email"
        required
        autoComplete="email"
        placeholder="ad@nümunə.az"
        error={state.fieldErrors?.email}
      />

      <Input
        name="phone"
        label={t("fields.phone")}
        type="tel"
        autoComplete="tel"
        placeholder="+994 XX XXX XX XX"
        required={accountType !== ACCOUNT_TYPES.USER}
        hint={
          accountType === ACCOUNT_TYPES.USER
            ? t("fields.optional")
            : t("fields.phoneRequired")
        }
        error={state.fieldErrors?.phone}
      />

      <Input
        name="password"
        label={t("fields.password")}
        type="password"
        required
        autoComplete="new-password"
        placeholder="••••••••••"
        hint={t("fields.passwordHint")}
        error={state.fieldErrors?.password}
      />

      <TurnstileWidget action="registration" resetSignal={state.message} />

      <Button type="submit" loading={pending} fullWidth>
        <UserPlus className="size-4" aria-hidden="true" />
        {t("registration.submit")}
      </Button>

      <p className="flex flex-wrap items-center justify-center gap-x-1 text-center text-sm text-ink-soft">
        <span>{t("registration.hasAccount")}</span>
        <Link
          href={accountAuthHref("/daxil-ol", next)}
          className="inline-flex min-h-11 items-center rounded-xs text-gold-deep underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {t("registration.loginLink")}
        </Link>
      </p>
    </form>
  );
}
