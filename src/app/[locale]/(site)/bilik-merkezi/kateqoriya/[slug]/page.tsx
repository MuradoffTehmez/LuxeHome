import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Reveal } from "@/components/ui/reveal";
import { Pagination } from "@/components/ui/pagination";
import { KnowledgeCard } from "@/components/site/knowledge-card";
import { breadcrumbSchema, buildMetadata, itemListSchema, jsonLd } from "@/lib/seo";
import { getCachedKnowledgeArticles } from "@/lib/public-cache";
import { getKnowledgeCategoryBySlug, getKnowledgeTerms } from "@/lib/knowledge";
import type { Locale } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getKnowledgeCategoryBySlug(slug);
  if (!category) notFound();

  return buildMetadata({
    title: category.name,
    description: category.description ?? category.name,
    path: `/bilik-merkezi/kateqoriya/${category.slug}`,
    locale: locale as Locale,
  });
}

export default async function KnowledgeCategoryPage({ params, searchParams }: Props) {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);
  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "knowledge" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);

  const category = await getKnowledgeCategoryBySlug(slug);
  if (!category) notFound();

  const rawPage = typeof query.sehife === "string" ? query.sehife : "1";
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  if (page < 1) notFound();

  const [result, terms] = await Promise.all([
    getCachedKnowledgeArticles({ categorySlug: slug, page }),
    getKnowledgeTerms(),
  ]);
  if (page > result.totalPages) notFound();

  const categoryTerms = terms.filter((term) => term.category?.slug === slug).slice(0, 12);

  return (
    <>
      <script
        {...jsonLd(
          breadcrumbSchema(
            [
              { name: navigation("home"), path: "/" },
              { name: t("hub.eyebrow"), path: "/bilik-merkezi" },
              { name: category.name, path: `/bilik-merkezi/kateqoriya/${category.slug}` },
            ],
            locale as Locale,
          ),
        )}
      />
      {result.items.length > 0 && (
        <script
          {...jsonLd(
            itemListSchema(
              result.items.map((item) => ({
                name: item.title,
                path: `/bilik-merkezi/${item.slug}`,
              })),
              locale as Locale,
            ),
          )}
        />
      )}

      <PageHeader
        eyebrow={t("hub.eyebrow")}
        title={category.name}
        description={category.description ?? undefined}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          { label: t("hub.eyebrow"), href: "/bilik-merkezi" },
          { label: category.name },
        ]}
      />

      <Section tone="ivory" spacing="cozy">
        <Container>
          {result.items.length > 0 ? (
            <>
              <p className="mb-8 text-sm text-ink-muted">
                {t("hub.categoryCount", { count: result.total })}
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((article, index) => (
                  <Reveal key={article.id} delay={index * 50}>
                    <KnowledgeCard article={article} priority={index === 0} />
                  </Reveal>
                ))}
              </div>
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                buildHref={(next) =>
                  `/bilik-merkezi/kateqoriya/${category.slug}${next > 1 ? `?sehife=${next}` : ""}`
                }
                className="mt-12"
              />
            </>
          ) : (
            <EmptyState
              title={t("hub.empty")}
              description={t("hub.emptyDescription")}
              action={{ label: t("hub.allGuides"), href: "/bilik-merkezi" }}
            />
          )}
        </Container>
      </Section>

      {categoryTerms.length > 0 && (
        <Section tone="paper" spacing="compact" className="border-t border-line">
          <Container>
            <h2 className="font-display text-2xl text-ink sm:text-3xl">{t("glossary.title")}</h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {categoryTerms.map((term) => (
                <li key={term.id}>
                  <Link
                    href={`/lugat/${term.slug}`}
                    className="inline-flex min-h-11 items-center rounded-xs border border-line-strong px-4 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    {term.term}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
