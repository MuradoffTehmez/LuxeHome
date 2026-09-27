import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { BadgeCheck, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { requireLister } from "@/lib/auth/guard";
import {
  PACKAGE_ORDER_STATUSES,
  PACKAGE_ORDER_STATUS_TONE,
  PROPERTY_STATUSES,
  type Locale,
  type PackageOrderStatus,
} from "@/lib/constants";
import { formatMoneyMinor } from "@/lib/package-math";
import { getActivePackages } from "@/lib/packages";
import { prisma } from "@/lib/prisma";
import { buildManagedMetadata } from "@/lib/seo";
import { localizePath } from "@/i18n/path-locale";
import { CancelOrderButton } from "./cancel-order-button";
import { PackageRequestForm } from "./package-request-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations({ locale, namespace: "account.packages" });
  return buildManagedMetadata({ title: t("title"), description: t("description"), path: "/kabinet/paketler", noIndex: true, locale });
}

export const dynamic = "force-dynamic";

const STATUS_KEYS: Record<PackageOrderStatus, "pending" | "paid" | "cancelled" | "refunded"> = {
  PENDING: "pending",
  PAID: "paid",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

/** Premium paketlər (#109): elanı önə çıxarmaq üçün sifariş və sifariş tarixçəsi. */
export default async function CabinetPackagesPage({ searchParams }: { searchParams: Promise<{ elan?: string }> }) {
  const locale = await getLocale() as Locale;
  const user = await requireLister(locale);
  const t = await getTranslations("account.packages");
  const [packages, properties, orders, params] = await Promise.all([
    getActivePackages(),
    prisma.property.findMany({
      where: { authorId: user.id, deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.packageOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        packageName: true,
        durationDays: true,
        amountMinor: true,
        currency: true,
        status: true,
        createdAt: true,
        activatedAt: true,
        property: { select: { title: true } },
      },
    }),
    searchParams,
  ]);
  const initialPropertyId = properties.some((property) => property.id === params.elan) ? params.elan! : null;
  const steps = [t("step1"), t("step2"), t("step3")];
  const dateFormat = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Baku" });

  return (
    <div className="min-w-0">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-6">
          {packages.length === 0 ? (
            <EmptyState title={t("noPackagesTitle")} description={t("noPackagesDescription")} />
          ) : properties.length === 0 ? (
            <EmptyState
              title={t("noListingsTitle")}
              description={t("noListingsDescription")}
              action={{ label: t("myListings"), href: localizePath("/kabinet/elanlar", locale), localized: false }}
            />
          ) : (
            <PackageRequestForm packages={packages} properties={properties} initialPropertyId={initialPropertyId} />
          )}
        </section>

        <aside className="rounded-xl border border-line bg-beige/45 p-5">
          <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-ink">
            <Crown className="size-4 text-gold-deep" aria-hidden="true" />
            {t("howTitle")}
          </h2>
          <ol className="mt-3 flex flex-col gap-3 text-sm text-ink-soft">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-navy text-xs font-semibold text-ivory">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-ink-muted">{t("fairRanking")}</p>
        </aside>
      </div>

      <section className="mt-10">
        <h2 className="font-sans text-lg font-semibold text-ink">{t("ordersTitle")}</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">{t("noOrders")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper shadow-xs">
            {orders.map((order) => {
              const status = order.status as PackageOrderStatus;
              return (
                <li key={order.id} className="flex min-w-0 flex-wrap items-center gap-3 p-4 sm:p-5">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                      {order.packageName}
                      <span className="tabular text-sm font-semibold text-ink-soft">{formatMoneyMinor(order.amountMinor, order.currency)}</span>
                    </p>
                    <p className="mt-1 text-sm text-ink-soft [overflow-wrap:anywhere]">
                      {order.property?.title ?? t("listingRemoved")} · {t("days", { days: order.durationDays })}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">{t("orderedAt", { date: dateFormat.format(order.createdAt) })}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={PACKAGE_ORDER_STATUS_TONE[status]}>{t(`status.${STATUS_KEYS[status]}`)}</Badge>
                    {status === PACKAGE_ORDER_STATUSES.PAID && order.activatedAt ? (
                      <Badge tone="gold"><BadgeCheck className="size-3.5" aria-hidden="true" />{t("active")}</Badge>
                    ) : null}
                    {status === PACKAGE_ORDER_STATUSES.PENDING ? <CancelOrderButton id={order.id} /> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
