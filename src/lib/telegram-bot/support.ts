import { prisma } from "@/lib/prisma";
import { alertSupportTicket } from "./admin-alerts";
import { BOT_COPY, botLocale } from "./copy";
import { deliverTelegram } from "./delivery";
import {
  DELIVERY_AUDIENCES,
  SUPPORT_MESSAGE_MAX,
  SUPPORT_RETENTION_DAYS,
  SUPPORT_STATUSES,
  escapeTelegramHtml,
  supportRateAllowed,
} from "./policy";

/**
 * Telegram dəstək müraciətləri (`/support`). Müraciət çat ID-sinə bağlanır; Telegram hesabı sayt hesabına bağlıdırsa
 * `userId` də yazılır (bağlı olmayan şəxs də yaza bilər — yalnız Telegram adı saxlanılır). Mesaj mətni çata
 * göndərilən xəbərdarlığa düşmür, yalnız paneldə (`lead:manage`) görünür. Bağlanmış müraciətin mesajları
 * `SUPPORT_RETENTION_DAYS` sonra silinir.
 */

const OPEN_STATUSES = [SUPPORT_STATUSES.OPEN, SUPPORT_STATUSES.ANSWERED];

export type SupportIntake =
  | { ok: true; ticketId: string; isNew: boolean }
  | { ok: false; reason: "too-long" | "empty" | "limited" | "failed" };

export async function acceptSupportMessage(
  input: { chatId: string; telegramUserId: string; name: string | null; text: string },
  now: Date = new Date(),
): Promise<SupportIntake> {
  const body = input.text.trim();
  if (!body) return { ok: false, reason: "empty" };
  if (body.length > SUPPORT_MESSAGE_MAX) return { ok: false, reason: "too-long" };
  try {
    const recent = await prisma.supportMessage.count({
      where: { direction: "IN", createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) }, ticket: { chatId: input.chatId } },
    });
    if (!supportRateAllowed(recent)) return { ok: false, reason: "limited" };

    const [open, account] = await Promise.all([
      prisma.supportTicket.findFirst({ where: { chatId: input.chatId, status: { in: OPEN_STATUSES } }, orderBy: { updatedAt: "desc" }, select: { id: true } }),
      prisma.telegramAccount.findUnique({ where: { telegramUserId: input.telegramUserId }, select: { userId: true } }),
    ]);
    let ticketId = open?.id;
    const isNew = !ticketId;
    if (!ticketId) {
      const created = await prisma.supportTicket.create({
        data: { chatId: input.chatId, userId: account?.userId ?? null, name: input.name?.slice(0, 120) ?? null, status: SUPPORT_STATUSES.OPEN },
        select: { id: true },
      });
      ticketId = created.id;
    } else {
      await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: SUPPORT_STATUSES.OPEN } });
    }
    await prisma.supportMessage.create({ data: { ticketId, direction: "IN", body } });
    await alertSupportTicket({ ticketId, name: input.name, linked: Boolean(account), isNew });
    return { ok: true, ticketId, isNew };
  } catch (error) {
    console.error("[telegram] dəstək mesajı yazılmadı:", error instanceof Error ? error.name : "unknown");
    return { ok: false, reason: "failed" };
  }
}

async function chatLocale(chatId: string): Promise<string> {
  const [chat, account] = await Promise.all([
    prisma.telegramChat.findUnique({ where: { chatId }, select: { locale: true } }),
    prisma.telegramAccount.findFirst({ where: { chatId }, select: { user: { select: { locale: true } } } }),
  ]);
  return chat?.locale ?? account?.user.locale ?? "az";
}

export type ReplyResult = { ok: true; delivered: boolean } | { ok: false; reason: "not-found" | "closed" | "empty" | "too-long" };

/** Operator cavabı — çağıran action `lead:manage` icazəsini yoxlayıb. */
export async function replyToSupportTicket(ticketId: string, text: string, authorId: string): Promise<ReplyResult> {
  const body = text.trim();
  if (!body) return { ok: false, reason: "empty" };
  if (body.length > SUPPORT_MESSAGE_MAX * 2) return { ok: false, reason: "too-long" };
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId }, select: { id: true, chatId: true, status: true, userId: true } });
  if (!ticket) return { ok: false, reason: "not-found" };
  if (ticket.status === SUPPORT_STATUSES.CLOSED) return { ok: false, reason: "closed" };
  const message = await prisma.supportMessage.create({ data: { ticketId, direction: "OUT", body, authorId }, select: { id: true } });
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: SUPPORT_STATUSES.ANSWERED } });
  if (!ticket.chatId) return { ok: true, delivered: false };
  const copy = BOT_COPY[botLocale(await chatLocale(ticket.chatId))];
  const result = await deliverTelegram({
    audience: DELIVERY_AUDIENCES.SUPPORT,
    chatId: ticket.chatId,
    kind: "SUPPORT_REPLY",
    html: `${copy.supportReply}\n\n${escapeTelegramHtml(body)}`,
    userId: ticket.userId,
    dedupeKey: `support:${message.id}`,
  });
  return { ok: true, delivered: result === "sent" || result === "queued" };
}

export async function closeSupportTicket(ticketId: string, now: Date = new Date()): Promise<boolean> {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId }, select: { chatId: true, status: true, userId: true } });
  if (!ticket || ticket.status === SUPPORT_STATUSES.CLOSED) return false;
  const closed = await prisma.supportTicket.updateMany({ where: { id: ticketId, status: { not: SUPPORT_STATUSES.CLOSED } }, data: { status: SUPPORT_STATUSES.CLOSED, closedAt: now } });
  if (closed.count !== 1) return false;
  if (ticket.chatId) {
    const copy = BOT_COPY[botLocale(await chatLocale(ticket.chatId))];
    await deliverTelegram({ audience: DELIVERY_AUDIENCES.SUPPORT, chatId: ticket.chatId, kind: "SUPPORT_CLOSED", html: copy.supportClosed, userId: ticket.userId, dedupeKey: `support-closed:${ticketId}` });
  }
  return true;
}

/** Baxım: saxlama müddəti bitmiş bağlı müraciətlər mesajları ilə birlikdə silinir. */
export async function purgeSupportTickets(now: Date = new Date()): Promise<number> {
  const before = new Date(now.getTime() - SUPPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.supportTicket.deleteMany({ where: { status: SUPPORT_STATUSES.CLOSED, closedAt: { lt: before } } });
  return result.count;
}

export async function listSupportTickets(filter: { status?: string | null; page?: number }) {
  const take = 30;
  const page = Math.max(1, filter.page ?? 1);
  const where = filter.status && (Object.values(SUPPORT_STATUSES) as string[]).includes(filter.status) ? { status: filter.status } : { status: { in: OPEN_STATUSES } };
  const [items, total, openCount] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * take,
      take,
      select: { id: true, name: true, status: true, createdAt: true, updatedAt: true, userId: true, user: { select: { name: true } }, _count: { select: { messages: true } } },
    }),
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.count({ where: { status: SUPPORT_STATUSES.OPEN } }),
  ]);
  return { items, total, openCount, page, pages: Math.max(1, Math.ceil(total / take)) };
}

export async function getSupportTicket(ticketId: string) {
  return prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      name: true,
      status: true,
      chatId: true,
      createdAt: true,
      closedAt: true,
      user: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 200, select: { id: true, direction: true, body: true, createdAt: true, authorId: true } },
    },
  });
}
