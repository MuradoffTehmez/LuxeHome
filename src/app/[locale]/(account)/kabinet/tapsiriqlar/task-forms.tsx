"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";
import {
  AGENCY_TASK_DESCRIPTION_MAX,
  AGENCY_TASK_STATUSES,
  AGENCY_TASK_TITLE_MAX,
  AGENCY_TASK_TYPES,
  type AgencyTaskStatus,
} from "@/lib/constants";
import { changeTaskStatus, createTask } from "./actions";

type Option = { value: string; label: string };

function StateMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;
  const error = state.status === "error";
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <p
      role={error ? "alert" : "status"}
      className={
        error
          ? "flex min-w-0 items-start gap-2.5 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger"
          : "flex min-w-0 items-start gap-2.5 rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {state.message}
    </p>
  );
}

/**
 * Yeni tapşırıq (#220, PRD 7.3). İcraçı seçimi yalnız idarəçiyə göstərilir; digər üzvün tapşırığı
 * özünə yazılır. Elan və müraciət bağlantısı istəyə bağlıdır.
 */
export function TaskCreateForm({
  assignees,
  properties,
  leads,
  today,
}: {
  assignees: Option[] | null;
  properties: Option[];
  leads: Option[];
  today: string;
}) {
  const t = useTranslations("account.tasks");
  const [state, formAction, pending] = useActionState(createTask, IDLE_STATE);
  const errors = state.fieldErrors ?? {};
  const typeOptions = (Object.values(AGENCY_TASK_TYPES) as string[]).map((value) => ({ value, label: t(`types.${value as keyof typeof AGENCY_TASK_TYPES}`) }));

  return (
    <form action={formAction} key={state.status === "success" ? state.message : "task-form"} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input name="title" label={t("form.title")} required minLength={3} maxLength={AGENCY_TASK_TITLE_MAX} error={errors.title} />
      </div>
      <Select name="type" label={t("form.type")} options={typeOptions} defaultValue={AGENCY_TASK_TYPES.GENERAL} error={errors.type} />
      {assignees ? (
        <Select name="assignee" label={t("form.assignee")} options={assignees} defaultValue={assignees[0]?.value} error={errors.assignee} />
      ) : (
        <p className="self-end text-sm text-ink-muted">{t("form.selfOnly")}</p>
      )}
      <Input name="due" type="date" min={today} label={t("form.due")} hint={t("form.dueHint")} error={errors.due} />
      <Select name="property" label={t("form.property")} placeholder={t("form.none")} options={properties} defaultValue="" error={errors.property} />
      <div className="sm:col-span-2">
        <Select name="lead" label={t("form.lead")} placeholder={t("form.none")} options={leads} defaultValue="" error={errors.lead} />
      </div>
      <div className="sm:col-span-2">
        <Textarea name="description" label={t("form.description")} maxLength={AGENCY_TASK_DESCRIPTION_MAX} rows={3} />
      </div>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <StateMessage state={state} />
        <div>
          <Button type="submit" loading={pending}>{t("form.submit")}</Button>
        </div>
      </div>
    </form>
  );
}

/** Statusun dəyişdirilməsi: icraçıya icra statusları, idarəçiyə/yaradana həm də ləğv. */
export function TaskStatusSelect({ id, status, canCancel, canProgress }: { id: string; status: AgencyTaskStatus; canCancel: boolean; canProgress: boolean }) {
  const t = useTranslations("account.tasks");
  const [value, setValue] = useState<AgencyTaskStatus>(status);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const options = (Object.values(AGENCY_TASK_STATUSES) as AgencyTaskStatus[]).filter((option) =>
    option === status || (option === AGENCY_TASK_STATUSES.CANCELLED ? canCancel : canProgress),
  );
  if (options.length <= 1) return null;

  return (
    <label className="flex items-center gap-2 text-xs text-ink-muted">
      <span className="sr-only">{t("statusLabel")}</span>
      <select
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as AgencyTaskStatus;
          setValue(next);
          startTransition(async () => {
            const result = await changeTaskStatus(id, next);
            toast(result.message ?? t("errors.failed"), result.status === "success" ? "success" : "error");
            if (result.status === "success") router.refresh();
            else setValue(status);
          });
        }}
        className="min-h-11 rounded-sm border border-line bg-paper px-3 text-sm text-ink focus:border-gold focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>{t(`statuses.${option}`)}</option>
        ))}
      </select>
    </label>
  );
}
