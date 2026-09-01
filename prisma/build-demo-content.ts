/**
 * `prisma/demo-content-data.ts` mənbəyindən idempotent D1 SQL yaradır.
 *
 * Çıxan qeydlərin hamısı `isDemo = 1` daşıyır: ictimai sorğular onları yalnız
 * paneldəki «Nümunə məzmun» açarı aktiv olduqda göstərir (`src/lib/demo-content.ts`).
 *
 * Xarici açarlar ID ilə deyil, `(SELECT id FROM ... WHERE slug = ...)` alt-sorğusu
 * ilə bağlanır — beləliklə eyni fayl lokal, staging və production D1-də taksonomiya
 * ID-lərindən asılı olmadan işləyir.
 *
 * Təsadüfilik determinist seed ilə idarə olunur: eyni giriş həmişə eyni SQL verir,
 * ona görə fayl git diff-ində səs-küy yaratmır.
 *
 * İstifadə:
 *   npm run db:demo:build
 *   npm run db:demo:local
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
// Axtarış indeksi tətbiq qatı ilə **eyni** funksiyadan keçməlidir: kopya saxlansaydı,
// iki tərəf ayrılan kimi nümunə elanlar axtarışda tapılmaz olardı. `prisma/seed.ts`
// də eyni yolla import edir.
import { normalizeSearchText } from "../src/lib/search-normalization";
import {
  CATEGORY_RECIPES,
  DEMO_AGENCIES,
  DEMO_AGENTS,
  DEMO_NOTICE,
  DEMO_PARTNERS,
  DEMO_POSTS,
  DEMO_PROJECTS,
  FOREIGN_PLACES,
  PLACES,
  STREETS,
  type CategoryRecipe,
} from "./demo-content-data";

const outputPath = join(process.cwd(), "prisma", "demo-content.sql");

/** Hər kateqoriyada neçə elan yaradılsın. */
const PER_CATEGORY = 20;

/** Bütün qeydlərin bazasında duran vaxt — determinist çıxış üçün sabitdir. */
const BASE_DATE = new Date("2026-08-01T09:00:00.000Z");

// ---------------------------------------------------------------------------
// KÖMƏKÇİLƏR
// ---------------------------------------------------------------------------

/**
 * Determinist psevdo-təsadüfi generator (mulberry32).
 * `Math.random()` işlədilsəydi, hər build fərqli SQL verər və faylın git
 * tarixçəsi mənasız dəyişikliklərlə dolardı.
 */
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Random = ReturnType<typeof createRandom>;

function pick<T>(random: Random, items: readonly T[]): T {
  return items[Math.floor(random() * items.length) % items.length];
}

