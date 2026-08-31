import type { Metadata } from "next";
import Link from "next/link";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import { PERMISSIONS, type ReservationStatus } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { ReservationStatusForm } from "./reservation-status-form";
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.ops.rezervasiyalar") };
}
export const dynamic = "force-dynamic";

const STATUS_TONES = {
  REQUESTED: "gold",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
  COMPLETED: "success",
} as const;

export default async function AdminReservationsPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.LEAD_MANAGE);
  const reservations = await prisma.reservation.findMany({
    include: {
      property: { select: { title: true, slug: true } },
      user: { select: { name: true, email: true } },
      agent: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <AdminPageHeader
        title={t("pages.ops.rezervasiyalar")}
        description={t("pages.ops.emlakBaxisiVeRezervasiya")}
        breadcrumbs={[{ label: t("pages.ops.idarePaneli"), href: "/admin" }, { label: t("pages.ops.rezervasiyalar") }]}
      />
      {reservations.length === 0 ? <EmptyState title={t("pages.ops.rezervasiyaYoxdur")} description={t("pages.ops.ictimaiElanlardanGonderilenSorgular")} /> : (
        <AdminCard bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {reservations.map((reservation) => {
              const status = reservation.status as ReservationStatus;
              return (
                <li key={reservation.id} className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/emlaklar/${reservation.propertyId}`} className="font-medium text-ink hover:text-gold-deep">{reservation.property.title}</Link>
                      <Badge tone={STATUS_TONES[status]}>{t(`labels.reservationStatus.${status}`)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{reservation.firstName} {reservation.lastName} · {reservation.phone} · {reservation.email}</p>
                    <p className="mt-1 text-xs text-ink-muted">{t("pages.misc.istenilenVaxt", { p0: formatDateTime(reservation.requestedFor) })}{reservation.agent ? t("pages.misc.agentQeydi", { p0: reservation.agent.name }) : ""}</p>
                    {reservation.message ? <p className="mt-2 text-sm text-ink-muted">{reservation.message}</p> : null}
                  </div>
                  <ReservationStatusForm id={reservation.id} status={status} />
                </li>
              );
            })}
          </ul>
        </AdminCard>
      )}
    </>
  );
}
