import type { TelegramApiFailure } from "./api";

/**
 * Telegram inteqrasiyasının saf qaydaları — Prisma, Next və şəbəkə idxal etmir, workerd testində birbaşa yoxlanılır.
 */

/** Telegram `sendMessage` limiti 4096 simvoldur (entity-lərdən sonra); ehtiyat payı saxlanılır. */
export const TELEGRAM_MESSAGE_LIMIT = 4000;
/** `/start` parametri: 1–64 simvol, `A-Z a-z 0-9 _ -`. */
const START_PAYLOAD = /^[A-Za-z0-9_-]{1,64}$/;
/** Webhook gövdəsinin yuxarı həddi — Telegram update-ləri adətən bir neçə KB-dır. */
export const WEBHOOK_MAX_BYTES = 64 * 1024;

export const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;
export const SIGNUP_TOKEN_TTL_MS = 30 * 60 * 1000;
export const LINK_TOKEN_PURPOSES = { LINK: "LINK", SIGNUP: "SIGNUP" } as const;
export type LinkTokenPurpose = (typeof LINK_TOKEN_PURPOSES)[keyof typeof LINK_TOKEN_PURPOSES];

/** Deep-link payload prefiksi: `l_<token>` — hesab bağlama. */
export const LINK_PAYLOAD_PREFIX = "l_";

export const DELIVERY_STATUSES = { PENDING: "PENDING", SENT: "SENT", FAILED: "FAILED", SKIPPED: "SKIPPED" } as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[keyof typeof DELIVERY_STATUSES];
export const DELIVERY_AUDIENCES = { USER: "USER", ADMIN: "ADMIN", CHAT: "CHAT", SUPPORT: "SUPPORT" } as const;
export type DeliveryAudience = (typeof DELIVERY_AUDIENCES)[keyof typeof DELIVERY_AUDIENCES];

/** Keçici xətada ən çox cəhd sayı; sonra `FAILED`. */
export const MAX_DELIVERY_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 60 * 1000;
const BACKOFF_MAX_MS = 6 * 60 * 60 * 1000;

export const CHAT_STATUSES = { PENDING: "PENDING", APPROVED: "APPROVED", DISABLED: "DISABLED", PRIVATE: "PRIVATE" } as const;
export type ChatStatus = (typeof CHAT_STATUSES)[keyof typeof CHAT_STATUSES];
export const CHAT_CATEGORIES = ["ADMIN_ALERTS", "LISTINGS", "BROADCAST"] as const;
export type ChatCategory = (typeof CHAT_CATEGORIES)[number];

export const SUPPORT_STATUSES = { OPEN: "OPEN", ANSWERED: "ANSWERED", CLOSED: "CLOSED" } as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[keyof typeof SUPPORT_STATUSES];
export const SUPPORT_MESSAGE_MAX = 2000;
export const SUPPORT_MESSAGES_PER_HOUR = 6;
export const SUPPORT_AWAIT_MS = 15 * 60 * 1000;
/** Bağlanmış dəstək müraciətinin mesajları bu qədər gün sonra silinir. */
export const SUPPORT_RETENTION_DAYS = 90;
export const UPDATE_RETENTION_DAYS = 3;
export const DELIVERY_RETENTION_DAYS = 30;

/** Admin xəbərdarlıq növləri — hər biri paneldə ayrıca açılıb-söndürülür. */
export const ADMIN_ALERT_KINDS = ["LEAD", "RESERVATION", "MODERATION", "REPORT", "SUPPORT", "SYSTEM"] as const;
export type AdminAlertKind = (typeof ADMIN_ALERT_KINDS)[number];

export type TelegramConfig = {
  adminAlerts: Record<AdminAlertKind, boolean>;
  /**
   * Müraciət xəbərdarlığında ad/telefon/e-poçt göstərilsin. `true` köhnə davranışdır (ofis çatı nömrəni birbaşa görürdü);
   * söndürüləndə yalnız maskalı nömrə və panel linki gedir — tam məlumat paneldə, rol yoxlamasından sonra açılır.
   */
  leadContactInChat: boolean;
};

