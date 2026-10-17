import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Building2, History, Mail, MessageSquare, Phone, StickyNote, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonAnchor } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { formatLocalizedDate, formatLocalizedDateTime } from "@/i18n/date";
import { requireLister } from "@/lib/auth/guard";
import { buildManagedMetadata } from "@/lib/seo";
import { phoneHref } from "@/lib/accounts/listing-publisher";
import { getCrmClient, getCrmContext, getCrmFormOptions } from "@/lib/accounts/crm";
import { isClosedLeadStage, isLeadStage } from "@/lib/accounts/lead-pipeline";
import type { Locale } from "@/lib/constants";
import { ClientForm, ClientNoteForm, ClientOwnerSelect, DeleteClientButton } from "../client-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.clients" });
  return buildManagedMetadata({ title: t("card.metaTitle"), description: t("metaDescription"), path: "/kabinet/musteriler", noIndex: true, locale: locale as Locale });
}

const SOURCE_KEYS = ["PROPERTY", "CONTACT", "SERVICE", "PROJECT", "OWNER", "AGENCY", "VIEWING", "INFO"] as const;

/**
 * Müştəri kartı (#226, PRD 9.1): əlaqə, ehtiyaclar (redaktə), maraqlandığı elan, müraciət tarixçəsi
 * və daxili qeydlər. Kartı görməyən hesab üçün 404.
 */
export default async function ClientCardPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = (await getLocale()) as Locale;
  const user = await requireLister(locale);
  const { id } = await params;
  const context = await getCrmContext(user);
  const [card, options] = await Promise.all([getCrmClient(context, String(id).slice(0, 40)), getCrmFormOptions()]);
  if (!card) notFound();
  const t = await getTranslations("account.clients");
  const leadsT = await getTranslations("account.leads");
  const { client } = card;
  const str = (value: number | null) => (value == null ? "" : String(value));

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        contained
        compact
        eyebrow={t("card.eyebrow")}
        title={client.name}
        description={t("card.createdAt", { date: formatLocalizedDate(client.createdAt, locale) ?? "" })}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="needs-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
            <h2 id="needs-title" className="mb-4 font-sans text-base font-semibold text-ink">{t("card.editTitle")}</h2>
            <ClientForm
              id={client.id}
              options={options}
              initial={{
                name: client.name,
                phone: client.phone ?? "",
                email: client.email ?? "",
                listingType: client.listingType ?? "",
                type: card.typeSlug ?? "",
                city: card.citySlug ?? "",
                district: card.districtSlug ?? "",
                priceMin: str(client.priceMin),
                priceMax: str(client.priceMax),
                areaMin: str(client.areaMin),
                areaMax: str(client.areaMax),
                rooms: str(client.rooms),
                renovation: client.renovation ?? "",
                preferences: client.preferences ?? "",
              }}
            />
          </section>

          <section aria-labelledby="client-leads-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
            <h2 id="client-leads-title" className="mb-3 flex items-center gap-2 font-sans text-base font-semibold text-ink">
              <History className="size-4 text-gold-deep" aria-hidden="true" />
              {t("card.leadsTitle")}
            </h2>
            {card.leads.length === 0 ? (
              <p className="text-sm text-ink-muted">{t("card.leadsEmpty")}</p>
            ) : (
              <ol className="flex flex-col divide-y divide-line">
                {card.leads.map((lead) => (
                  <li key={lead.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5 text-sm">
                    <div className="min-w-0">
                      <Link href={`/kabinet/muracietler/${lead.id}`} className="font-medium text-ink underline-offset-4 hover:text-gold-deep hover:underline">
                        {lead.property?.title ?? leadsT(`sources.${(SOURCE_KEYS as readonly string[]).includes(lead.source) ? (lead.source as (typeof SOURCE_KEYS)[number]) : "CONTACT"}`)}
                      </Link>
                      <p className="line-clamp-2 text-ink-soft [overflow-wrap:anywhere]">{lead.message}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone={isClosedLeadStage(lead.stage) ? "neutral" : "info"}>{leadsT(`stages.${isLeadStage(lead.stage) ? lead.stage : "NEW"}`)}</Badge>
                      <time className="text-xs text-ink-muted" dateTime={lead.createdAt.toISOString()}>{formatLocalizedDateTime(lead.createdAt, locale, "short")}</time>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="client-notes-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
            <h2 id="client-notes-title" className="mb-3 flex items-center gap-2 font-sans text-base font-semibold text-ink">
              <StickyNote className="size-4 text-gold-deep" aria-hidden="true" />
              {t("notes.title")}
            </h2>
            <ClientNoteForm id={client.id} />
            {client.notes.length > 0 && (
              <ol className="mt-4 flex flex-col divide-y divide-line">
                {client.notes.map((note) => (
                  <li key={note.id} className="py-2.5">
                    <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-ink">{note.authorName}</span>
                      <time dateTime={note.createdAt.toISOString()} className="text-xs text-ink-muted">{formatLocalizedDateTime(note.createdAt, locale, "short")}</time>
                    </p>
                    <p className="mt-1 rounded-sm bg-ivory px-3 py-2 text-sm whitespace-pre-line text-ink-soft [overflow-wrap:anywhere]">{note.text}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4 shadow-xs">
            <div className="flex flex-wrap gap-2">
              {client.phone && (
                <ButtonAnchor href={phoneHref(client.phone)} variant="outline" size="sm">
                  <Phone className="size-4" aria-hidden="true" />
                  {client.phone}
                </ButtonAnchor>
              )}
              {client.email && (
                <ButtonAnchor href={`mailto:${client.email}`} variant="ghost" size="sm" className="border border-line [overflow-wrap:anywhere]">
                  <Mail className="size-4" aria-hidden="true" />
                  {client.email}
                </ButtonAnchor>
              )}
            </div>
            {card.property && (
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-ink">{t("card.interested")}</span>
                <span className="flex items-center gap-1.5 text-ink-soft">
                  <Building2 className="size-4 shrink-0 text-gold-deep" aria-hidden="true" />
                  {card.property.isPublic ? (
                    <Link href={`/emlaklar/${card.property.slug}`} className="underline-offset-4 hover:text-gold-deep hover:underline">{card.property.title}</Link>
                  ) : (
                    card.property.title
                  )}
                </span>
              </div>
            )}
            {card.assignees ? (
              <ClientOwnerSelect id={client.id} ownerId={client.ownerId} assignees={card.assignees} />
            ) : (
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-ink">{t("card.owner")}</span>
                <span className="flex items-center gap-1.5 text-ink-soft">
                  <UserRound className="size-4" aria-hidden="true" />
                  {card.ownerName ?? "—"}
                </span>
              </div>
            )}
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <MessageSquare className="size-3.5" aria-hidden="true" />
              {t("leadCount", { count: card.leads.length })}
            </p>
            <div>
              <DeleteClientButton id={client.id} name={client.name} />
            </div>
          </section>
          <p className="text-xs leading-5 text-ink-muted">{t("card.privacy")}</p>
          <Link href="/kabinet/musteriler" className="text-sm font-medium text-gold-deep underline-offset-4 hover:underline">← {t("card.back")}</Link>
        </aside>
      </div>
    </div>
  );
}
