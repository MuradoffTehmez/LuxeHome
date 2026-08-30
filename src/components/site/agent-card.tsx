import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Star, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { isUnoptimizedImage } from "@/lib/utils";
import type { getPublicAgents } from "@/lib/phase2";

type PublicAgent = Awaited<ReturnType<typeof getPublicAgents>>[number];

/** Agent kataloqu və agentlik səhifəsi üçün vahid public agent kartı. */
export async function AgentCard({ agent }: { agent: PublicAgent }) {
  const t = await getTranslations("phase2.agents");
  const rating = agent.reviews.length
    ? agent.reviews.reduce((sum, review) => sum + review.rating, 0) / agent.reviews.length
    : null;

  return <article className="h-full rounded-md border border-line bg-paper p-5 shadow-sm">
    <div className="flex items-start gap-4">
      <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-beige">
        {agent.avatarUrl ? <Image src={agent.avatarUrl} alt="" fill sizes="64px" unoptimized={isUnoptimizedImage(agent.avatarUrl)} className="object-cover" /> : <UserRound className="size-7 text-ink-muted" aria-hidden="true" />}
      </div>
      <div className="min-w-0">
        <h3 className="font-display text-xl text-ink"><Link href={`/agentler/${agent.slug}`} className="hover:text-gold-deep">{agent.name}</Link></h3>
        {agent.agency && <p className="text-sm text-ink-muted"><Link href={`/agentlikler/${agent.agency.slug}`} className="hover:text-gold-deep">{agent.agency.name}</Link></p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {agent.isVerified && <Badge tone="gold">{t("verified")}</Badge>}
          {rating != null && <Badge tone="neutral"><Star className="mr-1 size-3.5 fill-gold text-gold-deep" aria-hidden="true" />{rating.toFixed(1)}</Badge>}
        </div>
      </div>
    </div>
    <p className="mt-4 text-sm text-ink-soft">{agent.specialization || agent.roleTitle || t("about")}</p>
    <p className="mt-3 text-xs text-ink-muted">{t("soldRented", { sold: agent.soldCount, rented: agent.rentedCount })} · {agent._count.properties} {t("listings").toLocaleLowerCase()}</p>
    {agent.responseMinutes != null && <p className="mt-1 text-xs text-ink-muted">{t("responseTime", { count: agent.responseMinutes })}</p>}
  </article>;
}
