import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AlarmClock, Building2, ClipboardList, Mail, Phone, UserRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { ButtonAnchor } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireLister } from "@/lib/auth/guard";
import { getAccountLeads, getLeadAssignees } from "@/lib/accounts/listing-leads";
import { getLeadEngagementSummary, isClosedLeadStage, isLeadStage } from "@/lib/accounts/lead-pipeline";
import { localizePath } from "@/i18n/path-locale";
import { phoneHref } from "@/lib/accounts/listing-publisher";
import { formatLocalizedDateTime } from "@/i18n/date";
import { buildManagedMetadata } from "@/lib/seo";
import { LEAD_SOURCES, LEAD_STATUSES, type Locale } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LeadActions } from "./lead-actions";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.leads" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/muracietler", noIndex: true, locale: locale as Locale });
}

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Hesabın müraciətləri (#161): ona yönləndirilən, elanlarına gələn və (agentlik sahibində)
 * agentliyin bütün müraciətləri. Kartda status, ilk cavab müddəti və eskalasiya görünür.
 */
export default async function CabinetLeadsPage({ searchParams }: Props) {
  const locale = await getLocale() as Locale;
  const user = await requireLister(locale);
  const unanswered = (await searchParams).filtr === "cavabsiz";
  const [t, { leads, agency }] = await Promise.all([
    getTranslations("account.leads"),
    getAccountLeads(user.id, { unanswered }),
  ]);
  const [assignees, engagement] = await Promise.all([
    agency ? getLeadAssignees(agency) : undefined,
    getLeadEngagementSummary(user.id, agency?.id ?? null),
  ]);

  const tab = (active: boolean) =>
    cn(
      "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
      active ? "border-gold bg-gold/10 font-medium text-ink" : "border-line bg-paper text-ink-soft hover:border-gold",
    );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        contained
        compact
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={agency ? t("agencyDescription") : t("description")}
      />

      {/* PRD 8.2: kliklər faktiki əlaqəni sübut etmir — təsdiqlənmiş müraciətlərdən ayrıca göstərilir. */}
      <section aria-labelledby="engagement-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs">
        <h2 id="engagement-title" className="font-sans text-sm font-semibold text-ink">{t("engagement.title", { days: engagement.days })}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([
            ["leads", engagement.leads],
            ["phone", engagement.phone],
            ["whatsapp", engagement.whatsapp],
            ["telegram", engagement.telegram],
          ] as const).map(([key, value]) => (
            <div key={key} className={cn("rounded-lg border p-3", key === "leads" ? "border-gold/40 bg-gold/5" : "border-line")}>
              <dt className="text-xs text-ink-muted">{t(`engagement.${key}`)}</dt>
              <dd className="tabular mt-0.5 text-xl font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-ink-muted">{t("engagement.note")}</p>
      </section>

      <nav aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
        <Link href="/kabinet/muracietler" className={tab(!unanswered)} aria-current={!unanswered ? "page" : undefined}>
          {t("filterAll")}
        </Link>
        <Link href="/kabinet/muracietler?filtr=cavabsiz" className={tab(unanswered)} aria-current={unanswered ? "page" : undefined}>
          {t("filterUnanswered")}
        </Link>
      </nav>

      {leads.length === 0 ? (
        <EmptyState title={unanswered ? t("emptyUnanswered") : t("empty")} description={unanswered ? undefined : t("emptyDescription")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {leads.map((lead) => {
            const closed = lead.status === LEAD_STATUSES.CLOSED || lead.status === LEAD_STATUSES.COMPLETED;
            const responseMinutes = lead.respondedAt
              ? Math.max(1, Math.round((lead.respondedAt.getTime() - lead.createdAt.getTime()) / 60_000))
              : null;
            return (
              <li key={lead.id} className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{lead.name}</p>
                    {lead.property ? (
                      <Link
                        href={`/emlaklar/${lead.property.slug}`}
                        className="mt-0.5 block truncate text-sm text-gold-deep underline-offset-4 hover:underline"
                      >
                        {t("listing", { title: lead.property.title })}
                      </Link>
                    ) : lead.source === LEAD_SOURCES.AGENCY ? (
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">
                        <Building2 className="size-3.5 text-gold-deep" aria-hidden="true" />
                        {t("fromAgencyProfile")}
                      </p>
                    ) : null}
                  </div>
                  <time className="text-xs text-ink-muted" dateTime={lead.createdAt.toISOString()}>
                    {formatLocalizedDateTime(lead.createdAt, locale)}
                  </time>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone={isClosedLeadStage(lead.stage) ? "neutral" : "info"}>{t(`stages.${isLeadStage(lead.stage) ? lead.stage : "NEW"}`)}</Badge>
                  {lead.nextContactAt && (
                    <Badge tone={lead.nextContactAt < new Date() && !closed ? "danger" : "neutral"}>
                      {t("nextContact", { date: formatLocalizedDateTime(lead.nextContactAt, locale, "short") ?? "" })}
                    </Badge>
                  )}
                  {closed ? (
                    <Badge tone="neutral">{t("statusClosed")}</Badge>
                  ) : lead.respondedAt ? (
                    <Badge tone="success">{t("statusResponded")}</Badge>
                  ) : (
                    <Badge tone="warning">{t("statusWaiting")}</Badge>
                  )}
                  {responseMinutes != null && <Badge tone="neutral">{t("respondedIn", { minutes: responseMinutes })}</Badge>}
                  {lead.escalatedAt && !lead.respondedAt && (
                    <Badge tone="danger" className="gap-1">
                      <AlarmClock className="size-3" aria-hidden="true" />
                      {t("escalated")}
                    </Badge>
                  )}
                  {agency && lead.agencyId === agency.id && lead.handler && lead.handlerId !== user.id && (
                    <Badge tone="info" className="gap-1">
                      <UserRound className="size-3" aria-hidden="true" />
                      {t("handledBy", { name: lead.handler.name })}
                    </Badge>
                  )}
                </div>

                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-soft [overflow-wrap:anywhere]">{lead.message}</p>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <ButtonAnchor href={localizePath(`/kabinet/muracietler/${lead.id}`, locale)} variant="primary" size="sm">
                      <ClipboardList className="size-4" aria-hidden="true" />
                      {t("openCard")}
                    </ButtonAnchor>
                    <ButtonAnchor href={phoneHref(lead.phone)} variant="outline" size="sm">
                      <Phone className="size-4" aria-hidden="true" />
                      {lead.phone}
                    </ButtonAnchor>
                    {lead.email && (
                      <ButtonAnchor href={`mailto:${lead.email}`} variant="ghost" size="sm" className="border border-line">
                        <Mail className="size-4" aria-hidden="true" />
                        {t("reply")}
                      </ButtonAnchor>
                    )}
                  </div>
                  <LeadActions
                    id={lead.id}
                    responded={lead.respondedAt != null}
                    closed={closed}
                    handlerId={lead.handlerId}
                    assignees={agency && lead.agencyId === agency.id ? assignees : undefined}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
