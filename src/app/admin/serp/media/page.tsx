import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.mediaSeo") };
}
export const dynamic = "force-dynamic";
export default async function MediaSeoAdminPage() {
  const t = await getAdminT();
  const media = await prisma.media.findMany({ where: { OR: [{ alt: "" }, { mimeType: { not: "image/webp" } }, { watermarkApplied: false }, { checksum: null }] }, orderBy: { createdAt: "desc" }, take: 200 });
  return <><AdminPageHeader title={t("pages.serp.mediaSeo")} description={t("pages.serp.webpWatermarkChecksumSemantic")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.mediaSeo") }]} />
    <AdminCard title={t("pages.serp.diqqetTelebEdenMedia")} description={t("pages.misc.assetSayi", { count: media.length })}><ul className="divide-y divide-line">{media.map((item) => { const problems = [!item.alt && t("pages.misc.altYoxdur"), item.mimeType !== "image/webp" && t("pages.misc.webpDeyil"), !item.watermarkApplied && t("pages.misc.watermarkYoxdur"), !item.checksum && t("pages.misc.checksumYoxdur")].filter(Boolean); return <li key={item.id} className="py-3"><p className="break-all font-medium text-ink">{item.originalName}</p><p className="text-xs text-ink-muted">{problems.join(" · ")} · {(item.size / 1024).toFixed(0)} KB</p></li>; })}{media.length === 0 && <li className="py-3 text-sm text-ink-muted">{t("pages.serp.mediaSeoQaydalariniPozan")}</li>}</ul></AdminCard>
  </>;
}
