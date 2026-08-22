import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Building2, Globe, MapPin, Phone } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { PropertyCard } from "@/components/site/property-card";
import { buildMetadata, jsonLd, breadcrumbSchema } from "@/lib/seo";
import { getAgencyBySlug } from "@/lib/queries";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAgencyBySlug(slug);

  if (!data) return { title: "Agentlik tapılmadı" };

  return buildMetadata({
    title: data.agency.name,
    description: data.agency.description || `${data.agency.name} — Luxe Home Estate platformasında təsdiqlənmiş agentlik.`,
    path: `/agentlikler/${data.agency.slug}`,
    image: data.agency.logoUrl ?? undefined,
  });
}

export default async function AgencyDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getAgencyBySlug(slug);

  if (!data) notFound();

  const { agency, properties } = data;

  return (
    <>
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: "Ana səhifə", path: "/" },
            { name: "Agentliklər", path: "/agentlikler" },
            { name: agency.name, path: `/agentlikler/${agency.slug}` },
          ]),
        )}
      />

      <div className="bg-ivory pt-6 pb-12 sm:pt-8 sm:pb-16">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-beige sm:size-24">
              {agency.logoUrl ? (
                <Image
                  src={agency.logoUrl}
                  alt={agency.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <Building2 className="size-9 text-ink-muted" aria-hidden="true" />
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold">Təsdiqlənmiş agentlik</Badge>
                <Badge tone="neutral">{properties.length} elan</Badge>
              </div>
              <h1 className="font-display text-2xl leading-tight text-ink sm:text-3xl">
                {agency.name}
              </h1>
              {agency.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
                  {agency.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-soft">
                {agency.phone && (
                  <a href={`tel:${agency.phone}`} className="flex items-center gap-1.5 hover:text-gold-deep">
                    <Phone className="size-4 text-ink-muted" aria-hidden="true" />
                    {agency.phone}
                  </a>
                )}
                {agency.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4 text-ink-muted" aria-hidden="true" />
                    {agency.address}
                  </span>
                )}
                {agency.website && (
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-gold-deep"
                  >
                    <Globe className="size-4 text-ink-muted" aria-hidden="true" />
                    {agency.website}
                  </a>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Section tone="paper" spacing="cozy">
        <Container>
          <div className="mb-8 flex flex-col gap-2">
            <h2 className="font-display text-2xl text-ink sm:text-3xl">Agentliyin elanları</h2>
            <p className="text-sm text-ink-soft">
              {agency.name} tərəfindən yerləşdirilmiş aktiv satış və kirayə təklifləri.
            </p>
          </div>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Hazırda aktiv elan yoxdur"
              description="Bu agentlik yeni elan yerləşdirdikcə burada göstəriləcək."
            />
          )}
        </Container>
      </Section>
    </>
  );
}
