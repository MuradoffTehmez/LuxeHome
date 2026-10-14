"use client";

import { useTranslations } from "next-intl";
import { Clock, MapPin, Phone, Trash2 } from "lucide-react";
import { AdminForm } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { MAX_AGENCY_OFFICES } from "@/lib/constants";
import { addAgencyOfficeByAdmin, removeAgencyOfficeByAdmin } from "./actions";

export type AdminAgencyOffice = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  workingHours: string | null;
  cityName: string | null;
};

/** Panel: agentliyin filialları (#157) — siyahı, silmə və əlavə forması. */
export function AgencyOfficeEditor({
  agencyId,
  offices,
  cities,
}: {
  agencyId: string;
  offices: AdminAgencyOffice[];
  cities: { value: string; label: string }[];
}) {
  const t = useTranslations("admin");

  return (
    <div className="flex flex-col gap-5">
      {offices.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("pages.agencyHub.officesEmpty")}</p>
      ) : (
        <ul className="divide-y divide-line rounded-sm border border-line">
          {offices.map((office) => (
            <li key={office.id} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0 text-sm">
                <p className="font-medium text-ink">{office.name}</p>
                <p className="mt-0.5 flex items-start gap-1.5 text-ink-soft">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-gold-deep" aria-hidden="true" />
                  <span className="[overflow-wrap:anywhere]">{[office.cityName, office.address].filter(Boolean).join(", ")}</span>
                </p>
                <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-muted">
                  {office.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3" aria-hidden="true" />
                      <span className="tabular">{office.phone}</span>
                    </span>
                  )}
                  {office.workingHours && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" aria-hidden="true" />
                      {office.workingHours}
                    </span>
                  )}
                </p>
              </div>
              <ConfirmAction
                action={removeAgencyOfficeByAdmin}
                id={office.id}
                label={t("pages.agencyHub.officeRemoveNamed", { name: office.name })}
                title={t("pages.agencyHub.officeRemoveTitle")}
                description={t("pages.agencyHub.officeRemoveDescription", { name: office.name })}
                confirmLabel={t("pages.agencyHub.officeRemove")}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </ConfirmAction>
            </li>
          ))}
        </ul>
      )}

      {offices.length < MAX_AGENCY_OFFICES ? (
        <AdminForm action={addAgencyOfficeByAdmin} submitLabel={t("pages.agencyHub.officeAdd")}>
          <input type="hidden" name="agencyId" value={agencyId} />
          <AdminInput name="officeName" label={t("pages.agencyHub.officeName")} required maxLength={120} />
          <AdminSelect name="officeCityId" label={t("pages.agencyHub.officeCity")} placeholder={t("pages.agencyHub.officeCityPlaceholder")} options={cities} />
          <AdminInput name="officeAddress" label={t("pages.agencyHub.address")} required maxLength={240} />
          <AdminInput name="officePhone" label={t("pages.agencyHub.phone")} type="tel" maxLength={30} />
          <AdminInput name="officeHours" label={t("pages.agencyHub.hours")} maxLength={120} />
        </AdminForm>
      ) : (
        <p className="text-sm text-ink-muted">{t("pages.agencyHub.officesLimit", { count: MAX_AGENCY_OFFICES })}</p>
      )}
    </div>
  );
}
