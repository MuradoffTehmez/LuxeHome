"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { failure, success, type ActionState } from "@/lib/admin/action-state";
import type { Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
import { createTelegramLink, unlinkTelegram } from "@/lib/telegram-notifications";

const LIST_PATH = "/kabinet/bildirisler";

export type TelegramLinkState = ActionState & { link?: string };

/** Bot bağlama linki — birdəfəlik, 15 dəqiqəlik token (`telegram-link-policy.ts`). */
export async function startTelegramLink(): Promise<TelegramLinkState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "account.notifications.telegram" });
  let user;
  try {
    user = await requirePublicAction("preferences", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    const link = await createTelegramLink(user.id);
    if (!link) return failure(t("unavailable"));
    return { ...success(t("linkReady")), link };
  } catch (error) {
    console.error("[telegram] link yaradılmadı:", error);
    return failure(t("failed"));
  }
}

export async function disconnectTelegram(): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "account.notifications.telegram" });
  let user;
  try {
    user = await requirePublicAction("preferences", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    await unlinkTelegram(user.id);
    revalidatePath(localizePath(LIST_PATH, locale));
    return success(t("disconnected"));
  } catch (error) {
    console.error("[telegram] ayrılmadı:", error);
    return failure(t("failed"));
  }
}
