import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES } from "@/lib/constants";

/**
 * Eyni VÖEN ilə ikinci agentlik hesabı açılmır (#157): təsdiqlənmiş agentliyin adını
 * daşıyan saxta hesab VÖEN-i kopyalayıb panelə «real şirkət» kimi düşə bilərdi.
 * Yalnız aktiv agentlik hesabları sayılır — silinmə gözləyən hesab VÖEN-i bağlamır.
 * Real sahib bu xətanı görsə, admin köhnə hesabı paneldən düzəldir.
 */
export async function isAgencyTaxIdTaken(taxId: string, exceptUserId?: string): Promise<boolean> {
  const other = await prisma.user.findFirst({
    where: {
      companyTaxId: taxId,
      accountType: ACCOUNT_TYPES.AGENCY,
      isActive: true,
      ...(exceptUserId ? { id: { not: exceptUserId } } : {}),
    },
    select: { id: true },
  });
  return other != null;
}
