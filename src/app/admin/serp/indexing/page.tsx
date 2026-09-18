import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { siteUrl } from "@/config/site";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, FullWidth } from "@/components/admin/form-fields";
import { submitSitemapToSearchConsole } from "../actions";
import {
  getSearchConsoleCredentialStatus,
  getSearchConsoleSiteUrl,
} from "@/lib/google-search-console";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.indexing") };
}
export default async function IndexingAdminPage() {
  const t = await getAdminT();
  const credential = getSearchConsoleCredentialStatus();
  const site = getSearchConsoleSiteUrl();
  const credentialLabel = credential.configured
    ? credential.mode === "service-account"
      ? t("pages.serp.gscServiceAccount")
      : credential.mode === "oauth-refresh"
        ? t("pages.serp.gscOAuthRefresh")
        : t("pages.serp.gscTemporaryAccessToken")
    : t("pages.misc.catismir");
  return <><AdminPageHeader title={t("pages.serp.indexing")} description={t("pages.serp.googleSearchConsoleProperty")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.indexing") }]} />
    <div className="grid gap-6 xl:grid-cols-2"><AdminCard title={t("pages.serp.gscBaglantiStatusu")}><dl className="grid gap-3 text-sm"><div><dt className="text-ink-muted">{t("pages.serp.gscCredential")}</dt><dd className="font-medium text-ink">{credentialLabel}</dd></div><div><dt className="text-ink-muted">{t("pages.serp.property")}</dt><dd className="font-medium text-ink">{site}</dd></div><div><dt className="text-ink-muted">{t("pages.serp.hazirliq")}</dt><dd className="font-medium text-ink">{credential.configured ? t("pages.misc.apiEmeliyyatlarinaHazir") : t("pages.misc.secretLerTamamlanmalidir")}</dd>{credential.missing.length > 0 ? <dd className="mt-1 text-xs text-ink-muted"><code>{credential.missing.join(", ")}</code></dd> : null}</div></dl></AdminCard>
      <AdminForm action={submitSitemapToSearchConsole} submitLabel={t("pages.serp.sitemapIGscYe")}><FormSection title={t("pages.serp.sitemapSubmission")} description={t("pages.serp.tesdiqlenmisSearchConsoleProperty")}><FullWidth><AdminInput name="sitemap" label={t("pages.serp.sitemapUrl")} type="url" defaultValue={siteUrl("/sitemap.xml")} required /></FullWidth></FormSection></AdminForm></div>
  </>;
}
