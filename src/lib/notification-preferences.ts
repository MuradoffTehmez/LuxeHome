/**
 * Bildiriş kanalı seçimləri və push sakit saatları.
 *
 * PRD bölmə 57 hər bildiriş növü üçün ayrıca Email / Web / Push açarı tələb edir,
 * bölmə 168 isə push üçün sakit saat aralığı (məsələn 22:00–08:00) istəyir.
 * `NotificationPreference` sxemi bu sahələri əvvəldən saxlayırdı, lakin nə UI, nə
 * göndərmə qatı onları oxuyurdu — nəticədə istifadəçiyə heç bir nəzarət verilmirdi.
 *
 * Bu modul **saf** funksiyalar saxlayır: Prisma və `next-intl` idxal etmir, ona görə
 * həm server action-dan, həm də testdən birbaşa çağırıla bilir.
 */

/** Bakı ili boyu UTC+4-dədir (2016-dan yay vaxtı tətbiq edilmir). */
const BAKU_UTC_OFFSET_MS = 4 * 60 * 60 * 1000;

const MINUTES_PER_DAY = 24 * 60;

/** `HH:MM` formatı — brauzerin `<input type="time">` sahəsinin göndərdiyi dəyər. */
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const NOTIFICATION_CHANNEL_KEYS = [
  "savedSearchEmail",
  "savedSearchWeb",
  "savedSearchPush",
  "priceDropEmail",
  "priceDropWeb",
  "priceDropPush",
  "reservationEmail",
  "reservationWeb",
  "reservationPush",
] as const;

export type NotificationChannelKey = (typeof NOTIFICATION_CHANNEL_KEYS)[number];

export type NotificationPreferenceValues = Record<NotificationChannelKey, boolean> & {
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
};

/**
 * Sxemdəki `@default` dəyərləri ilə eyni olmalıdır: istifadəçinin hələ sətri yoxdursa
 * UI və göndərmə qatı eyni cavabı verməlidir.
 */
export const NOTIFICATION_PREFERENCE_DEFAULTS: NotificationPreferenceValues = {
  savedSearchEmail: true,
  savedSearchWeb: true,
  savedSearchPush: false,
  priceDropEmail: true,
  priceDropWeb: true,
  priceDropPush: false,
  reservationEmail: true,
  reservationWeb: true,
  reservationPush: false,
  quietHoursStart: null,
  quietHoursEnd: null,
};

/** Naməlum/boş sətri sxem defoltları ilə tamamlayır. */
export function resolveNotificationPreferences(
  stored: Partial<NotificationPreferenceValues> | null | undefined,
): NotificationPreferenceValues {
  const values = { ...NOTIFICATION_PREFERENCE_DEFAULTS };
  if (!stored) return values;

  for (const key of NOTIFICATION_CHANNEL_KEYS) {
    const value = stored[key];
    if (typeof value === "boolean") values[key] = value;
  }
  values.quietHoursStart = normalizeQuietHour(stored.quietHoursStart);
  values.quietHoursEnd = normalizeQuietHour(stored.quietHoursEnd);
  return values;
}

/** Etibarsız və ya boş vaxtı `null`-a çevirir — yarımçıq aralıq saxlanılmır. */
export function normalizeQuietHour(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return TIME_PATTERN.test(trimmed) ? trimmed : null;
}

function minutesOfDay(value: string): number {
  const [hours, minutes] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

/**
 * Sakit saat aralığı yalnız **hər iki** ucu verildikdə qüvvədədir.
 *
 * Aralıq gecə yarısını keçə bilər (22:00–08:00): belə halda şərt tərsinə çevrilir.
 * Eyni başlanğıc və son «bütün gün susdur» demək deyil — istifadəçi səhvən eyni
 * dəyəri seçəndə bildiriş tamamilə kəsilməməlidir, ona görə boş aralıq sayılır.
 */
export function isWithinQuietHours(
  start: string | null,
  end: string | null,
  now: Date = new Date(),
): boolean {
  const from = normalizeQuietHour(start);
  const to = normalizeQuietHour(end);
  if (!from || !to || from === to) return false;

  const bakuNow = new Date(now.getTime() + BAKU_UTC_OFFSET_MS);
  const current = (bakuNow.getUTCHours() * 60 + bakuNow.getUTCMinutes()) % MINUTES_PER_DAY;
  const fromMinutes = minutesOfDay(from);
  const toMinutes = minutesOfDay(to);

  return fromMinutes < toMinutes
    ? current >= fromMinutes && current < toMinutes
    : current >= fromMinutes || current < toMinutes;
}
