import { z } from "zod";

/**
 * Telegram `Update` obyektinin botun emal etdiyi hissəsi. Naməlum sahələr atılır; ID-lər JSON-da rəqəmdir
 * (çat ID-si 52 bitə sığır, `Number`-da itki yoxdur) və emaldan əvvəl mətnə çevrilir — bazada `String` saxlanılır.
 */

const id = z.number().int().safe();

const user = z.object({
  id,
  is_bot: z.boolean().optional(),
  first_name: z.string().max(256).optional(),
  username: z.string().max(64).optional(),
  language_code: z.string().max(16).optional(),
});

const chat = z.object({
  id,
  type: z.enum(["private", "group", "supergroup", "channel"]),
  title: z.string().max(256).optional(),
});

const message = z.object({
  message_id: id,
  from: user.optional(),
  chat,
  text: z.string().max(4096).optional(),
  migrate_to_chat_id: id.optional(),
});

const chatMember = z.object({
  status: z.string().max(32),
  can_post_messages: z.boolean().optional(),
  can_send_messages: z.boolean().optional(),
});

export const telegramUpdateSchema = z.object({
  update_id: z.number().int().nonnegative().max(2_147_483_647),
  message: message.optional(),
  callback_query: z
    .object({
      id: z.string().max(128),
      from: user,
      message: z.object({ message_id: id, chat }).optional(),
      data: z.string().max(64).optional(),
    })
    .optional(),
  my_chat_member: z
    .object({
      chat,
      from: user,
      new_chat_member: chatMember,
    })
    .optional(),
});

export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;
export type TelegramMessage = z.infer<typeof message>;
export type TelegramUser = z.infer<typeof user>;

export function parseTelegramUpdate(value: unknown): TelegramUpdate | null {
  const parsed = telegramUpdateSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
