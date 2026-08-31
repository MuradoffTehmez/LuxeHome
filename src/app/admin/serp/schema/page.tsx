import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { organizationSchema } from "@/lib/seo";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Structured data" };
export const dynamic = "force-dynamic";
export default async function SchemaAdminPage() {
  const entities = await prisma.entityProfile.findMany({ where: { isPublic: true }, orderBy: [{ entityType: "asc" }, { name: "asc" }], take: 100 });
  return <><AdminPageHeader title="Structured data" description="Mərkəzi JSON-LD generatorunun və semantic entity registry-sinin debug önbaxışı." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Structured data" }]} />
    <div className="grid gap-6 xl:grid-cols-2"><AdminCard title="Organization JSON-LD" description="Public root layout-da istifadə edilən real məlumat"><pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xs bg-navy p-4 text-xs text-ivory">{JSON.stringify(organizationSchema(), null, 2)}</pre></AdminCard>
      <AdminCard title="Public entity registry" description={`${entities.length} entity`}><ul className="divide-y divide-line">{entities.map((entity) => <li key={entity.id} className="py-3"><p className="font-medium text-ink">{entity.name}</p><p className="text-xs text-ink-muted">{entity.entityType} · {entity.schemaType} · {entity.locale}</p><pre className="mt-2 overflow-auto text-xs text-ink-soft">{entity.dataJson}</pre></li>)}{entities.length === 0 && <li className="py-3 text-sm text-ink-muted">Public entity override-i yoxdur; mərkəzi generator işləyir.</li>}</ul></AdminCard></div>
  </>;
}
