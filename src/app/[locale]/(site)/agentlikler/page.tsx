import type { Metadata } from "next";
import type { Locale } from "@/lib/constants";
import { getTranslations } from "next-intl/server";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { AgencyCard } from "@/components/site/agency-card";
import { AgentCard } from "@/components/site/agent-card";
import { SectionHeader } from "@/components/ui/section-header";
import { buildMetadata } from "@/lib/seo";
import { getAgencies } from "@/lib/queries";
import { getPublicAgents } from "@/lib/phase2";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings.agenciesPage" });
  return buildMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/agentlikler", locale: locale as Locale });
}

export default async function AgenciesPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings.agenciesPage" });
  const agentsT = await getTranslations({ locale, namespace: "phase2.agents" });
  const [agencies, agents] = await Promise.all([getAgencies(), getPublicAgents()]);

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <Section tone="ivory">
        <Container>
          {agencies.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {agencies.map((agency, index) => (
                <Reveal key={agency.id} delay={index * 60}>
                  <AgencyCard agency={agency} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("emptyTitle")}
              description={t("emptyDescription")}
            />
          )}
        </Container>
      </Section>
      <Section tone="beige" spacing="cozy">
        <Container>
          <SectionHeader title={agentsT("title")} description={agentsT("description")} action={{ label: agentsT("title"), href: "/agentler" }} />
          {agents.length > 0 ? <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{agents.map((agent) => <Reveal key={agent.id}><AgentCard agent={agent} /></Reveal>)}</div> : <div className="mt-8"><EmptyState title={agentsT("notFound")} description={agentsT("description")} /></div>}
        </Container>
      </Section>
    </>
  );
}
