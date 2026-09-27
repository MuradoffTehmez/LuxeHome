import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CircleDollarSign, Clock, Crown, Pencil, Power, RotateCcw, Sparkles, X } from "lucide-react";
import { AdminCard, AdminPageHeader, StatCard } from "@/components/admin/admin-ui";
import { AdminForm } from "@/components/admin/form-shell";
import { AdminCheckbox, AdminInput, AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminT } from "@/lib/admin-i18n";
import {
  PACKAGE_ORDER_SOURCES,
  PACKAGE_ORDER_STATUSES,
  PACKAGE_ORDER_STATUS_TONE,
  PAYMENT_METHODS,
  PERMISSIONS,
  PROPERTY_STATUSES,
  type PackageOrderStatus,
  type PaymentMethod,
} from "@/lib/constants";
import { formatMoneyMinor, minorToInput } from "@/lib/package-math";
import { getBillingSummary } from "@/lib/packages";
import { prisma } from "@/lib/prisma";
import { cn, formatDateTime } from "@/lib/utils";
import {
  activatePackageOrder,
  cancelPackageOrder,
  createOrder,
  refundPackageOrder,
  savePackage,
  togglePackage,
} from "./actions";
import { PaymentForm } from "./payment-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.packages.title") };
}

export const dynamic = "force-dynamic";

