import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { publicPropertyWhere } from "@/lib/queries";
import { computeDistrictYields, type YieldRow } from "@/lib/investment-math";

/**
 * İnvestor bölməsi (#107): rayon üzrə icarə gəlirliyi və gəlirlilik kalkulyatoru.
 *
 * Ümumi gəlirlilik = (aylıq kirayə m² medianı × 12) / satış m² medianı. Median və
 * minimum nümunə qaydası qiymət göstəricisi ilə eynidir (`price-benchmark.ts`): az
 * elandan çıxarılan faiz yanıldıcı olardı. Rəqəm saytdakı aktiv elanlardandır —
 * sövdələşmə qiyməti deyil, bu səhifədə açıq yazılır.
 */

async function loadDistrictYields(): Promise<YieldRow[]> {
  const [samples, profiles] = await Promise.all([
    prisma.property.findMany({
      where: { ...(await publicPropertyWhere()), currency: "AZN", area: { gt: 0 }, districtId: { not: null } },
      select: { districtId: true, listingType: true, pricePeriod: true, price: true, area: true },
      orderBy: { publishedAt: "desc" },
      take: 5000,
    }),
    prisma.neighborhoodProfile.findMany({
      where: { rentalYieldPercent: { gt: 0 } },
      select: { locationId: true, rentalYieldPercent: true, averagePricePerSqm: true, location: { select: { name: true, slug: true } } },
    }),
  ]);
  const districtIds = [...new Set(samples.map((sample) => sample.districtId).filter((id): id is string => Boolean(id)))];
  // D1-də 100 parametr həddi: rayon sayı adətən azdır, amma ehtiyat üçün hissələrə bölünür.
  const districts = new Map<string, { name: string; slug: string }>();
  for (let index = 0; index < districtIds.length; index += 90) {
    const rows = await prisma.location.findMany({
      where: { id: { in: districtIds.slice(index, index + 90) } },
      select: { id: true, name: true, slug: true },
    });
    for (const row of rows) districts.set(row.id, { name: row.name, slug: row.slug });
  }

  const computed = computeDistrictYields(samples, districts);
  const covered = new Set(computed.map((row) => row.districtId));
  // Elan nümunəsi çatmayan rayonda paneldə daxil edilmiş profil göstəricisi göstərilir.
  const fromProfiles: YieldRow[] = profiles
    .filter((profile) => !covered.has(profile.locationId) && profile.rentalYieldPercent)
    .map((profile) => ({
      districtId: profile.locationId,
      name: profile.location.name,
      slug: profile.location.slug,
      salePerSqm: profile.averagePricePerSqm ?? 0,
      rentPerSqm: 0,
      grossYield: Math.round((profile.rentalYieldPercent as number) * 10) / 10,
      saleSamples: 0,
      rentSamples: 0,
      source: "profile",
    }));
  return [...computed, ...fromProfiles].sort((left, right) => right.grossYield - left.grossYield);
}

export const getDistrictYields = unstable_cache(loadDistrictYields, ["district-yields-v1"], {
  tags: [PUBLIC_CACHE_TAGS.properties],
  revalidate: 3600,
});
