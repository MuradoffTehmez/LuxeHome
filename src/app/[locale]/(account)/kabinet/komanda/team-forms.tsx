"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, CheckCircle2, UserX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";
import { approveAgencyRequest, inviteAgencyEmployee, rejectAgencyRequest, removeAgencyEmployee } from "./actions";

function StateMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;
  const error = state.status === "error";
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <p
      role={error ? "alert" : "status"}
      className={
        error
          ? "mb-4 flex min-w-0 items-start gap-2.5 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger [overflow-wrap:anywhere]"
          : "mb-4 flex min-w-0 items-start gap-2.5 rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success [overflow-wrap:anywhere]"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {state.message}
    </p>
  );
}

export function InviteEmployeeForm({ disabled }: { disabled: boolean }) {
  const t = useTranslations("account.team");
  const [state, formAction, pending] = useActionState(inviteAgencyEmployee, IDLE_STATE);

  if (disabled) {
    return <p className="text-sm text-ink-muted">{t("limit")}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end" noValidate>
      <div className="flex-1">
        <StateMessage state={state} />
        <Input
          name="email"
          type="email"
          label={t("email")}
          required
          placeholder="user@example.com"
          error={state.fieldErrors?.email}
        />
      </div>
      <Button type="submit" variant="primary" loading={pending} className="sm:mb-0.5">
        {t("invite")}
      </Button>
    </form>
  );
}

export function RemoveEmployeeButton({ id, name }: { id: string; name: string }) {
  const t = useTranslations("account.team");
  return (
    <ConfirmAction
      action={removeAgencyEmployee}
      id={id}
      label={t("removeLabel", { name })}
      title={t("removeTitle")}
      description={t("removeDescription", { name })}
      confirmLabel={t("remove")}
      tone="danger"
    >
      <UserX className="size-4" aria-hidden="true" />
    </ConfirmAction>
  );
}

/** Agentin qoşulma sorğusu: sahib təsdiqləyir və ya rədd edir. */
export function ReviewRequestButtons({ id, name }: { id: string; name: string }) {
  const t = useTranslations("account.team");
  return (
    <div className="flex shrink-0 items-center gap-1">
      <ConfirmAction
        action={approveAgencyRequest}
        id={id}
        label={t("approveLabel", { name })}
        title={t("approve")}
        description={t("approveLabel", { name })}
        confirmLabel={t("approve")}
        tone="neutral"
      >
        <Check className="size-4" aria-hidden="true" />
      </ConfirmAction>
      <ConfirmAction
        action={rejectAgencyRequest}
        id={id}
        label={t("rejectLabel", { name })}
        title={t("reject")}
        description={t("rejectLabel", { name })}
        confirmLabel={t("reject")}
        tone="danger"
      >
        <X className="size-4" aria-hidden="true" />
      </ConfirmAction>
    </div>
  );
}
