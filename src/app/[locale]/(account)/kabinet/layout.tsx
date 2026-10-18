import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/container";
import { ThemeSync } from "@/components/theme-sync";
import { getLocale, getTranslations } from "next-intl/server";
import { requireAccount } from "@/lib/auth/guard";
import { accountTypeKey as accountTypeKeyOf, ACCOUNT_TYPES, AGENCY_MEMBER_PERMISSIONS, type Locale } from "@/lib/constants";
import { getAgencyAccess, hasAgencyPermission } from "@/lib/accounts/agency-access";
import { getFeatureFlags } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";
import type { CabinetNavItem } from "@/lib/accounts/cabinet-navigation";
import { CabinetShell } from "./cabinet-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export const dynamic = "force-dynamic";

/**
 * Kabinetin çərçivəsi və D1 əsaslı qoruma həlqəsi.
 *
 * Middleware yalnız cookie imzasını yoxlayır — ləğv edilmiş sessiyanı görmür,
 * ona görə həqiqi yoxlama buradadır.
 */
export default async function CabinetLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale() as Locale;
  const user = await requireAccount(locale);
  const t = await getTranslations("auth.accountTypes");
  const accountTypeKey = accountTypeKeyOf(user.accountType);
  // Agentin agentlik səlahiyyəti (#218) yalnız agent hesabında oxunur — digərlərində əlavə sorğu yoxdur.
  const agentAccess = user.accountType === ACCOUNT_TYPES.AGENT ? await getAgencyAccess(user) : null;
  const canAssignListings = hasAgencyPermission(agentAccess, AGENCY_MEMBER_PERMISSIONS.LISTINGS_ASSIGN);
  // Agentlik analitikası (#234) `LEADS_MANAGE` səlahiyyətli agentə də açıqdır.
  const canViewAnalytics = hasAgencyPermission(agentAccess, AGENCY_MEMBER_PERMISSIONS.LEADS_MANAGE);
  // Söndürülmüş modulların menyu bəndləri (#242); səhifə və action-lar bayrağı özləri də yoxlayır.
  const flags = await getFeatureFlags();
  const hiddenItems: CabinetNavItem["id"][] = [];
  if (!flags.CRM) hiddenItems.push("clients");
  if (!flags.AGENCY_ANALYTICS) hiddenItems.push("agency-analytics");
  if (!flags.RATINGS) hiddenItems.push("reviews");
  // Menyudakı «Bildirişlər» nişanı — bir `count` sorğusu; xəta kabineti sındırmamalıdır.
  const unreadNotifications = await prisma.notification.count({ where: { userId: user.id, readAt: null } }).catch(() => 0);

  return (
    <Section spacing="cozy">
      <ThemeSync preference={user.themePreference} />
      <Container>
        <CabinetShell
          name={user.name}
          accountLabel={t(accountTypeKey)}
          canList={user.accountType !== ACCOUNT_TYPES.USER}
          canManageTeam={user.accountType === ACCOUNT_TYPES.AGENCY}
          canTransfer={user.accountType === ACCOUNT_TYPES.AGENCY || user.accountType === ACCOUNT_TYPES.AGENT}
          canAssignListings={canAssignListings}
          canViewAnalytics={canViewAnalytics}
          hiddenItems={hiddenItems}
          unreadNotifications={unreadNotifications}
        >
          {children}
        </CabinetShell>
      </Container>
    </Section>
  );
}
