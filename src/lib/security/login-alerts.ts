import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { emailHref, escapeHtml } from "@/lib/email-html";
import { siteUrl } from "@/config/site";
import { formatLocalizedDateTime } from "@/i18n/date";
import { noticeNewDeviceLogin } from "@/lib/accounts/account-notices";
import { sha256Hex } from "@/lib/auth/crypto";
import { deviceLabel, isNewDeviceLogin, KNOWN_DEVICE_RETENTION_DAYS, KNOWN_DEVICE_WINDOW_DAYS } from "./login-device";
import { recordSecurityEvent, SECURITY_EVENT_KINDS } from "./security-events";

const HISTORY_LIMIT = 100;
const KINDS = { DEVICE: "DEVICE", IP: "IP" } as const;

/** Xam IP saxlanmır — `AUTH_SECRET` ilə duzlanmış heş (unikal baxış açarı kimi). */
async function ipHash(ip: string | null): Promise<string | null> {
  if (!ip || ip === "unknown") return null;
  return (await sha256Hex(`${process.env.AUTH_SECRET ?? ""}:login-ip:${ip}`)).slice(0, 32);
}

/** Cari cihaz və IP tanınmış siyahıya yazılır/yenilənir (idempotent). */
async function rememberDevice(userId: string, entries: { kind: string; value: string }[], now: Date): Promise<void> {
  for (const entry of entries) {
    await prisma.knownLoginDevice.upsert({
      where: { userId_kind_value: { userId, kind: entry.kind, value: entry.value } },
      create: { userId, kind: entry.kind, value: entry.value, firstSeenAt: now, lastSeenAt: now },
      update: { lastSeenAt: now },
    });
  }
}

/** Saxlama müddəti bitmiş tanınmış cihaz qeydləri (gündəlik baxım). */
export async function purgeKnownDevices(now = new Date()): Promise<number> {
  const { count } = await prisma.knownLoginDevice.deleteMany({ where: { lastSeenAt: { lt: new Date(now.getTime() - KNOWN_DEVICE_RETENTION_DAYS * 86_400_000) } } });
  return count;
}

const STAFF_COPY: Record<Locale, { subject: string; body: (device: string, ip: string, at: string) => string; open: string }> = {
  az: {
    subject: "İdarə panelinə yeni cihazdan giriş",
    body: (device, ip, at) => `${at} tarixində panel hesabınıza tanınmayan cihazdan giriş edildi (${device}, IP ${ip}). Bu siz deyilsinizsə, «Hesabım» bölməsində bütün sessiyaları bağlayın və parolunuzu dəyişin.`,
    open: "Hesabımı aç",
  },
  en: {
    subject: "New sign-in to the admin panel",
    body: (device, ip, at) => `Your admin account was signed in from an unrecognised device on ${at} (${device}, IP ${ip}). If this was not you, sign out all sessions in «My account» and change your password.`,
    open: "Open my account",
  },
  ru: {
    subject: "Вход в панель управления с нового устройства",
    body: (device, ip, at) => `${at} в вашу учётную запись панели выполнен вход с незнакомого устройства (${device}, IP ${ip}). Если это были не вы, завершите все сессии в разделе «Мой аккаунт» и смените пароль.`,
    open: "Открыть аккаунт",
  },
};

/**
 * Şübhəli giriş xəbərdarlığı (#264, PRD 23.1): sessiya açılandan sonra çağırılır. Son `KNOWN_DEVICE_WINDOW_DAYS`
 * gündə tanınmış cihaz/IP qeydlərinin (`KnownLoginDevice`) heç biri uyğun deyilsə hadisə yazılır və istifadəçiyə xəbər verilir
 * (ictimai hesaba təhlükəsizlik bildirişi, əməkdaşa e-poçt). **Heç vaxt atmır** — giriş artıq baş verib.
 */
export async function alertOnNewDevice(input: { userId: string; sessionId: string; ip: string | null; userAgent: string | null; now?: Date }): Promise<boolean> {
  try {
    const now = input.now ?? new Date();
    const device = deviceLabel(input.userAgent);
    const currentIpHash = await ipHash(input.ip);
    const since = new Date(now.getTime() - KNOWN_DEVICE_WINDOW_DAYS * 86_400_000);
    const [hasHistory, recent] = await Promise.all([
      prisma.knownLoginDevice.findFirst({ where: { userId: input.userId }, select: { id: true } }).then(Boolean),
      prisma.knownLoginDevice.findMany({ where: { userId: input.userId, lastSeenAt: { gte: since } }, orderBy: { lastSeenAt: "desc" }, take: HISTORY_LIMIT, select: { kind: true, value: true } }),
    ]);
    const isNew = isNewDeviceLogin({ device, ipHash: currentIpHash }, {
      hasHistory,
      devices: recent.filter((row) => row.kind === KINDS.DEVICE).map((row) => row.value),
      ipHashes: recent.filter((row) => row.kind === KINDS.IP).map((row) => row.value),
    });
    // Qərardan sonra cari cihaz yadda saxlanılır — növbəti girişdə tanış sayılsın.
    await rememberDevice(input.userId, [
      ...(device ? [{ kind: KINDS.DEVICE, value: device }] : []),
      ...(currentIpHash ? [{ kind: KINDS.IP, value: currentIpHash }] : []),
    ], now);
    if (!isNew) return false;
    const deviceText = device ?? "?";
    const ip = input.ip ?? "?";
    await recordSecurityEvent(SECURITY_EVENT_KINDS.NEW_DEVICE_LOGIN, { userId: input.userId, ip: input.ip, userAgent: input.userAgent, detail: { device: deviceText } });
    const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { email: true, locale: true, accountType: true } });
    if (!user) return true;
    const locale: Locale = user.locale === "en" || user.locale === "ru" ? user.locale : "az";
    const at = formatLocalizedDateTime(now, locale) ?? now.toISOString();
    if (user.accountType === ACCOUNT_TYPES.STAFF) {
      // Əməkdaşın kabinet bildirişi yoxdur — kritik təhlükəsizlik məktubu birbaşa gedir (bildiriş açarından asılı deyil).
      const copy = STAFF_COPY[locale];
      await sendEmail({
        to: user.email,
        subject: copy.subject,
        html: `<p>${escapeHtml(copy.body(deviceText, ip, at))}</p><p><a href="${emailHref(siteUrl("/admin/hesabim"))}">${copy.open}</a></p>`,
      }).catch((error: unknown) => console.error("[security] giriş məktubu göndərilmədi:", error));
    } else {
      await noticeNewDeviceLogin({ userId: input.userId, sessionId: input.sessionId, device: deviceText, ip, at });
    }
    return true;
  } catch (error) {
    console.error("[security] yeni cihaz yoxlaması alınmadı:", error instanceof Error ? error.message : error);
    return false;
  }
}
