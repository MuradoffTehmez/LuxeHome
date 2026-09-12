import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

/**
 * Texniki xidmət səhifəsinin loqosunu data URI kimi yaradır.
 *
 * **Niyə inline, `/logo-mark.png` yox.** Texniki xidmət səhifəsi middleware-dən
 * qaytarılır və qəsdən heç bir kənar resurs yükləmir: CSP `default-src 'none'`
 * daşıyır, CSS inline-dır, şrift sistemdəndir. Səbəb praktikidir — bu səhifə
 * məhz sistem çətinlik çəkəndə göstərilir, ona görə asset pipeline-ının işlək
 * olmasına güvənmək düzgün deyil. Loqo `<img src="/logo-mark.png">` olsaydı,
 * ASSETS binding-i cavab vermədikdə səhifə sınıq şəkil ikonu ilə qalardı.
 *
 * Ölçü seçimi: 96×96 palitra PNG ≈ 4.8 KB, base64-dən sonra ≈ 6.4 KB.
 * Səhifədə 48 px göstərilir, yəni 2× retina ehtiyatı var. Palitrasız variant
 * 16.6 KB verir və gözlə seçilən fərq yaratmır; WebP isə bu ölçüdə daha
 * böyükdür (9.2 KB) və köhnə brauzer dəstəyi PNG-dən zəifdir.
 *
 * Nəticə `src/lib/maintenance-logo.ts`-ə yazılır. Fayl generasiya olunur —
 * **əl ilə redaktə edilməməlidir**; loqo dəyişəndə bu skript yenidən işlədilir:
 *
 *   node scripts/build-maintenance-logo.mjs
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const source = join(root, "public", "logo-mark.png");
const target = join(root, "src", "lib", "maintenance-logo.ts");

const SIZE = 96;

const png = await sharp(readFileSync(source))
  .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9, palette: true })
  .toBuffer();

const dataUri = `data:image/png;base64,${png.toString("base64")}`;

const contents = `/**
 * Texniki xidmət səhifəsinin loqosu — ${SIZE}×${SIZE} PNG, data URI.
 *
 * **Bu fayl generasiya olunur — əl ilə redaktə etməyin.**
 * Loqo dəyişdikdə: \`node scripts/build-maintenance-logo.mjs\`
 *
 * Niyə inline saxlanıldığı və ölçünün necə seçildiyi həmin skriptdədir.
 * Mənbə: \`public/logo-mark.png\`.
 */

export const MAINTENANCE_LOGO_DATA_URI =
  "${dataUri}";
`;

writeFileSync(target, contents, "utf8");

console.log(
  `maintenance-logo.ts yazıldı — ${SIZE}px, ${(png.length / 1024).toFixed(1)} KB, ` +
    `data URI ${(dataUri.length / 1024).toFixed(1)} KB`,
);
