import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ExternalLink, Info, Scale, Tag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatLocalizedDate } from "@/i18n/date";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { ShareButtons } from "@/components/site/share-buttons";
import { KnowledgeCard } from "@/components/site/knowledge-card";
import { SectionHeading } from "@/components/site/section-heading";
import { ArticleTrustMeta } from "@/components/site/article-trust-meta";
import {
  breadcrumbSchema,
  buildManagedMetadata,
  jsonLd,
  knowledgeArticleSchema,
} from "@/lib/seo";
import { getCachedKnowledgeArticleBySlug } from "@/lib/public-cache";
import { describeSource } from "@/lib/official-sources";
import { getRelatedKnowledgeArticles, knowledgeTagSlug, parseKnowledgeTags } from "@/lib/knowledge";
import { recordView } from "@/lib/view-counter";
import { isUnoptimizedImage, parseJsonArray } from "@/lib/utils";
import {
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

const LEGAL_STATUS_KEYS: Record<LegalContentStatus, "current" | "proposal" | "mixed"> = {
  CURRENT: "current",
  PROPOSAL: "proposal",
  MIXED: "mixed",
};
const RISK_LEVEL_KEYS: Record<KnowledgeRiskLevel, "green" | "yellow" | "red" | "legalReview"> = {
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
  LEGAL_REVIEW: "legalReview",
};
/** Status və risk nişanlarının rəngi — mətn həmişə yanındadır, rəng yeganə siqnal deyil. */
const LEGAL_STATUS_TONE: Record<LegalContentStatus, "success" | "warning" | "info"> = {
  CURRENT: "success",
  PROPOSAL: "warning",
  MIXED: "info",
};
const RISK_LEVEL_TONE: Record<KnowledgeRiskLevel, "success" | "warning" | "danger" | "info"> = {
  GREEN: "success",
  YELLOW: "warning",
  RED: "danger",
  LEGAL_REVIEW: "info",
};

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
    canonicalPath: article.canonicalUrl || undefined,
    ogTitle: article.ogTitle,
    ogDescription: article.ogDescription,
    ogImage: article.ogImage,
    locale: locale as Locale,
    managedEntity: { type: TRANSLATION_ENTITY_TYPES.KNOWLEDGE_ARTICLE, id: article.id },
  });
}

