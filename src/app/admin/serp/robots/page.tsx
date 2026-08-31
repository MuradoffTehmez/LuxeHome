import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/config/site";
import { SEO_SETTING_KEYS } from "@/lib/constants";
import { parseJsonObject, type RobotsSeoSettings } from "@/lib/serp";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { saveRobotsSettings } from "../actions";

export const metadata: Metadata = { title: "Robots siyasəti" };
export const dynamic = "force-dynamic";

export default async function RobotsAdminPage() {
  const row = await prisma.setting.findUnique({ where: { key: SEO_SETTING_KEYS.ROBOTS }, select: { value: true } });
  const settings = parseJsonObject<RobotsSeoSettings>(row?.value, { allow: ["/"], disallow: ["/admin", "/admin/", "/giris"], sitemap: siteUrl("/sitemap.xml") });
  return <><AdminPageHeader title="Robots" description="Production crawl siyasətini təhlükəsiz idarə edin; staging hər halda bütövlükdə bloklanır." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Robots" }]} />
    <AdminForm action={saveRobotsSettings} submitLabel="Robots siyasətini saxla"><FormSection title="robots.txt qaydaları" description="Hər yol ayrıca sətirdə yazılır. Production üçün Disallow: / qadağandır.">
      <FullWidth><AdminTextarea name="allow" label="Allow" rows={4} defaultValue={settings.allow.join("\n")} /></FullWidth>
      <FullWidth><AdminTextarea name="disallow" label="Disallow" rows={6} defaultValue={settings.disallow.join("\n")} /></FullWidth>
      <FullWidth><AdminInput name="sitemap" label="Sitemap URL" type="url" defaultValue={settings.sitemap} required /></FullWidth>
    </FormSection></AdminForm>
  </>;
}
