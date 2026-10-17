import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { buildCityFilterTree } from "@/lib/location-tree";
import { normalizeSearchText } from "@/lib/search-normalization";
import {
  AGENCY_MEMBER_PERMISSIONS,
  CRM_PAGE_SIZE,
  LISTING_TYPES,
  LOCATION_CHILD_KINDS,
  LOCATION_KINDS,
  PUBLIC_PROPERTY_STATUSES,
  RENOVATIONS,
} from "@/lib/constants";
import { getAgencyAccess, hasAgencyPermission, type AgencyAccess } from "@/lib/accounts/agency-access";
import { getLeadAssignees, type ManagedLeadAgency } from "@/lib/accounts/listing-leads";
import { isPhoneLike } from "@/lib/accounts/profile-fields";

/**
 * Mini CRM — müştəri kartları və ehtiyaclar (#226, PRD 9.1, 9.2).
 *
 * Agentlik üzvünün kartı agentliyin mühitinə aiddir (`CrmClient.agencyId`): sahib və `LEADS_MANAGE`
 * səlahiyyətli menecer agentliyin bütün kartlarını görür və məsulu dəyişir, agent yalnız özününkünü.
 * Girişi dayandırılmış üzv agentlik kartlarını görmür. Şəxsi hesabın kartında `agencyId` boşdur.
 * Komandadan çıxan agentin kartları sahibə keçir (`releaseAgentClients`) — kart agentlikdə qalır.
 */

/** Telefonun son 9 rəqəmi: «+994 50 123 45 67», «050 123 45 67» və «501234567» eyni açardır. */
export function crmPhoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : null;
}

export function crmEmailKey(email: string | null | undefined): string | null {
  const value = (email ?? "").trim().toLowerCase();
  return value.includes("@") ? value : null;
}

export function crmSearchText(input: { name: string; phone?: string | null; email?: string | null }): string {
  return normalizeSearchText([input.name, (input.phone ?? "").replace(/\D/g, ""), input.email ?? ""].join(" "));
}

export type CrmContext = {
  userId: string;
  access: AgencyAccess | null;
  /** Yeni kartın mühiti: aktiv (dayandırılmamış) agentlik üzvündə agentlik, yoxsa şəxsi. */
  agencyId: string | null;
  /** Agentliyin bütün kartlarını görür və məsulu dəyişir. */
  canManage: boolean;
};

export async function getCrmContext(user: { id: string; accountType: string }): Promise<CrmContext> {
  const access = await getAgencyAccess(user);
  const active = access && !access.suspended ? access : null;
  return {
    userId: user.id,
    access: active,
    agencyId: active?.agencyId ?? null,
    canManage: hasAgencyPermission(active, AGENCY_MEMBER_PERMISSIONS.LEADS_MANAGE),
  };
}

/** Hesabın görə bildiyi kartlar. */
export function crmScope(context: CrmContext): Prisma.CrmClientWhereInput {
  const personal: Prisma.CrmClientWhereInput = { ownerId: context.userId, agencyId: null };
  if (!context.agencyId) return personal;
  const agency: Prisma.CrmClientWhereInput = context.canManage
    ? { agencyId: context.agencyId }
    : { agencyId: context.agencyId, ownerId: context.userId };
  return { OR: [personal, agency] };
}

const optionalInt = (max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().int().min(0).max(max).optional(),
  );
const optionalText = (max: number) =>
  z.preprocess((value) => (typeof value === "string" && value.trim() ? value.trim() : undefined), z.string().max(max).optional());

export const crmClientSchema = z
  .object({
    name: z.string().trim().min(2, "name").max(120, "name"),
    phone: optionalText(40),
    email: optionalText(200),
    listingType: z.preprocess((value) => value || undefined, z.enum([LISTING_TYPES.SALE, LISTING_TYPES.RENT]).optional()),
    typeSlug: optionalText(120),
    citySlug: optionalText(120),
    districtSlug: optionalText(160),
    priceMin: optionalInt(100_000_000),
    priceMax: optionalInt(100_000_000),
    areaMin: optionalInt(1_000_000),
    areaMax: optionalInt(1_000_000),
    rooms: optionalInt(50),
    renovation: z.preprocess(
      (value) => value || undefined,
      z.enum(Object.values(RENOVATIONS) as [string, ...string[]]).optional(),
    ),
    preferences: optionalText(2000),
  })
  .superRefine((value, context) => {
    if (value.phone && !isPhoneLike(value.phone)) context.addIssue({ code: "custom", path: ["phone"], message: "phone" });
    if (value.email && !z.string().email().safeParse(value.email).success) context.addIssue({ code: "custom", path: ["email"], message: "email" });
    if (!value.phone && !value.email) context.addIssue({ code: "custom", path: ["phone"], message: "contact" });
    if (value.priceMin != null && value.priceMax != null && value.priceMin > value.priceMax) {
      context.addIssue({ code: "custom", path: ["priceMax"], message: "range" });
    }
    if (value.areaMin != null && value.areaMax != null && value.areaMin > value.areaMax) {
      context.addIssue({ code: "custom", path: ["areaMax"], message: "range" });
    }
  });

