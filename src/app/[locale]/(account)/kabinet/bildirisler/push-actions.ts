"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import type { Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type BrowserSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function savePushSubscription(subscription: BrowserSubscription): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account.notifications.push");
  let user;
  try { user = await requirePublicAction("push", locale); }
  catch (error) { if (error instanceof AdminGuardError) return failure(error.message); throw error; }
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) return failure(t("incomplete"));
  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: { userId: user.id, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, locale },
      update: { userId: user.id, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, locale },
    });
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, savedSearchPush: true, priceDropPush: true, reservationPush: true },
      update: { savedSearchPush: true, priceDropPush: true, reservationPush: true },
    });
    return success(t("enabled"));
  } catch (error) { return unexpected("push abunəliyi saxlanılmadı", error, t("failed")); }
}

export async function removePushSubscription(endpoint: string): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account.notifications.push");
  let user;
  try { user = await requirePublicAction("push", locale); }
  catch (error) { if (error instanceof AdminGuardError) return failure(error.message); throw error; }
  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, savedSearchPush: false, priceDropPush: false, reservationPush: false },
      update: { savedSearchPush: false, priceDropPush: false, reservationPush: false },
    });
    return success(t("disabled"));
  } catch (error) { return unexpected("push abunəliyi silinmədi", error, t("failed")); }
}
