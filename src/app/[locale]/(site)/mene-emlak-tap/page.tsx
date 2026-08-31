import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LogIn, UserPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";
import { routing } from "@/i18n/routing";
import { AUTH_KINDS } from "@/lib/constants";
import { getOptionalUser } from "@/lib/auth/guard";
import { getCachedFilterOptions } from "@/lib/public-cache";
import { buildManagedMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/constants";
import { PropertyWizard } from "./property-wizard";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "phase2.wizard" });
  return buildManagedMetadata({ title: t("title"), description: t("description"), path: "/mene-emlak-tap", locale: resolved });
}

export default async function PropertyWizardPage({ params }: Props) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const t = await getTranslations({ locale: resolved, namespace: "phase2.wizard" });

  /*
    Köməkçi hesab tələb edir: cavablar profilə bağlanır və sonrakı tövsiyələr
    onların üzərində qurulur. `redirect` əvəzinə səhifə açıq saxlanılır və giriş
    çağırışı göstərilir — belə halda marşrut 200 qaytarır, metadata və izahat
    indeksdə qalır, ziyarətçi isə niyə hesab lazım olduğunu görür.
  */
  const user = await getOptionalUser(AUTH_KINDS.PUBLIC);
  if (!user) {
    return (
      <Section tone="ivory" spacing="cozy">
        <Container size="narrow">
          <SectionHeader overline={t("eyebrow")} title={t("loginTitle")} description={t("loginDescription")} />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/daxil-ol" className={buttonClassName("primary", "lg")}>
              <LogIn className="size-4" aria-hidden="true" />
              {t("loginCta")}
            </Link>
            <Link href="/qeydiyyat" className={buttonClassName("outline", "lg")}>
              <UserPlus className="size-4" aria-hidden="true" />
              {t("registerCta")}
            </Link>
          </div>
        </Container>
      </Section>
    );
  }

  const options = await getCachedFilterOptions();
  const types = options.types.map((type) => ({ value: type.slug, label: localizeKnownContent("propertyType", type, resolved).name }));
  const cities = options.cities.map((city) => ({ value: city.slug, label: localizeLocation(city, resolved).name, districts: city.children.map((district) => ({ value: district.slug, label: localizeLocation(district, resolved).name })) }));
  return (
    <Section tone="ivory" spacing="cozy">
      <Container>
        <SectionHeader overline={t("eyebrow")} title={t("title")} description={t("description")} />
        <div className="mt-10"><PropertyWizard types={types} cities={cities} /></div>
      </Container>
    </Section>
  );
}