const ORDER_LIMIT = 100;
const STATUS_FILTERS = ["ALL", ...Object.values(PACKAGE_ORDER_STATUSES)] as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Premium paketləri və ödəniş uçotu (#109). Real ödəniş provayderi yoxdur: ödəniş
 * ofisdə/köçürmə ilə alınır, burada qeydə alınır və premium elana tətbiq olunur.
 */
export default async function PackagesAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.BILLING_MANAGE);
  const params = await searchParams;
  const rawStatus = typeof params.status === "string" ? params.status : "ALL";
  const status = (STATUS_FILTERS as readonly string[]).includes(rawStatus) ? rawStatus : "ALL";
  const editId = typeof params.paket === "string" ? params.paket : null;

  const [summary, packages, orders, properties] = await Promise.all([
    getBillingSummary(),
    prisma.listingPackage.findMany({
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { durationDays: "asc" }],
      select: { id: true, name: true, description: true, durationDays: true, priceMinor: true, isActive: true, sortOrder: true, _count: { select: { orders: true } } },
    }),
    prisma.packageOrder.findMany({
      where: status === "ALL" ? {} : { status },
      orderBy: { createdAt: "desc" },
      take: ORDER_LIMIT,
      select: {
        id: true,
        packageName: true,
        durationDays: true,
        amountMinor: true,
        currency: true,
        customerName: true,
        customerPhone: true,
        status: true,
        source: true,
        paymentMethod: true,
        paymentReference: true,
        note: true,
        createdAt: true,
        paidAt: true,
        activatedAt: true,
        propertyId: true,
        property: { select: { title: true, status: true } },
        recordedBy: { select: { name: true } },
      },
    }),
    prisma.property.findMany({
      where: { deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);
  const editing = editId ? packages.find((pkg) => pkg.id === editId) ?? null : null;
  const activePackages = packages.filter((pkg) => pkg.isActive);

  return (
    <>
      <AdminPageHeader
        title={t("pages.packages.title")}
        description={t("pages.packages.description")}
        breadcrumbs={[{ label: t("pages.leads.idarePaneli"), href: "/admin" }, { label: t("pages.packages.title") }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("pages.packages.monthRevenue")} value={formatMoneyMinor(summary.monthRevenueMinor)} hint={t("pages.packages.monthPaidCount", { count: summary.monthPaidCount })} icon={CircleDollarSign} tone="success" />
        <StatCard label={t("pages.packages.pendingOrders")} value={summary.pending} icon={Clock} tone="warning" href="/admin/paketler?status=PENDING" />
        <StatCard label={t("pages.packages.awaitingActivation")} value={summary.awaitingActivation} hint={t("pages.packages.awaitingActivationHint")} icon={Sparkles} tone="gold" />
        <StatCard label={t("pages.packages.activePremium")} value={summary.activePremium} icon={Crown} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard title={t("pages.packages.newOrder")} description={t("pages.packages.newOrderHint")}>
          {activePackages.length === 0 ? (
            <p className="text-sm text-ink-muted">{t("pages.packages.noActivePackages")}</p>
          ) : (
            <AdminForm action={createOrder} submitLabel={t("pages.packages.createOrder")}>
              <AdminSelect name="packageId" label={t("pages.packages.package")} required options={activePackages.map((pkg) => ({ value: pkg.id, label: `${pkg.name} · ${formatMoneyMinor(pkg.priceMinor)}` }))} />
              <AdminSelect name="propertyId" label={t("pages.packages.property")} required placeholder={t("pages.packages.choose")} options={properties.map((property) => ({ value: property.id, label: property.title }))} />
              <AdminInput name="customerName" label={t("pages.packages.customerName")} required maxLength={120} />
              <AdminInput name="customerPhone" label={t("pages.packages.customerPhone")} type="tel" maxLength={40} />
              <FullWidth>
                <AdminTextarea name="note" label={t("pages.packages.note")} rows={2} maxLength={500} />
              </FullWidth>
              <FullWidth>
                <AdminCheckbox name="paid" label={t("pages.packages.alreadyPaid")} />
              </FullWidth>
              <AdminSelect name="paymentMethod" label={t("pages.packages.method")} placeholder={t("pages.packages.choose")} options={Object.values(PAYMENT_METHODS).map((method) => ({ value: method, label: t(`labels.paymentMethod.${method}`) }))} />
              <AdminInput name="paymentReference" label={t("pages.packages.reference")} maxLength={120} />
            </AdminForm>
          )}
        </AdminCard>

        <AdminCard title={t("pages.packages.packages")} description={t("pages.packages.packagesHint")}>
          {packages.length > 0 ? (
            <ul className="mb-5 divide-y divide-line rounded-lg border border-line">
              {packages.map((pkg) => (
                <li key={pkg.id} className="flex min-w-0 flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                      {pkg.name}
                      {pkg.isActive ? null : <Badge tone="neutral">{t("pages.packages.inactive")}</Badge>}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {t("pages.packages.durationDays", { days: pkg.durationDays })} · <span className="tabular font-semibold text-ink">{formatMoneyMinor(pkg.priceMinor)}</span> · {t("pages.packages.orderCount", { count: pkg._count.orders })}
                    </p>
                  </div>
                  <Link href={`/admin/paketler?paket=${pkg.id}#paket-formu`} className="grid size-11 place-items-center rounded-sm text-ink-soft hover:bg-beige hover:text-ink" aria-label={t("pages.packages.editLabel", { name: pkg.name })}>
                    <Pencil className="size-4" aria-hidden="true" />
                  </Link>
                  <ConfirmAction
                    action={togglePackage}
                    id={pkg.id}
                    tone="neutral"
                    title={pkg.isActive ? t("pages.packages.disableTitle") : t("pages.packages.enableTitle")}
                    description={pkg.isActive ? t("pages.packages.disableDescription") : t("pages.packages.enableDescription")}
                    confirmLabel={pkg.isActive ? t("pages.packages.disable") : t("pages.packages.enable")}
                    label={pkg.isActive ? t("pages.packages.disable") : t("pages.packages.enable")}
                  >
                    <Power className="size-4" aria-hidden="true" />
                  </ConfirmAction>
                </li>
              ))}
            </ul>
          ) : null}
          <div id="paket-formu" className="scroll-mt-24">
            <h3 className="mb-3 text-sm font-semibold text-ink">{editing ? t("pages.packages.editPackage") : t("pages.packages.newPackage")}</h3>
            <AdminForm
              key={editing?.id ?? "new"}
              action={savePackage}
              submitLabel={editing ? t("pages.packages.savePackage") : t("pages.packages.addPackage")}
              cancelHref={editing ? "/admin/paketler" : undefined}
            >
              {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
              <AdminInput name="name" label={t("pages.packages.name")} required maxLength={80} defaultValue={editing?.name} placeholder={t("pages.packages.namePlaceholder")} />
              <AdminInput name="price" label={t("pages.packages.price")} required inputMode="decimal" pattern="\d+([.,]\d{1,2})?" defaultValue={editing ? minorToInput(editing.priceMinor) : undefined} hint={t("pages.packages.priceHint")} />
              <AdminInput name="durationDays" label={t("pages.packages.duration")} type="number" min={1} max={365} required defaultValue={editing?.durationDays ?? 7} />
              <AdminInput name="sortOrder" label={t("pages.packages.sortOrder")} type="number" min={0} max={999} defaultValue={editing?.sortOrder ?? 0} />
              <FullWidth>
                <AdminTextarea name="description" label={t("pages.packages.packageDescription")} rows={2} maxLength={300} defaultValue={editing?.description ?? undefined} />
              </FullWidth>
            </AdminForm>
          </div>
        </AdminCard>
      </div>

      <AdminCard title={t("pages.packages.orders")} className="mt-6" bodyClassName="p-0">
        <nav aria-label={t("pages.packages.statusFilter")} className="flex gap-2 overflow-x-auto border-b border-line px-4 py-3 sm:px-5">
          {STATUS_FILTERS.map((value) => (
            <Link
              key={value}
              href={value === "ALL" ? "/admin/paketler" : `/admin/paketler?status=${value}`}
              aria-current={status === value ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm",
                status === value ? "border-navy bg-navy text-ivory" : "border-line-strong text-ink-soft hover:border-gold",
              )}
            >
              {value === "ALL" ? t("pages.packages.all") : t(`labels.packageOrderStatus.${value}`)}
            </Link>
          ))}
        </nav>
        {orders.length === 0 ? (
          <div className="p-5">
            <EmptyState title={t("pages.packages.noOrders")} description={t("pages.packages.noOrdersHint")} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {orders.map((order) => {
              const orderStatus = order.status as PackageOrderStatus;
              const paid = orderStatus === PACKAGE_ORDER_STATUSES.PAID;
              return (
                <li key={order.id} className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{order.packageName}</p>
                      <span className="tabular font-semibold text-ink">{formatMoneyMinor(order.amountMinor, order.currency)}</span>
                      <Badge tone={PACKAGE_ORDER_STATUS_TONE[orderStatus]}>{t(`labels.packageOrderStatus.${orderStatus}`)}</Badge>
                      {paid && order.activatedAt ? <Badge tone="gold"><BadgeCheck className="size-3.5" aria-hidden="true" />{t("pages.packages.applied")}</Badge> : null}
                      {paid && !order.activatedAt ? <Badge tone="warning">{t("pages.packages.notApplied")}</Badge> : null}
                      <Badge tone="neutral">{order.source === PACKAGE_ORDER_SOURCES.CABINET ? t("pages.packages.sourceCabinet") : t("pages.packages.sourceAdmin")}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft [overflow-wrap:anywhere]">
                      {order.customerName}{order.customerPhone ? ` · ${order.customerPhone}` : ""} · {t("pages.packages.durationDays", { days: order.durationDays })}
                    </p>
                    {order.propertyId && order.property ? (
                      <Link href={`/admin/emlaklar/${order.propertyId}`} className="mt-1 inline-block text-sm text-gold-deep hover:underline [overflow-wrap:anywhere]">{order.property.title}</Link>
                    ) : (
                      <p className="mt-1 text-sm text-ink-muted">{t("pages.packages.propertyRemoved")}</p>
                    )}
                    <p className="mt-1 text-xs text-ink-muted">
                      {t("pages.packages.createdAt", { date: formatDateTime(order.createdAt) })}
                      {order.paidAt ? ` · ${t("pages.packages.paidAt", { date: formatDateTime(order.paidAt), method: order.paymentMethod ? t(`labels.paymentMethod.${order.paymentMethod as PaymentMethod}`) : "—" })}` : ""}
                      {order.paymentReference ? ` · ${order.paymentReference}` : ""}
                      {order.recordedBy ? ` · ${order.recordedBy.name}` : ""}
                    </p>
                    {order.note ? <p className="mt-2 text-sm text-ink-muted [overflow-wrap:anywhere]">{order.note}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {orderStatus === PACKAGE_ORDER_STATUSES.PENDING ? (
                      <>
                        <PaymentForm id={order.id} />
                        <ConfirmAction action={cancelPackageOrder} id={order.id} title={t("pages.packages.cancelTitle")} description={t("pages.packages.cancelDescription")} confirmLabel={t("pages.packages.cancel")} label={t("pages.packages.cancel")}>
                          <X className="size-4" aria-hidden="true" />
                        </ConfirmAction>
                      </>
                    ) : null}
                    {paid && !order.activatedAt ? (
                      <ConfirmAction action={activatePackageOrder} id={order.id} tone="neutral" title={t("pages.packages.activateTitle")} description={t("pages.packages.activateDescription")} confirmLabel={t("pages.packages.activate")} label={t("pages.packages.activate")}>
                        <Sparkles className="size-4" aria-hidden="true" />
                      </ConfirmAction>
                    ) : null}
                    {paid ? (
                      <ConfirmAction action={refundPackageOrder} id={order.id} title={t("pages.packages.refundTitle")} description={order.activatedAt ? t("pages.packages.refundDescriptionApplied", { days: order.durationDays }) : t("pages.packages.refundDescription")} confirmLabel={t("pages.packages.refund")} label={t("pages.packages.refund")}>
                        <RotateCcw className="size-4" aria-hidden="true" />
                      </ConfirmAction>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {orders.length === ORDER_LIMIT ? <p className="border-t border-line px-5 py-3 text-xs text-ink-muted">{t("pages.packages.limitNotice", { count: ORDER_LIMIT })}</p> : null}
      </AdminCard>
    </>
  );
}
