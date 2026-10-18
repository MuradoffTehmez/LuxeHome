import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/media/upload-record";
import { runtimeEnv } from "@/lib/runtime-env";
import { timingSafeEqual } from "@/lib/auth/crypto";
import { readLimited } from "@/lib/read-limited";
import { UPDATE_RETENTION_DAYS, WEBHOOK_MAX_BYTES, isValidWebhookSecret } from "./policy";
import { parseTelegramUpdate, type TelegramUpdate } from "./updates";

/**
 * `POST /api/telegram/webhook` emalı — marşrutdan ayrıdır ki, test şəbəkəsiz və Next-siz çağıra bilsin.
 *
 * Sıra: konfiqurasiya → `X-Telegram-Bot-Api-Secret-Token` (sabit vaxtlı müqayisə) → ölçü limiti → JSON → sxem →
 * idempotentlik (`TelegramUpdate.updateId` unikal; təkrar update 200 ilə keçilir) → göndərənə görə sürət limiti → emal.
 * Emal xətası idempotentlik qeydini silir və 500 qaytarır: Telegram eyni update-i yenidən göndərir. Secret olmadan
 * heç bir update emal olunmur; gövdə, token və şəxsi məlumat loga yazılmır.
 */

export type WebhookDeps = {
  handle: (update: TelegramUpdate, now: Date) => Promise<void>;
  allow: (actorKey: string) => Promise<boolean>;
  actorKey: (update: TelegramUpdate) => string | null;
  now?: Date;
  secret?: string;
};

export async function processWebhookRequest(request: Request, deps: WebhookDeps): Promise<Response> {
  const secret = deps.secret ?? runtimeEnv("TELEGRAM_WEBHOOK_SECRET");
  if (!runtimeEnv("TELEGRAM_BOT_TOKEN") || !isValidWebhookSecret(secret)) return new Response(null, { status: 404 });

  const given = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  const encoder = new TextEncoder();
  if (!timingSafeEqual(encoder.encode(given), encoder.encode(secret))) return new Response(null, { status: 401 });

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > WEBHOOK_MAX_BYTES) return new Response(null, { status: 413 });
  const raw = await readLimited(request, WEBHOOK_MAX_BYTES);
  if (!raw) return new Response(null, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return new Response(null, { status: 400 });
  }
  const update = parseTelegramUpdate(json);
  // Tanınmayan/pozulmuş update 200 ilə qəbul olunur — 4xx cavabı Telegram-ı onu dəfələrlə təkrarlamağa məcbur edərdi.
  if (!update) return Response.json({ ok: true, ignored: "invalid" });

  try {
    await prisma.telegramUpdate.create({ data: { updateId: update.update_id } });
  } catch (error) {
    if (isUniqueViolation(error)) return Response.json({ ok: true, ignored: "duplicate" });
    console.error("[telegram] webhook idempotentlik qeydi yazılmadı:", error instanceof Error ? error.name : "unknown");
    return new Response(null, { status: 500 });
  }

  const actor = deps.actorKey(update);
  if (actor && !(await deps.allow(actor))) return Response.json({ ok: true, ignored: "rate-limited" });

  try {
    await deps.handle(update, deps.now ?? new Date());
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[telegram] update emal olunmadı:", error instanceof Error ? error.name : "unknown");
    await prisma.telegramUpdate.delete({ where: { updateId: update.update_id } }).catch(() => undefined);
    return new Response(null, { status: 500 });
  }
}

/** Baxım: idempotentlik qeydləri qısa saxlanılır — Telegram update-i ən çox 24 saat təkrarlayır. */
export async function purgeTelegramUpdates(now: Date = new Date()): Promise<number> {
  const result = await prisma.telegramUpdate.deleteMany({ where: { receivedAt: { lt: new Date(now.getTime() - UPDATE_RETENTION_DAYS * 24 * 60 * 60 * 1000) } } });
  return result.count;
}
