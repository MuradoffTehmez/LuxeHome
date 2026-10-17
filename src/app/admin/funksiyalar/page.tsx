import type { Metadata } from "next";
import { getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { parseFeatureFlags } from "@/lib/feature-flags-policy";
import { FeatureFlagsForm } from "./feature-flags-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.featureFlags.title"), robots: { index: false, follow: false } };
}

/** Modul idarəetməsi və funksiya bayraqları (#242, PRD 23, 16.6). */
export default async function FeatureFlagsPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.SETTINGS_MANAGE);
  // Forma saxlanmış (xam) dəyəri göstərir — asılı açarların effektiv nəticəsi ipucunda izah olunur.
  const flags = parseFeatureFlags(await getSetting(SETTING_KEYS.FEATURE_FLAGS));
  return (
    <>
      <AdminPageHeader title={t("pages.featureFlags.title")} description={t("pages.featureFlags.description")} />
      <AdminCard title={t("pages.featureFlags.cardTitle")} description={t("pages.featureFlags.cardDescription")}>
        <FeatureFlagsForm flags={flags} />
      </AdminCard>
    </>
  );
}
