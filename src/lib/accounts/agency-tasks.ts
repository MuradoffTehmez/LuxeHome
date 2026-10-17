import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { bakuDay } from "@/lib/listing-stats";
import { ACTIVE_MEMBER_WHERE, hasAgencyPermission, type AgencyAccess } from "@/lib/accounts/agency-access";
import {
  AGENCY_MEMBER_PERMISSIONS,
  AGENCY_TASK_DESCRIPTION_MAX,
  AGENCY_TASK_STATUSES,
  AGENCY_TASK_TITLE_MAX,
  AGENCY_TASK_TYPES,
  LEAD_STATUSES,
  OPEN_AGENCY_TASK_STATUSES,
  type AgencyTaskStatus,
  type AgencyTaskType,
} from "@/lib/constants";

/**
 * Agentlik daxili tapşırıqları (#220, PRD 7.3).
 *
 * - Sahib və `TASKS_MANAGE` səlahiyyətli üzv hər aktiv üzvə tapşırıq yaradır və bütün tapşırıqları görür;
 *   digər üzv yalnız özünə yaradır, yalnız ona təyin olunanı və ya özünün yaratdığını görür.
 * - İcraçı statusu `NEW/IN_PROGRESS/ON_HOLD/DONE` arasında dəyişir; ləğvi yalnız idarəçi və ya yaradan edir.
 * - Status keçidi şərti `updateMany` ilədir (cari status şərtdə) — eyni anda iki dəyişiklik üst-üstə yazılmır.
 * - Girişi dayandırılmış üzv (`access.suspended`) tapşırıqlara ümumiyyətlə daxil olmur.
 */

export function canManageTasks(access: AgencyAccess | null): access is AgencyAccess {
  return hasAgencyPermission(access, AGENCY_MEMBER_PERMISSIONS.TASKS_MANAGE);
}

export function isAgencyTaskType(value: unknown): value is AgencyTaskType {
  return typeof value === "string" && Object.hasOwn(AGENCY_TASK_TYPES, value);
}

export function isAgencyTaskStatus(value: unknown): value is AgencyTaskStatus {
  return typeof value === "string" && Object.hasOwn(AGENCY_TASK_STATUSES, value);
}

/** `YYYY-MM-DD` → həmin günün sonu (Bakı vaxtı); bu gündən əvvəlki tarix qəbul olunmur. */
export function parseTaskDueDate(value: string | null | undefined, now = new Date()): Date | null | undefined {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const due = new Date(`${value}T23:59:59+04:00`);
  if (Number.isNaN(due.getTime()) || value < bakuDay(now)) return undefined;
  return due;
}

export function isTaskOverdue(task: { status: string; dueAt: Date | null }, now = new Date()): boolean {
  return Boolean(task.dueAt && task.dueAt < now && (OPEN_AGENCY_TASK_STATUSES as readonly string[]).includes(task.status));
}

/** Tapşırığın icraçısı ola bilən: agentliyin sahibi və ya aktiv (dayandırılmamış) üzvü. */
async function isTaskParticipant(access: AgencyAccess, userId: string): Promise<boolean> {
  if (userId === access.ownerUserId) return true;
  const member = await prisma.agencyEmployee.findFirst({
    where: { agencyId: access.agencyId, userId, ...ACTIVE_MEMBER_WHERE, user: { isActive: true } },
    select: { id: true },
  });
  return Boolean(member);
}

export type CreateTaskResult =
  | { result: "created"; id: string; assigneeId: string }
  | { result: "forbidden" | "invalidTitle" | "invalidType" | "invalidAssignee" | "invalidDue" | "invalidProperty" | "invalidLead" };

