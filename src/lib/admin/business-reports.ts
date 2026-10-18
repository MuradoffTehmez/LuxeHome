import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { getFeatureFlags } from "@/lib/feature-flags";
import { pricingMode, PLAN_CODES, type PlanCode } from "@/lib/subscriptions/plan-policy";
import {
  ACCOUNT_TYPES,
  LISTING_TYPES,
  PAYMENT_KINDS,
  PAYMENT_STATUSES,
  PROMOTION_STATUSES,
  PROPERTY_STATUSES,
  PUBLIC_PROPERTY_STATUSES,
  REPORT_RESOLUTIONS,
  REPORT_STATUSES,
  SUBSCRIPTION_SOURCES,
  SUBSCRIPTION_STATUSES,
  VIP_REQUEST_STATUSES,
} from "@/lib/constants";
import { median, monthlyRecurringMinor, monthWindows, percent, PRICE_TREND_MIN_SAMPLES } from "./business-reports-math";

/** Hesabatların dövrü — son 6 təqvim ayı (Bakı vaxtı). */
export const REPORT_MONTHS = 6;
const DAY = 86_400_000;
/** Qiymət trendi və axtarış marağı üçün oxunan sətirlərin yuxarı həddi (Worker yaddaşı). */
const SAMPLE_LIMIT = 5000;
const TOP_LIMIT = 8;

const MONTHLY_METRICS = ["registrations", "newListings", "reports", "confirmedFakes", "newAgencies", "vipGrants", "leads"] as const;
export type MonthlyMetric = (typeof MONTHLY_METRICS)[number];

/** Saxta elan təsdiqi: şikayət təsdiqlənib və elana tədbir görülüb (`NO_ACTION` deyil). */
const CONFIRMED_FAKE_RESOLUTIONS = [REPORT_RESOLUTIONS.ARCHIVED, REPORT_RESOLUTIONS.MARKED_CLOSED, REPORT_RESOLUTIONS.LISTING_FIXED];

function countIn(metric: MonthlyMetric, start: Date, end: Date): Promise<number> {
  const range = { gte: start, lt: end };
  switch (metric) {
    case "registrations":
      return prisma.user.count({ where: { accountType: { not: ACCOUNT_TYPES.STAFF }, createdAt: range } });
    case "newListings":
      return prisma.property.count({ where: { isDemo: false, createdAt: range } });
    case "reports":
      return prisma.listingReport.count({ where: { createdAt: range } });
    case "confirmedFakes":
      return prisma.listingReport.count({ where: { status: REPORT_STATUSES.RESOLVED, resolution: { in: CONFIRMED_FAKE_RESOLUTIONS }, resolvedAt: range } });
    case "newAgencies":
      return prisma.agency.count({ where: { isDemo: false, isVerified: true, verifiedAt: range } });
    case "vipGrants":
      return prisma.vipRequest.count({ where: { startsAt: range, status: { in: [VIP_REQUEST_STATUSES.APPROVED, VIP_REQUEST_STATUSES.EXPIRED, VIP_REQUEST_STATUSES.REVOKED] } } });
    case "leads":
      return prisma.lead.count({ where: { createdAt: range } });
  }
}

/** Fərqli istifadəçi sayı (ictimai sessiyalar, son aktivlik `lastSeenAt`). */
async function activeUsers(since: Date): Promise<number> {
  const rows = await prisma.session.findMany({ where: { authKind: "PUBLIC", lastSeenAt: { gte: since } }, select: { userId: true }, distinct: ["userId"] });
  return rows.length;
}

/**
 * Platforma analitikası (PRD 22.1): DAU/WAU/MAU, aylıq dinamika (qeydiyyat, yeni elan, şikayət, təsdiqlənmiş saxta elan,
 * agentlik artımı, VIP, müraciət) və cari aktiv elan sayı.
 */
export async function getPlatformAnalytics(now = new Date()) {
  const windows = monthWindows(REPORT_MONTHS, now);
  const [dau, wau, mau, activeListings, totalUsers, verifiedAgencies, series] = await Promise.all([
    activeUsers(new Date(now.getTime() - DAY)),
    activeUsers(new Date(now.getTime() - 7 * DAY)),
    activeUsers(new Date(now.getTime() - 30 * DAY)),
    prisma.property.count({ where: { deletedAt: null, isDemo: false, status: { in: PUBLIC_PROPERTY_STATUSES } } }),
    prisma.user.count({ where: { accountType: { not: ACCOUNT_TYPES.STAFF } } }),
    prisma.agency.count({ where: { isDemo: false, isVerified: true } }),
    Promise.all(MONTHLY_METRICS.map((metric) => Promise.all(windows.map((window) => countIn(metric, window.start, window.end))))),
  ]);
  const monthly = windows.map((window, index) => ({
    month: window.key,
    ...(Object.fromEntries(MONTHLY_METRICS.map((metric, m) => [metric, series[m][index]])) as Record<MonthlyMetric, number>),
  }));
  return { dau, wau, mau, stickiness: percent(dau, mau), activeListings, totalUsers, verifiedAgencies, monthly };
}

