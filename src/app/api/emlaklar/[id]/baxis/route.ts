import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { publicPropertyWhere } from "@/lib/queries";
import { checkListingViewLimit, clientIp } from "@/lib/auth/rate-limit";
import { SameOriginError, assertSameOrigin } from "@/lib/request-origin";
import { isLikelyBot, recordView } from "@/lib/view-counter";

export const dynamic = "force-dynamic";

/**
 * Elan baxışı brauzerdən beacon ilə yazılır (#177). Əvvəllər sayğac detal səhifəsinin
 * render-ində artırılırdı və səhifə buna görə kənar keşə düşə bilmirdi (keşdən verilən
 * cavab sayğacı işə salmazdı). Qayda WhatsApp klikindəki kimidir: same-origin, bot filtri,
 * IP limiti; cavab həmişə 204-dür. JS işlətməyən botlar artıq ümumiyyətlə sayılmır.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin();
  } catch (error) {
    if (error instanceof SameOriginError) return new NextResponse(null, { status: 403 });
    throw error;
  }
  const { id } = await params;
  const userAgent = request.headers.get("user-agent");
  if (id.length > 64 || isLikelyBot(userAgent)) return new NextResponse(null, { status: 204 });
  if (!(await checkListingViewLimit(clientIp(await headers())))) return new NextResponse(null, { status: 204 });

  const property = await prisma.property.findFirst({ where: { ...(await publicPropertyWhere()), id }, select: { id: true } });
  if (property) recordView("property", property.id, userAgent);
  return new NextResponse(null, { status: 204 });
}
