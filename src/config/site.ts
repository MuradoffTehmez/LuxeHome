/**
 * Luxe Home Estate — mərkəzi sayt konfiqurasiyası.
 *
 * Şirkətin bütün əlaqə və brend məlumatları burada saxlanılır ki, dəyişiklik
 * tək bir yerdən edilsin. Bu fayldakı dəyərlər şirkət tərəfindən təsdiqlənmiş
 * real məlumatlardır — istisnalar `stats` bölməsində açıq şəkildə qeyd olunub.
 */

export const siteConfig = {
  name: "Luxe Home Estate",
  legalName: "Luxe Home Estate MMC",
  fullName: "Luxe Home Estate MMC — Daşınmaz Əmlak",
  slogan: "HƏYATINIZIN ƏN DƏYƏRLİ ÜNVANI",

  /**
   * Saytın, brendin və markanın hüquqi sahibi.
   * Müəllif hüququ bildirişi və struktur datada bu ad göstərilir.
   */
  owner: {
    name: "Əmiyev Bahadur Qafar oğlu",
    /** Hüquqi şəxs — brend və marka hüquqları da bu şəxsə məxsusdur. */
    isLegalEntity: true,
  },
  description:
    "Luxe Home Estate — Bakıda mənzil, villa, həyət evi, torpaq, ofis və obyektlərin alqı-satqısı və icarəsi. Peşəkar daşınmaz əmlak xidmətləri.",

  phone: "+994 51 922 85 85",
  phoneHref: "tel:+994519228585",
  whatsapp: "994519228585",
  address: "Əliyar Əliyev 109A",
  addressFull: "Əliyar Əliyev 109A, Bakı, Azərbaycan",
  email: "info@luxehomeestate.az",

  instagram: "luxe_home_estate",
  instagramUrl: "https://instagram.com/luxe_home_estate",
  website: "www.luxehomeestate.az",

  /**
   * Ofisin xəritədəki mövqeyi.
   * TODO: Şirkət dəqiq koordinatları təqdim etdikdə yenilənməlidir —
   * hazırkı dəyərlər Əliyar Əliyev küçəsi üzrə təxmini mövqedir.
   */
  geo: {
    latitude: 40.3971,
    longitude: 49.8624,
  },

  /**
   * İş saatları.
   * TODO: Şirkətdən real iş qrafiki alınmalı və dəqiqləşdirilməlidir.
   * `structured` sahəsi `organizationSchema()`-da `openingHoursSpecification`
   * üçün istifadə olunur — mətn təsviri ilə sinxron saxlanılmalıdır.
   */
  workingHours: {
    weekdays: "B.e — Şənbə: 09:00 — 19:00",
    weekend: "Bazar: Bağlıdır",
    structured: {
      days: [
        "https://schema.org/Monday",
        "https://schema.org/Tuesday",
        "https://schema.org/Wednesday",
        "https://schema.org/Thursday",
        "https://schema.org/Friday",
        "https://schema.org/Saturday",
      ],
      opens: "09:00",
      closes: "19:00",
    },
  },
} as const;

export const navigation = [
  { label: "Ana səhifə", href: "/" },
  { label: "Əmlaklar", href: "/emlaklar" },
  { label: "Yaşayış kompleksləri", href: "/layiheler" },
  { label: "Agentliklər", href: "/agentlikler" },
  { label: "Xidmətlər", href: "/xidmetler" },
  { label: "Bloq", href: "/blog" },
  { label: "Əlaqə", href: "/elaqe" },
] as const;

/**
 * Əmlak növləri üzrə sürətli keçidlər.
 *
 * Slug-lar `prisma/taxonomy-data.ts`-dəki dəyərlərlə eynidir — biri dəyişəndə
 * digəri də yenilənməlidir, əks halda link boş nəticə səhifəsinə aparır.
 */
export const propertyTypeLinks = [
  { label: "Mənzillər", href: "/emlaklar?tip=menziller" },
  { label: "Yeni tikili", href: "/emlaklar?tip=yeni-tikili" },
  { label: "Köhnə tikili", href: "/emlaklar?tip=kohne-tikili" },
  { label: "Həyət evi / Villa", href: "/emlaklar?tip=heyet-evleri" },
  { label: "Bağ evləri", href: "/emlaklar?tip=bag-evleri" },
  { label: "Torpaq sahəsi", href: "/emlaklar?tip=torpaq" },
  { label: "Obyekt", href: "/emlaklar?tip=obyektler" },
  { label: "Ofis", href: "/emlaklar?tip=ofisler" },
  { label: "Qaraj", href: "/emlaklar?tip=qarajlar" },
  { label: "Mini otel / Xostel", href: "/emlaklar?tip=mini-otel" },
  { label: "İstirahət mərkəzi", href: "/emlaklar?tip=istirahet-merkezleri" },
  { label: "Konteyner ev", href: "/emlaklar?tip=konteyner-evler" },
  { label: "A-frame ev", href: "/emlaklar?tip=a-frame-evler" },
  { label: "Xarici əmlak", href: "/emlaklar?tip=xarici-emlak" },
] as const;

/** Elan növü üzrə keçidlər — günlük kirayə ayrıca kateqoriya kimi göstərilir. */
export const listingLinks = [
  { label: "Satılır", href: "/emlaklar?elan=SALE" },
  { label: "Aylıq kirayə", href: "/emlaklar?elan=RENT&dovr=MONTH" },
  { label: "Günlük kirayə", href: "/emlaklar?elan=RENT&dovr=DAY" },
  { label: "İpotekaya uyğun", href: "/emlaklar?xususiyyet=ipoteka" },
  { label: "Kreditlə", href: "/emlaklar?xususiyyet=kredit" },
] as const;

/** Footer-dəki köməkçi səhifələr — əsas naviqasiyada olmayanlar. */
export const supportNavigation = [
  { label: "Haqqımızda", href: "/haqqimizda" },
  { label: "Tez-tez verilən suallar", href: "/suallar" },
] as const;

export const legalNavigation = [
  { label: "Məxfilik siyasəti", href: "/mexfilik-siyaseti" },
  { label: "İstifadə şərtləri", href: "/istifade-sertleri" },
  { label: "Cookie siyasəti", href: "/cookie-siyaseti" },
] as const;

/** WhatsApp linkini hazır mesajla birlikdə qurur. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Saytın kök ünvanı.
 *
 * Dəyər dinamik səhifələrdə Worker runtime-dan, statik yaradılan səhifələrdə isə build
 * prosesindən oxunur. Deploy skriptləri hər iki mərhələyə eyni mühitə uyğun `SITE_URL`
 * ötürməlidir; əks halda statik canonical URL-lər lokal ünvana bağlanar.
 */
export function siteUrl(path = ""): string {
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Staging mühiti — prod-un dublikatı olduğu üçün indeksləşməyə bağlıdır. */
export function isStaging(): boolean {
  return process.env.IS_STAGING === "true";
}
