import type { Metadata } from "next";
import type { Locale } from "@/lib/constants";
import { getTranslations } from "next-intl/server";
import { Building2, Search, UserRound } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { AgencyCard } from "@/components/site/agency-card";
import { AgentCard } from "@/components/site/agent-card";
import { SectionHeader } from "@/components/ui/section-header";
import { buttonClassName } from "@/components/ui/button";
import { buildManagedMetadata } from "@/lib/seo";
import { getPublicAgencyCatalog } from "@/lib/agency-profile";
import { getPublicAgents } from "@/lib/phase2";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings.agenciesPage" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/agentlikler", locale: locale as Locale });
}

export default async function AgenciesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const rawSearch = (await searchParams).axtaris;
  const search = typeof rawSearch === "string" ? rawSearch.trim().slice(0, 80) : "";
  const t = await getTranslations({ locale, namespace: "listings.agenciesPage" });
  const directoryT = await getTranslations({ locale, namespace: "listings.agencyDirectory" });
  const agentsT = await getTranslations({ locale, namespace: "phase2.agents" });
  const [agencies, agents] = await Promise.all([getPublicAgencyCatalog({ search }), getPublicAgents()]);

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <Section tone="ivory">
        <Container>
          {/* Adla axtarış — GET forması, JS-siz də işləyir; nəticə təklif sayına görə sıralanır. */}
          <form role="search" aria-label={directoryT("searchLabel")} className="mb-8 flex max-w-xl gap-2">
            <label htmlFor="agency-search" className="sr-only">{directoryT("searchLabel")}</label>
            <input
              id="agency-search"
              name="axtaris"
              type="search"
              defaultValue={search}
              placeholder={directoryT("searchPlaceholder")}
              className="min-h-11 min-w-0 flex-1 rounded-sm border border-line-strong bg-paper px-4 text-sm text-ink placeholder:text-ink-muted focus:border-gold focus:outline-none"
            />
            <button type="submit" className={buttonClassName("dark", "md", false, "min-h-11 shrink-0")}>
              <Search className="size-4" aria-hidden="true" />
              {directoryT("search")}
            </button>
          </form>
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
              icon={<Building2 className="size-6" aria-hidden="true" />}
              title={search ? directoryT("noResults", { query: search }) : t("emptyTitle")}
              description={search ? undefined : t("emptyDescription")}
              action={search ? { label: t("title"), href: "/agentlikler" } : undefined}
            />
          )}
        </Container>
      </Section>
      <Section tone="beige" spacing="cozy">
        <Container>
          {/* Əməl düyməsinin etiketi başlıqdan fərqlidir — eyni olsa, bölmədə
              «Agentlər … Agentlər» təkrarı yaranır. */}
          <SectionHeader
            title={agentsT("title")}
            description={agentsT("description")}
            action={{ label: agentsT("homeAll"), href: "/agentler" }}
          />

          {agents.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {agents.map((agent, index) => (
                <Reveal key={agent.id} delay={index * 60}>
                  <AgentCard agent={agent} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <EmptyState
                icon={<UserRound className="size-6" aria-hidden="true" />}
                title={agentsT("notFound")}
                description={agentsT("emptyDescription")}
              />
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
