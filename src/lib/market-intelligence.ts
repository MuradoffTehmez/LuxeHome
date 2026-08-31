import { prisma } from "@/lib/prisma";
import { publicPropertyWhere } from "@/lib/queries";

export type MarketPropertyTypeShare = { name: string; count: number; percent: number };
export type MarketReport = {
  slug: string;
  name: string;
  description: string | null;
  averagePrice: number | null;
  medianPrice: number | null;
  averagePricePerSqm: number | null;
  annualChangePercent: number | null;
  inventory: number;
  typeDistribution: MarketPropertyTypeShare[];
  dataSource: string;
  methodology: string;
  measuredAt: Date;
};

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

function distribution(properties: Array<{ typeId: string; type: { name: string } }>): MarketPropertyTypeShare[] {
  const counts = new Map<string, { name: string; count: number }>();
  for (const property of properties) {
    const current = counts.get(property.typeId) ?? { name: property.type.name, count: 0 };
    current.count += 1;
    counts.set(property.typeId, current);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).map((item) => ({ ...item, percent: properties.length ? Math.round(item.count / properties.length * 1000) / 10 : 0 }));
}

export async function getMarketReport(slug: string): Promise<MarketReport | null> {
  const district = slug === "baki" ? null : await prisma.location.findFirst({ where: { slug, kind: "DISTRICT", neighborhoodProfile: { isNot: null } }, include: { neighborhoodProfile: true } });
  if (slug !== "baki" && !district?.neighborhoodProfile) return null;
  const properties = await prisma.property.findMany({
    where: { ...publicPropertyWhere(), ...(district ? { districtId: district.id } : {}) },
    select: { price: true, area: true, typeId: true, type: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });
  const prices = properties.map((item) => item.price).filter((value) => value > 0);
  const perSqm = properties.filter((item) => item.area && item.area > 0).map((item) => item.price / item.area!);
  const profile = district?.neighborhoodProfile;
  const measuredAt = profile?.measuredAt ?? new Date();
  return {
    slug,
    name: district?.name ?? "Bakı",
    description: profile?.description ?? null,
    averagePrice: profile?.averagePrice ?? (prices.length ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null),
    medianPrice: profile?.medianPrice ?? median(prices),
    averagePricePerSqm: profile?.averagePricePerSqm ?? (perSqm.length ? perSqm.reduce((sum, value) => sum + value, 0) / perSqm.length : null),
    annualChangePercent: profile?.annualChangePercent ?? null,
    inventory: properties.length,
    typeDistribution: distribution(properties),
    dataSource: profile?.dataSource || "Luxe Home Estate ictimai elan inventarı",
    methodology: `Göstəricilər ${properties.length} cari, silinməmiş və demo olmayan ictimai elanın snapshot-u əsasında hesablanır. Median sıralanmış qiymətlərin orta nöqtəsi, m² qiyməti isə sahəsi göstərilən elanlar üzrə orta göstəricidir. Bu məlumat rəsmi qiymətləndirmə deyil.`,
    measuredAt,
  };
}

export async function getMarketReportIndex() {
  return prisma.neighborhoodProfile.findMany({
    where: { measuredAt: { not: null }, dataSource: { not: null } },
    select: { location: { select: { slug: true, name: true } }, medianPrice: true, averagePricePerSqm: true, annualChangePercent: true, measuredAt: true, dataSource: true },
    orderBy: { location: { order: "asc" } },
  });
}
