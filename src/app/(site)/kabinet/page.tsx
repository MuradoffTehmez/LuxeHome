import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ClipboardList, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container, Section } from "@/components/ui/container";
import { getCabinetSummary } from "@/lib/accounts/cabinet-summary";
import { requireAccount } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Kabinet",
  description: "Luxe Home Estate hesab kabinetiniz.",
  path: "/kabinet",
  noIndex: true,
});

export default async function CabinetPage() {
  const user = await requireAccount();
  const summary = await getCabinetSummary(
    {
      countProperties: (userId) =>
        prisma.property.count({ where: { authorId: userId, deletedAt: null } }),
      findAgency: (userId) =>
        prisma.agency.findUnique({
          where: { userId },
          select: { name: true, isVerified: true },
        }),
    },
    user,
  );

  const canList = user.accountType !== ACCOUNT_TYPES.USER;

  return (
    <Section spacing="cozy">
      <Container size="narrow">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <Badge tone="gold" className="w-fit">
              {ACCOUNT_TYPE_LABELS[user.accountType]}
            </Badge>
            <div>
              <h1 className="font-display text-3xl text-ink sm:text-4xl">Salam, {user.name}</h1>
              <p className="mt-2 text-ink-soft">{user.email}</p>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-md border border-line bg-paper p-5">
              <ClipboardList className="size-5 text-gold-deep" aria-hidden="true" />
              <p className="mt-5 text-sm text-ink-soft">Elanlarınız</p>
              <p className="mt-1 font-display text-3xl text-ink">{summary.propertyCount}</p>
              <p className="mt-2 text-sm text-ink-soft">
                {canList
                  ? "Göndərdiyiniz aktiv və gözləyən elanların ümumi sayı."
                  : "Elan yerləşdirmək üçün mülk sahibi və ya agentlik hesabı seçin."}
              </p>
              {canList && (
                <Link
                  href="/kabinet/elanlar"
                  className="mt-4 inline-flex text-sm font-medium text-gold-deep transition-colors hover:text-ink"
                >
                  Elanları idarə et →
                </Link>
              )}
            </article>

            {user.accountType === ACCOUNT_TYPES.AGENCY && (
              <article className="rounded-md border border-line bg-paper p-5">
                <Building2 className="size-5 text-gold-deep" aria-hidden="true" />
                <p className="mt-5 text-sm text-ink-soft">Agentlik profili</p>
                <p className="mt-1 font-display text-xl text-ink">
                  {summary.agency?.name ?? "Profil yaradılmayıb"}
                </p>
                <div className="mt-3">
                  <Badge tone={summary.agency?.isVerified ? "success" : "warning"}>
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    {summary.agency?.isVerified ? "Təsdiqlənib" : "Təsdiq gözləyir"}
                  </Badge>
                </div>
              </article>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
