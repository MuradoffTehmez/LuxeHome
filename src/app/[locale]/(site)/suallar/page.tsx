import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { FaqGroups } from "@/components/site/faq-groups";
import { FAQ_PAGE } from "@/i18n/public-content";
import { getSiteFaqContent } from "@/i18n/site-faq";
import { buildManagedMetadata, faqSchema, jsonLd } from "@/lib/seo";
import type { Locale } from "@/lib/constants";
import { siteConfig, whatsappLink } from "@/config/site";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const copy = FAQ_PAGE[locale as Locale];
  return buildManagedMetadata({
    title: copy.title,
    description: copy.metaDescription,
    path: "/suallar",
    locale: locale as Locale,
  });
}

/**
 * JavaScript tələb etməyən, klaviatura və axtarış motorları üçün açıq FAQ.
 *
 * Bu səhifə yalnız platformanın istifadəsi barədə əsas 20 sualdır. Əmlak və
 * qanunvericilik sualları qəsdən `/bilik-merkezi/suallar` marşrutundadır.
 */
export default async function FaqPage({ params }: PageProps) {
  const { locale } = await params;
  const activeLocale = locale as Locale;
  const copy = FAQ_PAGE[activeLocale];
  const navigation = await getTranslations({ locale, namespace: "navigation" });
  const groups = getSiteFaqContent(activeLocale);

  const items = groups.flatMap((group) => group.items);

  return (
    <>
      <script {...jsonLd(faqSchema(items, "/suallar", activeLocale))} />

      <PageHeader
        compact
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          { label: copy.breadcrumb },
        ]}
      />

      <Section spacing="cozy">
        <Container size="narrow">
          <FaqGroups groups={groups} />

          <div className="mt-12 rounded-2xl border border-line bg-beige p-8 text-center sm:p-10">
            <p className="text-base text-ink-soft">{copy.noAnswer}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/elaqe"
                className={buttonClassName("primary", "sm")}
              >
                {copy.contactForm}
              </Link>
              <a
                href={whatsappLink(copy.whatsappMessage)}
                target="_blank"
                rel="noreferrer"
                className={buttonClassName("outline", "sm")}
              >
                WhatsApp
              </a>
              <a
                href={siteConfig.phoneHref}
                className={buttonClassName("outline", "sm")}
              >
                {siteConfig.phone}
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
