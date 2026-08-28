"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Download, Trash2 } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";
import { changePassword, deleteAccount, updateProfile } from "./actions";

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
          ? "flex min-w-0 items-start gap-2.5 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger [overflow-wrap:anywhere]"
          : "flex min-w-0 items-start gap-2.5 rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success [overflow-wrap:anywhere]"
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
  const t = useTranslations("account.profile");
  const [state, formAction, pending] = useActionState(updateProfile, IDLE_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <StateMessage state={state} />

      <Input name="name" label={t("name")} required defaultValue={name} maxLength={120} error={state.fieldErrors?.name} />
      <Input
        name="phone"
        label={t("phone")}
        type="tel"
        defaultValue={phone}
        placeholder="+994 XX XXX XX XX"
        error={state.fieldErrors?.phone}
      />

      {isAgency && (
        <>
          <Input
            name="agencyName"
            label={t("agencyName")}
            required
            defaultValue={agency?.name ?? ""}
            maxLength={160}
            error={state.fieldErrors?.agencyName}
          />
          <Textarea
            name="agencyDescription"
            label={t("agencyDescription")}
            rows={4}
            maxLength={2000}
            defaultValue={agency?.description ?? ""}
            error={state.fieldErrors?.agencyDescription}
          />
          <Input
            name="agencyAddress"
            label={t("address")}
            defaultValue={agency?.address ?? ""}
            maxLength={240}
            error={state.fieldErrors?.agencyAddress}
          />
          <Input
            name="agencyWebsite"
            label={t("website")}
            type="url"
            placeholder="https://"
            defaultValue={agency?.website ?? ""}
            error={state.fieldErrors?.agencyWebsite}
          />
        </>
      )}

      <div className="sticky bottom-0 z-[var(--z-sticky)] -mx-4 border-t border-line bg-paper/95 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" loading={pending} className="w-full sm:w-auto">
          {t("save")}
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const t = useTranslations("account.profile");
  const [state, formAction, pending] = useActionState(changePassword, IDLE_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <StateMessage state={state} />

      <Input
        name="current"
        label={t("currentPassword")}
        type="password"
        required
        autoComplete="current-password"
        error={state.fieldErrors?.current}
      />
      <Input
        name="next"
        label={t("newPassword")}
        type="password"
        required
        autoComplete="new-password"
        hint={t("passwordHint")}
        error={state.fieldErrors?.next}
      />
      <Input
        name="repeat"
        label={t("repeatPassword")}
        type="password"
        required
        autoComplete="new-password"
        error={state.fieldErrors?.repeat}
      />

      <div className="sticky bottom-0 z-[var(--z-sticky)] -mx-4 border-t border-line bg-paper/95 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" variant="outline" loading={pending} className="w-full sm:w-auto">
          {t("changePassword")}
        </Button>
      </div>
    </form>
  );
}

export function AccountDataForm() {
  const t = useTranslations("account.profile");
  const [state, formAction, pending] = useActionState(deleteAccount, IDLE_STATE);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-medium text-ink">{t("exportTitle")}</h3>
        <p className="mt-1 text-sm leading-6 text-ink-soft">{t("exportDescription")}</p>
        <a href="/api/hesab/export" download className={buttonClassName("outline", "sm", false, "mt-3")}>
          <Download className="size-4" aria-hidden="true" />{t("exportButton")}
        </a>
      </div>

      <form action={formAction} className="flex flex-col gap-4 border-t border-line pt-6" noValidate>
        <div>
          <h3 className="font-medium text-danger">{t("deleteTitle")}</h3>
          <p className="mt-1 text-sm leading-6 text-ink-soft">{t("deleteDescription")}</p>
        </div>
        <StateMessage state={state} />
        <Input name="password" type="password" autoComplete="current-password" required label={t("currentPassword")} error={state.fieldErrors?.password} />
        <Input name="confirmation" required autoComplete="off" label={t("deleteConfirmation", { phrase: t("deletePhrase") })} error={state.fieldErrors?.confirmation} />
        <Button type="submit" variant="danger" loading={pending} className="w-full sm:w-fit">
          <Trash2 className="size-4" aria-hidden="true" />{t("deleteButton")}
        </Button>
      </form>
    </div>
  );
}
