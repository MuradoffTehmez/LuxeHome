import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/prisma";

/**
 * Elanın gündəlik sayğacları (#161, B2): baxış, «Nömrəni göstər» və WhatsApp klikləri.
 *
 * Sətir (elan, gün) üzrədir və `INSERT … ON CONFLICT DO UPDATE` ilə artırılır — D1-də
 * tranzaksiya olmadığı üçün «oxu-yaz» yarışı sayı itirərdi, bu isə bir atomik ifadədir.
 * Yazma cavabı gözlətmir (`waitUntil`) və heç vaxt atmır: sayğac səhifədən vacib deyil.
 */

export type ListingStatField = "views" | "contactReveals" | "whatsappClicks";

/** Bakı vaxtı ilə gün (UTC+4, yay vaxtı yoxdur) — kabinet «bu gün»ü yerli saatla görür. */
export function bakuDay(date: Date = new Date()): string {
  return new Date(date.getTime() + 4 * 3_600_000).toISOString().slice(0, 10);
}

const STATEMENTS: Record<ListingStatField, string> = {
  views: 'INSERT INTO "PropertyDailyStat" ("propertyId", "day", "views") VALUES (?, ?, 1) ON CONFLICT ("propertyId", "day") DO UPDATE SET "views" = "views" + 1',
  contactReveals: 'INSERT INTO "PropertyDailyStat" ("propertyId", "day", "contactReveals") VALUES (?, ?, 1) ON CONFLICT ("propertyId", "day") DO UPDATE SET "contactReveals" = "contactReveals" + 1',
  whatsappClicks: 'INSERT INTO "PropertyDailyStat" ("propertyId", "day", "whatsappClicks") VALUES (?, ?, 1) ON CONFLICT ("propertyId", "day") DO UPDATE SET "whatsappClicks" = "whatsappClicks" + 1',
};

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
