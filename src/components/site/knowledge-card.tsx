import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { KnowledgeCover } from "@/components/site/knowledge-cover";
import { isUnoptimizedImage } from "@/lib/utils";
import type { KnowledgeCardData } from "@/lib/knowledge";
import type { KnowledgeAudience, KnowledgeLevel } from "@/lib/constants";

/**
 * Bilik Mərkəzi bələdçisinin kartı.
 *
 * `PostCard`-dan ayrıdır: bloq kartı tarixi önə çəkir (xəbər axını), bələdçidə
 * isə oxucunun ilk soruşduğu «kimə uyğundur / nə qədər vaxt aparır» məlumatıdır.
 * Şəkil olmadıqda `KnowledgeCover` brend səthi göstərilir — bələdçilərin çoxu foto tələb etmir.
 */
export function KnowledgeCard({
  article,
  priority = false,
}: {
  article: KnowledgeCardData;
  priority?: boolean;
}) {
  const t = useTranslations("knowledge");

  return (
    <article className="card-surface group relative flex h-full min-w-0 flex-col overflow-hidden">
      <div className="relative aspect-16/9 w-full overflow-hidden bg-beige">
        {article.coverUrl ? (
          <Image
            src={article.coverUrl}
            alt={article.coverAlt || article.title}
            fill
            unoptimized={isUnoptimizedImage(article.coverUrl)}
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
          />
        ) : (
          <KnowledgeCover audience={article.audience} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {article.category ? (
            <span className="editorial-kicker text-gold-deep">{article.category.name}</span>
          ) : null}
          <span className="inline-flex items-center rounded-full border border-line-strong bg-ivory px-2.5 py-0.5 font-semibold text-ink-soft">
            {t(`audience.${article.audience as KnowledgeAudience}`)}
          </span>
        </p>

        <h3 className="text-xl leading-snug font-semibold tracking-tight text-ink">
          <Link
            href={`/bilik-merkezi/${article.slug}`}
            className="line-clamp-3 min-h-11 rounded-xs transition-colors after:absolute after:inset-0 after:rounded-lg hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {article.title}
          </Link>
        </h3>

        <p className="line-clamp-3 min-w-0 text-[0.9375rem] leading-7 text-ink-soft [overflow-wrap:anywhere]">
          {article.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-4 text-sm">
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" />
              {t("article.readMinutes", { count: article.readMinutes })}
            </span>
            <span aria-hidden="true">·</span>
            <span>{t(`level.${article.level as KnowledgeLevel}`)}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-gold-deep">
            {t("article.readMore")}
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </article>
  );
}