export const TELEGRAM_CONFIG_DEFAULTS: TelegramConfig = {
  adminAlerts: { LEAD: true, RESERVATION: true, MODERATION: true, REPORT: true, SUPPORT: true, SYSTEM: true },
  leadContactInChat: true,
};

/** Bazadakı JSON → tam konfiqurasiya; naməlum açar atılır, pozulmuş dəyər defolta qayıdır. */
export function parseTelegramConfig(raw: string | null | undefined): TelegramConfig {
  const result: TelegramConfig = { adminAlerts: { ...TELEGRAM_CONFIG_DEFAULTS.adminAlerts }, leadContactInChat: TELEGRAM_CONFIG_DEFAULTS.leadContactInChat };
  if (!raw) return result;
  try {
    const value = JSON.parse(raw) as { adminAlerts?: Record<string, unknown>; leadContactInChat?: unknown };
    if (value?.adminAlerts && typeof value.adminAlerts === "object") {
      for (const kind of ADMIN_ALERT_KINDS) {
        if (typeof value.adminAlerts[kind] === "boolean") result.adminAlerts[kind] = value.adminAlerts[kind] as boolean;
      }
    }
    if (typeof value?.leadContactInChat === "boolean") result.leadContactInChat = value.leadContactInChat;
  } catch {
    // Pozulmuş dəyər — defolt.
  }
  return result;
}

