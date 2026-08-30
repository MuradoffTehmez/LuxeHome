"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/admin/audit";
import { failure, invalid, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { recordDomainEvent } from "@/lib/admin/events";
import {
  NOTIFICATION_TYPES,
  PERMISSIONS,
  RESERVATION_STATUSES,
  RESERVATION_STATUS_LABELS,
  type ReservationStatus,
} from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

const allowedStatuses = Object.values(RESERVATION_STATUSES);
const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(allowedStatuses),
  note: z.string().trim().max(500).optional(),
});

export async function updateReservationStatus(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.LEAD_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: parsed.data.id },
      select: {
        status: true,
        userId: true,
        email: true,
        user: {
          select: {
            notificationPreference: {
              select: { reservationEmail: true, reservationWeb: true, reservationPush: true },
            },
          },
        },
        property: { select: { title: true } },
      },
    });
    if (!reservation) return failure("Rezervasiya tapılmadı.");
    if (reservation.status === parsed.data.status) return success("Status artıq seçilən dəyərdədir.");

    const nextStatus = parsed.data.status as ReservationStatus;
    await prisma.reservation.update({
      where: { id: parsed.data.id },
      data: { status: nextStatus },
    });
    await prisma.reservationEvent.create({
      data: {
        reservationId: parsed.data.id,
        status: nextStatus,
        note: parsed.data.note || null,
        changedById: actor.id,
        source: "ADMIN",
      },
    });
    await recordDomainEvent("reservation.status_changed", "Reservation", parsed.data.id, {
      oldStatus: reservation.status,
      status: nextStatus,
    });
    await recordAudit(actor, "STATUS_CHANGE", "Reservation", parsed.data.id, `${reservation.property.title} — ${RESERVATION_STATUS_LABELS[nextStatus]}`);

    const title = `Rezervasiya: ${RESERVATION_STATUS_LABELS[nextStatus]}`;
    // Kanal seçimləri (PRD bölmə 57) — sətir yoxdursa sxem defoltları qüvvədədir.
    const preference = reservation.user.notificationPreference;
    if (preference?.reservationWeb ?? true) {
      await prisma.notification.create({
        data: {
          userId: reservation.userId,
          type: NOTIFICATION_TYPES.RESERVATION_STATUS,
          title,
          content: reservation.property.title,
          actionUrl: "/kabinet/rezervasiyalar",
          dedupeKey: `reservation-status:${parsed.data.id}:${nextStatus}`,
        },
      });
    }
    if (preference?.reservationEmail ?? true) {
      await sendEmail({
        to: reservation.email,
        subject: `${reservation.property.title} — ${RESERVATION_STATUS_LABELS[nextStatus]}`,
        html: `<p>${title}</p><p>${reservation.property.title}</p>${parsed.data.note ? `<p>${parsed.data.note}</p>` : ""}`,
      });
    }
    if (preference?.reservationPush) {
      await sendPushToUser(reservation.userId, { title, body: reservation.property.title, url: "/kabinet/rezervasiyalar", tag: `reservation-${parsed.data.id}` });
    }

    revalidatePath("/admin/rezervasiyalar");
    revalidatePath("/kabinet/rezervasiyalar");
    return success("Rezervasiya statusu yeniləndi.");
  } catch (error) {
    return unexpected("rezervasiya statusu yenilənmədi", error);
  }
}
