import { prisma } from "@/lib/prisma";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/constants";

/**
 * Müraciətlər lövhəsi (#105) — status sütunları və SLA xəbərdarlıqları.
 *
 * Lövhə siyahının əvəzi deyil: sütun başına ən son `BOARD_COLUMN_LIMIT` müraciət
 * göstərilir, tam tarixçə `/admin/muracietler` siyahısındadır. Bağlanmış müraciətlər
 * yalnız son 30 günlükdür — köhnələri lövhəni yükləməsin.
 */

export const BOARD_COLUMNS: LeadStatus[] = [
  LEAD_STATUSES.NEW,
  LEAD_STATUSES.CONTACTED,
  LEAD_STATUSES.IN_PROGRESS,
  LEAD_STATUSES.COMPLETED,
  LEAD_STATUSES.CLOSED,
];
export const BOARD_COLUMN_LIMIT = 50;

const HOUR = 60 * 60 * 1000;
/** Yeni müraciətə bu müddətdə cavab verilməlidir. */
export const NEW_LEAD_SLA_HOURS = 24;
/** İşdə olan müraciət bu qədər yenilənməyibsə «unudulub» sayılır. */
export const STALE_LEAD_DAYS = 3;
const CLOSED_WINDOW_DAYS = 30;

export type LeadSla = "overdue" | "stale" | null;

/** SLA vəziyyəti — saf funksiya, test olunur. */
export function leadSla(lead: { status: string; createdAt: Date; updatedAt: Date }, now = Date.now()): LeadSla {
  if (lead.status === LEAD_STATUSES.NEW) {
    return now - lead.createdAt.getTime() > NEW_LEAD_SLA_HOURS * HOUR ? "overdue" : null;
  }
  if (lead.status === LEAD_STATUSES.CONTACTED || lead.status === LEAD_STATUSES.IN_PROGRESS) {
    return now - lead.updatedAt.getTime() > STALE_LEAD_DAYS * 24 * HOUR ? "stale" : null;
  }
  return null;
}

const boardSelect = {
  id: true,
  name: true,
  phone: true,
  subject: true,
  source: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  assigneeId: true,
  assignee: { select: { name: true } },
  property: { select: { title: true } },
} as const;

export async function getLeadBoard(options: { assigneeId?: string } = {}) {
  const closedSince = new Date(Date.now() - CLOSED_WINDOW_DAYS * 24 * HOUR);
  const columns = await Promise.all(
    BOARD_COLUMNS.map(async (status) => {
      const where = {
        status,
        ...(options.assigneeId ? { assigneeId: options.assigneeId } : {}),
        ...(status === LEAD_STATUSES.CLOSED || status === LEAD_STATUSES.COMPLETED ? { updatedAt: { gte: closedSince } } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.lead.findMany({ where, select: boardSelect, orderBy: { createdAt: "desc" }, take: BOARD_COLUMN_LIMIT }),
        prisma.lead.count({ where }),
      ]);
      return { status, total, items };
    }),
  );
  return columns;
}

export type LeadBoardColumn = Awaited<ReturnType<typeof getLeadBoard>>[number];