/** Telegram HTML parse mode — `<`, `>`, `&` və dırnaq kodlanır (rəqəmli entity-lər dəstəklənir). */
export function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function truncateText(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, Math.max(0, limit - 1))}…` : value;
}

/**
 * Uzun mətni Telegram limitinə sığan hissələrə bölür — sətir sərhədində, yoxdursa sərt kəsiklə. HTML teqi hissələr
 * arasında bölünməsin deyə çağıran tərəf uzun dinamik mətni əvvəlcədən `truncateText` ilə qısaltmalıdır; bu funksiya
 * yalnız sətir səviyyəsində bölür.
 */
export function splitMessage(html: string, limit = TELEGRAM_MESSAGE_LIMIT): string[] {
  if (html.length <= limit) return [html];
  const parts: string[] = [];
  let current = "";
  for (const line of html.split("\n")) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length <= limit) {
      current = candidate;
      continue;
    }
    if (current) parts.push(current);
    let rest = line;
    while (rest.length > limit) {
      parts.push(rest.slice(0, limit));
      rest = rest.slice(limit);
    }
    current = rest;
  }
  if (current) parts.push(current);
  return parts;
}

/** Nömrənin son 4 rəqəmi qalır: `+994 50 *** ** 67`-yə bənzər qısa forma. */
export function maskPhoneForChat(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `*** ${digits.slice(-4, -2)} ${digits.slice(-2)}`;
}

export type DeliveryOutcome =
  | { kind: "sent" }
  /** Keçici xəta — `retryAt` vaxtında yenidən cəhd. */
  | { kind: "retry"; retryAt: Date; error: string }
  /** Bot bloklanıb, istifadəçi deaktivdir və ya çat yoxdur — bu hədəfə göndəriş dayanır. */
  | { kind: "blocked"; error: string }
  /** Sorğu səhvdir (400) — təkrar cəhd mənasızdır. */
  | { kind: "failed"; error: string };

export function backoffDelayMs(attempt: number): number {
  return Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempt - 1));
}

/**
 * Bot API cavabını çatdırılma qərarına çevirir. `attempt` — bu cəhdin nömrəsi (1-dən).
 * 429 `retry_after`-ə hörmət edir; 403 (bot bloklanıb/çatdan çıxarılıb) və «chat not found» hədəfi bağlayır;
 * 5xx və şəbəkə xətası eksponensial gözləmə ilə təkrarlanır, `MAX_DELIVERY_ATTEMPTS`-dən sonra qəti uğursuzdur.
 */
export function classifyDelivery(result: { ok: true } | TelegramApiFailure, attempt: number, now: Date): DeliveryOutcome {
  if (result.ok) return { kind: "sent" };
  const description = (result.description ?? "").toLowerCase();
  if (result.code === 403) return { kind: "blocked", error: "403" };
  if (result.code === 400 && (description.includes("chat not found") || description.includes("user is deactivated") || description.includes("group chat was upgraded"))) {
    return { kind: "blocked", error: "400-chat" };
  }
  const retriable = result.code === 429 || result.code === 0 || result.code >= 500;
  if (!retriable) return { kind: "failed", error: String(result.code) };
  if (attempt >= MAX_DELIVERY_ATTEMPTS) return { kind: "failed", error: result.code === 0 ? "network" : String(result.code) };
  const delay = result.code === 429 && result.retryAfter ? Math.max(1, result.retryAfter) * 1000 : backoffDelayMs(attempt);
  return { kind: "retry", retryAt: new Date(now.getTime() + delay), error: result.code === 0 ? "network" : String(result.code) };
}

/** `/start <payload>` mətnindən payload — yalnız Telegram-ın icazə verdiyi simvollar. */
export function parseStartPayload(text: string): string | null {
  const match = /^\/start(?:@\w+)?\s+(\S+)\s*$/.exec(text.trim());
  if (!match) return null;
  return START_PAYLOAD.test(match[1]) ? match[1] : null;
}

/** Bağlama payload-u → xam token (`l_<token>`); başqa hər şey `null`. */
export function linkTokenFromPayload(payload: string | null): string | null {
  if (!payload?.startsWith(LINK_PAYLOAD_PREFIX)) return null;
  const token = payload.slice(LINK_PAYLOAD_PREFIX.length);
  return /^[A-Za-z0-9_-]{32,60}$/.test(token) ? token : null;
}

/** Mesajdan komanda adı: `/help@luxehomeestatebot arg` → `help`. Başqa botun komandası `null`. */
export function parseCommand(text: string, botUsername?: string | null): string | null {
  const match = /^\/([a-z_]{1,32})(?:@(\w+))?(?:\s|$)/i.exec(text.trim());
  if (!match) return null;
  if (match[2] && botUsername && match[2].toLowerCase() !== botUsername.toLowerCase()) return null;
  return match[1].toLowerCase();
}

/** Webhook secret-i: Telegram `secret_token` üçün 1–256 simvol, `A-Z a-z 0-9 _ -`. */
export function isValidWebhookSecret(secret: string | undefined): secret is string {
  return typeof secret === "string" && /^[A-Za-z0-9_-]{16,256}$/.test(secret);
}

/**
 * Dəstək mesajı limiti: son bir saatda göndərilən mesajlar `SUPPORT_MESSAGES_PER_HOUR`-dan azdırsa qəbul olunur.
 */
export function supportRateAllowed(recentCount: number): boolean {
  return recentCount < SUPPORT_MESSAGES_PER_HOUR;
}

/** Qrup/kanal kateqoriyaları JSON → siyahı (naməlum dəyər atılır). */
export function parseChatCategories(raw: string | null | undefined): ChatCategory[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? CHAT_CATEGORIES.filter((category) => value.includes(category)) : [];
  } catch {
    return [];
  }
}

/** Botun qrup/kanaldakı statusundan göndəriş imkanı. Kanalda yalnız `can_post_messages` olan admin yaza bilər. */
export function chatCanPost(input: { type: string; status: string; canPostMessages?: boolean; canSendMessages?: boolean }): boolean {
  if (input.status === "left" || input.status === "kicked") return false;
  if (input.type === "channel") return input.status === "administrator" && input.canPostMessages === true;
  if (input.status === "restricted") return input.canSendMessages === true;
  return input.status === "member" || input.status === "administrator" || input.status === "creator";
}
