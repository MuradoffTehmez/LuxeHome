import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  AGENCY_EMPLOYEE_ROLES,
  AGENCY_EMPLOYEE_STATUSES,
  AGENCY_MEMBER_PERMISSIONS,
  AGENCY_ROLE_DEFAULT_PERMISSIONS,
  type AgencyEmployeeRole,
  type AgencyMemberPermission,
} from "@/lib/constants";

/**
 * Agentlik daxili rol, səlahiyyət və girişin dayandırılması (#218, PRD 7.2).
 *
 * Sahib (`Agency.userId`) həmişə bütün səlahiyyətlərə malikdir. Üzvün səlahiyyəti rolun defoltu və ya
 * sahibin yazdığı siyahıdır (`AgencyEmployee.permissions`). Girişi dayandırılmış üzv (`suspendedAt`)
 * agentlik mühitində heç bir səlahiyyətə malik deyil: üzvlüyü qalır, amma agentlik müraciətlərini görmür,
 * agentlik elanını redaktə etmir, agentlik adından elan yaratmır və müraciət növbəsinə düşmür.
 */

const ALL_PERMISSIONS = Object.values(AGENCY_MEMBER_PERMISSIONS) as AgencyMemberPermission[];

export function isAgencyMemberPermission(value: unknown): value is AgencyMemberPermission {
  return typeof value === "string" && (ALL_PERMISSIONS as string[]).includes(value);
}

export function isAgencyEmployeeRole(value: unknown): value is AgencyEmployeeRole {
  return value === AGENCY_EMPLOYEE_ROLES.AGENT || value === AGENCY_EMPLOYEE_ROLES.MANAGER;
}

/** Saxlanmış siyahı; `null` — rolun defoltu. Pozulmuş JSON da defolta düşür. */
export function parseMemberPermissions(raw: string | null | undefined): AgencyMemberPermission[] | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? [...new Set(value.filter(isAgencyMemberPermission))] : null;
  } catch {
    return null;
  }
}

export function effectivePermissions(role: string, raw: string | null | undefined): Set<AgencyMemberPermission> {
  const custom = parseMemberPermissions(raw);
  if (custom) return new Set(custom);
  return new Set(isAgencyEmployeeRole(role) ? AGENCY_ROLE_DEFAULT_PERMISSIONS[role] : []);
}

/** Rolun defoltu ilə eyni siyahı `null` saxlanılır — rol dəyişəndə defolt da dəyişsin. */
export function serializeMemberPermissions(role: AgencyEmployeeRole, permissions: AgencyMemberPermission[]): string | null {
  const unique = ALL_PERMISSIONS.filter((permission) => permissions.includes(permission));
  const defaults = AGENCY_ROLE_DEFAULT_PERMISSIONS[role];
  const same = unique.length === defaults.length && defaults.every((permission) => unique.includes(permission));
  return same ? null : JSON.stringify(unique);
}

/** Agentlik mühitində aktiv üzv şərti: təsdiqlənib və girişi dayandırılmayıb. */
export const ACTIVE_MEMBER_WHERE = { status: AGENCY_EMPLOYEE_STATUSES.APPROVED, suspendedAt: null } as const;

export type AgencyAccess = {
  agencyId: string;
  agencyName: string;
  ownerUserId: string;
  isOwner: boolean;
  employeeId: string | null;
  role: AgencyEmployeeRole | null;
  permissions: Set<AgencyMemberPermission>;
  suspended: boolean;
};

/** Hesabın agentlik mühitinə girişi: sahib və ya təsdiqlənmiş üzv (dayandırılmış da qaytarılır). */
export async function getAgencyAccess(user: { id: string; accountType: string }): Promise<AgencyAccess | null> {
  if (user.accountType === ACCOUNT_TYPES.AGENCY) {
    const agency = await prisma.agency.findUnique({ where: { userId: user.id }, select: { id: true, name: true } });
    return agency
      ? { agencyId: agency.id, agencyName: agency.name, ownerUserId: user.id, isOwner: true, employeeId: null, role: null, permissions: new Set(ALL_PERMISSIONS), suspended: false }
      : null;
  }
  const membership = await prisma.agencyEmployee.findFirst({
    where: { userId: user.id, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
    select: { id: true, role: true, permissions: true, suspendedAt: true, agency: { select: { id: true, name: true, userId: true } } },
  });
  if (!membership) return null;
  const suspended = membership.suspendedAt != null;
  return {
    agencyId: membership.agency.id,
    agencyName: membership.agency.name,
    ownerUserId: membership.agency.userId,
    isOwner: false,
    employeeId: membership.id,
    role: isAgencyEmployeeRole(membership.role) ? membership.role : AGENCY_EMPLOYEE_ROLES.AGENT,
    permissions: suspended ? new Set() : effectivePermissions(membership.role, membership.permissions),
    suspended,
  };
}

export function hasAgencyPermission(access: AgencyAccess | null, permission: AgencyMemberPermission): access is AgencyAccess {
  return Boolean(access && !access.suspended && (access.isOwner || access.permissions.has(permission)));
}

/** Üzvün girişi dayandırılıbmı — agentlik elanının redaktəsi bu yoxlamadan keçir. */
export async function isSuspendedMember(userId: string, agencyId: string): Promise<boolean> {
  const member = await prisma.agencyEmployee.findUnique({
    where: { agencyId_userId: { agencyId, userId } },
    select: { status: true, suspendedAt: true },
  });
  return member?.status === AGENCY_EMPLOYEE_STATUSES.APPROVED && member.suspendedAt != null;
}

/**
 * Elan sorğusu üçün şərt: girişi dayandırılmış üzvün agentlik elanı onun kabinetində redaktə olunmur.
 * Şəxsi elan (`agencyId = null`) və başqa agentliyin elanı bu şərtdən təsirlənmir.
 */
export function notSuspendedAgencyListing(userId: string) {
  return { NOT: { agency: { employees: { some: { userId, suspendedAt: { not: null } } } } } };
}
