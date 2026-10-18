import { env } from "cloudflare:test";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TYPES } from "@/lib/constants";
import { defaultCategoryChannels, serializeCategoryChannels } from "@/lib/notification-categories";
import { consumeLinkToken, createLinkToken, unlinkTelegram } from "@/lib/telegram-bot/linking";
import { deliverTelegram, notifyTelegramUser, retryTelegramDeliveries } from "@/lib/telegram-bot/delivery";
import { processWebhookRequest } from "@/lib/telegram-bot/webhook";
import { acceptSupportMessage, closeSupportTicket, replyToSupportTicket } from "@/lib/telegram-bot/support";
import { completeTelegramSignup, issueTelegramSignup } from "@/lib/telegram-bot/signup";
import { SUPPORT_MESSAGES_PER_HOUR } from "@/lib/telegram-bot/policy";

/**
 * Telegram inteqrasiyası real D1-ə qarşı: webhook təhlükəsizliyi və idempotentliyi, birdəfəlik bağlama tokeni,
 * çatdırılma növbəsi (403/429), razılıq/kateqoriya/sakit saat qaydaları və dəstək müraciətləri. Telegram API
 * çağırışları `fetcher` ilə əvəz olunur — şəbəkəyə heç nə getmir.
 */
const DB = (env as unknown as { DB: D1Database }).DB;
const SECRET = "test_webhook_secret_0123456789";
const NOW = new Date("2026-10-18T10:00:00Z");

const ok = () => new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), { status: 200 });
const apiError = (code: number, extra: Record<string, unknown> = {}) => new Response(JSON.stringify({ ok: false, error_code: code, description: "x", ...extra }), { status: code });

async function insertUser(id: string, email: string, accountType = "USER") {
  await DB.prepare(
    'INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, \'disabled\', \'EDITOR\', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
  ).bind(id, `User ${id}`, email, accountType).run();
}

beforeAll(async () => {
  await insertUser("tg-a", "tg-a@example.test");
  await insertUser("tg-b", "tg-b@example.test");
  await insertUser("tg-staff", "tg-staff@example.test", "STAFF");
});

