import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPropertyPublisherContact } from "@/lib/queries";
import { resolveListingPublisher } from "@/lib/accounts/listing-publisher";
import { checkContactRevealLimit, clientIp } from "@/lib/auth/rate-limit";
import { SameOriginError, assertSameOrigin } from "@/lib/request-origin";
import { recordListingStat } from "@/lib/listing-stats";
import { isLikelyBot } from "@/lib/view-counter";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * «Nömrəni göstər» — elan sahibinin telefonu və e-poçtu.
 *
 * Səhifənin HTML-i maskalı nömrə daşıyır; tam əlaqə yalnız bu ünvandan, IP limiti və
 * same-origin yoxlaması ilə verilir. Beləliklə HTML-i süzən bot sahiblərin nömrəsini
 * toplaya bilmir. POST-dur: GET olsaydı keş, prefetch və ya kənar `<img>` onu tetikləyərdi.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSameOrigin();
  } catch (error) {
    if (error instanceof SameOriginError) return NextResponse.json({ error: "origin" }, { status: 403, headers: NO_STORE });
    throw error;
  }
  if (!(await checkContactRevealLimit(clientIp(await headers())))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: NO_STORE });
  }

  const { id } = await params;
  const property = id.length <= 64 ? await getPropertyPublisherContact(id) : null;
  if (!property) return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });

  const publisher = resolveListingPublisher(property.author);
  // Şirkət elanının əlaqəsi saytda onsuz da açıqdır — bu ünvan yalnız ictimai hesablar üçündür.
  if (publisher.kind === "company") return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });

  // Kabinet analitikası (#161): sahib neçə nəfərin nömrəsini açdığını görür.
  if (!isLikelyBot(request.headers.get("user-agent"))) recordListingStat(property.id, "contactReveals");
  return NextResponse.json({ phone: publisher.phone, email: publisher.email }, { headers: NO_STORE });
}
