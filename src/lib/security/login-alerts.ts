import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { emailHref, escapeHtml } from "@/lib/email-html";
import { siteUrl } from "@/config/site";
import { formatLocalizedDateTime } from "@/i18n/date";
import { noticeNewDeviceLogin } from "@/lib/accounts/account-notices";
import { deviceLabel, isNewDeviceLogin, KNOWN_DEVICE_WINDOW_DAYS } from "./login-device";
import { recordSecurityEvent, SECURITY_EVENT_KINDS } from "./security-events";

const PREVIOUS_SESSION_LIMIT = 50;

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
 * gündəki sessiyaların heç biri bu cihaz və IP-yə uyğun deyilsə hadisə yazılır və istifadəçiyə xəbər verilir
 * (ictimai hesaba təhlükəsizlik bildirişi, əməkdaşa e-poçt). **Heç vaxt atmır** — giriş artıq baş verib.
 */
export async function alertOnNewDevice(input: { userId: string; sessionId: string; ip: string | null; userAgent: string | null; now?: Date }): Promise<boolean> {
  try {
    const now = input.now ?? new Date();
    const previous = await prisma.session.findMany({
      where: { userId: input.userId, id: { not: input.sessionId }, createdAt: { gte: new Date(now.getTime() - KNOWN_DEVICE_WINDOW_DAYS * 86_400_000) } },
      orderBy: { createdAt: "desc" },
      take: PREVIOUS_SESSION_LIMIT,
      select: { ip: true, userAgent: true },
    });
    if (!isNewDeviceLogin({ ip: input.ip, userAgent: input.userAgent }, previous)) return false;
    const device = deviceLabel(input.userAgent) ?? "?";
    const ip = input.ip ?? "?";
    await recordSecurityEvent(SECURITY_EVENT_KINDS.NEW_DEVICE_LOGIN, { userId: input.userId, ip: input.ip, userAgent: input.userAgent, detail: { device } });
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
        html: `<p>${escapeHtml(copy.body(device, ip, at))}</p><p><a href="${emailHref(siteUrl("/admin/hesabim"))}">${copy.open}</a></p>`,
      }).catch((error: unknown) => console.error("[security] giriş məktubu göndərilmədi:", error));
    } else {
      await noticeNewDeviceLogin({ userId: input.userId, sessionId: input.sessionId, device, ip, at });
    }
    return true;
  } catch (error) {
    console.error("[security] yeni cihaz yoxlaması alınmadı:", error instanceof Error ? error.message : error);
    return false;
  }
}