beforeEach(() => {
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:test");
  vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function webhookRequest(body: unknown, secret = SECRET) {
  return new Request("https://luxehomeestate.az/api/telegram/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": secret },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("webhook", () => {
  const deps = () => ({ handle: vi.fn(async () => undefined), allow: vi.fn(async () => true), actorKey: () => "42" });

  it("secret olmadan və ya səhv secret ilə update emal olunmur", async () => {
    const d = deps();
    expect((await processWebhookRequest(webhookRequest({ update_id: 1 }, "wrong_secret_value_000000"), d)).status).toBe(401);
    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "");
    expect((await processWebhookRequest(webhookRequest({ update_id: 1 }), d)).status).toBe(404);
    expect(d.handle).not.toHaveBeenCalled();
  });

  it("etibarsız payload 200 ilə keçilir, JSON olmayan 400", async () => {
    const d = deps();
    expect(await (await processWebhookRequest(webhookRequest({ foo: 1 }), d)).json()).toEqual({ ok: true, ignored: "invalid" });
    expect((await processWebhookRequest(webhookRequest("{pozuq"), d)).status).toBe(400);
    expect(d.handle).not.toHaveBeenCalled();
  });

  it("təkrar `update_id` bir dəfə emal olunur; emal xətası qeydi geri alır", async () => {
    const d = deps();
    const update = { update_id: 777, message: { message_id: 1, from: { id: 42 }, chat: { id: 42, type: "private" }, text: "/help" } };
    expect((await processWebhookRequest(webhookRequest(update), d)).status).toBe(200);
    expect(await (await processWebhookRequest(webhookRequest(update), d)).json()).toEqual({ ok: true, ignored: "duplicate" });
    expect(d.handle).toHaveBeenCalledTimes(1);

    const failing = { ...deps(), handle: vi.fn(async () => { throw new Error("x"); }) };
    expect((await processWebhookRequest(webhookRequest({ ...update, update_id: 778 }), failing)).status).toBe(500);
    expect(await prisma.telegramUpdate.findUnique({ where: { updateId: 778 } })).toBeNull();
  });

  it("sürət limiti aşılanda update emal olunmur", async () => {
    const d = { ...deps(), allow: vi.fn(async () => false) };
    const response = await processWebhookRequest(webhookRequest({ update_id: 779, message: { message_id: 1, chat: { id: 1, type: "private" } } }), d);
    expect(await response.json()).toEqual({ ok: true, ignored: "rate-limited" });
    expect(d.handle).not.toHaveBeenCalled();
  });
});

describe("hesab bağlama", () => {
  it("token birdəfəlikdir və yalnız heşi saxlanılır", async () => {
    const url = await createLinkToken("tg-a", NOW);
    const token = new URL(url).searchParams.get("start")!.slice(2);
    expect(await prisma.telegramLinkToken.count({ where: { tokenHash: token } })).toBe(0);

    const first = await consumeLinkToken(token, { id: "5001", username: "ali" }, "5001", NOW);
    expect(first).toMatchObject({ ok: true, userId: "tg-a", replaced: false });
    expect(await consumeLinkToken(token, { id: "5001" }, "5001", NOW)).toEqual({ ok: false, reason: "expired" });
    const account = await prisma.telegramAccount.findUnique({ where: { userId: "tg-a" } });
    expect(account).toMatchObject({ telegramUserId: "5001", chatId: "5001", botAccess: true, notificationsEnabled: false });
  });

  it("vaxtı keçmiş token qəbul olunmur", async () => {
    const url = await createLinkToken("tg-b", new Date(NOW.getTime() - 60 * 60 * 1000));
    const token = new URL(url).searchParams.get("start")!.slice(2);
    expect(await consumeLinkToken(token, { id: "6001" }, "6001", NOW)).toEqual({ ok: false, reason: "expired" });
  });

  it("eyni Telegram başqa hesaba bağlanmır; token götürülmür", async () => {
    const url = await createLinkToken("tg-b", NOW);
    const token = new URL(url).searchParams.get("start")!.slice(2);
    expect(await consumeLinkToken(token, { id: "5001" }, "5001", NOW)).toEqual({ ok: false, reason: "taken" });
    expect(await prisma.telegramLinkToken.findFirst({ where: { userId: "tg-b", usedAt: null } })).not.toBeNull();
  });

  it("əməkdaş hesabı bağlanmır", async () => {
    const url = await createLinkToken("tg-staff", NOW);
    const token = new URL(url).searchParams.get("start")!.slice(2);
    expect(await consumeLinkToken(token, { id: "9001" }, "9001", NOW)).toEqual({ ok: false, reason: "unavailable" });
  });

  it("yeni Telegram-a keçid köhnə razılığı sıfırlayır; ayırma kimliyi silir", async () => {
    await prisma.telegramAccount.update({ where: { userId: "tg-a" }, data: { notificationsEnabled: true, oidcSub: "old-sub" } });
    const url = await createLinkToken("tg-a", NOW);
    const token = new URL(url).searchParams.get("start")!.slice(2);
    expect(await consumeLinkToken(token, { id: "5002" }, "5002", NOW)).toMatchObject({ ok: true, replaced: true });
    expect(await prisma.telegramAccount.findUnique({ where: { userId: "tg-a" } })).toMatchObject({ telegramUserId: "5002", oidcSub: null, notificationsEnabled: false });

    expect(await unlinkTelegram("tg-a")).toBe(true);
    expect(await prisma.telegramAccount.findUnique({ where: { userId: "tg-a" } })).toBeNull();
  });
});

describe("çatdırılma", () => {
  beforeAll(async () => {
    await prisma.telegramAccount.create({ data: { userId: "tg-b", telegramUserId: "7001", chatId: "7001", botAccess: true, notificationsEnabled: true } });
  });

  it("429 növbəyə alınır və cron təkrar göndərir; mətn göndərişdən sonra silinir", async () => {
    const queued = await deliverTelegram({ audience: "USER", chatId: "7001", kind: "TEST", html: "salam", userId: "tg-b", dedupeKey: "t-429" }, { now: NOW, fetcher: async () => apiError(429, { parameters: { retry_after: 5 } }) });
    expect(queued).toBe("queued");
    expect(await deliverTelegram({ audience: "USER", chatId: "7001", kind: "TEST", html: "salam", dedupeKey: "t-429" }, { now: NOW })).toBe("duplicate");

    const retried = await retryTelegramDeliveries(new Date(NOW.getTime() + 10_000), 25, async () => ok());
    expect(retried.sent).toBe(1);
    const row = await prisma.telegramDelivery.findUnique({ where: { dedupeKey: "t-429" } });
    expect(row).toMatchObject({ status: "SENT", attempts: 2, text: null });
  });

  it("403 hesabı «bloklanıb» edir və sonrakı bildiriş getmir", async () => {
    expect(await deliverTelegram({ audience: "USER", chatId: "7001", kind: "TEST", html: "x", userId: "tg-b" }, { now: NOW, fetcher: async () => apiError(403) })).toBe("blocked");
    expect((await prisma.telegramAccount.findUnique({ where: { userId: "tg-b" } }))?.blockedAt).not.toBeNull();
    const fetcher = vi.fn(async () => ok());
    expect(await notifyTelegramUser({ userId: "tg-b", type: NOTIFICATION_TYPES.VIP, title: "T", content: "C", dedupeKey: "blocked-1" }, { now: NOW, fetcher })).toBe("skipped");
    expect(fetcher).not.toHaveBeenCalled();
    await prisma.telegramAccount.update({ where: { userId: "tg-b" }, data: { blockedAt: null, botAccess: true } });
  });

  it("razılıq və kateqoriya seçiminə tabedir; təhlükəsizlik bildirişi kateqoriyadan azaddır", async () => {
    const fetcher = vi.fn(async () => ok());
    const values = defaultCategoryChannels();
    values.VIP_PROMOTION.telegram = false;
    values.SECURITY.telegram = false;
    await prisma.notificationPreference.create({ data: { userId: "tg-b", categoryChannels: serializeCategoryChannels(values) } });

    expect(await notifyTelegramUser({ userId: "tg-b", type: NOTIFICATION_TYPES.VIP, title: "T", content: "C", dedupeKey: "vip-1" }, { now: NOW, fetcher })).toBe("skipped");
    expect(await notifyTelegramUser({ userId: "tg-b", type: NOTIFICATION_TYPES.SECURITY, title: "T", content: "C", dedupeKey: "sec-1" }, { now: NOW, fetcher })).toBe("sent");
    expect(await notifyTelegramUser({ userId: "tg-b", type: NOTIFICATION_TYPES.SECURITY, title: "T", content: "C", dedupeKey: "sec-1" }, { now: NOW, fetcher })).toBe("duplicate");

    await prisma.telegramAccount.update({ where: { userId: "tg-b" }, data: { notificationsEnabled: false } });
    expect(await notifyTelegramUser({ userId: "tg-b", type: NOTIFICATION_TYPES.SECURITY, title: "T", content: "C", dedupeKey: "sec-2" }, { now: NOW, fetcher })).toBe("skipped");
    await prisma.telegramAccount.update({ where: { userId: "tg-b" }, data: { notificationsEnabled: true } });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("sakit saatlarda adi bildiriş səssiz, təhlükəsizlik bildirişi səsli gedir", async () => {
    // 10:00 UTC = 14:00 Bakı vaxtı.
    await prisma.notificationPreference.update({ where: { userId: "tg-b" }, data: { quietHoursStart: "13:00", quietHoursEnd: "15:00", categoryChannels: null } });
    const bodies: Record<string, unknown>[] = [];
    const fetcher = async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      return ok();
    };
    await notifyTelegramUser({ userId: "tg-b", type: NOTIFICATION_TYPES.PRICE_DROP, title: "Qiymət", content: "<b>x</b>", path: "/emlaklar/x", dedupeKey: "quiet-1" }, { now: NOW, fetcher });
    await notifyTelegramUser({ userId: "tg-b", type: NOTIFICATION_TYPES.SECURITY, title: "Giriş", content: "y", dedupeKey: "quiet-2" }, { now: NOW, fetcher });
    expect(bodies[0]).toMatchObject({ chat_id: "7001", parse_mode: "HTML", disable_notification: true });
    expect(String(bodies[0].text)).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(bodies[1]).not.toHaveProperty("disable_notification");
  });
});

describe("dəstək", () => {
  it("müraciət yaranır, mesaj əlavə olunur, limit tətbiq olunur", async () => {
    const first = await acceptSupportMessage({ chatId: "8001", telegramUserId: "8001", name: "Kənan", text: "Kömək" }, NOW);
    expect(first).toMatchObject({ ok: true, isNew: true });
    const second = await acceptSupportMessage({ chatId: "8001", telegramUserId: "8001", name: "Kənan", text: "Əlavə" }, NOW);
    expect(second).toMatchObject({ ok: true, isNew: false });
    expect(await acceptSupportMessage({ chatId: "8001", telegramUserId: "8001", name: null, text: "x".repeat(3000) }, NOW)).toEqual({ ok: false, reason: "too-long" });
    for (let index = 2; index < SUPPORT_MESSAGES_PER_HOUR; index += 1) await acceptSupportMessage({ chatId: "8001", telegramUserId: "8001", name: null, text: `m${index}` }, NOW);
    expect(await acceptSupportMessage({ chatId: "8001", telegramUserId: "8001", name: null, text: "spam" }, NOW)).toEqual({ ok: false, reason: "limited" });
  });

  it("operator cavabı yalnız müraciətin öz çatına gedir; bağlanmış müraciətə cavab yoxdur", async () => {
    const ticket = await prisma.supportTicket.findFirstOrThrow({ where: { chatId: "8001" } });
    vi.stubGlobal("fetch", vi.fn(async () => ok()));
    try {
      expect(await replyToSupportTicket(ticket.id, "Cavab", "staff-1")).toEqual({ ok: true, delivered: true });
      const call = (globalThis.fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
      expect(JSON.parse(String(call[1].body)).chat_id).toBe("8001");
      expect(await closeSupportTicket(ticket.id, NOW)).toBe(true);
      expect(await replyToSupportTicket(ticket.id, "Yenə", "staff-1")).toEqual({ ok: false, reason: "closed" });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("Telegram ilə qeydiyyat", () => {
  const payload = { telegramUserId: "9100", sub: "sub-9100", username: null, botAccess: true, firstName: "Leyla", lastName: "Məmmədova", email: "leyla@example.test", locale: "az" };

  it("mövcud e-poçt üçün token verilmir", async () => {
    expect(await issueTelegramSignup({ ...payload, email: "tg-a@example.test" }, NOW)).toEqual({ ok: false, reason: "email-taken" });
  });

  it("hesab yalnız təsdiqdən sonra, təsdiqlənmiş e-poçtla yaranır; token təkrar işləmir", async () => {
    const issued = await issueTelegramSignup(payload, NOW);
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;
    expect(await prisma.user.findUnique({ where: { email: payload.email } })).toBeNull();
    const result = await completeTelegramSignup(issued.token, NOW);
    expect(result.ok).toBe(true);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: payload.email }, select: { id: true, emailVerifiedAt: true, telegramAccount: { select: { telegramUserId: true, notificationsEnabled: true } } } });
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(user.telegramAccount).toEqual({ telegramUserId: "9100", notificationsEnabled: false });
    expect(await completeTelegramSignup(issued.token, NOW)).toEqual({ ok: false, reason: "expired" });
  });
});
