import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { FAQ_PAGE, getFaqContent } from "@/i18n/public-content";
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

/** JavaScript tələb etməyən, klaviatura və axtarış motorları üçün açıq FAQ. */
export default async function FaqPage({ params }: PageProps) {
  const { locale } = await params;
  const activeLocale = locale as Locale;
  const copy = FAQ_PAGE[activeLocale];
  const groups = getFaqContent(activeLocale);
  const navigation = await getTranslations({ locale, namespace: "navigation" });
  const items = groups.flatMap((group) => group.items);

  return (
    <>
      <script {...jsonLd(faqSchema(items, "/suallar"))} />

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
          <div className="flex flex-col gap-10">
            {groups.map((group) => (
              <section key={group.title} className="flex flex-col gap-3">
                <h2 className="font-display text-xl text-ink">{group.title}</h2>
                <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-paper">
                  {group.items.map((item) => (
                    <details key={item.question} className="group px-4 sm:px-5">
                      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2 text-left text-sm font-medium text-ink marker:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset">
                        <span className="min-w-0 [overflow-wrap:anywhere]">{item.question}</span>
                        <ChevronDown
                          className="mt-0.5 size-4 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </summary>
                      <p className="pb-4 text-sm leading-relaxed text-ink-soft [overflow-wrap:anywhere]">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

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
