import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { getAgencyRatings, getAgencyReviews } from "@/lib/agency-ratings";
import { periodStart } from "@/lib/accounts/listing-analytics";
import { countOverdueAgencyTasks } from "@/lib/accounts/agency-tasks";
import {
  ACTIVE_OFFER_STATUSES,
  ACTIVE_REPORT_STATUSES,
  AGENCY_EMPLOYEE_STATUSES,
  LEAD_STATUSES,
  PROPERTY_STATUSES,
  type AnalyticsPeriod,
} from "@/lib/constants";

/**
 * Agentlik idarəetmə panelinin ümumi göstəriciləri (#216, PRD 7.1).
 *
 * Hamısı yalnız agentliyin mühitinə aid elanlardan (`Property.agencyId`, #210) hesablanır — agentin
 * şəxsi elanı və ona gələn müraciət agentlik panelinə düşmür. Müraciət agentliyə ya birbaşa
 * (`Lead.agencyId`, profil forması və bölgü), ya da elan vasitəsilə bağlanır.
 */

const EXPIRY_SOON_DAYS = 7;
const TOP_LISTINGS = 5;
/** Cavabı gözlənilən müraciət: bağlanmayıb və ilk cavab yazılmayıb. */
const OPEN_LEAD_STATUSES = [LEAD_STATUSES.NEW, LEAD_STATUSES.CONTACTED, LEAD_STATUSES.IN_PROGRESS];

/**
 * Agentliyin müraciəti: birbaşa ona bağlı (`Lead.agencyId`) və ya agentliyə bağlanmamış köhnə müraciət
 * agentlik elanında. Elanın agentliyinə baxış yalnız `agencyId = null` üçündür — köçürmədən (#212) sonra
 * A-ya bağlı köhnə müraciətlər B-nin panelinə keçməməlidir.
 */
function agencyLeadWhere(agencyId: string): Prisma.LeadWhereInput {
  return { OR: [{ agencyId }, { agencyId: null, property: { agencyId } }] };
}

