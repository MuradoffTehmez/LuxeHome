"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("admin");
  return (
    <AdminForm action={saveSettings} submitLabel={t("pages.settings.parametrleriSaxla")}>
      <FormSection
        title={t("pages.settings.emeliyyatElaqeMelumatlari")}
        description={t("pages.settings.elaqeSehifesiVeFooter")}
      >
        <AdminInput name="contactPhone" label={t("pages.settings.telefon")} defaultValue={contactPhone} maxLength={30} />
        <AdminInput name="contactEmail" label={t("pages.settings.korporativEPoct")} type="email" defaultValue={contactEmail} maxLength={160} />
        <FullWidth><AdminInput name="contactAddress" label={t("pages.settings.unvan")} defaultValue={contactAddress} maxLength={300} /></FullWidth>
        <AdminInput name="contactInstagram" label={t("pages.settings.instagramIstifadeciAdi")} defaultValue={contactInstagram} maxLength={100} />
        <AdminInput name="contactWhatsapp" label={t("pages.settings.whatsappNomresi")} defaultValue={contactWhatsapp} maxLength={30} hint={t("pages.settings.meselen994519228585")} />
      </FormSection>

      <FormSection
        title={t("pages.settings.muracietBildirisleri")}
        description={t("pages.settings.saytdanYeniMuracietGelende")}
      >
        <FullWidth>
          <AdminInput
            name="notificationEmail"
            label={t("pages.settings.bildirisEPoctu")}
            type="email"
            defaultValue={notificationEmail}
            hint={`Boş buraxılsa, mühit dəyişənindəki ünvan işlədilir: ${fallbackEmail}`}
          />
        </FullWidth>

        <FullWidth>
          <AdminCheckbox
            name="notifyEnabled"
            label={t("pages.settings.yeniMuracietGelendeE")}
            defaultChecked={notifyEnabled}
          />
        </FullWidth>
      </FormSection>

      <FormSection
        title={t("pages.settings.komandaQeydi")}
        description={t("pages.settings.yalnizPanelIstifadecileriGorur")}
      >
        <FullWidth>
          <AdminTextarea
            name="announcement"
            label={t("pages.settings.elan")}
            rows={3}
            maxLength={500}
            defaultValue={announcement}
            hint={t("pages.settings.bosBuraxsanizIdareSehifesinde")}
          />
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
