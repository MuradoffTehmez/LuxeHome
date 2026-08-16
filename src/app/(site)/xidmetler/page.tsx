import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { ServiceIcon } from "@/components/site/service-icon";
import { ButtonLink } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { getServices } from "@/lib/queries";

export const metadata: Metadata = buildMetadata({
  title: "Xidmətlər",
  description:
    "Luxe Home Estate-in daşınmaz əmlak sahəsindəki 7 əsas xidmət istiqaməti: alqı-satqı, icarə, ipoteka, təmir-tikinti, reklam, çəkiliş və konsultasiya.",
  path: "/xidmetler",
});

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      {/* Başlıq bölməsi */}
      <Section tone="navy">
        <Container>
          <SectionHeader
            as="h1"
            overline="Nə edirik"
            title="Xidmətlərimiz"
            description="Daşınmaz əmlakla bağlı bütün ehtiyaclarınız üçün peşəkar xidmətlər."
            tone="dark"
            align="center"
          />
        </Container>
      </Section>

      {/* Xidmət kartları */}
      <Section tone="ivory">
        <Container>
          {services.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <Reveal key={service.id} delay={index * 50}>
                  <div className="group flex h-full flex-col gap-5 rounded-md border border-line bg-paper p-7 transition-shadow duration-300 hover:shadow-md">
                    <span className="flex size-12 items-center justify-center rounded-xs bg-zinc-900 text-gold-soft">
                      <ServiceIcon name={service.icon} className="size-5" />
                    </span>

                    <div className="flex flex-col gap-2">
                      <h2 className="font-display text-xl text-ink">
                        {service.title}
                      </h2>
                      <p className="text-sm leading-relaxed text-ink-soft">
                        {service.shortDescription}
                      </p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-line">
                      <Link
                        href={`/xidmetler/${service.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-deep transition-colors hover:text-gold"
                      >
                        Ətraflı oxu
                        <ArrowRight
                          className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Hazırda xidmət məlumatı əlavə edilməyib"
              description="Xidmətlər admin panel vasitəsilə əlavə ediləcək."
            />
          )}
        </Container>
      </Section>

      {/* CTA */}
      <Section tone="beige">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-xl font-display text-3xl text-ink sm:text-4xl">
            Xidmətlərimiz haqqında sualınız var?
          </h2>
          <p className="max-w-md text-base text-ink-soft">
            Tələbinizi bizə bildirin — komandamız sizinlə əlaqə saxlayacaq.
          </p>
          <ButtonLink href="/elaqe" variant="primary" size="lg">
            Bizimlə əlaqə
          </ButtonLink>
        </Container>
      </Section>
    </>
  );
}
