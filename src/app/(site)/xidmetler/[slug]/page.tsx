import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2, Phone } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { ServiceIcon } from "@/components/site/service-icon";
import { ButtonAnchor } from "@/components/ui/button";
import { ContactForm } from "@/app/(site)/elaqe/contact-form";
import { buildMetadata, jsonLd, serviceSchema, breadcrumbSchema } from "@/lib/seo";
import { getServiceBySlug } from "@/lib/queries";
import { siteConfig } from "@/config/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) return { title: "Xidmət tapılmadı" };

  return buildMetadata({
    title: service.metaTitle || service.title,
    description: service.metaDescription || service.shortDescription,
    path: `/xidmetler/${service.slug}`,
    image: service.imageUrl || undefined,
  });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) notFound();

  let bullets: string[] = [];
  try {
    if (service.bullets) {
      bullets = JSON.parse(service.bullets);
    }
  } catch (e) {
    //
  }

  return (
    <>
      <script
        {...jsonLd(
          serviceSchema({
            title: service.title,
            description: service.shortDescription,
            slug: service.slug,
          }),
        )}
      />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: "Ana səhifə", path: "/" },
            { name: "Xidmətlər", path: "/xidmetler" },
            { name: service.title, path: `/xidmetler/${service.slug}` },
          ]),
        )}
      />

      <Section tone="beige" className="py-10 sm:py-12">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <SectionHeader
              as="h1"
              overline="Xidmətlərimiz"
              title={service.title}
              description={service.shortDescription}
            />
            <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-gold-soft shadow-sm lg:size-20">
              <ServiceIcon name={service.icon} className="size-8 lg:size-10" />
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="ivory" className="py-12 sm:py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
            {/* Sol tərəf: Məlumatlar */}
            <div className="flex flex-col gap-8">
              {service.imageUrl && (
                <div className="relative aspect-16/9 w-full overflow-hidden rounded-md bg-beige">
                  <Image
                    src={service.imageUrl}
                    alt={service.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="prose prose-ink max-w-none text-base leading-relaxed text-ink-soft">
                {service.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {bullets.length > 0 && (
                <div className="mt-4 flex flex-col gap-4">
                  <h2 className="font-display text-xl text-ink">Xidmətə nələr daxildir?</h2>
                  <ul className="flex flex-col gap-3">
                    {bullets.map((bullet, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-ink-soft sm:text-base">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sağ tərəf: Əlaqə forması */}
            <div className="flex flex-col gap-8">
              <div className="rounded-md border border-line bg-paper p-5 sm:p-6 lg:sticky lg:top-28 lg:shadow-sm">
                <div className="mb-6 flex flex-col gap-2">
                  <h3 className="font-display text-xl text-ink">Müraciət edin</h3>
                  <p className="text-sm text-ink-soft">
                    Bu xidmət barədə suallarınız var və ya sifariş etmək istəyirsiniz?
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
                  <span className="relative bg-paper px-3 text-xs font-medium uppercase text-ink-muted">və ya mesaj yazın</span>
                </div>

                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
