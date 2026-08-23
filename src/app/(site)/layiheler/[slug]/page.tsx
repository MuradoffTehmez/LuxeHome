import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, MapPin, CheckCircle2, Phone, Building2 } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ButtonAnchor } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PublicDetailLayout } from "@/components/ui/public-detail-layout";
import { ContactForm } from "@/app/(site)/elaqe/contact-form";
import { Gallery } from "@/components/site/gallery";
import { PropertyCard } from "@/components/site/property-card";
import { buildMetadata, jsonLd, breadcrumbSchema } from "@/lib/seo";
import { getProjectBySlug } from "@/lib/queries";
import { siteConfig } from "@/config/site";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


const PROJECT_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: "Yaşayış",
  COMMERCIAL: "Kommersiya",
  VILLA: "Villa Kompleksi",
  MIXED: "Qarışıq Tipli",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planlaşdırılır",
  ONGOING: "Davam edir",
  COMPLETED: "Tamamlanıb",
};

const PROJECT_STATUS_TONE: Record<string, "info" | "warning" | "success"> = {
  PLANNED: "warning",
  ONGOING: "info",
  COMPLETED: "success",
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) return { title: "Layihə tapılmadı" };

  return buildMetadata({
    title: project.metaTitle || project.name,
    description: project.metaDescription || project.summary || project.description,
    path: `/layiheler/${project.slug}`,
    image: project.images[0]?.url,
    noIndex: project.noIndex,
    canonicalPath: project.canonicalUrl,
    ogTitle: project.ogTitle,
    ogDescription: project.ogDescription,
    ogImage: project.ogImage,
  });
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  // JSON-LD for Project
  const projectSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: project.name,
    description: project.summary || project.description,
    image: project.images.map((img) => img.url),
    url: `https://luxehomeestate.az/layiheler/${project.slug}`,
  };

  const imagesForGallery = project.images.map((img) => ({
    url: img.url,
    alt: img.alt || project.name,
  }));

  return (
    <>
      <script {...jsonLd(projectSchema)} />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: "Ana səhifə", path: "/" },
            { name: "Layihələr", path: "/layiheler" },
            { name: project.name, path: `/layiheler/${project.slug}` },
          ]),
        )}
      />

      <PageHeader
        compact
        eyebrow="Yaşayış layihəsi"
        title={project.name}
        description={project.summary || undefined}
        breadcrumbs={[
          { label: "Ana səhifə", href: "/" },
          { label: "Layihələr", href: "/layiheler" },
          { label: project.name },
        ]}
        actions={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={PROJECT_STATUS_TONE[project.status]}>
                  {PROJECT_STATUS_LABELS[project.status]}
                </Badge>
                <Badge tone="neutral">
                  {PROJECT_TYPE_LABELS[project.projectType]}
                </Badge>
              </div>
        }
      />

      <Section tone="ivory" spacing="cozy">
        <Container>
          <PublicDetailLayout
            main={
            <div className="flex min-w-0 flex-col gap-10">
              {project.city && (
                <p className="flex min-h-11 items-center gap-2 text-sm text-ink-soft">
                  <MapPin className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <span className="[overflow-wrap:anywhere]">
                    {project.city.name}{project.address && `, ${project.address}`}
                  </span>
                </p>
              )}
              {/* Qalereya */}
              {imagesForGallery.length > 0 && (
                <Gallery images={imagesForGallery} title={project.name} />
              )}

              {/* Sürətli parametrlər */}
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
                {project.deliveryDate && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <Calendar className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium uppercase text-ink-muted">Təhvil tarixi</span>
                    <span className="tabular font-medium text-ink">
                      {new Intl.DateTimeFormat("az-AZ", { month: "long", year: "numeric" }).format(new Date(project.deliveryDate))}
                    </span>
                  </div>
                )}
                {project.startDate && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <Calendar className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium uppercase text-ink-muted">Başlama tarixi</span>
                    <span className="tabular font-medium text-ink">
                      {new Intl.DateTimeFormat("az-AZ", { month: "long", year: "numeric" }).format(new Date(project.startDate))}
                    </span>
                  </div>
                )}
                {project.year && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <CheckCircle2 className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium uppercase text-ink-muted">İnşaat ili</span>
                    <span className="tabular font-medium text-ink">{project.year}</span>
                  </div>
                )}
                {project.properties && project.properties.length > 0 && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <Building2 className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium uppercase text-ink-muted">Əmlak sayı</span>
                    <span className="tabular font-medium text-ink">{project.properties.length} təklif</span>
                  </div>
                )}
              </div>

              {/* Təsvir */}
              <div className="flex flex-col gap-4">
                <h2 className="font-display text-xl text-ink">Layihə haqqında</h2>
                <div className="prose-luxe min-w-0 max-w-[68ch] text-base [overflow-wrap:anywhere]">
                  {project.description.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
            }
            aside={
              <div className="rounded-md border border-line bg-paper p-5 shadow-sm sm:p-6">
                <div className="mb-6 flex flex-col gap-2">
                  <h3 className="font-display text-xl text-ink">Layihə barədə müraciət</h3>
                  <p className="text-sm text-ink-soft">
                    Bu layihə ilə bağlı suallarınız var? Əməkdaşlarımız sizə kömək etməkdən məmnun olar.
                  </p>
                </div>

                <div className="mb-6">
                  <ButtonAnchor href={siteConfig.phoneHref} variant="ghost" fullWidth className="h-12 border border-line hover:border-gold hover:text-gold-deep">
                    <Phone className="mr-2 size-4" aria-hidden="true" />
                    {siteConfig.phone}
                  </ButtonAnchor>
                </div>

                <div className="relative mb-6 text-center">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-line" />
                  </div>
                  <span className="relative bg-paper px-3 text-xs font-medium uppercase text-ink-muted">və ya müraciət yazın</span>
                </div>

                <ContactForm />
              </div>
            }
          />
        </Container>
      </Section>

      {/* Layihəyə aid əmlaklar */}
      {project.properties && project.properties.length > 0 && (
        <Section tone="paper" spacing="cozy">
          <Container>
            <div className="mb-8 flex flex-col gap-2">
              <h2 className="font-display text-2xl text-ink sm:text-3xl">Layihədəki əmlaklar</h2>
              <p className="text-sm text-ink-soft">Bu layihədə hazırda aktiv olan satış və ya kirayə təklifləri.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {project.properties.map((prop) => (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <PropertyCard key={prop.id} property={prop as any} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
