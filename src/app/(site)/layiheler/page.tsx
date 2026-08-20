import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { ProjectCard } from "@/components/site/project-card";
import { buildMetadata } from "@/lib/seo";
import { getProjects } from "@/lib/queries";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


export const metadata: Metadata = buildMetadata({
  title: "Layihələr",
  description:
    "Luxe Home Estate-in davam edən və tamamlanmış yaşayış, villa və kommersiya layihələri.",
  path: "/layiheler",
});

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      {/* Başlıq */}
      <Section tone="beige" spacing="compact">
        <Container>
          <SectionHeader
            as="h1"
            overline="Portfolio"
            title="Layihələrimiz"
            description="Davam edən və tamamlanmış tikinti layihələri."
          />
        </Container>
      </Section>

      {/* Layihə kartları */}
      <Section tone="ivory">
        <Container>
          {projects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, index) => (
                <Reveal key={project.id} delay={index * 60}>
                  <ProjectCard project={project} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Hazırda layihə əlavə edilməyib"
              description="Yeni layihələr əlavə edildikcə bu səhifədə göstəriləcək."
            />
          )}
        </Container>
      </Section>
    </>
  );
}
