import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Crown, Package, Settings2, TrendingUp, Wallet } from "lucide-react";
import { AdminCard, AdminPageHeader, StatCard } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { requireAdminRead } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/auth/permissions";
import { PACKAGE_ORDER_STATUSES, PERMISSIONS, PROMOTION_STATUSES, VIP_REQUEST_STATUSES } from "@/lib/constants";
import { formatLocalizedDate } from "@/i18n/date";
import { findManyInChunks } from "@/lib/d1-chunks";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.promotionHub.title"), robots: { index: false, follow: false } };
}

const HISTORY_LIMIT = 12;
const STATUS_TONE: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  PENDING: "warning",
  APPROVED: "success",
  ACTIVE: "success",
  REJECTED: "danger",
  REVOKED: "danger",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
};

/**
 * Elanların təşviqi — ümumi baxış. VIP (#248), irəli çəkmə (#250) və premium paketlər (#109) ayrı biznes
 * qaydaları və ayrı cədvəllərlə qalır; bu səhifə yalnız növbələri, aktiv təşviqləri və son qərarları bir
 * yerdə göstərir və hər qərar üçün öz moduluna aparır. Yazma əməliyyatı yoxdur.
 */
export default async function PromotionHubPage() {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  const actor = await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const canBilling = hasPermission(actor.role, PERMISSIONS.BILLING_MANAGE);
  const now = new Date();

  const [pendingVip, activeVip, pendingPromotions, activePromotions, pendingOrders, awaitingActivation, vipHistory, promotionHistory] = await Promise.all([
    prisma.vipRequest.count({ where: { status: VIP_REQUEST_STATUSES.PENDING } }),
    prisma.vipRequest.count({ where: { status: VIP_REQUEST_STATUSES.APPROVED, endsAt: { gt: now } } }),
    prisma.promotionCampaign.count({ where: { status: PROMOTION_STATUSES.PENDING } }),
    prisma.promotionCampaign.count({ where: { status: PROMOTION_STATUSES.ACTIVE, endsAt: { gt: now } } }),
    canBilling ? prisma.packageOrder.count({ where: { status: PACKAGE_ORDER_STATUSES.PENDING } }) : Promise.resolve(0),
    canBilling ? prisma.packageOrder.count({ where: { status: PACKAGE_ORDER_STATUSES.PAID, activatedAt: null } }) : Promise.resolve(0),
    prisma.vipRequest.findMany({
      where: { status: { not: VIP_REQUEST_STATUSES.PENDING } },
      orderBy: { updatedAt: "desc" },
      take: HISTORY_LIMIT,
      select: { id: true, propertyId: true, status: true, updatedAt: true, endsAt: true },
    }),
    prisma.promotionCampaign.findMany({
      where: { status: { not: PROMOTION_STATUSES.PENDING } },
      orderBy: { updatedAt: "desc" },
      take: HISTORY_LIMIT,
      select: { id: true, propertyId: true, status: true, updatedAt: true, endsAt: true },
    }),
  ]);

  // Vaxtı keçmiş, amma baxım işi hələ toxunmamış aktiv dövr «bitib» göstərilir — modul səhifələri ilə eyni qayda.
  const history = [
    ...vipHistory.map((row) => ({ ...row, kind: "vip" as const, status: row.status === VIP_REQUEST_STATUSES.APPROVED && row.endsAt && row.endsAt <= now ? VIP_REQUEST_STATUSES.EXPIRED : row.status })),
    ...promotionHistory.map((row) => ({ ...row, kind: "promotion" as const, status: row.status === PROMOTION_STATUSES.ACTIVE && row.endsAt && row.endsAt <= now ? PROMOTION_STATUSES.EXPIRED : row.status })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, HISTORY_LIMIT);
  const properties = await findManyInChunks([...new Set(history.map((row) => row.propertyId))], 0, (chunk) =>
    prisma.property.findMany({ where: { id: { in: chunk } }, select: { id: true, title: true } }));
  const titleOf = new Map(properties.map((row) => [row.id, row.title]));

  type ModuleKey = "vip" | "promotion" | "packages";
  const modules: { key: ModuleKey; href: string; icon: typeof Crown; pending: number; active: number; queueHref: string }[] = [
    { key: "vip", href: "/admin/vip", icon: Crown, pending: pendingVip, active: activeVip, queueHref: "/admin/vip#sorgular" },
    { key: "promotion", href: "/admin/irelicekme", icon: TrendingUp, pending: pendingPromotions, active: activePromotions, queueHref: "/admin/irelicekme" },
    ...(canBilling ? [{ key: "packages" as const, href: "/admin/paketler", icon: Package, pending: pendingOrders, active: awaitingActivation, queueHref: "/admin/paketler" }] : []),
  ];

  return (
    <>
      <AdminPageHeader title={t("pages.promotionHub.title")} description={t("pages.promotionHub.description")} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={Clock} tone="warning" label={t("pages.promotionHub.stats.pending")} value={pendingVip + pendingPromotions} hint={t("pages.promotionHub.stats.pendingHint")} />
        <StatCard icon={Crown} tone="gold" label={t("pages.promotionHub.stats.activeVip")} value={activeVip} href="/admin/vip" />
        <StatCard icon={TrendingUp} tone="success" label={t("pages.promotionHub.stats.activePromotions")} value={activePromotions} href="/admin/irelicekme" />
        {canBilling && <StatCard icon={Wallet} label={t("pages.promotionHub.stats.pendingOrders")} value={pendingOrders} href="/admin/paketler" />}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <AdminCard title={t("pages.promotionHub.modulesTitle")} description={t("pages.promotionHub.modulesDescription")}>
          <ul className="flex flex-col divide-y divide-line">
            {modules.map(({ key, href, icon: Icon, pending, active, queueHref }) => (
              <li key={key} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-beige text-ink-soft">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={href} className="font-medium text-ink hover:text-gold-deep">{t(`pages.promotionHub.modules.${key}.title`)}</Link>
                  <p className="text-xs text-ink-muted">{t(`pages.promotionHub.modules.${key}.hint`)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {pending > 0 && (
                    <Link href={queueHref} className="inline-flex min-h-11 items-center">
                      <Badge tone="warning">{t(`pages.promotionHub.modules.${key}.pending`, { count: pending })}</Badge>
                    </Link>
                  )}
                  <Badge tone="neutral">{t(`pages.promotionHub.modules.${key}.active`, { count: active })}</Badge>
                  <Link href={href} aria-label={t(`pages.promotionHub.modules.${key}.title`)} className="grid size-11 place-items-center rounded-md text-ink-muted hover:bg-beige hover:text-ink">
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4 text-sm">
            <Settings2 className="size-4 text-ink-muted" aria-hidden="true" />
            <span className="text-ink-soft">{t("pages.promotionHub.settingsHint")}</span>
            <Link href="/admin/funksiyalar" className="font-medium text-gold-deep hover:text-ink">{t("pages.promotionHub.settingsLink")}</Link>
          </div>
        </AdminCard>

        <AdminCard title={t("pages.promotionHub.historyTitle")} description={t("pages.promotionHub.historyDescription")}>
          {history.length === 0 ? (
            <p className="text-sm text-ink-muted">{t("pages.promotionHub.historyEmpty")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {history.map((row) => (
                <li key={`${row.kind}-${row.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{titleOf.get(row.propertyId) ?? "—"}</p>
                    <p className="text-xs text-ink-muted">
                      {t(`pages.promotionHub.kind.${row.kind}`)} · {formatLocalizedDate(row.updatedAt, locale, "short")}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
                    {row.kind === "vip" ? t(`pages.vip.status.${row.status as "PENDING"}`) : t(`pages.promotion.status.${row.status as "PENDING"}`)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </>
  );
}