export async function createAgencyTask(input: {
  access: AgencyAccess | null;
  actorId: string;
  title: string;
  description: string | null;
  type: string;
  assigneeId: string | null;
  propertyId: string | null;
  leadId: string | null;
  dueDate: string | null;
  now?: Date;
}): Promise<CreateTaskResult> {
  const access = input.access;
  if (!access || access.suspended) return { result: "forbidden" };
  const title = input.title.trim().replace(/\s+/g, " ");
  if (title.length < 3 || title.length > AGENCY_TASK_TITLE_MAX) return { result: "invalidTitle" };
  if (!isAgencyTaskType(input.type)) return { result: "invalidType" };
  const manage = canManageTasks(access);
  const assigneeId = manage ? input.assigneeId || input.actorId : input.actorId;
  if (!manage && input.assigneeId && input.assigneeId !== input.actorId) return { result: "invalidAssignee" };
  if (!(await isTaskParticipant(access, assigneeId))) return { result: "invalidAssignee" };
  const dueAt = parseTaskDueDate(input.dueDate, input.now);
  if (dueAt === undefined) return { result: "invalidDue" };

  if (input.propertyId) {
    const property = await prisma.property.findFirst({ where: { id: input.propertyId, agencyId: access.agencyId, deletedAt: null }, select: { id: true } });
    if (!property) return { result: "invalidProperty" };
  }
  if (input.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, OR: [{ agencyId: access.agencyId }, { agencyId: null, property: { agencyId: access.agencyId } }] },
      select: { id: true },
    });
    if (!lead) return { result: "invalidLead" };
  }

  const task = await prisma.agencyTask.create({
    data: {
      agencyId: access.agencyId,
      title,
      description: input.description?.trim().slice(0, AGENCY_TASK_DESCRIPTION_MAX) || null,
      type: input.type,
      assigneeId,
      createdById: input.actorId,
      propertyId: input.propertyId || null,
      leadId: input.leadId || null,
      dueAt,
    },
    select: { id: true },
  });
  return { result: "created", id: task.id, assigneeId };
}

export type TaskStatusResult =
  | { result: "updated"; task: { id: string; title: string; assigneeId: string; createdById: string | null; from: string } }
  | { result: "notFound" | "forbidden" | "stale" | "invalidStatus" };

export async function updateAgencyTaskStatus(input: {
  access: AgencyAccess | null;
  actorId: string;
  taskId: string;
  status: string;
  now?: Date;
}): Promise<TaskStatusResult> {
  const access = input.access;
  if (!access || access.suspended) return { result: "forbidden" };
  if (!isAgencyTaskStatus(input.status)) return { result: "invalidStatus" };
  const task = await prisma.agencyTask.findFirst({
    where: { id: input.taskId, agencyId: access.agencyId },
    select: { id: true, title: true, status: true, assigneeId: true, createdById: true },
  });
  if (!task) return { result: "notFound" };
  const manage = canManageTasks(access);
  const isAssignee = task.assigneeId === input.actorId;
  const isCreator = task.createdById === input.actorId;
  if (!manage && !isAssignee && !isCreator) return { result: "notFound" };
  if (input.status === AGENCY_TASK_STATUSES.CANCELLED ? !manage && !isCreator : !manage && !isAssignee) return { result: "forbidden" };
  if (task.status === input.status) return { result: "updated", task: { ...task, from: task.status } };

  const { count } = await prisma.agencyTask.updateMany({
    where: { id: task.id, status: task.status },
    data: {
      status: input.status,
      completedAt: input.status === AGENCY_TASK_STATUSES.DONE ? (input.now ?? new Date()) : null,
    },
  });
  if (count === 0) return { result: "stale" };
  return { result: "updated", task: { ...task, from: task.status } };
}

export type TaskView = "open" | "done" | "cancelled" | "all";

export function isTaskView(value: unknown): value is TaskView {
  return value === "open" || value === "done" || value === "cancelled" || value === "all";
}

const VIEW_STATUSES: Record<TaskView, readonly string[] | null> = {
  open: OPEN_AGENCY_TASK_STATUSES,
  done: [AGENCY_TASK_STATUSES.DONE],
  cancelled: [AGENCY_TASK_STATUSES.CANCELLED],
  all: null,
};

const LIST_LIMIT = 100;

