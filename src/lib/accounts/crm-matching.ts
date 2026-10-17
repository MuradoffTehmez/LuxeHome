import { prisma } from "@/lib/prisma";
import { buildPropertyWhere, findPropertyCards, type PropertyFilters } from "@/lib/queries";
import { normalizeSearchText } from "@/lib/search-normalization";
import type { CrmClient } from "@prisma/client";
import { crmEmailKey, crmPhoneKey, crmScope, crmSearchText, type CrmContext } from "@/lib/accounts/crm";

/**
 * Mini CRM — uyğun elanlar və təkrar müraciətlər (#228, PRD 9.3, 9.4).
 *
 * Uyğun elanlar müştərinin ehtiyaclarından `PropertyFilters` qurur və ictimai axtarışla eyni
 * `buildPropertyWhere()`-dən keçir (qaralama/silinmiş elan sızmır). Dublikat aşkarlanması yalnız
 * **təklifdir**: kartlar heç vaxt avtomatik birləşdirilmir, məsul şəxs təsdiq edir.
 */

export type CrmNeeds = {
  listingType: string | null;
  typeSlug: string | null;
  citySlug: string | null;
  districtSlug: string | null;
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  rooms: number | null;
  renovation: string | null;
};

export const CRM_MATCH_LIMIT = 6;

export function crmPropertyFilters(needs: CrmNeeds): PropertyFilters {
  return {
    ...(needs.listingType ? { listingType: needs.listingType } : {}),
    ...(needs.typeSlug ? { typeSlug: needs.typeSlug } : {}),
    ...(needs.citySlug ? { citySlug: needs.citySlug } : {}),
    ...(needs.districtSlug ? { districtSlug: needs.districtSlug } : {}),
    ...(needs.priceMin != null ? { minPrice: needs.priceMin } : {}),
    ...(needs.priceMax != null ? { maxPrice: needs.priceMax } : {}),
    ...(needs.areaMin != null ? { minArea: needs.areaMin } : {}),
    ...(needs.areaMax != null ? { maxArea: needs.areaMax } : {}),
    ...(needs.rooms != null ? { rooms: needs.rooms } : {}),
    ...(needs.renovation ? { renovation: needs.renovation } : {}),
  };
}

/** Ehtiyacdan heç bir meyar yoxdursa təklif göstərilmir — bütün elanlar «uyğun» olardı. */
export function hasCrmNeeds(needs: CrmNeeds): boolean {
  return Object.keys(crmPropertyFilters(needs)).length > 0;
}

/** Eyni filtrlərlə ictimai siyahının ünvanı (`emlaklar/page.tsx`-in oxuduğu parametrlər). */
export function crmMatchesHref(needs: CrmNeeds): string {
  const query = new URLSearchParams();
  const set = (key: string, value: string | number | null) => {
    if (value !== null && value !== "") query.set(key, String(value));
  };
  set("elan", needs.listingType);
  set("tip", needs.typeSlug);
  set("seher", needs.citySlug);
  set("rayon", needs.districtSlug);
  set("min", needs.priceMin);
  set("max", needs.priceMax);
  set("sahe_min", needs.areaMin);
  set("sahe_max", needs.areaMax);
  set("otaq", needs.rooms);
  set("temir", needs.renovation);
  const value = query.toString();
  return value ? `/emlaklar?${value}` : "/emlaklar";
}

export async function getCrmMatches(needs: CrmNeeds) {
  if (!hasCrmNeeds(needs)) return { total: 0, items: [] };
  const where = await buildPropertyWhere(crmPropertyFilters(needs));
  const [total, items] = await Promise.all([
    prisma.property.count({ where }),
    findPropertyCards({ where, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], take: CRM_MATCH_LIMIT }),
  ]);
  return { total, items };
}

export type DuplicateSignals = { phone: boolean; email: boolean; name: boolean };

/**
 * Uyğunluq ehtimalı (%): müstəqil siqnalların birləşməsi `1 − Π(1 − pᵢ)`. Telefon ən güclüdür,
 * ad tək başına zəifdir (adaşlar çoxdur) — yalnız adla 50% olur.
 */
export function duplicateScore(signals: DuplicateSignals): number {
  const weights = [signals.phone ? 0.9 : 0, signals.email ? 0.85 : 0, signals.name ? 0.5 : 0];
  const miss = weights.reduce((product, weight) => product * (1 - weight), 1);
  return Math.round((1 - miss) * 100);
}

