import { NextResponse } from "next/server";
import { getResend } from "@/lib/email";
import { recordEmailActivity } from "@/lib/email-activity";
import { runtimeEnv } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const resend = getResend();
  const webhookSecret = runtimeEnv("RESEND_WEBHOOK_SECRET");
  if (!resend || !webhookSecret) {
    return NextResponse.json({ error: "Webhook konfiqurasiya edilməyib" }, { status: 503 });
  }

  const payload = await request.text();
  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    });
  } catch {
    return NextResponse.json({ error: "Webhook imzası düzgün deyil" }, { status: 400 });
  }

  if (!event.type.startsWith("email.")) return NextResponse.json({ ok: true });
  const data = event.data as {
    email_id: string;
    from?: string;
    to?: string[];
    subject?: string;
    message_id?: string;
    attachments?: unknown[];
  };
  await recordEmailActivity({
    providerId: data.email_id,
    direction: event.type === "email.received" ? "INBOUND" : "OUTBOUND",
    eventType: event.type,
    fromAddress: data.from,
    toAddresses: data.to,
    subject: data.subject,
    messageId: data.message_id,
    attachmentCount: data.attachments?.length ?? 0,
    lastEventAt: new Date(event.created_at),
  });

  return NextResponse.json({ ok: true });
}
