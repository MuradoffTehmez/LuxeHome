import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { deviceLabel, isNewDeviceLogin } from "@/lib/security/login-device";
import { alertOnNewDevice } from "@/lib/security/login-alerts";
import { purgeSecurityLogs, recordSecurityEvent, SECURITY_EVENT_KINDS } from "@/lib/security/security-events";
import { getSecurityOverview } from "@/lib/security/security-overview";
import { LOGIN_ATTEMPT_RETENTION_DAYS, SECURITY_EVENT_RETENTION_DAYS } from "@/lib/security/retention-policy";

/** Təhlükəsizlik hadisələri, yeni cihaz xəbərdarlığı və saxlama (#264, PRD Modul 21). */
const DB = (env as unknown as { DB: D1Database }).DB;
const CHROME_WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const CHROME_WIN_NEWER = CHROME_WIN.replace("Chrome/130.0", "Chrome/131.0");
const SAFARI_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const now = new Date();
const iso = now.toISOString();
const DAY = 86_400_000;

describe("cihaz qiymətləndirməsi", () => {
  it("brauzer və sistemi versiyasız tanıyır", () => {
    expect(deviceLabel(CHROME_WIN)).toBe("Chrome · Windows");
    expect(deviceLabel(CHROME_WIN_NEWER)).toBe("Chrome · Windows");
    expect(deviceLabel(SAFARI_IOS)).toBe("Safari · iOS");
    expect(deviceLabel("Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0")).toBe("Firefox · Linux");
    expect(deviceLabel(null)).toBeNull();
  });

  it("ilk giriş, tanış IP və ya tanış cihaz xəbərdarlıq vermir; fasilədən sonrakı yad giriş verir", () => {
    const known = { hasHistory: true, devices: ["Chrome · Windows"], ipHashes: ["ip-a"] };
    expect(isNewDeviceLogin({ device: "Chrome · Windows", ipHash: "ip-a" }, { hasHistory: false, devices: [], ipHashes: [] })).toBe(false);
    expect(isNewDeviceLogin({ device: "Safari · iOS", ipHash: "ip-a" }, known)).toBe(false);
    expect(isNewDeviceLogin({ device: deviceLabel(CHROME_WIN_NEWER), ipHash: "ip-b" }, known)).toBe(false);
    expect(isNewDeviceLogin({ device: "Safari · iOS", ipHash: "ip-b" }, known)).toBe(true);
    expect(isNewDeviceLogin({ device: "Safari · iOS", ipHash: null }, known)).toBe(true);
    // Tarixçə var, amma pəncərədə heç nə yoxdur (uzun fasilə) — giriş yeni sayılır.
    expect(isNewDeviceLogin({ device: "Chrome · Windows", ipHash: "ip-a" }, { hasHistory: true, devices: [], ipHashes: [] })).toBe(true);
  });
});

beforeAll(async () => {
  await DB.batch([
    DB.prepare(`INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES ('se-user', 'Təhlükəsiz', 'se@example.test', 'disabled', 'EDITOR', 'OWNER', ?, ?)`).bind(iso, iso),
    DB.prepare(`INSERT INTO "LoginAttempt" ("id", "email", "ip", "success", "reason", "createdAt") VALUES ('se-la-old', 'se@example.test', '5.5.5.5', 0, 'BAD_PASSWORD', ?)`).bind(new Date(now.getTime() - (LOGIN_ATTEMPT_RETENTION_DAYS + 1) * DAY).toISOString()),
    DB.prepare(`INSERT INTO "LoginAttempt" ("id", "email", "ip", "success", "reason", "createdAt") VALUES ('se-la-new', 'se@example.test', '5.5.5.5', 0, 'BAD_PASSWORD', ?)`).bind(iso),
    DB.prepare(`INSERT INTO "SecurityEvent" ("id", "kind", "createdAt") VALUES ('se-ev-old', 'FORBIDDEN', ?)`).bind(new Date(now.getTime() - (SECURITY_EVENT_RETENTION_DAYS + 1) * DAY).toISOString()),
  ]);
});

