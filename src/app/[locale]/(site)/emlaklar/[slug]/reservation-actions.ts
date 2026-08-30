"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TYPES, RESERVATION_STATUSES, type Locale } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import { sendPushToUser } from "@/lib/push";

const reservationSchema = z.object({
  propertyId: z.string().min(1),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  email: z.email().max(200),
  requestedFor: z.coerce.date().refine((value) => value.getTime() > Date.now(), "Tarix gələcəkdə olmalıdır"),
  message: z.string().trim().max(1000).optional(),
  terms: z.literal("on"),
});

export async function createReservation(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("phase2.reservation");
  let user;
  try {
    user = await requirePublicAction("reservation", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = reservationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(t("description"));

  try {
    const property = await prisma.property.findFirst({
      where: {
        id: parsed.data.propertyId,
        reservationEnabled: true,
        deletedAt: null,
        status: "PUBLISHED",
        isDemo: false,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        assignedAgentId: true,
        assignedAgent: {
          select: {
            userId: true,
            user: {
              select: {
                notificationPreference: {
                  select: { reservationWeb: true, reservationPush: true },
                },
              },
            },
          },
        },
      },
    });
    if (!property) return failure(t("disabled"));

    const duplicate = await prisma.reservation.findFirst({
      where: {
        propertyId: property.id,
        userId: user.id,
        status: { in: [RESERVATION_STATUSES.REQUESTED, RESERVATION_STATUSES.PENDING, RESERVATION_STATUSES.APPROVED] },
      },
      select: { id: true },
    });
    if (duplicate) return failure(t("success"));

    const reservation = await prisma.reservation.create({
      data: {
        propertyId: property.id,
        userId: user.id,
        agentId: property.assignedAgentId,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        requestedFor: parsed.data.requestedFor,
        message: parsed.data.message || null,
        termsAcceptedAt: new Date(),
        expiresAt: new Date(parsed.data.requestedFor.getTime() + 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    });

    await prisma.reservationEvent.create({
      data: {
        reservationId: reservation.id,
        status: RESERVATION_STATUSES.REQUESTED,
        changedById: user.id,
        source: "USER",
      },
    });
    await prisma.domainEvent.create({
      data: {
        type: "reservation.requested",
        entityType: "Reservation",
        entityId: reservation.id,
        payload: JSON.stringify({ propertyId: property.id, userId: user.id }),
      },
    });

    if (property.assignedAgent?.userId) {
      const agentPreference = property.assignedAgent.user?.notificationPreference;
      if (agentPreference?.reservationWeb ?? true) {
        await prisma.notification.create({
          data: {
            userId: property.assignedAgent.userId,
            type: NOTIFICATION_TYPES.RESERVATION_STATUS,
            title: "Yeni rezervasiya sorğusu",
            content: property.title,
            actionUrl: "/admin/rezervasiyalar",
            dedupeKey: `reservation-requested:${reservation.id}`,
          },
        });
      }
      if (agentPreference?.reservationPush) {
        await sendPushToUser(property.assignedAgent.userId, { title: "Yeni rezervasiya sorğusu", body: property.title, url: "/admin/rezervasiyalar", tag: `reservation-${reservation.id}` });
      }
    }

    const requesterPreference = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
      select: { reservationEmail: true },
    });
    if (requesterPreference?.reservationEmail ?? true) {
      const propertyUrl = siteUrl(localizePath(`/emlaklar/${property.slug}`, locale));
      await sendEmail({
        to: user.email,
        subject: `${property.title} — ${t("success")}`,
        html: `<p>${t("success")}</p><p><a href="${propertyUrl}">${property.title}</a></p>`,
      });
    }
    return success(t("success"));
  } catch (error) {
    return unexpected("rezervasiya yaradıla bilmədi", error, t("description"));
  }
}
