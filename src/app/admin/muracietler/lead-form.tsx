"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { LEAD_STATUSES } from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";
import { updateLead } from "./actions";
import { useTranslations } from "next-intl";

/**
 * Müraciətin idarə paneli.
 *
 * Müştərinin yazdığı mətn burada yoxdur — o, səhifənin oxunan hissəsindədir və
 * heç vaxt redaktə edilmir. Bu forma yalnız daxili sahələri dəyişir.
 */
export function LeadForm({
  id,
  status,
  adminNote,
  assigneeId,
  users,
}: {
  id: string;
  status: string;
  adminNote: string;
  assigneeId: string;
  users: { id: string; name: string }[];
}) {
  const t = useTranslations("admin");
  const action: (state: ActionState, formData: FormData) => Promise<ActionState> = updateLead;

  return (
    <AdminForm action={action} submitLabel={t("pages.leads.yenile")} cancelHref="/admin/muracietler">
      <input type="hidden" name="id" value={id} />

      <FormSection title={t("pages.leads.isinVeziyyeti")}>
        <AdminSelect
          name="status"
          label={t("pages.leads.status")}
          required
          defaultValue={status}
          options={Object.values(LEAD_STATUSES).map((value) => ({
            value,
            label: t(`labels.leadStatus.${value}`),
          }))}
        />

        <AdminSelect
          name="assigneeId"
          label={t("pages.leads.mesulEmekdas")}
          defaultValue={assigneeId}
          placeholder={t("pages.leads.teyinEdilmeyib")}
          options={users.map((user) => ({ value: user.id, label: user.name }))}
        />

        <FullWidth>
          <AdminTextarea
            name="adminNote"
            label={t("pages.leads.daxiliQeyd")}
            rows={5}
            defaultValue={adminNote}
            hint={t("pages.leads.yalnizPanelIstifadecileriGorur")}
          />
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
