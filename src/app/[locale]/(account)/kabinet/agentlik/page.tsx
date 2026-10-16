import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CircleDollarSign,
  Eye,
  FilePlus2,
  Inbox,
  KeyRound,
  MessageSquareWarning,
  MousePointerClick,
  Star,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Link } from "@/i18n/navigation";
import { formatLocalizedDate, formatLocalizedRelative } from "@/i18n/date";
import { requireAccount } from "@/lib/auth/guard";
import { buildManagedMetadata } from "@/lib/seo";
import { getAgencyForOwner } from "@/lib/queries";
import { getAgencyDashboard } from "@/lib/accounts/agency-dashboard";
import { parsePeriod } from "@/lib/accounts/listing-analytics";
import { ACCOUNT_TYPES, ANALYTICS_PERIODS, PUBLIC_PROPERTY_STATUSES, type Locale } from "@/lib/constants";
import { cn, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.agencyDashboard" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/agentlik", noIndex: true, locale: locale as Locale });
}

/**
 * Agentlik idarəetmə paneli (#216, PRD 7.1) — yalnız agentlik sahibi. Göstəricilər yalnız
 * agentliyin mühitinə aid elanlardan hesablanır; dövr `?dovr=7|30|90`.
 */
export default async function AgencyDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  if (user.accountType !== ACCOUNT_TYPES.AGENCY) forbidden();
  const t = await getTranslations("account.agencyDashboard");
  const agency = await getAgencyForOwner(user.id);
  if (!agency) {
    return (
      <div className="min-w-0">
        <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <div className="mt-8">
          <EmptyState title={t("noAgency")} description={t("noAgencyDescription")} action={{ label: t("openProfile"), href: "/kabinet/profil" }} />
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const period = parsePeriod(typeof params.dovr === "string" ? params.dovr : undefined);
  const data = await getAgencyDashboard({ agencyId: agency.id, ownerUserId: user.id, period });

  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
      active ? "border-gold bg-gold/10 font-medium text-ink" : "border-line bg-paper text-ink-soft hover:border-gold",
    );
  const tiles = [
    { key: "active", icon: Building2, label: t("tiles.active"), value: data.listings.active, href: "/kabinet/elanlar" },
    { key: "new", icon: FilePlus2, label: t("tiles.new"), value: data.listings.new },
    { key: "sold", icon: CircleDollarSign, label: t("tiles.sold"), value: data.listings.sold },
    { key: "rented", icon: KeyRound, label: t("tiles.rented"), value: data.listings.rented },
    { key: "agents", icon: Users, label: t("tiles.agents"), value: data.agents.active, href: "/kabinet/komanda" },
    { key: "leads", icon: Inbox, label: t("tiles.leads"), value: data.leads.new, href: "/kabinet/muracietler" },
    { key: "unanswered", icon: MessageSquareWarning, label: t("tiles.unanswered"), value: data.leads.unanswered, href: "/kabinet/muracietler", warn: data.leads.unanswered > 0 },
    { key: "views", icon: Eye, label: t("tiles.views"), value: data.engagement.views, href: "/kabinet/analitika" },
    { key: "clicks", icon: MousePointerClick, label: t("tiles.clicks"), value: data.engagement.contactClicks, href: "/kabinet/analitika" },
  ];
  const alerts = [
    { key: "needsInfo", value: data.moderation.needsInfo },
    { key: "rejected", value: data.moderation.rejected },
    { key: "suspended", value: data.moderation.suspended },
    { key: "openReports", value: data.moderation.openReports },
    { key: "expiringSoon", value: data.moderation.expiringSoon },
  ] as const;
  const activeAlerts = alerts.filter((alert) => alert.value > 0);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={agency.name} description={t("description")} />

      <nav aria-label={t("periodLabel")} className="flex flex-wrap gap-2">
        {ANALYTICS_PERIODS.map((value) => (
          <Link key={value} href={value === 30 ? "/kabinet/agentlik" : `/kabinet/agentlik?dovr=${value}`} className={chip(period === value)} aria-current={period === value ? "page" : undefined}>
            {t("period", { days: value })}
          </Link>
        ))}
      </nav>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => {
          const body = (
            <>
              <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                <tile.icon className={cn("size-3.5", tile.warn ? "text-warning" : "text-gold-deep")} aria-hidden="true" />
                {tile.label}
              </p>
              <p className={cn("tabular mt-1 text-2xl font-semibold", tile.warn ? "text-warning" : "text-ink")}>{formatNumber(tile.value)}</p>
            </>
          );
          return (
            <li key={tile.key}>
              {tile.href ? (
                <Link href={tile.href} className="block h-full rounded-xl border border-line bg-paper p-4 shadow-xs transition-colors hover:border-gold">{body}</Link>
              ) : (
                <div className="h-full rounded-xl border border-line bg-paper p-4 shadow-xs">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="moderation-title" className={cn("rounded-xl border p-4 shadow-xs sm:p-5", activeAlerts.length ? "border-warning/40 bg-warning-bg" : "border-line bg-paper")}>
        <h2 id="moderation-title" className="flex items-center gap-2 font-sans text-base font-semibold text-ink">
          {activeAlerts.length ? <AlertTriangle className="size-4 text-warning" aria-hidden="true" /> : <BadgeCheck className="size-4 text-success" aria-hidden="true" />}
          {t("moderation.title")}
        </h2>
        {activeAlerts.length === 0 ? (
          <p className="mt-1 text-sm text-ink-soft">{t("moderation.clear")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-ink">
            {activeAlerts.map((alert) => (
              <li key={alert.key}>
                <Link href="/kabinet/elanlar" className="underline-offset-4 hover:text-gold-deep hover:underline">
                  {t(`moderation.${alert.key}`, { count: alert.value })}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-labelledby="top-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
          <h2 id="top-title" className="font-sans text-base font-semibold text-ink">{t("top.title")}</h2>
          <p className="mt-1 text-xs text-ink-muted">{t("top.description", { days: period })}</p>
          {data.topListings.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">{t("top.empty")}</p>
          ) : (
            <ol className="mt-3 flex flex-col divide-y divide-line">
              {data.topListings.map((item, index) => (
                <li key={item.id} className="flex min-w-0 items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="tabular w-5 shrink-0 text-sm text-ink-muted">{index + 1}</span>
                    <div className="min-w-0">
                      {(PUBLIC_PROPERTY_STATUSES as readonly string[]).includes(item.status) ? (
                        <Link href={`/emlaklar/${item.slug}`} className="line-clamp-1 text-sm font-medium text-ink hover:text-gold-deep">{item.title}</Link>
                      ) : (
                        // Qeyri-ictimai elanın səhifəsi 404 verir — ad link olmadan, vəziyyəti ilə göstərilir.
                        <p className="line-clamp-1 text-sm font-medium text-ink">{item.title}</p>
                      )}
                      <p className="text-xs text-ink-muted">
                        {item.author?.name}
                        {!(PUBLIC_PROPERTY_STATUSES as readonly string[]).includes(item.status) && ` · ${t("top.notPublic")}`}
                      </p>
                    </div>
                  </div>
                  <span className="tabular flex shrink-0 items-center gap-1 text-sm text-ink-soft">
                    <Eye className="size-3.5" aria-hidden="true" />
                    {formatNumber(item.views)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="reviews-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
          <h2 id="reviews-title" className="font-sans text-base font-semibold text-ink">{t("reviews.title")}</h2>
          {data.rating ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink">
              <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
              <span className="tabular font-semibold">{data.rating.average.toFixed(1)}</span>
              <span className="text-ink-muted">{t("reviews.count", { count: data.rating.count })}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-muted">{t("reviews.none")}</p>
          )}
          {data.reviews.length > 0 && (
            <ul className="mt-3 flex flex-col divide-y divide-line">
              {data.reviews.map((review) => (
                <li key={review.id} className="py-2.5">
                  <p className="flex items-center gap-2 text-xs text-ink-muted">
                    <span className="tabular font-medium text-ink">★ {review.rating}</span>
                    <span>{review.customerName}</span>
                    {review.agentName && <span>· {review.agentName}</span>}
                    <span>· {formatLocalizedDate(review.createdAt, locale, "short")}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{review.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="team-title" className="rounded-xl border border-line bg-paper shadow-xs">
        <h2 id="team-title" className="px-4 pt-4 font-sans text-base font-semibold text-ink sm:px-5">{t("team.title")}</h2>
        <p className="px-4 pt-1 text-xs text-ink-muted sm:px-5">{t("team.description", { days: period })}</p>
        <div className="relative mt-3 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th scope="col" className="px-4 py-2 font-medium sm:px-5">{t("team.member")}</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">{t("team.activeListings")}</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">{t("team.newLeads")}</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">{t("team.unanswered")}</th>
                <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">{t("team.lastActivity")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.team.map((member) => (
                <tr key={member.userId}>
                  <td className="px-4 py-3 sm:px-5">
                    <span className="font-medium text-ink">{member.isOwner ? t("team.owner") : member.name}</span>
                    {!member.isOwner && !member.receivesLeads && <span className="ml-2 text-xs text-ink-muted">{t("team.outOfQueue")}</span>}
                  </td>
                  <td className="tabular px-2 py-3 text-right text-ink">{formatNumber(member.activeListings)}</td>
                  <td className="tabular px-2 py-3 text-right text-ink">{formatNumber(member.newLeads)}</td>
                  <td className={cn("tabular px-2 py-3 text-right", member.unansweredLeads > 0 ? "font-medium text-warning" : "text-ink")}>{formatNumber(member.unansweredLeads)}</td>
                  <td className="px-4 py-3 text-right text-xs text-ink-muted sm:px-5">
                    {member.lastActivityAt ? formatLocalizedRelative(member.lastActivityAt, locale) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs text-ink-muted sm:px-5">
          <Link href="/kabinet/fealiyyet" className="font-medium text-gold-deep underline-offset-4 hover:underline">{t("team.openLog")}</Link>
        </p>
      </section>
    </div>
  );
}
