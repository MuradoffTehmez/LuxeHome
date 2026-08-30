import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MessageCircle, Phone, Star, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo";
import { getPublicAgentBySlug } from "@/lib/phase2";
import { isUnoptimizedImage } from "@/lib/utils";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { PropertyCard } from "@/components/site/property-card";
import type { Locale } from "@/lib/constants";
import { AgentReviewForm } from "./review-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const agent = await getPublicAgentBySlug(slug);
  if (!agent) notFound();
  return buildMetadata({
    title: agent.name,
    description: agent.bio || agent.specialization || agent.roleTitle || agent.name,
    path: `/agentler/${agent.slug}`,
    image: agent.avatarUrl || undefined,
    locale: locale as Locale,
  });
}

export default async function AgentPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "phase2.agents" });
  const agent = await getPublicAgentBySlug(slug);
  if (!agent) notFound();
  const rating = agent.reviews.length
    ? agent.reviews.reduce((sum, review) => sum + review.rating, 0) / agent.reviews.length
    : null;

  return (
    <>
      <PageHeader
        compact
        eyebrow={agent.isVerified ? t("verified") : undefined}
        title={agent.name}
        description={agent.specialization || agent.roleTitle || undefined}
        actions={
          <div className="relative grid size-24 place-items-center overflow-hidden rounded-full bg-beige">
            {agent.avatarUrl ? <Image src={agent.avatarUrl} alt="" fill sizes="96px" unoptimized={isUnoptimizedImage(agent.avatarUrl)} className="object-cover" /> : <UserRound className="size-10 text-ink-muted" aria-hidden="true" />}
          </div>
        }
      />

      <Section tone="ivory" spacing="compact">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-md border border-line bg-paper p-5 sm:p-6">
              <h2 className="font-display text-xl text-ink">{t("about")}</h2>
              {agent.bio && <p className="mt-3 whitespace-pre-line text-ink-soft">{agent.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {agent.experienceYears != null && <Badge tone="neutral">{t("experience", { count: agent.experienceYears })}</Badge>}
                <Badge tone="neutral">{t("soldRented", { sold: agent.soldCount, rented: agent.rentedCount })}</Badge>
                {/* PRD bölmə 165 — metrik yalnız real ölçü daxil ediləndə göstərilir. */}
                {agent.responseMinutes != null && <Badge tone="neutral">{t("responseTime", { count: agent.responseMinutes })}</Badge>}
                {rating != null && <Badge tone="gold"><Star className="mr-1 size-3.5 fill-current" aria-hidden="true" />{rating.toFixed(1)} ({agent.reviews.length})</Badge>}
              </div>
            </div>
            <aside className="rounded-md border border-line bg-paper p-5">
              <div className="flex flex-col gap-2 text-sm">
                {agent.phone && <a href={`tel:${agent.phone}`} className="flex min-h-11 items-center gap-2 text-ink hover:text-gold-deep"><Phone className="size-4" aria-hidden="true" />{agent.phone}</a>}
                {agent.whatsapp && <a href={`https://wa.me/${agent.whatsapp.replace(/\D/g, "")}`} className="flex min-h-11 items-center gap-2 text-ink hover:text-gold-deep"><MessageCircle className="size-4" aria-hidden="true" />WhatsApp</a>}
                {agent.agency && <Link href={`/agentlikler/${agent.agency.slug}`} className="min-h-11 py-3 text-ink hover:text-gold-deep">{agent.agency.name}</Link>}
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section tone="paper" spacing="cozy">
        <Container>
          <h2 className="font-display text-2xl text-ink">{t("listings")}</h2>
          {agent.properties.length ? <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{agent.properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="mt-6"><EmptyState title={t("noListings")} /></div>}
        </Container>
      </Section>

      <Section tone="ivory" spacing="cozy">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="font-display text-2xl text-ink">{t("reviews")}</h2>
              {agent.reviews.length ? <ul className="mt-5 space-y-4">{agent.reviews.map((review) => <li key={review.id} className="rounded-md border border-line bg-paper p-4"><p className="flex items-center gap-1 text-gold-deep">{Array.from({ length: review.rating }, (_, index) => <Star key={index} className="size-4 fill-current" aria-hidden="true" />)}</p><p className="mt-2 text-ink-soft">{review.comment}</p><p className="mt-2 text-xs text-ink-muted">{review.customerName}</p></li>)}</ul> : <p className="mt-4 text-ink-muted">{t("noReviews")}</p>}
            </section>
            <AgentReviewForm agentId={agent.id} labels={{ title: t("reviewTitle"), rating: t("rating"), comment: t("comment"), serviceType: t("serviceType"), submit: t("submitReview") }} />
          </div>
        </Container>
      </Section>
    </>
  );
}
