import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/constants";
import { MapPin, Phone, Mail } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { InstagramIcon, WhatsAppIcon } from "@/components/site/brand-icons";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { getOperationalSiteConfig } from "@/lib/settings";
import { ContactForm } from "./contact-form";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  const operational = await getOperationalSiteConfig();
  return buildMetadata({ title: t("eyebrow"), description: t("metaDescription", { legalName: siteConfig.legalName, address: operational.addressFull, phone: operational.phone }), path: "/elaqe", locale: locale as Locale });
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  const operational = await getOperationalSiteConfig();
  const contactItems = [
    { icon: Phone, label: t("phone"), value: operational.phone, href: operational.phoneHref },
    { icon: WhatsAppIcon, label: "WhatsApp", value: operational.phone, href: `https://wa.me/${operational.whatsapp}?text=${encodeURIComponent(t("whatsappMessage"))}` },
    { icon: Mail, label: t("email"), value: operational.email, href: `mailto:${operational.email}` },
    { icon: MapPin, label: t("address"), value: operational.addressFull, href: undefined },
    { icon: InstagramIcon, label: "Instagram", value: `@${operational.instagram}`, href: operational.instagramUrl },
  ];
  return (
    <>
      <PageHeader
        compact
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        breadcrumbs={[
          { label: t("home"), href: "/" },
          { label: t("eyebrow") },
        ]}
      />

      {/* Əsas məzmun — əlaqə + forma */}
      <Section tone="ivory">
        <Container>
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:gap-12">
            {/* Mobil ekranda əsas əməl olan forma birinci göstərilir. */}
            <div className="min-w-0 rounded-md border border-line bg-paper p-5 shadow-sm sm:p-8">
              <h2 className="mb-6 font-display text-2xl text-ink">
                {t("sendEnquiry")}
              </h2>
              <ContactForm />
            </div>

            <div className="flex min-w-0 flex-col gap-8 lg:pt-2">
              <h2 className="font-display text-2xl text-ink">
                {t("contactDetails")}
              </h2>

              <div className="flex flex-col gap-5">
                {contactItems.map((item, index) => (
                  <Reveal key={item.label} delay={index * 40}>
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-beige text-ink-muted">
                        <item.icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                          {item.label}
                        </span>
                        {item.href ? (
                          <a
                            href={item.href}
                            target={item.href.startsWith("http") ? "_blank" : undefined}
                            rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="flex min-h-11 items-center whitespace-pre-line text-sm font-medium text-ink [overflow-wrap:anywhere] transition-colors hover:text-gold-deep"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <span className="whitespace-pre-line text-sm font-medium text-ink [overflow-wrap:anywhere]">
                            {item.value}
                          </span>
                        )}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

          </div>
        </Container>
      </Section>
    </>
  );
}
