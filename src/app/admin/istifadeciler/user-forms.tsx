"use client";

import { useActionState, useEffect } from "react";
import { KeyRound, LogOut, ShieldOff, Trash2 } from "lucide-react";
import { AdminForm, FormSection, SubmitButton } from "@/components/admin/form-shell";
import { AdminCheckbox, AdminInput, AdminSelect } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABELS, ROLES } from "@/lib/constants";
import { IDLE_STATE } from "@/lib/admin/action-state";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  resetUserTwoFactor,
  revokeUserSessions,
  updateUser,
} from "./actions";

const ROLE_OPTIONS = Object.values(ROLES).map((value) => ({ value, label: ROLE_LABELS[value] }));

/** Yeni hesab — müvəqqəti parol cavabda bir dəfə göstərilir. */
export function CreateUserForm() {
  return (
    <AdminForm action={createUser} submitLabel="Hesab yarat">
      <FormSection
        title="Yeni istifadəçi"
        description="Sistem müvəqqəti parol yaradır; istifadəçi ilk girişdə onu dəyişir və 2FA qurur."
      >
        <AdminInput name="name" label="Ad Soyad" required maxLength={120} />
        <AdminInput name="email" label="E-poçt" type="email" required autoComplete="off" />
        <AdminSelect name="role" label="Rol" required defaultValue={ROLES.EDITOR} options={ROLE_OPTIONS} />
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
}: {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  isSelf: boolean;
  sessionCount: number;
}) {
  const [state, formAction] = useActionState(updateUser, IDLE_STATE);
  const { toast } = useToast();

  useEffect(() => {
    if (state.status === "idle" || !state.message) return;
    toast(state.message, state.status === "success" ? "success" : "error");
  }, [state, toast]);

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
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
          className="min-h-9 w-40 rounded-xs border border-line bg-paper px-2 text-xs text-ink transition-colors focus:border-gold"
        />

        <label className="sr-only" htmlFor={`role-${id}`}>
          Rol
        </label>
        <select
          id={`role-${id}`}
          name="role"
          defaultValue={role}
          disabled={isSelf}
          className="min-h-9 cursor-pointer rounded-xs border border-line bg-paper px-2 text-xs text-ink transition-colors focus:border-gold disabled:cursor-not-allowed disabled:bg-beige"
        >
          {ROLE_OPTIONS.map((option) => (
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
          className="min-h-9 text-xs"
        />

        <SubmitButton label="Saxla" className="min-h-9 px-3 text-xs" />
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
        >
          <KeyRound className="size-4" aria-hidden="true" />
        </ConfirmAction>

        <ConfirmAction
          action={resetUserTwoFactor}
          id={id}
          label={`«${name}» üçün 2FA-nı sıfırla`}
          title="2FA-nı sıfırlamaq"
          description="Doğrulama sirri və ehtiyat kodlar silinəcək. İstifadəçi növbəti girişdə 2FA-nı yenidən quracaq."
          confirmLabel="Sıfırla"
          tone="neutral"
        >
          <ShieldOff className="size-4" aria-hidden="true" />
        </ConfirmAction>

        {sessionCount > 0 && (
          <ConfirmAction
            action={revokeUserSessions}
            id={id}
            label={`«${name}» üçün sessiyaları bağla`}
            title="Sessiyaları bağlamaq"
            description={`${sessionCount} açıq sessiya dərhal bağlanacaq və istifadəçi yenidən daxil olmalı olacaq.`}
            confirmLabel="Bağla"
            tone="neutral"
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
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </ConfirmAction>
        )}
      </div>
    </div>
  );
}
