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
  addressFull: "Əliyar Əliyev 109A, Nərimanov rayonu, Bakı AZ1033, Azərbaycan",
  email: "info@luxehomeestate.az",

  /** Rəsmi qeydiyyat sənədləri (VÖEN, reyestr) əsasında — hüquqi ünvanla sinxron saxlanılmalıdır. */
  legal: {
    voen: "1507750271",
    registrationDate: "17.08.2026",
  },

  instagram: "luxe_home_estate",
  instagramUrl: "https://instagram.com/luxe_home_estate",
  website: "www.luxehomeestate.az",

} as const;

export const PRODUCTION_SITE_URL = "https://luxehomeestate.az";

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
  { label: "Satılan mənzillər", href: "/bakida-satilan-menziller" },
  { label: "Kirayə mənzillər", href: "/bakida-kiraye-menziller" },
  { label: "Villalar", href: "/villalar" },
  { label: "Həyət evləri", href: "/heyet-evleri" },
  { label: "Torpaq sahələri", href: "/torpaq-saheleri" },
  { label: "Kommersiya obyektləri", href: "/kommersiya-obyektleri" },
  { label: "Ofislər", href: "/ofisler" },
] as const;

/** Elan növü üzrə keçidlər — günlük kirayə ayrıca kateqoriya kimi göstərilir. */
export const listingLinks = [
  { label: "Satılır", href: "/satilan-emlaklar" },
  { label: "Kirayə", href: "/kiraye-emlaklar" },
] as const;

/**
 * Footer-dəki köməkçi səhifələr — əsas naviqasiyada olmayanlar.
 *
 * «Tərəfdaşlarımız» qəsdən burada, header-də deyil: hazırda tərəfdaş sayı azdır
 * və əsas naviqasiyanı yükləmək UX baxımından haqlı deyil. Gələcəkdə «Şirkət»
 * qrupu (Haqqımızda / Komandamız / Tərəfdaşlarımız / Karyera / Əlaqə) bu
 * siyahıdan qurulacaq — struktur artıq ona hazırdır.
 */
export const supportNavigation = [
  { label: "Haqqımızda", href: "/haqqimizda" },
  { label: "Tərəfdaşlarımız", href: "/terefdaslar" },
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
type SiteBaseUrlInput = {
  nodeEnv?: string;
  staging: boolean;
  configuredUrl?: string;
};

export function resolveSiteBaseUrl(input: SiteBaseUrlInput): string {
  let base = "http://localhost:3000";

  if (input.nodeEnv === "production" && !input.staging) {
    // Production canonical host deploy dəyişənindən asılı deyil. Yanlış və ya unudulmuş
    // env dəyəri indeksdə alternativ host yaratmamalıdır.
    base = PRODUCTION_SITE_URL;
  } else if (input.configuredUrl) {
    try {
      const parsed = new URL(input.configuredUrl);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        base = parsed.origin;
      }
    } catch {
      // Lokal development üçün təhlükəsiz fallback aşağıda saxlanılır.
    }
  }

  return base.replace(/\/$/, "");
}

export function siteUrl(path = ""): string {
  const base = resolveSiteBaseUrl({
    nodeEnv: process.env.NODE_ENV,
    staging: isStaging(),
    configuredUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Staging mühiti — prod-un dublikatı olduğu üçün indeksləşməyə bağlıdır. */
export function isStaging(): boolean {
  return process.env.IS_STAGING === "true";
}
