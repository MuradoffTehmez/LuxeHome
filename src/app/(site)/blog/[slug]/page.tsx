import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Clock, Eye, Calendar } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ShareButtons } from "@/components/site/share-buttons";
import { PostCard } from "@/components/site/post-card";
import { buildMetadata, jsonLd, breadcrumbSchema } from "@/lib/seo";
import { getPostBySlug, getRelatedPosts } from "@/lib/queries";
import { siteConfig } from "@/config/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return { title: "Məqalə tapılmadı" };

  return buildMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.coverUrl || undefined,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post.id, post.categoryId, 3);

  // JSON-LD for Blog Post
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: post.coverUrl ? [post.coverUrl] : [],
    datePublished: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author?.name || "LuxeHome",
    },
    publisher: {
      "@type": "Organization",
      name: "LuxeHome",
      logo: {
        "@type": "ImageObject",
        url: `https://luxehome.az/logo.png`,
      },
    },
    description: post.excerpt,
  };

  return (
    <>
      <script {...jsonLd(articleSchema)} />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: "Ana səhifə", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        )}
      />

      <Section tone="ivory" className="pt-8 pb-12 sm:pt-12 sm:pb-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            {/* Meta */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {post.category && (
                <Badge tone="neutral">
                  {post.category.name}
                </Badge>
              )}
              <div className="flex items-center gap-4 text-sm text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4" aria-hidden="true" />
                  {new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(post.publishedAt || post.createdAt))}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden="true" />
                  {post.readMinutes} dəq oxuma
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="size-4" aria-hidden="true" />
                  {post.viewCount} baxış
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="mb-8 font-display text-3xl leading-tight text-ink sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            {/* Cover */}
            {post.coverUrl && (
              <div className="relative mb-10 aspect-16/9 w-full overflow-hidden rounded-md bg-beige shadow-sm">
                <Image
                  src={post.coverUrl}
                  alt={post.coverAlt || post.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 800px"
                />
              </div>
            )}

            {/* Content */}
            <article className="prose-luxe max-w-none text-base sm:text-lg">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>

            {/* Share */}
            <div className="mt-12 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-display text-lg text-ink">Məqaləni paylaş:</span>
              <ShareButtons title={post.title} path={`/blog/${post.slug}`} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <Section tone="paper" className="py-12 sm:py-16 border-t border-line">
          <Container>
            <div className="mb-8 flex flex-col gap-2">
              <h2 className="font-display text-2xl text-ink sm:text-3xl">Oxşar məqalələr</h2>
              <p className="text-sm text-ink-soft">Bu mövzu ilə maraqlananlar üçün digər yazılarımız.</p>
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
