import type { Metadata } from "next";
import type { Locale } from "@/lib/constants";
import { getTranslations } from "next-intl/server";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { ProjectCard } from "@/components/site/project-card";
import { buildManagedMetadata } from "@/lib/seo";
import { getProjects } from "@/lib/queries";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings.projectsPage" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/layiheler", locale: locale as Locale });
}

export default async function ProjectsPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings.projectsPage" });
  const projects = await getProjects();

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      {/* Layihə kartları */}
      <Section tone="ivory">
        <Container>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project, index) => (
                <Reveal key={project.id} delay={index * 60}>
                  <ProjectCard project={project} priority={index === 0} />
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
    </>
  );
}
