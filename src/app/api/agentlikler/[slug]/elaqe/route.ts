import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { demoWhere } from "@/lib/demo-content";
import { isPhoneLike } from "@/lib/accounts/profile-fields";
import { checkContactRevealLimit, clientIp } from "@/lib/auth/rate-limit";
import { SameOriginError, assertSameOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * Agentlik profilindəki «Nömrəni göstər» — ofis telefonu, WhatsApp və e-poçt.
 *
 * Elan əlaqəsi ilə eyni qayda (`/api/emlaklar/<id>/elaqe`): HTML maskalı nömrə
 * daşıyır, tam əlaqə yalnız same-origin + IP limiti ilə verilir. Yalnız ictimai
 * (təsdiqlənmiş, aktiv) agentlik. Telefon sahəsində telefon olmayan köhnə dəyər
 * (məs. e-poçt) telefon kimi qaytarılmır.
 *
 * E-poçt yalnız agentliyin özünün ictimai əlaqə kimi yazdığı dəyərdən gəlir
 * (`Agency.email` və ya telefon sahəsinə yazılmış e-poçt). Hesabın giriş e-poçtu
 * heç vaxt açılmır — o, ofis əlaqəsi deyil, giriş məlumatıdır.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await assertSameOrigin();
  } catch (error) {
    if (error instanceof SameOriginError) return NextResponse.json({ error: "origin" }, { status: 403, headers: NO_STORE });
    throw error;
  }
  if (!(await checkContactRevealLimit(clientIp(await headers())))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: NO_STORE });
  }

  const { slug } = await params;
  const agency = slug.length <= 200
    ? await prisma.agency.findFirst({
        where: { slug, isVerified: true, ...(await demoWhere()), user: { isActive: true } },
        select: { id: true, phone: true, whatsapp: true, email: true },
      })
    : null;
  if (!agency) return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });

  // Filialın nömrəsi (#157): `?ofis=<id>` — yalnız həmin agentliyin filialı.
  const officeId = new URL(request.url).searchParams.get("ofis");
  if (officeId) {
    const office = officeId.length <= 40
      ? await prisma.agencyOffice.findFirst({ where: { id: officeId, agencyId: agency.id }, select: { phone: true } })
      : null;
    if (!office) return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
    return NextResponse.json(
      { phone: isPhoneLike(office.phone) ? office.phone!.trim() : null, whatsapp: null, email: null },
      { headers: NO_STORE },
    );
  }

  const phone = isPhoneLike(agency.phone) ? agency.phone!.trim() : null;
  const misplacedEmail = agency.phone?.includes("@") ? agency.phone.trim() : null;
  return NextResponse.json(
    {
      phone,
      whatsapp: isPhoneLike(agency.whatsapp) ? agency.whatsapp!.trim() : null,
      email: agency.email?.trim() || misplacedEmail,
    },
    { headers: NO_STORE },
  );
}
