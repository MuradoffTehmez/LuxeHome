import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import type { Locale } from "@/lib/constants";
import { answerCallbackQuery, sendBotMessage, type InlineKeyboard } from "./api";
import { BOT_COPY, LANGUAGE_LABELS, botLocale } from "./copy";
import { migrateChat, privateChatState, recordChatMembership, savePrivateChat } from "./chats";
import { consumeLinkToken, setTelegramNotifications, telegramBotUsername } from "./linking";
import { acceptSupportMessage } from "./support";
import { SUPPORT_AWAIT_MS, SUPPORT_MESSAGE_MAX, escapeTelegramHtml, linkTokenFromPayload, parseCommand, parseStartPayload } from "./policy";
import type { TelegramMessage, TelegramUpdate, TelegramUser } from "./updates";

/**
 * Bot komandaları və callback düymələri. Webhook marşrutu secret, ölçü, sxem, idempotentlik və sürət limitini yoxlayandan
 * sonra `handleTelegramUpdate()`-i çağırır. Cavablar birbaşa `sendMessage` ilədir (jurnalsız) — istifadəçinin öz
 * sorğusuna cavabdır, təkrar cəhd növbəsinə ehtiyac yoxdur. Hesab məlumatı yalnız şəxsi çatda göstərilir.
 */

export const BOT_COMMAND_NAMES = ["start", "help", "settings", "notifications", "stop", "support", "account", "language"] as const;
type BotCommand = (typeof BOT_COMMAND_NAMES)[number];

type Context = { chatId: string; isPrivate: boolean; from: TelegramUser | undefined; locale: Locale; now: Date };

const LOCALES: Locale[] = ["az", "en", "ru"];

function siteLink(path: string, locale: Locale): string {
  return siteUrl(localizePath(path, locale));
}

async function reply(ctx: Context, html: string, buttons?: InlineKeyboard) {
  await sendBotMessage({ chatId: ctx.chatId, html, buttons });
}

async function linkedAccount(telegramUserId: string) {
  return prisma.telegramAccount.findUnique({
    where: { telegramUserId },
    select: { userId: true, notificationsEnabled: true, blockedAt: true, chatId: true, user: { select: { name: true, locale: true, isActive: true } } },
  });
}

async function resolveLocale(chatId: string, from: TelegramUser | undefined, isPrivate: boolean): Promise<Locale> {
  if (!isPrivate) return botLocale(from?.language_code);
  const [chat, account] = await Promise.all([
    privateChatState(chatId),
    from ? prisma.telegramAccount.findUnique({ where: { telegramUserId: String(from.id) }, select: { user: { select: { locale: true } } } }) : null,
  ]);
  return botLocale(chat?.locale ?? account?.user.locale ?? from?.language_code);
}

function mainMenu(locale: Locale): InlineKeyboard {
  const copy = BOT_COPY[locale];
  return [
    [{ text: copy.menuNotifications, callback_data: "menu:notifications" }, { text: copy.menuAccount, callback_data: "menu:account" }],
    [{ text: copy.menuSupport, callback_data: "menu:support" }, { text: copy.menuLanguage, callback_data: "menu:language" }],
    [{ text: copy.menuSettings, url: siteLink("/kabinet/bildirisler", locale) }, { text: copy.menuSite, url: siteLink("/", locale) }],
  ];
}

function notificationToggle(locale: Locale, enabled: boolean): InlineKeyboard {
  const copy = BOT_COPY[locale];
  return [[enabled ? { text: copy.disableNotifications, callback_data: "notif:off" } : { text: copy.enableNotifications, callback_data: "notif:on" }]];
}