export async function getAgencyDashboard(input: { agencyId: string; ownerUserId: string; period: AnalyticsPeriod; now?: Date }) {
  const now = input.now ?? new Date();
  const start = periodStart(input.period, now);
  const { agencyId } = input;
  const listing = { agencyId, deletedAt: null } satisfies Prisma.PropertyWhereInput;
  const leadScope = agencyLeadWhere(agencyId);
  const unanswered: Prisma.LeadWhereInput = { AND: [leadScope, { respondedAt: null, status: { in: OPEN_LEAD_STATUSES } }] };

  const [
    activeListings,
    newListings,
    closedByStatus,
    employees,
    newLeads,
    unansweredLeads,
    stats,
    topRows,
    holdByStatus,
    openReports,
    expiringSoon,
    ratings,
    reviews,
    overdueTasks,
  ] = await Promise.all([
    prisma.property.count({ where: { ...listing, status: { in: [...ACTIVE_OFFER_STATUSES] } } }),
    prisma.property.count({ where: { ...listing, createdAt: { gte: start.at } } }),
    prisma.property.groupBy({
      by: ["status"],
      where: { ...listing, status: { in: [PROPERTY_STATUSES.SOLD, PROPERTY_STATUSES.RENTED] }, closedAt: { gte: start.at } },
      _count: { _all: true },
    }),
    prisma.agencyEmployee.findMany({
      where: { agencyId, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
      select: { userId: true, receivesLeads: true, suspendedAt: true, user: { select: { name: true, isActive: true } } },
      orderBy: { approvedAt: "asc" },
    }),
    prisma.lead.count({ where: { AND: [leadScope, { createdAt: { gte: start.at } }] } }),
    prisma.lead.count({ where: unanswered }),
    prisma.propertyDailyStat.aggregate({
      where: { day: { gte: start.day }, property: { agencyId } },
      _sum: { views: true, contactReveals: true, whatsappClicks: true, telegramClicks: true },
    }),
    prisma.propertyDailyStat.groupBy({
      by: ["propertyId"],
      where: { day: { gte: start.day }, property: { agencyId, deletedAt: null } },
      _sum: { views: true },
      orderBy: { _sum: { views: "desc" } },
      take: TOP_LISTINGS,
    }),
    prisma.property.groupBy({
      by: ["status"],
      where: { ...listing, status: { in: [PROPERTY_STATUSES.NEEDS_INFO, PROPERTY_STATUSES.SUSPENDED, PROPERTY_STATUSES.REJECTED] } },
      _count: { _all: true },
    }),
    prisma.listingReport.count({ where: { status: { in: [...ACTIVE_REPORT_STATUSES] }, property: { agencyId } } }),
    prisma.property.count({
      where: {
        ...listing,
        status: PROPERTY_STATUSES.PUBLISHED,
        listingExpiresAt: { gte: now, lte: new Date(now.getTime() + EXPIRY_SOON_DAYS * 86_400_000) },
      },
    }),
    getAgencyRatings([agencyId]),
    getAgencyReviews(agencyId, 3),
    countOverdueAgencyTasks(agencyId, now),
  ]);

  const topIds = topRows.filter((row) => (row._sum.views ?? 0) > 0).map((row) => row.propertyId);
  const topListings = topIds.length
    ? await prisma.property.findMany({ where: { id: { in: topIds } }, select: { id: true, title: true, slug: true, status: true, author: { select: { name: true } } } })
    : [];
  const viewsOf = new Map(topRows.map((row) => [row.propertyId, row._sum.views ?? 0]));

  const team = await getTeamActivity({
    agencyId,
    since: start.at,
    members: [
      { userId: input.ownerUserId, name: null, receivesLeads: true, isOwner: true, suspended: false },
      ...employees.filter((employee) => employee.user.isActive).map((employee) => ({
        userId: employee.userId, name: employee.user.name, receivesLeads: employee.receivesLeads, isOwner: false, suspended: employee.suspendedAt != null,
      })),
    ],
  });

  const countOf = <T extends { status: string; _count: { _all: number } }>(rows: T[], status: string) =>
    rows.find((row) => row.status === status)?._count._all ?? 0;

  return {
    period: input.period,
    listings: {
      active: activeListings,
      new: newListings,
      sold: countOf(closedByStatus, PROPERTY_STATUSES.SOLD),
      rented: countOf(closedByStatus, PROPERTY_STATUSES.RENTED),
    },
    // Girişi dayandırılmış agent (#218) aktiv sayılmır, amma cədvəldə nişanla görünür.
    agents: { active: employees.filter((employee) => employee.user.isActive && !employee.suspendedAt).length },
    leads: { new: newLeads, unanswered: unansweredLeads },
    engagement: {
      views: stats._sum.views ?? 0,
      contactClicks: (stats._sum.contactReveals ?? 0) + (stats._sum.whatsappClicks ?? 0) + (stats._sum.telegramClicks ?? 0),
      phoneReveals: stats._sum.contactReveals ?? 0,
      whatsappClicks: stats._sum.whatsappClicks ?? 0,
      telegramClicks: stats._sum.telegramClicks ?? 0,
    },
    topListings: topIds.flatMap((id) => {
      const property = topListings.find((item) => item.id === id);
      return property ? [{ ...property, views: viewsOf.get(id) ?? 0 }] : [];
    }),
    moderation: {
      needsInfo: countOf(holdByStatus, PROPERTY_STATUSES.NEEDS_INFO),
      suspended: countOf(holdByStatus, PROPERTY_STATUSES.SUSPENDED),
      rejected: countOf(holdByStatus, PROPERTY_STATUSES.REJECTED),
      openReports,
      expiringSoon,
      overdueTasks,
    },
    rating: ratings.get(agencyId) ?? null,
    reviews,
    team,
  };
}

type TeamMember = { userId: string; name: string | null; receivesLeads: boolean; isOwner: boolean; suspended: boolean };

/** Agentlər üzrə aktivlik: aktiv elan, dövrdə yeni müraciət, cavabsız müraciət, son jurnal qeydi. */
async function getTeamActivity(input: { agencyId: string; since: Date; members: TeamMember[] }) {
  const ids = input.members.map((member) => member.userId);
  const leadScope = agencyLeadWhere(input.agencyId);
  const [listings, newLeads, unanswered, lastSeen] = await Promise.all([
    findManyInChunks(ids, 3, (chunk) =>
      prisma.property.groupBy({
        by: ["authorId"],
        where: { agencyId: input.agencyId, deletedAt: null, status: { in: [...ACTIVE_OFFER_STATUSES] }, authorId: { in: chunk } },
        _count: { _all: true },
      })),
    findManyInChunks(ids, 4, (chunk) =>
      prisma.lead.groupBy({
        by: ["handlerId"],
        where: { AND: [leadScope, { handlerId: { in: chunk }, createdAt: { gte: input.since } }] },
        _count: { _all: true },
      })),
    findManyInChunks(ids, 7, (chunk) =>
      prisma.lead.groupBy({
        by: ["handlerId"],
        where: { AND: [leadScope, { handlerId: { in: chunk }, respondedAt: null, status: { in: OPEN_LEAD_STATUSES } }] },
        _count: { _all: true },
      })),
    findManyInChunks(ids, 1, (chunk) =>
      prisma.agencyActivity.groupBy({
        by: ["actorId"],
        where: { agencyId: input.agencyId, actorId: { in: chunk } },
        _max: { createdAt: true },
      })),
  ]);
  const listingOf = new Map(listings.map((row) => [row.authorId, row._count._all]));
  const newOf = new Map(newLeads.map((row) => [row.handlerId, row._count._all]));
  const unansweredOf = new Map(unanswered.map((row) => [row.handlerId, row._count._all]));
  const lastOf = new Map(lastSeen.map((row) => [row.actorId, row._max.createdAt]));
  return input.members.map((member) => ({
    ...member,
    activeListings: listingOf.get(member.userId) ?? 0,
    newLeads: newOf.get(member.userId) ?? 0,
    unansweredLeads: unansweredOf.get(member.userId) ?? 0,
    lastActivityAt: lastOf.get(member.userId) ?? null,
  }));
}