function FactLabel({ children }: { children: React.ReactNode }) {
  return <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">{children}</dt>;
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
  const tags = parseKnowledgeTags(article.tags);
  const sources = parseJsonArray<string>(article.sourceUrls)
    .map(describeSource)
    .filter((item) => item !== null);
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

  const legalStatus = article.legalStatus as LegalContentStatus;
  const riskLevel = article.riskLevel as KnowledgeRiskLevel;
  const reviewedAt = formatLocalizedDate(article.legalReviewedAt, locale as Locale);

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
        footer={
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
            {article.coverUrl && (
              <div className="relative mb-10 aspect-16/9 w-full overflow-hidden rounded-xl bg-beige shadow-sm">
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

            <div className="mb-8 flex flex-wrap items-center gap-2.5">
              <Badge tone="gold">{t(`audience.${article.audience as KnowledgeAudience}`)}</Badge>
              <Badge tone="neutral">{t(`level.${article.level as KnowledgeLevel}`)}</Badge>
            </div>

            <aside
              className="mb-12 overflow-hidden rounded-xl border border-gold-line bg-paper shadow-xs"
              aria-label={t("article.legalStatusPanel")}
            >
              <div className="flex items-center gap-3 border-b border-gold-line bg-ivory px-5 py-4 sm:px-6">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-gold-line bg-paper text-gold-deep"
                >
                  <Scale className="size-5" />
                </span>
                <h2 className="font-sans text-lg font-semibold text-ink">{t("article.legalStatusPanel")}</h2>
              </div>

              <div className="p-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <div>
                    <FactLabel>{t("article.normStatus")}</FactLabel>
                    <dd className="mt-2">
                      <Badge tone={LEGAL_STATUS_TONE[legalStatus] ?? "neutral"} className="whitespace-normal">
                        {t(`article.legalStatus.${LEGAL_STATUS_KEYS[legalStatus]}`)}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <FactLabel>{t("article.riskLevel")}</FactLabel>
                    <dd className="mt-2">
                      <Badge tone={RISK_LEVEL_TONE[riskLevel] ?? "neutral"} className="whitespace-normal">
                        {t(`article.riskLevels.${RISK_LEVEL_KEYS[riskLevel]}`)}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <FactLabel>{t("article.jurisdiction")}</FactLabel>
                    <dd className="mt-2 text-sm font-semibold text-ink">{article.jurisdiction}</dd>
                  </div>
                  <div>
                    <FactLabel>{t("article.legalReviewedAt")}</FactLabel>
                    <dd className="mt-2 text-sm font-semibold text-ink">
                      {reviewedAt ?? t("article.notReviewed")}
                    </dd>
                  </div>
                </dl>

                {legalActs.length > 0 && (
                  <div className="mt-6 border-t border-line pt-5">
                    <h3 className="text-sm font-semibold text-ink">{t("article.legalActs")}</h3>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-soft marker:text-gold-deep">
                      {legalActs.map((act) => (
                        <li key={act}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {sources.length > 0 && (
                  <div className="mt-6 border-t border-line pt-5">
                    <h3 className="text-sm font-semibold text-ink">{t("article.officialSources")}</h3>
                    <ul className="mt-3 space-y-1">
                      {sources.map(({ url, label, host }) => (
                        <li key={url}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-h-11 flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xs py-1.5 text-sm leading-6 text-gold-deep underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                          >
                            <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
                            {label !== host ? (
                              <span className="text-xs whitespace-nowrap text-ink-muted">· {host}</span>
                            ) : null}
                            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </aside>

            <article className="prose-luxe min-w-0 max-w-[68ch] text-base [overflow-wrap:anywhere] sm:text-lg">
              {legalBlocks.map(([title, html]) => (
                <section key={title}>
                  <h2>{title}</h2>
                  <div dangerouslySetInnerHTML={{ __html: html }} />
                </section>
              ))}
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </article>

            {/*
              Hüquqi/maliyyə xəbərdarlığı hər bələdçidə göstərilir.
              Məzmun Azərbaycan Respublikasının qanunvericiliyinə istinad etsə də,
              konkret əməliyyat üzrə qərar peşəkar məsləhət tələb edir.
            */}
            <p className="mt-14 flex items-start gap-3 rounded-xl border border-line bg-paper p-5 text-sm leading-6 text-ink-soft shadow-xs">
              <Info className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              <span>{t("article.disclaimer")}</span>
            </p>

            {tags.length > 0 && (
              <nav className="mt-10" aria-label={t("article.tagsTitle")}>
                <h2 className="font-sans text-sm font-semibold text-ink">{t("article.tagsTitle")}</h2>
                <ul className="mt-4 flex flex-wrap gap-2.5">
                  {tags.map((label) => (
                    <li key={label}>
                      <Link
                        href={`/bilik-merkezi?teq=${encodeURIComponent(knowledgeTagSlug(label))}`}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-paper px-4 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                      >
                        <Tag className="size-3.5 text-gold" aria-hidden="true" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <div className="mt-10 flex flex-col gap-4 border-t border-line pt-8">
              <h2 className="font-sans text-base font-semibold text-ink">{t("article.shareTitle")}</h2>
              <ShareButtons title={article.title} path={`/bilik-merkezi/${article.slug}`} showLabel={false} />
            </div>

            <Link
              href="/bilik-merkezi"
              className="group relative mt-8 inline-flex min-h-11 items-center gap-2 rounded-xs text-sm font-medium text-gold-deep transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              {t("article.backToHub")}
            </Link>
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section tone="paper" spacing="cozy" className="border-t border-line">
          <Container>
            <SectionHeading title={t("article.related")} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3">
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
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl text-ink sm:text-2xl">{t("article.ctaTitle")}</h2>
              <p className="mt-2 text-[0.9375rem] leading-7 text-ink-soft">{t("article.ctaDescription")}</p>
            </div>
            <Link
              href="/elaqe"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xs border border-charcoal bg-charcoal px-6 text-sm font-medium text-ink-invert transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              {t("article.ctaAction")}
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
