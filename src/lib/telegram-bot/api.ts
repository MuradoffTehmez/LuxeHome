import { runtimeEnv } from "@/lib/runtime-env";

/**
 * Telegram Bot API klienti — https://core.telegram.org/bots/api.
 *
 * Token URL-in içindədir (`/bot<token>/<method>`), ona görə nə URL, nə sorğu gövdəsi,
 * nə də Telegram-ın `description` mətni loga yazılır: nəticədə yalnız xəta kodu və
 * `retry_after` qalır. `fetch` testlər üçün ötürülə bilir — şəbəkəsiz yoxlanılır.
 */

const API_BASE = "https://api.telegram.org";
const TIMEOUT_MS = 8000;

export type TelegramApiSuccess<T> = { ok: true; result: T };
export type TelegramApiFailure = {
  ok: false;
  /** Telegram `error_code` (HTTP statusu ilə eynidir) və ya `0` — şəbəkə/vaxt aşımı. */
  code: number;
  /** 429 cavabında `parameters.retry_after` (saniyə). */
  retryAfter?: number;
  /** Qrup supergroup-a çevrilibsə yeni çat ID-si (`parameters.migrate_to_chat_id`). */
  migrateToChatId?: string;
  /** Telegram-ın təsviri — yalnız təsnifat üçün, loga yazılmır. */
  description?: string;
};
export type TelegramApiResult<T> = TelegramApiSuccess<T> | TelegramApiFailure;

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export function telegramBotToken(): string | undefined {
  return runtimeEnv("TELEGRAM_BOT_TOKEN");
}

export function isTelegramBotConfigured(): boolean {
  return Boolean(telegramBotToken());
}

/** Bot API metodunu çağırır. Heç vaxt atmır. */
export async function callTelegram<T = unknown>(
  method: string,
  params: Record<string, unknown>,
  options: { token?: string; fetcher?: FetchLike; timeoutMs?: number } = {},
): Promise<TelegramApiResult<T>> {
  const token = options.token ?? telegramBotToken();
  if (!token) return { ok: false, code: 0, description: "not-configured" };
  const fetcher = options.fetcher ?? ((input, init) => fetch(input, init));
  try {
    const response = await fetcher(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(options.timeoutMs ?? TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => null)) as {
      ok?: boolean;
      result?: T;
      error_code?: number;
      description?: string;
      parameters?: { retry_after?: number; migrate_to_chat_id?: number | string };
    } | null;
    // `ok: false` gövdəsi HTTP 200 ilə gəlmir, amma ehtiyat üçün yoxlanılır; boş gövdəli 2xx uğurdur.
    if (response.ok && body?.ok !== false) return { ok: true, result: body?.result as T };
    return {
      ok: false,
      code: body?.error_code ?? response.status,
      retryAfter: typeof body?.parameters?.retry_after === "number" ? body.parameters.retry_after : undefined,
      migrateToChatId: body?.parameters?.migrate_to_chat_id != null ? String(body.parameters.migrate_to_chat_id) : undefined,
      description: typeof body?.description === "string" ? body.description.slice(0, 200) : undefined,
    };
  } catch {
    return { ok: false, code: 0, description: "network" };
  }
}

export type InlineButton = { text: string; url?: string; callback_data?: string };
export type InlineKeyboard = InlineButton[][];

export type SendMessageInput = {
  chatId: string;
  html: string;
  buttons?: InlineKeyboard;
  silent?: boolean;
  replyToMessageId?: number;
};

export function sendMessageParams(input: SendMessageInput): Record<string, unknown> {
  return {
    chat_id: input.chatId,
    text: input.html,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(input.silent ? { disable_notification: true } : {}),
    ...(input.buttons?.length ? { reply_markup: { inline_keyboard: input.buttons } } : {}),
    ...(input.replyToMessageId ? { reply_parameters: { message_id: input.replyToMessageId, allow_sending_without_reply: true } } : {}),
  };
}

export async function sendBotMessage(input: SendMessageInput, options?: { fetcher?: FetchLike }): Promise<TelegramApiResult<{ message_id: number }>> {
  return callTelegram<{ message_id: number }>("sendMessage", sendMessageParams(input), options);
}

export async function answerCallbackQuery(id: string, text?: string): Promise<void> {
  await callTelegram("answerCallbackQuery", { callback_query_id: id, ...(text ? { text: text.slice(0, 190) } : {}) });
}

export type BotIdentity = { id: number; username?: string; first_name?: string; can_join_groups?: boolean; can_read_all_group_messages?: boolean };
export type WebhookInfo = {
  url: string;
  has_custom_certificate?: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
};
