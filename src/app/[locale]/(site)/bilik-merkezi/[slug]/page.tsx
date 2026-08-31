import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ExternalLink, Info, Scale } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { ShareButtons } from "@/components/site/share-buttons";
import { KnowledgeCard } from "@/components/site/knowledge-card";
import { ArticleTrustMeta } from "@/components/site/article-trust-meta";
import {
  breadcrumbSchema,
  buildManagedMetadata,
  jsonLd,
  knowledgeArticleSchema,
} from "@/lib/seo";
import { getCachedKnowledgeArticleBySlug } from "@/lib/public-cache";
import { getRelatedKnowledgeArticles } from "@/lib/knowledge";
import { recordView } from "@/lib/view-counter";
import { isUnoptimizedImage, parseJsonArray } from "@/lib/utils";
import {
  KNOWLEDGE_RISK_LEVEL_LABELS,
  LEGAL_CONTENT_STATUS_LABELS,
  TRANSLATION_ENTITY_TYPES,
  type KnowledgeAudience,
  type KnowledgeLevel,
  type KnowledgeRiskLevel,
  type LegalContentStatus,
  type Locale,
} from "@/lib/constants";
import { applyContentTranslation, getPublishedContentTranslation } from "@/lib/content-translation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

async function loadArticle(slug: string, locale: string) {
  const source = await getCachedKnowledgeArticleBySlug(slug);
  if (!source) return null;
  return applyContentTranslation(
    TRANSLATION_ENTITY_TYPES.KNOWLEDGE_ARTICLE,
    source,
    await getPublishedContentTranslation(
      TRANSLATION_ENTITY_TYPES.KNOWLEDGE_ARTICLE,
      source.id,
      locale as Locale,
    ),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await loadArticle(slug, locale);
  if (!article) notFound();

  return buildManagedMetadata({
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    path: `/bilik-merkezi/${article.slug}`,
    image: article.coverUrl || undefined,
    type: "article",
    noIndex: article.noIndex,
    canonicalPath: article.canonicalUrl,
    ogTitle: article.ogTitle,
    ogDescription: article.ogDescription,
    ogImage: article.ogImage,
    locale: locale as Locale,
    managedEntity: { type: TRANSLATION_ENTITY_TYPES.KNOWLEDGE_ARTICLE, id: article.id },
  });
}

export default async function KnowledgeArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "knowledge" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);

  const article = await loadArticle(slug, locale);
  if (!article) notFound();

  // Sayğac cavabı gözlətmir — `waitUntil` ilə render bitdikdən sonra yazılır.
  recordView("knowledge", article.id, (await headers()).get("user-agent"));

  const related = await getRelatedKnowledgeArticles({
    excludeId: article.id,
    categorySlug: article.category?.slug ?? null,
    audience: article.audience,
  });

  const publishedAt = new Date(article.publishedAt || article.updatedAt);
  const updatedAt = new Date(article.updatedAt);
  const legalActs = parseJsonArray<string>(article.legalActs);
  const sourceUrls = parseJsonArray<string>(article.sourceUrls);
  const legalBlocks = [
    [t("article.legalBasis"), article.legalBasis],
    [t("article.requiredDocuments"), article.requiredDocuments],
    [t("article.procedure"), article.procedure],
    [t("article.duration"), article.duration],
    [t("article.costs"), article.costs],
    [t("article.risks"), article.risks],
    [t("article.checklist"), article.checklist],
    [t("article.template"), article.template],
    [t("article.courtPosition"), article.courtPosition],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return (
    <>
      <script
        {...jsonLd(
          knowledgeArticleSchema(
            {
              title: article.title,
              description: article.excerpt,
              slug: article.slug,
              image: article.coverUrl,
              publishedAt: article.publishedAt,
              updatedAt: article.updatedAt,
              authorName: article.author?.name,
              section: article.category?.name,
            },
            locale as Locale,
          ),
        )}
      />
      <script
        {...jsonLd(
          breadcrumbSchema(
            [
              { name: navigation("home"), path: "/" },
              { name: t("hub.eyebrow"), path: "/bilik-merkezi" },
              ...(article.category
                ? [
                    {
                      name: article.category.name,
                      path: `/bilik-merkezi/kateqoriya/${article.category.slug}`,
                    },
                  ]
                : []),
              { name: article.title, path: `/bilik-merkezi/${article.slug}` },
            ],
            locale as Locale,
          ),
        )}
      />

      <PageHeader
        compact
        eyebrow={article.category?.name || t("hub.eyebrow")}
        title={article.title}
        description={article.excerpt}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          { label: t("hub.eyebrow"), href: "/bilik-merkezi" },
          ...(article.category
            ? [
                {
                  label: article.category.name,
                  href: `/bilik-merkezi/kateqoriya/${article.category.slug}`,
                },
              ]
            : []),
          { label: article.title },
        ]}
        actions={
          <ArticleTrustMeta
            authorName={article.author?.name}
            publishedAt={publishedAt}
            updatedAt={updatedAt}
            readMinutes={article.readMinutes}
            viewCount={article.viewCount}
          />
        }
      />

      <Section tone="ivory" spacing="compact">
        <Container size="narrow">
          <div className="min-w-0">
            <div className="mb-8 flex flex-wrap items-center gap-2">
              <Badge tone="gold">{t(`audience.${article.audience as KnowledgeAudience}`)}</Badge>
              <Badge tone="neutral">{t(`level.${article.level as KnowledgeLevel}`)}</Badge>
            </div>

            <aside className="mb-10 rounded-md border border-gold-line bg-paper p-5 sm:p-6" aria-label={t("article.legalStatusPanel")}>
              <div className="flex items-start gap-3">
                <Scale className="mt-0.5 size-5 shrink-0 text-gold-deep" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl text-ink">{t("article.legalStatusPanel")}</h2>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-ink-muted">{t("article.normStatus")}</dt><dd className="font-medium text-ink">{LEGAL_CONTENT_STATUS_LABELS[article.legalStatus as LegalContentStatus]}</dd></div>
                    <div><dt className="text-ink-muted">{t("article.riskLevel")}</dt><dd className="font-medium text-ink">{KNOWLEDGE_RISK_LEVEL_LABELS[article.riskLevel as KnowledgeRiskLevel]}</dd></div>
                    <div><dt className="text-ink-muted">{t("article.jurisdiction")}</dt><dd className="font-medium text-ink">{article.jurisdiction}</dd></div>
                    <div><dt className="text-ink-muted">{t("article.legalReviewedAt")}</dt><dd className="font-medium text-ink">{article.legalReviewedAt ? new Intl.DateTimeFormat(locale).format(article.legalReviewedAt) : t("article.notReviewed")}</dd></div>
                  </dl>
                  {legalActs.length > 0 && <div className="mt-5"><h3 className="text-sm font-semibold text-ink">{t("article.legalActs")}</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">{legalActs.map((act) => <li key={act}>{act}</li>)}</ul></div>}
                  {sourceUrls.length > 0 && <div className="mt-5"><h3 className="text-sm font-semibold text-ink">{t("article.officialSources")}</h3><ul className="mt-2 space-y-2">{sourceUrls.map((url) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 break-all text-sm text-gold-deep underline-offset-4 hover:underline">{new URL(url).hostname}<ExternalLink className="size-3.5 shrink-0" aria-hidden="true" /></a></li>)}</ul></div>}
                </div>
              </div>
            </aside>

            {article.coverUrl && (
              <div className="relative mb-10 aspect-16/9 w-full overflow-hidden rounded-md bg-beige shadow-sm">
                <Image
                  src={article.coverUrl}
                  alt={article.coverAlt || article.title}
                  fill
                  unoptimized={isUnoptimizedImage(article.coverUrl)}
                  priority
                  className="object-cover"
                  sizes="(max-width: 767px) calc(100vw - 2.5rem), 720px"
                />
              </div>
            )}

            <article className="prose-luxe min-w-0 max-w-[68ch] text-base [overflow-wrap:anywhere] sm:text-lg">
              {legalBlocks.map(([title, html]) => <section key={title}><h2>{title}</h2><div dangerouslySetInnerHTML={{ __html: html }} /></section>)}
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </article>

            {/*
              Hüquqi/maliyyə xəbərdarlığı hər bələdçidə göstərilir.
              Məzmun Azərbaycan Respublikasının qanunvericiliyinə istinad etsə də,
              konkret əməliyyat üzrə qərar peşəkar məsləhət tələb edir.
            */}
            <p className="mt-10 flex items-start gap-3 rounded-md border border-line bg-paper p-4 text-sm text-ink-soft">
              <Info className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              <span>{t("article.disclaimer")}</span>
            </p>

            <div className="mt-8 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-display text-lg text-ink">{t("article.shareTitle")}</span>
              <ShareButtons title={article.title} path={`/bilik-merkezi/${article.slug}`} />
            </div>
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section tone="paper" spacing="cozy" className="border-t border-line">
          <Container>
            <h2 className="mb-8 font-display text-2xl text-ink sm:text-3xl">
              {t("article.related")}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, index) => (
                <Reveal key={item.id} delay={index * 50}>
                  <KnowledgeCard article={item} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Section tone="beige" spacing="compact">
        <Container size="narrow">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl text-ink">{t("article.ctaTitle")}</h2>
              <p className="mt-1 text-sm text-ink-soft">{t("article.ctaDescription")}</p>
            </div>
            <Link
              href="/elaqe"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xs border border-charcoal bg-charcoal px-6 text-sm font-medium text-ink-invert transition-colors hover:bg-ink"
            >
              {t("article.ctaAction")}
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
