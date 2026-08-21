import { list } from "./form";

export type ParsedImage = { url: string; alt: string; isCover: boolean };

/**
 * `ImageDropzone`-un göndərdiyi JSON sətirlərini oxuyur.
 *
 * URL yalnız öz media marşrutumuza işarə edə bilər. Bu yoxlama olmasaydı, formaya
 * əl ilə `javascript:` və ya kənar domen ünvanı yerləşdirmək mümkün olardı — sonra
 * həmin ünvan sayt boyu `<img src>` kimi işlədilərdi.
 */
export function parseImages(formData: FormData, name: string): ParsedImage[] {
  const parsed: ParsedImage[] = [];

  for (const raw of list(formData, name)) {
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      continue;
    }

    if (typeof value !== "object" || value === null) continue;
    const { url, alt, isCover } = value as Record<string, unknown>;

    if (typeof url !== "string" || !/^\/media\/[a-z0-9/_-]+\.(jpg|png|webp|avif)$/i.test(url)) {
      continue;
    }
    if (parsed.some((image) => image.url === url)) continue;

    parsed.push({
      url,
      alt: typeof alt === "string" ? alt.trim().slice(0, 160) : "",
      isCover: isCover === true,
    });
  }

  // Üz qabığı həmişə dəqiq bir dənədir — heç biri seçilməyibsə birincisi götürülür
  if (parsed.length > 0 && !parsed.some((image) => image.isCover)) {
    parsed[0].isCover = true;
  } else {
    let seen = false;
    for (const image of parsed) {
      if (image.isCover && seen) image.isCover = false;
      else if (image.isCover) seen = true;
    }
  }

  return parsed;
}

/** Tək şəkil sahələri (`coverUrl`, `imageUrl`) üçün. */
export function parseSingleImage(formData: FormData, name: string): ParsedImage | null {
  return parseImages(formData, name)[0] ?? null;
}
