"use server";

import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { NOTIFICATION_TYPES, RESERVATION_STATUSES, type Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function cancelReservation(id: string): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  let user;
  try {
    user = await requirePublicAction("reservation", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const reservation = await prisma.reservation.findFirst({
      where: {
        id,
        userId: user.id,
        status: { in: [RESERVATION_STATUSES.REQUESTED, RESERVATION_STATUSES.PENDING] },
      },
      select: {
        id: true,
        property: { select: { title: true } },
        agent: { select: { userId: true } },
      },
    });
    if (!reservation) return failure("Rezervasiya tapılmadı və ya artıq ləğv edilə bilməz.");

    await prisma.reservation.update({
      where: { id },
      data: { status: RESERVATION_STATUSES.CANCELLED },
    });
    await prisma.reservationEvent.create({
      data: {
        reservationId: id,
        status: RESERVATION_STATUSES.CANCELLED,
        changedById: user.id,
        source: "USER",
      },
    });

    if (reservation.agent?.userId) {
      await prisma.notification.create({
        data: {
          userId: reservation.agent.userId,
          type: NOTIFICATION_TYPES.RESERVATION_STATUS,
          title: "Rezervasiya ləğv edildi",
          content: reservation.property.title,
          actionUrl: "/admin/rezervasiyalar",
          dedupeKey: `reservation-cancelled:${id}`,
        },
      });
    }

    revalidatePath("/kabinet/rezervasiyalar");
    revalidatePath("/admin/rezervasiyalar");
    return success("Rezervasiya sorğusu ləğv edildi.");
  } catch (error) {
    return unexpected("rezervasiya ləğv edilmədi", error);
  }
}
