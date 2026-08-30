import type { Metadata } from "next";
import Link from "next/link";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import { PERMISSIONS, RESERVATION_STATUS_LABELS, type ReservationStatus } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { ReservationStatusForm } from "./reservation-status-form";

export const metadata: Metadata = { title: "Rezervasiyalar" };
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
        title="Rezervasiyalar"
        description="Əmlak baxışı və rezervasiya sorğularını status tarixçəsi ilə idarə edin."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Rezervasiyalar" }]}
      />
      {reservations.length === 0 ? <EmptyState title="Rezervasiya yoxdur" description="İctimai elanlardan göndərilən sorğular burada görünəcək." /> : (
        <AdminCard bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {reservations.map((reservation) => {
              const status = reservation.status as ReservationStatus;
              return (
                <li key={reservation.id} className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/emlaklar/${reservation.propertyId}`} className="font-medium text-ink hover:text-gold-deep">{reservation.property.title}</Link>
                      <Badge tone={STATUS_TONES[status]}>{RESERVATION_STATUS_LABELS[status]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{reservation.firstName} {reservation.lastName} · {reservation.phone} · {reservation.email}</p>
                    <p className="mt-1 text-xs text-ink-muted">İstənilən vaxt: {formatDateTime(reservation.requestedFor)}{reservation.agent ? ` · Agent: ${reservation.agent.name}` : ""}</p>
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