/** Görünən tapşırıqlar: açıqlar son tarixə görə (tarixsizlər sonda), bağlananlar ən yenisi əvvəl. */
export async function listAgencyTasks(input: { access: AgencyAccess; userId: string; view: TaskView; assigneeId?: string | null }) {
  const manage = canManageTasks(input.access);
  const statuses = VIEW_STATUSES[input.view];
  const where: Prisma.AgencyTaskWhereInput = {
    agencyId: input.access.agencyId,
    ...(statuses ? { status: { in: [...statuses] } } : {}),
    ...(manage
      ? input.assigneeId ? { assigneeId: input.assigneeId } : {}
      : { OR: [{ assigneeId: input.userId }, { createdById: input.userId }] }),
  };
  const tasks = await prisma.agencyTask.findMany({
    where,
    orderBy: input.view === "open"
      ? [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }]
      : [{ updatedAt: "desc" }],
    take: LIST_LIMIT,
  });
  const userIds = [...new Set(tasks.flatMap((task) => [task.assigneeId, task.createdById].filter((id): id is string => Boolean(id))))];
  const propertyIds = [...new Set(tasks.flatMap((task) => (task.propertyId ? [task.propertyId] : [])))];
  const leadIds = [...new Set(tasks.flatMap((task) => (task.leadId ? [task.leadId] : [])))];
  const [users, properties, leads] = await Promise.all([
    findManyInChunks(userIds, 0, (ids) => prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })),
    findManyInChunks(propertyIds, 0, (ids) => prisma.property.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, slug: true, status: true, deletedAt: true } })),
    findManyInChunks(leadIds, 0, (ids) => prisma.lead.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, subject: true } })),
  ]);
  const userName = new Map(users.map((user) => [user.id, user.name]));
  const propertyOf = new Map(properties.map((property) => [property.id, property]));
  const leadOf = new Map(leads.map((lead) => [lead.id, lead]));
  return tasks.map((task) => ({
    ...task,
    assigneeName: userName.get(task.assigneeId) ?? null,
    creatorName: task.createdById ? userName.get(task.createdById) ?? null : null,
    property: task.propertyId ? propertyOf.get(task.propertyId) ?? null : null,
    lead: task.leadId ? leadOf.get(task.leadId) ?? null : null,
  }));
}

/** Tapşırıq formasının seçimləri: icraçılar, agentlik elanları və açıq agentlik müraciətləri. */
export async function getTaskFormOptions(access: AgencyAccess) {
  const [owner, members, properties, leads] = await Promise.all([
    prisma.user.findUnique({ where: { id: access.ownerUserId }, select: { name: true } }),
    prisma.agencyEmployee.findMany({
      where: { agencyId: access.agencyId, ...ACTIVE_MEMBER_WHERE, user: { isActive: true } },
      select: { userId: true, user: { select: { name: true } } },
      orderBy: { approvedAt: "asc" },
    }),
    prisma.property.findMany({
      where: { agencyId: access.agencyId, deletedAt: null },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.lead.findMany({
      where: {
        OR: [{ agencyId: access.agencyId }, { agencyId: null, property: { agencyId: access.agencyId } }],
        status: { in: [LEAD_STATUSES.NEW, LEAD_STATUSES.CONTACTED, LEAD_STATUSES.IN_PROGRESS] },
      },
      select: { id: true, name: true, subject: true, property: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return {
    assignees: [{ value: access.ownerUserId, label: owner?.name ?? access.agencyName }, ...members.map((member) => ({ value: member.userId, label: member.user.name }))],
    properties: properties.map((property) => ({ value: property.id, label: property.title })),
    leads: leads.map((lead) => ({ value: lead.id, label: `${lead.name} — ${lead.property?.title ?? lead.subject ?? ""}`.trim() })),
  };
}

/** Agentlik paneli (#216) üçün: son tarixi keçmiş açıq tapşırıqların sayı. */
export function countOverdueAgencyTasks(agencyId: string, now = new Date()): Promise<number> {
  return prisma.agencyTask.count({ where: { agencyId, status: { in: [...OPEN_AGENCY_TASK_STATUSES] }, dueAt: { lt: now } } });
}
