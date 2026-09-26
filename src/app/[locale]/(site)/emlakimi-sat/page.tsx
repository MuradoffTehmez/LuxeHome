import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Camera, FileCheck2, Handshake, LineChart, Megaphone, ShieldCheck } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { breadcrumbSchema, buildManagedMetadata, jsonLd } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import { LOCATION_KINDS, type Locale } from "@/lib/constants";
import { getCachedFilterOptions } from "@/lib/public-cache";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";
import { ValuationTool } from "./valuation-tool";

type Props = { params: Promise<{ locale: string }> };

// Növ və yerləşmə siyahıları D1-dən oxunur — binding yalnız sorğu kontekstindədir.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "contact.sell" });
  return buildManagedMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/emlakimi-sat",
    locale: resolved as Locale,
  });
}

const STEPS = ["valuation", "preparation", "marketing", "deal"] as const;
const BENEFITS = [
  { key: "pricing", icon: LineChart },
  { key: "photos", icon: Camera },
  { key: "documents", icon: FileCheck2 },
  { key: "reach", icon: Megaphone },
  { key: "screening", icon: ShieldCheck },
  { key: "negotiation", icon: Handshake },
] as const;

/**
 * Satıcı/icarəyə verən səhifəsi və «Evimi qiymətləndir» aləti (#105). Sayt əvvəl yalnız
 * alıcıya danışırdı; agentliyin inventarı isə sahiblərdən gəlir.
 */
export default async function SellWithUsPage({ params }: Props) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const [t, navigation, filterOptions] = await Promise.all([
    getTranslations({ locale: resolved, namespace: "contact.sell" }),
    getTranslations({ locale: resolved, namespace: "navigation" }),
    getCachedFilterOptions(),
  ]);

  const types = filterOptions.types.map((type) => ({
    value: type.slug,
    label: localizeKnownContent("propertyType", type, resolved).name,
  }));
  const cities = filterOptions.cities.map((city) => ({
    value: city.slug,
    label: localizeLocation(city, resolved).name,
    districts: city.children.flatMap((child) => {
      const label = localizeLocation(child, resolved).name;
      const self = { value: child.slug, label };
      if (child.kind !== LOCATION_KINDS.DISTRICT) return [self];
      return [
        self,
        ...child.children.map((grandchild) => ({
          value: grandchild.slug,
          label: localizeLocation(grandchild, resolved).name,
          group: label,
        })),
      ];
    }),
  }));

  return (
    <>
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: navigation("home"), path: "/" },
            { name: t("eyebrow"), path: "/emlakimi-sat" },
          ], resolved),
        )}
      />
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        breadcrumbs={[{ label: navigation("home"), href: "/" }, { label: t("eyebrow") }]}
      />

      <Section tone="ivory" spacing="cozy" id="qiymetlendir">
        <Container size="wide">
          <ValuationTool types={types} cities={cities} />
        </Container>
      </Section>

      <Section tone="paper">
        <Container size="wide">
          <SectionHeader overline={t("stepsOverline")} title={t("stepsTitle")} />
          <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step} className="rounded-lg border border-line bg-ivory p-6">
                <span className="tabular font-display text-3xl text-gold-deep">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-semibold text-ink">{t(`steps.${step}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(`steps.${step}.description`)}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="beige">
        <Container size="wide">
          <SectionHeader overline={t("benefitsOverline")} title={t("benefitsTitle")} />
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ key, icon: Icon }) => (
              <div key={key} className="flex gap-4 rounded-lg border border-line bg-paper p-6 shadow-xs">
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-gold/12 text-gold-deep" aria-hidden="true">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-ink">{t(`benefits.${key}.title`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t(`benefits.${key}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
