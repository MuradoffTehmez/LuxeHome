import { prisma } from "@/lib/prisma";
import {
  AGENCY_EMPLOYEE_STATUSES,
  CLOSED_LEAD_STAGES,
  LEAD_ROUTING_MODES,
  PUBLIC_PROPERTY_STATUSES,
  isLeadRoutingMode,
  type LeadRoutingMode,
} from "@/lib/constants";

/**
 * Müraciətin ünvanı və agentlər arasında bölünməsi (#161, C3).
 *
 * - Agentliyin (sahibin) elanına və agentlik profilindəki formaya gələn müraciət agentliyindir:
 *   bölgü açıqdırsa təsdiqlənmiş, müraciət alan agentlərdən birinə düşür, yoxsa sahibə.
 * - Agentliyin agentinin öz elanına gələn müraciət həmişə agentə gedir, amma agentliyə də
 *   bağlanır — sahib görür və cavabsız qalanda eskalasiya alır.
 * - Digər ictimai hesabın elanı — müraciət müəllifindir.
 *
 * Rejimlər (PRD 8.4) `LEAD_ROUTING_MODES`-dədir: birbaşa (elana təyin edilmiş agent), növbə,
 * yüklənmə (ən az açıq müraciət), manual (sahibə) və ərazi.
 *
 * Seçim deterministikdir və `AgencyEmployee.lastLeadAt` ilə növbə saxlanır. Yarış halında
 * iki müraciət eyni agentə düşə bilər — bu, ədalətsizlik deyil, sadəcə növbənin bir addım
 * sürüşməsidir; tranzaksiyasız D1-də buna kilid qurmağa dəyməz.
 */

export type LeadRoute = {
  /** Müraciətə baxan ictimai hesab; `null` — ofis (şirkət elanı, ümumi forma). */
  handlerId: string | null;
  agencyId: string | null;
  agencyName: string | null;
  /** Bölgü müraciəti sahibdən başqa agentə verdi. */
  routed: boolean;
};

const OFFICE: LeadRoute = { handlerId: null, agencyId: null, agencyName: null, routed: false };

type Candidate = { employeeId: string; userId: string; lastLeadAt: Date | null; approvedAt: Date | null };

/** Növbə: heç müraciət almamış (və ya ən çoxdan almış) agent birincidir. */
export function pickRoundRobin<T extends Pick<Candidate, "lastLeadAt" | "approvedAt" | "userId">>(candidates: T[]): T | null {
  if (candidates.length === 0) return null;
  const time = (value: Date | null) => (value ? value.getTime() : -Infinity);
  return [...candidates].sort(
    (a, b) =>
      time(a.lastLeadAt) - time(b.lastLeadAt) ||
      time(a.approvedAt) - time(b.approvedAt) ||
      a.userId.localeCompare(b.userId),
  )[0];
}

/** Ərazi: həmin ərazidə ən çox aktiv elanı olan agent; heç kimdə yoxdursa növbə. */
export function pickByArea<T extends Pick<Candidate, "lastLeadAt" | "approvedAt" | "userId">>(
  candidates: T[],
  listingsInArea: Map<string, number>,
): T | null {
  const best = Math.max(0, ...candidates.map((item) => listingsInArea.get(item.userId) ?? 0));
  if (best === 0) return pickRoundRobin(candidates);
  return pickRoundRobin(candidates.filter((item) => (listingsInArea.get(item.userId) ?? 0) === best));
}

/** Yüklənmə: ən az açıq müraciəti olan agent; bərabərlikdə növbə. */
export function pickByLoad<T extends Pick<Candidate, "lastLeadAt" | "approvedAt" | "userId">>(
  candidates: T[],
  openLeads: Map<string, number>,
): T | null {
  if (candidates.length === 0) return null;
  const least = Math.min(...candidates.map((item) => openLeads.get(item.userId) ?? 0));
  return pickRoundRobin(candidates.filter((item) => (openLeads.get(item.userId) ?? 0) === least));
}

/** Agentliyin hər agentdəki açıq (bağlanmamış mərhələdə) müraciət sayı. */
async function countOpenLeads(agencyId: string, userIds: string[]) {
  const counts = new Map<string, number>();
  if (userIds.length === 0) return counts;
  const rows = await prisma.lead.groupBy({
    by: ["handlerId"],
    where: { agencyId, handlerId: { in: userIds }, stage: { notIn: [...CLOSED_LEAD_STAGES] } },
    _count: { _all: true },
  });
  for (const row of rows) if (row.handlerId) counts.set(row.handlerId, row._count._all);
  return counts;
}

async function countListingsInArea(userIds: string[], area: { districtId?: string | null; cityId?: string | null }) {
  const counts = new Map<string, number>();
  const where = area.districtId ? { districtId: area.districtId } : area.cityId ? { cityId: area.cityId } : null;
  if (!where || userIds.length === 0) return counts;
  // Agent sayı `MAX_AGENCY_EMPLOYEES` (50) ilə məhduddur — `IN (…)` 100 parametr həddinə sığır.
  const rows = await prisma.property.groupBy({
    by: ["authorId"],
    where: { ...where, authorId: { in: userIds }, deletedAt: null, status: { in: PUBLIC_PROPERTY_STATUSES } },
    _count: { _all: true },
  });
  for (const row of rows) if (row.authorId) counts.set(row.authorId, row._count._all);
  return counts;
}

