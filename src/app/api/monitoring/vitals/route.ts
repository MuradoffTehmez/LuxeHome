import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/request-origin";
import { checkMonitoringLimit, clientIp } from "@/lib/auth/rate-limit";
import { sanitizeTelemetryPath, WEB_VITAL_NAMES } from "@/lib/monitoring";

const schema = z.object({
  name: z.enum(WEB_VITAL_NAMES),
  value: z.number().finite().nonnegative().max(10_000_000),
  rating: z.enum(["good", "needs-improvement", "poor"]),
  path: z.string().max(1_000),
  navigationType: z.string().max(80).optional(),
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

  await prisma.webVitalMetric.create({
    data: {
      ...parsed.data,
      path: sanitizeTelemetryPath(parsed.data.path),
      navigationType: parsed.data.navigationType || null,
    },
  });
  return NextResponse.json({ ok: true }, { status: 202 });
}
