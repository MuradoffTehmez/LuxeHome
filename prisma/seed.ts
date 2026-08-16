/**
 * Luxe Home Estate — demo məlumat generatoru.
 *
 * ⚠️ VACİB
 * Bu faylda yaradılan bütün əmlak, layihə və bloq yazıları NÜMUNƏ
 * məlumatlardır. Hər biri `isDemo: true` sahəsi ilə işarələnir və saytda
 * "Nümunə" nişanı ilə göstərilir.
 *
 * Şirkətin real məlumatları admin panel vasitəsilə əlavə edildikdən sonra
 * bu qeydlər silinməlidir:  npm run db:clean-demo
 *
 * Şəkillər: Unsplash (pulsuz kommersiya lisenziyası).
 * TODO: Şirkətin öz foto arxivi ilə əvəzlənməlidir.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// ŞƏKİL MƏNBƏYİ
// ---------------------------------------------------------------------------

const IMG = (id: string, width = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

/** Unsplash foto ID-ləri — daşınmaz əmlak, memarlıq və interyer. */
const PHOTOS = {
  heroVilla: "1613490493576-7fde63acd811",
  villaExterior: "1600596542815-ffad4c1539a9",
  villaPool: "1580587771525-78b9dba3b914",
  villaLiving: "1600210492486-724fe5c67fb0",
  villaKitchen: "1556909212-d5b604d0c90d",
  villaBedroom: "1616594039964-ae9021a400a0",
  apartmentTower: "1545324418-cc1a3fa10c00",
  apartmentInterior: "1502672260266-1c1ef2d93688",
  apartmentLiving: "1522708323590-d24dbb6b0267",
  apartmentKitchen: "1600585154340-be6161a56a0c",
  apartmentBath: "1620626011761-996317b8d101",
  cityPanorama: "1541888946425-d81bb19240f5",
  houseGarden: "1568605114967-8130f3a36994",
  houseFacade: "1570129477492-45c003edd2be",
  countryHouse: "1512917774080-9991f1c4c750",
  land: "1500382017468-9049fed747ef",
  officeBuilding: "1497366216548-37526070297c",
  officeInterior: "1497366811353-6870744d04b2",
  retailSpace: "1441986300917-64674bd600d8",
  construction: "1503387762-592deb58ef4e",
  constructionSite: "1590644365607-1c5a0d1b0a4a",
  landscape: "1600607687939-ce8a6c25118c",
  interiorDesign: "1618221195710-dd6b41faaea6",
  marketNews: "1560518883-ce09059eeffa",
  mortgage: "1554224155-6726b3ff858f",
  keys: "1560448204-e02f11c3d0e2",
  blueprint: "1503387762-592deb58ef4e",
  renovation: "1581094794329-c8112a89af12",
} as const;

