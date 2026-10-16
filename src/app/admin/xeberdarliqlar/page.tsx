import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { getAdminT } from "@/lib/admin-i18n";
import { requireAdminRead } from "@/lib/admin/guard";
import { LOCALES, PERMISSIONS, type Locale } from "@/lib/constants";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { parseSafetyWarnings } from "@/lib/safety-warning";
import { SafetyWarningForm } from "./warning-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.safety.title") };
}
export const dynamic = "force-dynamic";

/**
 * Təhlükəsizlik → Xəbərdarlıq mətnləri (PRD Modul 11, #199). Əlaqə panelinin beh
 * xəbərdarlığı üç dildə; panel keşsiz oxuyur ki, redaktor saxladığını dərhal görsün.
 */
export default async function SafetyWarningsPage() {
  await requireAdminRead(PERMISSIONS.KNOWLEDGE_MANAGE);
  const t = await getAdminT();
  const locales = Object.values(LOCALES) as Locale[];
  const values = parseSafetyWarnings(await getSetting(SETTING_KEYS.SAFETY_CONTACT_WARNING));
  const defaults = Object.fromEntries(
    await Promise.all(
      locales.map(async (locale) => {
        const pt = await getTranslations({ locale, namespace: "property" });
        return [locale, pt("safety.contactWarning")] as const;
      }),
    ),
  ) as Record<Locale, string>;

  return (
    <>
      <AdminPageHeader
        title={t("pages.safety.title")}
        description={t("pages.safety.description")}
        breadcrumbs={[{ label: t("pages.moderation.idarePaneli"), href: "/admin" }, { label: t("pages.safety.title") }]}
      />

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <AdminCard title={t("pages.safety.contactWarning")}>
          <SafetyWarningForm locales={locales} values={values} defaults={defaults} />
        </AdminCard>

        <AdminCard title={t("pages.safety.whereTitle")}>
          <div className="flex flex-col gap-3 text-sm text-ink-soft">
            <p className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              {t("pages.safety.where")}
            </p>
            <p>{t("pages.safety.rules")}</p>
          </div>
        </AdminCard>
      </div>
    </>
  );
}
