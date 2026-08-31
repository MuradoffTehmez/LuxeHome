"use client";

import { useActionState, useEffect } from "react";
import { KeyRound, LogOut, ShieldOff, Trash2 } from "lucide-react";
import { AdminForm, FormSection, SubmitButton } from "@/components/admin/form-shell";
import { AdminCheckbox, AdminInput, AdminSelect } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { useToast } from "@/components/ui/toast";
import { ROLES } from "@/lib/constants";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  resetUserTwoFactor,
  revokeUserSessions,
  updateUser,
} from "./actions";

/** Rol adları dilə bağlıdır, ona görə modul sabiti kimi saxlanmır. */
const roleOptions = (t: ReturnType<typeof useTranslations<"admin">>) =>
  Object.values(ROLES).map((value) => ({ value, label: t(`labels.role.${value}`) }));

/** Yeni hesab — müvəqqəti parol cavabda bir dəfə göstərilir. */
export function CreateUserForm() {
  const t = useTranslations("admin");
  return (
    <AdminForm action={createUser} submitLabel="Hesab yarat">
      <FormSection
        title="Yeni istifadəçi"
        description="Sistem müvəqqəti parol yaradır; istifadəçi ilk girişdə onu dəyişir və 2FA qurur."
      >
        <AdminInput name="name" label="Ad Soyad" required maxLength={120} />
        <AdminInput name="email" label="E-poçt" type="email" required autoComplete="off" />
        <AdminSelect name="role" label="Rol" required defaultValue={ROLES.EDITOR} options={roleOptions(t)} />
      </FormSection>
    </AdminForm>
  );
}

/**
 * Mövcud hesabın sətir daxilində redaktəsi.
 *
 * Ayrıca səhifə açmaq əvəzinə cədvəldə saxlanılır: rol dəyişməsi tez-tez olan,
 * amma sahə sayı az olan əməliyyatdır.
 */
export function UserRow({
  id,
  name,
  role,
  isActive,
  isSelf,
  sessionCount,
  totpEnabled,
  mobile = false,
}: {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  isSelf: boolean;
  sessionCount: number;
  totpEnabled: boolean;
  mobile?: boolean;
}) {
  const t = useTranslations("admin");
  const [state, formAction] = useActionState(updateUser, IDLE_STATE);
  const { toast } = useToast();

  useEffect(() => {
    if (state.status === "idle" || !state.message) return;
    toast(state.message, state.status === "success" ? "success" : "error");
  }, [state, toast]);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <form
        action={formAction}
        className={cn("gap-2", mobile ? "grid w-full sm:grid-cols-2" : "flex flex-wrap items-end")}
      >
        <input type="hidden" name="id" value={id} />

        <label className="sr-only" htmlFor={`name-${id}`}>
          Ad Soyad
        </label>
        <input
          id={`name-${id}`}
          name="name"
          type="text"
          defaultValue={name}
          maxLength={120}
          className={cn(
            "min-h-11 rounded-xs border border-line bg-paper px-3 text-ink transition-colors focus:border-gold",
            mobile ? "w-full text-base sm:text-sm" : "w-40 text-xs",
          )}
        />

        <label className="sr-only" htmlFor={`role-${id}`}>
          Rol
        </label>
        <select
          id={`role-${id}`}
          name="role"
          defaultValue={role}
          disabled={isSelf}
          className={cn(
            "min-h-11 cursor-pointer rounded-xs border border-line bg-paper px-3 text-ink transition-colors focus:border-gold disabled:cursor-not-allowed disabled:bg-beige",
            mobile ? "w-full text-base sm:text-sm" : "text-xs",
          )}
        >
          {roleOptions(t).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <AdminCheckbox
          name="isActive"
          label="Aktiv"
          defaultChecked={isActive}
          disabled={isSelf}
          className="min-h-11 text-xs"
        />

        <SubmitButton label="Saxla" className="min-h-11 px-3 text-xs" />
      </form>

      <div className="flex flex-wrap items-center gap-0.5">
        <ConfirmAction
          action={resetUserPassword}
          id={id}
          label={`«${name}» üçün parolu sıfırla`}
          title="Parolu sıfırlamaq"
          description="Yeni müvəqqəti parol yaradılacaq və istifadəçinin bütün sessiyaları bağlanacaq. Parol bir dəfə göstəriləcək."
          confirmLabel="Sıfırla"
          tone="neutral"
          className="size-11"
        >
          <KeyRound className="size-4" aria-hidden="true" />
        </ConfirmAction>

        {totpEnabled && (
          <ConfirmAction
            action={resetUserTwoFactor}
            id={id}
            label={`«${name}» üçün 2FA-nı sıfırla`}
            title="2FA-nı sıfırlamaq"
            description="Doğrulama sirri və ehtiyat kodlar silinəcək. İstifadəçi növbəti girişdə 2FA-nı yenidən quracaq."
            confirmLabel="Sıfırla"
            tone="neutral"
            className="size-11"
          >
            <ShieldOff className="size-4" aria-hidden="true" />
          </ConfirmAction>
        )}

        {sessionCount > 0 && (
          <ConfirmAction
            action={revokeUserSessions}
            id={id}
            label={`«${name}» üçün sessiyaları bağla`}
            title="Sessiyaları bağlamaq"
            description={`${sessionCount} açıq sessiya dərhal bağlanacaq və istifadəçi yenidən daxil olmalı olacaq.`}
            confirmLabel="Bağla"
            tone="neutral"
            className="size-11"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </ConfirmAction>
        )}

        {!isSelf && (
          <ConfirmAction
            action={deleteUser}
            id={id}
            label={`«${name}» hesabını sil`}
            title="Hesabı silmək"
            description="Hesab tamamilə silinəcək. Yazdığı elan və məqalələr qalır, sadəcə müəllifsiz olur."
            className="size-11"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </ConfirmAction>
        )}
      </div>
    </div>
  );
}
