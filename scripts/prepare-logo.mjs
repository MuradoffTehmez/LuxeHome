/**
 * Loqo hazırlığı.
 *
 * Mənbə: LuxeHome_LOGO.png — tünd fonda qızılı gerb.
 * Bu skript ondan saytda istifadə üçün üç variant çıxarır:
 *
 *   public/logo-full.png   — tam loqo (tünd fonlar üçün, orijinal kompozisiya)
 *   public/logo-mark.png   — yalnız gerb, fon şəffaf (header və favicon üçün)
 *   public/logo-mark.webp  — eyni gerb, WebP
 *   src/app/icon.png       — favicon (Next.js avtomatik götürür)
 *
 * Şəffaflıq parlaqlıq (luminance) əsasında hesablanır: tünd fon tam şəffaf
 * olur, qızılı detallar tam qalır, aralıq zonalar yumşaq keçid verir.
 *
 * İşə salmaq:  node scripts/prepare-logo.mjs
 */

import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "LuxeHome_LOGO.png");
const PUBLIC_DIR = path.join(ROOT, "public");
const APP_DIR = path.join(ROOT, "src", "app");

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`Mənbə tapılmadı: ${SOURCE}`);
    process.exit(1);
  }

  await mkdir(PUBLIC_DIR, { recursive: true });

  const image = sharp(SOURCE);
  const meta = await image.metadata();
  console.log(`Mənbə: ${meta.width}×${meta.height}`);

  // -------------------------------------------------------------------------
  // 1. Tam loqo — orijinal, yalnız ölçüsü azaldılır
  // -------------------------------------------------------------------------
  await sharp(SOURCE)
    .resize({ width: 900, withoutEnlargement: true })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, "logo-full.png"));
  console.log("  ✓ public/logo-full.png");

  // -------------------------------------------------------------------------
  // 2. Gerb — kəsilir və fonu şəffaflaşdırılır
  // -------------------------------------------------------------------------
  // Gerb + çələng mənbə şəklin yuxarı-orta hissəsindədir.
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1536;

  // Gerb mənbə şəklin yuxarı-orta hissəsindədir. Kvadrat kəsim seçilir ki,
  // sonrakı dairəvi maskada boş kənar (letterbox) yaranmasın.
  // Kəsim yalnız gerbi əhatə edir — altdakı "LUXE HOME MMC" yazısı kənarda
  // qalır, çünki wordmark saytda mətn kimi ayrıca göstərilir.
  const cropSize = Math.round(width * 0.615);
  const crop = {
    left: Math.round((width - cropSize) / 2),
    top: Math.round(height * 0.176),
    width: cropSize,
    height: cropSize,
  };

  // Gerb kvadrat sahəyə salınır, sonra dairəvi maska ilə kəsilir.
  //
  // Qeyd: fonu piksel səviyyəsində şəffaflaşdırmaq mümkün deyil — mənbədəki
  // qızılı halo gerbin özü ilə eyni parlaqlıq diapazonundadır. Ona görə gerb
  // öz tünd fonu ilə birlikdə dairəvi nişan (medalyon) kimi saxlanılır;
  // bu həm orijinal kompozisiyanı təhrif etmir, həm də açıq fonda kontrast verir.
  const SIZE = 512;

  const square = await sharp(SOURCE)
    .extract(crop)
    .resize({ width: SIZE, height: SIZE, fit: "cover" })
    .toBuffer();

  const circleMask = Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}">
       <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="#fff"/>
     </svg>`,
  );

  const markBuffer = await sharp(square)
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(markBuffer).toFile(path.join(PUBLIC_DIR, "logo-mark.png"));
  console.log("  ✓ public/logo-mark.png");

  await sharp(markBuffer)
    .webp({ quality: 92 })
    .toFile(path.join(PUBLIC_DIR, "logo-mark.webp"));
  console.log("  ✓ public/logo-mark.webp");

  // -------------------------------------------------------------------------
  // 3. Favicon — gerb tünd kvadrat fonda (kiçik ölçüdə oxunaqlı qalsın)
  // -------------------------------------------------------------------------
  const iconMark = await sharp(markBuffer)
    .resize({ width: 400, height: 400, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 22, g: 25, b: 29, alpha: 1 },
    },
  })
    .composite([{ input: iconMark, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(APP_DIR, "icon.png"));
  console.log("  ✓ src/app/icon.png");

  // Apple touch icon
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 22, g: 25, b: 29, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(markBuffer).resize({ width: 140, height: 140, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
        gravity: "center",
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(APP_DIR, "apple-icon.png"));
  console.log("  ✓ src/app/apple-icon.png");

  // Open Graph üçün paylaşım şəkli
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 22, g: 25, b: 29, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(markBuffer).resize({ width: 340, withoutEnlargement: true }).toBuffer(),
        gravity: "center",
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, "og-default.png"));
  console.log("  ✓ public/og-default.png");

  console.log("\n✅ Loqo variantları hazırdır.");
}

main().catch((error) => {
  console.error("Loqo hazırlığı uğursuz oldu:", error);
  process.exit(1);
});
