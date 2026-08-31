import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Link } from "@/i18n/navigation";
import { requireAccount } from "@/lib/auth/guard";
import {
  RESERVATION_STATUSES,
  type Locale,
  type ReservationStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildManagedMetadata } from "@/lib/seo";
import { formatDateTime } from "@/lib/utils";
import { CancelReservationButton } from "./cancel-reservation-button";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations({ locale, namespace: "phase2.reservation" });
  return buildManagedMetadata({ title: t("dashboardTitle"), description: t("description"), path: "/kabinet/rezervasiyalar", noIndex: true, locale });
}

const STATUS_TONES = {
  REQUESTED: "gold",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
  COMPLETED: "success",
} as const;

const STATUS_KEYS: Record<ReservationStatus, "requested" | "pending" | "approved" | "rejected" | "cancelled" | "expired" | "completed"> = {
  REQUESTED: "requested",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  COMPLETED: "completed",
};

export default async function ReservationsPage() {
  const locale = await getLocale() as Locale;
  const user = await requireAccount(locale);
  const t = await getTranslations("phase2.reservation");
  const reservations = await prisma.reservation.findMany({
    where: { userId: user.id },
    include: {
      property: { select: { title: true, slug: true, currency: true, price: true } },
      agent: { select: { name: true, slug: true } },
      events: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-w-0">
      <PageHeader contained compact eyebrow={t("title")} title={t("dashboardTitle")} description={t("description")} />
      <div className="mt-8">
        {reservations.length === 0 ? (
          <EmptyState title={t("empty")} action={{ label: t("title"), href: "/emlaklar" }} />
        ) : (
          <ul className="space-y-3">
            {reservations.map((reservation) => {
              const status = reservation.status as ReservationStatus;
              const cancellable = status === RESERVATION_STATUSES.REQUESTED || status === RESERVATION_STATUSES.PENDING;
              return (
                <li key={reservation.id} className="rounded-md border border-line bg-paper p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Link href={`/emlaklar/${reservation.property.slug}`} className="font-display text-lg text-ink hover:text-gold-deep">
                        {reservation.property.title}
                      </Link>
                      <p className="mt-2 text-sm text-ink-soft">{formatDateTime(reservation.requestedFor)}</p>
                      {reservation.agent ? (
                        <Link href={`/agentler/${reservation.agent.slug}`} className="mt-1 inline-block text-sm text-ink-muted hover:text-gold-deep">
                          {reservation.agent.name}
                        </Link>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge tone={STATUS_TONES[status]}>{t(`status.${STATUS_KEYS[status]}`)}</Badge>
                      {cancellable ? <CancelReservationButton id={reservation.id} /> : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
