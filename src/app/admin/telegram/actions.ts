"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";
import { prisma } from "@/lib/prisma";
import { SETTING_KEYS, setSettings } from "@/lib/settings";
import { getTelegramConfig } from "@/lib/telegram-bot/admin-alerts";
import {
  broadcastToChats,
  isChatCategory,
  removeTelegramWebhook,
  setupTelegramWebhook,
  shareListingToChats,
  syncBotCommands,
} from "@/lib/telegram-bot/admin-tools";
import { ADMIN_ALERT_KINDS, CHAT_STATUSES, type TelegramConfig } from "@/lib/telegram-bot/policy";

/**
 * Telegram inteqrasiyasının panel əməliyyatları — hamısı `settings:manage` (Super Admin + Admin). Hər action guard-ı ilk
 * sətirdə çağırır və audit jurnalına yazır; secret dəyərləri nə formada, nə jurnalda görünür.
 */

const PATH = "/admin/telegram";

async function guard() {
  try {
    return await requireAdminAction(PERMISSIONS.SETTINGS_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return error;
    throw error;
  }
}

export async function saveTelegramConfig(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (user instanceof AdminGuardError) return failure(user.message);
  const before = await getTelegramConfig();
  const next: TelegramConfig = {
    adminAlerts: Object.fromEntries(ADMIN_ALERT_KINDS.map((kind) => [kind, formData.get(`alert_${kind}`) === "on"])) as TelegramConfig["adminAlerts"],
    leadContactInChat: formData.get("leadContactInChat") === "on",
  };
  try {
    await setSettings({ [SETTING_KEYS.TELEGRAM_CONFIG]: JSON.stringify(next) });
    await recordAudit(user, "UPDATE", "Setting", SETTING_KEYS.TELEGRAM_CONFIG, "Telegram parametrləri yeniləndi", { oldValue: before, newValue: next });
    revalidatePath(PATH);
    return success(msg("server.telegram.saved"));
  } catch (error) {
    return unexpected("telegram parametrləri saxlanmadı", error, msg("server.common.unexpected"));
  }
}

export async function configureTelegramWebhook(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (user instanceof AdminGuardError) return failure(user.message);
  const result = await setupTelegramWebhook({ overrideOtherUrl: formData.get("override") === "on" });
  if (!result.ok) {
    if (result.reason === "other-url") return failure(msg("server.telegram.otherUrl", { url: result.currentUrl ?? "" }));
    if (result.reason === "invalid-secret") return failure(msg("server.telegram.invalidSecret"));
    if (result.reason === "not-https") return failure(msg("server.telegram.notHttps"));
    if (result.reason === "not-configured") return failure(msg("server.telegram.notConfigured"));
    return failure(msg("server.telegram.apiError", { code: result.code ?? 0 }));
  }
  await recordAudit(user, "UPDATE", "Setting", "telegram.webhook", "Telegram webhook quraşdırıldı");
  revalidatePath(PATH);
  return success(msg("server.telegram.webhookSet"));
}

export async function deleteTelegramWebhook(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (user instanceof AdminGuardError) return failure(user.message);
  if (formData.get("confirm") !== "on") return failure(msg("server.telegram.confirmRequired"));
  const result = await removeTelegramWebhook();
  if (!result.ok) return failure(msg("server.telegram.apiError", { code: result.code ?? 0 }));
  await recordAudit(user, "DELETE", "Setting", "telegram.webhook", "Telegram webhook silindi");
  revalidatePath(PATH);
  return success(msg("server.telegram.webhookDeleted"));
}

export async function syncTelegramCommands(): Promise<ActionState> {
  const user = await guard();
  if (user instanceof AdminGuardError) return failure(user.message);
  const result = await syncBotCommands();
  await recordAudit(user, "UPDATE", "Setting", "telegram.commands", "Bot komandaları sinxronlaşdırıldı");
  return result.ok ? success(msg("server.telegram.commandsSynced")) : failure(msg("server.telegram.commandsFailed", { list: result.failed.join(", ") }));
}

export async function updateTelegramChat(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (user instanceof AdminGuardError) return failure(user.message);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== CHAT_STATUSES.APPROVED && status !== CHAT_STATUSES.DISABLED) return failure(msg("server.common.formInvalid"));
  const categories = formData.getAll("categories").map(String).filter(isChatCategory);
  const chat = await prisma.telegramChat.findUnique({ where: { id }, select: { id: true, type: true, status: true, categories: true } });
  if (!chat || chat.type === "private") return failure(msg("server.telegram.chatNotFound"));
  try {
    await prisma.telegramChat.update({
      where: { id },
      data: {
        status,
        categories: JSON.stringify(categories),
        ...(status === CHAT_STATUSES.APPROVED ? { approvedById: user.id, approvedAt: new Date() } : {}),
      },
    });
    await recordAudit(user, "STATUS_CHANGE", "TelegramChat", id, "Telegram çatı yeniləndi", {
      oldValue: { status: chat.status, categories: chat.categories },
      newValue: { status, categories },
    });
    revalidatePath(PATH);
    return success(msg("server.telegram.chatSaved"));
  } catch (error) {
    return unexpected("telegram çatı yenilənmədi", error, msg("server.common.unexpected"));
  }
}

export async function broadcastTelegram(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (user instanceof AdminGuardError) return failure(user.message);
  const text = String(formData.get("text") ?? "").trim();
  const chatIds = formData.getAll("chatIds").map(String);
  if (text.length < 3 || chatIds.length === 0) return failure(msg("server.telegram.broadcastInvalid"));
  const result = await broadcastToChats(chatIds, text);
  await recordAudit(user, "PUBLISH", "TelegramChat", null, "Telegram yayımı göndərildi", { newValue: { targets: result.targets, sent: result.sent } });
  revalidatePath(PATH);
  return result.sent > 0 ? success(msg("server.telegram.broadcastSent", { count: result.sent })) : failure(msg("server.telegram.noTargets"));
}

export async function shareListingTelegram(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (user instanceof AdminGuardError) return failure(user.message);
  const listing = String(formData.get("listing") ?? "");
  const chatIds = formData.getAll("chatIds").map(String);
  if (!listing.trim() || chatIds.length === 0) return failure(msg("server.telegram.broadcastInvalid"));
  const result = await shareListingToChats(chatIds, listing);
  if (!result) return failure(msg("server.telegram.listingNotFound"));
  await recordAudit(user, "PUBLISH", "TelegramChat", null, `Elan Telegram-da paylaşıldı: ${result.title}`, { newValue: { targets: result.targets, sent: result.sent } });
  revalidatePath(PATH);
  return result.sent > 0 ? success(msg("server.telegram.broadcastSent", { count: result.sent })) : failure(msg("server.telegram.noTargets"));
}