/**
 * Biznes göstəriciləri (PRD 22.2): plan üzrə aktiv abunələr, ödənişliyə keçid və yenilənmə faizi, gəlir və MRR/ARR.
 * Ödəniş qəbul edilmirsə (`pricingMode().checkout = false`) gəlir göstəriciləri `0`-dır və `revenueActive = false`
 * («aktiv deyil») — tanıtım mərhələsində uydurma gəlir rəqəmi göstərilmir.
 */
export async function getBusinessIndicators(now = new Date()) {
  const flags = await getFeatureFlags();
  const mode = pricingMode(flags);
  const live = { endsAt: { gt: now } };
  const activeWhere = { OR: [{ status: SUBSCRIPTION_STATUSES.ACTIVE, ...live }, { status: SUBSCRIPTION_STATUSES.TRIALING, ...live }] };
  const monthStart = monthWindows(1, now)[0].start;
  const [planRows, trialing, subscribers, paidSubscribers, paidRows] = await Promise.all([
    prisma.subscription.groupBy({ by: ["planCode"], where: activeWhere, _count: { _all: true } }),
    prisma.subscription.count({ where: { status: SUBSCRIPTION_STATUSES.TRIALING, ...live } }),
    prisma.subscription.findMany({ select: { userId: true }, distinct: ["userId"] }),
    prisma.subscription.groupBy({ by: ["userId"], where: { source: SUBSCRIPTION_SOURCES.PAYMENT }, _count: { _all: true } }),
    prisma.subscription.findMany({ where: { source: SUBSCRIPTION_SOURCES.PAYMENT, status: SUBSCRIPTION_STATUSES.ACTIVE, ...live }, select: { id: true, months: true }, take: SAMPLE_LIMIT }),
  ]);
  const byPlan = Object.fromEntries(PLAN_CODES.map((code) => [code, 0])) as Record<PlanCode, number>;
  for (const row of planRows) if (row.planCode in byPlan) byPlan[row.planCode as PlanCode] = row._count._all;
  const paidUsers = paidSubscribers.length;
  const renewedUsers = paidSubscribers.filter((row) => row._count._all >= 2).length;

  let revenueMonthMinor = 0;
  let mrrMinor = 0;
  if (mode.checkout) {
    const [charges, refunds, lastCharges] = await Promise.all([
      prisma.paymentTransaction.aggregate({ where: { kind: PAYMENT_KINDS.CHARGE, status: { in: [PAYMENT_STATUSES.SUCCEEDED, PAYMENT_STATUSES.REFUNDED] }, createdAt: { gte: monthStart } }, _sum: { amountMinor: true } }),
      prisma.paymentTransaction.aggregate({ where: { status: PAYMENT_STATUSES.REFUNDED, refundedAt: { gte: monthStart } }, _sum: { amountMinor: true } }),
      findManyInChunks(paidRows.map((row) => row.id), 0, (chunk) =>
        prisma.paymentTransaction.findMany({
          where: { subscriptionId: { in: chunk }, kind: PAYMENT_KINDS.CHARGE, status: PAYMENT_STATUSES.SUCCEEDED },
          orderBy: { createdAt: "desc" },
          select: { subscriptionId: true, amountMinor: true },
        })),
    ]);
    revenueMonthMinor = Math.max(0, (charges._sum.amountMinor ?? 0) - (refunds._sum.amountMinor ?? 0));
    const latest = new Map<string, number>();
    for (const row of lastCharges) if (row.subscriptionId && !latest.has(row.subscriptionId)) latest.set(row.subscriptionId, row.amountMinor);
    mrrMinor = monthlyRecurringMinor(paidRows.filter((row) => latest.has(row.id)).map((row) => ({ amountMinor: latest.get(row.id)!, months: row.months })));
  }

  const [activeVip, activePromotions] = await Promise.all([
    prisma.vipRequest.count({ where: { status: VIP_REQUEST_STATUSES.APPROVED, endsAt: { gt: now } } }),
    prisma.promotionCampaign.count({ where: { status: PROMOTION_STATUSES.ACTIVE, endsAt: { gt: now } } }),
  ]);

  return {
    revenueActive: mode.checkout,
    promo: mode.promo,
    byPlan,
    trialing,
    conversionRate: percent(paidUsers, subscribers.length),
    renewalRate: percent(renewedUsers, paidUsers),
    activeVip,
    activePromotions,
    // VIP və irəli çəkmə hələ ödənişsiz verilir (sorğu + admin təsdiqi) — gəlir yalnız ödəniş axını açılanda yaranacaq.
    vipRevenueMinor: 0,
    promotionRevenueMinor: 0,
    revenueMonthMinor,
    mrrMinor,
    arrMinor: mrrMinor * 12,
  };
}

type NameRow = { id: string; count: number };

async function withLocationNames(rows: NameRow[]) {
  const names = await findManyInChunks(rows.map((row) => row.id), 0, (chunk) => prisma.location.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true } }));
  const nameOf = new Map(names.map((row) => [row.id, row.name]));
  return rows.map((row) => ({ ...row, name: nameOf.get(row.id) ?? "—" }));
}

