"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { LISTING_TYPES, PRICE_PERIODS } from "@/lib/constants";
import { SameOriginError, assertSameOrigin } from "@/lib/request-origin";
import { checkValuationLimit, clientIp } from "@/lib/auth/rate-limit";
import { estimateValue, type ValueEstimate } from "@/lib/price-benchmark";
import { locationBelongsToCity } from "@/lib/accounts/property-submission";

/**
 * «Evimi qiymətləndir» (#105). Yalnız oxuyur — lead yaratmır; nəticədən sonra ziyarətçi
 * dəqiq qiymətləndirmə üçün müraciət formasını doldurur (`source = OWNER`).
 * Anonim çağırış olduğu üçün mənbə yoxlaması və öz sürət limiti var.
 */

const inputSchema = z.object({
  listingType: z.enum([LISTING_TYPES.SALE, LISTING_TYPES.RENT]),
  typeSlug: z.string().trim().min(1).max(90),
  citySlug: z.string().trim().min(1).max(120),
  districtSlug: z.string().trim().max(120).optional().or(z.literal("")),
  area: z.coerce.number().min(10).max(100_000),
});

export type ValuationInput = z.input<typeof inputSchema>;

export type ValuationResult =
  | { status: "ok"; estimate: ValueEstimate }
  | { status: "insufficient" }
  | { status: "invalid" }
  | { status: "rateLimited" };

export async function estimateOwnerProperty(input: ValuationInput): Promise<ValuationResult> {
  try {
    await assertSameOrigin();
  } catch (error) {
    if (error instanceof SameOriginError) return { status: "invalid" };
    throw error;
  }
  if (!(await checkValuationLimit(clientIp(await headers())))) return { status: "rateLimited" };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid" };

  const [type, city, district] = await Promise.all([
    prisma.propertyType.findUnique({ where: { slug: parsed.data.typeSlug }, select: { id: true } }),
    prisma.location.findUnique({ where: { slug: parsed.data.citySlug }, select: { id: true } }),
    parsed.data.districtSlug
      ? prisma.location.findUnique({
          where: { slug: parsed.data.districtSlug },
          select: { id: true, kind: true, parentId: true, parent: { select: { parentId: true } } },
        })
      : null,
  ]);
  if (!type || !city) return { status: "invalid" };
  // Başqa şəhərin rayonu göndərilibsə rayon nəzərə alınmır — şəhər səviyyəsində hesablanır.
  const districtId = district && locationBelongsToCity(district, city.id) ? district.id : null;

  const estimate = await estimateValue({
    listingType: parsed.data.listingType,
    typeId: type.id,
    cityId: city.id,
    districtId,
    currency: "AZN",
    pricePeriod: parsed.data.listingType === LISTING_TYPES.RENT ? PRICE_PERIODS.MONTH : null,
    area: parsed.data.area,
  });
  return estimate ? { status: "ok", estimate } : { status: "insufficient" };
}
