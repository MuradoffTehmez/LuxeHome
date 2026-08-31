import { prisma } from "@/lib/prisma";
import { PROPERTY_STATUSES, SEO_SETTING_KEYS } from "@/lib/constants";
import {
  DEFAULT_MIN_PROPERTY_IMAGES,
  parseJsonObject,
  propertyContentFingerprint,
  validatePublishableProperty,
  type PublishableProperty,
} from "@/lib/serp";

type ImageInput = { url: string; alt?: string | null };

async function minimumImageCount(): Promise<number> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: SEO_SETTING_KEYS.GLOBAL } });
    const value = parseJsonObject(setting?.value, { minPropertyImages: DEFAULT_MIN_PROPERTY_IMAGES });
    return Number.isInteger(value.minPropertyImages) && value.minPropertyImages > 0
      ? value.minPropertyImages
      : DEFAULT_MIN_PROPERTY_IMAGES;
  } catch {
    return DEFAULT_MIN_PROPERTY_IMAGES;
  }
}

export async function propertyRetentionDays(): Promise<number> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: SEO_SETTING_KEYS.GLOBAL } });
    const value = parseJsonObject(setting?.value, { expiredRetentionDays: 180 });
    return Number.isInteger(value.expiredRetentionDays) && value.expiredRetentionDays > 0
      ? value.expiredRetentionDays
      : 180;
  } catch {
    return 180;
  }
}

export async function validatePropertyForPublication(
  property: PublishableProperty,
  images: ImageInput[],
  excludeId?: string,
): Promise<{ errors: Record<string, string>; fingerprint: string }> {
  const fingerprint = propertyContentFingerprint(property);
  const errors = validatePublishableProperty(property, images, await minimumImageCount());
  if (Object.keys(errors).length > 0) return { errors, fingerprint };

  const media = await prisma.media.findMany({
    where: { url: { in: images.map((image) => image.url) } },
    select: { checksum: true },
  });
  const checksums = media.map((item) => item.checksum).filter((value): value is string => Boolean(value));
  const candidates = await prisma.property.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      deletedAt: null,
      status: { notIn: [PROPERTY_STATUSES.DRAFT, PROPERTY_STATUSES.ARCHIVED] },
      OR: [
        { contentFingerprint: fingerprint },
        ...(checksums.length > 0 ? [{ images: { some: { checksum: { in: checksums } } } }] : []),
      ],
    },
    select: {
      id: true, title: true, slug: true, contentFingerprint: true, address: true,
      rooms: true, area: true, price: true, description: true,
      images: { select: { checksum: true } },
    },
    take: 10,
  });
  const normalize = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase("az-AZ");
  const duplicate = candidates.find((candidate) => {
    let score = candidate.contentFingerprint === fingerprint ? 5 : 0;
    if (checksums.some((checksum) => candidate.images.some((image) => image.checksum === checksum))) score += 4;
    if (property.address && normalize(property.address) === normalize(candidate.address)) score += 3;
    if (property.rooms === candidate.rooms) score += 1;
    if (property.area != null && candidate.area != null && Math.abs(property.area - candidate.area) <= 1) score += 1;
    if (candidate.price > 0 && Math.abs(property.price - candidate.price) / candidate.price <= 0.05) score += 1;
    if (normalize(property.description) === normalize(candidate.description)) score += 2;
    return score >= 6;
  });
  if (duplicate) {
    errors.title = `Bu elan «${duplicate.title}» ilə güclü duplikatdır. Mövcud qeydi yeniləyin və ya canonical/merge qərarı verin.`;
  }
  return { errors, fingerprint };
}

export async function validateStoredPropertyForPublication(id: string) {
  const property = await prisma.property.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      currency: true,
      typeId: true,
      cityId: true,
      districtId: true,
      rooms: true,
      area: true,
      landArea: true,
      floor: true,
      totalFloors: true,
      address: true,
      images: { select: { url: true, alt: true } },
    },
  });
  if (!property) return { errors: { id: "Elan tapılmadı." }, fingerprint: "", property: null };
  const result = await validatePropertyForPublication(property, property.images, id);
  return { ...result, property };
}
