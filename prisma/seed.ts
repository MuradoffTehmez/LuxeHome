/**
 * Luxe Home Estate — sistem başlanğıc məlumatları.
 *
 * Bu seed yalnız admin girişi, filtr taksonomiyası, xidmətlər, bloq
 * kateqoriyaları və sayt parametrlərini yaradır. Əmlak, layihə və bloq
 * məzmunu yalnız admin panel vasitəsilə əlavə edilir.
 */

import { PrismaClient } from "@prisma/client";
import { webcrypto } from "node:crypto";

const prisma = new PrismaClient();

const imageUrl = (id: string, width = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

const stockPhotos = {
  apartmentTower: "1545324418-cc1a3fa10c00",
  apartmentLiving: "1522708323590-d24dbb6b0267",
  villaExterior: "1600596542815-ffad4c1539a9",
  villaLiving: "1600210492486-724fe5c67fb0",
  houseFacade: "1570129477492-45c003edd2be",
  countryHouse: "1512917774080-9991f1c4c750",
  land: "1500382017468-9049fed747ef",
  officeBuilding: "1497366216548-37526070297c",
  retailSpace: "1441986300917-64674bd600d8",
  marketNews: "1560518883-ce09059eeffa",
  mortgage: "1554224155-6726b3ff858f",
  keys: "1560448204-e02f11c3d0e2",
  renovation: "1581094794329-c8112a89af12",
  cityPanorama: "1541888946425-d81bb19240f5",
} as const;

// ---------------------------------------------------------------------------
// PAROL HASH-I
// ---------------------------------------------------------------------------

/**
 * `src/lib/auth/password.ts` ilə eyni format və parametrlər.
 * Skript Node altında işlədiyi üçün həmin modul birbaşa idxal edilmir
 * (o, Workers-ə yönəlib), lakin nəticə birə-bir uyğun olmalıdır.
 */
// Cloudflare Workers production Web Crypto bu həddən böyük PBKDF2 dəyərini rədd edir.
const PBKDF2_ITERATIONS = 100_000;

async function hashPassword(password: string): Promise<string> {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const key = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");
  return `pbkdf2$sha256$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

async function main() {
  console.log("→ Sistem başlanğıc məlumatları yüklənir...\n");

  // -------------------------------------------------------------------------
  // 1. İSTİFADƏÇİLƏR
  // -------------------------------------------------------------------------
  // Seed nəticəsi `prisma/seed.sql` faylına düşür və git-ə commit olunur, ona görə
  // burada **heç vaxt** sabit parol yazılmır: fayla düşən hash real hesab açardı.
  // Parol yalnız açıq şəkildə `SEED_ADMIN_PASSWORD` verildikdə qurulur (lokal iş üçün);
  // əks halda hesablar giriş üçün yararsız hash ilə və deaktiv yaradılır.
  // Production admini `npm run auth:create-admin` ilə ayrıca qurulur.
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@luxehomeestate.az";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const loginEnabled = Boolean(adminPassword);

  // `verifyPassword` beş hissəli `pbkdf2$...` formatı gözləyir — bu dəyər heç bir parola uyğun gəlmir
  const UNUSABLE_HASH = "disabled";
  const passwordHash = adminPassword ? await hashPassword(adminPassword) : UNUSABLE_HASH;

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Sistem Administratoru",
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: loginEnabled,
    },
  });


  console.log(
    loginEnabled
      ? `  ✓ İstifadəçilər — giriş: ${adminEmail}`
      : "  ✓ İstifadəçilər — giriş bağlıdır (SEED_ADMIN_PASSWORD verilməyib)",
  );

  // -------------------------------------------------------------------------
  // 2. ƏMLAK NÖVLƏRİ
  // -------------------------------------------------------------------------
  const typeData = [
    {
      name: "Mənzillər",
      slug: "menziller",
      icon: "Building2",
      description: "Yeni tikili və köhnə fondda mənzillər.",
      imageUrl: imageUrl(stockPhotos.apartmentTower, 1200),
    },
    {
      name: "Villalar",
      slug: "villalar",
      icon: "Home",
      description: "Premium villa və malikanələr.",
      imageUrl: imageUrl(stockPhotos.villaExterior, 1200),
    },
    {
      name: "Həyət evləri",
      slug: "heyet-evleri",
      icon: "House",
      description: "Şəhər və qəsəbələrdə həyət evləri.",
      imageUrl: imageUrl(stockPhotos.houseFacade, 1200),
    },
    {
      name: "Bağ evləri",
      slug: "bag-evleri",
      icon: "Trees",
      description: "İstirahət üçün bağ evləri.",
      imageUrl: imageUrl(stockPhotos.countryHouse, 1200),
    },
    {
      name: "Torpaq",
      slug: "torpaq",
      icon: "LandPlot",
      description: "Tikinti və kənd təsərrüfatı üçün torpaq sahələri.",
      imageUrl: imageUrl(stockPhotos.land, 1200),
    },
    {
      name: "Ofislər",
      slug: "ofisler",
      icon: "Briefcase",
      description: "Biznes mərkəzlərində ofis sahələri.",
      imageUrl: imageUrl(stockPhotos.officeBuilding, 1200),
    },
    {
      name: "Obyektlər",
      slug: "obyektler",
      icon: "Store",
      description: "Kommersiya obyektləri və ticarət sahələri.",
      imageUrl: imageUrl(stockPhotos.retailSpace, 1200),
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
      imageUrl: imageUrl(stockPhotos.keys, 1400),
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
      imageUrl: imageUrl(stockPhotos.apartmentLiving, 1400),
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
      imageUrl: imageUrl(stockPhotos.mortgage, 1400),
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
      imageUrl: imageUrl(stockPhotos.marketNews, 1400),
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
      imageUrl: imageUrl(stockPhotos.renovation, 1400),
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
      imageUrl: imageUrl(stockPhotos.cityPanorama, 1400),
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
      imageUrl: imageUrl(stockPhotos.villaLiving, 1400),
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
  // -------------------------------------------------------------------------
  // 6. BLOQ KATEQORİYALARI
  // -------------------------------------------------------------------------
  const categoryData = [
    { name: "Daşınmaz əmlak", slug: "dasinmaz-emlak" },
    { name: "Bazar xəbərləri", slug: "bazar-xeberleri" },
    { name: "Məsləhətlər", slug: "meslehetler" },
    { name: "İnteryer", slug: "interyer" },
    { name: "Tikinti", slug: "tikinti" },
    { name: "Luxe Home Estate xəbərləri", slug: "luxehomeestate-xeberleri" },
  ];

  for (const [index, category] of categoryData.entries()) {
    await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: { ...category, order: index },
    });
  }
  console.log(`  ✓ Bloq kateqoriyaları (${categoryData.length})`);

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

  console.log("\n✅ Sistem başlanğıc məlumatları hazırdır.\n");
  console.log("   Admin girişi:");
  console.log(`   E-poçt: ${adminEmail}`);
  console.log(`   Şifrə:  ${adminPassword ? "SEED_ADMIN_PASSWORD dəyəri" : "giriş bağlıdır"}\n`);
}

main()
  .catch((error) => {
    console.error("Seed xətası:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
