import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/request-origin";
import { checkMonitoringLimit, clientIp } from "@/lib/auth/rate-limit";
import { sanitizeTelemetryMessage, sanitizeTelemetryPath } from "@/lib/monitoring";

const schema = z.object({
  message: z.string().max(2_000),
  digest: z.string().max(160).optional(),
  path: z.string().max(1_000).optional(),
  source: z.enum(["client", "global-error", "route-error"]).default("client"),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
  } catch {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  if (!(await checkMonitoringLimit(clientIp(new Headers(request.headers))))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  await prisma.clientErrorEvent.create({
    data: {
      message: sanitizeTelemetryMessage(parsed.data.message),
      digest: parsed.data.digest?.slice(0, 160) || null,
      path: sanitizeTelemetryPath(parsed.data.path),
      source: parsed.data.source,
    },
  });
  return NextResponse.json({ ok: true }, { status: 202 });
}
