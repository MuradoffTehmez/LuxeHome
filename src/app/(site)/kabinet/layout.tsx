import { Container, Section } from "@/components/ui/container";
import { requireAccount } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { CabinetShell } from "./cabinet-shell";

export const dynamic = "force-dynamic";

/**
 * Kabinetin çərçivəsi və D1 əsaslı qoruma həlqəsi.
 *
 * Middleware yalnız cookie imzasını yoxlayır — ləğv edilmiş sessiyanı görmür,
 * ona görə həqiqi yoxlama buradadır.
 */
export default async function CabinetLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAccount();

  return (
    <Section spacing="cozy">
      <Container>
        <CabinetShell
          name={user.name}
          accountLabel={ACCOUNT_TYPE_LABELS[user.accountType]}
          canList={user.accountType !== ACCOUNT_TYPES.USER}
          canManageTeam={user.accountType === ACCOUNT_TYPES.AGENCY}
        >
          {children}
        </CabinetShell>
      </Container>
    </Section>
  );
}
