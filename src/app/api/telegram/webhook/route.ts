import { checkTelegramActorLimit } from "@/lib/auth/rate-limit";
import { handleTelegramUpdate, updateActorKey } from "@/lib/telegram-bot/bot";
import { processWebhookRequest } from "@/lib/telegram-bot/webhook";

/**
 * Telegram bot webhook-u. Yoxlamalar `processWebhookRequest()`-dədir; secret və ya bot token yoxdursa marşrut 404 verir.
 * `/api` kənar HTML keşindən və locale middleware-dən kənardır (`public-cache-policy.ts`, `middleware.ts`).
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return processWebhookRequest(request, { handle: handleTelegramUpdate, allow: checkTelegramActorLimit, actorKey: updateActorKey });
}
