"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { RESERVATION_STATUS_LABELS, type ReservationStatus } from "@/lib/constants";
import { updateReservationStatus } from "./actions";

function Submit() {
  const t = useTranslations("admin");
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="grid size-11 place-items-center rounded-xs bg-gold text-on-gold hover:bg-gold-soft disabled:opacity-50" aria-label={t("pages.ops.statusuYaddaSaxla")}>
      <Save className="size-4" aria-hidden="true" />
    </button>
  );
}

export function ReservationStatusForm({ id, status }: { id: string; status: ReservationStatus }) {
  const t = useTranslations("admin");
  const [state, action] = useActionState(updateReservationStatus, IDLE_STATE);
  const { toast } = useToast();
  useEffect(() => {
    if (state.message) toast(state.message, state.status === "success" ? "success" : "error");
  }, [state, toast]);

  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} className="min-h-11 rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink">
        {(Object.entries(RESERVATION_STATUS_LABELS) as [ReservationStatus, string][]).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <input name="note" maxLength={500} placeholder={t("pages.ops.qeydIsteyeBagli")} className="min-h-11 min-w-48 rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink" />
      <Submit />
    </form>
  );
}