// ---------------------------------------------------------------------------
// KÖMƏKÇİLƏR
// ---------------------------------------------------------------------------

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function main() {
  console.log("→ Demo məlumat yüklənir...\n");

  // -------------------------------------------------------------------------
  // 1. İSTİFADƏÇİLƏR
  // -------------------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@luxehomeestate.az";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "LuxeHomeEstate2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Sistem Administratoru",
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "redaktor@luxehomeestate.az" },
    update: {},
    create: {
      name: "Məzmun Redaktoru",
      email: "redaktor@luxehomeestate.az",
      passwordHash: await bcrypt.hash("Redaktor2026!", 12),
      role: "EDITOR",
    },
  });

  console.log(`  ✓ İstifadəçilər — giriş: ${adminEmail}`);

  // -------------------------------------------------------------------------
  // 2. ƏMLAK NÖVLƏRİ
  // -------------------------------------------------------------------------
  const typeData = [
    {
      name: "Mənzillər",
      slug: "menziller",
      icon: "Building2",
      description: "Yeni tikili və köhnə fondda mənzillər.",
      imageUrl: IMG(PHOTOS.apartmentTower, 1200),
    },
    {
      name: "Villalar",
      slug: "villalar",
      icon: "Home",
      description: "Premium villa və malikanələr.",
      imageUrl: IMG(PHOTOS.villaExterior, 1200),
    },
    {
      name: "Həyət evləri",
      slug: "heyet-evleri",
      icon: "House",
      description: "Şəhər və qəsəbələrdə həyət evləri.",
      imageUrl: IMG(PHOTOS.houseFacade, 1200),
    },
    {
      name: "Bağ evləri",
      slug: "bag-evleri",
      icon: "Trees",
      description: "İstirahət üçün bağ evləri.",
      imageUrl: IMG(PHOTOS.countryHouse, 1200),
    },
    {
      name: "Torpaq",
      slug: "torpaq",
      icon: "LandPlot",
      description: "Tikinti və kənd təsərrüfatı üçün torpaq sahələri.",
      imageUrl: IMG(PHOTOS.land, 1200),
    },
    {
      name: "Ofislər",
      slug: "ofisler",
      icon: "Briefcase",
      description: "Biznes mərkəzlərində ofis sahələri.",
      imageUrl: IMG(PHOTOS.officeBuilding, 1200),
    },
    {
      name: "Obyektlər",
      slug: "obyektler",
      icon: "Store",
      description: "Kommersiya obyektləri və ticarət sahələri.",
      imageUrl: IMG(PHOTOS.retailSpace, 1200),
    },
  ];

  const types: Record<string, string> = {};
  for (const [index, type] of typeData.entries()) {
    const record = await prisma.propertyType.upsert({
      where: { slug: type.slug },
      update: {},
      create: { ...type, order: index },
    });
    types[type.slug] = record.id;
  }
  console.log(`  ✓ Əmlak növləri (${typeData.length})`);

  // -------------------------------------------------------------------------
  // 3. LOKASİYALAR
  // -------------------------------------------------------------------------
  const cityData = [
    {
      name: "Bakı",
      slug: "baki",
      districts: [
        "Səbail",
        "Nəsimi",
        "Yasamal",
        "Nərimanov",
        "Xətai",
        "Nizami",
        "Binəqədi",
        "Xəzər",
        "Sabunçu",
        "Suraxanı",
        "Qaradağ",
        "Pirallahı",
        "Mərdəkan",
        "Şüvəlan",
        "Buzovna",
        "Novxanı",
        "Bilgəh",
      ],
    },
    { name: "Sumqayıt", slug: "sumqayit", districts: ["Mərkəz", "Corat", "Haci Zeynalabdin"] },
    { name: "Xırdalan", slug: "xirdalan", districts: ["Mərkəz", "Masazır", "Digah"] },
    { name: "Qəbələ", slug: "qebele", districts: ["Mərkəz", "Həmzəli", "Vəndam"] },
    { name: "Şəki", slug: "seki", districts: ["Mərkəz", "Kiş"] },
    { name: "Quba", slug: "quba", districts: ["Mərkəz", "Qriz"] },
  ];

  const cities: Record<string, string> = {};
  const districts: Record<string, string> = {};

  for (const [cityIndex, city] of cityData.entries()) {
    const cityRecord = await prisma.location.upsert({
      where: { slug: city.slug },
      update: {},
      create: { name: city.name, slug: city.slug, kind: "CITY", order: cityIndex },
    });
    cities[city.slug] = cityRecord.id;

    for (const [districtIndex, districtName] of city.districts.entries()) {
      const districtSlug = `${city.slug}-${districtName
        .toLowerCase()
        .replace(/ə/g, "e")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ç/g, "c")
        .replace(/ğ/g, "g")
        .replace(/\s+/g, "-")}`;

      const districtRecord = await prisma.location.upsert({
        where: { slug: districtSlug },
        update: {},
        create: {
          name: districtName,
          slug: districtSlug,
          kind: "DISTRICT",
          parentId: cityRecord.id,
          order: districtIndex,
        },
      });
      districts[districtSlug] = districtRecord.id;
    }
  }
  console.log(`  ✓ Şəhər və rayonlar (${cityData.length} şəhər)`);

  // -------------------------------------------------------------------------
  // 4. XÜSUSİYYƏTLƏR
  // -------------------------------------------------------------------------
  const featureData = [
    { name: "Hovuz", slug: "hovuz", icon: "Waves", group: "OUTDOOR" },
    { name: "Qaraj", slug: "qaraj", icon: "Car", group: "OUTDOOR" },
    { name: "Həyət", slug: "heyet", icon: "Trees", group: "OUTDOOR" },
    { name: "Bağça / landşaft", slug: "bagca", icon: "Flower2", group: "OUTDOOR" },
    { name: "Mangal zonası", slug: "mangal", icon: "Flame", group: "OUTDOOR" },
    { name: "Lift", slug: "lift", icon: "MoveVertical", group: "INDOOR" },
    { name: "Kombi", slug: "kombi", icon: "Thermometer", group: "INDOOR" },
    { name: "Kondisioner", slug: "kondisioner", icon: "Wind", group: "INDOOR" },
    { name: "Mebel", slug: "mebel", icon: "Sofa", group: "INDOOR" },
    { name: "Kamin", slug: "kamin", icon: "Flame", group: "INDOOR" },
    { name: "Balkon / eyvan", slug: "balkon", icon: "Columns2", group: "INDOOR" },
    { name: "Hamam / sauna", slug: "sauna", icon: "Droplets", group: "INDOOR" },
    { name: "Mərkəzi istilik", slug: "merkezi-istilik", icon: "Radiation", group: "INDOOR" },
    { name: "Təhlükəsizlik kamerası", slug: "kamera", icon: "Cctv", group: "SECURITY" },
    { name: "24/7 mühafizə", slug: "muhafize", icon: "ShieldCheck", group: "SECURITY" },
    { name: "Domofon", slug: "domofon", icon: "Bell", group: "SECURITY" },
    { name: "Qapalı ərazi", slug: "qapali-erazi", icon: "Fence", group: "SECURITY" },
    { name: "İnternet", slug: "internet", icon: "Wifi", group: "GENERAL" },
    { name: "Parkinq", slug: "parkinq", icon: "SquareParking", group: "GENERAL" },
    { name: "Dəniz mənzərəsi", slug: "deniz-menzeresi", icon: "Sailboat", group: "GENERAL" },
  ];

  const features: Record<string, string> = {};
  for (const [index, feature] of featureData.entries()) {
    const record = await prisma.feature.upsert({
      where: { slug: feature.slug },
      update: {},
      create: { ...feature, order: index },
    });
    features[feature.slug] = record.id;
  }
  console.log(`  ✓ Xüsusiyyətlər (${featureData.length})`);

  // -------------------------------------------------------------------------
  // 5. XİDMƏTLƏR — real şirkət xidmətləri
  // -------------------------------------------------------------------------
  const serviceData = [
    {
      title: "Alqı-Satqı",
      slug: "alqi-satqi",
      icon: "Handshake",
      shortDescription: "Daşınmaz əmlakın alqı-satqısı üzrə peşəkar xidmət.",
      description:
        "Luxe Home Estate daşınmaz əmlakın alqı-satqısı prosesini əvvəldən sona qədər müşayiət edir. Əmlakın bazar dəyərinin qiymətləndirilməsindən başlayaraq, uyğun alıcı və ya satıcının tapılması, danışıqların aparılması, sənədlərin yoxlanılması və notarial rəsmiləşdirməyə qədər bütün mərhələlərdə yanınızdayıq.\n\nHər bir əmlak üzrə hüquqi təmizlik yoxlanılır, sənəd vəziyyəti dəqiqləşdirilir və tərəflər arasında şəffaf razılaşma təmin edilir.",
      bullets: JSON.stringify([
        "Əmlakın bazar dəyərinin qiymətləndirilməsi",
        "Hüquqi sənədlərin yoxlanılması",
        "Alıcı və satıcı arasında danışıqların aparılması",
        "Notarial rəsmiləşdirmənin təşkili",
        "Əməliyyat sonrası dəstək",
      ]),
      imageUrl: IMG(PHOTOS.keys, 1400),
    },
    {
      title: "İcarə",
      slug: "icare",
      icon: "KeyRound",
      shortDescription: "Mənzil, villa, ofis və digər əmlakların icarəsi.",
      description:
        "Qısa və uzunmüddətli icarə üzrə geniş portfel təqdim edirik. Mənzil, villa, bağ evi, ofis və kommersiya obyektləri üzrə tələbinizə uyğun variantları seçir, baxış təşkil edir və icarə müqaviləsinin hazırlanmasında dəstək göstəririk.\n\nHəm icarəyə verən, həm də icarəçi üçün şərtlərin aydın və qarşılıqlı sərfəli olmasına diqqət yetirilir.",
      bullets: JSON.stringify([
        "Qısa və uzunmüddətli icarə variantları",
        "Baxışların təşkili",
        "İcarə müqaviləsinin hazırlanması",
        "Əmlak sahibi üçün icarəçi seçimi",
        "İcarə müddətində əlaqələndirmə",
      ]),
      imageUrl: IMG(PHOTOS.apartmentLiving, 1400),
    },
    {
      title: "İpoteka",
      slug: "ipoteka",
      icon: "Landmark",
      shortDescription: "İpoteka yolu ilə əmlak əldə etmək üçün dəstək.",
      description:
        "İpoteka ilə mənzil almaq istəyən müştərilərə prosesin başa düşülməsində və sənədlərin hazırlanmasında kömək edirik. Hansı əmlakların ipoteka şərtlərinə uyğun olduğunu müəyyənləşdirir, bank tələblərinə uyğun sənəd paketinin toplanmasında yönləndiririk.\n\nQeyd: kredit qərarı və şərtləri müvafiq maliyyə qurumu tərəfindən müəyyən edilir.",
      bullets: JSON.stringify([
        "İpotekaya uyğun əmlakların seçimi",
        "Sənəd paketinin hazırlanmasında dəstək",
        "Bank tələbləri üzrə məsləhət",
        "Əmlakın qiymətləndirilməsinin təşkili",
        "Rəsmiləşdirmə mərhələsində müşayiət",
      ]),
      imageUrl: IMG(PHOTOS.mortgage, 1400),
    },
    {
      title: "Daxili Kredit",
      slug: "daxili-kredit",
      icon: "Wallet",
      shortDescription: "Şirkətin təqdim etdiyi daxili kredit imkanları.",
      description:
        "Bəzi əmlaklar üzrə şirkət daxili ödəniş imkanları təklif olunur. Bu imkan alıcıya ödənişi mərhələlərlə həyata keçirməyə şərait yaradır.\n\nDaxili kredit şərtləri hər bir əmlak üzrə fərdi müəyyən edilir. Konkret şərtləri öyrənmək üçün bizimlə əlaqə saxlayın.",
      bullets: JSON.stringify([
        "Əmlak üzrə fərdi ödəniş qrafiki",
        "İlkin ödəniş variantları",
        "Şəffaf şərtlər və razılaşma",
        "Rəsmi müqavilə ilə rəsmiləşdirmə",
      ]),
      imageUrl: IMG(PHOTOS.marketNews, 1400),
    },
    {
      title: "Təmir-Tikinti",
      slug: "temir-tikinti",
      icon: "Hammer",
      shortDescription: "Əmlakların təmir və tikinti işlərinin həyata keçirilməsi.",
      description:
        "Aldığınız və ya mövcud əmlakınızın təmir və tikinti işlərini təşkil edirik. Kosmetik təmirdən başlayaraq tam yenidənqurma və daxili dizayn işlərinə qədər müxtəlif həcmli layihələr üzrə xidmət göstərilir.\n\nİş başlamazdan əvvəl smeta hazırlanır, mərhələlər və müddət razılaşdırılır.",
      bullets: JSON.stringify([
        "Kosmetik və əsaslı təmir",
        "Daxili dizayn və planlaşdırma",
        "Smeta və iş qrafikinin hazırlanması",
        "Material seçimində dəstək",
        "İşin mərhələli təhvili",
      ]),
      imageUrl: IMG(PHOTOS.renovation, 1400),
    },
    {
      title: "Reklam",
      slug: "reklam",
      icon: "Megaphone",
      shortDescription: "Daşınmaz əmlakların tanıtımı və reklam xidmətləri.",
      description:
        "Əmlakınızın daha geniş auditoriyaya çatması üçün tanıtım xidmətləri təqdim edirik. Elanın hazırlanması, sosial media və rəqəmsal platformalarda yerləşdirilməsi, hədəflənmiş reklam kampaniyalarının qurulması bu xidmətə daxildir.\n\nMəqsəd əmlakın düzgün auditoriyaya, düzgün formatda təqdim edilməsidir.",
      bullets: JSON.stringify([
        "Elan mətninin peşəkar hazırlanması",
        "Sosial media tanıtımı",
        "Hədəflənmiş rəqəmsal reklam",
        "Luxe Home Estate platformasında yerləşdirmə",
        "Nəticələr üzrə hesabat",
      ]),
      imageUrl: IMG(PHOTOS.cityPanorama, 1400),
    },
    {
      title: "Çəkiliş",
      slug: "cekilis",
      icon: "Camera",
      shortDescription: "Professional foto və video çəkiliş xidmətləri.",
      description:
        "Daşınmaz əmlakın satış sürətini ən çox təsir edən amillərdən biri keyfiyyətli vizual materialdır. Peşəkar foto və video çəkiliş, dron çəkilişi və 360° panoram materiallarının hazırlanması üzrə xidmət göstəririk.\n\nHər çəkiliş əmlakın güclü tərəflərini önə çıxaracaq şəkildə planlaşdırılır.",
      bullets: JSON.stringify([
        "Peşəkar interyer və eksteryer fotoçəkilişi",
        "Video təqdimat rolikləri",
        "Dron ilə hava çəkilişi",
        "Şəkillərin peşəkar emalı",
        "Sosial media üçün format hazırlığı",
      ]),
      imageUrl: IMG(PHOTOS.villaLiving, 1400),
    },
  ];

  for (const [index, service] of serviceData.entries()) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: {
        ...service,
        order: index,
        metaTitle: `${service.title} — Luxe Home Estate`,
        metaDescription: service.shortDescription,
      },
    });
  }
  console.log(`  ✓ Xidmətlər (${serviceData.length})`);

  // -------------------------------------------------------------------------
  // 6. LAYİHƏLƏR — NÜMUNƏ
  // -------------------------------------------------------------------------
  const projectData = [
    {
      name: "[Nümunə] Ağ Şəhər Rezidens",
      slug: "numune-ag-seher-rezidens",
      summary:
        "Şəhərin mərkəzi hissəsində müasir yaşayış kompleksi — nümunə layihə məlumatı.",
      description:
        "Bu qeyd platformanın layihə bölməsinin necə işlədiyini göstərmək üçün yaradılmış NÜMUNƏ məlumatdır və real Luxe Home Estate layihəsi deyil.\n\nReal layihə əlavə edildikdə admin panel vasitəsilə bu qeyd silinməli və yerinə şirkətin təsdiqlədiyi məlumatlar daxil edilməlidir.",
      projectType: "RESIDENTIAL",
      status: "ONGOING",
      cityId: cities["baki"],
      address: "Nümunə ünvan, Bakı",
      year: 2026,
      totalArea: 18500,
      floors: 16,
      unitCount: 120,
      coverUrl: IMG(PHOTOS.apartmentTower),
      highlights: JSON.stringify([
        "Yeraltı parkinq",
        "Qapalı həyət və landşaft",
        "24/7 mühafizə",
        "Fitness zonası",
        "Uşaq oyun meydançası",
      ]),
      timeline: JSON.stringify([
        { step: "01", title: "Layihələndirmə", done: true },
        { step: "02", title: "Fundament", done: true },
        { step: "03", title: "Konstruksiya", done: true },
        { step: "04", title: "İnteryer", done: false },
        { step: "05", title: "Eksteryer", done: false },
        { step: "06", title: "Təhvil", done: false },
      ]),
      images: [
        { url: IMG(PHOTOS.apartmentTower), category: "EXTERIOR", alt: "Nümunə layihə — bina fasadı" },
        { url: IMG(PHOTOS.apartmentInterior), category: "INTERIOR", alt: "Nümunə layihə — interyer" },
        { url: IMG(PHOTOS.constructionSite), category: "CONSTRUCTION", alt: "Nümunə layihə — tikinti prosesi" },
        { url: IMG(PHOTOS.landscape), category: "LANDSCAPE", alt: "Nümunə layihə — landşaft" },
      ],
    },
    {
      name: "[Nümunə] Mərdəkan Villa Park",
      slug: "numune-merdekan-villa-park",
      summary: "Qapalı ərazidə villa kompleksi — nümunə layihə məlumatı.",
      description:
        "Bu qeyd NÜMUNƏ məlumatdır və real Luxe Home Estate layihəsi deyil. Layihə bölməsinin strukturunu göstərmək üçün yaradılıb.\n\nReal layihə məlumatları rəhbərlik tərəfindən təsdiqləndikdən sonra admin panel vasitəsilə əlavə edilməlidir.",
      projectType: "VILLA",
      status: "COMPLETED",
      cityId: cities["baki"],
      address: "Nümunə ünvan, Mərdəkan",
      year: 2024,
      totalArea: 12000,
      floors: 2,
      unitCount: 18,
      coverUrl: IMG(PHOTOS.villaExterior),
      highlights: JSON.stringify([
        "Fərdi hovuz",
        "Qapalı ərazi",
        "Landşaft dizaynı",
        "Mangal zonası",
      ]),
      timeline: JSON.stringify([
        { step: "01", title: "Layihələndirmə", done: true },
        { step: "02", title: "Fundament", done: true },
        { step: "03", title: "Konstruksiya", done: true },
        { step: "04", title: "İnteryer", done: true },
        { step: "05", title: "Eksteryer", done: true },
        { step: "06", title: "Təhvil", done: true },
      ]),
      images: [
        { url: IMG(PHOTOS.villaExterior), category: "EXTERIOR", alt: "Nümunə villa layihəsi — eksteryer" },
        { url: IMG(PHOTOS.villaPool), category: "LANDSCAPE", alt: "Nümunə villa layihəsi — hovuz" },
        { url: IMG(PHOTOS.villaLiving), category: "INTERIOR", alt: "Nümunə villa layihəsi — qonaq otağı" },
      ],
    },
    {
      name: "[Nümunə] Xırdalan Biznes Mərkəzi",
      slug: "numune-xirdalan-biznes-merkezi",
      summary: "Kommersiya təyinatlı biznes mərkəzi — nümunə layihə məlumatı.",
      description:
        "Bu qeyd NÜMUNƏ məlumatdır. Real kommersiya layihələri şirkət tərəfindən təsdiqləndikdən sonra əlavə ediləcək.",
      projectType: "COMMERCIAL",
      status: "PLANNED",
      cityId: cities["xirdalan"],
      address: "Nümunə ünvan, Xırdalan",
      year: 2027,
      totalArea: 9200,
      floors: 8,
      unitCount: 46,
      coverUrl: IMG(PHOTOS.officeBuilding),
      highlights: JSON.stringify([
        "Açıq planlı ofis sahələri",
        "Yeraltı parkinq",
        "Konfrans zalı",
        "Enerji səmərəli fasad",
      ]),
      timeline: JSON.stringify([
        { step: "01", title: "Layihələndirmə", done: true },
        { step: "02", title: "Fundament", done: false },
        { step: "03", title: "Konstruksiya", done: false },
        { step: "04", title: "İnteryer", done: false },
        { step: "05", title: "Eksteryer", done: false },
        { step: "06", title: "Təhvil", done: false },
      ]),
      images: [
        { url: IMG(PHOTOS.officeBuilding), category: "EXTERIOR", alt: "Nümunə biznes mərkəzi — fasad" },
        { url: IMG(PHOTOS.officeInterior), category: "INTERIOR", alt: "Nümunə biznes mərkəzi — ofis sahəsi" },
      ],
    },
  ];

  const projectIds: Record<string, string> = {};
  for (const [index, project] of projectData.entries()) {
    const { images, ...data } = project;
    const existing = await prisma.project.findUnique({ where: { slug: project.slug } });
    if (existing) {
      projectIds[project.slug] = existing.id;
      continue;
    }

    const record = await prisma.project.create({
      data: {
        ...data,
        isDemo: true,
        order: index,
        metaTitle: `${project.name} — Luxe Home Estate`,
        metaDescription: project.summary,
        images: {
          create: images.map((image, imageIndex) => ({
            url: image.url,
            alt: image.alt,
            category: image.category,
            order: imageIndex,
          })),
        },
      },
    });
    projectIds[project.slug] = record.id;
  }
  console.log(`  ✓ Layihələr (${projectData.length}) — hamısı NÜMUNƏ`);

  // -------------------------------------------------------------------------
  // 7. ƏMLAKLAR — NÜMUNƏ
  // -------------------------------------------------------------------------
  type SeedProperty = {
    title: string;
    slug: string;
    description: string;
    listingType: string;
    status: string;
    price: number;
    pricePeriod?: string;
    typeSlug: string;
    citySlug: string;
    districtSlug?: string;
    address: string;
    latitude?: number;
    longitude?: number;
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    landArea?: number;
    floor?: number;
    totalFloors?: number;
    renovation?: string;
    documentStatus?: string;
    isFeatured?: boolean;
    featureSlugs: string[];
    images: { url: string; alt: string }[];
    projectSlug?: string;
    daysOld: number;
  };

  const propertyData: SeedProperty[] = [
    {
      title: "[Nümunə] Mərdəkanda hovuzlu premium villa",
      slug: "numune-merdekanda-hovuzlu-premium-villa",
      description:
        "NÜMUNƏ ELAN. Bu qeyd platformanın necə işlədiyini göstərmək üçün yaradılıb və real satışda olan əmlak deyil.\n\nİki mərtəbəli, geniş həyətyanı sahəsi olan villa. Birinci mərtəbədə geniş qonaq otağı, mətbəx və yeməkxana, ikinci mərtəbədə yataq otaqları yerləşir. Həyətdə hovuz, mangal zonası və landşaft işlənmiş yaşıllıq sahəsi var.\n\nReal əmlak elanları admin panel vasitəsilə əlavə edilir.",
      listingType: "SALE",
      status: "PUBLISHED",
      price: 450000,
      typeSlug: "villalar",
      citySlug: "baki",
      districtSlug: "baki-merdekan",
      address: "Nümunə ünvan, Mərdəkan qəsəbəsi",
      latitude: 40.4926,
      longitude: 50.1406,
      rooms: 5,
      bedrooms: 4,
      bathrooms: 3,
      area: 320,
      landArea: 8,
      floor: 2,
      totalFloors: 2,
      renovation: "DESIGNER",
      documentStatus: "TITLE_DEED",
      isFeatured: true,
      featureSlugs: ["hovuz", "qaraj", "heyet", "bagca", "mangal", "kamera", "muhafize", "internet"],
      images: [
        { url: IMG(PHOTOS.villaExterior), alt: "Nümunə villa — eksteryer görünüş" },
        { url: IMG(PHOTOS.villaPool), alt: "Nümunə villa — hovuz sahəsi" },
        { url: IMG(PHOTOS.villaLiving), alt: "Nümunə villa — qonaq otağı" },
        { url: IMG(PHOTOS.villaKitchen), alt: "Nümunə villa — mətbəx" },
        { url: IMG(PHOTOS.villaBedroom), alt: "Nümunə villa — yataq otağı" },
      ],
      projectSlug: "numune-merdekan-villa-park",
      daysOld: 2,
    },
    {
      title: "[Nümunə] Səbaildə dəniz mənzərəli 3 otaqlı mənzil",
      slug: "numune-sebaildei-deniz-menzereli-3-otaqli-menzil",
      description:
        "NÜMUNƏ ELAN. Şəhərin mərkəzi hissəsində, yeni tikili binada dəniz mənzərəli mənzil.\n\nMənzil tam təmirli və mebelli vəziyyətdədir. Binada lift, yeraltı parkinq və 24 saat mühafizə xidməti mövcuddur.\n\nBu qeyd nümunədir — real elanlar admin panel vasitəsilə əlavə edilir.",
      listingType: "SALE",
      status: "PUBLISHED",
      price: 285000,
      typeSlug: "menziller",
      citySlug: "baki",
      districtSlug: "baki-sebail",
      address: "Nümunə ünvan, Səbail rayonu",
      latitude: 40.3667,
      longitude: 49.8352,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 2,
      area: 128,
      floor: 12,
      totalFloors: 18,
      renovation: "RENOVATED",
      documentStatus: "TITLE_DEED",
      isFeatured: true,
      featureSlugs: ["lift", "kombi", "kondisioner", "mebel", "balkon", "parkinq", "deniz-menzeresi", "muhafize"],
      images: [
        { url: IMG(PHOTOS.apartmentInterior), alt: "Nümunə mənzil — daxili görünüş" },
        { url: IMG(PHOTOS.apartmentLiving), alt: "Nümunə mənzil — qonaq otağı" },
        { url: IMG(PHOTOS.apartmentKitchen), alt: "Nümunə mənzil — mətbəx" },
        { url: IMG(PHOTOS.apartmentBath), alt: "Nümunə mənzil — sanitar qovşaq" },
      ],
      projectSlug: "numune-ag-seher-rezidens",
      daysOld: 4,
    },
    {
      title: "[Nümunə] Nərimanovda 2 otaqlı mənzil kirayə",
      slug: "numune-nerimanovda-2-otaqli-menzil-kiraye",
      description:
        "NÜMUNƏ ELAN. Metro stansiyasına yaxın məsafədə, yeni təmirli 2 otaqlı mənzil aylıq icarəyə verilir.\n\nMənzil tam mebelli və məişət texnikası ilə təchiz olunub. Uzunmüddətli icarə üstünlük təşkil edir.",
      listingType: "RENT",
      status: "PUBLISHED",
      price: 900,
      pricePeriod: "MONTH",
      typeSlug: "menziller",
      citySlug: "baki",
      districtSlug: "baki-nerimanov",
      address: "Nümunə ünvan, Nərimanov rayonu",
      latitude: 40.4093,
      longitude: 49.8671,
      rooms: 2,
      bedrooms: 1,
      bathrooms: 1,
      area: 74,
      floor: 6,
      totalFloors: 12,
      renovation: "RENOVATED",
      documentStatus: "CONTRACT",
      isFeatured: true,
      featureSlugs: ["lift", "kombi", "kondisioner", "mebel", "balkon", "internet", "domofon"],
      images: [
        { url: IMG(PHOTOS.apartmentLiving), alt: "Nümunə kirayə mənzil — qonaq otağı" },
        { url: IMG(PHOTOS.apartmentKitchen), alt: "Nümunə kirayə mənzil — mətbəx" },
        { url: IMG(PHOTOS.apartmentInterior), alt: "Nümunə kirayə mənzil — otaq" },
      ],
      daysOld: 6,
    },
    {
      title: "[Nümunə] Novxanıda bağ evi",
      slug: "numune-novxanida-bag-evi",
      description:
        "NÜMUNƏ ELAN. Dənizə yaxın məsafədə, qapalı ərazidə bağ evi satılır.\n\nHəyətdə meyvə ağacları, mangal zonası və avtomobil üçün örtülü sahə mövcuddur. Yay mövsümü üçün uyğun istirahət məkanı.",
      listingType: "SALE",
      status: "PUBLISHED",
      price: 165000,
      typeSlug: "bag-evleri",
      citySlug: "baki",
      districtSlug: "baki-novxani",
      address: "Nümunə ünvan, Novxanı qəsəbəsi",
      latitude: 40.5397,
      longitude: 49.7461,
      rooms: 4,
      bedrooms: 3,
      bathrooms: 2,
      area: 180,
      landArea: 6,
      floor: 2,
      totalFloors: 2,
      renovation: "RENOVATED",
      documentStatus: "TITLE_DEED",
      isFeatured: true,
      featureSlugs: ["heyet", "bagca", "mangal", "qaraj", "qapali-erazi", "internet"],
      images: [
        { url: IMG(PHOTOS.countryHouse), alt: "Nümunə bağ evi — ümumi görünüş" },
        { url: IMG(PHOTOS.houseGarden), alt: "Nümunə bağ evi — həyət" },
        { url: IMG(PHOTOS.villaLiving), alt: "Nümunə bağ evi — daxili görünüş" },
      ],
      daysOld: 9,
    },
    {
      title: "[Nümunə] Yasamalda 4 otaqlı həyət evi",
      slug: "numune-yasamalda-4-otaqli-heyet-evi",
      description:
        "NÜMUNƏ ELAN. Şəhər daxilində, sakit küçədə yerləşən həyət evi.\n\nEv iki mərtəbəlidir, həyətdə avtomobil üçün yer və kiçik yaşıllıq sahəsi var. Sənədləri qaydasındadır.",
      listingType: "SALE",
      status: "PUBLISHED",
      price: 240000,
      typeSlug: "heyet-evleri",
      citySlug: "baki",
      districtSlug: "baki-yasamal",
      address: "Nümunə ünvan, Yasamal rayonu",
      latitude: 40.3819,
      longitude: 49.8113,
      rooms: 4,
      bedrooms: 3,
      bathrooms: 2,
      area: 165,
      landArea: 3,
      floor: 2,
      totalFloors: 2,
      renovation: "COSMETIC",
      documentStatus: "TITLE_DEED",
      featureSlugs: ["heyet", "qaraj", "kombi", "internet", "domofon"],
      images: [
        { url: IMG(PHOTOS.houseFacade), alt: "Nümunə həyət evi — fasad" },
        { url: IMG(PHOTOS.houseGarden), alt: "Nümunə həyət evi — həyət" },
      ],
      daysOld: 12,
    },
    {
      title: "[Nümunə] Xətaidə ofis sahəsi icarəyə verilir",
      slug: "numune-xetaide-ofis-sahesi-icareye-verilir",
      description:
        "NÜMUNƏ ELAN. Biznes mərkəzində açıq planlı ofis sahəsi aylıq icarəyə verilir.\n\nSahə açıq plan formatındadır və tələbə uyğun bölünə bilər. Binada lift, parkinq və mühafizə xidməti mövcuddur.",
      listingType: "RENT",
      status: "PUBLISHED",
      price: 2400,
      pricePeriod: "MONTH",
      typeSlug: "ofisler",
      citySlug: "baki",
      districtSlug: "baki-xetai",
      address: "Nümunə ünvan, Xətai rayonu",
      latitude: 40.3833,
      longitude: 49.8833,
      rooms: 6,
      bathrooms: 2,
      area: 210,
      floor: 5,
      totalFloors: 10,
      renovation: "RENOVATED",
      documentStatus: "CONTRACT",
      featureSlugs: ["lift", "kondisioner", "parkinq", "internet", "muhafize", "kamera"],
      images: [
        { url: IMG(PHOTOS.officeInterior), alt: "Nümunə ofis — iş sahəsi" },
        { url: IMG(PHOTOS.officeBuilding), alt: "Nümunə ofis — bina" },
      ],
      daysOld: 15,
    },
    {
      title: "[Nümunə] Qəbələdə torpaq sahəsi",
      slug: "numune-qebelede-torpaq-sahesi",
      description:
        "NÜMUNƏ ELAN. Dağ mənzərəli ərazidə tikinti üçün uyğun torpaq sahəsi satılır.\n\nSahəyə yol çıxışı və kommunikasiya xətləri mövcuddur. Bağ evi və ya turizm obyekti tikintisi üçün uyğundur.",
      listingType: "SALE",
      status: "PUBLISHED",
      price: 48000,
      typeSlug: "torpaq",
      citySlug: "qebele",
      districtSlug: "qebele-merkez",
      address: "Nümunə ünvan, Qəbələ",
      latitude: 40.9812,
      longitude: 47.8489,
      landArea: 15,
      documentStatus: "TITLE_DEED",
      featureSlugs: ["qapali-erazi"],
      images: [
        { url: IMG(PHOTOS.land), alt: "Nümunə torpaq sahəsi" },
        { url: IMG(PHOTOS.landscape), alt: "Nümunə torpaq sahəsi — ətraf mühit" },
      ],
      daysOld: 18,
    },
    {
      title: "[Nümunə] Nizamidə ticarət obyekti",
      slug: "numune-nizamide-ticaret-obyekti",
      description:
        "NÜMUNƏ ELAN. Sıx piyada axını olan küçədə birinci mərtəbədə yerləşən ticarət obyekti.\n\nVitrin sahəsi geniş, giriş küçə səviyyəsindədir. Müxtəlif ticarət fəaliyyətləri üçün uyğundur.",
      listingType: "SALE",
      status: "RESERVED",
      price: 320000,
      typeSlug: "obyektler",
      citySlug: "baki",
      districtSlug: "baki-nizami",
      address: "Nümunə ünvan, Nizami rayonu",
      latitude: 40.4,
      longitude: 49.8,
      rooms: 3,
      bathrooms: 1,
      area: 145,
      floor: 1,
      totalFloors: 9,
      renovation: "RENOVATED",
      documentStatus: "TITLE_DEED",
      featureSlugs: ["kondisioner", "kamera", "internet"],
      images: [
        { url: IMG(PHOTOS.retailSpace), alt: "Nümunə ticarət obyekti" },
        { url: IMG(PHOTOS.officeInterior), alt: "Nümunə ticarət obyekti — daxili" },
      ],
      daysOld: 22,
    },
    {
      title: "[Nümunə] Şüvəlanda dənizkənarı villa",
      slug: "numune-suvelanda-denizkenari-villa",
      description:
        "NÜMUNƏ ELAN. Dənizə yaxın məsafədə, qapalı villa şəhərciyində yerləşən ev.\n\nGeniş terras, hovuz və landşaft dizaynı işlənmiş həyət mövcuddur.",
      listingType: "SALE",
      status: "SOLD",
      price: 620000,
      typeSlug: "villalar",
      citySlug: "baki",
      districtSlug: "baki-suvelan",
      address: "Nümunə ünvan, Şüvəlan qəsəbəsi",
      latitude: 40.4667,
      longitude: 50.15,
      rooms: 6,
      bedrooms: 5,
      bathrooms: 4,
      area: 410,
      landArea: 12,
      floor: 2,
      totalFloors: 2,
      renovation: "DESIGNER",
      documentStatus: "TITLE_DEED",
      featureSlugs: ["hovuz", "heyet", "bagca", "qaraj", "sauna", "kamin", "muhafize", "deniz-menzeresi"],
      images: [
        { url: IMG(PHOTOS.heroVilla), alt: "Nümunə dənizkənarı villa" },
        { url: IMG(PHOTOS.villaPool), alt: "Nümunə villa — hovuz" },
        { url: IMG(PHOTOS.villaBedroom), alt: "Nümunə villa — yataq otağı" },
      ],
      daysOld: 40,
    },
    {
      title: "[Nümunə] Sumqayıtda 3 otaqlı mənzil",
      slug: "numune-sumqayitda-3-otaqli-menzil",
      description:
        "NÜMUNƏ ELAN. Şəhər mərkəzində, infrastrukturu inkişaf etmiş ərazidə 3 otaqlı mənzil.\n\nMənzil orta təmirli vəziyyətdədir. Yaxınlıqda məktəb, bağça və ticarət mərkəzləri yerləşir.",
      listingType: "SALE",
      status: "PUBLISHED",
      price: 96000,
      typeSlug: "menziller",
      citySlug: "sumqayit",
      districtSlug: "sumqayit-merkez",
      address: "Nümunə ünvan, Sumqayıt",
      latitude: 40.5892,
      longitude: 49.6686,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      area: 88,
      floor: 4,
      totalFloors: 9,
      renovation: "COSMETIC",
      documentStatus: "TITLE_DEED",
      featureSlugs: ["lift", "kombi", "balkon", "internet"],
      images: [
        { url: IMG(PHOTOS.apartmentInterior), alt: "Nümunə mənzil — otaq" },
        { url: IMG(PHOTOS.apartmentLiving), alt: "Nümunə mənzil — qonaq otağı" },
      ],
      daysOld: 26,
    },
    {
      title: "[Nümunə] Xırdalanda yeni tikilidə mənzil",
      slug: "numune-xirdalanda-yeni-tikilide-menzil",
      description:
        "NÜMUNƏ ELAN. Yeni istifadəyə verilmiş binada, təmirsiz vəziyyətdə mənzil satılır.\n\nBina qapalı həyət, parkinq və uşaq oyun meydançası ilə təchiz olunub.",
      listingType: "SALE",
      status: "PUBLISHED",
      price: 78000,
      typeSlug: "menziller",
      citySlug: "xirdalan",
      districtSlug: "xirdalan-merkez",
      address: "Nümunə ünvan, Xırdalan",
      latitude: 40.4497,
      longitude: 49.7561,
      rooms: 2,
      bedrooms: 1,
      bathrooms: 1,
      area: 68,
      floor: 8,
      totalFloors: 14,
      renovation: "NEW_BUILDING",
      documentStatus: "CONTRACT",
      featureSlugs: ["lift", "parkinq", "qapali-erazi", "domofon"],
      images: [
        { url: IMG(PHOTOS.apartmentTower), alt: "Nümunə yeni tikili — bina" },
        { url: IMG(PHOTOS.apartmentInterior), alt: "Nümunə yeni tikili — mənzil" },
      ],
      daysOld: 30,
    },
    {
      title: "[Nümunə] Qubada bağ evi kirayə",
      slug: "numune-qubada-bag-evi-kiraye",
      description:
        "NÜMUNƏ ELAN. Dağ ərazisində, təbiətin qoynunda bağ evi günlük icarəyə verilir.\n\nEv istirahət üçün tam təchiz olunub. Mangal zonası və geniş həyət mövcuddur.",
      listingType: "RENT",
      status: "PUBLISHED",
      price: 150,
      pricePeriod: "DAY",
      typeSlug: "bag-evleri",
      citySlug: "quba",
      districtSlug: "quba-merkez",
      address: "Nümunə ünvan, Quba",
      latitude: 41.3606,
      longitude: 48.5136,
      rooms: 4,
      bedrooms: 3,
      bathrooms: 2,
      area: 150,
      landArea: 10,
      floor: 2,
      totalFloors: 2,
      renovation: "RENOVATED",
      documentStatus: "CONTRACT",
      featureSlugs: ["heyet", "mangal", "bagca", "kamin", "internet", "qapali-erazi"],
      images: [
        { url: IMG(PHOTOS.countryHouse), alt: "Nümunə bağ evi — Quba" },
        { url: IMG(PHOTOS.landscape), alt: "Nümunə bağ evi — ətraf mühit" },
      ],
      daysOld: 34,
    },
  ];

  let createdProperties = 0;
  for (const property of propertyData) {
    const existing = await prisma.property.findUnique({ where: { slug: property.slug } });
    if (existing) continue;

    const { featureSlugs, images, typeSlug, citySlug, districtSlug, projectSlug, daysOld, ...data } =
      property;

    await prisma.property.create({
      data: {
        ...data,
        isDemo: true,
        typeId: types[typeSlug],
        cityId: cities[citySlug],
        districtId: districtSlug ? districts[districtSlug] : null,
        projectId: projectSlug ? projectIds[projectSlug] : null,
        authorId: superAdmin.id,
        publishedAt: daysAgo(daysOld),
        createdAt: daysAgo(daysOld),
        viewCount: Math.floor(Math.random() * 120) + 10,
        metaTitle: `${property.title} — Luxe Home Estate`,
        metaDescription: property.description.split("\n")[0].slice(0, 155),
        images: {
          create: images.map((image, index) => ({
            url: image.url,
            alt: image.alt,
            order: index,
            isCover: index === 0,
          })),
        },
        features: {
          create: featureSlugs
            .filter((slug) => features[slug])
            .map((slug) => ({ featureId: features[slug] })),
        },
      },
    });
    createdProperties += 1;
  }
  console.log(`  ✓ Əmlaklar (${createdProperties}) — hamısı NÜMUNƏ`);

  // -------------------------------------------------------------------------
  // 8. BLOQ
  // -------------------------------------------------------------------------
  const categoryData = [
    { name: "Daşınmaz əmlak", slug: "dasinmaz-emlak" },
    { name: "Bazar xəbərləri", slug: "bazar-xeberleri" },
    { name: "Məsləhətlər", slug: "meslehetler" },
    { name: "İnteryer", slug: "interyer" },
    { name: "Tikinti", slug: "tikinti" },
    { name: "Luxe Home Estate xəbərləri", slug: "luxehomeestate-xeberleri" },
  ];

  const categories: Record<string, string> = {};
  for (const [index, category] of categoryData.entries()) {
    const record = await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: { ...category, order: index },
    });
    categories[category.slug] = record.id;
  }

  const postData = [
    {
      title: "[Nümunə] Mənzil alarkən diqqət edilməli 7 məqam",
      slug: "numune-menzil-alarken-diqqet-edilmeli-7-meqam",
      categorySlug: "meslehetler",
      excerpt:
        "Mənzil almaq böyük qərardır. Sənədlərdən kommunikasiyaya qədər nəyi yoxlamaq lazımdır — bu nümunə yazıda ümumi baxış.",
      coverUrl: IMG(PHOTOS.keys, 1400),
      coverAlt: "Ev açarları",
      readMinutes: 5,
      daysOld: 3,
      content: `Bu yazı platformanın bloq bölməsinin necə işlədiyini göstərmək üçün hazırlanmış NÜMUNƏ məzmundur.

## 1. Sənədləri yoxlayın

Əmlakın çıxarışı və ya müqaviləsi olub-olmadığını dəqiqləşdirin. Sənəd vəziyyəti gələcəkdə yarana biləcək problemlərin qarşısını alır.

## 2. Binanın texniki vəziyyəti

Binanın tikinti ili, materialı və ümumi vəziyyəti mənzilin uzunmüddətli dəyərinə birbaşa təsir edir.

## 3. Kommunikasiya xətləri

Su, qaz, elektrik və kanalizasiya sisteminin vəziyyətini yerində yoxlayın.

## 4. İnfrastruktur

Yaxınlıqda məktəb, bağça, ticarət mərkəzi və nəqliyyat çıxışının olması gündəlik həyatı asanlaşdırır.

## 5. Qonşuluq

Ərazini müxtəlif saatlarda ziyarət edin — səs-küy səviyyəsi və ümumi mühit haqqında daha dəqiq təsəvvür yaranar.

## 6. Real bazar qiyməti

Oxşar əmlakların qiymətlərini müqayisə edin. Luxe Home Estate portfelində eyni ərazi üzrə variantları nəzərdən keçirə bilərsiniz.

## 7. Peşəkar dəstək

Prosesin hər mərhələsində peşəkar məsləhət vaxta və vəsaitə qənaət etməyə kömək edir.

Real və detallı məzmun şirkət tərəfindən təsdiqləndikdən sonra dərc ediləcək.`,
    },
    {
      title: "[Nümunə] İpoteka ilə mənzil almaq: proses necə gedir?",
      slug: "numune-ipoteka-ile-menzil-almaq-proses-nece-gedir",
      categorySlug: "dasinmaz-emlak",
      excerpt:
        "İpoteka müraciətindən açarların təhvilinə qədər mərhələlərin ümumi izahı — nümunə məzmun.",
      coverUrl: IMG(PHOTOS.mortgage, 1400),
      coverAlt: "İpoteka sənədləri",
      readMinutes: 6,
      daysOld: 8,
      content: `NÜMUNƏ MƏZMUN. Bu yazı bloq strukturunu göstərmək məqsədi daşıyır.

## Mərhələ 1 — İlkin qiymətləndirmə

Ödəniş imkanınızı və ilkin ödəniş məbləğini müəyyənləşdirin.

## Mərhələ 2 — Əmlakın seçimi

Bütün əmlaklar ipoteka şərtlərinə uyğun olmur. Seçim zamanı bu meyar nəzərə alınmalıdır.

## Mərhələ 3 — Sənədlərin toplanması

Gəlir arayışı, şəxsiyyət sənədi və əmlakla bağlı sənədlər tələb olunur.

## Mərhələ 4 — Qiymətləndirmə

Əmlak müstəqil qiymətləndirmədən keçirilir.

## Mərhələ 5 — Rəsmiləşdirmə

Müqavilə imzalanır və mülkiyyət hüququ qeydiyyata alınır.

Konkret şərtlər maliyyə qurumları tərəfindən müəyyən edilir. Suallarınız üçün bizimlə əlaqə saxlaya bilərsiniz.`,
    },
    {
      title: "[Nümunə] Kiçik mənzildə məkanı genişləndirən interyer həlləri",
      slug: "numune-kicik-menzilde-mekani-genislendiren-interyer-helleri",
      categorySlug: "interyer",
      excerpt:
        "Rəng, işıq və mebel seçimi ilə kiçik sahələri daha geniş göstərmək — nümunə interyer yazısı.",
      coverUrl: IMG(PHOTOS.interiorDesign, 1400),
      coverAlt: "Müasir interyer dizaynı",
      readMinutes: 4,
      daysOld: 14,
      content: `NÜMUNƏ MƏZMUN.

## Açıq rənglər

Açıq ton divarlar işığı əks etdirir və məkanı daha geniş göstərir.

## Güzgülərdən istifadə

Düzgün yerləşdirilmiş güzgü otağın dərinlik hissini artırır.

## Çoxfunksiyalı mebel

Saxlama sahəsi olan mebel həm yer qazandırır, həm nizam yaradır.

## Şaquli saxlama

Divar boyu yüksək rəflər döşəmə sahəsini boşaldır.

## Təbii işıq

Ağır pərdələr əvəzinə yüngül materiallar seçin.

Real interyer məsləhətləri şirkət mütəxəssisləri tərəfindən hazırlandıqdan sonra dərc ediləcək.`,
    },
    {
      title: "[Nümunə] Bakı daşınmaz əmlak bazarına ümumi baxış",
      slug: "numune-baki-dasinmaz-emlak-bazarina-umumi-baxis",
      categorySlug: "bazar-xeberleri",
      excerpt:
        "Bazar dinamikası, tələb istiqamətləri və alıcı davranışı haqqında nümunə icmal.",
      coverUrl: IMG(PHOTOS.cityPanorama, 1400),
      coverAlt: "Bakı şəhər panoraması",
      readMinutes: 5,
      daysOld: 20,
      content: `NÜMUNƏ MƏZMUN. Bu yazıda heç bir real statistik məlumat yoxdur.

## Ümumi mənzərə

Şəhərin müxtəlif rayonlarında tələb fərqli formalaşır. Mərkəzi rayonlarda mənzillərə, ətraf qəsəbələrdə isə həyət və bağ evlərinə maraq müşahidə olunur.

## Alıcı davranışı

Alıcılar getdikcə daha çox sənəd təmizliyinə və binanın texniki vəziyyətinə diqqət yetirir.

## Qeyd

Rəqəmlə ifadə olunan bazar statistikası yalnız təsdiqlənmiş mənbələrə əsaslandıqda dərc ediləcək.`,
    },
    {
      title: "[Nümunə] Təmirə başlamazdan əvvəl hazırlanmalı plan",
      slug: "numune-temire-baslamazdan-evvel-hazirlanmali-plan",
      categorySlug: "tikinti",
      excerpt:
        "Smeta, material seçimi və iş qrafiki — təmir prosesini idarə etmək üçün nümunə yol xəritəsi.",
      coverUrl: IMG(PHOTOS.renovation, 1400),
      coverAlt: "Təmir işləri",
      readMinutes: 4,
      daysOld: 27,
      content: `NÜMUNƏ MƏZMUN.

## Smetanın hazırlanması

İşə başlamazdan əvvəl detallı smeta büdcənin nəzarətdə saxlanmasına imkan verir.

## Material seçimi

Materialın keyfiyyəti uzunmüddətli xərcə birbaşa təsir edir.

## İş qrafiki

Mərhələlərin ardıcıllığı və müddəti əvvəlcədən razılaşdırılmalıdır.

## Nəzarət

Hər mərhələnin təhvili sənədləşdirilməlidir.

Luxe Home Estate təmir-tikinti xidməti haqqında ətraflı məlumat üçün xidmətlər bölməsinə baxın.`,
    },
    {
      title: "[Nümunə] Luxe Home Estate onlayn platforması istifadəyə verildi",
      slug: "numune-luxehomeestate-onlayn-platformasi-istifadeye-verildi",
      categorySlug: "luxehomeestate-xeberleri",
      excerpt:
        "Əmlak axtarışı, filtrləmə və müraciət sistemi ilə yeni onlayn platforma — nümunə xəbər.",
      coverUrl: IMG(PHOTOS.apartmentTower, 1400),
      coverAlt: "Müasir yaşayış binası",
      readMinutes: 3,
      daysOld: 35,
      content: `NÜMUNƏ MƏZMUN.

Bu yazı bloqun "şirkət xəbərləri" kateqoriyasının necə göründüyünü nümayiş etdirmək üçün hazırlanıb.

## Platformanın imkanları

- Əmlak kataloqu və detallı filtrləmə
- Hər əmlak üçün ayrıca səhifə və foto qalereya
- Favoritlərə əlavə etmə
- Birbaşa müraciət göndərmə

Real şirkət xəbərləri admin panel vasitəsilə dərc ediləcək.`,
    },
  ];

  let createdPosts = 0;
  for (const post of postData) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) continue;

    const { categorySlug, daysOld, ...data } = post;
    await prisma.blogPost.create({
      data: {
        ...data,
        isDemo: true,
        status: "PUBLISHED",
        categoryId: categories[categorySlug],
        authorId: superAdmin.id,
        publishedAt: daysAgo(daysOld),
        createdAt: daysAgo(daysOld),
        viewCount: Math.floor(Math.random() * 200) + 20,
        metaTitle: `${post.title} — Luxe Home Estate Blog`,
        metaDescription: post.excerpt.slice(0, 155),
      },
    });
    createdPosts += 1;
  }
  console.log(`  ✓ Bloq kateqoriyaları (${categoryData.length}) və yazılar (${createdPosts})`);

  // -------------------------------------------------------------------------
  // 9. PARAMETRLƏR
  // -------------------------------------------------------------------------
  const settings = [
    { key: "site.title", value: "Luxe Home Estate — Həyatınızın ən dəyərli ünvanı" },
    {
      key: "site.description",
      value:
        "Luxe Home Estate — Bakıda mənzil, villa, həyət evi, torpaq, ofis və obyektlərin alqı-satqısı və icarəsi.",
    },
    { key: "contact.phone", value: "+994 51 922 85 85" },
    { key: "contact.address", value: "Əliyar Əliyev 109A" },
    { key: "contact.instagram", value: "luxe_home_estate" },
    { key: "leads.notifyEmail", value: "" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`  ✓ Parametrlər (${settings.length})`);

  console.log("\n✅ Demo məlumat hazırdır.\n");
  console.log("   Admin girişi:");
  console.log(`   E-poçt: ${adminEmail}`);
  console.log(`   Şifrə:  ${adminPassword}\n`);
  console.log("   ⚠️  Bütün əmlak, layihə və bloq qeydləri NÜMUNƏ kimi işarələnib.");
  console.log("      Real məlumat əlavə edildikdən sonra silinməlidir: npm run db:clean-demo\n");
}

main()
  .catch((error) => {
    console.error("Seed xətası:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
