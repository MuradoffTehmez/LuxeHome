/**
 * ⚠️ NÜMUNƏ MƏLUMAT — YALNIZ ADMİN İNTERFEYSİNİN DİZAYNI ÜÇÜN
 *
 * Bu fayl admin panelin frontend mərhələsində istifadə olunur. Bütün rəqəmlər və
 * qeydlər uydurmadır, verilənlər bazasından gəlmir.
 *
 * TODO: Backend qurulduqda bu fayl silinməli, səhifələr `src/lib/queries.ts`
 *       funksiyalarına keçirilməlidir. İnterfeyslər həmin sorğuların qaytardığı
 *       formaya uyğun saxlanılıb ki, keçid asan olsun.
 */

export type AdminProperty = {
  id: string;
  title: string;
  slug: string;
  listingType: "SALE" | "RENT";
  status: "DRAFT" | "PUBLISHED" | "RESERVED" | "SOLD" | "RENTED" | "ARCHIVED";
  price: number;
  currency: string;
  typeName: string;
  cityName: string;
  districtName: string | null;
  rooms: number | null;
  area: number | null;
  isFeatured: boolean;
  viewCount: number;
  updatedAt: string;
};

export type AdminProject = {
  id: string;
  name: string;
  slug: string;
  projectType: "RESIDENTIAL" | "COMMERCIAL" | "VILLA" | "MIXED";
  status: "PLANNED" | "ONGOING" | "COMPLETED";
  cityName: string | null;
  unitCount: number | null;
  year: number | null;
  isActive: boolean;
  updatedAt: string;
};

export type AdminPost = {
  id: string;
  title: string;
  slug: string;
  categoryName: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  authorName: string;
  readMinutes: number;
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
};

export type AdminLead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string | null;
  message: string;
  source: "PROPERTY" | "CONTACT" | "SERVICE" | "PROJECT";
  status: "NEW" | "CONTACTED" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";
  propertyTitle: string | null;
  createdAt: string;
};

export type AdminMedia = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR";
  isActive: boolean;
  lastLoginAt: string | null;
};

// ---------------------------------------------------------------------------

export const mockStats = {
  activeProperties: 38,
  draftProperties: 6,
  soldProperties: 11,
  rentedProperties: 7,
  activeProjects: 4,
  newLeads: 5,
  totalLeads: 63,
  publishedPosts: 12,
  mediaCount: 184,
  /** Son 30 günün baxış sayı — qrafik üçün */
  viewsLast30Days: 14_820,
  viewsTrend: [
    320, 410, 388, 452, 501, 470, 523, 610, 588, 640, 705, 668, 720, 690, 754,
    810, 792, 848, 900, 872, 930, 988, 1010, 964, 1050, 1120, 1080, 1165, 1210, 1240,
  ],
};

export const mockProperties: AdminProperty[] = [
  {
    id: "p1",
    title: "Badamdarda dəniz mənzərəli premium villa",
    slug: "badamdarda-deniz-menzereli-premium-villa",
    listingType: "SALE",
    status: "PUBLISHED",
    price: 1_250_000,
    currency: "AZN",
    typeName: "Villalar",
    cityName: "Bakı",
    districtName: "Səbail",
    rooms: 6,
    area: 420,
    isFeatured: true,
    viewCount: 1284,
    updatedAt: "2026-08-11T14:20:00Z",
  },
  {
    id: "p2",
    title: "Nərimanovda 3 otaqlı təmirli mənzil",
    slug: "nerimanovda-3-otaqli-temirli-menzil",
    listingType: "SALE",
    status: "PUBLISHED",
    price: 285_000,
    currency: "AZN",
    typeName: "Mənzillər",
    cityName: "Bakı",
    districtName: "Nərimanov",
    rooms: 3,
    area: 128,
    isFeatured: false,
    viewCount: 642,
    updatedAt: "2026-08-10T09:05:00Z",
  },
  {
    id: "p3",
    title: "28 May yaxınlığında ofis sahəsi",
    slug: "28-may-yaxinliginda-ofis-sahesi",
    listingType: "RENT",
    status: "PUBLISHED",
    price: 2_400,
    currency: "AZN",
    typeName: "Ofislər",
    cityName: "Bakı",
    districtName: "Nəsimi",
    rooms: null,
    area: 210,
    isFeatured: true,
    viewCount: 398,
    updatedAt: "2026-08-09T16:40:00Z",
  },
  {
    id: "p4",
    title: "Mərdəkanda hovuzlu bağ evi",
    slug: "merdekanda-hovuzlu-bag-evi",
    listingType: "SALE",
    status: "RESERVED",
    price: 465_000,
    currency: "AZN",
    typeName: "Bağ evləri",
    cityName: "Bakı",
    districtName: "Xəzər",
    rooms: 5,
    area: 310,
    isFeatured: false,
    viewCount: 871,
    updatedAt: "2026-08-08T11:15:00Z",
  },
  {
    id: "p5",
    title: "Yasamalda yeni tikilidə 2 otaqlı mənzil",
    slug: "yasamalda-yeni-tikilide-2-otaqli-menzil",
    listingType: "RENT",
    status: "DRAFT",
    price: 900,
    currency: "AZN",
    typeName: "Mənzillər",
    cityName: "Bakı",
    districtName: "Yasamal",
    rooms: 2,
    area: 74,
    isFeatured: false,
    viewCount: 0,
    updatedAt: "2026-08-12T18:30:00Z",
  },
  {
    id: "p6",
    title: "Şüvəlanda tam təmirli həyət evi",
    slug: "suvelanda-tam-temirli-heyet-evi",
    listingType: "SALE",
    status: "SOLD",
    price: 380_000,
    currency: "AZN",
    typeName: "Həyət evləri",
    cityName: "Bakı",
    districtName: "Xəzər",
    rooms: 4,
    area: 240,
    isFeatured: false,
    viewCount: 1502,
    updatedAt: "2026-07-29T13:00:00Z",
  },
];

