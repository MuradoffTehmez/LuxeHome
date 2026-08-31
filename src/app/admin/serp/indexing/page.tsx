import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { siteUrl } from "@/config/site";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, FullWidth } from "@/components/admin/form-fields";
import { submitSitemapToSearchConsole } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.indexing") };
}
export default async function IndexingAdminPage() {
  const t = await getAdminT();
  const configured = Boolean(process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN && process.env.GSC_SITE_URL);
  return <><AdminPageHeader title={t("pages.serp.indexing")} description={t("pages.serp.googleSearchConsoleProperty")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.indexing") }]} />
    <div className="grid gap-6 xl:grid-cols-2"><AdminCard title={t("pages.serp.gscBaglantiStatusu")}><dl className="grid gap-3 text-sm"><div><dt className="text-ink-muted">{t("pages.serp.oauthToken")}</dt><dd className="font-medium text-ink">{process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN ? "Konfiqurasiya edilib" : "Çatışmır"}</dd></div><div><dt className="text-ink-muted">{t("pages.serp.property")}</dt><dd className="font-medium text-ink">{process.env.GSC_SITE_URL || "sc-domain:luxehomeestate.az (default)"}</dd></div><div><dt className="text-ink-muted">{t("pages.serp.hazirliq")}</dt><dd className="font-medium text-ink">{configured ? "API əməliyyatlarına hazır" : "Secret-lər tamamlanmalıdır"}</dd></div></dl></AdminCard>
      <AdminForm action={submitSitemapToSearchConsole} submitLabel={t("pages.serp.sitemapIGscYe")}><FormSection title={t("pages.serp.sitemapSubmission")} description={t("pages.serp.tesdiqlenmisSearchConsoleProperty")}><FullWidth><AdminInput name="sitemap" label={t("pages.serp.sitemapUrl")} type="url" defaultValue={siteUrl("/sitemap.xml")} required /></FullWidth></FormSection></AdminForm></div>
  </>;
}
