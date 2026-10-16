import { prisma } from "@/lib/prisma";
import { AGENCY_EMPLOYEE_STATUSES, LISTING_HANDOVER, type ListingHandover } from "@/lib/constants";
import { findManyInChunks } from "@/lib/d1-chunks";
import { revalidatePublicContent } from "@/lib/revalidate-public";

/**
 * Agent komandadan çıxanda elanlarının taleyi (#159, #210 — PRD 6.2, 6.5).
 *
 * Yalnız **agentlik elanları** (`Property.agencyId` = həmin agentlik) təhvil verilir və agentdə
 * qala bilməz: sahibə (`AGENCY`) və ya eyni agentliyin başqa təsdiqlənmiş agentinə (`AGENT`, yalnız
 * sahib seçir). Köhnə `KEEP` `AGENCY` sayılır. Agentin şəxsi elanları (`agencyId = null`) onda qalır.
 *
 * Müraciətlər (`Lead.propertyId`), qiymət tarixçəsi, şəkillər və paketlər elana bağlıdır,
 * ona görə elanla birlikdə keçir — yeni müəllif onları kabinetində görür.
 */

export function isListingHandover(value: unknown): value is ListingHandover {
  return typeof value === "string" && (Object.values(LISTING_HANDOVER) as string[]).includes(value);
}

/**
 * Hər istifadəçinin silinməmiş elan sayı (komanda siyahısında göstərmək üçün). `agencyId`
 * verilsə yalnız həmin agentliyin elanları sayılır — ayrılmada təhvil olunacaq olanlar.
 */
export async function countOwnListings(userIds: string[], agencyId?: string): Promise<Map<string, number>> {
  const rows = await findManyInChunks(userIds, 2, (chunk) =>
    prisma.property.groupBy({
      by: ["authorId"],
      where: { authorId: { in: chunk }, deletedAt: null, ...(agencyId ? { agencyId } : {}) },
      _count: { _all: true },
    }),
  );
  return new Map(rows.flatMap((row) => (row.authorId ? [[row.authorId, row._count._all] as const] : [])));
}

export type HandoverTarget = { ok: true; userId: string } | { ok: false };

/**
 * Təhvil alanı müəyyən edir və yoxlayır: sahib və ya həmin agentliyin təsdiqlənmiş
 * (çıxan agentdən başqa) agenti. Kənar istifadəçinin id-si qəbul olunmur.
 */
export async function resolveHandoverTarget(input: {
  handover: ListingHandover;
  agencyId: string;
  ownerUserId: string;
  fromUserId: string;
  targetUserId?: string | null;
}): Promise<HandoverTarget> {
  // Agentlik elanı agentdə qalmır (PRD 6.2): köhnə client-in `KEEP`-i sahibə təhvil deməkdir.
  if (input.handover !== LISTING_HANDOVER.AGENT) return { ok: true, userId: input.ownerUserId };
  if (!input.targetUserId || input.targetUserId === input.fromUserId) return { ok: false };
  const member = await prisma.agencyEmployee.findFirst({
    where: { agencyId: input.agencyId, userId: input.targetUserId, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
    select: { userId: true },
  });
  return member ? { ok: true, userId: member.userId } : { ok: false };
}

/**
 * Agentliyin bu agentdəki elanlarını təhvil verir; təhvil verilən elan sayını qaytarır.
 * Agentə təyin edilmiş (`assignedAgentId`) agentlik elanlarından da təyinat götürülür —
 * ayrılan agent agentliyin elanlarında məsul kimi görünməməlidir (PRD 6.2.2).
 */
export async function handOverListings(fromUserId: string, toUserId: string, agencyId: string): Promise<number> {
  const { count } = await prisma.property.updateMany({
    where: { authorId: fromUserId, agencyId, deletedAt: null },
    data: { authorId: toUserId },
  });
  const profile = await prisma.agentProfile.findUnique({ where: { userId: fromUserId }, select: { id: true } });
  if (profile) {
    await prisma.property.updateMany({
      where: { assignedAgentId: profile.id, agencyId },
      data: { assignedAgentId: null },
    });
  }
  // Kart və detal satıcı nişanını müəllifdən qurur — elan keşi bir dəfə təzələnir.
  if (count > 0) revalidatePublicContent("property");
  return count;
}
