import type { Metadata } from "next";
import Image from "next/image";
import {
  BadgeCheck,
  Building2,
  Eye,
  Handshake,
  ShieldCheck,
  Users,
  ArrowRight,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Haqqımızda",
  description: `${siteConfig.legalName} — Bakıda daşınmaz əmlak sahəsində peşəkar xidmətlər. Fərdi yanaşma, şəffaf proses və kompleks xidmət.`,
  path: "/haqqimizda",
});

const WHY_ITEMS = [
  {
    icon: Users,
    title: "Fərdi yanaşma",
    description:
      "Hər müştərinin tələbi fərqlidir. Axtarışı sizin büdcə, ərazi və yaşayış tərzinizə uyğunlaşdırırıq.",
  },
  {
    icon: Building2,
    title: "Geniş əmlak seçimi",
    description:
      "Mənzil, villa, həyət evi, bağ evi, torpaq, ofis və kommersiya obyektləri — hamısı bir platformada.",
  },
  {
    icon: BadgeCheck,
    title: "Peşəkar xidmət",
    description:
      "Baxışdan rəsmiləşdirməyə qədər bütün mərhələlərdə komandamız sizi müşayiət edir.",
  },
  {
    icon: Eye,
    title: "Şəffaf proses",
    description:
      "Əmlakın vəziyyəti, sənədləri və şərtləri barədə məlumat açıq şəkildə təqdim olunur.",
  },
  {
    icon: ShieldCheck,
    title: "Sənəd təhlükəsizliyi",
    description:
      "Hər əməliyyatda hüquqi sənədlərin yoxlanılmasına xüsusi diqqət yetirilir.",
  },
  {
    icon: Handshake,
    title: "Kompleks xidmət",
    description:
      "Alqı-satqıdan təmir, reklam və çəkilişə qədər 7 istiqamətdə dəstək göstəririk.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Başlıq */}
      <Section tone="beige" spacing="compact">
        <Container>
          <SectionHeader
            as="h1"
            overline="Haqqımızda"
            title="Luxe Home Estate haqqında"
            description={`${siteConfig.legalName} daşınmaz əmlak sahəsində alqı-satqı, icarə, ipoteka, təmir-tikinti, reklam və çəkiliş istiqamətlərində fəaliyyət göstərir.`}
          />
        </Container>
      </Section>

      {/* Şirkət haqqında — şəkil + mətn */}
      <Section tone="ivory">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal className="relative">
              <div className="relative aspect-4/5 overflow-hidden rounded-md sm:aspect-4/3 lg:aspect-4/5">
                <Image
                  src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80"
                  alt="Müasir premium memarlıq"
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div
                aria-hidden="true"
                className="absolute -right-3 -bottom-3 hidden size-32 border-r border-b border-gold lg:block"
              />
            </Reveal>

            <div className="flex flex-col gap-6">
              <h2 className="font-display text-3xl text-ink sm:text-4xl">
                Missiyamız
              </h2>
              <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-soft">
                <p>
                  Yanaşmamız sadədir: müştərinin real tələbini anlamaq və ona
                  uyğun əmlakı tapmaq. Hər müraciətə fərdi baxırıq — büdcə,
                  ərazi, yaşayış tərzi və gələcək planlar nəzərə alınır.
                </p>
                <p>
                  Əməliyyatın hər mərhələsində şəffaflığa önəm veririk. Əmlakın
                  vəziyyəti, sənədləri və şərtləri barədə məlumat olduğu kimi
                  təqdim olunur.
                </p>
                <p>
                  Komandamız yalnız satış deyil, uzunmüddətli əlaqə qurmağa
                  fokuslanır. Hər müştərinin memnuniyyəti bizim üçün ən böyük
                  nailiyyətdir.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/xidmetler" variant="outline">
                  Xidmətlərimiz
                </ButtonLink>
                <ButtonLink href="/elaqe" variant="ghost">
                  Bizimlə əlaqə
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Niyə Luxe Home Estate */}
      <Section tone="paper">
        <Container>
          <SectionHeader
            overline="Üstünlüklər"
            title="Niyə Luxe Home Estate?"
            description="Müştərilərimizə təklif etdiyimiz yanaşmanın əsas prinsipləri."
            align="center"
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_ITEMS.map((item, index) => (
              <Reveal key={item.title} delay={index * 50}>
                <div className="flex h-full flex-col gap-4 rounded-md border border-line bg-ivory p-6">
                  <span className="flex size-11 items-center justify-center rounded-xs bg-zinc-900 text-gold-soft">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-lg text-ink">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

        </Container>
      </Section>
    </>
  );
}
