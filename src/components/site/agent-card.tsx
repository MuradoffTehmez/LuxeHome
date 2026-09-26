import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Star, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { isUnoptimizedImage } from "@/lib/utils";
import type { getPublicAgents } from "@/lib/phase2";

type PublicAgent = Awaited<ReturnType<typeof getPublicAgents>>[number];

/** Agent kataloqu və agentlik səhifəsi üçün vahid public agent kartı. */
export async function AgentCard({
  agent,
  headingLevel = "h3",
}: {
  agent: PublicAgent;
  headingLevel?: "h2" | "h3";
}) {
  const t = await getTranslations("phase2.agents");
  const Heading = headingLevel;
  const rating = agent.reviews.length
    ? agent.reviews.reduce((sum, review) => sum + review.rating, 0) / agent.reviews.length
    : null;

  // Yeni agentdə `soldCount`/`rentedCount` sıfırdır. «0 satış · 0 icarə»
  // yazmaq kartı boş göstərir, ona görə sətir yalnız real nəticə olanda çıxır.
  const hasDeals = agent.soldCount > 0 || agent.rentedCount > 0;
  const summary = agent.specialization || agent.roleTitle || null;

  return (
    <article className="group relative flex h-full flex-col gap-4 rounded-xl border border-line bg-paper p-5 transition-colors duration-300 ease-out-soft hover:border-gold sm:p-6">
      <div className="flex items-start gap-4">
        <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-beige">
          {agent.avatarUrl ? (
            <Image
              src={agent.avatarUrl}
              alt=""
              fill
              sizes="64px"
              unoptimized={isUnoptimizedImage(agent.avatarUrl)}
              className="object-cover"
            />
          ) : (
            <UserRound className="size-7 text-ink-muted" aria-hidden="true" />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <Heading className="font-display text-xl leading-snug text-ink">
            {/* Bütün kart klikləndikdə agent səhifəsinə keçir. */}
            <Link
              href={`/agentler/${agent.slug}`}
              className="after:absolute after:inset-0 after:content-[''] inline-flex min-h-11 items-center transition-colors duration-300 ease-out-soft hover:text-gold-deep"
            >
              {agent.name}
            </Link>
          </Heading>

          {agent.agency && (
            // Overlay linkin altında qalmasın deyə z-10.
            <p className="relative z-10 w-fit text-sm text-ink-muted">
              <Link
                href={`/agentlikler/${agent.agency.slug}`}
                className="transition-colors hover:text-gold-deep"
              >
                {agent.agency.name}
              </Link>
            </p>
          )}

          {(agent.isVerified || rating != null) && (
            <div className="mt-1 flex flex-wrap gap-2">
              {agent.isVerified && <Badge tone="gold">{t("verified")}</Badge>}
              {rating != null && (
                <Badge tone="neutral">
                  <Star className="mr-1 size-3.5 fill-gold text-gold-deep" aria-hidden="true" />
                  {rating.toFixed(1)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {summary && (
        <p className="text-xs font-medium tracking-wide text-gold-deep uppercase">{summary}</p>
      )}

      {agent.experienceYears != null && (
        <p className="line-clamp-2 text-sm text-ink-soft">
          {t("experience", { count: agent.experienceYears })}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4">
        <dl className="flex items-baseline justify-between gap-4 text-sm">
          <dt className="text-ink-muted">{t("listings")}</dt>
          <dd className="tabular font-display text-lg leading-none text-ink">
            {agent._count.properties}
          </dd>
        </dl>

        {hasDeals && (
          <p className="text-xs text-ink-muted">
            {t("soldRented", { sold: agent.soldCount, rented: agent.rentedCount })}
          </p>
        )}

        {agent.responseMinutes != null && (
          <p className="text-xs text-ink-muted">
            {t("responseTime", { count: agent.responseMinutes })}
          </p>
        )}
      </div>
    </article>
  );
}
