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
import { BAKU, METRO_STATIONS, PLACES } from "./locations-data";

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

/**
 * Yazılmış hər slug. Eyni slug iki dəfə yazılsaydı, ikinci `UPDATE` birincinin
 * valideynini səssizcə dəyişərdi — məsələn iki fərqli rayonun «İstisu»su.
 * Slug-lar valideyn prefiksi daşıdığı üçün bu normalda baş vermir; yenə də
 * generator dayanır, çünki səhvi SQL tətbiq olunandan sonra tapmaq çətindir.
 */
const seenSlugs = new Set<string>();

function locationRow(
  name: string,
  kind: string,
  order: number,
  parentSlug: string | null,
  slug: string,
): void {
  if (seenSlugs.has(slug)) {
    throw new Error(`Təkrar slug: ${slug} (${name}) — locations-data.ts-ə bax.`);
  }
  seenSlugs.add(slug);

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

/**
 * Bakı daxilindəki yerlər üçün slug konvensiyası `baki-<ad>`-dır və ilk seed-dən
 * qalır. Digər şəhər və rayonlarda da eyni qayda işləyir: `<şəhər>-<ad>`.
 * Prefiks olmasaydı eyni adlı qəsəbələr toqquşardı — «İstisu» üç rayonda var.
 */
const scopedSlug = (parentSlug: string, name: string) => `${parentSlug}-${slugify(name)}`;

const bakuSlug = slugify(BAKU);

lines.push("-- Şəhərlər və rayonlar");
PLACES.forEach((place, index) => {
  // Şəhərlər əvvəl, rayonlar sonra sıralanır
  const base = place.tier === "CITY" ? index * 10 : 1000 + index * 10;
  locationRow(place.name, "CITY", base, null, slugify(place.name));
});
lines.push("");

lines.push("-- Şəhərdaxili inzibati rayonlar, qəsəbə, kənd və massivlər");
PLACES.forEach((place) => {
  const topSlug = slugify(place.name);

  place.districts?.forEach((district, districtIndex) => {
    const districtSlug = scopedSlug(topSlug, district.name);
    locationRow(district.name, "DISTRICT", districtIndex * 10, topSlug, districtSlug);

    district.places.forEach((child, childIndex) => {
      // Qəsəbənin slug-ı rayonun deyil, şəhərin prefiksini daşıyır: elanlar
      // ilk seed-dən bəri `baki-<qəsəbə>` slug-ına bağlıdır.
      locationRow(child.name, child.kind, childIndex * 10, districtSlug, scopedSlug(topSlug, child.name));
    });
  });

  place.places?.forEach((child, childIndex) => {
    locationRow(child.name, child.kind, childIndex * 10, topSlug, scopedSlug(topSlug, child.name));
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
