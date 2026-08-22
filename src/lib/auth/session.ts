import { prisma } from "@/lib/prisma";
import type { AccountType, Role } from "@/lib/constants";
import { SLIDING_LIFETIME_MS, isSessionUsable, nextExpiry } from "./session-policy";
import type { AuthUser } from "./types";

/**
 * D1-də saxlanan sessiyalar.
 *
 * Stateless JWT seçilməyib: 2FA-lı sistemdə oğurlanmış cookie-ni və ya işdən çıxan
 * əməkdaşın girişini dərhal ləğv etmək imkanı mütləqdir. Admin trafiki azdır,
 * sorğu başına bir D1 oxunuşu nəzərə çarpmır.
 */

type CreateSessionInput = {
  userId: string;
  totpCounter?: number | null;
  ip?: string | null;
  userAgent?: string | null;
};

export async function createSession(input: CreateSessionInput) {
  const now = new Date();
  return prisma.session.create({
    data: {
      userId: input.userId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SLIDING_LIFETIME_MS),
      lastSeenAt: now,
      totpCounter: input.totpCounter ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

/** Sessiyanı və sahibini birlikdə oxuyur; etibarsızdırsa `null`. */
export async function resolveSession(sid: string): Promise<AuthUser | null> {
  const session = await prisma.session.findUnique({
    where: { id: sid },
    select: {
      createdAt: true,
      expiresAt: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          accountType: true,
          isActive: true,
          mustChangePassword: true,
          totpEnabledAt: true,
        },
      },
    },
  });

  if (!session || !session.user.isActive) return null;
  if (!isSessionUsable(session, new Date())) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as Role,
    accountType: session.user.accountType as AccountType,
    mustChangePassword: session.user.mustChangePassword,
    totpEnabled: session.user.totpEnabledAt !== null,
  };
}

/** Aktivlikdə müddəti uzadır. Mütləq həddi aşmır. */
export async function touchSession(sid: string): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { id: sid },
    select: { createdAt: true, expiresAt: true, revokedAt: true },
  });
  if (!session || !isSessionUsable(session, new Date())) return;

  const now = new Date();
  await prisma.session.update({
    where: { id: sid },
    data: { lastSeenAt: now, expiresAt: nextExpiry(session.createdAt, now) },
  });
}

export async function revokeSession(sid: string): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sid, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessions(userId: string, exceptSid?: string): Promise<void> {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSid ? { id: { not: exceptSid } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}

export async function listSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, createdAt: true, lastSeenAt: true, ip: true, userAgent: true },
  });
}

/**
 * Eyni TOTP addımı ilə artıq sessiya açılıbmı — şəbəkədən tutulmuş kodun
 * 30 saniyə ərzində yenidən oynadılmasının qarşısını alır.
 */
export async function isTotpStepUsed(userId: string, totpCounter: number): Promise<boolean> {
  const existing = await prisma.session.findFirst({
    where: { userId, totpCounter },
    select: { id: true },
  });
  return existing !== null;
}

/** Müddəti çoxdan bitmiş sətirlərin təmizlənməsi — girişdə fürsətçi çağırılır. */
export async function pruneExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}
