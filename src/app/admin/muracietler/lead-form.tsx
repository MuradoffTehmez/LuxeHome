"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";
import { updateLead } from "./actions";

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
  const action: (state: ActionState, formData: FormData) => Promise<ActionState> = updateLead;

  return (
    <AdminForm action={action} submitLabel="Yenilə" cancelHref="/admin/muracietler">
      <input type="hidden" name="id" value={id} />

      <FormSection title="İşin vəziyyəti">
        <AdminSelect
          name="status"
          label="Status"
          required
          defaultValue={status}
          options={Object.values(LEAD_STATUSES).map((value) => ({
            value,
            label: LEAD_STATUS_LABELS[value],
          }))}
        />

        <AdminSelect
          name="assigneeId"
          label="Məsul əməkdaş"
          defaultValue={assigneeId}
          placeholder="Təyin edilməyib"
          options={users.map((user) => ({ value: user.id, label: user.name }))}
        />

        <FullWidth>
          <AdminTextarea
            name="adminNote"
            label="Daxili qeyd"
            rows={5}
            defaultValue={adminNote}
            hint="Yalnız panel istifadəçiləri görür — müştəriyə göndərilmir."
          />
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
