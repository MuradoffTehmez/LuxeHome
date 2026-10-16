import { prisma } from "@/lib/prisma";
import { byAzerbaijaniName } from "@/lib/az-collation";
import {
  AGENCY_ACTIVITY_GROUPS,
  type AgencyActivityAction,
  type AgencyActivityGroup,
} from "@/lib/constants";

/**
 * Agentlik daxili fəaliyyət jurnalı (#214, PRD 7.4).
 *
 * `recordAudit`-dən (panel jurnalı) fərqi: agentliyin öz mühitidir və yalnız agentlik sahibinə və
 * adminə görünür. Yazı **heç vaxt atmır** — jurnal köməkçidir, elan/komanda yazmasını sındırmamalıdır.
 * İcraçının və obyektin adı snapshot-dur: hesab və ya elan silinsə də qeyd oxunaqlı qalır.
 */

type Actor = { id: string; name: string };

export type AgencyActivityInput = {
  agencyId: string | null | undefined;
  actor: Actor | null;
  action: AgencyActivityAction;
  entityType: "Property" | "Lead" | "AgencyEmployee" | "PackageOrder" | "Agency" | "ListingTransfer";
  entityId?: string | null;
  entityLabel?: string | null;
  details?: Record<string, string | number | boolean | null>;
};

const LABEL_MAX = 200;

export async function recordAgencyActivity(input: AgencyActivityInput): Promise<void> {
  // Agentliyin mühitinə aid olmayan (şəxsi, şirkət) obyekt jurnala düşmür.
  if (!input.agencyId) return;
  try {
    await prisma.agencyActivity.create({
      data: {
        agencyId: input.agencyId,
        actorId: input.actor?.id ?? null,
        actorName: (input.actor?.name ?? "—").slice(0, LABEL_MAX),
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        entityLabel: input.entityLabel?.slice(0, LABEL_MAX) ?? null,
        details: input.details ? JSON.stringify(input.details) : null,
      },
    });
  } catch (error) {
    console.error("[agency] fəaliyyət jurnalı yazılmadı", error);
  }
}

/** Hesabın agentliyi (sahib kimi) — komanda əməliyyatları üçün. */
export async function ownedAgencyId(userId: string): Promise<string | null> {
  const agency = await prisma.agency.findUnique({ where: { userId }, select: { id: true } });
  return agency?.id ?? null;
}

export function isAgencyActivityGroup(value: unknown): value is AgencyActivityGroup {
  return typeof value === "string" && Object.hasOwn(AGENCY_ACTIVITY_GROUPS, value);
}

export const AGENCY_ACTIVITY_PAGE_SIZE = 30;

/** Jurnal səhifəsi: ən yenisi əvvəldə, qrup və icraçı filtri ilə. */
export async function getAgencyActivity(input: {
  agencyId: string;
  group?: AgencyActivityGroup | null;
  actorId?: string | null;
  page?: number;
}) {
  const page = Math.max(1, Math.min(input.page ?? 1, 500));
  const where = {
    agencyId: input.agencyId,
    ...(input.group ? { action: { in: [...AGENCY_ACTIVITY_GROUPS[input.group]] } } : {}),
    ...(input.actorId ? { actorId: input.actorId } : {}),
  };
  const [items, total, actors] = await Promise.all([
    prisma.agencyActivity.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * AGENCY_ACTIVITY_PAGE_SIZE,
      take: AGENCY_ACTIVITY_PAGE_SIZE,
      select: { id: true, actorId: true, actorName: true, action: true, entityType: true, entityId: true, entityLabel: true, details: true, createdAt: true },
    }),
    prisma.agencyActivity.count({ where }),
    prisma.agencyActivity.groupBy({
      by: ["actorId", "actorName"],
      where: { agencyId: input.agencyId, actorId: { not: null } },
      _count: { _all: true },
    }),
  ]);
  return {
    items: items.map((item) => ({ ...item, details: parseDetails(item.details) })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / AGENCY_ACTIVITY_PAGE_SIZE)),
    // Eyni icraçının adı dəyişibsə ən çox işlənən ad göstərilir.
    actors: [...new Map(actors.sort((a, b) => a._count._all - b._count._all).map((row) => [row.actorId!, row.actorName])).entries()]
      .map(([id, name]) => ({ id, name }))
      .sort(byAzerbaijaniName),
  };
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
