import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/constants";
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
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { BusinessTrustPanel } from "@/components/site/business-trust-panel";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.about" });
  return buildMetadata({ title: t("metaTitle"), description: t("metaDescription", { legalName: siteConfig.legalName }), path: "/haqqimizda", locale: locale as Locale });
}

const WHY_ITEMS = [
  { icon: Users, key: "personal" }, { icon: Building2, key: "selection" },
  { icon: BadgeCheck, key: "service" }, { icon: Eye, key: "transparent" },
  { icon: ShieldCheck, key: "documents" }, { icon: Handshake, key: "complete" },
] as const;

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const nav = await getTranslations({ locale, namespace: "navigation" });
  return (
    <>
      <PageHeader
        compact
        eyebrow={t("about.overline")}
        title={t("about.title")}
        description={t("about.description", { legalName: siteConfig.legalName })}
        breadcrumbs={[
          { label: nav("home"), href: "/" },
          { label: nav("about") },
        ]}
      />

      {/* Şirkət haqqında — şəkil + mətn */}
      <Section tone="ivory">
        <Container>
          <div className="grid min-w-0 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal><BusinessTrustPanel /></Reveal>

            <div className="flex min-w-0 flex-col gap-6">
              <h2 className="font-display text-3xl text-ink sm:text-4xl">
                {t("about.mission")}
              </h2>
              <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-soft">
                <p>{t("about.paragraph1")}</p>
                <p>{t("about.paragraph2")}</p>
                <p>{t("about.paragraph3")}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/xidmetler" className={buttonClassName("outline")}>
                  {t("about.services")}
                </Link>
                <Link href="/elaqe" className={buttonClassName("ghost")}>
                  {t("about.contact")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Niyə Luxe Home Estate */}
      <Section tone="paper">
        <Container>
          <SectionHeader
            overline={t("why.overline")}
            title={t("why.title")}
            description={t("why.description")}
            align="center"
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_ITEMS.map((item, index) => (
              <Reveal key={item.key} delay={index * 50}>
                <div className="flex h-full min-w-0 flex-col gap-4 rounded-md border border-line bg-ivory p-5 sm:p-6">
                  <span className="flex size-11 items-center justify-center rounded-xs bg-charcoal text-gold-soft">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-lg text-ink">{t(`why.items.${item.key}.title`)}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {t(`why.items.${item.key}.description`)}
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
