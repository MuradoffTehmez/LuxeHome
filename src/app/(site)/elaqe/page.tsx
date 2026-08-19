import type { Metadata } from "next";
import { Clock, Globe, MapPin, Phone, Mail } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { InstagramIcon, WhatsAppIcon } from "@/components/site/brand-icons";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
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
    value: "+994 51 922 85 85",
    href: "https://wa.me/994519228585?text=Salam,%20Luxe%20Home%20Estate%20il%C9%99%20ba%C4%9Fl%C4%B1%20m%C9%99lumat%20almaq%20ist%C9%99yir%C9%99m.",
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
      {/* Başlıq */}
      <Section tone="beige" spacing="compact">
        <Container>
          <SectionHeader
            as="h1"
            overline="Əlaqə"
            title="Bizimlə əlaqə saxlayın"
            description="Suallarınız üçün müraciət edin — komandamız ən qısa zamanda geri dönüş edəcək."
          />
        </Container>
      </Section>

      {/* Əsas məzmun — əlaqə + forma */}
      <Section tone="ivory">
        <Container>
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
            {/* Sol — əlaqə məlumatları */}
            <div className="flex flex-col gap-8 lg:col-span-2">
              <h2 className="font-display text-2xl text-ink">
                Əlaqə məlumatları
              </h2>

              <div className="flex flex-col gap-5">
                {CONTACT_ITEMS.map((item, index) => (
                  <Reveal key={item.label} delay={index * 40}>
                    <div className="flex items-start gap-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-beige text-ink-muted">
                        <item.icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                          {item.label}
                        </span>
                        {item.href ? (
                          <a
                            href={item.href}
                            target={item.href.startsWith("http") ? "_blank" : undefined}
                            rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="whitespace-pre-line text-sm font-medium text-ink transition-colors hover:text-gold-deep"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <span className="whitespace-pre-line text-sm font-medium text-ink">
                            {item.value}
                          </span>
                        )}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Sağ — forma */}
            <div className="lg:col-span-3">
              <div className="rounded-md border border-line bg-paper p-6 sm:p-8">
                <h2 className="mb-6 font-display text-2xl text-ink">
                  Müraciət göndər
                </h2>
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
