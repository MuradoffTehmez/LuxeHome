import type { Metadata } from "next";
import { Clock, Globe, MapPin, Phone, Mail } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { InstagramIcon, WhatsAppIcon } from "@/components/site/brand-icons";
import { buildMetadata } from "@/lib/seo";
import { siteConfig, whatsappLink } from "@/config/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = buildMetadata({
  title: "Əlaqə",
  description: `${siteConfig.legalName} ilə əlaqə saxlayın. Ünvan: ${siteConfig.addressFull}. Telefon: ${siteConfig.phone}.`,
  path: "/elaqe",
});

const CONTACT_ITEMS = [
  {
    icon: Phone,
    label: "Telefon",
    value: siteConfig.phone,
    href: siteConfig.phoneHref,
  },
  {
    icon: WhatsAppIcon,
    label: "WhatsApp",
    value: siteConfig.phone,
    href: whatsappLink("Salam, Luxe Home Estate ilə bağlı məlumat almaq istəyirəm."),
  },
  {
    icon: Mail,
    label: "E-poçt",
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
  },
  {
    icon: MapPin,
    label: "Ünvan",
    value: siteConfig.addressFull,
    href: `https://maps.google.com/?q=${siteConfig.geo.latitude},${siteConfig.geo.longitude}`,
  },
  {
    icon: Clock,
    label: "İş saatları",
    value: `${siteConfig.workingHours.weekdays}\n${siteConfig.workingHours.weekend}`,
    href: undefined,
  },
  {
    icon: InstagramIcon,
    label: "Instagram",
    value: `@${siteConfig.instagram}`,
    href: siteConfig.instagramUrl,
  },
  {
    icon: Globe,
    label: "Vebsayt",
    value: siteConfig.website,
    href: `https://${siteConfig.website}`,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        compact
        eyebrow="Əlaqə"
        title="Bizimlə əlaqə saxlayın"
        description="Suallarınız üçün müraciət edin — komandamız ən qısa zamanda geri dönüş edəcək."
        breadcrumbs={[
          { label: "Ana səhifə", href: "/" },
          { label: "Əlaqə" },
        ]}
      />

      {/* Əsas məzmun — əlaqə + forma */}
      <Section tone="ivory">
        <Container>
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:gap-12">
            {/* Mobil ekranda əsas əməl olan forma birinci göstərilir. */}
            <div className="min-w-0 rounded-md border border-line bg-paper p-5 shadow-sm sm:p-8">
              <h2 className="mb-6 font-display text-2xl text-ink">
                Müraciət göndər
              </h2>
              <ContactForm />
            </div>

            <div className="flex min-w-0 flex-col gap-8 lg:pt-2">
              <h2 className="font-display text-2xl text-ink">
                Əlaqə məlumatları
              </h2>

              <div className="flex flex-col gap-5">
                {CONTACT_ITEMS.map((item, index) => (
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
