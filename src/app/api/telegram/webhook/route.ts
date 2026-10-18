import { NextResponse } from "next/server";
import { completeTelegramLink, isTelegramNotificationsConfigured, isValidWebhookSecret, sendTelegramToChat } from "@/lib/telegram-notifications";
import { parseStartCommand } from "@/lib/telegram-link-policy";

export const dynamic = "force-dynamic";

/** Bot cavabları qısadır və üç dildə bir mesajdadır — istifadəçinin dili bu mərhələdə məlum deyil. */
const REPLY = {
  linked: "✅ Luxe Home Estate bildirişləri bu çata qoşuldu.\nNotifications are now connected.\nУведомления подключены.",
  invalid: "⚠️ Link etibarsızdır və ya vaxtı keçib. Kabinetdən yenisini yaradın.\nThe link is invalid or expired.\nСсылка недействительна или устарела.",
} as const;

/**
 * Telegram bot webhook-u: yalnız `X-Telegram-Bot-Api-Secret-Token` başlığı uyğun gələn sorğu qəbul olunur
 * (`setWebhook` çağırışında `secret_token` ilə verilir). Tanınmayan yeniləmə 200 ilə səssizcə atılır —
 * başqa status Telegram-ı eyni yeniləməni təkrar göndərməyə məcbur edərdi.
 */
export async function POST(request: Request) {
  if (!isTelegramNotificationsConfigured()) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  if (!isValidWebhookSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let update: unknown;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  const command = parseStartCommand(update);
  if (!command) return NextResponse.json({ ok: true });

  const result = await completeTelegramLink(command).catch((error: unknown) => {
    console.error("[telegram] bağlama alınmadı:", error instanceof Error ? error.name : "unknown");
    return "invalid" as const;
  });
  await sendTelegramToChat(command.chatId, REPLY[result]);
  return NextResponse.json({ ok: true });
}