describe("yeni cihaz xəbərdarlığı və jurnal", () => {
  it("tanınmayan cihaz və IP hadisə və təhlükəsizlik bildirişi yaradır, tanış IP yaratmır", async () => {
    // İlk giriş — tarixçə qurulur, xəbərdarlıq yoxdur; sessiya sətri silinsə də tarixçə qalır.
    expect(await alertOnNewDevice({ userId: "se-user", sessionId: "se-old", ip: "1.1.1.1", userAgent: CHROME_WIN, now })).toBe(false);
    expect(await alertOnNewDevice({ userId: "se-user", sessionId: "se-new", ip: "9.9.9.9", userAgent: SAFARI_IOS, now })).toBe(true);
    // Köhnə Chrome IP-sindən yeni cihaz — IP tanışdır.
    expect(await alertOnNewDevice({ userId: "se-user", sessionId: "se-known", ip: "1.1.1.1", userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0", now })).toBe(false);
    // Xam IP saxlanmır.
    const stored = await DB.prepare(`SELECT "value" FROM "KnownLoginDevice" WHERE "kind" = 'IP'`).all<{ value: string }>();
    expect(stored.results.some((row) => row.value.includes("1.1.1.1"))).toBe(false);
    const events = await DB.prepare(`SELECT "kind", "ip" FROM "SecurityEvent" WHERE "userId" = 'se-user'`).all<{ kind: string; ip: string }>();
    expect(events.results).toEqual([{ kind: "NEW_DEVICE_LOGIN", ip: "9.9.9.9" }]);
    const notice = await DB.prepare(`SELECT "type", "dedupeKey" FROM "Notification" WHERE "userId" = 'se-user'`).first<{ type: string; dedupeKey: string }>();
    expect(notice).toEqual({ type: "SECURITY", dedupeKey: "security:login:se-new" });
  });

  it("hadisə yazılışı heç vaxt atmır və təfsilatı qısaldır", async () => {
    await expect(recordSecurityEvent(SECURITY_EVENT_KINDS.FORBIDDEN, { userId: "se-user", ip: "3.3.3.3", userAgent: null, detail: { permission: "x".repeat(2000) } })).resolves.toBeUndefined();
    const row = await DB.prepare(`SELECT LENGTH("detail") AS size FROM "SecurityEvent" WHERE "kind" = 'FORBIDDEN' AND "ip" = '3.3.3.3'`).first<{ size: number }>();
    expect(row?.size).toBeLessThanOrEqual(500);
  });

  it("icmal 24 saatlıq göstəriciləri və növ filtrini verir", async () => {
    // Yazma limiti yalnız hadisə jurnalındadır — göstəriciyə də düşməlidir.
    await recordSecurityEvent(SECURITY_EVENT_KINDS.RATE_LIMITED, { userId: "se-user", ip: null, userAgent: null, detail: { scope: "admin" } });
    const data = await getSecurityOverview({ now });
    expect(data.stats.rateLimited).toBe(1);
    expect(data.stats.failedLogins).toBeGreaterThanOrEqual(1);
    expect(data.stats.newDevice).toBe(1);
    expect(data.topIps[0]).toEqual({ ip: "5.5.5.5", count: 1 });
    const filtered = await getSecurityOverview({ now, kind: SECURITY_EVENT_KINDS.NEW_DEVICE_LOGIN });
    expect(filtered.events.map((row) => row.kind)).toEqual(["NEW_DEVICE_LOGIN"]);
    expect(filtered.events[0].user?.email).toBe("se@example.test");
  });

  it("saxlama müddəti bitmiş hadisə və giriş cəhdləri silinir", async () => {
    expect(await purgeSecurityLogs(now)).toEqual({ events: 1, loginAttempts: 1 });
    expect(await DB.prepare(`SELECT "id" FROM "LoginAttempt" WHERE "id" = 'se-la-new'`).first()).not.toBeNull();
  });
});
