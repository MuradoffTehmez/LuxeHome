import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/config/site";
import { SEO_SETTING_KEYS } from "@/lib/constants";
import { parseJsonObject, type RobotsSeoSettings } from "@/lib/serp";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { saveRobotsSettings } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.robotsSiyaseti") };
}
export const dynamic = "force-dynamic";

export default async function RobotsAdminPage() {
  const t = await getAdminT();
  const row = await prisma.setting.findUnique({ where: { key: SEO_SETTING_KEYS.ROBOTS }, select: { value: true } });
  const settings = parseJsonObject<RobotsSeoSettings>(row?.value, { allow: ["/"], disallow: ["/admin", "/admin/", "/giris"], sitemap: siteUrl("/sitemap.xml") });
  return <><AdminPageHeader title={t("pages.serp.robots")} description={t("pages.serp.productionCrawlSiyasetiniTehlukesiz")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.robots") }]} />
    <AdminForm action={saveRobotsSettings} submitLabel={t("pages.serp.robotsSiyasetiniSaxla")}><FormSection title={t("pages.serp.robotsTxtQaydalari")} description={t("pages.serp.herYolAyricaSetirde")}>
      <FullWidth><AdminTextarea name="allow" label={t("pages.serp.allow")} rows={4} defaultValue={settings.allow.join("\n")} /></FullWidth>
      <FullWidth><AdminTextarea name="disallow" label={t("pages.serp.disallow")} rows={6} defaultValue={settings.disallow.join("\n")} /></FullWidth>
      <FullWidth><AdminInput name="sitemap" label={t("pages.serp.sitemapUrl")} type="url" defaultValue={settings.sitemap} required /></FullWidth>
    </FormSection></AdminForm>
  </>;
}