/**
 * Coğrafi hesabatlar (PRD 22.3): aktiv elan üzrə şəhər və ərazilər, saxlanılmış axtarışlarda ən çox seçilən ərazilər,
 * satış/kirayə nisbəti, son 30 gündə növ üzrə baxış marağı və satış elanlarının aylıq m² median qiyməti (AZN).
 * Hamısı yalnız saytdakı qeydlərdəndir — kənar bazar rəqəmi uydurulmur.
 */
export async function getGeographicReports(now = new Date()) {
  const publicWhere = { deletedAt: null, isDemo: false, status: { in: PUBLIC_PROPERTY_STATUSES } };
  const windows = monthWindows(REPORT_MONTHS, now);
  const sinceDay = new Date(now.getTime() - 30 * DAY).toISOString().slice(0, 10);
  const [cityRows, districtRows, typeRows, savedSearches, typeViews, priceRows] = await Promise.all([
    prisma.property.groupBy({ by: ["cityId"], where: publicWhere, _count: { _all: true }, orderBy: { _count: { cityId: "desc" } }, take: TOP_LIMIT }),
    prisma.property.groupBy({ by: ["districtId"], where: { ...publicWhere, districtId: { not: null } }, _count: { _all: true }, orderBy: { _count: { districtId: "desc" } }, take: TOP_LIMIT }),
    prisma.property.groupBy({ by: ["listingType"], where: publicWhere, _count: { _all: true } }),
    prisma.savedSearch.findMany({ orderBy: { createdAt: "desc" }, take: SAMPLE_LIMIT, select: { filters: true } }),
    prisma.$queryRawUnsafe<{ typeId: string; views: number }[]>(
      `SELECT p."typeId" AS typeId, COALESCE(SUM(s."views"), 0) AS views
         FROM "PropertyDailyStat" s JOIN "Property" p ON p."id" = s."propertyId"
        WHERE s."day" >= ? AND p."isDemo" = 0
        GROUP BY p."typeId" ORDER BY views DESC LIMIT ?`,
      sinceDay,
      TOP_LIMIT,
    ),
    prisma.property.findMany({
      where: {
        deletedAt: null,
        isDemo: false,
        listingType: LISTING_TYPES.SALE,
        currency: "AZN",
        area: { gt: 0 },
        status: { in: [...PUBLIC_PROPERTY_STATUSES, PROPERTY_STATUSES.SOLD] },
        createdAt: { gte: windows[0].start },
      },
      orderBy: { createdAt: "desc" },
      take: SAMPLE_LIMIT,
      select: { price: true, area: true, createdAt: true },
    }),
  ]);

  // Saxlanılmış axtarışlarda seçilən şəhər/ərazi slug-ları (pozulmuş JSON atlanır).
  const searched = new Map<string, number>();
  for (const row of savedSearches) {
    try {
      const filters = JSON.parse(row.filters) as { citySlug?: unknown; districtSlug?: unknown };
      const slug = typeof filters.districtSlug === "string" ? filters.districtSlug : typeof filters.citySlug === "string" ? filters.citySlug : null;
      if (slug) searched.set(slug, (searched.get(slug) ?? 0) + 1);
    } catch {
      // keç
    }
  }
  const topSearched = [...searched.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_LIMIT);
  const [searchedNames, typeNames, cities, districts] = await Promise.all([
    findManyInChunks(topSearched.map(([slug]) => slug), 0, (chunk) => prisma.location.findMany({ where: { slug: { in: chunk } }, select: { slug: true, name: true } })),
    findManyInChunks(typeViews.map((row) => row.typeId), 0, (chunk) => prisma.propertyType.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true } })),
    withLocationNames(cityRows.map((row) => ({ id: row.cityId, count: row._count._all }))),
    withLocationNames(districtRows.filter((row) => row.districtId).map((row) => ({ id: row.districtId!, count: row._count._all }))),
  ]);
  const searchedName = new Map(searchedNames.map((row) => [row.slug, row.name]));
  const typeName = new Map(typeNames.map((row) => [row.id, row.name]));

  const sale = typeRows.find((row) => row.listingType === LISTING_TYPES.SALE)?._count._all ?? 0;
  const rent = typeRows.find((row) => row.listingType === LISTING_TYPES.RENT)?._count._all ?? 0;

  const priceTrend = windows.map((window) => {
    const values = priceRows.filter((row) => row.createdAt >= window.start && row.createdAt < window.end).map((row) => row.price / (row.area ?? 1));
    return { month: window.key, samples: values.length, medianPerSqm: values.length >= PRICE_TREND_MIN_SAMPLES ? Math.round(median(values) ?? 0) : null };
  });

  return {
    cities,
    districts,
    searchedAreas: topSearched.map(([slug, count]) => ({ slug, count, name: searchedName.get(slug) ?? slug })),
    savedSearchSample: savedSearches.length,
    sale,
    rent,
    saleShare: percent(sale, sale + rent),
    typeInterest: typeViews.map((row) => ({ id: row.typeId, name: typeName.get(row.typeId) ?? "—", views: Number(row.views) })),
    priceTrend,
  };
}
