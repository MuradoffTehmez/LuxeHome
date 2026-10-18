import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  APPEAL_STATUSES,
  LISTING_RISK_THRESHOLDS,
  ACTIVE_REPORT_STATUSES,
  PROPERTY_STATUSES,
  PROMOTION_STATUSES,
  VIP_REQUEST_STATUSES,
} from "@/lib/constants";

/**
 * Admin dashboard-ın platforma və risk göstəriciləri (#260, PRD Modul 19 «Dashboard»): yeni istifadəçi və
 * elanlar (7 gün), aktiv agentliklər, açıq şikayət və etirazlar, riskli elan və hesablar, VIP/irəli çəkmə növbəsi.
 * Hər göstərici ayrıca `count`-dur — biri alınmasa digərləri göstərilir (0).
 */
export async function getPlatformIndicators(now = new Date()) {
  const week = new Date(now.getTime() - 7 * 86_400_000);
  const safe = (promise: Promise<number>) => promise.catch(() => 0);
  const [newUsers, newListings, activeAgencies, openReports, riskyListings, riskyAccounts, activeRestrictions, openAppeals, pendingVip, pendingPromotions, pendingDocuments] = await Promise.all([
    safe(prisma.user.count({ where: { accountType: { not: ACCOUNT_TYPES.STAFF }, createdAt: { gte: week } } })),
    safe(prisma.property.count({ where: { deletedAt: null, isDemo: false, createdAt: { gte: week } } })),
    safe(prisma.agency.count({ where: { isVerified: true, isDemo: false } })),
    safe(prisma.listingReport.count({ where: { status: { in: [...ACTIVE_REPORT_STATUSES] } } })),
    safe(prisma.property.count({ where: { deletedAt: null, riskScore: { gte: LISTING_RISK_THRESHOLDS.hold }, status: { in: [PROPERTY_STATUSES.PENDING, PROPERTY_STATUSES.PUBLISHED] } } })),
    safe(prisma.user.count({ where: { trustScore: { gte: 60 } } })),
    safe(prisma.accountRestriction.count({ where: { liftedAt: null, OR: [{ endsAt: null }, { endsAt: { gt: now } }] } })),
    safe(Promise.all([
      prisma.listingAppeal.count({ where: { status: APPEAL_STATUSES.OPEN } }),
      prisma.accountRestrictionAppeal.count({ where: { status: "OPEN" } }),
    ]).then(([a, b]) => a + b)),
    safe(prisma.vipRequest.count({ where: { status: VIP_REQUEST_STATUSES.PENDING } })),
    safe(prisma.promotionCampaign.count({ where: { status: PROMOTION_STATUSES.PENDING } })),
    safe(prisma.propertyDocument.count({ where: { status: "PENDING" } })),
  ]);
  return { newUsers, newListings, activeAgencies, openReports, riskyListings, riskyAccounts, activeRestrictions, openAppeals, pendingVip, pendingPromotions, pendingDocuments };
}
