import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { SECURITY_EVENT_KINDS, type SecurityEventKind } from "./security-event-kinds";

const DAY = 86_400_000;
export const SECURITY_EVENTS_PAGE_SIZE = 50;

export function isSecurityEventKind(value: unknown): value is SecurityEventKind {
  return typeof value === "string" && (Object.values(SECURITY_EVENT_KINDS) as string[]).includes(value);
}

/**
 * Təhlükəsizlik icmalı (#264, PRD 23.1/23.4): son 24 saatın giriş göstəriciləri, uğursuz cəhdlərin ən çox gəldiyi
 * IP-lər, hazırda kilidli hesablar və hadisə jurnalı (növ filtri, səhifələmə). Parol və ya token göstərilmir.
 */
export async function getSecurityOverview(input: { kind?: SecurityEventKind; page?: number; now?: Date } = {}) {
  const now = input.now ?? new Date();
  const since = new Date(now.getTime() - DAY);
  const page = Math.max(1, input.page ?? 1);
  const eventWhere = input.kind ? { kind: input.kind } : {};
  const countKind = (kind: SecurityEventKind) => prisma.securityEvent.count({ where: { kind, createdAt: { gte: since } } });
  const [failedLogins, successfulLogins, rateLimited, lockedAccounts, newDevice, forbidden, csrf, topIps, events, total] = await Promise.all([
    prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: since } } }),
    prisma.loginAttempt.count({ where: { success: true, createdAt: { gte: since } } }),
    // Giriş limiti `LoginAttempt`-də, panel/kabinet yazma limiti isə yalnız `SecurityEvent`-dədir — ikisi də sayılır.
    Promise.all([
      prisma.loginAttempt.count({ where: { reason: "RATE_LIMITED", createdAt: { gte: since } } }),
      countKind(SECURITY_EVENT_KINDS.RATE_LIMITED),
    ]).then(([logins, writes]) => logins + writes),
    prisma.user.count({ where: { lockedUntil: { gt: now } } }),
    countKind(SECURITY_EVENT_KINDS.NEW_DEVICE_LOGIN),
    countKind(SECURITY_EVENT_KINDS.FORBIDDEN),
    countKind(SECURITY_EVENT_KINDS.CSRF_BLOCKED),
    prisma.loginAttempt.groupBy({
      by: ["ip"],
      where: { success: false, createdAt: { gte: since }, ip: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { ip: "desc" } },
      take: 8,
    }),
    prisma.securityEvent.findMany({
      where: eventWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * SECURITY_EVENTS_PAGE_SIZE,
      take: SECURITY_EVENTS_PAGE_SIZE,
      select: { id: true, kind: true, userId: true, ip: true, userAgent: true, detail: true, createdAt: true },
    }),
    prisma.securityEvent.count({ where: eventWhere }),
  ]);
  const users = await findManyInChunks([...new Set(events.map((row) => row.userId).filter((id): id is string => Boolean(id)))], 0, (chunk) =>
    prisma.user.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true, email: true } }));
  const userOf = new Map(users.map((row) => [row.id, row]));
  return {
    stats: { failedLogins, successfulLogins, rateLimited, lockedAccounts, newDevice, forbidden, csrf },
    topIps: topIps.map((row) => ({ ip: row.ip ?? "—", count: row._count._all })),
    events: events.map((row) => ({ ...row, user: row.userId ? userOf.get(row.userId) ?? null : null })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / SECURITY_EVENTS_PAGE_SIZE)),
  };
}
