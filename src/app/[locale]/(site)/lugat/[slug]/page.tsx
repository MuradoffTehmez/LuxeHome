import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Info } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import {
  breadcrumbSchema,
  buildManagedMetadata,
  definedTermSchema,
  jsonLd,
} from "@/lib/seo";
import { getKnowledgeTermBySlug, getRelatedTerms } from "@/lib/knowledge";
import { parseJsonArray } from "@/lib/utils";
import { TRANSLATION_ENTITY_TYPES, type Locale } from "@/lib/constants";
import { applyContentTranslation, getPublishedContentTranslation } from "@/lib/content-translation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

async function loadTerm(slug: string, locale: string) {
  const source = await getKnowledgeTermBySlug(slug);
  if (!source) return null;
  return applyContentTranslation(
    TRANSLATION_ENTITY_TYPES.KNOWLEDGE_TERM,
    source,
    await getPublishedContentTranslation(
      TRANSLATION_ENTITY_TYPES.KNOWLEDGE_TERM,
      source.id,
      locale as Locale,
    ),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const term = await loadTerm(slug, locale);
  if (!term) notFound();

  return buildManagedMetadata({
    title: term.term,
    description: term.shortDefinition,
    path: `/lugat/${term.slug}`,
    locale: locale as Locale,
  });
}

export default async function GlossaryTermPage({ params }: Props) {
  const { locale, slug } = await params;
  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "knowledge" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);

  const term = await loadTerm(slug, locale);
  if (!term) notFound();

  const related = await getRelatedTerms(parseJsonArray(term.relatedSlugs), term.slug);

  return (
    <>
      <script
        {...jsonLd(
          definedTermSchema(
            { term: term.term, slug: term.slug, definition: term.shortDefinition },
            locale as Locale,
          ),
        )}
      />
      <script
        {...jsonLd(
          breadcrumbSchema(
            [
              { name: navigation("home"), path: "/" },
              { name: t("glossary.title"), path: "/lugat" },
              { name: term.term, path: `/lugat/${term.slug}` },
            ],
            locale as Locale,
          ),
        )}
      />

      <PageHeader
        compact
        eyebrow={term.category?.name || t("glossary.eyebrow")}
        title={term.term}
        description={term.shortDefinition}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          { label: t("glossary.title"), href: "/lugat" },
          { label: term.term },
        ]}
      />

      <Section tone="ivory" spacing="compact">
        <Container size="narrow">
          {term.definition ? (
            <article className="prose-luxe min-w-0 max-w-[68ch] text-base [overflow-wrap:anywhere] sm:text-lg">
              <div dangerouslySetInnerHTML={{ __html: term.definition }} />
            </article>
          ) : null}

          <p className="mt-8 flex items-start gap-3 rounded-md border border-line bg-paper p-4 text-sm text-ink-soft">
            <Info className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
            <span>{t("article.disclaimer")}</span>
          </p>

          {related.length > 0 && (
            <div className="mt-10 border-t border-line pt-8">
              <h2 className="font-display text-xl text-ink">{t("glossary.seeAlso")}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {related.map((item) => (
                  <li key={item.slug} className="min-w-0">
                    <Link
                      href={`/lugat/${item.slug}`}
                      className="rounded-xs font-medium text-gold-deep underline underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      {item.term}
                    </Link>
                    <p className="mt-0.5 text-sm text-ink-soft">{item.shortDefinition}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <Link
              href="/lugat"
              className="inline-flex min-h-11 items-center rounded-xs border border-line-strong px-4 text-sm font-medium text-ink-soft transition-colors hover:border-gold hover:text-gold-deep"
            >
              {t("glossary.backToGlossary")}
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
