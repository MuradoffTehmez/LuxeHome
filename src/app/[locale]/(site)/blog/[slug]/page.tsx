import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ShareButtons } from "@/components/site/share-buttons";
import { PostCard } from "@/components/site/post-card";
import { ArticleTrustMeta } from "@/components/site/article-trust-meta";
import { articleSchema, buildManagedMetadata, jsonLd, breadcrumbSchema } from "@/lib/seo";
import { getRelatedPosts } from "@/lib/queries";
import { getCachedPostBySlug } from "@/lib/public-cache";
import { recordView } from "@/lib/view-counter";
import { isUnoptimizedImage } from "@/lib/utils";
import { TRANSLATION_ENTITY_TYPES, type Locale } from "@/lib/constants";
import { applyContentTranslation, getPublishedContentTranslation } from "@/lib/content-translation";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const sourcePost = await getCachedPostBySlug(slug);

  if (!sourcePost) notFound();
  const post = applyContentTranslation(
    TRANSLATION_ENTITY_TYPES.BLOG_POST,
    sourcePost,
    await getPublishedContentTranslation(TRANSLATION_ENTITY_TYPES.BLOG_POST, sourcePost.id, locale as Locale),
  );

  return buildManagedMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.coverUrl || undefined,
    type: "article",
    noIndex: post.noIndex,
    canonicalPath: post.canonicalUrl,
    ogTitle: post.ogTitle,
    ogDescription: post.ogDescription,
    ogImage: post.ogImage,
    locale: locale as Locale,
    managedEntity: { type: TRANSLATION_ENTITY_TYPES.BLOG_POST, id: sourcePost.id },
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const [content, listings, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "content" }),
    getTranslations({ locale, namespace: "listings" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);
  const sourcePost = await getCachedPostBySlug(slug);

  if (!sourcePost) notFound();
  const post = applyContentTranslation(
    TRANSLATION_ENTITY_TYPES.BLOG_POST,
    sourcePost,
    await getPublishedContentTranslation(TRANSLATION_ENTITY_TYPES.BLOG_POST, sourcePost.id, locale as Locale),
  );

  // Sayğac cavabı gözlətmir — `waitUntil` ilə render bitdikdən sonra yazılır
  recordView("post", post.id, (await headers()).get("user-agent"));

  const relatedPosts = await getRelatedPosts(post.id, post.categoryId, 3);
  const publishedAt = new Date(post.publishedAt || post.createdAt);
  const updatedAt = new Date(post.updatedAt);

  return (
    <>
      <script
        {...jsonLd(
          articleSchema({
            title: post.title,
            description: post.excerpt,
            slug: post.slug,
            image: post.coverUrl,
            publishedAt: post.publishedAt || post.createdAt,
            updatedAt: post.updatedAt,
            authorName: post.author?.name,
          }, locale as Locale),
        )}
      />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: navigation("home"), path: "/" },
            { name: navigation("blog"), path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ], locale as Locale),
        )}
      />

      <PageHeader
        compact
        eyebrow={post.category?.name || listings("blogPage.journal")}
        title={post.title}
        description={post.excerpt}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          { label: navigation("blog"), href: "/blog" },
          { label: post.title },
        ]}
        actions={
          <ArticleTrustMeta
            authorName={post.author?.name}
            publishedAt={publishedAt}
            updatedAt={updatedAt}
            readMinutes={post.readMinutes}
            viewCount={post.viewCount}
          />
        }
      />

      <Section tone="ivory" spacing="compact">
        <Container size="narrow">
          <div className="min-w-0">
            {/* Cover */}
            {post.coverUrl && (
              <div className="relative mb-10 aspect-16/9 w-full overflow-hidden rounded-md bg-beige shadow-sm">
                <Image
                  src={post.coverUrl}
                  alt={post.coverAlt || post.title}
                  fill
                  unoptimized={isUnoptimizedImage(post.coverUrl)}
                  priority
                  className="object-cover"
                  sizes="(max-width: 767px) calc(100vw - 2.5rem), 720px"
                />
              </div>
            )}

            {/* Content */}
            <article className="prose-luxe min-w-0 max-w-[68ch] text-base [overflow-wrap:anywhere] sm:text-lg">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>

            {/* Share */}
            <div className="mt-12 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-display text-lg text-ink">{content("articleShare")}</span>
              <ShareButtons title={post.title} path={`/blog/${post.slug}`} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <Section tone="paper" spacing="cozy" className="border-t border-line">
          <Container>
            <div className="mb-8 flex flex-col gap-2">
              <h2 className="font-display text-2xl text-ink sm:text-3xl">{content("similarArticles")}</h2>
              <p className="text-sm text-ink-soft">{content("relatedArticlesDescription")}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <PostCard key={relatedPost.id} post={relatedPost as any} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
