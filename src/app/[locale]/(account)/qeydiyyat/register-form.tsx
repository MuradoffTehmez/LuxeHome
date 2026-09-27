"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, BadgeCheck, Briefcase, Building2, ChevronDown, Home, UserPlus, UserRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/field";
import { ACCOUNT_TYPES, PUBLIC_ACCOUNT_TYPES, accountTypeKey } from "@/lib/constants";
import { profileRequirements } from "@/lib/accounts/profile-fields";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { accountAuthHref } from "@/lib/auth/public-account-policy";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { registerAccount } from "../hesab/actions";
import { TurnstileWidget } from "@/components/security/turnstile-widget";

type TypeKey = "user" | "owner" | "agent" | "agency" | "corporate";

const TYPE_ICONS: Record<TypeKey, LucideIcon> = {
  user: UserRound,
  owner: Home,
  agent: BadgeCheck,
  agency: Building2,
  corporate: Briefcase,
};

/**
 * Qeydiyyat forması.
 *
 * Əvvəl hər sahə alt-alta idi (açılan siyahı + 7 sahə) və forma ekranı bir neçə dəfə
 * keçirdi. İndi hesab növü ikonlu kartlarla bir baxışda seçilir, istəyə bağlı sahələr
 * (doğum tarixi, tələb olunmayanda telefon) yığılan bölmədədir. Bütün sahələr yenə də
 * eyni `name`-lərlə göndərilir — server action (`registerAccount`) dəyişmir.
 */
export function RegisterForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(registerAccount, IDLE_STATE);
  const [accountType, setAccountType] = useState<string>(ACCOUNT_TYPES.USER);
  const requirements = profileRequirements(accountType);
  const typeKey = accountTypeKey(accountType) as TypeKey;
  const optionalError = Boolean(state.fieldErrors?.birthDate || (!requirements.phoneRequired && state.fieldErrors?.phone));

  const phoneField = (
    <Input
      name="phone"
      label={t("fields.phone")}
      type="tel"
      autoComplete="tel"
      placeholder="+994 XX XXX XX XX"
      required={requirements.phoneRequired}
      hint={requirements.phoneRequired ? t("fields.phoneRequired") : undefined}
      error={state.fieldErrors?.phone}
    />
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
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

      <fieldset>
        <legend className="mb-2.5 text-sm font-medium text-ink">
          {t("fields.accountType")}
          <span className="ml-1 text-danger" aria-hidden="true">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PUBLIC_ACCOUNT_TYPES.map((value) => {
            const key = accountTypeKey(value) as TypeKey;
            const Icon = TYPE_ICONS[key];
            const checked = accountType === value;
            return (
              <label
                key={value}
                className={cn(
                  "group relative flex min-h-12 cursor-pointer items-center gap-2.5 rounded-sm border px-3 py-2.5 text-sm transition-[border-color,background-color,box-shadow] duration-200",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold",
                  checked
                    ? "border-gold bg-gold/10 text-ink shadow-[0_0_0_3px_rgb(170_135_84/0.14)]"
                    : "border-line-strong bg-paper text-ink-soft hover:border-ink-muted hover:text-ink",
                )}
              >
                <input
                  type="radio"
                  name="accountType"
                  value={value}
                  checked={checked}
                  onChange={() => setAccountType(value)}
                  className="sr-only"
                />
                <Icon className={cn("size-4.5 shrink-0", checked ? "text-gold-deep" : "text-ink-muted")} aria-hidden="true" />
                <span className="min-w-0 leading-tight font-medium">{t(`accountTypes.${key}`)}</span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-5 text-ink-muted" aria-live="polite">
          {t(`accountTypes.${typeKey}Hint`)}
        </p>
        {state.fieldErrors?.accountType ? (
          <p role="alert" className="mt-1.5 text-xs font-medium text-danger">{state.fieldErrors.accountType}</p>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-4">
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

        {requirements.phoneRequired ? phoneField : null}

        <PasswordInput
          name="password"
          label={t("fields.password")}
          required
          autoComplete="new-password"
          hint={t("fields.passwordHint")}
          error={state.fieldErrors?.password}
          toggleLabels={{ show: t("fields.showPassword"), hide: t("fields.hidePassword") }}
        />
      </div>

      {requirements.company && (
        <fieldset className="flex flex-col gap-4 rounded-lg border border-line bg-ivory/60 p-4">
          <legend className="px-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>
        </fieldset>
      )}

      {/* Server xətası bu bölmədəki sahəyə aiddirsə bölmə açıq gəlir */}
      <details className="group rounded-lg border border-line" open={optionalError || undefined}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
          <span>
            {t("registration.moreDetails")}
            <span className="ml-2 text-xs font-normal text-ink-muted">{t("registration.moreDetailsHint")}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="flex flex-col gap-4 border-t border-line px-4 pt-4 pb-5">
          {requirements.phoneRequired ? null : phoneField}
          <Input
            name="birthDate"
            label={t("fields.birthDate")}
            type="date"
            autoComplete="bday"
            hint={t("fields.birthDateHint")}
            error={state.fieldErrors?.birthDate}
          />
        </div>
      </details>

      <TurnstileWidget action="registration" resetSignal={state.message} />

      <div className="flex flex-col gap-3">
        <Button type="submit" loading={pending} fullWidth>
          <UserPlus className="size-4" aria-hidden="true" />
          {t("registration.submit")}
        </Button>
        <p className="text-center text-xs leading-5 text-ink-muted">{t("fields.dataNotice")}</p>
      </div>

      <p className="flex flex-wrap items-center justify-center gap-x-1 border-t border-line pt-5 text-center text-sm text-ink-soft">
        <span>{t("registration.hasAccount")}</span>
        <Link
          href={accountAuthHref("/daxil-ol", next)}
          className="inline-flex min-h-11 items-center rounded-xs font-medium text-gold-deep underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {t("registration.loginLink")}
        </Link>
      </p>
    </form>
  );
}
