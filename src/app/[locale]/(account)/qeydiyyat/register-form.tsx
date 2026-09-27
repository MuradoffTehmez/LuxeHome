"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { ACCOUNT_TYPES, PUBLIC_ACCOUNT_TYPES, accountTypeKey } from "@/lib/constants";
import { profileRequirements } from "@/lib/accounts/profile-fields";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { accountAuthHref } from "@/lib/auth/public-account-policy";
import { Link } from "@/i18n/navigation";
import { registerAccount } from "../hesab/actions";
import { TurnstileWidget } from "@/components/security/turnstile-widget";

export function RegisterForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(registerAccount, IDLE_STATE);
  const [accountType, setAccountType] = useState<string>(ACCOUNT_TYPES.USER);
  const requirements = profileRequirements(accountType);
  const typeKey = accountTypeKey(accountType) as "user" | "owner" | "agent" | "agency" | "corporate";

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
          label: t(`accountTypes.${accountTypeKey(value) as "user" | "owner" | "agent" | "agency" | "corporate"}`),
        }))}
        hint={t(`accountTypes.${typeKey}Hint`)}
        error={state.fieldErrors?.accountType}
      />

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
          {t("fields.personalSection")}
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="firstName"
            label={t("fields.firstName")}
            required
            autoComplete="given-name"
            maxLength={60}
            error={state.fieldErrors?.firstName}
          />
          <Input
            name="lastName"
            label={t("fields.lastName")}
            required
            autoComplete="family-name"
            maxLength={60}
            error={state.fieldErrors?.lastName}
          />
        </div>

        <Input
          name="email"
          label={t("fields.email")}
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          placeholder="name@example.com"
          error={state.fieldErrors?.email}
        />

        <Input
          name="phone"
          label={t("fields.phone")}
          type="tel"
          autoComplete="tel"
          placeholder="+994 XX XXX XX XX"
          required={requirements.phoneRequired}
          hint={requirements.phoneRequired ? t("fields.phoneRequired") : t("fields.optional")}
          error={state.fieldErrors?.phone}
        />

        <Input
          name="birthDate"
          label={t("fields.birthDate")}
          type="date"
          autoComplete="bday"
          hint={t("fields.birthDateHint")}
          error={state.fieldErrors?.birthDate}
        />
      </fieldset>

      {requirements.company && (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
            {t("fields.companySection")}
          </legend>
          <Input
            name="companyName"
            label={accountType === ACCOUNT_TYPES.AGENCY ? t("fields.agencyName") : t("fields.companyName")}
            required
            autoComplete="organization"
            maxLength={160}
            error={state.fieldErrors?.companyName}
          />
          <Input
            name="companyTaxId"
            label={t("fields.companyTaxId")}
            inputMode="numeric"
            maxLength={14}
            hint={t("fields.companyTaxIdHint")}
            error={state.fieldErrors?.companyTaxId}
          />
          <Input
            name="companyWebsite"
            label={t("fields.companyWebsite")}
            type="url"
            placeholder="https://"
            hint={t("fields.optional")}
            error={state.fieldErrors?.companyWebsite}
          />
        </fieldset>
      )}

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

      <p className="text-xs leading-5 text-ink-muted">{t("fields.dataNotice")}</p>

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
