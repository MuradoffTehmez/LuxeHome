import { prisma } from "@/lib/prisma";
import { PROPERTY_STATUSES, PROPERTY_STATUS_SOURCES } from "@/lib/constants";
import { recordPropertyStatusChanges } from "@/lib/property-status-history";
import { recordDomainEvent } from "@/lib/admin/events";
import { handOverListings } from "@/lib/accounts/agency-listings";
import { releaseAgentClients } from "@/lib/accounts/crm";
import { chunkForD1 } from "@/lib/d1-chunks";

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

  const listings = await prisma.property.findMany({
    where: { authorId: userId, deletedAt: null },
    select: { id: true, status: true, agencyId: true },
  });
  // Agentlik elanı agentin hesabı ilə silinmir (#210, PRD 6.2): sahibinə keçir. Agentlik sahibinin
  // öz hesabı silinəndə isə agentlik də gedir — onun elanları adi qaydada arxivlənir.
  const agencyIds = [...new Set(listings.flatMap((listing) => (listing.agencyId ? [listing.agencyId] : [])))];
  const handedAgencies = new Set<string>();
  if (agencyIds.length > 0) {
    const agencies = await prisma.agency.findMany({ where: { id: { in: agencyIds } }, select: { id: true, userId: true } });
    for (const agency of agencies) {
      if (agency.userId === userId) continue;
      await handOverListings(userId, agency.userId, agency.id);
      handedAgencies.add(agency.id);
    }
  }
  const archived = listings.filter((listing) => !listing.agencyId || !handedAgencies.has(listing.agencyId));
  await prisma.property.updateMany({
    where: { authorId: userId, deletedAt: null },
    data: { deletedAt: now, status: PROPERTY_STATUSES.ARCHIVED },
  });
  // Tarixçə (#204) hesab silinməzdən əvvəl yazılır; icraçı göstərilmir — hesab birazdan silinir.
  await recordPropertyStatusChanges(
    archived.map((listing) => ({ propertyId: listing.id, from: listing.status })),
    { to: PROPERTY_STATUSES.ARCHIVED, source: PROPERTY_STATUS_SOURCES.SYSTEM, note: "Hesab silindi" },
  );
  // Mini CRM (#226): başqa agentliyin mühitindəki kartlar o agentliyin sahibinə keçir; qalanlar
  // (şəxsi kartlar — üçüncü şəxslərin əlaqə məlumatı) hesabla birlikdə silinir.
  const clientAgencies = await prisma.crmClient.findMany({
    where: { ownerId: userId, agencyId: { not: null } },
    distinct: ["agencyId"],
    select: { agency: { select: { id: true, userId: true } } },
  });
  for (const { agency } of clientAgencies) {
    if (agency && agency.userId !== userId) await releaseAgentClients({ agencyId: agency.id, userId, ownerUserId: agency.userId });
  }
  // Silinən kartlara (şəxsi kartlar və hesab agentlik sahibidirsə agentliklə kaskadla gedən kartlar)
  // bağlı müraciətlərin FK-sız `clientId`-si boşaldılır — `deleteClient()` ilə eyni qayda.
  const removed = await prisma.crmClient.findMany({
    where: { OR: [{ ownerId: userId }, { agency: { userId } }] },
    select: { id: true },
  });
  for (const chunk of chunkForD1(removed.map((item) => item.id), 0)) {
    await prisma.lead.updateMany({ where: { clientId: { in: chunk } }, data: { clientId: null } });
  }
  await prisma.crmClient.deleteMany({ where: { ownerId: userId } });
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
