import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/container";
import { ThemeSync } from "@/components/theme-sync";
import { getLocale, getTranslations } from "next-intl/server";
import { requireAccount } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, type Locale } from "@/lib/constants";
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
  const accountTypeKey = user.accountType === ACCOUNT_TYPES.USER ? "user" : user.accountType === ACCOUNT_TYPES.OWNER ? "owner" : user.accountType === ACCOUNT_TYPES.AGENCY ? "agency" : "staff";

  return (
    <Section spacing="cozy">
      <ThemeSync preference={user.themePreference} />
      <Container>
        <CabinetShell
          name={user.name}
          accountLabel={t(accountTypeKey)}
          canList={user.accountType !== ACCOUNT_TYPES.USER}
          canManageTeam={user.accountType === ACCOUNT_TYPES.AGENCY}
        >
          {children}
        </CabinetShell>
      </Container>
    </Section>
  );
}
