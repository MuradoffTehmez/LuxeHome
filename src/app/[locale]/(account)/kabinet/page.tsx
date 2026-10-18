import type { Metadata } from "next";
import { Bell, Building2, CalendarCheck, ClipboardList, Heart, SearchCheck, ShieldCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { getCabinetSummary } from "@/lib/accounts/cabinet-summary";
import { requireAccount } from "@/lib/auth/guard";
import { accountTypeKey as accountTypeKeyOf, ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildManagedMetadata } from "@/lib/seo";
import { formatLocalizedRelative } from "@/i18n/date";
import { cn } from "@/lib/utils";
import { CabinetQuickActions } from "./quick-actions";
import { ProfileCompletenessCard } from "./profil/profile-completeness-card";
import { getProfileCompleteness } from "@/lib/accounts/profile-completeness-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "auth.cabinet" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet", noIndex: true, locale: locale as Locale });
}

type Stat = { key: "listings" | "unread" | "savedSearches" | "favorites" | "reservations"; value: number; href: string; icon: typeof Bell; highlight?: boolean };

/**
 * Kabinetin ümumi baxışı — kompakt dashboard: əvvəlcə göstəricilər (hər biri öz bölməsinə aparır),
 * sonra sürətli əməliyyatlar və son bildirişlər yan-yana. Əsas məlumat ilk ekranda qalır.
 */
export default async function CabinetPage() {
  const locale = await getLocale() as Locale;
  const user = await requireAccount(locale);
  const canList = user.accountType !== ACCOUNT_TYPES.USER;
  const [summary, profileCompleteness, unread, savedSearches, favorites, reservations, recentNotifications] = await Promise.all([
    getCabinetSummary(
      {
        countProperties: (userId) =>
          prisma.property.count({ where: { authorId: userId, deletedAt: null } }),
        findAgency: (userId) =>
          prisma.agency.findUnique({
            where: { userId },
            select: { name: true, isVerified: true },
          }),
      },
      user,
    ),
    // Profil tamlığı yalnız agentlik və agent üçün; 100%-də ana səhifədə göstərilmir (#157).
    getProfileCompleteness(user.id, user.accountType),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.savedSearch.count({ where: { userId: user.id } }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.reservation.count({ where: { userId: user.id } }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, title: true, readAt: true, createdAt: true },
    }),
  ]);

  const t = await getTranslations("auth.cabinet");
  const accountT = await getTranslations("auth.accountTypes");
  const accountTypeKey = accountTypeKeyOf(user.accountType);

  const stats: Stat[] = [
    ...(canList ? [{ key: "listings", value: summary.propertyCount, href: "/kabinet/elanlar", icon: ClipboardList } satisfies Stat] : []),
    { key: "unread", value: unread, href: "/kabinet/bildirisler?status=oxunmamis", icon: Bell, highlight: unread > 0 },
    { key: "savedSearches", value: savedSearches, href: "/kabinet/axtarislarim", icon: SearchCheck },
    { key: "favorites", value: favorites, href: "/favoritler", icon: Heart },
    { key: "reservations", value: reservations, href: "/kabinet/rezervasiyalar", icon: CalendarCheck },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        contained
        compact
        eyebrow={t("eyebrow")}
        title={t("greeting", { name: user.name })}
        description={user.email}
        actions={
          <Badge tone="gold" className="w-fit">
            {accountT(accountTypeKey)}
          </Badge>
        }
      />

      <section aria-labelledby="cabinet-stats">
        <h2 id="cabinet-stats" className="sr-only">{t("statsTitle")}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {stats.map(({ key, value, href, icon: Icon, highlight }) => (
            <li key={key}>
              <Link
                href={href}
                className={cn(
                  "card-surface flex h-full min-h-20 flex-col justify-between gap-2 rounded-lg border p-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  highlight ? "border-gold bg-gold/10" : "border-line bg-paper",
                )}
              >
                <span className="flex items-center justify-between gap-2 text-xs font-medium text-ink-soft">
                  {t(`stats.${key}`)}
                  <Icon className={cn("size-4 shrink-0", highlight ? "text-gold-deep" : "text-ink-muted")} aria-hidden="true" />
                </span>
                <span className="font-sans text-2xl font-semibold text-ink tabular-nums">{value}</span>
              </Link>
            </li>
          ))}
        </ul>
        {!canList && <p className="mt-2 text-xs text-ink-muted">{t("listingPermissionHint")}</p>}
      </section>

      {profileCompleteness && profileCompleteness.completeness.percent < 100 && (
        <ProfileCompletenessCard completeness={profileCompleteness.completeness} kind={profileCompleteness.kind} compact />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <CabinetQuickActions canList={canList} />

        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="cabinet-recent-notifications" className="rounded-xl border border-line bg-paper p-4 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <h2 id="cabinet-recent-notifications" className="font-sans text-base font-semibold text-ink">{t("recentNotifications")}</h2>
              <Link href="/kabinet/bildirisler" className="relative text-sm font-medium text-gold-deep after:absolute after:-inset-y-3 after:inset-x-0 hover:text-ink">
                {t("viewAll")}
              </Link>
            </div>
            {recentNotifications.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">{t("noNotifications")}</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {recentNotifications.map((notification) => (
                  <li key={notification.id} className="flex items-start gap-2.5 py-2.5">
                    <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", notification.readAt ? "bg-line-strong" : "bg-gold")} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm", notification.readAt ? "text-ink-soft" : "font-medium text-ink")}>{notification.title}</p>
                      <p className="text-xs text-ink-muted">{formatLocalizedRelative(notification.createdAt, locale)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {user.accountType === ACCOUNT_TYPES.AGENCY && (
            <section className="flex items-center gap-3 rounded-xl border border-line bg-paper p-4 shadow-xs">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep">
                <Building2 className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-muted">{t("agencyProfile")}</p>
                <p className="truncate font-medium text-ink">{summary.agency?.name ?? t("profileMissing")}</p>
              </div>
              <Badge tone={summary.agency?.isVerified ? "success" : "warning"}>
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                {summary.agency?.isVerified ? t("verified") : t("verificationPending")}
              </Badge>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
