import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, ACTIVE_REPORT_STATUSES } from "@/lib/constants";
import { findManyInChunks } from "@/lib/d1-chunks";
import { assessPropertyPrice } from "@/lib/price-benchmark";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  DUPLICATE_TEXT_MIN_LENGTH,
  LOW_PRICE_PERCENT,
  NEW_ACCOUNT_DAYS,
  detectContactInText,
  riskLevel,
  scoreRisk,
  type RiskFlag,
  type RiskLevel,
} from "@/lib/moderation/risk-signals";

/**
 * Avtomatik moderasiya köməkçisi (#159) — elanın risk siqnallarını bazadan toplayır.
 *
 * Kabinetdən saxlanan hər elan üçün çağırılır (`refreshListingRisk`). Şirkət (STAFF)
 * elanları yoxlanılmır. Nəticə `Property.riskScore`/`riskFlags`-a yazılır və
 * moderasiya növbəsində göstərilir; `hold` səviyyəsində elan avtomatik dərc olunmur.
 *
 * Hesablama heç vaxt atmır — moderasiya köməkçisi elanın saxlanmasını sındırmamalıdır.
 * Amma nəticəsi bilinməyən yoxlama «təmiz» sayılmır: xəta olsa `hold` qaytarılır və elan
 * moderatorun növbəsinə düşür (keçici D1 xətası avtomatik moderasiyanı yan keçməsin).
 */

export type ListingRisk = { score: number; level: RiskLevel; flags: RiskFlag[] };

const NO_RISK: ListingRisk = { score: 0, level: "none", flags: [] };
/** Yoxlama alınmadı — nəticə bilinmir, elan dərc olunmadan moderatora gedir. */
const UNKNOWN_RISK: ListingRisk = { score: 0, level: "hold", flags: [] };
const DAY = 86_400_000;

export async function assessListingRisk(propertyId: string, now = new Date()): Promise<ListingRisk> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      area: true,
      listingType: true,
      typeId: true,
      cityId: true,
      districtId: true,
      currency: true,
      pricePeriod: true,
      authorId: true,
      author: { select: { accountType: true, createdAt: true } },
      images: { select: { url: true } },
    },
  });
  if (!property?.authorId || !property.author || property.author.accountType === ACCOUNT_TYPES.STAFF) return NO_RISK;
  const authorId = property.authorId;

  const flags: RiskFlag[] = [];

  // 1. Bazardan xeyli ucuz — median m² qiyməti ilə müqayisə (`price-benchmark.ts`).
  const price = await assessPropertyPrice(property).catch(() => null);
  if (price && price.diffPercent <= LOW_PRICE_PERCENT) flags.push({ code: "LOW_PRICE", value: price.diffPercent });

  // 2. Nömrə, e-poçt və ya link mətndə — platformanın əlaqə qaydasını yan keçmək.
  if (detectContactInText(`${property.title}\n${property.description}`).length > 0) flags.push({ code: "CONTACT_IN_TEXT" });

  // 3. Başqa hesabın elanında işlənən foto — eyni bayt izi (`Media.checksum`).
  const duplicatePhotoListings = await countForeignPhotoListings(
    property.images.map((image) => image.url),
    authorId,
  );
  if (duplicatePhotoListings > 0) flags.push({ code: "DUPLICATE_PHOTOS", value: duplicatePhotoListings });

  // 4. Başqa hesabın elanından hərfi köçürülmüş təsvir.
  const description = property.description.trim();
  if (description.length >= DUPLICATE_TEXT_MIN_LENGTH) {
    const copies = await prisma.property.count({
      where: {
        description: property.description,
        deletedAt: null,
        OR: [{ authorId: null }, { authorId: { not: authorId } }],
      },
    });
    if (copies > 0) flags.push({ code: "DUPLICATE_TEXT", value: copies });
  }

  // 5. Təzə açılmış hesab — tək başına növbəyə salmır, digər siqnalı gücləndirir.
  if (now.getTime() - property.author.createdAt.getTime() < NEW_ACCOUNT_DAYS * DAY) flags.push({ code: "NEW_ACCOUNT" });

  // 6. Ziyarətçi şikayətləri.
  const reports = await prisma.listingReport.count({ where: { propertyId, status: { in: [...ACTIVE_REPORT_STATUSES] } } });
  if (reports > 0) flags.push({ code: "OPEN_REPORTS", value: reports });

  const score = scoreRisk(flags);
  return { score, level: riskLevel(score), flags };
}

/** Bu elanın fotolarından hər hansı biri başqa müəllifin neçə elanında işlənir. */
async function countForeignPhotoListings(urls: string[], authorId: string): Promise<number> {
  if (urls.length === 0) return 0;
  const own = await findManyInChunks(urls, 0, (chunk) =>
    prisma.media.findMany({ where: { url: { in: chunk }, checksum: { not: null } }, select: { checksum: true } }),
  );
  const checksums = [...new Set(own.map((item) => item.checksum).filter((value): value is string => Boolean(value)))];
  if (checksums.length === 0) return 0;

  const twins = await findManyInChunks(checksums, 0, (chunk) =>
    prisma.media.findMany({ where: { checksum: { in: chunk }, url: { notIn: urls } }, select: { url: true } }),
  );
  if (twins.length === 0) return 0;

  const images = await findManyInChunks(
    twins.map((item) => item.url),
    0,
    (chunk) => prisma.propertyImage.findMany({ where: { url: { in: chunk } }, select: { propertyId: true } }),
  );
  const propertyIds = [...new Set(images.map((image) => image.propertyId))];
  if (propertyIds.length === 0) return 0;

  // Şirkətin öz elanı (müəllifsiz) da «başqasınındır» — `authorId <> X` SQL-də NULL-u atır,
  // fırıldaqçı ofisin fotolarını köçürəndə tutulmazdı.
  const foreign = await findManyInChunks(propertyIds, 2, (chunk) =>
    prisma.property.findMany({
      where: { id: { in: chunk }, deletedAt: null, OR: [{ authorId: null }, { authorId: { not: authorId } }] },
      select: { id: true },
    }),
  );
  return foreign.length;
}

/** Riski hesablayıb elana yazır. Xəta olsa elan saxlanması sınmır — `hold` qaytarılır. */
export async function refreshListingRisk(propertyId: string): Promise<ListingRisk> {
  try {
    const risk = await assessListingRisk(propertyId);
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        riskScore: risk.score,
        riskFlags: risk.flags.length ? JSON.stringify(risk.flags) : null,
        riskCheckedAt: new Date(),
      },
    });
    return withModerationFlag(risk);
  } catch (error) {
    console.error("[moderation] risk hesablanmadı:", error instanceof Error ? error.message : error);
    return withModerationFlag(UNKNOWN_RISK);
  }
}

/**
 * Avtomatik moderasiya söndürülübsə (#242) siqnallar yazılır və növbədə görünür, amma elan
 * saxlanmır: `hold` → `review`. Bayraq oxunmasa (`getSetting` atmır, defolt açıqdır) qayda dəyişmir.
 */
async function withModerationFlag(risk: ListingRisk): Promise<ListingRisk> {
  if (risk.level !== "hold") return risk;
  const enabled = await isFeatureEnabled("AUTO_MODERATION").catch(() => true);
  return enabled ? risk : { ...risk, level: "review" };
}
