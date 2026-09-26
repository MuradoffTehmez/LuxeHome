import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { BadgeCheck, Building2, MessageCircle, Phone, Star, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { agentSchema, buildManagedMetadata, jsonLd } from "@/lib/seo";
import { getPublicAgentBySlug } from "@/lib/phase2";
import { isUnoptimizedImage } from "@/lib/utils";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { buttonClassName } from "@/components/ui/button";
import { PropertyCard } from "@/components/site/property-card";
import type { Locale } from "@/lib/constants";
import { AgentReviewForm } from "./review-form";
import { TrackedAnchor } from "@/components/analytics/analytics-event";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const agent = await getPublicAgentBySlug(slug);
  if (!agent) notFound();
  return buildManagedMetadata({
    title: agent.name,
    description: agent.bio || agent.specialization || agent.roleTitle || agent.name,
    path: `/agentler/${agent.slug}`,
    image: agent.avatarUrl || undefined,
    locale: locale as Locale,
    managedEntity: { type: "AGENT", id: agent.id },
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
  const stringList = (value: string) => {
    try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; }
    catch { return []; }
  };

  return (
    <>
      <script {...jsonLd(agentSchema({
        name: agent.name,
        slug: agent.slug,
        roleTitle: agent.roleTitle,
        bio: agent.bio,
        avatarUrl: agent.avatarUrl,
        phone: agent.phone,
        email: agent.email,
        languages: stringList(agent.languages),
        serviceAreas: stringList(agent.areas),
        agency: agent.agency,
        rating,
        reviewCount: agent.reviews.length,
      }, locale as Locale))} />
      {/* Profil başlığı — avatar adın yanında, əlaqə əməlləri birbaşa əlçatandır.
          Əvvəl avatar PageHeader-in əməl sahəsində sağ küncə düşürdü. */}
      <header className="border-b border-line bg-[linear-gradient(180deg,var(--color-paper)_0%,var(--surface-page)_100%)] py-10 sm:py-14">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
            <div className="relative grid size-28 shrink-0 place-items-center overflow-hidden rounded-full bg-beige ring-4 ring-gold/25 ring-offset-4 ring-offset-paper sm:size-32">
              {agent.avatarUrl ? <Image src={agent.avatarUrl} alt="" fill sizes="128px" unoptimized={isUnoptimizedImage(agent.avatarUrl)} className="object-cover" /> : <UserRound className="size-12 text-ink-muted" aria-hidden="true" />}
            </div>

            <div className="min-w-0 flex-1">
              {agent.isVerified ? (
                <p className="editorial-kicker mb-3 flex items-center gap-2 text-gold-deep">
                  <BadgeCheck className="size-4" aria-hidden="true" />
                  {t("verified")}
                </p>
              ) : null}
              <h1 className="font-display text-4xl leading-[1.1] tracking-[-0.02em] text-ink sm:text-5xl">{agent.name}</h1>
              {(agent.specialization || agent.roleTitle) && (
                <p className="mt-3 max-w-2xl text-base text-ink-soft sm:text-lg">{agent.specialization || agent.roleTitle}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {agent.agency && (
                  <Link href={`/agentlikler/${agent.agency.slug}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep">
                    <Building2 className="size-4 text-gold-deep" aria-hidden="true" />
                    {agent.agency.name}
                  </Link>
                )}
                {rating != null && (
                  <Badge tone="gold"><Star className="size-3.5 fill-current" aria-hidden="true" />{rating.toFixed(1)} ({agent.reviews.length})</Badge>
                )}
              </div>
            </div>

            {(agent.phone || agent.whatsapp) && (
              <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
                {agent.phone && (
                  <TrackedAnchor event="agent_contact" payload={{ content_id: agent.id, method: "phone" }} href={`tel:${agent.phone}`} className={buttonClassName("primary", "md")}>
                    <Phone className="size-4" aria-hidden="true" />
                    <span className="tabular">{agent.phone}</span>
                  </TrackedAnchor>
                )}
                {agent.whatsapp && (
                  <TrackedAnchor event="agent_contact" payload={{ content_id: agent.id, method: "whatsapp" }} href={`https://wa.me/${agent.whatsapp.replace(/\D/g, "")}`} className={buttonClassName("outline", "md")}>
                    <MessageCircle className="size-4" aria-hidden="true" />
                    WhatsApp
                  </TrackedAnchor>
                )}
              </div>
            )}
          </div>
        </Container>
      </header>

      <Section tone="ivory" spacing="compact">
        <Container>
          <div className="rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-7">
            <h2 className="font-sans text-lg font-semibold text-ink">{t("about")}</h2>
            {agent.bio && <p className="mt-3 max-w-[72ch] whitespace-pre-line leading-relaxed text-ink-soft">{agent.bio}</p>}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="rounded-lg border border-line bg-ivory px-5 py-4">
                <p className="text-xs text-ink-muted">{t("listings")}</p>
                <p className="tabular mt-1 text-2xl font-semibold text-ink">{agent.properties.length}</p>
              </div>
              <ul className="flex flex-wrap gap-2">
                {agent.experienceYears != null && <li><Badge tone="neutral">{t("experience", { count: agent.experienceYears })}</Badge></li>}
                <li><Badge tone="neutral">{t("soldRented", { sold: agent.soldCount, rented: agent.rentedCount })}</Badge></li>
                {/* PRD bölmə 165 — metrik yalnız real ölçü daxil ediləndə göstərilir. */}
                {agent.responseMinutes != null && <li><Badge tone="neutral">{t("responseTime", { count: agent.responseMinutes })}</Badge></li>}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="paper" spacing="cozy">
        <Container>
          <h2 className="font-display text-3xl tracking-[-0.02em] text-ink">{t("listings")}</h2>
          {agent.properties.length ? <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{agent.properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="mt-6"><EmptyState title={t("noListings")} /></div>}
        </Container>
      </Section>

      <Section tone="ivory" spacing="cozy">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="font-display text-3xl tracking-[-0.02em] text-ink">{t("reviews")}</h2>
              {agent.reviews.length ? <ul className="mt-5 space-y-4">{agent.reviews.map((review) => <li key={review.id} className="rounded-xl border border-line bg-paper p-4 shadow-xs"><p className="flex items-center gap-1 text-gold-deep">{Array.from({ length: review.rating }, (_, index) => <Star key={index} className="size-4 fill-current" aria-hidden="true" />)}</p><p className="mt-2 text-ink-soft">{review.comment}</p><p className="mt-2 text-xs text-ink-muted">{review.customerName}</p></li>)}</ul> : <p className="mt-4 text-ink-muted">{t("noReviews")}</p>}
            </section>
            <AgentReviewForm agentId={agent.id} labels={{ title: t("reviewTitle"), rating: t("rating"), comment: t("comment"), serviceType: t("serviceType"), submit: t("submitReview") }} />
          </div>
        </Container>
      </Section>
    </>
  );
}
