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
        description="İşləmə vaxtı dəyişən dəyərlər. Brend və əlaqə məlumatları kodda saxlanılır."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Parametrlər" }]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <SettingsForm
          notificationEmail={settings[SETTING_KEYS.LEAD_NOTIFICATION_EMAIL] ?? ""}
          // Açar heç yazılmayıbsa, bildiriş aktiv sayılır
          notifyEnabled={settings[SETTING_KEYS.LEAD_NOTIFY_ENABLED] !== "0"}
          announcement={settings[SETTING_KEYS.ADMIN_ANNOUNCEMENT] ?? ""}
          fallbackEmail={siteConfig.email}
        />

        <AdminCard title="Kodda saxlanılan məlumatlar">
          <div className="flex flex-col gap-4 text-sm text-ink-soft">
            <p className="flex items-start gap-2.5">
              <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span>
                Şirkət adı, hüquqi ad, telefon, ünvan, iş qrafiki, sosial şəbəkə hesabları və
                naviqasiya menyusu <code className="text-xs">src/config/site.ts</code> faylındadır.
                Bu dəyərlər nadir hallarda dəyişir, ictimai səhifələrin statik render olunmasını
                pozmamalıdır və dəyişikliyi kod nəzərdən keçirilməsindən keçməlidir.
              </span>
            </p>

            <dl className="grid gap-2">
              {[
                ["Şirkət", siteConfig.legalName],
                ["Telefon", siteConfig.phone],
                ["E-poçt", siteConfig.email],
                ["Ünvan", siteConfig.addressFull],
                ["İş qrafiki", siteConfig.workingHours.weekdays],
                ["Instagram", `@${siteConfig.instagram}`],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2">
                  <dt className="text-xs tracking-wide text-ink-muted uppercase">{label}</dt>
                  <dd className="text-right text-sm text-ink">{value}</dd>
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