export type CrmClientInput = z.infer<typeof crmClientSchema>;

export function parseCrmClientForm(formData: FormData) {
  const field = (name: string) => formData.get(name) ?? undefined;
  return crmClientSchema.safeParse({
    name: field("name") ?? "",
    phone: field("phone"),
    email: field("email"),
    listingType: field("listingType"),
    typeSlug: field("type"),
    citySlug: field("city"),
    districtSlug: field("district"),
    priceMin: field("priceMin"),
    priceMax: field("priceMax"),
    areaMin: field("areaMin"),
    areaMax: field("areaMax"),
    rooms: field("rooms"),
    renovation: field("renovation"),
    preferences: field("preferences"),
  });
}

/**
 * Formadakı slug-ları id-yə çevirir. Rayon seçilmiş şəhərin (və ya onun rayonunun) altında
 * olmalıdır — Bakının qəsəbələri rayonun uşağıdır, ona görə iki pillə yoxlanılır.
 */
export async function resolveCrmTaxonomy(input: Pick<CrmClientInput, "typeSlug" | "citySlug" | "districtSlug">) {
  const [type, city] = await Promise.all([
    input.typeSlug ? prisma.propertyType.findFirst({ where: { slug: input.typeSlug, isActive: true }, select: { id: true } }) : null,
    input.citySlug ? prisma.location.findFirst({ where: { slug: input.citySlug, kind: LOCATION_KINDS.CITY }, select: { id: true } }) : null,
  ]);
  let districtId: string | null = null;
  if (city && input.districtSlug) {
    const district = await prisma.location.findFirst({
      where: { slug: input.districtSlug, kind: { in: LOCATION_CHILD_KINDS } },
      select: { id: true, parentId: true },
    });
    if (district?.parentId === city.id) districtId = district.id;
    else if (district?.parentId) {
      const parent = await prisma.location.findUnique({ where: { id: district.parentId }, select: { parentId: true } });
      if (parent?.parentId === city.id) districtId = district.id;
    }
  }
  return { typeId: type?.id ?? null, cityId: city?.id ?? null, districtId };
}

/** `CrmClient` yazısı üçün sahələr (ad, əlaqə, açarlar, ehtiyaclar). */
export async function crmClientData(input: CrmClientInput) {
  const taxonomy = await resolveCrmTaxonomy(input);
  return {
    name: input.name,
    phone: input.phone ?? null,
    phoneKey: crmPhoneKey(input.phone),
    email: input.email ?? null,
    emailKey: crmEmailKey(input.email),
    searchText: crmSearchText(input),
    listingType: input.listingType ?? null,
    ...taxonomy,
    priceMin: input.priceMin ?? null,
    priceMax: input.priceMax ?? null,
    areaMin: input.areaMin ?? null,
    areaMax: input.areaMax ?? null,
    rooms: input.rooms ?? null,
    renovation: input.renovation ?? null,
    preferences: input.preferences ?? null,
  };
}

/** Forma seçimləri: əmlak növləri və şəhər → rayon/qəsəbə ağacı (kəndsiz — ölkə üzrə ~3 600 olardı). */
export async function getCrmFormOptions() {
  const [types, cities, children] = await Promise.all([
    prisma.propertyType.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, select: { name: true, slug: true } }),
    prisma.location.findMany({ where: { kind: LOCATION_KINDS.CITY }, orderBy: { order: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.location.findMany({
      where: { kind: { in: LOCATION_CHILD_KINDS.filter((kind) => kind !== LOCATION_KINDS.VILLAGE) } },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, kind: true, parentId: true, order: true },
    }),
  ]);
  return { types, cities: buildCityFilterTree(cities, children) };
}

export type CrmFormOptions = Awaited<ReturnType<typeof getCrmFormOptions>>;

/** Kart siyahısı: ad, telefon və e-poçt üzrə diakritikasız axtarış, məsul üzrə filtr. */
export async function getCrmClients(context: CrmContext, filters: { q?: string; owner?: string; page?: number }) {
  const words = normalizeSearchText(filters.q ?? "").split(/\s+/).filter(Boolean).slice(0, 5);
  const where: Prisma.CrmClientWhereInput = {
    AND: [
      crmScope(context),
      ...words.map((word) => ({ searchText: { contains: word } })),
      ...(filters.owner && context.canManage ? [{ ownerId: filters.owner }] : []),
    ],
  };
  const page = Math.max(1, filters.page ?? 1);
  const [total, rows] = await Promise.all([
    prisma.crmClient.count({ where }),
    prisma.crmClient.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * CRM_PAGE_SIZE,
      take: CRM_PAGE_SIZE,
      select: {
        id: true, name: true, phone: true, email: true, ownerId: true, agencyId: true, listingType: true,
        typeId: true, cityId: true, districtId: true, priceMin: true, priceMax: true, rooms: true, updatedAt: true,
      },
    }),
  ]);
  const ids = rows.map((row) => row.id);
  const [names, leadCounts] = await Promise.all([
    crmLookupNames(rows),
    ids.length
      ? prisma.lead.groupBy({ by: ["clientId"], where: { clientId: { in: ids } }, _count: { _all: true } })
      : Promise.resolve([]),
  ]);
  const leads = new Map(leadCounts.map((row) => [row.clientId, row._count._all]));
  return {
    total,
    page,
    pages: Math.max(1, Math.ceil(total / CRM_PAGE_SIZE)),
    clients: rows.map((row) => ({
      ...row,
      ownerName: names.users.get(row.ownerId) ?? null,
      typeName: row.typeId ? names.types.get(row.typeId) ?? null : null,
      placeName: names.places.get(row.districtId ?? row.cityId ?? "") ?? null,
      leadCount: leads.get(row.id) ?? 0,
    })),
  };
}

