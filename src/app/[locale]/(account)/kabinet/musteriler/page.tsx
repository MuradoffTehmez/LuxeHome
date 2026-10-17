import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Contact, MapPin, MessageSquare, Plus, Search, UserRound, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Link } from "@/i18n/navigation";
import { formatLocalizedDate } from "@/i18n/date";
import { requireLister } from "@/lib/auth/guard";
import { buildManagedMetadata } from "@/lib/seo";
import { getCrmClients, getCrmContext } from "@/lib/accounts/crm";
import { getLeadAssignees } from "@/lib/accounts/listing-leads";
import { LISTING_TYPES, type Locale } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.clients" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/musteriler", noIndex: true, locale: locale as Locale });
}

const number = new Intl.NumberFormat("en-US");

/**
 * Mini CRM → Müştərilər (#226, PRD 9.1). Axtarış (`?q=`), məsul filtri (`?mesul=`, yalnız idarəçi) və
 * səhifə (`?sehife=`) URL-dədir.
 */
export default async function ClientsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = (await getLocale()) as Locale;
  const user = await requireLister(locale);
  const t = await getTranslations("account.clients");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const owner = typeof params.mesul === "string" ? params.mesul.slice(0, 40) : "";
  const page = Math.min(500, Math.max(1, Number(params.sehife) || 1));
  const context = await getCrmContext(user);
  const [list, assignees] = await Promise.all([
    getCrmClients(context, { q, owner, page }),
    context.canManage && context.access
      ? getLeadAssignees({ id: context.access.agencyId, name: context.access.agencyName, ownerUserId: context.access.ownerUserId })
      : Promise.resolve(null),
  ]);

  const href = (next: { page?: number }) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (owner) query.set("mesul", owner);
    if (next.page && next.page > 1) query.set("sehife", String(next.page));
    const value = query.toString();
    return value ? `/kabinet/musteriler?${value}` : "/kabinet/musteriler";
  };

  const budget = (min: number | null, max: number | null) => {
    if (min == null && max == null) return null;
    if (min != null && max != null) return `${number.format(min)} – ${number.format(max)} ₼`;
    return min != null ? t("budgetFrom", { value: number.format(min) }) : t("budgetTo", { value: number.format(max ?? 0) });
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={context.canManage ? t("descriptionManager") : t("description")} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <form className="flex min-w-0 flex-1 flex-wrap items-end gap-2" role="search">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium text-ink">
            {t("search")}
            <span className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder={t("searchPlaceholder")}
                className="min-h-11 w-full rounded-sm border border-line bg-paper pr-3 pl-9 text-sm font-normal text-ink focus:border-gold focus:outline-none"
              />
            </span>
          </label>
          {assignees && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              {t("ownerFilter")}
              <select name="mesul" defaultValue={owner} className="min-h-11 rounded-sm border border-line bg-paper px-3 text-sm font-normal text-ink focus:border-gold focus:outline-none">
                <option value="">{t("allOwners")}</option>
                {assignees.map((item) => (
                  <option key={item.userId} value={item.userId}>{item.name}</option>
                ))}
              </select>
            </label>
          )}
          <button type="submit" className={buttonClassName("outline", "md")}>{t("searchButton")}</button>
        </form>
        <Link href="/kabinet/musteriler/yeni" className={buttonClassName("primary", "md")}>
          <Plus className="size-4" aria-hidden="true" />
          {t("new")}
        </Link>
      </div>

      {list.clients.length === 0 ? (
        <EmptyState title={q || owner ? t("emptySearchTitle") : t("emptyTitle")} description={q || owner ? t("emptySearchDescription") : t("emptyDescription")} />
      ) : (
        <>
          <p className="text-sm text-ink-muted">{t("count", { count: list.total })}</p>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {list.clients.map((client) => {
              const money = budget(client.priceMin, client.priceMax);
              return (
                <li key={client.id}>
                  <Link
                    href={`/kabinet/musteriler/${client.id}`}
                    className="card-surface flex h-full flex-col gap-2 rounded-xl border border-line bg-paper p-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="flex items-center gap-2 font-medium text-ink">
                        <Contact className="size-4 shrink-0 text-gold-deep" aria-hidden="true" />
                        {client.name}
                      </p>
                      <time className="shrink-0 text-xs text-ink-muted" dateTime={client.updatedAt.toISOString()}>
                        {formatLocalizedDate(client.updatedAt, locale, "short")}
                      </time>
                    </div>
                    <p className="text-sm text-ink-soft [overflow-wrap:anywhere]">{[client.phone, client.email].filter(Boolean).join(" · ")}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {client.listingType && (
                        <Badge tone="info">{t(`listingTypes.${client.listingType === LISTING_TYPES.RENT ? "RENT" : "SALE"}`)}</Badge>
                      )}
                      {client.typeName && <Badge tone="neutral">{client.typeName}</Badge>}
                      {client.rooms != null && <Badge tone="neutral">{t("roomsShort", { rooms: client.rooms >= 5 ? "5+" : client.rooms })}</Badge>}
                      {client.placeName && (
                        <Badge tone="neutral" className="gap-1"><MapPin className="size-3" aria-hidden="true" />{client.placeName}</Badge>
                      )}
                      {money && (
                        <Badge tone="neutral" className="gap-1"><Wallet className="size-3" aria-hidden="true" />{money}</Badge>
                      )}
                      {client.leadCount > 0 && (
                        <Badge tone="gold" className="gap-1"><MessageSquare className="size-3" aria-hidden="true" />{t("leadCount", { count: client.leadCount })}</Badge>
                      )}
                      {context.canManage && client.ownerName && client.ownerId !== user.id && (
                        <Badge tone="info" className="gap-1"><UserRound className="size-3" aria-hidden="true" />{client.ownerName}</Badge>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          {list.pages > 1 && (
            <nav aria-label={t("pagination")} className="flex items-center justify-center gap-3 text-sm">
              {list.page > 1 && <Link href={href({ page: list.page - 1 })} className={buttonClassName("outline", "sm")}>{t("previous")}</Link>}
              <span className="text-ink-muted">{t("pageOf", { page: list.page, pages: list.pages })}</span>
              {list.page < list.pages && <Link href={href({ page: list.page + 1 })} className={buttonClassName("outline", "sm")}>{t("next")}</Link>}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
