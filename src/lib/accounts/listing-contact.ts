import { prisma } from "@/lib/prisma";
import type { ListingContact } from "@/app/[locale]/(account)/kabinet/elanlar/yeni/public-property-form";

/** Sehrbazın «Əlaqə məlumatları» addımı üçün hesabın profil məlumatı. */
export async function getListingContact(userId: string): Promise<ListingContact> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true },
  });
  return { name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? null };
}
