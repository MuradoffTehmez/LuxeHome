import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, AGENCY_ACTIVITY_ACTIONS, AGENCY_EMPLOYEE_SOURCES, AGENCY_EMPLOYEE_STATUSES } from "@/lib/constants";
import { recordAgencyActivity } from "@/lib/accounts/agency-activity";
import { toBase64Url } from "@/lib/auth/crypto";
import {
  commitMembershipDecision,
  hasFreeApprovedSeat,
  hasOtherApprovedMembership,
} from "@/lib/accounts/agency-membership";

/**
 * Agentliyin dəvət linki (#157): `/qosul/<token>`.
 *
 * Sahib linki kabinetdə yaradır və öz agentlərinə özü paylaşır, ona görə linklə gələn
 * agent sahibin təsdiqini gözləmədən komandaya qoşulur (`source = LINK`, dərhal
 * `APPROVED`). Yer limiti, «bir aktiv agentlik» qaydası və profil bağlantısı adi
 * təsdiqlə eyni yoldan keçir (`commitMembershipDecision`). Link yenidən yaradılanda
 * köhnəsi ölür; agentlik təsdiqsiz və ya deaktivdirsə link işləmir.
 */

/** 24 bayt təsadüfi dəyər → 32 simvollu base64url. */
export function generateInviteToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;

export function isInviteTokenShape(token: unknown): token is string {
  return typeof token === "string" && TOKEN_PATTERN.test(token);
}

/** Linkin agentliyi — yalnız təsdiqlənmiş və aktiv agentlik. */
export async function findAgencyByInviteToken(token: unknown) {
  if (!isInviteTokenShape(token)) return null;
  return prisma.agency.findFirst({
    where: { inviteToken: token, isVerified: true, user: { isActive: true } },
    select: { id: true, name: true, slug: true, logoUrl: true, userId: true },
  });
}

export type InviteAgency = NonNullable<Awaited<ReturnType<typeof findAgencyByInviteToken>>>;

export type LinkJoinResult =
  | { status: "joined"; employeeId: string; attemptAt: Date }
  | { status: "already" }
  | { status: "notAgent" }
  | { status: "otherAgency" }
  | { status: "full" }
  | { status: "conflict" };

/**
 * Agenti linkin agentliyinə qoşur. Başqa agentliyə göndərdiyi gözləyən sorğu və ya
 * dəvət varsa ləğv olunur — agent linkə klikləyib bu agentliyi özü seçib; təsdiqlənmiş
 * üzvlük isə toxunulmur (əvvəlcə oradan çıxmalıdır).
 */
export async function joinAgencyByLink(
  agency: Pick<InviteAgency, "id">,
  user: { id: string; accountType: string; name?: string },
): Promise<LinkJoinResult> {
  if (user.accountType !== ACCOUNT_TYPES.AGENT) return { status: "notAgent" };

  const existing = await prisma.agencyEmployee.findUnique({
    where: { agencyId_userId: { agencyId: agency.id, userId: user.id } },
    select: { id: true, status: true },
  });
  if (existing?.status === AGENCY_EMPLOYEE_STATUSES.APPROVED) return { status: "already" };
  if (await hasOtherApprovedMembership(user.id, agency.id)) return { status: "otherAgency" };
  if (!(await hasFreeApprovedSeat(agency.id))) return { status: "full" };

  await prisma.agencyEmployee.deleteMany({
    where: { userId: user.id, agencyId: { not: agency.id }, status: AGENCY_EMPLOYEE_STATUSES.PENDING },
  });

  const attemptAt = new Date();
  const data = {
    status: AGENCY_EMPLOYEE_STATUSES.PENDING,
    source: AGENCY_EMPLOYEE_SOURCES.LINK,
    invitedAt: attemptAt,
    approvedAt: null,
    decisionNote: null,
  };
  const employee = existing
    ? await prisma.agencyEmployee.update({ where: { id: existing.id }, data, select: { id: true } })
    : await prisma.agencyEmployee.create({
        data: { ...data, agencyId: agency.id, userId: user.id },
        select: { id: true },
      });

  const result = await commitMembershipDecision({
    id: employee.id,
    userId: user.id,
    agencyId: agency.id,
    approved: true,
    currentStatus: AGENCY_EMPLOYEE_STATUSES.PENDING,
  });
  if (result === "conflict") return { status: "conflict" };
  await recordAgencyActivity({
    agencyId: agency.id, actor: { id: user.id, name: user.name ?? "—" }, action: AGENCY_ACTIVITY_ACTIONS.MEMBER_APPROVED,
    entityType: "AgencyEmployee", entityId: employee.id, entityLabel: user.name ?? null, details: { source: "LINK" },
  });
  return { status: "joined", employeeId: employee.id, attemptAt };
}
