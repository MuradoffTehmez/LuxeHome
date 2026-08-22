import { Container, Section } from "@/components/ui/container";
import { requireAccount } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { CabinetNav } from "./cabinet-nav";

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
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <CabinetNav
              name={user.name}
              accountLabel={ACCOUNT_TYPE_LABELS[user.accountType]}
              canList={user.accountType !== ACCOUNT_TYPES.USER}
            />
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </Section>
  );
}
