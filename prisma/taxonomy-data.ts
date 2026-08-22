/**
 * Taksonomiya məlumatları — əmlak növləri, xüsusiyyətlər və yerləşmə ağacı.
 *
 * Bu fayl `prisma/seed.ts`-dən ayrıdır, çünki taksonomiya **mövcud bazaya əlavə**
 * olunur: elanlar artıq bu qeydlərə istinad edir, ona görə köhnə sətirlər silinmir,
 * yalnız çatışmayanlar `INSERT OR IGNORE` ilə yazılır (bax `build-taxonomy-sql.ts`).
 *
 * Slug-lar sabitdir və URL-in bir hissəsidir (`/emlaklar?tip=menziller`) — dəyişdirilsə,
 * mövcud linklər və axtarış motorundakı indeks qırılır.
 */

export type PropertyTypeSeed = {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
};

/**
 * Əmlak növləri.
 *
 * «Yeni tikili» və «Köhnə tikili» qəsdən ayrıca növdür: yerli bazarda bunlar
 * mənzilin alt kateqoriyası kimi deyil, müstəqil axtarış kateqoriyası kimi işlənir
 * (bina.az, emlak.az eyni bölgünü verir). `Property.buildingType` sahəsi isə
 * mənzil elanları üçün əlavə süzgəc olaraq qalır.
 */
export const PROPERTY_TYPES: PropertyTypeSeed[] = [
  { slug: "menziller", name: "Mənzillər", order: 10, icon: "Building2" },
  { slug: "yeni-tikili", name: "Yeni tikili", order: 20, icon: "Building" },
  { slug: "kohne-tikili", name: "Köhnə tikili", order: 30, icon: "Building" },
  { slug: "heyet-evleri", name: "Həyət evi / Villa", order: 40, icon: "Home" },
  { slug: "villalar", name: "Villalar", order: 50, icon: "Home" },
  { slug: "bag-evleri", name: "Bağ evləri", order: 60, icon: "TreePine" },
  { slug: "torpaq", name: "Torpaq sahəsi", order: 70, icon: "LandPlot" },
  { slug: "obyektler", name: "Obyekt", order: 80, icon: "Store" },
  { slug: "ofisler", name: "Ofis", order: 90, icon: "Briefcase" },
  { slug: "qarajlar", name: "Qaraj", order: 100, icon: "Car" },
  { slug: "mini-otel", name: "Mini otel / Xostel", order: 110, icon: "Hotel" },
  { slug: "istirahet-merkezleri", name: "İstirahət mərkəzi", order: 120, icon: "Palmtree" },
  { slug: "konteyner-evler", name: "Konteyner ev", order: 130, icon: "Container" },
  { slug: "a-frame-evler", name: "A-frame ev", order: 140, icon: "Triangle" },
  { slug: "xarici-emlak", name: "Xarici əmlak", order: 150, icon: "Globe" },
];

export type FeatureSeed = {
  slug: string;
  name: string;
  group: string;
  order: number;
};

/**
 * Xüsusiyyətlər və ödəniş şərtləri.
 *
 * Ödəniş şərtləri də burada saxlanılır (`PAYMENT` qrupu): ayrıca cədvəl yaratmaq
 * eyni filtr məntiqini ikinci dəfə yazmaq demək olardı.
 */
export const FEATURES: FeatureSeed[] = [
  // Kommunal
  { slug: "qaz", name: "Qaz", group: "UTILITY", order: 10 },
  { slug: "su", name: "Su", group: "UTILITY", order: 20 },
  { slug: "isiq", name: "İşıq", group: "UTILITY", order: 30 },
  { slug: "telefon", name: "Telefon", group: "UTILITY", order: 40 },
  { slug: "internet", name: "İnternet", group: "UTILITY", order: 50 },
  { slug: "kabel-tv", name: "Kabel TV", group: "UTILITY", order: 60 },
  { slug: "kanalizasiya", name: "Kanalizasiya", group: "UTILITY", order: 70 },

  // Bina və daxili
  { slug: "lift", name: "Lift", group: "INDOOR", order: 10 },
  { slug: "pvc-pencere", name: "PVC pəncərə", group: "INDOOR", order: 20 },
  { slug: "balkon", name: "Balkon", group: "INDOOR", order: 30 },
  { slug: "kombi", name: "Kombi", group: "INDOOR", order: 40 },
  { slug: "merkezi-isitme", name: "Mərkəzi qızdırıcı sistem", group: "INDOOR", order: 50 },
  { slug: "kondisioner", name: "Kondisioner", group: "INDOOR", order: 60 },
  { slug: "metbex-mebeli", name: "Mətbəx mebeli", group: "INDOOR", order: 70 },
  { slug: "esyali", name: "Əşyalı", group: "INDOOR", order: 80 },
  { slug: "duzelme", name: "Düzəlmə", group: "INDOOR", order: 90 },
  { slug: "kamin", name: "Kamin", group: "INDOOR", order: 100 },

  // Xarici sahə
  { slug: "hovuz", name: "Hovuz", group: "OUTDOOR", order: 10 },
  { slug: "avtodayanacaq", name: "Avtodayanacaq", group: "OUTDOOR", order: 20 },
  { slug: "qaraj", name: "Qaraj", group: "OUTDOOR", order: 30 },
  { slug: "heyet", name: "Həyət", group: "OUTDOOR", order: 40 },
  { slug: "bag-sahesi", name: "Bağ sahəsi", group: "OUTDOOR", order: 50 },
  { slug: "hamam", name: "Hamam / sauna", group: "OUTDOOR", order: 60 },
  { slug: "mangal", name: "Mangal yeri", group: "OUTDOOR", order: 70 },
  { slug: "deniz-menzeresi", name: "Dəniz mənzərəsi", group: "OUTDOOR", order: 80 },

  // Təhlükəsizlik
  { slug: "muhafize", name: "Mühafizə", group: "SECURITY", order: 10 },
  { slug: "kamera", name: "Video müşahidə", group: "SECURITY", order: 20 },
  { slug: "domofon", name: "Domofon", group: "SECURITY", order: 30 },
  { slug: "siqnalizasiya", name: "Siqnalizasiya", group: "SECURITY", order: 40 },
  { slug: "bagli-erazi", name: "Bağlı ərazi", group: "SECURITY", order: 50 },

  // Ödəniş şərtləri
  { slug: "ipoteka", name: "İpoteka", group: "PAYMENT", order: 10 },
  { slug: "hazir-ipoteka", name: "Hazır ipoteka", group: "PAYMENT", order: 20 },
  { slug: "kredit", name: "Kredit", group: "PAYMENT", order: 30 },
  { slug: "faizsiz-kredit", name: "Faizsiz kredit", group: "PAYMENT", order: 40 },
  { slug: "taksit", name: "Taksit", group: "PAYMENT", order: 50 },
  { slug: "barter", name: "Barter", group: "PAYMENT", order: 60 },
];
