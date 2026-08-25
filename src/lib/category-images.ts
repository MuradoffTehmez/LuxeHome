const CATEGORY_IMAGE_BY_SLUG: Readonly<Record<string, string>> = {
  menziller: "/images/categories/menziller.webp",
  "yeni-tikili": "/images/categories/yeni-tikili.webp",
  "kohne-tikili": "/images/categories/kohne-tikili.webp",
  "heyet-evleri": "/images/categories/heyet-evleri.webp",
  villalar: "/images/categories/villalar.webp",
  "bag-evleri": "/images/categories/bag-evleri.webp",
  torpaq: "/images/categories/torpaq.webp",
  obyektler: "/images/categories/obyektler.webp",
  ofisler: "/images/categories/ofisler.webp",
  qarajlar: "/images/categories/qarajlar.webp",
  "mini-otel": "/images/categories/mini-otel.webp",
  "istirahet-merkezleri": "/images/categories/istirahet-merkezleri.webp",
  "konteyner-evler": "/images/categories/konteyner-evler.webp",
  "a-frame-evler": "/images/categories/a-frame-evler.webp",
  "xarici-emlak": "/images/categories/xarici-emlak.webp",
};

export function getCategoryImageUrl(slug: string, currentImageUrl: string | null) {
  return CATEGORY_IMAGE_BY_SLUG[slug] ?? currentImageUrl;
}