export const mockProjects: AdminProject[] = [
  {
    id: "pr1",
    name: "Luxe Residence Badamdar",
    slug: "luxe-residence-badamdar",
    projectType: "RESIDENTIAL",
    status: "ONGOING",
    cityName: "Bakı",
    unitCount: 148,
    year: 2027,
    isActive: true,
    updatedAt: "2026-08-11T10:00:00Z",
  },
  {
    id: "pr2",
    name: "Caspian Business Center",
    slug: "caspian-business-center",
    projectType: "COMMERCIAL",
    status: "PLANNED",
    cityName: "Bakı",
    unitCount: 62,
    year: 2028,
    isActive: true,
    updatedAt: "2026-08-06T15:20:00Z",
  },
  {
    id: "pr3",
    name: "Shuvelan Villa Park",
    slug: "shuvelan-villa-park",
    projectType: "VILLA",
    status: "COMPLETED",
    cityName: "Bakı",
    unitCount: 24,
    year: 2025,
    isActive: true,
    updatedAt: "2026-05-18T08:45:00Z",
  },
  {
    id: "pr4",
    name: "Sumqayıt Marina Complex",
    slug: "sumqayit-marina-complex",
    projectType: "MIXED",
    status: "ONGOING",
    cityName: "Sumqayıt",
    unitCount: 210,
    year: 2027,
    isActive: false,
    updatedAt: "2026-07-02T12:10:00Z",
  },
];

export const mockPosts: AdminPost[] = [
  {
    id: "b1",
    title: "2026-cı ildə Bakıda əmlak bazarı: qiymət tendensiyaları",
    slug: "2026-baki-emlak-bazari-qiymet-tendensiyalari",
    categoryName: "Bazar təhlili",
    status: "PUBLISHED",
    authorName: "Bahadur Əmiyev",
    readMinutes: 7,
    viewCount: 2104,
    publishedAt: "2026-08-05T09:00:00Z",
    updatedAt: "2026-08-05T09:00:00Z",
  },
  {
    id: "b2",
    title: "İpoteka ilə mənzil almaq: addım-addım təlimat",
    slug: "ipoteka-ile-menzil-almaq-telimat",
    categoryName: "Məsləhətlər",
    status: "PUBLISHED",
    authorName: "Bahadur Əmiyev",
    readMinutes: 9,
    viewCount: 1680,
    publishedAt: "2026-07-22T11:30:00Z",
    updatedAt: "2026-07-24T14:00:00Z",
  },
  {
    id: "b3",
    title: "Villa alarkən diqqət edilməli 10 məqam",
    slug: "villa-alarken-diqqet-edilmeli-10-meqam",
    categoryName: "Məsləhətlər",
    status: "DRAFT",
    authorName: "Redaktor",
    readMinutes: 6,
    viewCount: 0,
    publishedAt: null,
    updatedAt: "2026-08-12T20:15:00Z",
  },
  {
    id: "b4",
    title: "Kirayə müqaviləsində nələrə fikir vermək lazımdır?",
    slug: "kiraye-muqavilesinde-nelere-fikir-vermek-lazimdir",
    categoryName: "Hüquq",
    status: "ARCHIVED",
    authorName: "Redaktor",
    readMinutes: 5,
    viewCount: 940,
    publishedAt: "2026-03-14T10:00:00Z",
    updatedAt: "2026-06-01T09:00:00Z",
  },
];

