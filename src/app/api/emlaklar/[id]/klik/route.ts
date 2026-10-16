import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { publicPropertyWhere } from "@/lib/queries";
import { checkListingClickLimit, clientIp } from "@/lib/auth/rate-limit";
import { SameOriginError, assertSameOrigin } from "@/lib/request-origin";
import { recordListingStat } from "@/lib/listing-stats";
import { isLikelyBot } from "@/lib/view-counter";

export const dynamic = "force-dynamic";

/**
 * Elanın WhatsApp (#161) və Telegram (#208) klikini sahibin kabinet analitikasına yazır. Kanal
 * `?kanal=telegram` ilə gəlir, yoxdursa WhatsApp. Cavab həmişə 204-dür — klik istifadəçinin işini
 * gözlətmir; same-origin, IP limiti və bot filtri sayğacı qoruyur.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin();
  } catch (error) {
    if (error instanceof SameOriginError) return new NextResponse(null, { status: 403 });
    throw error;
  }
  const { id } = await params;
  if (id.length > 64 || isLikelyBot(request.headers.get("user-agent"))) return new NextResponse(null, { status: 204 });
  if (!(await checkListingClickLimit(clientIp(await headers())))) return new NextResponse(null, { status: 204 });

  const property = await prisma.property.findFirst({ where: { ...(await publicPropertyWhere()), id }, select: { id: true } });
  const channel = new URL(request.url).searchParams.get("kanal") === "telegram" ? "telegramClicks" : "whatsappClicks";
  if (property) recordListingStat(property.id, channel);
  return new NextResponse(null, { status: 204 });
}
