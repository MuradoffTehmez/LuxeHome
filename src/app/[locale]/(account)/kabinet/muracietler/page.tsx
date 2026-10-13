import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { ButtonAnchor } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireLister } from "@/lib/auth/guard";
import { getListerLeads } from "@/lib/accounts/listing-leads";
import { phoneHref } from "@/lib/accounts/listing-publisher";
import { formatLocalizedDateTime } from "@/i18n/date";
import { buildManagedMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.leads" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/muracietler", noIndex: true, locale: locale as Locale });
}

export const dynamic = "force-dynamic";

/** Elan sahibinin kabineti — elan səhifəsindən gələn müraciətlər (`Lead.propertyId`). */
export default async function CabinetLeadsPage() {
  const locale = await getLocale() as Locale;
  const user = await requireLister(locale);
  const [t, leads] = await Promise.all([getTranslations("account.leads"), getListerLeads(user.id)]);

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      {leads.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{lead.name}</p>
                  {lead.property && (
                    <Link
                      href={`/emlaklar/${lead.property.slug}`}
                      className="mt-0.5 block truncate text-sm text-gold-deep underline-offset-4 hover:underline"
                    >
                      {t("listing", { title: lead.property.title })}
                    </Link>
                  )}
                </div>
                <time className="text-xs text-ink-muted" dateTime={lead.createdAt.toISOString()}>
                  {formatLocalizedDateTime(lead.createdAt, locale)}
                </time>
              </div>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-soft [overflow-wrap:anywhere]">{lead.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
