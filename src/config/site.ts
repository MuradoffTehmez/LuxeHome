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
   */
  workingHours: {
    weekdays: "B.e — Şənbə: 09:00 — 19:00",
    weekend: "Bazar: Bağlıdır",
  },
} as const;

export const navigation = [
  { label: "Ana səhifə", href: "/" },
  { label: "Əmlaklar", href: "/emlaklar" },
  { label: "Xidmətlər", href: "/xidmetler" },
  { label: "Layihələr", href: "/layiheler" },
  { label: "Haqqımızda", href: "/haqqimizda" },
  { label: "Blog", href: "/blog" },
  { label: "Əlaqə", href: "/elaqe" },
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
 * `NEXT_PUBLIC_` prefiksli dəyişənlər Next.js tərəfindən build zamanı koda yapışdırılır —
 * staging və prod üçün iki ayrı build tələb edərdi. Dəyər yalnız server tərəfdə lazım
 * olduğuna görə runtime-da oxunur və bir build hər iki mühitə yayımlana bilir.
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
