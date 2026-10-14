import { prisma } from "@/lib/prisma";
import { AGENCY_EMPLOYEE_STATUSES, LISTING_HANDOVER, type ListingHandover } from "@/lib/constants";
import { findManyInChunks } from "@/lib/d1-chunks";
import { revalidatePublicContent } from "@/lib/revalidate-public";

/**
 * Agent komandadan çıxanda elanlarının taleyi (#159, C2).
 *
 * Elan agentin hesabındadır (`authorId`). Əvvəl agent çıxanda elanlar səssizcə onunla
 * qalırdı və agentliyin portfelindən düşürdü. İndi qərar verilir:
 * - `KEEP` — elanlar agentdə qalır (agent müstəqil davam edir);
 * - `AGENCY` — agentlik sahibinə təhvil verilir;
 * - `AGENT` — eyni agentliyin başqa təsdiqlənmiş agentinə təhvil verilir (yalnız sahib seçir).
 *
 * Müraciətlər (`Lead.propertyId`), qiymət tarixçəsi, şəkillər və paketlər elana bağlıdır,
 * ona görə elanla birlikdə keçir — yeni müəllif onları kabinetində görür.
 */

export function isListingHandover(value: unknown): value is ListingHandover {
  return typeof value === "string" && (Object.values(LISTING_HANDOVER) as string[]).includes(value);
}

/** Hər istifadəçinin silinməmiş elan sayı (komanda siyahısında göstərmək üçün). */
export async function countOwnListings(userIds: string[]): Promise<Map<string, number>> {
  const rows = await findManyInChunks(userIds, 1, (chunk) =>
    prisma.property.groupBy({
      by: ["authorId"],
      where: { authorId: { in: chunk }, deletedAt: null },
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
}): Promise<HandoverTarget | null> {
  if (input.handover === LISTING_HANDOVER.KEEP) return null;
  if (input.handover === LISTING_HANDOVER.AGENCY) return { ok: true, userId: input.ownerUserId };
  if (!input.targetUserId || input.targetUserId === input.fromUserId) return { ok: false };
  const member = await prisma.agencyEmployee.findFirst({
    where: { agencyId: input.agencyId, userId: input.targetUserId, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
    select: { userId: true },
  });
  return member ? { ok: true, userId: member.userId } : { ok: false };
}

/** Elanları təhvil verir; təhvil verilən elan sayını qaytarır. */
export async function handOverListings(fromUserId: string, toUserId: string): Promise<number> {
  const { count } = await prisma.property.updateMany({
    where: { authorId: fromUserId, deletedAt: null },
    data: { authorId: toUserId },
  });
  // Kart və detal satıcı nişanını müəllifdən qurur — elan keşi bir dəfə təzələnir.
  if (count > 0) revalidatePublicContent("property");
  return count;
}
