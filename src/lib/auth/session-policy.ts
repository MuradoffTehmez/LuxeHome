/**
 * Sessiya müddət siyasəti.
 *
 * D1-dən asılı olmayan saf funksiyalar kimi ayrılıb ki, davranış verilənlər bazası
 * qaldırmadan test edilə bilsin — müddət hesabı səhv olsa, ya istifadəçi hər saat
 * çıxarılar, ya da oğurlanmış cookie süresiz işləyər.
 */

/** Sürüşən müddət: hər aktivlikdə uzadılır. */
export const SLIDING_LIFETIME_MS = 8 * 60 * 60 * 1000;

/** Mütləq son həd: yaradılmadan bu qədər sonra uzatma daha işləmir. */
export const ABSOLUTE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionLifetime = {
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
};

export function isSessionUsable(session: SessionLifetime, now: Date): boolean {
  if (session.revokedAt) return false;
  if (session.expiresAt.getTime() <= now.getTime()) return false;
  if (now.getTime() - session.createdAt.getTime() >= ABSOLUTE_LIFETIME_MS) return false;
  return true;
}

/** Uzadılmış son tarix — mütləq həddi heç vaxt aşmır. */
export function nextExpiry(createdAt: Date, now: Date): Date {
  const sliding = now.getTime() + SLIDING_LIFETIME_MS;
  const absolute = createdAt.getTime() + ABSOLUTE_LIFETIME_MS;
  return new Date(Math.min(sliding, absolute));
}
