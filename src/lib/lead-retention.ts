import { prisma } from "@/lib/prisma";
import { recordDomainEvent } from "@/lib/admin/events";
import { LEAD_ALERT_STEPS } from "@/lib/accounts/lead-alerts";
import { LEAD_RETENTION_YEARS } from "@/lib/security/retention-policy";

/**
 * Müraciət saxlama müddəti (#287): Məxfilik siyasətinin 8-ci bölməsi müraciət, baxış sorğusu, rezervasiya və açıq
 * qapı qeydiyyatının **ən çoxu 3 il** saxlandığını vəd edir — bu iş həmin vədi icra edir.
 *
 * - Hədd `createdAt`-dır: müraciət sonradan yenilənsə də yaradılandan 3 **təqvim ili** keçibsə silinir (29 fevral
 *   düşən dövrdə gün sayı ilə hesablamaq qeydi bir gün artıq saxlayardı).
 * - Müraciətin surəti bildirişlərdə də qalır: `Notification.content` ziyarətçinin adını, `dedupeKey` müraciət id-sini
 *   daşıyır. Ona görə müraciət və rezervasiya bildirişləri (`notificationKeysFor*`) qeydin özündən **əvvəl** silinir —
 *   yarımçıq qalan hissə növbəti çağırışda yenidən tapılır.
 * - `LeadActivity` və `ReservationEvent` FK `onDelete: Cascade` ilə gedir. FK-sız istinadlar (`AgencyTask.leadId`,
 *   `OpenHouseRegistration.leadId`) silinmədən əvvəl boşaldılır ki, sallanan id qalmasın.
 * - D1-də tranzaksiya yoxdur və bir sorğuda ən çox 100 parametr var: id-lər `BATCH_SIZE`-lıq hissələrlə oxunub
 *   silinir, çağırış başına `MAX_BATCHES` hissə (Worker subrequest limiti). Qalanı növbəti gündəlik işdə gedir —
 *   addım idempotentdir, yarımçıq qalan hissə sonrakı çağırışda yenidən tapılır.
 */
const BATCH_SIZE = 80;
const MAX_BATCHES = 10;
/** Bildiriş silmə hissəsi: hər id bir neçə `dedupeKey` şərti verir (D1-də 100 parametr həddi). */
const NOTIFICATION_CHUNK = 12;

export function leadRetentionCutoff(now: Date): Date {
  const cutoff = new Date(now.getTime());
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - LEAD_RETENTION_YEARS);
  return cutoff;
}

type KeyCondition = { dedupeKey: string } | { dedupeKey: { startsWith: string } };

/** Müraciət bildirişlərinin açarları — `account-notices.ts`-dəki `listing-lead`, `agency-lead`, `lead-routed`, `lead-<pillə>`. */
export function notificationKeysForLead(id: string): KeyCondition[] {
  return [
    { dedupeKey: `listing-lead:${id}` },
    { dedupeKey: `agency-lead:${id}` },
    { dedupeKey: { startsWith: `lead-routed:${id}:` } },
    ...LEAD_ALERT_STEPS.map((step) => ({ dedupeKey: { startsWith: `lead-${step}:${id}:` } })),
  ];
}

/** Rezervasiya bildirişləri — sorğu (`reservation-requested`) və status dəyişiklikləri (`reservation-status`). */
export function notificationKeysForReservation(id: string): KeyCondition[] {
  return [{ dedupeKey: `reservation-requested:${id}` }, { dedupeKey: { startsWith: `reservation-status:${id}:` } }];
}

async function deleteNotifications(ids: string[], keysFor: (id: string) => KeyCondition[]): Promise<number> {
  let total = 0;
  for (let index = 0; index < ids.length; index += NOTIFICATION_CHUNK) {
    const chunk = ids.slice(index, index + NOTIFICATION_CHUNK);
    total += (await prisma.notification.deleteMany({ where: { OR: chunk.flatMap(keysFor) } })).count;
  }
  return total;
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
  let notifications = 0;

  const leads = await purgeInBatches(
    async (take) =>
      (await prisma.lead.findMany({ where: { createdAt: { lt: cutoff } }, select: { id: true }, orderBy: { createdAt: "asc" }, take })).map(
        (row) => row.id,
      ),
    async (ids) => {
      notifications += await deleteNotifications(ids, notificationKeysForLead);
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
    async (ids) => {
      notifications += await deleteNotifications(ids, notificationKeysForReservation);
      return (await prisma.reservation.deleteMany({ where: { id: { in: ids } } })).count;
    },
  );

  const openHouseRegistrations = await purgeInBatches(
    async (take) =>
      (
        await prisma.openHouseRegistration.findMany({ where: { createdAt: { lt: cutoff } }, select: { id: true }, orderBy: { createdAt: "asc" }, take })
      ).map((row) => row.id),
    async (ids) => (await prisma.openHouseRegistration.deleteMany({ where: { id: { in: ids } } })).count,
  );

  const result = { leads, reservations, openHouseRegistrations, notifications };
  if (leads + reservations + openHouseRegistrations > 0) {
    // Fərdi məlumatsız say — silinmə faktı izlənə bilsin.
    await recordDomainEvent("lead.retention_purged", "Lead", "maintenance", result).catch(() => undefined);
  }
  return result;
}
