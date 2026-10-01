import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

/**
 * Bloq yazılarının üz qabığı şəkillərini (16:9, 1600×900 WebP) yaradır.
 *
 * Mənbə yeni foto deyil — saytın artıq istifadə etdiyi `public/images/categories/`
 * brend fotolarıdır (eyni işıq və rəng dili). Hər yazı üçün mövzuya uyğun foto seçilir və
 * fərqli kadr kəsilir ki, eyni foto iki kartda eyni görünməsin. «Yeni tikili, yoxsa köhnə
 * tikili?» yazısı üçün iki foto qızılı xətlə yan-yana yığılır.
 *
 * Nəticə `public/images/blog/<slug>.webp`-dir və `src/lib/blog-covers.ts`-dəki siyahı ilə
 * uyğun saxlanılmalıdır. Üz qabığı paneldən yüklənibsə, o həmişə üstünlük təşkil edir.
 *
 *   npm run assets:blog-covers
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const source = (name) => join(root, "public", "images", "categories", `${name}.webp`);
const outDir = join(root, "public", "images", "blog");

const WIDTH = 1600;
const HEIGHT = 900;
const GOLD = { r: 196, g: 165, b: 117, alpha: 1 };

/** Mənbə 1536×1024-dür; `region` verilmirsə tam en, yuxarıdan `top` piksel aşağıdan kəsilir. */
function frame(name, region = { left: 0, top: 40, width: 1536, height: 864 }) {
  return sharp(source(name)).extract(region).resize(WIDTH, HEIGHT, { fit: "cover" });
}

/** İki fotonu şaquli qızılı xətlə birləşdirir. */
async function diptych(leftName, leftRegion, rightName, rightRegion) {
  const half = WIDTH / 2;
  const line = 6;
  const left = await sharp(source(leftName))
    .extract(leftRegion)
    .resize(half, HEIGHT, { fit: "cover" })
    .toBuffer();
  const right = await sharp(source(rightName))
    .extract(rightRegion)
    .resize(half, HEIGHT, { fit: "cover" })
    .toBuffer();
  return sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: GOLD } }).composite([
    { input: left, left: 0, top: 0 },
    { input: right, left: half, top: 0 },
    {
      input: { create: { width: line, height: HEIGHT, channels: 4, background: GOLD } },
      left: half - line / 2,
      top: 0,
    },
  ]);
}

const covers = {
  "azerbaycanda-emlak-nece-alinmalidir": () => frame("menziller"),
  "menzil-alarken-yoxlanilmali-15-esas-meqam": () =>
    frame("yeni-tikili", { left: 460, top: 0, width: 1024, height: 576 }),
  "yeni-tikili-yoxsa-kohne-tikili-hansini-secmeli": () =>
    diptych(
      "kohne-tikili",
      { left: 250, top: 0, width: 576, height: 1024 },
      "yeni-tikili",
      { left: 640, top: 0, width: 576, height: 1024 },
    ),
  "emlak-alarken-senedlerin-yoxlanilmasi": () =>
    frame("ofisler", { left: 120, top: 120, width: 1024, height: 576 }),
  "ipoteka-ile-ev-alma-prosesi-nece-isleyir": () => frame("heyet-evleri"),
  "kiraye-menzil-goturerken-neye-diqqet-etmeli": () =>
    frame("menziller", { left: 512, top: 280, width: 1024, height: 576 }),
  "emlakin-bazar-qiymeti-nece-mueyyen-edilir": () => frame("xarici-emlak"),
  "menzil-satarken-duzgun-qiymet-nece-secilmelidir": () => frame("villalar"),
  "emlak-elaninda-hansi-melumatlar-mutleq-gosterilmelidir": () => frame("bag-evleri"),
  "baki-ve-regionlarda-emlak-secerken-erazi-nece-qiymetlendirilmelidir": () => frame("torpaq"),
};

mkdirSync(outDir, { recursive: true });

for (const [slug, build] of Object.entries(covers)) {
  const image = await build();
  const target = join(outDir, `${slug}.webp`);
  const info = await image.webp({ quality: 80, effort: 5 }).toFile(target);
  console.log(`${slug}.webp  ${Math.round(info.size / 1024)} KB`);
}
