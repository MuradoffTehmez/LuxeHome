import { prisma } from "@/lib/prisma";
import { bakuDay } from "@/lib/listing-stats";
import { findManageableLead, getLeadAssignees } from "@/lib/accounts/listing-leads";
import {
  CLOSED_LEAD_STAGES,
  LEAD_SOURCES,
  LEAD_STAGES,
  LEAD_STATUSES,
  type LeadActivityType,
  type LeadSource,
  type LeadStage,
  type LeadStatus,
} from "@/lib/constants";

/**
 * Müraciətin satış mərhələsi və kartı (#222, PRD 8.3, 8.6).
 *
 * Kabinet PRD-nin 11 mərhələsi ilə işləyir (`Lead.stage`); ofis lövhəsi və huni qaba statusla
 * (`Lead.status`) qalır — hər mərhələ dəyişikliyi statusu da `leadStatusForStage()` ilə yazır.
 * Tarixçə (`LeadActivity`) heç vaxt atmır — müraciət yazmasını sındırmamalıdır.
 */

const STAGE_STATUS: Record<LeadStage, LeadStatus> = {
  NEW: LEAD_STATUSES.NEW,
  ASSIGNED: LEAD_STATUSES.NEW,
  CONTACTED: LEAD_STATUSES.CONTACTED,
  VIEWING_SCHEDULED: LEAD_STATUSES.IN_PROGRESS,
  VIEWING_DONE: LEAD_STATUSES.IN_PROGRESS,
  NEGOTIATING: LEAD_STATUSES.IN_PROGRESS,
  AGREED: LEAD_STATUSES.IN_PROGRESS,
  SOLD: LEAD_STATUSES.COMPLETED,
  RENTED: LEAD_STATUSES.COMPLETED,
  REJECTED: LEAD_STATUSES.CLOSED,
  CLOSED: LEAD_STATUSES.CLOSED,
};

export function leadStatusForStage(stage: LeadStage): LeadStatus {
  return STAGE_STATUS[stage];
}

export function isLeadStage(value: unknown): value is LeadStage {
  return typeof value === "string" && Object.hasOwn(LEAD_STAGES, value);
}

export function isClosedLeadStage(stage: string): boolean {
  return (CLOSED_LEAD_STAGES as readonly string[]).includes(stage);
}

/** Elan formasındakı məqsəd (#222, PRD 8.2) — allowlist-dən kənar dəyər adi elan sualıdır. */
export function leadIntentSource(value: unknown): LeadSource {
  return value === LEAD_SOURCES.VIEWING || value === LEAD_SOURCES.INFO ? value : LEAD_SOURCES.PROPERTY;
}

/** Mərhələ dəyişikliyi + uyğun qaba status bir yazıda. */
export function stageData(stage: LeadStage) {
  return { stage, status: leadStatusForStage(stage) };
}

export async function recordLeadActivity(input: {
  leadId: string;
  actor: { id: string; name: string } | null;
  type: LeadActivityType;
  text?: string | null;
  details?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  try {
    await prisma.leadActivity.create({
      data: {
        leadId: input.leadId,
        actorId: input.actor?.id ?? null,
        actorName: (input.actor?.name ?? "—").slice(0, 200),
        type: input.type,
        text: input.text ?? null,
        details: input.details ? JSON.stringify(input.details) : null,
      },
    });
  } catch (error) {
    console.error("[lead] fəaliyyət tarixçəsi yazılmadı", error);
  }
}

function parseDetails(raw: string | null): Record<string, string | number | boolean | null> {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, string | number | boolean | null>) : {};
  } catch {
    return {};
  }
}

/**
 * Müraciət kartı — yalnız müraciətə baxa bilən şəxs (`findManageableLead`: ona baxan, elanın müəllifi
 * və ya `LEADS_MANAGE` səlahiyyətli idarəçi). Başqasının id-si ilə `null` qayıdır.
 */
export async function getLeadCard(userId: string, leadId: string) {
  const access = await findManageableLead(userId, leadId);
  if (!access) return null;
  const [lead, activities] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: access.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        subject: true,
        message: true,
        source: true,
        stage: true,
        status: true,
        createdAt: true,
        respondedAt: true,
        nextContactAt: true,
        handlerId: true,
        handler: { select: { name: true } },
        agency: { select: { id: true, name: true, userId: true } },
        property: { select: { id: true, title: true, slug: true, status: true, deletedAt: true } },
      },
    }),
    prisma.leadActivity.findMany({
      where: { leadId: access.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
      select: { id: true, actorId: true, actorName: true, type: true, text: true, details: true, createdAt: true },
    }),
  ]);
  if (!lead) return null;
  const assignees = access.canManage && lead.agency
    ? await getLeadAssignees({ id: lead.agency.id, name: lead.agency.name, ownerUserId: lead.agency.userId })
    : null;
  return {
    lead: { ...lead, stage: isLeadStage(lead.stage) ? lead.stage : LEAD_STAGES.NEW },
    canManage: access.canManage,
    assignees,
    activities: activities.map((item) => ({ ...item, details: parseDetails(item.details) })),
  };
}

const ENGAGEMENT_DAYS = 30;

/**
 * Kliklər faktiki əlaqəni sübut etmir (PRD 8.2): son 30 gündə hesabın (və ya idarə etdiyi agentliyin)
 * elanlarındakı nömrə/WhatsApp/Telegram klikləri təsdiqlənmiş müraciətlərdən ayrıca sayılır.
 */
export async function getLeadEngagementSummary(userId: string, agencyId: string | null, now = new Date()) {
  const since = new Date(now.getTime() - ENGAGEMENT_DAYS * 86_400_000);
  const sinceDay = bakuDay(since);
  const listing = agencyId ? { agencyId } : { authorId: userId };
  const [stats, leads] = await Promise.all([
    prisma.propertyDailyStat.aggregate({
      where: { day: { gte: sinceDay }, property: listing },
      _sum: { contactReveals: true, whatsappClicks: true, telegramClicks: true },
    }),
    prisma.lead.count({
      where: {
        createdAt: { gte: since },
        ...(agencyId ? { OR: [{ agencyId }, { agencyId: null, property: { agencyId } }] } : { OR: [{ handlerId: userId }, { property: { authorId: userId } }] }),
      },
    }),
  ]);
  return {
    days: ENGAGEMENT_DAYS,
    phone: stats._sum.contactReveals ?? 0,
    whatsapp: stats._sum.whatsappClicks ?? 0,
    telegram: stats._sum.telegramClicks ?? 0,
    leads,
  };
}
