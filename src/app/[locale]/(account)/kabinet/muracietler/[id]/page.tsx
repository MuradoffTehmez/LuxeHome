import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Building2, CalendarClock, History, Mail, MessageSquareText, Phone, StickyNote, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonAnchor } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { formatLocalizedDateTime } from "@/i18n/date";
import { requireLister } from "@/lib/auth/guard";
import { buildManagedMetadata } from "@/lib/seo";
import { phoneHref } from "@/lib/accounts/listing-publisher";
import { getLeadCard, isClosedLeadStage, isLeadStage } from "@/lib/accounts/lead-pipeline";
import { LEAD_ACTIVITY_TYPES, PUBLIC_PROPERTY_STATUSES, type LeadSource, type LeadStage, type Locale } from "@/lib/constants";
import { LeadActions } from "../lead-actions";
import { LeadNextContactForm, LeadNoteForm, LeadStageSelect } from "./card-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.leads" });
  return buildManagedMetadata({ title: t("card.metaTitle"), description: t("metaDescription"), path: "/kabinet/muracietler", noIndex: true, locale: locale as Locale });
}

const SOURCE_KEYS = ["PROPERTY", "CONTACT", "SERVICE", "PROJECT", "OWNER", "AGENCY", "VIEWING", "INFO"] as const;

/** `Date` → `datetime-local` dəyəri (Bakı vaxtı, UTC+4). */
function toBakuInput(date: Date | null): string {
  if (!date) return "";
  return new Date(date.getTime() + 4 * 3_600_000).toISOString().slice(0, 16);
}

/**
 * Müraciət kartı (#222, PRD 8.6): elan, tarix, müştərinin əlaqə məlumatı, mənbə, məsul, mərhələ,
 * qeydlər, növbəti əlaqə tarixi və fəaliyyət tarixçəsi. Yalnız müraciətə baxa bilən şəxs açır —
 * başqasının id-si 404 verir.
 */
