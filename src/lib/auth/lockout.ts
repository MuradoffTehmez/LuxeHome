/**
 * Hesab səviyyəsində kilid.
 *
 * IP limiti bot selini kəsir, amma IP dəyişdirən hədəflənmiş parol sınağını yalnız
 * hesaba bağlı sayğac dayandırır. İki qat bir-birini əvəz etmir.
 */

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

export function shouldLock(failedAttempts: number): boolean {
  return failedAttempts >= MAX_FAILED_ATTEMPTS;
}

export function lockUntil(now: Date): Date {
  return new Date(now.getTime() + LOCK_DURATION_MS);
}

export function isLockActive(lockedUntil: Date | null, now: Date): boolean {
  if (!lockedUntil) return false;
  return lockedUntil.getTime() > now.getTime();
}
