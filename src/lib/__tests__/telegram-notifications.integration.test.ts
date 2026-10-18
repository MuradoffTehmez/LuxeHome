import { env } from "cloudflare:test";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { completeTelegramLink, createTelegramLink, isValidWebhookSecret, unlinkTelegram } from "../telegram-notifications";

const DB = (env as unknown as { DB: D1Database }).DB;
const ENV = { TELEGRAM_BOT_TOKEN: "123:abc", TELEGRAM_BOT_USERNAME: "LuxeTestBot", TELEGRAM_WEBHOOK_SECRET: "s3cret-value" };

beforeAll(async () => {
  Object.assign(process.env, ENV);
  for (const id of ["tg-a", "tg-b"]) {
    await DB.prepare(`INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES ('${id}', 'İstifadəçi', '${id}@example.test', 'disabled', 'EDITOR', 'OWNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).run();
  }
});

afterAll(() => {
  for (const key of Object.keys(ENV)) delete process.env[key];
});

function tokenOf(link: string): string {
  return new URL(link).searchParams.get("start")!;
}

describe("Telegram bildiriş botunun bağlanması", () => {
  it("birdəfəlik token çatı hesaba bağlayır, təkrar istifadə rədd olunur", async () => {
    const link = await createTelegramLink("tg-a");
    expect(link).toMatch(/^https:\/\/t\.me\/LuxeTestBot\?start=/);
    const token = tokenOf(link!);
    // Bazada xam token yoxdur.
    expect(await prisma.telegramLinkToken.count({ where: { tokenHash: token } })).toBe(0);

    await expect(completeTelegramLink({ chatId: "555", token })).resolves.toBe("linked");
    expect((await prisma.user.findUnique({ where: { id: "tg-a" } }))?.telegramChatId).toBe("555");
    await expect(completeTelegramLink({ chatId: "555", token })).resolves.toBe("invalid");
  });

  it("vaxtı keçmiş token işləmir; çat başqa hesaba keçəndə köhnədən ayrılır", async () => {
    const old = tokenOf((await createTelegramLink("tg-b", new Date(Date.now() - 60 * 60 * 1000)))!);
    await expect(completeTelegramLink({ chatId: "555", token: old })).resolves.toBe("invalid");

    const fresh = tokenOf((await createTelegramLink("tg-b"))!);
    await expect(completeTelegramLink({ chatId: "555", token: fresh })).resolves.toBe("linked");
    expect((await prisma.user.findUnique({ where: { id: "tg-a" } }))?.telegramChatId).toBeNull();
    expect((await prisma.user.findUnique({ where: { id: "tg-b" } }))?.telegramChatId).toBe("555");

    await unlinkTelegram("tg-b");
    expect((await prisma.user.findUnique({ where: { id: "tg-b" } }))?.telegramChatId).toBeNull();
  });

  it("webhook başlığını sabit vaxtla yoxlayır", () => {
    expect(isValidWebhookSecret("s3cret-value")).toBe(true);
    expect(isValidWebhookSecret("s3cret-valuX")).toBe(false);
    expect(isValidWebhookSecret(null)).toBe(false);
  });
});
