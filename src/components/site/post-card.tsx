import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Clock, Newspaper } from "lucide-react";
import { cn, isUnoptimizedImage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { PostCardData } from "@/lib/queries";

export async function PostCard({
  post,
  priority = false,
  className,
  variant = "standard",
}: {
  post: PostCardData;
  priority?: boolean;
  className?: string;
  variant?: "standard" | "featured";
}) {
  const [t, format] = await Promise.all([
    getTranslations("property"),
    getFormatter(),
  ]);
  return (
    <article
      className={cn(
        "card-surface group relative flex h-full flex-col overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-beige",
          variant === "featured" ? "aspect-16/10 lg:aspect-auto lg:min-h-[22rem] lg:flex-1" : "aspect-16/10",
        )}
      >
        {post.coverUrl ? (
          <Image
            src={post.coverUrl}
            alt={post.coverAlt || post.title}
            fill
            unoptimized={isUnoptimizedImage(post.coverUrl)}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes={
              variant === "featured"
                ? "(max-width: 1024px) 100vw, 58vw"
                : "(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1279px) calc(50vw - 2.25rem), 448px"
            }
            className="image-lift object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-muted">
            <Newspaper className="size-9" aria-hidden="true" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {post.category && <Badge tone="overlay">{post.category.name}</Badge>}
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col gap-3 p-5", variant === "featured" && "sm:p-7")}>
        <h3
          className={cn(
            "leading-snug text-ink",
            variant === "featured" ? "font-display text-2xl font-medium sm:text-[1.75rem]" : "text-lg",
          )}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="after:absolute after:inset-0 after:rounded-lg after:content-[''] line-clamp-3 min-h-11 transition-colors duration-300 hover:text-gold-deep"
          >
            {post.title}
          </Link>
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">
          {post.excerpt}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3.5 text-xs text-ink-muted">
          {post.publishedAt && (
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {format.dateTime(new Date(post.publishedAt), { day: "numeric", month: "long", year: "numeric" })}
            </time>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {t("readMinutes", { count: post.readMinutes })}
          </span>
        </div>
      </div>
    </article>
  );
}
