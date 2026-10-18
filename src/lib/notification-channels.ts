import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/lib/constants";
import { channelsForType, parseCategoryChannels, type NotificationChannel } from "@/lib/notification-categories";

/**
 * Bildiriş mərkəzinin kanal seçimi (#252) — `notifyAccount`-dan kənar yazan köhnə axınlar (qiymət endirimi,
 * elan müddəti, paket, saxlanmış axtarış) da bunu yoxlayır ki, söndürülmüş kateqoriya heç bir yoldan gəlməsin.
 * Oxuma xətası seçimi «açıq» sayır — bildiriş səssizcə itməsin.
 */
export async function categoryChannelsFor(userId: string, type: NotificationType): Promise<Record<NotificationChannel, boolean>> {
  const row = await prisma.notificationPreference.findUnique({ where: { userId }, select: { categoryChannels: true } }).catch(() => null);
  return channelsForType(type, parseCategoryChannels(row?.categoryChannels));
}

/** Yalnız e-poçt ünvanı məlum olan göndərişlər üçün (saxlanmış axtarış məktubları). */
export async function categoryChannelsForEmail(email: string, type: NotificationType): Promise<Record<NotificationChannel, boolean>> {
  const user = await prisma.user.findFirst({ where: { email }, select: { notificationPreference: { select: { categoryChannels: true } } } }).catch(() => null);
  return channelsForType(type, parseCategoryChannels(user?.notificationPreference?.categoryChannels));
}
