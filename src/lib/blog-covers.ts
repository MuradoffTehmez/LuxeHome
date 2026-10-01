/**
 * Bloq yazılarının üz qabığı.
 *
 * Redaktor paneldən şəkil yükləyibsə (`/media/...`), həmişə o göstərilir. Yüklənməyibsə
 * kart boş boz sahə əvəzinə mövzuya uyğun brend fotosu göstərir:
 *
 * 1. İlk bloq yazılarının hər biri üçün `public/images/blog/<slug>.webp` hazırlanıb
 *    (`npm run assets:blog-covers` — `scripts/build-blog-covers.mjs`).
 * 2. Sonradan yazılan və şəkli olmayan yazılar üçün kateqoriya fotoları arasından slug-a
 *    görə sabit seçim edilir — eyni yazı hər dəfə eyni şəkli alır.
 *
 * Bu, `category-images.ts` ilə eyni yanaşmadır: şəkil kodda, statik aktiv kimi saxlanılır və
 * verilənlər bazasındakı `coverUrl` sahəsinə toxunulmur, ona görə admin formu şəkli silmir.
 */

/** `public/images/blog/` altında hazır üz qabığı olan yazılar. */
export const BLOG_COVER_SLUGS: readonly string[] = [
  "azerbaycanda-emlak-nece-alinmalidir",
  "menzil-alarken-yoxlanilmali-15-esas-meqam",
  "yeni-tikili-yoxsa-kohne-tikili-hansini-secmeli",
  "emlak-alarken-senedlerin-yoxlanilmasi",
  "ipoteka-ile-ev-alma-prosesi-nece-isleyir",
  "kiraye-menzil-goturerken-neye-diqqet-etmeli",
  "emlakin-bazar-qiymeti-nece-mueyyen-edilir",
  "menzil-satarken-duzgun-qiymet-nece-secilmelidir",
  "emlak-elaninda-hansi-melumatlar-mutleq-gosterilmelidir",
  "baki-ve-regionlarda-emlak-secerken-erazi-nece-qiymetlendirilmelidir",
];

/** Şəkli olmayan yeni yazılar üçün ehtiyat foto (kateqoriya fotoları). */
export const BLOG_FALLBACK_POOL: readonly string[] = [
  "/images/categories/menziller.webp",
  "/images/categories/villalar.webp",
  "/images/categories/heyet-evleri.webp",
  "/images/categories/yeni-tikili.webp",
  "/images/categories/bag-evleri.webp",
  "/images/categories/ofisler.webp",
  "/images/categories/xarici-emlak.webp",
  "/images/categories/kohne-tikili.webp",
  "/images/categories/istirahet-merkezleri.webp",
  "/images/categories/obyektler.webp",
];

/** Sabit, paylanması bərabər sətir heşi (FNV-1a) — seçim hər render-də eyni qalır. */
function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export type BlogCover = {
  url: string;
  /** Redaktorun yazdığı alt mətn; ehtiyat foto dekorativdir, ona görə boşdur. */
  alt: string;
  /** `true` — şəkil paneldən yüklənməyib, kodda saxlanılan ehtiyat fotodur. */
  isFallback: boolean;
};

export function resolveBlogCover(post: {
  slug: string;
  title: string;
  coverUrl?: string | null;
  coverAlt?: string | null;
}): BlogCover {
  if (post.coverUrl) {
    return { url: post.coverUrl, alt: post.coverAlt || post.title, isFallback: false };
  }

  if (BLOG_COVER_SLUGS.includes(post.slug)) {
    return { url: `/images/blog/${post.slug}.webp`, alt: "", isFallback: true };
  }

  const url = BLOG_FALLBACK_POOL[stableHash(post.slug) % BLOG_FALLBACK_POOL.length];
  return { url, alt: "", isFallback: true };
}