export const mockLeads: AdminLead[] = [
  {
    id: "l1",
    name: "Elvin Məmmədov",
    phone: "+994 50 123 45 67",
    email: "elvin.m@example.com",
    subject: "Villa ilə maraqlanıram",
    message:
      "Badamdardakı villa hələ satışdadır? Həftə sonu baxmaq üçün vaxt ayıra bilərsinizmi?",
    source: "PROPERTY",
    status: "NEW",
    propertyTitle: "Badamdarda dəniz mənzərəli premium villa",
    createdAt: "2026-08-13T08:42:00Z",
  },
  {
    id: "l2",
    name: "Günel Həsənova",
    phone: "+994 55 987 65 43",
    email: null,
    subject: null,
    message: "Nərimanovda 3 otaqlı mənzilin qiymətində endirim mümkündürmü?",
    source: "PROPERTY",
    status: "NEW",
    propertyTitle: "Nərimanovda 3 otaqlı təmirli mənzil",
    createdAt: "2026-08-13T07:15:00Z",
  },
  {
    id: "l3",
    name: "Rəşad Quliyev",
    phone: "+994 51 444 22 11",
    email: "rashad.g@example.com",
    subject: "Qiymətləndirmə xidməti",
    message:
      "Yasamalda 95 m² mənzilim var, bazar qiymətini öyrənmək istəyirəm. Xidmətin qiyməti nə qədərdir?",
    source: "SERVICE",
    status: "CONTACTED",
    propertyTitle: null,
    createdAt: "2026-08-12T16:20:00Z",
  },
  {
    id: "l4",
    name: "Aysel Kərimli",
    phone: "+994 70 333 88 99",
    email: "aysel.k@example.com",
    subject: "Luxe Residence",
    message: "Luxe Residence Badamdar layihəsində 2 otaqlı mənzillərin planını göndərə bilərsiniz?",
    source: "PROJECT",
    status: "IN_PROGRESS",
    propertyTitle: null,
    createdAt: "2026-08-11T13:05:00Z",
  },
  {
    id: "l5",
    name: "Tural Əliyev",
    phone: "+994 77 222 11 00",
    email: null,
    subject: "Ofis kirayəsi",
    message: "28 May yaxınlığındakı ofis üçün uzunmüddətli kirayə şərtləri necədir?",
    source: "PROPERTY",
    status: "COMPLETED",
    propertyTitle: "28 May yaxınlığında ofis sahəsi",
    createdAt: "2026-08-09T10:30:00Z",
  },
  {
    id: "l6",
    name: "Nigar Sultanova",
    phone: "+994 50 777 66 55",
    email: "nigar.s@example.com",
    subject: null,
    message: "Ümumi məlumat üçün əlaqə saxlayıram.",
    source: "CONTACT",
    status: "CLOSED",
    propertyTitle: null,
    createdAt: "2026-08-04T09:00:00Z",
  },
];

const UNSPLASH = "https://images.unsplash.com";

