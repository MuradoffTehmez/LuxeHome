import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Media SEO" };
export const dynamic = "force-dynamic";
export default async function MediaSeoAdminPage() {
  const media = await prisma.media.findMany({ where: { OR: [{ alt: "" }, { mimeType: { not: "image/webp" } }, { watermarkApplied: false }, { checksum: null }] }, orderBy: { createdAt: "desc" }, take: 200 });
  return <><AdminPageHeader title="Media SEO" description="WebP, watermark, checksum, semantic filename və alt keyfiyyəti üzrə asset auditı." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Media SEO" }]} />
    <AdminCard title="Diqqət tələb edən media" description={`${media.length} asset`}><ul className="divide-y divide-line">{media.map((item) => { const problems = [!item.alt && "alt yoxdur", item.mimeType !== "image/webp" && "WebP deyil", !item.watermarkApplied && "watermark yoxdur", !item.checksum && "checksum yoxdur"].filter(Boolean); return <li key={item.id} className="py-3"><p className="break-all font-medium text-ink">{item.originalName}</p><p className="text-xs text-ink-muted">{problems.join(" · ")} · {(item.size / 1024).toFixed(0)} KB</p></li>; })}{media.length === 0 && <li className="py-3 text-sm text-ink-muted">Media SEO qaydalarını pozan asset yoxdur.</li>}</ul></AdminCard>
  </>;
}
