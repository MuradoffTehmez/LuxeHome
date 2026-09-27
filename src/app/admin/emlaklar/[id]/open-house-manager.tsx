"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { addOpenHouse, deleteOpenHouse } from "./open-house-actions";

type Slot = { id: string; label: string; capacity: number | null; registrations: number; note: string | null };

/** Elanın açıq qapı slotları (#109): siyahı və yeni slot forması. */
export function OpenHouseManager({ propertyId, slots }: { propertyId: string; slots: Slot[] }) {
  const t = useTranslations("admin");
  return (
    <div className="mt-6 flex flex-col gap-4">
      <AdminForm action={addOpenHouse} submitLabel={t("pages.openHouse.add")}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <FormSection title={t("pages.openHouse.title")} description={t("pages.openHouse.description")}>
          <AdminInput name="startsAt" type="datetime-local" label={t("pages.openHouse.startsAt")} required />
          <AdminInput name="durationMinutes" type="number" min={15} max={600} step={15} defaultValue="120" label={t("pages.openHouse.durationMinutes")} />
          <AdminInput name="capacity" type="number" min={1} max={500} label={t("pages.openHouse.capacity")} hint={t("pages.openHouse.capacityHint")} />
          <AdminInput name="note" maxLength={200} label={t("pages.openHouse.note")} />
        </FormSection>
      </AdminForm>

      {slots.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("pages.openHouse.empty")}</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-paper">
          {slots.map((slot) => (
            <li key={slot.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{slot.label}</p>
                <p className="text-xs text-ink-muted">
                  {t("pages.openHouse.registrations", { count: slot.registrations })}
                  {slot.capacity !== null ? ` / ${slot.capacity}` : ""}
                  {slot.note ? ` · ${slot.note}` : ""}
                </p>
              </div>
              <ConfirmAction
                action={deleteOpenHouse}
                id={slot.id}
                label={t("pages.openHouse.delete")}
                title={t("pages.openHouse.delete")}
                description={t("pages.openHouse.deleteHint")}
                className="size-11"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </ConfirmAction>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
