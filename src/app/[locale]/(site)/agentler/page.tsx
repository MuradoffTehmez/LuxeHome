import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Star, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo";
import { getPublicAgents } from "@/lib/phase2";
import { isUnoptimizedImage } from "@/lib/utils";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import type { Locale } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "phase2.agents" });
  return buildMetadata({ title: t("title"), description: t("description"), path: "/agentler", locale: locale as Locale });
}

export default async function AgentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "phase2.agents" });
  const agents = await getPublicAgents();

  return (
    <>
      <PageHeader compact title={t("title")} description={t("description")} />
      <Section tone="paper" spacing="cozy">
        <Container>
          {agents.length === 0 ? (
            <EmptyState title={t("notFound")} description={t("description")} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {agents.map((agent) => {
                const rating = agent.reviews.length
                  ? agent.reviews.reduce((sum, review) => sum + review.rating, 0) / agent.reviews.length
                  : null;
                return (
                  <article key={agent.id} className="rounded-md border border-line bg-paper p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-beige">
                        {agent.avatarUrl ? (
                          <Image src={agent.avatarUrl} alt="" fill sizes="64px" unoptimized={isUnoptimizedImage(agent.avatarUrl)} className="object-cover" />
                        ) : <UserRound className="size-7 text-ink-muted" aria-hidden="true" />}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-display text-xl text-ink"><Link href={`/agentler/${agent.slug}`} className="hover:text-gold-deep">{agent.name}</Link></h2>
                        {agent.agency && <p className="text-sm text-ink-muted">{agent.agency.name}</p>}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {agent.isVerified && <Badge tone="gold">{t("verified")}</Badge>}
                          {rating != null && <Badge tone="neutral"><Star className="mr-1 size-3.5 fill-gold text-gold-deep" aria-hidden="true" />{rating.toFixed(1)}</Badge>}
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-ink-soft">{agent.specialization || agent.roleTitle || t("about")}</p>
                    <p className="mt-3 text-xs text-ink-muted">{t("soldRented", { sold: agent.soldCount, rented: agent.rentedCount })} · {agent._count.properties} {t("listings").toLocaleLowerCase()}</p>
                  </article>
                );
              })}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
