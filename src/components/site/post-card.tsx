import Image from "next/image";
import Link from "next/link";
import { Clock, Newspaper } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { PostCardData } from "@/lib/queries";

export function PostCard({
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
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-sm border border-line bg-paper transition-colors duration-300 hover:border-line-strong",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-beige",
          variant === "featured" ? "aspect-16/10 lg:min-h-[30rem]" : "aspect-16/10",
        )}
      >
        {post.coverUrl ? (
          <Image
            src={post.coverUrl}
            alt={post.coverAlt || post.title}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes={
              variant === "featured"
                ? "(max-width: 1024px) 100vw, 58vw"
                : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            }
            className="image-lift object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-muted">
            <Newspaper className="size-9" aria-hidden="true" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {post.category && <Badge tone="dark">{post.category.name}</Badge>}
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col gap-3 p-5", variant === "featured" && "sm:p-7")}>
        <h3
          className={cn(
            "font-display leading-snug text-ink",
            variant === "featured" ? "text-2xl sm:text-3xl" : "text-lg",
          )}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-gold-deep"
          >
            {post.title}
          </Link>
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">
          {post.excerpt}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-4 text-xs text-ink-muted">
          {post.publishedAt && (
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {formatDate(post.publishedAt)}
            </time>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {post.readMinutes} dəq oxunuş
          </span>
        </div>
      </div>
    </article>
  );
}
