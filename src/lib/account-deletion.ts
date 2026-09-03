import { prisma } from "@/lib/prisma";
import { PROPERTY_STATUSES } from "@/lib/constants";
import { recordDomainEvent } from "@/lib/admin/events";

/**
 * D1 transaction dəstəkləmir. Ona görə silinmənin ilk atomik addımı hesabı
 * deaktiv edib durable marker yazır; qalan addımlar istənilən qədər təkrarlana bilər.
 */
export async function requestAccountDeletion(userId: string, now = new Date()) {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false, deletionRequestedAt: now },
  });
  await recordDomainEvent("account.deletion_requested", "User", userId);

  try {
    await finalizeAccountDeletion(userId, now);
    return { finalized: true };
  } catch (error) {
    console.error("[account] hesab silinməsi maintenance üçün növbədə qaldı:", error);
    return { finalized: false };
  }
}

/** Marker-li hesabı idempotent tamamlayır. Hesab artıq silinibsə uğurlu sayılır. */
export async function finalizeAccountDeletion(userId: string, now = new Date()): Promise<void> {
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { deletionRequestedAt: true, isActive: true },
  });
  if (!account) return;
  if (account.isActive || !account.deletionRequestedAt) {
    throw new Error("Hesab silinmə üçün işarələnməyib.");
  }

  await prisma.property.updateMany({
    where: { authorId: userId, deletedAt: null },
    data: { deletedAt: now, status: PROPERTY_STATUSES.ARCHIVED },
  });
  await prisma.user.delete({ where: { id: userId } });
}

/** Gündəlik maintenance üçün yarımçıq qalan silinmələri məhdud paketlə tamamlayır. */
export async function processPendingAccountDeletions(now = new Date(), limit = 50) {
  const pending = await prisma.user.findMany({
    where: { isActive: false, deletionRequestedAt: { not: null } },
    select: { id: true },
    orderBy: { deletionRequestedAt: "asc" },
    take: limit,
  });
  let completed = 0;
  let failed = 0;
  for (const account of pending) {
    try {
      await finalizeAccountDeletion(account.id, now);
      completed += 1;
    } catch (error) {
      failed += 1;
      console.error(`[account] növbədəki ${account.id} hesabı silinmədi:`, error);
    }
  }
  return { completed, failed };
}