/** Kartlardakı FK-sız id-lərin adları (məsul, növ, yer) — bir neçə düz sorğu ilə. */
async function crmLookupNames(rows: { ownerId: string; typeId: string | null; cityId: string | null; districtId: string | null }[]) {
  const userIds = [...new Set(rows.map((row) => row.ownerId))];
  const typeIds = [...new Set(rows.flatMap((row) => (row.typeId ? [row.typeId] : [])))];
  const placeIds = [...new Set(rows.flatMap((row) => [row.cityId, row.districtId].filter((id): id is string => Boolean(id))))];
  const [users, types, places] = await Promise.all([
    findManyInChunks(userIds, 0, (chunk) => prisma.user.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true } })),
    findManyInChunks(typeIds, 0, (chunk) => prisma.propertyType.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true } })),
    findManyInChunks(placeIds, 0, (chunk) => prisma.location.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true, slug: true } })),
  ]);
  return {
    users: new Map(users.map((item) => [item.id, item.name])),
    types: new Map(types.map((item) => [item.id, item.name])),
    places: new Map(places.map((item) => [item.id, item.name])),
    placeSlugs: new Map(places.map((item) => [item.id, item.slug])),
  };
}

/** Müştəri kartı: ehtiyaclar, qeydlər, bağlı müraciətlər, maraqlandığı elan və (idarəçiyə) məsul seçimi. */
export async function getCrmClient(context: CrmContext, id: string) {
  const client = await prisma.crmClient.findFirst({
    where: { AND: [{ id }, crmScope(context)] },
    include: { notes: { orderBy: { createdAt: "desc" }, take: 100 } },
  });
  if (!client) return null;
  const [names, type, leads, property] = await Promise.all([
    crmLookupNames([client]),
    client.typeId ? prisma.propertyType.findUnique({ where: { id: client.typeId }, select: { slug: true } }) : null,
    prisma.lead.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, createdAt: true, source: true, stage: true, message: true, property: { select: { title: true } } },
    }),
    client.interestedPropertyId
      ? prisma.property.findUnique({
          where: { id: client.interestedPropertyId },
          select: { id: true, title: true, slug: true, status: true, deletedAt: true },
        })
      : null,
  ]);
  const agency: ManagedLeadAgency | null = context.canManage && client.agencyId && context.access
    ? { id: context.access.agencyId, name: context.access.agencyName, ownerUserId: context.access.ownerUserId }
    : null;
  return {
    client,
    ownerName: names.users.get(client.ownerId) ?? null,
    typeName: client.typeId ? names.types.get(client.typeId) ?? null : null,
    typeSlug: type?.slug ?? null,
    cityName: client.cityId ? names.places.get(client.cityId) ?? null : null,
    citySlug: client.cityId ? names.placeSlugs.get(client.cityId) ?? null : null,
    districtName: client.districtId ? names.places.get(client.districtId) ?? null : null,
    districtSlug: client.districtId ? names.placeSlugs.get(client.districtId) ?? null : null,
    leads,
    property: property && !property.deletedAt
      ? { ...property, isPublic: (PUBLIC_PROPERTY_STATUSES as readonly string[]).includes(property.status) }
      : null,
    canManage: Boolean(agency),
    assignees: agency ? await getLeadAssignees(agency) : null,
  };
}

/** Məsul dəyişikliyi üçün hədəf: agentliyin sahibi və ya aktiv üzvü. */
export async function isCrmAssignee(agency: ManagedLeadAgency, userId: string): Promise<boolean> {
  const assignees = await getLeadAssignees(agency);
  return assignees.some((item) => item.userId === userId);
}

/**
 * Agent komandadan çıxanda (#226): agentlik mühitindəki kartları sahibə keçir — müştəri agentlikdə
 * qalır. Agentin şəxsi kartları (`agencyId = null`) ona qalır.
 */
export async function releaseAgentClients(input: { agencyId: string; userId: string; ownerUserId: string }): Promise<number> {
  const { count } = await prisma.crmClient.updateMany({
    where: { agencyId: input.agencyId, ownerId: input.userId },
    data: { ownerId: input.ownerUserId },
  });
  return count;
}
