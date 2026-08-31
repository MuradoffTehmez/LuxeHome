import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { organizationSchema } from "@/lib/seo";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.structuredData") };
}
export const dynamic = "force-dynamic";
export default async function SchemaAdminPage() {
  const t = await getAdminT();
  const entities = await prisma.entityProfile.findMany({ where: { isPublic: true }, orderBy: [{ entityType: "asc" }, { name: "asc" }], take: 100 });
  return <><AdminPageHeader title={t("pages.serp.structuredData")} description={t("pages.serp.merkeziJsonLdGeneratorunun")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.structuredData") }]} />
    <div className="grid gap-6 xl:grid-cols-2"><AdminCard title={t("pages.serp.organizationJsonLd")} description={t("pages.serp.publicRootLayoutDa")}><pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xs bg-navy p-4 text-xs text-ivory">{JSON.stringify(organizationSchema(), null, 2)}</pre></AdminCard>
      <AdminCard title={t("pages.serp.publicEntityRegistry")} description={`${entities.length} entity`}><ul className="divide-y divide-line">{entities.map((entity) => <li key={entity.id} className="py-3"><p className="font-medium text-ink">{entity.name}</p><p className="text-xs text-ink-muted">{entity.entityType} · {entity.schemaType} · {entity.locale}</p><pre className="mt-2 overflow-auto text-xs text-ink-soft">{entity.dataJson}</pre></li>)}{entities.length === 0 && <li className="py-3 text-sm text-ink-muted">{t("pages.serp.publicEntityOverrideI")}</li>}</ul></AdminCard></div>
  </>;
}
