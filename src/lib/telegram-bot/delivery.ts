import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/media/upload-record";
import { siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import type { NotificationType } from "@/lib/constants";
import { channelsForType, isCriticalNotificationType, parseCategoryChannels } from "@/lib/notification-categories";
import { isWithinQuietHours } from "@/lib/notification-preferences";
import { isTelegramBotConfigured, sendBotMessage, type FetchLike, type InlineKeyboard } from "./api";
import { BOT_COPY, botLocale } from "./copy";
import {
  DELIVERY_AUDIENCES,
  DELIVERY_RETENTION_DAYS,
  DELIVERY_STATUSES,
  classifyDelivery,
  escapeTelegramHtml,
  splitMessage,
  truncateText,
  type DeliveryAudience,
} from "./policy";

/**
 * Telegram çatdırılması: hər göndəriş `TelegramDelivery` sətridir (status, cəhd sayı, növbəti cəhd). Keçici xəta (429, 5xx,
 * şəbəkə) sətri `PENDING` saxlayır və 10 dəqiqəlik cron (`retryTelegramDeliveries`) onu yenidən göndərir; 403/«chat not
 * found» hədəfi bağlayır — istifadəçi botu bloklayıbsa `TelegramAccount.blockedAt` yazılır və göndəriş dayanır.
 *
 * Mətn yalnız göndərilməyi gözləyən sətirdə saxlanılır: göndəriləndən və ya qəti uğursuzluqdan sonra `text`/`buttons`
 * silinir — jurnal statistika üçün qalır, məzmun yox. Heç bir funksiya atmır.
 */

export type DeliveryInput = {
  audience: DeliveryAudience;
  chatId: string;
  kind: string;
  html: string;
  buttons?: InlineKeyboard;
  silent?: boolean;
  userId?: string | null;
  /** Eyni hadisənin iki dəfə göndərilməsinin qarşısını alır. */
  dedupeKey?: string | null;
};

/** `skipped` — hədəf uyğun deyil (bağlı hesab, razılıq və ya kateqoriya yoxdur); heç nə yazılmayıb. */
export type DeliveryResult = "sent" | "queued" | "duplicate" | "blocked" | "failed" | "skipped" | "not-configured";

type DeliveryRow = { id: string; audience: string; chatId: string; userId: string | null; text: string | null; buttons: string | null; silent: boolean; attempts: number };

async function sendParts(row: DeliveryRow, fetcher?: FetchLike) {
  const buttons = row.buttons ? (JSON.parse(row.buttons) as InlineKeyboard) : undefined;
  const parts = splitMessage(row.text ?? "");
  let last: Awaited<ReturnType<typeof sendBotMessage>> = { ok: false, code: 400, description: "empty" };
  for (const [index, part] of parts.entries()) {
    last = await sendBotMessage({ chatId: row.chatId, html: part, silent: row.silent, buttons: index === parts.length - 1 ? buttons : undefined }, { fetcher });
    if (!last.ok) break;
  }
  return last;
}

/** Hədəf göndərişi qəti rədd etdi — istifadəçi botu bloklayıb və ya çat yoxdur. */
async function markTargetBlocked(row: DeliveryRow, now: Date) {
  if (row.audience === DELIVERY_AUDIENCES.USER || row.audience === DELIVERY_AUDIENCES.SUPPORT) {
    await prisma.telegramAccount.updateMany({ where: { chatId: row.chatId }, data: { blockedAt: now, botAccess: false, lastDeliveryStatus: "BLOCKED" } }).catch(() => undefined);
  }
  await prisma.telegramChat.updateMany({ where: { chatId: row.chatId }, data: { canPost: false, lastError: "blocked" } }).catch(() => undefined);
}

async function attempt(row: DeliveryRow, now: Date, fetcher?: FetchLike): Promise<DeliveryResult> {
  const attemptNo = row.attempts + 1;
  const outcome = classifyDelivery(await sendParts(row, fetcher), attemptNo, now);
  const base = { attempts: attemptNo };
  switch (outcome.kind) {
    case "sent":
      await prisma.telegramDelivery.update({ where: { id: row.id }, data: { ...base, status: DELIVERY_STATUSES.SENT, sentAt: now, text: null, buttons: null, nextAttemptAt: null, lastError: null } });
      if (row.userId) await prisma.telegramAccount.updateMany({ where: { userId: row.userId }, data: { lastDeliveryAt: now, lastDeliveryStatus: DELIVERY_STATUSES.SENT } }).catch(() => undefined);
      return "sent";
    case "retry":
      await prisma.telegramDelivery.update({ where: { id: row.id }, data: { ...base, nextAttemptAt: outcome.retryAt, lastError: outcome.error } });
      return "queued";
    case "blocked":
      await prisma.telegramDelivery.update({ where: { id: row.id }, data: { ...base, status: DELIVERY_STATUSES.FAILED, text: null, buttons: null, nextAttemptAt: null, lastError: outcome.error } });
      await markTargetBlocked(row, now);
      return "blocked";
    case "failed":
      await prisma.telegramDelivery.update({ where: { id: row.id }, data: { ...base, status: DELIVERY_STATUSES.FAILED, text: null, buttons: null, nextAttemptAt: null, lastError: outcome.error } });
      if (row.userId) await prisma.telegramAccount.updateMany({ where: { userId: row.userId }, data: { lastDeliveryAt: now, lastDeliveryStatus: DELIVERY_STATUSES.FAILED } }).catch(() => undefined);
      return "failed";
  }
}

/** Göndərişi jurnala yazır və dərhal cəhd edir. */
export async function deliverTelegram(input: DeliveryInput, options: { now?: Date; fetcher?: FetchLike } = {}): Promise<DeliveryResult> {
  if (!isTelegramBotConfigured()) return "not-configured";
  const now = options.now ?? new Date();
  try {
    let row: DeliveryRow;
    try {
      row = await prisma.telegramDelivery.create({
        data: {
          audience: input.audience,
          chatId: input.chatId,
          kind: input.kind,
          userId: input.userId ?? null,
          dedupeKey: input.dedupeKey ?? null,
          text: input.html,
          buttons: input.buttons?.length ? JSON.stringify(input.buttons) : null,
          silent: input.silent ?? false,
          nextAttemptAt: now,
        },
        select: { id: true, audience: true, chatId: true, userId: true, text: true, buttons: true, silent: true, attempts: true },
      });
    } catch (error) {
      if (isUniqueViolation(error)) return "duplicate";
      throw error;
    }
    return await attempt(row, now, options.fetcher);
  } catch (error) {
    console.error("[telegram] çatdırılma yazılmadı:", error instanceof Error ? error.name : "unknown");
    return "failed";
  }
}

/** Cron: vaxtı çatmış `PENDING` göndərişləri yenidən cəhd edir (çağırış başına ən çox `limit`). */
export async function retryTelegramDeliveries(now: Date = new Date(), limit = 25, fetcher?: FetchLike): Promise<{ retried: number; sent: number }> {
  if (!isTelegramBotConfigured()) return { retried: 0, sent: 0 };
  const rows = await prisma.telegramDelivery.findMany({
    where: { status: DELIVERY_STATUSES.PENDING, nextAttemptAt: { lte: now } },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
    select: { id: true, audience: true, chatId: true, userId: true, text: true, buttons: true, silent: true, attempts: true },
  });
  let sent = 0;
  for (const row of rows) {
    // Eyni sətri paralel cron götürməsin: növbəti cəhd vaxtını şərti olaraq irəli çəkirik.
    const claimed = await prisma.telegramDelivery.updateMany({
      where: { id: row.id, status: DELIVERY_STATUSES.PENDING, attempts: row.attempts },
      data: { nextAttemptAt: new Date(now.getTime() + 5 * 60 * 1000) },
    });
    if (claimed.count !== 1) continue;
    if ((await attempt(row, now, fetcher)) === "sent") sent += 1;
  }
  return { retried: rows.length, sent };
}

/** Baxım: köhnə jurnal sətirləri silinir (göndərilməmiş `PENDING` toxunulmur). */
export async function purgeTelegramDeliveries(now: Date = new Date()): Promise<number> {
  const before = new Date(now.getTime() - DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.telegramDelivery.deleteMany({ where: { createdAt: { lt: before }, status: { not: DELIVERY_STATUSES.PENDING } } });
  return result.count;
}

/** İstifadəçiyə yazmaq mümkündürmü: bağlı hesab, bot icazəsi, açıq razılıq, bloklanmayıb. */
export async function telegramTargetFor(userId: string): Promise<{ chatId: string } | null> {
  const account = await prisma.telegramAccount.findUnique({
    where: { userId },
    select: { chatId: true, botAccess: true, notificationsEnabled: true, blockedAt: true },
  });
  if (!account?.chatId || !account.botAccess || !account.notificationsEnabled || account.blockedAt) return null;
  return { chatId: account.chatId };
}

export type TelegramNotice = {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  /** Saytdaxili yol (`/kabinet/...`) — istifadəçinin dilində linkə çevrilir. */
  path?: string | null;
  dedupeKey: string;
};

/** Bildiriş mesajı — başlıq qalın, mətn kodlanmış, «Bax» və «Bildiriş ayarları» düymələri. */
export function formatNoticeMessage(input: { title: string; content: string; url?: string | null; settingsUrl: string; locale: string }): { html: string; buttons: InlineKeyboard } {
  const copy = BOT_COPY[botLocale(input.locale)];
  const html = `<b>${escapeTelegramHtml(truncateText(input.title, 200))}</b>\n\n${escapeTelegramHtml(truncateText(input.content, 1500))}`;
  const row = [...(input.url ? [{ text: copy.notificationOpen, url: input.url }] : []), { text: copy.notificationSettings, url: input.settingsUrl }];
  return { html, buttons: [row] };
}

/**
 * Hesab bildirişinin Telegram nüsxəsi. Kateqoriya seçiminə (`categoryChannels.telegram`) və hesab razılığına tabedir;
 * sakit saatlarda mesaj **səssiz** gedir (Telegram `disable_notification`) — gecikdirilmir ki, köhnəlməsin.
 * Kritik təhlükəsizlik bildirişi həm kateqoriyadan, həm sakit saatdan azaddır, amma razılıq yenə şərtdir.
 */
export async function notifyTelegramUser(notice: TelegramNotice, options: { now?: Date; fetcher?: FetchLike } = {}): Promise<DeliveryResult> {
  try {
    if (!isTelegramBotConfigured()) return "not-configured";
    const target = await telegramTargetFor(notice.userId);
    if (!target) return "skipped";
    const [user, preference] = await Promise.all([
      prisma.user.findUnique({ where: { id: notice.userId }, select: { locale: true, isActive: true } }),
      prisma.notificationPreference.findUnique({ where: { userId: notice.userId }, select: { categoryChannels: true, quietHoursStart: true, quietHoursEnd: true } }),
    ]);
    if (!user?.isActive) return "skipped";
    const critical = isCriticalNotificationType(notice.type);
    if (!critical && !channelsForType(notice.type, parseCategoryChannels(preference?.categoryChannels)).telegram) return "skipped";
    const now = options.now ?? new Date();
    const silent = !critical && isWithinQuietHours(preference?.quietHoursStart ?? null, preference?.quietHoursEnd ?? null, now);
    const locale = botLocale(user.locale);
    const { html, buttons } = formatNoticeMessage({
      title: notice.title,
      content: notice.content,
      url: notice.path ? siteUrl(localizePath(notice.path, locale)) : null,
      settingsUrl: siteUrl(localizePath("/kabinet/bildirisler", locale)),
      locale,
    });
    return await deliverTelegram(
      { audience: DELIVERY_AUDIENCES.USER, chatId: target.chatId, kind: notice.type, html, buttons, silent, userId: notice.userId, dedupeKey: `notice:${notice.dedupeKey}` },
      { now, fetcher: options.fetcher },
    );
  } catch (error) {
    console.error("[telegram] istifadəçi bildirişi alınmadı:", error instanceof Error ? error.name : "unknown");
    return "failed";
  }
}
