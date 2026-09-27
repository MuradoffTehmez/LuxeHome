"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Download, Trash2 } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";
import { ImageDropzone } from "@/components/admin/image-dropzone";
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

export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  avatarUrl: string | null;
  companyName: string;
  companyTaxId: string;
  companyWebsite: string;
  position: string;
  agencyDescription: string;
  agencyAddress: string;
  agentRoleTitle: string;
  agentSpecialization: string;
  agentExperience: string;
  agentBio: string;
};

/**
 * Profil forması — hesab növünə görə bölmələr: hamı üçün şəxsi məlumat və profil
 * şəkli, agentlik/korporativ hesab üçün şirkət məlumatı, agent üçün ictimai agent
 * profili. Hesab növü buradan dəyişmir (bax `actions.ts`).
 */
export function ProfileForm({
  values,
  isAgency,
  requirements,
}: {
  values: ProfileFormValues;
  isAgency: boolean;
  requirements: { phoneRequired: boolean; company: boolean; agent: boolean };
}) {
  const t = useTranslations("account.profile");
  const [state, formAction, pending] = useActionState(updateProfile, IDLE_STATE);
  const sectionTitle = "mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase";

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <StateMessage state={state} />

      <fieldset className="flex flex-col gap-5">
        <legend className={sectionTitle}>{t("personalSection")}</legend>
        <ImageDropzone
          name="avatar"
          label={t("avatar")}
          folder="avatarlar"
          uploadUrl="/api/hesab/media?folder=avatarlar"
          maxFiles={1}
          initial={values.avatarUrl ? [{ url: values.avatarUrl, alt: "", isCover: true }] : []}
          hint={t("avatarHint")}
        />
        {state.fieldErrors?.avatar && <p className="text-sm text-danger">{state.fieldErrors.avatar}</p>}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input name="firstName" label={t("firstName")} required autoComplete="given-name" defaultValue={values.firstName} maxLength={60} error={state.fieldErrors?.firstName} />
          <Input name="lastName" label={t("lastName")} required autoComplete="family-name" defaultValue={values.lastName} maxLength={60} error={state.fieldErrors?.lastName} />
          <Input
            name="phone"
            label={t("phone")}
            type="tel"
            required={requirements.phoneRequired}
            defaultValue={values.phone}
            placeholder="+994 XX XXX XX XX"
            error={state.fieldErrors?.phone}
          />
          <Input
            name="birthDate"
            label={t("birthDate")}
            type="date"
            defaultValue={values.birthDate}
            hint={t("birthDateHint")}
            error={state.fieldErrors?.birthDate}
          />
        </div>
      </fieldset>

      {requirements.company && (
        <fieldset className="flex flex-col gap-5 border-t border-line pt-6">
          <legend className={sectionTitle}>{t("companySection")}</legend>
          <Input
            name="companyName"
            label={isAgency ? t("agencyName") : t("companyName")}
            required
            defaultValue={values.companyName}
            maxLength={160}
            error={state.fieldErrors?.companyName}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input name="companyTaxId" label={t("companyTaxId")} inputMode="numeric" maxLength={14} defaultValue={values.companyTaxId} error={state.fieldErrors?.companyTaxId} />
            <Input name="position" label={t("position")} defaultValue={values.position} maxLength={120} error={state.fieldErrors?.position} />
          </div>
          <Input
            name="companyWebsite"
            label={t("companyWebsite")}
            type="url"
            placeholder="https://"
            defaultValue={values.companyWebsite}
            error={state.fieldErrors?.companyWebsite}
          />
          {isAgency && (
            <>
              <Textarea
                name="agencyDescription"
                label={t("agencyDescription")}
                rows={4}
                maxLength={2000}
                defaultValue={values.agencyDescription}
                error={state.fieldErrors?.agencyDescription}
              />
              <Input
                name="agencyAddress"
                label={t("address")}
                defaultValue={values.agencyAddress}
                maxLength={240}
                error={state.fieldErrors?.agencyAddress}
              />
            </>
          )}
        </fieldset>
      )}

      {requirements.agent && (
        <fieldset className="flex flex-col gap-5 border-t border-line pt-6">
          <legend className={sectionTitle}>{t("agentSection")}</legend>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              name="agentRoleTitle"
              label={t("agentRoleTitle")}
              placeholder={t("agentRoleTitlePlaceholder")}
              defaultValue={values.agentRoleTitle}
              maxLength={120}
              error={state.fieldErrors?.agentRoleTitle}
            />
            <Input
              name="agentExperience"
              label={t("agentExperience")}
              type="number"
              min={0}
              max={70}
              defaultValue={values.agentExperience}
              error={state.fieldErrors?.agentExperience}
            />
          </div>
          <Input
            name="agentSpecialization"
            label={t("agentSpecialization")}
            defaultValue={values.agentSpecialization}
            maxLength={160}
            error={state.fieldErrors?.agentSpecialization}
          />
          <Textarea
            name="agentBio"
            label={t("agentBio")}
            rows={5}
            maxLength={3000}
            defaultValue={values.agentBio}
            error={state.fieldErrors?.agentBio}
          />
        </fieldset>
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
