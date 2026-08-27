import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

/**
 * Paneldən idarə olunan parametrlər.
 *
 * Burada **yalnız** işləmə vaxtı dəyişməli olan dəyərlər saxlanılır. Brend adı,
 * hüquqi ad, ünvan və naviqasiya `src/config/site.ts`-dədir və qəsdən kodda qalır:
 * onlar nadir hallarda dəyişir, ictimai səhifələrin statik render olunmasını
 * pozmamalıdır və dəyişikliyi kod nəzərdən keçirilməsindən keçməlidir.
 */

export const SETTING_KEYS = {
  /** Yeni müraciət bildirişinin gedəcəyi e-poçt. Boşdursa, `NOTIFICATION_EMAIL` işlədilir. */
  LEAD_NOTIFICATION_EMAIL: "lead.notification_email",
  /** `"0"` — müraciət bildirişi göndərilmir. */
  LEAD_NOTIFY_ENABLED: "lead.notify_enabled",
  /** Panel idarə səhifəsində komandaya göstərilən qeyd. */
  ADMIN_ANNOUNCEMENT: "admin.announcement",
  CONTACT_PHONE: "site.contact_phone",
  CONTACT_EMAIL: "site.contact_email",
  CONTACT_ADDRESS: "site.contact_address",
  CONTACT_INSTAGRAM: "site.contact_instagram",
  CONTACT_WHATSAPP: "site.contact_whatsapp",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export async function getSetting(key: SettingKey): Promise<string | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key }, select: { value: true } });
    return row?.value.trim() || null;
  } catch (error) {
    // Parametr oxunmadıqda əməliyyat dayanmamalıdır — defolt davranışa qayıdılır
    console.error(`[settings] «${key}» oxunmadı:`, error);
    return null;
  }
}

export async function getOperationalSiteConfig() {
  const settings = await getAllSettings();
  const phone = settings[SETTING_KEYS.CONTACT_PHONE]?.trim() || siteConfig.phone;
  const email = settings[SETTING_KEYS.CONTACT_EMAIL]?.trim() || siteConfig.email;
  const addressFull = settings[SETTING_KEYS.CONTACT_ADDRESS]?.trim() || siteConfig.addressFull;
  const instagram = settings[SETTING_KEYS.CONTACT_INSTAGRAM]?.trim().replace(/^@/, "") || siteConfig.instagram;
  const whatsapp = settings[SETTING_KEYS.CONTACT_WHATSAPP]?.replace(/\D/g, "") || siteConfig.whatsapp;
  return {
    phone,
    phoneHref: `tel:${phone.replace(/[^+\d]/g, "")}`,
    email,
    addressFull,
    instagram,
    instagramUrl: `https://instagram.com/${instagram}`,
    whatsapp,
  };
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.setting.findMany({ select: { key: true, value: true } });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  } catch (error) {
    // Build/test və müvəqqəti DB nasazlığında ictimai səhifələr kodda təsdiqlənmiş
    // ehtiyat məlumatlarla işləməyə davam edir.
    console.error("[settings] parametrlər oxunmadı:", error);
    return {};
  }
}

/**
 * Dəyərləri yazır.
 *
 * D1 transaction dəstəkləmir, ona görə açarlar bir-bir yazılır. Yarımçıq qalan
 * halda bir hissə yenilənmiş olur — parametrlər bir-birindən asılı olmadığı üçün
 * bu təhlükəsizdir.
 */
export async function setSettings(entries: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(entries)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}