async function handleLink(ctx: Context, token: string) {
  const copy = BOT_COPY[ctx.locale];
  if (!ctx.isPrivate || !ctx.from) return reply(ctx, copy.linkPrivateOnly);
  const result = await consumeLinkToken(token, { id: String(ctx.from.id), username: ctx.from.username ?? null, firstName: ctx.from.first_name ?? null }, ctx.chatId, ctx.now);
  if (!result.ok) {
    return reply(ctx, result.reason === "taken" ? copy.linkTaken : result.reason === "failed" ? copy.linkFailed : copy.linkExpired);
  }
  // Uğurlu bağlamada istifadəçinin hesab dili çatın dilinə çevrilir.
  const account = await linkedAccount(String(ctx.from.id));
  const locale = botLocale(account?.user.locale ?? ctx.locale);
  await reply({ ...ctx, locale }, BOT_COPY[locale].linkSuccess(escapeTelegramHtml(result.userName)), notificationToggle(locale, account?.notificationsEnabled ?? false));
}

async function runCommand(command: BotCommand, ctx: Context, message?: TelegramMessage) {
  const copy = BOT_COPY[ctx.locale];
  if (!ctx.isPrivate && command !== "help") return reply(ctx, copy.groupOnly);
  const telegramUserId = ctx.from ? String(ctx.from.id) : null;

  switch (command) {
    case "start": {
      const token = linkTokenFromPayload(message?.text ? parseStartPayload(message.text) : null);
      // `/start` dəstək gözləməsini də ləğv edir.
      await savePrivateChat(ctx.chatId, { supportAwaitUntil: null });
      if (telegramUserId) await prisma.telegramAccount.updateMany({ where: { telegramUserId, blockedAt: { not: null } }, data: { blockedAt: null, botAccess: true, chatId: ctx.chatId } });
      if (token) return handleLink(ctx, token);
      const name = escapeTelegramHtml(ctx.from?.first_name ?? "");
      return reply(ctx, `<b>${copy.welcome(name)}</b>\n\n${copy.welcomeBody}`, mainMenu(ctx.locale));
    }
    case "help":
      return reply(ctx, copy.help);
    case "settings":
      return reply(ctx, copy.settings, [[{ text: copy.openCabinet, url: siteLink("/kabinet/bildirisler", ctx.locale) }]]);
    case "account":
    case "notifications": {
      const account = telegramUserId ? await linkedAccount(telegramUserId) : null;
      if (!account || !account.user.isActive) {
        return reply(ctx, copy.notLinked, [[{ text: copy.linkAction, url: siteLink("/kabinet/bildirisler", ctx.locale) }]]);
      }
      if (command === "account") {
        return reply(ctx, `${copy.linkedAs(escapeTelegramHtml(account.user.name))}\n${copy.accountStatus(account.notificationsEnabled)}`, notificationToggle(ctx.locale, account.notificationsEnabled));
      }
      return reply(ctx, account.notificationsEnabled ? copy.notificationsOn : copy.notificationsOff, [
        ...notificationToggle(ctx.locale, account.notificationsEnabled),
        [{ text: copy.menuSettings, url: siteLink("/kabinet/bildirisler", ctx.locale) }],
      ]);
    }
    case "stop": {
      const account = telegramUserId ? await linkedAccount(telegramUserId) : null;
      if (!account) return reply(ctx, copy.stopNotLinked);
      await setTelegramNotifications(account.userId, false);
      return reply(ctx, copy.stopDone);
    }
    case "support":
      await savePrivateChat(ctx.chatId, { supportAwaitUntil: new Date(ctx.now.getTime() + SUPPORT_AWAIT_MS) });
      return reply(ctx, copy.supportPrompt);
    case "language":
      return reply(ctx, copy.languagePrompt, [LOCALES.map((locale) => ({ text: LANGUAGE_LABELS[locale], callback_data: `lang:${locale}` }))]);
  }
}

