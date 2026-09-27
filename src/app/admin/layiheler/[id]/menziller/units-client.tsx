"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminTextarea } from "@/components/admin/form-fields";
import { useLocalizedActionState } from "@/components/admin/use-server-message";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { PROJECT_UNIT_STATUSES, type ProjectUnitStatus } from "@/lib/constants";
import type { UnitView } from "@/lib/project-units";
import { generateProjectUnits, updateProjectUnit } from "./actions";

/** Mənzil generatoru (#107): bloklar, mərtəbə aralığı və mərtəbədəki mənzil sayı. */
export function UnitGeneratorForm({ projectId }: { projectId: string }) {
  const t = useTranslations("admin");
  return (
    <AdminForm action={generateProjectUnits} submitLabel={t("pages.projectUnits.generate")}>
      <input type="hidden" name="projectId" value={projectId} />
      <FormSection title={t("pages.projectUnits.generatorTitle")} description={t("pages.projectUnits.generatorHint")}>
        <AdminTextarea name="blocks" label={t("pages.projectUnits.blocks")} hint={t("pages.projectUnits.blocksHint")} rows={2} required defaultValue="A" />
        <AdminInput name="unitsPerFloor" label={t("pages.projectUnits.unitsPerFloor")} type="number" min={1} max={40} required defaultValue="4" />
        <AdminInput name="floorFrom" label={t("pages.projectUnits.floorFrom")} type="number" min={-3} max={200} required defaultValue="1" />
        <AdminInput name="floorTo" label={t("pages.projectUnits.floorTo")} type="number" min={-3} max={200} required defaultValue="16" />
        <AdminInput name="rooms" label={t("pages.projectUnits.rooms")} type="number" min={1} max={20} />
        <AdminInput name="area" label={t("pages.projectUnits.area")} type="number" min={1} step="0.1" />
      </FormSection>
    </AdminForm>
  );
}

const STATUS_TONE: Record<ProjectUnitStatus, string> = {
  AVAILABLE: "border-success/40 bg-success-bg",
  RESERVED: "border-warning/40 bg-warning-bg",
  SOLD: "border-line bg-beige",
};

/** Bir mənzilin sətri — status, qiymət, otaq və sahə dərhal saxlanır. */
export function UnitRow({ unit }: { unit: UnitView }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const { toast } = useToast();
  const [raw, action, pending] = useActionState(updateProjectUnit, IDLE_STATE);
  const state = useLocalizedActionState(raw);

  useEffect(() => {
    if (state.status === "idle" || !state.message) return;
    toast(state.message, state.status === "success" ? "success" : "error");
    if (state.status === "success") router.refresh();
  }, [state, toast, router]);

  const field = "min-h-11 w-full rounded-xs border border-line-strong bg-paper px-2 text-sm text-ink focus:border-gold focus:outline-none";
  return (
    <form action={action} className={`grid grid-cols-2 items-end gap-2 rounded-md border p-2.5 sm:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)_4.5rem_5.5rem_auto] ${STATUS_TONE[unit.status]}`}>
      <input type="hidden" name="id" value={unit.id} />
      <input type="hidden" name="currency" value={unit.currency} />
      <p className="col-span-2 text-sm font-semibold text-ink sm:col-span-1">№ {unit.number}</p>
      <label className="text-xs text-ink-muted">
        {t("pages.projectUnits.status")}
        <select name="status" defaultValue={unit.status} className={field}>
          {Object.values(PROJECT_UNIT_STATUSES).map((status) => (
            <option key={status} value={status}>{t(`labels.projectUnitStatus.${status}`)}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-ink-muted">
        {t("pages.projectUnits.price")} ({unit.currency})
        <input name="price" type="number" min={0} step="100" defaultValue={unit.price ?? ""} className={field} />
      </label>
      <label className="text-xs text-ink-muted">
        {t("pages.projectUnits.rooms")}
        <input name="rooms" type="number" min={1} max={20} defaultValue={unit.rooms ?? ""} className={field} />
      </label>
      <label className="text-xs text-ink-muted">
        {t("pages.projectUnits.area")}
        <input name="area" type="number" min={1} step="0.1" defaultValue={unit.area ?? ""} className={field} />
      </label>
      <button
        type="submit"
        disabled={pending}
        aria-label={t("pages.projectUnits.saveUnit", { number: unit.number })}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xs bg-navy px-3 text-sm font-semibold text-ivory disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
      </button>
    </form>
  );
}
