import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/prisma";
import { sha256Hex } from "@/lib/auth/crypto";

/**
 * Elanın gündəlik sayğacları (#161, B2): baxış, «Nömrəni göstər», WhatsApp və Telegram (#208) klikləri.
 *
 * Sətir (elan, gün) üzrədir və `INSERT … ON CONFLICT DO UPDATE` ilə artırılır — D1-də
 * tranzaksiya olmadığı üçün «oxu-yaz» yarışı sayı itirərdi, bu isə bir atomik ifadədir.
 * Yazma cavabı gözlətmir (`waitUntil`) və heç vaxt atmır: sayğac səhifədən vacib deyil.
 */

export type ListingStatField = "views" | "contactReveals" | "whatsappClicks" | "telegramClicks" | "uniqueViews";

/** Bakı vaxtı ilə gün (UTC+4, yay vaxtı yoxdur) — kabinet «bu gün»ü yerli saatla görür. */
export function bakuDay(date: Date = new Date()): string {
  return new Date(date.getTime() + 4 * 3_600_000).toISOString().slice(0, 10);
}

const STATEMENTS: Record<ListingStatField, string> = {
  views: 'INSERT INTO "PropertyDailyStat" ("propertyId", "day", "views") VALUES (?, ?, 1) ON CONFLICT ("propertyId", "day") DO UPDATE SET "views" = "views" + 1',
  contactReveals: 'INSERT INTO "PropertyDailyStat" ("propertyId", "day", "contactReveals") VALUES (?, ?, 1) ON CONFLICT ("propertyId", "day") DO UPDATE SET "contactReveals" = "contactReveals" + 1',
  whatsappClicks: 'INSERT INTO "PropertyDailyStat" ("propertyId", "day", "whatsappClicks") VALUES (?, ?, 1) ON CONFLICT ("propertyId", "day") DO UPDATE SET "whatsappClicks" = "whatsappClicks" + 1',
  telegramClicks: 'INSERT INTO "PropertyDailyStat" ("propertyId", "day", "telegramClicks") VALUES (?, ?, 1) ON CONFLICT ("propertyId", "day") DO UPDATE SET "telegramClicks" = "telegramClicks" + 1',
  uniqueViews: 'INSERT INTO "PropertyDailyStat" ("propertyId", "day", "uniqueViews") VALUES (?, ?, 1) ON CONFLICT ("propertyId", "day") DO UPDATE SET "uniqueViews" = "uniqueViews" + 1',
};

/** Unikal baxış açarları bu qədər gün saxlanılır (bu gün + dünən, Bakı gecəyarısı keçidi üçün). */
export const UNIQUE_VIEW_RETENTION_DAYS = 2;

/**
 * Unikal baxış (#236, PRD 11.3): eyni ziyarətçi gün ərzində bir dəfə sayılır. Açar xam IP deyil —
 * `AUTH_SECRET` ilə duzlanmış IP + brauzer + elan + gün heşidir. `INSERT OR IGNORE` atomikdir:
 * yalnız yeni sətir yarananda `uniqueViews` artırılır. Heç vaxt atmır.
 */
export async function recordUniqueView(input: { propertyId: string; ip: string; userAgent: string | null; now?: Date }): Promise<boolean> {
  try {
    const day = bakuDay(input.now);
    const visitorKey = (await sha256Hex(`${process.env.AUTH_SECRET ?? ""}:view:${input.ip}:${input.userAgent ?? ""}:${input.propertyId}:${day}`)).slice(0, 32);
    const inserted = await prisma.$executeRawUnsafe(
      'INSERT OR IGNORE INTO "PropertyUniqueView" ("propertyId", "day", "visitorKey") VALUES (?, ?, ?)',
      input.propertyId,
      day,
      visitorKey,
    );
    if (inserted === 0) return false;
    await incrementListingStat(input.propertyId, "uniqueViews", input.now);
    return true;
  } catch (error) {
    console.error("[stats] unikal baxış yazılmadı:", error instanceof Error ? error.message : error);
    return false;
  }
}

/** Gündəlik təmizlik: köhnə unikal baxış açarları (sayğac `PropertyDailyStat`-da qalır). */
export async function pruneUniqueViews(now = new Date()): Promise<number> {
  const cutoff = bakuDay(new Date(now.getTime() - UNIQUE_VIEW_RETENTION_DAYS * 86_400_000));
  const { count } = await prisma.propertyUniqueView.deleteMany({ where: { day: { lt: cutoff } } });
  return count;
}

export async function incrementListingStat(propertyId: string, field: ListingStatField, now = new Date()): Promise<void> {
  await prisma.$executeRawUnsafe(STATEMENTS[field], propertyId, bakuDay(now));
}

/** Fon rejimində artırır — cavabı gözlətmir, xətanı udur. */
export function recordListingStat(propertyId: string, field: ListingStatField): void {
  const task = incrementListingStat(propertyId, field).catch((error) => {
    // Silinmiş elan (FK) və ya keçici D1 xətası — sayğac səhifəni sındırmamalıdır.
    console.error(`[stats] «${field}:${propertyId}» artırılmadı:`, error instanceof Error ? error.message : error);
  });
  try {
    getCloudflareContext().ctx.waitUntil(task);
  } catch {
    void task;
  }
}
