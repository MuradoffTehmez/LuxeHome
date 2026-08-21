/**
 * Loqo hazırlığı.
 *
 * Mənbə: `assets/brand/luxehomeestate-logo.jpeg` — tünd fonda qızılı gerb və
 * wordmark (Luxe Home Estate). Bu skript ondan saytda istifadə üçün variantlar çıxarır:
 *
 *   public/logo-mark.png   — yalnız gerb, fon şəffaf (header, favicon, e-poçt)
 *   public/logo-mark.webp  — eyni gerb, WebP
 *   public/logo-full.png   — gerb + wordmark, fon şəffaf
 *   src/app/icon.png       — favicon (Next.js avtomatik götürür)
 *   src/app/favicon.ico    — /favicon.ico ünvanını birbaşa soruşan köhnə klientlər üçün
 *   src/app/apple-icon.png — iOS ana ekran ikonu
 *   public/og-default.png  — sosial şəbəkə paylaşım şəkli
 *
 * Şəffaflıq parlaqlıq (luminance) əsasında hesablanır: mənbədəki fon demək olar
 * tam qaradır (RGB ≈ 13), qızılı detallar isə xeyli parlaqdır, ona görə sadə
 * astana kifayət edir. Aralıq zona yumşaq keçid verir ki, kənarlar dişli olmasın.
 *
 * Favicon və OG şəkli qəsdən tünd fonla qalır: qızılı nazik xətlər ağ fonda
 * kiçik ölçüdə itir.
 *
 * İşə salmaq:  node scripts/prepare-logo.mjs
 */

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "assets", "brand", "luxehomeestate-logo.jpeg");
const PUBLIC_DIR = path.join(ROOT, "public");
const APP_DIR = path.join(ROOT, "src", "app");

/** Brend fonu — `--color-ink` tokeni ilə eyni ailədən tünd ton. */
const DARK = { r: 22, g: 25, b: 29, alpha: 1 };

/**
 * Mənbədəki hissəni kəsib fonu şəffaflaşdırır.
 * `low` altındakı parlaqlıq tam şəffaf, `high` üstü tam qeyri-şəffaf olur.
 */
async function cutout(region, { low = 38, high = 93 } = {}) {
  const { data, info } = await sharp(SOURCE)
    .extract(region)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = info.width * info.height;
  const rgba = Buffer.alloc(pixels * 4);

  for (let i = 0; i < pixels; i += 1) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const alpha = Math.min(1, Math.max(0, (luma - low) / (high - low)));

    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = Math.round(alpha * 255);
  }

  return sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } });
}

/** Şəffaf təsviri kvadrat kətana, ətrafında bərabər boşluqla yerləşdirir. */
async function padToSquare(buffer, size, inset) {
  const scaled = await sharp(buffer)
    .resize({
      width: Math.round(size * inset),
      height: Math.round(size * inset),
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: scaled, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Bir neçə PNG-dən ICO konteyneri qurur.
 *
 * `sharp` .ico yaza bilmir, format isə sadədir: başlıq + hər ölçü üçün 16 baytlıq
 * qeyd + PNG bloklarının özü. PNG daxilli ICO bütün müasir brauzerlərdə oxunur.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // ehtiyat
  header.writeUInt16LE(1, 2); // tip: ikon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = [];

  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palitra işlədilmir
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4); // müstəvi sayı
    entry.writeUInt16LE(32, 6); // piksel başına bit
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`Mənbə tapılmadı: ${SOURCE}`);
    process.exit(1);
  }

  await mkdir(PUBLIC_DIR, { recursive: true });

  const meta = await sharp(SOURCE).metadata();
  console.log(`Mənbə: ${meta.width}×${meta.height}`);

  // Sahələr mənbədəki parlaq piksellərin sərhədindən ölçülüb
  // (gerb: 329-913 × 225-763, wordmark: 148-1117 × 803-1047), hər tərəfə bir az boşluq verilib.
  const EMBLEM = { left: 319, top: 215, width: 604, height: 558 };
  const LOCKUP = { left: 138, top: 215, width: 989, height: 842 };

  // ---------------------------------------------------------------------------
  // 1. Gerb — şəffaf fonlu, kvadrat kətanda
  // ---------------------------------------------------------------------------
  const emblem = await (await cutout(EMBLEM)).png({ compressionLevel: 9 }).toBuffer();
  const mark = await padToSquare(emblem, 512, 0.92);

  await sharp(mark).toFile(path.join(PUBLIC_DIR, "logo-mark.png"));
  console.log("  ✓ public/logo-mark.png");

  await sharp(mark).webp({ quality: 92 }).toFile(path.join(PUBLIC_DIR, "logo-mark.webp"));
  console.log("  ✓ public/logo-mark.webp");

  // ---------------------------------------------------------------------------
  // 2. Tam kilid — gerb + wordmark, şəffaf fonlu
  // ---------------------------------------------------------------------------
  await (await cutout(LOCKUP))
    .resize({ width: 900, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, "logo-full.png"));
  console.log("  ✓ public/logo-full.png");

  // ---------------------------------------------------------------------------
  // 3. Favicon və iOS ikonu — gerb tünd kvadrat fonda
  // ---------------------------------------------------------------------------
  for (const [size, file, dir] of [
    [512, "icon.png", APP_DIR],
    [180, "apple-icon.png", APP_DIR],
  ]) {
    const inner = await sharp(emblem)
      .resize({
        width: Math.round(size * 0.78),
        height: Math.round(size * 0.78),
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    await sharp({ create: { width: size, height: size, channels: 4, background: DARK } })
      .composite([{ input: inner, gravity: "center" }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(dir, file));
    console.log(`  ✓ ${path.relative(ROOT, path.join(dir, file))}`);
  }

  // ---------------------------------------------------------------------------
  // 3b. favicon.ico — 16/32/48 px, eyni tünd kvadrat
  // ---------------------------------------------------------------------------
  const icoImages = [];
  for (const size of [16, 32, 48]) {
    const inner = await sharp(emblem)
      .resize({
        width: Math.round(size * 0.86),
        height: Math.round(size * 0.86),
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    const data = await sharp({ create: { width: size, height: size, channels: 4, background: DARK } })
      .composite([{ input: inner, gravity: "center" }])
      .png({ compressionLevel: 9 })
      .toBuffer();

    icoImages.push({ size, data });
  }

  await writeFile(path.join(APP_DIR, "favicon.ico"), buildIco(icoImages));
  console.log("  ✓ src/app/favicon.ico");

  // ---------------------------------------------------------------------------
  // 4. Open Graph şəkli — tam kilid tünd fonda
  // ---------------------------------------------------------------------------
  const lockup = await (await cutout(LOCKUP))
    .resize({ width: 620, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp({ create: { width: 1200, height: 630, channels: 4, background: DARK } })
    .composite([{ input: lockup, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, "og-default.png"));
  console.log("  ✓ public/og-default.png");

  console.log("\n✅ Loqo variantları hazırdır.");
}

main().catch((error) => {
  console.error("Loqo hazırlığı uğursuz oldu:", error);
  process.exit(1);
});
