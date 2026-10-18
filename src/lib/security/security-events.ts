import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/auth/rate-limit";
import { LOGIN_ATTEMPT_RETENTION_DAYS, SECURITY_EVENT_RETENTION_DAYS } from "./retention-policy";

/**
 * Təhlükəsizlik hadisələri jurnalı (#264, PRD 23.1/23.4). Giriş cəhdləri ayrıca `LoginAttempt`-dədir; burada
 * onlardan törəyən və ya onlara düşməyən hadisələr saxlanılır. Yazılış **heç vaxt atmır** — jurnal xətası
 * girişi və ya əməliyyatı sındırmamalıdır. Təfsilata parol, token, cookie yazma.
 */
export { SECURITY_EVENT_KINDS, type SecurityEventKind } from "./security-event-kinds";
import type { SecurityEventKind } from "./security-event-kinds";


const DETAIL_MAX = 500;
const AGENT_MAX = 300;

async function requestContext(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const requestHeaders = await headers();
    return { ip: clientIp(requestHeaders), userAgent: requestHeaders.get("user-agent")?.slice(0, AGENT_MAX) ?? null };
  } catch {
    // Sorğu kontekstindən kənarda (cron, test) başlıq yoxdur.
    return { ip: null, userAgent: null };
  }
}

export async function recordSecurityEvent(
  kind: SecurityEventKind,
  input: { userId?: string | null; ip?: string | null; userAgent?: string | null; detail?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    const context = input.ip === undefined || input.userAgent === undefined ? await requestContext() : { ip: null, userAgent: null };
    const detail = input.detail ? JSON.stringify(input.detail).slice(0, DETAIL_MAX) : null;
    await prisma.securityEvent.create({
      data: {
        kind,
        userId: input.userId ?? null,
        ip: input.ip === undefined ? context.ip : input.ip,
        userAgent: (input.userAgent === undefined ? context.userAgent : input.userAgent)?.slice(0, AGENT_MAX) ?? null,
        detail,
      },
    });
  } catch (error) {
    console.error("[security] hadisə yazılmadı:", error instanceof Error ? error.message : error);
  }
}

/** Saxlama müddəti bitmiş hadisə və giriş cəhdlərini silir (idempotent). */
export async function purgeSecurityLogs(now = new Date()): Promise<{ events: number; loginAttempts: number }> {
  const [events, loginAttempts] = await Promise.all([
    prisma.securityEvent.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - SECURITY_EVENT_RETENTION_DAYS * 86_400_000) } } }),
    prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - LOGIN_ATTEMPT_RETENTION_DAYS * 86_400_000) } } }),
  ]);
  return { events: events.count, loginAttempts: loginAttempts.count };
}
