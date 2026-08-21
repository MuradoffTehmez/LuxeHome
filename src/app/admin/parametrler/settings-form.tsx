"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import {
  AdminCheckbox,
  AdminInput,
  AdminTextarea,
  FullWidth,
} from "@/components/admin/form-fields";
import { saveSettings } from "./actions";

export function SettingsForm({
  notificationEmail,
  notifyEnabled,
  announcement,
  fallbackEmail,
}: {
  notificationEmail: string;
  notifyEnabled: boolean;
  announcement: string;
  fallbackEmail: string;
}) {
  return (
    <AdminForm action={saveSettings} submitLabel="Parametrləri saxla">
      <FormSection
        title="Müraciət bildirişləri"
        description="Saytdan yeni müraciət gələndə göndərilən e-poçt."
      >
        <FullWidth>
          <AdminInput
            name="notificationEmail"
            label="Bildiriş e-poçtu"
            type="email"
            defaultValue={notificationEmail}
            hint={`Boş buraxılsa, mühit dəyişənindəki ünvan işlədilir: ${fallbackEmail}`}
          />
        </FullWidth>

        <FullWidth>
          <AdminCheckbox
            name="notifyEnabled"
            label="Yeni müraciət gələndə e-poçt göndərilsin"
            defaultChecked={notifyEnabled}
          />
        </FullWidth>
      </FormSection>

      <FormSection
        title="Komanda qeydi"
        description="Yalnız panel istifadəçiləri görür — idarə səhifəsinin yuxarısında göstərilir."
      >
        <FullWidth>
          <AdminTextarea
            name="announcement"
            label="Elan"
            rows={3}
            maxLength={500}
            defaultValue={announcement}
            hint="Boş buraxsanız, idarə səhifəsində heç nə göstərilmir."
          />
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
