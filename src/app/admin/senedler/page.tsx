import type { Metadata } from "next";
import { Ban, CheckCircle2, ShieldCheck } from "lucide-react";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { ReasonAction } from "@/components/admin/reason-action";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS, PROPERTY_DOCUMENT_RETENTION_DAYS, PROPERTY_DOCUMENT_STATUSES } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { formatLocalizedDateTime } from "@/i18n/date";
import { localizePath } from "@/i18n/path-locale";
import { approveDocuments, rejectDocuments, toggleDataVerified } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.verification.title"), robots: { index: false, follow: false } };
}

/**
 * Sənəd yoxlaması növbəsi (#256, PRD Modul 17): gözləyən sənədi olan elanlar, şəkillər (qorunan marşrutdan,
 * hər baxış tarixçəyə düşür), təsdiq/rədd və «Məlumatlar yoxlanılıb» açarı; son giriş tarixçəsi.
 */
export default async function VerificationPage() {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const documents = await prisma.propertyDocument.findMany({
    where: { status: PROPERTY_DOCUMENT_STATUSES.PENDING },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, propertyId: true, kind: true, createdAt: true, size: true },
  });
  const propertyIds = [...new Set(documents.map((row) => row.propertyId))];
  const [properties, logs] = await Promise.all([
    findManyInChunks(propertyIds, 0, (chunk) =>
      prisma.property.findMany({ where: { id: { in: chunk } }, select: { id: true, title: true, slug: true, documentStatus: true, documentsVerifiedAt: true, dataVerifiedAt: true } })),
    prisma.documentAccessLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const staff = await findManyInChunks([...new Set(logs.map((row) => row.userId))], 0, (chunk) =>
    prisma.user.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true } }));
  const nameOf = new Map(staff.map((row) => [row.id, row.name]));
  const propertyOf = new Map(properties.map((row) => [row.id, row]));
  const groups = propertyIds.map((id) => ({ property: propertyOf.get(id), documents: documents.filter((row) => row.propertyId === id) }));

  return (
    <>
      <AdminPageHeader title={t("pages.verification.title")} description={t("pages.verification.description", { days: PROPERTY_DOCUMENT_RETENTION_DAYS })} />
      <AdminCard title={t("pages.verification.queue")}>
        {groups.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.verification.empty")}</p> : (
          <ul className="flex flex-col gap-4">
            {groups.map(({ property, documents: rows }) => property && (
              <li key={property.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <a href={localizePath(`/emlaklar/${property.slug}`, locale)} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-gold-deep [overflow-wrap:anywhere]">{property.title}</a>
                    <p className="mt-1 flex flex-wrap gap-2 text-xs">
                      {property.documentsVerifiedAt && <Badge tone="success">{t("pages.verification.documentsVerified")}</Badge>}
                      {property.dataVerifiedAt && <Badge tone="success">{t("pages.verification.dataVerified")}</Badge>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ConfirmAction action={approveDocuments} id={property.id} tone="neutral" label={t("pages.verification.approve")} title={t("pages.verification.approveTitle")} description={t("pages.verification.approveDescription")} confirmLabel={t("pages.verification.approve")}>
                      <CheckCircle2 className="size-4" />
                    </ConfirmAction>
                    <ReasonAction action={rejectDocuments} id={property.id} label={t("pages.verification.reject")} title={t("pages.verification.rejectTitle")} description={t("pages.verification.rejectDescription")} confirmLabel={t("pages.verification.reject")}>
                      <Ban className="size-4" />
                    </ReasonAction>
                    <ConfirmAction action={toggleDataVerified} id={property.id} tone="neutral" label={t("pages.verification.toggleData")} title={t("pages.verification.toggleData")} description={t("pages.verification.toggleDataDescription")} confirmLabel={t("pages.verification.toggleData")}>
                      <ShieldCheck className="size-4" />
                    </ConfirmAction>
                  </div>
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {rows.map((row) => (
                    <li key={row.id} className="rounded-sm border border-line p-2 text-xs">
                      <a href={`/api/admin/senedler/${row.id}`} target="_blank" rel="noreferrer" className="font-medium text-gold-deep hover:underline">{t("pages.verification.open")}</a>
                      <span className="mt-1 block text-ink-muted">{t(`pages.verification.kinds.${row.kind as "TITLE_DEED"}`)}</span>
                      <span className="block text-ink-muted">{formatLocalizedDateTime(row.createdAt, locale)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
      <AdminCard title={t("pages.verification.log")} description={t("pages.verification.logDescription")} className="mt-6">
        {logs.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.verification.emptyLog")}</p> : (
          <ul className="divide-y divide-line text-sm">
            {logs.map((row) => (
              <li key={row.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{nameOf.get(row.userId) ?? t("pages.verification.owner")} · {t(`pages.verification.actions.${row.action as "VIEW"}`)}</span>
                <span className="text-xs text-ink-muted">{formatLocalizedDateTime(row.createdAt, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
