"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAccount } from "@/lib/auth/guard";
import type { Locale } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { localizePath } from "@/i18n/path-locale";

const LIST_PATH = "/kabinet/bildirisler";

export async function markNotificationRead(id: string): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  const user = await requireAccount(locale);

  try {
    const existing = await prisma.notification.findFirst({ where: { id, userId: user.id }, select: { id: true } });
    if (!existing) return failure(t("notifications.notFound"));

    await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    revalidatePath(localizePath(LIST_PATH, locale));
    return success(t("notifications.markedRead"));
  } catch (error) {
    return unexpected("bildiriş oxunmuş işarələnmədi", error, t("actions.unexpected"));
  }
}

export async function markAllNotificationsRead(): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  const user = await requireAccount(locale);

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath(localizePath(LIST_PATH, locale));
    return success(t("notifications.allMarkedRead"));
  } catch (error) {
    return unexpected("bildirişlər oxunmuş işarələnmədi", error, t("actions.unexpected"));
  }
}

export async function deleteNotification(id: string): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  const user = await requireAccount(locale);

  try {
    const existing = await prisma.notification.findFirst({ where: { id, userId: user.id }, select: { id: true } });
    if (!existing) return failure(t("notifications.notFound"));

    await prisma.notification.delete({ where: { id } });
    revalidatePath(localizePath(LIST_PATH, locale));
    return success(t("notifications.deleted"));
  } catch (error) {
    return unexpected("bildiriş silinmədi", error, t("actions.unexpected"));
  }
}
