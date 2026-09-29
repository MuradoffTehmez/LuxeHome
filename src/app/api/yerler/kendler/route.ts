import { NextResponse } from "next/server";

import { byAzerbaijaniName } from "@/lib/az-collation";
import { LOCATION_KINDS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/**
 * Seçilmiş şəhər/rayonun kəndləri — elan formasının «Kənd» sahəsi üçün.
 *
 * Ölkə üzrə ~3 600 rəsmi kənd (Ünvan Reyestri) forma seçimlərinə bir dəfədə
 * düşsəydi, hər forma səhifəsi yüzlərlə KB artıq payload daşıyardı. Forma
 * rayon seçiləndə yalnız onun kəndlərini buradan yükləyir.
 *
 * Kənd birbaşa rayonun (`CITY`) uşağıdır; Bakıda kənd yoxdur. Məlumat ictimaidir
 * (yer adları), ona görə sessiya tələb olunmur və cavab CDN-də keşlənir.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cityId = new URL(request.url).searchParams.get("seher")?.trim() ?? "";
  if (!cityId || cityId.length > 64) {
    return NextResponse.json({ error: "seher parametri tələb olunur" }, { status: 400 });
  }

  const villages = await prisma.location.findMany({
    where: { kind: LOCATION_KINDS.VILLAGE, parentId: cityId },
    select: { id: true, name: true, slug: true, kind: true, parentId: true, officialCode: true },
  });
  const sorted = villages
    .sort(byAzerbaijaniName)
    // Formanın `LocationFieldPlace` forması: kəndin kök şəhəri valideynidir.
    .map((village) => ({ ...village, cityId: village.parentId, group: null }));

  return NextResponse.json(sorted, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