const ACTIVE_AGENT_WHERE = {
  status: AGENCY_EMPLOYEE_STATUSES.APPROVED,
  // Girişi dayandırılmış agent (#218) müraciət almır.
  suspendedAt: null,
  user: { isActive: true, deletionRequestedAt: null },
} as const;

type RouteTarget = {
  districtId?: string | null;
  cityId?: string | null;
  /** Elanı idarə edən agentin istifadəçi id-si (`Property.assignedAgent.userId`) — birbaşa rejim üçün. */
  assignedAgentUserId?: string | null;
};

/** Agentliyin müraciəti üçün agent seçir; uyğun agent yoxdursa sahib. */
async function routeWithinAgency(
  agency: { id: string; name: string; userId: string; leadRouting: string },
  target: RouteTarget,
  now: Date,
): Promise<LeadRoute> {
  const ownerRoute: LeadRoute = { handlerId: agency.userId, agencyId: agency.id, agencyName: agency.name, routed: false };
  const mode: LeadRoutingMode = isLeadRoutingMode(agency.leadRouting) ? agency.leadRouting : LEAD_ROUTING_MODES.ROUND_ROBIN;
  if (mode === LEAD_ROUTING_MODES.OFF) return ownerRoute;

  if (mode === LEAD_ROUTING_MODES.DIRECT) {
    // Elanı idarə edən agent: «müraciət növbəsində» olub-olmamasından asılı deyil — elan onundur.
    // Təyinat yoxdursa və ya agent artıq aktiv üzv deyilsə müraciət sahibə düşür (manual kimi).
    const agentId = target.assignedAgentUserId;
    if (!agentId || agentId === agency.userId) return ownerRoute;
    const member = await prisma.agencyEmployee.findFirst({
      where: { agencyId: agency.id, userId: agentId, ...ACTIVE_AGENT_WHERE },
      select: { id: true },
    });
    if (!member) return ownerRoute;
    await prisma.agencyEmployee.update({ where: { id: member.id }, data: { lastLeadAt: now } });
    return { handlerId: agentId, agencyId: agency.id, agencyName: agency.name, routed: true };
  }

  const employees = await prisma.agencyEmployee.findMany({
    where: { agencyId: agency.id, ...ACTIVE_AGENT_WHERE, receivesLeads: true },
    select: { id: true, userId: true, lastLeadAt: true, approvedAt: true },
  });
  const candidates: Candidate[] = employees.map((item) => ({
    employeeId: item.id,
    userId: item.userId,
    lastLeadAt: item.lastLeadAt,
    approvedAt: item.approvedAt,
  }));
  const userIds = candidates.map((item) => item.userId);
  const chosen = mode === LEAD_ROUTING_MODES.AREA
    ? pickByArea(candidates, await countListingsInArea(userIds, target))
    : mode === LEAD_ROUTING_MODES.LOAD
      ? pickByLoad(candidates, await countOpenLeads(agency.id, userIds))
      : pickRoundRobin(candidates);
  if (!chosen) return ownerRoute;

  await prisma.agencyEmployee.update({ where: { id: chosen.employeeId }, data: { lastLeadAt: now } });
  return { handlerId: chosen.userId, agencyId: agency.id, agencyName: agency.name, routed: true };
}

const AGENCY_SELECT = { id: true, name: true, userId: true, leadRouting: true } as const;

/** Elan səhifəsindən gələn müraciət: `listerId` — `resolveLeadProperty()`-nin ictimai müəllifi. */
export async function routePropertyLead(
  property: { listerId: string | null } & RouteTarget,
  now = new Date(),
): Promise<LeadRoute> {
  if (!property.listerId) return OFFICE;

  const ownAgency = await prisma.agency.findUnique({ where: { userId: property.listerId }, select: AGENCY_SELECT });
  if (ownAgency) return routeWithinAgency(ownAgency, property, now);

  // Agentin öz elanı: müraciət agentindir, amma agentlik onu görür və eskalasiya alır.
  const membership = await prisma.agencyEmployee.findFirst({
    where: { userId: property.listerId, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
    select: { agency: { select: { id: true, name: true } } },
  });
  return {
    handlerId: property.listerId,
    agencyId: membership?.agency.id ?? null,
    agencyName: membership?.agency.name ?? null,
    routed: false,
  };
}

/** Agentlik profilindəki formadan gələn müraciət — yalnız təsdiqlənmiş, aktiv agentliyə. */
export async function routeAgencyLead(slug: string, now = new Date()): Promise<LeadRoute | null> {
  const value = slug.trim();
  if (!value || value.length > 120) return null;
  const agency = await prisma.agency.findFirst({
    where: { slug: value, isVerified: true, user: { isActive: true, deletionRequestedAt: null } },
    select: AGENCY_SELECT,
  });
  if (!agency) return null;
  return routeWithinAgency(agency, {}, now);
}

/**
 * Agent komandadan çıxanda (#161): ona düşmüş agentlik müraciətləri sahibə qaytarılır — açıq
 * müraciət cavabsız qalmasın. Agentin özündə qalan elanlarına gələn müraciətlər ona qalır.
 */
export async function releaseAgentLeads(input: { agencyId: string; userId: string; ownerUserId: string }): Promise<number> {
  const { count } = await prisma.lead.updateMany({
    where: {
      agencyId: input.agencyId,
      handlerId: input.userId,
      OR: [{ propertyId: null }, { property: { authorId: { not: input.userId } } }],
    },
    data: { handlerId: input.ownerUserId },
  });
  return count;
}