export const DUPLICATE_MIN_SCORE = 50;

const nameKey = (name: string) => normalizeSearchText(name).replace(/\s+/g, " ").trim();

/**
 * Baxanın görə bildiyi kartlar arasında eyni şəxsə aid ola biləcəklər: telefon (son 9 rəqəm),
 * e-poçt və ya eyni ad. Namizədlər SQL-də, dəqiq ad müqayisəsi JS-də.
 */
export async function findDuplicateClients(
  context: CrmContext,
  person: { name: string; phone?: string | null; email?: string | null },
  excludeId?: string,
) {
  const phoneKey = crmPhoneKey(person.phone);
  const emailKey = crmEmailKey(person.email);
  const name = nameKey(person.name);
  const keyed = [...(phoneKey ? [{ phoneKey }] : []), ...(emailKey ? [{ emailKey }] : [])];
  if (keyed.length === 0 && name.length < 3) return [];
  const base = [crmScope(context), ...(excludeId ? [{ id: { not: excludeId } }] : [])];
  const select = { id: true, name: true, phone: true, email: true, phoneKey: true, emailKey: true, ownerId: true, agencyId: true, updatedAt: true } as const;
  // Güclü siqnallar (telefon/e-poçt) ad namizədlərindən ayrıca oxunur: çoxlu yeni adaş limiti
  // doldurub köhnə dəqiq uyğunluğu sıxışdırıb çıxarmasın.
  const [keyedRows, nameRows] = await Promise.all([
    keyed.length ? prisma.crmClient.findMany({ where: { AND: [...base, { OR: keyed }] }, select, orderBy: { updatedAt: "desc" }, take: 20 }) : [],
    name.length >= 3 ? prisma.crmClient.findMany({ where: { AND: [...base, { searchText: { contains: name } }] }, select, orderBy: { updatedAt: "desc" }, take: 20 }) : [],
  ]);
  const rows = [...new Map([...keyedRows, ...nameRows].map((row) => [row.id, row])).values()];
  return rows
    .map((row) => {
      const match: DuplicateSignals = {
        phone: Boolean(phoneKey && row.phoneKey === phoneKey),
        email: Boolean(emailKey && row.emailKey === emailKey),
        name: name.length >= 3 && nameKey(row.name) === name,
      };
      return { ...row, signals: match, score: duplicateScore(match) };
    })
    .filter((row) => row.score >= DUPLICATE_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Birləşdirmə (#228): mənbənin müraciətləri və qeydləri hədəfə keçir, hədəfin boş sahələri mənbədən
 * doldurulur, mənbə silinir. Çağıran hər iki kartın baxana görünən və eyni mühitdə olduğunu yoxlayır.
 * Addımlar təkrarlana bilər — D1-də tranzaksiya yoxdur, yarımçıq qalan birləşdirməni ikinci cəhd tamamlayır.
 */
export async function mergeCrmClientRecords(target: CrmClient, source: CrmClient): Promise<void> {
  const fill = <K extends keyof CrmClient>(key: K) => (target[key] ?? source[key]) as CrmClient[K];
  const phone = fill("phone");
  const email = fill("email");
  await prisma.lead.updateMany({ where: { clientId: source.id }, data: { clientId: target.id } });
  await prisma.crmClientNote.updateMany({ where: { clientId: source.id }, data: { clientId: target.id } });
  await prisma.crmClient.update({
    where: { id: target.id },
    data: {
      phone,
      phoneKey: crmPhoneKey(phone),
      email,
      emailKey: crmEmailKey(email),
      searchText: crmSearchText({ name: target.name, phone, email }),
      interestedPropertyId: fill("interestedPropertyId"),
      listingType: fill("listingType"),
      typeId: fill("typeId"),
      cityId: fill("cityId"),
      districtId: fill("districtId"),
      priceMin: fill("priceMin"),
      priceMax: fill("priceMax"),
      areaMin: fill("areaMin"),
      areaMax: fill("areaMax"),
      rooms: fill("rooms"),
      renovation: fill("renovation"),
      preferences: fill("preferences"),
    },
  });
  await prisma.crmClient.delete({ where: { id: source.id } });
}
