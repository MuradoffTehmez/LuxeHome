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

/**
 * ⚠️ DİQQƏT — NÜMUNƏ STATİSTİKA
 *
 * Aşağıdakı rəqəmlər şirkət tərəfindən TƏSDİQLƏNMƏMİŞDİR və yalnız
 * dizayn/demo məqsədi daşıyır.
 *
 * TODO: Rəhbərlikdən real rəqəmləri alın və bu bloku yeniləyin.
 * TODO: Real rəqəmlər əldə olunana qədər `enabled: false` saxlanıla bilər —
 *       bu halda "Niyə Luxe Home Estate?" bölməsi rəqəmsiz variantla göstərilir.
 */
export const demoStats = {
  enabled: true,
  /** true olduqda blokun üstündə "Nümunə məlumat" bildirişi göstərilir. */
  isDemo: true,
  items: [
    { value: "500+", label: "Portfeldəki əmlak" },
    { value: "12", label: "İllik təcrübə" },
    { value: "1 200+", label: "Məmnun müştəri" },
    { value: "7", label: "Xidmət istiqaməti" },
  ],
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

export function siteUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
