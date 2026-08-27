import type { Metadata } from "next";
import { Info } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { SETTING_KEYS, getAllSettings } from "@/lib/settings";
import { siteConfig } from "@/config/site";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Parametrlər" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminRead(PERMISSIONS.SETTINGS_MANAGE);
  const settings = await getAllSettings();

  return (
    <>
      <AdminPageHeader
        title="Parametrlər"
        description="Saytın defolt görünüşü, əlaqə məlumatları, müraciət bildirişləri və komanda qeydi."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Parametrlər" }]}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.1fr_1fr]">
        <SettingsForm
          notificationEmail={settings[SETTING_KEYS.LEAD_NOTIFICATION_EMAIL] ?? ""}
          // Açar heç yazılmayıbsa, bildiriş aktiv sayılır
          notifyEnabled={settings[SETTING_KEYS.LEAD_NOTIFY_ENABLED] !== "0"}
          announcement={settings[SETTING_KEYS.ADMIN_ANNOUNCEMENT] ?? ""}
          fallbackEmail={siteConfig.email}
          contactPhone={settings[SETTING_KEYS.CONTACT_PHONE] ?? siteConfig.phone}
          contactEmail={settings[SETTING_KEYS.CONTACT_EMAIL] ?? siteConfig.email}
          contactAddress={settings[SETTING_KEYS.CONTACT_ADDRESS] ?? siteConfig.addressFull}
          contactInstagram={settings[SETTING_KEYS.CONTACT_INSTAGRAM] ?? siteConfig.instagram}
          contactWhatsapp={settings[SETTING_KEYS.CONTACT_WHATSAPP] ?? siteConfig.whatsapp}
        />

        <AdminCard title="Qorunan hüquqi məlumatlar" className="min-w-0">
          <div className="flex min-w-0 flex-col gap-4 text-sm text-ink-soft">
            <p className="flex items-start gap-2.5">
              <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span>
                Hüquqi ad, VÖEN, brend sahibi və naviqasiya strukturu kodda qorunur. Telefon,
                e-poçt, ünvan və sosial əlaqələri isə soldakı formadan dəyişə bilərsiniz.
              </span>
            </p>

            <dl className="grid gap-2">
              {[
                ["Şirkət", siteConfig.legalName],
                ["Hüquqi sahib", siteConfig.owner.name],
                ["VÖEN", siteConfig.legal.voen],
              ].map(([label, value]) => (
                <div key={label} className="flex min-w-0 flex-wrap justify-between gap-2 border-b border-line pb-2">
                  <dt className="text-xs tracking-wide text-ink-muted uppercase">{label}</dt>
                  <dd className="min-w-0 text-right text-sm text-ink [overflow-wrap:anywhere]">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="text-xs text-ink-muted">
              Gizli dəyərlər (Resend açarı, sessiya sirri) Cloudflare secret-lərindədir və heç vaxt
              bazada saxlanılmır.
            </p>
          </div>
        </AdminCard>
      </div>
    </>
  );
}