async function handleMessage(message: TelegramMessage, now: Date) {
  const chatId = String(message.chat.id);
  if (message.migrate_to_chat_id) return migrateChat(chatId, String(message.migrate_to_chat_id));
  if (message.from?.is_bot) return;
  const isPrivate = message.chat.type === "private";
  const text = message.text?.trim();
  const command = text ? parseCommand(text, telegramBotUsername()) : null;
  // Qrupda yalnız bota ünvanlanmış komandaya cavab verilir (Privacy Mode açıq qalır).
  if (!isPrivate && !command) return;
  const ctx: Context = { chatId, isPrivate, from: message.from, locale: await resolveLocale(chatId, message.from, isPrivate), now };
  if (command) {
    if ((BOT_COMMAND_NAMES as readonly string[]).includes(command)) return runCommand(command as BotCommand, ctx, message);
    return reply(ctx, BOT_COPY[ctx.locale].unknown);
  }

  const copy = BOT_COPY[ctx.locale];
  const state = await privateChatState(chatId);
  if (!state?.supportAwaitUntil || state.supportAwaitUntil <= now) return reply(ctx, copy.unknown, mainMenu(ctx.locale));
  if (!text) return reply(ctx, copy.supportTextOnly);
  const result = await acceptSupportMessage({ chatId, telegramUserId: String(message.from?.id ?? chatId), name: message.from?.first_name ?? null, text }, now);
  if (!result.ok) {
    if (result.reason === "too-long") return reply(ctx, copy.supportTooLong(SUPPORT_MESSAGE_MAX));
    if (result.reason === "limited") return reply(ctx, copy.supportLimited);
    return reply(ctx, copy.linkFailed);
  }
  await savePrivateChat(chatId, { supportAwaitUntil: null });
  return reply(ctx, result.isNew ? copy.supportReceived(result.ticketId.slice(-8)) : copy.supportAppended);
}

async function handleCallback(query: NonNullable<TelegramUpdate["callback_query"]>, now: Date) {
  // Telegram düymədəki «saat» işarəsini cavabsız saxlamasın — əvvəl cavab verilir.
  await answerCallbackQuery(query.id);
  const chat = query.message?.chat;
  if (!chat) return;
  const chatId = String(chat.id);
  const isPrivate = chat.type === "private";
  const data = query.data ?? "";
  let locale = await resolveLocale(chatId, query.from, isPrivate);

  if (data.startsWith("lang:")) {
    const chosen = data.slice(5);
    if (!isPrivate || !(LOCALES as string[]).includes(chosen)) return;
    locale = chosen as Locale;
    await savePrivateChat(chatId, { locale });
    return sendBotMessage({ chatId, html: BOT_COPY[locale].languageSaved, buttons: mainMenu(locale) });
  }
  const ctx: Context = { chatId, isPrivate, from: query.from, locale, now };
  if (data === "notif:on" || data === "notif:off") {
    if (!isPrivate) return;
    const account = await linkedAccount(String(query.from.id));
    if (!account) return reply(ctx, BOT_COPY[locale].notLinked);
    const enabled = data === "notif:on";
    await setTelegramNotifications(account.userId, enabled);
    return reply(ctx, enabled ? BOT_COPY[locale].enabledDone : BOT_COPY[locale].stopDone, notificationToggle(locale, enabled));
  }
  if (data.startsWith("menu:")) {
    const command = data.slice(5);
    if ((BOT_COMMAND_NAMES as readonly string[]).includes(command) && command !== "start") return runCommand(command as BotCommand, ctx);
  }
}

/** Doğrulanmış update-i emal edir. Xəta yuxarı ötürülür — marşrut idempotentlik qeydini geri alıb 500 qaytarır. */
export async function handleTelegramUpdate(update: TelegramUpdate, now: Date = new Date()): Promise<void> {
  if (update.my_chat_member) {
    const event = update.my_chat_member;
    await recordChatMembership({
      chat: { id: String(event.chat.id), type: event.chat.type, title: event.chat.title },
      status: event.new_chat_member.status,
      canPostMessages: event.new_chat_member.can_post_messages,
      canSendMessages: event.new_chat_member.can_send_messages,
    }, now);
    return;
  }
  if (update.callback_query) {
    await handleCallback(update.callback_query, now);
    return;
  }
  if (update.message) await handleMessage(update.message, now);
}

/** Sürət limiti açarı: göndərənin Telegram ID-si (yoxdursa çat). */
export function updateActorKey(update: TelegramUpdate): string | null {
  const from = update.message?.from ?? update.callback_query?.from ?? update.my_chat_member?.from;
  if (from) return String(from.id);
  const chat = update.message?.chat;
  return chat ? String(chat.id) : null;
}
