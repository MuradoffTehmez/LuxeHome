import type { NotificationType } from "@/lib/constants";

/**
 * Bildiriş mərkəzi (#252, PRD Modul 15) — saf modul. Hər bildiriş tipi PRD 17.3-ün hadisə kateqoriyasına
 * düşür; istifadəçi kateqoriya üzrə kanal seçir (PRD 17.4). Aktiv kanallar saytdaxili, e-poçt və Telegram-dır, SMS
 * gələcək inteqrasiyadır (seçim göstərilir, amma deaktivdir). Telegram sütunu yalnız hesabda bağlı Telegram və
 * açıq razılıq (`TelegramAccount.notificationsEnabled`) olduqda işləyir — kateqoriya seçimi ondan əlavə süzgəcdir.
 * Kritik təhlükəsizlik bildirişləri (`CRITICAL_NOTIFICATION_CATEGORIES`) söndürülə bilmir — istifadəçinin seçimi
 * onlara tətbiq olunmur.
 */

export const NOTIFICATION_CATEGORIES = [
  "LEADS",
  "REPORTS",
  "MODERATION",
  "VIP_PROMOTION",
  "SUBSCRIPTION",
  "AGENCY",
  "LISTING_EXPIRY",
  "MATCHES",
  "REVIEWS",
  "SECURITY",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const CRITICAL_NOTIFICATION_CATEGORIES: readonly NotificationCategory[] = ["SECURITY"];

/** Aktiv kanallar; `FUTURE_NOTIFICATION_CHANNELS` UI-da deaktiv göstərilir. */
export const NOTIFICATION_CHANNELS = ["inApp", "email", "telegram"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export const FUTURE_NOTIFICATION_CHANNELS = ["sms"] as const;

const ALL_CHANNELS_ON: Record<NotificationChannel, boolean> = { inApp: true, email: true, telegram: true };

/** Tip → kateqoriya. Yeni bildiriş tipi əlavə edəndə buraya da yaz — `Record` typecheck-də yıxılır. */
export const NOTIFICATION_TYPE_CATEGORY: Record<NotificationType, NotificationCategory> = {
  SAVED_SEARCH_MATCH: "MATCHES",
  PRICE_DROP: "MATCHES",
  RECOMMENDATION: "MATCHES",
  RESERVATION_STATUS: "LEADS",
  MEETING_REMINDER: "LEADS",
  LISTING_LEAD: "LEADS",
  LEAD_ESCALATION: "LEADS",
  LISTING_REPORT: "REPORTS",
  REVIEW_REPORT: "REPORTS",
  LISTING_MODERATION: "MODERATION",
  VIP: "VIP_PROMOTION",
  PROMOTION: "VIP_PROMOTION",
  PACKAGE: "SUBSCRIPTION",
  SUBSCRIPTION: "SUBSCRIPTION",
  AGENCY_TEAM: "AGENCY",
  ACCOUNT_REVIEW: "AGENCY",
  LISTING_TRANSFER: "AGENCY",
  AGENCY_TASK: "AGENCY",
  LISTING_EXPIRY: "LISTING_EXPIRY",
  REVIEW: "REVIEWS",
  SECURITY: "SECURITY",
  ACCOUNT_RESTRICTION: "SECURITY",
};

export type CategoryChannels = Record<NotificationCategory, Record<NotificationChannel, boolean>>;

export function defaultCategoryChannels(): CategoryChannels {
  return Object.fromEntries(NOTIFICATION_CATEGORIES.map((category) => [category, { ...ALL_CHANNELS_ON }])) as CategoryChannels;
}

/** Bazadakı JSON → tam seçim; naməlum açar atılır, pozulmuş dəyər defolta (hamısı açıq) qayıdır. */
export function parseCategoryChannels(raw: string | null | undefined): CategoryChannels {
  const result = defaultCategoryChannels();
  if (!raw) return result;
  try {
    const value = JSON.parse(raw) as unknown;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const category of NOTIFICATION_CATEGORIES) {
        const entry = (value as Record<string, unknown>)[category];
        if (!entry || typeof entry !== "object") continue;
        for (const channel of NOTIFICATION_CHANNELS) {
          const enabled = (entry as Record<string, unknown>)[channel];
          if (typeof enabled === "boolean") result[category][channel] = enabled;
        }
      }
    }
  } catch {
    // Pozulmuş dəyər — defolt.
  }
  for (const category of CRITICAL_NOTIFICATION_CATEGORIES) result[category] = { ...ALL_CHANNELS_ON };
  return result;
}

/** Bu tip üçün kanallar: kritik kateqoriya həmişə açıqdır. */
export function channelsForType(type: NotificationType, preferences: CategoryChannels): Record<NotificationChannel, boolean> {
  const category = NOTIFICATION_TYPE_CATEGORY[type];
  if (CRITICAL_NOTIFICATION_CATEGORIES.includes(category)) return { ...ALL_CHANNELS_ON };
  return preferences[category];
}

export function serializeCategoryChannels(preferences: CategoryChannels): string {
  const copy = { ...preferences };
  for (const category of CRITICAL_NOTIFICATION_CATEGORIES) delete (copy as Partial<CategoryChannels>)[category];
  return JSON.stringify(copy);
}

/** Kritik (söndürülə bilməyən) kateqoriyaya aid tip — sakit saatlar da ona tətbiq olunmur. */
export function isCriticalNotificationType(type: NotificationType): boolean {
  return CRITICAL_NOTIFICATION_CATEGORIES.includes(NOTIFICATION_TYPE_CATEGORY[type]);
}