export default async function LeadCardPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = (await getLocale()) as Locale;
  const user = await requireLister(locale);
  const { id } = await params;
  const card = await getLeadCard(user.id, String(id).slice(0, 64));
  if (!card) notFound();
  const t = await getTranslations("account.leads");
  const { lead, activities } = card;
  const closed = isClosedLeadStage(lead.stage);
  const sourceKey = (SOURCE_KEYS as readonly string[]).includes(lead.source) ? (lead.source as LeadSource) : "CONTACT";
  const propertyPublic = lead.property && !lead.property.deletedAt && (PUBLIC_PROPERTY_STATUSES as readonly string[]).includes(lead.property.status);

  const activityText = (item: (typeof activities)[number]): string => {
    const d = item.details;
    switch (item.type) {
      case LEAD_ACTIVITY_TYPES.CREATED:
        return typeof d.source === "string" && (SOURCE_KEYS as readonly string[]).includes(d.source)
          ? t("history.created", { source: t(`sources.${d.source as LeadSource}`) })
          : t("history.createdPlain");
      case LEAD_ACTIVITY_TYPES.ASSIGNED:
        return t("history.assigned", { name: typeof d.to === "string" ? d.to : "—" });
      case LEAD_ACTIVITY_TYPES.STAGE:
        return isLeadStage(d.to)
          ? isLeadStage(d.from)
            ? t("history.stage", { from: t(`stages.${d.from}`), to: t(`stages.${d.to}`) })
            : t("history.stageTo", { to: t(`stages.${d.to}`) })
          : t("history.stagePlain");
      case LEAD_ACTIVITY_TYPES.RESPONDED:
        return t("history.responded");
      case LEAD_ACTIVITY_TYPES.REMINDER:
      case LEAD_ACTIVITY_TYPES.ALERT:
      case LEAD_ACTIVITY_TYPES.REASSIGN_SUGGESTED: {
        const key = item.type === LEAD_ACTIVITY_TYPES.REMINDER ? "reminder" : item.type === LEAD_ACTIVITY_TYPES.ALERT ? "alert" : "reassign";
        const minutes = typeof d.minutes === "number" ? d.minutes : 0;
        return minutes >= 120
          ? t(`history.${key}Hours`, { hours: Math.round(minutes / 60) })
          : t(`history.${key}Minutes`, { minutes });
      }
      case LEAD_ACTIVITY_TYPES.NEXT_CONTACT:
        return typeof d.at === "string"
          ? t("history.next", { date: formatLocalizedDateTime(d.at, locale, "short") ?? "" })
          : t("history.nextCleared");
      default:
        return t("history.note");
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader contained compact eyebrow={t("card.eyebrow")} title={lead.name} description={t("card.receivedAt", { date: formatLocalizedDateTime(lead.createdAt, locale) ?? "" })} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={closed ? "neutral" : "info"}>{t(`stages.${lead.stage as LeadStage}`)}</Badge>
              <Badge tone="neutral">{t(`sources.${sourceKey}`)}</Badge>
              {lead.respondedAt ? <Badge tone="success">{t("statusResponded")}</Badge> : !closed && <Badge tone="warning">{t("statusWaiting")}</Badge>}
              {lead.reassignSuggestedAt && !lead.respondedAt && !closed && <Badge tone="danger">{t("reassignSuggested")}</Badge>}
            </div>
            {lead.property ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-ink">
                <Building2 className="size-4 shrink-0 text-gold-deep" aria-hidden="true" />
                {propertyPublic ? (
                  <Link href={`/emlaklar/${lead.property.slug}`} className="underline-offset-4 hover:text-gold-deep hover:underline">{lead.property.title}</Link>
                ) : (
                  <span>{lead.property.title}</span>
                )}
              </p>
            ) : lead.subject ? (
              <p className="mt-3 text-sm text-ink">{lead.subject}</p>
            ) : null}
            <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed whitespace-pre-line text-ink-soft [overflow-wrap:anywhere]">
              <MessageSquareText className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span>{lead.message}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonAnchor href={phoneHref(lead.phone)} variant="outline" size="sm">
                <Phone className="size-4" aria-hidden="true" />
                {lead.phone}
              </ButtonAnchor>
              {lead.email && (
                <ButtonAnchor href={`mailto:${lead.email}`} variant="ghost" size="sm" className="border border-line">
                  <Mail className="size-4" aria-hidden="true" />
                  {lead.email}
                </ButtonAnchor>
              )}
            </div>
          </section>

          <section aria-labelledby="note-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
            <h2 id="note-title" className="mb-3 flex items-center gap-2 font-sans text-base font-semibold text-ink">
              <StickyNote className="size-4 text-gold-deep" aria-hidden="true" />
              {t("card.notesTitle")}
            </h2>
            <LeadNoteForm id={lead.id} />
          </section>

          <section aria-labelledby="history-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
            <h2 id="history-title" className="mb-3 flex items-center gap-2 font-sans text-base font-semibold text-ink">
              <History className="size-4 text-gold-deep" aria-hidden="true" />
              {t("card.historyTitle")}
            </h2>
            {activities.length === 0 ? (
              <p className="text-sm text-ink-muted">{t("card.historyEmpty")}</p>
            ) : (
              <ol className="flex flex-col divide-y divide-line">
                {activities.map((item) => (
                  <li key={item.id} className="py-2.5">
                    <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-ink">
                      <span>
                        <span className="font-medium">{item.actorId ? item.actorName : item.details.source === "admin" ? t("history.admin") : t("history.system")}</span>{" "}
                        {activityText(item)}
                      </span>
                      <time dateTime={item.createdAt.toISOString()} className="text-xs text-ink-muted">{formatLocalizedDateTime(item.createdAt, locale, "short")}</time>
                    </p>
                    {item.type === LEAD_ACTIVITY_TYPES.NOTE && item.text && (
                      <p className="mt-1 rounded-sm bg-ivory px-3 py-2 text-sm whitespace-pre-line text-ink-soft [overflow-wrap:anywhere]">{item.text}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4 shadow-xs">
            <LeadStageSelect id={lead.id} stage={lead.stage} />
            <LeadNextContactForm id={lead.id} value={toBakuInput(lead.nextContactAt)} />
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink">{t("card.handler")}</span>
              <span className="flex items-center gap-1.5 text-ink-soft">
                <UserRound className="size-4" aria-hidden="true" />
                {lead.handler?.name ?? t("card.noHandler")}
              </span>
            </div>
            {lead.nextContactAt && (
              <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                <CalendarClock className="size-3.5" aria-hidden="true" />
                {t("nextContact", { date: formatLocalizedDateTime(lead.nextContactAt, locale, "short") ?? "" })}
              </p>
            )}
            <LeadActions
              id={lead.id}
              responded={lead.respondedAt != null}
              closed={closed}
              handlerId={lead.handlerId}
              assignees={card.assignees ?? undefined}
            />
          </section>
          <p className="text-xs leading-5 text-ink-muted">{t("card.privacy")}</p>
          <Link href="/kabinet/muracietler" className="text-sm font-medium text-gold-deep underline-offset-4 hover:underline">← {t("card.back")}</Link>
        </aside>
      </div>
    </div>
  );
}
