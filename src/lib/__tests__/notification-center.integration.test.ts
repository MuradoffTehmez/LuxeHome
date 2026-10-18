import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TYPES } from "@/lib/constants";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPE_CATEGORY,
  channelsForType,
  defaultCategoryChannels,
  parseCategoryChannels,
  serializeCategoryChannels,
} from "@/lib/notification-categories";
import { noticePasswordChanged, noticeVipDecision } from "@/lib/accounts/account-notices";
import { categoryChannelsFor, categoryChannelsForEmail } from "@/lib/notification-channels";
import az from "@/i18n/locales/az/account.json";
import en from "@/i18n/locales/en/account.json";
import ru from "@/i18n/locales/ru/account.json";

/** Bildiriş mərkəzi (#252, PRD Modul 15): kateqoriya × kanal seçimi və kritik təhlükəsizlik bildirişi. */
const DB = (env as unknown as { DB: D1Database }).DB;

describe("kateqoriya qaydaları", () => {
  it("hər bildiriş tipi kateqoriyaya düşür və hər kateqoriyanın tərcüməsi var", () => {
    for (const type of Object.values(NOTIFICATION_TYPES)) expect(NOTIFICATION_CATEGORIES).toContain(NOTIFICATION_TYPE_CATEGORY[type]);
    for (const catalog of [az, en, ru]) {
      for (const category of NOTIFICATION_CATEGORIES) {
        expect((catalog.notifications.center.categories as Record<string, { label: string }>)[category]?.label, category).toBeTruthy();
      }
    }
  });

  it("pozulmuş JSON defolta qayıdır; təhlükəsizlik söndürülə bilmir və saxlanmır", () => {
    expect(parseCategoryChannels("{pozuq")).toEqual(defaultCategoryChannels());
    const parsed = parseCategoryChannels(JSON.stringify({ LEADS: { inApp: false, email: true }, SECURITY: { inApp: false, email: false }, NAMELUM: { inApp: false } }));
    expect(parsed.LEADS).toEqual({ inApp: false, email: true });
    expect(parsed.SECURITY).toEqual({ inApp: true, email: true });
    expect(channelsForType("SECURITY", { ...parsed, SECURITY: { inApp: false, email: false } })).toEqual({ inApp: true, email: true });
    expect(JSON.parse(serializeCategoryChannels(parsed))).not.toHaveProperty("SECURITY");
  });
});

beforeAll(async () => {
  await DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (\'nc-user\', \'İstifadəçi\', \'nc@example.test\', \'disabled\', \'EDITOR\', \'OWNER\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').run();
});

describe("göndərmə seçimə tabedir", () => {
  it("söndürülmüş kateqoriya saytdaxili bildiriş yaratmır; təhlükəsizlik bildirişi yenə yaranır", async () => {
    const values = defaultCategoryChannels();
    values.VIP_PROMOTION = { inApp: false, email: false };
    await prisma.notificationPreference.create({ data: { userId: "nc-user", categoryChannels: serializeCategoryChannels(values) } });

    await noticeVipDecision({ userId: "nc-user", requestId: "nc-vip", title: "Elan", approved: true, days: 7, note: null });
    expect(await prisma.notification.count({ where: { userId: "nc-user", type: "VIP" } })).toBe(0);
    // Köhnə yazanlar (qiymət endirimi, elan müddəti, saxlanmış axtarış) eyni köməkçi ilə yoxlayır.
    await expect(categoryChannelsFor("nc-user", "PROMOTION")).resolves.toEqual({ inApp: false, email: false });
    await expect(categoryChannelsForEmail("nc@example.test", "VIP")).resolves.toEqual({ inApp: false, email: false });
    await expect(categoryChannelsFor("nc-user", "PRICE_DROP")).resolves.toEqual({ inApp: true, email: true });

    await noticePasswordChanged({ userId: "nc-user", changedAt: new Date("2026-10-18T10:00:00Z") });
    expect(await prisma.notification.count({ where: { userId: "nc-user", type: "SECURITY" } })).toBe(1);

    // Kateqoriya yenidən açılanda bildiriş yaranır.
    await prisma.notificationPreference.update({ where: { userId: "nc-user" }, data: { categoryChannels: null } });
    await noticeVipDecision({ userId: "nc-user", requestId: "nc-vip-2", title: "Elan", approved: true, days: 7, note: null });
    expect(await prisma.notification.count({ where: { userId: "nc-user", type: "VIP" } })).toBe(1);
  });
});
