import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { FaqGroups } from "@/components/site/faq-groups";
import { FAQ_PAGE } from "@/i18n/public-content";
import { getSiteFaqContent } from "@/i18n/site-faq";
import { buildMetadata, faqSchema, jsonLd } from "@/lib/seo";
import type { Locale } from "@/lib/constants";
import { siteConfig, whatsappLink } from "@/config/site";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const copy = FAQ_PAGE[locale as Locale];
  return buildMetadata({
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

          <div className="mt-12 rounded-md border border-line bg-beige/40 p-6 text-center">
            <p className="text-sm text-ink-soft">{copy.noAnswer}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/elaqe"
                className="inline-flex min-h-11 items-center rounded-xs bg-gold px-5 text-sm font-medium text-ink transition-colors hover:bg-gold-soft"
              >
                {copy.contactForm}
              </Link>
              <a
                href={whatsappLink(copy.whatsappMessage)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-xs border border-line-strong px-5 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-deep"
              >
                WhatsApp
              </a>
              <a
                href={siteConfig.phoneHref}
                className="inline-flex min-h-11 items-center rounded-xs border border-line-strong px-5 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-deep"
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
