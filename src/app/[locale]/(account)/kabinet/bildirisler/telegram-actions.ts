"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import type { Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
import { checkTelegramAccountLimit } from "@/lib/auth/rate-limit";
import { isTelegramBotConfigured } from "@/lib/telegram-bot/api";
import { BOT_COPY, botLocale } from "@/lib/telegram-bot/copy";
import { formatNoticeMessage, deliverTelegram, telegramTargetFor } from "@/lib/telegram-bot/delivery";
import { createLinkToken, setTelegramNotifications, unlinkTelegram } from "@/lib/telegram-bot/linking";
import { DELIVERY_AUDIENCES } from "@/lib/telegram-bot/policy";
import { siteUrl } from "@/config/site";

/**
 * Kabinetin Telegram bölməsi. Hər action guard-ı ilk sətirdə çağırır (server action layout-dan keçmir) və yalnız
 * sessiya sahibinin öz hesabına təsir edir. Bağlama tokeni URL-də yalnız deep-link kimi istifadəçinin öz brauzerinə qayıdır.
 */

const PATH = "/kabinet/bildirisler";

export type TelegramLinkState = ActionState & { url?: string };

async function account(locale: Locale) {
  try {
    return await requirePublicAction("preferences", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return error;
    throw error;
  }
}

export async function startTelegramLink(): Promise<TelegramLinkState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account.notifications.telegram");
  const user = await account(locale);
  if (user instanceof AdminGuardError) return failure(user.message);
  if (!isTelegramBotConfigured()) return failure(t("unavailable"));
  if (!(await checkTelegramAccountLimit(user.id))) return failure(t("rateLimited"));
  try {
    return { status: "success", url: await createLinkToken(user.id) };
  } catch (error) {
    return unexpected("telegram bağlama linki yaradılmadı", error, t("failed"));
  }
}

export async function unlinkTelegramAccount(): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account.notifications.telegram");
  const user = await account(locale);
  if (user instanceof AdminGuardError) return failure(user.message);
  try {
    await unlinkTelegram(user.id);
  } catch (error) {
    return unexpected("telegram ayrılmadı", error, t("failed"));
  }
  revalidatePath(localizePath(PATH, locale));
  return success(t("unlinked"));
}

export async function toggleTelegramNotifications(enabled: boolean): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account.notifications.telegram");
  const user = await account(locale);
  if (user instanceof AdminGuardError) return failure(user.message);
  try {
    if (!(await setTelegramNotifications(user.id, enabled === true))) return failure(t("notLinked"));
  } catch (error) {
    return unexpected("telegram razılığı saxlanılmadı", error, t("failed"));
  }
  revalidatePath(localizePath(PATH, locale));
  return success(enabled ? t("enabled") : t("disabled"));
}

export async function sendTelegramTest(): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account.notifications.telegram");
  const user = await account(locale);
  if (user instanceof AdminGuardError) return failure(user.message);
  if (!(await checkTelegramAccountLimit(user.id))) return failure(t("rateLimited"));
  const target = await telegramTargetFor(user.id);
  if (!target) return failure(t("testUnavailable"));
  const copy = BOT_COPY[botLocale(locale)];
  const message = formatNoticeMessage({ title: copy.testTitle, content: copy.testBody, settingsUrl: siteUrl(localizePath(PATH, locale)), locale });
  const result = await deliverTelegram({
    audience: DELIVERY_AUDIENCES.USER,
    chatId: target.chatId,
    kind: "TEST",
    html: message.html,
    buttons: message.buttons,
    userId: user.id,
  });
  revalidatePath(localizePath(PATH, locale));
  if (result === "sent") return success(t("testSent"));
  if (result === "queued") return success(t("testQueued"));
  return failure(result === "blocked" ? t("blocked") : t("testFailed"));
}
