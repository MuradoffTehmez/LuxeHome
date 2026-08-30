import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { getPublicAgents } from "@/lib/phase2";
import { Container, Section } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { AgentCard } from "@/components/site/agent-card";
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
              {agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
