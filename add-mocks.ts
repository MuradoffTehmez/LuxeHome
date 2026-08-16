import { PrismaClient } from "@prisma/client";
import { slugify } from "./src/lib/utils";

const prisma = new PrismaClient();

const ADJECTIVES = ["Müasir", "Lüks", "Tam Təmirli", "Yeni", "Klasik", "Eksklüziv", "Premium", "Gözəl mənzərəli", "Geniş", "Rahat"];
const PROPERTY_TYPES = ["Mənzil", "Villa", "Həyət evi", "Obyekt", "Ofis", "Torpaq sahəsi"];
const LOCATIONS = ["Gənclik", "28 May", "Nərimanov", "Elmlər Akademiyası", "Badamdar", "Yasamal", "Nizami", "Xətai", "Səbail", "Biləcəri", "Mərdəkan", "Şüvəlan"];

function getRandomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const PHOTOS = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",
  "https://images.unsplash.com/photo-1556909212-d5b604d0c90d",
  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
  "https://images.unsplash.com/photo-1620626011761-996317b8d101",
];

async function addMocks() {
  console.log("Generating fresh mock properties...");

  const existingCities = await prisma.location.findMany({ where: { kind: 'CITY' } });
  const existingTypes = await prisma.propertyType.findMany();

  if (existingCities.length === 0 || existingTypes.length === 0) {
    console.log("No cities or types found. Run seed first.");
    return;
  }

  let count = 0;
  for (let i = 0; i < 40; i++) {
    const adj = getRandomItem(ADJECTIVES);
    const pTypeStr = getRandomItem(PROPERTY_TYPES);
    const loc = getRandomItem(LOCATIONS);
    
    const title = `[Nümunə] ${loc} ərazisində ${adj.toLowerCase()} ${pTypeStr.toLowerCase()}`;
    // slugify Azərbaycan hərflərini transliterasiya edir — sadə regex ə/ş/ç/ğ-nı silirdi
    const slug = `${slugify(`numune ${loc} ${adj} ${pTypeStr}`)}-${Date.now() + i}`;

    const cityId = existingCities[Math.floor(Math.random() * existingCities.length)].id;
    const typeId = existingTypes[Math.floor(Math.random() * existingTypes.length)].id;

    const isSale = Math.random() > 0.3; // 70% sale
    const price = isSale ? getRandomInt(100000, 900000) : getRandomInt(500, 3000);
    const rooms = getRandomInt(1, 6);
    const area = getRandomInt(40, 400);

    const imagesToUse = [...PHOTOS].sort(() => 0.5 - Math.random()).slice(0, 3);
    const newImages = imagesToUse.map((url, idx) => ({
      url: `${url}?auto=format&fit=crop&w=1600&q=80`,
      alt: `${title} - Şəkil ${idx + 1}`,
      order: idx,
    }));

    await prisma.property.create({
      data: {
        title,
        slug,
        description: "NÜMUNƏ ELAN. Bu qeyd platformanın necə işlədiyini göstərmək üçün yaradılıb və real satışda olan əmlak deyil.\n\nMüasir standartlara cavab verən, ideal təmirli və əlverişli yerdə yerləşən əla əmlak. Ətraflı məlumat üçün zəng edin.",
        listingType: isSale ? "SALE" : "RENT",
        status: "PUBLISHED",
        // Sıralama publishedAt üzrədir — set olunmasa elanlar siyahının sonuna düşür
        publishedAt: new Date(Date.now() - getRandomInt(0, 60) * 86_400_000),
        price,
        // İcazə verilən dəyərlər: MONTH | DAY (src/lib/constants.ts)
        pricePeriod: isSale ? null : "MONTH",
        cityId,
        typeId,
        address: `Nümunə ünvan, ${loc}`,
        rooms,
        bedrooms: rooms > 1 ? rooms - 1 : 1,
        bathrooms: getRandomInt(1, 3),
        area,
        floor: getRandomInt(1, 15),
        totalFloors: getRandomInt(5, 20),
        renovation: "RENOVATED",
        documentStatus: "TITLE_DEED",
        isFeatured: Math.random() > 0.8,
        isDemo: true,
        metaTitle: `${title} — Luxe Home Estate`,
        metaDescription: "NÜMUNƏ ELAN. Bu qeyd platformanın necə işlədiyini göstərmək üçün yaradılıb və real satışda olan əmlak deyil.",
        images: {
          create: newImages,
        }
      }
    });
    count++;
  }

  console.log(`Added ${count} fresh mock properties.`);
}

addMocks()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
