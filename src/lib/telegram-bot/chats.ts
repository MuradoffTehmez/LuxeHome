import { prisma } from "@/lib/prisma";
import { CHAT_STATUSES, chatCanPost, parseChatCategories, type ChatCategory } from "./policy";

/**
 * Bot ilə əlaqəli çatlar. Qrup/kanal yalnız etibarlı webhook hadisəsindən (`my_chat_member` — botu əlavə etdilər,
 * admin etdilər, çıxardılar) qeydə alınır və `PENDING` başlayır: administrator paneldə təsdiqləyib kateqoriya seçənə
 * qədər oraya heç nə göndərilmir. Bot çıxarılanda status `DISABLED` olur, göndəriş dayanır. Şəxsi çat (`PRIVATE`)
 * yalnız dil seçimi və dəstək vəziyyəti üçün saxlanılır.
 */

export type ChatMemberEvent = {
  chat: { id: string; type: string; title?: string | null };
  status: string;
  canPostMessages?: boolean;
  canSendMessages?: boolean;
};

export async function recordChatMembership(event: ChatMemberEvent, now: Date = new Date()): Promise<void> {
  const { chat } = event;
  if (chat.type === "private") {
    // İstifadəçi botu bloklayıb (`kicked`) və ya yenidən başladıb (`member`).
    const blocked = event.status === "kicked" || event.status === "left";
    await prisma.telegramAccount.updateMany({
      where: { chatId: chat.id },
      data: blocked ? { blockedAt: now, botAccess: false, lastDeliveryStatus: "BLOCKED" } : { blockedAt: null, botAccess: true },
    });
    return;
  }
  if (!["group", "supergroup", "channel"].includes(chat.type)) return;
  const canPost = chatCanPost({ type: chat.type, status: event.status, canPostMessages: event.canPostMessages, canSendMessages: event.canSendMessages });
  const removed = event.status === "left" || event.status === "kicked";
  const existing = await prisma.telegramChat.findUnique({ where: { chatId: chat.id }, select: { status: true } });
  const status = removed ? CHAT_STATUSES.DISABLED : existing?.status === CHAT_STATUSES.APPROVED ? CHAT_STATUSES.APPROVED : existing?.status === CHAT_STATUSES.DISABLED ? CHAT_STATUSES.DISABLED : CHAT_STATUSES.PENDING;
  const title = chat.title?.slice(0, 200) ?? null;
  await prisma.telegramChat.upsert({
    where: { chatId: chat.id },
    create: { chatId: chat.id, type: chat.type, title, status, botStatus: event.status, canPost },
    update: { type: chat.type, title, status, botStatus: event.status, canPost, lastError: null },
  });
}

/** Qrup supergroup-a çevriləndə Telegram yeni ID verir — köhnə qeyd yeni ID-yə köçürülür. */
export async function migrateChat(oldChatId: string, newChatId: string): Promise<void> {
  await prisma.telegramChat.updateMany({ where: { chatId: oldChatId }, data: { chatId: newChatId, type: "supergroup" } }).catch(() => undefined);
}

export async function privateChatState(chatId: string) {
  return prisma.telegramChat.findUnique({ where: { chatId }, select: { locale: true, supportAwaitUntil: true } });
}

export async function savePrivateChat(chatId: string, data: { locale?: string; supportAwaitUntil?: Date | null }): Promise<void> {
  await prisma.telegramChat.upsert({
    where: { chatId },
    create: { chatId, type: "private", status: CHAT_STATUSES.PRIVATE, ...data },
    update: data,
  });
}

export type ManagedChat = {
  id: string;
  chatId: string;
  type: string;
  title: string | null;
  status: string;
  botStatus: string | null;
  canPost: boolean;
  categories: ChatCategory[];
  approvedAt: Date | null;
  lastError: string | null;
  updatedAt: Date;
};

export async function listManagedChats(): Promise<ManagedChat[]> {
  const rows = await prisma.telegramChat.findMany({
    where: { type: { in: ["group", "supergroup", "channel"] } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 100,
    select: { id: true, chatId: true, type: true, title: true, status: true, botStatus: true, canPost: true, categories: true, approvedAt: true, lastError: true, updatedAt: true },
  });
  return rows.map((row) => ({ ...row, categories: parseChatCategories(row.categories) }));
}

/** Təsdiqlənmiş və yaza bilən, verilən kateqoriyalı hədəflər. */
export async function approvedChatsFor(category: ChatCategory): Promise<{ chatId: string; title: string | null }[]> {
  const rows = await prisma.telegramChat.findMany({
    where: { status: CHAT_STATUSES.APPROVED, canPost: true, type: { in: ["group", "supergroup", "channel"] } },
    select: { chatId: true, title: true, categories: true },
  });
  return rows.filter((row) => parseChatCategories(row.categories).includes(category)).map(({ chatId, title }) => ({ chatId, title }));
}
