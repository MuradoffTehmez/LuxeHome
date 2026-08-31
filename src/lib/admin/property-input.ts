import { PROPERTY_STATUSES } from "@/lib/constants";
import type { PropertyInput } from "./schemas";
import * as form from "./form";
import { propertySearchText } from "@/lib/search-normalization";
import type { PaymentFlags } from "./payment-features";
import { DEFAULT_EXPIRED_RETENTION_DAYS, propertyContentFingerprint } from "@/lib/serp";

/**
 * Əmlak formasının saf (baza ilə əlaqəsiz) hissəsi.
 *
 * Action-dan ayrıdır ki, workerd testləri `FormData` → sxem yolunu birbaşa yoxlaya
 * bilsin: forma sahəsinin adı ilə action-ın oxuduğu ad arasındakı uyğunsuzluq
 * ən bahalı səhv növüdür — brauzerdə səssiz «heç nə olmur» kimi görünür.
 */

export function readPropertyForm(formData: FormData): PropertyInput {
  return {
    title: form.text(formData, "title"),
    slug: form.text(formData, "slug"),
    description: form.text(formData, "description"),

    listingType: form.text(formData, "listingType"),
    status: form.text(formData, "status"),

    price: form.number(formData, "price") ?? 0,
    currency: form.text(formData, "currency"),
    pricePeriod: form.optionalText(formData, "pricePeriod"),

    typeId: form.text(formData, "typeId"),
    cityId: form.text(formData, "cityId"),
    districtId: form.optionalText(formData, "districtId"),
    metroId: form.optionalText(formData, "metroId"),
    projectId: form.optionalText(formData, "projectId"),
    address: form.optionalText(formData, "address"),
    latitude: form.number(formData, "latitude"),
    longitude: form.number(formData, "longitude"),

    rooms: form.integer(formData, "rooms"),
    bedrooms: form.integer(formData, "bedrooms"),
    bathrooms: form.integer(formData, "bathrooms"),
    area: form.number(formData, "area"),
    landArea: form.number(formData, "landArea"),
    floor: form.integer(formData, "floor"),
    totalFloors: form.integer(formData, "totalFloors"),

    renovation: form.optionalText(formData, "renovation"),
    documentStatus: form.optionalText(formData, "documentStatus"),
    buildingType: form.optionalText(formData, "buildingType"),

    videoUrl: form.optionalText(formData, "videoUrl"),
    isFeatured: form.boolean(formData, "isFeatured"),
    featuredUntil: form.optionalText(formData, "featuredUntil"),
    reservationEnabled: form.boolean(formData, "reservationEnabled"),
    assignedAgentId: form.optionalText(formData, "assignedAgentId"),

    metaTitle: form.optionalText(formData, "metaTitle"),
    metaDescription: form.optionalText(formData, "metaDescription"),
    noIndex: form.boolean(formData, "noIndex"),
    canonicalUrl: form.optionalText(formData, "canonicalUrl"),
    ogTitle: form.optionalText(formData, "ogTitle"),
    ogDescription: form.optionalText(formData, "ogDescription"),
    ogImage: form.optionalText(formData, "ogImage"),

    featureIds: form.list(formData, "featureIds"),
  } as PropertyInput;
}

/**
 * Elanın sahələrini Prisma-nın gözlədiyi formaya salır.
 *
 * `payment` seçilmiş `PAYMENT` qrupu xüsusiyyətlərindən törədilir
 * (`src/lib/admin/payment-features.ts`). Formada ayrıca checkbox yoxdur:
 * eyni faktın iki yerdə saxlanılması onların bir-birinə ziddiyyət təşkil
 * etməsinə gətirirdi.
 */
export function propertyData(input: PropertyInput, payment: PaymentFlags) {
  return {
    title: input.title,
    description: input.description,
    searchText: propertySearchText(input),
    listingType: input.listingType,
    status: input.status,
    price: input.price,
    currency: input.currency,
    // Satış elanında dövr sahəsi məna daşımır
    pricePeriod: input.listingType === "RENT" ? input.pricePeriod : null,
    typeId: input.typeId,
    cityId: input.cityId,
    districtId: input.districtId,
    metroId: input.metroId,
    projectId: input.projectId,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    rooms: input.rooms,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    area: input.area,
    landArea: input.landArea,
    floor: input.floor,
    totalFloors: input.totalFloors,
    renovation: input.renovation,
    documentStatus: input.documentStatus,
    buildingType: input.buildingType,
    videoUrl: input.videoUrl,
    mortgageAvailable: payment.mortgageAvailable,
    installmentAvailable: payment.installmentAvailable,
    isFeatured: input.isFeatured,
    featuredUntil: input.isFeatured ? input.featuredUntil : null,
    reservationEnabled: input.reservationEnabled,
    assignedAgentId: input.assignedAgentId,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    noIndex: input.noIndex,
    canonicalUrl: input.canonicalUrl,
    ogTitle: input.ogTitle,
    ogDescription: input.ogDescription,
    ogImage: input.ogImage,
    contentFingerprint: propertyContentFingerprint(input),
  };
}

/**
 * Dərc tarixi.
 *
 * Bir dəfə qoyulur: elan sonradan «satıldı» və ya «arxiv» olanda tarix silinmir,
 * çünki sitemap və struktur data ilk dərc anını göstərməlidir.
 */
export function nextPublishedAt(status: string, current: Date | null): Date | null {
  if (status !== PROPERTY_STATUSES.PUBLISHED) return current;
  return current ?? new Date();
}

export function propertyLifecycleData(
  status: string,
  current: { publishedAt: Date | null; closedAt?: Date | null },
  retentionDays = DEFAULT_EXPIRED_RETENTION_DAYS,
) {
  const isClosed = [
    PROPERTY_STATUSES.SOLD,
    PROPERTY_STATUSES.RENTED,
    PROPERTY_STATUSES.ARCHIVED,
  ].includes(status as never);
  const closedAt = isClosed ? (current.closedAt ?? new Date()) : current.closedAt ?? null;
  const retentionUntil = isClosed
    ? new Date(closedAt!.getTime() + retentionDays * 86_400_000)
    : null;
  return {
    publishedAt: nextPublishedAt(status, current.publishedAt),
    closedAt,
    retentionUntil,
  };
}
