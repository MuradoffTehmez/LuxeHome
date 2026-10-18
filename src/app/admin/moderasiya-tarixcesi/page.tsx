import type { Metadata } from "next";
import Link from "next/link";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS, PROPERTY_STATUS_SOURCES, type PropertyStatus } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { formatLocalizedDateTime } from "@/i18n/date";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.moderationHistory.title"), robots: { index: false, follow: false } };
}

const PAGE_SIZE = 50;

/**
 * Moderasiya tarixçəsi (#260, PRD Modul 19 «Təhlükəsizlik»): moderator qərarları ilə elan status keçidləri
 * (səbəb və qərarverən) və hesab tədbirləri — bir yerdə, ən yeni əvvəl.
 */
export default async function ModerationHistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const raw = (await searchParams).sehife;
  const page = Math.max(1, Number(typeof raw === "string" ? raw : 1) || 1);
  const [rows, total, restrictions] = await Promise.all([
    prisma.propertyStatusHistory.findMany({
      where: { source: PROPERTY_STATUS_SOURCES.MODERATION },
      orderBy: { changedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, propertyId: true, fromStatus: true, toStatus: true, note: true, changedById: true, changedAt: true },
    }),
    prisma.propertyStatusHistory.count({ where: { source: PROPERTY_STATUS_SOURCES.MODERATION } }),
    page === 1 ? prisma.accountRestriction.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { id: true, userId: true, kind: true, reason: true, createdById: true, createdAt: true, liftedAt: true } }) : Promise.resolve([]),
  ]);
  const [properties, users] = await Promise.all([
    findManyInChunks([...new Set(rows.map((row) => row.propertyId))], 0, (chunk) => prisma.property.findMany({ where: { id: { in: chunk } }, select: { id: true, title: true } })),
    findManyInChunks([...new Set([...rows.map((row) => row.changedById), ...restrictions.flatMap((row) => [row.userId, row.createdById])].filter((id): id is string => Boolean(id)))], 0, (chunk) =>
      prisma.user.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true } })),
  ]);
  const titleOf = new Map(properties.map((row) => [row.id, row.title]));
  const nameOf = new Map(users.map((row) => [row.id, row.name]));
  const status = (value: string | null) => (value ? t(`labels.propertyStatus.${value as PropertyStatus}`) : "—");
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader title={t("pages.moderationHistory.title")} description={t("pages.moderationHistory.description")} />
      {restrictions.length > 0 && (
        <AdminCard title={t("pages.moderationHistory.restrictions")} className="mb-6">
          <ul className="divide-y divide-line text-sm">
            {restrictions.map((row) => (
              <li key={row.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="min-w-0">
                  <span className="font-medium text-ink">{nameOf.get(row.userId) ?? "—"}</span> · {t(`pages.trust.kinds.${row.kind as "WARNING"}`)}
                  <span className="block text-xs text-ink-muted [overflow-wrap:anywhere]">{row.reason}</span>
                </span>
                <span className="text-xs text-ink-muted">{formatLocalizedDateTime(row.createdAt, locale)} · {nameOf.get(row.createdById) ?? "—"}{row.liftedAt ? ` · ${t("pages.trust.inactive")}` : ""}</span>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
      <AdminCard title={t("pages.moderationHistory.decisions")} description={t("pages.moderationHistory.total", { count: total })}>
        {rows.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.moderationHistory.empty")}</p> : (
          <ul className="divide-y divide-line text-sm">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                <span className="min-w-0">
                  <Link href={`/admin/emlaklar/${row.propertyId}`} className="font-medium text-ink hover:text-gold-deep [overflow-wrap:anywhere]">{titleOf.get(row.propertyId) ?? row.propertyId}</Link>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge tone="neutral">{status(row.fromStatus)}</Badge>→<Badge tone="warning">{status(row.toStatus)}</Badge>
                  </span>
                  {row.note && <span className="mt-1 block text-xs text-ink-soft [overflow-wrap:anywhere]">{row.note}</span>}
                </span>
                <span className="text-xs text-ink-muted">{formatLocalizedDateTime(row.changedAt, locale)} · {nameOf.get(row.changedById ?? "") ?? t("pages.moderationHistory.system")}</span>
              </li>
            ))}
          </ul>
        )}
        {pages > 1 && (
          <div className="mt-4 flex justify-between text-sm">
            {page > 1 ? <Link href={`?sehife=${page - 1}`} className="text-gold-deep hover:underline">{t("pages.moderationHistory.prev")}</Link> : <span />}
            {page < pages ? <Link href={`?sehife=${page + 1}`} className="text-gold-deep hover:underline">{t("pages.moderationHistory.next")}</Link> : <span />}
          </div>
        )}
      </AdminCard>
    </>
  );
}