export const mockMedia: AdminMedia[] = [
  { id: "m1", url: `${UNSPLASH}/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=70`, originalName: "villa-badamdar-01.jpg", mimeType: "image/jpeg", size: 842_112, width: 2400, height: 1600, createdAt: "2026-08-11T14:00:00Z" },
  { id: "m2", url: `${UNSPLASH}/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=70`, originalName: "villa-badamdar-02.jpg", mimeType: "image/jpeg", size: 921_004, width: 2400, height: 1600, createdAt: "2026-08-11T14:01:00Z" },
  { id: "m3", url: `${UNSPLASH}/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=70`, originalName: "menzil-nerimanov-01.jpg", mimeType: "image/jpeg", size: 604_887, width: 2000, height: 1333, createdAt: "2026-08-10T09:00:00Z" },
  { id: "m4", url: `${UNSPLASH}/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=600&q=70`, originalName: "ofis-28may-01.jpg", mimeType: "image/jpeg", size: 733_219, width: 2200, height: 1467, createdAt: "2026-08-09T16:00:00Z" },
  { id: "m5", url: `${UNSPLASH}/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=70`, originalName: "bag-evi-merdekan-01.jpg", mimeType: "image/jpeg", size: 1_204_558, width: 2600, height: 1733, createdAt: "2026-08-08T11:00:00Z" },
  { id: "m6", url: `${UNSPLASH}/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=70`, originalName: "heyet-evi-suvelan-01.jpg", mimeType: "image/jpeg", size: 688_301, width: 2000, height: 1333, createdAt: "2026-07-29T13:00:00Z" },
  { id: "m7", url: `${UNSPLASH}/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=70`, originalName: "interyer-01.jpg", mimeType: "image/jpeg", size: 512_770, width: 1800, height: 1200, createdAt: "2026-07-25T10:00:00Z" },
  { id: "m8", url: `${UNSPLASH}/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=70`, originalName: "interyer-02.jpg", mimeType: "image/jpeg", size: 470_155, width: 1800, height: 1200, createdAt: "2026-07-25T10:02:00Z" },
  { id: "m9", url: `${UNSPLASH}/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=70`, originalName: "layihe-render-01.jpg", mimeType: "image/jpeg", size: 998_412, width: 2400, height: 1600, createdAt: "2026-07-20T09:00:00Z" },
  { id: "m10", url: `${UNSPLASH}/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=600&q=70`, originalName: "layihe-render-02.jpg", mimeType: "image/jpeg", size: 1_102_003, width: 2400, height: 1600, createdAt: "2026-07-20T09:03:00Z" },
  { id: "m11", url: `${UNSPLASH}/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=70`, originalName: "hero-background.jpg", mimeType: "image/jpeg", size: 1_580_224, width: 3200, height: 2133, createdAt: "2026-07-12T08:00:00Z" },
  { id: "m12", url: `${UNSPLASH}/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=70`, originalName: "villa-exterior-03.jpg", mimeType: "image/jpeg", size: 864_990, width: 2400, height: 1600, createdAt: "2026-07-10T17:00:00Z" },
];

export const mockUsers: AdminUser[] = [
  {
    id: "u1",
    name: "Bahadur Əmiyev",
    email: "admin@luxehome.az",
    role: "SUPER_ADMIN",
    isActive: true,
    lastLoginAt: "2026-08-13T08:00:00Z",
  },
  {
    id: "u2",
    name: "Satış meneceri",
    email: "satis@luxehome.az",
    role: "ADMIN",
    isActive: true,
    lastLoginAt: "2026-08-12T17:30:00Z",
  },
  {
    id: "u3",
    name: "Kontent redaktoru",
    email: "redaktor@luxehome.az",
    role: "EDITOR",
    isActive: true,
    lastLoginAt: "2026-08-11T10:15:00Z",
  },
  {
    id: "u4",
    name: "Keçmiş əməkdaş",
    email: "arxiv@luxehome.az",
    role: "EDITOR",
    isActive: false,
    lastLoginAt: "2026-04-02T12:00:00Z",
  },
];

export const mockServices = [
  { id: "s1", title: "Əmlak alqı-satqısı", slug: "emlak-alqi-satqisi", icon: "Building2", order: 1, isActive: true },
  { id: "s2", title: "İcarə xidməti", slug: "icare-xidmeti", icon: "KeyRound", order: 2, isActive: true },
  { id: "s3", title: "Əmlak qiymətləndirilməsi", slug: "emlak-qiymetlendirilmesi", icon: "Calculator", order: 3, isActive: true },
  { id: "s4", title: "Hüquqi müşayiət", slug: "huquqi-musayiet", icon: "Scale", order: 4, isActive: true },
  { id: "s5", title: "İpoteka məsləhəti", slug: "ipoteka-mesleheti", icon: "Landmark", order: 5, isActive: true },
  { id: "s6", title: "İnvestisiya məsləhəti", slug: "investisiya-mesleheti", icon: "TrendingUp", order: 6, isActive: false },
];

export const mockBlogCategories = [
  { id: "c1", name: "Bazar təhlili", slug: "bazar-tehlili", postCount: 5 },
  { id: "c2", name: "Məsləhətlər", slug: "meslehetler", postCount: 4 },
  { id: "c3", name: "Hüquq", slug: "huquq", postCount: 2 },
  { id: "c4", name: "Layihələr", slug: "layiheler", postCount: 1 },
];
