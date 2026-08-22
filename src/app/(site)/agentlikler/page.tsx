import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { AgencyCard } from "@/components/site/agency-card";
import { buildMetadata } from "@/lib/seo";
import { getAgencies } from "@/lib/queries";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Agentliklər",
  description: "Luxe Home Estate platformasında təsdiqlənmiş daşınmaz əmlak agentlikləri.",
  path: "/agentlikler",
});

export default async function AgenciesPage() {
  const agencies = await getAgencies();

  return (
    <>
      <Section tone="beige" spacing="compact">
        <Container>
          <SectionHeader
            as="h1"
            overline="Tərəfdaşlar"
            title="Agentliklər"
            description="Platformada təsdiqlənmiş daşınmaz əmlak agentlikləri."
          />
        </Container>
      </Section>

      <Section tone="ivory">
        <Container>
          {agencies.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {agencies.map((agency, index) => (
                <Reveal key={agency.id} delay={index * 60}>
                  <AgencyCard agency={agency} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Hazırda təsdiqlənmiş agentlik yoxdur"
              description="Yeni agentliklər təsdiqləndikcə bu səhifədə göstəriləcək."
            />
          )}
        </Container>
      </Section>
    </>
  );
}
