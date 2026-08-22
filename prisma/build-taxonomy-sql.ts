/**
 * Taksonomiya SQL generatoru.
 *
 * `prisma/taxonomy.sql` faylını qurur: əmlak növləri, xüsusiyyətlər və yerləşmə ağacı.
 *
 * Fayl **idempotentdir** — mövcud bazaya təhlükəsiz tətbiq olunur:
 * - `INSERT OR IGNORE` yalnız çatışmayan sətirləri əlavə edir (slug unikal indeksdir),
 * - sonrakı `UPDATE` ad, sıra və qrupu sinxronlaşdırır,
 * - valideyn `parentId` cuid ilə deyil, slug üzrə alt-sorğu ilə tapılır, ona görə
 *   əvvəldən mövcud olan sətirlərin öz ID-ləri qorunur və elanların bağlantısı qırılmır.
 *
 * İstifadə: `npm run db:taxonomy:build`, sonra `db:taxonomy:local` / `:remote`.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { FEATURES, PROPERTY_TYPES } from "./taxonomy-data";
import { BAKU, BAKU_DISTRICTS, CITIES, METRO_STATIONS, REGIONS } from "./locations-data";

const AZ_TRANSLIT: Record<string, string> = {
  ə: "e", Ə: "e",
  ı: "i", İ: "i",
  ö: "o", Ö: "o",
  ü: "u", Ü: "u",
  ş: "s", Ş: "s",
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
};

/** `src/lib/utils.ts`-dəki `slugify()` ilə eyni davranış — skript alias-ları oxuya bilmir. */
function slugify(input: string): string {
  return input
    .trim()
    .replace(/[əƏıİöÖüÜşŞçÇğĞ]/g, (ch) => AZ_TRANSLIT[ch] ?? ch)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

const lines: string[] = [
  "-- Avtomatik yaradılıb: npm run db:taxonomy:build",
  "-- Mövcud sətirlərə toxunmur; yalnız çatışmayanları əlavə edir və adları sinxronlaşdırır.",
  "",
  "PRAGMA foreign_keys = ON;",
  "",
];

// ---------------------------------------------------------------------------
// ƏMLAK NÖVLƏRİ
// ---------------------------------------------------------------------------

lines.push("-- Əmlak növləri");
for (const type of PROPERTY_TYPES) {
  const id = `type_${type.slug}`;
  lines.push(
    `INSERT OR IGNORE INTO "PropertyType" ("id","name","slug","description","icon","order","isActive") ` +
      `VALUES (${quote(id)},${quote(type.name)},${quote(type.slug)},` +
      `${type.description ? quote(type.description) : "NULL"},` +
      `${type.icon ? quote(type.icon) : "NULL"},${type.order},1);`,
  );
  lines.push(
    `UPDATE "PropertyType" SET "name"=${quote(type.name)}, "order"=${type.order} ` +
      `WHERE "slug"=${quote(type.slug)};`,
  );
}
lines.push("");

// ---------------------------------------------------------------------------
// XÜSUSİYYƏTLƏR
// ---------------------------------------------------------------------------

lines.push("-- Xüsusiyyətlər və ödəniş şərtləri");
for (const feature of FEATURES) {
  const id = `feat_${feature.slug}`;
  lines.push(
    `INSERT OR IGNORE INTO "Feature" ("id","name","slug","icon","group","order") ` +
      `VALUES (${quote(id)},${quote(feature.name)},${quote(feature.slug)},NULL,` +
      `${quote(feature.group)},${feature.order});`,
  );
  lines.push(
    `UPDATE "Feature" SET "name"=${quote(feature.name)}, "group"=${quote(feature.group)}, ` +
      `"order"=${feature.order} WHERE "slug"=${quote(feature.slug)};`,
  );
}
lines.push("");

// ---------------------------------------------------------------------------
// YERLƏŞMƏ AĞACI
// ---------------------------------------------------------------------------

/** Valideyn slug üzrə tapılır ki, mövcud sətirlərin cuid ID-ləri qorunsun. */
function parentRef(parentSlug: string): string {
  return `(SELECT "id" FROM "Location" WHERE "slug"=${quote(parentSlug)})`;
}

function locationRow(
  name: string,
  kind: string,
  order: number,
  parentSlug: string | null,
  slugOverride?: string,
): void {
  const slug = slugOverride ?? slugify(name);
  const id = `loc_${slug}`;
  const parent = parentSlug ? parentRef(parentSlug) : "NULL";

  lines.push(
    `INSERT OR IGNORE INTO "Location" ("id","name","slug","kind","parentId","order") ` +
      `VALUES (${quote(id)},${quote(name)},${quote(slug)},${quote(kind)},${parent},${order});`,
  );
  lines.push(
    `UPDATE "Location" SET "name"=${quote(name)}, "kind"=${quote(kind)}, "order"=${order}` +
      (parentSlug ? `, "parentId"=${parent}` : "") +
      ` WHERE "slug"=${quote(slug)};`,
  );
}

lines.push("-- Şəhərlər");
CITIES.forEach((city, index) => locationRow(city, "CITY", index * 10, null));
lines.push("");

lines.push("-- Rayonlar (şəhərlərlə eyni pillədə seçilir)");
REGIONS.forEach((region, index) => locationRow(region, "CITY", 1000 + index * 10, null));
lines.push("");

/**
 * Bakı daxilindəki yerlər üçün slug konvensiyası: `baki-<ad>`.
 *
 * Konvensiya ilk seed-dən qalır və dəyişdirilmir — bare slug (`yasamal`) yazılsaydı,
 * mövcud `baki-yasamal` sətri ilə yanaşı ikinci sətir yaranardı və seçim siyahısında
 * hər rayon iki dəfə görünərdi.
 */
const bakuSlug = slugify(BAKU);
const bakuScoped = (name: string) => `${bakuSlug}-${slugify(name)}`;

lines.push("-- Bakının inzibati rayonları");
BAKU_DISTRICTS.forEach((district, index) => {
  locationRow(district.name, "DISTRICT", index * 10, bakuSlug, bakuScoped(district.name));
});
lines.push("");

lines.push("-- Bakı qəsəbələri");
const seenSettlements = new Set<string>();
BAKU_DISTRICTS.forEach((district) => {
  const districtSlug = bakuScoped(district.name);
  district.settlements.forEach((settlement, index) => {
    const slug = bakuScoped(settlement);
    // Eyni qəsəbə adı iki rayonun siyahısında ola bilər (məsələn «8-ci kilometr») —
    // yalnız birinci qeyd saxlanılır, əks halda slug toqquşardı
    if (seenSettlements.has(slug)) return;
    seenSettlements.add(slug);
    locationRow(settlement, "SETTLEMENT", index * 10, districtSlug, slug);
  });
});
lines.push("");

lines.push("-- Metro stansiyaları");
METRO_STATIONS.forEach((station, index) => {
  locationRow(station, "METRO", index * 10, bakuSlug, `metro-${slugify(station)}`);
});
lines.push("");

const output = join(process.cwd(), "prisma", "taxonomy.sql");
writeFileSync(output, `${lines.join("\n")}\n`, "utf8");

const statements = lines.filter((line) => line.startsWith("INSERT") || line.startsWith("UPDATE")).length;
console.log(`prisma/taxonomy.sql yazıldı — ${statements} ifadə.`);
