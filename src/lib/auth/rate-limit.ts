import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/prisma";
import { isLockActive, lockUntil, shouldLock } from "./lockout";

/**
 * İki qatlı müdafiə.
 *
 * IP üzrə Workers binding-i ucuzdur və DB-yə toxunmadan bot selini kəsir;
 * hesab üzrə D1 kilidi isə IP dəyişdirən hədəflənmiş hücumu dayandırır.
 */

export type FailureReason =
  | "BAD_PASSWORD"
  | "BAD_TOTP"
  | "LOCKED"
  | "RATE_LIMITED"
  | "INACTIVE";

/** Sorğunun mənbə IP-si — Cloudflare-in doğma başlığı etibarlıdır. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** `true` = limit aşılmayıb, davam etmək olar. */
export async function checkLoginLimit(ip: string): Promise<boolean> {
  // Lokal `next dev` mühitində binding olmaya bilər — limit orada tətbiq edilmir
  const limiter = getCloudflareContext().env.LOGIN_LIMIT;
  if (!limiter) return true;

  const { success } = await limiter.limit({ key: `login:${ip}` });
  return success;
}

/**
 * İctimai forma (əlaqə, müraciət) üçün IP limiti — `true` = davam etmək olar.
 *
 * Panel yazılarından ayrı binding-dir: əməkdaşın normal iş tempi ilə anonim
 * ziyarətçinin forma göndərişi eyni büdcəni bölüşməməlidir.
 */
export async function checkContactLimit(ip: string): Promise<boolean> {
  const limiter = getCloudflareContext().env.CONTACT_LIMIT;
  if (!limiter) return true;

  const { success } = await limiter.limit({ key: `contact:${ip}` });
  return success;
}

/** Brauzer monitorinq hadisələri üçün ayrıca, daha geniş büdcə. */
export async function checkMonitoringLimit(ip: string): Promise<boolean> {
  const limiter = getCloudflareContext().env.MONITORING_LIMIT;
  if (!limiter) return true;

  const { success } = await limiter.limit({ key: `monitoring:${ip}` });
  return success;
}

export function isAccountLocked(lockedUntil: Date | null): boolean {
  return isLockActive(lockedUntil, new Date());
}

/**
 * Uğursuz cəhdi qeyd edir və lazım gələrsə hesabı kilidləyir.
 * Qaytarır: hesab məhz bu cəhdlə kilidləndimi (çağıran bildiriş göndərir).
 *
 * `userId` yalnız hesab həqiqətən mövcud olanda verilir — mövcud olmayan e-poçt üçün
 * sayğac artırmaq mümkün deyil, jurnal isə hər halda yazılır.
 */
export async function registerFailure(
  userId: string | null,
  email: string,
  ip: string,
  reason: FailureReason,
): Promise<boolean> {
  let locked = false;

  if (userId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { failedAttempts: { increment: 1 } },
      select: { failedAttempts: true },
    });

    if (shouldLock(user.failedAttempts)) {
      await prisma.user.update({
        where: { id: userId },
        data: { lockedUntil: lockUntil(new Date()) },
      });
      locked = true;
    }
  }

  // D1-də transaction yoxdur: jurnal kritik yol deyil, ona görə ən sonda yazılır
  await prisma.loginAttempt.create({ data: { email, ip, success: false, reason } });
  return locked;
}

export async function registerSuccess(userId: string, email: string, ip: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await prisma.loginAttempt.create({ data: { email, ip, success: true, reason: "OK" } });
}

/** Sürət limiti səbəbindən dayandırılmış cəhd — istifadəçi sətri hələ məlum deyil. */
export async function logRateLimited(email: string, ip: string): Promise<void> {
  await prisma.loginAttempt.create({
    data: { email, ip, success: false, reason: "RATE_LIMITED" },
  });
}
