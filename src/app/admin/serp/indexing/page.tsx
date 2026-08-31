import type { Metadata } from "next";
import { siteUrl } from "@/config/site";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, FullWidth } from "@/components/admin/form-fields";
import { submitSitemapToSearchConsole } from "../actions";

export const metadata: Metadata = { title: "Indexing" };
export default function IndexingAdminPage() {
  const configured = Boolean(process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN && process.env.GSC_SITE_URL);
  return <><AdminPageHeader title="Indexing" description="Google Search Console property bağlantısı və sitemap submission nəzarəti." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Indexing" }]} />
    <div className="grid gap-6 xl:grid-cols-2"><AdminCard title="GSC bağlantı statusu"><dl className="grid gap-3 text-sm"><div><dt className="text-ink-muted">OAuth token</dt><dd className="font-medium text-ink">{process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN ? "Konfiqurasiya edilib" : "Çatışmır"}</dd></div><div><dt className="text-ink-muted">Property</dt><dd className="font-medium text-ink">{process.env.GSC_SITE_URL || "sc-domain:luxehomeestate.az (default)"}</dd></div><div><dt className="text-ink-muted">Hazırlıq</dt><dd className="font-medium text-ink">{configured ? "API əməliyyatlarına hazır" : "Secret-lər tamamlanmalıdır"}</dd></div></dl></AdminCard>
      <AdminForm action={submitSitemapToSearchConsole} submitLabel="Sitemap-i GSC-yə göndər"><FormSection title="Sitemap submission" description="Təsdiqlənmiş Search Console property-yə sitemap index URL-i göndərilir."><FullWidth><AdminInput name="sitemap" label="Sitemap URL" type="url" defaultValue={siteUrl("/sitemap.xml")} required /></FullWidth></FormSection></AdminForm></div>
  </>;
}
