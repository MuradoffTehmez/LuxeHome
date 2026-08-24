import type { Metadata } from "next";
import type { Locale } from "@/lib/constants";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { ServiceIcon } from "@/components/site/service-icon";
import { ButtonLink } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { getServices } from "@/lib/queries";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings.servicesPage" });
  return buildMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/xidmetler", locale: locale as Locale });
}

export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings.servicesPage" });
  const services = await getServices();

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      {/* Xidmət kartları */}
      <Section tone="ivory">
        <Container>
          {services.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {services.map((service, index) => (
                <Reveal key={service.id} delay={index * 50}>
                  <div className="group flex h-full flex-col gap-5 rounded-md border border-line bg-paper p-5 transition-shadow duration-300 hover:shadow-md sm:p-7">
                    <span className="flex size-12 items-center justify-center rounded-xs bg-charcoal text-gold-soft">
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
                        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-gold-deep transition-colors hover:text-gold"
                      >
                        {t("more")}
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
              title={t("emptyTitle")}
              description={t("emptyDescription")}
            />
          )}
        </Container>
      </Section>

      {/* CTA */}
      <Section tone="beige">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-xl font-display text-3xl text-ink sm:text-4xl">
            {t("ctaTitle")}
          </h2>
          <p className="max-w-md text-base text-ink-soft">
            {t("ctaDescription")}
          </p>
          <ButtonLink href="/elaqe" variant="primary" size="lg">
            {t("cta")}
          </ButtonLink>
        </Container>
      </Section>
    </>
  );
}
