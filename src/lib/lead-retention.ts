import { prisma } from "@/lib/prisma";
import { recordDomainEvent } from "@/lib/admin/events";
import { LEAD_RETENTION_DAYS } from "@/lib/security/retention-policy";

/**
 * Müraciət saxlama müddəti (#287): Məxfilik siyasətinin 8-ci bölməsi müraciət, baxış sorğusu, rezervasiya və açıq
 * qapı qeydiyyatının **ən çoxu 3 il** saxlandığını vəd edir — bu iş həmin vədi icra edir.
 *
 * - Hədd `createdAt`-dır: müraciət sonradan yenilənsə də yaradılandan 3 il keçibsə silinir.
 * - `LeadActivity` və `ReservationEvent` FK `onDelete: Cascade` ilə gedir. FK-sız istinadlar (`AgencyTask.leadId`,
 *   `OpenHouseRegistration.leadId`) silinmədən əvvəl boşaldılır ki, sallanan id qalmasın.
 * - D1-də tranzaksiya yoxdur və bir sorğuda ən çox 100 parametr var: id-lər `BATCH_SIZE`-lıq hissələrlə oxunub
 *   silinir, çağırış başına `MAX_BATCHES` hissə (Worker subrequest limiti). Qalanı növbəti gündəlik işdə gedir —
 *   addım idempotentdir, yarımçıq qalan hissə sonrakı çağırışda yenidən tapılır.
 */
const BATCH_SIZE = 80;
const MAX_BATCHES = 10;
const DAY_MS = 86_400_000;

export function leadRetentionCutoff(now: Date): Date {
  return new Date(now.getTime() - LEAD_RETENTION_DAYS * DAY_MS);
}

async function purgeInBatches(
  findIds: (take: number) => Promise<string[]>,
  remove: (ids: string[]) => Promise<number>,
): Promise<number> {
  let total = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
    const ids = await findIds(BATCH_SIZE);
    if (ids.length === 0) break;
    total += await remove(ids);
    if (ids.length < BATCH_SIZE) break;
  }
  return total;
}

export async function purgeExpiredLeads(now: Date = new Date()) {
  const cutoff = leadRetentionCutoff(now);

  const leads = await purgeInBatches(
    async (take) =>
      (await prisma.lead.findMany({ where: { createdAt: { lt: cutoff } }, select: { id: true }, orderBy: { createdAt: "asc" }, take })).map(
        (row) => row.id,
      ),
    async (ids) => {
      await prisma.agencyTask.updateMany({ where: { leadId: { in: ids } }, data: { leadId: null } });
      await prisma.openHouseRegistration.updateMany({ where: { leadId: { in: ids } }, data: { leadId: null } });
      return (await prisma.lead.deleteMany({ where: { id: { in: ids } } })).count;
    },
  );

  const reservations = await purgeInBatches(
    async (take) =>
      (await prisma.reservation.findMany({ where: { createdAt: { lt: cutoff } }, select: { id: true }, orderBy: { createdAt: "asc" }, take })).map(
        (row) => row.id,
      ),
    async (ids) => (await prisma.reservation.deleteMany({ where: { id: { in: ids } } })).count,
  );

  const openHouseRegistrations = await purgeInBatches(
    async (take) =>
      (
        await prisma.openHouseRegistration.findMany({ where: { createdAt: { lt: cutoff } }, select: { id: true }, orderBy: { createdAt: "asc" }, take })
      ).map((row) => row.id),
    async (ids) => (await prisma.openHouseRegistration.deleteMany({ where: { id: { in: ids } } })).count,
  );

  const result = { leads, reservations, openHouseRegistrations };
  if (leads + reservations + openHouseRegistrations > 0) {
    // Fərdi məlumatsız say — silinmə faktı izlənə bilsin.
    await recordDomainEvent("lead.retention_purged", "Lead", "maintenance", result).catch(() => undefined);
  }
  return result;
}
