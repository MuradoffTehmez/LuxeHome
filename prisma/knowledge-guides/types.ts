/**
 * Bilik Mərkəzi bələdçiləri və bloq yazıları üçün redaksiya məlumat tipi.
 *
 * Məzmun kodda saxlanılır, `npm run db:guides:build` onu miqrasiyaya çevirir:
 * CI yalnız `migrations/`-ı tətbiq etdiyi üçün məzmun production-a özü-yetərli
 * miqrasiya ilə çatır (taksonomiya ilə eyni yol). Dərcdən sonra redaktor mətni
 * paneldə dəyişə bilər — miqrasiya `INSERT OR IGNORE` işlədir, əl ilə edilmiş
 * düzəlişin üzərinə yazmır.
 */

export type GuideAudience = "BUYER" | "SELLER" | "RENTER" | "LANDLORD" | "INVESTOR";
export type GuideLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type KnowledgeGuide = {
  slug: string;
  title: string;
  /** 20–400 simvol: kartda, axtarış nəticəsində və meta təsvirdə görünür. */
  excerpt: string;
  categorySlug: string;
  audience: GuideAudience;
  level: GuideLevel;
  tags: string[];
  /** Hüquqi aktların adları — «Əsas hüquqi aktlar» siyahısı. */
  legalActs: string[];
  /** Yoxlanmış rəsmi URL-lər (`src/lib/official-sources.ts`). */
  sources: string[];
  featured?: boolean;
  /** Sanitizasiyaya uyğun HTML: h2, h3, p, ul, ol, li, strong, em, a, table. */
  content: string;
};

export type KnowledgeCategorySeed = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  order: number;
};

export type BlogPostSeed = {
  slug: string;
  title: string;
  excerpt: string;
  categorySlug: string;
  tags: string[];
  /** Mənbə və ya əlaqəli bələdçi ünvanları. */
  references: string[];
  metaTitle: string;
  metaDescription: string;
  content: string;
};
