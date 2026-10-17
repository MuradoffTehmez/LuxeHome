import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import {
  AGENCY_MEMBER_PERMISSIONS,
  CLOSED_LEAD_STAGES,
  FAST_RESPONSE,
  LEAD_ACTIVITY_TYPES,
  type LeadActivityType,
} from "@/lib/constants";
import { noticeUnansweredLead } from "@/lib/accounts/account-notices";
import { ACTIVE_MEMBER_WHERE, effectivePermissions } from "@/lib/accounts/agency-access";
import { leadAlertConfigOf, leadAlertScanWindow, leadAlertSteps, type LeadAlertStep } from "@/lib/accounts/lead-alerts";
import { recordLeadActivity } from "@/lib/accounts/lead-pipeline";
import { summarizeResponses } from "@/lib/accounts/response-stats";

/**
 * Müraciətlərin fon işləri (#161) — `worker.ts` cron trigger-indən `/api/cron/leads` ilə.
 * Hər ikisi idempotentdir: təkrar çağırış eyni bildirişi göndərmir, eyni göstəricini yazır.
 */

/** Bir cron çağırışında göndərilən ən çox bildiriş pilləsi və taranan səhifə. */
const ALERT_BATCH = 50;
const SCAN_PAGE = 100;
const SCAN_PAGES = 5;

const MARKER: Record<LeadAlertStep, "reminderSentAt" | "escalatedAt" | "reassignSuggestedAt"> = {
  reminder: "reminderSentAt",
  alert: "escalatedAt",
  reassign: "reassignSuggestedAt",
};
const ACTIVITY: Record<LeadAlertStep, LeadActivityType> = {
  reminder: LEAD_ACTIVITY_TYPES.REMINDER,
  alert: LEAD_ACTIVITY_TYPES.ALERT,
  reassign: LEAD_ACTIVITY_TYPES.REASSIGN_SUGGESTED,
};

/** Agentlik sahibi + müraciət idarəetmə səlahiyyətli aktiv menecerlər (çağırış ərzində keşlənir). */
async function agencyManagers(agencyId: string, ownerUserId: string, cache: Map<string, string[]>): Promise<string[]> {
  const cached = cache.get(agencyId);
  if (cached) return cached;
  const members = await prisma.agencyEmployee.findMany({
    where: { agencyId, ...ACTIVE_MEMBER_WHERE, user: { isActive: true, deletionRequestedAt: null } },
    select: { userId: true, role: true, permissions: true },
  });
  const managers = [
    ownerUserId,
    ...members
      .filter((member) => effectivePermissions(member.role, member.permissions).has(AGENCY_MEMBER_PERMISSIONS.LEADS_MANAGE))
      .map((member) => member.userId),
  ];
  const unique = [...new Set(managers)];
  cache.set(agencyId, unique);
  return unique;
}

/** Cavabsız agentlik müraciətlərinin bir səhifəsi (yaranma vaxtı üzrə, kursorla). */
function scanUnansweredLeads(window: { from: Date; to: Date }, cursor: string | null) {
  return prisma.lead.findMany({
    where: {
      agencyId: { not: null },
      handlerId: { not: null },
      respondedAt: null,
      stage: { notIn: [...CLOSED_LEAD_STAGES] },
      createdAt: { gte: window.from, lte: window.to },
      OR: [{ reminderSentAt: null }, { escalatedAt: null }, { reassignSuggestedAt: null }],
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      handlerId: true,
      reminderSentAt: true,
      escalatedAt: true,
      reassignSuggestedAt: true,
      handler: { select: { name: true } },
      agency: {
        select: { id: true, userId: true, leadReminderMinutes: true, leadAlertMinutes: true, leadReassignMinutes: true },
      },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: SCAN_PAGE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

/**
 * Cavabsız agentlik müraciətləri üçün xəbərdarlıq pillələri (#224, PRD 8.5). Müddətlər agentlikdədir
 * (`leadReminderMinutes` / `leadAlertMinutes` / `leadReassignMinutes`):
 * 1. xatırlatma məsul şəxsə;
 * 2. bildiriş sahibə və `LEADS_MANAGE` səlahiyyətli menecerlərə (məsulun özündən başqa);
 * 3. təkrar təyinat təklifi eyni alıcılara (müraciət sahibin özündədirsə və menecer yoxdursa sahibə).
 *
 * Hər pillə müraciət başına bir dəfə: marker şərti `updateMany` ilə götürülür, sonra bildiriş gedir.
 * Heç bir alıcıya yazılmasa marker geri qaytarılır və növbəti cron təkrar cəhd edir (bildirişin
 * `dedupeKey`-i pillə + müraciət + alıcıdır, ikiqat bildiriş yaranmır). Həddi çoxdan keçmiş pillə
 * bildirişsiz bağlanır (`expired`).
 */
export async function processUnansweredLeads(now = new Date()): Promise<Record<LeadAlertStep, number>> {
  const sent: Record<LeadAlertStep, number> = { reminder: 0, alert: 0, reassign: 0 };
  const window = leadAlertScanWindow(now);
  const managersCache = new Map<string, string[]>();
  let budget = ALERT_BATCH;
  let cursor: string | null = null;

  for (let page = 0; page < SCAN_PAGES && budget > 0; page += 1) {
    const leads = await scanUnansweredLeads(window, cursor);
    if (leads.length === 0) break;
    cursor = leads[leads.length - 1].id;

    for (const lead of leads) {
      if (!lead.agency || !lead.handlerId || budget <= 0) continue;
      const steps = leadAlertSteps(lead.createdAt, now, leadAlertConfigOf(lead.agency), {
        reminder: lead.reminderSentAt,
        alert: lead.escalatedAt,
        reassign: lead.reassignSuggestedAt,
      });
      const minutes = Math.round((now.getTime() - lead.createdAt.getTime()) / 60_000);
      for (const { step, state } of steps) {
        const marker = MARKER[step];
        const claimed = await prisma.lead.updateMany({ where: { id: lead.id, [marker]: null }, data: { [marker]: now } });
        if (claimed.count === 0 || state === "expired") continue;

        const recipients = step === "reminder"
          ? [lead.handlerId]
          : (await agencyManagers(lead.agency.id, lead.agency.userId, managersCache)).filter((id) => id !== lead.handlerId);
        // Müraciət sahibin özündədir və menecer yoxdur: bildiriş mənasızdır, təkrar təyinat təklifi isə sahibə gedir.
        if (recipients.length === 0 && step === "reassign") recipients.push(lead.agency.userId);
        if (recipients.length === 0) continue;

        let delivered = false;
        for (const userId of recipients) {
          const ok = await noticeUnansweredLead({
            userId,
            step,
            leadId: lead.id,
            visitorName: lead.name,
            handlerName: lead.handler?.name ?? "—",
            minutes,
          });
          delivered ||= ok;
        }
        if (!delivered) {
          // Bildiriş yazılmadı (keçici xəta) — marker geri qaytarılır ki, növbəti cron təkrar cəhd etsin.
          await prisma.lead.updateMany({ where: { id: lead.id, [marker]: now }, data: { [marker]: null } });
          continue;
        }
        sent[step] += 1;
        budget -= 1;
        await recordLeadActivity({ leadId: lead.id, actor: null, type: ACTIVITY[step], details: { minutes } });
      }
    }
    if (leads.length < SCAN_PAGE) break;
  }
  return sent;
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
