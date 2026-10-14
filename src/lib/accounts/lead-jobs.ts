import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import {
  FAST_RESPONSE,
  LEAD_ESCALATION_MAX_AGE_HOURS,
  LEAD_ESCALATION_MINUTES,
  LEAD_STATUSES,
} from "@/lib/constants";
import { noticeLeadEscalation } from "@/lib/accounts/account-notices";
import { summarizeResponses } from "@/lib/accounts/response-stats";

/**
 * Müraciətlərin fon işləri (#161) — `worker.ts` cron trigger-indən `/api/cron/leads` ilə.
 * Hər ikisi idempotentdir: təkrar çağırış eyni bildirişi göndərmir, eyni göstəricini yazır.
 */

const ESCALATION_BATCH = 50;

/**
 * Agentliyin cavabsız müraciəti `LEAD_ESCALATION_MINUTES` dəqiqədən sonra sahibə bildirilir.
 * Müraciət sahibin özündədirsə eskalasiya mənasızdır — yalnız agentə düşənlər. Hər müraciət
 * bir dəfə: `escalatedAt` şərti `updateMany` ilə götürülür, sonra bildiriş gedir.
 */
export async function escalateStaleLeads(now = new Date()): Promise<{ escalated: number }> {
  const leads = await prisma.lead.findMany({
    where: {
      agencyId: { not: null },
      handlerId: { not: null },
      respondedAt: null,
      escalatedAt: null,
      status: { notIn: [LEAD_STATUSES.CLOSED, LEAD_STATUSES.COMPLETED] },
      createdAt: {
        lte: new Date(now.getTime() - LEAD_ESCALATION_MINUTES * 60_000),
        gte: new Date(now.getTime() - LEAD_ESCALATION_MAX_AGE_HOURS * 3_600_000),
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      handlerId: true,
      handler: { select: { name: true } },
      agency: { select: { userId: true } },
    },
    orderBy: { createdAt: "asc" },
    take: ESCALATION_BATCH,
  });

  let escalated = 0;
  for (const lead of leads) {
    if (!lead.agency || lead.handlerId === lead.agency.userId) continue;
    const claimed = await prisma.lead.updateMany({ where: { id: lead.id, escalatedAt: null }, data: { escalatedAt: now } });
    if (claimed.count === 0) continue;
    escalated += 1;
    await noticeLeadEscalation({
      userId: lead.agency.userId,
      leadId: lead.id,
      visitorName: lead.name,
      handlerName: lead.handler?.name ?? "—",
      minutes: Math.max(LEAD_ESCALATION_MINUTES, Math.round((now.getTime() - lead.createdAt.getTime()) / 60_000)),
    });
  }
  return { escalated };
}

type LeadRow = { createdAt: Date; respondedAt: Date | null };

function groupBy(rows: (LeadRow & { key: string | null })[]): Map<string, LeadRow[]> {
  const groups = new Map<string, LeadRow[]>();
  for (const row of rows) {
    if (!row.key) continue;
    groups.set(row.key, [...(groups.get(row.key) ?? []), row]);
  }
  return groups;
}

/**
 * Agent (müraciətə baxan) və agentlik üzrə cavab göstəricilərini yenidən hesablayır.
 * Pəncərədən çıxmış hesabın köhnə göstəricisi sıfırlanır — nişan əbədi qalmamalıdır.
 */
export async function refreshResponseStats(now = new Date()): Promise<{ agents: number; agencies: number }> {
  const since = new Date(now.getTime() - FAST_RESPONSE.windowDays * 86_400_000);
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: since }, OR: [{ handlerId: { not: null } }, { agencyId: { not: null } }] },
    select: { createdAt: true, respondedAt: true, handlerId: true, agencyId: true },
  });

  const byHandler = groupBy(leads.map((lead) => ({ ...lead, key: lead.handlerId })));
  const byAgency = groupBy(leads.map((lead) => ({ ...lead, key: lead.agencyId })));

  const agentSelect = { id: true, userId: true } as const;
  const agents = [
    ...await findManyInChunks([...byHandler.keys()], 0, (chunk) =>
      prisma.agentProfile.findMany({ where: { userId: { in: chunk } }, select: agentSelect })),
    // Pəncərədən çıxmış köhnə göstərici də yenilənir (sıfırlanır).
    ...await prisma.agentProfile.findMany({ where: { responseComputedAt: { not: null } }, select: agentSelect }),
  ];
  const seenAgents = new Set<string>();
  for (const agent of agents) {
    if (seenAgents.has(agent.id)) continue;
    seenAgents.add(agent.id);
    const summary = summarizeResponses(agent.userId ? byHandler.get(agent.userId) ?? [] : [], now);
    await prisma.agentProfile.update({
      where: { id: agent.id },
      data: {
        measuredResponseMinutes: summary.sample >= FAST_RESPONSE.minSample ? summary.minutes : null,
        responseSample: summary.sample,
        responseRate: summary.sample >= FAST_RESPONSE.minSample ? summary.rate : null,
        responseComputedAt: summary.sample > 0 ? now : null,
      },
    });
  }

  const agencies = [
    ...await findManyInChunks([...byAgency.keys()], 0, (chunk) =>
      prisma.agency.findMany({ where: { id: { in: chunk } }, select: { id: true } })),
    ...await prisma.agency.findMany({ where: { responseComputedAt: { not: null } }, select: { id: true } }),
  ];
  const seenAgencies = new Set<string>();
  for (const agency of agencies) {
    if (seenAgencies.has(agency.id)) continue;
    seenAgencies.add(agency.id);
    const summary = summarizeResponses(byAgency.get(agency.id) ?? [], now);
    await prisma.agency.update({
      where: { id: agency.id },
      data: {
        responseMinutes: summary.sample >= FAST_RESPONSE.minSample ? summary.minutes : null,
        responseSample: summary.sample,
        responseRate: summary.sample >= FAST_RESPONSE.minSample ? summary.rate : null,
        responseComputedAt: summary.sample > 0 ? now : null,
      },
    });
  }
  return { agents: seenAgents.size, agencies: seenAgencies.size };
}
