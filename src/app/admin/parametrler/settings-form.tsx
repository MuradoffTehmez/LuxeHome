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
  contactPhone,
  contactEmail,
  contactAddress,
  contactInstagram,
  contactWhatsapp,
}: {
  notificationEmail: string;
  notifyEnabled: boolean;
  announcement: string;
  fallbackEmail: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactInstagram: string;
  contactWhatsapp: string;
}) {
  return (
    <AdminForm action={saveSettings} submitLabel="Parametrləri saxla">
      <FormSection
        title="Əməliyyat əlaqə məlumatları"
        description="Əlaqə səhifəsi və footer bu dəyərləri dərhal istifadə edir. Boş sahə kodda təsdiqlənmiş ehtiyat dəyərə qayıdır."
      >
        <AdminInput name="contactPhone" label="Telefon" defaultValue={contactPhone} maxLength={30} />
        <AdminInput name="contactEmail" label="Korporativ e-poçt" type="email" defaultValue={contactEmail} maxLength={160} />
        <FullWidth><AdminInput name="contactAddress" label="Ünvan" defaultValue={contactAddress} maxLength={300} /></FullWidth>
        <AdminInput name="contactInstagram" label="Instagram istifadəçi adı" defaultValue={contactInstagram} maxLength={100} />
        <AdminInput name="contactWhatsapp" label="WhatsApp nömrəsi" defaultValue={contactWhatsapp} maxLength={30} hint="Məsələn: 994519228585" />
      </FormSection>

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
