import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { agencyCompleteness, agentCompleteness, type Completeness } from "@/lib/accounts/profile-completeness";

/**
 * Kabinet ana səhifəsi üçün profil tamlığı (#157). Profil səhifəsi eyni hesabı öz
 * oxuduğu məlumatdan qurur; burada yalnız lazım olan sahələr ayrıca oxunur.
 * Agentlik və agentdən başqa hesab növləri üçün `null` (kart göstərilmir).
 */
export async function getProfileCompleteness(
  userId: string,
  accountType: string,
): Promise<{ kind: "agency" | "agent"; completeness: Completeness } | null> {
  if (accountType !== ACCOUNT_TYPES.AGENCY && accountType !== ACCOUNT_TYPES.AGENT) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phone: true,
      avatarUrl: true,
      companyTaxId: true,
      agency: {
        select: {
          logoUrl: true,
          coverUrl: true,
          description: true,
          whatsapp: true,
          address: true,
          workingHours: true,
          email: true,
          website: true,
          instagram: true,
        },
      },
      agentProfile: { select: { roleTitle: true, specialization: true, experienceYears: true, bio: true } },
    },
  });
  if (!user) return null;

  if (accountType === ACCOUNT_TYPES.AGENCY) {
    if (!user.agency) return null;
    return {
      kind: "agency",
      completeness: agencyCompleteness({ ...user.agency, phone: user.phone, taxId: user.companyTaxId }),
    };
  }
  return {
    kind: "agent",
    completeness: agentCompleteness({
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      roleTitle: user.agentProfile?.roleTitle ?? null,
      specialization: user.agentProfile?.specialization ?? null,
      experienceYears: user.agentProfile?.experienceYears ?? null,
      bio: user.agentProfile?.bio ?? null,
    }),
  };
}
