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
  // Əsas elan formasından ayrı blokdur: öz `<form>`-u var, elan formasının içinə
  // (məs. `extraActions`-a) salınmamalıdır — iç-içə forma HTML-də etibarsızdır və
  // əvvəl səhifəni dar sütuna sıxırdı.
  return (
    <section aria-labelledby="open-house-title" className="mt-8 flex min-w-0 flex-col gap-4">
      <header>
        <h2 id="open-house-title" className="text-lg font-semibold text-ink">{t("pages.openHouse.title")}</h2>
        <p className="mt-0.5 text-sm text-ink-muted">{t("pages.openHouse.description")}</p>
      </header>

      {slots.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-paper px-4 py-3 text-sm text-ink-muted">
          {t("pages.openHouse.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-paper">
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

      <AdminForm action={addOpenHouse} submitLabel={t("pages.openHouse.add")}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <FormSection title={t("pages.openHouse.add")}>
          <AdminInput name="startsAt" type="datetime-local" label={t("pages.openHouse.startsAt")} required />
          <AdminInput name="durationMinutes" type="number" min={15} max={600} step={15} defaultValue="120" label={t("pages.openHouse.durationMinutes")} />
          <AdminInput name="capacity" type="number" min={1} max={500} label={t("pages.openHouse.capacity")} hint={t("pages.openHouse.capacityHint")} />
          <AdminInput name="note" maxLength={200} label={t("pages.openHouse.note")} />
        </FormSection>
      </AdminForm>
    </section>
  );
}