/** Təkrarsız `count` element seçir; siyahı qısadırsa mövcud qədərini qaytarır. */
function pickMany<T>(random: Random, items: readonly T[], count: number): T[] {
  const pool = [...items];
  const chosen: T[] = [];
  while (chosen.length < count && pool.length > 0) {
    chosen.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return chosen;
}

function intBetween(random: Random, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

/** Qiyməti bazarda görünən şəklə yuvarlaqlaşdırır: 187 340 → 187 000. */
function roundPrice(value: number): number {
  if (value >= 100000) return Math.round(value / 1000) * 1000;
  if (value >= 10000) return Math.round(value / 500) * 500;
  if (value >= 1000) return Math.round(value / 50) * 50;
  return Math.round(value / 10) * 10;
}

function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** `NULL` və ya sitatlanmış mətn. */
function nullable(value: string | null | undefined): string {
  return value == null || value === "" ? "NULL" : quote(value);
}

/** D1-də tarixlər ISO-8601 mətn kimi saxlanılır (migrations/0019). */
function isoDate(offsetDays: number, offsetMinutes = 0): string {
  const date = new Date(BASE_DATE);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  date.setUTCMinutes(date.getUTCMinutes() + offsetMinutes);
  return date.toISOString();
}

function unsplash(id: string, width: number): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

/** `(SELECT id FROM "Table" WHERE "slug" = '...')` — mühitdən asılı olmayan FK. */
function lookup(table: string, slug: string): string {
  return `(SELECT "id" FROM "${table}" WHERE "slug" = ${quote(slug)})`;
}

// ---------------------------------------------------------------------------
// SQL TOPLAYICI
// ---------------------------------------------------------------------------

const lines: string[] = [];

function section(title: string): void {
  lines.push("", `-- ${"-".repeat(72)}`, `-- ${title}`, `-- ${"-".repeat(72)}`);
}

function insert(table: string, columns: string[], values: string[]): void {
  const cols = columns.map((column) => `"${column}"`).join(",");
  lines.push(`INSERT OR IGNORE INTO "${table}" (${cols}) VALUES (${values.join(",")});`);
}

// ---------------------------------------------------------------------------
// 1. ƏMLAKLAR
// ---------------------------------------------------------------------------

const PROPERTY_COLUMNS = [
  "id", "title", "slug", "description", "searchText", "listingType", "status",
  "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address",
  "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea",
  "floor", "totalFloors", "renovation", "documentStatus", "buildingType",
  "mortgageAvailable", "installmentAvailable", "isFeatured", "isDemo", "viewCount",
  "publishedAt", "createdAt", "updatedAt",
];

/** Bakı mərkəzi ətrafında kiçik yayılma — xəritə səthini boş qoymamaq üçün. */
function coordinatesFor(random: Random, citySlug: string): [number, number] {
  const centers: Record<string, [number, number]> = {
    baki: [40.3777, 49.892],
    sumqayit: [40.5892, 49.6686],
    xirdalan: [40.4497, 49.7561],
    qebele: [40.9819, 47.8456],
    gence: [40.6828, 46.3606],
  };
  const [lat, lng] = centers[citySlug] ?? centers.baki;
  return [
    Number((lat + (random() - 0.5) * 0.16).toFixed(6)),
    Number((lng + (random() - 0.5) * 0.22).toFixed(6)),
  ];
}

/** Başlıqdakı `{ölçü}` yerinə kateqoriyaya uyğun ölçü ifadəsi qoyur. */
function sizeLabel(
  recipe: CategoryRecipe,
  rooms: number | null,
  area: number | null,
  landArea: number | null,
): string {
  if (rooms != null) return `${rooms} otaqlı`;
  if (area != null) return `${area} m²`;
  if (landArea != null) return `${landArea} sot`;
  return recipe.label.toLowerCase();
}

function buildProperties(): void {
  section("ƏMLAKLAR — hər kateqoriya üçün 20 nümunə elan");

  let globalIndex = 0;

  for (const [categoryIndex, recipe] of CATEGORY_RECIPES.entries()) {
    const random = createRandom(1000 + categoryIndex * 97);
    const isForeign = recipe.slug === "xarici-emlak";

    for (let n = 0; n < PER_CATEGORY; n += 1) {
      globalIndex += 1;
      const id = `demo_prop_${recipe.slug}_${String(n + 1).padStart(2, "0")}`;
      const slug = `demo-${recipe.slug}-${String(n + 1).padStart(2, "0")}`;

      const place = PLACES[(categoryIndex * 7 + n * 3) % PLACES.length];
      const placeName = isForeign ? FOREIGN_PLACES[n % FOREIGN_PLACES.length] : place.name;

      const listingType: "SALE" | "RENT" = n < recipe.rentShare ? "RENT" : "SALE";
      const rooms = recipe.rooms ? intBetween(random, recipe.rooms[0], recipe.rooms[1]) : null;
      const area = recipe.area ? intBetween(random, recipe.area[0], recipe.area[1]) : null;
      const landArea = recipe.landArea
        ? intBetween(random, recipe.landArea[0], recipe.landArea[1])
        : null;

      const [minPrice, maxPrice] =
        listingType === "RENT" ? recipe.rentPrice : recipe.salePrice;
      const price = roundPrice(minPrice + random() * (maxPrice - minPrice));

      const totalFloors = recipe.floors
        ? intBetween(random, Math.max(recipe.floors[0], 3), recipe.floors[1])
        : null;
      const floor = totalFloors ? intBetween(random, 1, totalFloors) : null;

      const isNewBuilding = random() < recipe.newBuildingShare;
      const renovation = recipe.renovations.length ? pick(random, recipe.renovations) : null;
      const documentStatus = pick(random, recipe.documents);

      // Statusların bir hissəsi qəsdən SOLD/RENTED/RESERVED-dir: kart rozetkaları,
      // «satılıb» bildirişi və arxiv axını da nümunə məzmunla yoxlanmalıdır.
      const statusRoll = random();
      const status =
        statusRoll > 0.94
          ? listingType === "RENT" ? "RENTED" : "SOLD"
          : statusRoll > 0.9
            ? "RESERVED"
            : "PUBLISHED";

      const title = pick(random, recipe.titles)
        .replace("{yer}", placeName)
        .replace("{ölçü}", sizeLabel(recipe, rooms, area, landArea));

      const lead = pick(random, recipe.leads);
      const points = pickMany(random, recipe.selling, 3);
      const description = [lead, ...points, DEMO_NOTICE].join(" ");

      const street = pick(random, STREETS);
      const address = isForeign
        ? `${placeName}, mərkəzi rayon`
        : `${placeName}, ${street} ${intBetween(random, 1, 120)}`;
      const [latitude, longitude] = coordinatesFor(random, isForeign ? "baki" : place.city);

      const publishedAt = isoDate(-intBetween(random, 1, 180), -globalIndex);

      insert(
        "Property",
        PROPERTY_COLUMNS,
        [
          quote(id),
          quote(title),
          quote(slug),
          quote(description),
          quote(normalizeSearchText(`${title} ${address} ${lead}`)),
          quote(listingType),
          quote(status),
          String(price),
          "'AZN'",
          listingType === "RENT" ? "'MONTH'" : "NULL",
          lookup("PropertyType", recipe.slug),
          lookup("Location", isForeign ? "baki" : place.city),
          isForeign || !place.district ? "NULL" : lookup("Location", place.district),
          quote(address),
          String(latitude),
          String(longitude),
          rooms == null ? "NULL" : String(rooms),
          rooms == null ? "NULL" : String(Math.max(1, rooms - 1)),
          rooms == null ? "NULL" : String(Math.max(1, Math.ceil(rooms / 2))),
          area == null ? "NULL" : String(area),
          landArea == null ? "NULL" : String(landArea),
          floor == null ? "NULL" : String(floor),
          totalFloors == null ? "NULL" : String(totalFloors),
          nullable(renovation),
          quote(documentStatus),
          recipe.slug === "torpaq" ? "NULL" : quote(isNewBuilding ? "NEW" : "OLD"),
          isNewBuilding && listingType === "SALE" ? "1" : "0",
          isNewBuilding && random() > 0.4 ? "1" : "0",
          n % 7 === 0 ? "1" : "0",
          "1",
          String(intBetween(random, 12, 940)),
          quote(publishedAt),
          quote(publishedAt),
          quote(publishedAt),
        ],
      );

      // --- şəkillər
      const photos = pickMany(random, recipe.photos, 4);
      for (const [photoIndex, photo] of photos.entries()) {
        insert(
          "PropertyImage",
          ["id", "propertyId", "url", "thumbUrl", "alt", "order", "isCover"],
          [
            quote(`${id}_img${photoIndex + 1}`),
            quote(id),
            quote(unsplash(photo, 1600)),
            quote(unsplash(photo, 480)),
            quote(`${title} — nümunə şəkil ${photoIndex + 1}`),
            String(photoIndex),
            photoIndex === 0 ? "1" : "0",
          ],
        );
      }

      // --- xüsusiyyətlər
      for (const feature of pickMany(random, recipe.features, intBetween(random, 3, 6))) {
        lines.push(
          `INSERT OR IGNORE INTO "PropertyFeature" ("propertyId","featureId") ` +
            `SELECT ${quote(id)}, "id" FROM "Feature" WHERE "slug" = ${quote(feature)};`,
        );
      }
    }
  }

  lines.push("", `-- Cəmi ${CATEGORY_RECIPES.length * PER_CATEGORY} nümunə elan.`);
}

// ---------------------------------------------------------------------------
// 2. YAŞAYIŞ KOMPLEKSLƏRİ
// ---------------------------------------------------------------------------

function buildProjects(): void {
  section("YAŞAYIŞ KOMPLEKSLƏRİ (Project)");

  for (const [index, project] of DEMO_PROJECTS.entries()) {
    const random = createRandom(5000 + index * 31);
    const id = `demo_project_${project.slug.replace(/-/g, "_")}`;
    const slug = `demo-${project.slug}`;
    const created = isoDate(-200 + index * 4);

    const description = [
      project.summary,
      `Layihə ${project.floors} mərtəbə və ${project.units} mənzildən ibarətdir; ` +
        `ümumi sahə ${project.area.toLocaleString("az-AZ")} m²-dir.`,
      "Mənzillərin planlaşdırması müxtəlif ailə ölçülərinə uyğun hazırlanıb, " +
        "ictimai zonalar isə gündəlik istifadə rahatlığı nəzərə alınaraq layihələndirilib.",
      DEMO_NOTICE.replace("nümunə elandır", "nümunə layihə qeydidir"),
    ].join(" ");

    const timeline = JSON.stringify([
      { step: 1, title: "Layihələndirmə və icazələr", done: true },
      { step: 2, title: "Bünövrə və karkas", done: project.status !== "PLANNED" },
      { step: 3, title: "Fasad və daxili işlər", done: project.status === "COMPLETED" },
      { step: 4, title: "İstismara vermə", done: project.status === "COMPLETED" },
    ]);

    insert(
      "Project",
      [
        "id", "name", "slug", "description", "summary", "projectType", "status",
        "cityId", "address", "latitude", "longitude", "deliveryDate", "year",
        "totalArea", "floors", "unitCount", "highlights", "timeline", "coverUrl",
        "isDemo", "isActive", "order", "createdAt", "updatedAt",
      ],
      [
        quote(id),
        quote(project.name),
        quote(slug),
        quote(description),
        quote(project.summary),
        quote(project.type),
        quote(project.status),
        lookup("Location", project.city),
        quote(project.district ? `${project.district}, ${project.name}` : project.name),
        String(Number((40.3777 + (random() - 0.5) * 0.3).toFixed(6))),
        String(Number((49.892 + (random() - 0.5) * 0.4).toFixed(6))),
        quote(`${project.year}-09-01T09:00:00.000Z`),
        String(project.year),
        String(project.area),
        String(project.floors),
        String(project.units),
        quote(JSON.stringify(project.highlights)),
        quote(timeline),
        quote(unsplash(project.photo, 1600)),
        "1",
        "1",
        String(index),
        quote(created),
        quote(created),
      ],
    );

    for (let imageIndex = 0; imageIndex < 3; imageIndex += 1) {
      const photo = CATEGORY_RECIPES[imageIndex % CATEGORY_RECIPES.length].photos[index % 6];
      insert(
        "ProjectImage",
        ["id", "projectId", "url", "thumbUrl", "alt", "category", "order"],
        [
          quote(`${id}_img${imageIndex + 1}`),
          quote(id),
          quote(unsplash(imageIndex === 0 ? project.photo : photo, 1600)),
          quote(unsplash(imageIndex === 0 ? project.photo : photo, 480)),
          quote(`${project.name} — nümunə görüntü ${imageIndex + 1}`),
          quote(imageIndex === 0 ? "EXTERIOR" : imageIndex === 1 ? "INTERIOR" : "LANDSCAPE"),
          String(imageIndex),
        ],
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 3. AGENTLİKLƏR VƏ AGENTLƏR
// ---------------------------------------------------------------------------

function buildAgenciesAndAgents(): void {
  section("AGENTLİKLƏR VƏ AGENTLƏR");

  lines.push(
    "-- Agentlik qeydi sahib istifadəçi tələb edir. Nümunə istifadəçilər `.test`",
    "-- domenindədir (RFC 2606 üzrə rezerv edilib — real e-poçt deyil) və",
    "-- `passwordHash = 'disabled'` daşıyır: bu dəyər PBKDF2 formatına uyğun",
    "-- gəlmədiyi üçün heç bir parolla giriş mümkün deyil.",
  );

  for (const [index, agency] of DEMO_AGENCIES.entries()) {
    const userId = `demo_user_${agency.slug.replace(/-/g, "_")}`;
    const agencyId = `demo_agency_${agency.slug.replace(/-/g, "_")}`;
    const created = isoDate(-300 + index * 7);

    insert(
      "User",
      [
        "id", "name", "email", "passwordHash", "role", "accountType", "phone",
        "isActive", "approvedAt", "locale", "themePreference", "createdAt", "updatedAt",
      ],
      [
        quote(userId),
        quote(agency.name),
        quote(`${agency.slug}@luxehomeestate.test`),
        "'disabled'",
        "'EDITOR'",
        "'AGENCY'",
        quote(agency.phone),
        "1",
        quote(created),
        "'az'",
        "'light'",
        quote(created),
        quote(created),
      ],
    );

    insert(
      "Agency",
      [
        "id", "userId", "name", "slug", "description", "logoUrl", "phone",
        "address", "isVerified", "verifiedAt", "isDemo", "createdAt", "updatedAt",
      ],
      [
        quote(agencyId),
        quote(userId),
        quote(agency.name),
        quote(agency.slug),
        quote(`${agency.description} ${DEMO_NOTICE.replace("nümunə elandır", "nümunə qeyddir")}`),
        quote(unsplash(agency.logo, 480)),
        quote(agency.phone),
        quote(agency.address),
        "1",
        quote(created),
        "1",
        quote(created),
        quote(created),
      ],
    );
  }

  for (const [index, agent] of DEMO_AGENTS.entries()) {
    const random = createRandom(9000 + index * 13);
    const id = `demo_agent_${index + 1}`;
    const agency = DEMO_AGENCIES[agent.agency];
    const created = isoDate(-280 + index * 5);

    const bio =
      `${agent.name} — ${agent.spec.toLowerCase()} istiqamətində ${agent.years} illik təcrübəsi olan ` +
      `nümunə agent profili. Müştəri ilə ilk görüşdən sənədlərin təhvilinə qədər bütün mərhələləri müşayiət edir. ` +
      DEMO_NOTICE.replace("nümunə elandır", "nümunə profildir");

    insert(
      "AgentProfile",
      [
        "id", "agencyId", "slug", "name", "avatarUrl", "roleTitle", "specialization",
        "experienceYears", "bio", "phone", "whatsapp", "email", "languages", "areas",
        "isVerified", "isPublic", "isDemo", "soldCount", "rentedCount",
        "responseMinutes", "createdAt", "updatedAt",
      ],
      [
        quote(id),
        `(SELECT "id" FROM "Agency" WHERE "slug" = ${quote(agency.slug)})`,
        quote(agent.slug),
        quote(agent.name),
        quote(unsplash(index % 2 === 0 ? "photo-1560250097-0b93528c311a" : "photo-1573496359142-b8d87734a5a2", 400)),
        quote(agent.role),
        quote(agent.spec),
        String(agent.years),
        quote(bio),
        quote(`+994 50 000 ${String(10 + index).padStart(2, "0")} ${String(20 + index).padStart(2, "0")}`),
        quote(`+994500001${String(index).padStart(3, "0")}`),
        quote(`${agent.slug}@luxehomeestate.test`),
        quote(JSON.stringify(["Azərbaycan", "İngilis", "Rus"].slice(0, intBetween(random, 1, 3)))),
        quote(JSON.stringify(pickMany(random, PLACES.map((place) => place.name), 3))),
        "1",
        "1",
        "1",
        String(intBetween(random, 4, 90)),
        String(intBetween(random, 2, 60)),
        String(intBetween(random, 5, 90)),
        quote(created),
        quote(created),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// 4. TƏRƏFDAŞLAR
// ---------------------------------------------------------------------------

function buildPartners(): void {
  section("TƏRƏFDAŞLAR");

  for (const [index, partner] of DEMO_PARTNERS.entries()) {
    const id = `demo_partner_${index + 1}`;
    const created = isoDate(-320 + index * 6);

    insert(
      "Partner",
      [
        "id", "name", "slug", "legalName", "shortDescription", "description",
        "websiteUrl", "email", "phone", "logoUrl", "coverImage", "country", "city",
        "partnershipType", "status", "verified", "verifiedAt", "officialPartner",
        "featured", "showPublicly", "showOnHomepage", "officialSince", "sortOrder",
        "isDemo", "createdAt", "updatedAt",
      ],
      [
        quote(id),
        quote(partner.name),
        quote(partner.slug),
        quote(`${partner.name} MMC`),
        quote(partner.desc),
        quote(
          `<p>${partner.desc}</p><p>${DEMO_NOTICE.replace("nümunə elandır", "nümunə tərəfdaş qeydidir")}</p>`,
        ),
        "NULL",
        quote(`${partner.slug}@luxehomeestate.test`),
        quote(`+994 12 000 ${String(70 + index).padStart(2, "0")} 00`),
        quote(unsplash(partner.photo, 480)),
        quote(unsplash(partner.photo, 1600)),
        "'Azərbaycan'",
        quote(partner.city),
        quote(partner.type),
        "'ACTIVE'",
        partner.official ? "1" : "0",
        partner.official ? quote(created) : "NULL",
        partner.official ? "1" : "0",
        index < 4 ? "1" : "0",
        "1",
        partner.home ? "1" : "0",
        partner.official ? quote(created) : "NULL",
        String(index),
        "1",
        quote(created),
        quote(created),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// 5. BLOQ
// ---------------------------------------------------------------------------

function buildPosts(): void {
  section("BLOQ YAZILARI");

  for (const [index, post] of DEMO_POSTS.entries()) {
    const random = createRandom(3000 + index * 17);
    const id = `demo_post_${index + 1}`;
    const published = isoDate(-index * 5 - 3);

    const body = [
      `<p>${post.lead}</p>`,
      "<h2>Nümunə məzmun barədə</h2>",
      `<p>${DEMO_NOTICE.replace("nümunə elandır", "nümunə bloq yazısıdır")}</p>`,
      "<h2>Əsas məqamlar</h2>",
      "<ul>",
      "<li>Mövzu üzrə praktik addımlar sadə dildə izah olunur.</li>",
      "<li>Rəqəmlər və nümunələr yalnız təsvir məqsədi daşıyır.</li>",
      "<li>Real qərar verməzdən əvvəl mütəxəssis rəyi alınmalıdır.</li>",
      "</ul>",
      "<h2>Nəticə</h2>",
      "<p>Bu yazı platformanın bloq səthinin — kart, siyahı, kateqoriya filtri və " +
        "detal səhifəsinin — real məzmun həcmi ilə necə göründüyünü yoxlamaq üçün hazırlanıb.</p>",
    ].join("");

    insert(
      "BlogPost",
      [
        "id", "title", "slug", "excerpt", "content", "coverUrl", "coverAlt",
        "categoryId", "status", "isDemo", "viewCount", "readMinutes",
        "publishedAt", "createdAt", "updatedAt",
      ],
      [
        quote(id),
        quote(post.title),
        quote(post.slug),
        quote(post.lead),
        quote(body),
        quote(unsplash(post.photo, 1600)),
        quote(`${post.title} — nümunə şəkil`),
        lookup("BlogCategory", post.cat),
        "'PUBLISHED'",
        "1",
        String(intBetween(random, 20, 1200)),
        String(intBetween(random, 3, 9)),
        quote(published),
        quote(published),
        quote(published),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// İCRA
// ---------------------------------------------------------------------------

lines.push(
  "-- Luxe Home Estate — nümunə (demo) məzmun.",
  "--",
  "-- Bu fayl `npm run db:demo:build` ilə `prisma/build-demo-content.ts`-dən",
  "-- yaradılır; ƏL İLƏ REDAKTƏ EDİLMƏMƏLİDİR.",
  "--",
  "-- Bütün qeydlər `isDemo = 1` daşıyır və ictimai saytda yalnız paneldəki",
  "-- «Nümunə məzmun» açarı aktiv olduqda görünür. Silmək üçün:",
  "--   npm run db:clean-demo:local | :staging | :remote",
  "--",
  "-- Skript təkrar icra üçün təhlükəsizdir (INSERT OR IGNORE).",
);

buildProperties();
buildProjects();
buildAgenciesAndAgents();
buildPartners();
buildPosts();

writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");

const counts = {
  elan: CATEGORY_RECIPES.length * PER_CATEGORY,
  kompleks: DEMO_PROJECTS.length,
  agentlik: DEMO_AGENCIES.length,
  agent: DEMO_AGENTS.length,
  terefdas: DEMO_PARTNERS.length,
  bloq: DEMO_POSTS.length,
};

console.log(`✓ ${outputPath}`);
console.log(
  `  ${counts.elan} elan (${CATEGORY_RECIPES.length} kateqoriya × ${PER_CATEGORY}), ` +
    `${counts.kompleks} yaşayış kompleksi, ${counts.agentlik} agentlik, ` +
    `${counts.agent} agent, ${counts.terefdas} tərəfdaş, ${counts.bloq} bloq yazısı`,
);
console.log(`  ${lines.length} SQL sətri`);
